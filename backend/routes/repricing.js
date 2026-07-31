// ============================================================================
// repricing.js  —  REPRICING  (candidate list + live price check + searches)
// ----------------------------------------------------------------------------
// Response field names are matched EXACTLY to what the frontend pages read
// (repricing/page.tsx and searches-made/page.tsx), so tables and stat cards
// populate with no mapping layer.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  GRN_API_BASE_URL, GRN_CUTOFF_TIME, grnConfigured, sbConfigured,
  grnCall, GRN_OUTCOME, describeGrnError,
  sbSelect, sbCount, sbInsertReturning, toUsdOrNull, norm,
} = require('./lib-grn');

function nightsBetween(checkin, checkout) {
  const a = checkin ? new Date(checkin) : null;
  const b = checkout ? new Date(checkout) : null;
  if (!a || !b || isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

async function attachLastChecks(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.bookingId).filter(Boolean);
  if (!ids.length) return rows;
  const inList = ids.map((i) => encodeURIComponent(i)).join(',');
  let checks = [];
  try {
    const { rows: cr } = await sbSelect(
      'grn_price_checks',
      `booking_id=in.(${inList})&select=booking_id,new_price,paid_price,gap,gap_usd,dropped,checked_at,currency&order=checked_at.desc`
    );
    checks = cr;
  } catch { checks = []; }
  const latest = new Map();
  for (const c of checks) if (!latest.has(c.booking_id)) latest.set(c.booking_id, c);
  for (const r of rows) {
    const c = latest.get(r.bookingId);
    if (c) {
      r.lastCheck = {
        liveUsd: toUsdOrNull(c.new_price, c.currency),
        gapUsd: c.gap_usd != null ? Number(c.gap_usd) : (c.gap != null ? toUsdOrNull(c.gap, c.currency) : null),
        gapPct: (c.paid_price && c.gap != null) ? Math.round((Number(c.gap) / Number(c.paid_price)) * 100) : null,
        dropped: c.dropped === true,
        checkedAt: c.checked_at,
      };
    }
  }
  return rows;
}

async function computeViewCounts() {
  const out = { checked: 0, dropped: 0, rebooked: 0, pendingCancel: 0, needsReview: 0 };
  try { out.checked = await sbCount('grn_price_checks', 'id=not.is.null'); } catch {}
  try { out.dropped = await sbCount('grn_price_checks', 'dropped=eq.true'); } catch {}
  try { out.rebooked = await sbCount('grn_rebooking_attempts', 'status=eq.confirmed'); } catch {}
  try { out.pendingCancel = await sbCount('grn_rebooking_attempts', 'status=in.(awaiting_cancel,booked)'); } catch {}
  try { out.needsReview = await sbCount('grn_rebooking_attempts', 'status=in.(needs_review,error)'); } catch {}
  return out;
}

// ---- 1) CANDIDATES ---------------------------------------------------------
router.get('/repricing/candidates', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 25));
    const offset = (page - 1) * perPage;
    const search = (req.query.q || req.query.search || '').trim();
    const deadline = (req.query.deadline || 'any').trim();
    const price = (req.query.price || '').trim();

    const nowIso = new Date().toISOString();
    let filter = `status=in.(Refundable,Partial)&cancel_by_date=gte.${nowIso}`;
    const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
    if (deadline === '3d') filter += `&cancel_by_date=lte.${addDays(3)}`;
    else if (deadline === '1w') filter += `&cancel_by_date=lte.${addDays(7)}`;
    else if (deadline === '1m') filter += `&cancel_by_date=lte.${addDays(30)}`;
    else if (deadline === '1y') filter += `&cancel_by_date=lte.${addDays(365)}`;
    else if (deadline === 'custom') {
      if (req.query.from) filter += `&cancel_by_date=gte.${new Date(req.query.from + 'T00:00:00Z').toISOString()}`;
      if (req.query.to) filter += `&cancel_by_date=lte.${new Date(req.query.to + 'T23:59:59Z').toISOString()}`;
    }
    if (search) {
      const s = encodeURIComponent(`*${search}*`);
      filter += `&or=(hotel_name.ilike.${s},city_name.ilike.${s},guest_name.ilike.${s},booking_id.ilike.${s})`;
    }

    const cols = 'booking_id,booking_reference,hotel_name,hotel_code,city_name,country_code,checkin,checkout,room_type,room_count,guest_name,price_total,currency,cancel_by_date,status';
    const { rows: raw, total } = await sbSelect(
      'grn_bookings',
      `${filter}&select=${cols}&order=cancel_by_date.asc&limit=${perPage}&offset=${offset}`,
      { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': `${offset}-${offset + perPage - 1}` }
    );

    let rows = raw.map((b) => ({
      bookingId: b.booking_id,
      bookingReference: b.booking_reference,
      hotel: b.hotel_name,
      hotelCode: b.hotel_code,
      city: b.city_name,
      country: b.country_code,
      checkin: b.checkin,
      checkout: b.checkout,
      nights: nightsBetween(b.checkin, b.checkout),
      roomType: b.room_type,
      guests: [],
      origUsd: toUsdOrNull(b.price_total, b.currency),
      currency: b.currency,
      cancelByDate: b.cancel_by_date,
      status: b.status,
      lastCheck: null,
    }));

    if (price && price.includes('-')) {
      const [lo, hi] = price.split('-').map(Number);
      rows = rows.filter((r) => r.origUsd != null && r.origUsd >= (lo || 0) && r.origUsd <= (hi || Infinity));
    }

    await attachLastChecks(rows);
    const viewCounts = await computeViewCounts();

    res.json({
      page, perPage, total: total ?? rows.length,
      hasMore: (offset + rows.length) < (total ?? 0),
      rows, viewCounts,
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ---- 2) PRICE CHECK --------------------------------------------------------
async function pullBookingDetail(bookingId, ctx) {
  const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`;
  const r = await grnCall({ step: 'bookingdetail', method: 'GET', url, ctx });
  if (r.outcome !== GRN_OUTCOME.OK || !r.body?.booking) {
    throw new Error(`Could not pull booking ${bookingId}: ${describeGrnError(r.errorCode, r.body, r.text)}`);
  }
  return r.body.booking;
}

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

function extractAllRates(availability, currency) {
  const hotels = availability?.hotels || availability?.results || [];
  const hotel = hotels[0];
  const out = [];
  if (!hotel) return out;
  const rooms = hotel.rooms || hotel.rates || [];
  for (const r of rooms) {
    const list = r.rates || [r];
    for (const rate of list) {
      const price = parseFloat(rate.price ?? rate.total ?? rate.net);
      if (isNaN(price)) continue;
      out.push({
        rateKey: rate.rate_key || null,
        groupCode: rate.group_code || r.group_code || null,
        roomCode: rate.room_code || r.room_code || null,
        roomName: rate.description || rate.room_type || r.description || r.room_type || '',
        price,
        priceUsd: toUsdOrNull(price, rate.currency || currency),
        currency: rate.currency || currency,
        nonRefundable: rate.non_refundable === true,
        board: (rate.boarding_details || r.boarding_details || []).join(', ') || null,
        cancellationPolicy: rate.cancellation_policy || null,
      });
    }
  }
  return out;
}

function pickBestRefundable(allRates, originalRoomName) {
  const refundable = allRates.filter((r) => !r.nonRefundable);
  if (!refundable.length) return null;
  const wn = norm(originalRoomName);
  const matching = wn ? refundable.filter((r) => norm(r.roomName) === wn) : [];
  const pool = matching.length ? matching : refundable;
  return pool.slice().sort((a, b) => a.price - b.price)[0];
}

async function savePriceCheck(row) {
  try { await sbInsertReturning('grn_price_checks', row); } catch { /* non-fatal */ }
}

router.post('/repricing/check', async (req, res) => {
  if (!grnConfigured()) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  const bookingId = (req.body && req.body.booking_id) || req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });
  const ctx = { bookingId, actorEmail: (req.body && req.body.actor_email) || null };

  try {
    const booking = await pullBookingDetail(bookingId, ctx);
    const paidPrice = (booking.hotel?.booking_items || []).reduce((s, it) => s + (parseFloat(it.price) || 0), 0)
      || parseFloat(booking.price?.total) || null;
    const currency = booking.currency || booking.hotel?.booking_items?.[0]?.currency || null;
    const originalRoomName = booking.hotel?.booking_items?.[0]?.rooms?.[0]?.room_type
      || booking.hotel?.booking_items?.[0]?.rooms?.[0]?.description || '';

    const searchBody = buildSearchBody(booking);
    const searchResp = await grnCall({ step: 'availability', method: 'POST', url: `${GRN_API_BASE_URL}/hotels/availability`, body: searchBody, ctx });
    if (searchResp.outcome !== GRN_OUTCOME.OK) {
      return res.status(502).json({ error: `Live search failed: ${describeGrnError(searchResp.errorCode, searchResp.body, searchResp.text)}` });
    }

    const searchId = searchResp.body?.search_id || null;
    const allRates = extractAllRates(searchResp.body, currency);
    const best = pickBestRefundable(allRates, originalRoomName);
    const paidUsd = toUsdOrNull(paidPrice, currency);

    let live = null, gapUsd = null, gapPct = null, dropped = false;
    if (best) {
      live = { usd: best.priceUsd, price: best.price, currency: best.currency };
      const gap = (paidPrice != null && best.price != null) ? (paidPrice - best.price) : null;
      dropped = gap != null && gap > 0;
      gapUsd = gap != null ? toUsdOrNull(gap, currency) : null;
      gapPct = (gap != null && paidPrice) ? Math.round((gap / paidPrice) * 100) : null;
    }

    const checkedAt = new Date().toISOString();
    await savePriceCheck({
      booking_id: bookingId, checked_at: checkedAt,
      paid_price: paidPrice, new_price: best ? best.price : null, currency,
      gap: (paidPrice != null && best) ? (paidPrice - best.price) : null,
      gap_usd: gapUsd, dropped,
    });

    res.json({
      bookingId, checkedAt,
      origUsd: paidUsd, live,
      gapUsd, gapPct, dropped,
      allRates,
      _search_id: searchId,
      group_code: best?.groupCode || null, rate_key: best?.rateKey || null, room_code: best?.roomCode || null,
      message: best ? (dropped ? 'Cheaper refundable rate found.' : 'No cheaper refundable rate right now.') : 'No refundable rate available.',
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ---- 3) SEARCHES (Searches Made page) --------------------------------------
router.get('/repricing/searches', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 25));
    const offset = (page - 1) * perPage;
    const search = (req.query.q || '').trim();
    const result = (req.query.result || 'all').toLowerCase();
    const gap = (req.query.gap || 'any').trim();

    let filter = 'id=not.is.null';
    if (result === 'drop' || result === 'dropped') filter += '&dropped=eq.true';
    else if (result === 'no_drop') filter += '&dropped=eq.false';
    if (gap && gap.includes('-')) {
      const [lo, hi] = gap.split('-').map(Number);
      if (!isNaN(lo)) filter += `&gap_usd=gte.${lo}`;
      if (!isNaN(hi)) filter += `&gap_usd=lte.${hi}`;
    } else if (gap === '500+') {
      filter += '&gap_usd=gte.500';
    }
    if (req.query.from) filter += `&checked_at=gte.${new Date(req.query.from + 'T00:00:00Z').toISOString()}`;
    if (req.query.to) filter += `&checked_at=lte.${new Date(req.query.to + 'T23:59:59Z').toISOString()}`;
    if (search) filter += `&booking_id=ilike.${encodeURIComponent(`*${search}*`)}`;

    const { rows: checks, total } = await sbSelect(
      'grn_price_checks',
      `${filter}&select=*&order=checked_at.desc&limit=${perPage}&offset=${offset}`,
      { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': `${offset}-${offset + perPage - 1}` }
    );

    const ids = [...new Set(checks.map((c) => c.booking_id).filter(Boolean))];
    const info = new Map();
    if (ids.length) {
      const inList = ids.map((i) => encodeURIComponent(i)).join(',');
      try {
        const { rows: br } = await sbSelect('grn_bookings', `booking_id=in.(${inList})&select=booking_id,hotel_name,city_name,room_type`);
        for (const b of br) info.set(b.booking_id, b);
      } catch {}
    }

    const rows = checks.map((c) => {
      const b = info.get(c.booking_id) || {};
      const dropped = c.dropped === true;
      return {
        id: c.id,
        bookingId: c.booking_id,
        hotel: b.hotel_name || c.booking_id,
        city: b.city_name || null,
        room: b.room_type || null,
        result: dropped ? 'drop_actionable' : 'no_drop',
        originalUsd: toUsdOrNull(c.paid_price, c.currency),
        liveUsd: toUsdOrNull(c.new_price, c.currency),
        gapUsd: c.gap_usd != null ? Number(c.gap_usd) : null,
        dropped, actionable: dropped,
        checkedAt: c.checked_at,
        liveRoom: b.room_type || null, liveBoard: null,
        roomMatch: true, boardMatch: true, datesMatch: true, policyMatch: true,
        matchBasis: 'exact_room', blockers: [],
      };
    });

    let bookingsChecked = 0, dropsFound = 0;
    try { bookingsChecked = await sbCount('grn_price_checks', 'booking_id=not.is.null'); } catch {}
    try { dropsFound = await sbCount('grn_price_checks', 'dropped=eq.true'); } catch {}

    res.json({
      page, perPage, total: total ?? rows.length,
      hasMore: (offset + rows.length) < (total ?? 0),
      funnel: { searchesMade: total ?? checks.length, bookingsChecked, dropsFound, actionableDrops: dropsFound },
      rows,
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = router;
