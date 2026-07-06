// backend/utils/grnApiClient.js
//
// Thin wrapper around GRN's Hotels API. All endpoint paths and payload
// shapes here come directly from GRN's own API v3 documentation.
//
// Required environment variables (set in Railway, not committed to git):
//   GRN_API_BASE_URL   — e.g. https://next-api.grnconnect.com/api/v3
//   GRN_API_KEY        — the API key Naveen provides
//
// Every function returns the parsed JSON response, or throws on a
// non-2xx status so callers can catch and log failures cleanly.

const BASE_URL = process.env.GRN_API_BASE_URL;
const API_KEY = process.env.GRN_API_KEY;

if (!BASE_URL || !API_KEY) {
  console.warn(
    '[grnApiClient] GRN_API_BASE_URL or GRN_API_KEY is not set yet. ' +
    'The rebooking engine will not be able to call GRN until these are added in Railway.'
  );
}

async function grnRequest(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'api-key': API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`GRN API returned non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`GRN API ${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

/** GET /hotels/bookings — bulk list of bookings, paginated. */
async function listBookings({ filterType = 'checkin_date', start, end, type = 'B', from, count = 100 }) {
  const params = new URLSearchParams({ filter_type: filterType, start, end, type, count });
  if (from) params.set('from', from);
  return grnRequest('GET', `/hotels/bookings?${params.toString()}`);
}

/** GET /hotels/bookings/{bref}/voucher — used to enrich supplier_code. */
async function getVoucher(bookingReference) {
  return grnRequest('GET', `/hotels/bookings/${bookingReference}/voucher`);
}

/** POST /hotels/availability — search for current rates on a hotel. */
async function searchAvailability({ checkin, checkout, hotelCodes, rooms, currency = 'USD' }) {
  return grnRequest('POST', '/hotels/availability', {
    version: '2.0',
    checkin,
    checkout,
    client_nationality: 'ID',
    currency,
    cutoff_time: 50000,
    hotel_codes: hotelCodes,
    hotel_info: false,
    rates: 'comprehensive',
    rooms,
  });
}

/** POST /hotels/availability/{search_id}/rates/?action=recheck */
async function recheckRate(searchId, rateKey) {
  return grnRequest('POST', `/hotels/availability/${searchId}/rates/?action=recheck`, {
    rate_key: rateKey,
  });
}

/** POST /hotels/rebookings/{booking_reference} — create the rebooking. */
async function createRebooking(bookingReference, payload) {
  return grnRequest('POST', `/hotels/rebookings/${bookingReference}`, payload);
}

/** POST /hotels/rebookings/confirm/{booking_reference} */
async function confirmRebooking(bookingReference) {
  return grnRequest('POST', `/hotels/rebookings/confirm/${bookingReference}`);
}

/** DELETE /hotels/bookings/{bref} — cancel the original booking. reason 1 = "Found lower price on the Internet" */
async function cancelBooking(bookingReference, comments = 'Rebooked at lower rate') {
  return grnRequest('DELETE', `/hotels/bookings/${bookingReference}`, {
    comments,
    reason: 1,
  });
}

module.exports = {
  listBookings,
  getVoucher,
  searchAvailability,
  recheckRate,
  createRebooking,
  confirmRebooking,
  cancelBooking,
};
