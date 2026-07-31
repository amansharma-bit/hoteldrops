// ============================================================================
// server.js  —  ENTRY POINT
// ----------------------------------------------------------------------------
// Boots the backend. Its whole job is to wire the route modules together
// SAFELY, so that the failures that took us down before can't happen again.
//
// DEATH-PROOFING (QA):
//   1. BOOT SELF-CHECK: on startup, log which required env vars are present or
//      missing. A missing key is reported clearly, not discovered via a cryptic
//      crash three requests later.
//   2. GRACEFUL MOUNTING: each route module is mounted inside try/catch. If ONE
//      module fails to load (syntax error, bad require), the others still come
//      up. A broken rebooking file can never again take down the dashboard.
//   3. /health: returns 200 + status so an uptime monitor (e.g. UptimeRobot)
//      alerts within a minute if the backend goes down. No more silent outages.
//   4. Global error + unhandledRejection handlers so a stray error logs instead
//      of killing the process.
// ============================================================================

'use strict';

const express = require('express');
const cors = require('cors');
const app = express();

// ---- 1. BOOT SELF-CHECK ----------------------------------------------------
const REQUIRED_ENV = ['GRN_API_KEY'];
const SUPABASE_ENV_OK =
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

const bootReport = { missing: [], ok: [] };
for (const key of REQUIRED_ENV) {
  if (process.env[key]) bootReport.ok.push(key); else bootReport.missing.push(key);
}
if (SUPABASE_ENV_OK) bootReport.ok.push('SUPABASE'); else bootReport.missing.push('SUPABASE_URL/SERVICE_KEY');

console.log('🔧 Boot check — present:', bootReport.ok.join(', ') || 'none');
if (bootReport.missing.length) {
  console.warn('⚠️  Boot check — MISSING:', bootReport.missing.join(', '),
    '— affected routes will return clear 500s rather than crash.');
}
console.log('🔒 DRY_RUN (live rebooking disabled unless false):', String(process.env.DRY_RUN ?? 'true'));

// ---- CORS + body parsing ---------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://www.rebuq.com',
  'https://rebuq.com',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, true); // permissive for now; tighten post-launch if desired
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- 3. HEALTH endpoint (before route mounting, so it ALWAYS works) --------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    envOk: bootReport.missing.length === 0,
    dryRun: String(process.env.DRY_RUN ?? 'true') !== 'false' ? true : false,
  });
});
app.get('/', (req, res) => res.json({ service: 'rebuq-backend', status: 'ok' }));

// ---- 2. GRACEFUL MODULE MOUNTING -------------------------------------------
// Each module mounts independently. If one throws on require, we log it and
// keep going — the rest of the backend still serves.
const mounts = [
  { path: '/api/live-search', file: './routes/sync' },
  { path: '/api/live-search', file: './routes/dashboard' },
  { path: '/api/live-search', file: './routes/repricing' },
  { path: '/api/live-search', file: './routes/rebooking' },
];

const mountStatus = [];
for (const m of mounts) {
  try {
    const router = require(m.file);
    app.use(m.path, router);
    mountStatus.push({ file: m.file, mounted: true });
    console.log(`✅ Mounted ${m.file} at ${m.path}`);
  } catch (err) {
    mountStatus.push({ file: m.file, mounted: false, error: String(err.message || err) });
    console.error(`❌ FAILED to mount ${m.file}: ${err.message} — other routes still up.`);
  }
}

// Expose which modules mounted (handy for debugging a partial outage).
app.get('/api/live-search/_modules', (req, res) => res.json({ mounts: mountStatus }));

// ---- 4. Safety nets --------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err && err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal error', detail: String(err && err.message || err) });
});
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('uncaughtException:', err && err.message));

// ---- Boot ------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🏨 rebuq backend running on port ${PORT}`);
  const up = mountStatus.filter((m) => m.mounted).length;
  console.log(`📦 Modules mounted: ${up}/${mounts.length}`);
});
