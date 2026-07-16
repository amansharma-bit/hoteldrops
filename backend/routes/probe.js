const express = require('express');
const router = express.Router();

const GRN_API_BASE_URL = process.env.GRN_API_BASE_URL || 'https://v4-api.grnconnect.com/api/v3';
const GRN_API_KEY = process.env.GRN_API_KEY;

// Temporary diagnostic — checking real non_refundable field values.
// Not behind login, since this is a one-time check, not a permanent route.
router.get('/nonrefundable-proof', async (req, res) => {
  if (!GRN_API_KEY) {
    return res.status(500).json({ error: 'GRN_API_KEY not set' });
  }
  const listUrl = `${GRN_API_BASE_URL}/hotels/bookingids?updated_start=${encodeURIComponent('2026-06-01 00:00:00')}&updated_end=${encodeURIComponent('2026-07-16 23:59:59')}`;
  const listResp = await fetch(listUrl, {
    headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
  });
  const listData = await listResp.json();
  const candidates = (listData.bookings || []).slice(0, 15);

  const proof = [];
  for (const c of candidates) {
    try {
      const dResp = await fetch(`${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${c.bid}`, {
        headers: { 'api-key': GRN_API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' },
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

module.exports = router;
