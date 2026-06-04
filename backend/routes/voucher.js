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

const EXTRACTION_PROMPT = `You are an expert hotel data extractor for rebuq, an Indian travel price-tracking service.
You can read screenshots taken on phone cameras (angled, glare), desktop screenshots, PDFs, and WhatsApp-forwarded images.

═══════════════════════════════════════════════
STEP 1 — IDENTIFY DOCUMENT TYPE
═══════════════════════════════════════════════

Determine which type this is:

A) "confirmed_voucher" — Completed booking confirmation. Has booking reference, confirmation of payment. E.g. email voucher, PDF receipt, post-booking confirmation page.

B) "search_results" — Hotel search listing page showing MULTIPLE hotels with a search bar at top. User is browsing, has NOT booked.

C) "hotel_detail_top" — Single hotel overview/photos page. May show one featured room price. User is viewing the hotel.

D) "hotel_detail_rooms" — Hotel detail page scrolled to rooms/availability section. Shows MULTIPLE room types each with price, board, and cancellation policy.

E) "checkout_page" — Booking checkout/payment/review page. User has selected a room but NOT yet paid. Has price breakdown, cancellation policy, guest details form.

F) "not_hotel" — Not related to hotels (flights, trains, food, selfies, passports, bank statements, car rental, etc.)

═══════════════════════════════════════════════
STEP 2 — DETECT OTA
═══════════════════════════════════════════════

Detect from logo, URL bar, or page design:
- MakeMyTrip (MMT): purple/dark search bar, makemytrip.com in URL, "MMT Luxe" badge
- Ixigo: orange "ixigo" logo, ixigo.com in URL
- Goibibo: orange header, goibibo.com in URL
- Agoda: dark nav with colored dots logo, agoda.com in URL
- Hotels.com: red H logo, hotels.com in URL, "Collect stamps" badge. in.hotels.com ALWAYS shows INR — never flag AED or any other currency for Hotels.com India.
- Booking.com: dark blue nav, booking.com in URL, "Genius" badge
- Yatra: red "yatra" logo, yatra.com in URL
- GRNConnect: "GRNConnect" or "VISA2FLY" branding, grnconnect.com in URL — shows "Tripadvisor Rating" on hotel cards
- TBO: tbo.com in URL or TBO logo
- Expedia: expedia.com in URL
- Direct: hotel's own website

═══════════════════════════════════════════════
STEP 3 — TAX LOGIC BY OTA (CRITICAL)
═══════════════════════════════════════════════

ALWAYS INCLUSIVE — trust the price shown, no adjustment needed:
- MMT: shows "with tax" or "For X Nights with tax" — TOTAL inclusive
- Hotels.com: shows "includes taxes & fees" — TOTAL inclusive. Currency is ALWAYS INR for in.hotels.com — set currency_original: "INR" always.
- GRNConnect: ALWAYS inclusive — all prices shown are final per night
- TBO: ALWAYS inclusive — all prices shown are final per night
- Yatra on checkout: shows "Hotel Charges + Hotel GST = Total Amount" — use the Total Amount line directly

TAXES SHOWN SEPARATELY — add base + tax first, THEN multiply by nights and rooms:
- Ixigo: shows "₹9,896 + ₹2,839 taxes & fees per night, per room"
  STEP 1: price_per_night_incl_tax = 9896 + 2839 = 12735
  STEP 2: total_price_incl_tax = 12735 × 4 nights × 1 room = 50940
  NEVER store just the base price (9896). Always add tax before multiplying.
- Goibibo: shows "₹2,214 + ₹498 taxes & fees per night"
  STEP 1: price_per_night_incl_tax = 2214 + 498 = 2712
  STEP 2: total_price_incl_tax = 2712 × nights × rooms
  On checkout: use the "Total Amount to be paid" line directly — do not recalculate.
- Booking.com: shows "₹4,800 for 4 nights" + "+₹1,947 taxes and fees"
  total_price_incl_tax = 4800 + 1947 = 6747 (already a total, do NOT multiply by nights again)
- Yatra: shows "₹5,070 + ₹303 taxes per room per night"
  price_per_night_incl_tax = 5070 + 303 = 5373
  total_price_incl_tax = 5373 × nights × rooms

ALWAYS PRE-TAX — taxes NOT shown on screen:
- Agoda: ALWAYS "Per night before taxes and fees" — total_price_paid: null, agoda_pretax_warning: true. Never guess tax.

PER NIGHT vs TOTAL — determine this BEFORE calculating:
- "For X Nights & Y Room with tax" → already TOTAL, do NOT multiply (MMT)
- "per night" / "per room per night" → multiply: price_per_night_incl_tax × nights × rooms
- "Price for X nights" → already TOTAL, do NOT multiply (Booking.com room table)
- Checkout pages: use the final "Total Amount" line — never recalculate from per-night

MANDATORY EXTRAS (city tax, tourism fee):
- Goibibo checkout shows "City Tax (AED 10) = ₹261 — Not included in room price" → add to total
- GRN shows tourism dirhams fee note → flag as extra, add if amount is visible
- Always note these in price_breakdown.mandatory_extras

LONG STAY DISCOUNTS:
- MMT sometimes shows "Long Stay Benefits: 20% off" — the displayed price already includes the discount. Use the discounted price shown.

═══════════════════════════════════════════════
STEP 4 — EXTRACTION BY DOCUMENT TYPE
═══════════════════════════════════════════════

TYPE A — confirmed_voucher:
Extract all fields. This is a COMPLETED booking with a reference number.

TYPE B — search_results:
Extract ALL hotels visible on screen as an array. CRITICAL: If you can see 2, 3, or more hotel cards on screen, you MUST extract ALL of them — not just the first one. Each hotel card typically shows hotel name, area/location, star rating, user rating, price, and sometimes free cancellation or breakfast badges.
Also extract search bar params.
For each hotel extract:
- hotel_name, area, stars, user_rating, free_cancellation, breakfast_included
- price_per_night_incl_tax: base price + taxes per night (e.g. Ixigo: 9896+2839=12735)
- total_price_incl_tax: price_per_night_incl_tax × nights × rooms (e.g. 12735×4×1=50940)
- agoda_pretax_warning: true only for Agoda
- price_note: show your calculation e.g. "(9896+2839)×4nights×1room=50940"

CRITICAL FOR SEARCH RESULTS PRICE: Always apply the tax logic from STEP 3. Never return just the base price without adding taxes for Ixigo/Goibibo/Yatra/Booking.com.

TYPE C — hotel_detail_top:
Extract hotel-level info + any featured room shown.
Get hotel_name from: page title → search bar field → breadcrumb → URL slug (parse hyphens to spaces, title-case).
PRICE on hotel_detail_top: MMT shows "Total Price: ₹33,571" on the right panel — this is the TOTAL for all nights. Extract it as total_price_incl_tax for the featured room. Also extract the room name shown (e.g. "Superior Room Twin Bed") as the featured room type.
Always extract the featured/highlighted room option shown on the hotel overview page — it typically shows in a panel on the right side with room name, price, and cancellation policy.

TYPE D — hotel_detail_rooms:
Extract hotel info + ALL room options visible.
Get hotel_name from: search bar field (Goibibo keeps hotel name there) → breadcrumb → page title → URL slug.
GRNConnect room pages: room name on left, board basis below name, cancellation policy shown in red "Non-Refundable" text, price per night on right (INCLUSIVE).
For each room option: room_type, option_name, board_basis (RO/BB/HB/FB/AI), board_basis_label, cancellation_policy, cancellation_deadline, price_per_night_incl_tax, total_price_incl_tax, agoda_pretax_warning, price_note.

TYPE E — checkout_page:
Richest data — extract everything:
- hotel_name, hotel_address, hotel_city, stars
- check_in, check_out, total_nights
- room_type, num_rooms
- num_adults, num_children, children_ages (Agoda checkout shows "Max: 2 adults, 1 child (0-10 years)" — extract this)
- board_basis, board_basis_label
- cancellation_policy, cancellation_deadline, cancellation_penalty
- price_breakdown: base, discount, taxes/GST, mandatory_extras, total
- total_price (use "Total Amount" / "Total Amount to be paid" line)
- payment_type: "pay_now" / "pay_at_property" / "pay_later" (Agoda shows "No payment until X date" = pay_later)
- agoda_pretax_warning (Agoda checkout still shows pre-tax — set true)
- booking_reference: null (not confirmed yet)
- GRNConnect checkout (Visa2Fly): shows "Booking Confirmation" title, hotel panel on right with all details, Amount in INR — treat as checkout_page NOT confirmed_voucher (no booking ref confirmed yet). Set booking_reference to the BID from URL if visible.
- Agoda checkout: hotel name is often NOT visible on the booking form screen (it's above the fold). If hotel name is not visible, set hotel_name: "" (empty string) — NOT "Unknown Hotel". The upload page will prompt the user to enter it manually.
- For city on Agoda checkout: look for city name in the URL (e.g. agoda.com/en-in/book/dubai → "Dubai"), or in any breadcrumb or address text visible on screen. If not found, set hotel_city: "".

TYPE F — not_hotel:
{"document_type": "not_hotel", "reason": "brief description"}

═══════════════════════════════════════════════
STEP 5 — CAMERA PHOTO HANDLING
═══════════════════════════════════════════════

Camera photos of screens are common. Handle:
- Angled shots: correct for perspective when reading text
- Glare/reflections: read around glare areas
- Partial visibility: extract what IS visible
- Only set extraction_quality "poor" if key fields (hotel name, dates) are genuinely unreadable
- Set extraction_quality "camera_photo" when image is clearly a photo of a screen
- Note in price_note if price was partially obscured by glare

═══════════════════════════════════════════════
STEP 6 — HOTEL NAME FROM URL
═══════════════════════════════════════════════

If hotel name not visible on screen (common on scrolled Ixigo/Hotels.com pages):
- Hotels.com: in.hotels.com/ho563112/hilton-garden-inn-dubai-mall-of-the-emirates → "Hilton Garden Inn Dubai Mall Of The Emirates"
- Booking.com: booking.com/hotel/ae/burjaman-metro-premium-holiday-homes.html → "Burjaman Metro Premium Holiday Homes"
- Agoda: agoda.com/en-in/seven-seas-hotel/hotel/dubai → "Seven Seas Hotel"
- Ixigo: use locationName parameter or page breadcrumb
- Goibibo: hotel name always in search bar at top
Set hotel_name_from_url: true when using this method.

═══════════════════════════════════════════════
STEP 7 — HOTEL ADDRESS
═══════════════════════════════════════════════

For hotel_address and hotel_city:
1. First try to read address from the screen (some OTAs show it below hotel name)
2. If address NOT visible on screen, use your knowledge to infer it from hotel name + city:
   - "Citymax Hotel Bur Dubai" → "Al Kuwait Street, Bur Dubai, Dubai, UAE"
   - "Hilton Garden Inn Dubai Mall Avenue" → "22nd St, Al Barsha, Dubai, UAE"
   - "Address Montgomerie" → "Emirates Hills, Dubai, UAE"
   - "Atlantis The Palm" → "Crescent Road, The Palm, Dubai, UAE"
   - "Seven Seas Hotel Dubai" → "Al Ittihad Road, Dubai International Airport, Dubai, UAE"
   - For any well-known hotel chain (Marriott, Hilton, Hyatt, IHG, Accor, Taj, Oberoi etc.) in a major city — infer the address from your training knowledge
   - For lesser-known hotels where you are not confident — leave hotel_address as null
3. Always extract hotel_city from: search bar destination, breadcrumb, address text, or URL
4. Never leave hotel_city blank if the destination is visible anywhere on screen

═══════════════════════════════════════════════
STEP 7 — CHILDREN
═══════════════════════════════════════════════

Always extract num_children and children_ages[].
- children_ages: array of numbers, one per child. 0 = infant under 1. Max 12.
- Booking.com search bar: "2 adults · 0 children · 1 room" — parse carefully
- Agoda checkout: "Max: 2 adults, 1 child (0-10 years)" — num_children: 1, children_ages: [] (age not specified)
- If children count shown but ages not: children_ages: []
- If "0 children": num_children: 0, children_ages: []

═══════════════════════════════════════════════
STEP 8 — OUTPUT FORMAT (JSON ONLY)
═══════════════════════════════════════════════

Respond ONLY with valid JSON. No markdown. No code fences. No explanation.

For confirmed_voucher and checkout_page:
{
  "document_type": "confirmed_voucher|checkout_page",
  "extraction_quality": "good|partial|poor|camera_photo",
  "ota_name": "MMT|Ixigo|Goibibo|Agoda|Hotels.com|Booking.com|Yatra|GRNConnect|TBO|Expedia|Direct|Other",
  "hotel_name": "",
  "hotel_name_from_url": false,
  "hotel_address": null,
  "hotel_city": "",
  "stars": null,
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "total_nights": 0,
  "room_type": null,
  "num_adults": 2,
  "num_children": 0,
  "children_ages": [],
  "num_rooms": 1,
  "board_basis": "RO",
  "board_basis_label": "Room Only",
  "rate_plan_name": null,
  "cancellation_policy": "free|partial|non-refundable|unknown",
  "cancellation_deadline": null,
  "cancellation_penalty": null,
  "payment_type": "pay_now|pay_at_property|pay_later",
  "amount_paid_upfront": 0,
  "total_price_paid": 0,
  "original_price": 0,
  "currency_original": "INR",
  "taxes_included": true,
  "agoda_pretax_warning": false,
  "price_breakdown": {
    "base_per_night": null,
    "discount": null,
    "taxes": null,
    "gst": null,
    "mandatory_extras": null,
    "total": 0,
    "rooms": 1,
    "nights": 0,
    "calculation_note": ""
  },
  "booking_reference": null,
  "multi_hotel": false
}

For search_results:
{
  "document_type": "search_results",
  "extraction_quality": "good|partial|poor|camera_photo",
  "ota_name": "",
  "destination": "",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "total_nights": 0,
  "num_rooms": 1,
  "num_adults": 2,
  "num_children": 0,
  "children_ages": [],
  "hotels": [
    {
      "hotel_name": "",
      "area": "",
      "stars": null,
      "user_rating": null,
      "free_cancellation": null,
      "breakfast_included": null,
      "price_per_night_incl_tax": null,
      "total_price_incl_tax": null,
      "agoda_pretax_warning": false,
      "price_note": ""
    }
  ]
}

For hotel_detail_top and hotel_detail_rooms:
{
  "document_type": "hotel_detail_top|hotel_detail_rooms",
  "extraction_quality": "good|partial|poor|camera_photo",
  "ota_name": "",
  "hotel_name": "",
  "hotel_name_from_url": false,
  "hotel_address": null,
  "hotel_city": "",
  "stars": null,
  "user_rating": null,
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "total_nights": 0,
  "num_rooms": 1,
  "num_adults": 2,
  "num_children": 0,
  "children_ages": [],
  "room_options": [
    {
      "room_type": "",
      "option_name": "",
      "board_basis": "RO",
      "board_basis_label": "Room Only",
      "cancellation_policy": "free|partial|non-refundable|unknown",
      "cancellation_deadline": null,
      "price_per_night_incl_tax": null,
      "total_price_incl_tax": null,
      "tax_per_night": null,
      "agoda_pretax_warning": false,
      "price_note": ""
    }
  ]
}

For not_hotel:
{"document_type": "not_hotel", "reason": ""}
`

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

