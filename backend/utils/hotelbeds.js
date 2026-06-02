const axios = require('axios')

const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'

function getHeaders() {
  return {
    'X-API-Key': LITE_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
}

const cache = new Map()
function cacheGet(key) {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() > e.expires) { cache.delete(key); return null }
  return e.data
}
function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}
const TTL_SEARCH  = 60 * 60 * 1000
const TTL_CONTENT = 24 * 60 * 60 * 1000
const TTL_ROOMS   = 30 * 60 * 1000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const DESTINATION_MAP = {
  'dubai': { country: 'AE', city: 'Dubai' },
  'dubai, uae': { country: 'AE', city: 'Dubai' },
  'abu dhabi': { country: 'AE', city: 'Abu Dhabi' },
  'sharjah': { country: 'AE', city: 'Sharjah' },
  'delhi': { country: 'IN', city: 'New Delhi' },
  'new delhi': { country: 'IN', city: 'New Delhi' },
  'mumbai': { country: 'IN', city: 'Mumbai' },
  'goa': { country: 'IN', city: 'Goa' },
  'bangalore': { country: 'IN', city: 'Bangalore' },
  'bengaluru': { country: 'IN', city: 'Bangalore' },
  'chennai': { country: 'IN', city: 'Chennai' },
  'kolkata': { country: 'IN', city: 'Kolkata' },
  'hyderabad': { country: 'IN', city: 'Hyderabad' },
  'jaipur': { country: 'IN', city: 'Jaipur' },
  'agra': { country: 'IN', city: 'Agra' },
  'kerala': { country: 'IN', city: 'Kochi' },
  'kochi': { country: 'IN', city: 'Kochi' },
  'bali': { country: 'ID', city: 'Bali' },
  'singapore': { country: 'SG', city: 'Singapore' },
  'bangkok': { country: 'TH', city: 'Bangkok' },
  'phuket': { country: 'TH', city: 'Phuket' },
  'kuala lumpur': { country: 'MY', city: 'Kuala Lumpur' },
  'hanoi': { country: 'VN', city: 'Hanoi' },
  'ho chi minh': { country: 'VN', city: 'Ho Chi Minh City' },
  'london': { country: 'GB', city: 'London' },
  'paris': { country: 'FR', city: 'Paris' },
  'rome': { country: 'IT', city: 'Rome' },
  'barcelona': { country: 'ES', city: 'Barcelona' },
  'amsterdam': { country: 'NL', city: 'Amsterdam' },
  'madrid': { country: 'ES', city: 'Madrid' },
  'milan': { country: 'IT', city: 'Milan' },
  'prague': { country: 'CZ', city: 'Prague' },
  'vienna': { country: 'AT', city: 'Vienna' },
  'zurich': { country: 'CH', city: 'Zurich' },
  'lisbon': { country: 'PT', city: 'Lisbon' },
  'athens': { country: 'GR', city: 'Athens' },
  'istanbul': { country: 'TR', city: 'Istanbul' },
  'maldives': { country: 'MV', city: 'Male' },
  'male': { country: 'MV', city: 'Male' },
  'cairo': { country: 'EG', city: 'Cairo' },
  'marrakech': { country: 'MA', city: 'Marrakech' },
  'nairobi': { country: 'KE', city: 'Nairobi' },
  'cape town': { country: 'ZA', city: 'Cape Town' },
  'new york': { country: 'US', city: 'New York' },
  'los angeles': { country: 'US', city: 'Los Angeles' },
  'miami': { country: 'US', city: 'Miami' },
  'cancun': { country: 'MX', city: 'Cancun' },
  'tokyo': { country: 'JP', city: 'Tokyo' },
  'osaka': { country: 'JP', city: 'Osaka' },
  'beijing': { country: 'CN', city: 'Beijing' },
  'shanghai': { country: 'CN', city: 'Shanghai' },
  'hong kong': { country: 'HK', city: 'Hong Kong' },
  'seoul': { country: 'KR', city: 'Seoul' },
  'sydney': { country: 'AU', city: 'Sydney' },
  'melbourne': { country: 'AU', city: 'Melbourne' },
  'yerevan': { country: 'AM', city: 'Yerevan' },
  'riyadh': { country: 'SA', city: 'Riyadh' },
  'doha': { country: 'QA', city: 'Doha' },
  'muscat': { country: 'OM', city: 'Muscat' },
}

function getDestinationCode(cityName) {
  if (!cityName) return null
  const key = cityName.toLowerCase().trim().split(',')[0].trim()
  return DESTINATION_MAP[key] ? key : null
}

