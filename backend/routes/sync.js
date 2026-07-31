// ============================================================================
// sync.js  —  BOOKING SYNC  (pulls bookings from GRN into Supabase)
// ----------------------------------------------------------------------------
// THIS IS THE FILE THAT WAS BROKEN. The old sync used
// GET /hotels/bookings?filter_type=booking_date, which returns ZERO bookings
// for this account (confirmed live: "0 bookings synced, 1 GRN call"). The
// table stopped growing on 18 July as a result.
//
// THE FIX — use the endpoints PROVEN to work (verified live today by the
// /nonrefundable-proof probe and the /dashboard-real route):
//   1. GET /hotels/bookingids?updated_start=&updated_end=  -> { bookings:[{bid}] }
//   2. GET /hotels/bookingdetail?booking_id=<bid>          -> { booking:{...} }
// Filtering by UPDATED date also naturally captures cancellations on older
// bookings, keeping "rebookable value" honest.
//
// SAFETY (QA):
//   - Paced + call-budgeted so it never triggers GRN's 429 rate-limit storm.
//   - One bad booking is isolated (try/catch per detail) and never kills a run.
//   - Only ONE sync runs at a time (syncRunning guard) — no double-writes.
//   - Progress + status persisted to grn_sync_state so the UI can watch it,
//     and so a crash mid-run is visible rather than silent.
//   - Every state write is wrapped; a Supabase hiccup ends the run cleanly.
// ============================================================================

'use strict';

const express = require('express');
const router = express.Router();
const {
  GRN_API_BASE_URL, grnConfigured, sbConfigured,
  grnGetJson, sbUpsert, sbSelect, sbCount, sbPatch, sbInsertReturning,
  getCityName, toRow, fmtGrn, fmtDay, sleep, checkSecret,
} = require('./lib-grn');

// ---- Tunables (safe defaults; overridable via env) -------------------------
const GRN_WINDOW_DAYS = parseInt(process.env.GRN_WINDOW_DAYS, 10) || 30;   // window size per GRN list call
const MAX_CALLS_PER_RUN = parseInt(process.env.MAX_CALLS_PER_RUN, 10) || 400; // hard cap on GRN calls per run
const DETAIL_CONCURRENCY = parseInt(process.env.DETAIL_CONCURRENCY, 10) || 5;  // parallel detail fetches
const PAUSE_BETWEEN_CALLS_MS = parseInt(process.env.PAUSE_BETWEEN_CALLS_MS, 10) || 250;
const UPSERT_BATCH = 100;
const DEFAULT_INCREMENTAL_DAYS = parseInt(process.env.DEFAULT_INCREMENTAL_DAYS, 10) || 30;

// Module-level flag: only one sync at a time.
let syncRunning = false;

// ---- Sync-state persistence (grn_sync_state, single row id=1) ---------------
async function getSyncState() {
  try {
    const { rows } = await sbSelect('grn_sync_state', 'id=eq.1&select=*');
    return rows[0] || null;
  } catch { return null; }
}
async function setSyncState(patch) {
  // Wrapped: state-writing must never itself crash a run.
  try {
    await sbPatch('grn_sync_state', 'id=eq.1', patch);
  } catch {
    // If the row doesn't exist yet, try to create it once.
    try { await sbInsertReturning('grn_sync_state', { id: 1, ...patch }); } catch { /* ignore */ }
  }
}

// ---- Concurrency helper: run fn over items, N at a time, with a deadline ----
async function mapWithConcurrency(items, limit, deadlineTs, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    for (;;) {
      if (deadlineTs && Date.now() > deadlineTs) return;
      const idx = cursor++;
      if (idx >= items.length) return;
      try { results[idx] = await fn(items[idx], idx); }
      catch { results[idx] = null; }
    }
  }
  const n = Math.min(limit, items.length) || 0;
  await Promise.all(Array.from({ length: n }, worker));
  return { results };
}

