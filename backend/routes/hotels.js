const express = require('express')
const router = express.Router()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'
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

const COUNTRY_NAMES = {
  AE:'United Arab Emirates', IN:'India', SG:'Singapore', TH:'Thailand',
  ID:'Indonesia', MY:'Malaysia', GB:'United Kingdom', FR:'France',
  IT:'Italy', ES:'Spain', NL:'Netherlands', TR:'Turkey', MV:'Maldives',
  ZA:'South Africa', US:'United States', JP:'Japan', HK:'Hong Kong',
  KR:'South Korea', AU:'Australia', QA:'Qatar', OM:'Oman', SA:'Saudi Arabia',
  VN:'Vietnam', PH:'Philippines', CN:'China', EG:'Egypt', MA:'Morocco',
  DE:'Germany', AT:'Austria', CH:'Switzerland', PT:'Portugal', GR:'Greece',
  CZ:'Czech Republic', SE:'Sweden', NO:'Norway', DK:'Denmark', FI:'Finland',
  BE:'Belgium', CA:'Canada', NZ:'New Zealand', LK:'Sri Lanka', NP:'Nepal',
  MX:'Mexico', BR:'Brazil', KE:'Kenya', BH:'Bahrain', KW:'Kuwait',
  JO:'Jordan', MU:'Mauritius', RU:'Russia',
}


