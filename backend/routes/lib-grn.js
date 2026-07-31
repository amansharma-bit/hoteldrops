// ============================================================================
// lib-grn.js  —  SHARED FOUNDATION for the rebuq backend
// ----------------------------------------------------------------------------
// Every route file imports from here. It contains ZERO routes — only the
// building blocks: GRN API calls, Supabase helpers, currency conversion,
// and audit logging. Keeping these in one tested place means the routes stay
// small and can't each reinvent (and mis-implement) the same plumbing.
//
// DESIGN RULES (QA):
//  - No secrets hardcoded. Everything from process.env (safe in Railway).
//  - Every external call is wrapped so a failure returns a value or throws a
//    clear error — never an unhandled crash.
//  - GRN calls are paced/retried to avoid the 429 rate-limit storm.
//  - Logging failures are swallowed (logging must never break a real action).
// ============================================================================

'use strict';

// ---- Config (from environment — never hardcode keys) -----------------------
const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const GRN_STATIC_BASE_URL = process.env.GRN_STATIC_BASE_URL || 'https://cdn-api.grnconnect.com';
const GRN_CUTOFF_TIME = parseInt(process.env.GRN_CUTOFF_TIME, 10) || 50000;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const SYNC_SECRET = process.env.SYNC_SECRET;

// ---- Small utilities -------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');

function grnConfigured() { return Boolean(GRN_API_KEY); }
function sbConfigured() { return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY); }

function GRN_HEADERS() {
  return { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' };
}

// ============================================================================
// GRN CALLS
// ============================================================================
// One GRN GET, JSON in / JSON out, with:
//   - a hard timeout (so a hung GRN call can't freeze a request forever)
//   - a single 429-aware retry (polite back-off, avoids the rate-limit storm)
// Throws a clear Error on failure; callers decide how to handle it.
async function grnGetJson(url, { retries = 1, timeoutMs = 30000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
    let resp;
    try {
      resp = await fetch(url, { headers: GRN_HEADERS(), signal: ctrl.signal });
    } catch (e) {
      clearTimeout(timer);
      if (attempt < retries) { await sleep(1500 * (attempt + 1)); continue; }
      throw new Error(timedOut ? `GRN GET timed out after ${timeoutMs}ms` : `GRN GET network error: ${String(e.message || e)}`);
    }
    clearTimeout(timer);
    if (resp.status === 429 && attempt < retries) { await sleep(2000 * (attempt + 1)); continue; }
    const text = await resp.text();
    let body = null;
    if (text) { try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 2000) }; } }
    if (!resp.ok) throw new Error(`GRN GET ${url.split('?')[0]} returned HTTP ${resp.status}`);
    return body;
  }
}

// Outcome classification for money-path calls. The critical rule: a 5xx, a
// timeout, or a network error is UNKNOWN (not a failure) — because the action
// may have succeeded with only the response lost. Never assume success OR
// failure on an unknown; the caller must mark it for review.
const GRN_OUTCOME = { OK: 'ok', REJECTED: 'rejected', UNKNOWN: 'unknown' };

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

// Full-featured GRN call used by the money path (any method + body). Returns a
// rich result AND writes an audit-log row for every call. Never throws on an
// HTTP error — it returns the classified outcome so the caller can branch
// safely. Only truly unexpected JS errors would throw.
async function grnCall({ step, method, url, body, ctx = {} }) {
  const started = Date.now();
  let httpStatus = 0, parsed = null, text = null, networkError = null;
  try {
    const init = { method, headers: GRN_HEADERS() };
    if (body !== undefined && body !== null) init.body = JSON.stringify(body);
    const resp = await fetch(url, init);
    httpStatus = resp.status;
    text = await resp.text();
    if (text) { try { parsed = JSON.parse(text); } catch { parsed = null; } }
  } catch (err) {
    networkError = String(err.message || err);
  }
  const durationMs = Date.now() - started;
  const outcome = classifyGrnOutcome({ httpStatus, body: parsed, networkError });
  const errorCode = parsed ? (String(parsed.error_code ?? parsed.errorCode ?? '') || null) : null;
  await writeApiLog({
    booking_id: ctx.bookingId || null, attempt_id: ctx.attemptId || null,
    step, method, url, request_body: body ?? null,
    http_status: httpStatus || null, error_code: errorCode,
    response_body: parsed ?? (text ? { _raw: String(text).slice(0, 20000) } : null),
    duration_ms: durationMs, ok: outcome === GRN_OUTCOME.OK, outcome,
    network_error: networkError, actor_email: ctx.actorEmail || null, actor_id: ctx.actorId || null,
  });
  return { outcome, httpStatus, body: parsed, text, errorCode, durationMs, networkError };
}

