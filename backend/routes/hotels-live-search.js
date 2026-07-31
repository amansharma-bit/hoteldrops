const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const GRN_STATIC_BASE_URL = 'https://cdn-api.grnconnect.com';
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

const GRN_HEADERS = () => ({
  'api-key': GRN_API_KEY,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

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
  const contentRange = resp.headers.get('content-range');
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

const USD_RATES = {
  USD: 1.0,      EUR: 1.1446,   GBP: 1.3401,   CHF: 1.1200,   CAD: 0.7300,
  AUD: 0.6960,   NZD: 0.6000,   JPY: 0.0067,   CNY: 0.1400,   HKD: 0.1280,
  SGD: 0.7770,   MYR: 0.2360,   THB: 0.0301,   IDR: 0.0000553, PHP: 0.0170,
  VND: 0.00004,  KRW: 0.00072,  TWD: 0.0310,   INR: 0.011765, LKR: 0.0033,
  NPR: 0.007353, PKR: 0.0036,   BDT: 0.0084,   AED: 0.27225,  SAR: 0.2666,
  QAR: 0.2747,   KWD: 3.2600,   BHD: 2.6500,   OMR: 2.6000,   JOD: 1.4100,
  ILS: 0.2700,   TRY: 0.0290,   EGP: 0.0203,   MAD: 0.1000,   ZAR: 0.0550,
  KES: 0.0077,   NGN: 0.00065,  MUR: 0.0220,   NOK: 0.1016,   SEK: 0.0950,
  DKK: 0.1530,   PLN: 0.2500,   CZK: 0.0430,   HUF: 0.0028,   RON: 0.2300,
  BGN: 0.5850,   HRK: 0.1520,   RSD: 0.0098,   ISK: 0.0073,   RUB: 0.0125,
  UAH: 0.0240,   KZT: 0.0019,   GEL: 0.3700,   MXN: 0.0575,   BRL: 0.1800,
  ARS: 0.00095,  CLP: 0.00105,  COP: 0.00025,  PEN: 0.2700,   UYU: 0.0250,
  CRC: 0.0020,   DOP: 0.0165,   JMD: 0.0064,   MVR: 0.0649,   FJD: 0.4400,
  XOF: 0.00175,  XAF: 0.00175,  TND: 0.3200,   DZD: 0.0075,   AZN: 0.5900,
  BND: 0.7770,   MOP: 0.1244,   KHR: 0.00025,  LAK: 0.000046, MMK: 0.00048,
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

const GRN_OUTCOME = {
  OK: 'ok',
  REJECTED: 'rejected',
  UNKNOWN: 'unknown',
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
  } catch { }
}

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
    if (text) { try { parsed = JSON.parse(text); } catch { parsed = null; } }
  } catch (err) {
    networkError = String(err.message || err);
  }
  const durationMs = Date.now() - started;
  const outcome = classifyGrnOutcome({ httpStatus, body: parsed, networkError });
  const errorCode = parsed ? String(parsed.error_code ?? parsed.errorCode ?? '') || null : null;
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

const GRN_ERROR_MEANINGS = {
  '2002': 'Invalid booking reference', '2003': 'Booking has already been cancelled',
  '2004': 'Rate is sold out', '2005': 'Price has increased',
  '2006': 'Needs confirmation from supplier', '2008': 'Rate no longer available / search expired',
  '2104': 'Try again', '1505': 'Insufficient credit limit', '1513': 'TW issue at supplier',
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
  if (errorCode) return `${errorCode}`;
  const msg = body?.error || body?.message || body?.detail;
  if (msg) return String(msg).slice(0, 300);
  if (text) return String(text).slice(0, 300);
  return 'no detail returned';
}

const norm = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');

function parseGrnDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const iso = s.replace(' ', 'T');
  const d = new Date(`${iso}+05:30`);
  return isNaN(d.getTime()) ? null : d;
}
function grnDateMs(v) {
  const d = parseGrnDate(v);
  return d ? d.getTime() : null;
}

