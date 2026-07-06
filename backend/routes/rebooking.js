// backend/routes/rebooking.js
//
// Manual trigger + status check for the rebooking engine, mirroring the
// same pattern as your existing priceTracker "force=true" manual trigger.
//
// Mount this in server.js with:
//   const rebookingRoutes = require('./routes/rebooking');
//   app.use('/api/rebooking', rebookingRoutes);
//
// Then trigger a run by visiting (or curling):
//   POST /api/rebooking/run

const express = require('express');
const router = express.Router();
const { runRebookingEngine } = require('../jobs/rebookingEngine');

router.post('/run', async (req, res) => {
  try {
    console.log('[POST /api/rebooking/run] Triggered manually.');
    const result = await runRebookingEngine();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[POST /api/rebooking/run] Failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    dryRun: process.env.DRY_RUN !== 'false',
    minSavingPercent: process.env.MIN_SAVING_PERCENT || '3',
    minLeadDays: process.env.MIN_LEAD_DAYS || '2',
  });
});

module.exports = router;
