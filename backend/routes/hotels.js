const express = require('express')
const router = express.Router()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'
const USD_TO_INR = 97
const MARKUP = 1.00

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function getHeaders() {
  return {
    'X-API-Key': LITE_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── In-memory search cache (1 hour) ──────────────────────────────────────────
const memCache = new Map()
function memGet(key) {
  const e = memCache.get(key)
  if (!e) return null
  if (Date.now() > e.exp) { memCache.delete(key); return null }
  return e.data
}
function memSet(key, data, ttlMs = 3600000) {
  memCache.set(key, { data, exp: Date.now() + ttlMs })
}

const COUNTRY_FLAGS = {
  AE:'🇦🇪', IN:'🇮🇳', SG:'🇸🇬', TH:'🇹🇭', ID:'🇮🇩', MY:'🇲🇾', GB:'🇬🇧',
  FR:'🇫🇷', IT:'🇮🇹', ES:'🇪🇸', NL:'🇳🇱', TR:'🇹🇷', MV:'🇲🇻', ZA:'🇿🇦',
  US:'🇺🇸', JP:'🇯🇵', HK:'🇭🇰', KR:'🇰🇷', AU:'🇦🇺', QA:'🇶🇦', OM:'🇴🇲',
  SA:'🇸🇦', VN:'🇻🇳', PH:'🇵🇭', CN:'🇨🇳', EG:'🇪🇬', MA:'🇲🇦',
  DE:'🇩🇪', AT:'🇦🇹', CH:'🇨🇭', PT:'🇵🇹', GR:'🇬🇷', CZ:'🇨🇿', SE:'🇸🇪',
  NO:'🇳🇴', DK:'🇩🇰', FI:'🇫🇮', BE:'🇧🇪', CA:'🇨🇦', NZ:'🇳🇿', LK:'🇱🇰',
  NP:'🇳🇵', MX:'🇲🇽', BR:'🇧🇷', KE:'🇰🇪', BH:'🇧🇭', KW:'🇰🇼', JO:'🇯🇴',
  MU:'🇲🇺', RU:'🇷🇺',
}

// ── Top cities hotel cache — pre-fetched at startup ───────────────────────────
// Only used for hotel name search in /suggest
const HOTEL_CITIES = [
  { city: 'Dubai', country: 'AE' },
  { city: 'Mumbai', country: 'IN' },
  { city: 'New Delhi', country: 'IN' },
  { city: 'Goa', country: 'IN' },
  { city: 'Bangalore', country: 'IN' },
  { city: 'Jaipur', country: 'IN' },
  { city: 'Singapore', country: 'SG' },
  { city: 'Bangkok', country: 'TH' },
  { city: 'Bali', country: 'ID' },
  { city: 'London', country: 'GB' },
  { city: 'Paris', country: 'FR' },
  { city: 'Rome', country: 'IT' },
  { city: 'Istanbul', country: 'TR' },
  { city: 'Doha', country: 'QA' },
  { city: 'Abu Dhabi', country: 'AE' },
  { city: 'Phuket', country: 'TH' },
  { city: 'Kuala Lumpur', country: 'MY' },
  { city: 'Tokyo', country: 'JP' },
  { city: 'Sydney', country: 'AU' },
  { city: 'Maldives', country: 'MV' },
  { city: 'Barcelona', country: 'ES' },
]

// HOTEL_CACHE: { name, city, country, hotelId, flag }
let HOTEL_CACHE = []

async function buildHotelIndex() {
  console.log('📦 Building hotel index...')
  const allHotels = []
  for (const { city, country } of HOTEL_CITIES) {
    try {
      const resp = await axios.get(`${BASE_URL}/data/hotels?countryCode=${country}&cityName=${encodeURIComponent(city)}&limit=1000`, {
        headers: getHeaders(), timeout: 10000, validateStatus: () => true,
      })
      if (resp.status === 200 && resp.data?.data) {
        resp.data.data.forEach(h => {
          if (h.name && h.id) allHotels.push({
            type: 'hotel',
            name: h.name,
            city: h.city || city,
            country: h.country || country,
            countryCode: h.countryCode || country,
            hotelId: h.id,
            flag: COUNTRY_FLAGS[h.countryCode || country] || '🏨',
          })
        })
      }
      await sleep(200)
    } catch (e) { console.log(`⚠️ Hotels ${city}: ${e.message}`) }
  }
  HOTEL_CACHE = allHotels
  console.log(`✅ Hotel index ready: ${HOTEL_CACHE.length} hotels across ${HOTEL_CITIES.length} cities`)
}

setTimeout(buildHotelIndex, 2000)

// ── Build occupancies ─────────────────────────────────────────────────────────
function buildOccupancies(rooms, adults, children) {
  const r = parseInt(rooms) || 1
  const a = parseInt(adults) || 2
  const c = parseInt(children) || 0
  const childAges = c > 0 ? Array(c).fill(5) : []
  return [{ rooms: r, adults: a, children: childAges }]
}

// ── Parse room name ───────────────────────────────────────────────────────────
function parseRoomName(rawName) {
  if (!rawName) return { displayName: 'Room', sizeM2: null, parsedAmenities: [] }
  const parts = rawName.split(',')
  const displayName = parts[0].trim().toLowerCase().replace(/\w/g, l => l.toUpperCase())
  const sizeMatch = rawName.match(/(\d+)\s*SQM/i)
  const sizeM2 = sizeMatch ? parseInt(sizeMatch[1]) : null
  const amenityTokens = parts.slice(1).join('/').split(/[,\/]/)
  const AMENITY_MAP = {
    'wifi': 'Free WiFi', 'wi-fi': 'Free WiFi', 'espresso': 'Espresso Machine',
    'coffee': 'Coffee Maker', 'tea kettle': 'Tea Kettle', 'kettle': 'Electric Kettle',
    'minibar': 'Minibar', 'mini bar': 'Minibar', 'hdtv': 'HD TV', 'tv': 'Flat-screen TV',
    'usb port': 'USB Ports', 'usb': 'USB Ports', 'iron': 'Iron & Board',
    'balcony': 'Balcony', 'terrace': 'Terrace', 'bathtub': 'Bathtub', 'shower': 'Shower',
    'safe': 'In-room Safe', 'air condition': 'Air Conditioning', 'a/c': 'Air Conditioning',
    'breakfast': 'Breakfast Included', 'ocean view': 'Ocean View', 'sea view': 'Sea View',
    'city view': 'City View', 'pool view': 'Pool View', 'king bed': 'King Bed',
    'queen bed': 'Queen Bed', 'twin bed': 'Twin Beds', 'double bed': 'Double Bed',
    'sofa bed': 'Sofa Bed', 'kitchen': 'Kitchen', 'kitchenette': 'Kitchenette',
    'desk': 'Work Desk',
  }
  const parsedAmenities = []
  const seen = new Set()
  for (const token of amenityTokens) {
    const t = token.trim().toLowerCase()
    if (!t || t.match(/^\d+\s*sqm$/i)) continue
    for (const [key, label] of Object.entries(AMENITY_MAP)) {
      if (t.includes(key) && !seen.has(label)) { seen.add(label); parsedAmenities.push(label) }
    }
  }
  return { displayName, sizeM2, parsedAmenities }
}

// ── Supabase coords cache ─────────────────────────────────────────────────────
async function enrichWithCoords(hotels) {
  if (!hotels.length) return hotels
  const ids = hotels.map(h => String(h.code))
  const { data: rows, error } = await supabase
    .from('hotels_cache')
    .select('hotel_id, latitude, longitude, amenities, star_rating')
    .in('hotel_id', ids)
  if (error) console.warn('⚠️ Supabase read error:', error.message)
  const cached = {}
  for (const row of (rows || [])) cached[row.hotel_id] = row
  const missing = hotels.filter(h => !cached[String(h.code)])
  console.log(`📍 Coords cache: ${Object.keys(cached).length} hit, ${missing.length} miss`)
  if (missing.length > 0) {
    const toUpsert = []
    for (const hotel of missing) {
      try {
        await sleep(200)
        const r = await axios.get(`${BASE_URL}/data/hotel?hotelId=${hotel.code}`, {
          headers: getHeaders(), timeout: 8000, validateStatus: () => true
        })
        const d = r.status === 200 ? r.data?.data : null
        const row = {
          hotel_id: String(hotel.code),
          name: (d ? d.name : null) || hotel.name,
          latitude: d?.location?.latitude || null,
          longitude: d?.location?.longitude || null,
          amenities: d ? (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean) : [],
          star_rating: d?.starRating ? Math.round(parseFloat(d.starRating)) : (hotel.stars || null),
          cached_at: new Date().toISOString(),
        }
        cached[String(hotel.code)] = row
        toUpsert.push(row)
      } catch (e) {
        console.warn(`⚠️ /data/hotel failed for ${hotel.code}:`, e.message)
        cached[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [] }
      }
    }
    if (toUpsert.length) {
      const { error: uErr } = await supabase.from('hotels_cache').upsert(toUpsert, { onConflict: 'hotel_id' })
      if (uErr) console.warn('⚠️ Supabase upsert error:', uErr.message)
      else console.log(`✅ Cached ${toUpsert.length} hotels`)
    }
  }
  return hotels.map(h => {
    const c = cached[String(h.code)] || {}
    return {
      ...h,
      latitude: c.latitude || h.latitude || null,
      longitude: c.longitude || h.longitude || null,
      amenities: c.amenities?.length ? c.amenities : (h.amenities || []),
      stars: c.star_rating || h.stars || null,
    }
  })
}

// ── GET /api/hotels/suggest?q= ────────────────────────────────────────────────
// Calls liteAPI /data/places for city autocomplete (returns placeId)
// Searches HOTEL_CACHE for hotel name autocomplete (returns hotelId)
router.get('/suggest', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ cities: [], hotels: [] })

  const query = q.toLowerCase().trim()

  // 1. City suggestions — call liteAPI /data/places (Google Places backed, returns placeId)
  let cities = []
  try {
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })
    if (resp.status === 200 && resp.data?.data) {
      cities = resp.data.data.slice(0, 5).map(place => ({
        type: 'city',
        name: place.name || place.displayName || q,
        subtext: place.countryName || place.country || '',
        flag: COUNTRY_FLAGS[(place.countryCode || '').toUpperCase()] || '🌍',
        placeId: place.placeId || place.place_id,   // ← THE KEY — used in /search
        countryCode: place.countryCode || '',
      })).filter(c => c.placeId) // only keep results with a placeId
    }
  } catch (e) {
    console.warn(`⚠️ /data/places error: ${e.message}`)
  }

  // 2. Hotel suggestions — search HOTEL_CACHE by name (returns hotelId)
  const hotels = HOTEL_CACHE
    .filter(h => h.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aStart = a.name.toLowerCase().startsWith(query)
      const bStart = b.name.toLowerCase().startsWith(query)
      if (aStart && !bStart) return -1
      if (!aStart && bStart) return 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, 5)
    .map(h => ({
      type: 'hotel',
      name: h.name,
      subtext: `${h.city}, ${h.country}`,
      flag: h.flag,
      hotelId: h.hotelId,   // ← THE KEY — used in /search
    }))

  console.log(`🔎 Suggest "${q}": ${cities.length} cities, ${hotels.length} hotels`)
  return res.json({ cities, hotels, total: cities.length + hotels.length })
})

