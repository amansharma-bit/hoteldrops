'use client'

import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'
import { ALERTS } from '@/lib/alerts'

export default function BookingDetailPage({ params }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`)
      .then(r => r.json())
      .then(data => { setBooking(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  if (!booking) return <Alert {...ALERTS.SYSTEM.GENERIC_ERROR} />

  function StatusAlert() {
    const today = new Date(); today.setHours(0,0,0,0)
    const checkin = new Date(booking.checkin_date)
    const deadline = booking.free_cancel_deadline ? new Date(booking.free_cancel_deadline) : null

    if (checkin < today) {
      if (booking.alert_sent_count > 0) {
        return <Alert {...ALERTS.STATUS.COMPLETE_WITH_SAVING}
          sub={`Total checks: ${booking.checks_run} | Alerts sent: ${booking.alert_sent_count}`}
          actions={[{ label: 'Upload next booking →', onClick: () => window.location.href='/upload' }]} />
      }
      return <Alert {...ALERTS.STATUS.COMPLETE_NO_SAVING}
        sub={`Total checks: ${booking.checks_run} | No price drop found.`}
        actions={[{ label: 'Upload next booking →', variant:'secondary', onClick: () => window.location.href='/upload' }]} />
    }

    if (booking.monitoring_status === 'cancelled') {
      return <Alert {...ALERTS.STATUS.CANCELLED}
        actions={[{ label: 'Upload a new booking →', onClick: () => window.location.href='/upload' }]} />
    }

    if (booking.monitoring_status === 'paused') {
      return <Alert {...ALERTS.STATUS.PAUSED}
        actions={[{ label: 'Resume monitoring', onClick: () => resumeMonitoring() }]} />
    }

    if (deadline) {
      const deadlineDay = new Date(deadline); deadlineDay.setHours(0,0,0,0)
      if (deadlineDay.getTime() === today.getTime()) {
        return <Alert {...ALERTS.STATUS.CANCELLATION_TODAY}
          actions={[{ label: 'View current rates →', onClick: () => window.open(booking.hotel_page_url) }]} />
      }
    }

    if (booking.monitoring_status === 'alert_sent') {
      return <Alert {...ALERTS.STATUS.WHATSAPP_SENT}
        actions={[{ label: 'View hotel page →', onClick: () => window.open(booking.hotel_page_url) }]} />
    }

    if (booking.price_drop_available) {
      return <Alert {...ALERTS.STATUS.PRICE_DROP_FOUND}
        actions={[{ label: 'View hotel page →', onClick: () => window.open(booking.hotel_page_url) }]} />
    }

    if (booking.monitoring_status === 'active') {
      return <Alert {...ALERTS.STATUS.NO_DROP_YET}
        sub={`Checked ${booking.checks_run || 0} times. Next check in ~6 hours. Last checked: ${booking.last_checked || 'Starting soon'}`} />
    }

    return <Alert {...ALERTS.STATUS.MONITORING_ACTIVE}
      sub={`Last checked: ${booking.last_checked || 'Starting soon'}`} />
  }

  async function resumeMonitoring() {
    await fetch(`/api/bookings/${params.id}/resume`, { method: 'POST' })
    window.location.reload()
  }

  async function pauseMonitoring() {
    await fetch(`/api/bookings/${params.id}/pause`, { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{booking.hotel_name}</h1>
      <p className="text-gray-400 text-sm mb-6">{booking.city} · {booking.checkin_date} → {booking.checkout_date}</p>

      <div className="mb-6">
        <StatusAlert />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold text-gray-900 mb-4">Booking details</h2>
        {[
          ['Hotel',       booking.hotel_name],
          ['Location',    booking.city],
          ['Check-in',    booking.checkin_date],
          ['Check-out',   booking.checkout_date],
          ['Room type',   booking.room_type],
          ['Adults',      booking.adults],
          ['Children',    booking.children?.length ? booking.children.map(a=>`${a}yrs`).join(', ') : 'None'],
          ['Amount paid', `${booking.currency} ${booking.amount_paid}`],
          ['Booked on',   booking.ota_name || '—'],
          ['Reference',   booking.booking_ref || '—'],
          ['Rate type',   booking.cancel_policy],
          ['Cancel by',   booking.free_cancel_deadline || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-900 font-medium text-right">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        {booking.monitoring_status === 'active' && (
          <button onClick={pauseMonitoring} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Pause monitoring
          </button>
        )}
        <button onClick={() => window.location.href='/upload'} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
          Upload another booking →
        </button>
      </div>
    </div>
  )
}