// ── City name → flag + country (fallback when liteAPI doesn't return countryCode) ──
const CITY_LOOKUP = {
  'dubai': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'abu dhabi': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'sharjah': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'ajman': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'mumbai': { flag: '🇮🇳', country: 'India' },
  'new delhi': { flag: '🇮🇳', country: 'India' },
  'delhi': { flag: '🇮🇳', country: 'India' },
  'goa': { flag: '🇮🇳', country: 'India' },
  'bangalore': { flag: '🇮🇳', country: 'India' },
  'bengaluru': { flag: '🇮🇳', country: 'India' },
  'jaipur': { flag: '🇮🇳', country: 'India' },
  'hyderabad': { flag: '🇮🇳', country: 'India' },
  'chennai': { flag: '🇮🇳', country: 'India' },
  'kolkata': { flag: '🇮🇳', country: 'India' },
  'agra': { flag: '🇮🇳', country: 'India' },
  'kochi': { flag: '🇮🇳', country: 'India' },
  'pune': { flag: '🇮🇳', country: 'India' },
  'ahmedabad': { flag: '🇮🇳', country: 'India' },
  'amritsar': { flag: '🇮🇳', country: 'India' },
  'udaipur': { flag: '🇮🇳', country: 'India' },
  'varanasi': { flag: '🇮🇳', country: 'India' },
  'shimla': { flag: '🇮🇳', country: 'India' },
  'manali': { flag: '🇮🇳', country: 'India' },
  'singapore': { flag: '🇸🇬', country: 'Singapore' },
  'bangkok': { flag: '🇹🇭', country: 'Thailand' },
  'phuket': { flag: '🇹🇭', country: 'Thailand' },
  'chiang mai': { flag: '🇹🇭', country: 'Thailand' },
  'pattaya': { flag: '🇹🇭', country: 'Thailand' },
  'bali': { flag: '🇮🇩', country: 'Indonesia' },
  'jakarta': { flag: '🇮🇩', country: 'Indonesia' },
  'lombok': { flag: '🇮🇩', country: 'Indonesia' },
  'kuala lumpur': { flag: '🇲🇾', country: 'Malaysia' },
  'penang': { flag: '🇲🇾', country: 'Malaysia' },
  'london': { flag: '🇬🇧', country: 'United Kingdom' },
  'manchester': { flag: '🇬🇧', country: 'United Kingdom' },
  'edinburgh': { flag: '🇬🇧', country: 'United Kingdom' },
  'paris': { flag: '🇫🇷', country: 'France' },
  'nice': { flag: '🇫🇷', country: 'France' },
  'lyon': { flag: '🇫🇷', country: 'France' },
  'rome': { flag: '🇮🇹', country: 'Italy' },
  'milan': { flag: '🇮🇹', country: 'Italy' },
  'venice': { flag: '🇮🇹', country: 'Italy' },
  'florence': { flag: '🇮🇹', country: 'Italy' },
  'barcelona': { flag: '🇪🇸', country: 'Spain' },
  'madrid': { flag: '🇪🇸', country: 'Spain' },
  'seville': { flag: '🇪🇸', country: 'Spain' },
  'amsterdam': { flag: '🇳🇱', country: 'Netherlands' },
  'istanbul': { flag: '🇹🇷', country: 'Turkey' },
  'ankara': { flag: '🇹🇷', country: 'Turkey' },
  'tokyo': { flag: '🇯🇵', country: 'Japan' },
  'osaka': { flag: '🇯🇵', country: 'Japan' },
  'kyoto': { flag: '🇯🇵', country: 'Japan' },
  'hong kong': { flag: '🇭🇰', country: 'Hong Kong' },
  'seoul': { flag: '🇰🇷', country: 'South Korea' },
  'busan': { flag: '🇰🇷', country: 'South Korea' },
  'sydney': { flag: '🇦🇺', country: 'Australia' },
  'melbourne': { flag: '🇦🇺', country: 'Australia' },
  'doha': { flag: '🇶🇦', country: 'Qatar' },
  'muscat': { flag: '🇴🇲', country: 'Oman' },
  'riyadh': { flag: '🇸🇦', country: 'Saudi Arabia' },
  'jeddah': { flag: '🇸🇦', country: 'Saudi Arabia' },
  'maldives': { flag: '🇲🇻', country: 'Maldives' },
  'male': { flag: '🇲🇻', country: 'Maldives' },
  'cairo': { flag: '🇪🇬', country: 'Egypt' },
  'new york': { flag: '🇺🇸', country: 'United States' },
  'los angeles': { flag: '🇺🇸', country: 'United States' },
  'miami': { flag: '🇺🇸', country: 'United States' },
  'las vegas': { flag: '🇺🇸', country: 'United States' },
  'berlin': { flag: '🇩🇪', country: 'Germany' },
  'munich': { flag: '🇩🇪', country: 'Germany' },
  'frankfurt': { flag: '🇩🇪', country: 'Germany' },
  'vienna': { flag: '🇦🇹', country: 'Austria' },
  'zurich': { flag: '🇨🇭', country: 'Switzerland' },
  'geneva': { flag: '🇨🇭', country: 'Switzerland' },
  'lisbon': { flag: '🇵🇹', country: 'Portugal' },
  'porto': { flag: '🇵🇹', country: 'Portugal' },
  'athens': { flag: '🇬🇷', country: 'Greece' },
  'santorini': { flag: '🇬🇷', country: 'Greece' },
  'mykonos': { flag: '🇬🇷', country: 'Greece' },
  'prague': { flag: '🇨🇿', country: 'Czech Republic' },
  'stockholm': { flag: '🇸🇪', country: 'Sweden' },
  'oslo': { flag: '🇳🇴', country: 'Norway' },
  'copenhagen': { flag: '🇩🇰', country: 'Denmark' },
  'helsinki': { flag: '🇫🇮', country: 'Finland' },
  'brussels': { flag: '🇧🇪', country: 'Belgium' },
  'toronto': { flag: '🇨🇦', country: 'Canada' },
  'vancouver': { flag: '🇨🇦', country: 'Canada' },
  'auckland': { flag: '🇳🇿', country: 'New Zealand' },
  'colombo': { flag: '🇱🇰', country: 'Sri Lanka' },
  'kathmandu': { flag: '🇳🇵', country: 'Nepal' },
  'mexico city': { flag: '🇲🇽', country: 'Mexico' },
  'rio de janeiro': { flag: '🇧🇷', country: 'Brazil' },
  'nairobi': { flag: '🇰🇪', country: 'Kenya' },
  'manama': { flag: '🇧🇭', country: 'Bahrain' },
  'kuwait city': { flag: '🇰🇼', country: 'Kuwait' },
  'amman': { flag: '🇯🇴', country: 'Jordan' },
  'mauritius': { flag: '🇲🇺', country: 'Mauritius' },
  'hanoi': { flag: '🇻🇳', country: 'Vietnam' },
  'ho chi minh': { flag: '🇻🇳', country: 'Vietnam' },
  'manila': { flag: '🇵🇭', country: 'Philippines' },
  'beijing': { flag: '🇨🇳', country: 'China' },
  'shanghai': { flag: '🇨🇳', country: 'China' },
  'marrakech': { flag: '🇲🇦', country: 'Morocco' },
  'dubai marina': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'dubai mall': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'downtown dubai': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'palm jumeirah': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'deira': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'dubai hills': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'dubai silicon oasis': { flag: '🇦🇪', country: 'United Arab Emirates' },
  'jumeirah': { flag: '🇦🇪', country: 'United Arab Emirates' },
}

