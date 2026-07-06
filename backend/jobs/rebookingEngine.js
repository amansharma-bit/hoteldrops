// backend/jobs/rebookingEngine.js
//
// The core rebuq rebooking pipeline: Search -> Match -> Recheck -> Rebook
// -> Confirm -> Cancel original. Mirrors the exact sequence documented in
// GRN's own API docs, and matches the same-supplier-first matching rule
// validated against real GRN/Hotelmize data (98.6% of real rebookings
// stay on the same supplier).
//
// SAFETY: this file defaults to DRY_RUN mode. In dry-run, it does
// everything EXCEPT actually call Rebook/Confirm/Cancel — it logs what it
// WOULD do, and writes a rebooking_attempts row with state='pending' and
// a note, so you can review a batch of proposed actions before ever
// letting it touch a real booking.
//
// To go live: set DRY_RUN=false in Railway's environment variables.
// Recommended path: dry-run first, review results, then manual-approve
// mode (not yet built — ask before skipping straight to full automation).

const supabase = require('../utils/supabaseClient');
const grn = require('../utils/grnApiClient');

const DRY_RUN = process.env.DRY_RUN !== 'false'; // defaults to true unless explicitly disabled
const MIN_SAVING_PERCENT = parseFloat(process.env.MIN_SAVING_PERCENT || '3'); // don't bother under this %
const MIN_LEAD_DAYS = parseInt(process.env.MIN_LEAD_DAYS || '2', 10); // skip bookings checking in within N days
const DELAY_BETWEEN_CALLS_MS = 400; // be a good citizen on GRN's API even though no hard limit is documented

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// STEP 1: Sync eligible bookings from GRN into our own tracked_bookings table
// ---------------------------------------------------------------------------
async function syncEligibleBookings() {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  const end = endDate.toISOString().slice(0, 10);

  console.log(`[syncEligibleBookings] Pulling bookings checking in ${start} to ${end}...`);

  let cursor = undefined;
  let totalSynced = 0;

  do {
    const page = await grn.listBookings({ start, end, from: cursor, count: 100 });
    const bookings = page.bookings || page.data || [];

    for (const b of bookings) {
      const cancelByDate = b.cancellation_policy?.cancel_by_date
        ? new Date(b.cancellation_policy.cancel_by_date)
        : null;

      const checkinDate = new Date(b.checkin);
      const leadDays = Math.floor((checkinDate - today) / (1000 * 60 * 60 * 24));

      const eligible =
        b.non_refundable === false &&
        cancelByDate !== null &&
        cancelByDate > today &&
        leadDays >= MIN_LEAD_DAYS;

      // supplier_code isn't in the bulk bookings list — only the voucher
      // endpoint returns it. Only worth the extra call for bookings that
      // are actually eligible, to avoid wasting calls on ones we'll skip anyway.
      let supplierCode = null;
      if (eligible) {
        try {
          const voucher = await grn.getVoucher(b.booking_reference);
          supplierCode = voucher.supplier_code || null;
          await sleep(DELAY_BETWEEN_CALLS_MS);
        } catch (err) {
          console.warn(`[syncEligibleBookings] Voucher lookup failed for ${b.booking_reference}: ${err.message}`);
        }
      }

      await supabase.from('tracked_bookings').upsert(
        {
          booking_reference: b.booking_reference,
          booking_id: b.booking_id,
          hotel_code: b.hotel_code,
          supplier_code: supplierCode,
          room_code: b.booking_items?.[0]?.room_code || null,
          room_type: b.booking_items?.[0]?.rooms?.[0]?.room_type || null,
          checkin_date: b.checkin,
          checkout_date: b.checkout,
          price_amount: b.booking_price?.amount,
          price_currency: b.booking_price?.currency,
          non_refundable: b.non_refundable,
          cancel_by_date: cancelByDate,
          eligible,
          status: eligible ? 'eligible' : 'not_eligible',
          last_checked_at: new Date().toISOString(),
          is_mock: grn.isMockMode,
        },
        { onConflict: 'booking_reference' }
      );
      totalSynced++;
    }

    cursor = page.next_cursor || null; // adjust field name once real response shape is confirmed
    await sleep(DELAY_BETWEEN_CALLS_MS);
  } while (cursor);

  console.log(`[syncEligibleBookings] Synced ${totalSynced} bookings.`);
  return totalSynced;
}

