// backend/routes/voucher.js
const express = require('express')
const multer  = require('multer')
const axios   = require('axios')
const { createClient } = require('@supabase/supabase-js')
const router  = express.Router()

let email
try { email = require('../utils/emailService') } catch(e) { email = null }

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
  AMD: 0.21, JPY: 0.56, OMR: 218, SAR: 22.4, QAR: 23.1,
  NPR: 0.63, LKR: 0.26, MUR: 1.9, KRW: 0.063, TRY: 2.5,
  ZAR: 4.5, EGP: 1.7, MXN: 4.2, BHD: 223,
}

const EXTRACTION_PROMPT = `You are a hotel booking voucher parser for rebuq, an Indian travel price-tracking service.

FIRST — determine if this document is a hotel booking confirmation/voucher.
Look for: hotel name, check-in date, check-out date, room type, booking reference.
If ANY of these are missing AND the document is clearly not a hotel booking, respond with ONLY:
{"document_type": "not_hotel", "reason": "brief reason why"}

Examples that are NOT hotel bookings — always return not_hotel for these:
- Photos of people, selfies, portraits
- Flight tickets or boarding passes
- Train/bus tickets
- Restaurant receipts
- Car rental confirmations
- Visa documents or passports
- Event tickets
- Insurance policies
- Bank statements
- Random photos of objects, places, food

If it IS a hotel booking, extract ALL fields below.
Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation.

PRICING RULES (critical):
- "original_price" = price per room per night BEFORE taxes (if shown separately)
- "total_price_paid" = the TOTAL the customer actually paid (all rooms × all nights + ALL taxes + GST + service charges)
- If only one total is shown, put it in "total_price_paid" and set original_price to the same value
- Convert all non-INR currencies using: EUR=112, USD=84, GBP=107, AED=22.8, THB=2.3, SGD=62, AMD=0.21, MYR=18, JPY=0.56, OMR=218, SAR=22.4, QAR=23.1, NPR=0.63
- Always output prices in INR as plain numbers (no symbols, no commas)

IMAGE QUALITY CHECK:
- If the image is too blurry, too dark, or unreadable to extract key fields (hotel name, dates, price), set "extraction_quality": "poor"
- If it's a partial/cropped screenshot missing key info, set "extraction_quality": "partial"
- Otherwise set "extraction_quality": "good"

PAY AT PROPERTY:
- If payment_type is "pay_at_property", the customer has NOT paid yet. Set total_price_paid to 0 and amount_paid_upfront to 0.

MULTI-HOTEL / MULTI-ROOM:
- If the document contains bookings for multiple different hotels, set "multi_hotel": true and extract only the FIRST hotel.
- If the document contains multiple rooms at the SAME hotel, extract as one booking with num_rooms set correctly.

CANCELLATION RULES (read very carefully):
- "free"           = fully refundable with no penalty before cancellation_deadline
- "partial"        = some penalty applies even before deadline
- "non-refundable" = NO refund under ANY circumstance — even if cancelled immediately
- "unknown"        = cannot determine from voucher
- cancellation_deadline = LAST DATE to cancel for FREE (YYYY-MM-DD). null if non-refundable or unknown.
- cancellation_penalty  = penalty amount in INR if cancelled after deadline. null if free cancellation.

BOARD BASIS CODES:
- RO = Room Only, BB = Bed & Breakfast, HB = Half Board, FB = Full Board, AI = All Inclusive

Respond with exactly this JSON shape for hotel bookings:

{
  "document_type": "hotel",
  "extraction_quality": "good|partial|poor",
  "multi_hotel": false,
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
  "currency_original": "INR|EUR|USD|AED|THB|GBP|SGD|AMD|MYR|JPY|OMR|SAR|QAR|NPR",
  "ota_name": "MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Direct|Other",
  "booking_reference": "confirmation/PNR number as string, or null",
  "cancellation_policy": "free|partial|non-refundable|unknown",
  "cancellation_deadline": "YYYY-MM-DD or null",
  "cancellation_penalty": number in INR or null,
  "payment_type": "pay_now|pay_at_property|partial_payment",
  "amount_paid_upfront": number
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

// ── POST /api/voucher/extract ─────────────────────────────────────────────────
router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const base64Data = req.file.buffer.toString('base64')
    const mimeType   = req.file.mimetype

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model:      'claude-sonnet-4-5',
        max_tokens: 1500,
        messages:   [{ role: 'user', content: buildClaudeContent(base64Data, mimeType) }]
      },
      {
        headers: {
          'x-api-key':         process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json'
        },
        timeout: 30000
      }
    )

    const rawText   = response.data.content[0].text.trim()
    const clean     = rawText.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)

    // ── NOT A HOTEL DOCUMENT ──────────────────────────────────────────────
    if (extracted.document_type === 'not_hotel') {
      console.log(`❌ Not a hotel voucher: ${extracted.reason}`)
      return res.json({
        success: false,
        blocked: true,
        blockReason: 'not_hotel',
        reason: extracted.reason,
        message: 'This does not appear to be a hotel booking confirmation.'
      })
    }

    // ── POOR IMAGE QUALITY ────────────────────────────────────────────────
    if (extracted.extraction_quality === 'poor') {
      console.log(`⚠️ Poor image quality for extraction`)
      return res.json({
        success: false,
        blocked: true,
        blockReason: 'poor_quality',
        message: 'We couldn\'t read your voucher clearly. Please upload a clearer image or PDF.',
        canManualEntry: true
      })
    }

    // ── CURRENCY CONVERSION ───────────────────────────────────────────────
    const currency = extracted.currency_original || 'INR'
    const rate     = RATES_TO_INR[currency] || 1

    if (currency !== 'INR' && rate !== 1) {
      if (extracted.original_price)   extracted.original_price   = Math.round(extracted.original_price   * rate)
      if (extracted.total_price_paid) extracted.total_price_paid = Math.round(extracted.total_price_paid * rate)
      if (extracted.amount_paid_upfront) extracted.amount_paid_upfront = Math.round(extracted.amount_paid_upfront * rate)
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

    // ── CALCULATE MISSING FIELDS ──────────────────────────────────────────
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

    // ── CHECK-IN ALREADY PASSED ───────────────────────────────────────────
    if (extracted.check_in) {
      const checkInDate = new Date(extracted.check_in)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysUntilCheckIn = Math.round((checkInDate - today) / 86400000)

      if (daysUntilCheckIn < 0) {
        console.log(`❌ Check-in already passed: ${extracted.check_in}`)
        return res.json({
          success: false,
          blocked: true,
          blockReason: 'checkin_passed',
          message: `Check-in date (${extracted.check_in}) has already passed. Nothing to monitor.`,
          data: extracted
        })
      }

      if (daysUntilCheckIn === 0 || daysUntilCheckIn === 1) {
        extracted._warning = 'checkin_soon'
        extracted._warningDays = daysUntilCheckIn
      }
    }

    // ── PAY AT PROPERTY ───────────────────────────────────────────────────
    if (extracted.payment_type === 'pay_at_property') {
      extracted.total_price_paid = extracted.amount_paid_upfront || 0
      extracted._warning = extracted._warning || 'pay_at_property'
    }

    // ── NON-REFUNDABLE ────────────────────────────────────────────────────
    const isNonRefundable = extracted.cancellation_policy === 'non-refundable'

    console.log(`✅ Voucher extracted: ${extracted.hotel_name} | ${extracted.cancellation_policy} | ₹${extracted.total_price_paid} | quality: ${extracted.extraction_quality}`)

    res.json({
      success:     true,
      data:        extracted,
      blocked:     isNonRefundable,
      blockReason: isNonRefundable ? 'non_refundable' : null,
      warnings: {
        partialExtraction: extracted.extraction_quality === 'partial',
        multiHotel:        extracted.multi_hotel === true,
        checkInSoon:       extracted._warning === 'checkin_soon',
        checkInSoonDays:   extracted._warningDays || null,
        payAtProperty:     extracted._warning === 'pay_at_property',
        unknownPolicy:     extracted.cancellation_policy === 'unknown',
        currencyConverted: currency !== 'INR',
        originalCurrency:  currency !== 'INR' ? currency : null,
      }
    })

  } catch (err) {
    console.error('❌ Voucher extraction error:', err.message)
    // If JSON parse fails, likely unreadable document
    if (err instanceof SyntaxError) {
      return res.json({
        success: false,
        blocked: true,
        blockReason: 'parse_error',
        message: 'We couldn\'t read the details from your voucher. Please try a clearer image or enter details manually.',
        canManualEntry: true
      })
    }
    res.status(500).json({ error: 'Failed to extract voucher details', details: err.message })
  }
})

// ── POST /api/voucher/submit ──────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const data  = req.body
    const phone = data.phone || data.whatsapp

    if (!phone) return res.status(400).json({ error: 'Phone number required' })

    // GATE: Block non-refundable
    if (data.cancellation_policy === 'non-refundable') {
      await supabase.from('bookings').insert(buildBookingRow(data, 'non-refundable'))
      await sendNonRefundableWhatsApp(phone, data)
      if (email && data.email) {
        email.nonRefundable?.(data.email, { name: data.email.split('@')[0], booking: { hotelName: data.hotel_name, checkinDate: data.check_in } })
          .catch(e => console.error('Non-refundable email failed:', e.message))
      }
      return res.status(200).json({
        success: false, blocked: true, reason: 'non_refundable',
        message: 'This booking is non-refundable. Customer notified via WhatsApp.',
      })
    }

    // CHECK: Check-in already passed
    if (data.check_in) {
      const today = new Date(); today.setHours(0,0,0,0)
      const daysUntil = Math.round((new Date(data.check_in) - today) / 86400000)
      if (daysUntil < 0) {
        return res.status(400).json({ error: 'Check-in date has already passed. Nothing to monitor.' })
      }
    }

    // CHECK: Duplicate upload (same hotel + check_in + phone)
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('phone', phone)
      .eq('hotel_name', data.hotel_name)
      .eq('check_in', data.check_in)
      .single()

    if (existing) {
      await sendDuplicateWhatsApp(phone, data)
      return res.json({
        success: false, blocked: false, reason: 'duplicate',
        message: 'This booking is already being tracked.',
        booking_id: existing.id
      })
    }

    // WARN: Unknown policy
    if (data.cancellation_policy === 'unknown') {
      await sendUnknownPolicyWhatsApp(phone, data)
    }

    // WARN: Check-in soon
    if (data.check_in) {
      const today = new Date(); today.setHours(0,0,0,0)
      const daysUntil = Math.round((new Date(data.check_in) - today) / 86400000)
      if (daysUntil <= 1) {
        // Save and send warning — we'll try but can't guarantee
        const { data: booking, error } = await supabase
          .from('bookings').insert(buildBookingRow(data, 'tracking')).select().single()
        if (error) throw error
        await sendCheckInSoonWhatsApp(phone, data, daysUntil)
        res.json({ success: true, booking_id: booking.id, warning: 'checkin_soon' })
        if (email && booking.email) {
          email.bookingReceived?.(booking.email, buildEmailPayload(booking))
            .catch(e => console.error('Email failed:', e.message))
        }
        return
      }
    }

    // PROCEED: Save and track
    const { data: booking, error } = await supabase
      .from('bookings').insert(buildBookingRow(data, 'tracking')).select().single()
    if (error) throw error

    sendTrackingStartedWhatsApp(phone, booking).catch(e => console.error('WhatsApp failed:', e.message))
    res.json({ success: true, booking_id: booking.id })

    if (email && booking.email) {
      email.bookingReceived?.(booking.email, buildEmailPayload(booking))
        .catch(e => console.error('Email failed:', e.message))
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
  const perNight  = data.price_per_night ||
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

function buildEmailPayload(booking) {
  return {
    name: booking.email?.split('@')[0] || 'there',
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
  }
}

// ── TWILIO WHATSAPP ───────────────────────────────────────────────────────────
const twilio = require('twilio')

function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN)
}

async function sendWhatsApp(to, body) {
  const client    = getTwilioClient()
  const formatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`
  const rawFrom = process.env.TWILIO_WHATSAPP_FROM || '+14155238886'
  const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Twilio timeout')), 10000))
  await Promise.race([
    client.messages.create({ from, to: formatted, body }),
    timeout
  ])
}

