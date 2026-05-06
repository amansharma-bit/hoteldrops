const https  = require('https')
const crypto = require('crypto')

const API_KEY = process.env.HOTELBEDS_API_KEY
const SECRET  = process.env.HOTELBEDS_SECRET
const BASE    = process.env.HOTELBEDS_ENV === 'production'
  ? 'https://api.hotelbeds.com'
  : 'https://api.test.hotelbeds.com'

// ==============================
// AUTH — SHA256 signature
// Hotelbeds requires: SHA256(apiKey + secret + unixTimestamp)
// ==============================
function getAuthHeaders() {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = crypto
    .createHash('sha256')
    .update(API_KEY + SECRET + timestamp)
    .digest('hex')
  return {
    'Api-key':        API_KEY,
    'X-Signature':    signature,
    'Accept':         'application/json',
    'Accept-Encoding':'gzip',
    'Content-Type':   'application/json',
  }
}

// ==============================
// CORE HTTP CLIENT
// ==============================
function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url     = `${BASE}${path}`
    const headers = getAuthHeaders()
    const options = { method, headers }

    const req = https.request(url, options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          const raw    = Buffer.concat(chunks).toString()
          const parsed = JSON.parse(raw)
          if (res.statusCode >= 400) {
            const msg = parsed?.error?.message || parsed?.message || `HTTP ${res.statusCode}`
            reject(new Error(`Hotelbeds API error: ${msg}`))
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// ==============================
// SEARCH HOTELS BY DESTINATION
// Returns list of available hotels with rates
// This is the core search used for price checking
// ==============================
async function searchHotels({ destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1, hotelCodes = [], maxHotels = 20 }) {
  const payload = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms, adults, children }],
    filter:      { maxHotels },
  }

  if (hotelCodes.length > 0) {
    payload.hotels = { hotel: hotelCodes }
  } else {
    payload.destination = { code: destination }
  }

  const data = await apiRequest('/hotel-api/1.0/hotels', 'POST', payload)
  return data.hotels?.hotels || []
}

// ==============================
// CHECK PRICE FOR A SPECIFIC HOTEL
// Used by the price tracker bot
// ==============================
async function checkHotelPrice({ hotelCode, checkIn, checkOut, adults = 2, children = 0, rooms = 1 }) {
  const payload = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms, adults, children }],
    hotels:      { hotel: [parseInt(hotelCode)] },
    filter:      { maxHotels: 1 },
  }

  const data = await apiRequest('/hotel-api/1.0/hotels', 'POST', payload)
  const hotels = data.hotels?.hotels || []
  if (!hotels.length) return null

  const hotel = hotels[0]

  // Find lowest net rate across all rooms
  let lowestRate = null
  let lowestPrice = Infinity

  for (const room of (hotel.rooms || [])) {
    for (const rate of (room.rates || [])) {
      const price = parseFloat(rate.net || 0)
      if (price > 0 && price < lowestPrice) {
        lowestPrice = price
        lowestRate  = {
          rateKey:    rate.rateKey,
          rateType:   rate.rateType,  // NOR or RECHECK
          net:        price,
          boardCode:  rate.boardCode,
          boardName:  rate.boardName,
          roomCode:   room.code,
          roomName:   room.name,
          cancellationPolicies: rate.cancellationPolicies,
          paymentType: rate.paymentType,
          allotment:   rate.allotment,
        }
      }
    }
  }

  return lowestRate ? {
    price:    lowestPrice,
    currency: data.hotels?.currency || 'EUR',
    rate:     lowestRate,
    hotelCode: hotel.code,
    hotelName: hotel.name,
  } : null
}

// ==============================
// GET HOTEL STATIC CONTENT
// Returns name, address, images, facilities
// ==============================
async function getHotelContent(hotelCode, language = 'ENG') {
  const data = await apiRequest(
    `/hotel-content-api/1.0/hotels/${hotelCode}/details?language=${language}&useSecondaryLanguage=false`
  )
  return data.hotel || null
}

// ==============================
// SEARCH HOTELS BY KEYWORD (for mapping)
// Used to find Hotelbeds hotel code from hotel name + city
// ==============================
async function findHotelsByKeyword(destinationCode, language = 'ENG') {
  const data = await apiRequest(
    `/hotel-content-api/1.0/hotels?destinationCode=${destinationCode}&language=${language}&useSecondaryLanguage=false&fields=all&from=1&to=100`
  )
  return data.hotels || []
}

