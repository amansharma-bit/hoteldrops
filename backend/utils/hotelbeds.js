const crypto = require('crypto')

// ── Hotelbeds API config ──────────────────────────────────────────────────────
const API_KEY    = process.env.HOTELBEDS_API_KEY
const SECRET     = process.env.HOTELBEDS_SECRET
const ENV        = process.env.HOTELBEDS_ENV || 'test'
const BASE_URL   = ENV === 'production'
  ? 'https://api.hotelbeds.com'
  : 'https://sandbox.hotelbeds.com'

// ── Signature: SHA256(apiKey + secret + unixTimestamp) ───────────────────────
function getSignature() {
  const ts = Math.floor(Date.now() / 1000).toString()
  return crypto.createHash('sha256').update(API_KEY + SECRET + ts).digest('hex')
}

function headers() {
  return {
    'Api-key':         API_KEY,
    'X-Signature':     getSignature(),
    'Accept':          'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type':    'application/json',
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
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
const TTL_SEARCH  = 60 * 60 * 1000         // 1 h
const TTL_CONTENT = 24 * 60 * 60 * 1000    // 24 h
const TTL_ROOMS   = 30 * 60 * 1000         // 30 min

// ── Destination code map ──────────────────────────────────────────────────────
const DESTINATION_CODES = {
  // UAE
  'dubai':         'DXB',
  'abu dhabi':     'AUH',
  'sharjah':       'SHJ',
  // India
  'delhi':         'DEL',
  'new delhi':     'DEL',
  'mumbai':        'BOM',
  'goa':           'GOI',
  'bangalore':     'BLR',
  'bengaluru':     'BLR',
  'chennai':       'MAA',
  'kolkata':       'CCU',
  'hyderabad':     'HYD',
  'jaipur':        'JAI',
  'agra':          'AGR',
  'kerala':        'COK',
  'kochi':         'COK',
  // Southeast Asia
  'bali':          'DPS',
  'singapore':     'SIN',
  'bangkok':       'BKK',
  'phuket':        'HKT',
  'kuala lumpur':  'KUL',
  'hanoi':         'HAN',
  'ho chi minh':   'SGN',
  // Europe
  'london':        'LON',
  'paris':         'PAR',
  'rome':          'ROM',
  'barcelona':     'BCN',
  'amsterdam':     'AMS',
  'dubai, uae':    'DXB',
  // Maldives
  'maldives':      'MLE',
  'male':          'MLE',
}

function getDestinationCode(cityName) {
  if (!cityName) return null
  const key = cityName.toLowerCase().trim().split(',')[0].trim()
  return DESTINATION_CODES[key] || null
}

// ── Search hotels ─────────────────────────────────────────────────────────────
async function searchHotels({ destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1, maxHotels = 40 }) {
  const cacheKey = `search:${destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
  const cached = cacheGet(cacheKey)
  if (cached) { console.log('Cache hit:', cacheKey); return cached }

  const body = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms: parseInt(rooms), adults: parseInt(adults), children: parseInt(children) }],
    destination: { code: destination },
    filter:      { maxHotels: parseInt(maxHotels), minCategory: 1, maxCategory: 5 },
    reviews:     [{ type: 'HOTELBEDS', maxRate: 5, minReviewCount: 1 }],
  }

  console.log(`🔍 Hotelbeds search: ${destination} | ${checkIn}→${checkOut} | ${adults} adults | ${rooms} rooms`)

  // Sequential retry with delay to avoid rate limits
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt))
    try {
      const res = await fetch(`${BASE_URL}/hotel-api/1.0/hotels`, {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Hotelbeds ${res.status}: ${txt}`)
      }
      const data = await res.json()
      const hotels = (data.hotels?.hotels || []).map(h => ({
        code:        h.code,
        name:        h.name,
        city:        destination,
        stars:       h.categoryCode ? parseInt(h.categoryCode) : null,
        minRate:     h.minRate,
        maxRate:     h.maxRate,
        currency:    h.currency,
        rooms:       h.rooms || [],
        reviews:     h.reviews || [],
      }))
      cacheSet(cacheKey, hotels, TTL_SEARCH)
      console.log(`✅ Found ${hotels.length} hotels`)
      return hotels
    } catch (err) {
      lastErr = err
      console.warn(`⚠️ Attempt ${attempt + 1} failed:`, err.message)
    }
  }
  throw lastErr
}

// ── Get hotel content (images, description, facilities) ───────────────────────
async function getHotelContent(hotelCode) {
  const cacheKey = `content:${hotelCode}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    await new Promise(r => setTimeout(r, 200)) // rate limit guard
    const res = await fetch(
      `${BASE_URL}/hotel-content-api/1.0/hotels/${hotelCode}/details?language=ENG&useSecondaryLanguage=false`,
      { method: 'GET', headers: headers() }
    )
    if (!res.ok) throw new Error(`Content API ${res.status}`)
    const data = await res.json()
    const content = data.hotel || null
    if (content) cacheSet(cacheKey, content, TTL_CONTENT)
    return content
  } catch (err) {
    console.warn(`⚠️ Content fetch failed for ${hotelCode}:`, err.message)
    return null
  }
}

// ── Get hotel rooms / availability ───────────────────────────────────────────
async function getHotelRooms({ hotelCode, checkIn, checkOut, adults = 2, children = 0, rooms = 1 }) {
  const cacheKey = `rooms:${hotelCode}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const body = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms: parseInt(rooms), adults: parseInt(adults), children: parseInt(children) }],
    hotels:      { hotel: [parseInt(hotelCode)] },
  }

  try {
    await new Promise(r => setTimeout(r, 300))
    const res = await fetch(`${BASE_URL}/hotel-api/1.0/hotels`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Rooms API ${res.status}`)
    const data = await res.json()
    const hotelData = (data.hotels?.hotels || [])[0] || null
    if (hotelData) cacheSet(cacheKey, hotelData, TTL_ROOMS)
    return hotelData
  } catch (err) {
    console.warn(`⚠️ Rooms fetch failed for ${hotelCode}:`, err.message)
    return null
  }
}

module.exports = { getDestinationCode, searchHotels, getHotelContent, getHotelRooms }
