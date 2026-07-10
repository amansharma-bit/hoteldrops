'use client';

import { useState, useRef, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const MONTHLY_DATA = {
  'January':  { refundable: '23,975', rebooked: '912',   profit: '$32,017',  conversion: '3.80%', failure: '8.25%', failureColor: '#DC2626' },
  'February': { refundable: '28,347', rebooked: '986',   profit: '$37,218',  conversion: '3.48%', failure: '9.54%', failureColor: '#DC2626' },
  'March':    { refundable: '34,821', rebooked: '1,549', profit: '$69,633',  conversion: '4.45%', failure: '3.37%', failureColor: '#334155' },
  'April':    { refundable: '35,508', rebooked: '1,558', profit: '$75,435',  conversion: '4.39%', failure: '5.06%', failureColor: '#334155' },
  'May':      { refundable: '40,165', rebooked: '1,975', profit: '$82,393',  conversion: '4.92%', failure: '5.41%', failureColor: '#334155' },
  'June':     { refundable: '53,019', rebooked: '3,149', profit: '$146,983', conversion: '5.94%', failure: '2.99%', failureColor: '#16A34A' },
};
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June'];

const CITY_DATA: Record<string, { refundable: string; gmv: string; profit: string; conversion: string; convColor: string }> = {
  'Bangkok':          { refundable: '1,699', gmv: '$855K',  profit: '$8,624',  conversion: '11.83%', convColor: '#16A34A' },
  'Singapore':        { refundable: '2,021', gmv: '$2.08M', profit: '$10,140', conversion: '10.79%', convColor: '#16A34A' },
  'Rome':             { refundable: '1,545', gmv: '$1.25M', profit: '$6,601',  conversion: '10.55%', convColor: '#16A34A' },
  'Dubai':            { refundable: '2,806', gmv: '$2.26M', profit: '$10,483', conversion: '8.05%',  convColor: '#334155' },
  'Barcelona':        { refundable: '1,505', gmv: '$1.30M', profit: '$5,379',  conversion: '7.97%',  convColor: '#334155' },
  'London':           { refundable: '3,797', gmv: '$3.69M', profit: '$9,383',  conversion: '6.74%',  convColor: '#334155' },
  'Amsterdam':        { refundable: '1,867', gmv: '$1.74M', profit: '$6,963',  conversion: '6.64%',  convColor: '#334155' },
  'Tokyo':            { refundable: '3,302', gmv: '$3.69M', profit: '$6,896',  conversion: '5.18%',  convColor: '#334155' },
  'Madrid':           { refundable: '2,137', gmv: '$1.20M', profit: '$5,107',  conversion: '4.73%',  convColor: '#334155' },
  'Paris':            { refundable: '5,391', gmv: '$5.51M', profit: '$15,695', conversion: '4.60%',  convColor: '#334155' },
  'New York':         { refundable: '3,051', gmv: '$3.22M', profit: '$4,761',  conversion: '3.77%',  convColor: '#334155' },
  'Las Vegas':        { refundable: '4,664', gmv: '$1.29M', profit: '$5,712',  conversion: '2.94%',  convColor: '#334155' },
  'Zurich':           { refundable: '1,883', gmv: '$1.93M', profit: '$2,615',  conversion: '2.92%',  convColor: '#334155' },
  'Orlando':          { refundable: '2,978', gmv: '$900K',  profit: '$3,110',  conversion: '2.12%',  convColor: '#334155' },
  'San Francisco':    { refundable: '1,668', gmv: '$888K',  profit: '$1,691',  conversion: '1.80%',  convColor: '#334155' },
  'Phoenix':          { refundable: '703',   gmv: '$252K',  profit: '$369',    conversion: '1.71%',  convColor: '#334155' },
  'Chicago':          { refundable: '1,660', gmv: '$909K',  profit: '$901',    conversion: '1.51%',  convColor: '#334155' },
  'Los Angeles':      { refundable: '2,654', gmv: '$1.51M', profit: '$1,287',  conversion: '1.13%',  convColor: '#334155' },
  'Mumbai':           { refundable: '1,181', gmv: '$396K',  profit: '$0',      conversion: '0.00%',  convColor: '#DC2626' },
  'New Delhi & NCR':  { refundable: '1,472', gmv: '$480K',  profit: '$0',      conversion: '0.00%',  convColor: '#DC2626' },
};
const CITY_ORDER = Object.keys(CITY_DATA);

const CHAIN_DATA: Record<string, { count: string; medianSaving: string; sameSupplier: string; medianPrice: string }> = {
  'Wyndham':          { count: '154', medianSaving: '7.15%', sameSupplier: '99.35%',  medianPrice: '$268' },
  'Ibis':             { count: '255', medianSaving: '6.84%', sameSupplier: '100.00%', medianPrice: '$242' },
  'Best Western':     { count: '112', medianSaving: '6.74%', sameSupplier: '98.21%',  medianPrice: '$289' },
  'Radisson':         { count: '478', medianSaving: '6.15%', sameSupplier: '100.00%', medianPrice: '$383' },
  'Holiday Inn':      { count: '371', medianSaving: '6.07%', sameSupplier: '97.85%',  medianPrice: '$376' },
  'Novotel':          { count: '242', medianSaving: '5.99%', sameSupplier: '100.00%', medianPrice: '$479' },
  'Hyatt':            { count: '246', medianSaving: '5.73%', sameSupplier: '99.19%',  medianPrice: '$461' },
  'Hilton':           { count: '337', medianSaving: '5.62%', sameSupplier: '98.22%',  medianPrice: '$438' },
  'Crowne Plaza':     { count: '71',  medianSaving: '5.42%', sameSupplier: '100.00%', medianPrice: '$565' },
  'Marriott':         { count: '136', medianSaving: '5.31%', sameSupplier: '100.00%', medianPrice: '$507' },
  'Sheraton':         { count: '88',  medianSaving: '5.21%', sameSupplier: '98.86%',  medianPrice: '$442' },
};
const CHAIN_ORDER = Object.keys(CHAIN_DATA);

const SPEED_DATA: { label: string; count: number; avgProfit: number }[] = [
  { label: 'Caught same day',       count: 265,   avgProfit: 47.09 },
  { label: 'Caught in 1-3 days',    count: 2298,  avgProfit: 37.35 },
  { label: 'Caught in 4-7 days',    count: 1879,  avgProfit: 39.32 },
  { label: 'Caught in 8-14 days',   count: 1659,  avgProfit: 39.81 },
  { label: 'Caught in 15-30 days',  count: 1602,  avgProfit: 44.58 },
  { label: 'Caught in 31-60 days',  count: 621,   avgProfit: 57.82 },
  { label: 'Caught after 60+ days', count: 732,   avgProfit: 64.64 },
];
const maxProfit = Math.max(...SPEED_DATA.map(s => s.avgProfit));

const PRICE_DATA: Record<string, { count: string; pct: string }> = {
  'Under $200':  { count: '1,851', pct: '20.4%' },
  '$200-500':    { count: '3,575', pct: '39.5%' },
  '$500-1000':   { count: '2,212', pct: '24.4%' },
  'Over $1000':  { count: '1,418', pct: '15.7%' },
};
const PRICE_ORDER = Object.keys(PRICE_DATA);

const COUNTRY_DATA: Record<string, { rebookings: string; profit: string; avg: string }> = {
  'United States':    { rebookings: '546', profit: '$23,121', avg: '$42.35' },
  'Italy':            { rebookings: '437', profit: '$18,905', avg: '$43.26' },
  'Thailand':         { rebookings: '345', profit: '$15,076', avg: '$43.70' },
  'India':            { rebookings: '330', profit: '$14,008', avg: '$42.45' },
  'United Kingdom':   { rebookings: '281', profit: '$10,519', avg: '$37.43' },
  'UAE':              { rebookings: '255', profit: '$11,637', avg: '$45.64' },
  'France':           { rebookings: '248', profit: '$15,695', avg: '$63.29' },
  'Japan':            { rebookings: '234', profit: '$9,524',  avg: '$40.70' },
  'Spain':            { rebookings: '221', profit: '$10,485', avg: '$47.44' },
  'Singapore':        { rebookings: '218', profit: '$10,140', avg: '$46.51' },
};
const COUNTRY_ORDER = Object.keys(COUNTRY_DATA);

const GOLD = '#B8860B';
const GOLD_BG = '#FEF9E7';
const GOLD_BORDER = '#FCD34D';

function Dropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer flex items-center gap-2 min-w-[160px] justify-between"
        style={{ background: GOLD_BG, border: `1.5px solid ${GOLD_BORDER}`, color: '#78350F' }}
      >
        {value}
        <span style={{ fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto z-50" style={{ maxHeight: '280px', minWidth: '200px' }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={opt === value ? { background: GOLD_BG, fontWeight: 600, color: '#78350F' } : { color: '#334155' }}>
              {opt}
            </div>
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
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(true)}
        className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer flex items-center gap-2 min-w-[200px] justify-between"
        style={{ background: GOLD_BG, border: `1.5px solid ${GOLD_BORDER}`, color: '#78350F' }}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="bg-transparent outline-none w-full"
            style={{ color: '#78350F' }}
          />
        ) : (
          <span>{value}</span>
        )}
        <span style={{ fontSize: '10px' }}>🔍</span>
      </div>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto z-50" style={{ maxHeight: '280px', minWidth: '220px' }}>
          {filtered.length === 0 && <div className="px-4 py-2 text-sm text-slate-400">No matches</div>}
          {filtered.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); setQuery(''); }} className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={opt === value ? { background: GOLD_BG, fontWeight: 600, color: '#78350F' } : { color: '#334155' }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ViewType = 'monthly' | 'city' | 'country' | 'chain' | 'speed' | 'price' | 'supplier' | 'footprint';

export default function ReportsPage() {
  const [view, setView] = useState<ViewType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedCity, setSelectedCity] = useState('Bangkok');
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [selectedChain, setSelectedChain] = useState('Hilton');
  const [selectedPrice, setSelectedPrice] = useState('$200-500');

  const m = MONTHLY_DATA[selectedMonth as keyof typeof MONTHLY_DATA];
  const c = CITY_DATA[selectedCity];
  const co = COUNTRY_DATA[selectedCountry];
  const ch = CHAIN_DATA[selectedChain];
  const pr = PRICE_DATA[selectedPrice];

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'city', label: 'By City' },
    { id: 'country', label: 'By Country' },
    { id: 'chain', label: 'By Chain' },
    { id: 'speed', label: 'By Speed' },
    { id: 'price', label: 'By Price' },
    { id: 'supplier', label: 'Supplier Match' },
    { id: 'footprint', label: 'Cancellation Footprint' },
  ];

  return (
    <BusinessSidebarWrapper>
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Market analysis and historical performance data — Jan–Jun 2026.</p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={view === t.id ? { background: '#1447b8', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #E2E8F0' }}>
              {t.label}
            </button>
          ))}
        </div>

        {view === 'monthly' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={MONTH_ORDER.map(mo => `${mo} 2026`)} value={`${selectedMonth} 2026`} onChange={(v) => setSelectedMonth(v.replace(' 2026', ''))} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={m.refundable} />
              <KpiCard label="Rebooked (Mize)" value={m.rebooked} />
              <KpiCard label="Profit Generated" value={m.profit} gold />
              <KpiCard label="Conversion Rate" value={m.conversion} />
              <KpiCard label="Failure Rate" value={m.failure} valueColor={m.failureColor} />
            </div>
            <DataTable headers={['Month', 'Refundable', 'Rebooked', 'Profit', 'Conversion', 'Failure']}
              rows={MONTH_ORDER.map((mo) => {
                const row = MONTHLY_DATA[mo as keyof typeof MONTHLY_DATA];
                return { key: mo, selected: mo === selectedMonth, onClick: () => setSelectedMonth(mo), cells: [mo, row.refundable, row.rebooked, row.profit, row.conversion, { text: row.failure, color: row.failureColor }] };
              })} />
          </>
        )}

        {view === 'city' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search for a city</p>
              <SearchDropdown options={CITY_ORDER} value={selectedCity} onChange={setSelectedCity} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={c.refundable} />
              <KpiCard label="Refundable GMV" value={c.gmv} gold />
              <KpiCard label="Profit Captured" value={c.profit} />
              <KpiCard label="Conversion Rate" value={c.conversion} valueColor={c.convColor} />
            </div>
            <DataTable headers={['City', 'Refundable', 'GMV', 'Profit', 'Conversion']}
              rows={CITY_ORDER.map((city) => {
                const row = CITY_DATA[city];
                return { key: city, selected: city === selectedCity, onClick: () => setSelectedCity(city), cells: [city, row.refundable, row.gmv, row.profit, { text: row.conversion, color: row.convColor }] };
              })} />
          </>
        )}

        {view === 'country' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search for a country</p>
              <SearchDropdown options={COUNTRY_ORDER} value={selectedCountry} onChange={setSelectedCountry} />
            </div>
            <div className="grid grid-cols-3 gap-5 mb-8">
              <KpiCard label="Rebookings" value={co.rebookings} />
              <KpiCard label="Total Profit" value={co.profit} gold />
              <KpiCard label="Avg. Profit / Rebooking" value={co.avg} />
            </div>
            <DataTable headers={['Country', 'Rebookings', 'Profit', 'Avg/Rebooking']}
              rows={COUNTRY_ORDER.map((country) => {
                const row = COUNTRY_DATA[country];
                return { key: country, selected: country === selectedCountry, onClick: () => setSelectedCountry(country), cells: [country, row.rebookings, row.profit, row.avg] };
              })} />
          </>
        )}

        {view === 'chain' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={CHAIN_ORDER} value={selectedChain} onChange={setSelectedChain} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Rebookings" value={ch.count} />
              <KpiCard label="Median Saving" value={ch.medianSaving} gold />
              <KpiCard label="Same-Supplier Rate" value={ch.sameSupplier} />
              <KpiCard label="Median Price" value={ch.medianPrice} />
            </div>
            <DataTable headers={['Chain', 'Rebookings', 'Median Saving', 'Same-Supplier', 'Median Price']}
              rows={CHAIN_ORDER.map((chain) => {
                const row = CHAIN_DATA[chain];
                return { key: chain, selected: chain === selectedChain, onClick: () => setSelectedChain(chain), cells: [chain, row.count, row.medianSaving, row.sameSupplier, row.medianPrice] };
              })} />
          </>
        )}

        {view === 'speed' && (
          <>
            <p className="text-sm text-slate-500 mb-1">The longer we wait to catch a deal, the bigger it tends to be.</p>
            <p className="text-xs text-slate-400 mb-5">Rebookings caught after 60+ days earn <span className="font-semibold" style={{ color: GOLD }}>38% more</span> on average than same-day catches.</p>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="space-y-3">
                {SPEED_DATA.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label} <span className="text-slate-400">({s.count.toLocaleString()} rebookings)</span></span>
                      <span className="font-mono font-bold" style={{ color: s.avgProfit === maxProfit ? GOLD : '#0F172A' }}>${s.avgProfit.toFixed(2)} avg</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.avgProfit/maxProfit)*100}%`, background: s.avgProfit === maxProfit ? GOLD_BORDER : '#94A3B8' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'price' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={PRICE_ORDER} value={selectedPrice} onChange={setSelectedPrice} />
            </div>
            <div className="grid grid-cols-2 gap-5 mb-8">
              <KpiCard label="Rebookings in this range" value={pr.count} />
              <KpiCard label="Share of Total" value={pr.pct} gold />
            </div>
            <DataTable headers={['Price Bracket', 'Rebookings', 'Share of Total']}
              rows={PRICE_ORDER.map((price) => {
                const row = PRICE_DATA[price];
                return { key: price, selected: price === selectedPrice, onClick: () => setSelectedPrice(price), cells: [price, row.count, row.pct] };
              })} />
          </>
        )}

        {view === 'supplier' && (
          <>
            <p className="text-sm text-slate-500 mb-5">How often we actually check a different supplier before rebooking — versus just staying with the original one.</p>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="rounded-2xl p-6" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3 text-slate-500">Same Supplier</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>8,954</p>
                <p className="text-sm text-slate-500">98.9% of all rebookings — the new price came from the same supplier as the original booking.</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: GOLD }}>Different Supplier</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>102</p>
                <p className="text-sm text-slate-500">Just 1.1% — a genuinely different supplier was found and used instead.</p>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
              <p className="text-sm text-slate-600 leading-relaxed">
                This pattern holds across most of the market — 10 of our top 20 cities and 5 major hotel chains (Radisson, Novotel, Crowne Plaza, InterContinental, Marriott) show <span className="font-semibold text-navy" style={{ color: '#0F172A' }}>100% same-supplier</span> behavior. Worth understanding whether this reflects genuinely limited alternatives, or a search that isn't looking as wide as it could.
              </p>
            </div>
          </>
        )}

        {view === 'footprint' && (
          <>
            <p className="text-sm text-slate-500 mb-5">Mize's own cancellation activity, next to everything happening with no Mize involvement at all.</p>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="rounded-2xl p-6" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#1447b8' }}>Mize's Footprint</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>$5.41M</p>
                <p className="text-xs text-slate-500 mb-4">Total cancelled GMV</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Bookings</span><span className="font-mono font-semibold">9,056</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Avg. value</span><span className="font-mono font-semibold">$598</span></div>
                </div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: GOLD }}>Untapped Market</p>
                <p className="font-mono text-3xl font-bold mb-1" style={{ color: '#0F172A' }}>$65.97M</p>
                <p className="text-xs text-slate-500 mb-4">12x Mize's own footprint</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Bookings</span><span className="font-mono font-semibold">84,608</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Avg. value</span><span className="font-mono font-semibold">$780</span></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#DC2626' }}>Sharpest single gap: UAE</p>
              <p className="text-sm text-slate-600">$28,902 actual vs. $1,885,506 potential — a 65.2x gap, the largest of any market.</p>
            </div>
          </>
        )}
      </div>
    </div>
    </BusinessSidebarWrapper>
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

type Cell = string | { text: string; color?: string };

function DataTable({ headers, rows }: { headers: string[]; rows: { key: string; selected: boolean; onClick: () => void; cells: Cell[] }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Full breakdown</p>
      <p className="text-xs text-slate-400 mb-5">Click any row to view it above</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase text-slate-400">
            {headers.map((h, i) => (<td key={h} className={`pb-2 border-b border-slate-200 ${i > 0 ? 'text-right' : ''}`}>{h}</td>))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.key} onClick={row.onClick} className="cursor-pointer" style={row.selected ? { background: GOLD_BG } : {}}>
              {row.cells.map((cell, i) => {
                const isObj = typeof cell === 'object';
                const text = isObj ? cell.text : cell;
                const color = isObj ? cell.color : undefined;
                return (
                  <td key={i} className={`py-2 border-b border-slate-100 ${i === 0 ? 'font-sans' : 'text-right'} ${row.selected ? 'font-semibold' : ''}`} style={color ? { color, fontWeight: row.selected ? 600 : undefined } : {}}>
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
