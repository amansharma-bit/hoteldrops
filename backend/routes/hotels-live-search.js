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
//
// ---------------------------------------------------------------------------
// 26 Jul 2026 — REBOOK SAFETY GATE
//
// A real check on GRN-202605-2506790 (Glen Eyrie Castle) showed the old
// matcher marking room/board/dates all green on a rate that was:
//   - a DIFFERENT physical room (booking = "Big Horn Lodge",
//     live = "Oaks Lodge" — both share the room_type "Standard 2 Queen
//     Lodge", so name matching passed),
//   - NON-REFUNDABLE where the original was REFUNDABLE, and
//   - carrying a supplier condition reading "Cancelled and rebooked
//     reservations will be rejected, regardless of the source reported
//     to the hotel."
//
// Only the price going UP kept the Rebook button hidden. Had it dropped,
// the old gate (dropped && room_match && dates_match) would have passed it.
//
// The gate is now: room_code exact, board equal, cancellation terms equal
// or better, occupancy equal, supplier terms silent on rebooking, and a
// real drop. Room NAME matching is display-only and can never authorise a
// rebook. Enforcement is server-side — hiding the button is not the control.
// ===========================================================================

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const GRN_STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';

// How long GRN waits for its upstream suppliers before cutting them off, in ms.
//
// GRN's default is 10,000. Mize sends 50,000 on every observed production
// trace, and an observed search took 14 seconds to return 60+ rates — so at
// the default that list would have been truncated mid-answer. Some suppliers
// take close to a minute to respond, and a rate that arrives at 55s is a rate
// we would otherwise never see.
//
// Configurable because it is not certain whether 50,000 is GRN's hard ceiling
// or simply Mize's choice. Raise GRN_CUTOFF_TIME to test a higher value; if
// GRN rejects it, the search will fail with a validation error rather than
// silently misbehave.
//
// Note the timeout chain if you raise this much above 50s: browser fetch ->
// Railway proxy -> this route -> GRN. Railway's proxy allows well over a
// minute, so 50–60s is safe, but the operator does sit and wait for it.
const GRN_CUTOFF_TIME = parseInt(process.env.GRN_CUTOFF_TIME, 10) || 50000;

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

// Declared here (not at the bottom) so it is defined before the rebook route
// calls it. Function declarations hoist, but keeping it near its siblings
// makes the dependency obvious to the next person reading this file.
async function sbInsertReturning(table, row) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body: JSON.stringify([row]),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase insert into ${table} failed (${resp.status}): ${text}`);
  }
  const rows = await resp.json();
  return { rows };
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
// GRN CALL WRAPPER + LOGGING
//
// Every GRN call in the rebooking chain goes through grnCall(). It records the
// request, the response, the HTTP status, GRN's own error_code, and the
// duration into grn_api_log — modelled on Mize's per-step log viewer, which is
// the only reason their failures are diagnosable at all.
//
// Deliberate choices:
//
// - HEADERS ARE NEVER LOGGED. The GRN API key travels in a header and must not
//   land in a table.
// - error_code is pulled into its own column. GRN returns application errors as
//   HTTP 200 with a code in the body, so without this you cannot count failure
//   reasons without grepping JSON.
// - Logging failures never break the call. A log write that throws is
//   swallowed; losing a log line is not worth failing a booking over.
//
// classifyGrnOutcome() is the important part. Mize treats every non-success as
// "failed" and stops. Their own data shows why that is wrong: of 52 failures in
// one month, 15 were cancel-stage (replacement live, original not cancelled)
// and 18 were network errors with no response at all — and none recorded the
// new booking reference. A 500 after 20 seconds is not a rejection, it is an
// unknown, and the docs are explicit that an unknown must be resolved by
// fetching the booking.
// ===========================================================================

const GRN_OUTCOME = {
  OK: 'ok',                 // 2xx and no error_code — definitively succeeded
  REJECTED: 'rejected',     // HTTP 200 with an error_code — definitively did not happen
  UNKNOWN: 'unknown',       // 5xx, network failure, timeout — MUST be resolved by fetching
};

function classifyGrnOutcome({ httpStatus, body, networkError }) {
  if (networkError) return GRN_OUTCOME.UNKNOWN;
  if (httpStatus >= 500 || httpStatus === 0) return GRN_OUTCOME.UNKNOWN;
  if (httpStatus === 408 || httpStatus === 429) return GRN_OUTCOME.UNKNOWN;
  const code = body && (body.error_code ?? body.errorCode);
  if (code) return GRN_OUTCOME.REJECTED;
  if (httpStatus >= 400) return GRN_OUTCOME.REJECTED;
  if (body && typeof body === 'object' && body.error) return GRN_OUTCOME.REJECTED;
  return GRN_OUTCOME.OK;
}

async function writeApiLog(row) {
  if (!sbConfigured()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/grn_api_log`, {
      method: 'POST',
      headers: sbHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify([row]),
    });
  } catch { /* never let logging break the chain */ }
}

/**
 * Single entry point for every GRN call in the rebooking chain.
 * Returns { outcome, httpStatus, body, text, errorCode, durationMs, networkError }
 * and NEVER throws on a transport failure — the caller decides what an
 * unknown means in its own context.
 */
async function grnCall({ step, method, url, body, ctx = {} }) {
  const started = Date.now();
  let httpStatus = 0;
  let parsed = null;
  let text = null;
  let networkError = null;

  try {
    const init = { method, headers: GRN_HEADERS() };
    if (body !== undefined && body !== null) init.body = JSON.stringify(body);
    const resp = await fetch(url, init);
    httpStatus = resp.status;
    text = await resp.text();
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = null; }
    }
  } catch (err) {
    networkError = String(err.message || err);
  }

  const durationMs = Date.now() - started;
  const outcome = classifyGrnOutcome({ httpStatus, body: parsed, networkError });
  const errorCode = parsed ? String(parsed.error_code ?? parsed.errorCode ?? '') || null : null;

  await writeApiLog({
    booking_id: ctx.bookingId || null,
    attempt_id: ctx.attemptId || null,
    step,
    method,
    url,
    request_body: body ?? null,
    http_status: httpStatus || null,
    error_code: errorCode,
    // Store parsed JSON where we have it, otherwise the raw text — GRN's 500s
    // return bare "Something went wrong" with no JSON at all.
    response_body: parsed ?? (text ? { _raw: String(text).slice(0, 20000) } : null),
    duration_ms: durationMs,
    ok: outcome === GRN_OUTCOME.OK,
    outcome,
    network_error: networkError,
    actor_email: ctx.actorEmail || null,
    actor_id: ctx.actorId || null,
  });

  return { outcome, httpStatus, body: parsed, text, errorCode, durationMs, networkError };
}

// Human-readable meaning for the GRN error codes that matter in this flow.
const GRN_ERROR_MEANINGS = {
  '2002': 'Invalid booking reference',
  '2003': 'Booking has already been cancelled',
  '2004': 'Rate is sold out',
  '2005': 'Price has increased',
  '2006': 'Needs confirmation from supplier',
  '2008': 'Rate no longer available / search expired',
  '2104': 'Try again',
  '1505': 'Insufficient credit limit',
  '1513': 'TW issue at supplier',
  '5114': 'Pax data does not match the given room',
  '5120': 'Request timed out at supplier',
  '5121': 'Booking not found',
  '5138': "Error at supplier's end",
  '5142': 'Changes cannot be made to this booking item',
  '5143': 'Past booking items cannot be cancelled',
  '5149': 'Search and booking details do not match',
  '5151': 'Supplier does not support cancellation via API',
  '6000': 'Unknown error at supplier',
};

function describeGrnError(errorCode, body, text) {
  if (errorCode && GRN_ERROR_MEANINGS[errorCode]) return `${errorCode} — ${GRN_ERROR_MEANINGS[errorCode]}`;
  if (errorCode) return `${errorCode}`;
  const msg = body?.error || body?.message || body?.detail;
  if (msg) return String(msg).slice(0, 300);
  if (text) return String(text).slice(0, 300);
  return 'no detail returned';
}

// ===========================================================================
// REBOOK SAFETY GATE — shared helpers
//
// Everything here is pure: no I/O, no side effects. That is deliberate. The
// same functions decide what /repricing/check STORES and what
// /repricing/rebook TRUSTS, so the two can never drift apart.
// ===========================================================================

const norm = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');

// --- Room identity ---------------------------------------------------------
// The booking side carries room_code on the booking_item. The live rate
// carries room_code at the RATE level (NOT inside rooms[] — rooms[0] has
// room_reference, which is a different identifier and must not be used).
// Verified against GRN-202605-2506790:
//   booking room_code : 4dfflkrr4qqc7u2yvwjg4fg75hn2ps5cs3ljs
//   live    room_code : 4dfvdkrt4aus7wsrusnwohow4djk3s5cs3ljs
// Same 37-char format, same namespace, correctly different — two different
// lodge buildings sharing one room_type name.
function rateRoomCode(rate) {
  return rate?.room_code || null;
}
function rateRoomType(rate) {
  return rate?.rooms?.[0]?.room_type || rate?.rooms?.[0]?.description || rate?.room_type || null;
}
function rateRoomDescription(rate) {
  return rate?.rooms?.[0]?.description || null;
}

// --- Board -----------------------------------------------------------------
// GRN gives NO board code. Only free text: boarding_details[] on the rate and
// rate_comments.mealplan. So board is matched on normalised text — weaker
// than room matching by necessity, not by choice.
function rateBoard(rate) {
  if (Array.isArray(rate?.boarding_details) && rate.boarding_details.length) {
    return rate.boarding_details.join(', ');
  }
  return rate?.rate_comments?.mealplan || null;
}

// --- Cancellation terms ----------------------------------------------------
// The rate object carries `non_refundable` (boolean). A cancellation_policy
// object with cancel_by_date is NOT always present — on the Glen Eyrie rate
// it was absent entirely — so cancel_by is treated as optional extra
// evidence, never as a required field.
function rateNonRefundable(rate) {
  return typeof rate?.non_refundable === 'boolean' ? rate.non_refundable : null;
}
function rateCancelBy(rate) {
  return rate?.cancellation_policy?.cancel_by_date || null;
}

// Equal or better, never worse.
//   original refundable  -> live MUST be refundable
//   original non-refund. -> live may be either (same, or an upgrade)
// Unknown live refundability is treated as a FAIL, not a pass. We do not
// guess on the guest's cancellation rights.
function policyIsEqualOrBetter(origNonRef, liveNonRef, origCancelBy, liveCancelBy) {
  if (liveNonRef === null) return false;
  if (origNonRef === false) {
    if (liveNonRef !== false) return false;
    // Both refundable. If both carry a deadline, the new one must not be
    // earlier — a shorter window to cancel is a downgrade.
    if (origCancelBy && liveCancelBy) {
      if (new Date(liveCancelBy).getTime() < new Date(origCancelBy).getTime()) return false;
    }
    return true;
  }
  // Original was non-refundable (or unknown): anything is same-or-better,
  // but only once we actually know what the live rate is.
  return true;
}

