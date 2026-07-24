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

// Accept whichever names already exist in Railway. This project uses
// SUPABASE_SERVICE_KEY (not ..._SERVICE_ROLE_KEY) and other code reads that
// name, so we adapt here rather than renaming the variable and breaking auth.
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

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

const GRN_PAGE_SIZE = 100;          // max the endpoint allows per page
const GRN_WINDOW_DAYS = 30;         // max window the endpoint allows per query
const PAUSE_BETWEEN_CALLS_MS = 400; // deliberate breather between GRN calls
const MAX_CALLS_PER_RUN = 120;      // hard safety ceiling (~12,000 bookings/run)
const UPSERT_BATCH = 100;
const DEFAULT_INCREMENTAL_DAYS = 2; // routine run only looks back a couple of days

let syncRunning = false;         // in-process guard against double-starts

function fmtGrn(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

const parseTs = (v) => {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d.toISOString();
};
const parseDate = (v) => {
  const iso = parseTs(v);
  return iso ? iso.slice(0, 10) : null;
};

function rollUpBooking(booking) {
  const items = booking.hotel?.booking_items || [];

  const rawStatus = String(booking.booking_status || '').trim().toLowerCase();
  const isCancelled = rawStatus.startsWith('cancel') || booking.booking_type === 'C';

  let priceSum = 0;
  let anyPrice = false;
  let refundableCount = 0;
  let nonRefundableCount = 0;
  let unknownCount = 0;
  let earliestCancelBy = null;

  for (const item of items) {
    const p = parseFloat(item.price);
    if (!isNaN(p)) { priceSum += p; anyPrice = true; }

    if (item.non_refundable === false) refundableCount++;
    else if (item.non_refundable === true) nonRefundableCount++;
    else unknownCount++;

    const cby = parseTs(item.cancellation_policy?.cancel_by_date);
    if (cby && (!earliestCancelBy || cby < earliestCancelBy)) earliestCancelBy = cby;
  }

  let status;
  if (isCancelled) status = 'Cancelled';
  else if (items.length === 0 || unknownCount === items.length) status = 'Unknown';
  else if (nonRefundableCount === 0) status = 'Refundable';
  else if (refundableCount === 0 && unknownCount === 0) status = 'Non-Refundable';
  else status = 'Partial';

  return {
    priceTotal: anyPrice ? priceSum : (booking.price?.total ? parseFloat(booking.price.total) : null),
    status,
    cancelByDate: earliestCancelBy,
    roomCount: items.length,
    sampleNonRefundable: typeof items[0]?.non_refundable === 'boolean' ? items[0].non_refundable : null,
  };
}

function toRow(booking, cityName) {
  const roll = rollUpBooking(booking);
  const item0 = booking.hotel?.booking_items?.[0];
  const room0 = item0?.rooms?.[0];

  let guestName = null;
  if (booking.holder) {
    guestName = `${booking.holder.name || ''} ${booking.holder.surname || ''}`.trim() || null;
  }
  if (!guestName && booking.hotel?.paxes?.[0]) {
    const p = booking.hotel.paxes[0];
    guestName = `${p.name || ''} ${p.surname || ''}`.trim() || null;
  }

  const checkinDate = parseDate(booking.checkin);

  return {
    booking_id: booking.booking_id,
    booking_reference: booking.booking_reference || null,
    supplier_reference: booking.supplier_reference || null,
    booking_date: parseTs(booking.booking_date),
    grn_updated_at: parseTs(booking.updated_at),
    checkin: checkinDate,
    checkin_date: checkinDate,
    checkout: parseDate(booking.checkout),
    hotel_name: booking.hotel?.name || booking.hotel?.hotel_confirmation_number || null,
    hotel_code: booking.hotel?.hotel_code ? String(booking.hotel.hotel_code) : null,
    city_code: booking.hotel?.city_code || null,
    city_name: cityName,
    country_code: booking.hotel?.country_code || null,
    room_type: room0?.room_type || room0?.description || null,
    room_count: roll.roomCount,
    guest_name: guestName,
    board_basis: item0?.boarding_details?.join(', ') || null,
    price_total: roll.priceTotal,
    currency: booking.currency || item0?.currency || null,
    supplier_code: booking.supplier_code || null,
    cancel_by_date: roll.cancelByDate,
    raw_booking_status: booking.booking_status ?? null,
    raw_non_refundable: roll.sampleNonRefundable,
    status: roll.status,
    raw: booking,
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

const fmtDay = (d) => d.toISOString().slice(0, 10);

async function syncWindow(windowStart, windowEnd, callBudget, onProgress) {
  let callsUsed = 0;
  let rowsLanded = 0;
  let fromRef = null;

  for (;;) {
    if (callsUsed >= callBudget) break;

    let url = `${GRN_API_BASE_URL}/hotels/bookings`
      + `?filter_type=booking_date`
      + `&start=${fmtDay(windowStart)}`
      + `&end=${fmtDay(windowEnd)}`
      + `&count=${GRN_PAGE_SIZE}`;
    if (fromRef) url += `&from=${encodeURIComponent(fromRef)}&direction=next`;

    const resp = await fetch(url, { headers: GRN_HEADERS() });
    callsUsed++;
    if (!resp.ok) throw new Error(`GRN /hotels/bookings returned HTTP ${resp.status}`);
    const data = await resp.json();

    if (data.error || data.error_code) {
      throw new Error(`GRN error: ${JSON.stringify(data).slice(0, 200)}`);
    }

    const bookings = data.bookings || [];
    if (bookings.length === 0) break;

    const rows = [];
    for (const b of bookings) {
      if (!b.booking_id) continue;
      const cityName = await getCityName(b.hotel?.city_code);
      rows.push(toRow(b, cityName));
    }
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      await sbUpsert('grn_bookings', rows.slice(i, i + UPSERT_BATCH), 'booking_id');
    }
    rowsLanded += rows.length;

    if (onProgress) await onProgress(rowsLanded);

    fromRef = bookings[bookings.length - 1].booking_reference;
    if (bookings.length < GRN_PAGE_SIZE || !fromRef) break;

    await sleep(PAUSE_BETWEEN_CALLS_MS);
  }

  return { rows: rowsLanded, calls: callsUsed };
}

async function runSync({ fromISO, toISO, mode }) {
  syncRunning = true;
  let total = 0;
  let callsUsed = 0;

  try {
    let windowFrom, windowTo;

    if (mode === 'range' && fromISO) {
      windowFrom = new Date(fromISO);
      windowTo = toISO ? new Date(toISO) : new Date();
    } else {
      windowTo = new Date();
      windowFrom = new Date(windowTo);
      windowFrom.setDate(windowFrom.getDate() - DEFAULT_INCREMENTAL_DAYS);
    }

    await setSyncState({
      last_run_status: 'running',
      last_run_at: new Date().toISOString(),
      last_run_error: null,
      progress: `Starting ${mode || 'incremental'} sync from ${fmtDay(windowFrom)}`,
    });

    let cursor = new Date(windowFrom);
    while (cursor < windowTo) {
      if (callsUsed >= MAX_CALLS_PER_RUN) {
        await setSyncState({
          progress: `Paused at call budget (${MAX_CALLS_PER_RUN}). ${total} synced. Run again to continue.`,
          watermark: cursor.toISOString(),
          bookings_synced: total,
        });
        break;
      }

      const winEnd = new Date(cursor);
      winEnd.setDate(winEnd.getDate() + GRN_WINDOW_DAYS);
      const cappedEnd = winEnd > windowTo ? windowTo : winEnd;

      const remainingBudget = MAX_CALLS_PER_RUN - callsUsed;
      const result = await syncWindow(cursor, cappedEnd, remainingBudget, async (n) => {
        await setSyncState({
          progress: `Syncing ${fmtDay(cursor)}–${fmtDay(cappedEnd)} · ${total + n} bookings so far`,
          bookings_synced: total + n,
        });
      });

      total += result.rows;
      callsUsed += result.calls;
      cursor = cappedEnd;

      await setSyncState({ watermark: cursor.toISOString(), bookings_synced: total });
      await sleep(PAUSE_BETWEEN_CALLS_MS);
    }

    await setSyncState({
      last_run_status: 'idle',
      progress: `Done — ${total} bookings synced through ${fmtDay(windowTo)} (${callsUsed} GRN calls)`,
      bookings_synced: total,
      watermark: windowTo.toISOString(),
    });
  } catch (err) {
    await setSyncState({
      last_run_status: 'error',
      last_run_error: String(err.message || err),
      progress: `Failed after ${total} bookings (${callsUsed} GRN calls)`,
    });
  } finally {
    syncRunning = false;
  }
}

function checkSecret(req, res) {
  if (!SYNC_SECRET) return true;
  if (req.query.secret !== SYNC_SECRET) {
    res.status(401).json({ error: 'Wrong or missing ?secret=' });
    return false;
  }
  return true;
}

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

  const mode = req.query.mode === 'range' ? 'range' : 'incremental';
  const fromISO = req.query.from ? `${req.query.from}T00:00:00Z` : null;
  const toISO = req.query.to ? `${req.query.to}T23:59:59Z` : null;

  runSync({ fromISO, toISO, mode });

  res.json({
    started: true,
    mode,
    from: mode === 'range' ? (fromISO || '(missing — range mode needs ?from=)') : `last ${DEFAULT_INCREMENTAL_DAYS} days`,
    to: mode === 'range' ? (toISO || 'now') : 'now',
    message: 'Sync started in the background. Poll /sync-status to watch it.',
  });
});

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
  'partial': 'Partial',
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
  const cityQuery = (req.query.city || '').trim();
  const cityWhere = cityQuery
    ? `&city_name=ilike.*${encodeURIComponent(cityQuery)}*`
    : '';

  const offset = (page - 1) * perPage;

  try {
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${dateWhere}${statusWhere}${cityWhere}`
        + `&select=booking_id,booking_reference,supplier_reference,booking_date,hotel_name,hotel_code,city_name,country_code,room_type,room_count,guest_name,board_basis,`
        + `checkin,checkin_date,checkout,price_total,currency,supplier_code,cancel_by_date,status,`
        + `raw_booking_status,raw_non_refundable,raw`
        + `&order=booking_date.desc&offset=${offset}&limit=${perPage}`,
      { 'Prefer': 'count=exact' }
    );

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
      rows: rows.map((r) => {
        const raw = r.raw || {};
        const hotel = raw.hotel || {};
        const item0 = hotel.booking_items?.[0] || {};
        const paxes = hotel.paxes || [];
        const adults = paxes.filter((p) => p.type === 'AD').length || null;
        const children = paxes.filter((p) => p.type === 'CH');
        const guests = paxes.map((p) => `${p.name || ''} ${p.surname || ''}`.trim()).filter(Boolean);
        const usdRate = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067 }[r.currency];
        const priceUsd = (r.price_total != null && usdRate) ? Math.round(Number(r.price_total) * usdRate) : null;
        return {
          bookingId: r.booking_id,
          bookingReference: r.booking_reference || raw.booking_reference || null,
          supplierReference: r.supplier_reference || raw.supplier_reference || raw.hotel?.hotel_confirmation_number || null,
          bookingDate: r.booking_date,
          hotelName: r.hotel_name || 'Unknown',
          hotelCode: r.hotel_code,
          address: hotel.address || null,
          city: r.city_name,
          country: r.country_code,
          roomType: r.room_type,
          roomCount: r.room_count,
          guestName: r.guest_name,
          guests,
          adults,
          childrenAges: children.map((c) => c.age).filter((a) => a != null),
          childrenCount: children.length,
          boardBasis: r.board_basis,
          checkin: r.checkin_date || r.checkin,
          checkout: r.checkout,
          priceTotal: r.price_total !== null ? Number(r.price_total) : null,
          priceUsd,
          currency: r.currency,
          supplier: r.supplier_code,
          lastCancellationDate: r.cancel_by_date,
          cancellationPolicy: item0.cancellation_policy?.details || null,
          nonRefundable: item0.non_refundable ?? null,
          status: r.status,
          rawBookingStatus: r.raw_booking_status,
        };
      }),
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



// ===========================================================================
// DASHBOARD DATA — all tiles, real, USD-converted
// ===========================================================================
const USD_RATES = {
  USD: 1.0, EUR: 1.1446, GBP: 1.3401, INR: 0.011765, AED: 0.27225,
  AUD: 0.6960, THB: 0.0301, NOK: 0.1016, IDR: 0.0000553, NPR: 0.007353,
  SGD: 0.7770, MYR: 0.2360, JPY: 0.0067, CNY: 0.1400, HKD: 0.1280,
  SAR: 0.2666, QAR: 0.2747, KWD: 3.26, BHD: 2.65, OMR: 2.60,
  LKR: 0.0033, ZAR: 0.0550, TRY: 0.029, EGP: 0.0203, MXN: 0.0575,
};

function toUsd(amount, currency) {
  if (amount == null) return 0;
  const rate = USD_RATES[currency];
  if (!rate) return 0;
  return parseFloat(amount) * rate;
}

const SNAPSHOT_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours
let snapshotComputing = false;

async function computeDashboard() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUtc = new Date();
  const nowIst = new Date(nowUtc.getTime() + IST_OFFSET_MS);

  const nowIso = nowUtc.toISOString();
  const todayIso = nowIst.toISOString().slice(0, 10);

    const plusDays = (d) => { const x = new Date(nowUtc.getTime() + d * 86400000); return x.toISOString(); };
    const in3Iso = plusDays(3);
    const in7Iso = new Date(nowIst.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const in30Iso = new Date(nowIst.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    const liveWhere =
      `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
      `&checkin_date=gte.${todayIso}` +
      `&raw_booking_status=not.ilike.cancel*`;
    const liveCount = await sbCount('grn_bookings', liveWhere);

    const checkin7Count = await sbCount('grn_bookings',
      `checkin_date=gte.${todayIso}&checkin_date=lte.${in7Iso}` +
      `&cancel_by_date=gt.${encodeURIComponent(nowIso)}`);
    const checkin30Count = await sbCount('grn_bookings',
      `checkin_date=gte.${todayIso}&checkin_date=lte.${in30Iso}` +
      `&cancel_by_date=gt.${encodeURIComponent(nowIso)}`);

    const expiringCount = await sbCount('grn_bookings',
      `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
      `&cancel_by_date=lte.${encodeURIComponent(in3Iso)}` +
      `&checkin_date=gte.${todayIso}`);

    async function closingWithinDays(days) {
      const end = days === null ? null : new Date(nowUtc.getTime() + days * 86400000).toISOString();
      let where =
        `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
        `&checkin_date=gte.${todayIso}` +
        `&raw_booking_status=not.ilike.cancel*`;
      if (end) where += `&cancel_by_date=lte.${encodeURIComponent(end)}`;
      let valueUsd = 0, count = 0, scanned = 0;
      const PAGE = 1000, MAX_SCAN = 25000;
      for (;;) {
        const { rows } = await sbSelect('grn_bookings',
          `${where}&select=price_total,currency&limit=${PAGE}&offset=${scanned}`);
        if (!rows.length) break;
        for (const r of rows) { valueUsd += toUsd(r.price_total, r.currency); count++; }
        scanned += rows.length;
        if (rows.length < PAGE || scanned >= MAX_SCAN) break;
      }
      return { valueUsd: Math.round(valueUsd), count };
    }

    const closing = {
      d7: await closingWithinDays(7),
      d30: await closingWithinDays(30),
      d90: await closingWithinDays(90),
      all: await closingWithinDays(null),
    };

    let liveValueUsd = 0;
    let valueBasis = 'exact';
    {
      const PAGE = 1000;
      let offset = 0;
      let scanned = 0;
      const MAX_SCAN = 20000;
      for (;;) {
        const { rows } = await sbSelect('grn_bookings',
          `${liveWhere}&select=price_total,currency&limit=${PAGE}&offset=${offset}`);
        if (!rows.length) break;
        for (const r of rows) liveValueUsd += toUsd(r.price_total, r.currency);
        scanned += rows.length;
        offset += PAGE;
        if (rows.length < PAGE) break;
        if (scanned >= MAX_SCAN) { valueBasis = 'capped'; break; }
      }
      if (valueBasis === 'capped' && liveCount > scanned) {
        liveValueUsd = liveValueUsd * (liveCount / scanned);
      }
    }

    let caughtCount = 0;
    let caughtSavedUsd = 0;
    let caughtBasis = 'no_rebookings_yet';
    try {
      const monthStart = todayIso.slice(0, 8) + '01';
      const { rows } = await sbSelect('rebookings',
        `created_at=gte.${monthStart}&select=saved_amount,saved_currency`);
      caughtCount = rows.length;
      for (const r of rows) caughtSavedUsd += toUsd(r.saved_amount, r.saved_currency);
      caughtBasis = 'live';
    } catch {
      // table doesn't exist yet — that's fine, honest zero
    }

    const cityCounts = {};
    const cityValue = {};
    {
      const PAGE = 1000;
      let offset = 0;
      let scanned = 0;
      const MAX_SCAN = 20000;
      for (;;) {
        const { rows } = await sbSelect('grn_bookings',
          `${liveWhere}&select=city_name,price_total,currency&limit=${PAGE}&offset=${offset}`);
        if (!rows.length) break;
        for (const r of rows) {
          const c = r.city_name || 'Unknown';
          cityCounts[c] = (cityCounts[c] || 0) + 1;
          cityValue[c] = (cityValue[c] || 0) + toUsd(r.price_total, r.currency);
        }
        scanned += rows.length;
        offset += PAGE;
        if (rows.length < PAGE) break;
        if (scanned >= MAX_SCAN) break;
      }
    }
    const topCities = Object.entries(cityCounts)
      .filter(([c]) => c !== 'Unknown')
      .map(([city, count]) => ({ city, count, valueUsd: Math.round(cityValue[city] || 0) }))
      .sort((a, b) => b.valueUsd - a.valueUsd)
      .slice(0, 10);

    const state = await getSyncState().catch(() => null);

    return {
      currency: 'USD',
      generatedAt: nowIso,
      tiles: {
        liveRebookable: { count: liveCount, valueUsd: Math.round(liveValueUsd), valueBasis },
        checkingIn7: { count: checkin7Count },
        checkingIn30: { count: checkin30Count },
        expiringSoon: { count: expiringCount, windowDays: 3 },
        caughtThisMonth: { count: caughtCount, savedUsd: Math.round(caughtSavedUsd), basis: caughtBasis },
      },
      closing,
      topCities,
      sync: {
        syncedThrough: state?.watermark || null,
        lastStatus: state?.last_run_status || null,
      },
    };
}

