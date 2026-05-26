// backend/jobs/priceTracker.js
// PATCHED: Like-for-like comparison + email notifications

const { createClient } = require('@supabase/supabase-js')
const { checkHotelPrice, findHotelCode, getDestinationCode, getHotelRooms, sleep } = require('../utils/hotelbeds')
const { sendWhatsAppAlert, sendEmailAlert } = require('../utils/notifications')
const { calculateOffer } = require('../utils/margins')
const email = require('../utils/emailService')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const EUR_TO_INR = 112

async function runPriceTracker() {
  console.log('\n🤖 ===== Price Tracker Started =====')
  console.log(`⏰ ${new Date().toISOString()}`)
  let checked = 0, dropsFound = 0, errors = 0, mapped = 0

  try {
    const now = new Date().toISOString()
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tracking_active', true)
      .in('status', ['pending', 'tracking'])
      .not('status', 'eq', 'non-refundable')
      .or(`next_check_at.is.null,next_check_at.lte.${now}`)
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error
    if (!bookings?.length) {
      console.log('📭 No bookings due\n')
      return { checked: 0, dropsFound: 0 }
    }

    console.log(`📋 Processing ${bookings.length} bookings...\n`)

    for (const booking of bookings) {
      try {
        const result = await processBooking(booking)
        checked++
        if (result?.drop)   dropsFound++
        if (result?.mapped) mapped++
        await sleep(600)
      } catch (err) {
        console.error(`❌ Booking ${booking.id}:`, err.message)
        errors++
        await supabase.from('price_checks').insert({
          booking_id:            booking.id,
          found_drop:            false,
          is_comparable:         false,
          not_comparable_reason: err.message,
        })
        await updateNextCheck(booking.id, 6)
      }
    }

    console.log(`\n✅ Done: ${checked} checked, ${dropsFound} drops, ${mapped} mapped, ${errors} errors`)
    return { checked, dropsFound, mapped, errors }
  } catch (err) {
    console.error('❌ Fatal:', err)
    throw err
  }
}