async function sendNonRefundableWhatsApp(phone, data) {
  const totalPaid = data.total_price_paid
    ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}` : 'amount on voucher'
  const msg = `Hi! Thanks for uploading your booking to rebuq. 🙏

*${data.hotel_name}*
📍 ${data.hotel_city || '—'}
📅 ${data.check_in} → ${data.check_out}
💳 Total paid: ${totalPaid}

❌ *We can't track this booking.*

Your booking is *non-refundable* — even if the price drops, you can't cancel to rebook and save.

rebuq works best with flexible/refundable bookings. Next time, book a cancellable rate — rebuq regularly finds drops of ₹10,000–₹40,000 that more than cover any price difference.

We'll be here for your next booking! 🏨
— Team rebuq`
  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Non-refundable WhatsApp failed:', e.message) }
}

async function sendUnknownPolicyWhatsApp(phone, data) {
  const totalPaid = data.total_price_paid
    ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}` : '—'
  const msg = `Hi! Your booking has been added to rebuq. ⚠️

*${data.hotel_name}, ${data.hotel_city || '—'}*
💳 Total paid: ${totalPaid}

One thing — we couldn't clearly read your *cancellation policy* from the voucher.

Please reply with:
1️⃣ → *Free cancellation* (I can cancel for free)
2️⃣ → *Non-refundable* (no cancellation allowed)
3️⃣ → *Partial refund* (some fees apply)

This helps us track correctly.
— Team rebuq`
  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Unknown policy WhatsApp failed:', e.message) }
}

