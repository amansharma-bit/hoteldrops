import { supabaseServer } from '../../../../lib/supabase-server';
// ^ Adjust this relative path to wherever supabase-server.ts actually lives in your project.
import ReportsClient from './ReportsClient';

export const revalidate = 0; // always fetch fresh data, never cache this page

export type RebookingRow = {
  city_name: string;
  country_name: string | null;
  hotel_chain: string;
  original_price_usd: number;
  profit_usd: number;
  saving_pct: number;
  same_supplier: boolean;
  grn_booking_date: string;
  rebook_date: string;
};

export type MonthlySummaryRow = {
  month: string;
  total_bookings: number;
  refundable_bookings: number;
  rebooked_count: number;
  profit_usd: number;
  conversion_rate: number;
  failure_rate: number;
  unrealized_profit_usd: number;
};

export type RefundableSummaryRow = {
  level: 'city' | 'country';
  name: string;
  refundable_bookings: number;
};

async function fetchAllRows<T>(table: string, columns: string): Promise<T[]> {
  // Supabase's default query cap is 1000 rows per request — several of our
  // tables exceed that, so we page through in batches until nothing's left.
  let all: T[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabaseServer.from(table).select(columns).range(from, from + batchSize - 1);
    if (error) {
      console.error(`${table} query failed:`, error.message);
      return all;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data as T[]);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function getMonthlySummary(): Promise<MonthlySummaryRow[]> {
  const { data, error } = await supabaseServer.from('grn_monthly_summary').select('*').order('month', { ascending: true });
  if (error) {
    console.error('grn_monthly_summary query failed:', error.message);
    return [];
  }
  return data as MonthlySummaryRow[];
}

export default async function ReportsPage() {
  const [rebookings, monthlySummary, refundableSummary] = await Promise.all([
    fetchAllRows<RebookingRow>(
      'grn_rebookings',
      'city_name, country_name, hotel_chain, original_price_usd, profit_usd, saving_pct, same_supplier, grn_booking_date, rebook_date'
    ),
    getMonthlySummary(),
    fetchAllRows<RefundableSummaryRow>('grn_refundable_summary', 'level, name, refundable_bookings'),
  ]);

  return <ReportsClient rebookings={rebookings} monthlySummary={monthlySummary} refundableSummary={refundableSummary} />;
}
