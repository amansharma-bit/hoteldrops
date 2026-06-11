// backend/jobs/priceTracker.js
// Logic: price only — find lowest rate at hotel for same dates, trigger if cheaper

const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const email = require('../utils/emailService')

const LITEAPI_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const LITEAPI_BASE = 'https://api.liteapi.travel/v3.0'
const liteHeaders = { 'X-API-Key': LITEAPI_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' }

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Resolve hotelId by name+city if not already stored
const CITY_COUNTRY = {
  'dubai':'AE','abu dhabi':'AE','sharjah':'AE','mumbai':'IN','delhi':'IN',
  'new delhi':'IN','goa':'IN','bangalore':'IN','bengaluru':'IN','jaipur':'IN',
  'hyderabad':'IN','chennai':'IN','kolkata':'IN','agra':'IN','udaipur':'IN',
  'kochi':'IN','pune':'IN','amritsar':'IN','singapore':'SG','bangkok':'TH',
  'phuket':'TH','bali':'ID','jakarta':'ID','kuala lumpur':'MY','london':'GB',
  'paris':'FR','rome':'IT','barcelona':'ES','amsterdam':'NL','istanbul':'TR',
  'tokyo':'JP','sydney':'AU','doha':'QA','muscat':'OM','riyadh':'SA',
  'jeddah':'SA','maldives':'MV','male':'MV','hong kong':'HK','seoul':'KR',
  'new york':'US','los angeles':'US','miami':'US','munich':'DE','berlin':'DE',
  'vienna':'AT','zurich':'CH','prague':'CZ','budapest':'HU','lisbon':'PT',
  'athens':'GR','yerevan':'AM',
}
async function resolveHotelId(hotelName, hotelCity) {
  try {
    const cityLower = (hotelCity || '').toLowerCase()
    let countryCode = 'IN'
    for (const [city, cc] of Object.entries(CITY_COUNTRY)) {
      if (cityLower.includes(city)) { countryCode = cc; break; }
    }
    const resp = await axios.get(
      `${LITEAPI_BASE}/data/hotels?countryCode=${countryCode}&cityName=${encodeURIComponent(hotelCity)}&hotelName=${encodeURIComponent(hotelName)}&limit=5`,
      { headers: liteHeaders, timeout: 8000, validateStatus: () => true }
    )
    const hotels = resp.data?.data || []
    if (!hotels.length) return null
    const nameLower = hotelName.toLowerCase()
    const best = hotels.find(h => {
      const hn = (h.name || '').toLowerCase()
      return nameLower.split(' ').filter(w => w.length > 3).some(w => hn.includes(w))
    }) || hotels[0]
    console.log(`  ✅ Resolved "${hotelName}" → ${best.id} (${best.name})`)
    return best.id
  } catch(e) {
    console.warn('  ⚠️  resolveHotelId failed:', e.message)
    return null
  }
}

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

  // ── Resolve liteAPI hotelId if not stored ────────────────────────────────
  let hotelId = booking.liteapi_hotel_id
  if (!hotelId) {
    console.log(`  🔍 Resolving hotelId for "${booking.hotel_name}"...`)
    hotelId = await resolveHotelId(booking.hotel_name, booking.hotel_city)
    if (hotelId) {
      await supabase.from('bookings').update({ liteapi_hotel_id: hotelId, status: 'tracking' }).eq('id', booking.id)
      booking.liteapi_hotel_id = hotelId
      didMap = true
    } else {
      console.log(`  ⚠️  Could not resolve hotelId — retry in 12hrs`)
      await updateNextCheck(booking.id, 12)
      return {}
    }
  }

  // ── Fetch live rates from liteAPI ─────────────────────────────────────────
  console.log(`  💰 Checking price (${hotelId})...`)

  let rooms = []
  try {
    const ratesResp = await axios.post(`${LITEAPI_BASE}/hotels/rates`, {
      hotelIds: [hotelId],
      checkin:  booking.check_in,
      checkout: booking.check_out,
      adults:   booking.num_adults   || 2,
      children: booking.num_children || 0,
      rooms:    booking.num_rooms    || 1,
      currency: 'INR',
    }, { headers: liteHeaders, timeout: 15000, validateStatus: () => true })

    if (ratesResp.status !== 200) {
      console.log(`  ❌ Rates API error: ${ratesResp.status}`)
      await updateNextCheck(booking.id, 1)
      return { mapped: didMap }
    }
    // liteAPI returns data.data[0].roomTypes
    const hotelData = ratesResp.data?.data?.[0]
    rooms = hotelData?.roomTypes || []
  } catch (e) {
    console.error('  ❌ Rates fetch failed:', e.message)
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
      // liteAPI returns retailRate in INR when currency=INR
      const priceINR = parseFloat(rate.retailRate?.total?.[0]?.amount || rate.retailRate?.total || rate.net || 0)
      if (priceINR <= 0) continue
      if (priceINR < lowestPrice) {
        lowestPrice = Math.round(priceINR)
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
    const client    = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const formatted = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`
    await client.messages.create({ from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || '+14155238886'}`, to: formatted, body: msg })
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
