// ============================================================================
// repricing.js  —  REPRICING  (candidate list + live price check)
// ----------------------------------------------------------------------------
// Two jobs:
//   1. /repricing/candidates  — list the bookings worth checking (refundable,
//      window still open), newest-closing first, with search + filters.
//      READ-ONLY from grn_bookings. Low risk.
//   2. /repricing/check       — for ONE booking, ask GRN's live availability
//      for the same hotel/dates/pax and compare the cheapest refundable rate
//      to what was paid. Touches LIVE price data. Every GRN call is logged.
//      This does NOT book anything — it only reads and compares.
//
// SAFETY (QA):
//   - /check is one booking per call — never a bulk hammer on GRN.
//   - The chosen replacement rate is always the cheapest REFUNDABLE rate of a
//     matching room; we never surface a non-refundable "saving" that would
//     strip the client's protection.
//   - Every GRN call is written to grn_api_log via grnCall.
//   - The result is persisted to grn_price_checks so the dashboard/rebooking
//     can use it, but a persistence failure never breaks the response.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  GRN_API_BASE_URL, GRN_CUTOFF_TIME, grnConfigured, sbConfigured,
  grnGetJson, grnCall, GRN_OUTCOME, describeGrnError,
  sbSelect, sbInsertReturning, toUsdOrNull, norm, parseGrnDate,
} = require('./lib-grn');

