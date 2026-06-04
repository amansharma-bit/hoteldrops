const express = require('express');
const router = express.Router();
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── EXTRACTION PROMPT ───────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are an expert hotel booking data extractor for rebuq.com, an Indian hotel price tracking service.

Analyse the provided image/document and extract structured hotel booking data.

## DOCUMENT TYPES — identify which one this is:

1. **confirmed_voucher** — A confirmed hotel booking confirmation (has booking reference, confirmation number, guest name)
2. **search_results** — A hotel search results page showing multiple hotels with prices (e.g. MakeMyTrip search, Booking.com listings)
3. **hotel_detail_top** — A hotel detail page showing hotel info but NOT a list of room options yet
4. **hotel_detail_rooms** — A hotel detail page showing a list of room options/rate plans to choose from
5. **checkout_page** — A checkout/payment page for a specific room (almost booked, shows final price)
6. **not_hotel** — Not a hotel booking document (flight, train, restaurant, etc.)

## OTA-SPECIFIC TAX RULES (critical — apply exactly):

- **MakeMyTrip (MMT)**: Prices shown are ALWAYS inclusive of taxes. Use displayed total directly.
- **Hotels.com / in.hotels.com**: Always INR even if accessed from UAE. Always tax-inclusive.
- **GRNConnect / TBO**: Always tax-inclusive.
- **Booking.com**: Usually tax-inclusive for Indian users. Use displayed total.
- **Ixigo / Goibibo / Yatra**: Show base price + taxes SEPARATELY. You MUST add: (base_price + tax_amount) × num_nights × num_rooms = total_price_paid.
  Example: base ₹9,896 + tax ₹2,839 × 4 nights × 1 room = ₹50,940
- **Agoda**: ALWAYS shows pre-tax prices. Set total_price_paid = null and set agoda_pretax_warning = true.
- **Expedia**: Usually tax-inclusive. Use displayed total.
- **Direct hotel websites**: Usually tax-inclusive. Use displayed total.

## PRICE EXTRACTION RULES:

- Always extract the TOTAL price for the entire stay (all nights × all rooms), not per-night price
- If you only see a per-night price, multiply by num_nights × num_rooms
- For search results, extract price_per_night_incl_tax for each hotel (per night, per room, tax-inclusive)
- Currency: Convert to INR if shown in another currency using approximate rates. Set currency_original to the original currency code.
- AED to INR ≈ 22.5 | USD to INR ≈ 83 | EUR to INR ≈ 90 | GBP to INR ≈ 105 | SGD to INR ≈ 62 | THB to INR ≈ 2.3

## HOTEL ADDRESS:
If the hotel address is not visible in the image, infer it from your knowledge of the hotel chain/property name. Well-known chains (Taj, Marriott, Hyatt, ITC, Oberoi, etc.) have known addresses.

## CHILDREN:
Always extract num_children and children_ages array. Ages must be individual numbers 0-12 (0 = infant/under 1).

---

## FOR EACH DOCUMENT TYPE, return this JSON:

### confirmed_voucher / checkout_page:
{
  "documentType": "confirmed_voucher",
  "success": true,
  "data": {
    "hotel_name": "string",
    "hotel_city": "string",
    "hotel_address": "string or null",
    "check_in": "YYYY-MM-DD",
    "check_out": "YYYY-MM-DD",
    "total_nights": number,
    "num_rooms": number,
    "num_adults": number,
    "num_children": number,
    "children_ages": [array of ages 0-12],
    "room_type": "string or null",
    "board_basis": "RO|BB|HB|FB|AI",
    "board_basis_label": "Room Only|Bed & Breakfast|Half Board|Full Board|All Inclusive",
    "rate_plan_name": "string or null",
    "ota_name": "MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Ixigo|Yatra|GRNConnect|TBO|Direct|Other",
    "booking_reference": "string or null",
    "total_price_paid": number or null,
    "currency_original": "INR|USD|AED|EUR|GBP|SGD|THB|etc",
    "cancellation_policy": "free|partial|non-refundable|unknown",
    "cancellation_deadline": "YYYY-MM-DD or null",
    "cancellation_penalty": number or null,
    "payment_type": "pay_now|pay_at_property|partial",
    "amount_paid_upfront": number,
    "agoda_pretax_warning": false
  },
  "warnings": {
    "partialExtraction": boolean,
    "currencyConverted": boolean,
    "originalCurrency": "string or null",
    "agodaPretax": boolean,
    "checkInSoon": boolean,
    "checkInSoonDays": number or null,
    "payAtProperty": boolean,
    "unknownPolicy": boolean
  }
}

### search_results:
{
  "documentType": "search_results",
  "success": true,
  "data": {
    "ota_name": "string",
    "destination": "string",
    "check_in": "YYYY-MM-DD",
    "check_out": "YYYY-MM-DD",
    "total_nights": number,
    "num_adults": number,
    "num_children": number,
    "children_ages": [],
    "num_rooms": number,
    "hotels": [
      {
        "hotel_name": "string",
        "area": "string or null",
        "stars": number or null,
        "price_per_night_incl_tax": number or null,
        "total_price_incl_tax": number or null,
        "free_cancellation": boolean,
        "rating": number or null
      }
    ]
  }
}

### hotel_detail_top:
{
  "documentType": "hotel_detail_top",
  "success": true,
  "data": {
    "hotel_name": "string",
    "hotel_city": "string",
    "hotel_address": "string or null",
    "stars": number or null,
    "rating": number or null,
    "ota_name": "string",
    "check_in": "YYYY-MM-DD or null",
    "check_out": "YYYY-MM-DD or null",
    "total_nights": number or null,
    "num_adults": number or null,
    "num_children": number,
    "children_ages": [],
    "num_rooms": number or null,
    "room_options": []
  }
}

