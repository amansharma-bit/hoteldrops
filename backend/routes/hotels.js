const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode, getHotelContent, getHotelRooms } = require('../utils/hotelbeds')

const PHOTO_BASE = 'https://photos.hotelbeds.com/giata/xl'

// Cache for when Hotelbeds rate limits us
const HOTEL_CACHE = {
  "372446": {
    code: 372446,
    name: { content: "Damac Maison Dubai Mall Street" },
    description: { content: "Set in the heart of the bustling Burj Area of Dubai, this exclusive private luxury aparthotel offers sumptuous city living with upmarket service and privacy. Minutes from Souk Al Bahar, Sheikh Zayed Road, Meydan, and the Dubai International Financial Centre, the hotel is the most sought-after luxury concept in Dubai for both business and leisure travellers alike. Just a short walk from the world's largest shopping complex, Dubai Mall, with views across the Dubai skyline and the famous Dubai Fountains, the hotel offers a private pool, outdoor shisha terrace, all-day dining in the modern café and opulent spa services in either one of seven high-tech treatment rooms and sauna or in the privacy of guests' room." },
    country: { code: "AE", description: { content: "United Arab Emirates" } },
    destination: { code: "DXB", name: { content: "Dubai" } },
    coordinates: { longitude: 55.283775, latitude: 25.195252 },
    category: { description: { content: "5 STARS" } },
    chain: { description: { content: "Damac Hotels & Resorts Management LLC" } },
    address: { content: "Mohammed Bin Rashid Boulevard, Downtown" },
    city: { content: "DUBAI" },
    boards: [
      { code: "BB", description: { content: "BED AND BREAKFAST" } },
      { code: "SC", description: { content: "SELF CATERING" } },
      { code: "HB", description: { content: "HALF BOARD" } },
      { code: "RO", description: { content: "ROOM ONLY" } }
    ],
    rooms: [
      { roomCode: "SUI.B2", description: "SUITE TWO BEDROOMS", type: { description: { content: "SUITE" } }, characteristic: { description: { content: "TWO BEDROOMS" } }, maxAdults: 8, maxPax: 8, roomFacilities: [{ facilityCode: 295, description: { content: "Room size (sqm)" }, number: 120 }, { facilityCode: 298, description: { content: "Number of bedrooms" }, number: 2 }, { facilityCode: 230, description: { content: "Balcony" }, indLogic: true }, { facilityCode: 115, description: { content: "Kitchen" }, indLogic: true }, { facilityCode: 130, description: { content: "Fridge" }, indLogic: true }, { facilityCode: 143, description: { content: "Tea and coffee making facilities" }, indLogic: true }, { facilityCode: 220, description: { content: "Living room" }, indLogic: true }, { facilityCode: 200, description: { content: "Safe" }, indLogic: true }], roomStays: [{ stayType: "BED", roomStayFacilities: [{ description: { content: "King-size bed 150-183 width" } }] }] },
      { roomCode: "DBL.DX", description: "DOUBLE DELUXE", type: { description: { content: "DOUBLE" } }, characteristic: { description: { content: "DELUXE" } }, maxAdults: 2, maxPax: 2, roomFacilities: [{ facilityCode: 295, description: { content: "Room size (sqm)" }, number: 38 }, { facilityCode: 230, description: { content: "Balcony" }, indLogic: true }, { facilityCode: 115, description: { content: "Kitchen" }, indLogic: true }, { facilityCode: 200, description: { content: "Safe" }, indLogic: true }], roomStays: [{ stayType: "BED", roomStayFacilities: [{ description: { content: "Double bed 131-150 width" } }] }] },
      { roomCode: "APT.B1-1", description: "APARTMENT ONE BEDROOM", type: { description: { content: "APARTMENT" } }, characteristic: { description: { content: "ONE BEDROOM" } }, maxAdults: 4, maxPax: 6, roomFacilities: [{ facilityCode: 295, description: { content: "Room size (sqm)" }, number: 77 }, { facilityCode: 230, description: { content: "Balcony" }, indLogic: true }, { facilityCode: 115, description: { content: "Kitchen" }, indLogic: true }, { facilityCode: 145, description: { content: "Washing machine" }, indLogic: true }], roomStays: [{ stayType: "BED", roomStayFacilities: [{ description: { content: "King-size bed 150-183 width" } }] }] },
      { roomCode: "SUI.B3-1", description: "SUITE THREE BEDROOMS", type: { description: { content: "SUITE" } }, characteristic: { description: { content: "THREE BEDROOMS" } }, maxAdults: 8, maxPax: 8, roomFacilities: [{ facilityCode: 295, description: { content: "Room size (sqm)" }, number: 140 }, { facilityCode: 298, description: { content: "Number of bedrooms" }, number: 3 }, { facilityCode: 230, description: { content: "Balcony" }, indLogic: true }], roomStays: [{ stayType: "BED", roomStayFacilities: [{ description: { content: "King-size bed 150-183 width" } }] }] },
    ],
    facilities: [
      { facilityCode: 260, facilityGroupCode: 70, description: { content: "Check-in hour" }, timeFrom: "15:00:00" },
      { facilityCode: 390, facilityGroupCode: 70, description: { content: "Check-out hour" }, timeFrom: "12:00:00" },
      { facilityCode: 70, facilityGroupCode: 10, description: { content: "Total number of rooms" }, number: 353 },
      { facilityCode: 50, facilityGroupCode: 10, description: { content: "Number of floors" }, number: 50 },
      { facilityCode: 550, facilityGroupCode: 70, description: { content: "Wi-fi" }, indLogic: true },
      { facilityCode: 470, facilityGroupCode: 70, description: { content: "Gym" }, indLogic: true },
      { facilityCode: 585, facilityGroupCode: 70, description: { content: "Concierge" }, indLogic: true },
      { facilityCode: 270, facilityGroupCode: 70, description: { content: "Room service" }, indLogic: true },
      { facilityCode: 280, facilityGroupCode: 70, description: { content: "Laundry service" }, indLogic: true },
      { facilityCode: 562, facilityGroupCode: 70, description: { content: "Airport Shuttle" }, indLogic: true },
      { facilityCode: 560, facilityGroupCode: 70, description: { content: "Valet parking" }, indLogic: true },
      { facilityCode: 30, facilityGroupCode: 70, description: { content: "24-hour reception" }, indYesOrNo: true },
      { facilityCode: 363, facilityGroupCode: 73, description: { content: "Outdoor freshwater pool" }, indFee: false },
      { facilityCode: 395, facilityGroupCode: 73, description: { content: "Sun loungers" }, indLogic: true },
      { facilityCode: 340, facilityGroupCode: 73, description: { content: "Kids club" }, indLogic: true },
      { facilityCode: 420, facilityGroupCode: 74, description: { content: "Sauna" }, indLogic: true },
      { facilityCode: 440, facilityGroupCode: 74, description: { content: "Steam bath" }, indLogic: true },
      { facilityCode: 450, facilityGroupCode: 74, description: { content: "Massage" }, indLogic: true },
      { facilityCode: 460, facilityGroupCode: 74, description: { content: "Spa treatments" }, indLogic: true },
      { facilityCode: 620, facilityGroupCode: 74, description: { content: "Spa centre" }, indLogic: true },
      { facilityCode: 200, facilityGroupCode: 71, description: { content: "Restaurant" }, indLogic: true },
      { facilityCode: 130, facilityGroupCode: 71, description: { content: "Bar" }, indLogic: true },
      { facilityCode: 80, facilityGroupCode: 71, description: { content: "Café" }, indLogic: true },
      { facilityCode: 10, facilityGroupCode: 40, description: { content: "City centre" }, distance: 9000 },
      { facilityCode: 80, facilityGroupCode: 40, description: { content: "Airport" }, distance: 18000 },
      { facilityCode: 40, facilityGroupCode: 40, description: { content: "Beach" }, distance: 22000 },
      { facilityCode: 145, facilityGroupCode: 40, description: { content: "Bus/Train station" }, distance: 2000 },
      { facilityCode: 125, facilityGroupCode: 40, description: { content: "Entertainment Area" }, distance: 700 },
    ],
    interestPoints: [
      { poiName: "Dubai Aquarium & Underwater Zoo", distance: "700" },
      { poiName: "Dubai Garden Glow", distance: "10700" },
      { poiName: "Dubai Water Canal", distance: "11000" },
    ],
    images: [
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_001.jpg", visualOrder: 1 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_009.jpg", visualOrder: 5 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_010.jpg", visualOrder: 6 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_011.jpg", visualOrder: 7 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_002.jpg", visualOrder: 8 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_004.jpg", visualOrder: 9 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_005.jpg", visualOrder: 10 },
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_006.jpg", visualOrder: 11 },
      { type: { code: "PIS" }, path: "37/372446/372446a_hb_p_001.jpg", visualOrder: 401 },
      { type: { code: "RES" }, path: "37/372446/372446a_hb_r_001.jpg", visualOrder: 501 },
      { type: { code: "BAR" }, path: "37/372446/372446a_hb_ba_001.jpg", visualOrder: 601 },
      { type: { code: "HAB" }, path: "37/372446/372446a_hb_ro_022.jpg", roomCode: "SUI.B2" },
      { type: { code: "HAB" }, path: "37/372446/372446a_hb_ro_018.jpg", roomCode: "DBL.DX" },
      { type: { code: "HAB" }, path: "37/372446/372446a_hb_ro_027.jpg", roomCode: "APT.B1-1" },
      { type: { code: "HAB" }, path: "37/372446/372446a_hb_ro_037.jpg", roomCode: "SUI.B3-1" },
    ]
  }
}

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

    // Fetch content — with fallback if rate limited
    let content
    try {
      content = await getHotelContent(code)
    } catch (e) {
      console.error('Content fetch error:', e.message)
      // If rate limited, return cached data for known hotels
      if (e.message.includes('403') && HOTEL_CACHE[code]) {
        console.log('Using cached data for hotel', code)
        content = HOTEL_CACHE[code]
      } else {
        return res.status(503).json({ error: 'Hotel data temporarily unavailable. Please try again in a few minutes.' })
      }
    }

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

    // Small delay to avoid Hotelbeds rate limiting
    await new Promise(r => setTimeout(r, 500))

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