// ── GET /api/hotels/search ────────────────────────────────────────────────────
// Accepts either: placeId (city search) OR hotelId (direct hotel search)
router.get('/search', async (req, res) => {
  try {
    const {
      destination, checkIn, checkOut,
      adults = '2', children = '0', rooms = '1',
      placeId,    // city placeId from /suggest
      hotelId,    // specific hotel ID from /suggest
    } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut are required' })
    }

    const cacheKey = `s:${placeId || hotelId || destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const hit = memGet(cacheKey)
    if (hit) {
      console.log(`💾 Cache hit`)
      return res.json({ hotels: { hotels: hit, total: hit.length, checkIn, checkOut } })
    }

    // Build liteAPI request body
    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'USD',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children),
      limit: 50,
      maxRatesPerHotel: 1,
      includeHotelData: true,
      timeout: 8,
    }

    if (hotelId) {
      // Direct hotel search — user selected a specific hotel
      body.hotelIds = [hotelId]
      body.limit = 1
      console.log(`🏨 Hotel search: hotelId=${hotelId}`)
    } else if (placeId) {
      // City search using placeId — most reliable method
      body.placeId = placeId
      console.log(`🌍 City search: placeId=${placeId}`)
    } else if (destination) {
      // Fallback: if no placeId/hotelId, this will likely fail for non-mapped cities
      // but keeping as last resort
      console.warn(`⚠️ No placeId or hotelId — using raw destination: ${destination}`)
      return res.status(400).json({ error: 'Please select a destination from the dropdown' })
    } else {
      return res.status(400).json({ error: 'destination, placeId, or hotelId required' })
    }

    console.log(`📤 liteAPI body: ${JSON.stringify(body)}`)

    const resp = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(),
      timeout: 30000,
      validateStatus: () => true,
    })

    console.log(`📥 liteAPI status: ${resp.status}`)

    if (resp.status !== 200) {
      console.error('❌ liteAPI error:', JSON.stringify(resp.data).slice(0, 500))
      return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data })
    }

    const ratesList = resp.data.data || []
    const hotelMeta = {}
    for (const h of (resp.data.hotels || [])) hotelMeta[h.id] = h

    console.log(`✅ liteAPI: ${ratesList.length} rates, ${Object.keys(hotelMeta).length} hotel meta entries`)

    let hotels = ratesList.map(h => {
      const meta = hotelMeta[h.hotelId] || {}
      const firstRT = h.roomTypes?.[0]
      const firstRate = firstRT?.rates?.[0]
      if (!firstRate) return null

      const taxes = firstRate?.taxesAndFees || []
      const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
      if (hasPayAtHotel) return null

      const netUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || firstRate?.net || 0)
      if (!netUSD) return null
      const rebuqPriceINR = Math.round(netUSD * USD_TO_INR * MARKUP)

      const retailUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || 0)
      const otaPriceINR = retailUSD ? Math.round(retailUSD * USD_TO_INR) : 0
      const memberSaving = otaPriceINR > rebuqPriceINR ? otaPriceINR - rebuqPriceINR : 0

      const refTag = firstRate?.cancellationPolicies?.refundableTag || null
      const boardType = firstRate?.boardType || firstRate?.boardCode || 'RO'

      return {
        code: h.hotelId,
        name: meta.name || 'Hotel',
        city: meta.city || destination || '',
        stars: meta.stars || (meta.starRating ? Math.round(parseFloat(meta.starRating)) : null),
        minRate: rebuqPriceINR,
        lowestPriceINR: rebuqPriceINR,
        otaPriceINR,
        memberSaving,
        currency: 'INR',
        address: meta.address || null,
        imageUrl: meta.main_photo || meta.thumbnail || null,
        chain: meta.chainName || null,
        rating: meta.rating || null,
        reviewCount: meta.review_count || null,
        latitude: meta.location?.latitude || null,
        longitude: meta.location?.longitude || null,
        isRefundable: refTag === 'RFN' ? true : refTag === 'NRFN' ? false : null,
        hasBreakfast: !['RO', 'Room Only', '', null, undefined].includes(boardType),
        taxesIncluded: true,
        amenities: [],
        roomTypes: h.roomTypes || [],
      }
    }).filter(Boolean)

    hotels = await enrichWithCoords(hotels)

    console.log(`📍 Coords after enrichment: ${hotels.filter(h => h.latitude && h.longitude).length}`)
    console.log(`🖼️ With images: ${hotels.filter(h => h.imageUrl).length}`)

    memSet(cacheKey, hotels)
    return res.json({ hotels: { hotels, total: hotels.length, checkIn, checkOut } })

  } catch (err) {
    console.error('❌ /search error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/hotels/:code ─────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = '2', children = '0', rooms = '1' } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut required' })
    }

    const nights = Math.max(1, Math.round(
      (new Date(checkOut) - new Date(checkIn)) / 86400000
    ))

    console.log(`🏨 Hotel detail: ${code} | ${checkIn}→${checkOut} | ${nights}N`)

    const [contentResp, ratesResp, reviewsResp, roomsResp] = await Promise.all([
      axios.get(`${BASE_URL}/data/hotel?hotelId=${code}`, {
        headers: getHeaders(), timeout: 12000, validateStatus: () => true,
      }),
      axios.post(`${BASE_URL}/hotels/rates`, {
        checkin: checkIn,
        checkout: checkOut,
        currency: 'USD',
        guestNationality: 'IN',
        hotelIds: [code],
        occupancies: buildOccupancies(rooms, adults, children),
        includeHotelData: false,
        roomMapping: true,
      }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true }),
      axios.get(`${BASE_URL}/data/reviews?hotelId=${code}&timeout=4&getSentiment=true`, {
        headers: getHeaders(), timeout: 6000, validateStatus: () => true,
      }),
      axios.get(`${BASE_URL}/data/rooms?hotelId=${code}`, {
        headers: getHeaders(), timeout: 10000, validateStatus: () => true,
      }),
    ])

    const d = contentResp.data?.data
    if (!d) return res.status(404).json({ error: 'Hotel not found' })

    const images = (d.hotelImages || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(img => ({ url: img.url, caption: img.caption || 'Hotel' }))

    const roomsData = (roomsResp?.status === 200 && roomsResp?.data?.data)
      ? roomsResp.data.data : (d.rooms || [])
    console.log(`🏠 Rooms: ${roomsData.length}`)

    const staticRooms = {}
    for (const sr of roomsData) {
      const roomData = {
        description: sr.description || '',
        sizeM2: sr.roomSizeSquare || null,
        bedTypes: (sr.bedTypes || []).map(b => [b.quantity > 1 ? b.quantity + ' ' : '', b.bedType || '', b.bedSize ? ' (' + b.bedSize + ')' : ''].join('')).filter(Boolean),
        amenities: (sr.roomAmenities || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).slice(0, 8),
        photos: (sr.photos || []).sort((a,b) => (b.score||0)-(a.score||0)).map(p => p.url || p.failoverPhoto).filter(p => p && p.startsWith('http')).slice(0, 5),
      }
      const roomId = sr.id || sr.roomId
      if (roomId !== undefined && roomId !== null) {
        staticRooms[roomId] = roomData
        staticRooms[String(roomId)] = roomData
        staticRooms[Number(roomId)] = roomData
      }
      if (sr.name) {
        staticRooms[sr.name.toLowerCase().trim()] = roomData
        staticRooms[sr.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData
      }
      if (sr.roomName) {
        staticRooms[sr.roomName.toLowerCase().trim()] = roomData
        staticRooms[sr.roomName.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData
      }
    }

    const allFacilities = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
    const facilityGroups = {
      Access: [], 'Activities & Sports': [], 'Services & Conveniences': [],
      'Safety & Security': [], 'Room Amenities': [], 'Safety & Cleanliness': [],
    }
    for (const f of allFacilities) {
      const fl = f.toLowerCase()
      if (/front desk|check.in|check.out|concierge|lobby|reception/.test(fl)) facilityGroups['Access'].push(f)
      else if (/pool|gym|fitness|sport|tennis|golf|spa|sauna|massage|wellness|aqua/.test(fl)) facilityGroups['Activities & Sports'].push(f)
      else if (/restaurant|bar|breakfast|dining|cafe|room service|laundry|dry.clean|currency|luggage|parking|airport|shuttle|wifi|internet|business/.test(fl)) facilityGroups['Services & Conveniences'].push(f)
      else if (/security|cctv|fire|smoke|safe|safety/.test(fl)) facilityGroups['Safety & Security'].push(f)
      else if (/clean|sanitiz|hygiene|disinfect/.test(fl)) facilityGroups['Safety & Cleanliness'].push(f)
      else facilityGroups['Room Amenities'].push(f)
    }

    const popularFacilityKeywords = [
      { key: /pool|swimming/i, label: 'Swimming Pool' }, { key: /wifi|internet/i, label: 'Free WiFi' },
      { key: /breakfast/i, label: 'Breakfast' }, { key: /room service/i, label: '24/7 Room Service' },
      { key: /fitness|gym/i, label: 'Fitness Centre' }, { key: /spa|massage/i, label: 'Spa & Wellness' },
      { key: /parking/i, label: 'Parking' }, { key: /airport|transfer/i, label: 'Airport Transfer' },
      { key: /restaurant/i, label: 'Restaurant' }, { key: /bar/i, label: 'Bar' },
    ]
    const popularFacilities = popularFacilityKeywords
      .filter(pk => allFacilities.some(f => pk.key.test(f)))
      .map(pk => pk.label).slice(0, 8)

    let roomList = []
    if (ratesResp.status === 200) {
      const hotelData = (ratesResp.data?.data || [])[0]
      roomList = (hotelData?.roomTypes || []).map(rt => {
        const rate = rt.rates?.[0]
        if (!rate) return null
        const taxes = rate?.taxesAndFees || []
        const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
        if (hasPayAtHotel) return null
        const netUSD = parseFloat(rate?.retailRate?.total?.[0]?.amount || rate?.net || 0)
        if (!netUSD) return null
        const totalINR = Math.round(netUSD * USD_TO_INR * MARKUP)
        const perNightINR = Math.round(totalINR / nights)
        const otaUSD = parseFloat(rate?.retailRate?.total?.[0]?.amount || 0)
        const otaTotalINR = otaUSD ? Math.round(otaUSD * USD_TO_INR) : 0
        const memberSaving = otaTotalINR > totalINR ? otaTotalINR - totalINR : 0
        const boardType = rate?.boardType || rate?.boardCode || 'RO'
        const refTag = rate?.cancellationPolicies?.refundableTag
        const mappedId = rt.mappedRoomId || rt.roomId || null
        const roomName = (rate?.name || rt.name || '').toLowerCase().trim()
        const normName = roomName.replace(/[^a-z0-9]/g, '')
        const staticRoom = (mappedId !== null && staticRooms[mappedId] !== undefined)
          ? staticRooms[mappedId]
          : (mappedId !== null && staticRooms[String(mappedId)] !== undefined)
          ? staticRooms[String(mappedId)]
          : (roomName && staticRooms[roomName]) ? staticRooms[roomName]
          : (normName && staticRooms[normName]) ? staticRooms[normName]
          : (() => {
              const keys = Object.keys(staticRooms)
              const match = keys.find(k => normName.length > 4 && (k.includes(normName.slice(0,6)) || normName.includes(k.replace(/[^a-z0-9]/g,'').slice(0,6))))
              return match ? staticRooms[match] : {}
            })()
        const roomPhotos = staticRoom.photos?.length ? staticRoom.photos.slice(0, 5) : images.slice(0, 3).map(i => i.url)
        const rawName = rate?.name || rt.name || 'Room'
        const parsed = parseRoomName(rawName)
        return {
          offerId: rt.offerId,
          mappedRoomId: mappedId,
          rawName,
          name: parsed.displayName,
          description: staticRoom.description || '',
          boardCode: boardType,
          boardName: rate?.boardName || (boardType === 'RO' ? 'Room Only' : 'Breakfast Included'),
          hasBreakfast: !['RO', 'Room Only'].includes(boardType),
          maxOccupancy: rate?.maxOccupancy || parseInt(adults),
          sizeM2: staticRoom.sizeM2 || parsed.sizeM2,
          bedTypes: staticRoom.bedTypes?.length ? staticRoom.bedTypes : [],
          amenities: staticRoom.amenities?.length ? staticRoom.amenities : parsed.parsedAmenities,
          photos: roomPhotos,
          pricePerNight: perNightINR,
          totalPrice: totalINR,
          otaTotalINR,
          memberSaving,
          taxesIncluded: true,
          isRefundable: refTag === 'RFN',
          refundableTag: refTag || null,
          cancelPolicies: rate?.cancellationPolicies?.cancelPolicyInfos || [],
          freeCancelUntil: (() => {
            const policies = rate?.cancellationPolicies?.cancelPolicyInfos || []
            const freePolicy = policies.find(p => p.cancelCharge === 0 || p.amount === 0)
            if (freePolicy?.cancelTime) return freePolicy.cancelTime.split('T')[0]
            if (refTag === 'RFN' && policies[0]?.cancelTime) return policies[0].cancelTime.split('T')[0]
            return null
          })(),
        }
      }).filter(Boolean)
    }

    const cheapest = roomList.reduce((m, r) => (!m || (r.pricePerNight && r.pricePerNight < m.pricePerNight)) ? r : m, null)

    let reviews = []
    let sentimentAnalysis = null
    if (reviewsResp.status === 200 && reviewsResp.data?.data) {
      const rd = reviewsResp.data.data
      reviews = (Array.isArray(rd) ? rd : (rd.reviews || [])).slice(0, 10).map(r => ({
        score: r.averageScore || null, name: r.name || 'Guest', country: r.country || '',
        type: r.type || '', date: r.date ? r.date.substring(0, 10) : '',
        headline: r.headline || '', pros: r.pros || '', cons: r.cons || '',
      }))
      sentimentAnalysis = rd.sentimentAnalysis || reviewsResp.data?.sentimentAnalysis || null
    }

    return res.json({
      success: true,
      hotel: {
        code: d.id || code, name: d.name, description: d.hotelDescription || '',
        importantInfo: d.hotelImportantInformation || '',
        stars: d.starRating ? Math.round(parseFloat(d.starRating)) : null,
        rating: d.rating || null, reviewCount: d.reviewCount || null,
        chain: d.chainName || null, address: d.address || '',
        city: d.city || '', country: d.country || '',
        coordinates: { latitude: d.location?.latitude || null, longitude: d.location?.longitude || null },
        checkInTime: d.checkinCheckoutTimes?.checkin || '15:00',
        checkOutTime: d.checkinCheckoutTimes?.checkout || '12:00',
        images, rooms: roomList, facilityGroups, allFacilities, popularFacilities,
        lowestPriceINR: cheapest?.pricePerNight || null,
        lowestTotalINR: cheapest?.totalPrice || null,
        cheapestRoom: cheapest || null, nights, checkIn, checkOut,
        adults: parseInt(adults), reviews, sentimentAnalysis,
      }
    })

  } catch (err) {
    console.error('❌ /hotel/:code error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router
