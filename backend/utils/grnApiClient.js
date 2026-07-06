// backend/utils/grnApiClient.js
//
// Thin wrapper around GRN's Hotels API. All endpoint paths and payload
// shapes here come directly from GRN's own API v3 documentation.
//
// ── MOCK MODE ────────────────────────────────────────────────────────────
// Set MOCK_GRN_API=true in Railway to run the ENTIRE pipeline against
// realistic fake data instead of GRN's real API — no credentials needed.
// This lets us test the matching logic, the Supabase writes, and the
// dry-run flow completely independently of Naveen's timeline.
//
// The fake data below deliberately includes a same-supplier cheaper rate
// (so the matching logic has something real to find) plus some "noise"
// (other suppliers, non-matching rooms) so the filtering logic actually
// gets exercised, not just handed a trivial case.
//
// Once real credentials arrive, just set MOCK_GRN_API=false (or delete
// the variable) — no code changes needed.
//
// Required environment variables for REAL mode (set in Railway):
//   GRN_API_BASE_URL   — e.g. https://next-api.grnconnect.com/api/v3
//   GRN_API_KEY        — the API key Naveen provides

const MOCK_MODE = process.env.MOCK_GRN_API === 'true';
const BASE_URL = process.env.GRN_API_BASE_URL;
const API_KEY = process.env.GRN_API_KEY;

if (!MOCK_MODE && (!BASE_URL || !API_KEY)) {
  console.warn(
    '[grnApiClient] GRN_API_BASE_URL or GRN_API_KEY is not set, and MOCK_GRN_API is not "true". ' +
    'The rebooking engine cannot call GRN until credentials are added, or set MOCK_GRN_API=true to test with fake data.'
  );
}

