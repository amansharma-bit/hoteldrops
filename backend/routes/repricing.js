// ============================================================================
// repricing.js  —  REPRICING  (candidates + live price check + searches)
// ----------------------------------------------------------------------------
// Built against the REAL GRN availability structure confirmed from Mize logs
// + GRN API docs (see findings/GRN_REAL_STRUCTURE.md). Key truths:
//   • availability.hotels[0].rates[] is a FLAT array of rate objects.
//   • room name = rate.rooms[0].description ; price = rate.price (number)
//   • board = rate.rate_comments.mealplan (fallback boarding_details[0])
//   • refundable = rate.non_refundable === false
//   • cancelBy = rate.cancellation_policy.cancel_by_date
//   • search request must use the booking's REAL occupancy (adults + child ages
//     per room) and the booking's OWN currency + nationality.
//   • COMPARE in native currency (exact). USD is DISPLAY/reporting only —
//     every price is shown in both native and USD.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  GRN_API_BASE_URL, GRN_CUTOFF_TIME, grnConfigured, sbConfigured,
  grnCall, GRN_OUTCOME, describeGrnError,
  sbSelect, sbCount, sbInsertReturning, toUsdOrNull, norm,
} = require('./lib-grn');

// ─── helpers ────────────────────────────────────────────────────────────────
function nightsBetween(checkin, checkout) {
  const a = checkin ? new Date(checkin) : null;
  const b = checkout ? new Date(checkout) : null;
  if (!a || !b || isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

// Days from now until a cancel_by_date (IST-agnostic; GRN gives ISO local).
function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

// ── Fuzzy room/board matching (the real GRN room-mapping problem) ────────────
// Same physical room appears as "STANDARD SUITE DOUBLE", "STANDARD SUITE DOUBLE (STDD)",
// "Standard Suite Double (Stdd)", "Standard suite double - STDD", etc. Strip the
// parenthetical/appended supplier code and compare the core name.
function roomKey(name) {
  if (!name) return '';
  let s = String(name).toLowerCase();
  s = s.replace(/\([^)]*\)/g, ' ');          // drop "(stdd)" etc.
  s = s.replace(/\s-\s[a-z0-9]{2,6}\b/g, ' '); // drop " - STDD" trailing codes
  s = s.replace(/\b(stdd|stdk|stsk|famd|famk|clbk|clbd|stfk)\b/g, ' '); // known codes
  s = s.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  return s;
}
function roomMatch(a, b) {
  const ka = roomKey(a), kb = roomKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // one being a prefix of the other covers "double" vs "double 2 double beds" variants
  return ka.startsWith(kb) || kb.startsWith(ka);
}

// Board: "All Inclusion", "All Inclusive", "All-inclusive (food/beverages/snacks)",
// "ALL INCLUSIVE" → all the same basis. Normalize to a canonical token.
function boardKey(board) {
  if (!board) return '';
  const s = String(board).toLowerCase().replace(/[^a-z]+/g, ' ').trim();
  if (/all\s*inclusi|all\s*meal/.test(s)) return 'ai';
  if (/full\s*board/.test(s)) return 'fb';
  if (/half\s*board/.test(s)) return 'hb';
  if (/breakfast|bed\s*and\s*breakfast|\bbb\b/.test(s)) return 'bb';
  if (/room\s*only|\bro\b|no\s*meal/.test(s)) return 'ro';
  return s;
}
function boardMatch(a, b) {
  const ka = boardKey(a), kb = boardKey(b);
  if (!ka || !kb) return true;   // unknown board on either side → don't block
  return ka === kb;
}

// Canonical board bucket for UI filtering (ai/fb/hb/bb/ro or '' unknown).
function boardBucket(board) { return boardKey(board); }

function moneyPair(nativeAmount, currency) {
  // Returns { native, currency, usd } — native truth + USD for display.
  if (nativeAmount == null) return { native: null, currency: currency || null, usd: null };
  return {
    native: Number(nativeAmount),
    currency: currency || null,
    usd: toUsdOrNull(nativeAmount, currency),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1) CANDIDATES  — bookings worth checking (feeds the Repricing table + cards)
// ════════════════════════════════════════════════════════════════════════════
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
      r.viewed = true;
      const gapNative = (c.paid_price != null && c.new_price != null)
        ? Number(c.paid_price) - Number(c.new_price) : (c.gap != null ? Number(c.gap) : null);
      r.lastCheck = {
        liveUsd: toUsdOrNull(c.new_price, c.currency),
        liveNative: c.new_price != null ? Number(c.new_price) : null,
        gapUsd: c.gap_usd != null ? Number(c.gap_usd) : toUsdOrNull(gapNative, c.currency),
        gapNative,
        gapPct: (c.paid_price && gapNative != null) ? Math.round((gapNative / Number(c.paid_price)) * 100) : null,
        dropped: c.dropped === true,
        checkedAt: c.checked_at,
        currency: c.currency || null,
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

router.get('/repricing/candidates', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 25));
    const offset = (page - 1) * perPage;
    const search = (req.query.q || req.query.search || '').trim();
    const deadline = (req.query.deadline || 'any').trim();
    const price = (req.query.price || '').trim();
    const boardWanted = (req.query.board || 'any').trim().toLowerCase();
    const viewedWanted = (req.query.viewed || 'any').trim().toLowerCase();

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

    const cols = 'booking_id,booking_reference,hotel_name,hotel_code,city_name,country_code,checkin,checkout,room_type,room_count,guest_name,board_basis,price_total,currency,supplier_code,cancel_by_date,status';
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
      roomCount: b.room_count != null ? Number(b.room_count) : null,
      guestName: b.guest_name || null,
      board: b.board_basis || null,
      supplier: b.supplier_code || null,
      guests: [],
      // native truth + USD display
      origNative: b.price_total != null ? Number(b.price_total) : null,
      origUsd: toUsdOrNull(b.price_total, b.currency),
      currency: b.currency,
      cancelByDate: b.cancel_by_date,
      daysToCancel: daysUntil(b.cancel_by_date),   // ← fixes "REBOOK BY — left"
      status: b.status,
      viewed: false,        // set by attachLastChecks if a check exists
      lastCheck: null,
    }));

    if (price && price.includes('-')) {
      // price filter is on USD (dashboard reference scale)
      const [lo, hi] = price.split('-').map(Number);
      rows = rows.filter((r) => r.origUsd != null && r.origUsd >= (lo || 0) && r.origUsd <= (hi || Infinity));
    }

    if (boardWanted && boardWanted !== 'any') {
      rows = rows.filter((r) => boardKey(r.board) === boardWanted);
    }

    await attachLastChecks(rows);
    if (viewedWanted === 'viewed') rows = rows.filter((r) => r.viewed);
    else if (viewedWanted === 'not') rows = rows.filter((r) => !r.viewed);
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