function rateRoomCode(rate) { return rate?.room_code || null; }
function rateRoomType(rate) { return rate?.rooms?.[0]?.room_type || rate?.rooms?.[0]?.description || rate?.room_type || null; }
function rateRoomDescription(rate) { return rate?.rooms?.[0]?.description || null; }
function rateBoard(rate) {
  if (Array.isArray(rate?.boarding_details) && rate.boarding_details.length) return rate.boarding_details.join(', ');
  return rate?.rate_comments?.mealplan || null;
}
function rateNonRefundable(rate) { return typeof rate?.non_refundable === 'boolean' ? rate.non_refundable : null; }
function rateCancelBy(rate) { return rate?.cancellation_policy?.cancel_by_date || null; }

function policyIsEqualOrBetter(origNonRef, liveNonRef, origCancelBy, liveCancelBy) {
  if (liveNonRef === null) return false;
  if (origNonRef === false) {
    if (liveNonRef !== false) return false;
    const o = grnDateMs(origCancelBy);
    const l = grnDateMs(liveCancelBy);
    if (o != null && l != null && l < o) return false;
    return true;
  }
  return true;
}

const REBOOK_PROHIBITION_PATTERNS = [
  /cancell?ed\s+and\s+re-?\s?book(ed|ing)?[^.]{0,80}(reject|void|cancel|not\s+honou?r)/i,
  /re-?\s?book(ing|ed|ings)?[^.]{0,40}(will\s+be\s+rejected|not\s+permitted|not\s+allowed|prohibited)/i,
  /no\s+re-?\s?book(ing|ings)?\s+(permitted|allowed)/i,
];

function rateForbidsRebooking(rate) {
  const text = [
    rate?.rate_comments?.remarks, rate?.rate_comments?.pax_comments,
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

function occupancyMatches(orig, live) {
  if (!orig || !live) return false;
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
  if (a.length && b.length) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return true;
}

function rateOccupancy(rate) {
  const r = rate?.rooms?.[0] || {};
  return { adults: r.no_of_adults ?? null, children: r.no_of_children ?? 0, childAges: r.children_ages || [], maxOccupancy: r.max_room_occupancy || null };
}

function roomNamesMatchExactly(orig, rate) {
  const cmp = (a, b) => { if (!a || !b) return false; return String(a).trim().toLowerCase() === String(b).trim().toLowerCase(); };
  const liveDesc = rateRoomDescription(rate);
  const liveType = rate?.rooms?.[0]?.room_type || rate?.room_type || null;
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
    blockers.push(`Different room — this rate is "${liveName}".`);
  }
  if (!boardMatch) blockers.push(`Different board — booked "${orig.board || 'unknown'}", this rate is "${liveBoard || 'unknown'}".`);
  if (!policyMatch) {
    if (liveNonRef === null) blockers.push('This rate does not state its cancellation terms.');
    else if (orig.nonRefundable === false && liveNonRef === true) blockers.push('Original is refundable, this rate is non-refundable — worse terms for the guest.');
    else {
      const o = grnDateMs(orig.cancelBy);
      const l = grnDateMs(liveCancelBy);
      if (o != null && l != null) {
        const hrs = Math.round((o - l) / 3600000);
        blockers.push(hrs >= 24 ? `Shorter cancellation window — ${Math.round(hrs / 24)} day(s) less than the original.` : `Shorter cancellation window — ${hrs} hour(s) less than the original.`);
      } else { blockers.push('Cancellation terms are worse than the original.'); }
    }
  }
  if (!occMatch) blockers.push('Guest numbers or child ages differ from the original booking.');
  const warnings = [];
  if (prohibition.forbidden) warnings.push(`Supplier rate conditions mention rebooking: "${prohibition.evidence}"`);
  return {
    eligible: roomMatch && boardMatch && policyMatch && occMatch,
    roomMatch, codeMatch, boardMatch, policyMatch, occMatch,
    forbidsRebooking: prohibition.forbidden, prohibitionEvidence: prohibition.evidence,
    liveRoomCode, liveBoard, liveNonRef, liveCancelBy, blockers, warnings,
  };
}

const GRN_PAGE_SIZE = 100;
const GRN_WINDOW_DAYS = 30;
const PAUSE_BETWEEN_CALLS_MS = 400;
const MAX_CALLS_PER_RUN = 120;
const UPSERT_BATCH = 100;
const DEFAULT_INCREMENTAL_DAYS = 2;
let syncRunning = false;

function fmtGrn(d) { return d.toISOString().slice(0, 19).replace('T', ' '); }
const parseTs = (v) => { if (!v) return null; const d = new Date(String(v).replace(' ', 'T')); return isNaN(d.getTime()) ? null : d.toISOString(); };
const parseDate = (v) => { const iso = parseTs(v); return iso ? iso.slice(0, 10) : null; };

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
  return { priceTotal: anyPrice ? priceSum : (booking.price?.total ? parseFloat(booking.price.total) : null), status, cancelByDate: earliestCancelBy, roomCount: items.length, sampleNonRefundable: typeof items[0]?.non_refundable === 'boolean' ? items[0].non_refundable : null };
}

