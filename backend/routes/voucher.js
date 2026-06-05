const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const EXTRACTION_PROMPT = [
  'You are an expert hotel booking data extractor for rebuq.com, an Indian hotel price tracking service.',
  'You will receive images that may be: screenshots, camera photos of laptop/desktop screens, phone screen photos, PDFs, or email confirmations.',
  'Camera photos may have glare, reflections, slight blur, or angle distortion — extract whatever you can read. Do NOT return poor_quality unless the image is completely black, white, or unreadable.',
  '',
  '## DOCUMENT TYPES:',
  '1. confirmed_voucher — Confirmed booking with booking reference, confirmation number, guest name already filled in',
  '2. search_results — Hotel search results page showing multiple hotels with prices',
  '3. hotel_detail_top — Hotel detail page showing overview/amenities but NOT room options yet',
  '4. hotel_detail_rooms — Hotel detail page showing room options/rate plans to select from',
  '5. checkout_page — Checkout/payment page for a specific room (guest name fields may be empty/unfilled)',
  '6. not_hotel — Not a hotel document (flight, train, restaurant, etc.)',
  '',
  '## OTA IDENTIFICATION — read the URL bar, logo, or page design:',
  '- makemytrip.com → MakeMyTrip',
  '- booking.com → Booking.com',
  '- agoda.com → Agoda',
  '- goibibo.com → Goibibo',
  '- hotels.com or in.hotels.com → Hotels.com',
  '- expedia.com → Expedia',
  '- ixigo.com → Ixigo',
  '- yatra.com → Yatra',
  '- grnconnect.com or Visa2Fly logo → GRNConnect',
  '- tbo.com → TBO',
  '- GRNConnect page classification (READ CAREFULLY):',
  '  * If page shows "BOOK ROOM" buttons next to room types with prices → hotel_detail_rooms (NOT confirmed_voucher)',
  '  * If page shows "HIDE ROOMS" or multiple hotel cards → search_results or hotel_detail_rooms',
  '  * If page shows "Booking Confirmation" title BUT guest name/PAN fields are EMPTY → checkout_page',
  '  * If page shows "Booking Confirmation" title AND guest name is FILLED IN → confirmed_voucher',
  '  * NEVER classify a GRN page with "BOOK ROOM" buttons as confirmed_voucher',
  '  * NEVER classify any GRN page as MakeMyTrip',
  '',
  '## HOTEL NAME FROM URL:',
  'If hotel name is not visible on screen, read it from the URL bar.',
  'Examples: hilton-garden-inn-dubai-mall → "Hilton Garden Inn Dubai Mall", gevora-hotel-world → "Gevora Hotel"',
  '',
  '## OTA-SPECIFIC TAX RULES — apply exactly:',
  '- MakeMyTrip: Prices ALWAYS tax-inclusive. Use displayed total directly. "For X Nights" total = use as-is.',
  '- Hotels.com / in.hotels.com: ALWAYS INR even if accessed from UAE. Always tax-inclusive. Use displayed total.',
  '- GRNConnect / TBO: Always tax-inclusive. Room listing prices shown as plain numbers like "3151 INR", "3474 INR" — these are TOTAL for entire stay.',
  '  Divide by num_nights to get price_per_night_incl_tax. Always extract ALL room prices visible on GRN pages.',
  '- Booking.com: Tax-inclusive for Indian users. Use displayed total.',
  '- Ixigo: Shows base + taxes SEPARATELY per night per room. Formula: (base + tax) × nights × rooms.',
  '  Example: ₹9,896 base + ₹2,839 taxes × 4 nights × 1 room = ₹50,940',
  '- Goibibo: Same as Ixigo — base + taxes shown separately. Formula: (base + tax) × nights × rooms.',
  '  Example: ₹2,214 + ₹498 × 1 night × 1 room = ₹2,712',
  '- Yatra: Shows base + taxes separately. Formula: (base + tax) × nights × rooms.',
  '  Example: ₹5,070 + ₹303 × 1 night × 1 room = ₹5,373',
  '- Agoda: ALWAYS pre-tax prices. Set total_price_paid = null, agoda_pretax_warning = true.',
  '- Expedia: Tax-inclusive. Use displayed total.',
  '',
  '## PRICE EXTRACTION RULES:',
  '- Extract TOTAL price for entire stay (all nights × all rooms)',
  '- If only per-night price visible: multiply by num_nights × num_rooms',
  '- For search results: extract price_per_night_incl_tax per hotel (apply OTA tax rules above)',
  '- For GRN room listings: prices shown are TOTAL for entire stay — divide by num_nights for per-night rate',
  '- For Booking.com room tables: price shown is for X nights total, taxes shown separately — ADD them',
  '- Currency conversion to INR: AED×22.5, USD×83, EUR×90, GBP×105, SGD×62, THB×2.3',
  '- Set currency_original to original currency code',
  '',
  '## SEARCH RESULTS — extract ALL visible hotels:',
  'Extract every hotel card visible on screen as a separate entry in the hotels array.',
  'For each hotel: hotel_name, area/location, stars, price_per_night_incl_tax (after applying tax rules), free_cancellation flag.',
  'If price shown is total for stay, divide by nights to get per-night.',
  '',
  '## ROOM OPTIONS — extract ALL visible room options:',
  'Extract every room option/rate plan visible as a separate entry in room_options array.',
  'For each room: room_type, option_name, board_basis, cancellation_policy, price_per_night_incl_tax, total_price_incl_tax.',
  '',
  '## CANCELLATION POLICY DETECTION:',
  '- "Free Cancellation", "Fully refundable", "Free cancel" → free',
  '- "Non-Refundable", "Non Refundable", "No refund" → non-refundable',
  '- "Partially Refundable" → partial',
  '- Not mentioned or unclear → unknown',
  '',
  '## CHILDREN:',
  'Extract num_children and children_ages array. Ages 0-12 (0 = infant/under 1).',
  'GRN pages show search summary like: "We found X hotel(s)...Adult(s): 2, Child(s): 1" — always read Child(s) value from this header.',
  'If Child(s): 1 or more, set num_children accordingly. Children ages may not be visible — leave children_ages as empty array in that case.',
  '',
  '## HOTEL ADDRESS:',
  'If not visible, infer from your knowledge of the hotel name/chain.',
  '',
  '## JSON OUTPUT — return ONLY valid JSON, no markdown:',
  '',
  'confirmed_voucher or checkout_page:',
  '{"documentType":"confirmed_voucher","success":true,"data":{"hotel_name":"string","hotel_city":"string","hotel_address":"string or null","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","total_nights":number,"num_rooms":number,"num_adults":number,"num_children":number,"children_ages":[],"room_type":"string or null","board_basis":"RO|BB|HB|FB|AI","board_basis_label":"string","rate_plan_name":"string or null","ota_name":"MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Ixigo|Yatra|GRNConnect|TBO|Direct|Other","booking_reference":"string or null","total_price_paid":number or null,"currency_original":"INR|USD|AED|EUR|GBP|SGD|THB","cancellation_policy":"free|partial|non-refundable|unknown","cancellation_deadline":"YYYY-MM-DD or null","cancellation_penalty":number or null,"payment_type":"pay_now|pay_at_property|partial","amount_paid_upfront":number,"agoda_pretax_warning":false}}',
  '',
  'search_results:',
  '{"documentType":"search_results","success":true,"data":{"ota_name":"string","destination":"string","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","total_nights":number,"num_adults":number,"num_children":number,"children_ages":[],"num_rooms":number,"hotels":[{"hotel_name":"string","area":"string or null","stars":number or null,"price_per_night_incl_tax":number or null,"total_price_incl_tax":number or null,"free_cancellation":boolean,"rating":number or null}]}}',
  '',
  'hotel_detail_rooms:',
  '{"documentType":"hotel_detail_rooms","success":true,"data":{"hotel_name":"string","hotel_city":"string","hotel_address":"string or null","ota_name":"string","check_in":"YYYY-MM-DD or null","check_out":"YYYY-MM-DD or null","total_nights":number or null,"num_adults":number or null,"num_children":number,"children_ages":[],"num_rooms":number or null,"room_options":[{"room_type":"string","option_name":"string or null","board_basis":"RO|BB|HB|FB|AI","board_basis_label":"string","cancellation_policy":"free|partial|non-refundable|unknown","cancellation_deadline":"YYYY-MM-DD or null","price_per_night_incl_tax":number or null,"total_price_incl_tax":number or null}]}}',
  '',
  'hotel_detail_top: same structure as hotel_detail_rooms but room_options = []',
  '',
  'not_hotel: {"documentType":"not_hotel","success":false,"blocked":true,"blockReason":"not_hotel","message":"This does not appear to be a hotel booking document."}',
  '',
  '## IMPORTANT RULES:',
  '- Return ONLY valid JSON. No markdown, no explanation, no preamble.',
  '- Camera photos of screens: extract despite glare/angle/reflection. Try your absolute best.',
  '- Only return poor_quality if image is completely unreadable (totally black/white/blank).',
  '- If hotel doc with some missing fields: return what you can, set partialExtraction:true in warnings.',
  '- GRN Tripadvisor rating: IGNORE — it is GRN internal rating, not the actual hotel rating.',
  '- Hotels.com: always INR regardless of country of access.',
  '- GRNConnect (grnconnect.com, Visa2Fly branding, BID- reference): ota_name = GRNConnect NOT MakeMyTrip.',
  '- Agoda: never set a price — always null with agoda_pretax_warning:true.',
  '- Ixigo/Goibibo/Yatra: ALWAYS add base + taxes before multiplying by nights and rooms.',
].join('\n');