// ════════════════════════════════════════════════════════════════════════════
// 2) PRICE CHECK  — live GRN availability for one booking
// ════════════════════════════════════════════════════════════════════════════
async function pullBookingDetail(bookingId, ctx) {
  const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`;
  const r = await grnCall({ step: 'bookingdetail', method: 'GET', url, ctx });
  if (r.outcome !== GRN_OUTCOME.OK || !r.body?.booking) {
    throw new Error(`Could not pull booking ${bookingId}: ${describeGrnError(r.errorCode, r.body, r.text)}`);
  }
  return r.body.booking;
}

// Reconstruct the ORIGINAL occupancy (adults + child ages per room) + currency
// + nationality + room/board/supplier/guests from the booking detail.
function parseOriginalBooking(booking) {
  const items = booking.hotel?.booking_items || [];
  const paxes = booking.hotel?.paxes || booking.paxes || [];

  // Build child ages lookup from paxes (type CH carry an age).
  const childAgeByPax = {};
  for (const p of paxes) {
    if ((p.type === 'CH' || p.type === 'CHILD') && p.age != null) childAgeByPax[p.pax_id] = Number(p.age);
  }

  // One "room" object per booking room, with adults + children_ages.
  const rooms = [];
  for (const it of items) {
    for (const rm of (it.rooms || [])) {
      const adults = Number(rm.no_of_adults ?? 2) || 2;
      let childAges = [];
      if (Array.isArray(rm.children_ages) && rm.children_ages.length) {
        childAges = rm.children_ages.map(Number).filter((n) => !isNaN(n));
      } else if (Array.isArray(rm.pax_ids)) {
        childAges = rm.pax_ids.map((pid) => childAgeByPax[pid]).filter((a) => a != null);
      }
      rooms.push({ adults, children_ages: childAges });
    }
  }
  if (!rooms.length) rooms.push({ adults: 2, children_ages: [] });

  const item0 = items[0] || {};
  const room0 = item0.rooms?.[0] || {};
  const cp = item0.cancellation_policy || {};
  const currency = item0.currency || booking.currency || null;
  const nationality = booking.nationality || booking.holder?.client_nationality || item0.client_nationality || 'AE';
  const paidNative = items.reduce((s, it) => s + (parseFloat(it.price) || 0), 0)
    || parseFloat(booking.price?.total) || null;

  // Guest list for the drawer (include child age where applicable).
  const guests = paxes.map((p) => ({
    name: [p.title, p.name, p.surname].filter(Boolean).join(' ').trim(),
    type: p.type,
    age: (p.type === 'CH' || p.type === 'CHILD') && p.age != null ? Number(p.age) : null,
  })).filter((g) => g.name);

  const adults = guests.filter((g) => g.type === 'AD' || g.type === 'ADULT');
  const children = guests.filter((g) => g.type === 'CH' || g.type === 'CHILD');

  const roomCount = items.reduce((s, it) => s + (it.rooms ? it.rooms.length : 0), 0) || rooms.length;
  const terms = item0.rate_comments?.remarks || item0.rate_comments?.comments || null;

  // Detailed cancellation fee schedule (tiers).
  const cancellationDetails = (cp.details || []).map((d) => ({
    from: d.from || null,
    flatFee: d.flat_fee != null ? Number(d.flat_fee) : null,
    currency: d.currency || currency,
  }));

  return {
    rooms,                       // → search request occupancy
    currency, nationality,       // → search request
    paidNative,
    bookingDate: booking.booking_date || booking.created_at || null,
    hotelName: booking.hotel?.name || null,
    address: booking.hotel?.address || null,
    roomCount,
    roomName: room0.description || room0.room_type || null,
    board: (item0.boarding_details || []).join(', ') || item0.rate_comments?.mealplan || null,
    nonRefundable: typeof item0.non_refundable === 'boolean' ? item0.non_refundable : null,
    cancelBy: cp.cancel_by_date || null,
    cancellationDetails,
    supplier: booking.supplier_code || item0.supplier_code || null,
    supplierRef: booking.supplier_reference || item0.supplier_reference || null,
    terms,
    guests, adults, children,
    checkin: booking.checkin || null,
    checkout: booking.checkout || null,
    hotelCode: booking.hotel?.hotel_code || null,
    cityCode: booking.hotel?.city_code || null,
  };
}

function buildSearchBody(orig) {
  return {
    version: '2.0',
    checkin: String(orig.checkin).slice(0, 10),
    checkout: String(orig.checkout).slice(0, 10),
    client_nationality: orig.nationality || 'AE',
    currency: orig.currency || 'USD',          // ← search in ORIGINAL currency
    cutoff_time: GRN_CUTOFF_TIME,
    hotel_codes: [String(orig.hotelCode)],
    hotel_info: false,
    rates: 'comprehensive',
    rooms: orig.rooms,                          // ← EXACT occupancy (adults + child ages per room)
    options: { rate_comments: true },
  };
}

// Flatten every rate from the REAL GRN availability structure.
function extractAllRates(availability, searchCurrency) {
  const hotels = availability?.hotels || [];
  const hotel = hotels[0];
  const out = [];
  if (!hotel) return out;
  const rates = hotel.rates || [];      // ← FLAT array (the real structure)
  for (const rate of rates) {
    const priceNative = parseFloat(rate.price);
    if (isNaN(priceNative)) continue;
    const room0 = (rate.rooms && rate.rooms[0]) || {};
    const board = rate.rate_comments?.mealplan
      || (Array.isArray(rate.boarding_details) ? rate.boarding_details[0] : null)
      || null;
    const cur = rate.currency || searchCurrency;
    out.push({
      rateKey: rate.rate_key || null,
      groupCode: rate.group_code || null,
      roomCode: rate.room_code || null,
      roomReference: room0.room_reference || null,
      roomName: room0.description || room0.room_type || '',
      roomTypeRaw: room0.room_type || '',
      board,
      priceNative,
      currency: cur,
      priceUsd: toUsdOrNull(priceNative, cur),
      nonRefundable: rate.non_refundable === true,
      cancelBy: rate.cancellation_policy?.cancel_by_date || null,
      rateType: rate.rate_type || null,
      remarks: rate.rate_comments?.remarks || null,
    });
  }
  return out;
}

// Same-or-better cancellation: replacement cancel_by_date >= original's (more/equal time),
// and never non-refundable replacing a refundable original.
function cancelSameOrBetter(origCancelBy, origNonRef, rate) {
  if (rate.nonRefundable) return false;                 // never non-ref replacing ref
  if (origNonRef === true) return true;                 // original non-ref → any refundable is better
  if (!origCancelBy || !rate.cancelBy) return true;     // unknown → don't block on this leg
  const o = new Date(origCancelBy), n = new Date(rate.cancelBy);
  if (isNaN(o) || isNaN(n)) return true;
  return n >= o;                                        // later or equal free-cancel deadline = same/better
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
    const orig = parseOriginalBooking(booking);
    const nativeCur = orig.currency;
    const paidNative = orig.paidNative;
    const wantRoom = orig.roomName || '';
    const wantBoard = orig.board || '';

    // ── ORIGINAL summary (dual currency) for the drawer's Current-booking card.
    const original = {
      price: moneyPair(paidNative, nativeCur),
      usd: toUsdOrNull(paidNative, nativeCur),
      bookingDate: orig.bookingDate,
      hotel: orig.hotelName,
      address: orig.address,
      room: orig.roomName,
      roomCount: orig.roomCount,
      roomDescriptionRaw: orig.roomName,
      roomTypeRaw: orig.roomName,
      board: orig.board,
      nonRefundable: orig.nonRefundable,
      cancelBy: orig.cancelBy,
      cancellationDetails: orig.cancellationDetails,
      supplier: orig.supplier,
      supplierRef: orig.supplierRef,
      terms: orig.terms,
      guests: orig.guests,
      adults: orig.adults,
      children: orig.children,
      checkin: orig.checkin,
      checkout: orig.checkout,
      currency: nativeCur,
    };

    // ── Live search in the ORIGINAL currency.
    const searchBody = buildSearchBody(orig);
    const searchResp = await grnCall({ step: 'availability', method: 'POST', url: `${GRN_API_BASE_URL}/hotels/availability`, body: searchBody, ctx });
    if (searchResp.outcome !== GRN_OUTCOME.OK) {
      return res.status(502).json({ error: `Live search failed: ${describeGrnError(searchResp.errorCode, searchResp.body, searchResp.text)}` });
    }
    const searchId = searchResp.body?.search_id || null;
    const rawRates = extractAllRates(searchResp.body, nativeCur);

    // ── Map every rate to the drawer contract. COMPARE IN NATIVE CURRENCY.
    const allRates = rawRates.map((rt) => {
      // vsOriginal in NATIVE (exact) — positive = cheaper (saving).
      const sameCurrency = !nativeCur || !rt.currency || norm(rt.currency) === norm(nativeCur);
      const vsOriginalNative = (paidNative != null && rt.priceNative != null && sameCurrency)
        ? Math.round((paidNative - rt.priceNative) * 100) / 100 : null;
      const vsOriginalUsd = (original.usd != null && rt.priceUsd != null)
        ? Math.round(original.usd - rt.priceUsd) : null;

      const roomMatches = wantRoom ? roomMatch(rt.roomName, wantRoom) : true;
      const boardMatches = wantBoard ? boardMatch(rt.board, wantBoard) : true;
      const refundable = !rt.nonRefundable;
      const cheaper = vsOriginalNative != null && vsOriginalNative > 0;   // ← native compare
      const cxlOk = cancelSameOrBetter(orig.cancelBy, orig.nonRefundable, rt);

      const blockers = [];
      if (!roomMatches) blockers.push('Different room type');
      if (!boardMatches) blockers.push(rt.board ? `Board: ${rt.board}` : 'Different board');
      if (!refundable) blockers.push('Non-refundable');
      if (!cxlOk) blockers.push('Worse cancellation terms');
      if (!cheaper) blockers.push('Not cheaper than original');
      if (!sameCurrency) blockers.push(`Currency ${rt.currency} ≠ ${nativeCur}`);

      const isMatch = roomMatches && boardMatches;                 // exact room+board (for amber "match" badge)
      const eligible = roomMatches && boardMatches && refundable && cxlOk && cheaper && sameCurrency;
      const selectable = refundable && cheaper && sameCurrency;    // clickable only if refundable AND cheaper
                                                                    // (pricier or non-ref → greyed/unclickable)
      return {
        rateKey: rt.rateKey,
        groupCode: rt.groupCode,
        roomCode: rt.roomCode,
        roomReference: rt.roomReference,
        roomDescription: rt.roomName,
        roomDescriptionRaw: rt.roomName,
        roomType: rt.roomTypeRaw,
        board: rt.board,
        boardBucket: boardBucket(rt.board),
        // dual currency on every rate
        native: rt.priceNative,
        local: rt.priceNative,          // alias the page reads
        usd: rt.priceUsd,
        currency: rt.currency,
        vsOriginalNative,
        vsOriginalUsd,
        refundable,
        cancelBy: rt.cancelBy,
        rateType: rt.rateType,
        isMatch,
        eligible,
        selectable,
        blockers,
      };
    });   // ← keep GRN's original order (search-result order)

    const bestEligible = allRates.find((r) => r.eligible) || null;
    const dropped = Boolean(bestEligible);
    const gapNative = bestEligible ? bestEligible.vsOriginalNative : null;
    const gapUsd = bestEligible ? bestEligible.vsOriginalUsd : null;
    const gapPct = (bestEligible && paidNative) ? Math.round((bestEligible.vsOriginalNative / paidNative) * 100) : null;

    // ── LIVE (replacement) summary — the eligible pick if any, else cheapest rate (for display).
    const shownRate = bestEligible || allRates[0] || null;
    const live = shownRate ? {
      price: moneyPair(shownRate.native, shownRate.currency),
      usd: shownRate.usd,
      room: shownRate.roomDescription,
      roomDescriptionRaw: shownRate.roomDescription,
      board: shownRate.board,
      nonRefundable: !shownRate.refundable,
      cancelBy: shownRate.cancelBy,
      currency: shownRate.currency,
    } : null;

    const match = shownRate ? {
      room: wantRoom ? roomMatch(shownRate.roomDescription, wantRoom) : null,
      board: wantBoard ? boardMatch(shownRate.board, wantBoard) : null,
      terms: cancelSameOrBetter(orig.cancelBy, orig.nonRefundable, {
        nonRefundable: !shownRate.refundable, cancelBy: shownRate.cancelBy,
      }),
      dates: true,
    } : null;

    const matchBasis = bestEligible ? 'exact_room_board'
      : (shownRate && shownRate.isMatch ? 'room_name' : 'different_room');

    const checkedAt = new Date().toISOString();
    // Persist in native (paid_price/new_price native; gap_usd for dashboard).
    await savePriceCheck({
      booking_id: bookingId, checked_at: checkedAt,
      paid_price: paidNative, new_price: bestEligible ? bestEligible.native : null, currency: nativeCur,
      gap: gapNative, gap_usd: gapUsd, dropped,
    });

    res.json({
      bookingId, checkedAt,
      origUsd: original.usd, origNative: paidNative, currency: nativeCur,
      original, live, match, matchBasis,
      rebookEligible: Boolean(bestEligible),
      gapUsd, gapNative, gapPct, dropped,
      allRates,
      _search_id: searchId,
      group_code: bestEligible?.groupCode || null,
      rate_key: bestEligible?.rateKey || null,
      room_code: bestEligible?.roomCode || null,
      room_reference: bestEligible?.roomReference || null,
      message: bestEligible
        ? 'Cheaper matching refundable rate found.'
        : (allRates.length
            ? 'Live rates found — none is a cheaper same-room refundable match. Operator can still pick a rate.'
            : 'No live rates available for these dates/occupancy.'),
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 3) SEARCHES  — every price check run, with funnel stats (Searches Made page)
// ════════════════════════════════════════════════════════════════════════════
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
    } else if (gap === '500+') filter += '&gap_usd=gte.500';
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