if (MOCK_MODE) {
  console.log('[grnApiClient] Running in MOCK MODE — no real GRN API calls will be made.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// ============================================================================
// MOCK DATA — realistic fake responses matching GRN's documented shapes
// ============================================================================

function mockListBookings() {
  const today = new Date();
  const in10Days = new Date(today);
  in10Days.setDate(in10Days.getDate() + 10);
  const in13Days = new Date(today);
  in13Days.setDate(in13Days.getDate() + 13);
  const cancelByDate = new Date(today);
  cancelByDate.setDate(cancelByDate.getDate() + 8);

  return {
    bookings: [
      {
        booking_reference: 'MOCKREF001',
        booking_id: 'GRN-MOCK-0001',
        hotel_code: '2435941',
        checkin: in10Days.toISOString().slice(0, 10),
        checkout: in13Days.toISOString().slice(0, 10),
        non_refundable: false,
        cancellation_policy: { cancel_by_date: cancelByDate.toISOString() },
        booking_price: { amount: 810.0, currency: 'USD' },
        booking_items: [
          {
            room_code: 'ROOM_STD_TWIN_A',
            rooms: [{ room_type: 'Standard Twin Room', no_of_adults: 2, no_of_children: 0 }],
          },
        ],
      },
      {
        booking_reference: 'MOCKREF002',
        booking_id: 'GRN-MOCK-0002',
        hotel_code: '2435941',
        checkin: in10Days.toISOString().slice(0, 10),
        checkout: in13Days.toISOString().slice(0, 10),
        non_refundable: true, // deliberately non-refundable — should be filtered OUT as ineligible
        cancellation_policy: null,
        booking_price: { amount: 450.0, currency: 'USD' },
        booking_items: [
          { room_code: 'ROOM_DELUXE_A', rooms: [{ room_type: 'Deluxe Room', no_of_adults: 2, no_of_children: 0 }] },
        ],
      },
    ],
    next_cursor: null, // one page only, in mock mode
  };
}

function mockSearchAvailability({ hotelCodes }) {
  return {
    search_id: 'MOCK_SEARCH_' + hotelCodes[0],
    rates: [
      // Same-supplier cheaper option — this is the one the matching logic SHOULD pick.
      {
        supplier: 'mock_supplier_a',
        room_code: 'ROOM_STD_TWIN_A',
        rate_key: 'MOCK_RATE_KEY_CHEAPER',
        price: { amount: 772.0, currency: 'USD' },
        non_refundable: false,
      },
      // Same room, but MORE expensive — should be ignored (not cheaper).
      {
        supplier: 'mock_supplier_a',
        room_code: 'ROOM_STD_TWIN_A',
        rate_key: 'MOCK_RATE_KEY_PRICIER',
        price: { amount: 850.0, currency: 'USD' },
        non_refundable: false,
      },
      // Cross-supplier, cheaper still — should be ignored in v1 (same-supplier-only policy).
      {
        supplier: 'mock_supplier_b',
        room_code: 'ROOM_STD_TWIN_A',
        rate_key: 'MOCK_RATE_KEY_CROSS_SUPPLIER',
        price: { amount: 700.0, currency: 'USD' },
        non_refundable: false,
      },
      // Different room entirely — should be ignored (room_code doesn't match).
      {
        supplier: 'mock_supplier_a',
        room_code: 'ROOM_SUITE_A',
        rate_key: 'MOCK_RATE_KEY_WRONG_ROOM',
        price: { amount: 600.0, currency: 'USD' },
        non_refundable: false,
      },
    ],
  };
}

function mockRecheckRate(rateKey) {
  // Simulate the price holding steady on recheck (the common case).
  const priceMap = {
    MOCK_RATE_KEY_CHEAPER: 772.0,
  };
  return {
    price: { amount: priceMap[rateKey] ?? 772.0, currency: 'USD' },
  };
}

function mockCreateRebooking(bookingReference) {
  return {
    booking_reference: 'MOCKNEW_' + bookingReference,
    booking_id: 'GRN-MOCK-NEW-' + Math.floor(Math.random() * 100000),
  };
}

function mockConfirmRebooking() {
  return { status: 'confirmed' };
}

function mockCancelBooking() {
  return {
    status: 'confirmed',
    cancellation_reference: 'MOCK_CANCEL_' + Math.floor(Math.random() * 100000),
    cancellation_charges: { amount: 0, currency: 'USD' },
  };
}

// ============================================================================
// PUBLIC FUNCTIONS — same signatures whether mock or real
// ============================================================================

async function listBookings(params) {
  if (MOCK_MODE) {
    await sleep(150);
    return mockListBookings();
  }
  const query = new URLSearchParams({
    filter_type: params.filterType || 'checkin_date',
    start: params.start,
    end: params.end,
    type: params.type || 'B',
    count: params.count || 100,
  });
  if (params.from) query.set('from', params.from);
  return grnRequest('GET', `/hotels/bookings?${query.toString()}`);
}

async function getVoucher(bookingReference) {
  if (MOCK_MODE) {
    await sleep(100);
    return { supplier_code: 'mock_supplier_a' };
  }
  return grnRequest('GET', `/hotels/bookings/${bookingReference}/voucher`);
}

async function searchAvailability({ checkin, checkout, hotelCodes, rooms, currency = 'USD' }) {
  if (MOCK_MODE) {
    await sleep(200);
    return mockSearchAvailability({ hotelCodes });
  }
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

async function recheckRate(searchId, rateKey) {
  if (MOCK_MODE) {
    await sleep(150);
    return mockRecheckRate(rateKey);
  }
  return grnRequest('POST', `/hotels/availability/${searchId}/rates/?action=recheck`, { rate_key: rateKey });
}

async function createRebooking(bookingReference, payload) {
  if (MOCK_MODE) {
    await sleep(200);
    return mockCreateRebooking(bookingReference);
  }
  return grnRequest('POST', `/hotels/rebookings/${bookingReference}`, payload);
}

async function confirmRebooking(bookingReference) {
  if (MOCK_MODE) {
    await sleep(150);
    return mockConfirmRebooking();
  }
  return grnRequest('POST', `/hotels/rebookings/confirm/${bookingReference}`);
}

async function cancelBooking(bookingReference, comments = 'Rebooked at lower rate') {
  if (MOCK_MODE) {
    await sleep(150);
    return mockCancelBooking();
  }
  return grnRequest('DELETE', `/hotels/bookings/${bookingReference}`, { comments, reason: 1 });
}

module.exports = {
  listBookings,
  getVoucher,
  searchAvailability,
  recheckRate,
  createRebooking,
  confirmRebooking,
  cancelBooking,
  isMockMode: MOCK_MODE,
};
