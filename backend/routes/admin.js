const express  = require('express')
const router   = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { calculateOffer } = require('../utils/margins')
const { runPriceTracker } = require('../jobs/priceTracker')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Simple admin auth middleware (replace with proper auth later)
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key']
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ==============================
// GET /api/admin/dashboard
// Overview stats
// ==============================
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      { count: totalBookings },
      { count: activeTracking },
      { count: dropsFound },
      { count: rebooked },
      { data: recentOffers },
      { data: totalRevenue },
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'tracking'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['drop_found', 'offer_sent']),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'rebooked'),
      supabase.from('offers').select('*, bookings(hotel_name, hotel_city)').order('created_at', { ascending: false }).limit(10),
      supabase.from('rebookings').select('payment_amount').eq('payment_status', 'paid'),
    ])

    const revenue = (totalRevenue || []).reduce((sum, r) => sum + parseFloat(r.payment_amount || 0), 0)

    res.json({
      success: true,
      stats: {
        totalBookings,
        activeTracking,
        dropsFound,
        rebooked,
        totalRevenue: revenue,
      },
      recentOffers: recentOffers || [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// GET /api/admin/bookings
// All bookings with filters
// ==============================
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { status, city, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('bookings')
      .select('*, users(name, email, whatsapp_number), offers(offer_price, customer_saving, status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (city)   query = query.ilike('hotel_city', `%${city}%`)

    const { data, count, error } = await query
    if (error) throw error

    res.json({ success: true, bookings: data, total: count, page, limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/admin/bookings/:id/check-now
// Manually trigger a price check
// ==============================
router.post('/bookings/:id/check-now', adminAuth, async (req, res) => {
  try {
    // Force next_check_at to now
    await supabase.from('bookings')
      .update({ next_check_at: new Date().toISOString() })
      .eq('id', req.params.id)

    // Run tracker for just this booking
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', req.params.id).single()
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    res.json({ success: true, message: 'Price check queued. Results in ~30 seconds.' })

    // Run in background
    setImmediate(() => runPriceTracker().catch(console.error))

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/admin/offers/send-manual
// Manually create and send an offer
// ==============================
router.post('/offers/send-manual', adminAuth, async (req, res) => {
  try {
    const { bookingId, supplierPrice, customMarginPercent } = req.body

    const { data: booking } = await supabase.from('bookings').select('*, users(*)').eq('id', bookingId).single()
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const offer = await calculateOffer({
      originalPrice: booking.original_price,
      supplierPrice: parseFloat(supplierPrice),
      bookingId,
    })

    // Override margin if specified
    if (customMarginPercent) {
      const saving = booking.original_price - parseFloat(supplierPrice)
      offer.ourMargin      = Math.round(saving * customMarginPercent / 100)
      offer.customerSaving = saving - offer.ourMargin
      offer.offerPrice     = Math.round(parseFloat(supplierPrice) + offer.ourMargin)
    }

    // Save offer
    const { data: savedOffer } = await supabase.from('offers').insert({
      booking_id:       bookingId,
      supplier_price:   parseFloat(supplierPrice),
      offer_price:      offer.offerPrice,
      original_price:   booking.original_price,
      customer_saving:  offer.customerSaving,
      our_margin:       offer.ourMargin,
      margin_percentage:offer.marginPercentage,
      status:           'pending',
      expires_at:       new Date(Date.now() + 24 * 3600000).toISOString(),
    }).select().single()

    // Send alerts
    const { sendWhatsAppAlert, sendEmailAlert } = require('../utils/notifications')
    const nights = booking.nights || 1
    const alertData = {
      customerName:   booking.users?.name || 'Traveler',
      hotelName:      booking.hotel_name,
      city:           booking.hotel_city,
      checkIn:        booking.check_in,
      checkOut:       booking.check_out,
      nights,
      originalPrice:  booking.original_price,
      offerPrice:     offer.offerPrice,
      customerSaving: offer.customerSaving,
      offerId:        savedOffer.id,
      bookingId,
    }

    if (booking.users?.whatsapp_number) await sendWhatsAppAlert(booking.users.whatsapp_number, alertData)
    if (booking.users?.email) await sendEmailAlert(booking.users.email, alertData)

    await supabase.from('offers').update({ status: 'sent', whatsapp_sent_at: new Date().toISOString(), email_sent_at: new Date().toISOString() }).eq('id', savedOffer.id)
    await supabase.from('bookings').update({ status: 'offer_sent' }).eq('id', bookingId)

    res.json({ success: true, offer: savedOffer, message: 'Offer sent via WhatsApp and email!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// GET /api/admin/margin-rules
// ==============================
router.get('/margin-rules', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase.from('margin_rules').select('*').order('priority', { ascending: false })
    res.json({ success: true, rules: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/admin/margin-rules
// Create new margin rule
// ==============================
router.post('/margin-rules', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('margin_rules').insert(req.body).select().single()
    if (error) throw error
    res.json({ success: true, rule: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// PATCH /api/admin/margin-rules/:id
// Update margin rule
// ==============================
router.patch('/margin-rules/:id', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('margin_rules').update(req.body).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, rule: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/admin/tracker/run
// Manually trigger price tracker
// ==============================
router.post('/tracker/run', adminAuth, async (req, res) => {
  res.json({ success: true, message: 'Price tracker started in background' })
  setImmediate(() => runPriceTracker().catch(console.error))
})

module.exports = router