function applyCurrencyConversion(extracted) {
  const currency = extracted.currency_original || 'INR'
  const rate = RATES_TO_INR[currency] || 1
  if (currency === 'INR' || rate === 1) return
  if (extracted.original_price)       extracted.original_price       = Math.round(extracted.original_price * rate)
  if (extracted.total_price_paid)     extracted.total_price_paid     = Math.round(extracted.total_price_paid * rate)
  if (extracted.amount_paid_upfront)  extracted.amount_paid_upfront  = Math.round(extracted.amount_paid_upfront * rate)
  if (extracted.cancellation_penalty) extracted.cancellation_penalty = Math.round(extracted.cancellation_penalty * rate)
  if (extracted.price_breakdown) {
    const pb = extracted.price_breakdown
    if (pb.base_per_night)     pb.base_per_night     = Math.round(pb.base_per_night * rate)
    if (pb.taxes)              pb.taxes              = Math.round(pb.taxes * rate)
    if (pb.gst)                pb.gst                = Math.round(pb.gst * rate)
    if (pb.mandatory_extras)   pb.mandatory_extras   = Math.round(pb.mandatory_extras * rate)
    if (pb.total)              pb.total              = Math.round(pb.total * rate)
  }
}

function calculateMissingFields(extracted) {
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
  if (extracted.payment_type === 'pay_at_property') {
    extracted.total_price_paid = extracted.amount_paid_upfront || 0
  }
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
        max_tokens: 2000,
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
    const docType   = extracted.document_type

    // ── NOT A HOTEL ───────────────────────────────────────────────────────────
    if (docType === 'not_hotel') {
      console.log(`❌ Not hotel: ${extracted.reason}`)
      return res.json({
        success: false, blocked: true, blockReason: 'not_hotel',
        reason: extracted.reason,
        message: 'This does not appear to be a hotel booking or search page.'
      })
    }

    // ── POOR QUALITY ──────────────────────────────────────────────────────────
    if (extracted.extraction_quality === 'poor') {
      return res.json({
        success: false, blocked: true, blockReason: 'poor_quality',
        message: "We couldn't read your document clearly. Please upload a clearer image or PDF.",
        canManualEntry: true
      })
    }

    // ── SEARCH RESULTS ────────────────────────────────────────────────────────
    if (docType === 'search_results') {
      console.log(`🔍 Search results: ${extracted.ota_name} | ${extracted.destination} | ${extracted.hotels?.length} hotels`)
      return res.json({
        success: true,
        documentType: 'search_results',
        data: extracted,
        requiresHotelSelection: true,
        message: `Found ${extracted.hotels?.length || 0} hotels — select the one you want to monitor.`
      })
    }

    // ── HOTEL DETAIL (TOP OR ROOMS) ───────────────────────────────────────────
    if (docType === 'hotel_detail_top' || docType === 'hotel_detail_rooms') {
      const hasRooms = extracted.room_options?.length > 0
      console.log(`🏨 Hotel detail: ${extracted.hotel_name} | ${extracted.room_options?.length || 0} room options`)
      return res.json({
        success: true,
        documentType: docType,
        data: extracted,
        requiresRoomSelection: hasRooms,
        message: hasRooms
          ? `Found ${extracted.room_options.length} room option(s) — select the one you want to monitor.`
          : `Hotel page detected. Scroll to the rooms section and upload again, or enter room details manually.`
      })
    }

    // ── CHECKOUT PAGE ─────────────────────────────────────────────────────────
    if (docType === 'checkout_page') {
      applyCurrencyConversion(extracted)
      calculateMissingFields(extracted)
      console.log(`💳 Checkout: ${extracted.hotel_name} | ${extracted.ota_name} | ₹${extracted.total_price_paid}`)
      return res.json({
        success: true,
        documentType: 'checkout_page',
        data: extracted,
        agodaPretaxWarning: extracted.agoda_pretax_warning === true,
        message: extracted.agoda_pretax_warning
          ? "Agoda shows prices before taxes. Please enter the total amount you'll pay after taxes."
          : 'Checkout page detected — please confirm details and we\'ll start monitoring once you complete your booking.'
      })
    }

    // ── CONFIRMED VOUCHER ─────────────────────────────────────────────────────
    if (docType === 'confirmed_voucher') {
      applyCurrencyConversion(extracted)
      calculateMissingFields(extracted)

      // Check-in already passed
      if (extracted.check_in) {
        const today = new Date(); today.setHours(0,0,0,0)
        const daysUntil = Math.round((new Date(extracted.check_in) - today) / 86400000)
        if (daysUntil < 0) {
          return res.json({
            success: false, blocked: true, blockReason: 'checkin_passed',
            message: `Check-in date (${extracted.check_in}) has already passed. Nothing to monitor.`,
            data: extracted
          })
        }
        if (daysUntil <= 1) { extracted._warning = 'checkin_soon'; extracted._warningDays = daysUntil }
      }

      const isNonRefundable = extracted.cancellation_policy === 'non-refundable'
      console.log(`✅ Voucher: ${extracted.hotel_name} | ${extracted.ota_name} | ${extracted.cancellation_policy} | ₹${extracted.total_price_paid}`)

      return res.json({
        success: true,
        documentType: 'confirmed_voucher',
        data: extracted,
        blocked: isNonRefundable,
        blockReason: isNonRefundable ? 'non_refundable' : null,
        agodaPretaxWarning: extracted.agoda_pretax_warning === true,
        warnings: {
          partialExtraction: extracted.extraction_quality === 'partial',
          cameraPhoto:       extracted.extraction_quality === 'camera_photo',
          multiHotel:        extracted.multi_hotel === true,
          checkInSoon:       extracted._warning === 'checkin_soon',
          checkInSoonDays:   extracted._warningDays || null,
          payAtProperty:     extracted.payment_type === 'pay_at_property',
          unknownPolicy:     extracted.cancellation_policy === 'unknown',
          agodaPretax:       extracted.agoda_pretax_warning === true,
          currencyConverted: (extracted.currency_original || 'INR') !== 'INR',
          originalCurrency:  (extracted.currency_original || 'INR') !== 'INR' ? extracted.currency_original : null,
        }
      })
    }

    return res.json({ success: false, blocked: true, blockReason: 'unknown_type', message: 'Unrecognised document type.' })

  } catch (err) {
    console.error('❌ Extract error:', err.message)
    if (err instanceof SyntaxError) {
      return res.json({
        success: false, blocked: true, blockReason: 'parse_error',
        message: "Couldn't read the details. Please try a clearer image or PDF.",
        canManualEntry: true
      })
    }
    res.status(500).json({ error: 'Failed to extract details', details: err.message })
  }
})

