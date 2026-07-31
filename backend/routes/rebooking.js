// ============================================================================
// rebooking.js  —  THE MONEY PATH  (search -> recheck -> rebook -> confirm ->
//                                    cancel)
// ----------------------------------------------------------------------------
// This file moves REAL reservations and REAL money. Every design choice here
// is about safety first, speed second. The chain mirrors the confirmed GRN
// production flow (verified against a real Mize rebooking log):
//
//   1. availability (search)          -> fresh rates + search_id
//   2. availability recheck           -> confirms price/policy unchanged;
//                                        flips rate to "bookable"
//   3. bookingdetail (pull source)    -> pax/holder/original price
//   4. POST /hotels/rebookings/{ORIGINAL_REF}      -> creates held replacement,
//                                        returns NEW booking_reference
//   5. POST /hotels/rebookings/confirm/{NEW_REF}   -> commits the replacement
//   6. DELETE /hotels/rebookings/{ORIGINAL_REF}    -> cancels the original
//
// NON-NEGOTIABLE SAFETY RULES (QA):
//   R1. IDEMPOTENCY: refuse to start if this booking already has an in-flight
//       or confirmed attempt. Never double-book.
//   R2. PRICE-CHANGE GATE: after recheck, if price_changed or cp_changed is
//       true, ABORT. Never commit to a price we didn't detect.
//   R3. CONFIRM-BEFORE-CANCEL: never cancel the original until the replacement
//       is CONFIRMED. If confirm fails, the original stays live, untouched.
//       Two bookings briefly existing (safe) beats zero bookings (catastrophe).
//   R4. UNKNOWN != SUCCESS: a 5xx/timeout/network error on any money call is
//       classified UNKNOWN. We stop and mark the attempt needs_review — never
//       assume it worked, never blindly proceed.
//   R5. REFERENCE ROUTING: rebook & cancel use the ORIGINAL ref; confirm uses
//       the NEW ref. Mixing these is how engines cancel the wrong booking.
//   R6. Every GRN call is logged to grn_api_log (via grnCall).
//   R7. DRY_RUN default. Live booking only happens when DRY_RUN is explicitly
//       false in the environment. Until then, the chain runs read-only up to
//       the point of mutation and reports what it WOULD do.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  GRN_API_BASE_URL, GRN_CUTOFF_TIME, grnConfigured, sbConfigured,
  grnCall, GRN_OUTCOME, describeGrnError,
  sbSelect, sbInsertReturning, sbPatch, toUsdOrNull, norm,
} = require('./lib-grn');

// Live booking is OFF unless explicitly enabled. This is the master safety switch.
const DRY_RUN = String(process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';

// ---- Attempt record helpers (grn_rebooking_attempts) -----------------------
async function findOpenAttempt(bookingId) {
  try {
    const { rows } = await sbSelect(
      'grn_rebooking_attempts',
      `booking_id=eq.${encodeURIComponent(bookingId)}&status=in.(pending,searching,rechecked,booked,awaiting_cancel,confirmed)&select=id,status&order=created_at.desc&limit=1`
    );
    return rows[0] || null;
  } catch { return null; }
}
async function createAttempt(row) {
  try { const { rows } = await sbInsertReturning('grn_rebooking_attempts', row); return rows[0] || null; }
  catch { return null; }
}
async function updateAttempt(id, patch) {
  if (!id) return;
  try { await sbPatch('grn_rebooking_attempts', `id=eq.${id}`, patch); } catch { /* non-fatal */ }
}

// ---- Small helpers ---------------------------------------------------------
function sumPaid(booking) {
  const items = booking.hotel?.booking_items || [];
  let s = 0, any = false;
  for (const it of items) { const p = parseFloat(it.price); if (!isNaN(p)) { s += p; any = true; } }
  if (any) return s;
  const t = parseFloat(booking.price?.total);
  return isNaN(t) ? null : t;
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
      rates.push({
        price, nonRefundable: rate.non_refundable === true,
        roomName: rate.description || rate.room_type || r.description || r.room_type || '',
        groupCode: rate.group_code || r.group_code || null,
        rateKey: rate.rate_key || null,
        roomCode: rate.room_code || r.room_code || null,
        currency: rate.currency || availability?.currency || null,
      });
    }
  }
  const refundable = rates.filter((r) => !r.nonRefundable);
  if (!refundable.length) return null;
  const wn = norm(originalRoomName);
  const matching = wn ? refundable.filter((r) => norm(r.roomName) === wn) : [];
  const pool = matching.length ? matching : refundable;
  pool.sort((a, b) => a.price - b.price);
  return pool[0];
}