// --- Supplier terms --------------------------------------------------------
// Some GRN rates carry an explicit prohibition on exactly this mechanic.
// Real example from the Glen Eyrie rate:
//   "Cancelled and rebooked reservations will be rejected, regardless of
//    the source reported to the hotel."
// Rebooking against such a rate risks the supplier voiding the NEW booking
// after the ORIGINAL has already been cancelled. Hard block.
const REBOOK_PROHIBITION_PATTERNS = [
  /cancell?ed\s+and\s+re-?\s?book(ed|ing)?[^.]{0,80}(reject|void|cancel|not\s+honou?r)/i,
  /re-?\s?book(ing|ed|ings)?[^.]{0,40}(will\s+be\s+rejected|not\s+permitted|not\s+allowed|prohibited)/i,
  /no\s+re-?\s?book(ing|ings)?\s+(permitted|allowed)/i,
];

function rateForbidsRebooking(rate) {
  const text = [
    rate?.rate_comments?.remarks,
    rate?.rate_comments?.pax_comments,
    rate?.rate_comments?.hotel_comments,
    Array.isArray(rate?.rate_conditions) ? rate.rate_conditions.join(' ') : null,
  ].filter(Boolean).join(' \n ');
  if (!text) return { forbidden: false, evidence: null };
  for (const re of REBOOK_PROHIBITION_PATTERNS) {
    const m = text.match(re);
    if (m) return { forbidden: true, evidence: m[0].trim().slice(0, 200) };
  }
  return { forbidden: false, evidence: null };
}

// --- Occupancy -------------------------------------------------------------
// A cheaper rate for fewer people is not the same booking.
function occupancyMatches(orig, live) {
  if (!orig || !live) return false;
  // Docs: no_of_adults is not always returned — when it is absent the rate
  // carries max_room_occupancy instead. Treating a missing value as 0 made
  // every such rate fail on occupancy even when the room was correct, so an
  // unstated occupancy is checked against the room's stated maximum instead.
  if (live.adults == null && live.maxOccupancy) {
    const totalOrig = Number(orig.adults || 0) + Number(orig.children || 0);
    const m = live.maxOccupancy;
    if (m.max_pax != null && totalOrig > Number(m.max_pax)) return false;
    if (m.max_adults != null && Number(orig.adults || 0) > Number(m.max_adults)) return false;
    if (m.max_children != null && Number(orig.children || 0) > Number(m.max_children)) return false;
    return true;
  }
  if (Number(orig.adults || 0) !== Number(live.adults || 0)) return false;
  if (Number(orig.children || 0) !== Number(live.children || 0)) return false;
  const a = [...(orig.childAges || [])].map(Number).sort((x, y) => x - y);
  const b = [...(live.childAges || [])].map(Number).sort((x, y) => x - y);
  // children_ages is not always echoed on the rate. Only compare when present.
  if (a.length && b.length) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return true;
}

function rateOccupancy(rate) {
  const r = rate?.rooms?.[0] || {};
  return {
    adults: r.no_of_adults ?? null,
    children: r.no_of_children ?? 0,
    childAges: r.children_ages || [],
    maxOccupancy: r.max_room_occupancy || null,
  };
}

// --- The gate itself -------------------------------------------------------
// MATCHING RULE (26 Jul 2026, decided with Aman):
//
// We match on the EXACT room name, not the room code.
//
// Why not room_code: across 4 bookings, 4 suppliers and 251 live rates, the
// room_code stored on a booking has never once matched a room_code returned
// by a later availability search. GRN appears to mint them per search.
// Requiring it means nothing is ever rebookable.
//
// Why not supplier_code: the availability response carries no supplier field
// at any level — verified with the debug-availability diagnostic across the
// whole response, hotel and all 193 rates. There is nothing to filter on.
//
// Why exact name works: suppliers describe the same room differently. GRN
// wrote one Barcelo room as "Deluxe - Room Only" on the booking and
// ",Deluxe : Room Only" in search — almost certainly two different suppliers.
// So an EXACT name match is, in practice, a same-supplier match. That is the
// property we want, obtained without a supplier field.
//
// This is deliberately NOT fuzzy. No punctuation stripping, no token
// matching, no similarity scoring. Loosening the comparison would let one
// supplier's room pass as another's, which is the exact risk this rule
// exists to prevent. Case and surrounding whitespace are ignored; nothing
// else is.
function roomNamesMatchExactly(orig, rate) {
  const cmp = (a, b) => {
    if (!a || !b) return false;
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  };
  const liveDesc = rateRoomDescription(rate);
  const liveType = rate?.rooms?.[0]?.room_type || rate?.room_type || null;

  // Prefer description — it is the more specific field. Glen Eyrie proved
  // room_type alone is not enough: "Standard 2 Queen Lodge" covered both the
  // Big Horn and Oaks lodge buildings.
  if (orig.roomDescription && liveDesc) return cmp(orig.roomDescription, liveDesc);
  if (orig.roomType && liveType) return cmp(orig.roomType, liveType);
  return false;
}

function evaluateRate(rate, orig) {
  const liveRoomCode = rateRoomCode(rate);
  const liveBoard = rateBoard(rate);
  const liveNonRef = rateNonRefundable(rate);
  const liveCancelBy = rateCancelBy(rate);
  const liveOcc = rateOccupancy(rate);
  const prohibition = rateForbidsRebooking(rate);

  const roomMatch = roomNamesMatchExactly(orig, rate);
  const codeMatch = Boolean(orig.roomCode && liveRoomCode && norm(orig.roomCode) === norm(liveRoomCode));
  const boardMatch = Boolean(orig.board && liveBoard && norm(orig.board) === norm(liveBoard));
  const policyMatch = policyIsEqualOrBetter(orig.nonRefundable, liveNonRef, orig.cancelBy, liveCancelBy);
  const occMatch = occupancyMatches(orig.occupancy, liveOcc);

  const blockers = [];
  if (!roomMatch) {
    const liveName = rateRoomDescription(rate) || rateRoomType(rate) || 'unnamed';
    // Only name THIS rate. The booked room is already shown above the list;
    // repeating it on every row made the page look full of matches under
    // Ctrl+F when it was just this message echoed hundreds of times.
    blockers.push(`Different room — this rate is "${liveName}".`);
  }

  if (!boardMatch) blockers.push(`Different board — booked "${orig.board || 'unknown'}", this rate is "${liveBoard || 'unknown'}".`);

  if (!policyMatch) {
    if (liveNonRef === null) blockers.push('This rate does not state its cancellation terms.');
    else if (orig.nonRefundable === false && liveNonRef === true) blockers.push('Original is refundable, this rate is non-refundable — worse terms for the guest.');
    else blockers.push('Cancellation terms are worse than the original.');
  }

  if (!occMatch) blockers.push('Guest numbers or child ages differ from the original booking.');

  // Supplier rebooking clause — RECORDED, NOT BLOCKING.
  //
  // Many GRN rates carry wording like "Cancelled and rebooked reservations
  // will be rejected". It appears across expedia_rapid_pkg, dida_direct and
  // others, which points to boilerplate passed through broadly rather than a
  // property-specific condition. Mize rebooks at volume through the same
  // supply (9,056 rebookings), so in practice it is not enforced.
  //
  // Treated as a warning on Aman's call (26 Jul 2026): surfaced to the
  // operator and stored on the check for audit, but it does not stop a
  // rebook. If a supplier ever does reject a rebooking, the warning on that
  // check is the trail back to why.
  const warnings = [];
  if (prohibition.forbidden) {
    warnings.push(`Supplier rate conditions mention rebooking: "${prohibition.evidence}"`);
  }

  return {
    eligible: roomMatch && boardMatch && policyMatch && occMatch,
    roomMatch, codeMatch, boardMatch, policyMatch, occMatch,
    forbidsRebooking: prohibition.forbidden,
    prohibitionEvidence: prohibition.evidence,
    liveRoomCode, liveBoard, liveNonRef, liveCancelBy,
    blockers, warnings,
  };
}

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
          // NOTE: this is room_reference, NOT room_code. Kept as-is because
          // the B2C search UI already consumes this shape. The rebook gate
          // deliberately does not use this field — see rateRoomCode().
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

// Counts for the view dropdown. pendingCancel is the one that matters: a
// confirmed replacement whose original is still live means two bookings are
// being paid for until someone acts.
async function attemptCounts() {
  const out = { pendingCancel: 0, needsReview: 0, rebooked: 0 };
  try {
    out.pendingCancel = await sbCount('grn_rebooking_attempts', 'status=in.(awaiting_cancel,booked)');
    out.needsReview = await sbCount('grn_rebooking_attempts', 'status=in.(needs_review,error)');
    out.rebooked = await sbCount('grn_rebooking_attempts', 'status=eq.confirmed');
  } catch { /* table may not exist yet */ }
  return out;
}

