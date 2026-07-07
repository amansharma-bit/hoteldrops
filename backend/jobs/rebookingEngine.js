// backend/jobs/rebookingEngine.js
//
// The core rebuq rebooking pipeline. Two entry points:
//
//   syncEligibleBookings() — pulls real bookings from GRN (list IDs, then
//     fetch each one's detail) and populates tracked_bookings. This is
//     CONFIRMED WORKING with the access we have today.
//
//   runRebookingEngine() — the full Search -> Match -> Recheck -> Rebook
//     -> Confirm -> Cancel pipeline. Only meaningful in MOCK_GRN_API=true
//     mode right now, since Search/Rebooking/Cancellation endpoints
//     haven't been granted yet. Calling this for real will sync real
//     bookings fine, then log a clear "not yet available" error for each
//     one at the search step — expected, not a bug.
//
// SAFETY: DRY_RUN defaults to true. Nothing real gets rebooked or
// cancelled until it's explicitly set to false in Railway.

const supabase = require('../utils/supabaseClient');
const grn = require('../utils/grnApiClient');

const DRY_RUN = process.env.DRY_RUN !== 'false';
const MIN_SAVING_PERCENT = parseFloat(process.env.MIN_SAVING_PERCENT || '3');
const MIN_LEAD_DAYS = parseInt(process.env.MIN_LEAD_DAYS || '2', 10);
const DELAY_BETWEEN_CALLS_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// STEP 1: Sync bookings from GRN into our own tracked_bookings table.
// Uses the CONFIRMED real pattern: list IDs updated in a date range, then
// fetch full detail for each one individually.
// ---------------------------------------------------------------------------
async function syncEligibleBookings(daysBack = 7) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);

  console.log(`[syncEligibleBookings] Listing bookings updated in the last ${daysBack} days...`);

  const bookingIds = await grn.listBookingIds(startDate, today);
  console.log(`[syncEligibleBookings] Found ${bookingIds.length} booking IDs. Fetching details...`);

  let totalSynced = 0;
  let totalEligible = 0;

  for (const bookingId of bookingIds) {
    let detail;
    try {
      detail = await grn.getBookingDetail(bookingId);
      await sleep(DELAY_BETWEEN_CALLS_MS);
    } catch (err) {
      console.warn(`[syncEligibleBookings] Failed to fetch detail for ${bookingId}: ${err.message}`);
      continue;
    }

    // Defensive field mapping — based on GRN's documented booking shape.
    // If the real response differs, this is the first place to adjust
    // once we see actual output.
    const bookingReference = detail.booking_reference || bookingId;
    const nonRefundable = detail.non_refundable;
    const cancelByDate = detail.cancellation_policy?.cancel_by_date
      ? new Date(detail.cancellation_policy.cancel_by_date)
      : null;
    const checkinDate = detail.checkin ? new Date(detail.checkin) : null;
    const leadDays = checkinDate ? Math.floor((checkinDate - today) / (1000 * 60 * 60 * 24)) : -1;

    const eligible =
      nonRefundable === false &&
      cancelByDate !== null &&
      cancelByDate > today &&
      leadDays >= MIN_LEAD_DAYS;

    if (eligible) totalEligible++;

    const { error } = await supabase.from('tracked_bookings').upsert(
      {
        booking_reference: bookingReference,
        booking_id: detail.booking_id || bookingId,
        hotel_code: detail.hotel_code || null,
        supplier_code: detail.supplier_code || null,
        room_code: detail.booking_items?.[0]?.room_code || null,
        room_type: detail.booking_items?.[0]?.rooms?.[0]?.room_type || null,
        checkin_date: detail.checkin || null,
        checkout_date: detail.checkout || null,
        price_amount: detail.booking_price?.amount ?? null,
        price_currency: detail.booking_price?.currency ?? null,
        non_refundable: nonRefundable ?? null,
        cancel_by_date: cancelByDate,
        eligible,
        status: eligible ? 'eligible' : 'not_eligible',
        last_checked_at: new Date().toISOString(),
        is_mock: grn.isMockMode,
      },
      { onConflict: 'booking_reference' }
    );

    if (error) {
      console.error(`[syncEligibleBookings] Failed to upsert ${bookingReference}:`, error.message);
    } else {
      totalSynced++;
    }
  }

  console.log(`[syncEligibleBookings] Synced ${totalSynced} bookings (${totalEligible} eligible).`);
  return { totalSynced, totalEligible, totalFound: bookingIds.length };
}

