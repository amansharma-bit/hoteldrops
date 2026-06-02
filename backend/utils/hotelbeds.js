const axios = require('axios')
const crypto = require('crypto')

const API_KEY  = process.env.HOTELBEDS_API_KEY
const SECRET   = process.env.HOTELBEDS_SECRET
const ENV      = process.env.HOTELBEDS_ENV || 'test'
const BASE_URL = ENV === 'production'
  ? 'https://api.hotelbeds.com'
  : 'https://sandbox.hotelbeds.com'

function getSignature() {
  const ts = Math.floor(Date.now() / 1000).toString()
  return crypto.createHash('sha256').update(API_KEY + SECRET + ts).digest('hex')
}

function getHeaders() {
  return {
    'Api-key':       API_KEY,
    'X-Signature':   getSignature(),
    'Accept':        'application/json',
    'Content-Type':  'application/json',
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
const TTL_SEARCH  = 60 * 60 * 1000
const TTL_CONTENT = 24 * 60 * 60 * 1000
const TTL_ROOMS   = 30 * 60 * 1000

// ── Sleep ─────────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── HTTP via axios (native fetch unreliable on Railway) ───────────────────────
async function apiGet(url) {
  const res = await axios.get(url, { headers: getHeaders(), timeout: 15000, validateStatus: () => true })
  return res
}

async function apiPost(url, data) {
  const res = await axios.post(url, data, { headers: getHeaders(), timeout: 15000, validateStatus: () => true })
  return res
}

// ── Destination code map ──────────────────────────────────────────────────────
const DESTINATION_CODES = {
  'dubai': 'DXB', 'dubai, uae': 'DXB', 'abu dhabi': 'AUH', 'sharjah': 'SHJ',
  'delhi': 'DEL', 'new delhi': 'DEL', 'mumbai': 'BOM', 'goa': 'GOI',
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'chennai': 'MAA', 'kolkata': 'CCU',
  'hyderabad': 'HYD', 'jaipur': 'JAI', 'agra': 'AGR', 'kerala': 'COK', 'kochi': 'COK',
  'bali': 'DPS', 'singapore': 'SIN', 'bangkok': 'BKK', 'phuket': 'HKT',
  'kuala lumpur': 'KUL', 'hanoi': 'HAN', 'ho chi minh': 'SGN',
  'london': 'LON', 'paris': 'PAR', 'rome': 'ROM', 'barcelona': 'BCN',
  'amsterdam': 'AMS', 'madrid': 'MAD', 'milan': 'MIL', 'prague': 'PRG',
  'vienna': 'VIE', 'zurich': 'ZRH', 'lisbon': 'LIS', 'athens': 'ATH', 'istanbul': 'IST',
  'maldives': 'MLE', 'male': 'MLE',
  'cairo': 'CAI', 'marrakech': 'RAK', 'nairobi': 'NBO', 'cape town': 'CPT',
  'new york': 'NYC', 'los angeles': 'LAX', 'miami': 'MIA', 'cancun': 'CUN',
  'tokyo': 'TYO', 'osaka': 'OSA', 'beijing': 'BJS', 'shanghai': 'SHA',
  'hong kong': 'HKG', 'seoul': 'SEL',
  'sydney': 'SYD', 'melbourne': 'MEL',
  'yerevan': 'EVN', 'riyadh': 'RUH', 'doha': 'DOH', 'muscat': 'MCT',
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
  }

  console.log(`🔍 Hotelbeds search: ${destination} | ${checkIn}→${checkOut} | ${adults} adults | ${rooms} rooms`)

  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * attempt)
    try {
      const res = await apiPost(`${BASE_URL}/hotel-api/1.0/hotels`, body)
      if (res.status !== 200) throw new Error(`Hotelbeds ${res.status}: ${JSON.stringify(res.data)}`)
      const hotels = (res.data.hotels?.hotels || []).map(h => ({
        code:     h.code,
        name:     h.name,
        city:     destination,
        stars:    h.categoryCode ? parseInt(h.categoryCode) : null,
        minRate:  h.minRate,
        maxRate:  h.maxRate,
        currency: h.currency,
        rooms:    h.rooms || [],
        reviews:  h.reviews || [],
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

// ── Get hotel content ─────────────────────────────────────────────────────────
async function getHotelContent(hotelCode) {
  const cacheKey = `content:${hotelCode}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    await sleep(200)
    const res = await apiGet(`${BASE_URL}/hotel-content-api/1.0/hotels/${hotelCode}/details?language=ENG&useSecondaryLanguage=false`)
    if (res.status !== 200) throw new Error(`Content API ${res.status}`)
    const content = res.data.hotel || null
    if (content) cacheSet(cacheKey, content, TTL_CONTENT)
    return content
  } catch (err) {
    console.warn(`⚠️ Content fetch failed for ${hotelCode}:`, err.message)
    return null
  }
}

// ── Get hotel rooms ───────────────────────────────────────────────────────────
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
    await sleep(300)
    const res = await apiPost(`${BASE_URL}/hotel-api/1.0/hotels`, body)
    if (res.status !== 200) throw new Error(`Rooms API ${res.status}`)
    const hotelData = (res.data.hotels?.hotels || [])[0] || null
    const roomList = hotelData?.rooms || []
    if (roomList.length) cacheSet(cacheKey, roomList, TTL_ROOMS)
    return roomList
  } catch (err) {
    console.warn(`⚠️ Rooms fetch failed for ${hotelCode}:`, err.message)
    return []
  }
}

// ── Find hotel code by name ───────────────────────────────────────────────────
async function findHotelCode(hotelName, destCode) {
  const cacheKey = `find:${destCode}:${hotelName.toLowerCase().trim()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  try {
    await sleep(300)
    const res = await apiGet(`${BASE_URL}/hotel-content-api/1.0/hotels?destinationCode=${destCode}&language=ENG&useSecondaryLanguage=false&from=1&to=200`)
    if (res.status !== 200) return null
    const hotels = res.data.hotels || []
    const needle = hotelName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    let bestCode = null, bestScore = 0

    for (const h of hotels) {
      const haystack = (h.name?.content || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      if (haystack === needle) { bestCode = h.code; break }
      const words = needle.split(' ').filter(w => w.length > 3)
      const matches = words.filter(w => haystack.includes(w)).length
      const score = matches / Math.max(words.length, 1)
      if (score > bestScore && score >= 0.6) { bestScore = score; bestCode = h.code }
    }

    if (bestCode) cacheSet(cacheKey, bestCode, TTL_CONTENT)
    return bestCode
  } catch (err) {
    console.warn(`⚠️ findHotelCode failed:`, err.message)
    return null
  }
}

module.exports = { getDestinationCode, searchHotels, getHotelContent, getHotelRooms, findHotelCode, sleep }