// ============================================================================
// 1) CANDIDATES  — which bookings are worth checking, right now
// ============================================================================
router.get('/repricing/candidates', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 25));
    const offset = (page - 1) * perPage;
    const search = (req.query.search || '').trim();
    const deadline = (req.query.deadline || 'any').trim(); // 3d | 1w | 1m | 1y | any

    // Base filter: refundable-ish, not cancelled, window still open (future).
    const nowIso = new Date().toISOString();
    let filter =
      `status=in.(Refundable,Partial)` +
      `&cancel_by_date=gte.${nowIso}`;

    // Deadline window (upper bound on cancel_by_date).
    const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
    if (deadline === '3d') filter += `&cancel_by_date=lte.${addDays(3)}`;
    else if (deadline === '1w') filter += `&cancel_by_date=lte.${addDays(7)}`;
    else if (deadline === '1m') filter += `&cancel_by_date=lte.${addDays(30)}`;
    else if (deadline === '1y') filter += `&cancel_by_date=lte.${addDays(365)}`;

    // Text search across hotel/city/guest/booking id.
    if (search) {
      const s = encodeURIComponent(`*${search}*`);
      filter += `&or=(hotel_name.ilike.${s},city_name.ilike.${s},guest_name.ilike.${s},booking_id.ilike.${s})`;
    }

    const cols = 'booking_id,booking_reference,hotel_name,hotel_code,city_name,country_code,checkin,checkout,room_type,room_count,guest_name,price_total,currency,cancel_by_date,status';
    const { rows, total } = await sbSelect(
      'grn_bookings',
      `${filter}&select=${cols}&order=cancel_by_date.asc&limit=${perPage}&offset=${offset}`,
      { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': `${offset}-${offset + perPage - 1}` }
    );

    // Attach USD value + days-left for the UI.
    const now = Date.now();
    const items = rows.map((b) => {
      const cb = b.cancel_by_date ? parseGrnDate(b.cancel_by_date) : null;
      const daysLeft = cb ? Math.max(0, Math.round((cb.getTime() - now) / 86400000)) : null;
      return { ...b, priceUsd: toUsdOrNull(b.price_total, b.currency), daysLeft };
    });

    res.json({ page, perPage, total: total ?? items.length, items });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ============================================================================
// 2) PRICE CHECK — live GRN availability for ONE booking, compare to paid
// ============================================================================

// Pull the full original booking (pax, nationality, room names, paid price).
async function pullBookingDetail(bookingId, ctx) {
  const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`;
  const r = await grnCall({ step: 'bookingdetail', method: 'GET', url, ctx });
  if (r.outcome !== GRN_OUTCOME.OK || !r.body?.booking) {
    throw new Error(`Could not pull booking ${bookingId}: ${describeGrnError(r.errorCode, r.body, r.text)}`);
  }
  return r.body.booking;
}

// Build the availability search body from the original booking.
function buildSearchBody(booking) {
  const item0 = booking.hotel?.booking_items?.[0];
  const rooms = (booking.hotel?.booking_items || []).map((it) => {
    const room = it.rooms?.[0] || {};
    const adults = Number(room.adults ?? room.no_of_adults ?? 2) || 2;
    const childrenAges = Array.isArray(room.children_ages) ? room.children_ages
      : (Array.isArray(room.child_ages) ? room.child_ages : []);
    return { adults, children_ages: childrenAges };
  });
  return {
    version: '2.0',
    checkin: String(booking.checkin).slice(0, 10),
    checkout: String(booking.checkout).slice(0, 10),
    client_nationality: booking.holder?.client_nationality || booking.client_nationality || item0?.client_nationality || 'AE',
    currency: booking.currency || 'USD',
    cutoff_time: GRN_CUTOFF_TIME,
    hotel_codes: [String(booking.hotel?.hotel_code)],
    hotel_info: false,
    rates: 'comprehensive',
    rooms: rooms.length ? rooms : [{ adults: 2, children_ages: [] }],
  };
}

// From a GRN availability response, pick the cheapest REFUNDABLE rate whose
// room reasonably matches the original room. Never returns a non-refundable
// rate as the "better" option.
function pickBestRefundableRate(availability, originalRoomName) {
  const hotels = availability?.hotels || availability?.results || [];
  const hotel = hotels[0];
  if (!hotel) return null;
  const rates = [];
  const rooms = hotel.rooms || hotel.rates || [];
  for (const r of rooms) {
    const list = r.rates || [r];
    for (const rate of list) {
      const price = parseFloat(rate.price ?? rate.total ?? rate.net);
      if (isNaN(price)) continue;
      const nonRef = rate.non_refundable === true;
      rates.push({
        price,
        nonRefundable: nonRef,
        roomName: rate.description || rate.room_type || r.description || r.room_type || '',
        groupCode: rate.group_code || r.group_code || null,
        rateKey: rate.rate_key || null,
        roomCode: rate.room_code || r.room_code || null,
        currency: rate.currency || availability?.currency || null,
        cancellationPolicy: rate.cancellation_policy || null,
      });
    }
  }
  const refundable = rates.filter((r) => !r.nonRefundable);
  if (refundable.length === 0) return null;
  // Prefer a matching room name; otherwise cheapest refundable overall.
  const wantName = norm(originalRoomName);
  const matching = wantName ? refundable.filter((r) => norm(r.roomName) === wantName) : [];
  const pool = matching.length ? matching : refundable;
  pool.sort((a, b) => a.price - b.price);
  return pool[0];
}

// Persist the check (best-effort; never breaks the response).
async function savePriceCheck(row) {
  try { await sbInsertReturning('grn_price_checks', row); } catch { /* non-fatal */ }
}

router.post('/repricing/check', async (req, res) => {
  if (!grnConfigured()) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  const bookingId = (req.body && req.body.booking_id) || req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });

  const ctx = { bookingId, actorEmail: (req.body && req.body.actor_email) || null };

  try {
    // 1) Pull the original booking.
    const booking = await pullBookingDetail(bookingId, ctx);
    const paidPrice = parseFloat(
      booking.hotel?.booking_items?.reduce((s, it) => s + (parseFloat(it.price) || 0), 0)
      ?? booking.price?.total
    );
    const currency = booking.currency || booking.hotel?.booking_items?.[0]?.currency || null;
    const originalRoomName = booking.hotel?.booking_items?.[0]?.rooms?.[0]?.room_type
      || booking.hotel?.booking_items?.[0]?.rooms?.[0]?.description || '';

    // 2) Live availability search (logged).
    const searchBody = buildSearchBody(booking);
    const searchUrl = `${GRN_API_BASE_URL}/hotels/availability`;
    const searchResp = await grnCall({ step: 'availability', method: 'POST', url: searchUrl, body: searchBody, ctx });
    if (searchResp.outcome !== GRN_OUTCOME.OK) {
      return res.status(502).json({
        error: `Live search failed: ${describeGrnError(searchResp.errorCode, searchResp.body, searchResp.text)}`,
        outcome: searchResp.outcome,
      });
    }

    // 3) Pick the best refundable replacement rate.
    const best = pickBestRefundableRate(searchResp.body, originalRoomName);
    const searchId = searchResp.body?.search_id || null;

    if (!best) {
      const result = {
        booking_id: bookingId, checked_at: new Date().toISOString(),
        paid_price: isNaN(paidPrice) ? null : paidPrice, currency,
        new_price: null, dropped: false, gap: null, gap_usd: null,
        message: 'No refundable rate available to compare.',
        _search_id: searchId,
      };
      await savePriceCheck(result);
      return res.json(result);
    }

    const gap = (!isNaN(paidPrice) && best.price != null) ? (paidPrice - best.price) : null;
    const dropped = gap != null && gap > 0;
    const gapUsd = (gap != null) ? toUsdOrNull(gap, currency) : null;

    const result = {
      booking_id: bookingId, checked_at: new Date().toISOString(),
      paid_price: isNaN(paidPrice) ? null : paidPrice, currency,
      new_price: best.price, new_currency: best.currency || currency,
      dropped, gap, gap_usd: gapUsd,
      new_room_name: best.roomName,
      // Tokens needed later by the rebooking step (per-search; used within the flow).
      _search_id: searchId, group_code: best.groupCode, rate_key: best.rateKey, room_code: best.roomCode,
      message: dropped
        ? `Cheaper refundable rate found: save ${gap.toFixed(2)} ${currency}.`
        : 'No cheaper refundable rate right now.',
    };
    await savePriceCheck(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = router;
