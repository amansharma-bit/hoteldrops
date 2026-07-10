'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import type { RebookingRow, MonthlySummaryRow, RefundableSummaryRow } from './page';

const GOLD = '#B8860B';
const GOLD_BG = '#FEF9E7';
const GOLD_BORDER = '#FCD34D';
const MONTH_NAMES: Record<string, string> = { '2026-01':'January','2026-02':'February','2026-03':'March','2026-04':'April','2026-05':'May','2026-06':'June' };

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function Dropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer flex items-center gap-2 min-w-[160px] justify-between"
        style={{ background: GOLD_BG, border: `1.5px solid ${GOLD_BORDER}`, color: '#78350F' }}>
        {value}<span style={{ fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto z-50" style={{ maxHeight: '280px', minWidth: '200px' }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={opt === value ? { background: GOLD_BG, fontWeight: 600, color: '#78350F' } : { color: '#334155' }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); } }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(true)} className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer flex items-center gap-2 min-w-[200px] justify-between"
        style={{ background: GOLD_BG, border: `1.5px solid ${GOLD_BORDER}`, color: '#78350F' }}>
        {open ? (
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..." className="bg-transparent outline-none w-full" style={{ color: '#78350F' }} />
        ) : (<span>{value}</span>)}
        <span style={{ fontSize: '10px' }}>🔍</span>
      </div>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto z-50" style={{ maxHeight: '280px', minWidth: '220px' }}>
          {filtered.length === 0 && <div className="px-4 py-2 text-sm text-slate-400">No matches</div>}
          {filtered.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); setQuery(''); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={opt === value ? { background: GOLD_BG, fontWeight: 600, color: '#78350F' } : { color: '#334155' }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

type ViewType = 'monthly' | 'city' | 'country' | 'chain' | 'speed' | 'price' | 'supplier' | 'footprint';
type Cell = string | { text: string; color?: string };

function DataTable({ headers, rows }: { headers: string[]; rows: { key: string; selected: boolean; onClick: () => void; cells: Cell[] }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Full breakdown</p>
      <p className="text-xs text-slate-400 mb-5">Click any row to view it above</p>
      <table className="w-full text-sm">
        <thead><tr className="text-xs font-semibold uppercase text-slate-400">
          {headers.map((h, i) => (<td key={h} className={`pb-2 border-b border-slate-200 ${i > 0 ? 'text-right' : ''}`}>{h}</td>))}
        </tr></thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.key} onClick={row.onClick} className="cursor-pointer" style={row.selected ? { background: GOLD_BG } : {}}>
              {row.cells.map((cell, i) => {
                const isObj = typeof cell === 'object';
                const text = isObj ? cell.text : cell;
                const color = isObj ? cell.color : undefined;
                return (
                  <td key={i} className={`py-2 border-b border-slate-100 ${i === 0 ? 'font-sans' : 'text-right'} ${row.selected ? 'font-semibold' : ''}`} style={color ? { color, fontWeight: row.selected ? 600 : undefined } : {}}>{text}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({ label, value, gold = false, valueColor }: { label: string; value: string; gold?: boolean; valueColor?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: valueColor || (gold ? '#B8860B' : '#0F172A') }}>{value}</p>
    </div>
  );
}

export default function ReportsClient({
  rebookings, monthlySummary, refundableSummary,
}: { rebookings: RebookingRow[]; monthlySummary: MonthlySummaryRow[]; refundableSummary: RefundableSummaryRow[] }) {
  const [view, setView] = useState<ViewType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('$200-500');

  const refundableLookup = useMemo(() => {
    const map = new Map<string, number>();
    refundableSummary.forEach(r => map.set(`${r.level}:${r.name}`, r.refundable_bookings));
    return map;
  }, [refundableSummary]);

  // ---- City aggregation ----
  const cityAgg = useMemo(() => {
    const map = new Map<string, { count: number; profit: number; gmv: number }>();
    rebookings.forEach(r => {
      const cur = map.get(r.city_name) || { count: 0, profit: 0, gmv: 0 };
      cur.count += 1; cur.profit += r.profit_usd; cur.gmv += r.original_price_usd;
      map.set(r.city_name, cur);
    });
    return Array.from(map.entries())
      .map(([city, v]) => {
        const refundable = refundableLookup.get(`city:${city}`) || 0;
        const conversion = refundable > 0 ? (v.count / refundable) * 100 : null;
        return { name: city, count: v.count, profit: v.profit, gmv: v.gmv, refundable, conversion };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [rebookings, refundableLookup]);

  // ---- Country aggregation ----
  const countryAgg = useMemo(() => {
    const map = new Map<string, { count: number; profit: number }>();
    rebookings.forEach(r => {
      if (!r.country_name) return;
      const cur = map.get(r.country_name) || { count: 0, profit: 0 };
      cur.count += 1; cur.profit += r.profit_usd;
      map.set(r.country_name, cur);
    });
    return Array.from(map.entries())
      .map(([country, v]) => ({ name: country, count: v.count, profit: v.profit, avg: v.profit / v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);
  }, [rebookings]);

  // ---- Chain aggregation ----
  const chainAgg = useMemo(() => {
    const map = new Map<string, { count: number; savings: number[]; sameSupplierCount: number; prices: number[] }>();
    rebookings.forEach(r => {
      const cur = map.get(r.hotel_chain) || { count: 0, savings: [], sameSupplierCount: 0, prices: [] };
      cur.count += 1; cur.savings.push(r.saving_pct); cur.prices.push(r.original_price_usd);
      if (r.same_supplier) cur.sameSupplierCount += 1;
      map.set(r.hotel_chain, cur);
    });
    const median = (arr: number[]) => { const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; };
    return Array.from(map.entries())
      .filter(([chain, v]) => chain !== 'Independent/Other' && v.count >= 20)
      .map(([chain, v]) => ({ name: chain, count: v.count, medianSaving: median(v.savings), sameSupplierRate: (v.sameSupplierCount/v.count)*100, medianPrice: median(v.prices) }))
      .sort((a, b) => b.medianSaving - a.medianSaving);
  }, [rebookings]);

  // ---- Speed aggregation ----
  const speedAgg = useMemo(() => {
    const buckets = [
      { label: 'Caught same day', min: -1, max: 0 },
      { label: 'Caught in 1-3 days', min: 1, max: 3 },
      { label: 'Caught in 4-7 days', min: 4, max: 7 },
      { label: 'Caught in 8-14 days', min: 8, max: 14 },
      { label: 'Caught in 15-30 days', min: 15, max: 30 },
      { label: 'Caught in 31-60 days', min: 31, max: 60 },
      { label: 'Caught after 60+ days', min: 61, max: Infinity },
    ];
    const result = buckets.map(b => ({ label: b.label, count: 0, totalProfit: 0 }));
    rebookings.forEach(r => {
      const days = Math.round((new Date(r.rebook_date).getTime() - new Date(r.grn_booking_date).getTime()) / 86400000);
      const idx = buckets.findIndex(b => days >= b.min && days <= b.max);
      if (idx >= 0) { result[idx].count += 1; result[idx].totalProfit += r.profit_usd; }
    });
    return result.map(r => ({ label: r.label, count: r.count, avgProfit: r.count > 0 ? r.totalProfit / r.count : 0 }));
  }, [rebookings]);
  const maxProfit = Math.max(...speedAgg.map(s => s.avgProfit), 1);

  // ---- Price bracket aggregation ----
  const priceAgg = useMemo(() => {
    const brackets = [
      { label: 'Under $200', test: (p: number) => p < 200 },
      { label: '$200-500', test: (p: number) => p >= 200 && p < 500 },
      { label: '$500-1000', test: (p: number) => p >= 500 && p < 1000 },
      { label: 'Over $1000', test: (p: number) => p >= 1000 },
    ];
    const counts = brackets.map(() => 0);
    rebookings.forEach(r => { const idx = brackets.findIndex(b => b.test(r.original_price_usd)); if (idx >= 0) counts[idx] += 1; });
    const total = rebookings.length || 1;
    return brackets.map((b, i) => ({ label: b.label, count: counts[i], pct: (counts[i] / total) * 100 }));
  }, [rebookings]);

  // ---- Supplier match ----
  const supplierAgg = useMemo(() => {
    const same = rebookings.filter(r => r.same_supplier).length;
    const diff = rebookings.length - same;
    return { same, diff, total: rebookings.length || 1 };
  }, [rebookings]);

  useEffect(() => { if (!selectedCity && cityAgg.length) setSelectedCity(cityAgg[0].name); }, [cityAgg, selectedCity]);
  useEffect(() => { if (!selectedCountry && countryAgg.length) setSelectedCountry(countryAgg[0].name); }, [countryAgg, selectedCountry]);
  useEffect(() => { if (!selectedChain && chainAgg.length) setSelectedChain(chainAgg[0].name); }, [chainAgg, selectedChain]);

  const m = monthlySummary.find(x => x.month === selectedMonth);
  const c = cityAgg.find(x => x.name === selectedCity);
  const co = countryAgg.find(x => x.name === selectedCountry);
  const ch = chainAgg.find(x => x.name === selectedChain);
  const pr = priceAgg.find(x => x.label === selectedPrice);

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' }, { id: 'city', label: 'By City' }, { id: 'country', label: 'By Country' },
    { id: 'chain', label: 'By Chain' }, { id: 'speed', label: 'By Speed' }, { id: 'price', label: 'By Price' },
    { id: 'supplier', label: 'Supplier Match' }, { id: 'footprint', label: 'Cancellation Footprint' },
  ];

  return (
    <BusinessSidebarWrapper>
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Live from Supabase — market analysis and historical performance data.</p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={view === t.id ? { background: '#1447b8', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #E2E8F0' }}>{t.label}</button>
          ))}
        </div>

        {view === 'monthly' && m && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={monthlySummary.map(x => x.month)} value={selectedMonth} onChange={setSelectedMonth} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={m.refundable_bookings.toLocaleString()} />
              <KpiCard label="Rebooked (Mize)" value={m.rebooked_count.toLocaleString()} />
              <KpiCard label="Profit Generated" value={fmtMoney(m.profit_usd)} gold />
              <KpiCard label="Conversion Rate" value={`${m.conversion_rate.toFixed(2)}%`} />
              <KpiCard label="Failure Rate" value={`${m.failure_rate.toFixed(2)}%`} valueColor={m.failure_rate < 5 ? '#16A34A' : '#DC2626'} />
            </div>
            <DataTable headers={['Month', 'Refundable', 'Rebooked', 'Profit', 'Conversion', 'Failure']}
              rows={monthlySummary.map((row) => ({
                key: row.month, selected: row.month === selectedMonth, onClick: () => setSelectedMonth(row.month),
                cells: [MONTH_NAMES[row.month] || row.month, row.refundable_bookings.toLocaleString(), row.rebooked_count.toLocaleString(), fmtMoney(row.profit_usd), `${row.conversion_rate.toFixed(2)}%`, { text: `${row.failure_rate.toFixed(2)}%`, color: row.failure_rate < 5 ? '#16A34A' : '#DC2626' }]
              }))} />
          </>
        )}

        {view === 'city' && c && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search for a city</p>
              <SearchDropdown options={cityAgg.map(x => x.name)} value={selectedCity} onChange={setSelectedCity} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Rebookings" value={c.count.toLocaleString()} />
              <KpiCard label="GMV" value={fmtMoney(c.gmv)} gold />
              <KpiCard label="Profit Captured" value={fmtMoney(c.profit)} />
              <KpiCard label="Conversion Rate" value={c.conversion !== null ? `${c.conversion.toFixed(2)}%` : 'N/A'} valueColor={c.conversion !== null && c.conversion < 3 ? '#DC2626' : undefined} />
            </div>
            <DataTable headers={['City', 'Rebookings', 'GMV', 'Profit', 'Conversion']}
              rows={cityAgg.map((row) => ({
                key: row.name, selected: row.name === selectedCity, onClick: () => setSelectedCity(row.name),
                cells: [row.name, row.count.toLocaleString(), fmtMoney(row.gmv), fmtMoney(row.profit), row.conversion !== null ? { text: `${row.conversion.toFixed(2)}%`, color: row.conversion < 3 ? '#DC2626' : undefined } : 'N/A']
              }))} />
          </>
        )}

        {view === 'country' && co && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search for a country</p>
              <SearchDropdown options={countryAgg.map(x => x.name)} value={selectedCountry} onChange={setSelectedCountry} />
            </div>
            <div className="grid grid-cols-3 gap-5 mb-8">
              <KpiCard label="Rebookings" value={co.count.toLocaleString()} />
              <KpiCard label="Total Profit" value={fmtMoney(co.profit)} gold />
              <KpiCard label="Avg. Profit / Rebooking" value={`$${co.avg.toFixed(2)}`} />
            </div>
            <DataTable headers={['Country', 'Rebookings', 'Profit', 'Avg/Rebooking']}
              rows={countryAgg.map((row) => ({ key: row.name, selected: row.name === selectedCountry, onClick: () => setSelectedCountry(row.name), cells: [row.name, row.count.toLocaleString(), fmtMoney(row.profit), `$${row.avg.toFixed(2)}`] }))} />
          </>
        )}

        {view === 'chain' && ch && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={chainAgg.map(x => x.name)} value={selectedChain} onChange={setSelectedChain} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Rebookings" value={ch.count.toLocaleString()} />
              <KpiCard label="Median Saving" value={`${ch.medianSaving.toFixed(2)}%`} gold />
              <KpiCard label="Same-Supplier Rate" value={`${ch.sameSupplierRate.toFixed(2)}%`} />
              <KpiCard label="Median Price" value={`$${ch.medianPrice.toFixed(0)}`} />
            </div>
            <DataTable headers={['Chain', 'Rebookings', 'Median Saving', 'Same-Supplier', 'Median Price']}
              rows={chainAgg.map((row) => ({ key: row.name, selected: row.name === selectedChain, onClick: () => setSelectedChain(row.name), cells: [row.name, row.count.toLocaleString(), `${row.medianSaving.toFixed(2)}%`, `${row.sameSupplierRate.toFixed(2)}%`, `$${row.medianPrice.toFixed(0)}`] }))} />
          </>
        )}

        {view === 'speed' && (
          <>
            <p className="text-sm text-slate-500 mb-1">The longer we wait to catch a deal, the bigger it tends to be.</p>
            <p className="text-xs text-slate-400 mb-5">Computed live from {rebookings.length.toLocaleString()} rebookings.</p>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="space-y-3">
                {speedAgg.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label} <span className="text-slate-400">({s.count.toLocaleString()} rebookings)</span></span>
                      <span className="font-mono font-bold" style={{ color: s.avgProfit === maxProfit ? GOLD : '#0F172A' }}>${s.avgProfit.toFixed(2)} avg</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.avgProfit / maxProfit) * 100}%`, background: s.avgProfit === maxProfit ? GOLD_BORDER : '#94A3B8' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'price' && pr && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={priceAgg.map(x => x.label)} value={selectedPrice} onChange={setSelectedPrice} />
            </div>
            <div className="grid grid-cols-2 gap-5 mb-8">
              <KpiCard label="Rebookings in this range" value={pr.count.toLocaleString()} />
              <KpiCard label="Share of Total" value={`${pr.pct.toFixed(1)}%`} gold />
            </div>
            <DataTable headers={['Price Bracket', 'Rebookings', 'Share of Total']}
              rows={priceAgg.map((row) => ({ key: row.label, selected: row.label === selectedPrice, onClick: () => setSelectedPrice(row.label), cells: [row.label, row.count.toLocaleString(), `${row.pct.toFixed(1)}%`] }))} />
          </>
        )}

        {view === 'supplier' && (
          <>
            <p className="text-sm text-slate-500 mb-5">How often we actually check a different supplier before rebooking — versus just staying with the original one.</p>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="rounded-2xl p-6" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3 text-slate-500">Same Supplier</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>{supplierAgg.same.toLocaleString()}</p>
                <p className="text-sm text-slate-500">{((supplierAgg.same / supplierAgg.total) * 100).toFixed(1)}% of all rebookings — the new price came from the same supplier as the original booking.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: GOLD }}>Different Supplier</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>{supplierAgg.diff.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Just {((supplierAgg.diff / supplierAgg.total) * 100).toFixed(1)}% — a genuinely different supplier was found and used instead.</p>
              </div>
            </div>
          </>
        )}

        {view === 'footprint' && (
          <>
            <p className="text-sm text-slate-500 mb-5">Mize's own cancellation activity, computed live from the same data.</p>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="rounded-2xl p-6" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#1447b8' }}>Mize's Footprint</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>{fmtMoney(rebookings.reduce((s, r) => s + r.original_price_usd, 0))}</p>
                <p className="text-xs text-slate-500 mb-4">Total cancelled GMV</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Bookings</span><span className="font-mono font-semibold">{rebookings.length.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: GOLD }}>Note</p>
                <p className="text-sm text-slate-600">The untapped-market comparison ($65.97M) requires the full GRN cancellation dump, which isn't loaded into this live table yet — that figure remains from the original static analysis for now.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </BusinessSidebarWrapper>
  );
}
