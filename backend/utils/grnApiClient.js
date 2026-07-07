// backend/utils/grnApiClient.js
//
// Thin wrapper around GRN's Hotels API.
//
// ── IMPORTANT: real endpoints confirmed by Naveen (INTL bookings only) ──
//   Base URL: https://v4-api.grnconnect.com/api/v3
//   1. GET /hotels/bookingids?updated_start=...&updated_end=...
//      -> lists booking IDs updated in a date range
//   2. GET /hotels/bookingdetail?booking_id=X
//      -> fetches full detail for one booking
//
// These are READ-ONLY lookups of bookings that already exist. We do NOT
// yet have a Search/Availability endpoint (to find current live rates),
// nor Rebooking/Cancellation endpoints (to act on anything). Those
// functions below are kept for when that access arrives, but calling
// them for real will fail until then — only listBookingIds and
// getBookingDetail are confirmed working right now.
//
// ── MOCK MODE ──
// Set MOCK_GRN_API=true to test the FULL pipeline (search/match/rebook)
// against fake data — still useful for validating logic ahead of getting
// full API access. Doesn't affect the two real functions below, which
// always hit the real API regardless of MOCK_GRN_API.
//
// Required environment variables (set in Railway):
//   GRN_API_BASE_URL = https://v4-api.grnconnect.com/api/v3
//   GRN_API_KEY      = (the key Naveen provided)

const MOCK_MODE = process.env.MOCK_GRN_API === 'true';
const BASE_URL = process.env.GRN_API_BASE_URL;
const API_KEY = process.env.GRN_API_KEY;

