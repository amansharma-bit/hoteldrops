'use client';

import { useState } from 'react';

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

export default function ReportsPage() {
  const [view, setView] = useState<'monthly' | 'city'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedCity, setSelectedCity] = useState('Bangkok');

  const m = MONTHLY_DATA[selectedMonth as keyof typeof MONTHLY_DATA];
  const c = CITY_DATA[selectedCity];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
          Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">Market analysis and historical performance data.</p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="rounded-xl p-5 mb-8 flex items-start gap-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#FCD34D', color: '#78350F' }}>
            i
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>GRN Market Analysis — January to June 2026</p>
            <p className="text-sm mt-1" style={{ color: '#92400E' }}>
              Historical GRN and Mize data, not rebuq's own live activity. A separate live section will appear once rebuq's API access is active.
            </p>
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('monthly')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={view === 'monthly' ? { background: '#1447b8', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #E2E8F0' }}
          >
            Monthly View
          </button>
          <button
            onClick={() => setView('city')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={view === 'city' ? { background: '#1447b8', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #E2E8F0' }}
          >
            By City
          </button>
        </div>

        {view === 'monthly' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold bg-white cursor-pointer"
                style={{ color: '#0F172A' }}
              >
                {MONTH_ORDER.map((mo) => (
                  <option key={mo} value={mo}>{mo} 2026</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={m.refundable} />
              <KpiCard label="Rebooked (Mize)" value={m.rebooked} />
              <KpiCard label="Profit Generated" value={m.profit} gold />
              <KpiCard label="Conversion Rate" value={m.conversion} />
              <KpiCard label="Failure Rate" value={m.failure} valueColor={m.failureColor} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Full six-month trend</p>
              <p className="text-xs text-slate-400 mb-5">{selectedMonth} is highlighted below</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase text-slate-400">
                    <td className="pb-2 border-b border-slate-200">Month</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Refundable</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Rebooked</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Profit</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Conversion</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Failure</td>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {MONTH_ORDER.map((mo) => {
                    const row = MONTHLY_DATA[mo as keyof typeof MONTHLY_DATA];
                    const isSelected = mo === selectedMonth;
                    return (
                      <tr key={mo} onClick={() => setSelectedMonth(mo)} className="cursor-pointer" style={isSelected ? { background: '#EEF2FF' } : {}}>
                        <td className={`py-2 border-b border-slate-100 font-sans ${isSelected ? 'font-semibold' : ''}`}>{mo}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.refundable}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.rebooked}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.profit}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.conversion}</td>
                        <td className="text-right border-b border-slate-100" style={{ color: row.failureColor, fontWeight: isSelected ? 600 : undefined }}>{row.failure}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'city' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Showing data for</p>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold bg-white cursor-pointer"
                style={{ color: '#0F172A' }}
              >
                {CITY_ORDER.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Refundable Bookings" value={c.refundable} />
              <KpiCard label="Refundable GMV" value={c.gmv} gold />
              <KpiCard label="Profit Captured" value={c.profit} />
              <KpiCard label="Conversion Rate" value={c.conversion} valueColor={c.convColor} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>All 20 cities — click any row to view it above</p>
              <p className="text-xs text-slate-400 mb-5">{selectedCity} is highlighted below</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase text-slate-400">
                    <td className="pb-2 border-b border-slate-200">City</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Refundable</td>
                    <td className="pb-2 border-b border-slate-200 text-right">GMV</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Profit</td>
                    <td className="pb-2 border-b border-slate-200 text-right">Conversion</td>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {CITY_ORDER.map((city) => {
                    const row = CITY_DATA[city];
                    const isSelected = city === selectedCity;
                    return (
                      <tr key={city} onClick={() => setSelectedCity(city)} className="cursor-pointer" style={isSelected ? { background: '#EEF2FF' } : {}}>
                        <td className={`py-2 border-b border-slate-100 font-sans ${isSelected ? 'font-semibold' : ''}`}>{city}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.refundable}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.gmv}</td>
                        <td className={`text-right border-b border-slate-100 ${isSelected ? 'font-semibold' : ''}`}>{row.profit}</td>
                        <td className="text-right border-b border-slate-100" style={{ color: row.convColor, fontWeight: isSelected ? 600 : undefined }}>{row.conversion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, gold = false, valueColor }: { label: string; value: string; sub?: string; gold?: boolean; valueColor?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: valueColor || (gold ? '#B8860B' : '#0F172A') }}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
    </div>
  );
}