function toRow(booking, cityName) {
  const roll = rollUpBooking(booking);
  const item0 = booking.hotel?.booking_items?.[0];
  const room0 = item0?.rooms?.[0];
  let guestName = null;
  if (booking.holder) guestName = `${booking.holder.name || ''} ${booking.holder.surname || ''}`.trim() || null;
  if (!guestName && booking.hotel?.paxes?.[0]) { const p = booking.hotel.paxes[0]; guestName = `${p.name || ''} ${p.surname || ''}`.trim() || null; }
  const checkinDate = parseDate(booking.checkin);
  return {
    booking_id: booking.booking_id, booking_reference: booking.booking_reference || null,
    supplier_reference: booking.supplier_reference || null, booking_date: parseTs(booking.booking_date),
    grn_updated_at: parseTs(booking.updated_at), checkin: checkinDate, checkin_date: checkinDate,
    checkout: parseDate(booking.checkout), hotel_name: booking.hotel?.name || booking.hotel?.hotel_confirmation_number || null,
    hotel_code: booking.hotel?.hotel_code ? String(booking.hotel.hotel_code) : null,
    city_code: booking.hotel?.city_code || null, city_name: cityName,
    country_code: booking.hotel?.country_code || null, room_type: room0?.room_type || room0?.description || null,
    room_count: roll.roomCount, guest_name: guestName, board_basis: item0?.boarding_details?.join(', ') || null,
    price_total: roll.priceTotal, currency: booking.currency || item0?.currency || null,
    supplier_code: booking.supplier_code || null, cancel_by_date: roll.cancelByDate,
    raw_booking_status: booking.booking_status ?? null, raw_non_refundable: roll.sampleNonRefundable,
    status: roll.status, raw: booking, synced_at: new Date().toISOString(),
  };
}

async function setSyncState(patch) { try { await sbPatch('grn_sync_state', 'id=eq.1', patch); } catch { } }
async function getSyncState() { const { rows } = await sbSelect('grn_sync_state', 'id=eq.1&select=*'); return rows[0] || null; }
const fmtDay = (d) => d.toISOString().slice(0, 10);

