const https  = require('https')
const crypto = require('crypto')
const zlib   = require('zlib')

const API_KEY = process.env.HOTELBEDS_API_KEY
const SECRET  = process.env.HOTELBEDS_SECRET
const BASE    = process.env.HOTELBEDS_ENV === 'production'
  ? 'https://api.hotelbeds.com'
  : 'https://api.test.hotelbeds.com'

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

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url     = `${BASE}${path}`
    const headers = getAuthHeaders()
    const options = { method, headers }

    const req = https.request(url, options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buffer   = Buffer.concat(chunks)
        const encoding = res.headers['content-encoding']

        const parseBuffer = (buf) => {
          try {
            const raw    = buf.toString('utf8')
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
        }

        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return reject(new Error(`Gzip error: ${err.message}`))
            parseBuffer(decoded)
          })
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return reject(new Error(`Deflate error: ${err.message}`))
            parseBuffer(decoded)
          })
        } else {
          parseBuffer(buffer)
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

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
  let lowestRate = null
  let lowestPrice = Infinity

  for (const room of (hotel.rooms || [])) {
    for (const rate of (room.rates || [])) {
      const price = parseFloat(rate.net || 0)
      if (price > 0 && price < lowestPrice) {
        lowestPrice = price
        lowestRate  = {
          rateKey:    rate.rateKey,
          rateType:   rate.rateType,
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

async function getHotelContent(hotelCode, language = 'ENG') {
  const data = await apiRequest(
    `/hotel-content-api/1.0/hotels/${hotelCode}/details?language=${language}&useSecondaryLanguage=false`
  )
  return data.hotel || null
}

async function findHotelsByKeyword(destinationCode, language = 'ENG') {
  const data = await apiRequest(
    `/hotel-content-api/1.0/hotels?destinationCode=${destinationCode}&language=${language}&useSecondaryLanguage=false&fields=all&from=1&to=100`
  )
  return data.hotels || []
}

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

async function recheckRate(rateKey) {
  const data = await apiRequest('/hotel-api/1.0/checkrates', 'POST', { rooms: [{ rateKey }] })
  return data.hotel || null
}

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

async function cancelBooking(reference, simulate = false) {
  const flag = simulate ? 'SIMULATION' : 'CANCELLATION'
  const data = await apiRequest(
    `/hotel-api/1.0/bookings/${reference}?cancellationFlag=${flag}`,
    'DELETE'
  )
  return data.booking || null
}

function getDestinationCode(cityName) {
  const map = {
    // ── INDIA ──
    'mumbai': 'BOM', 'bombay': 'BOM',
    'delhi': 'DEL', 'new delhi': 'DEL',
    'bangalore': 'BLR', 'bengaluru': 'BLR',
    'hyderabad': 'HYD',
    'chennai': 'MAA', 'madras': 'MAA',
    'kolkata': 'CCU', 'calcutta': 'CCU',
    'pune': 'PNQ',
    'goa': 'GOA',
    'jaipur': 'JAI',
    'ahmedabad': 'AMD',
    'kochi': 'COK', 'cochin': 'COK',
    'udaipur': 'UDR',
    'agra': 'AGR',
    'varanasi': 'VNS',
    'amritsar': 'ATQ',
    'lucknow': 'LKO',
    'chandigarh': 'IXC',
    'srinagar': 'SXR',
    'shimla': 'SLV',
    'manali': 'KUU',
    'jodhpur': 'JDH',
    'mysore': 'MYQ', 'mysuru': 'MYQ',
    'coimbatore': 'CJB',
    'surat': 'STV',
    'nagpur': 'NAG',
    'bhopal': 'BHO',
    'indore': 'IDR',
    'visakhapatnam': 'VTZ', 'vizag': 'VTZ',
    'pondicherry': 'PNY',
    'ooty': 'OOT',
    'darjeeling': 'DAR',
    'leh': 'IXL',
    'gangtok': 'GTK',

    // ── MIDDLE EAST ──
    'dubai': 'DXB',
    'abu dhabi': 'AUH',
    'sharjah': 'SHJ',
    'doha': 'DOH',
    'riyadh': 'RUH',
    'jeddah': 'JED',
    'muscat': 'MCT',
    'kuwait city': 'KWI', 'kuwait': 'KWI',
    'bahrain': 'BAH',
    'beirut': 'BEY',
    'amman': 'AMM',

    // ── EUROPE ──
    'london': 'LON',
    'paris': 'PAR',
    'amsterdam': 'AMS',
    'rome': 'ROM',
    'barcelona': 'BCN',
    'madrid': 'MAD',
    'berlin': 'BER',
    'frankfurt': 'FRA',
    'munich': 'MUC',
    'vienna': 'VIE',
    'zurich': 'ZRH',
    'geneva': 'GVA',
    'milan': 'MIL',
    'venice': 'VCE',
    'florence': 'FLR',
    'prague': 'PRG',
    'budapest': 'BUD',
    'warsaw': 'WAW',
    'stockholm': 'STO',
    'copenhagen': 'CPH',
    'oslo': 'OSL',
    'helsinki': 'HEL',
    'brussels': 'BRU',
    'lisbon': 'LIS',
    'athens': 'ATH',
    'istanbul': 'IST',
    'dublin': 'DUB',
    'edinburgh': 'EDI',
    'manchester': 'MAN',

    // ── SOUTHEAST ASIA ──
    'bangkok': 'BKK',
    'singapore': 'SIN',
    'kuala lumpur': 'KUL', 'kl': 'KUL',
    'bali': 'DPS',
    'jakarta': 'JKT',
    'ho chi minh city': 'SGN', 'saigon': 'SGN',
    'hanoi': 'HAN',
    'phuket': 'HKT',
    'pattaya': 'UTP',
    'chiang mai': 'CNX',
    'manila': 'MNL',
    'cebu': 'CEB',
    'yangon': 'RGN',
    'colombo': 'CMB',
    'male': 'MLE', 'maldives': 'MLE',
    'kathmandu': 'KTM',
    'phnom penh': 'PNH',
    'siem reap': 'REP',

    // ── EAST ASIA ──
    'tokyo': 'TYO',
    'osaka': 'OSA',
    'kyoto': 'UKY',
    'beijing': 'BJS',
    'shanghai': 'SHA',
    'hong kong': 'HKG',
    'seoul': 'SEL',
    'taipei': 'TPE',

    // ── USA & CANADA ──
    'new york': 'NYC', 'new york city': 'NYC',
    'los angeles': 'LAX',
    'las vegas': 'LAS',
    'miami': 'MIA',
    'chicago': 'CHI',
    'san francisco': 'SFO',
    'orlando': 'ORL',
    'toronto': 'YTO',
    'vancouver': 'YVR',
    'cancun': 'CUN',

    // ── AUSTRALIA ──
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'brisbane': 'BNE',
    'gold coast': 'OOL',

    // ── AFRICA ──
    'cape town': 'CPT',
    'johannesburg': 'JNB',
    'nairobi': 'NBO',
    'cairo': 'CAI',
    'marrakech': 'RAK',
    'casablanca': 'CAS',

    // ── POPULAR ISLANDS ──
    'mauritius': 'MRU',
    'seychelles': 'SEZ',
    'zanzibar': 'ZNZ',
    'phuket': 'HKT',
    'mykonos': 'JMK',
    'santorini': 'JTR',
  }
  return map[cityName?.toLowerCase()?.trim()] || null
}

function stringSimilarity(a, b) {
  if (!a || !b) return 0
  const wa = new Set(a.split(' ').filter(w => w.length > 2))
  const wb = new Set(b.split(' ').filter(w => w.length > 2))
  if (!wa.size || !wb.size) return 0
  let common = 0
  wa.forEach(w => { if (wb.has(w)) common++ })
  return common / Math.max(wa.size, wb.size)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

module.exports = {
  searchHotels, checkHotelPrice, getHotelContent,
  findHotelCode, recheckRate, createBooking,
  cancelBooking, getDestinationCode, sleep,
}
