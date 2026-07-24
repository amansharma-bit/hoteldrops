// ===========================================================================
// PATCH — backend/routes/hotels-live-search.js
// Apply this inside the EXISTING /repricing/searches route.
// Two small, additive changes. Nothing else in the file moves.
// ===========================================================================

// --- CHANGE 1 ---
// Find this line inside router.get('/repricing/searches', ...):
//
//   const { rows: checks, total } = await sbSelect('grn_price_checks',
//     `select=id,booking_id,checked_at,original_usd,live_usd,dropped,gap_usd,gap_pct,room_match,board_match,dates_match`
//     + `&order=checked_at.desc&offset=${offset}&limit=${perPage}`,
//     { 'Prefer': 'count=exact' });
//
// Replace with (adds original_price/currency, live_price/currency, and raw —
// raw already stores { ...matchedRate, _match_basis } from the check, we just
// weren't selecting it before):

const { rows: checks, total } = await sbSelect('grn_price_checks',
  `select=id,booking_id,checked_at,original_price,original_currency,original_usd,`
  + `live_price,live_currency,live_usd,dropped,gap_usd,gap_pct,room_match,board_match,dates_match,raw`
  + `&order=checked_at.desc&offset=${offset}&limit=${perPage}`,
  { 'Prefer': 'count=exact' });


// --- CHANGE 2 ---
// Find the `rows: checks.map((c) => { ... })` block near the bottom of the
// same route and replace the returned object with this (adds originalLocal/
// Currency, liveLocal/Currency, boardMatch, datesMatch, matchBasis, and the
// room/board strings pulled off the matched rate in `raw` — everything the
// expand panel needs, nothing invented):

      rows: checks.map((c) => {
        const b = info[c.booking_id] || {};
        const actionable = c.dropped && c.room_match === true && c.dates_match === true;
        const matchedRate = c.raw || {};
        return {
          id: c.id,
          bookingId: c.booking_id,
          hotel: b.hotel_name || c.booking_id,
          city: b.city_name || null,
          room: b.room_type || null,
          checkedAt: c.checked_at,

          originalLocal: c.original_price != null ? Number(c.original_price) : null,
          originalCurrency: c.original_currency || null,
          originalUsd: c.original_usd,

          liveLocal: c.live_price != null ? Number(c.live_price) : null,
          liveCurrency: c.live_currency || null,
          liveUsd: c.live_usd,
          liveRoom: matchedRate?.rooms?.[0]?.room_type || matchedRate?.rooms?.[0]?.description || null,
          liveBoard: matchedRate?.boarding_details ? matchedRate.boarding_details.join(', ') : null,

          dropped: c.dropped,
          gapUsd: c.gap_usd,
          gapPct: c.gap_pct,

          roomMatch: c.room_match,
          boardMatch: c.board_match,
          datesMatch: c.dates_match,
          matchBasis: matchedRate?._match_basis || null,

          actionable,
          result: c.live_usd == null ? 'sold_out' : c.dropped ? (actionable ? 'drop_actionable' : 'drop_different_room') : (c.gap_usd != null && c.gap_usd < 0 ? 'higher' : 'no_drop'),
        };
      }),
