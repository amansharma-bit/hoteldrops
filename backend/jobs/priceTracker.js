// backend/jobs/priceTracker.js
// Logic: price only — find lowest rate at hotel for same dates, trigger if cheaper

const { createClient } = require('@supabase/supabase-js')
const { findHotelCode, getDestinationCode, getHotelRooms, sleep } = require('../utils/hotelbeds')
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
        await updateNextCheck(booking.id, 1)
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

  // ── Expired check ─────────────────────────────────────────────────────────
  if (new Date(booking.check_in) <= new Date()) {
    await supabase.from('bookings').update({ status: 'expired', tracking_active: false }).eq('id', booking.id)
    console.log(`  ⏰ Expired`)

    if (booking.email) {
      try {
        const checksRun  = await getChecksCount(booking.id)
        const alertsSent = await getAlertsCount(booking.id)
        if (alertsSent > 0) {
          await email.checkinPassed(booking.email, {
            name: booking.email.split('@')[0],
            booking: { hotelName: booking.hotel_name, checkinDate: booking.check_in, checkoutDate: booking.check_out },
            checksRun, alertsSent,
          })
        } else {
          await email.noSavingFound(booking.email, {
            name: booking.email.split('@')[0],
            booking: { hotelName: booking.hotel_name, checkinDate: booking.check_in, checkoutDate: booking.check_out },
            checksRun,
          })
        }
      } catch (e) { console.error('Check-in passed email failed:', e.message) }
    }
    return {}
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

  // ── Fetch all rooms ───────────────────────────────────────────────────────
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
    await updateNextCheck(booking.id, 1)
    return { mapped: didMap }
  }

  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + 1 * 3600000).toISOString(),
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

  // ── Find lowest price — no comparability check ───────────────────────────
  const originalPrice = parseFloat(booking.total_price_paid || booking.original_price)
  let lowestPrice = Infinity
  let lowestRoom  = null
  let lowestRate  = null

  for (const room of rooms) {
    for (const rate of (room.rates || [])) {
      const priceEUR = parseFloat(rate.net || 0)
      if (priceEUR <= 0) continue
      const priceINR = Math.round(priceEUR * EUR_TO_INR)
      if (priceINR < lowestPrice) {
        lowestPrice = priceINR
        lowestRoom  = room
        lowestRate  = rate
      }
    }
  }

  if (!lowestRoom || !lowestRate) {
    console.log(`  ❌ No rates found`)
    return { mapped: didMap }
  }

  const isDrop     = lowestPrice < originalPrice
  const dropAmount = originalPrice - lowestPrice
  const dropPct    = ((dropAmount / originalPrice) * 100).toFixed(1)

  console.log(`  📊 Original: ₹${originalPrice.toLocaleString('en-IN')} | Found: ₹${lowestPrice.toLocaleString('en-IN')} | ${isDrop ? `✅ DROP ${dropPct}%` : '❌ No drop'}`)

  // Log price check
  await supabase.from('price_checks').insert({
    booking_id:    booking.id,
    checked_price: lowestPrice,
    currency:      'INR',
    found_drop:    isDrop && dropAmount >= 500 && parseFloat(dropPct) >= 3,
    room_type_checked:   lowestRoom.name || lowestRoom.code,
    board_basis_checked: lowestRate.boardCode,
    is_comparable:       true,
  })

  // ── Trigger alert if drop is meaningful ──────────────────────────────────
  if (isDrop && dropAmount >= 500 && parseFloat(dropPct) >= 3) {
    // Check no existing pending offer
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

    const offerPrice     = lowestPrice
    const customerSaving = dropAmount
    const ourMargin      = Math.round(dropAmount * 0.25)
    const marginPct      = 25

    console.log(`  🎯 Offer: ₹${offerPrice} | Save: ₹${customerSaving} | Earn: ₹${ourMargin}`)

    const { data: savedOffer } = await supabase.from('offers').insert({
      booking_id:        booking.id,
      supplier_price:    lowestPrice,
      offer_price:       offerPrice,
      original_price:    originalPrice,
      customer_saving:   customerSaving,
      our_margin:        ourMargin,
      margin_percentage: marginPct,
      status:            'pending',
      expires_at:        new Date(Date.now() + 24 * 3600000).toISOString(),
    }).select().single()

    await supabase.from('bookings').update({ status: 'drop_found' }).eq('id', booking.id)
    await sendAlerts(booking, savedOffer, { offerPrice, customerSaving, ourMargin })
    return { drop: true, mapped: didMap }
  }

  return { mapped: didMap }
}

async function sendAlerts(booking, savedOffer, offerData) {
  const phone = booking.phone
  if (!phone) return

  const nights = booking.total_nights ||
    Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000)

  const hotelPageUrl = `${process.env.FRONTEND_URL}/offer/${savedOffer.id}`

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const msg = `💰 *Price Drop Alert — rebuq*

*${booking.hotel_name}*
📍 ${booking.hotel_city}
📅 ${booking.check_in} → ${booking.check_out} (${nights} nights)
👤 ${booking.num_adults || 2} adults

You paid: ~₹${Number(booking.total_price_paid || booking.original_price).toLocaleString('en-IN')}~
New price: *₹${Number(offerData.offerPrice).toLocaleString('en-IN')}*
💚 You save: *₹${Number(offerData.customerSaving).toLocaleString('en-IN')}*

👉 View deal & rebook:
${hotelPageUrl}

_Best available rate · Same hotel · Same dates_
_Offer valid 24 hours._`

  try {
    const twilio    = require('twilio')
    const client    = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    const formatted = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`
    await client.messages.create({ from: 'whatsapp:+14155238886', to: formatted, body: msg })
    await supabase.from('offers').update({ whatsapp_sent_at: new Date().toISOString(), status: 'sent' }).eq('id', savedOffer.id)
    console.log(`  📱 WhatsApp sent → ${phone}`)
  } catch (e) {
    console.error(`  ❌ WhatsApp failed:`, e.message)
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (booking.email) {
    email.priceDropAlert(booking.email, {
      name: booking.email.split('@')[0],
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
    }).catch(e => console.error(`  ❌ Price drop email failed:`, e.message))
  }
}

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

async function updateNextCheck(bookingId, hours) {
  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + hours * 3600000).toISOString(),
  }).eq('id', bookingId)
}

module.exports = { runPriceTracker }
