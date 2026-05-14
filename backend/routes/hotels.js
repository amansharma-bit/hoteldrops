const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode, getHotelContent, getHotelRooms } = require('../utils/hotelbeds')

const PHOTO_BASE = 'https://photos.hotelbeds.com/giata/xl'

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

    // For each hotel, try to get the first image from content API in parallel
    const hotelsWithImages = await Promise.all(
      hotels.map(async (hotel) => {
        try {
          const content = await getHotelContent(hotel.code)
          const images = (content?.images || [])
            .filter(img => img.type?.code === 'GEN')
            .sort((a, b) => a.visualOrder - b.visualOrder)
          const firstImage = images[0]
          return {
            ...hotel,
            imageUrl: firstImage ? `${PHOTO_BASE}/${firstImage.path}` : null,
            address: content?.address?.content || null,
            chain: content?.chain?.description?.content || null,
          }
        } catch {
          return hotel
        }
      })
    )

    console.log(`✅ Found ${hotels.length} hotels`)
    res.json({ hotels: { hotels: hotelsWithImages, total: hotels.length, checkIn, checkOut } })
  } catch (err) {
    console.error('❌ Search error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/hotels/:code?checkIn=...&checkOut=...&adults=2
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut required' })
    }

    console.log(`🏨 Hotel detail: ${code} | ${checkIn} → ${checkOut}`)

    // Run both API calls in parallel
    const [content] = await Promise.all([
      getHotelContent(code),
    ])

    if (!content) {
      return res.status(404).json({ error: 'Hotel not found' })
    }

    // Parse images — sort by visualOrder, group by type
    const allImages = (content.images || []).sort((a, b) => a.visualOrder - b.visualOrder)
    const generalImages = allImages
      .filter(img => ['GEN', 'COM', 'PIS', 'TER', 'BAR', 'RES'].includes(img.type?.code))
      .map(img => ({ url: `${PHOTO_BASE}/${img.path}`, type: img.type?.description?.content || 'General' }))

    const roomImages = {}
    allImages.filter(img => img.type?.code === 'HAB' && img.roomCode).forEach(img => {
      if (!roomImages[img.roomCode]) roomImages[img.roomCode] = []
      roomImages[img.roomCode].push(`${PHOTO_BASE}/${img.path}`)
    })

    // Parse hotel-level amenities by group
    const facilityGroups = {
      general:      [], // group 70
      sports:       [], // group 73
      wellness:     [], // group 74
      dining:       [], // group 71/80
      connectivity: [], // WiFi etc
    }

    const groupMap = { 70: 'general', 73: 'sports', 74: 'wellness', 71: 'dining', 80: 'dining' }
    ;(content.facilities || []).forEach(f => {
      const group = groupMap[f.facilityGroupCode]
      if (group && f.description?.content && f.indLogic !== false) {
        const label = f.description.content.trim()
        if (!facilityGroups[group].includes(label)) facilityGroups[group].push(label)
      }
    })

    const EUR_TO_INR = 112
    const nights = Math.max(1, Math.round(
      (new Date(checkOut) - new Date(checkIn)) / 86400000
    ))

    // Fetch ALL room prices using direct hotel search (same as checkHotelPrice but return all rooms)
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
            lowestPrice = Math.round(bestPrice * EUR_TO_INR / nights)
            lowestTotal = Math.round(bestPrice * EUR_TO_INR)
          }
        }
      }
    } catch (e) {
      console.error('Price fetch error:', e.message)
    }

    // Build room list from content + overlay prices
    const roomList = (content.rooms || []).slice(0, 15).map(room => {
      const priceInfo = roomPrices[room.roomCode]
      const sizeFacility = (room.roomFacilities || []).find(f => f.facilityCode === 295)
      const bedroomsFacility = (room.roomFacilities || []).find(f => f.facilityCode === 298)
      const balconyFacility = (room.roomFacilities || []).find(f => f.facilityCode === 230)

      // Get bed type from roomStays
      const bedStay = (room.roomStays || []).find(s => s.stayType === 'BED')
      const bedType = bedStay?.roomStayFacilities?.[0]?.description?.content || null

      // Get room facilities as human-readable list
      const amenities = (room.roomFacilities || [])
        .filter(f => f.indLogic === true && f.description?.content)
        .map(f => f.description.content.trim())
        .slice(0, 8)

      const pricePerNight = priceInfo ? Math.round(priceInfo.price * EUR_TO_INR / nights) : null
      const totalPrice = priceInfo ? Math.round(priceInfo.price * EUR_TO_INR) : null

      // Cancellation
      let cancellation = null
      if (priceInfo?.cancellationPolicies?.length) {
        const policy = priceInfo.cancellationPolicies[0]
        cancellation = {
          type: priceInfo.rateType === 'RECHECK' ? 'free' : 'non-refundable',
          from: policy.dateFrom || null,
          penalty: policy.amount ? Math.round(policy.amount * EUR_TO_INR) : null,
        }
      }

      return {
        roomCode: room.roomCode,
        name: room.description,
        type: room.type?.description?.content,
        characteristic: room.characteristic?.description?.content,
        maxAdults: room.maxAdults,
        maxPax: room.maxPax,
        size: sizeFacility?.number || null,
        bedrooms: bedroomsFacility?.number || null,
        hasBalcony: balconyFacility?.indLogic === true,
        bedType,
        amenities,
        images: roomImages[room.roomCode] || 
                roomImages[`${room.type?.code}.${room.characteristic?.code}`] ||
                Object.values(roomImages)[0] || [],
        pricePerNight,
        totalPrice,
        boardCode: priceInfo?.boardCode || null,
        boardName: priceInfo?.boardName || null,
        rateKey: priceInfo?.rateKey || null,
        cancellation,
        paymentType: priceInfo?.paymentType || null,
      }
    })

    // Check-in/out times
    const checkInFacility = (content.facilities || []).find(f => f.facilityCode === 260 && f.facilityGroupCode === 70)
    const checkOutFacility = (content.facilities || []).find(f => f.facilityCode === 390 && f.facilityGroupCode === 70)

    // Distances
    const distances = (content.facilities || [])
      .filter(f => f.facilityGroupCode === 40 && f.distance)
      .map(f => ({ label: f.description?.content, distance: f.distance }))

    // Interest points
    const interestPoints = (content.interestPoints || []).map(p => ({
      name: p.poiName, distance: parseInt(p.distance)
    }))

    // Board basis options
    const boards = (content.boards || []).map(b => ({
      code: b.code, name: b.description?.content
    }))

    // Lowest price for sticky card
    const lowestPriceINR = priceData ? Math.round(priceData.price * EUR_TO_INR / nights) : null
    const lowestTotalINR = priceData ? Math.round(priceData.price * EUR_TO_INR) : null

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
        checkInTime: checkInFacility?.timeFrom?.slice(0,5) || '15:00',
        checkOutTime: checkOutFacility?.timeFrom?.slice(0,5) || '12:00',
        totalRooms: (content.facilities || []).find(f => f.facilityCode === 70 && f.facilityGroupCode === 10)?.number,
        floors: (content.facilities || []).find(f => f.facilityCode === 50 && f.facilityGroupCode === 10)?.number,
        images: generalImages,
        rooms: roomList,
        facilityGroups,
        boards,
        distances,
        interestPoints,
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