function getCityInfo(name) {
  if (!name) return null
  const lower = name.toLowerCase().trim()
  // Exact match first
  if (CITY_LOOKUP[lower]) return CITY_LOOKUP[lower]
  // Check if name contains a known city key
  const keys = Object.keys(CITY_LOOKUP).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (lower.includes(key)) return CITY_LOOKUP[key]
  }
  return null
}

const HOTEL_CITIES = [
  { city: 'Dubai', country: 'AE' }, { city: 'Mumbai', country: 'IN' },
  { city: 'New Delhi', country: 'IN' }, { city: 'Goa', country: 'IN' },
  { city: 'Bangalore', country: 'IN' }, { city: 'Jaipur', country: 'IN' },
  { city: 'Singapore', country: 'SG' }, { city: 'Bangkok', country: 'TH' },
  { city: 'Bali', country: 'ID' }, { city: 'London', country: 'GB' },
  { city: 'Paris', country: 'FR' }, { city: 'Rome', country: 'IT' },
  { city: 'Istanbul', country: 'TR' }, { city: 'Doha', country: 'QA' },
  { city: 'Abu Dhabi', country: 'AE' }, { city: 'Phuket', country: 'TH' },
  { city: 'Kuala Lumpur', country: 'MY' }, { city: 'Tokyo', country: 'JP' },
  { city: 'Sydney', country: 'AU' }, { city: 'Maldives', country: 'MV' },
  { city: 'Barcelona', country: 'ES' },
]

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
            type: 'hotel', name: h.name, city: h.city || city,
            country: h.country || country, countryCode: h.countryCode || country,
            hotelId: h.id,
          })
        })
      }
      await sleep(200)
    } catch (e) { console.log(`⚠️ Hotels ${city}: ${e.message}`) }
  }
  HOTEL_CACHE = allHotels
  console.log(`✅ Hotel index ready: ${HOTEL_CACHE.length} hotels`)
}

setTimeout(buildHotelIndex, 2000)

function buildOccupancies(rooms, adults, children) {
  const r = parseInt(rooms) || 1
  const a = parseInt(adults) || 2
  const c = parseInt(children) || 0
  const childAges = c > 0 ? Array(c).fill(5) : []
  return [{ rooms: r, adults: a, children: childAges }]
}

function parseRoomName(rawName) {
  if (!rawName) return { displayName: 'Room', sizeM2: null, parsedAmenities: [] }
  const parts = rawName.split(',')
  const displayName = parts[0].trim().toLowerCase().replace(/\w/g, l => l.toUpperCase())
  const sizeMatch = rawName.match(/(\d+)\s*SQM/i)
  const sizeM2 = sizeMatch ? parseInt(sizeMatch[1]) : null
  const amenityTokens = parts.slice(1).join('/').split(/[,\/]/)
  const AMENITY_MAP = {
    'wifi':'Free WiFi','wi-fi':'Free WiFi','espresso':'Espresso Machine',
    'coffee':'Coffee Maker','kettle':'Electric Kettle','minibar':'Minibar',
    'mini bar':'Minibar','hdtv':'HD TV','tv':'Flat-screen TV','usb':'USB Ports',
    'iron':'Iron & Board','balcony':'Balcony','terrace':'Terrace','bathtub':'Bathtub',
    'shower':'Shower','safe':'In-room Safe','air condition':'Air Conditioning',
    'a/c':'Air Conditioning','breakfast':'Breakfast Included','ocean view':'Ocean View',
    'sea view':'Sea View','city view':'City View','pool view':'Pool View',
    'king bed':'King Bed','queen bed':'Queen Bed','twin bed':'Twin Beds',
    'double bed':'Double Bed','sofa bed':'Sofa Bed','kitchen':'Kitchen',
    'kitchenette':'Kitchenette','desk':'Work Desk',
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
        cached[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [] }
      }
    }
    if (toUpsert.length) {
      await supabase.from('hotels_cache').upsert(toUpsert, { onConflict: 'hotel_id' })
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

// ── GET /api/hotels/suggest ───────────────────────────────────────────────────
router.get('/suggest', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ cities: [], hotels: [] })

  const query = q.toLowerCase().trim()

  // 1. City suggestions from liteAPI
  let cities = []
  try {
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })
    if (resp.status === 200 && resp.data?.data) {
      cities = resp.data.data.slice(0, 6).map(place => {
        const countryCode = place.countryCode || place.country_code || ''
        const placeName = place.name || place.displayName || q
        // Use countryCode first, fall back to city name lookup
        const cityInfo = getCityInfo(placeName)
        const countryName = place.countryName || place.country || COUNTRY_NAMES[countryCode] || cityInfo?.country || ''
        const flag = COUNTRY_FLAGS[countryCode] || cityInfo?.flag || '🌍'
        return {
          type: 'city',
          name: placeName,
          countryName,
          countryCode,
          flag,
          placeId: place.placeId || place.place_id,
        }
      }).filter(c => c.placeId)
    }
  } catch (e) {
    console.warn(`⚠️ /data/places error: ${e.message}`)
  }

  // 2. Hotel suggestions — only if query is 5+ characters
  let hotels = []
  if (query.length >= 5) {
    hotels = HOTEL_CACHE
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
        city: h.city,
        countryName: COUNTRY_NAMES[h.countryCode] || h.country,
        flag: COUNTRY_FLAGS[h.countryCode] || '',
        hotelId: h.hotelId,
      }))
  }

  console.log(`🔎 Suggest "${q}": ${cities.length} cities, ${hotels.length} hotels`)
  return res.json({ cities, hotels })
})

