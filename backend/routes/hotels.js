const express = require('express')
const router = express.Router()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

// ── Constants ─────────────────────────────────────────────────────────────────
const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'
const USD_TO_INR = 97
const MARKUP = 1.00  // 0% markup — showing raw wholesale price for investor demo

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


// ── Static search index — cities + hotels pre-fetched at startup ─────────────
const COUNTRY_FLAGS = {
  AE:'🇦🇪', IN:'🇮🇳', SG:'🇸🇬', TH:'🇹🇭', ID:'🇮🇩', MY:'🇲🇾', GB:'🇬🇧',
  FR:'🇫🇷', IT:'🇮🇹', ES:'🇪🇸', NL:'🇳🇱', TR:'🇹🇷', MV:'🇲🇻', ZA:'🇿🇦',
  US:'🇺🇸', JP:'🇯🇵', HK:'🇭🇰', KR:'🇰🇷', AU:'🇦🇺', QA:'🇶🇦', OM:'🇴🇲',
  SA:'🇸🇦', VN:'🇻🇳', PH:'🇵🇭', CN:'🇨🇳', EG:'🇪🇬', MA:'🇲🇦',
  DE:'🇩🇪', AT:'🇦🇹', CH:'🇨🇭', PT:'🇵🇹', GR:'🇬🇷', CZ:'🇨🇿', SE:'🇸🇪',
  NO:'🇳🇴', DK:'🇩🇰', FI:'🇫🇮', BE:'🇧🇪', CA:'🇨🇦', NZ:'🇳🇿', LK:'🇱🇰',
  NP:'🇳🇵', MX:'🇲🇽', BR:'🇧🇷', KE:'🇰🇪', BH:'🇧🇭', KW:'🇰🇼', JO:'🇯🇴',
  MU:'🇲🇺', RU:'🇷🇺', ES:'🇪🇸',
}

const PREFETCH_COUNTRIES = [
  'AE','IN','SG','TH','ID','MY','GB','FR','IT','ES',
  'TR','MV','US','JP','AU','QA','OM','SA','VN','GR',
  'DE','AT','CH','PT','ZA','HK','KR','NZ','NL','SE',
  'NO','DK','FI','BE','CA','EG','MA','BH','JO','MU',
]

