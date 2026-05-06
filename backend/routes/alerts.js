const express  = require('express')
const router   = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

/**
 * POST /api/alerts/whatsapp-reply
 * Twilio sends a webhook when customer replies to WhatsApp
 * If customer replies "YES" → get the active offer and return payment link
 */
router.post('/whatsapp-reply', async (req, res) => {
  try {
    const { From, Body } = req.body
    const reply = (Body || '').trim().toUpperCase()
    const phone = From?.replace('whatsapp:+91', '').replace('whatsapp:+', '').replace('+91', '')

    console.log(`📱 WhatsApp reply from ${phone}: "${Body}"`)

    // Find the user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .ilike('whatsapp_number', `%${phone}%`)
      .single()

    if (!user) {
      return res.send(twilioResponse("Sorry, we couldn't find your account. Please visit hoteldrops.in"))
    }

    // Handle YES replies
    if (['YES', 'Y', 'YES!', 'REBOOK', 'OK', 'CONFIRM', 'BOOK', 'ACCEPT'].includes(reply)) {

      // Find active offer for this user
      const { data: offer } = await supabase
        .from('offers')
        .select('*, bookings(*)')
        .eq('status', 'sent')
        .eq('bookings.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!offer) {
        return res.send(twilioResponse("We couldn't find an active offer for you. Please check your email or visit hoteldrops.in/dashboard"))
      }

      // Check not expired
      if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
        return res.send(twilioResponse(`Sorry, that offer for ${offer.bookings?.hotel_name} has expired. We'll alert you if the price drops again!`))
      }

      const paymentLink = `${process.env.FRONTEND_URL}/offer/${offer.id}`
      const saving = Number(offer.customer_saving).toLocaleString('en-IN')
      const price  = Number(offer.offer_price).toLocaleString('en-IN')

      return res.send(twilioResponse(
        `Great news! 🎉\n\nTo complete your rebooking at ₹${price} and save ₹${saving}, please use this secure payment link:\n\n${paymentLink}\n\nOffer expires in 24 hours. Same hotel, same room, same dates — guaranteed! 🏨`
      ))
    }

    // Handle NO replies
    if (['NO', 'N', 'CANCEL', 'SKIP', 'NOT NOW'].includes(reply)) {
      return res.send(twilioResponse("No problem! We'll keep monitoring and let you know if the price drops again. Happy travels! 🏨"))
    }

    // Handle STATUS query
    if (reply === 'STATUS' || reply === 'CHECK') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('hotel_name, check_in, status')
        .eq('user_id', user.id)
        .eq('tracking_active', true)
        .limit(3)

      if (!bookings?.length) {
        return res.send(twilioResponse("You have no active bookings being tracked. Visit hoteldrops.in to upload a voucher."))
      }

      const list = bookings.map(b =>
        `• ${b.hotel_name} (${new Date(b.check_in).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}) — ${b.status === 'tracking' ? 'Monitoring' : 'Drop Found!'}`
      ).join('\n')

      return res.send(twilioResponse(`Your tracked bookings:\n${list}\n\nReply STATUS anytime to check.`))
    }

    // Default response
    res.send(twilioResponse(
      `Hi! I'm the HotelDrops bot 🤖\n\nReply:\n• *YES* — to accept a price drop offer\n• *NO* — to decline\n• *STATUS* — to check your tracked bookings\n\nOr visit hoteldrops.in/dashboard`
    ))

  } catch (err) {
    console.error('WhatsApp reply error:', err)
    res.send(twilioResponse("Sorry, something went wrong. Please visit hoteldrops.in for help."))
  }
})

function twilioResponse(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
}

module.exports = router