// ── POST /api/voucher/submit ──────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const data  = req.body
    const phone = data.phone || data.whatsapp
    if (!phone) return res.status(400).json({ error: 'Phone number required' })

    // Block non-refundable confirmed bookings
    if (data.cancellation_policy === 'non-refundable' && data.documentType === 'confirmed_voucher') {
      await supabase.from('bookings').insert(buildBookingRow(data, 'non-refundable'))
      await sendNonRefundableWhatsApp(phone, data)
      if (email && data.email) {
        email.nonRefundable?.(data.email, { name: data.email.split('@')[0], booking: { hotelName: data.hotel_name, checkinDate: data.check_in } })
          .catch(e => console.error('Email failed:', e.message))
      }
      return res.json({
        success: false, blocked: true, reason: 'non_refundable',
        message: 'This booking is non-refundable. Customer notified via WhatsApp.',
      })
    }

    // Check-in passed
    if (data.check_in) {
      const today = new Date(); today.setHours(0,0,0,0)
      if (Math.round((new Date(data.check_in) - today) / 86400000) < 0) {
        return res.status(400).json({ error: 'Check-in date has already passed.' })
      }
    }

    // Duplicate check (only for confirmed vouchers)
    if (data.documentType === 'confirmed_voucher') {
      const { data: existing } = await supabase
        .from('bookings').select('id')
        .eq('phone', phone).eq('hotel_name', data.hotel_name).eq('check_in', data.check_in)
        .single()
      if (existing) {
        await sendDuplicateWhatsApp(phone, data)
        return res.json({ success: false, blocked: false, reason: 'duplicate', message: 'Already tracking this booking.', booking_id: existing.id })
      }
    }

    // Unknown policy warning (confirmed vouchers only)
    if (data.cancellation_policy === 'unknown' && data.documentType === 'confirmed_voucher') {
      await sendUnknownPolicyWhatsApp(phone, data)
    }

    // Check-in soon warning
    if (data.check_in) {
      const today = new Date(); today.setHours(0,0,0,0)
      const daysUntil = Math.round((new Date(data.check_in) - today) / 86400000)
      if (daysUntil <= 1) {
        const { data: booking, error } = await supabase.from('bookings').insert(buildBookingRow(data, 'tracking')).select().single()
        if (error) throw error
        await sendCheckInSoonWhatsApp(phone, data, daysUntil)
        if (email && booking.email) email.bookingReceived?.(booking.email, buildEmailPayload(booking)).catch(e => console.error('Email failed:', e.message))
        return res.json({ success: true, booking_id: booking.id, warning: 'checkin_soon' })
      }
    }

    // Save and track
    const { data: booking, error } = await supabase.from('bookings').insert(buildBookingRow(data, 'tracking')).select().single()
    if (error) throw error

    sendTrackingStartedWhatsApp(phone, booking).catch(e => console.error('WhatsApp failed:', e.message))
    if (email && booking.email) email.bookingReceived?.(booking.email, buildEmailPayload(booking)).catch(e => console.error('Email failed:', e.message))

    res.json({ success: true, booking_id: booking.id })

  } catch (err) {
    console.error('❌ Submit error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function buildBookingRow(data, status) {
  const nights = data.total_nights ||
    (data.check_in && data.check_out ? Math.round((new Date(data.check_out) - new Date(data.check_in)) / 86400000) : 1)
  const totalPaid = data.total_price_paid || data.original_price || 0
  const perNight  = data.price_per_night || (totalPaid && nights > 0 ? Math.round(totalPaid / (nights * (data.num_rooms || 1))) : 0)
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
    document_type:         data.documentType          || 'confirmed_voucher',
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

// ── WhatsApp helpers ──────────────────────────────────────────────────────────
const twilio = require('twilio')

function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN)
}

