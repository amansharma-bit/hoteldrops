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
  'dublin': { flag: '🇮🇪', country: 'Ireland' },
  'dubrovnik': { flag: '🇭🇷', country: 'Croatia' },
  'zagreb': { flag: '🇭🇷', country: 'Croatia' },
  'reykjavik': { flag: '🇮🇸', country: 'Iceland' },
  'warsaw': { flag: '🇵🇱', country: 'Poland' },
  'krakow': { flag: '🇵🇱', country: 'Poland' },
  'budapest': { flag: '🇭🇺', country: 'Hungary' },
  'bucharest': { flag: '🇷🇴', country: 'Romania' },
  'sofia': { flag: '🇧🇬', country: 'Bulgaria' },
  'belgrade': { flag: '🇷🇸', country: 'Serbia' },
  'valletta': { flag: '🇲🇹', country: 'Malta' },
  'cape town': { flag: '🇿🇦', country: 'South Africa' },
  'johannesburg': { flag: '🇿🇦', country: 'South Africa' },
  'tel aviv': { flag: '🇮🇱', country: 'Israel' },
  'jerusalem': { flag: '🇮🇱', country: 'Israel' },
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
let HOTEL_CACHE_BY_ID = {}

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
            latitude: h.latitude ?? h.location?.latitude ?? null,
            longitude: h.longitude ?? h.location?.longitude ?? null,
            stars: h.stars || (h.starRating ? Math.round(parseFloat(h.starRating)) : null),
            imageUrl: h.main_photo || h.thumbnail || null,
          })
        })
      }
      await sleep(200)
    } catch (e) { console.log(`⚠️ Hotels ${city}: ${e.message}`) }
  }
  HOTEL_CACHE = allHotels
  HOTEL_CACHE_BY_ID = {}
  for (const h of HOTEL_CACHE) HOTEL_CACHE_BY_ID[String(h.hotelId)] = h
  const withCoords = HOTEL_CACHE.filter(h => h.latitude && h.longitude).length
  console.log(`✅ Hotel index ready: ${HOTEL_CACHE.length} hotels (${withCoords} with coordinates)`)
}

setTimeout(buildHotelIndex, 2000)

function buildOccupancies(rooms, adults, children, childAges) {
  const r = parseInt(rooms) || 1
  const a = parseInt(adults) || 2
  const c = parseInt(children) || 0

  let ages = []
  if (childAges) {
    ages = String(childAges).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
  }
  // If real ages were supplied, use them. Pad with age 5 only for any slots
  // that genuinely have no age supplied (legacy callers / safety net) —
  // never overwrite a real selected age.
  if (c > 0) {
    if (ages.length < c) ages = [...ages, ...Array(c - ages.length).fill(5)]
    else if (ages.length > c) ages = ages.slice(0, c)
  } else {
    ages = []
  }

  return [{ rooms: r, adults: a, children: ages }]
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

  // Look up cached lat/long/amenities — chunked so the IN() list never gets too long
  const CHUNK = 100
  const cached = {}
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK)
    const { data: rows, error } = await supabase
      .from('hotels_cache')
      .select('hotel_id, latitude, longitude, amenities, star_rating')
      .in('hotel_id', chunk)
    if (error) { console.warn('⚠️ Supabase read error:', error.message); continue }
    for (const row of (rows || [])) cached[row.hotel_id] = row
  }

  const missing = hotels.filter(h => !cached[String(h.code)])
  if (missing.length > 0) {
    // Don't block this response on slow per-hotel detail calls — backfill
    // hotels_cache in the background so the NEXT search for this city is
    // fully enriched. Returned results just fall back to null lat/long for now.
    enrichMissingInBackground(missing).catch(e => console.warn('⚠️ background enrich failed:', e.message))
  }

  return hotels.map(h => {
    const c  = cached[String(h.code)] || {}
    // HOTEL_CACHE_BY_ID comes from /data/hotels (built at startup, ~1000
    // hotels/city incl. lat/long) — an instant, no-extra-call fallback so
    // the map can plot nearly every result even before hotels_cache fills in.
    const hc = HOTEL_CACHE_BY_ID[String(h.code)] || {}
    return {
      ...h,
      latitude: c.latitude || hc.latitude || h.latitude || null,
      longitude: c.longitude || hc.longitude || h.longitude || null,
      amenities: c.amenities?.length ? c.amenities : (h.amenities || []),
      stars: c.star_rating || hc.stars || h.stars || null,
    }
  })
}

