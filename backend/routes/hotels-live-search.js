// One GRN GET with a single 429-aware retry and a hard timeout. Returns parsed
// JSON or throws. Keeps every call polite so a sync never triggers a rate storm.
async function grnGetJson(url, { retries = 1, timeoutMs = 30000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let resp, timedOut = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
    try {
      resp = await fetch(url, { headers: GRN_HEADERS(), signal: ctrl.signal });
    } catch (e) {
      clearTimeout(timer);
      if (attempt < retries) { await sleep(1500 * (attempt + 1)); continue; }
      throw new Error(timedOut ? `timeout after ${timeoutMs}ms` : String(e.message || e));
    }
    clearTimeout(timer);
    if (resp.status === 429 && attempt < retries) { await sleep(2000 * (attempt + 1)); continue; }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }
}

// Sync ONE date window using the PROVEN endpoint chain.
//
// WHY THIS CHANGED (2026-07-30):
//   The old syncWindow used GET /hotels/bookings?filter_type=booking_date, which
//   returns zero bookings for this key (last run logged "0 bookings synced ...
//   1 GRN call"). It silently returned empty, so the table stopped growing on
//   18 July. The endpoints that DO work — proven live today by /dashboard-real
//   and the /nonrefundable-proof probe — are /hotels/bookingids + bookingdetail.
//   Filtering by UPDATED date also naturally captures cancellations on older
//   bookings, keeping rebookable value honest.
//
// Signature and return shape are IDENTICAL to the old function, so runSync's
// call — syncWindow(cursor, cappedEnd, remainingBudget, onProgress) expecting
// { rows, calls } — works unchanged.
async function syncWindow(windowStart, windowEnd, callBudget, onProgress) {
  let callsUsed = 0, rowsLanded = 0;

  // 1) LIST — booking ids updated in this window (the endpoint that works).
  const listUrl =
    `${GRN_API_BASE_URL}/hotels/bookingids` +
    `?updated_start=${encodeURIComponent(fmtGrn(windowStart))}` +
    `&updated_end=${encodeURIComponent(fmtGrn(windowEnd))}`;

  let listData;
  try {
    listData = await grnGetJson(listUrl);
    callsUsed++;
  } catch (e) {
    throw new Error(`GRN /hotels/bookingids failed: ${String(e.message || e)}`);
  }
  if (listData && (listData.error || listData.error_code)) {
    throw new Error(`GRN bookingids error: ${JSON.stringify(listData).slice(0, 200)}`);
  }

  const list = Array.isArray(listData?.bookings) ? listData.bookings : [];
  if (list.length === 0) return { rows: 0, calls: callsUsed };

  // Collect unique bids, capped to the remaining call budget for detail fetches.
  const bids = [];
  for (const item of list) {
    const bid = item?.bid || item?.booking_id || null;
    if (bid) bids.push(bid);
  }
  const remaining = Math.max(0, callBudget - callsUsed);
  const toFetch = bids.slice(0, remaining);

  // 2) DETAIL — full record per bid, concurrency-limited + wall-clock deadline.
  const deadlineTs = Date.now() + 90000;
  const { results } = await mapWithConcurrency(toFetch, 5, deadlineTs, async (bid) => {
    const detailUrl = `${GRN_API_BASE_URL}/hotels/bookingdetail?booking_id=${encodeURIComponent(bid)}`;
    try {
      const d = await grnGetJson(detailUrl);
      return d?.booking || null;   // one bad booking must never kill the run
    } catch {
      return null;
    }
  });
  callsUsed += toFetch.length;

  // 3) Build rows (unchanged toRow — it built the existing 108k rows) and upsert.
  const rows = [];
  for (const b of results) {
    if (!b || !b.booking_id) continue;
    const cityName = await getCityName(b.hotel?.city_code);
    rows.push(toRow(b, cityName));
  }
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    await sbUpsert('grn_bookings', rows.slice(i, i + UPSERT_BATCH), 'booking_id');
  }
  rowsLanded += rows.length;
  if (onProgress) await onProgress(rowsLanded);

  return { rows: rowsLanded, calls: callsUsed };
}
