export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="font-display text-2xl font-bold text-navy" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
          Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">Market analysis and historical performance data.</p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* CLEAR LABELING BANNER — this is historical GRN market data, not rebuq's own live tracking */}
        <div
          className="rounded-xl p-5 mb-8 flex items-start gap-4"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: '#FCD34D', color: '#78350F' }}
          >
            i
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
              GRN Market Analysis — January to June 2026
            </p>
            <p className="text-sm mt-1" style={{ color: '#92400E' }}>
              This section reflects a historical review of GRN's own booking data and Mize's rebooking performance —
              not rebuq's own live activity. Once rebuq's API access is live, a separate live section will show
              rebuq's own real-time results using this same KPI structure.
            </p>
          </div>
        </div>

        {/* HEADLINE KPI GRID */}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Six-month headline KPIs</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          <KpiCard label="Total Bookings" value="390,550" sub="Jan–Jun 2026" />
          <KpiCard label="Refundable Bookings" value="56.94%" sub="~222,449 bookings" gold />
          <KpiCard label="Rebooked (Mize)" value="10,129" sub="Successful rebookings" />
          <KpiCard label="Profit Generated" value="$443,832" sub="Full 6-month period" gold />
          <KpiCard label="Conversion Rate" value="3.80% → 5.94%" sub="Jan → Jun trend" />
          <KpiCard label="Failure Rate" value="8.25% → 2.99%" sub="Jan → Jun trend, improving" />
        </div>

        {/* MONTHLY TREND TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <p className="font-display font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Monthly trend
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Refundable pool, rebookings, profit, conversion, and failure rate — same 6-month window
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase text-slate-400">
                <td className="pb-2 border-b border-slate-200">Month</td>
                <td className="pb-2 border-b border-slate-200 text-right">Refundable</td>
                <td className="pb-2 border-b border-slate-200 text-right">Rebooked</td>
                <td className="pb-2 border-b border-slate-200 text-right">Profit</td>
                <td className="pb-2 border-b border-slate-200 text-right">Conversion</td>
                <td className="pb-2 border-b border-slate-200 text-right">Failure Rate</td>
              </tr>
            </thead>
            <tbody className="font-mono">
              <MonthRow month="January" refundable="23,975" rebooked="912" profit="$32,017" conversion="3.80%" failure="8.25%" failureColor="#DC2626" />
              <MonthRow month="February" refundable="28,347" rebooked="986" profit="$37,218" conversion="3.48%" failure="9.54%" failureColor="#DC2626" />
              <MonthRow month="March" refundable="34,821" rebooked="1,549" profit="$69,633" conversion="4.45%" failure="3.37%" />
              <MonthRow month="April" refundable="35,508" rebooked="1,558" profit="$75,435" conversion="4.39%" failure="5.06%" />
              <MonthRow month="May" refundable="40,165" rebooked="1,975" profit="$82,393" conversion="4.92%" failure="5.41%" />
              <MonthRow month="June" refundable="53,019" rebooked="3,149" profit="$146,983" conversion="5.94%" failure="2.99%" failureColor="#16A34A" bold />
            </tbody>
          </table>
        </div>

        {/* SPEED / PATTERN FINDINGS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="font-display font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Notable patterns from the review
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <FindingCard title="Speed vs. profit" body="Rebookings caught after 60+ days earn 38% more on average than same-day catches — patience finds bigger drops." />
            <FindingCard title="Same-supplier lock-in" body="Only 1.1% of rebookings ever crossed to a different supplier — the same pattern repeats across 10 of the top 20 cities." />
            <FindingCard title="Untapped market" body="$65.97M in cancellations happened with no Mize involvement at all — 12x Mize's own $5.41M footprint." />
            <FindingCard title="City-level gap" body="Delhi/NCR and Mumbai both show 0% conversion despite real, current opportunities — confirmed with a live example." />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, gold = false }: { label: string; value: string; sub: string; gold?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <p
        className="text-2xl font-bold"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: gold ? '#B8860B' : '#0F172A' }}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-2">{sub}</p>
    </div>
  );
}

function MonthRow({
  month, refundable, rebooked, profit, conversion, failure, failureColor, bold = false,
}: {
  month: string; refundable: string; rebooked: string; profit: string; conversion: string; failure: string; failureColor?: string; bold?: boolean;
}) {
  const weight = bold ? 'font-semibold' : '';
  return (
    <tr>
      <td className={`py-2 border-b border-slate-100 font-sans ${weight}`}>{month}</td>
      <td className={`text-right border-b border-slate-100 ${weight}`}>{refundable}</td>
      <td className={`text-right border-b border-slate-100 ${weight}`}>{rebooked}</td>
      <td className={`text-right border-b border-slate-100 ${weight}`}>{profit}</td>
      <td className={`text-right border-b border-slate-100 ${weight}`}>{conversion}</td>
      <td className="text-right border-b border-slate-100" style={{ color: failureColor || undefined, fontWeight: bold ? 600 : undefined }}>
        {failure}
      </td>
    </tr>
  );
}

function FindingCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
      <p className="text-sm font-semibold text-navy mb-1" style={{ color: '#0F172A' }}>{title}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