async function sendWhatsApp(to, body) {
  const client    = getTwilioClient()
  const formatted = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`
  const rawFrom   = process.env.TWILIO_WHATSAPP_FROM || '+14155238886'
  const from      = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`
  const timeout   = new Promise((_, reject) => setTimeout(() => reject(new Error('Twilio timeout')), 10000))
  await Promise.race([client.messages.create({ from, to: formatted, body }), timeout])
}

async function sendNonRefundableWhatsApp(phone, data) {
  const totalPaid = data.total_price_paid ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}` : 'amount on voucher'
  const msg = `Hi! Thanks for uploading your booking to rebuq. 🙏

*${data.hotel_name}*
📍 ${data.hotel_city || '—'}
📅 ${data.check_in} → ${data.check_out}
💳 Total paid: ${totalPaid}

❌ *We can't track this booking.*

Your booking is *non-refundable* — even if the price drops, you can't cancel and rebook to save.

Next time, book a cancellable rate — rebuq regularly finds drops of ₹10,000–₹40,000 that more than cover any price difference.

— Team rebuq`
  try { await sendWhatsApp(phone, msg) } catch (e) { console.error('WA failed:', e.message) }
}

async function sendUnknownPolicyWhatsApp(phone, data) {
  const msg = `Hi! Your booking has been added to rebuq. ⚠️

