const express = require('express');
const router = express.Router();

// ===========================================================================
// rebuq — GRN integration
//
// WHAT CHANGED AND WHY (read this before editing anything below):
//
// The old /bookings-list asked GRN for one booking at a time, live, on every
// page load, capped at 600 out of 80,000+. "All bookings" worked because it
// stopped after 20 matches. Every other filter had to keep scanning until it
// found 20 or burned all 600 — up to 600 sequential round-trips. That is why
// the status dropdown appeared to "show nothing".
//
// That approach cannot be the foundation of a rebooking engine. Any total it
// reports is "what we managed to scan", not "what exists" — authoritative
// looking, and wrong.
//
// So: we now keep our own copy. A background sync pulls GRN bookings into
// Supabase; the page queries our own table. Instant loads, real totals, no
// 600-cap, no timeouts.
//
// DESIGN NOTE: we store GRN's COMPLETE raw JSON for every booking. We do not
// yet know for certain whether `non_refundable` exists on GRN's response —
// the old code assumed it did and defaulted everything missing to
// "Non-Refundable". Storing raw means the labels can be corrected later with
// one SQL UPDATE instead of re-downloading 80,000 bookings.
//
// NO NEW DEPENDENCIES. Supabase is called over its REST API with plain
// fetch(), exactly like GRN. Nothing to npm install. Nothing in server.js
// to change — this file is already mounted at /api/live-search.
// ===========================================================================

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const GRN_STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYNC_SECRET = process.env.SYNC_SECRET;

const GRN_HEADERS = () => ({
  'api-key': GRN_API_KEY,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

// ---------------------------------------------------------------------------
// Supabase over plain REST.
// ---------------------------------------------------------------------------
function sbHeaders(extra = {}) {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function sbConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function sbSelect(table, query, extraHeaders = {}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders(extraHeaders),
  });
  const contentRange = resp.headers.get('content-range'); // e.g. "0-19/1234"
  const body = resp.status === 200 || resp.status === 206 ? await resp.json() : [];
  if (!resp.ok && resp.status !== 206) {
    const text = JSON.stringify(body);
    throw new Error(`Supabase select on ${table} failed (${resp.status}): ${text}`);
  }
  let total = null;
  if (contentRange && contentRange.includes('/')) {
    const t = contentRange.split('/')[1];
    if (t !== '*') total = parseInt(t, 10);
  }
  return { rows: body, total };
}

async function sbCount(table, query) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}&select=booking_id`, {
    method: 'HEAD',
    headers: sbHeaders({ 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }),
  });
  const cr = resp.headers.get('content-range');
  if (!cr || !cr.includes('/')) return 0;
  const t = cr.split('/')[1];
  return t === '*' ? 0 : parseInt(t, 10);
}

async function sbUpsert(table, rows, onConflict) {
  if (!rows.length) return;
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: sbHeaders({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase upsert into ${table} failed (${resp.status}): ${text}`);
  }
}