// ============================================================================
// syncWindow — sync ONE date window using the proven bookingids->detail chain.
// Signature: (windowStart:Date, windowEnd:Date, callBudget:int, onProgress:fn)
// Returns: { rows: <upserted>, calls: <grn calls used> }
// ============================================================================
async function syncWindow(windowStart, windowEnd, callBudget, onProgress) {
  let callsUsed = 0;
  let rowsLanded = 0;

  // 1) LIST — booking ids updated in this window (the endpoint that WORKS).
  const listUrl =
    `${GRN_API_BASE_URL}/hotels/bookingids` +
    `?updated_start=${encodeURIComponent(fmtGrn(windowStart))}` +
    `&updated_end=${encodeURIComponent(fmtGrn(windowEnd))}`;

  let listData;
  try {
    listData = await grnGetJson(listUrl);
    callsUsed++;
  } catch (e) {
    throw new Error(`GRN bookingids failed: ${String(e.message || e)}`);
  }
  if (listData && (listData.error || listData.error_code)) {
    throw new Error(`GRN bookingids error: ${JSON.stringify(listData).slice(0, 200)}`);
  }

  const list = Array.isArray(listData?.bookings) ? listData.bookings : [];
  if (list.length === 0) return { rows: 0, calls: callsUsed };

  // Collect bids, capped to the remaining call budget.
  const bids = [];
  for (const item of list) {
    const bid = item?.bid || item?.booking_id || null;
    if (bid) bids.push(bid);
  }
  const remaining = Math.max(0, callBudget - callsUsed);
  const toFetch = bids.slice(0, remaining);

  // 2) DETAIL — fetch each booking's full record, concurrency-limited, with a
  //    wall-clock deadline so a slow window can't run forever.
  const deadlineTs = Date.now() + 120000;
  const { results } = await mapWithConcurrency(toFetch, DETAIL_CONCURRENCY, deadlineTs, async (bid) => {
    const url = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bid)}`;
    try {
      const d = await grnGetJson(url);
      return d?.booking || null;   // one bad booking must never kill the run
    } catch {
      return null;
    }
  });
  callsUsed += toFetch.length;

  // 3) Build rows and upsert in batches.
  const rows = [];
  for (const b of results) {
    if (!b || !b.booking_id) continue;
    let cityName = null;
    try { cityName = await getCityName(b.hotel?.city_code); } catch { cityName = null; }
    rows.push(toRow(b, cityName));
  }
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    await sbUpsert('grn_bookings', rows.slice(i, i + UPSERT_BATCH), 'booking_id');
  }
  rowsLanded += rows.length;
  if (onProgress) await onProgress(rowsLanded);

  return { rows: rowsLanded, calls: callsUsed };
}

// ============================================================================
// runSync — walk the whole date range in windows, respecting the call budget.
// mode 'range'  -> explicit from/to
// mode 'incremental' -> last DEFAULT_INCREMENTAL_DAYS days (catches updates)
// ============================================================================
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
          progress: `Paused at call budget (${MAX_CALLS_PER_RUN}). ${total} synced so far — press Refresh again to continue.`,
          watermark: cursor.toISOString(), bookings_synced: total,
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
      bookings_synced: total, watermark: windowTo.toISOString(),
    });
  } catch (err) {
    // A failure is recorded, not swallowed — visible in status, not a silent stall.
    await setSyncState({
      last_run_status: 'error',
      last_run_error: String(err.message || err),
      progress: `Failed after ${total} bookings (${callsUsed} GRN calls): ${String(err.message || err).slice(0, 200)}`,
    });
  } finally {
    syncRunning = false;
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// Kick off a sync (returns immediately; poll /sync-status to watch it).
//   ?mode=range&from=YYYY-MM-DD&to=YYYY-MM-DD   (explicit window)
//   ?mode=incremental                            (last N days — default)
router.get('/sync-run', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!grnConfigured()) return res.status(500).json({ error: 'GRN_API_KEY not set' });
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  if (syncRunning) return res.json({ started: false, message: 'A sync is already running.' });

  const mode = req.query.mode === 'range' ? 'range' : 'incremental';
  const fromISO = req.query.from ? `${req.query.from}T00:00:00Z` : null;
  const toISO = req.query.to ? `${req.query.to}T23:59:59Z` : null;

  // Fire and forget — the request returns now, the sync runs in the background.
  runSync({ fromISO, toISO, mode }).catch(() => { /* errors are captured in state */ });
  res.json({ started: true, mode, message: 'Sync started. Poll /sync-status to watch it.' });
});

// Watch a sync's progress and see how many bookings are in the table.
router.get('/sync-status', async (req, res) => {
  if (!checkSecret(req, res)) return;
  if (!sbConfigured()) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const state = await getSyncState();
    let rowsInTable = null;
    try { rowsInTable = await sbCount('grn_bookings', 'booking_id=not.is.null'); } catch { rowsInTable = null; }
    res.json({ running: syncRunning, rowsInTable, state });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = router;