*${data.hotel_name}, ${data.hotel_city || '—'}*

We couldn't clearly read your *cancellation policy*. Please reply:
1️⃣ → Free cancellation
2️⃣ → Non-refundable
3️⃣ → Partial refund

— Team rebuq`
  try { await sendWhatsApp(phone, msg) } catch (e) { console.error('WA failed:', e.message) }
}

async function sendDuplicateWhatsApp(phone, data) {
  const msg = `Hi! We noticed you uploaded *${data.hotel_name}* (${data.check_in}) again.

✅ This booking is *already being tracked* by rebuq!

We're checking prices every 6 hours. Reply *STATUS* to check your monitors.
— Team rebuq`
  try { await sendWhatsApp(phone, msg) } catch (e) { console.error('WA failed:', e.message) }
}

async function sendCheckInSoonWhatsApp(phone, data, daysUntil) {
  const totalPaid = data.total_price_paid ? `₹${Number(data.total_price_paid).toLocaleString('en-IN')}` : '—'
  const timing    = daysUntil === 0 ? 'today' : 'tomorrow'
  const msg = `Hi! We've added your booking to rebuq. ⚠️

*${data.hotel_name}, ${data.hotel_city || '—'}*
📅 Check-in: *${timing}* (${data.check_in})
💳 Total: ${totalPaid}

