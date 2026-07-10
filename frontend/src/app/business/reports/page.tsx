'use client';

import { useState, useRef, useEffect } from 'react';

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

const SPEED_DATA: Record<string, { count: string; avgProfit: string }> = {
  'Same day':   { count: '265',   avgProfit: '$47.09' },
  '1-3 days':   { count: '2,298', avgProfit: '$37.35' },
  '4-7 days':   { count: '1,879', avgProfit: '$39.32' },
  '8-14 days':  { count: '1,659', avgProfit: '$39.81' },
  '15-30 days': { count: '1,602', avgProfit: '$44.58' },
  '31-60 days': { count: '621',   avgProfit: '$57.82' },
  '60+ days':   { count: '732',   avgProfit: '$64.64' },
};
const SPEED_ORDER = Object.keys(SPEED_DATA);

const PRICE_DATA: Record<string, { count: string; pct: string }> = {
  'Under $200':    { count: '1,851', pct: '20.4%' },
  '$200-500':      { count: '3,575', pct: '39.5%' },
  '$500-1000':     { count: '2,212', pct: '24.4%' },
  'Over $1000':    { count: '1,418', pct: '15.7%' },
};
const PRICE_ORDER = Object.keys(PRICE_DATA);

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
        className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold bg-white cursor-pointer flex items-center gap-2 min-w-[160px] justify-between"
        style={{ color: '#0F172A' }}
      >
        {value}
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto z-50"
          style={{ maxHeight: '280px', minWidth: '200px' }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
              style={opt === value ? { background: '#EEF2FF', fontWeight: 600, color: '#1447b8' } : { color: '#334155' }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ViewType = 'monthly' | 'city' | 'chain' | 'speed' | 'price';

export default function ReportsPage() {
  const [view, setView] = useState<ViewType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedCity, setSelectedCity] = useState('Bangkok');
  const [selectedChain, setSelectedChain] = useState('Hilton');
  const [selectedSpeed, setSelectedSpeed] = useState('60+ days');
  const [selectedPrice, setSelectedPrice] = useState('$200-500');

  const m = MONTHLY_DATA[selectedMonth as keyof typeof MONTHLY_DATA];
  const c = CITY_DATA[selectedCity];
  const ch = CHAIN_DATA[selectedChain];
  const sp = SPEED_DATA[selectedSpeed];
  const pr = PRICE_DATA[selectedPrice];

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'city', label: 'By City' },
    { id: 'chain', label: 'By Chain' },
    { id: 'speed', label: 'By Speed' },
    { id: 'price', label: 'By Price' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Market analysis and historical performance data.</p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="rounded-xl p-5 mb-8 flex items-start gap-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#FCD34D', color: '#78350F' }}>i</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>GRN Market Analysis — January to June 2026</p>
            <p className="text-sm mt-1" style={{ color: '#92400E' }}>
              Historical GRN and Mize data, not rebuq's own live activity. A separate live section will appear once rebuq's API access is active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={view === t.id ? { background: '#1447b8', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #E2E8F0' }}
            >
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
            <DataTable
              headers={['Month', 'Refundable', 'Rebooked', 'Profit', 'Conversion', 'Failure']}
              rows={MONTH_ORDER.map((mo) => {
                const row = MONTHLY_DATA[mo as keyof typeof MONTHLY_DATA];
                return { key: mo, selected: mo === selectedMonth, onClick: () => setSelectedMonth(mo), cells: [mo, row.refundable, row.rebooked, row.profit, row.conversion, { text: row.failure, color: row.failureColor }] };
              })}
            />
          </>
        )}

        {view === 'city' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={CITY_ORDER} value={selectedCity} onChange={setSelectedCity} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={c.refundable} />
              <KpiCard label="Refundable GMV" value={c.gmv} gold />
              <KpiCard label="Profit Captured" value={c.profit} />
              <KpiCard label="Conversion Rate" value={c.conversion} valueColor={c.convColor} />
            </div>
            <DataTable
              headers={['City', 'Refundable', 'GMV', 'Profit', 'Conversion']}
              rows={CITY_ORDER.map((city) => {
                const row = CITY_DATA[city];
                return { key: city, selected: city === selectedCity, onClick: () => setSelectedCity(city), cells: [city, row.refundable, row.gmv, row.profit, { text: row.conversion, color: row.convColor }] };
              })}
            />
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
            <DataTable
              headers={['Chain', 'Rebookings', 'Median Saving', 'Same-Supplier', 'Median Price']}
              rows={CHAIN_ORDER.map((chain) => {
                const row = CHAIN_DATA[chain];
                return { key: chain, selected: chain === selectedChain, onClick: () => setSelectedChain(chain), cells: [chain, row.count, row.medianSaving, row.sameSupplier, row.medianPrice] };
              })}
            />
          </>
        )}

        {view === 'speed' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <Dropdown options={SPEED_ORDER} value={selectedSpeed} onChange={setSelectedSpeed} />
            </div>
            <div className="grid grid-cols-2 gap-5 mb-8">
              <KpiCard label="Rebookings in this range" value={sp.count} />
              <KpiCard label="Average Profit" value={sp.avgProfit} gold />
            </div>
            <DataTable
              headers={['Speed', 'Rebookings', 'Average Profit']}
              rows={SPEED_ORDER.map((speed) => {
                const row = SPEED_DATA[speed];
                return { key: speed, selected: speed === selectedSpeed, onClick: () => setSelectedSpeed(speed), cells: [speed, row.count, row.avgProfit] };
              })}
            />
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
            <DataTable
              headers={['Price Bracket', 'Rebookings', 'Share of Total']}
              rows={PRICE_ORDER.map((price) => {
                const row = PRICE_DATA[price];
                return { key: price, selected: price === selectedPrice, onClick: () => setSelectedPrice(price), cells: [price, row.count, row.pct] };
              })}
            />
          </>
        )}
      </div>
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

type Cell = string | { text: string; color?: string };

function DataTable({ headers, rows }: { headers: string[]; rows: { key: string; selected: boolean; onClick: () => void; cells: Cell[] }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Full breakdown</p>
      <p className="text-xs text-slate-400 mb-5">Click any row to view it above</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase text-slate-400">
            {headers.map((h, i) => (
              <td key={h} className={`pb-2 border-b border-slate-200 ${i > 0 ? 'text-right' : ''}`}>{h}</td>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.key} onClick={row.onClick} className="cursor-pointer" style={row.selected ? { background: '#EEF2FF' } : {}}>
              {row.cells.map((cell, i) => {
                const isObj = typeof cell === 'object';
                const text = isObj ? cell.text : cell;
                const color = isObj ? cell.color : undefined;
                return (
                  <td
                    key={i}
                    className={`py-2 border-b border-slate-100 ${i === 0 ? 'font-sans' : 'text-right'} ${row.selected ? 'font-semibold' : ''}`}
                    style={color ? { color, fontWeight: row.selected ? 600 : undefined } : {}}
                  >
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
