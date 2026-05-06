const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const { v4: uuidv4 } = require('uuid')
const { createClient } = require('@supabase/supabase-js')
const { extractVoucherDetails } = require('../utils/voucherParser')
const { findHotelId, getCityCode }  = require('../utils/amadeus')

const router   = express.Router()
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// File upload config
const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
})
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

// ==============================
// POST /api/bookings/extract
// Upload voucher and extract details
// ==============================
router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const extracted = await extractVoucherDetails(req.file.path)

    // Clean up temp file after extraction (or keep for reference)
    // fs.unlinkSync(req.file.path)

    res.json({
      success:   true,
      extracted,
      fileName:  req.file.filename,
      filePath:  req.file.path,
    })
  } catch (err) {
    console.error('Extract error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/bookings/create
// Save booking and start tracking
// ==============================
router.post('/create', upload.single('voucher'), async (req, res) => {
  try {
    let data = {}
    try { data = JSON.parse(req.body.data || '{}') } catch(e) {}

    const {
      hotel_name, hotel_city, hotel_address,
      check_in, check_out, room_type, board_type,
      original_price, num_adults = 2, num_children = 0,
      num_rooms = 1, phone, email,
    } = data

    // Validate
    if (!hotel_name)     return res.status(400).json({ error: 'Hotel name is required' })
    if (!check_in)       return res.status(400).json({ error: 'Check-in date is required' })
    if (!check_out)      return res.status(400).json({ error: 'Check-out date is required' })
    if (!original_price) return res.status(400).json({ error: 'Original price is required' })
    if (!phone)          return res.status(400).json({ error: 'WhatsApp number is required' })
    if (!email)          return res.status(400).json({ error: 'Email is required' })

    // Upsert user
    let user = null
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      // Update phone if changed
      await supabase.from('users').update({ whatsapp_number: phone, name: data.name || existingUser.name }).eq('id', existingUser.id)
      user = existingUser
    } else {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({ email, whatsapp_number: phone, name: data.name || email.split('@')[0] })
        .select()
        .single()
      if (error) throw error
      user = newUser
    }

    // Calculate nights
    const nights = Math.ceil(
      (new Date(check_out) - new Date(check_in)) / 86400000
    )

    // Upload voucher file to Supabase Storage (if available)
    let voucherUrl = null
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path)
      const fileName   = `vouchers/${user.id}/${req.file.filename}`
      const { data: uploadData } = await supabase.storage
        .from('vouchers')
        .upload(fileName, fileBuffer, { contentType: req.file.mimetype, upsert: true })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('vouchers').getPublicUrl(fileName)
        voucherUrl = urlData.publicUrl
      }
    }

    // Try to map hotel ID immediately (async, don't block)
    const cityCode = getCityCode(hotel_city)

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id:        user.id,
        hotel_name,
        hotel_city,
        hotel_address,
        check_in,
        check_out,
        nights,
        room_type,
        board_type,
        num_adults,
        num_children,
        num_rooms,
        original_price: parseFloat(original_price),
        currency:       'INR',
        voucher_url:    voucherUrl,
        status:         'pending',
        tracking_active: true,
        next_check_at:  new Date().toISOString(), // Check immediately
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Try hotel ID mapping in background
    setImmediate(async () => {
      try {
        const hotelId = await findHotelId(hotel_name, cityCode, null, null)
        if (hotelId) {
          await supabase.from('bookings')
            .update({ amadeus_hotel_id: hotelId, status: 'tracking' })
            .eq('id', booking.id)
          console.log(`✅ Hotel mapped: ${hotel_name} → ${hotelId}`)
        }
      } catch (e) {
        console.error('Background hotel mapping error:', e.message)
      }
    })

    res.json({
      success:   true,
      bookingId: booking.id,
      message:   'Booking submitted and tracking started!',
    })

  } catch (err) {
    console.error('Create booking error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// GET /api/bookings/:userId
// List bookings for a user
// ==============================
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, offers(id, offer_price, customer_saving, status, expires_at)`)
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, bookings: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// GET /api/bookings/offer/:offerId
// Get offer details for customer
// ==============================
router.get('/offer/:offerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`*, bookings(hotel_name, hotel_city, check_in, check_out, nights, room_type, original_price, user_id)`)
      .eq('id', req.params.offerId)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Offer not found' })

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase.from('offers').update({ status: 'expired' }).eq('id', data.id)
      return res.status(410).json({ error: 'Offer has expired' })
    }

    res.json({ success: true, offer: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/bookings/offer/:offerId/accept
// Customer accepts offer → create Razorpay order
// ==============================
router.post('/offer/:offerId/accept', async (req, res) => {
  try {
    const Razorpay = require('razorpay')
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const { data: offer, error } = await supabase
      .from('offers')
      .select('*, bookings(*)')
      .eq('id', req.params.offerId)
      .single()

    if (error || !offer) return res.status(404).json({ error: 'Offer not found' })
    if (offer.status === 'expired') return res.status(410).json({ error: 'Offer expired' })

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   Math.round(offer.offer_price * 100), // in paise
      currency: 'INR',
      receipt:  `HD-${offer.id.substring(0,8)}`,
      notes: {
        offer_id:   offer.id,
        booking_id: offer.booking_id,
        hotel:      offer.bookings?.hotel_name,
      },
    })

    // Update offer status
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
    await supabase.from('bookings').update({ status: 'accepted' }).eq('id', offer.booking_id)

    res.json({
      success:       true,
      razorpayOrderId: order.id,
      amount:        order.amount,
      currency:      order.currency,
      key:           process.env.RAZORPAY_KEY_ID,
      offer,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==============================
// POST /api/bookings/payment/confirm
// Verify Razorpay payment
// ==============================
router.post('/payment/confirm', async (req, res) => {
  try {
    const crypto   = require('crypto')
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, offer_id } = req.body

    // Verify signature
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
    const isValid   = expected === razorpay_signature

    if (!isValid) return res.status(400).json({ error: 'Payment verification failed' })

    // Get offer
    const { data: offer } = await supabase.from('offers').select('*, bookings(*)').eq('id', offer_id).single()

    // Save rebooking record
    const { data: rebooking } = await supabase.from('rebookings').insert({
      booking_id:          offer.booking_id,
      offer_id:            offer.id,
      user_id:             offer.bookings.user_id,
      razorpay_order_id,
      razorpay_payment_id,
      payment_amount:      offer.offer_price,
      payment_status:      'paid',
      payment_captured_at: new Date().toISOString(),
      status:              'paid',
    }).select().single()

    // Update statuses
    await supabase.from('offers').update({ status: 'completed' }).eq('id', offer_id)
    await supabase.from('bookings').update({ status: 'rebooked', tracking_active: false }).eq('id', offer.booking_id)

    // Send confirmation email
    const { data: user } = await supabase.from('users').select('*').eq('id', offer.bookings.user_id).single()
    if (user?.email) {
      const { sendBookingConfirmation } = require('../utils/notifications')
      await sendBookingConfirmation(user.email, {
        customerName:   user.name,
        hotelName:      offer.bookings.hotel_name,
        checkIn:        offer.bookings.check_in,
        checkOut:       offer.bookings.check_out,
        nights:         offer.bookings.nights,
        offerPrice:     offer.offer_price,
        customerSaving: offer.customer_saving,
        bookingRef:     rebooking.id.substring(0, 8).toUpperCase(),
      })
    }

    res.json({ success: true, message: 'Payment confirmed. Rebooking in progress!', rebookingId: rebooking.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