⚠️ Check-in is very soon — window to rebook is tight. We'll scan immediately and alert you if we find anything.
— Team rebuq`
  try { await sendWhatsApp(phone, msg) } catch (e) { console.error('WA failed:', e.message) }
}

async function sendTrackingStartedWhatsApp(phone, booking) {
  const nights = booking.total_nights || '?'
  const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d } }
  const children = (booking.children_ages && booking.children_ages.length > 0)
    ? booking.children_ages.map(a => a === 0 ? 'infant' : `${a} yrs`).join(', ')
    : 'None'
  const cancelLine = booking.cancellation_policy === 'free' && booking.cancellation_deadline
    ? `Free cancel until   ${fmt(booking.cancellation_deadline)}`
    : booking.cancellation_policy === 'partial'
    ? `Cancellation        Partial refund applies`
    : `Cancellation        ${booking.cancellation_policy || 'unknown'}`
  const meal = booking.board_basis_label ? `\nMeal plan           ${booking.board_basis_label}` : ''

  const msg = `Thank you for trusting rebuq with your booking.

*${booking.hotel_name}*
${booking.hotel_city}

Check-in    ${fmt(booking.check_in)}
Check-out   ${fmt(booking.check_out)}
Room        ${booking.room_type || 'Standard Room'}  ·  ${booking.num_rooms || 1} Room
Adults      ${booking.num_adults || 2}
Children    ${children}${meal}
Total paid  ₹${Number(booking.total_price_paid || booking.original_price || 0).toLocaleString('en-IN')}
${cancelLine}

We're watching the price around the clock. The moment it drops for the same room and meal plan, we'll send you a direct link to rebook and save.

Questions? Reply to this message.

rebuq`
  try { await sendWhatsApp(phone, msg) } catch (e) { console.error('WA failed:', e.message) }
}

module.exports = router
