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

    // Compute real stats from the sample — using the CORRECT field paths,
    // confirmed against a real raw booking record:
    // country_code lives at booking.hotel.country_code (clean ISO code)
    // refundable status lives at booking.non_refundable (top level)
    // price lives at booking.price.total (top level)
    let refundableCount = 0;
    const countryCounts = {};
    let totalValue = 0;
    let valueCount = 0;

    // Same currency-conversion rates used throughout tonight's other analysis
    const rates = { USD: 1.0, EUR: 1.1446, GBP: 1.3401, INR: 0.010526, MXN: 0.05754, AED: 0.27225, AUD: 0.6960, THB: 0.0301, NOK: 0.1016, IDR: 0.0000553, NPR: 0.006569687 };

    details.forEach((booking) => {
      if (booking.non_refundable === false) refundableCount++;

      const country = booking.hotel?.country_code || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;

      const price = booking.price?.total;
      const currency = booking.currency || 'USD';
      const rate = rates[currency];
      if (price && rate) {
        totalValue += parseFloat(price) * rate; // converted to USD before summing
        valueCount++;
      }
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


// Paginated live bookings list — pulls full detail only for the current
// page (not all 80,000+ at once), keeping this practical to run live.
router.get('/bookings-list', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
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

    const pageStart = (page - 1) * perPage;
    const pageBookings = allBookings.slice(pageStart, pageStart + perPage);

    const rates = { USD: 1.0, EUR: 1.1446, GBP: 1.3401, INR: 0.010526, MXN: 0.05754, AED: 0.27225, AUD: 0.6960, THB: 0.0301, NOK: 0.1016, IDR: 0.0000553, NPR: 0.006569687 };

    const rows = [];
    for (const b of pageBookings) {
      try {
        const detailUrl = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${b.bid}`;
        const dResp = await fetch(detailUrl, {
          headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        });
        const dData = await dResp.json();
        const booking = dData.booking;
        if (!booking) continue;

        const item = booking.hotel?.booking_items?.[0];
        const room = item?.rooms?.[0];

        rows.push({
          bookingId: booking.booking_id,
          hotelName: booking.hotel?.name || 'Unknown',
          city: booking.hotel?.address?.split(',').slice(-2, -1)[0]?.trim() || null,
          country: booking.hotel?.country_code || null,
          roomType: room?.room_type || room?.description || null,
          checkin: booking.checkin,
          checkout: booking.checkout,
          priceTotal: booking.price?.total ? parseFloat(booking.price.total) : null,
          currency: booking.currency,
          refundable: booking.non_refundable === false,
          supplier: booking.supplier_code || null,
          boardBasis: item?.boarding_details?.join(', ') || null,
          lastCancellationDate: item?.cancellation_policy?.cancel_by_date || null,
          status: booking.non_refundable === false ? 'Eligible' : 'Not eligible',
          rebookedStatus: null, // placeholder — populates once rebuq's own rebooking engine is live
        });
      } catch { /* skip failed individual pulls */ }
    }

    res.json({
      page, perPage, totalBookings,
      totalPages: Math.ceil(totalBookings / perPage),
      rows,
      note: 'Status shows Refundable vs Non-refundable, direct from GRN. "Rebooked" status needs a separate cross-reference against Mize data, not included here yet.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
