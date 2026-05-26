// backend/routes/voucher.js
// PATCHED: Full field extraction + cancellation policy gate + email notifications

const express = require('express')
const multer  = require('multer')
const axios   = require('axios')
const { createClient } = require('@supabase/supabase-js')
const router  = express.Router()
const email   = require('../utils/emailService')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only images and PDFs are allowed'))
  }
})

const RATES_TO_INR = {
  INR: 1, EUR: 112, USD: 84, GBP: 107,
  AED: 22.8, THB: 2.3, SGD: 62, MYR: 18, IDR: 0.005,
}

const EXTRACTION_PROMPT = `You are a hotel booking voucher parser for rebuq, an Indian travel price-tracking service.

Extract ALL fields below from this hotel booking confirmation/voucher.
Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation.

PRICING RULES (critical):
- "original_price" = price per room per night BEFORE taxes (if shown separately)
- "total_price_paid" = the TOTAL the customer actually paid (all rooms × all nights + ALL taxes + GST + service charges)
- If only one total is shown, put it in "total_price_paid" and set original_price to the same value
- Convert all non-INR currencies using: EUR=112, USD=84, GBP=107, AED=22.8, THB=2.3, SGD=62
- Always output prices in INR as plain numbers (no symbols, no commas)

CHILDREN AGE RULES:
- List each child's age as a number: e.g. [4, 7]
- If "2 children" but ages not stated: use [null, null]
- Empty array [] if no children

CANCELLATION RULES (read very carefully):
- "free"           = fully refundable with no penalty before cancellation_deadline
- "partial"        = some penalty applies even before deadline
- "non-refundable" = NO refund under ANY circumstance — even if cancelled immediately
- "unknown"        = cannot determine from voucher
- cancellation_deadline = LAST DATE to cancel for FREE (YYYY-MM-DD). null if non-refundable or unknown.
- cancellation_penalty  = penalty amount in INR if cancelled after deadline. null if free cancellation.

BOARD BASIS CODES:
- RO = Room Only, BB = Bed & Breakfast, HB = Half Board, FB = Full Board, AI = All Inclusive

Respond with exactly this JSON shape:

{
  "hotel_name": "exact hotel name as printed on voucher",
  "hotel_city": "city name only, no country",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "total_nights": number,
  "room_type": "exact room type",
  "num_adults": number,
  "num_children": number,
  "children_ages": [],
  "num_rooms": number,
  "board_basis": "RO|BB|HB|FB|AI",
  "board_basis_label": "Room Only|Bed & Breakfast|Half Board|Full Board|All Inclusive",
  "rate_plan_name": "or null",
  "original_price": number,
  "total_price_paid": number,
  "taxes_included": true,
  "price_breakdown": {
    "per_night": number,
    "per_room": number,
    "rooms": number,
    "nights": number,
    "taxes": number or null,
    "total": number
  },
  "currency_original": "INR|EUR|USD|AED|THB|GBP|SGD",
  "ota_name": "MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Direct|Other",
  "booking_reference": "confirmation/PNR number as string, or null",
  "cancellation_policy": "free|partial|non-refundable|unknown",
  "cancellation_deadline": "YYYY-MM-DD or null",
  "cancellation_penalty": number in INR or null
}`

