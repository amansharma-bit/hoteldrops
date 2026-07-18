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

// -------------------------------------------------------------------------
// RATE-LIMIT & FOOTPRINT SETTINGS — deliberately conservative.
//
// This runs against GRN's REAL production API. We are a guest on Naveen's
// infrastructure. So the sync trickles rather than floods:
//   - one page at a time, never parallel booking pulls
//   - a deliberate pause between every GRN call
//   - a hard ceiling on calls per run, so it can never run away
//   - incremental by default: after the first fill, only pull what's NEW
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// MULTI-ROOM ROLLUP — the heart of the correctness fix.
//
// Confirmed from GRN's doc: a booking can have MANY booking_items, each with
// its OWN price, non_refundable flag, and cancellation deadline. The old code
// read booking.non_refundable at the TOP level (doesn't exist) and only ever
// looked at booking_items[0].
//
// Roll-up rules (agreed with Aman):
//   price  = SUM of every item's price
//   status = Cancelled (if booking says so) > else derived from the rooms:
//              all refundable      -> Refundable
//              all non-refundable  -> Non-Refundable
//              a mix               -> Partial
//              field truly missing -> Unknown
//   cancel_by_date = the EARLIEST deadline across rooms (tightest window is
//                    the one that governs when we must act)
// -------------------------------------------------------------------------
function rollUpBooking(booking) {
  const items = booking.hotel?.booking_items || [];

  // Cancelled always wins.
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
    // For the raw_* audit columns we record the first item's flag as a sample,
    // but 'status' above is the real, rolled-up answer.
    sampleNonRefundable: typeof items[0]?.non_refundable === 'boolean' ? items[0].non_refundable : null,
  };
}

// Build a DB row from ONE booking object as returned by GET /hotels/bookings.
// (No detail call — the list response already contains everything.)
function toRow(booking, cityName) {
  const roll = rollUpBooking(booking);
  const item0 = booking.hotel?.booking_items?.[0];
  const room0 = item0?.rooms?.[0];

  // Guest name: prefer holder, fall back to first pax.
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
    checkin_date: checkinDate,           // first-class copy — the product's spine
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
    raw: booking,                        // the safety net — full JSON kept
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

const fmtDay = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD, per GRN doc

// Sync ONE date window (<= 30 days) using the CONFIRMED endpoint:
//   GET /hotels/bookings?filter_type=booking_date&start&end&count&from&direction
// The list response already contains full booking objects, so NO detail calls.
// Cursor pagination: first page by dates, then from=<last ref>&direction=next.
// Returns { rows: n, calls: n } so the caller can enforce the per-run budget.
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

    // GRN returns some errors as 200 with an error code in the body.
    if (data.error || data.error_code) {
      throw new Error(`GRN error: ${JSON.stringify(data).slice(0, 200)}`);
    }

    const bookings = data.bookings || [];
    if (bookings.length === 0) break;

    // Build rows. City-name resolution is a local cache lookup (no GRN call
    // after the one-time city list load), so it's cheap.
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

    // Advance the cursor. If GRN gave us fewer than a full page, we're done.
    fromRef = bookings[bookings.length - 1].booking_reference;
    if (bookings.length < GRN_PAGE_SIZE || !fromRef) break;

    await sleep(PAUSE_BETWEEN_CALLS_MS); // be a polite guest
  }

  return { rows: rowsLanded, calls: callsUsed };
}

