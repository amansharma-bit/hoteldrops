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
        <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 90 days</option>
          <option>Custom range</option>
        </select>
      </div>

      <div className="px-8 py-8">

        {/* FUNNEL */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
          <p className="text-xs font-semibold tracking-widest text-[#1447b8] uppercase mb-6">
            The full story
          </p>
          <div className="flex items-stretch justify-between flex-wrap gap-y-8">

            <FunnelStep value="2,340" label="Bookings received" showArrow />
            <FunnelStep value="612" label="Eligible for rebooking" badge="26% of received" showArrow />
            <FunnelStep value="195" label="Rebooking attempted" badge="32% of eligible" showArrow />
            <FunnelStep value="187" label="Successful" badge="95.9% success rate" badgeColor="emerald" showArrow />
            <FunnelStep
              value={
                <>
                  $4,182<span className="text-lg text-slate-400">.60</span>
                </>
              }
              valueColor="#B8860B"
              label="Margin captured"
              badge="Avg. 4.7% per booking"
              badgeColor="gold"
            />

          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Chart 1: Volume + conversion */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-bold text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Booking volume &amp; conversion
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Bookings received vs. % eligible, by week</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1447b8]/20" />
                  Received
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]" />
                  Eligible %
                </span>
              </div>
            </div>

            <div
              className="relative h-52 flex items-end gap-4 px-2"
              style={{ borderBottom: '1px solid #E2E8F0' }}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 500 208"
                preserveAspectRatio="none"
              >
                <polyline
                  points="35,140 130,120 225,90 320,70 415,55"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="35" cy="140" r="4" fill="#FCD34D" />
                <circle cx="130" cy="120" r="4" fill="#FCD34D" />
                <circle cx="225" cy="90" r="4" fill="#FCD34D" />
                <circle cx="320" cy="70" r="4" fill="#FCD34D" />
                <circle cx="415" cy="55" r="4" fill="#FCD34D" />
              </svg>
              {[58, 70, 88, 82, 64].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-[#1447b8]/20" style={{ height: `${h}%` }} />
                  <p className="text-xs text-slate-400">W{23 + i}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Margin captured */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-bold text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Margin captured
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Original vs. rebooked cost, by week</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                  Original
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0F172A]" />
                  Rebooked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FCD34D]" />
                  Captured
                </span>
              </div>
            </div>

            <div
              className="h-52 flex items-end gap-4 px-2"
              style={{ borderBottom: '1px solid #E2E8F0' }}
            >
              {[
                { orig: 46, rebook: 41, saved: 8 },
                { orig: 82, rebook: 74, saved: 15 },
                { orig: 100, rebook: 90, saved: 19 },
                { orig: 96, rebook: 87, saved: 17 },
                { orig: 70, rebook: 63, saved: 12 },
              ].map((w, i) => (
                <div key={i} className="flex-1 flex items-end justify-center gap-1">
                  <div className="w-3 rounded-t bg-slate-300" style={{ height: `${w.orig}%` }} />
                  <div className="w-3 rounded-t bg-[#0F172A]" style={{ height: `${w.rebook}%` }} />
                  <div className="w-3 rounded-t bg-[#FCD34D]" style={{ height: `${w.saved}%` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 px-2 mt-2">
              {[23, 24, 25, 26, 27].map((w) => (
                <p key={w} className="flex-1 text-center text-xs text-slate-400">
                  W{w}
                </p>
              ))}
            </div>
          </div>

        </div>

        <p className="text-xs text-slate-400 mt-6">
          Sample data — connect your GRN API key to populate live figures.
        </p>

      </div>
    </>
  );
}

function FunnelStep({
  value,
  label,
  badge,
  badgeColor = 'blue',
  valueColor,
  showArrow = false,
}: {
  value: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'gold';
  valueColor?: string;
  showArrow?: boolean;
}) {
  const badgeStyles = {
    blue: 'text-[#1447b8] bg-[#1447b8]/10',
    emerald: 'text-emerald-700 bg-emerald-50',
    gold: 'text-[#78530a]',
  };

  return (
    <div className="relative flex-1 min-w-[150px] pr-6">
      {showArrow && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 text-lg">→</span>
      )}
      <p
        className="text-3xl font-bold tabular-nums"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: valueColor || '#0F172A' }}
      >
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {badge && (
        <span
          className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[badgeColor]}`}
          style={badgeColor === 'gold' ? { background: '#FEF3C7' } : undefined}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
