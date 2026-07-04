export default function ReportsPage() {
  return (
    <>
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="font-bold text-2xl text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
          Reports
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Longer-range trends — conversion rate, average saving %, and supplier breakdowns.
        </p>
      </div>

      <div className="px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center justify-center text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: '#EFF4FC' }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1447b8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-[#0F172A] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            Reports are coming next
          </h2>
          <p className="text-sm text-slate-500 max-w-sm">
            Once Overview, Bookings, and Rebookings are live with real data, we'll design
            trend views here — conversion over time, saving % by hotel, and supplier
            performance.
          </p>
        </div>
      </div>
    </>
  );
}
