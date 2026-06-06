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

    // Fetch static content + rates + reviews in parallel
    const [contentResp, ratesResp, reviewsResp] = await Promise.all([
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
    ])

    const d = contentResp.data?.data
    if (!d) return res.status(404).json({ error: 'Hotel not found' })

    // ── Images ────────────────────────────────────────────────────────────────
    const images = (d.hotelImages || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(img => ({ url: img.url, caption: img.caption || 'Hotel' }))

    // ── Room static data from /data/hotel (for size, beds, amenities, photos)
    const staticRooms = {}
    for (const sr of (d.rooms || [])) {
      staticRooms[sr.id] = {
        description: sr.description || '',
        sizeM2: sr.roomSizeSquare || null,
        bedTypes: (sr.bedTypes || []).map(b => `${b.quantity || 1} ${b.bedType || ''}${b.bedSize ? ' (' + b.bedSize + ')' : ''}`).filter(Boolean),
        amenities: (sr.roomAmenities || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean),
        photos: (sr.photos || []).map(p => p.url || p.failoverPhoto).filter(Boolean),
      }
    }

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

        // Merge static room data via mappedRoomId
        const mappedId = rt.mappedRoomId || null
        const staticRoom = mappedId ? (staticRooms[mappedId] || {}) : {}

        // Room photos: prefer static room photos, fall back to hotel images
        const roomPhotos = staticRoom.photos?.length
          ? staticRoom.photos.slice(0, 5)
          : images.slice(0, 3).map(i => i.url)

        return {
          offerId: rt.offerId,
          mappedRoomId: mappedId,
          name: rate?.name || rt.name || 'Room',
          description: staticRoom.description || '',
          boardCode: boardType,
          boardName: rate?.boardName || (boardType === 'RO' ? 'Room Only' : 'Breakfast Included'),
          hasBreakfast: !['RO', 'Room Only'].includes(boardType),
          maxOccupancy: rate?.maxOccupancy || parseInt(adults),
          sizeM2: staticRoom.sizeM2 || null,
          bedTypes: staticRoom.bedTypes || [],
          amenities: staticRoom.amenities || [],
          photos: roomPhotos,
          pricePerNight: perNightINR,
          totalPrice: totalINR,
          otaTotalINR,
          memberSaving,
          taxesIncluded: true,
          isRefundable: refTag === 'RFN',
          refundableTag: refTag || null,
          cancelPolicies: rate?.cancellationPolicies?.cancelPolicyInfos || [],
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