// ---------------------------------------------------------------------------
// STEP 2: Process one eligible booking through the full pipeline
// ---------------------------------------------------------------------------
async function processBooking(tracked) {
  const attempt = {
    tracked_booking_id: tracked.id,
    original_booking_reference: tracked.booking_reference,
    original_price_amount: tracked.price_amount,
    original_price_currency: tracked.price_currency,
    state: 'pending',
    is_mock: grn.isMockMode,
  };

  try {
    // ---- Search ----
    attempt.search_started_at = new Date().toISOString();
    const searchResult = await grn.searchAvailability({
      checkin: tracked.checkin_date,
      checkout: tracked.checkout_date,
      hotelCodes: [tracked.hotel_code],
      rooms: [{ adults: 2, children_ages: [] }], // TODO: pull real occupancy once available in tracked_bookings
    });
    attempt.search_id = searchResult.search_id;
    attempt.raw_search_response = searchResult;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    // ---- Match: same-supplier-first, per validated real-world pattern ----
    const originalSupplier = tracked.supplier_code;
    const rates = searchResult.rates || [];
    const sameSupplierRates = rates.filter((r) => r.supplier === originalSupplier);
    const candidates = sameSupplierRates.length > 0 ? sameSupplierRates : []; // cross-supplier disabled by default in v1

    const cheaper = candidates
      .filter((r) => r.room_code === tracked.room_code && r.price?.amount < tracked.price_amount)
      .sort((a, b) => a.price.amount - b.price.amount)[0];

    if (!cheaper) {
      attempt.state = 'no_match_found';
      await logAttempt(attempt);
      return { status: 'no_match', bookingReference: tracked.booking_reference };
    }

    const savingPercent = ((tracked.price_amount - cheaper.price.amount) / tracked.price_amount) * 100;
    if (savingPercent < MIN_SAVING_PERCENT) {
      attempt.state = 'no_match_found';
      await logAttempt(attempt);
      return { status: 'below_threshold', bookingReference: tracked.booking_reference, savingPercent };
    }

    attempt.rate_detected_at = new Date().toISOString();
    attempt.matched_rate_key = cheaper.rate_key;
    attempt.matched_supplier_code = cheaper.supplier;
    attempt.matched_room_code = cheaper.room_code;
    attempt.matched_price_amount = cheaper.price.amount;
    attempt.matched_price_currency = cheaper.price.currency;
    attempt.match_type = 'same_supplier';

    // ---- Recheck ----
    const recheck = await grn.recheckRate(attempt.search_id, cheaper.rate_key);
    attempt.recheck_completed_at = new Date().toISOString();
    attempt.recheck_price_changed = recheck.price?.amount !== cheaper.price.amount;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    if (attempt.recheck_price_changed && recheck.price.amount >= tracked.price_amount) {
      // Price moved and is no longer actually cheaper — abort safely.
      attempt.state = 'no_match_found';
      await logAttempt(attempt);
      return { status: 'price_changed_no_longer_cheaper', bookingReference: tracked.booking_reference };
    }

    attempt.client_profit_amount = tracked.price_amount - (recheck.price?.amount ?? cheaper.price.amount);
    attempt.client_profit_currency = tracked.price_currency;

    // ---- DRY RUN: stop here, log what we WOULD have done ----
    if (DRY_RUN) {
      attempt.state = 'pending';
      attempt.error_message = '[DRY_RUN] Would have rebooked + cancelled original. No live action taken.';
      await logAttempt(attempt);
      return { status: 'dry_run_match_found', bookingReference: tracked.booking_reference, savingPercent };
    }

    // ---- Rebook ----
    const rebook = await grn.createRebooking(tracked.booking_reference, {
      rate_key: cheaper.rate_key,
      room_code: cheaper.room_code,
    });
    attempt.rebook_confirmed_at = new Date().toISOString();
    attempt.new_booking_reference = rebook.booking_reference;
    attempt.new_booking_id = rebook.booking_id;
    attempt.raw_rebook_response = rebook;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    // ---- Confirm ----
    await grn.confirmRebooking(tracked.booking_reference);
    await sleep(DELAY_BETWEEN_CALLS_MS);

    // ---- Cancel original ----
    const cancellation = await grn.cancelBooking(tracked.booking_reference);
    attempt.original_cancelled_at = new Date().toISOString();
    attempt.cancellation_reference = cancellation.cancellation_reference;
    attempt.cancellation_charge_amount = cancellation.cancellation_charges?.amount ?? 0;
    attempt.raw_cancel_response = cancellation;

    attempt.state = attempt.cancellation_charge_amount === 0 ? 'ok' : 'error';
    if (attempt.state === 'error') {
      attempt.error_message = `Cancellation charge was non-zero: ${attempt.cancellation_charge_amount}`;
    }

    await logAttempt(attempt);
    await supabase.from('tracked_bookings').update({ status: 'attempted' }).eq('id', tracked.id);

    return { status: attempt.state, bookingReference: tracked.booking_reference, savingPercent };
  } catch (err) {
    attempt.state = 'error';
    attempt.error_message = err.message;
    await logAttempt(attempt);
    return { status: 'error', bookingReference: tracked.booking_reference, error: err.message };
  }
}

async function logAttempt(attempt) {
  const { error } = await supabase.from('rebooking_attempts').insert(attempt);
  if (error) {
    console.error('[logAttempt] Failed to write rebooking_attempts row:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Orchestrator — call this from a route or a scheduled job
// ---------------------------------------------------------------------------
async function runRebookingEngine() {
  console.log(`[runRebookingEngine] Starting. DRY_RUN=${DRY_RUN}`);

  await syncEligibleBookings();

  const { data: eligibleBookings, error } = await supabase
    .from('tracked_bookings')
    .select('*')
    .eq('status', 'eligible')
    .eq('eligible', true);

  if (error) {
    console.error('[runRebookingEngine] Failed to fetch eligible bookings:', error.message);
    return { error: error.message };
  }

  console.log(`[runRebookingEngine] Processing ${eligibleBookings.length} eligible bookings...`);

  const results = [];
  for (const booking of eligibleBookings) {
    const result = await processBooking(booking);
    results.push(result);
    await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    dryRunMatches: results.filter((r) => r.status === 'dry_run_match_found').length,
    noMatch: results.filter((r) => r.status === 'no_match' || r.status === 'below_threshold').length,
    errors: results.filter((r) => r.status === 'error').length,
  };

  console.log('[runRebookingEngine] Done.', summary);
  return { summary, results };
}

module.exports = { runRebookingEngine, syncEligibleBookings, processBooking };
