import { supabaseServer } from '../../../lib/supabase-server';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
// ^ Adjust this relative path if your lib/ folder lives somewhere else —
// it should point to wherever you place supabase-server.ts.

export const revalidate = 0; // always fetch fresh data, never cache this page

async function getKpiSummary() {
  const { data, error } = await supabaseServer.from('kpi_summary').select('*').single();
  if (error) {
    console.error('kpi_summary query failed:', error.message);
    return null;
  }
  return data;
}

async function getWeeklyVolume() {
  // Buckets rebooking_attempts by week for the volume chart.
  // Uses a raw query since Supabase's JS client doesn't do GROUP BY directly.
  const { data, error } = await supabaseServer.rpc('weekly_rebooking_volume');
  if (error) {
    console.error('weekly_rebooking_volume query failed:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function OverviewPage() {
  const kpi = await getKpiSummary();
  const weekly = await getWeeklyVolume();
  const hasData = kpi && kpi.total_tracked > 0;

  return (
    <BusinessSidebarWrapper>
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            How your booking book is performing, end to end.
          </p>
        </div>
        <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 90 days</option>
          <option>Custom range</option>
        </select>
      </div>

      <div className="px-8 py-8">

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest text-[#1447b8] uppercase mb-4">
                The full picture
              </p>
              <div className="grid grid-cols-4 gap-4">
                <KpiCard big={kpi.total_tracked.toLocaleString()} label="Total bookings tracked" />
                <KpiCard big={kpi.total_eligible.toLocaleString()} label="Refundable — eligible for rebooking" />
                <KpiCard
                  big={kpi.total_eligible > 0 ? `${((kpi.successful_conversions / kpi.total_eligible) * 100).toFixed(1)}%` : '—'}
                  label="Conversion rate (rebookings ÷ eligible)"
                  gold
                />
                <KpiCard
                  big={(kpi.net_realized_count + kpi.error_count) > 0 ? `${((kpi.net_realized_count / (kpi.net_realized_count + kpi.error_count)) * 100).toFixed(1)}%` : '—'}
                  label="System reliability"
                />
                <KpiCard big={`$${Number(kpi.gross_profit).toLocaleString()}`} label="Gross margin generated" gold />
                <KpiCard big={`$${Number(kpi.net_realized_profit).toLocaleString()}`} label="Net realized margin" />
                <KpiCard big={kpi.successful_conversions.toLocaleString()} label="Successful conversions" />
                <KpiCard big={kpi.error_count.toLocaleString()} label="System errors" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="font-bold text-[#0F172A] mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                Weekly rebooking volume
              </p>
              {weekly.length === 0 ? (
                <p className="text-sm text-slate-400">Not enough data yet to chart a weekly trend.</p>
              ) : (
                <div className="h-52 flex items-end gap-4 px-2" style={{ borderBottom: '1px solid #E2E8F0' }}>
                  {weekly.map((w: { week: string; count: number }, i: number) => {
                    const max = Math.max(...weekly.map((x: { count: number }) => x.count));
                    const h = max > 0 ? (w.count / max) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">{w.count}</span>
                        <div className="w-full rounded-t bg-[#1447b8]/20" style={{ height: `${h}%` }} />
                        <p className="text-xs text-slate-400">{w.week}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </BusinessSidebarWrapper>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: '#EFF4FC' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1447b8" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9 9 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      </div>
      <h2 className="font-bold text-lg text-[#0F172A] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
        No bookings tracked yet
      </h2>
      <p className="text-sm text-slate-500 max-w-sm">
        Once the rebooking pipeline is connected and running, real figures will appear here automatically —
        nothing further to build on this page.
      </p>
    </div>
  );
}

function KpiCard({ big, label, gold = false }: { big: string; label: string; gold?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: gold ? '#B8860B' : '#0F172A' }}>
        {big}
      </p>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{label}</p>
    </div>
  );
}