if (!BASE_URL || !API_KEY) {
  console.warn(
    '[grnApiClient] GRN_API_BASE_URL or GRN_API_KEY is not set. ' +
    'Real endpoint calls (listBookingIds, getBookingDetail) will fail until these are added in Railway.'
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Formats a JS Date as "YYYY-MM-DD HH:MM:SS" — the exact format GRN's
// bookingids endpoint expects (space-separated, not ISO "T" format).
function formatGrnDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function grnRequest(method, path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'api-key': API_KEY, // best guess based on GRN's documented header convention —
                          // adjust here if the real API rejects this
      Accept: 'application/json',
      'Content-Type': 'application/json', // GRN's server requires this even on GET requests
    },
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

// ============================================================================
// REAL, CONFIRMED ENDPOINTS — these actually work right now
// ============================================================================

/**
 * GET /hotels/bookingids — lists booking IDs updated within a date range.
 * In MOCK mode, returns two fake IDs (one eligible, one not) for testing.
 */
async function listBookingIds(updatedStart, updatedEnd) {
  if (MOCK_MODE) {
    await sleep(150);
    return ['MOCKREF001', 'MOCKREF002'];
  }

  const start = encodeURIComponent(formatGrnDateTime(updatedStart));
  const end = encodeURIComponent(formatGrnDateTime(updatedEnd));
  const response = await grnRequest('GET', `/hotels/bookingids?updated_start=${start}&updated_end=${end}`);

  // Defensive: we don't have a confirmed sample response shape for this
  // endpoint yet, so try a few likely field names. If none match, log the
  // raw response so we can see the real shape and fix this on the first try.
  const ids = response.booking_ids || response.data || response.ids || response.bookings;
  if (!ids) {
    console.warn('[listBookingIds] Unrecognized response shape, raw response:', JSON.stringify(response).slice(0, 500));
    return [];
  }
  return ids;
}

/**
 * GET /hotels/bookingdetail — fetches full detail for one booking.
 * In MOCK mode, returns fake detail matching the two fake IDs above.
 */
async function getBookingDetail(bookingId) {
  if (MOCK_MODE) {
    await sleep(100);
    const today = new Date();
    const in10Days = new Date(today); in10Days.setDate(in10Days.getDate() + 10);
    const in13Days = new Date(today); in13Days.setDate(in13Days.getDate() + 13);
    const cancelByDate = new Date(today); cancelByDate.setDate(cancelByDate.getDate() + 8);

    if (bookingId === 'MOCKREF001') {
      return {
        booking_reference: 'MOCKREF001',
        booking_id: 'GRN-MOCK-0001',
        hotel_code: '2435941',
        supplier_code: 'mock_supplier_a',
        checkin: in10Days.toISOString().slice(0, 10),
        checkout: in13Days.toISOString().slice(0, 10),
        non_refundable: false,
        cancellation_policy: { cancel_by_date: cancelByDate.toISOString() },
        booking_price: { amount: 810.0, currency: 'USD' },
        booking_items: [{ room_code: 'ROOM_STD_TWIN_A', rooms: [{ room_type: 'Standard Twin Room' }] }],
      };
    }
    // MOCKREF002 — deliberately non-refundable, should be filtered out as ineligible
    return {
      booking_reference: 'MOCKREF002',
      booking_id: 'GRN-MOCK-0002',
      hotel_code: '2435941',
      supplier_code: 'mock_supplier_a',
      checkin: in10Days.toISOString().slice(0, 10),
      checkout: in13Days.toISOString().slice(0, 10),
      non_refundable: true,
      cancellation_policy: null,
      booking_price: { amount: 450.0, currency: 'USD' },
      booking_items: [{ room_code: 'ROOM_DELUXE_A', rooms: [{ room_type: 'Deluxe Room' }] }],
    };
  }

  return grnRequest('GET', `/hotels/bookingdetail?booking_id=${bookingId}`);
}

// ============================================================================
// NOT YET AVAILABLE — kept for when Search/Rebooking/Cancellation access
// arrives. Calling these for real (MOCK_GRN_API=false) will currently fail,
// since Naveen has only confirmed the two functions above.
// ============================================================================

function mockSearchAvailability({ hotelCodes }) {
  return {
    search_id: 'MOCK_SEARCH_' + hotelCodes[0],
    rates: [
      { supplier: 'mock_supplier_a', room_code: 'ROOM_STD_TWIN_A', rate_key: 'MOCK_RATE_KEY_CHEAPER', price: { amount: 772.0, currency: 'USD' }, non_refundable: false },
      { supplier: 'mock_supplier_a', room_code: 'ROOM_STD_TWIN_A', rate_key: 'MOCK_RATE_KEY_PRICIER', price: { amount: 850.0, currency: 'USD' }, non_refundable: false },
      { supplier: 'mock_supplier_b', room_code: 'ROOM_STD_TWIN_A', rate_key: 'MOCK_RATE_KEY_CROSS_SUPPLIER', price: { amount: 700.0, currency: 'USD' }, non_refundable: false },
      { supplier: 'mock_supplier_a', room_code: 'ROOM_SUITE_A', rate_key: 'MOCK_RATE_KEY_WRONG_ROOM', price: { amount: 600.0, currency: 'USD' }, non_refundable: false },
    ],
  };
}

async function searchAvailability(params) {
  if (MOCK_MODE) { await sleep(200); return mockSearchAvailability(params); }
  throw new Error('searchAvailability: not yet available — waiting on GRN Search/Availability endpoint access.');
}

async function recheckRate(searchId, rateKey) {
  if (MOCK_MODE) { await sleep(150); return { price: { amount: 772.0, currency: 'USD' } }; }
  throw new Error('recheckRate: not yet available — waiting on GRN Search/Availability endpoint access.');
}

async function createRebooking(bookingReference, payload) {
  if (MOCK_MODE) { await sleep(200); return { booking_reference: 'MOCKNEW_' + bookingReference, booking_id: 'GRN-MOCK-NEW-' + Math.floor(Math.random()*100000) }; }
  throw new Error('createRebooking: not yet available — waiting on GRN Rebookings endpoint access.');
}

async function confirmRebooking(bookingReference) {
  if (MOCK_MODE) { await sleep(150); return { status: 'confirmed' }; }
  throw new Error('confirmRebooking: not yet available — waiting on GRN Rebookings endpoint access.');
}

async function cancelBooking(bookingReference, comments) {
  if (MOCK_MODE) { await sleep(150); return { status: 'confirmed', cancellation_reference: 'MOCK_CANCEL_' + Math.floor(Math.random()*100000), cancellation_charges: { amount: 0, currency: 'USD' } }; }
  throw new Error('cancelBooking: not yet available — waiting on GRN Cancellation endpoint access.');
}

module.exports = {
  listBookingIds,
  getBookingDetail,
  searchAvailability,
  recheckRate,
  createRebooking,
  confirmRebooking,
  cancelBooking,
  isMockMode: MOCK_MODE,
};
