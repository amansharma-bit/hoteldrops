// Force fresh deploy
const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';
const GRN_API_KEY = process.env.GRN_API_KEY;

// Small, hardcoded city-name → GRN city_code map, same pattern as the existing
// CITY_COUNTRY table in voucher.js. Confirmed real: Dubai = 121449 (tested directly
// against GRN's Static Hotels endpoint). Expand this list as more cities get tested.
const CITY_TO_GRN_CODE = {
  'dubai': '121449',
};

// ── Resolve a real GRN hotel_code from a hotel name + city, using Static data ──
async function resolveGrnHotelId(hotelName, hotelCity) {
  if (!hotelName || !hotelCity) return { hotel_code: null, reason: 'Missing hotel name or city' };

  const cityKey = hotelCity.toLowerCase().trim();
  const cityCode = CITY_TO_GRN_CODE[cityKey];
  if (!cityCode) {
    return { hotel_code: null, reason: `City "${hotelCity}" not yet in our GRN city map — needs to be added.` };
  }

  try {
    const resp = await fetch(
      `${GRN_STATIC_BASE_URL}/api/v3/hotels/?city=${cityCode}&version=2.0`,
      { headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
    );
    const data = await resp.json();
    const hotels = data.hotels || [];
    if (!hotels.length) return { hotel_code: null, reason: 'No hotels returned for this city.' };

    const nameLower = hotelName.toLowerCase();
    const words = nameLower.split(' ').filter((w) => w.length > 3);
    const match = hotels.find((h) => {
      const hn = (h.name || '').toLowerCase();
      return words.some((w) => hn.includes(w));
    });

    if (!match) return { hotel_code: null, reason: `No name match found among ${hotels.length} hotels in ${hotelCity}.` };
    return { hotel_code: match.code, matched_name: match.name, reason: null };
  } catch (err) {
    return { hotel_code: null, reason: 'GRN Static lookup failed: ' + err.message };
  }
}

// Combined endpoint: takes extracted voucher fields, resolves the real GRN
// hotel_code, then runs a live Search using it. One call does the full chain.
router.post('/resolve-and-search', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }

  const { hotel_name, hotel_city, check_in, check_out, num_adults, children_ages, nationality } = req.body;

  if (!hotel_name || !hotel_city || !check_in || !check_out) {
    return res.status(400).json({ error: 'hotel_name, hotel_city, check_in, and check_out are required.' });
  }

  const resolved = await resolveGrnHotelId(hotel_name, hotel_city);
  if (!resolved.hotel_code) {
    return res.json({
      resolved: false,
      reason: resolved.reason,
      message: 'Could not automatically match this hotel to a GRN hotel_code. Manual entry needed.',
    });
  }

  const room = { adults: num_adults ? parseInt(num_adults, 10) : 2 };
  if (children_ages && Array.isArray(children_ages) && children_ages.length > 0) {
    room.children_ages = children_ages.map(Number);
  }

  const payload = {
    rooms: [room],
    rates: 'concise',
    hotel_codes: [String(resolved.hotel_code)],
    currency: 'USD',
    client_nationality: nationality || 'US',
    checkin: check_in,
    checkout: check_out,
    purpose_of_travel: 1,
  };

  try {
    const response = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST',
      headers: { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.hotels || data.hotels.length === 0) {
      return res.json({
        resolved: true,
        matched_hotel_code: resolved.hotel_code,
        matched_hotel_name: resolved.matched_name,
        searchSuccess: false,
        message: 'Hotel matched, but no live availability found for these dates.',
        raw: data,
      });
    }

    const h = data.hotels[0];
    const minRate = h.min_rate || {};
    const roomList = minRate.rooms || [];

    res.json({
      resolved: true,
      matched_hotel_code: resolved.hotel_code,
      matched_hotel_name: resolved.matched_name,
      searchSuccess: true,
      result: {
        hotel_id: h.hotel_code,
        hotel_name: h.name,
        checkin: data.checkin,
        checkout: data.checkout,
        price: minRate.price || null,
        currency: minRate.currency || null,
        refundable: minRate.non_refundable === false,
        last_cancellation_date: minRate.cancellation_policy ? minRate.cancellation_policy.cancel_by_date : null,
        board_basis: (minRate.boarding_details && minRate.boarding_details.join(', ')) || null,
        pan_required: minRate.pan_required !== undefined ? minRate.pan_required : null,
        nationality: nationality || null,
        rooms: roomList.map((r) => ({
          room_type: r.room_type || r.description,
          room_code: r.room_reference || null,
          adults: r.no_of_adults,
          children: r.no_of_children,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Search request to GRN failed', message: err.message });
  }
});


// Quick GET-based test of the full resolve-and-search chain
router.get('/test-resolve-and-search', async (req, res) => {
  const testPayload = {
    hotel_name: "Signature Inn",
    hotel_city: "Dubai",
    check_in: "2026-09-15",
    check_out: "2026-09-16",
    num_adults: 2,
  };
  const resolved = await resolveGrnHotelId(testPayload.hotel_name, testPayload.hotel_city);
  if (!resolved.hotel_code) {
    return res.json({ resolved: false, reason: resolved.reason });
  }
  try {
    const response = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST',
      headers: { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        rooms: [{ adults: 2 }], rates: 'concise', hotel_codes: [String(resolved.hotel_code)],
        currency: 'USD', client_nationality: 'US',
        checkin: testPayload.check_in, checkout: testPayload.check_out, purpose_of_travel: 1,
      }),
    });
    const data = await response.json();
    res.json({ resolved: true, matched_hotel_code: resolved.hotel_code, matched_hotel_name: resolved.matched_name, searchStatus: response.status, searchResult: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
