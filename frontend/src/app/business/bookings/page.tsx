const bookings = [
  { hotel: 'COMO Metropolitan Singapore', city: 'Singapore', room: 'Standard Twin Room', checkin: '27 Jul', checkout: '30 Jul', nights: 3, price: '$810.00', refundable: true, status: 'Rebooked' },
  { hotel: 'Hilton Garden Inn Al Muraqabat', city: 'Dubai', room: 'Deluxe King Room', checkin: '27 Jul', checkout: '29 Jul', nights: 2, price: '$555.00', refundable: true, status: 'Rebooked' },
  { hotel: 'Novotel Bangkok Sukhumvit', city: 'Bangkok', room: 'Superior Room', checkin: '02 Aug', checkout: '04 Aug', nights: 2, price: '$292.52', refundable: true, status: 'Eligible' },
  { hotel: 'Taj Mahal Palace', city: 'New Delhi', room: 'Luxury Room', checkin: '08 Jul', checkout: '10 Jul', nights: 2, price: '₹22,420', refundable: true, status: 'Rebooked' },
  { hotel: 'Marina Bay Sands', city: 'Singapore', room: 'Deluxe Room', checkin: '14 Aug', checkout: '17 Aug', nights: 3, price: '$1,240.00', refundable: false, status: 'Not eligible' },
  { hotel: 'Anantara Riverside', city: 'Bangkok', room: 'Riverside Room', checkin: '19 Aug', checkout: '22 Aug', nights: 3, price: '$772.66', refundable: true, status: 'Eligible' },
  { hotel: 'Burj Al Arab', city: 'Dubai', room: 'Deluxe Suite', checkin: '05 Sep', checkout: '08 Sep', nights: 3, price: '$3,150.00', refundable: false, status: 'Not eligible' },
  { hotel: 'Four Seasons', city: 'Bangkok', room: 'Premier Room', checkin: '11 Sep', checkout: '13 Sep', nights: 2, price: '$980.00', refundable: true, status: 'Eligible' },
];

const statusStyles: Record<string, string> = {
  Rebooked: 'text-emerald-700 bg-emerald-50',
  Eligible: 'text-[#1447b8] bg-[#1447b8]/10',
  'Not eligible': 'text-slate-500 bg-slate-100',
};

export default function BookingsPage() {
  return (
    <>
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every booking in your GRN book — not just the ones we've rebooked.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md">
          Sample data
        </span>
      </div>

      <div className="px-8 py-8">

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            type="text"
            placeholder="Search hotel or city"
            className="text-sm border border-slate-200 rounded-md px-3 py-2 w-56 focus:border-[#1447b8] outline-none"
          />
          <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
            <option>All statuses</option>
            <option>Rebooked</option>
            <option>Eligible</option>
            <option>Not eligible</option>
          </select>
          <select className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-600 focus:border-[#1447b8] outline-none">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
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
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Stay</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 text-right">Price</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Refundable</th>
                  <th className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#0F172A]">{b.hotel}</p>
                      <p className="text-xs text-slate-400">{b.city}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{b.room}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">
                        {b.checkin} → {b.checkout}
                      </p>
                      <p className="text-xs text-slate-400">{b.nights} nights</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-right tabular-nums" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {b.price}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{b.refundable ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing 8 of 2,340 bookings</p>
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

      </div>
    </>
  );
}
