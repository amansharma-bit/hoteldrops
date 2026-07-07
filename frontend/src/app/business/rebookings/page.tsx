import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const rebookings = [
  { hotel: 'COMO Metropolitan Singapore', city: 'Singapore', room: 'Standard Twin Room', checkin: '27 Jul 2026', original: '$810.00', rebooked: '$772.00', saved: '$38.00', supplier: 'smyrooms_grn', status: 'Confirmed' },
  { hotel: 'Hilton Garden Inn Al Muraqabat', city: 'Dubai', room: 'Deluxe King Room', checkin: '27 Jul 2026', original: '$555.00', rebooked: '$526.00', saved: '$29.00', supplier: 'tbo_grn_intl', status: 'Confirmed' },
  { hotel: 'Novotel Bangkok Sukhumvit', city: 'Bangkok', room: 'Superior Room', checkin: '02 Aug 2026', original: '$292.52', rebooked: '$272.37', saved: '$20.15', supplier: 'dotw', status: 'Confirmed' },
  { hotel: 'Anantara Riverside Resort', city: 'Bangkok', room: 'Riverside Room', checkin: '19 Aug 2026', original: '$772.66', rebooked: '$715.71', saved: '$56.95', supplier: 'fitruums_dubai_vat', status: 'Pending' },
  { hotel: 'Taj Mahal Palace', city: 'New Delhi', room: 'Luxury Room', checkin: '08 Jul 2026', original: '₹22,420', rebooked: '₹18,980', saved: '₹3,440', supplier: 'grn', status: 'Confirmed' },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'text-emerald-700 bg-emerald-50',
  Pending: 'text-amber-700 bg-amber-50',
  Error: 'text-red-700 bg-red-50',
};

export default function RebookingsPage() {
  return (
    <BusinessSidebarWrapper>
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Rebookings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every booking we've moved to a cheaper, verified rate.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md">
          Sample data
        </span>
      </div>

      <div className="px-8 py-8">

        <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
          <button className="text-sm font-semibold text-[#0F172A] px-4 py-3 border-b-2 border-[#1447b8] -mb-px">
            Successful
          </button>
          <button className="text-sm font-medium text-slate-400 hover:text-[#0F172A] px-4 py-3 transition-colors">
            Errors <span className="ml-1 text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded">3</span>
          </button>
          <button className="text-sm font-medium text-slate-400 hover:text-[#0F172A] px-4 py-3 transition-colors">
            All attempts
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            type="text"
            placeholder="Search booking reference"
            className="text-sm border border-slate-200 rounded-md px-3 py-2 w-56 focus:border-[#1447b8] outline-none"
          />
          <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
            <option>All suppliers</option>
            <option>smyrooms_grn</option>
            <option>tbo_grn_intl</option>
            <option>dotw</option>
          </select>
          <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
          </select>
          <button className="text-sm font-medium text-[#1447b8] px-3 py-2 hover:underline ml-auto">
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Hotel</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Room</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Check-in</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 text-right">Original</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 text-right">Rebooked</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 text-right">Saved</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Supplier</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rebookings.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#0F172A]">{r.hotel}</p>
                      <p className="text-xs text-slate-400">{r.city}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.room}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{r.checkin}</td>
                    <td className="px-5 py-4 text-sm text-slate-400 text-right tabular-nums" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {r.original}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#0F172A] font-medium text-right tabular-nums" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {r.rebooked}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-right tabular-nums" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#B8860B' }}>
                      {r.saved}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{r.supplier}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing 5 of 187 rebookings</p>
            <div className="flex items-center gap-2">
              <button className="text-xs font-medium text-slate-400 px-3 py-1.5 rounded-md border border-slate-200 cursor-not-allowed">
                Previous
              </button>
              <button className="text-xs font-medium text-[#0F172A] px-3 py-1.5 rounded-md border border-slate-200 hover:border-[#1447b8] transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Click any row to see the Original vs. Rebooked comparison and full pipeline log. (Coming next.)
        </p>

      </div>
    </BusinessSidebarWrapper>
  );
}
