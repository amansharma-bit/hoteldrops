const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const GRN_STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';

const GRN_HEADERS = () => ({
  'api-key': GRN_API_KEY,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

// ---------------------------------------------------------------------------
// City code -> name lookup
//
// FIX: the previous version assigned the cache Map BEFORE the try block, so a
// failed fetch left an empty Map in place permanently. `!cityCodeToNameCache`
// was false from then on, so it never retried and every city rendered as "—"
// until the process restarted. Now we only commit the cache on success.
// ---------------------------------------------------------------------------
let cityCodeToNameCache = null;
let cityCacheInFlight = null;

async function loadCityCache() {
  const resp = await fetch(`${GRN_STATIC_BASE_URL}/api/v3/cities/?version=2.0`, {
    headers: GRN_HEADERS(),
  });
  if (!resp.ok) throw new Error(`cities endpoint returned ${resp.status}`);
  const data = await resp.json();
  const map = new Map();
  (data.cities || []).forEach((c) => map.set(c.code, c.name));
  if (map.size === 0) throw new Error('cities endpoint returned an empty list');
  return map;
}

async function getCityName(cityCode) {
  if (!cityCode) return null;
  if (!cityCodeToNameCache) {
    // De-dupe concurrent callers so 20 parallel rows don't fire 20 fetches.
    if (!cityCacheInFlight) {
      cityCacheInFlight = loadCityCache()
        .then((map) => { cityCodeToNameCache = map; return map; })
        .catch(() => null)          // genuinely retried on the next request
        .finally(() => { cityCacheInFlight = null; });
    }
    const map = await cityCacheInFlight;
    if (!map) return null;
  }
  return cityCodeToNameCache.get(cityCode) || null;
}

// ---------------------------------------------------------------------------
// Small concurrency helper with a wall-clock deadline.
// Returns whatever finished before the deadline; the rest come back undefined.
// ---------------------------------------------------------------------------
async function mapWithConcurrency(items, limit, deadlineTs, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let stoppedEarly = false;

  const worker = async () => {
    for (;;) {
      if (Date.now() > deadlineTs) { stoppedEarly = true; return; }
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        results[idx] = undefined; // one bad record must not kill the batch
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );

  return { results, stoppedEarly, processed: Math.min(cursor, items.length) };
}

// ---------------------------------------------------------------------------
// Live search against GRN's Search & Availability endpoint. (Unchanged.)
// ---------------------------------------------------------------------------
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
      headers: GRN_HEADERS(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'GRN API returned an error', details: data });
    }

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

// ---------------------------------------------------------------------------
// Dashboard summary. (Unchanged.)
// ---------------------------------------------------------------------------
router.get('/dashboard-summary', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  const nowD = new Date();
  const startD = new Date(nowD); startD.setDate(startD.getDate() - 44);
  const fmtD = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const start = encodeURIComponent(fmtD(startD));
  const end = encodeURIComponent(fmtD(nowD));
  const url = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${start}&updated_end=${end}`;

  try {
    const response = await fetch(url, { headers: GRN_HEADERS() });
    const data = await response.json();
    const bookings = data.bookings || [];

    const byDay = {};
    bookings.forEach((b) => {
      const day = b.updated_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const trend = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
    const recent = [...bookings].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 10);

    res.json({
      totalBookings: bookings.length,
      dateRange: { start: startD.toISOString().slice(0, 10), end: nowD.toISOString().slice(0, 10) },
      dailyTrend: trend,
      recentBookings: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Sampled dashboard stats. (Unchanged.)
// ---------------------------------------------------------------------------
router.get('/dashboard-real', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  const _now1 = new Date();
  const _start1 = new Date(_now1); _start1.setDate(_start1.getDate() - 30);
  const _fmt1 = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const startParam = req.query.start || _fmt1(_start1);
  const endParam = req.query.end || _fmt1(_now1);
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${encodeURIComponent(startParam)}&updated_end=${encodeURIComponent(endParam)}`;

  try {
    const listResp = await fetch(listUrl, { headers: GRN_HEADERS() });
    const listData = await listResp.json();
    const allBookings = listData.bookings || [];
    const totalBookings = allBookings.length;

    const SAMPLE_SIZE = 40;
    const step = Math.max(1, Math.floor(allBookings.length / SAMPLE_SIZE));
    const sample = [];
    for (let i = 0; i < allBookings.length && sample.length < SAMPLE_SIZE; i += step) {
      sample.push(allBookings[i]);
    }

    const { results } = await mapWithConcurrency(sample, 10, Date.now() + 25000, async (b) => {
      const dResp = await fetch(`${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${b.bid}`, {
        headers: GRN_HEADERS(),
      });
      const dData = await dResp.json();
      return dData.booking || null;
    });
    const details = results.filter(Boolean);

    let refundableCount = 0;
    const countryCounts = {};
    let totalValue = 0;
    let valueCount = 0;

    const rates = { USD: 1.0, EUR: 1.1446, GBP: 1.3401, INR: 0.010526, MXN: 0.05754, AED: 0.27225, AUD: 0.6960, THB: 0.0301, NOK: 0.1016, IDR: 0.0000553, NPR: 0.006569687 };

    details.forEach((booking) => {
      if (booking.non_refundable === false) refundableCount++;
      const country = booking.hotel?.country_code || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
      const price = booking.price?.total;
      const currency = booking.currency || 'USD';
      const rate = rates[currency];
      if (price && rate) { totalValue += parseFloat(price) * rate; valueCount++; }
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
      note: `Computed from a real sample of ${details.length} bookings, not the full dataset.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// BOOKINGS LIST — rewritten.
//
// What was wrong:
//   1. N+1 SEQUENTIAL fetches. One awaited round-trip per candidate inside a
//      for-loop. `status=all` stopped at 20 matches (~20-30 calls, tolerable).
//      Any other filter kept scanning until 20 matches or MAX_CHECK=600 —
//      i.e. up to 600 sequential round-trips. Minutes. That is why "all"
//      worked and every other dropdown option did not.
//   2. Every page re-scanned from scratch, and every filter change re-scanned
//      from scratch, because nothing was cached.
//   3. `matched.length >= neededCount` capped matched at exactly page*perPage,
//      so the frontend's `matchedSoFar < page*20` check could never be true
//      and "Next" was never correctly disabled.
//   4. No visibility into WHY a filter returned nothing.
//
// What this does instead:
//   - Scans the window ONCE, keeps every row regardless of status.
//   - Detail fetches run 10-wide with a hard wall-clock budget.
//   - Caches the scanned window for 10 minutes, keyed by date range, so
//     switching filters / paging is served from memory instantly.
//   - Returns `statusBreakdown` so the real distribution is visible.
//
// NOTE: this is still fundamentally an N+1 against GRN. The durable fix is a
// scheduled sync of bookings into Supabase, then querying our own table. This
// makes the live version usable; it does not make it correct architecture.
// ---------------------------------------------------------------------------

const WINDOW_CACHE_TTL_MS = 10 * 60 * 1000;
const windowCache = new Map(); // key -> { ts, payload }

function cacheGet(key) {
  const hit = windowCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > WINDOW_CACHE_TTL_MS) { windowCache.delete(key); return null; }
  return hit.payload;
}

function cacheSet(key, payload) {
  windowCache.set(key, { ts: Date.now(), payload });
  if (windowCache.size > 20) {
    const oldest = [...windowCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) windowCache.delete(oldest[0]);
  }
}

function deriveStatus(booking) {
  const raw = String(booking.booking_status || '').trim().toLowerCase();
  if (raw === 'cancelled' || raw === 'canceled') return 'Cancelled';
  // Explicitly guard against a MISSING field. Previously `non_refundable`
  // being undefined silently classified the booking as Non-Refundable, which
  // is a guess dressed up as a fact.
  if (booking.non_refundable === false) return 'Refundable';
  if (booking.non_refundable === true) return 'Non-Refundable';
  return 'Unknown';
}

async function scanWindow(targetStart, targetEnd, maxCheck, budgetMs) {
  const targetStartDate = new Date(targetStart.replace(' ', 'T'));
  const targetEndDate = new Date(targetEnd.replace(' ', 'T'));

  // A booking's updated_at is always >= its booking_date, so searching
  // updated_at from targetStart through now is guaranteed to include every
  // booking actually made in the target window.
  const searchEnd = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids`
    + `?updated_start=${encodeURIComponent(targetStart)}`
    + `&updated_end=${encodeURIComponent(searchEnd)}`;

  const listResp = await fetch(listUrl, { headers: GRN_HEADERS() });
  const listData = await listResp.json();
  const candidates = (listData.bookings || []).slice(0, maxCheck);

  const deadline = Date.now() + budgetMs;

  const { results, stoppedEarly, processed } = await mapWithConcurrency(
    candidates, 10, deadline,
    async (candidate) => {
      const detailResp = await fetch(
        `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${candidate.bid}`,
        { headers: GRN_HEADERS() }
      );
      const detailData = await detailResp.json();
      return detailData.booking || null;
    }
  );

  const bookings = results.filter(Boolean);

  const rows = [];
  const statusBreakdown = {};
  let outOfWindow = 0;
  let unparseableDate = 0;

  for (const booking of bookings) {
    const bookingDateObj = new Date(String(booking.booking_date || '').replace(' ', 'T'));
    if (isNaN(bookingDateObj.getTime())) { unparseableDate++; continue; }
    if (bookingDateObj < targetStartDate || bookingDateObj > targetEndDate) { outOfWindow++; continue; }

    const status = deriveStatus(booking);
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    const item = booking.hotel?.booking_items?.[0];
    const room = item?.rooms?.[0];

    rows.push({
      bookingId: booking.booking_id,
      bookingDate: booking.booking_date || null,
      hotelName: booking.hotel?.name || 'Unknown',
      hotelCode: booking.hotel?.hotel_code || null,
      cityCode: booking.hotel?.city_code || null,
      adults: room?.no_of_adults || 2,
      children: room?.no_of_children || 0,
      country: booking.hotel?.country_code || null,
      roomType: room?.room_type || room?.description || null,
      checkin: booking.checkin,
      checkout: booking.checkout,
      priceTotal: booking.price?.total ? parseFloat(booking.price.total) : null,
      currency: booking.currency,
      supplier: booking.supplier_code || null,
      boardBasis: item?.boarding_details?.join(', ') || null,
      lastCancellationDate: item?.cancellation_policy?.cancel_by_date || null,
      status,
      rawBookingStatus: booking.booking_status ?? null,
      rawNonRefundable: booking.non_refundable ?? null,
    });
  }

  rows.sort((a, b) => String(b.bookingDate || '').localeCompare(String(a.bookingDate || '')));

  // Resolve city names once, only for the codes we actually need.
  const uniqueCodes = [...new Set(rows.map((r) => r.cityCode).filter(Boolean))];
  const cityNames = new Map();
  for (const code of uniqueCodes) cityNames.set(code, await getCityName(code));
  rows.forEach((r) => { r.city = r.cityCode ? cityNames.get(r.cityCode) || null : null; });

  return {
    rows,
    diagnostics: {
      candidatesReturned: (listData.bookings || []).length,
      candidatesScanned: processed,
      detailsFetched: bookings.length,
      inWindow: rows.length,
      outOfWindow,
      unparseableDate,
      statusBreakdown,
      hitSafetyLimit: (listData.bookings || []).length > maxCheck,
      hitTimeBudget: stoppedEarly,
    },
  };
}

router.get('/bookings-list', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
  const statusFilter = (req.query.status || 'all').toLowerCase();

  const _now = new Date();
  const _start = new Date(_now); _start.setDate(_start.getDate() - 45);
  const _fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const targetStart = req.query.start || _fmt(_start);
  const targetEnd = req.query.end || _fmt(_now);

  const MAX_CHECK = 600;
  const TIME_BUDGET_MS = 25000;

  const cacheKey = `${targetStart}|${targetEnd}`;

  try {
    let scan = cacheGet(cacheKey);
    let servedFromCache = true;
    if (!scan) {
      servedFromCache = false;
      scan = await scanWindow(targetStart, targetEnd, MAX_CHECK, TIME_BUDGET_MS);
      cacheSet(cacheKey, scan);
    }

    const filtered = statusFilter === 'all'
      ? scan.rows
      : scan.rows.filter((r) => r.status.toLowerCase() === statusFilter);

    const pageStart = (page - 1) * perPage;
    const pageRows = filtered.slice(pageStart, pageStart + perPage);

    const d = scan.diagnostics;
    const noteParts = [`Scanned ${d.candidatesScanned} of ${d.candidatesReturned} candidates in this window.`];
    if (d.hitTimeBudget) noteParts.push('Stopped at the time budget — results are partial.');
    if (d.hitSafetyLimit) noteParts.push(`Capped at ${MAX_CHECK} candidates.`);
    if (servedFromCache) noteParts.push('Served from cache.');

    res.json({
      page,
      perPage,
      rows: pageRows,
      total: filtered.length,
      totalAllStatuses: scan.rows.length,
      hasMore: pageStart + perPage < filtered.length,
      matchedSoFar: filtered.length, // kept for backwards compatibility
      diagnostics: d,
      note: noteParts.join(' '),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