async function processBooking(booking) {
  console.log(`\n🔍 [${booking.hotel_name}] — ${booking.hotel_city}`)
  let didMap = false

  // ── Expired ───────────────────────────────────────────────────────────────
  if (new Date(booking.check_in) <= new Date()) {
    await supabase.from('bookings').update({ status: 'expired', tracking_active: false }).eq('id', booking.id)
    console.log(`  ⏰ Expired`)

    // Send check-in passed email
    if (booking.email) {
      try {
        const checksRun = await getChecksCount(booking.id)
        const alertsSent = await getAlertsCount(booking.id)
        if (alertsSent > 0) {
          await email.checkinPassed(booking.email, {
            name: booking.email.split('@')[0],
            booking: {
              hotelName:    booking.hotel_name,
              checkinDate:  booking.check_in,
              checkoutDate: booking.check_out,
            },
            checksRun,
            alertsSent,
          })
        } else {
          await email.noSavingFound(booking.email, {
            name: booking.email.split('@')[0],
            booking: {
              hotelName:    booking.hotel_name,
              checkinDate:  booking.check_in,
              checkoutDate: booking.check_out,
            },
            checksRun,
          })
        }
      } catch (e) { console.error('Check-in passed email failed:', e.message) }
    }
    return {}
  }

  // ── Cancellation deadline passed ──────────────────────────────────────────
  if (booking.cancellation_deadline && new Date(booking.cancellation_deadline) < new Date()) {
    console.log(`  🔒 Cancellation deadline passed — stopping tracking`)
    await supabase.from('bookings').update({
      status:          'non-refundable',
      tracking_active: false,
    }).eq('id', booking.id)
    return {}
  }

  // ── Cancellation deadline is TODAY — send urgent alert ───────────────────
  if (booking.cancellation_deadline && booking.email) {
    const deadlineDay = new Date(booking.cancellation_deadline)
    deadlineDay.setHours(0,0,0,0)
    const today = new Date()
    today.setHours(0,0,0,0)
    if (deadlineDay.getTime() === today.getTime()) {
      try {
        await email.cancellationWindowToday(booking.email, {
          name: booking.email.split('@')[0],
          booking: {
            hotelName:    booking.hotel_name,
            checkinDate:  booking.check_in,
            amountPaid:   booking.total_price_paid,
            bestRate:     null,
            potentialSaving: null,
          },
          deadline: new Date(booking.cancellation_deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        })
        console.log(`  📧 Cancellation deadline today email sent`)
      } catch (e) { console.error('Cancellation today email failed:', e.message) }
    }
  }

  // ── Map hotel to Hotelbeds code if not done ───────────────────────────────
  if (!booking.hotelbeds_hotel_code) {
    const destCode = getDestinationCode(booking.hotel_city)
    if (!destCode) {
      console.log(`  ⚠️  No dest code for "${booking.hotel_city}"`)
      await updateNextCheck(booking.id, 12)
      return {}
    }
    console.log(`  🗺️  Mapping → ${destCode}`)
    const hotelCode = await findHotelCode(booking.hotel_name, destCode)
    if (hotelCode) {
      await supabase.from('bookings').update({ hotelbeds_hotel_code: hotelCode, status: 'tracking' }).eq('id', booking.id)
      booking.hotelbeds_hotel_code = hotelCode
      didMap = true
      console.log(`  ✅ Mapped: ${hotelCode}`)
    } else {
      console.log(`  ⚠️  No match — retry in 12hrs`)
      await updateNextCheck(booking.id, 12)
      return {}
    }
  }

  // ── Fetch ALL rooms ───────────────────────────────────────────────────────
  console.log(`  💰 Checking price (${booking.hotelbeds_hotel_code})...`)

  let rooms = []
  try {
    rooms = await getHotelRooms({
      hotelCode: booking.hotelbeds_hotel_code,
      checkIn:   booking.check_in,
      checkOut:  booking.check_out,
      adults:    booking.num_adults   || 2,
      children:  booking.num_children || 0,
      rooms:     booking.num_rooms    || 1,
    })
  } catch (e) {
    console.error('  ❌ Rooms fetch failed:', e.message)
    await updateNextCheck(booking.id, 6)
    return { mapped: didMap }
  }

  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + 6 * 3600000).toISOString(),
    status:          'tracking',
  }).eq('id', booking.id)

  if (!rooms.length) {
    console.log(`  ❓ No availability`)
    await supabase.from('price_checks').insert({
      booking_id:            booking.id,
      found_drop:            false,
      is_comparable:         false,
      not_comparable_reason: 'No availability from Hotelbeds',
    })
    return { mapped: didMap }
  }

  // ── Find best comparable rate ─────────────────────────────────────────────
  const originalPrice = parseFloat(booking.total_price_paid || booking.original_price)
  let bestComparableRate  = null
  let bestComparablePrice = Infinity

  for (const room of rooms) {
    for (const rate of (room.rates || [])) {
      const priceEUR = parseFloat(rate.net || 0)
      if (priceEUR <= 0) continue

      const priceINR = Math.round(priceEUR * EUR_TO_INR)
      const { isComparable, reason } = checkComparability(booking, room, rate)

      await supabase.from('price_checks').insert({
        booking_id:                    booking.id,
        checked_price:                 priceINR,
        currency:                      'INR',
        found_drop:                    isComparable && priceINR < originalPrice,
        room_type_checked:             room.name || room.code,
        board_basis_checked:           rate.boardCode,
        rate_plan_checked:             rate.rateClass || rate.rateType,
        cancellation_policy_checked:   deriveCancellationPolicy(rate),
        cancellation_deadline_checked: rate.cancellationPolicies?.[0]?.dateFrom?.split('T')[0] || null,
        is_comparable:                 isComparable,
        not_comparable_reason:         reason || null,
      })

      if (!isComparable) {
        console.log(`  ⏭️  Not comparable: ${reason}`)
        continue
      }

      if (priceINR < bestComparablePrice) {
        bestComparablePrice = priceINR
        bestComparableRate  = { room, rate, priceINR }
      }
    }
  }

  if (!bestComparableRate) {
    console.log(`  ❌ No comparable rate found`)
    return { mapped: didMap }
  }

  const { priceINR: foundPrice } = bestComparableRate
  const isDrop     = foundPrice < originalPrice
  const dropAmount = originalPrice - foundPrice
  const dropPct    = ((dropAmount / originalPrice) * 100).toFixed(1)

  console.log(`  📊 Original: ₹${originalPrice.toLocaleString('en-IN')} | Found: ₹${foundPrice.toLocaleString('en-IN')} | ${isDrop ? `✅ DROP ${dropPct}%` : '❌ No drop'}`)

  if (isDrop && dropAmount >= 500 && parseFloat(dropPct) >= 3) {
    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('booking_id', booking.id)
      .in('status', ['pending', 'sent'])
      .limit(1)

    if (existing?.length) {
      console.log(`  ⏭️  Offer already exists`)
      return { mapped: didMap }
    }

    const offer = await calculateOffer({ originalPrice, supplierPrice: foundPrice, bookingId: booking.id })
    console.log(`  🎯 Offer: ₹${offer.offerPrice} | Save: ₹${offer.customerSaving} | Earn: ₹${offer.ourMargin}`)

    const { data: savedOffer } = await supabase.from('offers').insert({
      booking_id:        booking.id,
      supplier_price:    foundPrice,
      offer_price:       offer.offerPrice,
      original_price:    originalPrice,
      customer_saving:   offer.customerSaving,
      our_margin:        offer.ourMargin,
      margin_percentage: offer.marginPercentage,
      status:            'pending',
      expires_at:        new Date(Date.now() + 24 * 3600000).toISOString(),
    }).select().single()

    await supabase.from('bookings').update({ status: 'drop_found' }).eq('id', booking.id)
    await sendAlerts(booking, savedOffer, offer, bestComparableRate)
    return { drop: true, mapped: didMap }
  }

  return { mapped: didMap }
}

