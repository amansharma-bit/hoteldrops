// ============================================================================
// dashboard.js  —  DASHBOARD DATA  (reads grn_bookings, computes the numbers)
// ----------------------------------------------------------------------------
// Serves the business dashboard: total live rebookable value, "closing soon"
// buckets, top cities, and the rebooking KPIs. This is mostly READ-ONLY, so
// the risk is low — the main jobs are (a) never crash, (b) always return a
// shape the frontend can render even when data is thin.
//
// PERFORMANCE (QA): the dashboard is computed once and cached in a single
// snapshot row (dashboard_snapshot). Page loads read that snapshot instantly
// and NEVER hit GRN. The heavy scan only runs on /dashboard-refresh. This is
// what keeps the dashboard fast and keeps GRN untouched by ordinary browsing.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  sbSelect, sbCount, sbPatch, sbInsertReturning,
  toUsdOrNull, parseGrnDate,
} = require('./lib-grn');

// A booking counts as "live rebookable" if: not cancelled, refundable (or
// partial), and its free-cancellation window is still open (cancel_by_date in
// the future). Those are the bookings still worth acting on.
const REBOOKABLE_STATUSES = new Set(['Refundable', 'Partial']);

// ---- Snapshot persistence (dashboard_snapshot, single row id=1) -------------
async function getSnapshot() {
  try {
    const { rows } = await sbSelect('dashboard_snapshot', 'id=eq.1&select=*');
    return rows[0] || null;
  } catch { return null; }
}
async function saveSnapshot(payload) {
  const row = { id: 1, data: payload, computed_at: new Date().toISOString() };
  try { await sbPatch('dashboard_snapshot', 'id=eq.1', row); }
  catch { try { await sbInsertReturning('dashboard_snapshot', row); } catch { /* ignore */ } }
}

// ---- Page every row out of grn_bookings (safe, batched) --------------------
async function fetchAllBookings() {
  const pageSize = 1000;
  let offset = 0;
  const all = [];
  const cols = 'booking_id,status,price_total,currency,cancel_by_date,checkin,checkout,city_name,city_code,country_code';
  for (;;) {
    const { rows } = await sbSelect(
      'grn_bookings',
      `select=${cols}&order=booking_id.asc&limit=${pageSize}&offset=${offset}`,
      { 'Range-Unit': 'items', 'Range': `${offset}-${offset + pageSize - 1}` }
    );
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 500000) break; // hard safety cap; we never expect this many
  }
  return all;
}

// ---- The heavy computation -------------------------------------------------
function computeDashboard(bookings) {
  const now = Date.now();
  const DAY = 86400000;

  let liveCount = 0, liveUsd = 0, liveUsdKnown = true;
  let expiringSoonCount = 0;
  const buckets = {
    d7: { count: 0, valueUsd: 0 },
    d30: { count: 0, valueUsd: 0 },
    d90: { count: 0, valueUsd: 0 },
    all: { count: 0, valueUsd: 0 },
  };
  const cityMap = new Map();

  for (const b of bookings) {
    if (!REBOOKABLE_STATUSES.has(b.status)) continue;
    const cancelBy = b.cancel_by_date ? parseGrnDate(b.cancel_by_date) : null;
    if (!cancelBy) continue;
    const cancelMs = cancelBy.getTime();
    if (cancelMs <= now) continue; // window already closed — not actionable

    const usd = toUsdOrNull(b.price_total, b.currency);
    const val = usd == null ? 0 : usd;
    if (usd == null) liveUsdKnown = false;

    liveCount++;
    liveUsd += val;

    const daysLeft = (cancelMs - now) / DAY;
    if (daysLeft <= 3) expiringSoonCount++;
    if (daysLeft <= 7) { buckets.d7.count++; buckets.d7.valueUsd += val; }
    if (daysLeft <= 30) { buckets.d30.count++; buckets.d30.valueUsd += val; }
    if (daysLeft <= 90) { buckets.d90.count++; buckets.d90.valueUsd += val; }
    buckets.all.count++; buckets.all.valueUsd += val;

    const cityKey = b.city_name || b.city_code || 'Unknown';
    const c = cityMap.get(cityKey) || { city: cityKey, count: 0, valueUsd: 0 };
    c.count++; c.valueUsd += val;
    cityMap.set(cityKey, c);
  }

  const topCities = Array.from(cityMap.values())
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 12);

  return {
    tiles: {
      liveRebookable: { count: liveCount, valueUsd: liveUsdKnown || liveUsd > 0 ? liveUsd : liveUsd },
      expiringSoon: { count: expiringSoonCount },
      // Rebooking KPIs are filled from grn_rebooking_attempts (see below).
      caughtThisMonth: { count: 0, savedUsd: 0 },
    },
    closing: buckets,
    topCities,
    computedAt: new Date().toISOString(),
  };
}

// ---- Rebooking KPIs (from grn_rebooking_attempts) --------------------------
async function rebookingKpis() {
  const out = { rebooked: 0, savedUsd: 0 };
  try {
    out.rebooked = await sbCount('grn_rebooking_attempts', 'status=eq.confirmed');
    // Sum of saved USD across confirmed attempts, if the column exists.
    const { rows } = await sbSelect('grn_rebooking_attempts', 'status=eq.confirmed&select=saved_usd');
    out.savedUsd = rows.reduce((s, r) => s + (Number(r.saved_usd) || 0), 0);
  } catch { /* table may be empty/new — KPIs just stay zero */ }
  return out;
}

// ---- Assemble the full dashboard payload -----------------------------------
// GRN sync status — the Analytics page reads data.sync.{lastStatus, syncedThrough}.
async function getSyncInfo() {
  try {
    const { rows } = await sbSelect('grn_sync_state', 'id=eq.1&select=last_run_status,last_run_at,watermark,bookings_synced');
    const s = rows[0];
    if (!s) return null;
    return { lastStatus: s.last_run_status || null, lastRunAt: s.last_run_at || null, syncedThrough: s.watermark || null, bookingsSynced: s.bookings_synced ?? null };
  } catch { return null; }
}

async function buildDashboard() {
  const bookings = await fetchAllBookings();
  const payload = computeDashboard(bookings);
  const kpis = await rebookingKpis();
  payload.tiles.caughtThisMonth = { count: kpis.rebooked, savedUsd: kpis.savedUsd };
  payload.sync = await getSyncInfo();
  return payload;
}

// ============================================================================
// ROUTES
// ============================================================================

// Fast read: serve the cached snapshot. If none exists yet, compute once.
router.get('/dashboard', async (req, res) => {
  try {
    const snap = await getSnapshot();
    if (snap && snap.data) {
      const data = typeof snap.data === 'string' ? JSON.parse(snap.data) : snap.data;
      return res.json({ ...data, snapshot: { computedAt: snap.computed_at, stale: false } });
    }
    // No snapshot yet — compute one now (first-ever load).
    const payload = await buildDashboard();
    await saveSnapshot(payload);
    res.json({ ...payload, snapshot: { computedAt: payload.computedAt, stale: false } });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Heavy recompute: re-scan grn_bookings and re-save the snapshot.
router.get('/dashboard-refresh', async (req, res) => {
  try {
    const payload = await buildDashboard();
    await saveSnapshot(payload);
    res.json({ ...payload, snapshot: { computedAt: payload.computedAt, stale: false }, refreshed: true });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = router;
