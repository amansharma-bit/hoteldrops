'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import BusinessSidebarWrapper from '../../BusinessSidebarWrapper';
import type { RebookingRow, MonthlySummaryRow, RefundableSummaryRow } from './page';

// ─── DESIGN TOKENS (matching the full console) ────────────────────────────────
const BLUE  = '#0093FF';
const NAVY  = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE  = '#E7ECF3';
const BG    = '#F6F8FB';
const GREEN = '#16A34A';
const RED   = '#DC2626';
const AMBER = '#D97706';
const GOLD  = '#F5B833';

const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY    = "'Plus Jakarta Sans',sans-serif";

const MONTH_NAMES: Record<string, string> = {
  '2026-01':'January','2026-02':'February','2026-03':'March',
  '2026-04':'April','2026-05':'May','2026-06':'June',
  '2026-07':'July','2026-08':'August','2026-09':'September',
  '2026-10':'October','2026-11':'November','2026-12':'December',
};

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── SHARED DROPDOWN (console style) ─────────────────────────────────────────
function Chevron() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>;
}

function ConsoleDropdown({ options, value, onChange, minWidth = 160 }: { options: string[]; value: string; onChange: (v: string) => void; minWidth?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setOpen(!open)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth, border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer', fontFamily: 'inherit' }}>
        <span>{MONTH_NAMES[value] || value}</span><Chevron/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
          <div style={{ position: 'absolute', top: '112%', right: 0, zIndex: 31, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth, maxHeight: 280, overflowY: 'auto' }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: opt === value ? '#EAF6FF' : 'transparent', color: opt === value ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                {MONTH_NAMES[opt] || opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SearchDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); } }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 200, border: `1px solid ${open ? BLUE : LINE}`, borderRadius: 11, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'text', fontFamily: 'inherit' }}>
        {open
          ? <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, fontWeight: 600, color: NAVY, fontFamily: 'inherit', width: '100%' }}/>
          : <span>{value}</span>}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      </div>
      {open && (
        <>
          <div onClick={() => { setOpen(false); setQuery(''); }} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
          <div style={{ position: 'absolute', top: '112%', right: 0, zIndex: 31, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth: 220, maxHeight: 280, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>No matches</div>
              : filtered.map(opt => (
                <button key={opt} onClick={() => { onChange(opt); setOpen(false); setQuery(''); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: opt === value ? '#EAF6FF' : 'transparent', color: opt === value ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {opt}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── STAT CARD — Dashboard style ─────────────────────────────────────────────
function StatCard({ label, value, sub, fill, pct, valueColor }: { label: string; value: string; sub?: string; fill?: string; pct?: number; valueColor?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: valueColor || NAVY, margin: '8px 0 4px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 500 }}>{sub}</div>}
      {pct !== undefined && fill && (
        <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: fill, borderRadius: 99, transition: 'width 1s cubic-bezier(.2,.7,.3,1)' }}/>
        </div>
      )}
    </div>
  );
}

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
type Cell = string | { text: string; color?: string };

function DataTable({ headers, rows }: { headers: string[]; rows: { key: string; selected: boolean; onClick: () => void; cells: Cell[] }[] }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ padding: '18px 22px 10px' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY }}>Full breakdown</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>Click any row to view it above</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${LINE}`, background: '#FAFBFD' }}>
            {headers.map((h, i) => (
              <td key={h} style={{ padding: '10px 22px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: MUTED, textAlign: i > 0 ? 'right' : 'left' }}>{h}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} onClick={row.onClick} style={{ borderBottom: `1px solid ${LINE}`, background: row.selected ? '#FFFBEB' : '#fff', cursor: 'pointer', transition: 'background 0.12s' }}>
              {row.cells.map((cell, i) => {
                const isObj = typeof cell === 'object';
                const text = isObj ? cell.text : cell;
                const color = isObj ? cell.color : undefined;
                return (
                  <td key={i} style={{ padding: '13px 22px', fontSize: 13.5, fontWeight: row.selected ? 700 : (i === 0 ? 600 : 400), color: color || NAVY, textAlign: i > 0 ? 'right' : 'left', fontFamily: i > 0 ? DISPLAY : BODY }}>
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewType = 'monthly' | 'city' | 'country' | 'chain' | 'speed' | 'price' | 'supplier' | 'footprint';

// ─── MAIN CLIENT ─────────────────────────────────────────────────────────────
export default function ReportsClient({
  rebookings, monthlySummary, refundableSummary,
}: { rebookings: RebookingRow[]; monthlySummary: MonthlySummaryRow[]; refundableSummary: RefundableSummaryRow[] }) {
  const [view, setView]                   = useState<ViewType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedCity, setSelectedCity]   = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('$200-500');

  const refundableLookup = useMemo(() => {
    const map = new Map<string, number>();
    refundableSummary.forEach(r => map.set(`${r.level}:${r.name}`, r.refundable_bookings));
    return map;
  }, [refundableSummary]);

  // City aggregation
  const cityAgg = useMemo(() => {
    const map = new Map<string, { count: number; profit: number; gmv: number }>();
    rebookings.forEach(r => {
      const cur = map.get(r.city_name) || { count: 0, profit: 0, gmv: 0 };
      cur.count += 1; cur.profit += r.profit_usd; cur.gmv += r.original_price_usd;
      map.set(r.city_name, cur);
    });
    return Array.from(map.entries()).map(([city, v]) => {
      const refundable = refundableLookup.get(`city:${city}`) || 0;
      const conversion = refundable > 0 ? (v.count / refundable) * 100 : null;
      return { name: city, count: v.count, profit: v.profit, gmv: v.gmv, refundable, conversion };
    }).sort((a, b) => b.count - a.count).slice(0, 30);
  }, [rebookings, refundableLookup]);

  // Country aggregation
  const countryAgg = useMemo(() => {
    const map = new Map<string, { count: number; profit: number }>();
    rebookings.forEach(r => {
      if (!r.country_name) return;
      const cur = map.get(r.country_name) || { count: 0, profit: 0 };
      cur.count += 1; cur.profit += r.profit_usd;
      map.set(r.country_name, cur);
    });
    return Array.from(map.entries()).map(([country, v]) => ({ name: country, count: v.count, profit: v.profit, avg: v.profit / v.count })).sort((a, b) => b.count - a.count).slice(0, 25);
  }, [rebookings]);

  // Chain aggregation
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

  // Speed aggregation
  const speedAgg = useMemo(() => {
    const buckets = [
      { label: 'Caught same day', min: -1, max: 0 },
      { label: 'Caught in 1–3 days', min: 1, max: 3 },
      { label: 'Caught in 4–7 days', min: 4, max: 7 },
      { label: 'Caught in 8–14 days', min: 8, max: 14 },
      { label: 'Caught in 15–30 days', min: 15, max: 30 },
      { label: 'Caught in 31–60 days', min: 31, max: 60 },
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

  // Price bracket aggregation
  const priceAgg = useMemo(() => {
    const brackets = [
      { label: 'Under $200', test: (p: number) => p < 200 },
      { label: '$200–500', test: (p: number) => p >= 200 && p < 500 },
      { label: '$500–1,000', test: (p: number) => p >= 500 && p < 1000 },
      { label: 'Over $1,000', test: (p: number) => p >= 1000 },
    ];
    const counts = brackets.map(() => 0);
    rebookings.forEach(r => { const idx = brackets.findIndex(b => b.test(r.original_price_usd)); if (idx >= 0) counts[idx] += 1; });
    const total = rebookings.length || 1;
    return brackets.map((b, i) => ({ label: b.label, count: counts[i], pct: (counts[i] / total) * 100 }));
  }, [rebookings]);

  // Supplier match
  const supplierAgg = useMemo(() => {
    const same = rebookings.filter(r => r.same_supplier).length;
    const diff = rebookings.length - same;
    return { same, diff, total: rebookings.length || 1 };
  }, [rebookings]);

  useEffect(() => { if (!selectedCity && cityAgg.length) setSelectedCity(cityAgg[0].name); }, [cityAgg, selectedCity]);
  useEffect(() => { if (!selectedCountry && countryAgg.length) setSelectedCountry(countryAgg[0].name); }, [countryAgg, selectedCountry]);
  useEffect(() => { if (!selectedChain && chainAgg.length) setSelectedChain(chainAgg[0].name); }, [chainAgg, selectedChain]);

  const m  = monthlySummary.find(x => x.month === selectedMonth);
  const c  = cityAgg.find(x => x.name === selectedCity);
  const co = countryAgg.find(x => x.name === selectedCountry);
  const ch = chainAgg.find(x => x.name === selectedChain);
  const pr = priceAgg.find(x => x.label === selectedPrice);

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' }, { id: 'city', label: 'By City' },
    { id: 'country', label: 'By Country' }, { id: 'chain', label: 'By Chain' },
    { id: 'speed', label: 'By Speed' }, { id: 'price', label: 'By Price' },
    { id: 'supplier', label: 'Supplier Match' }, { id: 'footprint', label: 'Cancellation Footprint' },
  ];

  // Filter row label — shown above the dropdown
  const filterLabels: Record<ViewType, string> = {
    monthly: 'Showing data for', city: 'Search for a city', country: 'Search for a country',
    chain: 'Showing data for', price: 'Showing data for', speed: '', supplier: '', footprint: '',
  };

  return (
    <BusinessSidebarWrapper>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY }}>

        {/* Header */}
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: '-0.7px', color: NAVY, margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 14.5, color: SLATE, marginTop: 4, marginBottom: 0 }}>Live from Supabase — market analysis and historical performance data.</p>
        </div>

        {/* Tab pills */}
        <div style={{ padding: '20px 40px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: view === t.id ? 'none' : `1px solid ${LINE}`, background: view === t.id ? BLUE : '#fff', color: view === t.id ? '#fff' : SLATE, transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 40px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Filter row */}
          {filterLabels[view] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>{filterLabels[view]}</span>
              {view === 'monthly' && <ConsoleDropdown options={monthlySummary.map(x => x.month)} value={selectedMonth} onChange={setSelectedMonth} minWidth={160} />}
              {view === 'city'    && <SearchDropdown options={cityAgg.map(x => x.name)} value={selectedCity} onChange={setSelectedCity} />}
              {view === 'country' && <SearchDropdown options={countryAgg.map(x => x.name)} value={selectedCountry} onChange={setSelectedCountry} />}
              {view === 'chain'   && <ConsoleDropdown options={chainAgg.map(x => x.name)} value={selectedChain} onChange={setSelectedChain} minWidth={220} />}
              {view === 'price'   && <ConsoleDropdown options={priceAgg.map(x => x.label)} value={selectedPrice} onChange={setSelectedPrice} minWidth={160} />}
            </div>
          )}

          {/* ── MONTHLY ── */}
          {view === 'monthly' && m && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
              <StatCard label="Refundable bookings" value={m.refundable_bookings.toLocaleString()} fill={BLUE} pct={100} />
              <StatCard label="Rebooked (Mize)" value={m.rebooked_count.toLocaleString()} fill={GREEN} pct={m.refundable_bookings ? Math.round((m.rebooked_count/m.refundable_bookings)*100) : 0} />
              <StatCard label="Profit generated" value={fmtMoney(m.profit_usd)} fill={GOLD} pct={100} valueColor={AMBER} />
              <StatCard label="Conversion rate" value={`${m.conversion_rate.toFixed(2)}%`} fill={BLUE} pct={m.conversion_rate} />
              <StatCard label="Failure rate" value={`${m.failure_rate.toFixed(2)}%`} fill={m.failure_rate < 5 ? GREEN : RED} pct={m.failure_rate} valueColor={m.failure_rate < 5 ? GREEN : RED} />
            </div>
            <DataTable headers={['Month','Refundable','Rebooked','Profit','Conversion','Failure']}
              rows={monthlySummary.map(row => ({
                key: row.month, selected: row.month === selectedMonth, onClick: () => setSelectedMonth(row.month),
                cells: [
                  MONTH_NAMES[row.month] || row.month,
                  row.refundable_bookings.toLocaleString(),
                  row.rebooked_count.toLocaleString(),
                  fmtMoney(row.profit_usd),
                  `${row.conversion_rate.toFixed(2)}%`,
                  { text: `${row.failure_rate.toFixed(2)}%`, color: row.failure_rate < 5 ? GREEN : RED },
                ],
              }))} />
          </>)}

          {/* ── CITY ── */}
          {view === 'city' && c && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              <StatCard label="Rebookings" value={c.count.toLocaleString()} fill={BLUE} pct={100} />
              <StatCard label="GMV" value={fmtMoney(c.gmv)} fill={GOLD} pct={100} valueColor={AMBER} />
              <StatCard label="Profit captured" value={fmtMoney(c.profit)} fill={GREEN} pct={100} />
              <StatCard label="Conversion rate" value={c.conversion !== null ? `${c.conversion.toFixed(2)}%` : 'N/A'} fill={BLUE} pct={c.conversion ?? 0} valueColor={c.conversion !== null && c.conversion < 3 ? RED : undefined} />
            </div>
            <DataTable headers={['City','Rebookings','GMV','Profit','Conversion']}
              rows={cityAgg.map(row => ({
                key: row.name, selected: row.name === selectedCity, onClick: () => setSelectedCity(row.name),
                cells: [row.name, row.count.toLocaleString(), fmtMoney(row.gmv), fmtMoney(row.profit), row.conversion !== null ? { text: `${row.conversion.toFixed(2)}%`, color: row.conversion < 3 ? RED : undefined } : 'N/A'],
              }))} />
          </>)}

          {/* ── COUNTRY ── */}
          {view === 'country' && co && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <StatCard label="Rebookings" value={co.count.toLocaleString()} fill={BLUE} pct={100} />
              <StatCard label="Total profit" value={fmtMoney(co.profit)} fill={GOLD} pct={100} valueColor={AMBER} />
              <StatCard label="Avg. profit / rebooking" value={`$${co.avg.toFixed(0)}`} fill={GREEN} pct={100} />
            </div>
            <DataTable headers={['Country','Rebookings','Profit','Avg / Rebooking']}
              rows={countryAgg.map(row => ({
                key: row.name, selected: row.name === selectedCountry, onClick: () => setSelectedCountry(row.name),
                cells: [row.name, row.count.toLocaleString(), fmtMoney(row.profit), `$${row.avg.toFixed(0)}`],
              }))} />
          </>)}

          {/* ── CHAIN ── */}
          {view === 'chain' && ch && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              <StatCard label="Rebookings" value={ch.count.toLocaleString()} fill={BLUE} pct={100} />
              <StatCard label="Median saving" value={`${ch.medianSaving.toFixed(2)}%`} fill={GOLD} pct={ch.medianSaving} valueColor={AMBER} />
              <StatCard label="Same-supplier rate" value={`${ch.sameSupplierRate.toFixed(2)}%`} fill={SLATE} pct={ch.sameSupplierRate} />
              <StatCard label="Median price" value={`$${ch.medianPrice.toFixed(0)}`} fill={BLUE} pct={100} />
            </div>
            <DataTable headers={['Chain','Rebookings','Median Saving','Same-Supplier','Median Price']}
              rows={chainAgg.map(row => ({
                key: row.name, selected: row.name === selectedChain, onClick: () => setSelectedChain(row.name),
                cells: [row.name, row.count.toLocaleString(), `${row.medianSaving.toFixed(2)}%`, `${row.sameSupplierRate.toFixed(2)}%`, `$${row.medianPrice.toFixed(0)}`],
              }))} />
          </>)}

          {/* ── SPEED ── */}
          {view === 'speed' && (
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 4 }}>Catch speed vs. average saving</div>
              <div style={{ fontSize: 13, color: SLATE, marginBottom: 20 }}>The longer we wait, the bigger the saving tends to be. Computed from {rebookings.length.toLocaleString()} rebookings.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {speedAgg.map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, color: SLATE, fontWeight: 500 }}>{s.label} <span style={{ color: MUTED }}>({s.count.toLocaleString()} rebookings)</span></span>
                      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: s.avgProfit === maxProfit ? AMBER : NAVY }}>${s.avgProfit.toFixed(0)} avg</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: '#F1F3F8', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, width: `${(s.avgProfit / maxProfit) * 100}%`, background: s.avgProfit === maxProfit ? GOLD : BLUE, transition: 'width 0.8s cubic-bezier(.2,.7,.3,1)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRICE ── */}
          {view === 'price' && pr && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              <StatCard label="Rebookings in this range" value={pr.count.toLocaleString()} fill={BLUE} pct={100} />
              <StatCard label="Share of total" value={`${pr.pct.toFixed(1)}%`} fill={GOLD} pct={pr.pct} valueColor={AMBER} />
            </div>
            <DataTable headers={['Price Bracket','Rebookings','Share of Total']}
              rows={priceAgg.map(row => ({
                key: row.label, selected: row.label === selectedPrice, onClick: () => setSelectedPrice(row.label),
                cells: [row.label, row.count.toLocaleString(), `${row.pct.toFixed(1)}%`],
              }))} />
          </>)}

          {/* ── SUPPLIER ── */}
          {view === 'supplier' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE, marginBottom: 10 }}>Same supplier</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: 800, letterSpacing: '-1px', color: NAVY, marginBottom: 6 }}>{supplierAgg.same.toLocaleString()}</div>
                <div style={{ fontSize: 13.5, color: SLATE }}>{((supplierAgg.same / supplierAgg.total) * 100).toFixed(1)}% of all rebookings — the new price came from the same supplier as the original booking.</div>
                <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(supplierAgg.same / supplierAgg.total) * 100}%`, background: BLUE, borderRadius: 99 }}/>
                </div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE, marginBottom: 10 }}>Different supplier</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: 800, letterSpacing: '-1px', color: AMBER, marginBottom: 6 }}>{supplierAgg.diff.toLocaleString()}</div>
                <div style={{ fontSize: 13.5, color: SLATE }}>Just {((supplierAgg.diff / supplierAgg.total) * 100).toFixed(1)}% — a genuinely different supplier was found and used instead.</div>
                <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(supplierAgg.diff / supplierAgg.total) * 100}%`, background: GOLD, borderRadius: 99 }}/>
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTPRINT ── */}
          {view === 'footprint' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE, marginBottom: 10 }}>Mize&apos;s footprint</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: 800, letterSpacing: '-1px', color: NAVY, marginBottom: 6 }}>{fmtMoney(rebookings.reduce((s, r) => s + r.original_price_usd, 0))}</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>Total cancelled GMV</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '10px 0', borderTop: `1px solid ${LINE}` }}>
                  <span style={{ color: SLATE }}>Bookings</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{rebookings.length.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: AMBER, marginBottom: 10 }}>Note</div>
                <div style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.6 }}>The untapped-market comparison ($65.97M) requires the full GRN cancellation dump, which isn&apos;t loaded into this live table yet — that figure remains from the original static analysis for now.</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}
