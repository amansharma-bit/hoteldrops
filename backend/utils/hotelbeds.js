const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode, getHotelContent, getHotelRooms } = require('../utils/hotelbeds')

const PHOTO_BASE = 'https://photos.hotelbeds.com/giata/xl'

// ── In-memory cache ───────────────────────────────────────────────────────────
// Keeps API calls within the 50/day test quota
const cache = new Map()

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

const TTL_SEARCH  = 60 * 60 * 1000        // 1 hour  — search results
const TTL_CONTENT = 24 * 60 * 60 * 1000   // 24 hours — hotel images/details
const TTL_ROOMS   = 30 * 60 * 1000        // 30 mins  — room prices

// ── Hotel cache for detail page (bypasses API when content unavailable) ───────
const HOTEL_CACHE = {
  "372446": {
    code: 372446,
    name: { content: "Damac Maison Dubai Mall Street" },
    description: { content: "Set in the heart of the bustling Burj Area of Dubai, this exclusive private luxury aparthotel offers sumptuous city living with upmarket service and privacy." },
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
      { roomCode: "SUI.B2", description: "SUITE TWO BEDROOMS", type: { description: { content: "SUITE" } }, characteristic: { description: { content: "TWO BEDROOMS" } }, maxAdults: 8, maxPax: 8, roomFacilities: [], roomStays: [] },
      { roomCode: "DBL.DX", description: "DOUBLE DELUXE", type: { description: { content: "DOUBLE" } }, characteristic: { description: { content: "DELUXE" } }, maxAdults: 2, maxPax: 2, roomFacilities: [], roomStays: [] },
    ],
    facilities: [],
    images: [
      { type: { code: "GEN" }, path: "37/372446/372446a_hb_a_001.jpg", visualOrder: 1 },
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

    // ── Check cache first ──────────────────────────────────────────────────
    const searchKey = `search:${destinationCode}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const cached = cacheGet(searchKey)
    if (cached) {
      console.log(`✅ Cache hit for ${destination} (${destinationCode})`)
      return res.json(cached)
    }

    console.log(`🔍 Searching: ${destination} (${destinationCode}) | ${checkIn} → ${checkOut}`)
    const hotels = await searchHotels({
      destination: destinationCode, checkIn, checkOut,
      adults: parseInt(adults), children: parseInt(children),
      rooms: parseInt(rooms), maxHotels: 40,
    })

    // ── Fetch images — use content cache per hotel ─────────────────────────
    const hotelsWithImages = await Promise.all(
      hotels.map(async (hotel) => {
        try {
          // Check content cache first
          const contentKey = `content:${hotel.code}`
          let contentData = cacheGet(contentKey)

          if (!contentData) {
            const content = await getHotelContent(hotel.code)
            const images = (content?.images || [])
              .filter(img => img.type?.code === 'GEN')
              .sort((a, b) => a.visualOrder - b.visualOrder)
            contentData = {
              imageUrl: images[0] ? `${PHOTO_BASE}/${images[0].path}` : null,
              address: content?.address?.content || null,
              chain: content?.chain?.description?.content || null,
            }
            cacheSet(contentKey, contentData, TTL_CONTENT)
          }

          return { ...hotel, ...contentData }
        } catch {
          return hotel
        }
      })
    )

    const response = {
      hotels: {
        hotels: hotelsWithImages,
        total: hotels.length,
        checkIn,
        checkOut,
        cached: false,
      }
    }

    // ── Store in cache ─────────────────────────────────────────────────────
    cacheSet(searchKey, response, TTL_SEARCH)
    console.log(`✅ Found ${hotels.length} hotels — cached for 1 hour`)

    res.json(response)
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

    // ── Content cache (images, description — doesn't change) ──────────────
    const contentKey = `content_full:${code}`
    let content = cacheGet(contentKey)

    if (!content) {
      try {
        content = await getHotelContent(code)
        if (content) cacheSet(contentKey, content, TTL_CONTENT)
      } catch (e) {
        console.error('Content fetch error:', e.message)
        if (HOTEL_CACHE[code]) {
          console.log('Using hardcoded cache for hotel', code)
          content = HOTEL_CACHE[code]
        } else {
          return res.status(503).json({ error: 'Hotel data temporarily unavailable. Please try again.' })
        }
      }
    }

    if (!content) {
      return res.status(404).json({ error: 'Hotel not found' })
    }

    const allImages = (content.images || []).sort((a, b) => a.visualOrder - b.visualOrder)
    const generalImages = allImages
      .filter(img => ['GEN', 'COM', 'PIS', 'TER', 'BAR', 'RES'].includes(img.type?.code))
      .map(img => ({ url: `${PHOTO_BASE}/${img.path}`, type: img.type?.description?.content || 'General' }))

    const roomImages = {}
    allImages.filter(img => img.type?.code === 'HAB' && img.roomCode).forEach(img => {
      if (!roomImages[img.roomCode]) roomImages[img.roomCode] = []
      roomImages[img.roomCode].push(`${PHOTO_BASE}/${img.path}`)
    })

    const facilityGroups = { general: [], sports: [], wellness: [], dining: [], connectivity: [] }
    const groupMap = { 70: 'general', 73: 'sports', 74: 'wellness', 71: 'dining', 80: 'dining' }
    ;(content.facilities || []).forEach(f => {
      const group = groupMap[f.facilityGroupCode]
      if (group && f.description?.content && f.indLogic !== false) {
        const label = f.description.content.trim()
        if (!facilityGroups[group].includes(label)) facilityGroups[group].push(label)
      }
    })

    const EUR_TO_INR = 112
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))

    // ── Room prices cache (changes more frequently, 30 min TTL) ───────────
    const roomsKey = `rooms:${code}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    let roomPrices = cacheGet(roomsKey) || {}
    let lowestPrice = null
    let lowestTotal = null

    if (Object.keys(roomPrices).length === 0) {
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
        if (Object.keys(roomPrices).length > 0) {
          cacheSet(roomsKey, roomPrices, TTL_ROOMS)
          console.log(`✅ Room prices cached for hotel ${code}`)
        }
      } catch (e) {
        console.error('Price fetch error:', e.message)
      }
    } else {
      console.log(`✅ Room prices cache hit for hotel ${code}`)
      // Recalculate lowestPrice from cached roomPrices
      let minPrice = Infinity
      for (const priceInfo of Object.values(roomPrices)) {
        if (priceInfo.price < minPrice) {
          minPrice = priceInfo.price
          lowestPrice = Math.round(priceInfo.price * EUR_TO_INR / nights)
          lowestTotal = Math.round(priceInfo.price * EUR_TO_INR)
        }
      }
    }

    const roomList = (content.rooms || []).slice(0, 15).map(room => {
      const priceInfo = roomPrices[room.roomCode]
      const sizeFacility = (room.roomFacilities || []).find(f => f.facilityCode === 295)
      const bedroomsFacility = (room.roomFacilities || []).find(f => f.facilityCode === 298)
      const balconyFacility = (room.roomFacilities || []).find(f => f.facilityCode === 230)
      const bedStay = (room.roomStays || []).find(s => s.stayType === 'BED')
      const bedType = bedStay?.roomStayFacilities?.[0]?.description?.content || null
      const amenities = (room.roomFacilities || [])
        .filter(f => f.indLogic === true && f.description?.content)
        .map(f => f.description.content.trim())
        .slice(0, 8)

      const pricePerNight = priceInfo ? Math.round(priceInfo.price * EUR_TO_INR / nights) : null
      const totalPrice = priceInfo ? Math.round(priceInfo.price * EUR_TO_INR) : null

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
        images: roomImages[room.roomCode] || Object.values(roomImages)[0] || [],
        pricePerNight,
        totalPrice,
        boardCode: priceInfo?.boardCode || null,
        boardName: priceInfo?.boardName || null,
        rateKey: priceInfo?.rateKey || null,
        cancellation,
        paymentType: priceInfo?.paymentType || null,
      }
    })

    const checkInFacility = (content.facilities || []).find(f => f.facilityCode === 260 && f.facilityGroupCode === 70)
    const checkOutFacility = (content.facilities || []).find(f => f.facilityCode === 390 && f.facilityGroupCode === 70)
    const distances = (content.facilities || [])
      .filter(f => f.facilityGroupCode === 40 && f.distance)
      .map(f => ({ label: f.description?.content, distance: f.distance }))
    const interestPoints = (content.interestPoints || []).map(p => ({ name: p.poiName, distance: parseInt(p.distance) }))
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