// Human-readable meanings for GRN error codes (from the GRN error table).
const GRN_ERROR_MEANINGS = {
  '2002': 'Invalid booking reference', '2003': 'Booking has already been cancelled',
  '2004': 'Rate is sold out', '2005': 'Price has increased',
  '2006': 'Needs confirmation from supplier', '2008': 'Rate no longer available / search expired',
  '2104': 'Try again', '1505': 'Insufficient credit limit', '1513': 'Technical issue at supplier',
  '5114': 'Pax data does not match the given room', '5120': 'Request timed out at supplier',
  '5121': 'Booking not found', '5138': "Error at supplier's end",
  '5142': 'Changes cannot be made to this booking item',
  '5143': 'Past booking items cannot be cancelled',
  '5149': 'Search and booking details do not match',
  '5151': 'Supplier does not support cancellation via API',
  '6000': 'Unknown error at supplier',
};

function describeGrnError(errorCode, body, text) {
  if (errorCode && GRN_ERROR_MEANINGS[errorCode]) return `${errorCode} — ${GRN_ERROR_MEANINGS[errorCode]}`;
  if (errorCode) return String(errorCode);
  const msg = body?.error || body?.message || body?.detail;
  if (msg) return String(msg).slice(0, 300);
  if (text) return String(text).slice(0, 300);
  return 'no detail returned';
}

// ============================================================================
// SUPABASE (PostgREST) HELPERS
// ============================================================================
function sbHeaders(extra = {}) {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function sbSelect(table, query, extraHeaders = {}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders(extraHeaders) });
  const contentRange = resp.headers.get('content-range');
  const body = (resp.status === 200 || resp.status === 206) ? await resp.json() : [];
  if (!resp.ok && resp.status !== 206) {
    throw new Error(`Supabase select on ${table} failed (${resp.status}): ${JSON.stringify(body).slice(0, 300)}`);
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
    throw new Error(`Supabase upsert into ${table} failed (${resp.status}): ${text.slice(0, 300)}`);
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
    throw new Error(`Supabase patch on ${table} failed (${resp.status}): ${text.slice(0, 300)}`);
  }
}

async function sbInsertReturning(table, row) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body: JSON.stringify([row]),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase insert into ${table} failed (${resp.status}): ${text.slice(0, 300)}`);
  }
  return { rows: await resp.json() };
}

// Audit log — every GRN money-path call lands here. Wrapped so a logging
// failure can NEVER break the real action it is logging.
async function writeApiLog(row) {
  if (!sbConfigured()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/grn_api_log`, {
      method: 'POST',
      headers: sbHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify([row]),
    });
  } catch { /* logging must never throw */ }
}

// ============================================================================
// CURRENCY (booking prices come in many currencies; the dashboard shows USD)
// ============================================================================
const USD_RATES = {
  USD: 1.0, EUR: 1.1446, GBP: 1.3401, CHF: 1.1200, CAD: 0.7300,
  AUD: 0.6960, NZD: 0.6000, JPY: 0.0067, CNY: 0.1400, HKD: 0.1280,
  SGD: 0.7770, MYR: 0.2360, THB: 0.0301, IDR: 0.0000553, PHP: 0.0170,
  VND: 0.00004, KRW: 0.00072, TWD: 0.0310, INR: 0.011765, LKR: 0.0033,
  NPR: 0.007353, PKR: 0.0036, BDT: 0.0084, AED: 0.27225, SAR: 0.2666,
  QAR: 0.2747, KWD: 3.2600, BHD: 2.6500, OMR: 2.6000, JOD: 1.4100,
  ILS: 0.2700, TRY: 0.0290, EGP: 0.0203, MAD: 0.1000, ZAR: 0.0550,
  KES: 0.0077, NGN: 0.00065, MUR: 0.0220, NOK: 0.1016, SEK: 0.0950,
  DKK: 0.1530, PLN: 0.2500, CZK: 0.0430, HUF: 0.0028, RON: 0.2300,
  BGN: 0.5850, HRK: 0.1520, RSD: 0.0098, ISK: 0.0073, RUB: 0.0125,
  UAH: 0.0240, KZT: 0.0019, GEL: 0.3700, MXN: 0.0575, BRL: 0.1800,
  ARS: 0.00095, CLP: 0.00105, COP: 0.00025, PEN: 0.2700, UYU: 0.0250,
  CRC: 0.0020, DOP: 0.0165, JMD: 0.0064, MVR: 0.0649, FJD: 0.4400,
  XOF: 0.00175, XAF: 0.00175, TND: 0.3200, DZD: 0.0075, AZN: 0.5900,
  BND: 0.7770, MOP: 0.1244, KHR: 0.00025, LAK: 0.000046, MMK: 0.00048,
};
function usdRateFor(currency) {
  if (!currency) return null;
  const r = USD_RATES[String(currency).trim().toUpperCase()];
  return r == null ? null : r;
}
function toUsdOrNull(amount, currency) {
  if (amount == null) return null;
  const rate = usdRateFor(currency);
  if (rate == null) return null;
  const n = Number(amount);
  return isNaN(n) ? null : n * rate;
}
function toUsd(amount, currency) {
  const v = toUsdOrNull(amount, currency);
  return v == null ? 0 : v;
}