function buildClaudeContent(base64Data, mimeType) {
  if (mimeType === 'application/pdf') {
    return [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
      { type: 'text', text: EXTRACTION_PROMPT }
    ]
  }
  return [
    { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
    { type: 'text', text: EXTRACTION_PROMPT }
  ]
}

router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const base64Data = req.file.buffer.toString('base64')
    const mimeType   = req.file.mimetype

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages:   [{ role: 'user', content: buildClaudeContent(base64Data, mimeType) }]
      },
      {
        headers: {
          'x-api-key':         process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json'
        }
      }
    )

    const rawText   = response.data.content[0].text.trim()
    const clean     = rawText.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)

    const currency = extracted.currency_original || 'INR'
    const rate     = RATES_TO_INR[currency] || 1

    if (currency !== 'INR') {
      if (extracted.original_price)   extracted.original_price   = Math.round(extracted.original_price   * rate)
      if (extracted.total_price_paid) extracted.total_price_paid = Math.round(extracted.total_price_paid * rate)
      if (extracted.price_breakdown) {
        const pb = extracted.price_breakdown
        if (pb.per_night) pb.per_night = Math.round(pb.per_night * rate)
        if (pb.per_room)  pb.per_room  = Math.round(pb.per_room  * rate)
        if (pb.taxes)     pb.taxes     = Math.round(pb.taxes     * rate)
        if (pb.total)     pb.total     = Math.round(pb.total     * rate)
      }
      if (extracted.cancellation_penalty)
        extracted.cancellation_penalty = Math.round(extracted.cancellation_penalty * rate)
    }

    if (!extracted.total_nights && extracted.check_in && extracted.check_out) {
      extracted.total_nights = Math.round(
        (new Date(extracted.check_out) - new Date(extracted.check_in)) / 86400000
      )
    }

    if (extracted.total_price_paid && extracted.total_nights > 0) {
      extracted.price_per_night = Math.round(
        extracted.total_price_paid / (extracted.total_nights * (extracted.num_rooms || 1))
      )
    }

    console.log(`✅ Voucher extracted: ${extracted.hotel_name} | ${extracted.cancellation_policy} | ₹${extracted.total_price_paid}`)

    res.json({
      success:     true,
      data:        extracted,
      blocked:     extracted.cancellation_policy === 'non-refundable',
      blockReason: extracted.cancellation_policy === 'non-refundable' ? 'non_refundable' : null,
    })

  } catch (err) {
    console.error('❌ Voucher extraction error:', err.message)
    res.status(500).json({ error: 'Failed to extract voucher details', details: err.message })
  }
})