// The whole job. Runs in the background — never inside a request.
//
// mode:
//   'incremental' (default) — only the last DEFAULT_INCREMENTAL_DAYS. Tiny.
//   'range'                 — explicit fromISO..toISO, walked in <=30-day windows.
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
      // Incremental: just look back a couple of days from now. Cheap, routine,
      // safe to run often. This is what a scheduled job would call.
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

    // Walk the whole span in <=30-day windows (endpoint limit), oldest first.
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
  // These /api/live-search routes already sit behind this app's existing auth
  // middleware — an unauthenticated request never reaches this function; it
  // gets "Not authenticated. Please sign in." instead. Confirmed by hitting
  // this URL in a plain browser tab.
  //
  // So SYNC_SECRET is an OPTIONAL second lock. If it isn't set, we rely on
  // the login that's already protecting the route. If it IS set, we enforce
  // it as well.
  if (!SYNC_SECRET) return true;
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

  // Default is a tiny INCREMENTAL sync (last 2 days). To pull a specific
  // historical span, pass ?mode=range&from=YYYY-MM-DD&to=YYYY-MM-DD.
  const mode = req.query.mode === 'range' ? 'range' : 'incremental';
  const fromISO = req.query.from ? `${req.query.from}T00:00:00Z` : null;
  const toISO = req.query.to ? `${req.query.to}T23:59:59Z` : null;

  runSync({ fromISO, toISO, mode }); // not awaited — must not block the request

  res.json({
    started: true,
    mode,
    from: mode === 'range' ? (fromISO || '(missing — range mode needs ?from=)') : `last ${DEFAULT_INCREMENTAL_DAYS} days`,
    to: mode === 'range' ? (toISO || 'now') : 'now',
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

  const offset = (page - 1) * perPage;

  try {
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${dateWhere}${statusWhere}`
        + `&select=booking_id,booking_reference,booking_date,hotel_name,city_name,country_code,room_type,room_count,guest_name,board_basis,`
        + `checkin,checkin_date,checkout,price_total,currency,supplier_code,cancel_by_date,status,`
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
        bookingReference: r.booking_reference,
        bookingDate: r.booking_date,
        hotelName: r.hotel_name || 'Unknown',
        city: r.city_name,
        country: r.country_code,
        roomType: r.room_type,
        roomCount: r.room_count,
        guestName: r.guest_name,
        boardBasis: r.board_basis,
        checkin: r.checkin_date || r.checkin,
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



// ===========================================================================
// DASHBOARD DATA — all tiles, real, USD-converted
// ===========================================================================
// ---- USD conversion rates (same table used elsewhere in the codebase) ----
// These are static reference rates; fine for dashboard display. A live-rate
// refresh can come later. Everything shown in USD.
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
  if (!rate) return 0;               // unknown currency -> excluded, not guessed
  return parseFloat(amount) * rate;
}

// ===========================================================================
// GET /api/live-search/dashboard
// Returns every tile the Dashboard needs, all real.
// ===========================================================================
router.get('/dashboard', async (req, res) => {
  if (!sbConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.slice(0, 10);

    // Cut-offs for the "soon" windows.
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const in3 = new Date(); in3.setDate(in3.getDate() + 3);
    const in7Iso = in7.toISOString().slice(0, 10);
    const in30Iso = in30.toISOString().slice(0, 10);
    const in3Iso = in3.toISOString();

    // ---- LIVE REBOOKABLE INVENTORY -------------------------------------
    // Still cancellable AND guest hasn't checked in yet. This is the working
    // set the whole product operates on.
    const liveWhere =
      `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
      `&checkin_date=gte.${todayIso}` +
      `&raw_booking_status=not.ilike.cancel*`;
    const liveCount = await sbCount('grn_bookings', liveWhere);

    // ---- CHECKING IN SOON (imminent revenue) ---------------------------
    const checkin7Count = await sbCount('grn_bookings',
      `checkin_date=gte.${todayIso}&checkin_date=lte.${in7Iso}` +
      `&cancel_by_date=gt.${encodeURIComponent(nowIso)}`);
    const checkin30Count = await sbCount('grn_bookings',
      `checkin_date=gte.${todayIso}&checkin_date=lte.${in30Iso}` +
      `&cancel_by_date=gt.${encodeURIComponent(nowIso)}`);

    // ---- EXPIRING SOON (cancel window closing in <=3 days) -------------
    const expiringCount = await sbCount('grn_bookings',
      `cancel_by_date=gt.${encodeURIComponent(nowIso)}` +
      `&cancel_by_date=lte.${encodeURIComponent(in3Iso)}` +
      `&checkin_date=gte.${todayIso}`);

    // ---- USD VALUE of the live inventory --------------------------------
    // We page through the live set pulling just price+currency, convert, sum.
    // Capped for safety; if the set is huge we sample and scale, stating so.
    let liveValueUsd = 0;
    let valueBasis = 'exact';
    {
      const PAGE = 1000;
      let offset = 0;
      let scanned = 0;
      const MAX_SCAN = 20000; // safety ceiling on the dashboard query
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
        // scale the partial sum up to the full count, and say so
        liveValueUsd = liveValueUsd * (liveCount / scanned);
      }
    }

    // ---- CAUGHT THIS MONTH (savings) -----------------------------------
    // Honest zero until the rebooking engine runs. We read from a rebookings
    // table if it exists; otherwise report zero cleanly.
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

    // ---- DAILY TREND, scoped to the selected PERIOD -------------------
    // Today / WTD / MTD / YTD, filtered by booking_date. The action tiles
    // above stay always-live; only this trend responds to the buttons.
    const period = (req.query.period || 'Today');
    const trendStart = new Date();
    if (period === 'Today') { trendStart.setHours(0, 0, 0, 0); }
    else if (period === 'WTD') { trendStart.setDate(trendStart.getDate() - trendStart.getDay()); trendStart.setHours(0,0,0,0); }
    else if (period === 'MTD') { trendStart.setDate(1); trendStart.setHours(0,0,0,0); }
    else if (period === 'YTD') { trendStart.setMonth(0, 1); trendStart.setHours(0,0,0,0); }
    else { trendStart.setDate(trendStart.getDate() - 30); } // fallback
    const trendFromIso = trendStart.toISOString();
    const trend = {};
    {
      const PAGE = 1000;
      let offset = 0;
      for (;;) {
        const { rows } = await sbSelect('grn_bookings',
          `booking_date=gte.${encodeURIComponent(trendFromIso)}` +
          `&select=booking_date&limit=${PAGE}&offset=${offset}`);
        if (!rows.length) break;
        for (const r of rows) {
          const day = String(r.booking_date || '').slice(0, 10);
          if (day) trend[day] = (trend[day] || 0) + 1;
        }
        offset += PAGE;
        if (rows.length < PAGE) break;
      }
    }
    const dailyTrend = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ---- TOP 10 CITIES by live rebookable volume + USD value -----------
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
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count, valueUsd: Math.round(cityValue[city] || 0) }));

    // ---- freshness ------------------------------------------------------
    const state = await getSyncState().catch(() => null);

    res.json({
      currency: 'USD',
      generatedAt: nowIso,
      tiles: {
        liveRebookable: { count: liveCount, valueUsd: Math.round(liveValueUsd), valueBasis },
        checkingIn7: { count: checkin7Count },
        checkingIn30: { count: checkin30Count },
        expiringSoon: { count: expiringCount, windowDays: 3 },
        caughtThisMonth: { count: caughtCount, savedUsd: Math.round(caughtSavedUsd), basis: caughtBasis },
      },
      dailyTrend,
      topCities,
      sync: {
        syncedThrough: state?.watermark || null,
        lastStatus: state?.last_run_status || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
