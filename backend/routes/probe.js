const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;
const SAMPLE_BOOKING_ID = process.env.SAMPLE_BOOKING_ID || null;

// ============================================================
// Route 1: auth-methods — tests 5 header formats against the
// real bookingids endpoint, to confirm the correct header name.
// (Kept from the original probe.js.)
// ============================================================
router.get('/auth-methods', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set in environment variables.' });
  }

  const testUrl = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=2026-07-01&updated_end=2026-07-08`;

  const headerVariants = [
    { label: 'api-key header', headers: { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' } },
    { label: 'Authorization: Bearer', headers: { Authorization: `Bearer ${GRN_API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } },
    { label: 'Authorization: raw key', headers: { Authorization: GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' } },
    { label: 'x-api-key header', headers: { 'x-api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' } },
    { label: 'apikey (no dash)', headers: { apikey: GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' } },
  ];

  const results = [];
  for (const variant of headerVariants) {
    try {
      const response = await fetch(testUrl, { method: 'GET', headers: variant.headers });
      const status = response.status;
      let bodyPreview;
      try {
        bodyPreview = JSON.stringify(await response.json()).slice(0, 200);
      } catch {
        bodyPreview = '(non-JSON response)';
      }
      results.push({ headerFormat: variant.label, httpStatus: status, bodyPreview });
    } catch (err) {
      results.push({ headerFormat: variant.label, error: err.message });
    }
  }

  res.json({ testUrl, results });
});

// ============================================================
// Route 2: full-access-check — tests every endpoint we care
// about in one pass. Confirmed endpoints (bookingids,
// bookingdetail) give a real permissions answer. Search/Rebook/
// Cancel are UNCONFIRMED guessed paths — a 404 there means
// "wrong URL", not "no access". Real paths for those still
// need to come from Naveen directly.
// ============================================================
const endpoints = [
  { name: 'List Booking IDs', method: 'GET', path: `/hotels/bookingids?updated_start=2026-07-01&updated_end=2026-07-08`, confidence: 'CONFIRMED — real, documented endpoint' },
  { name: 'Booking Detail', method: 'GET', path: SAMPLE_BOOKING_ID ? `/hotels/bookingdetail?booking_id=${SAMPLE_BOOKING_ID}` : `/hotels/bookingdetail?booking_id=TEST`, confidence: 'CONFIRMED — real, documented endpoint' },
  { name: 'Search / Availability (guess 1)', method: 'GET', path: `/hotels/search`, confidence: 'UNCONFIRMED — guessed path, never documented' },
  { name: 'Search / Availability (guess 2)', method: 'GET', path: `/hotels/availability`, confidence: 'UNCONFIRMED — guessed path, never documented' },
  { name: 'Rebooking (guess 1)', method: 'POST', path: `/hotels/rebook`, confidence: 'UNCONFIRMED — guessed path, never documented' },
  { name: 'Rebooking (guess 2)', method: 'POST', path: `/hotels/rebookings`, confidence: 'UNCONFIRMED — guessed path, never documented' },
  { name: 'Cancellation (guess 1)', method: 'POST', path: `/hotels/cancel`, confidence: 'UNCONFIRMED — guessed path, never documented' },
  { name: 'Cancellation (guess 2)', method: 'POST', path: `/hotels/bookingcancel`, confidence: 'UNCONFIRMED — guessed path, never documented' },
];

router.get('/full-access-check', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set in environment variables.' });
  }

  const headers = { 'api-key': GRN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const results = [];

  for (const ep of endpoints) {
    const url = `${GRN_API_BASE_URL}${ep.path}`;
    try {
      const response = await fetch(url, {
        method: ep.method,
        headers,
        body: ep.method === 'POST' ? JSON.stringify({}) : undefined,
      });

      const status = response.status;
      let bodyPreview;
      try {
        bodyPreview = JSON.stringify(await response.json()).slice(0, 200);
      } catch {
        bodyPreview = '(non-JSON response)';
      }

      let interpretation;
      if (status === 401 || status === 403) {
        interpretation = 'Access denied — key does not have permission for this endpoint.';
      } else if (status === 404) {
        interpretation = ep.confidence.startsWith('CONFIRMED')
          ? 'Not found — unexpected for a confirmed endpoint, worth investigating.'
          : 'Not found — likely just means this guessed URL is wrong, NOT that access is denied.';
      } else if (status >= 200 && status < 300) {
        interpretation = 'Success — this endpoint is reachable with this key.';
      } else {
        interpretation = `Unexpected status ${status} — needs manual review.`;
      }

      results.push({ endpoint: ep.name, confidence: ep.confidence, method: ep.method, url, httpStatus: status, interpretation, bodyPreview });
    } catch (err) {
      results.push({ endpoint: ep.name, confidence: ep.confidence, method: ep.method, url, error: err.message, interpretation: 'Request failed to complete — network or DNS issue, not a permissions result.' });
    }
  }

  res.json({
    summary: 'Confirmed endpoints show real access status. Guessed endpoints (Search/Rebook/Cancel) need real paths from Naveen to test properly — a 404 there is not proof of missing access.',
    results,
  });
});


// ============================================================
// Route 3: key-check — a safe diagnostic showing exactly what
// key value is currently loaded on the server, without exposing
// the whole thing. Lets us rule out whitespace, truncation, or
// a stale deployment before assuming it's a permissions issue.
// ============================================================
router.get('/key-check', (req, res) => {
  if (!GRN_API_KEY) {
    return res.json({ keyPresent: false, message: 'GRN_API_KEY is not set at all in this environment.' });
  }
  const raw = GRN_API_KEY;
  res.json({
    keyPresent: true,
    length: raw.length,
    first4: raw.slice(0, 4),
    last4: raw.slice(-4),
    hasLeadingOrTrailingWhitespace: raw !== raw.trim(),
    hasInternalWhitespace: /\s/.test(raw.trim()),
    expectedLength32: raw.trim().length === 32,
  });
});


// ============================================================
// Route 4: my-ip — reveals the actual outbound IP this server
// uses when making requests, so it can be sent to GRN for
// potential IP whitelisting. NOTE: on some Railway plans this
// IP can be shared/dynamic rather than fixed — worth confirming
// with Railway's own docs/support if long-term stability matters.
// ============================================================
router.get('/my-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.json({ outboundIp: data.ip, note: 'This is the IP this server currently uses for outbound requests. Confirm with Railway whether this is fixed or can change.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