// ─── Like-for-like comparability check ───────────────────────────────────────
function checkComparability(booking, room, rate) {
  const reasons = []

  if (booking.board_basis && rate.boardCode) {
    if (booking.board_basis !== rate.boardCode)
      reasons.push(`Board: ${booking.board_basis}→${rate.boardCode}`)
  }

  if (booking.room_type && room.name) {
    const bookedWords  = tokenise(booking.room_type)
    const currentWords = tokenise(room.name)
    const overlap      = bookedWords.filter(w => currentWords.includes(w))
    if (overlap.length === 0)
      reasons.push(`Room: "${booking.room_type}"→"${room.name}"`)
  }

  if (booking.cancellation_policy === 'free') {
    const newPolicy = deriveCancellationPolicy(rate)
    if (newPolicy === 'non-refundable')
      reasons.push(`Policy downgrade: free→non-refundable`)
  }

  return { isComparable: reasons.length === 0, reason: reasons.join('; ') }
}

function tokenise(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 2 && !['the', 'and', 'with', 'for'].includes(w))
}

function deriveCancellationPolicy(rate) {
  if (!rate.cancellationPolicies || rate.cancellationPolicies.length === 0)
    return 'non-refundable'
  const futurePolicy = rate.cancellationPolicies.find(p => new Date(p.dateFrom) > new Date())
  return futurePolicy ? 'free' : 'non-refundable'
}

// ─── Helper: count checks and alerts for a booking ───────────────────────────
async function getChecksCount(bookingId) {
  const { count } = await supabase
    .from('price_checks')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
  return count || 0
}

async function getAlertsCount(bookingId) {
  const { count } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('status', 'sent')
  return count || 0
}

// ─── Send WhatsApp + email alerts ─────────────────────────────────────────────
async function sendAlerts(booking, savedOffer, offerData, comparableRate) {
  const phone = booking.phone
  if (!phone) return

  const nights = booking.total_nights ||
    Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000)

  const cancelDeadline = booking.cancellation_deadline
    ? new Date(booking.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const cancelLine = (() => {
    if (booking.cancellation_policy === 'free' && cancelDeadline)
      return `⚠️ Free cancel until: *${cancelDeadline}* — rebook before then!`
    if (booking.cancellation_policy === 'partial')
      return `⚠️ Partial refund applies — check terms before rebooking`
    return `✅ You can cancel and rebook safely`
  })()

  const mealLine     = booking.board_basis_label ? `🍽️ ${booking.board_basis_label}` : ''
  const childrenLine = (booking.children_ages?.length > 0)
    ? `\n👶 Children: ${booking.children_ages.map(a => a ? `${a} yrs` : 'age TBD').join(', ')}`
    : ''

  const hotelPageUrl = `${process.env.FRONTEND_URL}/offer/${savedOffer.id}`

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const msg = `💰 *Price Drop Alert — rebuq*

*${booking.hotel_name}*
📍 ${booking.hotel_city}
📅 ${booking.check_in} → ${booking.check_out} (${nights} nights)
🛏️ ${booking.room_type || 'Standard Room'} · ${booking.num_rooms || 1} room(s)
👤 ${booking.num_adults || 2} adults${childrenLine}
${mealLine}

You paid: ~₹${Number(booking.total_price_paid || booking.original_price).toLocaleString('en-IN')}~
New price: *₹${Number(offerData.offerPrice).toLocaleString('en-IN')}*
💚 You save: *₹${Number(offerData.customerSaving).toLocaleString('en-IN')}*

${cancelLine}

👉 Rebook now:
${hotelPageUrl}

_Same room, same meals — like-for-like._
_Offer valid 24 hours._`

  try {
    const twilio  = require('twilio')
    const client  = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    const formatted = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to:   formatted,
      body: msg,
    })
    await supabase.from('offers').update({
      whatsapp_sent_at: new Date().toISOString(),
      status:           'sent',
    }).eq('id', savedOffer.id)
    console.log(`  📱 WhatsApp sent → ${phone}`)
  } catch (e) {
    console.error(`  ❌ WhatsApp failed:`, e.message)
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (booking.email) {
    try {
      await email.priceDropAlert(booking.email, {
        name:         booking.email.split('@')[0],
        booking: {
          hotelName:    booking.hotel_name,
          city:         booking.hotel_city,
          checkinDate:  booking.check_in,
          checkoutDate: booking.check_out,
          otaName:      booking.ota_name,
          bookingRef:   booking.booking_reference,
          currency:     'INR',
        },
        oldRate:      booking.total_price_paid,
        newRate:      offerData.offerPrice,
        saving:       offerData.customerSaving,
        hotelPageUrl,
      })
      console.log(`  📧 Price drop email sent → ${booking.email}`)
    } catch (e) {
      console.error(`  ❌ Price drop email failed:`, e.message)
    }
  }
}

async function updateNextCheck(bookingId, hours) {
  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + hours * 3600000).toISOString(),
  }).eq('id', bookingId)
}

module.exports = { runPriceTracker }
