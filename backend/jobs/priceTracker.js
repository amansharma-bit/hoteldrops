const { createClient } = require('@supabase/supabase-js')
const { checkHotelPrice, findHotelCode, getDestinationCode, sleep } = require('../utils/hotelbeds')
const { sendWhatsAppAlert, sendEmailAlert } = require('../utils/notifications')
const { calculateOffer } = require('../utils/margins')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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
        await supabase.from('price_checks').insert({ booking_id: booking.id, success: false, error_message: err.message, api_source: 'hotelbeds' })
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

  // Expired check
  if (new Date(booking.check_in) <= new Date()) {
    await supabase.from('bookings').update({ status: 'expired', tracking_active: false }).eq('id', booking.id)
    console.log(`  ⏰ Expired`)
    return {}
  }

  // Map hotel if needed
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

  // Check price
  console.log(`  💰 Checking price (${booking.hotelbeds_hotel_code})...`)
  const result = await checkHotelPrice({
    hotelCode: booking.hotelbeds_hotel_code,
    checkIn:   booking.check_in,
    checkOut:  booking.check_out,
    adults:    booking.num_adults || 2,
    children:  booking.num_children || 0,
    rooms:     booking.num_rooms || 1,
  })

  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + 6 * 3600000).toISOString(),
    status:          'tracking',
  }).eq('id', booking.id)

  if (!result) {
    console.log(`  ❓ No availability`)
    await supabase.from('price_checks').insert({ booking_id: booking.id, success: false, error_message: 'No availability', api_source: 'hotelbeds' })
    return { mapped: didMap }
  }

  const foundPrice    = result.price
  const originalPrice = parseFloat(booking.original_price)
  const isDrop        = foundPrice < originalPrice
  const dropAmount    = originalPrice - foundPrice
  const dropPct       = ((dropAmount / originalPrice) * 100).toFixed(1)

  console.log(`  📊 Original: ₹${originalPrice.toLocaleString('en-IN')} | Found: ₹${foundPrice.toLocaleString('en-IN')} | ${isDrop ? `✅ DROP ${dropPct}%` : '❌ No drop'}`)

  await supabase.from('price_checks').insert({
    booking_id: booking.id, found_price: foundPrice,
    is_drop: isDrop, drop_amount: isDrop ? dropAmount : 0,
    drop_percentage: isDrop ? parseFloat(dropPct) : 0,
    api_source: 'hotelbeds', api_response: result.rate, success: true,
  })

  if (isDrop && dropAmount >= 300 && parseFloat(dropPct) >= 3) {
    const { data: existing } = await supabase.from('offers').select('id').eq('booking_id', booking.id).in('status', ['pending', 'sent']).limit(1)
    if (existing?.length) { console.log(`  ⏭️  Offer exists`); return { mapped: didMap } }

    const offer = await calculateOffer({ originalPrice, supplierPrice: foundPrice, bookingId: booking.id })
    console.log(`  🎯 Offer: ₹${offer.offerPrice} | Save: ₹${offer.customerSaving} | Earn: ₹${offer.ourMargin}`)

    const { data: savedOffer } = await supabase.from('offers').insert({
      booking_id: booking.id, supplier_price: foundPrice, offer_price: offer.offerPrice,
      original_price: originalPrice, customer_saving: offer.customerSaving, our_margin: offer.ourMargin,
      margin_percentage: offer.marginPercentage, status: 'pending',
      expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    }).select().single()

    await supabase.from('bookings').update({ status: 'drop_found' }).eq('id', booking.id)
    await sendAlerts(booking, savedOffer, offer)
    return { drop: true, mapped: didMap }
  }

  return { mapped: didMap }
}

async function sendAlerts(booking, savedOffer, offerData) {
  const { data: user } = await supabase.from('users').select('*').eq('id', booking.user_id).single()
  if (!user) return

  const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000)
  const alertData = {
    customerName: user.name || 'Traveler', hotelName: booking.hotel_name,
    city: booking.hotel_city,
    checkIn:  new Date(booking.check_in).toLocaleDateString('en-IN',  { day:'numeric', month:'short', year:'numeric' }),
    checkOut: new Date(booking.check_out).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
    nights, originalPrice: booking.original_price,
    offerPrice: offerData.offerPrice, customerSaving: offerData.customerSaving,
    offerId: savedOffer.id, bookingId: booking.id,
  }

  if (user.whatsapp_number) {
    try {
      const sid = await sendWhatsAppAlert(user.whatsapp_number, alertData)
      await supabase.from('offers').update({ whatsapp_sent_at: new Date().toISOString(), whatsapp_message_sid: sid, status: 'sent' }).eq('id', savedOffer.id)
      await supabase.from('notifications').insert({ user_id: user.id, booking_id: booking.id, offer_id: savedOffer.id, type: 'whatsapp', recipient: user.whatsapp_number, status: 'sent', external_id: sid })
      console.log(`  📱 WhatsApp → ${user.whatsapp_number}`)
    } catch (e) { console.error(`  ❌ WhatsApp:`, e.message) }
  }

  if (user.email) {
    try {
      await sendEmailAlert(user.email, alertData)
      await supabase.from('offers').update({ email_sent_at: new Date().toISOString() }).eq('id', savedOffer.id)
      await supabase.from('notifications').insert({ user_id: user.id, booking_id: booking.id, offer_id: savedOffer.id, type: 'email', recipient: user.email, status: 'sent' })
      console.log(`  📧 Email → ${user.email}`)
    } catch (e) { console.error(`  ❌ Email:`, e.message) }
  }
}

async function updateNextCheck(bookingId, hours) {
  await supabase.from('bookings').update({
    last_checked_at: new Date().toISOString(),
    next_check_at:   new Date(Date.now() + hours * 3600000).toISOString(),
  }).eq('id', bookingId)
}

module.exports = { runPriceTracker }