async function enrichMissingInBackground(missing) {
  const CONCURRENCY = 5
  const toUpsert = []
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(async hotel => {
      try {
        const r = await axios.get(`${BASE_URL}/data/hotel?hotelId=${hotel.code}`, {
          headers: getHeaders(), timeout: 8000, validateStatus: () => true
        })
        const d = r.status === 200 ? r.data?.data : null
        return {
          hotel_id: String(hotel.code),
          name: (d ? d.name : null) || hotel.name,
          latitude: d?.location?.latitude || null,
          longitude: d?.location?.longitude || null,
          amenities: d ? (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean) : [],
          star_rating: d?.starRating ? Math.round(parseFloat(d.starRating)) : (hotel.stars || null),
          cached_at: new Date().toISOString(),
        }
      } catch (e) {
        return { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [], cached_at: new Date().toISOString() }
      }
    }))
    toUpsert.push(...results)
    if (i + CONCURRENCY < missing.length) await sleep(250)
  }
  if (toUpsert.length) {
    await supabase.from('hotels_cache').upsert(toUpsert, { onConflict: 'hotel_id' })
  }
}

// ── POST /api/hotels/chat ────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, destination, checkIn, checkOut, hotelCount } = req.body
  if (!messages?.length) return res.json({ reply: 'How can I help you?' })

  const { hotelList = [] } = req.body
  const hotelRows = hotelList.map((h, i) =>
    i+1 + '. ' + h.name + ' | ' + h.stars + 'star | Rs' + (h.price||0).toLocaleString('en-IN') + '/night | Rating:' + (h.rating||'N/A') + ' | ' + (h.isRefundable?'Free cancellation':'Non-refundable') + ' | ' + (h.hasBreakfast?'Breakfast included':'No breakfast') + ' | Area:' + h.area + ' | ' + (h.amenities||[]).join(', ')
  ).join('\n')

  const hotelContext = hotelList.length > 0 ? '\n\nHOTELS ON SCREEN (' + hotelList.length + ' properties):\n' + hotelRows : ''

  const systemPrompt = 'You are rebuq AI travel assistant — friendly, knowledgeable, concise. ' +
    'User is searching hotels in ' + (destination || 'unknown city') + ' from ' + (checkIn || 'unknown') + ' to ' + (checkOut || 'unknown') + '.' + hotelContext + '\n\n' +
    'You have full visibility of all hotels on screen. You can:\n' +
    '- Answer questions about specific hotels, rates, amenities, cancellation\n' +
    '- Compare hotels: cheapest, best rated, which has pool etc\n' +
    '- Recommend hotels based on preferences\n' +
    '- Answer travel questions: weather, local food, restaurants, transport, visa, packing\n' +
    '- Apply filters when asked\n\n' +
    'Keep answers concise. Mention hotel name and price when recommending.\n' +
    'FILTER ACTIONS — respond with JSON only for these cases:\n' +
    '- Show specific hotel: {"action":"filter","hotelName":"Atlantis","message":"Showing Atlantis for you!"}\n' +
    '- Star filter: {"action":"filter","stars":5,"message":"Showing 5-star hotels!"}\n' +
    '- Price filter: {"action":"filter","priceMax":10000,"message":"Showing hotels under Rs10,000!"}\n' +
    '- Refundable: {"action":"filter","isRefundable":true,"message":"Showing free cancellation hotels!"}\n' +
    '- Amenity: {"action":"filter","amenity":"pool","message":"Showing hotels with pool!"}\n' +
    '- Area: {"action":"filter","area":"Deira","message":"Showing hotels in Deira!"}\n' +
    'For ALL other questions (weather, food, comparisons, recommendations) respond in plain natural language only.\n' +
    'IMPORTANT: When returning JSON filter actions, return raw JSON only — no backticks, no markdown, no code blocks.\n' +
    'To show all hotels / clear filters: {"action":"filter","clearAll":true,"message":"Showing all hotels!"}'

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 15000
    })
    const reply = response.data?.content?.[0]?.text || 'Sorry, I could not process that.'
    return res.json({ reply, success: true })
  } catch (e) {
    console.error('Chat error:', e.message)
    return res.json({ reply: 'Sorry, I am having trouble connecting. Please try again.', success: false })
  }
})

