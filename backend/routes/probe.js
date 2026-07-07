// backend/routes/probe.js
//
// GET /api/probe/auth-methods — tries several common ways of sending the
// API key against the REAL bookingids endpoint (read-only, completely
// safe to test), to find which one GRN's v4 API actually expects.

const express = require('express');
const router = express.Router();

const BASE_URL = process.env.GRN_API_BASE_URL;
const API_KEY = process.env.GRN_API_KEY;

function pad(n) { return String(n).padStart(2, '0'); }
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

router.get('/auth-methods', async (req, res) => {
  if (!BASE_URL || !API_KEY) {
    return res.status(500).json({ error: 'GRN_API_BASE_URL or GRN_API_KEY not set in Railway.' });
  }

  const today = new Date();
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const path = `/hotels/bookingids?updated_start=${encodeURIComponent(fmt(weekAgo))}&updated_end=${encodeURIComponent(fmt(today))}`;

  const attempts = [
    { label: 'api-key header', headers: { 'api-key': API_KEY } },
    { label: 'X-API-Key header', headers: { 'X-API-Key': API_KEY } },
    { label: 'Authorization: Bearer', headers: { Authorization: `Bearer ${API_KEY}` } },
    { label: 'Authorization: raw key', headers: { Authorization: API_KEY } },
    { label: 'apikey header (no dash)', headers: { apikey: API_KEY } },
  ];

  const results = [];
  for (const attempt of attempts) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...attempt.headers },
      });
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch (e) { body = text.slice(0, 150); }
      results.push({ method: attempt.label, status: res.status, success: res.status >= 200 && res.status < 300, body });
    } catch (err) {
      results.push({ method: attempt.label, status: 'network_error', success: false, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  res.json({
    note: 'Testing which header format GRN\'s v4 API actually accepts. Look for status 200 (or anything other than 401) below.',
    results,
  });
});

module.exports = router;