// Extract best image URL from a hotel object (handles multiple possible field names)
function extractImageUrl(hotelObj) {
  if (!hotelObj) return null
  // main_photo is returned in the hotels[] array of rates response
  if (hotelObj.main_photo) return hotelObj.main_photo
  // hotelImages is returned in /data/hotel endpoint
  if (hotelObj.hotelImages && hotelObj.hotelImages.length > 0) return hotelObj.hotelImages[0].url
  // images array fallback
  if (hotelObj.images && hotelObj.images.length > 0) return hotelObj.images[0].url || hotelObj.images[0]
  return null
}

async function searchHotels({ destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1, maxHotels = 40 }) {
  const cacheKey = `search:${destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
  const cached = cacheGet(cacheKey)
  if (cached) { console.log('Cache hit:', cacheKey); return cached }

  const dest = DESTINATION_MAP[destination.toLowerCase()] || DESTINATION_MAP[destination]
  if (!dest) throw new Error(`Unknown destination: ${destination}`)

  const body = {
    checkin: checkIn,
    checkout: checkOut,
    currency: 'USD',
    guestNationality: 'IN',
    countryCode: dest.country,
    cityName: dest.city,
    limit: parseInt(maxHotels),
    includeHotelData: true,
    occupancies: [{ rooms: parseInt(rooms), adults: parseInt(adults), children: children > 0 ? Array(parseInt(children)).fill(5) : [] }],
  }

  console.log(`🔍 LiteAPI search: ${dest.city} (${dest.country}) | ${checkIn}→${checkOut} | ${adults} adults`)

  try {
    const res = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(), timeout: 30000, validateStatus: () => true
    })

    if (res.status !== 200) {
      console.error('LiteAPI error:', JSON.stringify(res.data).slice(0, 300))
      throw new Error(`LiteAPI ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`)
    }

    // Log full structure of first item to understand response shape
    const rawData = res.data
    console.log('🔍 Response keys:', Object.keys(rawData))
    if (rawData.hotels && rawData.hotels[0]) {
      console.log('🔍 hotels[0] keys:', Object.keys(rawData.hotels[0]))
      console.log('🔍 hotels[0] sample:', JSON.stringify(rawData.hotels[0]).slice(0, 400))
    }
    if (rawData.data && rawData.data[0]) {
      console.log('🔍 data[0] keys:', Object.keys(rawData.data[0]))
    }

    const ratesList = rawData.data || []
    const hotelsList = rawData.hotels || []

    // Build lookup map hotelId → hotel info
    const hotelInfoMap = {}
    for (const h of hotelsList) {
      // LiteAPI uses 'id' in hotels array
      hotelInfoMap[h.id] = h
    }

    const USD_TO_INR = 84

    const hotels = ratesList.map(h => {
      const info = hotelInfoMap[h.hotelId] || {}
      const firstRate = h.roomTypes?.[0]?.rates?.[0]
      const minRateUSD = firstRate ? parseFloat(firstRate.retailRate?.total?.[0]?.amount || 0) : 0

      return {
        code: h.hotelId,
        name: info.name || h.name || 'Hotel',
        city: dest.city,
        stars: info.starRating ? Math.round(parseFloat(info.starRating)) : 5,
        minRate: minRateUSD ? Math.round(minRateUSD * USD_TO_INR) : 0,
        maxRate: null,
        currency: 'INR',
        address: info.address || null,
        imageUrl: extractImageUrl(info),   // extracts from main_photo, hotelImages, or images
        chain: info.chainName || null,
        rating: info.rating || null,
        rooms: h.roomTypes || [],
        reviews: info.rating ? [{ rate: info.rating }] : [],
      }
    })

    cacheSet(cacheKey, hotels, TTL_SEARCH)
    console.log(`✅ Found ${hotels.length} hotels`)
    console.log(`🖼️ Hotels with images: ${hotels.filter(h => h.imageUrl).length}`)
    console.log(`📛 Hotels with names: ${hotels.filter(h => h.name && h.name !== 'Hotel').length}`)
    return hotels
  } catch (err) {
    console.error('❌ LiteAPI search error:', err.message)
    throw err
  }
}

async function getHotelContent(hotelCode) {
  const cacheKey = `content:${hotelCode}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    await sleep(200)
    const res = await axios.get(`${BASE_URL}/data/hotel?hotelId=${hotelCode}`, {
      headers: getHeaders(), timeout: 15000, validateStatus: () => true
    })
    if (res.status !== 200) throw new Error(`Content API ${res.status}`)
    const hotel = res.data.data || null
    if (!hotel) return null

    // hotelImages is the correct field per docs: [{ url, caption, order }]
    const images = (hotel.hotelImages || hotel.images || []).map((img, i) => ({
      type: { code: 'GEN', description: { content: img.caption || 'General' } },
      path: img.url || img,
      visualOrder: img.order || i + 1,
      isFullUrl: true,
    }))

    const content = {
      code: hotel.id || hotelCode,
      name: { content: hotel.name },
      description: { content: hotel.hotelDescription || '' },
      category: { description: { content: hotel.starRating ? `${hotel.starRating} STARS` : '' } },
      chain: { description: { content: hotel.chainName || '' } },
      address: { content: hotel.address || '' },
      city: { content: hotel.city || '' },
      country: { description: { content: hotel.country || '' } },
      coordinates: { latitude: hotel.location?.latitude, longitude: hotel.location?.longitude },
      images,
      facilities: (hotel.hotelFacilities || []).map(f => ({
        facilityGroupCode: 70,
        description: { content: typeof f === 'string' ? f : f.name },
        indLogic: true,
      })),
      rooms: (hotel.rooms || []).map(r => ({
        roomCode: r.id || r.roomTypeId,
        description: r.name,
        type: { description: { content: r.type || 'Room' } },
        characteristic: { description: { content: r.name || '' } },
        maxAdults: r.maxOccupancy || 2,
        maxPax: r.maxOccupancy || 2,
        roomFacilities: [],
        roomStays: [],
      })),
      boards: [],
      interestPoints: [],
    }

    cacheSet(cacheKey, content, TTL_CONTENT)
    return content
  } catch (err) {
    console.warn(`⚠️ Content fetch failed for ${hotelCode}:`, err.message)
    return null
  }
}