### hotel_detail_rooms:
{
  "documentType": "hotel_detail_rooms",
  "success": true,
  "data": {
    "hotel_name": "string",
    "hotel_city": "string",
    "hotel_address": "string or null",
    "ota_name": "string",
    "check_in": "YYYY-MM-DD or null",
    "check_out": "YYYY-MM-DD or null",
    "total_nights": number or null,
    "num_adults": number or null,
    "num_children": number,
    "children_ages": [],
    "num_rooms": number or null,
    "room_options": [
      {
        "room_type": "string",
        "option_name": "string or null",
        "board_basis": "RO|BB|HB|FB|AI",
        "board_basis_label": "string",
        "cancellation_policy": "free|partial|non-refundable|unknown",
        "cancellation_deadline": "YYYY-MM-DD or null",
        "price_per_night_incl_tax": number or null,
        "total_price_incl_tax": number or null
      }
    ]
  }
}

### not_hotel:
{
  "documentType": "not_hotel",
  "success": false,
  "blocked": true,
  "blockReason": "not_hotel",
  "message": "This does not appear to be a hotel booking document."
}

---

IMPORTANT:
- Return ONLY valid JSON, no markdown, no explanation
- If image is too blurry/unreadable: return { "success": false, "blocked": true, "blockReason": "poor_quality", "message": "Image too blurry or unclear to read." }
- If it's a hotel document but you cannot extract key fields: return confirmed_voucher with success:true but set partialExtraction:true in warnings
- GRN Tripadvisor rating should be IGNORED (it shows GRN internal rating, not the actual hotel rating)
- Hotels.com always INR regardless of country of access
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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
    if (!data.hotel_name || !data.check_in || !data.check_out) {
      warnings.partialExtraction = true;
    }
    if (data.currency_original && data.currency_original !== 'INR') {
      warnings.currencyConverted = true;
      warnings.originalCurrency = data.currency_original;
    }
    if (data.agoda_pretax_warning) {
      warnings.agodaPretax = true;
    }
    if (data.payment_type === 'pay_at_property') {
      warnings.payAtProperty = true;
    }
    if (data.cancellation_policy === 'unknown') {
      warnings.unknownPolicy = true;
    }
    const days = getDaysDiff(data.check_in);
    if (days !== null && days <= 1 && days >= 0) {
      warnings.checkInSoon = true;
      warnings.checkInSoonDays = days;
    }
  }

  return warnings;
}

// ─── EXTRACT ENDPOINT ─────────────────────────────────────────────────────────

router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype === 'application/pdf';

    if (!isImage && !isPDF) {
      return res.status(400).json({ success: false, error: 'File must be an image or PDF' });
    }

    // Build Anthropic message content
    let fileContent;
    if (isPDF) {
      fileContent = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.buffer.toString('base64'),
        },
      };
    } else {
      fileContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.mimetype,
          data: file.buffer.toString('base64'),
        },
      };
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            fileContent,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const rawText = response.content[0]?.text || '';

    // Parse JSON from response
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.json({
        success: false,
        blocked: true,
        blockReason: 'parse_error',
        message: 'Could not understand the document. Please try a clearer image or enter details manually.',
      });
    }

    // Handle blocked cases
    if (parsed.blocked) {
      return res.json(parsed);
    }

    const docType = parsed.documentType;

    // Check for checkin_passed on confirmed vouchers
    if (docType === 'confirmed_voucher' && parsed.data?.check_in) {
      const days = getDaysDiff(parsed.data.check_in);
      if (days !== null && days < 0) {
        return res.json({
          success: false,
          blocked: true,
          blockReason: 'checkin_passed',
          message: 'This booking has already checked in or ended.',
          data: parsed.data,
        });
      }
    }

    // Build warnings
    const warnings = buildWarnings(parsed.data || {}, docType);

    return res.json({
      ...parsed,
      warnings,
    });

  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({
      success: false,
      blocked: true,
      blockReason: 'server_error',
      message: 'Server error. Please try again.',
    });
  }
});

// ─── SUBMIT ENDPOINT ──────────────────────────────────────────────────────────

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

    // Validate required fields
    if (!hotel_name || !check_in || !check_out || !phone || !email) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Block non-refundable at submit time too
    if (cancellation_policy === 'non-refundable') {
      return res.json({
        success: false,
        blocked: true,
        reason: 'non_refundable',
        message: 'Non-refundable bookings cannot be tracked.',
      });
    }

    // Check for duplicate (same hotel + check_in + phone)
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('phone', phone)
      .eq('hotel_name', hotel_name)
      .eq('check_in', check_in)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.json({
        success: false,
        blocked: true,
        reason: 'duplicate',
        message: 'You are already tracking this booking.',
      });
    }

    // Calculate price_per_night
    const nights = total_nights || (check_in && check_out
      ? Math.max(1, Math.floor((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)))
      : 1);
    const rooms = num_rooms || 1;
    const price_per_night = total_price_paid
      ? Math.round(total_price_paid / nights / rooms)
      : null;

    // Insert booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        hotel_name,
        hotel_city,
        hotel_address: hotel_address || null,
        check_in,
        check_out,
        total_nights: nights,
        num_rooms: rooms,
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
        phone,
        email,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

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
