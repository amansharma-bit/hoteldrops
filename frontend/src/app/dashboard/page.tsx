'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Upload, TrendingDown, Clock, CheckCircle, RefreshCw, IndianRupee, Hotel, ArrowRight } from 'lucide-react'

interface Booking {
  id: string
  hotel_name: string
  hotel_city: string
  check_in: string
  check_out: string
  original_price: number
  status: string
  last_checked_at: string
  nights: number
  room_type: string
  offers?: { offer_price: number; customer_saving: number; status: string }[]
}

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  pending:   { label: 'Setting up',    class: 'badge-pending',   icon: Clock },
  tracking:  { label: 'Tracking',      class: 'badge-tracking',  icon: RefreshCw },
  drop_found:{ label: 'Drop Found!',   class: 'badge-drop',      icon: TrendingDown },
  offer_sent:{ label: 'Offer Sent',    class: 'badge-drop',      icon: Bell },
  accepted:  { label: 'Accepted',      class: 'badge-rebooked',  icon: CheckCircle },
  rebooked:  { label: 'Rebooked ✓',   class: 'badge-rebooked',  icon: CheckCircle },
  expired:   { label: 'Expired',       class: 'badge-expired',   icon: Clock },
  no_drop:   { label: 'No drop yet',   class: 'badge-expired',   icon: Clock },
}

// Mock data — replace with real API call
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1', hotel_name: 'Taj Mahal Palace', hotel_city: 'Mumbai',
    check_in: '2026-06-15', check_out: '2026-06-18', original_price: 55500,
    status: 'drop_found', last_checked_at: '2026-05-06T10:30:00Z', nights: 3, room_type: 'Deluxe Room',
    offers: [{ offer_price: 49500, customer_saving: 6000, status: 'sent' }],
  },
  {
    id: '2', hotel_name: 'ITC Grand Chola', hotel_city: 'Chennai',
    check_in: '2026-07-01', check_out: '2026-07-03', original_price: 28000,
    status: 'tracking', last_checked_at: '2026-05-06T08:00:00Z', nights: 2, room_type: 'Superior Room',
  },
  {
    id: '3', hotel_name: 'The Leela Palace', hotel_city: 'New Delhi',
    check_in: '2026-08-10', check_out: '2026-08-12', original_price: 42000,
    status: 'tracking', last_checked_at: '2026-05-06T06:00:00Z', nights: 2, room_type: 'Grand Room',
  },
  {
    id: '4', hotel_name: 'Oberoi Udaivilas', hotel_city: 'Udaipur',
    check_in: '2026-05-20', check_out: '2026-05-23', original_price: 90000,
    status: 'rebooked', last_checked_at: '2026-05-01T12:00:00Z', nights: 3, room_type: 'Premier Lake View',
    offers: [{ offer_price: 81000, customer_saving: 9000, status: 'completed' }],
  },
]

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS)
  const [activeTab, setActiveTab] = useState<'all'|'tracking'|'drops'|'completed'>('all')

  const filtered = bookings.filter(b => {
    if (activeTab === 'tracking')  return b.status === 'tracking' || b.status === 'pending'
    if (activeTab === 'drops')     return b.status === 'drop_found' || b.status === 'offer_sent'
    if (activeTab === 'completed') return b.status === 'rebooked'
    return true
  })

  const totalSaved = bookings
    .filter(b => b.status === 'rebooked')
    .reduce((sum, b) => sum + (b.offers?.[0]?.customer_saving || 0), 0)

  const activeTracking = bookings.filter(b => b.status === 'tracking').length
  const dropsFound     = bookings.filter(b => ['drop_found','offer_sent','rebooked'].includes(b.status)).length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HD</span>
          </div>
          <span className="font-extrabold text-xl text-gray-900">HotelDrops</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/upload" className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
            <Upload className="w-4 h-4" />
            Track New Booking
          </Link>
        </div>
      </nav>

      <div className="max-w-screen-lg mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-800 text-gray-900">My Bookings Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">We're monitoring your hotel prices 24/7. Sit back and relax.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Bookings tracked',  value: bookings.length,   icon: Hotel,       color: 'bg-blue-50 text-blue-600' },
            { label: 'Actively tracking', value: activeTracking,     icon: RefreshCw,   color: 'bg-purple-50 text-purple-600' },
            { label: 'Price drops found', value: dropsFound,         icon: TrendingDown,color: 'bg-green-50 text-green-600' },
            { label: 'Total saved',       value: `₹${totalSaved.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-yellow-50 text-yellow-600' },
          ].map((s, i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-800 text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Drop found alert banner */}
        {bookings.some(b => b.status === 'drop_found' || b.status === 'offer_sent') && (
          <div className="bg-green-600 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-700">Price drop found on your booking!</p>
                <p className="text-green-100 text-sm">Taj Mahal Palace — Save ₹6,000 on your stay</p>
              </div>
            </div>
            <button className="bg-white text-green-700 font-700 text-sm px-5 py-2.5 rounded-xl hover:shadow-md transition-shadow whitespace-nowrap">
              View Offer →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([
            { key: 'all',       label: `All (${bookings.length})` },
            { key: 'tracking',  label: `Tracking (${activeTracking})` },
            { key: 'drops',     label: `Drops Found (${dropsFound})` },
            { key: 'completed', label: 'Completed' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-600 transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Hotel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-600 text-gray-500 mb-4">No bookings in this category</p>
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Track a Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const sc = statusConfig[booking.status] || statusConfig.tracking
              const offer = booking.offers?.[0]
              const nights = booking.nights || Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000)

              return (
                <div key={booking.id} className={`card hover:shadow-md transition-shadow ${booking.status === 'drop_found' ? 'border-green-200 bg-green-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Hotel icon */}
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Hotel className="w-6 h-6 text-primary-600" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-700 text-gray-900">{booking.hotel_name}</h3>
                          <span className={`badge ${sc.class}`}>
                            <sc.icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{booking.hotel_city} · {booking.room_type}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400">📅 {new Date(booking.check_in).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} → {new Date(booking.check_out).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                          <span className="text-xs text-gray-400">🌙 {nights} nights</span>
                          {booking.last_checked_at && (
                            <span className="text-xs text-gray-400">
                              🔍 Last checked: {new Date(booking.last_checked_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price section */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 mb-0.5">Original price</p>
                      <p className={`text-lg font-800 ${offer ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        ₹{booking.original_price.toLocaleString('en-IN')}
                      </p>
                      {offer && (
                        <>
                          <p className="text-lg font-800 text-green-600">₹{offer.offer_price.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-green-600 font-600">Save ₹{offer.customer_saving.toLocaleString('en-IN')} 🎉</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Drop found CTA */}
                  {(booking.status === 'drop_found' || booking.status === 'offer_sent') && offer && (
                    <div className="mt-4 pt-4 border-t border-green-100 flex items-center justify-between gap-4">
                      <p className="text-sm text-green-700 font-500">
                        🎉 We found a lower price! Save <strong>₹{offer.customer_saving.toLocaleString('en-IN')}</strong> on your stay.
                      </p>
                      <button className="bg-green-600 text-white text-sm font-600 px-5 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                        View Offer <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {bookings.length === 0 && (
          <div className="card text-center py-20">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-700 text-gray-900 mb-2">No bookings tracked yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Upload your first hotel voucher and we'll start monitoring the price for you instantly.</p>
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Your First Voucher
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
