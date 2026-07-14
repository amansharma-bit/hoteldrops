const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;

// Live search against GRN's real Search & Availability endpoint.
// Confirmed working July 13 — returns genuine, live hotel rate data.
router.post('/live-search', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set in environment variables.' });
  }

  const { hotel_code, checkin, checkout, adults, children_ages, nationality, currency } = req.body;

  if (!hotel_code || !checkin || !checkout) {
    return res.status(400).json({ error: 'hotel_code, checkin, and checkout are required.' });
  }

  const room = { adults: adults ? parseInt(adults, 10) : 2 };
  if (children_ages && Array.isArray(children_ages) && children_ages.length > 0) {
    room.children_ages = children_ages.map(Number);
  }

  const payload = {
    rooms: [room],
    rates: 'concise',
    hotel_codes: [String(hotel_code)],
    currency: currency || 'USD',
    client_nationality: nationality || 'US',
    checkin,
    checkout,
    purpose_of_travel: 1,
  };

  try {
    const response = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST',
      headers: {
        'api-key': GRN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'GRN API returned an error', details: data });
    }

    // Return a clean, frontend-friendly shape rather than the raw GRN response
    const hotels = (data.hotels || []).map((h) => {
      const minRate = h.min_rate || {};
      const roomList = minRate.rooms || [];
      return {
        hotel_id: h.hotel_code,
        hotel_name: h.name,
        address: h.address,
        checkin: data.checkin,
        checkout: data.checkout,
        price: minRate.price || null,
        currency: minRate.currency || null,
        refundable: minRate.non_refundable === false,
        last_cancellation_date: minRate.cancellation_policy ? minRate.cancellation_policy.cancel_by_date : null,
        board_basis: (minRate.boarding_details && minRate.boarding_details.join(', ')) || null,
        pan_required: minRate.pan_required !== undefined ? minRate.pan_required : null,
        nationality: req.body.nationality || null,
        rooms: roomList.map((r) => ({
          room_type: r.room_type || r.description,
          room_code: r.room_reference || null,
          adults: r.no_of_adults,
          children: r.no_of_children,
        })),
      };
    });

    res.json({
      search_id: data.search_id,
      checkin: data.checkin,
      checkout: data.checkout,
      hotels,
      raw_hotel_count: (data.hotels || []).length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Request to GRN failed', message: err.message });
  }
});


// Temporary debug route — lets me fetch this directly to see the exact error
router.get('/live-search-debug', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const payload = {
    rooms: [{ adults: 2 }],
    rates: "concise",
    hotel_codes: ["1848138"],
    currency: "USD",
    client_nationality: "US",
    checkin: "2026-09-15",
    checkout: "2026-09-16",
    purpose_of_travel: 1
  };
  try {
    const response = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST',
      headers: { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json({ httpStatus: response.status, payloadSent: payload, responseReceived: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing whether hotel_name alone (without hotel_codes) works as a search parameter
router.get('/test-hotel-name-search', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const testNames = ["Signature Inn", "Signature Inn Hotel Deira", "Signature Inn Deira"];
  const results = [];
  for (const name of testNames) {
    const payload = {
      rooms: [{ adults: 2 }],
      rates: "concise",
      hotel_name: name,
      currency: "USD",
      client_nationality: "US",
      checkin: "2026-09-15",
      checkout: "2026-09-16",
      purpose_of_travel: 1
    };
    try {
      const response = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
        method: 'POST',
        headers: { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      results.push({ nameSearched: name, httpStatus: response.status, responseReceived: data });
    } catch (err) {
      results.push({ nameSearched: name, error: err.message });
    }
  }
  res.json({ results });
});


// Testing the Static Hotels endpoint — different base URL than Search
router.get('/test-static-hotels', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';
  try {
    const response = await fetch(`${STATIC_BASE_URL}/api/v3/hotels/?city=C!008896&version=2.0`, {
      method: 'GET',
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json' },
    });
    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch {
      data = '(non-JSON response)';
    }
    res.json({ httpStatus: status, preview: JSON.stringify(data).slice(0, 800) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