// ── GET /api/hotels/search ────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const {
      destination, checkIn, checkOut,
      adults = '2', children = '0', rooms = '1',
      placeId, hotelId,
    } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut are required' })
    }

    const cacheKey = `s:${placeId || hotelId || destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const hit = memGet(cacheKey)
    if (hit) return res.json({ hotels: { hotels: hit, total: hit.length, checkIn, checkOut } })

    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'INR',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children),
      limit: 50,
      maxRatesPerHotel: 1,
      includeHotelData: true,
      timeout: 8,
    }

    if (hotelId) {
      body.hotelIds = [hotelId]
      body.limit = 1
    } else if (placeId) {
      body.placeId = placeId
    } else {
      return res.status(400).json({ error: 'Please select a destination from the dropdown' })
    }

    const resp = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(), timeout: 30000, validateStatus: () => true,
    })

    if (resp.status !== 200) {
      return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data })
    }

    const ratesList = resp.data.data || []
    const hotelMeta = {}
    for (const h of (resp.data.hotels || [])) hotelMeta[h.id] = h

    let hotels = ratesList.map(h => {
      const meta = hotelMeta[h.hotelId] || {}
      const firstRT = h.roomTypes?.[0]
      const firstRate = firstRT?.rates?.[0]
      if (!firstRate) return null

      const taxes = firstRate?.taxesAndFees || []
      const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
      if (hasPayAtHotel) return null

      // Price is now directly in INR
      const priceINR = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || firstRate?.net || 0)
      if (!priceINR) return null
      const rebuqPriceINR = Math.round(priceINR * MARKUP)
      const otaPriceINR = Math.round(priceINR)
      const memberSaving = 0

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
    memSet(cacheKey, hotels)
    return res.json({ hotels: { hotels, total: hotels.length, checkIn, checkOut } })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/hotels/:code ─────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = '2', children = '0', rooms = '1' } = req.query
    if (!checkIn || !checkOut) return res.status(400).json({ error: 'checkIn and checkOut required' })
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))

    const [contentResp, ratesResp, reviewsResp, roomsResp] = await Promise.all([
      axios.get(`${BASE_URL}/data/hotel?hotelId=${code}`, { headers: getHeaders(), timeout: 12000, validateStatus: () => true }),
      axios.post(`${BASE_URL}/hotels/rates`, {
        checkin: checkIn, checkout: checkOut, currency: 'INR', guestNationality: 'IN',
        hotelIds: [code], occupancies: buildOccupancies(rooms, adults, children),
        includeHotelData: false, roomMapping: true,
      }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true }),
      axios.get(`${BASE_URL}/data/reviews?hotelId=${code}&timeout=4&getSentiment=true`, { headers: getHeaders(), timeout: 6000, validateStatus: () => true }),
      axios.get(`${BASE_URL}/data/rooms?hotelId=${code}`, { headers: getHeaders(), timeout: 10000, validateStatus: () => true }),
    ])

    const d = contentResp.data?.data
    if (!d) return res.status(404).json({ error: 'Hotel not found' })

    const images = (d.hotelImages || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(img => ({ url: img.url, caption: img.caption || 'Hotel' }))
    const roomsData = (roomsResp?.status === 200 && roomsResp?.data?.data) ? roomsResp.data.data : (d.rooms || [])

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
        staticRooms[roomId] = roomData; staticRooms[String(roomId)] = roomData; staticRooms[Number(roomId)] = roomData
      }
      if (sr.name) { staticRooms[sr.name.toLowerCase().trim()] = roomData; staticRooms[sr.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData }
      if (sr.roomName) { staticRooms[sr.roomName.toLowerCase().trim()] = roomData; staticRooms[sr.roomName.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData }
    }

    const allFacilities = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
    const facilityGroups = { Access: [], 'Activities & Sports': [], 'Services & Conveniences': [], 'Safety & Security': [], 'Room Amenities': [], 'Safety & Cleanliness': [] }
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
    const popularFacilities = popularFacilityKeywords.filter(pk => allFacilities.some(f => pk.key.test(f))).map(pk => pk.label).slice(0, 8)

    let roomList = []
    if (ratesResp.status === 200) {
      const hotelData = (ratesResp.data?.data || [])[0]
      roomList = (hotelData?.roomTypes || []).map(rt => {
        const rate = rt.rates?.[0]
        if (!rate) return null
        const taxes = rate?.taxesAndFees || []
        const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
        if (hasPayAtHotel) return null
        const priceINR = parseFloat(rate?.retailRate?.total?.[0]?.amount || rate?.net || 0)
        if (!priceINR) return null
        const totalINR = Math.round(priceINR * MARKUP)
        const perNightINR = Math.round(totalINR / nights)
        const otaTotalINR = Math.round(priceINR)
        const memberSaving = 0
        const boardType = rate?.boardType || rate?.boardCode || 'RO'
        const refTag = rate?.cancellationPolicies?.refundableTag
        const mappedId = rt.mappedRoomId || rt.roomId || null
        const roomName = (rate?.name || rt.name || '').toLowerCase().trim()
        const normName = roomName.replace(/[^a-z0-9]/g, '')
        const staticRoom = (mappedId !== null && staticRooms[mappedId] !== undefined) ? staticRooms[mappedId]
          : (mappedId !== null && staticRooms[String(mappedId)] !== undefined) ? staticRooms[String(mappedId)]
          : (roomName && staticRooms[roomName]) ? staticRooms[roomName]
          : (normName && staticRooms[normName]) ? staticRooms[normName]
          : (() => { const keys = Object.keys(staticRooms); const match = keys.find(k => normName.length > 4 && (k.includes(normName.slice(0,6)) || normName.includes(k.replace(/[^a-z0-9]/g,'').slice(0,6)))); return match ? staticRooms[match] : {} })()
        const roomPhotos = staticRoom.photos?.length ? staticRoom.photos.slice(0, 5) : images.slice(0, 3).map(i => i.url)
        const rawName = rate?.name || rt.name || 'Room'
        const parsed = parseRoomName(rawName)
        return {
          offerId: rt.offerId, mappedRoomId: mappedId, rawName,
          name: parsed.displayName, description: staticRoom.description || '',
          boardCode: boardType, boardName: rate?.boardName || (boardType === 'RO' ? 'Room Only' : 'Breakfast Included'),
          hasBreakfast: !['RO', 'Room Only'].includes(boardType),
          maxOccupancy: rate?.maxOccupancy || parseInt(adults),
          sizeM2: staticRoom.sizeM2 || parsed.sizeM2,
          bedTypes: staticRoom.bedTypes?.length ? staticRoom.bedTypes : [],
          amenities: staticRoom.amenities?.length ? staticRoom.amenities : parsed.parsedAmenities,
          photos: roomPhotos, pricePerNight: perNightINR, totalPrice: totalINR,
          otaTotalINR, memberSaving, taxesIncluded: true,
          isRefundable: refTag === 'RFN', refundableTag: refTag || null,
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
    let reviews = [], sentimentAnalysis = null
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
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router