router.get('/repricing/candidates', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 20;
  const offset = (page - 1) * perPage;
  const nowIso = new Date().toISOString();
  const todayIso = nowIso.slice(0, 10);
  const cityQuery = (req.query.city || '').trim();
  const cityWhere = cityQuery ? `&city_name=ilike.*${encodeURIComponent(cityQuery)}*` : '';

  // Minimum days of cancellation runway left.
  //
  // WHY THIS EXISTS: the list used to sort cancel_by_date ascending, so page 1
  // was always the bookings expiring today. Those are the worst rebooking
  // candidates — inside the cancellation window suppliers stop returning
  // refundable rates almost entirely, so every check comes back blocked on
  // policy regardless of how good the room match is. Testing and day-to-day
  // work both need bookings with real runway.
  const minDays = Math.max(0, parseInt(req.query.min_days, 10) || 0);
  const minCancelBy = new Date(Date.now() + minDays * 86400000).toISOString();

  // view filter: which slice of the book to show.
  //   all             everything rebookable
  //   pending_cancel  replacement confirmed, ORIGINAL STILL LIVE — money at risk
  //   needs_review    an attempt in an unresolved state
  //   rebooked        completed rebookings
  // Attempt state lives in a separate table, so for anything other than 'all'
  // we resolve the booking_ids first and constrain the candidate query to them.
  const view = String(req.query.view || 'all');
  const VIEW_STATUSES = {
    pending_cancel: ['awaiting_cancel', 'booked'],
    needs_review: ['needs_review', 'error'],
    rebooked: ['confirmed'],
  };
  let viewIds = null;
  if (VIEW_STATUSES[view]) {
    try {
      const list = VIEW_STATUSES[view].join(',');
      const { rows: at } = await sbSelect('grn_rebooking_attempts',
        `status=in.(${encodeURIComponent(list)})&select=booking_id&order=updated_at.desc&limit=500`);
      viewIds = [...new Set(at.map((a) => a.booking_id))];
      if (!viewIds.length) {
        return res.json({ page, perPage, total: 0, minDays, view, hasMore: false, rows: [], viewCounts: await attemptCounts() });
      }
    } catch { viewIds = null; }
  }

  // Sort. Default is soonest deadline FIRST among the bookings that pass the
  // runway filter — that is the working order: enough time to act, most
  // urgent at the top. Sorting by most runway first surfaced bookings a year
  // out, which qualify but are not what anyone is trying to work through.
  const sortRunway = req.query.sort === 'runway';
  const order = sortRunway ? 'cancel_by_date.desc' : 'cancel_by_date.asc';

  // A booking whose original is still live after a confirmed replacement must
  // always be reachable, even if it no longer satisfies the runway filter or
  // the cancellation window has since closed. Losing sight of that state is how
  // you end up paying for two rooms.
  const inList = viewIds ? `&booking_id=in.(${encodeURIComponent(viewIds.map((i) => `"${i}"`).join(','))})` : '';
  const where = viewIds
    ? `booking_id=not.is.null${inList}${cityWhere}`
    : `cancel_by_date=gt.${encodeURIComponent(minDays > 0 ? minCancelBy : nowIso)}` +
      `&checkin_date=gte.${todayIso}` +
      `&raw_booking_status=not.ilike.cancel*` +
      cityWhere;

  try {
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${where}&select=booking_id,booking_reference,supplier_reference,booking_date,hotel_name,hotel_code,`
        + `city_name,country_code,room_type,room_count,guest_name,`
        + `board_basis,checkin,checkin_date,checkout,price_total,currency,supplier_code,cancel_by_date,raw`
        + `&order=${order}&offset=${offset}&limit=${perPage}`,
      { 'Prefer': 'count=exact' }
    );

    const ids = rows.map((r) => r.booking_id);
    const lastChecks = {};
    if (ids.length) {
      const inList = ids.map((i) => `"${i}"`).join(',');
      const { rows: checks } = await sbSelect('grn_price_checks',
        `booking_id=in.(${encodeURIComponent(inList)})&select=booking_id,checked_at,live_usd,dropped,gap_usd,gap_pct,room_match,board_match,policy_match,match_basis&order=checked_at.desc`);
      for (const c of checks) if (!lastChecks[c.booking_id]) lastChecks[c.booking_id] = c;
    }

    // Latest rebooking attempt per booking, so the row can show its state —
    // and so an original still live behind a confirmed replacement shows red.
    const lastAttempts = {};
    if (ids.length) {
      try {
        const inList = ids.map((i) => `"${i}"`).join(',');
        const { rows: at } = await sbSelect('grn_rebooking_attempts',
          `booking_id=in.(${encodeURIComponent(inList)})&select=id,booking_id,status,failure_stage,failure_reason,new_booking_id,new_booking_reference,cancellation_reference,saved_usd,gross_profit,created_at,updated_at&order=updated_at.desc`);
        for (const a of at) if (!lastAttempts[a.booking_id]) lastAttempts[a.booking_id] = a;
      } catch { /* table may not exist yet */ }
    }

    const viewCounts = await attemptCounts();
    // Rows whose original is still live behind a confirmed replacement sort to
    // the top of whatever slice is displayed, so the state cannot hide on page 3.
    const atRisk = new Set(Object.values(lastAttempts)
      .filter((a) => a.status === 'awaiting_cancel' || a.status === 'booked')
      .map((a) => a.booking_id));
    rows.sort((a, b) => (atRisk.has(b.booking_id) ? 1 : 0) - (atRisk.has(a.booking_id) ? 1 : 0));
    res.json({
      page, perPage, total: total ?? 0,
      minDays, view, viewCounts, sort: sortRunway ? 'runway' : 'deadline',
      hasMore: offset + perPage < (total ?? 0),
      rows: rows.map((r) => {
        const usdRate = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067 }[r.currency];
        const origUsd = (r.price_total != null && usdRate) ? Math.round(Number(r.price_total) * usdRate) : null;
        const last = lastChecks[r.booking_id] || null;
        const raw = r.raw || {};
        const hotel = raw.hotel || {};
        const item0 = hotel.booking_items?.[0] || {};
        const room0 = item0.rooms?.[0] || {};
        const paxes = hotel.paxes || [];
        const adultPaxes = paxes.filter((p) => p.type === 'AD');
        const childPaxes = paxes.filter((p) => p.type === 'CH');
        const nightsMs = (r.checkout && (r.checkin_date || r.checkin))
          ? new Date(r.checkout).getTime() - new Date(r.checkin_date || r.checkin).getTime()
          : null;

        // Cancellation terms as the supplier stated them. Shape varies by
        // supplier, so we pass through what exists rather than forcing one
        // schema — the UI renders whichever fields came back.
        const cp = item0.cancellation_policy || {};
        const cancellation = {
          nonRefundable: typeof item0.non_refundable === 'boolean' ? item0.non_refundable : null,
          cancelBy: cp.cancel_by_date || r.cancel_by_date || null,
          details: typeof cp.details === 'string' ? cp.details : null,
          policies: Array.isArray(cp.policies) ? cp.policies : (Array.isArray(cp.details) ? cp.details : []),
          underCancellation: cp.under_cancellation ?? null,
          remarks: item0.rate_comments?.remarks || null,
        };
        const supportsCancellation = raw.supports_cancellation ?? null;
        const supportsAmendment = raw.supports_amendment ?? null;

        return {
          bookingId: r.booking_id,
          bookingReference: r.booking_reference || raw.booking_reference || null,
          supplierReference: r.supplier_reference || raw.supplier_reference || hotel.hotel_confirmation_number || null,
          bookingDate: r.booking_date || raw.booking_date || null,
          bookingStatus: raw.booking_status || null,
          hotel: r.hotel_name,
          hotelCode: r.hotel_code,
          hotelAddress: hotel.address || null,
          city: r.city_name,
          country: r.country_code,
          room: r.room_type,
          roomDescription: room0.description || null,
          roomCode: item0.room_code || null,
          roomCount: r.room_count || (hotel.booking_items || []).length || null,
          board: r.board_basis,
          nonRefundable: cancellation.nonRefundable,
          cancellation,
          supportsCancellation,
          supportsAmendment,
          guestComment: raw.booking_comment || raw.booking_comments || null,
          leadGuest: r.guest_name
            || (raw.holder ? `${raw.holder.name || ''} ${raw.holder.surname || ''}`.trim() : null)
            || null,
          guests: paxes.map((p) => ({
            name: `${p.name || ''} ${p.surname || ''}`.trim() || null,
            type: p.type || null,
            age: p.age ?? null,
          })).filter((g) => g.name || g.age != null),
          adults: adultPaxes.length || room0.no_of_adults || null,
          children: childPaxes.length || room0.no_of_children || 0,
          childrenAges: childPaxes.map((p) => p.age).filter((a) => a != null),
          nights: nightsMs != null ? Math.round(nightsMs / 86400000) : null,
          checkin: r.checkin_date || r.checkin,
          checkout: r.checkout,
          origLocal: r.price_total != null ? Number(r.price_total) : null,
          origCur: r.currency,
          origUsd,
          supplier: r.supplier_code,
          cancelBy: r.cancel_by_date,
          attempt: (() => {
            const a = lastAttempts[r.booking_id];
            if (!a) return null;
            return {
              id: a.id, status: a.status,
              failureStage: a.failure_stage, failureReason: a.failure_reason,
              newBookingId: a.new_booking_id, newBookingReference: a.new_booking_reference,
              cancellationReference: a.cancellation_reference,
              savedUsd: a.saved_usd, grossProfit: a.gross_profit,
              createdAt: a.created_at, updatedAt: a.updated_at,
              // The dangerous state: replacement confirmed, original still live.
              awaitingCancel: a.status === 'awaiting_cancel' || a.status === 'booked',
            };
          })(),
          lastCheck: last ? {
            checkedAt: last.checked_at, liveUsd: last.live_usd, dropped: last.dropped,
            gapUsd: last.gap_usd, gapPct: last.gap_pct,
            roomMatch: last.room_match, boardMatch: last.board_match,
            policyMatch: last.policy_match, matchBasis: last.match_basis,
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
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=checked_at,live_usd,live_price,live_currency,dropped,gap_usd,gap_pct,room_match,board_match,dates_match,policy_match,match_basis&order=checked_at.desc&limit=50`);
    res.json({ bookingId, checks: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /repricing/check
//
// Selection changed. Previously: find the first rate whose room NAME matched,
// else the cheapest of anything. Now: evaluate EVERY rate against the full
// gate, keep only those that pass, and take the cheapest survivor. If nothing
// survives we still return a best-effort comparison row for the UI, clearly
// marked ineligible with the reasons — the operator sees what came back and
// why it cannot be actioned, rather than an empty screen.
// ---------------------------------------------------------------------------
router.post('/repricing/check', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  const bookingId = req.body?.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });

  try {
    const { rows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=booking_id,hotel_code,city_code,checkin,checkin_date,checkout,room_type,board_basis,price_total,currency,cancel_by_date,raw&limit=1`);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: 'Booking not found in synced table' });
    if (!b.hotel_code) return res.status(400).json({ error: 'Booking has no hotel_code — cannot reprice' });

    const checkin = (b.checkin_date || b.checkin || '').slice(0, 10);
    const checkout = (b.checkout || '').slice(0, 10);
    if (!checkin || !checkout) return res.status(400).json({ error: 'Booking missing check-in/out dates' });

    const paxes = b.raw?.hotel?.paxes || [];
    const adults = paxes.filter((p) => p.type === 'AD').length || 2;
    const childAges = paxes.filter((p) => p.type === 'CH').map((p) => p.age).filter((a) => a != null);
    const roomReq = { adults };
    if (childAges.length) roomReq.children_ages = childAges;

    // ---- The original, as the gate will compare it ----
    const origItem = b.raw?.hotel?.booking_items?.[0] || {};
    const origRoom0 = origItem.rooms?.[0] || {};
    const orig = {
      roomCode: origItem.room_code || null,
      roomType: origRoom0.room_type || b.room_type || null,
      roomDescription: origRoom0.description || null,
      board: (Array.isArray(origItem.boarding_details) && origItem.boarding_details.length)
        ? origItem.boarding_details.join(', ')
        : (b.board_basis || null),
      nonRefundable: typeof origItem.non_refundable === 'boolean' ? origItem.non_refundable : null,
      cancelBy: origItem.cancellation_policy?.cancel_by_date || b.cancel_by_date || null,
      occupancy: {
        adults: origRoom0.no_of_adults ?? adults,
        children: origRoom0.no_of_children ?? childAges.length,
        childAges,
      },
    };

    // Search payload copied from Mize's production trace. Three differences
    // from what this code sent before, all of them material:
    //
    //   cutoff_time: GRN_CUTOFF_TIME  — how long GRN waits for its upstream suppliers
    //     before cutting them off. Default is 10,000. Mize waits 50,000, the
    //     documented maximum. An observed search took 14 SECONDS to return 60+
    //     rates; at a 10s cutoff that list would have been truncated. This is
    //     the most likely reason our rate counts and match rates looked thin.
    //   hotel_info: false   — skips the static hotel payload. Smaller, faster.
    //   version: "2.0"      — undocumented on availability, but Mize sends it.
    //
    // client_nationality tracks the booking, not a hardcoded 'US'. Nationality
    // drives pricing and availability, and a mismatch can also cause problems
    // for the guest at check-in.
    const bookingNationality =
      (b.raw?.nationality || b.raw?.holder?.client_nationality || 'US').toString().slice(0, 2).toUpperCase();

    const payload = {
      version: '2.0',
      checkin,
      checkout,
      client_nationality: bookingNationality,
      currency: b.currency || 'USD',
      cutoff_time: GRN_CUTOFF_TIME,
      hotel_codes: [String(b.hotel_code)],
      hotel_info: false,
      rates: 'comprehensive',
      rooms: [roomReq],
    };
    const resp = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST', headers: GRN_HEADERS(), body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: 'GRN availability error', details: data });

    const searchId = data.search_id || null;
    const hotel = (data.hotels || [])[0];

    let allRates = [];
    if (hotel) {
      if (Array.isArray(hotel.rates)) allRates = hotel.rates;
      else if (hotel.min_rate) allRates = [hotel.min_rate];
    }

    const usdRate = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067 };
    const priceUsdOf = (rt) => {
      const local = rt?.price != null ? Number(rt.price) : null;
      const cur = rt?.currency || b.currency || 'USD';
      return (local != null && usdRate[cur]) ? local * usdRate[cur] : null;
    };

    // ---- Evaluate every rate, then choose ----
    const evaluated = allRates.map((rt) => ({ rate: rt, verdict: evaluateRate(rt, orig), usd: priceUsdOf(rt) }));
    const eligible = evaluated.filter((e) => e.verdict.eligible && e.usd != null);
    eligible.sort((a, b2) => a.usd - b2.usd);

    let chosenEntry = eligible[0] || null;
    let matchBasis = chosenEntry?.verdict.codeMatch ? 'room_code' : 'room_name_exact';

    if (!chosenEntry) {
      // Nothing rebookable. Pick the most informative row to SHOW — never to act on.
      const byName = evaluated.find((e) => e.verdict.roomMatch);
      const cheapest = [...evaluated].filter((e) => e.usd != null).sort((a, b2) => a.usd - b2.usd)[0];
      chosenEntry = byName || cheapest || null;
      matchBasis = byName ? 'room_name_blocked' : cheapest ? 'no_room_match' : 'none';
    }

    const minRate = chosenEntry?.rate || null;
    const verdict = chosenEntry?.verdict || null;
    const liveRoom = minRate?.rooms?.[0] || null;

    const origLocal = b.price_total != null ? Number(b.price_total) : null;
    const origCur = b.currency || 'USD';
    const origUsd = (origLocal != null && usdRate[origCur]) ? origLocal * usdRate[origCur] : null;

    const liveLocal = minRate?.price != null ? Number(minRate.price) : null;
    const liveCur = minRate?.currency || origCur;
    const liveUsd = chosenEntry?.usd ?? null;

    const roomMatch = verdict ? verdict.roomMatch : null;
    const boardMatch = verdict ? verdict.boardMatch : null;
    const policyMatch = verdict ? verdict.policyMatch : null;
    const datesMatch = (data.checkin?.slice(0, 10) === checkin && data.checkout?.slice(0, 10) === checkout);

    const gapUsd = (origUsd != null && liveUsd != null) ? Math.round((origUsd - liveUsd) * 100) / 100 : null;
    const gapPct = (gapUsd != null && origUsd) ? Math.round((gapUsd / origUsd) * 100) : null;
    const dropped = gapUsd != null ? gapUsd > 0 : false;

    // A rebook is authorised only if the chosen rate passed every leg AND the
    // price actually dropped. Both conditions are persisted, and the rebook
    // route re-reads them from the table rather than trusting the client.
    const rebookEligible = Boolean(verdict?.eligible && dropped);

    const blockers = [];
    if (verdict) blockers.push(...verdict.blockers);
    if (!dropped && verdict?.eligible) blockers.push('No price drop on the matching rate.');
    if (!minRate) blockers.push('No availability returned for these dates.');

    const warnings = verdict?.warnings || [];

    await sbUpsert('grn_price_checks', [{
      booking_id: bookingId,
      checked_at: new Date().toISOString(),
      original_price: origLocal, original_currency: origCur, original_usd: origUsd != null ? Math.round(origUsd) : null,
      live_price: liveLocal, live_currency: liveCur, live_usd: liveUsd != null ? Math.round(liveUsd) : null,
      dropped, gap_usd: gapUsd, gap_pct: gapPct,
      room_match: roomMatch, board_match: boardMatch, dates_match: datesMatch,
      match_basis: matchBasis,
      policy_match: policyMatch,
      original_non_refundable: orig.nonRefundable,
      original_cancel_by: orig.cancelBy,
      live_non_refundable: verdict ? verdict.liveNonRef : null,
      live_cancel_by: verdict ? verdict.liveCancelBy : null,
      raw: minRate
        ? { ...minRate, _match_basis: matchBasis, _search_id: searchId, _rooms_returned: allRates.length,
            _eligible: Boolean(verdict?.eligible), _blockers: verdict?.blockers || [],
            _warnings: verdict?.warnings || [] }
        : { note: 'no availability returned', _search_id: searchId, _match_basis: 'none' },
      source: 'manual',
    }], 'id');

    const usdOf = (amt, cur) => (amt != null && usdRate[cur]) ? Math.round(Number(amt) * usdRate[cur]) : null;
    const allRatesOut = evaluated.map(({ rate: rt, verdict: v, usd }) => {
      const rm = rt?.rooms?.[0] || {};
      const local = rt?.price != null ? Number(rt.price) : null;
      const cur = rt?.currency || origCur;
      return {
        roomType: rm.room_type || rt.room_type || '—',
        roomDescription: rm.description || null,
        board: rateBoard(rt) || '—',
        local, currency: cur, usd: usd != null ? Math.round(usd) : null,
        refundable: v.liveNonRef === false,
        cancelBy: v.liveCancelBy,
        vsOriginalUsd: (usd != null && origUsd != null) ? Math.round(origUsd - usd) : null,
        isMatch: v.roomMatch,
        eligible: v.eligible,
        blockers: v.blockers,
        warnings: v.warnings || [],
      };
    }).sort((a, b2) => (a.usd ?? 1e12) - (b2.usd ?? 1e12));

    res.json({
      bookingId,
      checkedAt: new Date().toISOString(),
      original: {
        local: origLocal, currency: origCur, usd: origUsd != null ? Math.round(origUsd) : null,
        room: orig.roomType, roomDescription: orig.roomDescription, board: orig.board,
        roomTypeRaw: orig.roomType, roomDescriptionRaw: orig.roomDescription,
        nonRefundable: orig.nonRefundable, cancelBy: orig.cancelBy,
        checkin, checkout,
      },
      live: liveLocal != null
        ? { local: liveLocal, currency: liveCur, usd: liveUsd != null ? Math.round(liveUsd) : null,
            room: liveRoom?.room_type || liveRoom?.description || null,
            roomTypeRaw: liveRoom?.room_type || minRate?.room_type || null,
            roomDescriptionRaw: liveRoom?.description || null,
            roomDescription: liveRoom?.description || null,
            board: rateBoard(minRate) || null,
            nonRefundable: verdict ? verdict.liveNonRef : null,
            cancelBy: verdict ? verdict.liveCancelBy : null }
        : null,
      available: liveLocal != null,
      dropped, gapUsd, gapPct,
      matchBasis,
      match: { room: roomMatch, board: boardMatch, dates: datesMatch, policy: policyMatch },
      rebookEligible,
      eligibleRateCount: eligible.length,
      blockers,
      warnings,
      allRates: allRatesOut,
    });
  } catch (err) {
    res.status(500).json({ error: 'Price check failed', message: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// GRN rebooking chain — pull source, recheck, place, confirm, cancel original.
// ---------------------------------------------------------------------------

// ===========================================================================
// THE GRN REBOOKING CHAIN — built from a captured production trace
//
// These endpoints are NOT in GRN's public v3 documentation. They are a
// first-class feature of GRN's platform (their internal "Manage Re-Bookings"
// panel tracks them) and are in production use. Everything below mirrors an
// observed successful trace plus two observed failure traces.
//
//   Search   POST   /hotels/availability
//   Recheck  POST   /hotels/availability/{search_id}/rates/?action=recheck
//   Pull     GET    /hotels/bookingdetail?booking_id={GRN booking id}
//   Rebook   POST   /hotels/rebookings/{ORIGINAL booking_reference}
//   Confirm  POST   /hotels/rebookings/confirm/{NEW booking_reference}
//   Cancel   DELETE /hotels/rebookings/{ORIGINAL booking_reference}
//
// Note the asymmetry, which is easy to get wrong: rebook and cancel key off the
// ORIGINAL reference; confirm keys off the NEW one. Confirm and cancel take NO
// body at all — not a reason code, not comments.
// ===========================================================================

// GET /hotels/bookingdetail?booking_id=...
// This is the call Mize actually uses. The documented alternative
// (/hotels/bookings/<ref>?type=GRN) is kept as a fallback only.
async function grnPullSourceBooking({ bookingId, bookingReference, ctx = {} }) {
  const shape = (booking, via) => {
    const items = booking.hotel?.booking_items || [];
    return {
      via,
      status: booking.booking_status || null,
      bookingType: booking.booking_type || null,          // 'B' booking, 'C' cancellation
      bookingReference: booking.booking_reference || null,
      supplierCode: booking.supplier_code || null,        // present here, absent on live rates
      supportsCancellation: booking.supports_cancellation ?? null,
      supportsAmendment: booking.supports_amendment ?? null,
      underCancellation: items.some((it) => it.cancellation_policy?.under_cancellation === true),
      paymentStatus: booking.payment_status || null,
      bookingComment: booking.booking_comment || booking.booking_comments || null,
      raw: booking,
    };
  };

  const primary = await grnCall({
    step: 'pull_source',
    method: 'GET',
    url: `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`,
    ctx,
  });
  if (primary.outcome === GRN_OUTCOME.OK && primary.body?.booking) {
    return shape(primary.body.booking, 'bookingdetail?booking_id');
  }

  if (bookingReference) {
    const fallback = await grnCall({
      step: 'pull_source_fallback',
      method: 'GET',
      url: `${GRN_API_BASE_URL}/hotels/bookings/${encodeURIComponent(bookingReference)}?type=GRN`,
      ctx,
    });
    const bk = fallback.body?.booking || fallback.body?.bookings?.[0] || null;
    if (fallback.outcome === GRN_OUTCOME.OK && bk) {
      return shape(bk, 'bookings/<reference>');
    }
  }

  const e = describeGrnError(primary.errorCode, primary.body, primary.text);
  throw new Error(`Could not fetch the booking from GRN: ${e}`);
}

// POST /hotels/availability/{search_id}/rates/?action=recheck
// Payload is rate_key + group_code + hotel_info, per the captured trace.
// Response is hotel.rate — a single object, not an array. Flags are
// price_changed and cp_changed.
async function grnRecheckRate({ searchId, rateKey, groupCode, ctx = {} }) {
  const r = await grnCall({
    step: 'recheck',
    method: 'POST',
    url: `${GRN_API_BASE_URL}/hotels/availability/${encodeURIComponent(searchId)}/rates/?action=recheck`,
    body: { rate_key: rateKey, group_code: groupCode, hotel_info: true },
    ctx,
  });

  if (r.outcome !== GRN_OUTCOME.OK) {
    throw new Error(`Recheck ${r.outcome}: ${describeGrnError(r.errorCode, r.body, r.text)}`);
  }
  const data = r.body || {};
  const rate = data.hotel?.rate || data.hotel?.rates?.[0] || null;
  if (!rate) throw new Error('Recheck succeeded but returned no rate.');

  return {
    priceChanged: data.price_changed ?? null,
    cpChanged: data.cp_changed ?? null,
    searchId: data.search_id || searchId,
    // Per the docs and the trace, all three of these must be re-taken from the
    // recheck response and carried into the rebook.
    rateKey: rate.rate_key || rateKey,
    groupCode: rate.group_code || groupCode,
    roomCode: rate.room_code || null,
    roomReference: rate.rooms?.[0]?.room_reference || null,
    rateType: rate.rate_type || null,
    price: rate.price ?? null,
    currency: rate.currency || data.currency || null,
    nonRefundable: typeof rate.non_refundable === 'boolean' ? rate.non_refundable : null,
    cancelBy: rate.cancellation_policy?.cancel_by_date || null,
    supportsCancellation: rate.supports_cancellation ?? null,
    rate,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Rebook payload — exact shape from the captured trace.
//
// Fields the trace does NOT include, and which an earlier version of this file
// wrongly added: booking_name, agent_reference, purpose_of_travel,
// booking_comments. Sending extras to an undocumented endpoint is a good way to
// get a 6000.
//
// Pax and holder are both required. Titles ARE returned by GRN on
// bookingdetail (Mr. / Ms. / Mrs. / Mstr.) despite being absent from the doc
// samples, so they can be carried across verbatim. We reproduce the original
// exactly rather than "correcting" odd-looking data — a 15-year-old titled
// Mrs. is what the agent submitted and what the hotel already has.
// ---------------------------------------------------------------------------
const cleanName = (s) => String(s || '').replace(/[^A-Za-z \-'.]/g, '').trim();

function buildRebookPayload({ booking, recheck, searchId }) {
  const missing = [];
  const raw = booking.raw || {};
  const hotel = raw.hotel || {};
  const paxes = hotel.paxes || [];
  const holderSrc = raw.holder || {};

  const holder = {
    title: holderSrc.title || null,
    name: cleanName(holderSrc.name),
    surname: cleanName(holderSrc.surname),
    email: holderSrc.email || null,
    phone_number: holderSrc.phone_number || null,
    client_nationality: (raw.nationality || holderSrc.client_nationality || '').toString().toUpperCase() || null,
  };
  ['title', 'name', 'surname', 'email', 'phone_number', 'client_nationality']
    .forEach((k) => { if (!holder[k]) missing.push(`holder.${k}`); });

  const outPaxes = paxes.map((p, i) => {
    const pax = { title: p.title || null, name: cleanName(p.name), surname: cleanName(p.surname), type: p.type };
    if (!pax.title) missing.push(`paxes[${i}].title`);
    if (!pax.name) missing.push(`paxes[${i}].name`);
    if (!pax.surname) missing.push(`paxes[${i}].surname`);
    if (p.type === 'CH') {
      if (p.age == null) missing.push(`paxes[${i}].age (child)`);
      else pax.age = Number(p.age);
    }
    return pax;
  });
  if (!outPaxes.length) missing.push('paxes (none on the original booking)');
  if (!outPaxes.some((p) => p.type === 'AD')) missing.push('at least one adult pax');

  const payload = {
    search_id: searchId,
    hotel_code: String(booking.hotel_code),
    city_code: String(booking.city_code || hotel.city_code || ''),
    group_code: recheck.groupCode,
    checkin: booking.checkin_date || booking.checkin,
    checkout: booking.checkout,
    payment_type: 'AT_WEB',
    booking_items: [{
      rate_key: recheck.rateKey,
      room_code: recheck.roomCode,
      rooms: [{
        room_reference: recheck.roomReference,
        bedtype_id: 0,
        paxes: outPaxes,
      }],
    }],
    holder,
  };

  if (!payload.city_code) missing.push('city_code');
  if (!payload.group_code) missing.push('group_code (from recheck)');
  if (!payload.booking_items[0].rate_key) missing.push('rate_key (from recheck)');
  if (!payload.booking_items[0].room_code) missing.push('room_code (from recheck)');
  if (!payload.booking_items[0].rooms[0].room_reference) missing.push('room_reference (from recheck)');

  return { payload, missing: [...new Set(missing)] };
}

// POST /hotels/rebookings/{ORIGINAL booking_reference}
// Response carries status, booking_id (original id with an -R suffix),
// booking_reference for the NEW booking, and other_info.additional_info with
// GRN's own gross_profit and markup breakdown.
async function grnRebook({ originalRef, payload, ctx = {} }) {
  const r = await grnCall({
    step: 'rebook',
    method: 'POST',
    url: `${GRN_API_BASE_URL}/hotels/rebookings/${encodeURIComponent(originalRef)}`,
    body: payload,
    ctx,
  });
  const b = r.body || {};
  return {
    outcome: r.outcome,
    detail: describeGrnError(r.errorCode, r.body, r.text),
    status: b.status || null,                       // confirmed | pending | failed | rejected
    newBookingId: b.booking_id || null,
    newBookingReference: b.booking_reference || null,
    price: b.price?.total ?? b.price ?? null,
    currency: b.currency || null,
    grossProfit: b.other_info?.additional_info?.gross_profit ?? null,
    raw: b,
    httpStatus: r.httpStatus,
  };
}

// POST /hotels/rebookings/confirm/{NEW booking_reference} — no body.
async function grnConfirmRebook({ newRef, ctx = {} }) {
  const r = await grnCall({
    step: 'confirm_rebook',
    method: 'POST',
    url: `${GRN_API_BASE_URL}/hotels/rebookings/confirm/${encodeURIComponent(newRef)}`,
    ctx,
  });
  return {
    outcome: r.outcome,
    message: r.body?.message || null,
    detail: describeGrnError(r.errorCode, r.body, r.text),
    httpStatus: r.httpStatus,
  };
}

// DELETE /hotels/rebookings/{ORIGINAL booking_reference} — no body, no reason
// code. (The documented /hotels/bookings/<ref> cancellation takes comments and
// a reason; this rebooking-scoped one does not.)
async function grnCancelOriginal({ originalRef, ctx = {} }) {
  const r = await grnCall({
    step: 'cancel_original',
    method: 'DELETE',
    url: `${GRN_API_BASE_URL}/hotels/rebookings/${encodeURIComponent(originalRef)}`,
    ctx,
  });
  const b = r.body || {};
  return {
    outcome: r.outcome,
    status: b.status || null,
    cancellationReference: b.cancellation_reference || null,
    charges: b.cancellation_charges || null,
    detail: describeGrnError(r.errorCode, r.body, r.text),
    httpStatus: r.httpStatus,
  };
}

// ---------------------------------------------------------------------------
// RESOLVING AN UNKNOWN
//
// This is the part Mize does not do, and the reason their reversals line is
// noisy. Of 52 failures in one observed month: 15 were cancel-stage (the
// replacement was live and confirmed, the cancel returned a 500 after 20
// seconds) and 18 were network failures with no response logged at all. In
// every one of those cases the log simply stopped, and no new booking reference
// was recorded.
//
// A 500 after 20 seconds is not a rejection. It is an unknown. GRN's own docs
// require a fetch to resolve it:
//
//   "You have to fetch the booking in case of no response, server error
//    (503, 502, 500) from booking endpoint or in case booking status=pending."
//
// So: on any UNKNOWN we look, with a short backoff, before concluding anything.
// ---------------------------------------------------------------------------
async function resolveBookingStatus({ bookingId, bookingReference, ctx = {}, attempts = 3 }) {
  for (let i = 0; i < attempts; i++) {
    await sleep(i === 0 ? 2000 : 4000);
    try {
      const s = await grnPullSourceBooking({ bookingId, bookingReference, ctx });
      if (s.status) return { resolved: true, ...s };
    } catch { /* try again */ }
  }
  return { resolved: false, status: null };
}

// ===========================================================================
// SPLIT REBOOKING — two operator actions instead of one atomic chain
//
// The previous version ran recheck -> rebook -> confirm -> cancel as a single
// call. That is fine when it works and awkward when it does not: a failure
// halfway through leaves a state nobody chose.
//
// Split into two deliberate steps with a human in between:
//
//   POST /repricing/book-replacement   recheck -> rebook -> confirm
//                                      Original untouched. Safe to fail.
//   POST /repricing/cancel-original    cancel the original
//                                      Only after the operator has seen the
//                                      replacement confirmed on screen.
//
// Between the two, BOTH bookings are live. That state is tracked explicitly on
// grn_rebooking_attempts with status 'awaiting_cancel' so it can be surfaced in
// red and filtered for, rather than being forgotten.
// ===========================================================================

function actorFrom(req) {
  return {
    actorEmail: req.user?.email || req.auth?.email || null,
    actorId: req.user?.id || req.auth?.sub || req.auth?.id || null,
  };
}

// Shared preflight: load the booking and its latest check.
//
// The gate is ADVISORY when an operator has explicitly chosen a rate.
//
// Why: the operator is looking at every live rate on screen, with the room,
// board, terms and price difference spelled out on each row. Blocking them from
// booking a rate they can see and have judged worth taking is the software
// second-guessing the person with more context. The gate's job is to highlight
// the safe default, not to lock the rest.
//
// Two things stay HARD blocks, because they are correctness rather than
// judgement:
//   - dates must match the original stay
//   - occupancy must match (you cannot put two guests in a single-occupancy rate)
//
// Everything else — different room, different board, worse cancellation terms —
// is surfaced as a warning, recorded against the attempt, and left to the
// operator.
async function loadForRebook(bookingId, { chosenRateKey = null } = {}) {
  const { rows: checks } = await sbSelect('grn_price_checks',
    `booking_id=eq.${encodeURIComponent(bookingId)}&select=*&order=checked_at.desc&limit=1`);
  const check = checks[0];
  if (!check) return { error: 'No price check on record for this booking — run a check first.', status: 400 };

  // Only enforce the full gate when nobody picked a rate (the automatic path).
  if (!chosenRateKey) {
    const failed = [];
    if (check.match_basis !== 'room_code' && check.match_basis !== 'room_name_exact') {
      failed.push('The matched rate is not an exact room match.');
    }
    if (check.room_match !== true) failed.push('Room does not match the original booking.');
    if (check.board_match !== true) failed.push('Board basis does not match the original booking.');
    if (check.policy_match !== true) failed.push('Cancellation terms are not equal to or better than the original.');
    if (check.dates_match !== true) failed.push('Stay dates do not match the original booking.');
    if (!check.dropped) failed.push('There is no price drop on the matching rate.');
    if (Array.isArray(check.raw?._blockers) && check.raw._blockers.length) failed.push(...check.raw._blockers);
    if (failed.length) return { error: 'This booking is not rebookable automatically. Pick a rate from the list to book it manually.', blockers: [...new Set(failed)], status: 400 };
  } else {
    // Even on a manual choice, dates are non-negotiable.
    if (check.dates_match !== true) {
      return { error: 'The live search did not return the same stay dates as the original booking. Re-check before rebooking.', status: 409 };
    }
  }

  // search_id is valid for 30 minutes and both recheck and rebook need it.
  const ageMin = (Date.now() - new Date(check.checked_at).getTime()) / 60000;
  if (ageMin > 20) {
    return { error: `This price check is ${Math.round(ageMin)} minutes old and its search_id expires at 30 minutes. Re-check before rebooking.`, status: 409 };
  }

  const { rows: bkRows } = await sbSelect('grn_bookings',
    `booking_id=eq.${encodeURIComponent(bookingId)}&select=*&limit=1`);
  const booking = bkRows[0];
  if (!booking) return { error: 'Original booking not found in the synced table.', status: 404 };

  const matched = check.raw || {};
  return {
    check, booking,
    rateKey: chosenRateKey || matched.rate_key || null,
    groupCode: matched.group_code || null,
    searchId: matched._search_id || null,
  };
}

// ---------------------------------------------------------------------------
// POST /repricing/book-replacement
// recheck -> rebook -> confirm. The ORIGINAL IS NEVER TOUCHED HERE.
// ---------------------------------------------------------------------------
router.post('/repricing/book-replacement', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  // rate_key / group_code optional: when the operator picks a row from the live
  // rate list, that is the rate we book. When absent we use the rate the gate
  // matched automatically.
  const { booking_id, acknowledge_comment, rate_key, group_code } = req.body || {};
  if (!booking_id) return res.status(400).json({ error: 'booking_id required' });
  const actor = actorFrom(req);

  let pre;
  try {
    pre = await loadForRebook(booking_id, { chosenRateKey: rate_key || null });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load the booking or its price check.', detail: String(err.message || err) });
  }
  if (pre.error) return res.status(pre.status).json({ error: pre.error, blockers: pre.blockers });

  const { check, booking, searchId } = pre;
  const rateKey = rate_key || pre.rateKey;
  const groupCode = group_code || pre.groupCode;
  const operatorChose = Boolean(rate_key);
  if (!rateKey) return res.status(400).json({ error: 'No rate_key — pick a rate from the list, or re-check first.' });
  if (!groupCode) return res.status(400).json({ error: 'No group_code — recheck requires it. Re-check first.' });
  if (!searchId) return res.status(400).json({ error: 'No search_id on the stored check — re-check first.' });

  // Refuse if this booking already has an attempt sitting mid-flight.
  try {
    const { rows: open } = await sbSelect('grn_rebooking_attempts',
      `booking_id=eq.${encodeURIComponent(booking_id)}&status=in.(booking,booked,awaiting_cancel,cancelling,needs_review)&select=id,status,new_booking_id&limit=1`);
    if (open.length) {
      return res.status(409).json({
        error: `This booking already has a rebooking attempt in progress (status: ${open[0].status}). Resolve it before starting another.`,
        rebookingId: open[0].id, newBookingId: open[0].new_booking_id,
      });
    }
  } catch { /* if the check fails, continue — the attempt row itself is the guard */ }

  let tracked;
  try {
    const { rows: [row] } = await sbInsertReturning('grn_rebooking_attempts', {
      booking_id, hotel_name: booking.hotel_name, city_name: booking.city_name,
      room_type: booking.room_type, checkin_date: booking.checkin_date,
      supplier_code: booking.supplier_code,
      original_usd: check.original_usd, rebooked_usd: check.live_usd,
      saved_usd: check.gap_usd, status: 'pending',
      source_check_id: check.id, triggered_by: actor.actorEmail || 'manual',
    });
    tracked = row;
  } catch (err) {
    return res.status(500).json({ error: 'Could not open a rebooking attempt record — nothing was actioned.', detail: String(err.message || err) });
  }

  const ctx = { bookingId: booking_id, attemptId: tracked.id, ...actor };
  let acceptedDifferences = [];
  const fail = async (stage, reason, status, extra = {}) => {
    await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
      status: 'error', failure_stage: stage, failure_reason: String(reason).slice(0, 1000),
      updated_at: new Date().toISOString(),
    }).catch(() => {});
    return res.status(status).json({ error: reason, rebookingId: tracked.id, ...extra });
  };

  try {
    // --- Pull source: is the original still live, right now? ---
    const cachedRef = booking.booking_reference || booking.raw?.booking_reference || null;
    const source = await grnPullSourceBooking({ bookingId: booking_id, bookingReference: cachedRef, ctx });

    if (!source.status || !/^confirmed$/i.test(source.status)) {
      return fail('pull_source', `The original booking is no longer active (status: ${source.status || 'unknown'}). Nothing was booked.`, 409);
    }
    if (source.bookingType === 'C') {
      return fail('pull_source', 'GRN reports this record as a cancellation, not a live booking. Nothing was booked.', 409);
    }
    if (source.supportsCancellation === false) {
      return fail('pull_source', 'GRN reports this booking cannot be cancelled, so it cannot be rebooked. Nothing was booked.', 409);
    }
    if (source.underCancellation === true) {
      return fail('pull_source', 'A cancellation is already in progress on this booking. Nothing was booked.', 409);
    }

    // --- Guest comment guard ---
    // A real observed failure was on a booking whose comment read "attending a
    // conference... can we keep the same room?". The rebook payload carries no
    // comment field, so any such request is silently dropped. Requires explicit
    // acknowledgement before proceeding.
    if (source.bookingComment && !acknowledge_comment) {
      await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
        status: 'needs_review', failure_stage: 'guest_comment',
        failure_reason: `Guest comment present: ${String(source.bookingComment).slice(0, 400)}`,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
      return res.status(409).json({
        error: 'This booking carries a guest comment that will not be carried over to the replacement. Review it before rebooking.',
        guestComment: source.bookingComment,
        needsAcknowledgement: true,
        rebookingId: tracked.id,
      });
    }

    const originalRef = source.bookingReference || cachedRef;
    if (!originalRef) return fail('pull_source', 'The booking has no booking_reference — cannot rebook without it.', 400);

    // --- Recheck: the final word on price and terms ---
    const rechecked = await grnRecheckRate({ searchId, rateKey, groupCode, ctx });
    if (rechecked.priceChanged === true) {
      return fail('recheck', 'The price changed between the check and the recheck. Nothing was booked.', 409);
    }
    if (rechecked.cpChanged === true) {
      return fail('recheck', 'The cancellation policy changed between the check and the recheck. Nothing was booked.', 409);
    }
    if (rechecked.supportsCancellation === false) {
      return fail('recheck', 'The replacement rate cannot be cancelled via the API. Not moving the guest onto it.', 409);
    }

    // --- Second gate pass against what recheck actually returned ---
    {
      const item0 = booking.raw?.hotel?.booking_items?.[0] || {};
      const room0 = item0.rooms?.[0] || {};
      const bkPaxes = booking.raw?.hotel?.paxes || [];
      const origAgain = {
        roomCode: item0.room_code || null,
        roomType: room0.room_type || booking.room_type || null,
        roomDescription: room0.description || null,
        board: (Array.isArray(item0.boarding_details) && item0.boarding_details.length)
          ? item0.boarding_details.join(', ') : (booking.board_basis || null),
        nonRefundable: typeof item0.non_refundable === 'boolean' ? item0.non_refundable : null,
        cancelBy: item0.cancellation_policy?.cancel_by_date || booking.cancel_by_date || null,
        occupancy: {
          adults: room0.no_of_adults ?? bkPaxes.filter((p) => p.type === 'AD').length,
          children: room0.no_of_children ?? bkPaxes.filter((p) => p.type === 'CH').length,
          childAges: bkPaxes.filter((p) => p.type === 'CH').map((p) => p.age).filter((a) => a != null),
        },
      };
      const v2 = evaluateRate(rechecked.rate, origAgain);
      if (!v2.eligible) {
        // On the automatic path this is a hard stop. When the operator picked
        // the row themselves — having read the whole rate list, including what
        // it gives up — we proceed and record what was accepted, rather than
        // second-guessing a decision that has already been made deliberately.
        if (!operatorChose) {
          return fail('recheck_gate',
            `The rate no longer matches the original booking at recheck: ${v2.blockers.join(' ')} Nothing was booked.`,
            409, { blockers: v2.blockers });
        }
        acceptedDifferences = v2.blockers;
        await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
          failure_reason: `Operator-selected rate. Accepted differences: ${v2.blockers.join(' ')}`,
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    // --- Build and send the rebook ---
    const { payload, missing } = buildRebookPayload({ booking, recheck: rechecked, searchId: rechecked.searchId });
    if (missing.length) {
      return fail('build_payload', 'Cannot build a complete rebooking request — required fields missing. Nothing was booked.', 422, { missing });
    }

    await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, { status: 'booking', updated_at: new Date().toISOString() });

    const booked = await grnRebook({ originalRef, payload, ctx });

    // UNKNOWN: the request went out and we have no usable answer. This is the
    // 18-of-52 case in Mize's data, where the log simply stops. Look before
    // concluding anything.
    if (booked.outcome === GRN_OUTCOME.UNKNOWN) {
      const probe = await resolveBookingStatus({ bookingId: booking_id, bookingReference: originalRef, ctx });
      await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
        status: 'needs_review', failure_stage: 'rebook_unknown',
        failure_reason: `Rebook returned no usable response (${booked.httpStatus || 'network'}): ${booked.detail}. Original status after probe: ${probe.status || 'unresolved'}.`,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
      return res.status(202).json({
        status: 'unknown',
        error: 'GRN did not return a usable response to the rebooking request. A replacement booking MAY have been created. This has been flagged for review — check GRN before retrying, or you risk booking twice.',
        rebookingId: tracked.id,
        originalStatusAfterProbe: probe.status || null,
        detail: booked.detail,
      });
    }

    if (booked.outcome === GRN_OUTCOME.REJECTED) {
      return fail('rebook', `GRN rejected the rebooking: ${booked.detail}. The original booking is untouched.`, 409);
    }
    if (!booked.newBookingReference) {
      return fail('rebook', 'GRN accepted the rebooking but returned no booking_reference — cannot confirm it. Check GRN before retrying.', 500);
    }

    // Record the new reference IMMEDIATELY. Mize's export had RebookId null on
    // all 52 failures, which is why none of them could be reconciled.
    await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
      status: 'booked',
      new_booking_id: booked.newBookingId,
      new_booking_reference: booked.newBookingReference,
      gross_profit: booked.grossProfit,
      updated_at: new Date().toISOString(),
    }).catch(() => {});

    // --- Confirm the replacement ---
    let confirmed = { outcome: GRN_OUTCOME.OK };
    if (!/^confirmed$/i.test(String(booked.status))) {
      confirmed = await grnConfirmRebook({ newRef: booked.newBookingReference, ctx });
    } else {
      confirmed = await grnConfirmRebook({ newRef: booked.newBookingReference, ctx });
    }

    if (confirmed.outcome !== GRN_OUTCOME.OK) {
      await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
        status: 'needs_review', failure_stage: 'confirm_rebook',
        failure_reason: `Replacement placed but confirmation ${confirmed.outcome}: ${confirmed.detail}`,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
      return res.status(202).json({
        status: 'needs_review',
        error: 'The replacement booking was placed but could not be confirmed. The original booking is still live and untouched. Do not cancel it until the replacement is verified.',
        rebookingId: tracked.id,
        newBookingId: booked.newBookingId,
        newBookingReference: booked.newBookingReference,
        detail: confirmed.detail,
      });
    }

    // Replacement confirmed. Original still live — deliberately.
    await sbPatch('grn_rebooking_attempts', `id=eq.${tracked.id}`, {
      status: 'awaiting_cancel', updated_at: new Date().toISOString(),
    }).catch(() => {});

    return res.json({
      status: 'awaiting_cancel',
      message: 'Replacement booking is confirmed. The original is still live — cancel it to realise the saving.',
      rebookingId: tracked.id,
      newBookingId: booked.newBookingId,
      newBookingReference: booked.newBookingReference,
      originalBookingReference: originalRef,
      newPrice: booked.price,
      currency: booked.currency,
      grossProfit: booked.grossProfit,
      savedUsd: check.gap_usd,
      operatorChose,
      acceptedDifferences,
      pulledVia: source.via,
    });
  } catch (err) {
    return fail('book_replacement', `Rebooking failed before the original was touched: ${String(err.message || err)}`, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /repricing/cancel-original
//
// Destructive. Cancels a live reservation. Two modes:
//
//   rebook mode  — attempt_id given: cancels the original of a confirmed
//                  replacement, completing the rebooking.
//   standalone   — booking_id + confirm:true: cancels a booking outright, no
//                  replacement involved.
//
// On an UNKNOWN we fetch rather than assume. The observed cancel failure was a
// 500 after 20 seconds, which is a timeout profile — the cancellation may well
// have succeeded with only the response lost.
// ---------------------------------------------------------------------------
router.post('/repricing/cancel-original', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  const { attempt_id, booking_id, confirm } = req.body || {};
  if (!attempt_id && !booking_id) return res.status(400).json({ error: 'attempt_id or booking_id required' });
  if (!attempt_id && !confirm) {
    return res.status(400).json({ error: 'Standalone cancellation requires confirm: true. This permanently cancels a live reservation.' });
  }
  const actor = actorFrom(req);

  try {
    let attempt = null;
    let targetBookingId = booking_id || null;

    if (attempt_id) {
      const { rows } = await sbSelect('grn_rebooking_attempts', `id=eq.${encodeURIComponent(attempt_id)}&select=*&limit=1`);
      attempt = rows[0];
      if (!attempt) return res.status(404).json({ error: 'Rebooking attempt not found.' });
      if (!['awaiting_cancel', 'needs_review', 'booked'].includes(attempt.status)) {
        return res.status(409).json({ error: `This attempt is in status "${attempt.status}" — nothing to cancel.` });
      }
      targetBookingId = attempt.booking_id;
    }

    const { rows: bkRows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(targetBookingId)}&select=*&limit=1`);
    const booking = bkRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found in the synced table.' });

    const ctx = { bookingId: targetBookingId, attemptId: attempt?.id || null, ...actor };
    const cachedRef = booking.booking_reference || booking.raw?.booking_reference || null;

    const source = await grnPullSourceBooking({ bookingId: targetBookingId, bookingReference: cachedRef, ctx });
    if (/^cancel/i.test(String(source.status))) {
      if (attempt) {
        await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, { status: 'confirmed', updated_at: new Date().toISOString() }).catch(() => {});
      }
      return res.json({ status: 'already_cancelled', message: 'GRN already reports this booking as cancelled. Nothing to do.' });
    }
    const originalRef = source.bookingReference || cachedRef;
    if (!originalRef) return res.status(400).json({ error: 'No booking_reference available — cannot cancel.' });

    if (attempt) {
      await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, { status: 'cancelling', updated_at: new Date().toISOString() }).catch(() => {});
    }

    const cancelled = await grnCancelOriginal({ originalRef, ctx });

    // UNKNOWN — look before concluding. 15 of 52 observed failures were here.
    if (cancelled.outcome === GRN_OUTCOME.UNKNOWN) {
      const probe = await resolveBookingStatus({ bookingId: targetBookingId, bookingReference: originalRef, ctx });
      const actuallyCancelled = probe.resolved && /^cancel/i.test(String(probe.status));

      if (actuallyCancelled) {
        if (attempt) {
          await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, {
            status: 'confirmed', failure_stage: null,
            failure_reason: `Cancel returned ${cancelled.httpStatus || 'no response'} but the booking is confirmed cancelled on GRN.`,
            updated_at: new Date().toISOString(),
          }).catch(() => {});
        }
        return res.json({
          status: 'confirmed',
          message: 'GRN returned an error on the cancellation, but a follow-up check confirms the booking IS cancelled. Resolved.',
          verifiedBy: 'post-failure fetch',
        });
      }

      if (attempt) {
        await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, {
          status: 'needs_review', failure_stage: 'cancel_original',
          failure_reason: `Cancel returned ${cancelled.httpStatus || 'no response'}: ${cancelled.detail}. Original status after probe: ${probe.status || 'unresolved'}. BOTH BOOKINGS MAY BE LIVE.`,
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
      return res.status(202).json({
        status: 'needs_review',
        error: 'The cancellation did not return a usable response, and a follow-up check does not show the booking as cancelled. Both bookings may be live — resolve this in GRN before doing anything else.',
        originalBookingReference: originalRef,
        newBookingId: attempt?.new_booking_id || null,
        originalStatusAfterProbe: probe.status || null,
        detail: cancelled.detail,
      });
    }

    if (cancelled.outcome === GRN_OUTCOME.REJECTED) {
      if (attempt) {
        await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, {
          status: 'needs_review', failure_stage: 'cancel_original',
          failure_reason: `GRN rejected the cancellation: ${cancelled.detail}`,
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
      return res.status(409).json({
        error: `GRN rejected the cancellation: ${cancelled.detail}`,
        originalBookingReference: originalRef,
        newBookingId: attempt?.new_booking_id || null,
        needsManualAction: Boolean(attempt),
      });
    }

    // GRN can return 200 with a non-confirmed status.
    if (cancelled.status && !/^confirmed$/i.test(String(cancelled.status))) {
      if (attempt) {
        await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, {
          status: 'needs_review', failure_stage: 'cancel_original',
          failure_reason: `Cancellation returned status "${cancelled.status}".`,
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
      return res.status(202).json({
        status: 'needs_review',
        error: `The cancellation returned status "${cancelled.status}" rather than confirmed. Verify in GRN.`,
        originalBookingReference: originalRef,
      });
    }

    if (attempt) {
      await sbPatch('grn_rebooking_attempts', `id=eq.${attempt.id}`, {
        status: 'confirmed', failure_stage: null, failure_reason: null,
        cancellation_reference: cancelled.cancellationReference,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }

    return res.json({
      status: 'confirmed',
      message: attempt
        ? 'Original cancelled. The rebooking is complete and the saving is realised.'
        : 'Booking cancelled.',
      cancellationReference: cancelled.cancellationReference,
      cancellationCharges: cancelled.charges,
      rebookingId: attempt?.id || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Cancellation failed.', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// GET /repricing/attempt-log?attempt_id=...  (or ?booking_id=...)
// The per-step call log, for the tabbed viewer.
// ---------------------------------------------------------------------------
router.get('/repricing/attempt-log', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const { attempt_id, booking_id } = req.query;
  if (!attempt_id && !booking_id) return res.status(400).json({ error: 'attempt_id or booking_id required' });
  try {
    const where = attempt_id
      ? `attempt_id=eq.${encodeURIComponent(attempt_id)}`
      : `booking_id=eq.${encodeURIComponent(booking_id)}`;
    const { rows } = await sbSelect('grn_api_log',
      `${where}&select=*&order=created_at.asc&limit=200`);
    res.json({
      count: rows.length,
      steps: rows.map((r) => ({
        id: r.id,
        at: r.created_at,
        step: r.step,
        method: r.method,
        url: r.url,
        httpStatus: r.http_status,
        errorCode: r.error_code,
        errorMeaning: r.error_code ? (GRN_ERROR_MEANINGS[String(r.error_code)] || null) : null,
        outcome: r.outcome,
        durationMs: r.duration_ms,
        ok: r.ok,
        networkError: r.network_error,
        request: r.request_body,
        response: r.response_body,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /repricing/searches — the conversion story for Rebookings.
// Reads the real check log (grn_price_checks). Shows searches made, drops
// found, and how many were actionable under the full gate.
router.get('/repricing/searches', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 25;
  const offset = (page - 1) * perPage;

  try {
    const { rows: checks, total } = await sbSelect('grn_price_checks',
      `select=id,booking_id,checked_at,original_price,original_currency,original_usd,`
      + `live_price,live_currency,live_usd,dropped,gap_usd,gap_pct,room_match,board_match,dates_match,`
      + `policy_match,match_basis,original_non_refundable,live_non_refundable,raw`
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

    // Actionable now means the FULL gate, not room+dates.
    const { total: actionableDrops } = await sbSelect('grn_price_checks',
      `dropped=eq.true&room_match=eq.true&board_match=eq.true&policy_match=eq.true&dates_match=eq.true&match_basis=in.(room_code,room_name_exact)&select=id`,
      { 'Prefer': 'count=exact' });

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
        const matchedRate = c.raw || {};
        const actionable = Boolean(
          c.dropped && c.room_match === true && c.board_match === true &&
          c.policy_match === true && c.dates_match === true &&
          (c.match_basis === 'room_code' || c.match_basis === 'room_name_exact')
        );
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
          policyMatch: c.policy_match,
          originalNonRefundable: c.original_non_refundable,
          liveNonRefundable: c.live_non_refundable,
          matchBasis: c.match_basis || matchedRate?._match_basis || null,
          blockers: matchedRate?._blockers || [],

          actionable,
          result: c.live_usd == null ? 'sold_out'
            : c.dropped ? (actionable ? 'drop_actionable' : 'drop_blocked')
            : (c.gap_usd != null && c.gap_usd < 0 ? 'higher' : 'no_drop'),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /repricing/debug-availability?booking_id=...
//
// READ ONLY. Runs the same availability search that /repricing/check runs,
// then reports the SHAPE of what came back rather than the matched rate.
//
// Why this exists: /repricing/check stores only the one rate it selected, so
// we have never seen the rest of the response. The open question is whether
// GRN tells us which supplier each rate belongs to — the one full rate we
// have (Glen Eyrie) carried no supplier field, but that rate may not be
// representative, and the field may live at hotel level instead.
//
// Books nothing, cancels nothing, writes nothing. One GRN call.
// ---------------------------------------------------------------------------
router.get('/repricing/debug-availability', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required, e.g. ?booking_id=GRN-202606-2592885' });

  try {
    const { rows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=booking_id,hotel_code,city_code,checkin,checkin_date,checkout,room_type,board_basis,price_total,currency,supplier_code,raw&limit=1`);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: 'Booking not found in synced table' });
    if (!b.hotel_code) return res.status(400).json({ error: 'Booking has no hotel_code' });

    const checkin = (b.checkin_date || b.checkin || '').slice(0, 10);
    const checkout = (b.checkout || '').slice(0, 10);
    const paxes = b.raw?.hotel?.paxes || [];
    const adults = paxes.filter((p) => p.type === 'AD').length || 2;
    const childAges = paxes.filter((p) => p.type === 'CH').map((p) => p.age).filter((a) => a != null);
    const roomReq = { adults };
    if (childAges.length) roomReq.children_ages = childAges;

    const resp = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
      method: 'POST', headers: GRN_HEADERS(),
      body: JSON.stringify({
        version: '2.0', checkin, checkout,
        client_nationality: (b.raw?.nationality || b.raw?.holder?.client_nationality || 'US').toString().slice(0, 2).toUpperCase(),
        currency: b.currency || 'USD', cutoff_time: GRN_CUTOFF_TIME,
        hotel_codes: [String(b.hotel_code)], hotel_info: false,
        rates: 'comprehensive', rooms: [roomReq],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: 'GRN availability error', details: data });

    const hotel = (data.hotels || [])[0] || {};
    const rates = Array.isArray(hotel.rates) ? hotel.rates : (hotel.min_rate ? [hotel.min_rate] : []);

    // Hunt for anything that could identify a supplier, at any nesting level.
    const SUPPLIER_HINT = /suppl|provid|source|vendor|channel|partner|seller|merchant/i;
    function findHintedKeys(obj, path = '', depth = 0, out = []) {
      if (!obj || typeof obj !== 'object' || depth > 4) return out;
      for (const [k, v] of Object.entries(obj)) {
        const here = path ? `${path}.${k}` : k;
        if (SUPPLIER_HINT.test(k)) {
          out.push({ path: here, value: (v && typeof v === 'object') ? JSON.stringify(v).slice(0, 200) : v });
        }
        if (v && typeof v === 'object' && !Array.isArray(v)) findHintedKeys(v, here, depth + 1, out);
        else if (Array.isArray(v) && v.length && typeof v[0] === 'object') findHintedKeys(v[0], `${here}[0]`, depth + 1, out);
      }
      return out;
    }

    // Distinct room descriptions, to see how much the supplier-filter idea
    // would actually narrow things down.
    const descriptions = {};
    for (const rt of rates) {
      const d = rt?.rooms?.[0]?.description || rt?.rooms?.[0]?.room_type || rt?.room_type || '(none)';
      descriptions[d] = (descriptions[d] || 0) + 1;
    }

    const bookedItem = b.raw?.hotel?.booking_items?.[0] || {};
    const bookedRoom = bookedItem.rooms?.[0] || {};

    res.json({
      bookingId,
      booked: {
        supplierCode: b.supplier_code || null,
        roomCode: bookedItem.room_code || null,
        roomType: bookedRoom.room_type || b.room_type || null,
        description: bookedRoom.description || null,
        board: bookedItem.boarding_details || b.board_basis || null,
        nonRefundable: bookedItem.non_refundable ?? null,
        bookingItemKeys: Object.keys(bookedItem),
      },
      response: {
        topLevelKeys: Object.keys(data),
        hotelLevelKeys: Object.keys(hotel),
        rateCount: rates.length,
      },
      supplierHints: {
        atResponseLevel: findHintedKeys(data).filter((h) => !h.path.startsWith('hotels')),
        atHotelLevel: findHintedKeys(hotel, 'hotel'),
        atRateLevel: rates.length ? findHintedKeys(rates[0], 'rate') : [],
        anyRateHasHint: rates.some((rt) => findHintedKeys(rt).length > 0),
      },
      firstRate: rates[0] ? {
        allKeys: Object.keys(rates[0]),
        roomKeys: rates[0].rooms?.[0] ? Object.keys(rates[0].rooms[0]) : [],
        sample: {
          price: rates[0].price,
          room_code: rates[0].room_code,
          room_reference: rates[0].rooms?.[0]?.room_reference,
          room_type: rates[0].rooms?.[0]?.room_type,
          description: rates[0].rooms?.[0]?.description,
          boarding_details: rates[0].boarding_details,
          non_refundable: rates[0].non_refundable,
          rate_type: rates[0].rate_type,
        },
      } : null,
      distinctDescriptions: Object.entries(descriptions)
        .sort((a, c) => c[1] - a[1])
        .map(([description, count]) => ({ description, count })),
      exactDescriptionMatches: bookedRoom.description
        ? rates.filter((rt) => norm(rt?.rooms?.[0]?.description) === norm(bookedRoom.description)).length
        : null,
      note: 'Read-only diagnostic. One availability call. Nothing booked, cancelled, or written.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Diagnostic failed', message: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// GET /repricing/rebook-preview?booking_id=...
//
// Builds the exact booking payload that a rebook would send, and reports any
// required field that cannot be filled. Makes NO booking, NO cancellation, and
// no recheck call.
//
// Caveat shown in the response: rate_key, room_code and room_reference here are
// the values from the stored price check. The real chain replaces all three
// with the values returned by Rate Recheck, exactly as the Booking Request docs
// require. Everything else — holder, paxes, dates, codes — is final.
// ---------------------------------------------------------------------------
router.get('/repricing/rebook-preview', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });

  try {
    const { rows: bkRows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=*&limit=1`);
    const booking = bkRows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found in synced table' });

    const { rows: checks } = await sbSelect('grn_price_checks',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=*&order=checked_at.desc&limit=1`);
    const check = checks[0] || null;
    const matched = check?.raw || {};

    const pseudoRecheck = {
      rateKey: matched.rate_key || null,
      groupCode: matched.group_code || null,
      roomCode: matched.room_code || null,
      roomReference: matched.rooms?.[0]?.room_reference || null,
      rate: matched,
    };

    const { payload, missing } = buildRebookPayload({
      booking, recheck: pseudoRecheck, searchId: matched._search_id || null,
    });

    res.json({
      bookingId,
      readyToRebook: missing.length === 0,
      missing,
      lastCheckedAt: check?.checked_at || null,
      note: 'Nothing was booked, cancelled, or rechecked. rate_key, room_code and room_reference shown here come from the stored search; the real chain replaces them with Rate Recheck values before booking, as the docs require.',
      payload,
    });
  } catch (err) {
    res.status(500).json({ error: 'Preview failed', message: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// GET /repricing/debug-roomcode-stability?booking_id=...
//
// Runs the SAME availability search twice and compares the room_code values.
//
// Settles whether room_code is a stable identifier or a per-search token. The
// docs already imply the latter — the Booking Request page says to take
// room_code "from the Refetch/Recheck response" when the rate type is
// Refetch/Recheck, which only makes sense if it changes — but this measures it
// directly rather than relying on a reading.
//
// Two availability calls. Books nothing, writes nothing.
// ---------------------------------------------------------------------------
router.get('/repricing/debug-roomcode-stability', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });

  try {
    const { rows } = await sbSelect('grn_bookings',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=hotel_code,checkin,checkin_date,checkout,currency,raw&limit=1`);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: 'Booking not found' });

    const checkin = (b.checkin_date || b.checkin || '').slice(0, 10);
    const checkout = (b.checkout || '').slice(0, 10);
    const paxes = b.raw?.hotel?.paxes || [];
    const adults = paxes.filter((p) => p.type === 'AD').length || 2;
    const childAges = paxes.filter((p) => p.type === 'CH').map((p) => p.age).filter((a) => a != null);
    const roomReq = { adults };
    if (childAges.length) roomReq.children_ages = childAges;

    const runSearch = async () => {
      const resp = await fetch(`${GRN_API_BASE_URL}/hotels/availability`, {
        method: 'POST', headers: GRN_HEADERS(),
        body: JSON.stringify({
          version: '2.0', checkin, checkout,
          client_nationality: (b.raw?.nationality || b.raw?.holder?.client_nationality || 'US').toString().slice(0,2).toUpperCase(),
          currency: b.currency || 'USD', cutoff_time: GRN_CUTOFF_TIME,
          hotel_codes: [String(b.hotel_code)], hotel_info: false,
          rates: 'comprehensive', rooms: [roomReq],
        }),
      });
      const data = await resp.json();
      const hotel = (data.hotels || [])[0] || {};
      const rates = Array.isArray(hotel.rates) ? hotel.rates : (hotel.min_rate ? [hotel.min_rate] : []);
      return {
        searchId: data.search_id || null,
        moreResults: data.more_results ?? null,
        rateCount: rates.length,
        byDescription: rates.reduce((acc, rt) => {
          const d = rt?.rooms?.[0]?.description || rt?.rooms?.[0]?.room_type || '(none)';
          if (!acc[d]) acc[d] = [];
          acc[d].push({ room_code: rt.room_code || null, room_reference: rt.rooms?.[0]?.room_reference || null, price: rt.price ?? null });
          return acc;
        }, {}),
      };
    };

    const first = await runSearch();
    await sleep(2500);
    const second = await runSearch();

    // Compare room_code per room description across the two searches.
    const comparison = [];
    for (const desc of Object.keys(first.byDescription)) {
      const a = first.byDescription[desc] || [];
      const c = second.byDescription[desc] || [];
      const aCodes = [...new Set(a.map((x) => x.room_code).filter(Boolean))];
      const cCodes = [...new Set(c.map((x) => x.room_code).filter(Boolean))];
      comparison.push({
        description: desc,
        firstSearchCodes: aCodes,
        secondSearchCodes: cCodes,
        identical: aCodes.length > 0 && aCodes.length === cCodes.length && aCodes.every((x) => cCodes.includes(x)),
      });
    }
    const compared = comparison.filter((c) => c.firstSearchCodes.length && c.secondSearchCodes.length);
    const stable = compared.length > 0 && compared.every((c) => c.identical);

    res.json({
      bookingId,
      bookedRoomCode: b.raw?.hotel?.booking_items?.[0]?.room_code || null,
      bookedDescription: b.raw?.hotel?.booking_items?.[0]?.rooms?.[0]?.description || null,
      firstSearch: { searchId: first.searchId, rateCount: first.rateCount, moreResults: first.moreResults },
      secondSearch: { searchId: second.searchId, rateCount: second.rateCount, moreResults: second.moreResults },
      roomsCompared: compared.length,
      roomCodeStableAcrossSearches: stable,
      verdict: compared.length === 0
        ? 'Could not compare — no room appeared in both searches with a room_code.'
        : stable
          ? 'room_code is IDENTICAL across two searches. It is deterministic per search criteria, so the booking-side mismatch needs a different explanation.'
          : 'room_code DIFFERS between two identical searches. It is a per-search token and cannot be used to match a booking to a live rate.',
      comparison,
      note: 'Read-only. Two availability calls. Nothing booked, cancelled, or written.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Stability test failed', message: String(err.message || err) });
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
      const r = await sbSelect('grn_rebooking_attempts', q, { 'Prefer': 'count=exact' });
      rows = r.rows; total = r.total ?? 0;
    } catch {
      rows = []; total = 0;
    }

    let counts = { successful: 0, errors: 0, all: 0 };
    try {
      counts.all = await sbCount('grn_rebooking_attempts', '');
      counts.successful = await sbCount('grn_rebooking_attempts', 'status=in.(confirmed,success)');
      counts.errors = await sbCount('grn_rebooking_attempts', 'status=in.(error,failed)');
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
        failureStage: r.failure_stage || null,
        failureReason: r.failure_reason || null,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