async function sendDuplicateWhatsApp(phone, data) {
  const msg = `Hi! We noticed you uploaded *${data.hotel_name}* (${data.check_in}) again.

✅ Don't worry — this booking is *already being tracked* by rebuq!

We're checking prices every 6 hours and will WhatsApp you the moment we find a drop.

Reply *STATUS* to check your active monitors.
— Team rebuq`
  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Duplicate WhatsApp failed:', e.message) }
}

async function sendCheckInSoonWhatsApp(phone, data, daysUntil) {
  const totalPaid = data.total_price_paid
    ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}` : '—'
  const timing = daysUntil === 0 ? 'today' : 'tomorrow'
  const msg = `Hi! We've added your booking to rebuq. ⚠️

*${data.hotel_name}, ${data.hotel_city || '—'}*
📅 Check-in: *${timing}* (${data.check_in})
💳 Total paid: ${totalPaid}

⚠️ *Heads up:* Your check-in is very soon. We'll do our best to scan prices immediately, but with only ${daysUntil === 0 ? 'hours' : '1 day'} to go, the window to rebook is very tight.

We'll alert you instantly if we find anything. Fingers crossed! 🤞
— Team rebuq`
  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Check-in soon WhatsApp failed:', e.message) }
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
    ? `\n👶 Children: ${booking.children_ages.map(a => a ? `${a} yrs` : 'age TBD').join(', ')}` : ''
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

Reply *STATUS* anytime to check your bookings.
— Team rebuq 🏨`

  try { await sendWhatsApp(phone, msg) }
  catch (e) { console.error('Tracking started WhatsApp failed:', e.message) }
}

module.exports = router