// Top cities to pre-fetch hotels for
const HOTEL_CITIES = [
  { city: 'Dubai', country: 'AE' },
  { city: 'Mumbai', country: 'IN' },
  { city: 'New Delhi', country: 'IN' },
  { city: 'Goa', country: 'IN' },
  { city: 'Bangalore', country: 'IN' },
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

let CITY_CACHE = []   // { type:'city', name, country, countryCode, flag }
let HOTEL_CACHE = []  // { type:'hotel', name, city, country, hotelId, flag }

async function buildStaticIndex() {
  console.log('📦 Building static search index...')

  // 1. Fetch all cities
  const allCities = []
  for (const cc of PREFETCH_COUNTRIES) {
    try {
      const resp = await axios.get(`${BASE_URL}/data/cities?countryCode=${cc}`, {
        headers: getHeaders(), timeout: 8000, validateStatus: () => true,
      })
      if (resp.status === 200 && resp.data?.data) {
        resp.data.data.forEach(c => {
          const name = c.name || c.city
          if (name) allCities.push({ type: 'city', name, country: c.countryName || cc, countryCode: cc, flag: COUNTRY_FLAGS[cc] || '🌍' })
        })
      }
      await sleep(100)
    } catch (e) { console.log(`⚠️ Cities ${cc}: ${e.message}`) }
  }
  CITY_CACHE = allCities
  console.log(`✅ Cities: ${CITY_CACHE.length}`)

  // 2. Fetch hotels for top cities
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
  console.log(`✅ Hotels: ${HOTEL_CACHE.length} across ${HOTEL_CITIES.length} cities`)
  console.log(`🎉 Search index ready: ${CITY_CACHE.length + HOTEL_CACHE.length} total entries`)
}

// Build index on startup
setTimeout(buildStaticIndex, 2000)

// ── Destination map ───────────────────────────────────────────────────────────
const DESTINATIONS = {
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
  'kochi': { country: 'IN', city: 'Kochi' },
  'kerala': { country: 'IN', city: 'Kochi' },
  'bali': { country: 'ID', city: 'Bali' },
  'singapore': { country: 'SG', city: 'Singapore' },
  'bangkok': { country: 'TH', city: 'Bangkok' },
  'phuket': { country: 'TH', city: 'Phuket' },
  'kuala lumpur': { country: 'MY', city: 'Kuala Lumpur' },
  'london': { country: 'GB', city: 'London' },
  'paris': { country: 'FR', city: 'Paris' },
  'rome': { country: 'IT', city: 'Rome' },
  'barcelona': { country: 'ES', city: 'Barcelona' },
  'amsterdam': { country: 'NL', city: 'Amsterdam' },
  'madrid': { country: 'ES', city: 'Madrid' },
  'istanbul': { country: 'TR', city: 'Istanbul' },
  'maldives': { country: 'MV', city: 'Male' },
  'cairo': { country: 'EG', city: 'Cairo' },
  'new york': { country: 'US', city: 'New York' },
  'tokyo': { country: 'JP', city: 'Tokyo' },
  'hong kong': { country: 'HK', city: 'Hong Kong' },
  'seoul': { country: 'KR', city: 'Seoul' },
  'sydney': { country: 'AU', city: 'Sydney' },
  'doha': { country: 'QA', city: 'Doha' },
  'riyadh': { country: 'SA', city: 'Riyadh' },
  'muscat': { country: 'OM', city: 'Muscat' },
}

function resolveDest(input) {
  const key = (input || '').toLowerCase().trim().split(',')[0].trim()
  return DESTINATIONS[key] || { country: null, city: input.split(',')[0].trim() }
}

// ── Build occupancies for liteAPI ─────────────────────────────────────────────
// Using the exact format that was confirmed working in the old hotelbeds.js
function buildOccupancies(rooms, adults, children) {
  const r = parseInt(rooms) || 1
  const a = parseInt(adults) || 2
  const c = parseInt(children) || 0
  const childAges = c > 0 ? Array(c).fill(5) : []
  return [{ rooms: r, adults: a, children: childAges }]
}

// ── Parse room name into clean name + size + amenities ───────────────────────
function parseRoomName(rawName) {
  if (!rawName) return { displayName: 'Room', sizeM2: null, parsedAmenities: [] }
  
  const parts = rawName.split(',')
  
  // Clean display name — first segment, title case
  const displayName = parts[0]
    .trim()
    .toLowerCase()
    .replace(/\w/g, l => l.toUpperCase())
  
  // Extract size — look for pattern like "40 SQM" or "40SQM"
  const sizeMatch = rawName.match(/(\d+)\s*SQM/i)
  const sizeM2 = sizeMatch ? parseInt(sizeMatch[1]) : null
  
  // Parse amenities from all parts after first comma
  const amenityTokens = parts.slice(1).join('/').split(/[,\/]/)
  const AMENITY_MAP = {
    'wifi': 'Free WiFi', 'wi-fi': 'Free WiFi',
    'espresso': 'Espresso Machine', 'coffee': 'Coffee Maker',
    'tea kettle': 'Tea Kettle', 'kettle': 'Electric Kettle',
    'minibar': 'Minibar', 'mini bar': 'Minibar',
    'hdtv': 'HD TV', 'tv': 'Flat-screen TV',
    'usb port': 'USB Ports', 'usb': 'USB Ports',
    'iron': 'Iron & Board', 'iron-board': 'Iron & Board',
    'balcony': 'Balcony', 'terrace': 'Terrace',
    'bathtub': 'Bathtub', 'shower': 'Shower',
    'safe': 'In-room Safe', 'safety': 'In-room Safe',
    'air condition': 'Air Conditioning', 'a/c': 'Air Conditioning',
    'breakfast': 'Breakfast Included',
    'ocean view': 'Ocean View', 'sea view': 'Sea View',
    'city view': 'City View', 'pool view': 'Pool View',
    'king bed': 'King Bed', 'queen bed': 'Queen Bed',
    'twin bed': 'Twin Beds', 'double bed': 'Double Bed',
    'sofa bed': 'Sofa Bed',
    'kitchen': 'Kitchen', 'kitchenette': 'Kitchenette',
    'desk': 'Work Desk', 'work desk': 'Work Desk',
  }
  
  const parsedAmenities = []
  const seen = new Set()
  for (const token of amenityTokens) {
    const t = token.trim().toLowerCase()
    if (!t || t.match(/^\d+\s*sqm$/i)) continue
    for (const [key, label] of Object.entries(AMENITY_MAP)) {
      if (t.includes(key) && !seen.has(label)) {
        seen.add(label)
        parsedAmenities.push(label)
      }
    }
  }
  
  return { displayName, sizeM2, parsedAmenities }
}


// ── Supabase coords cache ─────────────────────────────────────────────────────
async function enrichWithCoords(hotels) {
  if (!hotels.length) return hotels

  const ids = hotels.map(h => String(h.code))

  // Batch read from Supabase
  const { data: rows, error } = await supabase
    .from('hotels_cache')
    .select('hotel_id, latitude, longitude, amenities, star_rating')
    .in('hotel_id', ids)

  if (error) console.warn('⚠️ Supabase read error:', error.message)

  const cached = {}
  for (const row of (rows || [])) cached[row.hotel_id] = row

  const missing = hotels.filter(h => !cached[String(h.code)])
  console.log(`📍 Coords cache: ${Object.keys(cached).length} hit, ${missing.length} miss`)

  // Fetch missing from liteAPI /data/hotel one by one
  if (missing.length > 0) {
    const toUpsert = []
    for (const hotel of missing) {
      try {
        await sleep(200)
        const r = await axios.get(
          `${BASE_URL}/data/hotel?hotelId=${hotel.code}`,
          { headers: getHeaders(), timeout: 8000, validateStatus: () => true }
        )
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

  // Merge coords back
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

// ── GET /api/hotels/search ────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const {
      destination, checkIn, checkOut,
      adults = '2', children = '0', rooms = '1'
    } = req.query

    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'destination, checkIn and checkOut are required' })
    }

    // Memory cache check
    const cacheKey = `s:${destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const hit = memGet(cacheKey)
    if (hit) {
      console.log(`💾 Cache hit: ${destination}`)
      return res.json({ hotels: { hotels: hit, total: hit.length, checkIn, checkOut } })
    }

    const dest = resolveDest(destination)
    console.log(`🔍 Search: ${dest.city} (${dest.country || '?'}) | ${checkIn}→${checkOut} | ${adults}A ${rooms}R`)

    // Build request body exactly per liteAPI v3 docs
    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'USD',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children),
      cityName: dest.city,
      limit: 50,
      maxRatesPerHotel: 1,        // cheapest rate only — faster response
      includeHotelData: true,     // get name/photo/address in same call
      timeout: 8,                 // cut off after 8s, return what we have
    }
    if (dest.country) body.countryCode = dest.country

    console.log(`📤 liteAPI body: ${JSON.stringify(body)}`)

    const resp = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(),
      timeout: 30000,
      validateStatus: () => true,
    })

    console.log(`📥 liteAPI status: ${resp.status}`)
    console.log(`📥 liteAPI keys: ${Object.keys(resp.data || {})}`)

    if (resp.status !== 200) {
      console.error('❌ liteAPI error body:', JSON.stringify(resp.data).slice(0, 500))
      return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data })
    }

    const ratesList = resp.data.data || []
    const hotelMeta = {}
    for (const h of (resp.data.hotels || [])) hotelMeta[h.id] = h

    console.log(`✅ liteAPI: ${ratesList.length} rates, ${Object.keys(hotelMeta).length} hotel meta entries`)

    // Map into our hotel shape
    let hotels = ratesList.map(h => {
      const meta = hotelMeta[h.hotelId] || {}
      const firstRT = h.roomTypes?.[0]
      const firstRate = firstRT?.rates?.[0]
      if (!firstRate) return null

      // Exclude pay-at-hotel: skip if any taxesAndFees has included:false
      const taxes = firstRate?.taxesAndFees || []
      const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
      if (hasPayAtHotel) return null

      // Use net rate + 10% markup as rebuq selling price
      const netUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || firstRate?.net || 0)
      if (!netUSD) return null
      const rebuqPriceINR = Math.round(netUSD * USD_TO_INR * MARKUP)

      // OTA price = retailRate total (suggested public selling price)
      // rebuq price = net * markup (our wholesale + margin, always below OTA)
      // memberSaving shown on card = otaPrice - rebuqPrice
      const retailUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || 0)
      const otaPriceINR = retailUSD ? Math.round(retailUSD * USD_TO_INR) : 0
      const memberSaving = otaPriceINR > rebuqPriceINR ? otaPriceINR - rebuqPriceINR : 0

      const refTag = firstRate?.cancellationPolicies?.refundableTag || null
      const boardType = firstRate?.boardType || firstRate?.boardCode || 'RO'

      return {
        code: h.hotelId,
        name: meta.name || 'Hotel',
        city: dest.city,
        stars: meta.stars || (meta.starRating ? Math.round(parseFloat(meta.starRating)) : null),
        minRate: rebuqPriceINR,
        lowestPriceINR: rebuqPriceINR,
        otaPriceINR,           // OTA public price — for "Members save X"
        memberSaving,          // actual INR saving vs OTA
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
        taxesIncluded: true,   // taxes are included since we excluded pay-at-hotel
        amenities: [],
        roomTypes: h.roomTypes || [],
      }
    }).filter(Boolean)  // remove nulls (pay-at-hotel excluded)

    console.log(`📍 Coords from rates: ${hotels.filter(h => h.latitude && h.longitude).length}`)

    // Enrich with Supabase-cached coords
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

// This is the new /:code route — replaces everything from "// ── GET /api/hotels/:code" to "module.exports = router"


// ── GET /api/hotels/search?q=:query — search by hotel name ───────────────────
router.get('/suggest', (req, res) => {
  const { q } = req.query
  if (!q || q.length < 1) return res.json({ cities: [], hotels: [] })

  const query = q.toLowerCase().trim()

  // Search cities from static cache
  const cities = CITY_CACHE
    .filter(c => c.name.toLowerCase().startsWith(query))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4)
    .map(c => ({ type: 'city', name: c.name, subtext: c.country, flag: c.flag, countryCode: c.countryCode }))

  // If less than 4 city starts-with, add contains matches
  if (cities.length < 4) {
    const more = CITY_CACHE
      .filter(c => !c.name.toLowerCase().startsWith(query) && c.name.toLowerCase().includes(query))
      .slice(0, 4 - cities.length)
      .map(c => ({ type: 'city', name: c.name, subtext: c.country, flag: c.flag, countryCode: c.countryCode }))
    cities.push(...more)
  }

  // Search hotels from static cache
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
    .map(h => ({ type: 'hotel', name: h.name, subtext: `${h.city}, ${h.country}`, flag: h.flag, hotelId: h.hotelId }))

  console.log(`🔎 Suggest "${q}": ${cities.length} cities, ${hotels.length} hotels`)
  return res.json({ cities, hotels, total: cities.length + hotels.length })
})

// ── GET /api/hotels/cities?q=:query ──────────────────────────────────────────
router.get('/cities', (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ cities: [] })

  const query = q.toLowerCase().trim()
  const results = CITY_CACHE
    .filter(c => c.city.toLowerCase().startsWith(query) || c.city.toLowerCase().includes(query))
    .sort((a, b) => {
      // Prioritise cities that start with query
      const aStarts = a.city.toLowerCase().startsWith(query)
      const bStarts = b.city.toLowerCase().startsWith(query)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.city.localeCompare(b.city)
    })
    .slice(0, 8)

  return res.json({ cities: results, total: CITY_CACHE.length })
})

// ── GET /api/hotels/cities_disabled?q=:query ─────────────────────────────────
router.get('/cities_disabled', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ cities: [] })

    // Use /data/places for free-text city search (Google Places backed)
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })

    if (resp.status !== 200 || !resp.data?.data) return res.json({ cities: [] })

    const COUNTRY_FLAGS = {
      AE:'🇦🇪', IN:'🇮🇳', SG:'🇸🇬', TH:'🇹🇭', ID:'🇮🇩', MY:'🇲🇾', GB:'🇬🇧',
      FR:'🇫🇷', IT:'🇮🇹', ES:'🇪🇸', NL:'🇳🇱', TR:'🇹🇷', MV:'🇲🇻', ZA:'🇿🇦',
      US:'🇺🇸', JP:'🇯🇵', HK:'🇭🇰', KR:'🇰🇷', AU:'🇦🇺', QA:'🇶🇦', OM:'🇴🇲',
      SA:'🇸🇦', VN:'🇻🇳', PH:'🇵🇭', CN:'🇨🇳', EG:'🇪🇬', MA:'🇲🇦', KE:'🇰🇪',
      TZ:'🇹🇿', GH:'🇬🇭', NG:'🇳🇬', BR:'🇧🇷', MX:'🇲🇽', AR:'🇦🇷', CO:'🇨🇴',
      DE:'🇩🇪', AT:'🇦🇹', CH:'🇨🇭', PT:'🇵🇹', GR:'🇬🇷', CZ:'🇨🇿', HU:'🇭🇺',
      PL:'🇵🇱', SE:'🇸🇪', NO:'🇳🇴', DK:'🇩🇰', FI:'🇫🇮', BE:'🇧🇪', CA:'🇨🇦',
      NZ:'🇳🇿', LK:'🇱🇰', NP:'🇳🇵', BT:'🇧🇹', PK:'🇵🇰', BD:'🇧🇩',
    }

    const places = resp.data.data || []
    const cities = places.slice(0, 8).map((place) => {
      const countryCode = place.countryCode || place.country_code || ''
      const name = place.name || place.city || place.displayName || q
      const country = place.countryName || place.country || countryCode
      return {
        city: name,
        country,
        countryCode,
        flag: COUNTRY_FLAGS[countryCode.toUpperCase()] || '🌍',
        placeId: place.placeId || place.place_id || null,
        lat: place.latitude || place.lat || null,
        lon: place.longitude || place.lon || null,
      }
    }).filter((c) => c.city)

    return res.json({ cities })
  } catch (err) {
    console.error('Cities search error:', err.message)
    return res.json({ cities: [] })
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

    // Fetch static content + rates + reviews + rooms in parallel
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

    // ── Images ────────────────────────────────────────────────────────────────
    const images = (d.hotelImages || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(img => ({ url: img.url, caption: img.caption || 'Hotel' }))

    // ── Room static data — try /data/rooms first (more complete), fallback to /data/hotel rooms
    const roomsData = (roomsResp?.status === 200 && roomsResp?.data?.data)
      ? roomsResp.data.data
      : (d.rooms || [])
    console.log(`🏠 Rooms data source: ${roomsResp?.status === 200 ? '/data/rooms' : '/data/hotel'} — ${roomsData.length} rooms`)
    const staticRooms = {}
    for (const sr of roomsData) {
      const roomData = {
        description: sr.description || '',
        sizeM2: sr.roomSizeSquare || null,
        bedTypes: (sr.bedTypes || []).map(b => [b.quantity > 1 ? b.quantity + ' ' : '', b.bedType || '', b.bedSize ? ' (' + b.bedSize + ')' : ''].join('')).filter(Boolean),
        amenities: (sr.roomAmenities || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).slice(0, 8),
        photos: (sr.photos || []).sort((a,b) => (b.score||0)-(a.score||0)).map(p => p.url || p.failoverPhoto).filter(p => p && p.startsWith('http')).slice(0, 5),
      }
      // Index by all possible ID fields for robust matching
      // Index by every possible ID format — string, number, both
      const roomId = sr.id || sr.roomId
      if (roomId !== undefined && roomId !== null) {
        staticRooms[roomId] = roomData          // native type
        staticRooms[String(roomId)] = roomData  // as string
        staticRooms[Number(roomId)] = roomData  // as number
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
    console.log(`📦 Static rooms: ${Object.keys(staticRooms).length} keys. Sample IDs: ${Object.keys(staticRooms).filter(k => /^[0-9]+$/.test(k)).slice(0,4).join(', ')}`)

    // ── Facilities ────────────────────────────────────────────────────────────
    const allFacilities = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
    const facilityGroups = {
      Access: [],
      'Activities & Sports': [],
      'Services & Conveniences': [],
      'Safety & Security': [],
      'Room Amenities': [],
      'Safety & Cleanliness': [],
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

    // ── Popular facilities (top 8 for overview section) ────────────────────
    const popularFacilityKeywords = [
      { key: /pool|swimming/i, label: 'Swimming Pool' },
      { key: /wifi|internet/i, label: 'Free WiFi' },
      { key: /breakfast/i, label: 'Breakfast' },
      { key: /room service/i, label: '24/7 Room Service' },
      { key: /fitness|gym/i, label: 'Fitness Centre' },
      { key: /spa|massage/i, label: 'Spa & Wellness' },
      { key: /parking/i, label: 'Parking' },
      { key: /airport|transfer/i, label: 'Airport Transfer' },
      { key: /restaurant/i, label: 'Restaurant' },
      { key: /bar/i, label: 'Bar' },
    ]
    const popularFacilities = popularFacilityKeywords
      .filter(pk => allFacilities.some(f => pk.key.test(f)))
      .map(pk => pk.label)
      .slice(0, 8)

    // ── Room rates with roomMapping ────────────────────────────────────────
    let roomList = []
    if (ratesResp.status === 200) {
      const hotelData = (ratesResp.data?.data || [])[0]
      if (hotelData?.roomTypes?.[0]) {
        const sample = hotelData.roomTypes[0]
        console.log(`🏷️ Sample roomType keys: ${Object.keys(sample).join(', ')}`)
        console.log(`🏷️ mappedRoomId: ${sample.mappedRoomId}, roomId: ${sample.roomId}, offerId: ${sample.offerId}`)
      }
      roomList = (hotelData?.roomTypes || []).map(rt => {
        const rate = rt.rates?.[0]
        if (!rate) return null

        // Exclude pay-at-hotel
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

        // Merge static room data via mappedRoomId — try multiple match strategies
        const mappedId = rt.mappedRoomId || rt.roomId || null
        const roomName = (rate?.name || rt.name || '').toLowerCase().trim()
        const normName = roomName.replace(/[^a-z0-9]/g, '')
        const staticRoom = (mappedId !== null && staticRooms[mappedId] !== undefined)
          ? staticRooms[mappedId]
          : (mappedId !== null && staticRooms[String(mappedId)] !== undefined)
          ? staticRooms[String(mappedId)]
          : (mappedId !== null && staticRooms[Number(mappedId)] !== undefined)
          ? staticRooms[Number(mappedId)]
          : (roomName && staticRooms[roomName])
          ? staticRooms[roomName]
          : (normName && staticRooms[normName])
          ? staticRooms[normName]
          : (() => {
              const keys = Object.keys(staticRooms)
              const match = keys.find(k => normName.length > 4 && (k.includes(normName.slice(0,6)) || normName.includes(k.replace(/[^a-z0-9]/g,'').slice(0,6))))
              return match ? staticRooms[match] : {}
            })()
        console.log(`🔗 "${roomName}" id=${mappedId} → matched:${Object.keys(staticRoom).length > 0} size:${staticRoom.sizeM2||'-'} amenities:${staticRoom.amenities?.length||0} photos:${staticRoom.photos?.length||0}`)

        // Room photos: prefer static room photos, fall back to hotel images
        const roomPhotos = staticRoom.photos?.length
          ? staticRoom.photos.slice(0, 5)
          : images.slice(0, 3).map(i => i.url)

        // Parse clean name + size + amenities from raw supplier name
        const rawName = rate?.name || rt.name || 'Room'
        const parsed = parseRoomName(rawName)
        const finalSizeM2 = staticRoom.sizeM2 || parsed.sizeM2
        const finalAmenities = staticRoom.amenities?.length ? staticRoom.amenities : parsed.parsedAmenities
        const finalBedTypes = staticRoom.bedTypes?.length ? staticRoom.bedTypes : []

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
          sizeM2: finalSizeM2,
          bedTypes: finalBedTypes,
          amenities: finalAmenities,
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
            if (refTag === 'RFN' && rate?.cancellationPolicies?.cancelPolicyInfos?.[0]?.cancelTime)
              return rate.cancellationPolicies.cancelPolicyInfos[0].cancelTime.split('T')[0]
            return null
          })(),
        }
      }).filter(Boolean)
    }

    const cheapest = roomList.reduce((m, r) => (!m || (r.pricePerNight && r.pricePerNight < m.pricePerNight)) ? r : m, null)

    // ── Reviews ───────────────────────────────────────────────────────────────
    let reviews = []
    let sentimentAnalysis = null
    if (reviewsResp.status === 200 && reviewsResp.data?.data) {
      const rd = reviewsResp.data.data
      reviews = (Array.isArray(rd) ? rd : (rd.reviews || [])).slice(0, 10).map(r => ({
        score: r.averageScore || null,
        name: r.name || 'Guest',
        country: r.country || '',
        type: r.type || '',
        date: r.date ? r.date.substring(0, 10) : '',
        headline: r.headline || '',
        pros: r.pros || '',
        cons: r.cons || '',
      }))
      sentimentAnalysis = rd.sentimentAnalysis || reviewsResp.data?.sentimentAnalysis || null
    }

    return res.json({
      success: true,
      hotel: {
        code: d.id || code,
        name: d.name,
        description: d.hotelDescription || '',
        importantInfo: d.hotelImportantInformation || '',
        stars: d.starRating ? Math.round(parseFloat(d.starRating)) : null,
        rating: d.rating || null,
        reviewCount: d.reviewCount || null,
        chain: d.chainName || null,
        address: d.address || '',
        city: d.city || '',
        country: d.country || '',
        coordinates: {
          latitude: d.location?.latitude || null,
          longitude: d.location?.longitude || null,
        },
        checkInTime: d.checkinCheckoutTimes?.checkin || '15:00',
        checkOutTime: d.checkinCheckoutTimes?.checkout || '12:00',
        images,
        rooms: roomList,
        facilityGroups,
        allFacilities,
        popularFacilities,
        lowestPriceINR: cheapest?.pricePerNight || null,
        lowestTotalINR: cheapest?.totalPrice || null,
        cheapestRoom: cheapest || null,
        nights,
        checkIn,
        checkOut,
        adults: parseInt(adults),
        reviews,
        sentimentAnalysis,
      }
    })

  } catch (err) {
    console.error('❌ /hotel/:code error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router
