// backend/routes/rebooking.js
//
// Three ways to trigger things:
//   GET /api/rebooking/sync-real   — pulls REAL bookings from GRN right now
//                                     (list + detail only, no search/rebook).
//                                     This is the one to use today.
//   GET /api/rebooking/run         — full pipeline (mock mode only for now).
//   GET /api/rebooking/status      — check current config.

const express = require('express');
const router = express.Router();
const { runRebookingEngine, runSyncOnly } = require('../jobs/rebookingEngine');

async function handleSyncReal(req, res) {
  try {
    console.log('[rebooking/sync-real] Triggered.');
    const daysBack = parseInt(req.query.daysBack || '7', 10);
    const result = await runSyncOnly(daysBack);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[rebooking/sync-real] Failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function handleRun(req, res) {
  try {
    console.log('[rebooking/run] Triggered.');
    const result = await runRebookingEngine();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[rebooking/run] Failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get('/sync-real', handleSyncReal);
router.get('/run', handleRun);
router.post('/run', handleRun);

router.get('/status', (req, res) => {
  res.json({
    dryRun: process.env.DRY_RUN !== 'false',
    mockMode: process.env.MOCK_GRN_API === 'true',
    grnApiConfigured: !!(process.env.GRN_API_BASE_URL && process.env.GRN_API_KEY),
    minSavingPercent: process.env.MIN_SAVING_PERCENT || '3',
    minLeadDays: process.env.MIN_LEAD_DAYS || '2',
  });
});

module.exports = router;