async function getHotelRooms({ hotelCode, checkIn, checkOut, adults = 2, children = 0, rooms = 1 }) {
  const cacheKey = `rooms:${hotelCode}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const body = {
    checkin: checkIn,
    checkout: checkOut,
    currency: 'USD',
    guestNationality: 'IN',
    hotelIds: [hotelCode],
    includeHotelData: true,
    occupancies: [{ rooms: parseInt(rooms), adults: parseInt(adults), children: children > 0 ? Array(parseInt(children)).fill(5) : [] }],
  }

  try {
    await sleep(300)
    const res = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(), timeout: 30000, validateStatus: () => true
    })
    if (res.status !== 200) throw new Error(`Rooms API ${res.status}`)

    const hotelData = (res.data.data || [])[0]
    if (!hotelData) return []

    const roomList = (hotelData.roomTypes || []).map(rt => ({
      code: rt.roomTypeId || rt.offerId || rt.code,
      name: rt.rates?.[0]?.name || rt.name || 'Room',
      rates: (rt.rates || []).map(rate => ({
        rateKey: rate.offerId || rt.offerId,
        net: parseFloat(rate.retailRate?.total?.[0]?.amount || 0),
        boardCode: rate.boardCode || 'RO',
        boardName: rate.boardName || 'Room Only',
        cancellationPolicies: rate.cancellationPolicies?.cancelPolicyInfos || [],
        rateType: rate.cancellationPolicies?.refundableTag === 'RFN' ? 'RECHECK' : 'NREF',
        paymentType: 'AT_WEB',
        allotment: 5,
      }))
    }))

    if (roomList.length) cacheSet(cacheKey, roomList, TTL_ROOMS)
    return roomList
  } catch (err) {
    console.warn(`⚠️ Rooms fetch failed for ${hotelCode}:`, err.message)
    return []
  }
}

async function findHotelCode(hotelName, destCode) {
  const cacheKey = `find:${destCode}:${hotelName.toLowerCase().trim()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    const dest = DESTINATION_MAP[destCode.toLowerCase()] || null
    if (!dest) return null

    await sleep(300)
    const res = await axios.get(`${BASE_URL}/data/hotels?countryCode=${dest.country}&cityName=${encodeURIComponent(dest.city)}&limit=200`, {
      headers: getHeaders(), timeout: 15000, validateStatus: () => true
    })
    if (res.status !== 200) return null

    const hotels = res.data.data || []
    const needle = hotelName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    let bestCode = null, bestScore = 0

    for (const h of hotels) {
      const haystack = (h.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      if (haystack === needle) { bestCode = h.id; break }
      const words = needle.split(' ').filter(w => w.length > 3)
      const matches = words.filter(w => haystack.includes(w)).length
      const score = matches / Math.max(words.length, 1)
      if (score > bestScore && score >= 0.6) { bestScore = score; bestCode = h.id }
    }

    if (bestCode) cacheSet(cacheKey, bestCode, TTL_CONTENT)
    return bestCode
  } catch (err) {
    console.warn(`⚠️ findHotelCode failed:`, err.message)
    return null
  }
}

module.exports = { getDestinationCode, searchHotels, getHotelContent, getHotelRooms, findHotelCode, sleep }
