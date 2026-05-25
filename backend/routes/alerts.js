// backend/routes/alerts.js
// PATCHED: Richer WhatsApp replies — includes cancellation deadline, meal plan, total paid

const express  = require('express')
const router   = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

/**
 * POST /api/alerts/whatsapp-reply
 * Twilio sends webhook when customer replies to WhatsApp
 */
router.post('/whatsapp-reply', async (req, res) => {
  try {
    const { From, Body } = req.body
    const reply = (Body || '').trim().toUpperCase()

    // Parse phone — strip whatsapp: prefix and country code variants
    const phone = (From || '')
      .replace('whatsapp:', '')
      .replace('+91', '')
      .replace('+', '')
      .trim()

    console.log(`📱 WhatsApp reply from ${phone}: "${Body}"`)

    // ── Find user by phone ──────────────────────────────────────────────────
    const { data: booking: bookingWithPhone } = await supabase
      .from('bookings')
      .select('*')
      .ilike('phone', `%${phone.slice(-10)}%`)  // match last 10 digits
      .in('status', ['tracking', 'drop_found', 'offer_sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // ── Handle unknown policy replies (1 or 2) ──────────────────────────────
    if (['1', '2'].includes(reply) && bookingWithPhone?.cancellation_policy === 'unknown') {
      const newPolicy = reply === '1' ? 'free' : 'non-refundable'
      await supabase.from('bookings')
        .update({ cancellation_policy: newPolicy })
        .eq('id', bookingWithPhone.id)

      if (newPolicy === 'non-refundable') {
        await supabase.from('bookings')
          .update({ status: 'non-refundable', tracking_active: false })
          .eq('id', bookingWithPhone.id)
        return res.send(twilioResponse(
          `Got it — your booking is non-refundable, so we've stopped tracking it.\n\nEven if the price drops, you wouldn't be able to rebook. We'll be here for your next flexible booking! 🏨`
        ))
      }

      return res.send(twilioResponse(
        `Got it — your booking is fully refundable. ✅\n\nWe'll keep watching and alert you the moment the price drops for *${bookingWithPhone.hotel_name}*.\n\n— Team rebuq`
      ))
    }

    // ── YES: Customer wants to accept a price drop offer ───────────────────
    if (['YES', 'Y', 'YES!', 'REBOOK', 'OK', 'CONFIRM', 'BOOK', 'ACCEPT'].includes(reply)) {

      // Find active offer linked to a booking matching this phone
      const { data: offer } = await supabase
        .from('offers')
        .select('*, bookings(*)')
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(async ({ data: offers }) => {
          // Filter by phone on the booking side
          const match = (offers || []).find(o =>
            (o.bookings?.phone || '').includes(phone.slice(-10))
          )
          return { data: match }
        })

      if (!offer) {
        return res.send(twilioResponse(
          `We couldn't find an active offer for you right now.\n\nWe'll alert you as soon as we find a price drop! 🏨`
        ))
      }

      // Check not expired
      if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
        return res.send(twilioResponse(
          `Sorry, that offer for *${offer.bookings?.hotel_name}* has expired. We'll alert you if the price drops again!`
        ))
      }

      const paymentLink = `${process.env.FRONTEND_URL}/offer/${offer.id}`
      const saving      = Number(offer.customer_saving).toLocaleString('en-IN')
      const newPrice    = Number(offer.offer_price).toLocaleString('en-IN')
      const hotel       = offer.bookings

      // Build a rich confirmation with all booking details
      const cancelLine = (() => {
        if (hotel?.cancellation_deadline) {
          const d = new Date(hotel.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          return `\n⚠️ Free cancel until: *${d}* — rebook before then!`
        }
        return ''
      })()

      const mealLine = hotel?.board_basis_label ? `\n🍽️ ${hotel.board_basis_label}` : ''

      return res.send(twilioResponse(
        `Great news! 🎉\n\n*${hotel?.hotel_name}*\n📍 ${hotel?.hotel_city}\n🛏️ ${hotel?.room_type || 'Standard Room'}${mealLine}${cancelLine}\n\nNew price: *₹${newPrice}*\n💚 You save: *₹${saving}*\n\nSecure payment link:\n${paymentLink}\n\nOffer expires in 24 hours. Same hotel, same room, same meals — guaranteed! 🏨`
      ))
    }

    // ── NO: Customer declines ──────────────────────────────────────────────
    if (['NO', 'N', 'CANCEL', 'SKIP', 'NOT NOW'].includes(reply)) {
      return res.send(twilioResponse(
        `No problem! We'll keep monitoring and alert you if the price drops again.\n\nHappy travels! 🏨`
      ))
    }

    // ── STATUS: Check tracked bookings ────────────────────────────────────
    if (reply === 'STATUS' || reply === 'CHECK') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('hotel_name, hotel_city, check_in, check_out, total_price_paid, original_price, board_basis_label, cancellation_policy, cancellation_deadline, status, tracking_active')
        .ilike('phone', `%${phone.slice(-10)}%`)
        .eq('tracking_active', true)
        .not('status', 'eq', 'non-refundable')
        .limit(4)

      if (!bookings?.length) {
        return res.send(twilioResponse(
          `You have no active bookings being tracked right now.\n\nVisit ${process.env.FRONTEND_URL} to upload a voucher.`
        ))
      }

      const list = bookings.map(b => {
        const nights = Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000)
        const paid   = Number(b.total_price_paid || b.original_price).toLocaleString('en-IN')
        const meal   = b.board_basis_label ? ` · ${b.board_basis_label}` : ''
        const cancelInfo = (() => {
          if (b.cancellation_policy === 'free' && b.cancellation_deadline) {
            const d = new Date(b.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            return ` ⚠️ Cancel by ${d}`
          }
          return ''
        })()
        const statusLabel = b.status === 'drop_found' ? '🔥 Drop Found!' :
                            b.status === 'tracking'   ? '👁️ Monitoring'  : b.status
        return `• *${b.hotel_name}* (${b.hotel_city})\n  📅 ${new Date(b.check_in).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · ${nights}n${meal}\n  💳 ₹${paid}${cancelInfo}\n  ${statusLabel}`
      }).join('\n\n')

      return res.send(twilioResponse(`Your tracked bookings:\n\n${list}\n\nReply *STATUS* anytime to check.`))
    }

    // ── STOP: Unsubscribe ─────────────────────────────────────────────────
    if (['STOP', 'UNSUBSCRIBE', 'QUIT'].includes(reply)) {
      if (bookingWithPhone) {
        await supabase.from('bookings')
          .update({ tracking_active: false })
          .ilike('phone', `%${phone.slice(-10)}%`)
      }
      return res.send(twilioResponse(`You've been unsubscribed from rebuq alerts. We won't send any more messages.\n\nVisit ${process.env.FRONTEND_URL} to reactivate anytime.`))
    }

    // ── Default ───────────────────────────────────────────────────────────
    res.send(twilioResponse(
      `Hi! I'm the rebuq bot 🤖\n\nReply:\n• *YES* — to accept a price drop offer\n• *NO* — to decline\n• *STATUS* — to check your tracked bookings\n• *STOP* — to unsubscribe\n\nOr visit ${process.env.FRONTEND_URL}`
    ))

  } catch (err) {
    console.error('WhatsApp reply error:', err)
    res.send(twilioResponse(`Sorry, something went wrong. Please visit ${process.env.FRONTEND_URL} for help.`))
  }
})

function twilioResponse(message) {
  // Escape XML special chars
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safe}</Message>
</Response>`
}

module.exports = router
