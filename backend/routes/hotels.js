const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode, getHotelContent, getHotelRooms } = require('../utils/hotelbeds')

// GET /api/hotels/search
router.get('/search', async (req, res) => {
  try {
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query
    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields: destination, checkIn, checkOut' })
    }
    const destinationCode = getDestinationCode(destination)
    if (!destinationCode) {
      return res.status(400).json({ error: `Unknown destination: "${destination}".` })
    }

    console.log(`🔍 Searching: ${destination} (${destinationCode}) | ${checkIn} → ${checkOut}`)
    const hotels = await searchHotels({
      destination: destinationCode, checkIn, checkOut,
      adults: parseInt(adults), children: parseInt(children),
      rooms: parseInt(rooms), maxHotels: 40,
    })

    // LiteAPI already returns name, imageUrl, address, chain in searchHotels()
    // No need to call getHotelContent() again — that was a Hotelbeds-era pattern
    console.log(`✅ Found ${hotels.length} hotels`)
    res.json({ hotels: { hotels, total: hotels.length, checkIn, checkOut } })
  } catch (err) {
    console.error('❌ Search error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/hotels/:code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut required' })
    }

    console.log(`🏨 Hotel detail: ${code} | ${checkIn} → ${checkOut}`)

    const content = await getHotelContent(code)

    if (!content) {
      return res.status(404).json({ error: 'Hotel not found' })
    }

    // Images — LiteAPI returns full URLs directly (isFullUrl: true)
    const generalImages = (content.images || [])
      .sort((a, b) => a.visualOrder - b.visualOrder)
      .map(img => ({
        url: img.path,   // already a full URL from LiteAPI
        type: img.type?.description?.content || 'General'
      }))

    // Facilities
    const facilityGroups = { general: [], sports: [], wellness: [], dining: [], connectivity: [] }
    const groupMap = { 70: 'general', 73: 'sports', 74: 'wellness', 71: 'dining', 80: 'dining' }
    ;(content.facilities || []).forEach(f => {
      const group = groupMap[f.facilityGroupCode]
      if (group && f.description?.content && f.indLogic !== false) {
        const label = f.description.content.trim()
        if (!facilityGroups[group].includes(label)) facilityGroups[group].push(label)
      }
    })

    const USD_TO_INR = 84
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))

    // Get room prices
    const roomPrices = {}
    let lowestPrice = null
    let lowestTotal = null

    try {
      const hotelRooms = await getHotelRooms({
        hotelCode: code, checkIn, checkOut,
        adults: parseInt(adults), children: 0, rooms: 1,
      })

      let minPrice = Infinity
      for (const room of hotelRooms) {
        let bestRate = null
        let bestPrice = Infinity
        for (const rate of (room.rates || [])) {
          const price = parseFloat(rate.net || 0)
          if (price > 0 && price < bestPrice) {
            bestPrice = price
            bestRate = rate
          }
        }
        if (bestRate) {
          roomPrices[room.code] = {
            price: bestPrice,
            rateKey: bestRate.rateKey,
            boardCode: bestRate.boardCode,
            boardName: bestRate.boardName,
            cancellationPolicies: bestRate.cancellationPolicies,
            rateType: bestRate.rateType,
            paymentType: bestRate.paymentType,
            allotment: bestRate.allotment,
          }
          if (bestPrice < minPrice) {
            minPrice = bestPrice
            lowestPrice = Math.round(bestPrice * USD_TO_INR / nights)
            lowestTotal = Math.round(bestPrice * USD_TO_INR)
          }
        }
      }
    } catch (e) {
      console.error('Price fetch error:', e.message)
    }

    const roomList = (content.rooms || []).slice(0, 15).map(room => {
      const priceInfo = roomPrices[room.roomCode]
      const pricePerNight = priceInfo ? Math.round(priceInfo.price * USD_TO_INR / nights) : null
      const totalPrice = priceInfo ? Math.round(priceInfo.price * USD_TO_INR) : null

      let cancellation = null
      if (priceInfo?.cancellationPolicies?.length) {
        const policy = priceInfo.cancellationPolicies[0]
        cancellation = {
          type: priceInfo.rateType === 'RECHECK' ? 'free' : 'non-refundable',
          from: policy.dateFrom || policy.cancelTime || null,
          penalty: policy.amount ? Math.round(policy.amount * USD_TO_INR) : null,
        }
      }

      return {
        roomCode: room.roomCode,
        name: room.description,
        type: room.type?.description?.content,
        characteristic: room.characteristic?.description?.content,
        maxAdults: room.maxAdults,
        maxPax: room.maxPax,
        size: null,
        bedrooms: null,
        hasBalcony: false,
        bedType: null,
        amenities: [],
        images: generalImages.slice(0, 3).map(i => i.url),
        pricePerNight,
        totalPrice,
        boardCode: priceInfo?.boardCode || null,
        boardName: priceInfo?.boardName || null,
        rateKey: priceInfo?.rateKey || null,
        cancellation,
        paymentType: priceInfo?.paymentType || null,
      }
    })

    const boards = (content.boards || []).map(b => ({ code: b.code, name: b.description?.content }))

    res.json({
      success: true,
      hotel: {
        code: content.code,
        name: content.name?.content,
        description: content.description?.content,
        stars: content.category?.description?.content,
        chain: content.chain?.description?.content,
        address: content.address?.content,
        city: content.city?.content,
        country: content.country?.description?.content,
        coordinates: content.coordinates,
        checkInTime: '15:00',
        checkOutTime: '12:00',
        totalRooms: null,
        floors: null,
        images: generalImages,
        rooms: roomList,
        facilityGroups,
        boards,
        distances: [],
        interestPoints: [],
        lowestPriceINR: lowestPrice,
        lowestTotalINR: lowestTotal,
        nights,
        checkIn,
        checkOut,
        adults: parseInt(adults),
      }
    })

  } catch (err) {
    console.error('❌ Hotel detail error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
