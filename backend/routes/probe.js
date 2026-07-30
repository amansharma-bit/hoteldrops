const express = require('express');
const router = express.Router();
const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;

const GRN_HEADERS = {
  'api-key': GRN_API_KEY,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Temporary diagnostic — checking real non_refundable field values.
// Not behind login, since this is a one-time check, not a permanent route.
router.get('/nonrefundable-proof', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${encodeURIComponent('2026-06-01 00:00:00')}&updated_end=${encodeURIComponent('2026-07-16 23:59:59')}`;
  const listResp = await fetch(listUrl, { headers: GRN_HEADERS });
  const listData = await listResp.json();
  const candidates = (listData.bookings || []).slice(0, 15);
  const proof = [];
  for (const c of candidates) {
    try {
      const dResp = await fetch(`${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${c.bid}`, {
        headers: GRN_HEADERS,
      });
      const dData = await dResp.json();
      const booking = dData.booking;
      proof.push({
        bookingId: booking?.booking_id,
        raw_non_refundable_field: booking?.non_refundable,
        raw_booking_status_field: booking?.booking_status,
        computed_status: booking?.booking_status === 'Cancelled' ? 'Cancelled' : (booking?.non_refundable === false ? 'Refundable' : 'Non-Refundable'),
      });
    } catch (e) { proof.push({ bookingId: c.bid, error: e.message }); }
  }
  res.json({ proof });
});

// ===========================================================================
// SYNC DIAGNOSTIC — compares the TWO booking endpoints side by side so we can
// see which one actually returns data right now.
//
//   Endpoint A: /hotels/bookings?filter_type=booking_date  ← what the SYNC uses
//   Endpoint B: /hotels/bookingids?updated_start/updated_end ← what the WORKING probe uses
//
// Hit this from a browser tab (no login needed — it's a temporary diagnostic):
//   /api/probe/sync-test
//
// It pulls a small window, count=100, from BOTH endpoints and reports exactly
// what each returned: HTTP status, how many bookings, and any error body.
// This tells us definitively whether the sync's endpoint is the problem.
// ===========================================================================
router.get('/sync-test', async (req, res) => {
  if (!GRN_API_KEY) return res.status(500).json({ error: 'GRN_API_KEY not set' });

  // A ~30-day window ending today (same shape the sync uses).
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  const dayA_start = start.toISOString().slice(0, 10);              // YYYY-MM-DD
  const dayA_end = end.toISOString().slice(0, 10);
  const dtB_start = start.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
  const dtB_end = end.toISOString().slice(0, 19).replace('T', ' ');

  const out = { window: { from: dayA_start, to: dayA_end } };

  // ── Endpoint A: what the SYNC uses ──────────────────────────────────────
  const urlA = `${GRN_API_BASE_URL}/hotels/bookings?filter_type=booking_date&start=${dayA_start}&end=${dayA_end}&count=100`;
  try {
    const rA = await fetch(urlA, { headers: GRN_HEADERS });
    let bodyA = null;
    const txtA = await rA.text();
    try { bodyA = JSON.parse(txtA); } catch { bodyA = { _raw: txtA.slice(0, 500) }; }
    out.endpointA_sync = {
      url: urlA,
      httpStatus: rA.status,
      bookingsReturned: Array.isArray(bodyA?.bookings) ? bodyA.bookings.length : 0,
      total: bodyA?.total ?? null,
      error: bodyA?.error || bodyA?.error_code || null,
      firstBookingId: bodyA?.bookings?.[0]?.booking_id || bodyA?.bookings?.[0]?.bid || null,
      sampleKeys: bodyA?.bookings?.[0] ? Object.keys(bodyA.bookings[0]).slice(0, 12) : null,
      rawIfEmpty: (!bodyA?.bookings || bodyA.bookings.length === 0) ? JSON.stringify(bodyA).slice(0, 400) : null,
    };
  } catch (e) {
    out.endpointA_sync = { url: urlA, fetchError: String(e.message || e) };
  }

  // ── Endpoint B: what the WORKING probe uses ─────────────────────────────
  const urlB = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${encodeURIComponent(dtB_start)}&updated_end=${encodeURIComponent(dtB_end)}`;
  try {
    const rB = await fetch(urlB, { headers: GRN_HEADERS });
    let bodyB = null;
    const txtB = await rB.text();
    try { bodyB = JSON.parse(txtB); } catch { bodyB = { _raw: txtB.slice(0, 500) }; }
    out.endpointB_working = {
      url: urlB,
      httpStatus: rB.status,
      bookingsReturned: Array.isArray(bodyB?.bookings) ? bodyB.bookings.length : 0,
      total: bodyB?.total ?? null,
      error: bodyB?.error || bodyB?.error_code || null,
      firstBid: bodyB?.bookings?.[0]?.bid || null,
      sampleKeys: bodyB?.bookings?.[0] ? Object.keys(bodyB.bookings[0]).slice(0, 12) : null,
      rawIfEmpty: (!bodyB?.bookings || bodyB.bookings.length === 0) ? JSON.stringify(bodyB).slice(0, 400) : null,
    };
  } catch (e) {
    out.endpointB_working = { url: urlB, fetchError: String(e.message || e) };
  }

  // Plain-English verdict so you don't have to read the JSON.
  const a = out.endpointA_sync?.bookingsReturned || 0;
  const b = out.endpointB_working?.bookingsReturned || 0;
  out.verdict =
    a > 0 ? `Endpoint A (sync's) WORKS — returned ${a} bookings. Sync endpoint is fine; problem is elsewhere.`
    : b > 0 ? `Endpoint A (sync's) returned ZERO, but Endpoint B WORKS (${b} bookings). FIX: switch the sync to endpoint B.`
    : `BOTH endpoints returned zero. Likely a GRN-side issue (rate limit / key) — raise with Naveen.`;

  res.json(out);
});

module.exports = router;