async function syncWindow(windowStart, windowEnd, callBudget, onProgress) {
  let callsUsed = 0, rowsLanded = 0, fromRef = null;
  for (;;) {
    if (callsUsed >= callBudget) break;
    let url = `${GRN_API_BASE_URL}/hotels/bookings?filter_type=booking_date&start=${fmtDay(windowStart)}&end=${fmtDay(windowEnd)}&count=${GRN_PAGE_SIZE}`;
    if (fromRef) url += `&from=${encodeURIComponent(fromRef)}&direction=next`;
    const resp = await fetch(url, { headers: GRN_HEADERS() });
    callsUsed++;
    if (!resp.ok) throw new Error(`GRN /hotels/bookings returned HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error || data.error_code) throw new Error(`GRN error: ${JSON.stringify(data).slice(0, 200)}`);
    const bookings = data.bookings || [];
    if (bookings.length === 0) break;
    const rows = [];
    for (const b of bookings) {
      if (!b.booking_id) continue;
      const cityName = await getCityName(b.hotel?.city_code);
      rows.push(toRow(b, cityName));
    }
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) await sbUpsert('grn_bookings', rows.slice(i, i + UPSERT_BATCH), 'booking_id');
    rowsLanded += rows.length;
    if (onProgress) await onProgress(rowsLanded);
    fromRef = bookings[bookings.length - 1].booking_reference;
    if (bookings.length < GRN_PAGE_SIZE || !fromRef) break;
    await sleep(PAUSE_BETWEEN_CALLS_MS);
  }
  return { rows: rowsLanded, calls: callsUsed };
}

// ---------------------------------------------------------------------------
// EMERGENCY MINIMAL ENDING (2026-07-31)
// The full file was truncated mid-runSync by a paste, which crashed the server
// with "SyntaxError: Unexpected end of input". This restores a VALID, bootable
// file: the sync engine works; the repricing/rebooking routes are being
// restored separately from the last good GitHub commit. Nothing here is
// destructive — it only brings the server back online.
// ---------------------------------------------------------------------------

async function runSync({ fromISO, toISO, mode }) {
  syncRunning = true;
  let total = 0, callsUsed = 0;
  try {
    let windowFrom, windowTo;
    if (mode === 'range' && fromISO) { windowFrom = new Date(fromISO); windowTo = toISO ? new Date(toISO) : new Date(); }
    else { windowTo = new Date(); windowFrom = new Date(windowTo); windowFrom.setDate(windowFrom.getDate() - DEFAULT_INCREMENTAL_DAYS); }
    await setSyncState({ last_run_status: 'running', last_run_at: new Date().toISOString(), last_run_error: null, progress: `Starting ${mode || 'incremental'} sync from ${fmtDay(windowFrom)}` });
    let cursor = new Date(windowFrom);
    while (cursor < windowTo) {
      if (callsUsed >= MAX_CALLS_PER_RUN) { await setSyncState({ progress: `Paused at call budget (${MAX_CALLS_PER_RUN}). ${total} synced.`, watermark: cursor.toISOString(), bookings_synced: total }); break; }
      const winEnd = new Date(cursor); winEnd.setDate(winEnd.getDate() + GRN_WINDOW_DAYS);
      const cappedEnd = winEnd > windowTo ? windowTo : winEnd;
      const remainingBudget = MAX_CALLS_PER_RUN - callsUsed;
      const result = await syncWindow(cursor, cappedEnd, remainingBudget, async (n) => { await setSyncState({ progress: `Syncing ${fmtDay(cursor)}-${fmtDay(cappedEnd)} · ${total + n} bookings so far`, bookings_synced: total + n }); });
      total += result.rows; callsUsed += result.calls; cursor = cappedEnd;
      await setSyncState({ watermark: cursor.toISOString(), bookings_synced: total });
      await sleep(PAUSE_BETWEEN_CALLS_MS);
    }
    await setSyncState({ last_run_status: 'idle', progress: `Done - ${total} bookings synced through ${fmtDay(windowTo)} (${callsUsed} GRN calls)`, bookings_synced: total, watermark: windowTo.toISOString() });
  } catch (err) {
    await setSyncState({ last_run_status: 'error', last_run_error: String(err.message || err), progress: `Failed after ${total} bookings (${callsUsed} GRN calls)` });
  } finally { syncRunning = false; }
}

function checkSecret(req, res) {
  if (!SYNC_SECRET) return true;
  if (req.query.secret !== SYNC_SECRET) { res.status(401).json({ error: 'Wrong or missing ?secret=' }); return false; }
  return true;
}

router.get('/sync-run', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  if (syncRunning) return res.json({ started: false, message: 'A sync is already running.' });
  const mode = req.query.mode === 'range' ? 'range' : 'incremental';
  const fromISO = req.query.from ? `${req.query.from}T00:00:00Z` : null;
  const toISO = req.query.to ? `${req.query.to}T23:59:59Z` : null;
  runSync({ fromISO, toISO, mode });
  res.json({ started: true, mode, message: 'Sync started. Poll /sync-status to watch it.' });
});

router.get('/sync-status', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try { const state = await getSyncState(); const rowsInTable = await sbCount('grn_bookings', 'booking_id=not.is.null'); res.json({ running: syncRunning, rowsInTable, state }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