// ---------------------------------------------------------------------------
// STEP 2: Process one eligible booking through the full pipeline.
// NOTE: the Search step below will throw "not yet available" in real mode
// until GRN grants Search/Availability access — this is expected right now.
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
    attempt.search_started_at = new Date().toISOString();
    const searchResult = await grn.searchAvailability({
      checkin: tracked.checkin_date,
      checkout: tracked.checkout_date,
      hotelCodes: [tracked.hotel_code],
      rooms: [{ adults: 2, children_ages: [] }],
    });
    attempt.search_id = searchResult.search_id;
    attempt.raw_search_response = searchResult;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    const originalSupplier = tracked.supplier_code;
    const rates = searchResult.rates || [];
    const sameSupplierRates = rates.filter((r) => r.supplier === originalSupplier);
    const candidates = sameSupplierRates.length > 0 ? sameSupplierRates : [];

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

    const recheck = await grn.recheckRate(attempt.search_id, cheaper.rate_key);
    attempt.recheck_completed_at = new Date().toISOString();
    attempt.recheck_price_changed = recheck.price?.amount !== cheaper.price.amount;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    if (attempt.recheck_price_changed && recheck.price.amount >= tracked.price_amount) {
      attempt.state = 'no_match_found';
      await logAttempt(attempt);
      return { status: 'price_changed_no_longer_cheaper', bookingReference: tracked.booking_reference };
    }

    attempt.client_profit_amount = tracked.price_amount - (recheck.price?.amount ?? cheaper.price.amount);
    attempt.client_profit_currency = tracked.price_currency;

    if (DRY_RUN) {
      attempt.state = 'pending';
      attempt.error_message = '[DRY_RUN] Would have rebooked + cancelled original. No live action taken.';
      await logAttempt(attempt);
      return { status: 'dry_run_match_found', bookingReference: tracked.booking_reference, savingPercent };
    }

    const rebook = await grn.createRebooking(tracked.booking_reference, {
      rate_key: cheaper.rate_key,
      room_code: cheaper.room_code,
    });
    attempt.rebook_confirmed_at = new Date().toISOString();
    attempt.new_booking_reference = rebook.booking_reference;
    attempt.new_booking_id = rebook.booking_id;
    attempt.raw_rebook_response = rebook;
    await sleep(DELAY_BETWEEN_CALLS_MS);

    await grn.confirmRebooking(tracked.booking_reference);
    await sleep(DELAY_BETWEEN_CALLS_MS);

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
// Full pipeline orchestrator (sync + process). In real mode today, each
// processBooking() call will log an expected "not yet available" error at
// the search step — use runSyncOnly() below instead if you just want to
// pull real bookings without those expected errors cluttering the log.
// ---------------------------------------------------------------------------
async function runRebookingEngine() {
  console.log(`[runRebookingEngine] Starting. DRY_RUN=${DRY_RUN} MOCK=${grn.isMockMode}`);

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

// ---------------------------------------------------------------------------
// Sync-only entry point — real bookings in, no search/rebook attempted.
// This is the one to use for real data right now, until Search access lands.
// ---------------------------------------------------------------------------
async function runSyncOnly(daysBack = 7) {
  console.log(`[runSyncOnly] Starting real sync only (no search/rebook attempted). MOCK=${grn.isMockMode}`);
  const result = await syncEligibleBookings(daysBack);
  console.log('[runSyncOnly] Done.', result);
  return result;
}

module.exports = { runRebookingEngine, syncEligibleBookings, processBooking, runSyncOnly };