// ── POST /api/hotels/ai-search ───────────────────────────────────────────────
router.post('/ai-search', async (req, res) => {
  const { query, destination } = req.body
  if (!query) return res.json({ filters: {} })

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a hotel search assistant. Parse this query and return ONLY a JSON object, no markdown, no explanation.

Query: "${query}"
City: ${destination || 'unknown'}

Return JSON with these fields (null if not mentioned):
{
  "landmark": string or null,
  "priceMax": number or null (INR per night),
  "priceMin": number or null (INR per night),
  "stars": number or null (3, 4, or 5),
  "hasBreakfast": boolean,
  "isRefundable": boolean,
  "minRating": number or null (7, 8, or 9),
  "amenity": string or null (e.g. "pool", "spa", "gym"),
  "area": string or null (neighbourhood/area name)
}

Examples:
- "indian restaurant hotel near burj khalifa" → {"landmark":"Burj Khalifa","amenity":"restaurant","area":null}
- "5 star pool hotel under 20000" → {"stars":5,"priceMax":20000,"amenity":"pool"}
- "cheap hotel in bandra" → {"area":"Bandra","priceMax":5000}
- "luxury free cancellation" → {"stars":5,"isRefundable":true}`
      }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 10000
    })

    const text = response.data?.content?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const filters = JSON.parse(clean)
    return res.json({ filters, success: true })
  } catch (e) {
    console.error('AI search error:', e.message)
    return res.json({ filters: {}, success: false })
  }
})

// ── GET /api/hotels/landmark ─────────────────────────────────────────────────
router.get('/landmark', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json({ lat: null, lng: null, label: null })

  // Known landmarks with coordinates
  const LANDMARKS = {
    'burj khalifa':        { lat: 25.1972, lng: 55.2744 },
    'dubai mall':          { lat: 25.1985, lng: 55.2796 },
    'palm jumeirah':       { lat: 25.1124, lng: 55.1390 },
    'dubai marina':        { lat: 25.0777, lng: 55.1405 },
    'downtown dubai':      { lat: 25.1972, lng: 55.2796 },
    'jumeirah beach':      { lat: 25.1412, lng: 55.1853 },
    'deira':               { lat: 25.2697, lng: 55.3095 },
    'difc':                { lat: 25.2121, lng: 55.2796 },
    'business bay':        { lat: 25.1855, lng: 55.2965 },
    'marina bay sands':    { lat: 1.2834,  lng: 103.8607 },
    'marina bay':          { lat: 1.2802,  lng: 103.8601 },
    'orchard road':        { lat: 1.3048,  lng: 103.8318 },
    'sentosa':             { lat: 1.2494,  lng: 103.8303 },
    'changi':              { lat: 1.3644,  lng: 103.9915 },
    'eiffel tower':        { lat: 48.8584, lng: 2.2945   },
    'champs elysees':      { lat: 48.8698, lng: 2.3078   },
    'colosseum':           { lat: 41.8902, lng: 12.4922  },
    'vatican':             { lat: 41.9029, lng: 12.4534  },
    'times square':        { lat: 40.7580, lng: -73.9855 },
    'central park':        { lat: 40.7851, lng: -73.9683 },
    'connaught place':     { lat: 28.6304, lng: 77.2177  },
    'india gate':          { lat: 28.6129, lng: 77.2295  },
    'bandra':              { lat: 19.0596, lng: 72.8295  },
    'juhu':                { lat: 19.0989, lng: 72.8264  },
    'marine drive':        { lat: 18.9322, lng: 72.8264  },
    'colaba':              { lat: 18.9067, lng: 72.8147  },
    'andheri':             { lat: 19.1136, lng: 72.8697  },
    'cyber city':          { lat: 28.4952, lng: 77.0877  },
    'golf course road':    { lat: 28.4663, lng: 77.0698  },
    'udyog vihar':         { lat: 28.5021, lng: 77.0881  },
    'hauz khas':           { lat: 28.5494, lng: 77.2001  },
    'karol bagh':          { lat: 28.6514, lng: 77.1907  },
    'lajpat nagar':        { lat: 28.5726, lng: 77.2390  },
    'sukhumvit':           { lat: 13.7310, lng: 100.5598 },
    'silom':               { lat: 13.7234, lng: 100.5301 },
    'patong beach':        { lat: 7.8964,  lng: 98.2979  },
    'kuta':                { lat: -8.7184, lng: 115.1686 },
    'seminyak':            { lat: -8.6905, lng: 115.1609 },
    'ubud':                { lat: -8.5069, lng: 115.2625 },
    'shibuya':             { lat: 35.6598, lng: 139.7004 },
    // Singapore
    'orchard':             { lat: 1.3048,  lng: 103.8318 },
    'orchard road':        { lat: 1.3048,  lng: 103.8318 },
    'clarke quay':         { lat: 1.2905,  lng: 103.8463 },
    'chinatown':           { lat: 1.2838,  lng: 103.8445 },
    'little india':        { lat: 1.3066,  lng: 103.8518 },
    'bugis':               { lat: 1.3006,  lng: 103.8554 },
    'raffles':             { lat: 1.2940,  lng: 103.8520 },
    'harbourfront':        { lat: 1.2651,  lng: 103.8198 },
    // Bangkok
    'sukhumvit':           { lat: 13.7310, lng: 100.5598 },
    'silom':               { lat: 13.7234, lng: 100.5301 },
    'siam':                { lat: 13.7463, lng: 100.5347 },
    'khao san':            { lat: 13.7586, lng: 100.4975 },
    'asok':                { lat: 13.7361, lng: 100.5606 },
    // London
    'oxford street':       { lat: 51.5152, lng: -0.1415  },
    'covent garden':       { lat: 51.5117, lng: -0.1240  },
    'canary wharf':        { lat: 51.5054, lng: -0.0235  },
    'tower bridge':        { lat: 51.5055, lng: -0.0754  },
    'mayfair':             { lat: 51.5099, lng: -0.1456  },
    'soho':                { lat: 51.5137, lng: -0.1337  },
    'shoreditch':          { lat: 51.5235, lng: -0.0794  },
    'kensington':          { lat: 51.4994, lng: -0.1932  },
    // Paris
    'champs':              { lat: 48.8698, lng: 2.3078   },
    'louvre':              { lat: 48.8606, lng: 2.3376   },
    'marais':              { lat: 48.8551, lng: 2.3556   },
    'montmartre':          { lat: 48.8867, lng: 2.3431   },
    // Tokyo
    'shinjuku':            { lat: 35.6938, lng: 139.7034 },
    'asakusa':             { lat: 35.7148, lng: 139.7967 },
    'ginza':               { lat: 35.6715, lng: 139.7668 },
    'akihabara':           { lat: 35.6987, lng: 139.7729 },
    'roppongi':            { lat: 35.6628, lng: 139.7315 },
    // Mumbai
    'bandra':              { lat: 19.0596, lng: 72.8295  },
    'juhu':                { lat: 19.0989, lng: 72.8264  },
    'marine drive':        { lat: 18.9322, lng: 72.8264  },
    'colaba':              { lat: 18.9067, lng: 72.8147  },
    'andheri':             { lat: 19.1136, lng: 72.8697  },
    'powai':               { lat: 19.1197, lng: 72.9063  },
    'lower parel':         { lat: 18.9953, lng: 72.8258  },
    'bkc':                 { lat: 19.0662, lng: 72.8684  },
    // Delhi
    'connaught place':     { lat: 28.6304, lng: 77.2177  },
    'india gate':          { lat: 28.6129, lng: 77.2295  },
    'aerocity':            { lat: 28.5562, lng: 77.1143  },
    'hauz khas':           { lat: 28.5494, lng: 77.2001  },
    'lajpat nagar':        { lat: 28.5726, lng: 77.2390  },
    'south delhi':         { lat: 28.5244, lng: 77.1855  },
    // Bali
    'kuta':                { lat: -8.7184, lng: 115.1686 },
    'seminyak':            { lat: -8.6905, lng: 115.1609 },
    'ubud':                { lat: -8.5069, lng: 115.2625 },
    'nusa dua':            { lat: -8.7994, lng: 115.2312 },
    'canggu':              { lat: -8.6478, lng: 115.1385 },
    'shinjuku':            { lat: 35.6938, lng: 139.7034 },
    'asakusa':             { lat: 35.7148, lng: 139.7967 },
    'tsim sha tsui':       { lat: 22.2988, lng: 114.1722 },
    'mong kok':            { lat: 22.3193, lng: 114.1694 },
    'opera house':         { lat: -33.8568, lng: 151.2153},
    'bondi beach':         { lat: -33.8915, lng: 151.2767},
  }

  const query = q.toLowerCase().trim()
  const keys = Object.keys(LANDMARKS).sort((a, b) => b.length - a.length)
  const match = keys.find(k => query.includes(k) || k.includes(query))

  if (match) {
    return res.json({ lat: LANDMARKS[match].lat, lng: LANDMARKS[match].lng, label: q })
  }

  // Try liteAPI places as fallback
  try {
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })
    if (resp.status === 200 && resp.data?.data?.[0]) {
      const place = resp.data.data[0]
      const lat = place.latitude || place.location?.lat || null
      const lng = place.longitude || place.location?.lng || null
      if (lat && lng) return res.json({ lat, lng, label: place.name || q })
    }
  } catch (e) {}

  return res.json({ lat: null, lng: null, label: null })
})

// ── GET /api/hotels/suggest ───────────────────────────────────────────────────
router.get('/suggest', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ cities: [], hotels: [] })

  const query = q.toLowerCase().trim()

  // 1. City suggestions from liteAPI — cities only, no metro/mall/business
  let cities = []
  try {
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })
    if (resp.status === 200 && resp.data?.data) {
      cities = resp.data.data
        .filter(place => {
          const name = (place.name || place.displayName || '').toLowerCase()
          const types = (place.types || []).join(' ').toLowerCase()
          // Only keep cities, regions, countries — skip everything else
          if (/metro|station|airport|mall|hospital|clinic|doctor|pharmacy|school|university|restaurant|hotel|shop|market|temple|mosque|church|park|garden|museum|stadium|cinema|theatre|tower|bridge|road|street|avenue|colony|nagar|vihar|enclave|sector|block|phase/.test(name)) return false
          if (types && !/locality|administrative|political|country|sublocality/.test(types)) return false
          return true
        })
        .slice(0, 6)
        .map(place => {
          const countryCode = place.countryCode || place.country_code || ''
          const placeName = place.name || place.displayName || q
          const cityInfo = getCityInfo(placeName)
          const countryName = place.countryName || place.country || COUNTRY_NAMES[countryCode] || cityInfo?.country || ''
          const flag = COUNTRY_FLAGS[countryCode] || cityInfo?.flag || ''
          return {
            type: 'city',
            name: placeName,
            countryName,
            countryCode,
            flag,
            placeId: place.placeId || place.place_id,
          }
        })
        .filter(c => c.placeId && c.flag) // only show if we have a flag
        .filter((c, index, self) => index === self.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase())) // remove duplicates
        .filter(c => c.name.toLowerCase().includes(query) || query.includes(c.name.toLowerCase().split(' ')[0])) // only show relevant matches
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
      adults = '2', children = '0', childAges, rooms = '1',
      placeId, hotelId, page, sessionId,
    } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut are required' })
    }

    // pageNum is null for "all-pages" callers (no ?page=), or 0-4 for progressive mode.
    // hasMore is purely a function of pageNum, so it must be attached on EVERY response
    // path — including cache hits — or a cached page (e.g. page=1 from an earlier
    // request) comes back without hasMore and the frontend's progressive loop stops early.
    const pageNum = (page !== undefined) ? Math.max(0, Math.min(4, parseInt(page, 10) || 0)) : null

    // sessionId is deliberately excluded from the cache key — it's a per-user search
    // session, not part of what makes two searches "the same search" for caching
    // purposes. A cache hit just won't carry liteAPI's price-consistency guarantee for
    // that particular response (no live call was made), same as before this feature.
    const cacheKey = `s:${placeId || hotelId || destination}:${checkIn}:${checkOut}:${adults}:${children}:${childAges || ''}:${rooms}:${page ?? 'all'}`
    const hit = memGet(cacheKey)
    if (hit) {
      const payload = { hotels: { hotels: hit, total: hit.length, checkIn, checkOut } }
      if (pageNum !== null) { payload.hotels.page = pageNum; payload.hotels.hasMore = pageNum < 4 }
      return res.json(payload)
    }

    const baseBody = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'INR',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children, childAges),
      maxRatesPerHotel: 1,
      includeHotelData: true,
      ...(sessionId ? { sessionId } : {}),
      timeout: 10,
    }

    let ratesList = []
    let hotelsMetaList = []

    if (hotelId) {
      const resp = await axios.post(`${BASE_URL}/hotels/rates`, {
        ...baseBody, hotelIds: [hotelId], limit: 1,
      }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true })

      if (resp.status !== 200) {
        return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data })
      }
      ratesList = resp.data.data || []
      hotelsMetaList = resp.data.hotels || []

    } else if (placeId) {
      const PAGE_SIZE = 200

      if (pageNum !== null) {
        // ── Single-page mode (progressive loading) ─────────────────────
        // Frontend fetches page 0 first for a fast first paint, then pages
        // 1-4 in the background and appends results as they arrive.
        // Page 0 uses a smaller limit + shorter liteAPI timeout so the very
        // first hotels appear in ~2-3s instead of waiting on a full 200-hotel,
        // 12s-budget batch. Pages 1-4 keep the full PAGE_SIZE/timeout since
        // they load silently in the background after first paint.
        const FAST_FIRST_PAGE_SIZE = 16
        const limit = pageNum === 0 ? FAST_FIRST_PAGE_SIZE : PAGE_SIZE
        const liteApiTimeout = pageNum === 0 ? 5 : 12
        const offset = pageNum === 0 ? 0 : FAST_FIRST_PAGE_SIZE + (pageNum - 1) * PAGE_SIZE

        const resp = await axios.post(`${BASE_URL}/hotels/rates`, {
          ...baseBody, placeId, limit, offset, timeout: liteApiTimeout,
        }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true })
          .catch(e => ({ status: 0, data: null, _err: e.message }))

        if (resp.status !== 200 || !resp.data) {
          return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data || resp._err })
        }

        ratesList = resp.data.data || []
        hotelsMetaList = resp.data.hotels || []

        var _pageInfo = {
          page: pageNum,
          rawCount: ratesList.length,
          // Always walk through all 5 pages (0-4) — liteAPI's per-page raw
          // counts aren't reliably == PAGE_SIZE even when later offsets still
          // have results, so we can't use that as a stopping signal.
          hasMore: pageNum < 4,
        }

      } else {
        // ── All-pages mode (backward compatible — e.g. other callers) ──
        // Fetch multiple pages in PARALLEL so we surface most/all hotels in a
        // city without taking N x longer. liteAPI's default page size is 200
        // (expandable to 5,000) — 5 parallel pages = up to 1000 raw hotel IDs searched.
        const PAGE_OFFSETS = [0, 200, 400, 600, 800]

        const responses = await Promise.all(PAGE_OFFSETS.map(offset =>
          axios.post(`${BASE_URL}/hotels/rates`, {
            ...baseBody, placeId, limit: PAGE_SIZE, offset, timeout: 12,
          }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true })
            .catch(e => ({ status: 0, data: null, _err: e.message }))
        ))

        const okResponses = responses.filter(r => r.status === 200 && r.data)
        if (okResponses.length === 0) {
          const first = responses[0] || {}
          return res.status(502).json({ error: `liteAPI returned ${first.status}`, detail: first.data || first._err })
        }

        const pageRawCounts = responses.map(r => (r.status === 200 && r.data) ? (r.data.data || []).length : 0)
        const pageStatuses  = responses.map(r => r.status)

        for (const resp of okResponses) {
          ratesList.push(...(resp.data.data || []))
          hotelsMetaList.push(...(resp.data.hotels || []))
        }

        const totalBeforeDedup = ratesList.length

        // De-dupe in case pages overlap
        const seen = new Set()
        ratesList = ratesList.filter(h => {
          if (seen.has(h.hotelId)) return false
          seen.add(h.hotelId)
          return true
        })

        var _debugInfo = {
          pageOffsets: PAGE_OFFSETS,
          pageStatuses,
          pageRawCounts,
          totalBeforeDedup,
          totalAfterDedup: ratesList.length,
        }
      }

    } else {
      return res.status(400).json({ error: 'Please select a destination from the dropdown' })
    }

    const hotelMeta = {}
    for (const h of hotelsMetaList) hotelMeta[h.id] = h

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
    const responsePayload = { hotels: { hotels, total: hotels.length, checkIn, checkOut } }
    if (typeof _pageInfo !== 'undefined') {
      responsePayload.hotels.page = _pageInfo.page
      responsePayload.hotels.hasMore = _pageInfo.hasMore
    }
    if (typeof _debugInfo !== 'undefined') {
      responsePayload.hotels._debug = { ..._debugInfo, totalAfterFilter: hotels.length }
    }
    return res.json(responsePayload)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── Builds a display-ready hotel card for one streamed liteAPI rate entry ──
// Pulls name/city/stars/photo from our own pre-built HOTEL_CACHE_BY_ID (built
// at server startup, instant, no extra network call) rather than waiting for
// liteAPI's own hotel-metadata block, which only arrives at the END of a
// streamed response. Returns null for hotels with no usable rate at all.
function buildStreamHotelCard(h, destinationFallback) {
  const firstRT = h.roomTypes?.[0]
  const firstRate = firstRT?.rates?.[0]
  if (!firstRate) return null

  const taxes = firstRate?.taxesAndFees || []
  const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
  if (hasPayAtHotel) return null

  const priceINR = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || firstRate?.net || 0)
  if (!priceINR) return null
  const rebuqPriceINR = Math.round(priceINR * MARKUP)
  const otaPriceINR = Math.round(priceINR)

  const meta = HOTEL_CACHE_BY_ID[String(h.hotelId)] || {}
  const refTag = firstRate?.cancellationPolicies?.refundableTag || null
  const boardType = firstRate?.boardType || firstRate?.boardCode || 'RO'

  return {
    code: h.hotelId,
    name: meta.name || 'Hotel',
    city: meta.city || destinationFallback || '',
    stars: meta.stars || null,
    minRate: rebuqPriceINR,
    lowestPriceINR: rebuqPriceINR,
    otaPriceINR,
    memberSaving: 0,
    currency: 'INR',
    imageUrl: meta.imageUrl || null,
    latitude: meta.latitude || null,
    longitude: meta.longitude || null,
    isRefundable: refTag === 'RFN' ? true : refTag === 'NRFN' ? false : null,
    hasBreakfast: !['RO', 'Room Only', '', null, undefined].includes(boardType),
    taxesIncluded: true,
    amenities: [],
    roomTypes: h.roomTypes || [],
  }
}

// ── GET /api/hotels/search-stream ───────────────────────────────────────────
// True incremental search: liteAPI pushes each hotel's rate down an open SSE
// connection the moment it's ready, instead of us waiting for a full batch.
// Replaces the old "16 fast, then 4 pages of 200 in the background" workaround
// for the placeId-based listing search. Always hits liteAPI live (no internal
// cache), which also means sessionId's price-consistency guarantee is honored
// on every request through this path, not just on cache misses.
router.get('/search-stream', async (req, res) => {
  const {
    destination, checkIn, checkOut,
    adults = '2', children = '0', childAges, rooms = '1',
    placeId, sessionId,
  } = req.query

  if (!checkIn || !checkOut || !placeId) {
    return res.status(400).json({ error: 'checkIn, checkOut and placeId are required' })
  }

  console.log(`🔎 search-stream: dest="${destination}" placeId=${placeId} ${checkIn}→${checkOut} adults=${adults} rooms=${rooms}`)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (res.flushHeaders) res.flushHeaders()

  let closed = false
  req.on('close', () => { closed = true })
  const safeWrite = (s) => { if (!closed) { try { res.write(s) } catch {} } }
  const finish = () => { if (!closed) { safeWrite('data: [DONE]\n\n'); try { res.end() } catch {} ; closed = true } }

  try {
    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'INR',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children, childAges),
      maxRatesPerHotel: 1,
      includeHotelData: true,
      placeId,
      limit: 400,
      timeout: 10,
      stream: true,
      ...(sessionId ? { sessionId } : {}),
    }

    const liteResp = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: { ...getHeaders(), Accept: 'text/event-stream' },
      responseType: 'stream',
      timeout: 30000,
      validateStatus: () => true,
    })

    if (liteResp.status !== 200) {
      console.error(`⚠️ search-stream: liteAPI connect status=${liteResp.status}`)
      safeWrite(`data: ${JSON.stringify({ error: `liteAPI returned ${liteResp.status}` })}\n\n`)
      return finish()
    }
    console.log(`📡 search-stream: liteAPI connected (status 200), reading stream…`)

    let buffer = ''
    let endMeta = null
    const unresolved = []
    let rawCount = 0
    let cardCount = 0

    // Sends a chunk of hotel cards down OUR stream. On the first pass,
    // hotels we can't yet name (not in our local cache) are held back rather
    // than shown as "Hotel" — they get a real name once the stream ends.
    const flushCards = (rawRates, isBackfillPass) => {
      const cards = []
      for (const r of rawRates) {
        if (isBackfillPass && !HOTEL_CACHE_BY_ID[String(r.hotelId)] && endMeta?.[r.hotelId]) {
          HOTEL_CACHE_BY_ID[String(r.hotelId)] = endMeta[r.hotelId]
        }
        const card = buildStreamHotelCard(r, destination)
        if (!card) continue
        if (card.name === 'Hotel' && !isBackfillPass) { unresolved.push(r); continue }
        cards.push(card)
      }
      cardCount += cards.length
      if (cards.length) safeWrite(`data: ${JSON.stringify({ hotels: cards })}\n\n`)
    }

    liteResp.data.on('data', (chunk) => {
      if (closed) return
      buffer += chunk.toString('utf8')
      const parts = buffer.split('\n\n')
      buffer = parts.pop()
      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        let msg
        try { msg = JSON.parse(payload) } catch { continue }
        if (Array.isArray(msg.rates)) {
          rawCount += msg.rates.length
          flushCards(msg.rates, false)
        } else if (Array.isArray(msg.hotels)) {
          endMeta = {}
          for (const hm of msg.hotels) {
            endMeta[hm.id] = { name: hm.name, city: destination, imageUrl: hm.main_photo || hm.thumbnail || null, stars: null, latitude: null, longitude: null }
          }
        }
      }
    })

    liteResp.data.on('end', () => {
      if (unresolved.length) flushCards(unresolved, true)
      console.log(`✅ search-stream done: ${rawCount} raw rates from liteAPI → ${cardCount} cards sent`)
      finish()
    })

    liteResp.data.on('error', (e) => {
      console.error('⚠️ liteAPI stream error:', e.message)
      finish()
    })

  } catch (e) {
    console.error('⚠️ /search-stream error:', e.message)
    safeWrite(`data: ${JSON.stringify({ error: e.message })}\n\n`)
    finish()
  }
})

// ── GET /api/hotels/resolve-hotel ────────────────────────────────────────────
router.get('/resolve-hotel', async (req, res) => {
  const { name, city, country } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const cc = country || 'AE';
    const cn = city || '';
    const resp = await axios.get(
      `${BASE_URL}/data/hotels?countryCode=${cc}&cityName=${encodeURIComponent(cn)}&hotelName=${encodeURIComponent(name)}&limit=5`,
      { headers: getHeaders(), timeout: 8000, validateStatus: () => true }
    );
    const hotels = resp.data?.data || [];
    return res.json({ hotels: hotels.map(h => ({ id: h.id, name: h.name, city: h.city, address: h.address })) });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});



// ── GET /api/hotels/cache-dump ────────────────────────────────────────────────
router.get('/cache-dump', (req, res) => {
  const fmt = req.query.format || 'json';
  const cityFilter = (req.query.city || '').toLowerCase();
  const list = cityFilter ? HOTEL_CACHE.filter(h => (h.city || '').toLowerCase() === cityFilter) : HOTEL_CACHE;

  if (fmt === 'csv') {
    const rows = ['hotelId,name,city,country'];
    for (const h of list) {
      const name = (h.name || '').replace(/,/g, ' ');
      rows.push(`${h.hotelId},${name},${h.city || ''},${h.country || ''}`);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rebuq_hotel_cache.csv"');
    return res.send(rows.join('\n'));
  }
  if (fmt === 'count') {
    // Quick counts grouped by city (or just the filtered total if ?city= given)
    if (cityFilter) return res.json({ city: req.query.city, total: list.length });
    const byCity = {};
    for (const h of HOTEL_CACHE) { const c = h.city || 'Unknown'; byCity[c] = (byCity[c] || 0) + 1; }
    return res.json({ total: HOTEL_CACHE.length, byCity });
  }
  return res.json({ total: list.length, hotels: list.map(h => ({ hotelId: h.hotelId, name: h.name, city: h.city, country: h.country })) });
});

// ── GET /api/hotels/cache-search ─────────────────────────────────────────────
router.get('/cache-search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: HOTEL_CACHE.slice(0, 20) });
  const query = q.toLowerCase();
  const results = HOTEL_CACHE
    .filter(h => h.name.toLowerCase().includes(query))
    .slice(0, 10)
    .map(h => ({ hotelId: h.hotelId, name: h.name, city: h.city, country: h.country }));
  return res.json({ results, total: HOTEL_CACHE.length });
});

// ── GET /api/hotels/:code ─────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = '2', children = '0', childAges, rooms = '1', sessionId } = req.query
    if (!checkIn || !checkOut) return res.status(400).json({ error: 'checkIn and checkOut required' })
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))

    const [contentResp, ratesResp, reviewsResp, roomsResp] = await Promise.all([
      axios.get(`${BASE_URL}/data/hotel?hotelId=${code}`, { headers: getHeaders(), timeout: 12000, validateStatus: () => true }),
      axios.post(`${BASE_URL}/hotels/rates`, {
        checkin: checkIn, checkout: checkOut, currency: 'INR', guestNationality: 'IN',
        hotelIds: [code], occupancies: buildOccupancies(rooms, adults, children, childAges),
        includeHotelData: false, roomMapping: true,
        ...(sessionId ? { sessionId } : {}),
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