async function callClaude(fileBuffer, mimeType) {
  const isPDF = mimeType === 'application/pdf';
  const fileContent = isPDF
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBuffer.toString('base64') } }
    : { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBuffer.toString('base64') } };

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [fileContent, { type: 'text', text: EXTRACTION_PROMPT }] }],
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 55000,
    }
  );
  return response.data.content[0]?.text || '';
}

function getDaysDiff(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function buildWarnings(data, docType) {
  const warnings = {
    partialExtraction: false,
    currencyConverted: false,
    originalCurrency: null,
    agodaPretax: false,
    checkInSoon: false,
    checkInSoonDays: null,
    payAtProperty: false,
    unknownPolicy: false,
    multiHotel: false,
  };
  if (docType === 'confirmed_voucher' || docType === 'checkout_page') {
    if (!data.hotel_name || !data.check_in || !data.check_out) warnings.partialExtraction = true;
    if (data.currency_original && data.currency_original !== 'INR') {
      warnings.currencyConverted = true;
      warnings.originalCurrency = data.currency_original;
    }
    if (data.agoda_pretax_warning) warnings.agodaPretax = true;
    if (data.payment_type === 'pay_at_property') warnings.payAtProperty = true;
    if (data.cancellation_policy === 'unknown') warnings.unknownPolicy = true;
    const days = getDaysDiff(data.check_in);
    if (days !== null && days <= 1 && days >= 0) {
      warnings.checkInSoon = true;
      warnings.checkInSoonDays = days;
    }
  }
  return warnings;
}

router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const file = req.file;
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, error: 'File must be an image or PDF' });
    }

    const rawText = await callClaude(file.buffer, file.mimetype);

    let parsed;
    // Step 1: try raw; Step 2: strip markdown; Step 3: find first { to last }
    const rawTrimmed = rawText.trim();
    try { parsed = JSON.parse(rawTrimmed); }
    catch(e1) {
      try {
        const stripped = rawTrimmed.replace(/^```[a-z]*\s*/m, '').replace(/\s*```\s*$/m, '').trim();
        parsed = JSON.parse(stripped);
      } catch(e2) {
        try {
          const start = rawTrimmed.indexOf('{');
          const end = rawTrimmed.lastIndexOf('}');
          if (start !== -1 && end !== -1) parsed = JSON.parse(rawTrimmed.slice(start, end+1));
        } catch(e3) { parsed = null; }
      }
    }
    if (!parsed) {
      return res.json({ success: false, blocked: true, blockReason: 'parse_error', message: 'Could not understand the document. Please try a clearer image or enter details manually.' });
    }

    if (parsed.blocked) return res.json(parsed);

    const docType = parsed.documentType;

    if (docType === 'confirmed_voucher' && parsed.data) {
      // Block non-refundable confirmed vouchers
      if (parsed.data.cancellation_policy === 'non-refundable') {
        return res.json({
          success: false, blocked: true, blockReason: 'non_refundable',
          message: 'This booking is non-refundable.',
          data: parsed.data,
        });
      }
      // Block if check-in already passed
      if (parsed.data.check_in) {
        const days = getDaysDiff(parsed.data.check_in);
        if (days !== null && days < 0) {
          return res.json({
            success: false, blocked: true, blockReason: 'checkin_passed',
            message: 'This booking has already checked in or ended.',
            data: parsed.data,
          });
        }
      }
    }

    const warnings = buildWarnings(parsed.data || {}, docType);
    return res.json({ ...parsed, warnings });

  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({
      success: false, blocked: true, blockReason: 'server_error',
      message: 'Server error. Please try again.',
    });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const {
      hotel_name, hotel_city, hotel_address,
      check_in, check_out, total_nights,
      num_rooms, num_adults, num_children, children_ages,
      room_type, board_basis, board_basis_label, rate_plan_name,
      ota_name, booking_reference,
      total_price_paid, currency_original,
      cancellation_policy, cancellation_deadline, cancellation_penalty,
      payment_type, amount_paid_upfront,
      phone, email,
    } = req.body;

    if (!hotel_name || !check_in || !check_out || !phone || !email) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (cancellation_policy === 'non-refundable') {
      return res.json({ success: false, blocked: true, reason: 'non_refundable', message: 'Non-refundable bookings cannot be tracked.' });
    }

    const { data: existing } = await supabase
      .from('bookings').select('id')
      .eq('phone', phone).eq('hotel_name', hotel_name).eq('check_in', check_in).limit(1);

    if (existing && existing.length > 0) {
      return res.json({ success: false, blocked: true, reason: 'duplicate', message: 'You are already tracking this booking.' });
    }

    const nights = total_nights || (check_in && check_out
      ? Math.max(1, Math.floor((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24))) : 1);
    const rooms = num_rooms || 1;
    const price_per_night = total_price_paid ? Math.round(total_price_paid / nights / rooms) : null;

    const { data: booking, error } = await supabase.from('bookings').insert({
      hotel_name, hotel_city,
      hotel_address: hotel_address || null,
      check_in, check_out,
      total_nights: nights, num_rooms: rooms,
      num_adults: num_adults || 2,
      num_children: num_children || 0,
      children_ages: children_ages || [],
      room_type: room_type || null,
      board_basis: board_basis || 'RO',
      board_basis_label: board_basis_label || 'Room Only',
      rate_plan_name: rate_plan_name || null,
      ota_name: ota_name || 'Other',
      booking_reference: booking_reference || null,
      original_price: total_price_paid || null,
      total_price_paid: total_price_paid || null,
      price_per_night,
      currency_original: currency_original || 'INR',
      cancellation_policy: cancellation_policy || 'unknown',
      cancellation_deadline: cancellation_deadline || null,
      cancellation_penalty: cancellation_penalty || null,
      payment_type: payment_type || 'pay_now',
      amount_paid_upfront: amount_paid_upfront || 0,
      phone, email,
      status: 'active',
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save booking' });
    }

    return res.json({ success: true, booking_id: booking.id });

  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