router.post('/submit', async (req, res) => {
  try {
    const data  = req.body
    const phone = data.phone || data.whatsapp

    if (!phone) return res.status(400).json({ error: 'Phone number required' })

    // GATE: Block non-refundable
    if (data.cancellation_policy === 'non-refundable') {
      await supabase.from('bookings').insert(buildBookingRow(data, 'non-refundable'))
      await sendNonRefundableWhatsApp(phone, data)

      if (data.email) {
        email.nonRefundable(data.email, {
          name: data.email.split('@')[0],
          booking: { hotelName: data.hotel_name, checkinDate: data.check_in }
        }).catch(e => console.error('Non-refundable email failed:', e.message))
      }

      return res.status(200).json({
        success: false, blocked: true, reason: 'non_refundable',
        message: 'This booking is non-refundable. Customer notified via WhatsApp.',
        hotel_name: data.hotel_name,
      })
    }

    // WARN: Unknown policy
    if (data.cancellation_policy === 'unknown') {
      await sendUnknownPolicyWhatsApp(phone, data)
    }

    // PROCEED: Save and track
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(buildBookingRow(data, 'tracking'))
      .select()
      .single()

    if (error) throw error

    await sendTrackingStartedWhatsApp(phone, booking)

    // Respond immediately — don't wait for email
    res.json({ success: true, booking_id: booking.id, message: 'Tracking started!' })

    // Send email in background — non-blocking
    if (booking.email) {
      email.bookingReceived(booking.email, {
        name: booking.email.split('@')[0],
        booking: {
          hotelName:    booking.hotel_name,
          city:         booking.hotel_city,
          checkinDate:  booking.check_in,
          checkoutDate: booking.check_out,
          nights:       booking.total_nights,
          roomType:     booking.room_type,
          adults:       booking.num_adults,
          children:     booking.children_ages || [],
          amountPaid:   booking.total_price_paid,
          currency:     'INR',
          otaName:      booking.ota_name,
          bookingRef:   booking.booking_reference,
        }
      }).catch(e => console.error('Booking received email failed:', e.message))
    }

  } catch (err) {
    console.error('❌ Submit error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function buildBookingRow(data, status) {
  const nights = data.total_nights ||
    (data.check_in && data.check_out
      ? Math.round((new Date(data.check_out) - new Date(data.check_in)) / 86400000)
      : 1)
  const totalPaid = data.total_price_paid || data.original_price || 0
  const perNight  = data.price_per_night  ||
    (totalPaid && nights > 0 ? Math.round(totalPaid / (nights * (data.num_rooms || 1))) : 0)

  return {
    phone:                 data.phone || data.whatsapp,
    email:                 data.email || null,
    hotel_name:            data.hotel_name,
    hotel_city:            data.hotel_city,
    check_in:              data.check_in,
    check_out:             data.check_out,
    total_nights:          nights,
    room_type:             data.room_type            || null,
    num_adults:            data.num_adults            || 2,
    num_children:          data.num_children          || 0,
    children_ages:         data.children_ages         || [],
    num_rooms:             data.num_rooms             || 1,
    board_basis:           data.board_basis           || null,
    board_basis_label:     data.board_basis_label     || null,
    rate_plan_name:        data.rate_plan_name        || null,
    original_price:        data.original_price        || totalPaid,
    total_price_paid:      totalPaid,
    price_per_night:       perNight,
    currency:              'INR',
    taxes_included:        data.taxes_included ?? true,
    price_breakdown:       data.price_breakdown       || null,
    ota_name:              data.ota_name              || null,
    booking_reference:     data.booking_reference     || null,
    cancellation_policy:   data.cancellation_policy   || 'unknown',
    cancellation_deadline: data.cancellation_deadline || null,
    cancellation_penalty:  data.cancellation_penalty  || null,
    status,
    tracking_active:       status === 'tracking',
    next_check_at:         status === 'tracking' ? new Date().toISOString() : null,
  }
}

const twilio = require('twilio')

function getTwilioClient() {
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
}

async function sendWhatsApp(to, body) {
  const client    = getTwilioClient()
  const formatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`
  await client.messages.create({
    from: 'whatsapp:+14155238886',
    to:   formatted,
    body,
  })
}

async function sendNonRefundableWhatsApp(phone, data) {
  const nights    = data.total_nights || '?'
  const totalPaid = data.total_price_paid
    ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}`
    : 'amount on voucher'

  const msg = `Hi! Thanks for submitting your booking to rebuq. 🙏

*${data.hotel_name}*
📍 ${data.hotel_city}
📅 ${data.check_in} → ${data.check_out} (${nights} nights)
🛏️ ${data.room_type || 'Standard Room'}
💳 Total paid: ${totalPaid}

❌ *We can't track this booking.*

Your booking is *non-refundable* — even if the price drops, you wouldn't be able to cancel and rebook to save money.

rebuq only makes sense for refundable or partially-refundable bookings.

💡 *Next time, book a flexible rate* — even if slightly higher upfront, rebuq often finds drops that save you far more.

We'll be here for your next booking! 🏨
— Team rebuq`

  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Non-refundable WhatsApp failed:', e.message) }
}

async function sendUnknownPolicyWhatsApp(phone, data) {
  const totalPaid = data.total_price_paid
    ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}`
    : 'amount on voucher'

  const msg = `Hi! Your booking has been added to rebuq. ⚠️

*${data.hotel_name}, ${data.hotel_city}*
💳 Total paid: ${totalPaid}

One thing — we couldn't clearly read your *cancellation policy* from the voucher.

Please reply:
1️⃣ → *Fully refundable* (I can cancel for free)
2️⃣ → *Non-refundable* (no cancellation allowed)

This helps us track correctly and not send alerts you can't act on.

— Team rebuq`

  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Unknown policy WhatsApp failed:', e.message) }
}

async function sendTrackingStartedWhatsApp(phone, booking) {
  const nights   = booking.total_nights || '?'
  const perNight = booking.price_per_night
    ? `₹${Number(booking.price_per_night).toLocaleString('en-IN')}/night` : ''

  const cancelLine = (() => {
    if (booking.cancellation_policy === 'free' && booking.cancellation_deadline) {
      const d = new Date(booking.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      return `⚠️ Free cancel until: *${d}*`
    }
    if (booking.cancellation_policy === 'partial') return `⚠️ Partial cancellation fees apply`
    return `✅ Cancellation: ${booking.cancellation_policy}`
  })()

  const childrenLine = (booking.children_ages && booking.children_ages.length > 0)
    ? `\n👶 Children: ${booking.children_ages.map(a => a ? `${a} yrs` : 'age TBD').join(', ')}`
    : ''

  const mealLine = booking.board_basis_label ? `\n🍽️ ${booking.board_basis_label}` : ''

  const msg = `✅ *rebuq is watching your booking!*

*${booking.hotel_name}*
📍 ${booking.hotel_city}
📅 ${booking.check_in} → ${booking.check_out} (${nights} nights)
🛏️ ${booking.room_type || 'Standard Room'} · ${booking.num_rooms || 1} room(s)
👤 ${booking.num_adults || 2} adults${childrenLine}${mealLine}

💳 *Total paid: ₹${Number(booking.total_price_paid || booking.original_price).toLocaleString('en-IN')}*${perNight ? `\n📊 ${perNight}` : ''}

${cancelLine}

We'll check prices every 6 hours and alert you the moment it drops — for the *exact same room and meal plan*.

Reply *STATUS* anytime to check.

— Team rebuq 🏨`

  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Tracking started WhatsApp failed:', e.message) }
}

module.exports = router
