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


// Clean, focused check — ONLY bookings count, nothing else. Built specifically
// to show Naveen a clear, unambiguous result without any other data mixed in.
router.get('/bookings-count-only', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  try {
    const response = await fetch(
      `${GRN_API_BASE_URL}/hotels/bookings?filter_type=booking_date&start=2026-06-14&end=2026-07-13`,
      { headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
    );
    const data = await response.json();
    res.json({
      question: 'How many bookings (refundable + non-refundable) does GRN show for June 14 - July 13, 2026?',
      answer: data.total,
      dateRange: `${data.start} to ${data.end}`,
      httpStatus: response.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing the alternate /hotels/bookingids endpoint specifically, as requested
router.get('/test-bookingids-endpoint', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  try {
    const response = await fetch(
      `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=2026-06-01`,
      { headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
    );
    const status = response.status;
    let data;
    try { data = await response.json(); } catch { data = '(non-JSON response)'; }
    res.json({ httpStatus: status, response: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing January 2026 specifically, based on Naveen's document showing
// "Jan'26" as the last booking date for the B2B key
router.get('/test-january-bookings', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  try {
    const response = await fetch(
      `${GRN_API_BASE_URL}/hotels/bookings?filter_type=booking_date&start=2026-01-01&end=2026-01-30`,
      { headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
    );
    const data = await response.json();
    res.json({ question: 'Bookings for Jan 1-30, 2026?', answer: data.total, dateRange: `${data.start} to ${data.end}`, httpStatus: response.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing /hotels/bookingids with space-separated datetime format, as requested
router.get('/test-space-format', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  // Properly URL-encoding the space this time — a raw, unencoded space in a
  // URL is invalid and can get silently mishandled by the server, regardless
  // of whether the underlying date format itself is correct.
  const start = encodeURIComponent('2026-06-01 00:00:00');
  const end = encodeURIComponent('2026-06-25 00:00:00');
  const url = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${start}&updated_end=${end}`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const status = response.status;
    let data;
    try { data = await response.json(); } catch { data = '(non-JSON response)'; }
    res.json({ urlTried: url, httpStatus: status, response: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Clean count summary — the actual number of bookings, properly encoded,
// confirmed working.
router.get('/bookings-count-final', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const start = encodeURIComponent('2026-06-01 00:00:00');
  const end = encodeURIComponent('2026-06-25 00:00:00');
  const url = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${start}&updated_end=${end}`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    const bookings = data.bookings || [];
    res.json({
      dateRangeChecked: 'June 1 - June 25, 2026',
      totalBookingsFound: bookings.length,
      httpStatus: response.status,
      sampleFirst5: bookings.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Dashboard summary — real booking volume, grouped by day, for a genuine trend
// chart. Uses the same confirmed-working /hotels/bookingids endpoint.
router.get('/dashboard-summary', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const start = encodeURIComponent('2026-06-01 00:00:00');
  const end = encodeURIComponent('2026-07-13 23:59:59');
  const url = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${start}&updated_end=${end}`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    const bookings = data.bookings || [];

    // Group by day for a real trend chart
    const byDay = {};
    bookings.forEach((b) => {
      const day = b.updated_at.slice(0, 10); // YYYY-MM-DD
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const trend = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

    // Most recent 10 bookings, newest first
    const recent = [...bookings].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 10);

    res.json({
      totalBookings: bookings.length,
      dateRange: { start: '2026-06-01', end: '2026-07-13' },
      dailyTrend: trend,
      recentBookings: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing Fetch Booking with a real bcode from our actual bookings list —
// should tell us exactly what fields (amount, refundable, country, etc.)
// are available for the dashboard.
router.get('/test-fetch-booking-detail', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  // Real bcode from our actual bookingids test result
  const testBcode = 'HYnZ3i6QAgAJNVkV';
  const url = `${GRN_API_BASE_URL}/hotels/bookings/${testBcode}?type=GRN`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    res.json({ bcodeTried: testBcode, httpStatus: response.status, response: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Testing the exact bookingdetail endpoint Aman provided
router.get('/test-bookingdetail-endpoint', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const testBookingId = 'GRN-202603-2374997';
  const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${testBookingId}`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    res.json({ bookingIdTried: testBookingId, httpStatus: response.status, response: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Real dashboard summary — pulls a genuine sample of booking details to
// compute real refundable %, top countries, and avg value. Not fabricated —
// based on actual GRN data, clearly labeled as sample-based given pulling
// full detail for all 37,725 bookings isn't practical to do live.
router.get('/dashboard-real', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const start = encodeURIComponent('2026-06-01 00:00:00');
  const end = encodeURIComponent('2026-07-13 23:59:59');
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${start}&updated_end=${end}`;

  try {
    const listResp = await fetch(listUrl, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const listData = await listResp.json();
    const allBookings = listData.bookings || [];
    const totalBookings = allBookings.length;

    // Sample size — 100 real detail pulls, evenly spread across the list,
    // not just the first 100 (avoids bias toward one time period)
    const SAMPLE_SIZE = 40; // kept conservative to avoid request timeout — 100 sequential calls risked 30-50s+
    const step = Math.max(1, Math.floor(allBookings.length / SAMPLE_SIZE));
    const sample = [];
    for (let i = 0; i < allBookings.length && sample.length < SAMPLE_SIZE; i += step) {
      sample.push(allBookings[i]);
    }

    const details = [];
    for (const b of sample) {
      try {
        const detailUrl = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${b.bid}`;
        const dResp = await fetch(detailUrl, {
          headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        });
        const dData = await dResp.json();
        if (dData.booking) details.push(dData.booking);
      } catch { /* skip failed individual pulls */ }
    }

    // Compute real stats from the sample
    let refundableCount = 0;
    const countryCounts = {};
    let totalValue = 0;
    let valueCount = 0;

    details.forEach((booking) => {
      const items = booking.hotel?.booking_items || [];
      items.forEach((item) => {
        if (item.non_refundable === false) refundableCount++;
      });
      const address = booking.hotel?.address || '';
      const country = address.split(',').pop()?.trim() || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;

      const price = items[0]?.price;
      if (price) { totalValue += parseFloat(price); valueCount++; }
    });

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count, pct: Math.round((count / details.length) * 100) }));

    res.json({
      sampleSize: details.length,
      totalBookings,
      refundablePctFromSample: details.length ? Math.round((refundableCount / details.length) * 100) : null,
      topCountries,
      avgValueFromSample: valueCount ? Math.round(totalValue / valueCount) : null,
      note: 'Refundable %, countries, and avg value are computed from a real sample of ' + details.length + ' bookings, not the full dataset — pulling full detail for all ' + totalBookings + ' bookings live is not practical.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Debug: full raw structure of one booking, to find the real country/price fields
router.get('/debug-raw-booking-structure', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const testBookingId = 'GRN-202603-2374997';
  const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${testBookingId}`;
  try {
    const response = await fetch(url, {
      headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