// ============================================================================
// THE CHAIN
// ============================================================================
router.post('/repricing/book-replacement', async (req, res) => {
  if (!grnConfigured()) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });

  const bookingId = (req.body && req.body.booking_id) || req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });
  const actorEmail = (req.body && req.body.actor_email) || null;
  const ctx = { bookingId, actorEmail };

  // A single helper to end the chain with a clear, safe failure.
  const fail = (stage, message, http = 409, extra = {}) =>
    res.status(http).json({ ok: false, stage, message, ...extra });

  // ---- R1: IDEMPOTENCY ------------------------------------------------------
  const open = await findOpenAttempt(bookingId);
  if (open) {
    return fail('idempotency', `This booking already has an attempt in status "${open.status}". Refusing to start a second one.`, 409, { attemptId: open.id });
  }

  const attempt = await createAttempt({
    booking_id: bookingId, status: 'searching',
    created_at: new Date().toISOString(), actor_email: actorEmail, dry_run: DRY_RUN,
  });
  const attemptId = attempt?.id || null;
  ctx.attemptId = attemptId;

  try {
    // ---- 3 (pull source first — we need pax + original ref + paid price) ----
    const detailUrl = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`;
    const dResp = await grnCall({ step: 'bookingdetail', method: 'GET', url: detailUrl, ctx });
    if (dResp.outcome !== GRN_OUTCOME.OK || !dResp.body?.booking) {
      await updateAttempt(attemptId, { status: 'error', error: `pull source: ${describeGrnError(dResp.errorCode, dResp.body, dResp.text)}` });
      return fail('pull_source', `Could not pull the original booking: ${describeGrnError(dResp.errorCode, dResp.body, dResp.text)}`, 502);
    }
    const booking = dResp.body.booking;
    const originalRef = booking.booking_reference;
    if (!originalRef) {
      await updateAttempt(attemptId, { status: 'error', error: 'no booking_reference on source' });
      return fail('pull_source', 'Original booking has no booking_reference; cannot rebook safely.', 422);
    }
    const paidPrice = sumPaid(booking);
    const currency = booking.currency || booking.hotel?.booking_items?.[0]?.currency || null;
    const originalRoomName = booking.hotel?.booking_items?.[0]?.rooms?.[0]?.room_type
      || booking.hotel?.booking_items?.[0]?.rooms?.[0]?.description || '';

    // ---- 1 (search) ---------------------------------------------------------
    const searchBody = buildSearchBody(booking);
    const searchResp = await grnCall({ step: 'availability', method: 'POST', url: `${GRN_API_BASE_URL}/hotels/availability`, body: searchBody, ctx });
    if (searchResp.outcome !== GRN_OUTCOME.OK) {
      await updateAttempt(attemptId, { status: 'error', error: `search: ${describeGrnError(searchResp.errorCode, searchResp.body, searchResp.text)}` });
      return fail('search', `Live search failed: ${describeGrnError(searchResp.errorCode, searchResp.body, searchResp.text)}`, 502);
    }
    const searchId = searchResp.body?.search_id;
    const best = pickBestRefundableRate(searchResp.body, originalRoomName);
    if (!best) {
      await updateAttempt(attemptId, { status: 'no_rate', error: 'no refundable rate' });
      return fail('search', 'No refundable replacement rate available.', 200, { ok: false, noRate: true });
    }
    // Only proceed if it's actually cheaper.
    if (paidPrice != null && best.price != null && best.price >= paidPrice) {
      await updateAttempt(attemptId, { status: 'no_saving', error: `best ${best.price} >= paid ${paidPrice}` });
      return res.json({ ok: false, stage: 'search', noSaving: true, message: `No cheaper refundable rate (best ${best.price} vs paid ${paidPrice} ${currency}).` });
    }

    // ---- 2 (RECHECK) — the price-change gate (R2) ---------------------------
    const recheckUrl = `${GRN_API_BASE_URL}/hotels/availability/${encodeURIComponent(searchId)}/rates/?action=recheck`;
    const recheckBody = { group_code: best.groupCode, hotel_info: true, rate_key: best.rateKey };
    const recheckResp = await grnCall({ step: 'recheck', method: 'POST', url: recheckUrl, body: recheckBody, ctx });
    if (recheckResp.outcome === GRN_OUTCOME.UNKNOWN) {
      // R4: unknown -> do not proceed, mark for review.
      await updateAttempt(attemptId, { status: 'needs_review', error: 'recheck outcome unknown' });
      return fail('recheck', 'Recheck result was unknown (network/5xx). Stopping before any booking. Marked for review.', 502, { needsReview: true });
    }
    if (recheckResp.outcome !== GRN_OUTCOME.OK) {
      await updateAttempt(attemptId, { status: 'error', error: `recheck: ${describeGrnError(recheckResp.errorCode, recheckResp.body, recheckResp.text)}` });
      return fail('recheck', `Recheck failed: ${describeGrnError(recheckResp.errorCode, recheckResp.body, recheckResp.text)}`, 409);
    }
    const rc = recheckResp.body || {};
    const priceChanged = rc.price_changed === true || rc.rate?.price_changed === true;
    const cpChanged = rc.cp_changed === true || rc.rate?.cp_changed === true;
    if (priceChanged) {
      await updateAttempt(attemptId, { status: 'aborted', error: 'price changed at recheck' });
      return fail('recheck', 'The price changed at recheck — aborting to avoid booking a rate we did not detect.', 409, { priceChanged: true });
    }
    if (cpChanged) {
      await updateAttempt(attemptId, { status: 'aborted', error: 'cancellation policy changed at recheck' });
      return fail('recheck', 'The cancellation policy changed at recheck — aborting to protect refundability.', 409, { cpChanged: true });
    }

    await updateAttempt(attemptId, {
      status: 'rechecked', search_id: searchId, group_code: best.groupCode,
      rate_key: best.rateKey, room_code: best.roomCode,
      paid_price: paidPrice, new_price: best.price, currency,
      saved_usd: toUsdOrNull((paidPrice ?? 0) - best.price, currency),
    });

    // ---- R7: DRY_RUN stops here (no mutation) -------------------------------
    if (DRY_RUN) {
      await updateAttempt(attemptId, { status: 'dry_run_ok' });
      return res.json({
        ok: true, dryRun: true, stage: 'rechecked',
        message: `DRY RUN: would rebook ${bookingId} from ${paidPrice} to ${best.price} ${currency} (save ${((paidPrice ?? 0) - best.price).toFixed(2)}). No live booking made.`,
        paidPrice, newPrice: best.price, currency, savedUsd: toUsdOrNull((paidPrice ?? 0) - best.price, currency),
      });
    }

    // ========================================================================
    // LIVE MUTATION BELOW — only runs when DRY_RUN=false.
    // ========================================================================

    // ---- 4 (REBOOK — creates held replacement, uses ORIGINAL ref, R5) ------
    const rebookUrl = `${GRN_API_BASE_URL}/hotels/rebookings/${encodeURIComponent(originalRef)}`;
    const rebookBody = {
      search_id: searchId, group_code: best.groupCode, rate_key: best.rateKey,
      room_code: best.roomCode, client_nationality: searchBody.client_nationality,
    };
    const rebookResp = await grnCall({ step: 'rebook', method: 'POST', url: rebookUrl, body: rebookBody, ctx });
    if (rebookResp.outcome === GRN_OUTCOME.UNKNOWN) {
      await updateAttempt(attemptId, { status: 'needs_review', error: 'rebook outcome unknown' });
      return fail('rebook', 'Rebook result unknown. The original booking is UNTOUCHED. Marked for review.', 502, { needsReview: true });
    }
    if (rebookResp.outcome !== GRN_OUTCOME.OK) {
      await updateAttempt(attemptId, { status: 'error', error: `rebook: ${describeGrnError(rebookResp.errorCode, rebookResp.body, rebookResp.text)}` });
      return fail('rebook', `Rebook failed: ${describeGrnError(rebookResp.errorCode, rebookResp.body, rebookResp.text)}. Original booking is untouched.`, 409);
    }
    const newRef = rebookResp.body?.booking_reference || rebookResp.body?.booking?.booking_reference;
    const newBookingId = rebookResp.body?.booking_id || rebookResp.body?.booking?.booking_id || null;
    if (!newRef) {
      await updateAttempt(attemptId, { status: 'needs_review', error: 'rebook returned no new reference' });
      return fail('rebook', 'Rebook returned no new reference. Original untouched. Marked for review.', 502, { needsReview: true });
    }
    await updateAttempt(attemptId, { status: 'booked', new_reference: newRef, new_booking_id: newBookingId });

    // ---- 5 (CONFIRM — commits replacement, uses NEW ref, R5) ---------------
    const confirmUrl = `${GRN_API_BASE_URL}/hotels/rebookings/confirm/${encodeURIComponent(newRef)}`;
    const confirmResp = await grnCall({ step: 'confirm', method: 'POST', url: confirmUrl, ctx });
    if (confirmResp.outcome === GRN_OUTCOME.UNKNOWN) {
      // R3/R4: do NOT cancel original — we don't know if the replacement stuck.
      await updateAttempt(attemptId, { status: 'needs_review', error: 'confirm outcome unknown' });
      return fail('confirm', 'Confirm result unknown. NOT cancelling original. Both may exist — marked for review.', 502, { needsReview: true, newRef });
    }
    if (confirmResp.outcome !== GRN_OUTCOME.OK) {
      // Replacement not confirmed -> original stays live. Safe.
      await updateAttempt(attemptId, { status: 'confirm_failed', error: `confirm: ${describeGrnError(confirmResp.errorCode, confirmResp.body, confirmResp.text)}` });
      return fail('confirm', `Confirm failed: ${describeGrnError(confirmResp.errorCode, confirmResp.body, confirmResp.text)}. Original booking is still live and untouched.`, 409, { newRef });
    }
    await updateAttempt(attemptId, { status: 'awaiting_cancel' });

    // ---- 6 (CANCEL ORIGINAL — only after confirm, uses ORIGINAL ref, R3/R5)
    const cancelUrl = `${GRN_API_BASE_URL}/hotels/rebookings/${encodeURIComponent(originalRef)}`;
    const cancelResp = await grnCall({ step: 'cancel', method: 'DELETE', url: cancelUrl, ctx });
    if (cancelResp.outcome !== GRN_OUTCOME.OK) {
      // Replacement IS confirmed but original didn't cancel. Not catastrophic
      // (client is covered), but needs a human to cancel the original.
      await updateAttempt(attemptId, { status: 'needs_review', error: `cancel: ${describeGrnError(cancelResp.errorCode, cancelResp.body, cancelResp.text)}` });
      return res.json({
        ok: true, partial: true, stage: 'cancel', newRef, newBookingId,
        message: `Replacement CONFIRMED, but cancelling the original failed (${describeGrnError(cancelResp.errorCode, cancelResp.body, cancelResp.text)}). Original needs manual cancellation.`,
        needsReview: true,
      });
    }

    await updateAttempt(attemptId, {
      status: 'confirmed', confirmed_at: new Date().toISOString(),
      saved_usd: toUsdOrNull((paidPrice ?? 0) - best.price, currency),
    });
    return res.json({
      ok: true, stage: 'done', newRef, newBookingId,
      paidPrice, newPrice: best.price, currency,
      savedUsd: toUsdOrNull((paidPrice ?? 0) - best.price, currency),
      message: `Rebooked ${bookingId}: ${paidPrice} -> ${best.price} ${currency}. Replacement ${newRef} confirmed, original cancelled.`,
    });
  } catch (err) {
    await updateAttempt(attemptId, { status: 'error', error: String(err.message || err) });
    return res.status(500).json({ ok: false, stage: 'exception', message: String(err.message || err) });
  }
});

// Read the step-by-step audit log for one booking (from grn_api_log).
router.get('/repricing/attempt-log', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });
  try {
    const { rows } = await sbSelect(
      'grn_api_log',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=created_at,step,method,http_status,error_code,outcome,duration_ms&order=created_at.asc`
    );
    res.json({ booking_id: bookingId, steps: rows, dryRun: DRY_RUN });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ============================================================================