// ============================================================================
// DATE HELPERS (GRN uses mixed formats; we normalise carefully)
// ============================================================================
function parseGrnDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const iso = s.replace(' ', 'T');
  const d = new Date(`${iso}+05:30`); // GRN local datetimes are IST
  return isNaN(d.getTime()) ? null : d;
}
function grnDateMs(v) { const d = parseGrnDate(v); return d ? d.getTime() : null; }
const parseTs = (v) => { if (!v) return null; const d = new Date(String(v).replace(' ', 'T')); return isNaN(d.getTime()) ? null : d.toISOString(); };
const parseDate = (v) => { const iso = parseTs(v); return iso ? iso.slice(0, 10) : null; };
const fmtGrn = (d) => d.toISOString().slice(0, 19).replace('T', ' '); // "YYYY-MM-DD HH:MM:SS"
const fmtDay = (d) => d.toISOString().slice(0, 10);

// ============================================================================
// CITY NAME CACHE (loaded once from GRN's static CDN, then reused)
// This is a SINGLE call to the CDN — NOT the per-country hammering that caused
// 429 storms elsewhere. If it fails, city names are simply null; nothing breaks.
// ============================================================================
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
        .catch(() => null)
        .finally(() => { cityCacheInFlight = null; });
    }
    const map = await cityCacheInFlight;
    if (!map) return null;
  }
  return cityCodeToNameCache.get(cityCode) || null;
}

// ============================================================================
// BOOKING → ROW  (turns a GRN booking-detail object into a grn_bookings row)
// This shape must match the grn_bookings table columns exactly.
// ============================================================================
function rollUpBooking(booking) {
  const items = booking.hotel?.booking_items || [];
  const rawStatus = String(booking.booking_status || '').trim().toLowerCase();
  const isCancelled = rawStatus.startsWith('cancel') || booking.booking_type === 'C';
  let priceSum = 0, anyPrice = false, refundableCount = 0, nonRefundableCount = 0, unknownCount = 0, earliestCancelBy = null;
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
    status, cancelByDate: earliestCancelBy, roomCount: items.length,
    sampleNonRefundable: typeof items[0]?.non_refundable === 'boolean' ? items[0].non_refundable : null,
  };
}

function toRow(booking, cityName) {
  const roll = rollUpBooking(booking);
  const item0 = booking.hotel?.booking_items?.[0];
  const room0 = item0?.rooms?.[0];
  let guestName = null;
  if (booking.holder) guestName = `${booking.holder.name || ''} ${booking.holder.surname || ''}`.trim() || null;
  if (!guestName && booking.hotel?.paxes?.[0]) {
    const p = booking.hotel.paxes[0];
    guestName = `${p.name || ''} ${p.surname || ''}`.trim() || null;
  }
  const checkinDate = parseDate(booking.checkin);
  return {
    booking_id: booking.booking_id, booking_reference: booking.booking_reference || null,
    supplier_reference: booking.supplier_reference || null, booking_date: parseTs(booking.booking_date),
    grn_updated_at: parseTs(booking.updated_at), checkin: checkinDate, checkin_date: checkinDate,
    checkout: parseDate(booking.checkout),
    hotel_name: booking.hotel?.name || booking.hotel?.hotel_confirmation_number || null,
    hotel_code: booking.hotel?.hotel_code ? String(booking.hotel.hotel_code) : null,
    city_code: booking.hotel?.city_code || null, city_name: cityName,
    country_code: booking.hotel?.country_code || null,
    room_type: room0?.room_type || room0?.description || null,
    room_count: roll.roomCount, guest_name: guestName,
    board_basis: item0?.boarding_details?.join(', ') || null,
    price_total: roll.priceTotal, currency: booking.currency || item0?.currency || null,
    supplier_code: booking.supplier_code || null, cancel_by_date: roll.cancelByDate,
    raw_booking_status: booking.booking_status ?? null, raw_non_refundable: roll.sampleNonRefundable,
    status: roll.status, raw: booking, synced_at: new Date().toISOString(),
  };
}

// ============================================================================
// SECRET GUARD (protects sync endpoints if SYNC_SECRET is set; open if not)
// ============================================================================
function checkSecret(req, res) {
  if (!SYNC_SECRET) return true;
  if (req.query.secret !== SYNC_SECRET) { res.status(401).json({ error: 'Wrong or missing ?secret=' }); return false; }
  return true;
}

// ---- Exports ---------------------------------------------------------------
module.exports = {
  // config / flags
  GRN_API_BASE_URL, GRN_STATIC_BASE_URL, GRN_CUTOFF_TIME, SYNC_SECRET,
  grnConfigured, sbConfigured, GRN_HEADERS,
  // grn
  grnGetJson, grnCall, GRN_OUTCOME, classifyGrnOutcome, describeGrnError, GRN_ERROR_MEANINGS,
  // supabase
  sbSelect, sbCount, sbUpsert, sbPatch, sbInsertReturning, writeApiLog,
  // currency
  usdRateFor, toUsd, toUsdOrNull,
  // dates
  parseGrnDate, grnDateMs, parseTs, parseDate, fmtGrn, fmtDay,
  // cities + rows
  getCityName, loadCityCache, rollUpBooking, toRow,
  // misc
  sleep, norm, checkSecret,
};
