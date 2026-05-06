const axios = require('axios')

const BASE_URL = process.env.AMADEUS_ENV === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com'

let accessToken = null
let tokenExpiry  = null

// ==============================
// Get OAuth token (cached)
// ==============================
async function getToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken
  }
  const res = await axios.post(
    `${BASE_URL}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.AMADEUS_API_KEY,
      client_secret: process.env.AMADEUS_API_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  accessToken = res.data.access_token
  tokenExpiry  = Date.now() + (res.data.expires_in - 60) * 1000
  console.log('🔑 Amadeus token refreshed')
  return accessToken
}

// ==============================
// Search hotels by city keyword
// ==============================
async function searchHotelsByCity(cityCode) {
  const token = await getToken()
  const res = await axios.get(`${BASE_URL}/v1/reference-data/locations/hotels/by-city`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { cityCode, radius: 5, radiusUnit: 'KM', hotelSource: 'ALL' }
  })
  return res.data.data || []
}

// ==============================
// Search hotels by geo coordinates
// ==============================
async function searchHotelsByGeo(latitude, longitude, radius = 2) {
  const token = await getToken()
  const res = await axios.get(`${BASE_URL}/v1/reference-data/locations/hotels/by-geocode`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { latitude, longitude, radius, radiusUnit: 'KM', hotelSource: 'ALL' }
  })
  return res.data.data || []
}

// ==============================
// Get hotel offers (prices)
// ==============================
async function getHotelOffers({ hotelIds, checkIn, checkOut, adults = 2, roomQuantity = 1, currency = 'INR' }) {
  const token = await getToken()
  const res = await axios.get(`${BASE_URL}/v3/shopping/hotel-offers`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      hotelIds:     Array.isArray(hotelIds) ? hotelIds.join(',') : hotelIds,
      checkInDate:  checkIn,
      checkOutDate: checkOut,
      adults,
      roomQuantity,
      currency,
      bestRateOnly: false,
    }
  })
  return res.data.data || []
}

// ==============================
// Find hotel ID from name + city
// This is the KEY mapping function
// ==============================
async function findHotelId(hotelName, cityCode, latitude, longitude) {
  try {
    let hotels = []

    // Try geo search first (most accurate)
    if (latitude && longitude) {
      hotels = await searchHotelsByGeo(latitude, longitude, 1)
    }

    // Fallback to city search
    if (!hotels.length && cityCode) {
      hotels = await searchHotelsByCity(cityCode)
    }

    if (!hotels.length) return null

    // Find best name match
    const nameLower = hotelName.toLowerCase().replace(/[^a-z0-9 ]/g, '')
    const scored = hotels.map(h => {
      const hn = (h.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '')
      const score = similarity(nameLower, hn)
      return { hotel: h, score }
    }).sort((a, b) => b.score - a.score)

    const best = scored[0]
    console.log(`🏨 Best match for "${hotelName}": "${best.hotel.name}" (score: ${best.score.toFixed(2)})`)

    // Only accept if similarity is good enough
    return best.score > 0.4 ? best.hotel.hotelId : null

  } catch (err) {
    console.error('findHotelId error:', err.message)
    return null
  }
}

// ==============================
// Check current price for a booking
// ==============================
async function checkCurrentPrice(booking) {
  try {
    const { amadeus_hotel_id, check_in, check_out, num_adults, num_rooms } = booking

    if (!amadeus_hotel_id) {
      throw new Error('No hotel ID mapped yet')
    }

    const offers = await getHotelOffers({
      hotelIds:     amadeus_hotel_id,
      checkIn:      check_in,
      checkOut:     check_out,
      adults:       num_adults || 2,
      roomQuantity: num_rooms  || 1,
      currency:     'INR',
    })

    if (!offers.length) return null

    // Find lowest price
    let lowestPrice = Infinity
    let bestOffer   = null

    for (const hotel of offers) {
      for (const offer of (hotel.offers || [])) {
        const price = parseFloat(offer.price?.total || offer.price?.base || 0)
        if (price > 0 && price < lowestPrice) {
          lowestPrice = price
          bestOffer   = offer
        }
      }
    }

    return lowestPrice === Infinity ? null : {
      price:    lowestPrice,
      currency: 'INR',
      offer:    bestOffer,
    }

  } catch (err) {
    console.error('checkCurrentPrice error:', err.message)
    throw err
  }
}

// ==============================
// City name → Amadeus city code
// ==============================
const CITY_CODES = {
  'mumbai':    'BOM', 'delhi':        'DEL', 'new delhi':    'DEL',
  'bangalore': 'BLR', 'bengaluru':    'BLR', 'hyderabad':    'HYD',
  'chennai':   'MAA', 'kolkata':      'CCU', 'pune':         'PNQ',
  'goa':       'GOI', 'jaipur':       'JAI', 'ahmedabad':    'AMD',
  'kochi':     'COK', 'cochin':       'COK', 'udaipur':      'UDR',
  'agra':      'AGR', 'varanasi':     'VNS', 'amritsar':     'ATQ',
  'lucknow':   'LKO', 'chandigarh':   'IXC', 'srinagar':     'SXR',
}

function getCityCode(cityName) {
  if (!cityName) return null
  return CITY_CODES[cityName.toLowerCase().trim()] || null
}

// ==============================
// Simple string similarity score
// ==============================
function similarity(a, b) {
  if (!a || !b) return 0
  const wordsA = new Set(a.split(' ').filter(w => w.length > 2))
  const wordsB = new Set(b.split(' ').filter(w => w.length > 2))
  if (!wordsA.size || !wordsB.size) return 0
  let common = 0
  wordsA.forEach(w => { if (wordsB.has(w)) common++ })
  return common / Math.max(wordsA.size, wordsB.size)
}

module.exports = { findHotelId, checkCurrentPrice, getCityCode, getHotelOffers, searchHotelsByCity }
