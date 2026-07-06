// backend/routes/rebooking.js
//
// Manual trigger + status check for the rebooking engine.
//
// Two ways to trigger a run:
//   GET  /api/rebooking/run   — just visit this URL in your browser, easiest option
//   POST /api/rebooking/run   — for programmatic use (e.g. a future cron job)
//
// Mount this in server.js with:
//   const rebookingRoutes = require('./routes/rebooking');
//   app.use('/api/rebooking', rebookingRoutes);

const express = require('express');
const router = express.Router();
const { runRebookingEngine } = require('../jobs/rebookingEngine');

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

router.get('/run', handleRun);   // <-- visit this URL directly in your browser
router.post('/run', handleRun);  // <-- for programmatic/future use

router.get('/status', (req, res) => {
  res.json({
    dryRun: process.env.DRY_RUN !== 'false',
    mockMode: process.env.MOCK_GRN_API === 'true',
    minSavingPercent: process.env.MIN_SAVING_PERCENT || '3',
    minLeadDays: process.env.MIN_LEAD_DAYS || '2',
  });
});

module.exports = router;
