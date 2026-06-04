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
  '',
  'Analyse the provided image/document and extract structured hotel booking data.',
  '',
  '## DOCUMENT TYPES — identify which one this is:',
  '1. confirmed_voucher — A confirmed hotel booking confirmation (has booking reference, confirmation number, guest name already filled in)',
  '2. search_results — A hotel search results page showing multiple hotels with prices',
  '3. hotel_detail_top — A hotel detail page showing hotel info but NOT a list of room options yet',
  '4. hotel_detail_rooms — A hotel detail page showing a list of room options/rate plans to choose from',
  '5. checkout_page — A checkout/payment page for a specific room (almost booked, shows final price, OR guest name fields still empty/unfilled)',
  '6. not_hotel — Not a hotel booking document (flight, train, restaurant, etc.)',
  '',
  '## OTA IDENTIFICATION:',
  '- GRNConnect pages: URL contains grnconnect.com, logo says VISA2FLY or GRNConnect, booking reference starts with BID-',
  '- If page is from grnconnect.com with empty guest name/PAN fields still blank: documentType = checkout_page, ota_name = GRNConnect',
  '- If page is from grnconnect.com with guest name already filled: documentType = confirmed_voucher, ota_name = GRNConnect',
  '- NEVER classify a GRNConnect page as MakeMyTrip',
  '',
  '## OTA-SPECIFIC TAX RULES (apply exactly):',
  '- MakeMyTrip (MMT): Always tax-inclusive. Use displayed total directly.',
  '- Hotels.com / in.hotels.com: Always INR even if accessed from UAE. Always tax-inclusive.',
  '- GRNConnect / TBO: Always tax-inclusive. Room listing prices are TOTAL for entire stay — divide by num_nights for per-night rate.',
  '- Booking.com: Usually tax-inclusive for Indian users.',
  '- Ixigo / Goibibo / Yatra: Show base + taxes SEPARATELY. Add (base + tax) x nights x rooms = total_price_paid. Example: (9896+2839)x4x1=50940',
  '- Agoda: ALWAYS pre-tax. Set total_price_paid = null, agoda_pretax_warning = true.',
  '- Expedia: Usually tax-inclusive.',
  '- Direct hotel websites: Usually tax-inclusive.',
  '',
  '## PRICE RULES:',
  '- Extract TOTAL price for entire stay (all nights x all rooms)',
  '- If only per-night price visible: multiply by num_nights x num_rooms',
  '- For search results: extract price_per_night_incl_tax per hotel',
  '- For GRN room listings: prices shown are total-stay — divide by nights to get per-night',
  '- Convert foreign currency to INR: AED x22.5, USD x83, EUR x90, GBP x105, SGD x62, THB x2.3',
  '- Set currency_original to original currency code',
  '',
  '## HOTEL ADDRESS:',
  'If not visible, infer from your knowledge of well-known hotel chains (Taj, Marriott, Hyatt, ITC, Oberoi, etc.)',
  '',
  '## CHILDREN:',
  'Always extract num_children and children_ages array. Ages 0-12 (0 = infant).',
  '',
  '## RETURN JSON FOR EACH TYPE:',
  '',
  'confirmed_voucher or checkout_page:',
  '{',
  '  "documentType": "confirmed_voucher",',
  '  "success": true,',
  '  "data": {',
  '    "hotel_name": "string",',
  '    "hotel_city": "string",',
  '    "hotel_address": "string or null",',
  '    "check_in": "YYYY-MM-DD",',
  '    "check_out": "YYYY-MM-DD",',
  '    "total_nights": number,',
  '    "num_rooms": number,',
  '    "num_adults": number,',
  '    "num_children": number,',
  '    "children_ages": [],',
  '    "room_type": "string or null",',
  '    "board_basis": "RO|BB|HB|FB|AI",',
  '    "board_basis_label": "Room Only|Bed & Breakfast|Half Board|Full Board|All Inclusive",',
  '    "rate_plan_name": "string or null",',
  '    "ota_name": "MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Ixigo|Yatra|GRNConnect|TBO|Direct|Other",',
  '    "booking_reference": "string or null",',
  '    "total_price_paid": number or null,',
  '    "currency_original": "INR|USD|AED|EUR|GBP|SGD|THB",',
  '    "cancellation_policy": "free|partial|non-refundable|unknown",',
  '    "cancellation_deadline": "YYYY-MM-DD or null",',
  '    "cancellation_penalty": number or null,',
  '    "payment_type": "pay_now|pay_at_property|partial",',
  '    "amount_paid_upfront": number,',
  '    "agoda_pretax_warning": false',
  '  }',
  '}',
  '',
  'search_results:',
  '{',
  '  "documentType": "search_results",',
  '  "success": true,',
  '  "data": {',
  '    "ota_name": "string",',
  '    "destination": "string",',
  '    "check_in": "YYYY-MM-DD",',
  '    "check_out": "YYYY-MM-DD",',
  '    "total_nights": number,',
  '    "num_adults": number,',
  '    "num_children": number,',
  '    "children_ages": [],',
  '    "num_rooms": number,',
  '    "hotels": [{"hotel_name":"string","area":"string or null","stars":number,"price_per_night_incl_tax":number,"total_price_incl_tax":number,"free_cancellation":boolean,"rating":number}]',
  '  }',
  '}',
  '',
  'hotel_detail_rooms:',
  '{',
  '  "documentType": "hotel_detail_rooms",',
  '  "success": true,',
  '  "data": {',
  '    "hotel_name": "string",',
  '    "hotel_city": "string",',
  '    "hotel_address": "string or null",',
  '    "ota_name": "string",',
  '    "check_in": "YYYY-MM-DD or null",',
  '    "check_out": "YYYY-MM-DD or null",',
  '    "total_nights": number or null,',
  '    "num_adults": number or null,',
  '    "num_children": number,',
  '    "children_ages": [],',
  '    "num_rooms": number or null,',
  '    "room_options": [{"room_type":"string","option_name":"string","board_basis":"RO","board_basis_label":"string","cancellation_policy":"free|partial|non-refundable|unknown","cancellation_deadline":"YYYY-MM-DD or null","price_per_night_incl_tax":number,"total_price_incl_tax":number}]',
  '  }',
  '}',
  '',
  'hotel_detail_top: same as hotel_detail_rooms but room_options = []',
  '',
  'not_hotel: {"documentType":"not_hotel","success":false,"blocked":true,"blockReason":"not_hotel","message":"This does not appear to be a hotel booking document."}',
  '',
  'IMPORTANT:',
  '- Return ONLY valid JSON, no markdown, no explanation',
  '- IMPORTANT: Only return poor_quality if the image is completely unreadable (totally black, totally white, or no text visible at all). Do NOT return poor_quality for slightly blurry, dark, or low-resolution images — instead try your best to extract whatever you can and set partialExtraction:true if some fields are missing. Camera photos of screens, screenshots, and PDF pages are all acceptable even if not perfectly sharp.',
  '- Hotel doc with missing fields: set partialExtraction:true in warnings',
  '- GRN Tripadvisor rating: IGNORE it',
  '- Hotels.com: always INR',
  '- GRNConnect confirmation page (grnconnect.com URL, Visa2Fly branding, BID- reference): ota_name = GRNConnect NOT MakeMyTrip',
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