// ==============================
// MAP HOTEL NAME → HOTELBEDS CODE
// Fuzzy matches hotel name against Hotelbeds inventory
// ==============================
async function findHotelCode(hotelName, destinationCode) {
  try {
    const hotels = await findHotelsByKeyword(destinationCode)
    if (!hotels.length) return null

    const nameLower = hotelName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

    const scored = hotels.map(h => {
      const hn    = (h.name?.content || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      const score = stringSimilarity(nameLower, hn)
      return { code: h.code, name: h.name?.content, score }
    }).sort((a, b) => b.score - a.score)

    const best = scored[0]
    console.log(`🏨 Best match for "${hotelName}": "${best.name}" (score: ${best.score.toFixed(2)})`)

    return best.score > 0.35 ? best.code : null
  } catch (err) {
    console.error('findHotelCode error:', err.message)
    return null
  }
}

// ==============================
// RECHECK RATE (required before booking for RECHECK type)
// ==============================
async function recheckRate(rateKey) {
  const data = await apiRequest('/hotel-api/1.0/checkrates', 'POST', {
    rooms: [{ rateKey }]
  })
  return data.hotel || null
}

// ==============================
// CREATE BOOKING
// ==============================
async function createBooking({ rateKey, holderName, holderSurname, paxes, clientReference, remark }) {
  const payload = {
    holder: { name: holderName, surname: holderSurname },
    rooms:  [{ rateKey, paxes }],
    clientReference,
    tolerance: 2.00,
    ...(remark && { remark }),
  }
  const data = await apiRequest('/hotel-api/1.0/bookings', 'POST', payload)
  return data.booking || null
}

// ==============================
// CANCEL BOOKING
// ==============================
async function cancelBooking(reference, simulate = false) {
  const flag = simulate ? 'SIMULATION' : 'CANCELLATION'
  const data = await apiRequest(
    `/hotel-api/1.0/bookings/${reference}?cancellationFlag=${flag}`,
    'DELETE'
  )
  return data.booking || null
}

// ==============================
// GET DESTINATION CODE
// Maps Indian city names to Hotelbeds destination codes
// ==============================
function getDestinationCode(cityName) {
  const map = {
    'mumbai':      'MCM', 'bombay':      'MCM',
    'delhi':       'DEL', 'new delhi':   'DEL',
    'bangalore':   'BLR', 'bengaluru':   'BLR',
    'hyderabad':   'HYD',
    'chennai':     'MAA', 'madras':      'MAA',
    'kolkata':     'CCU', 'calcutta':    'CCU',
    'pune':        'PNQ',
    'goa':         'GOX',
    'jaipur':      'JAI',
    'ahmedabad':   'AMD',
    'kochi':       'COK', 'cochin':      'COK',
    'udaipur':     'UDR',
    'agra':        'AGR',
    'varanasi':    'VNS',
    'amritsar':    'ATQ',
    'lucknow':     'LKO',
    'chandigarh':  'IXC',
    'srinagar':    'SXR',
    'shimla':      'SLV',
    'manali':      'KUU',
    'jodhpur':     'JDH',
    'mysore':      'MYQ', 'mysuru':      'MYQ',
    'coimbatore':  'CJB',
    'surat':       'STV',
    'nagpur':      'NAG',
    'bhopal':      'BHO',
    'indore':      'IDR',
    'visakhapatnam':'VTZ', 'vizag':       'VTZ',
    'pondicherry': 'PNY',
    'ooty':        'OOT',
    'darjeeling':  'DAR',
    'leh':         'IXL',
    'gangtok':     'GTK',
  }
  return map[cityName?.toLowerCase()?.trim()] || null
}

// ==============================
// STRING SIMILARITY (word overlap)
// ==============================
function stringSimilarity(a, b) {
  if (!a || !b) return 0
  const wa = new Set(a.split(' ').filter(w => w.length > 2))
  const wb = new Set(b.split(' ').filter(w => w.length > 2))
  if (!wa.size || !wb.size) return 0
  let common = 0
  wa.forEach(w => { if (wb.has(w)) common++ })
  return common / Math.max(wa.size, wb.size)
}

// ==============================
// RATE LIMIT HELPER
// Hotelbeds allows 8 requests per 4 seconds
// ==============================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function rateLimitedRequest(fn) {
  await sleep(500) // 500ms between calls = safe under 8/4s limit
  return fn()
}

module.exports = {
  searchHotels,
  checkHotelPrice,
  getHotelContent,
  findHotelCode,
  recheckRate,
  createBooking,
  cancelBooking,
  getDestinationCode,
  rateLimitedRequest,
  sleep,
}
