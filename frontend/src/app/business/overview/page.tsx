export default function OverviewPage() {
  return (
    <>
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1
            className="font-bold text-2xl text-[#0F172A]"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            How your booking book is performing, end to end.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>Custom range</option>
          </select>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md">
            Sample data
          </span>
        </div>
      </div>

      <div className="px-8 py-8">

        {/* KPI GRID — the full picture, at a glance */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-[#1447b8] uppercase mb-4">
            The full picture
          </p>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard big="~3,000/day" label="Total bookings received" />
            <KpiCard big="~1,500/day" label="Refundable — eligible for rebooking" />
            <KpiCard big="10.7%" label="Conversion rate (rebookings ÷ eligible)" gold />
            <KpiCard big="99.9%" label="System reliability" />
            <KpiCard big="$684,237" label="Gross margin generated" gold />
            <KpiCard big="$462" label="Median booking value" />
            <KpiCard big="98.6%" label="Rebookings kept on original supplier" />
            <KpiCard big="33.7%" label="Share of volume, top supplier" gold />
          </div>
        </div>

        {/* RELIABILITY TREND */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-bold text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                System reliability, over time
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Excludes guest-driven cancellations — measures execution only</p>
            </div>
          </div>
          <div className="flex items-end gap-8 h-32">
            {[
              { m: 'W1', v: 94.8 },
              { m: 'W2', v: 94.4 },
              { m: 'W3', v: 96.7 },
              { m: 'W4', v: 98.9 },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-sm font-bold text-[#0F172A]">{d.v}%</span>
                <div className="w-full bg-[#FCD34D] rounded-t" style={{ height: `${(d.v - 90) * 12}px` }} />
                <span className="text-xs text-slate-400">{d.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-bold text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Booking volume &amp; conversion
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Bookings received vs. % eligible, by week</p>
              </div>
            </div>
            <div className="h-52 flex items-end gap-4 px-2" style={{ borderBottom: '1px solid #E2E8F0' }}>
              {[58, 70, 88, 82, 64].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-[#1447b8]/20" style={{ height: `${h}%` }} />
                  <p className="text-xs text-slate-400">W{23 + i}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-bold text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Gross margin generated
                </p>
                <p className="text-xs text-slate-400 mt-0.5">By week, in USD</p>
              </div>
            </div>
            <div className="h-52 flex items-end gap-4 px-2" style={{ borderBottom: '1px solid #E2E8F0' }}>
              {[46, 82, 100, 96, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-[#FCD34D]" style={{ height: `${h}%` }} />
                  <p className="text-xs text-slate-400">W{23 + i}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        <p className="text-xs text-slate-400 mt-6">
          Sample data, structured around the validated KPI framework — connect your GRN API key to populate live figures.
        </p>

      </div>
    </>
  );
}

function KpiCard({ big, label, gold = false }: { big: string; label: string; gold?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: gold ? '#B8860B' : '#0F172A' }}
      >
        {big}
      </p>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{label}</p>
    </div>
  );
}
