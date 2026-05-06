const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode } = require('../utils/hotelbeds')

// GET /api/test/hotelbeds
// Quick test — hit this from browser to verify Hotelbeds API works
router.get('/hotelbeds', async (req, res) => {
  try {
    const city        = req.query.city || 'Mumbai'
    const destCode    = getDestinationCode(city) || 'MCM'

    // Set dates 3 months from now
    const checkIn  = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    const checkOut = new Date(Date.now() + 92 * 86400000).toISOString().split('T')[0]

    console.log(`🧪 Testing Hotelbeds API — ${city} (${destCode}) ${checkIn} → ${checkOut}`)

    const hotels = await searchHotels({
      destination: destCode,
      checkIn,
      checkOut,
      adults:     2,
      rooms:      1,
      maxHotels:  5,
    })

    if (!hotels.length) {
      return res.json({
        success: false,
        message: `No hotels found for ${city} (${destCode})`,
        tip: 'Try a different city — e.g. ?city=Delhi or ?city=Goa',
      })
    }

    res.json({
      success:     true,
      message:     `✅ Hotelbeds API is working!`,
      city,
      destCode,
      checkIn,
      checkOut,
      hotelsFound: hotels.length,
      hotels: hotels.map(h => ({
        code:     h.code,
        name:     h.name,
        stars:    h.categoryName,
        zone:     h.zoneName,
        minRate:  h.minRate,
        currency: h.currency,
      })),
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      error:   err.message,
      tip:     'Check Railway logs for more details',
    })
  }
})

// GET /api/test/mapping?hotel=Taj+Mahal+Palace&city=Mumbai
// Test hotel name → Hotelbeds code mapping
router.get('/mapping', async (req, res) => {
  try {
    const { hotel = 'Taj Mahal Palace', city = 'Mumbai' } = req.query
    const { findHotelCode, getDestinationCode } = require('../utils/hotelbeds')

    const destCode = getDestinationCode(city)
    if (!destCode) {
      return res.json({ success: false, error: `Unknown city: ${city}` })
    }

    console.log(`🗺️  Mapping "${hotel}" in ${city} (${destCode})`)
    const hotelCode = await findHotelCode(hotel, destCode)

    res.json({
      success:   !!hotelCode,
      hotel,
      city,
      destCode,
      hotelCode: hotelCode || null,
      message:   hotelCode
        ? `✅ Mapped! "${hotel}" → Hotelbeds code: ${hotelCode}`
        : `❌ Could not map "${hotel}" — hotel may not be in Hotelbeds inventory`,
    })

  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