// REBOOKINGS LIST  (Rebookings page)  — stats + counts + rows
// Field names matched exactly to rebookings/page.tsx.
// ============================================================================
router.get('/repricing/rebookings', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage, 10) || 25));
    const offset = (page - 1) * perPage;
    const status = (req.query.status || 'all').toLowerCase();
    const search = (req.query.q || '').trim();
    const gap = (req.query.saving || req.query.gap || 'any').trim();

    let filter = 'id=not.is.null';
    if (status === 'successful') filter += '&status=eq.confirmed';
    else if (status === 'errors') filter += '&status=in.(error,failed,needs_review,confirm_failed,aborted)';
    if (gap && gap.includes('-')) {
      const [lo, hi] = gap.split('-').map(Number);
      if (!isNaN(lo)) filter += `&saved_usd=gte.${lo}`;
      if (!isNaN(hi)) filter += `&saved_usd=lte.${hi}`;
    } else if (gap === '500+') filter += '&saved_usd=gte.500';
    if (req.query.from) filter += `&created_at=gte.${new Date(req.query.from + 'T00:00:00Z').toISOString()}`;
    if (req.query.to) filter += `&created_at=lte.${new Date(req.query.to + 'T23:59:59Z').toISOString()}`;
    if (search) filter += `&booking_id=ilike.${encodeURIComponent(`*${search}*`)}`;

    const { rows: attempts, total } = await sbSelect(
      'grn_rebooking_attempts',
      `${filter}&select=*&order=created_at.desc&limit=${perPage}&offset=${offset}`,
      { 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': `${offset}-${offset + perPage - 1}` }
    );

    // Enrich with hotel/city/room/checkin from grn_bookings.
    const ids = [...new Set(attempts.map((a) => a.booking_id).filter(Boolean))];
    const info = new Map();
    if (ids.length) {
      const inList = ids.map((i) => encodeURIComponent(i)).join(',');
      try {
        const { rows: br } = await sbSelect('grn_bookings', `booking_id=in.(${inList})&select=booking_id,hotel_name,city_name,room_type,checkin`);
        for (const b of br) info.set(b.booking_id, b);
      } catch {}
    }

    const SUCCESS = new Set(['confirmed', 'success']);
    const ERROR = new Set(['error', 'failed', 'needs_review', 'confirm_failed', 'aborted']);
    const rows = attempts.map((a) => {
      const b = info.get(a.booking_id) || {};
      return {
        id: a.id,
        bookingId: a.booking_id,
        hotel: b.hotel_name || a.booking_id,
        city: b.city_name || null,
        room: b.room_type || null,
        checkin: b.checkin || null,
        originalUsd: toUsdOrNull(a.paid_price, a.currency),
        rebookedUsd: toUsdOrNull(a.new_price, a.currency),
        savedUsd: a.saved_usd != null ? Number(a.saved_usd) : null,
        status: SUCCESS.has(a.status) ? 'success' : (ERROR.has(a.status) ? 'error' : a.status),
        failureStage: a.error || null,
        createdAt: a.created_at,
      };
    });

    // Counts + stats.
    let successful = 0, errors = 0, all = 0, totalSavedUsd = 0;
    try { successful = await sbCount('grn_rebooking_attempts', 'status=eq.confirmed'); } catch {}
    try { errors = await sbCount('grn_rebooking_attempts', 'status=in.(error,failed,needs_review,confirm_failed,aborted)'); } catch {}
    try { all = await sbCount('grn_rebooking_attempts', 'id=not.is.null'); } catch {}
    try {
      const { rows: sr } = await sbSelect('grn_rebooking_attempts', 'status=eq.confirmed&select=saved_usd');
      totalSavedUsd = sr.reduce((s, r) => s + (Number(r.saved_usd) || 0), 0);
    } catch {}

    let checksRun = 0;
    try { checksRun = await sbCount('grn_price_checks', 'id=not.is.null'); } catch {}
    const conversionPct = checksRun ? Math.round((successful / checksRun) * 100) : 0;
    const avgSavingUsd = successful ? Math.round(totalSavedUsd / successful) : 0;

    res.json({
      page, perPage, total: total ?? rows.length,
      hasMore: (offset + rows.length) < (total ?? 0),
      counts: { successful, errors, all },
      stats: { totalSavedUsd, avgSavingUsd, conversionPct },
      rows,
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ============================================================================
// HISTORY  — all price checks for one booking (Repricing drawer)
// ============================================================================
router.get('/repricing/history', async (req, res) => {
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  const bookingId = req.query.booking_id;
  if (!bookingId) return res.status(400).json({ error: 'booking_id required' });
  try {
    const { rows } = await sbSelect(
      'grn_price_checks',
      `booking_id=eq.${encodeURIComponent(bookingId)}&select=id,checked_at,paid_price,new_price,gap_usd,dropped,currency&order=checked_at.desc`
    );
    const history = rows.map((c) => ({
      checked_at: c.checked_at,
      liveUsd: toUsdOrNull(c.new_price, c.currency),
      gapUsd: c.gap_usd != null ? Number(c.gap_usd) : null,
      dropped: c.dropped === true,
    }));
    res.json({ booking_id: bookingId, history });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ============================================================================
// CANCEL ORIGINAL  — standalone cancel of an original booking (post-rebook)
// Honours DRY_RUN: simulates unless DRY_RUN=false.
// ============================================================================
router.post('/repricing/cancel-original', async (req, res) => {
  if (!grnConfigured()) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  const bookingId = (req.body && req.body.booking_id) || req.query.booking_id;
  const bookingRef = (req.body && req.body.booking_reference) || req.query.booking_reference;
  if (!bookingId && !bookingRef) return res.status(400).json({ error: 'booking_id or booking_reference required' });
  const ctx = { bookingId: bookingId || null, actorEmail: (req.body && req.body.actor_email) || null };

  try {
    let ref = bookingRef;
    if (!ref && bookingId) {
      const d = await grnCall({ step: 'bookingdetail', method: 'GET', url: `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bookingId)}`, ctx });
      ref = d.body?.booking?.booking_reference;
    }
    if (!ref) return res.status(422).json({ ok: false, message: 'Could not resolve booking_reference to cancel.' });

    if (DRY_RUN) {
      return res.json({ ok: true, dryRun: true, message: `DRY RUN: would cancel original ${ref}. No live cancellation made.` });
    }

    const cancelResp = await grnCall({ step: 'cancel', method: 'DELETE', url: `${GRN_API_BASE_URL}/hotels/rebookings/${encodeURIComponent(ref)}`, ctx });
    if (cancelResp.outcome !== GRN_OUTCOME.OK) {
      return res.status(409).json({ ok: false, message: `Cancel failed: ${describeGrnError(cancelResp.errorCode, cancelResp.body, cancelResp.text)}` });
    }
    res.json({ ok: true, message: `Original ${ref} cancelled.`, charges: cancelResp.body?.cancellation_charges || null });
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err.message || err) });
  }
});

module.exports = router;
