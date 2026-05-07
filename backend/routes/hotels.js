const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode } = require('../utils/hotelbeds')

// GET /api/hotels/search?destination=Dubai&checkIn=2025-06-12&checkOut=2025-06-16&adults=2
router.get('/search', async (req, res) => {
  try {
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query

    // Validate required fields
    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        error: 'Missing required fields: destination, checkIn, checkOut'
      })
    }

    // Convert city name (e.g. "Dubai") to Hotelbeds destination code (e.g. "DXB")
    const destinationCode = getDestinationCode(destination)
    if (!destinationCode) {
      return res.status(400).json({
        error: `Unknown destination: "${destination}". Try a major city name like Dubai, London, Paris.`
      })
    }

    console.log(`🔍 Searching hotels: ${destination} (${destinationCode}) | ${checkIn} → ${checkOut} | ${adults} adults`)

    const hotels = await searchHotels({
      destination: destinationCode,
      checkIn,
      checkOut,
      adults:   parseInt(adults),
      children: parseInt(children),
      rooms:    parseInt(rooms),
      maxHotels: 40,
    })

    console.log(`✅ Found ${hotels.length} hotels for ${destination}`)

    // Return in the shape the frontend expects
    res.json({
      hotels: {
        hotels,
        total:   hotels.length,
        checkIn,
        checkOut,
      }
    })

  } catch (err) {
    console.error('❌ Hotel search error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