async function readSnapshot() {
  const { rows } = await sbSelect('dashboard_snapshot', 'id=eq.1&select=*');
  return rows[0] || null;
}

async function writeSnapshot(payload) {
  await sbUpsert('dashboard_snapshot',
    [{ id: 1, computed_at: new Date().toISOString(), payload }], 'id');
}

async function refreshSnapshot() {
  if (snapshotComputing) return { skipped: true };
  snapshotComputing = true;
  try {
    const payload = await computeDashboard();
    await writeSnapshot(payload);
    return { payload };
  } finally {
    snapshotComputing = false;
  }
}

router.get('/dashboard', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    let snap = await readSnapshot();

    if (!snap || !snap.payload) {
      const { payload } = await refreshSnapshot();
      return res.json({ ...payload, snapshot: { computedAt: new Date().toISOString(), fresh: true, firstRun: true } });
    }

    const ageMs = Date.now() - new Date(snap.computed_at).getTime();
    const stale = ageMs > SNAPSHOT_STALE_MS;

    if (stale && !snapshotComputing) {
      refreshSnapshot().catch(() => {});
    }

    res.json({
      ...snap.payload,
      snapshot: { computedAt: snap.computed_at, ageMinutes: Math.round(ageMs / 60000), stale, refreshing: snapshotComputing },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard-refresh', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    if (snapshotComputing) {
      return res.json({ started: false, message: 'A refresh is already running.' });
    }
    const { payload } = await refreshSnapshot();
    res.json({ ...payload, snapshot: { computedAt: new Date().toISOString(), fresh: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================================
// REPRICING — manual, one-booking-at-a-time price checks.
// ===========================================================================

router.get('/repricing/candidates', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
  const offset = (page - 1) * perPage;
  const nowIso = new Date().toISOString();
  const todayIso = nowIso.slice(0, 10);
  const cityQuery = (req.query.city || '').trim();
  const cityWhere = cityQuery ? `&city_name=ilike.*${encodeURIComponent(cityQuery)}*` : '';

  const where =
    `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
    `&checkin_date=gte.${todayIso}` +
    `&raw_booking_status=not.ilike.cancel*` +
    cityWhere;

  try {
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${where}&select=booking_id,hotel_name,hotel_code,city_name,country_code,room_type,room_count,`
        + `board_basis,checkin,checkin_date,checkout,price_total,currency,supplier_code,cancel_by_date,raw`
        + `&order=cancel_by_date.asc&offset=${offset}&limit=${perPage}`,
      { 'Prefer': 'count=exact' }
    );

    const ids = rows.map((r) => r.booking_id);
    const lastChecks = {};
    if (ids.length) {
      const inList = ids.map((i) => `"${i}"`).join(',');
      const { rows: checks } = await sbSelect('grn_price_checks',
        `booking_id=in.(${encodeURIComponent(inList)})&select=booking_id,checked_at,live_usd,dropped,gap_usd,gap_pct&order=checked_at.desc`);
      for (const c of checks) if (!lastChecks[c.booking_id]) lastChecks[c.booking_id] = c;
    }

    res.json({
      page, perPage, total: total ?? 0,
      hasMore: offset + perPage < (total ?? 0),
      rows: rows.map((r) => {
        const usdRate = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067 }[r.currency];
        const origUsd = (r.price_total != null && usdRate) ? Math.round(Number(r.price_total) * usdRate) : null;
        const last = lastChecks[r.booking_id] || null;
        return {
          bookingId: r.booking_id,
          hotel: r.hotel_name,
          hotelCode: r.hotel_code,
          city: r.city_name,
          room: r.room_type,
          board: r.board_basis,
          checkin: r.checkin_date || r.checkin,
          checkout: r.checkout,
          origLocal: r.price_total != null ? Number(r.price_total) : null,
          origCur: r.currency,
          origUsd,
          supplier: r.supplier_code,
          cancelBy: r.cancel_by_date,
          lastCheck: last ? {
            checkedAt: last.checked_at, liveUsd: last.live_usd, dropped: last.dropped,
            gapUsd: last.gap_usd, gapPct: last.gap_pct,
          } : null,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/repricing/history', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });
  try {
    const { rows } = await sbSelect('grn_price_checks',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=checked_at,live_usd,live_price,live_currency,dropped,gap_usd,gap_pct,room_match,board_match,dates_match&order=checked_at.desc&limit=50`);
    res.json({ bookingId, checks: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/repricing/check', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  const bookingId = req.body?.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });

  try {
    const { rows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=booking_id,hotel_code,checkin,checkin_date,checkout,room_type,board_basis,price_total,currency,raw&limit=1`);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: 'Booking not found in synced table' });
    if (!b.hotel_code) return res.status(400).json({ error: 'Booking has no hotel_code — cannot reprice' });

    const checkin = (b.checkin_date || b.checkin || '').slice(0, 10);
    const checkout = (b.checkout || '').slice(0, 10);
    if (!checkin || !checkout) return res.status(400).json({ error: 'Booking missing check-in/out dates' });

    const item0 = b.raw?.hotel?.booking_items?.[0];
    const paxes = b.raw?.hotel?.paxes || [];
    const adults = paxes.filter((p) => p.type === 'AD').length || 2;
    const childAges = paxes.filter((p) => p.type === 'CH').map((p) => p.age).filter((a) => a != null);
    const roomReq = { adults };
    if (childAges.length) roomReq.children_ages = childAges;

    const origItem = b.raw?.hotel?.booking_items?.[0] || {};
    const origRoomCode = origItem.room_code || null;
    const origRoomType = origItem.room_type || b.room_type || null;
    const origBoard = (origItem.boarding_details && origItem.boarding_details.join(', ')) || b.board_basis || null;

    const payload = {
      rooms: [roomReq],
      rates: 'comprehensive',
      hotel_codes: [String(b.hotel_code)],
      currency: b.currency || 'USD',
      client_nationality: 'US',
      checkin,
      checkout,
      purpose_of_travel: 1,
    };
    const resp = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST', headers: GRN_HEADERS(), body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: 'GRN availability error', details: data });

    const norm = (s) => String(s || '').trim().toLowerCase();
    const hotel = (data.hotels || [])[0];

    let allRates = [];
    if (hotel) {
      if (Array.isArray(hotel.rates)) allRates = hotel.rates;
      else if (hotel.min_rate) allRates = [hotel.min_rate];
    }

    function rateRoomCode(rate) {
      return rate?.rooms?.[0]?.room_code || rate?.room_code || null;
    }
    function rateRoomType(rate) {
      return rate?.rooms?.[0]?.room_type || rate?.rooms?.[0]?.description || null;
    }
    function rateBoard(rate) {
      return rate?.boarding_details ? rate.boarding_details.join(', ') : null;
    }

    let chosen = null, matchBasis = 'none';
    if (origRoomCode) {
      chosen = allRates.find((r) => rateRoomCode(r) && norm(rateRoomCode(r)) === norm(origRoomCode)) || null;
      if (chosen) matchBasis = 'room_code';
    }
    if (!chosen && origRoomType) {
      chosen = allRates.find((r) => rateRoomType(r) && norm(rateRoomType(r)) === norm(origRoomType)) || null;
      if (chosen) matchBasis = 'room_name';
    }
    if (!chosen && allRates.length) {
      chosen = [...allRates].sort((a, b2) => (Number(a.price) || 1e12) - (Number(b2.price) || 1e12))[0];
      matchBasis = 'cheapest_fallback';
    }

    const minRate = chosen;
    const liveRoom = minRate?.rooms?.[0] || null;

    const usdRate = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067 };
    const origLocal = b.price_total != null ? Number(b.price_total) : null;
    const origCur = b.currency || 'USD';
    const origUsd = (origLocal != null && usdRate[origCur]) ? origLocal * usdRate[origCur] : null;

    const liveLocal = minRate?.price != null ? Number(minRate.price) : null;
    const liveCur = minRate?.currency || origCur;
    const liveUsd = (liveLocal != null && usdRate[liveCur]) ? liveLocal * usdRate[liveCur] : null;

    const roomMatch = matchBasis === 'room_code' ? true
      : matchBasis === 'room_name' ? true
      : (liveRoom ? norm(liveRoom.room_type || liveRoom.description) === norm(origRoomType) : null);
    const boardMatch = rateBoard(minRate) ? norm(rateBoard(minRate)) === norm(origBoard) : null;
    const datesMatch = (data.checkin?.slice(0,10) === checkin && data.checkout?.slice(0,10) === checkout);

    const gapUsd = (origUsd != null && liveUsd != null) ? Math.round((origUsd - liveUsd) * 100) / 100 : null;
    const gapPct = (gapUsd != null && origUsd) ? Math.round((gapUsd / origUsd) * 100) : null;
    const dropped = gapUsd != null ? gapUsd > 0 : false;

    await sbUpsert('grn_price_checks', [{
      booking_id: bookingId,
      checked_at: new Date().toISOString(),
      original_price: origLocal, original_currency: origCur, original_usd: origUsd != null ? Math.round(origUsd) : null,
      live_price: liveLocal, live_currency: liveCur, live_usd: liveUsd != null ? Math.round(liveUsd) : null,
      dropped, gap_usd: gapUsd, gap_pct: gapPct,
      room_match: roomMatch, board_match: boardMatch, dates_match: datesMatch,
      raw: minRate ? { ...minRate, _match_basis: matchBasis, _rooms_returned: allRates.length } : { note: 'no availability returned' },
      source: 'manual',
    }], 'id');

    const usdOf = (amt, cur) => (amt != null && usdRate[cur]) ? Math.round(Number(amt) * usdRate[cur]) : null;
    const allRatesOut = allRates.map((rt) => {
      const rm = rt?.rooms?.[0] || {};
      const local = rt?.price != null ? Number(rt.price) : null;
      const cur = rt?.currency || origCur;
      const usd = usdOf(local, cur);
      const isMatch = origRoomCode && rateRoomCode(rt) && norm(rateRoomCode(rt)) === norm(origRoomCode);
      return {
        roomType: rm.room_type || rm.description || rt.room_type || '—',
        board: rateBoard(rt) || '—',
        local, currency: cur, usd,
        refundable: rt?.non_refundable === false,
        cancelBy: rt?.cancellation_policy?.cancel_by_date || null,
        vsOriginalUsd: (usd != null && origUsd != null) ? Math.round(origUsd - usd) : null,
        isMatch: !!isMatch,
      };
    }).sort((a, b) => (a.usd ?? 1e12) - (b.usd ?? 1e12));

    res.json({
      bookingId,
      checkedAt: new Date().toISOString(),
      original: { local: origLocal, currency: origCur, usd: origUsd != null ? Math.round(origUsd) : null, room: origRoomType, board: origBoard, checkin, checkout },
      live: liveLocal != null
        ? { local: liveLocal, currency: liveCur, usd: liveUsd != null ? Math.round(liveUsd) : null,
            room: liveRoom?.room_type || liveRoom?.description || null,
            board: rateBoard(minRate) || null,
            cancelBy: minRate?.cancellation_policy?.cancel_by_date || null }
        : null,
      available: liveLocal != null,
      dropped, gapUsd, gapPct,
      matchBasis,
      match: { room: roomMatch, board: boardMatch, dates: datesMatch },
      allRates: allRatesOut,
    });
  } catch (err) {
    res.status(500).json({ error: 'Price check failed', message: String(err.message || err) });
  }
});

// GET /repricing/searches — the conversion story for Rebookings.
// Reads the real check log (grn_price_checks). Shows searches made, drops
// found, and how many were actionable (like-for-like on the matching room).
//
// UPDATED: now also selects original_price/currency, live_price/currency,
// and raw (the matched rate + _match_basis, stored at check time), so the
// Searches Made page can render a full Original-vs-Live comparison with
// room/board/dates match ticks — not just USD summary numbers.
router.get('/repricing/searches', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 25;
  const offset = (page - 1) * perPage;

  try {
    const { rows: checks, total } = await sbSelect('grn_price_checks',
      `select=id,booking_id,checked_at,original_price,original_currency,original_usd,`
      + `live_price,live_currency,live_usd,dropped,gap_usd,gap_pct,room_match,board_match,dates_match,raw`
      + `&order=checked_at.desc&offset=${offset}&limit=${perPage}`,
      { 'Prefer': 'count=exact' });

    const ids = [...new Set(checks.map((c) => c.booking_id))];
    const info = {};
    if (ids.length) {
      const inList = ids.map((i) => `"${i}"`).join(',');
      const { rows: bk } = await sbSelect('grn_bookings',
        `booking_id=in.(${encodeURIComponent(inList)})&select=booking_id,hotel_name,city_name,room_type,currency`);
      for (const b of bk) info[b.booking_id] = b;
    }

    const summaryRows = await sbSelect('grn_price_check_summary', 'select=*').then((r) => r.rows).catch(() => []);
    const summary = summaryRows[0] || {};
    const { total: actionableDrops } = await sbSelect('grn_price_checks',
      `dropped=eq.true&room_match=eq.true&dates_match=eq.true&select=id`, { 'Prefer': 'count=exact' });

    res.json({
      page, perPage, total: total ?? 0,
      hasMore: offset + perPage < (total ?? 0),
      funnel: {
        totalChecks: Number(summary.total_checks || 0),
        bookingsChecked: Number(summary.bookings_checked || 0),
        dropsFound: Number(summary.drops_found || 0),
        actionableDrops: actionableDrops ?? 0,
        totalGapUsd: Math.round(Number(summary.total_gap_usd || 0)),
      },
      rows: checks.map((c) => {
        const b = info[c.booking_id] || {};
        const actionable = c.dropped && c.room_match === true && c.dates_match === true;
        const matchedRate = c.raw || {};
        return {
          id: c.id,
          bookingId: c.booking_id,
          hotel: b.hotel_name || c.booking_id,
          city: b.city_name || null,
          room: b.room_type || null,
          checkedAt: c.checked_at,

          originalLocal: c.original_price != null ? Number(c.original_price) : null,
          originalCurrency: c.original_currency || null,
          originalUsd: c.original_usd,

          liveLocal: c.live_price != null ? Number(c.live_price) : null,
          liveCurrency: c.live_currency || null,
          liveUsd: c.live_usd,
          liveRoom: matchedRate?.rooms?.[0]?.room_type || matchedRate?.rooms?.[0]?.description || null,
          liveBoard: matchedRate?.boarding_details ? matchedRate.boarding_details.join(', ') : null,

          dropped: c.dropped,
          gapUsd: c.gap_usd,
          gapPct: c.gap_pct,

          roomMatch: c.room_match,
          boardMatch: c.board_match,
          datesMatch: c.dates_match,
          matchBasis: matchedRate?._match_basis || null,

          actionable,
          result: c.live_usd == null ? 'sold_out' : c.dropped ? (actionable ? 'drop_actionable' : 'drop_different_room') : (c.gap_usd != null && c.gap_usd < 0 ? 'higher' : 'no_drop'),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/repricing/rebookings', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 25;
  const offset = (page - 1) * perPage;
  const status = (req.query.status || 'all').toLowerCase();

  try {
    let where = '';
    if (status === 'successful') where = 'status=in.(confirmed,success)';
    else if (status === 'errors') where = 'status=in.(error,failed)';

    let rows = [], total = 0;
    try {
      const q = (where ? where + '&' : '') + `select=*&order=created_at.desc&offset=${offset}&limit=${perPage}`;
      const r = await sbSelect('grn_rebookings', q, { 'Prefer': 'count=exact' });
      rows = r.rows; total = r.total ?? 0;
    } catch {
      rows = []; total = 0;
    }

    let counts = { successful: 0, errors: 0, all: 0 };
    try {
      counts.all = await sbCount('grn_rebookings', '');
      counts.successful = await sbCount('grn_rebookings', 'status=in.(confirmed,success)');
      counts.errors = await sbCount('grn_rebookings', 'status=in.(error,failed)');
    } catch { /* empty */ }

    res.json({
      page, perPage, total, hasMore: offset + perPage < total,
      counts,
      rows: rows.map((r) => ({
        id: r.id,
        bookingId: r.booking_id,
        hotel: r.hotel_name,
        city: r.city_name || r.city,
        room: r.room_type,
        checkin: r.checkin_date || r.checkin,
        originalUsd: r.original_usd,
        rebookedUsd: r.rebooked_usd,
        savedUsd: r.saved_usd,
        supplier: r.supplier_code || r.supplier,
        status: r.status,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