async function sbPatch(table, query, patch) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: sbHeaders({ 'Prefer': 'return=minimal' }),
    body: JSON.stringify(patch),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase patch on ${table} failed (${resp.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// City code -> name.
//
// FIX: the previous version assigned the cache Map BEFORE the try block, so a
// failed fetch left an empty Map in place permanently. `!cityCodeToNameCache`
// was false from then on, so it never retried — despite a comment claiming it
// would — and every city rendered "—" until the process restarted.
// ---------------------------------------------------------------------------
let cityCodeToNameCache = null;
let cityCacheInFlight = null;

async function loadCityCache() {
  const resp = await fetch(`${GRN_STATIC_BASE_URL}/api/v3/cities/?version=2.0`, { headers: GRN_HEADERS() });
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
    if (!cityCacheInFlight) {
      cityCacheInFlight = loadCityCache()
        .then((map) => { cityCodeToNameCache = map; return map; })
        .catch(() => null)               // genuinely retried next time
        .finally(() => { cityCacheInFlight = null; });
    }
    const map = await cityCacheInFlight;
    if (!map) return null;
  }
  return cityCodeToNameCache.get(cityCode) || null;
}

// ---------------------------------------------------------------------------
// Concurrency helper with a wall-clock deadline.
// ---------------------------------------------------------------------------
async function mapWithConcurrency(items, limit, deadlineTs, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let stoppedEarly = false;

  const worker = async () => {
    for (;;) {
      if (deadlineTs && Date.now() > deadlineTs) { stoppedEarly = true; return; }
      const idx = cursor++;
      if (idx >= items.length) return;
      try { results[idx] = await fn(items[idx], idx); }
      catch { results[idx] = undefined; }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return { results, stoppedEarly, processed: Math.min(cursor, items.length) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// THE SYNC ENGINE
// ===========================================================================

const SYNC_CONCURRENCY = 8;      // parallel booking-detail fetches
const CHUNK_DAYS = 3;            // window slice size — keeps each list call small
const UPSERT_BATCH = 100;
const DEFAULT_BACKFILL_DAYS = 90;

let syncRunning = false;         // in-process guard against double-starts

function fmtGrn(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Derive our label. Note the explicit 'Unknown' bucket: if GRN doesn't send
// the field, we say so rather than silently guessing "Non-Refundable", which
// is precisely the bug that broke the dropdown.
function deriveStatus(booking) {
  const raw = String(booking.booking_status || '').trim().toLowerCase();
  if (raw.startsWith('cancel')) return 'Cancelled';
  if (booking.non_refundable === false) return 'Refundable';
  if (booking.non_refundable === true) return 'Non-Refundable';
  return 'Unknown';
}

function toRow(booking, bid, cityName) {
  const item = booking.hotel?.booking_items?.[0];
  const room = item?.rooms?.[0];
  const parseTs = (v) => {
    if (!v) return null;
    const d = new Date(String(v).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const parseDate = (v) => {
    const iso = parseTs(v);
    return iso ? iso.slice(0, 10) : null;
  };

  return {
    booking_id: booking.booking_id,
    bid: bid ? String(bid) : null,
    booking_date: parseTs(booking.booking_date),
    grn_updated_at: parseTs(booking.updated_at),
    checkin: parseDate(booking.checkin),
    checkout: parseDate(booking.checkout),
    hotel_name: booking.hotel?.name || null,
    hotel_code: booking.hotel?.hotel_code ? String(booking.hotel.hotel_code) : null,
    city_code: booking.hotel?.city_code || null,
    city_name: cityName,
    country_code: booking.hotel?.country_code || null,
    room_type: room?.room_type || room?.description || null,
    board_basis: item?.boarding_details?.join(', ') || null,
    price_total: booking.price?.total ? parseFloat(booking.price.total) : null,
    currency: booking.currency || null,
    supplier_code: booking.supplier_code || null,
    cancel_by_date: parseTs(item?.cancellation_policy?.cancel_by_date),
    raw_booking_status: booking.booking_status ?? null,
    raw_non_refundable: typeof booking.non_refundable === 'boolean' ? booking.non_refundable : null,
    status: deriveStatus(booking),
    raw: booking,                       // the safety net
    synced_at: new Date().toISOString(),
  };
}

async function setSyncState(patch) {
  try { await sbPatch('grn_sync_state', 'id=eq.1', patch); } catch { /* never kill the sync over a status write */ }
}

async function getSyncState() {
  const { rows } = await sbSelect('grn_sync_state', 'id=eq.1&select=*');
  return rows[0] || null;
}

// Sync one time-slice: list the booking ids GRN touched in it, pull details
// in parallel, upsert. Returns how many rows landed.
async function syncChunk(chunkStart, chunkEnd) {
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids`
    + `?updated_start=${encodeURIComponent(fmtGrn(chunkStart))}`
    + `&updated_end=${encodeURIComponent(fmtGrn(chunkEnd))}`;

  const listResp = await fetch(listUrl, { headers: GRN_HEADERS() });
  if (!listResp.ok) throw new Error(`GRN bookingids returned ${listResp.status}`);
  const listData = await listResp.json();
  const candidates = listData.bookings || [];
  if (!candidates.length) return 0;

  const { results } = await mapWithConcurrency(candidates, SYNC_CONCURRENCY, null, async (c) => {
    const r = await fetch(`${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${c.bid}`, {
      headers: GRN_HEADERS(),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.booking ? { booking: d.booking, bid: c.bid } : null;
  });

  const found = results.filter(Boolean);

  const rows = [];
  for (const { booking, bid } of found) {
    if (!booking.booking_id) continue;
    const cityName = await getCityName(booking.hotel?.city_code);
    rows.push(toRow(booking, bid, cityName));
  }

  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    await sbUpsert('grn_bookings', rows.slice(i, i + UPSERT_BATCH), 'booking_id');
  }

  return rows.length;
}

// The whole job. Runs in the background — never inside a request.
async function runSync({ fromISO }) {
  syncRunning = true;
  let total = 0;

  try {
    const state = await getSyncState();

    // Where to start: explicit ?from=, else the saved watermark, else default backfill.
    let cursor;
    if (fromISO) cursor = new Date(fromISO);
    else if (state?.watermark) cursor = new Date(state.watermark);
    else { cursor = new Date(); cursor.setDate(cursor.getDate() - DEFAULT_BACKFILL_DAYS); }

    // Overlap slightly so nothing falls through a boundary crack.
    cursor.setMinutes(cursor.getMinutes() - 30);

    const end = new Date();
    const totalMs = Math.max(1, end - cursor);

    await setSyncState({
      last_run_status: 'running',
      last_run_at: new Date().toISOString(),
      last_run_error: null,
      progress: `Starting from ${cursor.toISOString().slice(0, 10)}`,
    });

    while (cursor < end) {
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + CHUNK_DAYS);
      const cappedEnd = chunkEnd > end ? end : chunkEnd;

      let attempt = 0;
      for (;;) {
        try {
          total += await syncChunk(cursor, cappedEnd);
          break;
        } catch (e) {
          attempt++;
          if (attempt >= 3) throw e;
          await sleep(2000 * attempt); // back off, then retry the slice
        }
      }

      // Advance the watermark only after the slice actually landed, so a
      // crash resumes here rather than starting over.
      cursor = cappedEnd;
      const pct = Math.min(99, Math.round(((cursor - (end - totalMs)) / totalMs) * 100));
      await setSyncState({
        watermark: cursor.toISOString(),
        progress: `${pct}% — through ${cursor.toISOString().slice(0, 10)} · ${total} bookings synced`,
        bookings_synced: total,
      });
    }

    await setSyncState({
      last_run_status: 'idle',
      progress: `Done — ${total} bookings synced up to ${end.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
      bookings_synced: total,
      watermark: end.toISOString(),
    });
  } catch (err) {
    await setSyncState({
      last_run_status: 'error',
      last_run_error: String(err.message || err),
      progress: `Failed after ${total} bookings`,
    });
  } finally {
    syncRunning = false;
  }
}

function checkSecret(req, res) {
  if (!SYNC_SECRET) {
    res.status(500).json({ error: 'SYNC_SECRET is not set in Railway variables. Add it, then retry.' });
    return false;
  }
  if (req.query.secret !== SYNC_SECRET) {
    res.status(401).json({ error: 'Wrong or missing ?secret=' });
    return false;
  }
  return true;
}

// GET /api/live-search/sync-run?secret=XXX&from=2026-04-01
// Kicks the sync off in the background and returns immediately.
router.get('/sync-run', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) {
    return res.status(500).json({
      error: 'Supabase not configured',
      missing: [
        !SUPABASE_URL ? 'SUPABASE_URL' : null,
        !SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
      ].filter(Boolean),
      hint: 'Add these in Railway -> your backend service -> Variables, then redeploy.',
    });
  }
  if (syncRunning) {
    return res.json({ started: false, message: 'A sync is already running. Check /sync-status.' });
  }

  const fromISO = req.query.from ? `${req.query.from}T00:00:00Z` : null;

  runSync({ fromISO }); // deliberately not awaited — this must not block the request

  res.json({
    started: true,
    from: fromISO || 'saved watermark, or last 90 days on first run',
    message: 'Sync started in the background. Poll /sync-status to watch it.',
  });
});

// GET /api/live-search/sync-status?secret=XXX
router.get('/sync-status', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const state = await getSyncState();
    const rowsInTable = await sbCount('grn_bookings', 'booking_id=not.is.null');
    res.json({ running: syncRunning, rowsInTable, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================================
// EXISTING ROUTES — unchanged behaviour
// ===========================================================================

router.post('/live-search', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set in environment variables.' });

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
    if (!response.ok) return res.status(response.status).json({ error: 'GRN API returned an error', details: data });

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

router.get('/dashboard-summary', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  const nowD = new Date();
  const startD = new Date(nowD); startD.setDate(startD.getDate() - 44);
  const url = `${GRN_API_BASE_URL}/hotels/bookingids`
    + `?updated_start=${encodeURIComponent(fmtGrn(startD))}`
    + `&updated_end=${encodeURIComponent(fmtGrn(nowD))}`;

  try {
    const response = await fetch(url, { headers: GRN_HEADERS() });
    const data = await response.json();
    const bookings = data.bookings || [];

    const byDay = {};
    bookings.forEach((b) => {
      const day = b.updated_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    res.json({
      totalBookings: bookings.length,
      dateRange: { start: startD.toISOString().slice(0, 10), end: nowD.toISOString().slice(0, 10) },
      dailyTrend: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)),
      recentBookings: [...bookings].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard-real', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  const _now = new Date();
  const _start = new Date(_now); _start.setDate(_start.getDate() - 30);
  const startParam = req.query.start || fmtGrn(_start);
  const endParam = req.query.end || fmtGrn(_now);
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids`
    + `?updated_start=${encodeURIComponent(startParam)}&updated_end=${encodeURIComponent(endParam)}`;

  try {
    const listResp = await fetch(listUrl, { headers: GRN_HEADERS() });
    const listData = await listResp.json();
    const allBookings = listData.bookings || [];

    const SAMPLE_SIZE = 40;
    const step = Math.max(1, Math.floor(allBookings.length / SAMPLE_SIZE));
    const sample = [];
    for (let i = 0; i < allBookings.length && sample.length < SAMPLE_SIZE; i += step) sample.push(allBookings[i]);

    const { results } = await mapWithConcurrency(sample, 10, Date.now() + 25000, async (b) => {
      const r = await fetch(`${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${b.bid}`, { headers: GRN_HEADERS() });
      const d = await r.json();
      return d.booking || null;
    });
    const details = results.filter(Boolean);

    const rates = { USD: 1.0, EUR: 1.1446, GBP: 1.3401, INR: 0.010526, MXN: 0.05754, AED: 0.27225, AUD: 0.6960, THB: 0.0301, NOK: 0.1016, IDR: 0.0000553, NPR: 0.006569687 };
    let refundableCount = 0, totalValue = 0, valueCount = 0;
    const countryCounts = {};

    details.forEach((booking) => {
      if (booking.non_refundable === false) refundableCount++;
      const country = booking.hotel?.country_code || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
      const price = booking.price?.total;
      const rate = rates[booking.currency || 'USD'];
      if (price && rate) { totalValue += parseFloat(price) * rate; valueCount++; }
    });

    res.json({
      sampleSize: details.length,
      totalBookings: allBookings.length,
      refundablePctFromSample: details.length ? Math.round((refundableCount / details.length) * 100) : null,
      topCountries: Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([country, count]) => ({ country, count, pct: Math.round((count / details.length) * 100) })),
      avgValueFromSample: valueCount ? Math.round(totalValue / valueCount) : null,
      note: `Computed from a real sample of ${details.length} bookings, not the full dataset.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================================
// BOOKINGS LIST — now served from OUR table. Instant. Real totals.
// ===========================================================================

const STATUS_LABEL = {
  'refundable': 'Refundable',
  'non-refundable': 'Non-Refundable',
  'cancelled': 'Cancelled',
  'unknown': 'Unknown',
};

router.get('/bookings-list', async (req, res) => {
  if (!sbConfigured()) {
    return res.status(500).json({
      error: 'Supabase not configured — the bookings table cannot be read.',
      missing: [
        !SUPABASE_URL ? 'SUPABASE_URL' : null,
        !SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
      ].filter(Boolean),
      hint: 'Add these in Railway -> your backend service -> Variables, then redeploy.',
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
  const statusFilter = (req.query.status || 'all').toLowerCase();

  const _now = new Date();
  const _start = new Date(_now); _start.setDate(_start.getDate() - 45);
  const start = (req.query.start || fmtGrn(_start)).replace(' ', 'T');
  const end = (req.query.end || fmtGrn(_now)).replace(' ', 'T');

  const dateWhere = `booking_date=gte.${encodeURIComponent(start)}&booking_date=lte.${encodeURIComponent(end)}`;
  const statusWhere = statusFilter !== 'all' && STATUS_LABEL[statusFilter]
    ? `&status=eq.${encodeURIComponent(STATUS_LABEL[statusFilter])}`
    : '';

  const offset = (page - 1) * perPage;

  try {
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${dateWhere}${statusWhere}`
        + `&select=booking_id,booking_date,hotel_name,city_name,country_code,room_type,board_basis,`
        + `checkin,checkout,price_total,currency,supplier_code,cancel_by_date,status,`
        + `raw_booking_status,raw_non_refundable`
        + `&order=booking_date.desc&offset=${offset}&limit=${perPage}`,
      { 'Prefer': 'count=exact' }
    );

    // Real distribution in this window — this is what tells us whether an
    // empty filter means "no such rows" or "the classifier never fired".
    const statusBreakdown = {};
    for (const key of Object.keys(STATUS_LABEL)) {
      statusBreakdown[STATUS_LABEL[key]] = await sbCount(
        'grn_bookings',
        `${dateWhere}&status=eq.${encodeURIComponent(STATUS_LABEL[key])}`
      );
    }

    const state = await getSyncState().catch(() => null);
    const totalAllStatuses = await sbCount('grn_bookings', dateWhere);

    res.json({
      page,
      perPage,
      rows: rows.map((r) => ({
        bookingId: r.booking_id,
        bookingDate: r.booking_date,
        hotelName: r.hotel_name || 'Unknown',
        city: r.city_name,
        country: r.country_code,
        roomType: r.room_type,
        boardBasis: r.board_basis,
        checkin: r.checkin,
        checkout: r.checkout,
        priceTotal: r.price_total !== null ? Number(r.price_total) : null,
        currency: r.currency,
        supplier: r.supplier_code,
        lastCancellationDate: r.cancel_by_date,
        status: r.status,
        rawBookingStatus: r.raw_booking_status,
        rawNonRefundable: r.raw_non_refundable,
      })),
      total: total ?? 0,
      totalAllStatuses,
      hasMore: offset + perPage < (total ?? 0),
      matchedSoFar: total ?? 0,
      diagnostics: {
        statusBreakdown,
        source: 'supabase',
        syncedThrough: state?.watermark || null,
        lastSyncStatus: state?.last_run_status || null,
        lastSyncProgress: state?.progress || null,
      },
      note: state?.watermark
        ? `Served from our own table. Synced through ${String(state.watermark).slice(0, 16).replace('T', ' ')} UTC.`
        : 'Served from our own table. No sync has run yet — the table may be empty.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
