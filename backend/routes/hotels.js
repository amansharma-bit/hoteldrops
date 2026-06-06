const express = require('express')
const router = express.Router()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

// ── Config ────────────────────────────────────────────────────────────────────
const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'
const USD_TO_INR = 84

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── In-memory cache (survives within a Railway instance restart cycle) ─────────
const memCache = new Map()
function memGet(key) {
  const e = memCache.get(key)
  if (!e) return null
  if (Date.now() > e.expires) { memCache.delete(key); return null }
  return e.data
}
function memSet(key, data, ttlMs) {
  memCache.set(key, { data, expires: Date.now() + ttlMs })
}
const TTL_SEARCH = 60 * 60 * 1000        // 1 hour
const TTL_ROOMS  = 30 * 60 * 1000        // 30 min

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function getHeaders() {
  return {
    'X-API-Key': LITE_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
}

// ── Destination map ────────────────────────────────────────────────────────────
const DESTINATION_MAP = {
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
  'kerala': { country: 'IN', city: 'Kochi' },
  'kochi': { country: 'IN', city: 'Kochi' },
  'bali': { country: 'ID', city: 'Bali' },
  'singapore': { country: 'SG', city: 'Singapore' },
  'bangkok': { country: 'TH', city: 'Bangkok' },
  'phuket': { country: 'TH', city: 'Phuket' },
  'kuala lumpur': { country: 'MY', city: 'Kuala Lumpur' },
  'hanoi': { country: 'VN', city: 'Hanoi' },
  'ho chi minh': { country: 'VN', city: 'Ho Chi Minh City' },
  'london': { country: 'GB', city: 'London' },
  'paris': { country: 'FR', city: 'Paris' },
  'rome': { country: 'IT', city: 'Rome' },
  'barcelona': { country: 'ES', city: 'Barcelona' },
  'amsterdam': { country: 'NL', city: 'Amsterdam' },
  'madrid': { country: 'ES', city: 'Madrid' },
  'milan': { country: 'IT', city: 'Milan' },
  'prague': { country: 'CZ', city: 'Prague' },
  'vienna': { country: 'AT', city: 'Vienna' },
  'zurich': { country: 'CH', city: 'Zurich' },
  'lisbon': { country: 'PT', city: 'Lisbon' },
  'athens': { country: 'GR', city: 'Athens' },
  'istanbul': { country: 'TR', city: 'Istanbul' },
  'maldives': { country: 'MV', city: 'Male' },
  'male': { country: 'MV', city: 'Male' },
  'cairo': { country: 'EG', city: 'Cairo' },
  'marrakech': { country: 'MA', city: 'Marrakech' },
  'nairobi': { country: 'KE', city: 'Nairobi' },
  'cape town': { country: 'ZA', city: 'Cape Town' },
  'new york': { country: 'US', city: 'New York' },
  'los angeles': { country: 'US', city: 'Los Angeles' },
  'miami': { country: 'US', city: 'Miami' },
  'cancun': { country: 'MX', city: 'Cancun' },
  'tokyo': { country: 'JP', city: 'Tokyo' },
  'osaka': { country: 'JP', city: 'Osaka' },
  'beijing': { country: 'CN', city: 'Beijing' },
  'shanghai': { country: 'CN', city: 'Shanghai' },
  'hong kong': { country: 'HK', city: 'Hong Kong' },
  'seoul': { country: 'KR', city: 'Seoul' },
  'sydney': { country: 'AU', city: 'Sydney' },
  'melbourne': { country: 'AU', city: 'Melbourne' },
  'yerevan': { country: 'AM', city: 'Yerevan' },
  'riyadh': { country: 'SA', city: 'Riyadh' },
  'doha': { country: 'QA', city: 'Doha' },
  'muscat': { country: 'OM', city: 'Muscat' },
}

function getDestinationCode(cityName) {
  if (!cityName) return null
  return cityName.toLowerCase().trim().split(',')[0].trim()
}

function extractImageUrl(hotelObj) {
  if (!hotelObj) return null
  if (hotelObj.main_photo) return hotelObj.main_photo
  if (hotelObj.hotelImages?.length > 0) return hotelObj.hotelImages[0].url
  if (hotelObj.images?.length > 0) return hotelObj.images[0].url || hotelObj.images[0]
  return null
}

// ── Supabase coords cache ──────────────────────────────────────────────────────
// Reads coords for known hotel IDs from Supabase hotels_cache table.
// For hotels not in cache, fetches from liteAPI /data/hotel sequentially
// and stores result. This means the FIRST search for a destination is slow
// (fetches coords one by one), but every subsequent search is instant.
// When liteAPI changes its API structure, only this function needs updating.

async function enrichWithCoords(hotels) {
  if (!hotels.length) return hotels

  const ids = hotels.map(h => String(h.code))

  // 1. Check Supabase cache for all IDs in one query
  const { data: cached, error } = await supabase
    .from('hotels_cache')
    .select('hotel_id, latitude, longitude, amenities, facilities, star_rating')
    .in('hotel_id', ids)

  if (error) console.warn('⚠️ Supabase cache read error:', error.message)

  const cacheMap = {}
  for (const row of (cached || [])) {
    cacheMap[row.hotel_id] = row
  }

  // 2. Find hotels NOT in cache
  const missing = hotels.filter(h => !cacheMap[String(h.code)])
  console.log(`📍 Cache: ${Object.keys(cacheMap).length} hit, ${missing.length} miss`)

  // 3. Fetch missing hotels from liteAPI /data/hotel sequentially (avoid rate limits)
  if (missing.length > 0) {
    console.log(`🌐 Fetching coords for ${missing.length} hotels from liteAPI...`)
    const toInsert = []

    for (const hotel of missing) {
      try {
        await sleep(150) // 150ms between calls — safe for liteAPI rate limits
        const res = await axios.get(
          `${BASE_URL}/data/hotel?hotelId=${hotel.code}`,
          { headers: getHeaders(), timeout: 8000, validateStatus: () => true }
        )

        if (res.status === 200 && res.data?.data) {
          const d = res.data.data
          const lat = d.location?.latitude || null
          const lng = d.location?.longitude || null
          const amenities = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
          const facilities = (d.facilities || [])
          const starRating = d.starRating ? Math.round(parseFloat(d.starRating)) : null

          cacheMap[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: lat, longitude: lng, amenities, facilities, star_rating: starRating }

          toInsert.push({
            hotel_id: String(hotel.code),
            name: d.name || hotel.name,
            latitude: lat,
            longitude: lng,
            amenities,
            facilities,
            star_rating: starRating,
            cached_at: new Date().toISOString(),
          })
        } else {
          // Store null entry so we don't retry on every search
          toInsert.push({
            hotel_id: String(hotel.code),
            name: hotel.name,
            latitude: null,
            longitude: null,
            amenities: [],
            facilities: {},
            star_rating: hotel.stars || null,
            cached_at: new Date().toISOString(),
          })
          cacheMap[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [], facilities: [] }
        }
      } catch (err) {
        console.warn(`⚠️ Coords fetch failed for ${hotel.code}:`, err.message)
        cacheMap[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [], facilities: [] }
      }
    }

    // Batch upsert into Supabase
    if (toInsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from('hotels_cache')
        .upsert(toInsert, { onConflict: 'hotel_id' })
      if (upsertErr) console.warn('⚠️ Supabase upsert error:', upsertErr.message)
      else console.log(`✅ Cached ${toInsert.length} hotels in Supabase`)
    }
  }

  // 4. Merge cache data back into hotels
  return hotels.map(h => {
    const c = cacheMap[String(h.code)] || {}
    return {
      ...h,
      latitude: c.latitude || h.latitude || null,
      longitude: c.longitude || h.longitude || null,
      amenities: c.amenities?.length > 0 ? c.amenities : (h.amenities || []),
      facilities: c.facilities || h.facilities || [],
      stars: c.star_rating || h.stars || null,
    }
  })
}

// ── GET /api/hotels/search ─────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query

    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields: destination, checkIn, checkOut' })
    }

    // Check in-memory cache first (avoids full round-trip on repeat searches)
    const cacheKey = `search:${destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const cached = memGet(cacheKey)
    if (cached) {
      console.log(`💾 Memory cache hit: ${cacheKey}`)
      return res.json({ hotels: { hotels: cached, total: cached.length, checkIn, checkOut } })
    }

    const key = destination.toLowerCase().trim().split(',')[0].trim()
    const dest = DESTINATION_MAP[key] || { country: null, city: destination.split(',')[0].trim() }

    console.log(`🔍 Searching: ${destination} | ${checkIn} → ${checkOut} | ${adults} adults, ${rooms} room(s)`)

    // ── liteAPI rates call ─────────────────────────────────────────────────────
    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'USD',
      guestNationality: 'IN',
      cityName: dest.city,
      limit: 200,
      includeHotelData: true,
      occupancies: [{
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: children > 0 ? Array(parseInt(children)).fill(5) : [],
      }],
    }
    if (dest.country) body.countryCode = dest.country

    const ratesRes = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(),
      timeout: 30000,
      validateStatus: () => true,
    })

    if (ratesRes.status !== 200) {
      console.error('LiteAPI rates error:', JSON.stringify(ratesRes.data).slice(0, 300))
      return res.status(500).json({ error: `LiteAPI error: ${ratesRes.status}` })
    }

    const rawData = ratesRes.data
    const ratesList = rawData.data || []
    const hotelsList = rawData.hotels || []

    // Build hotel info map from the hotels[] array in the response
    const hotelInfoMap = {}
    for (const h of hotelsList) {
      hotelInfoMap[h.id] = h
    }

    // Map rates + static info into our hotel shape
    let hotels = ratesList.map(h => {
      const info = hotelInfoMap[h.hotelId] || {}
      const firstRoomType = h.roomTypes?.[0]
      const firstRate = firstRoomType?.rates?.[0]

      const minRateUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || 0)

      // Refundable from first rate's cancellation policy
      const refundableTag = firstRate?.cancellationPolicies?.refundableTag || null
      const isRefundable = refundableTag === 'RFN' ? true : refundableTag === 'NRFN' ? false : null

      // Breakfast from boardType
      const boardType = firstRate?.boardType || firstRate?.boardCode || 'RO'
      const hasBreakfast = boardType !== 'RO' && boardType !== 'Room Only'

      return {
        code: h.hotelId,
        name: info.name || 'Hotel',
        city: dest.city,
        stars: info.stars || (info.starRating ? Math.round(parseFloat(info.starRating)) : null),
        minRate: minRateUSD ? Math.round(minRateUSD * USD_TO_INR) : 0,
        lowestPriceINR: minRateUSD ? Math.round(minRateUSD * USD_TO_INR) : 0,
        currency: 'INR',
        address: info.address || null,
        imageUrl: extractImageUrl(info),
        chain: info.chainName || null,
        rating: info.rating || null,
        // Coords will be filled by enrichWithCoords() below
        latitude: info.location?.latitude || null,
        longitude: info.location?.longitude || null,
        isRefundable,
        hasBreakfast,
        amenities: [],
        rooms: h.roomTypes || [],
        reviews: info.rating ? [{ rate: info.rating }] : [],
      }
    })

    console.log(`✅ Found ${hotels.length} hotels`)
    console.log(`📍 Hotels with coords from rates: ${hotels.filter(h => h.latitude && h.longitude).length}`)

    // ── Enrich with coords from Supabase cache / liteAPI /data/hotel ──────────
    hotels = await enrichWithCoords(hotels)

    console.log(`📍 Hotels with coords after enrichment: ${hotels.filter(h => h.latitude && h.longitude).length}`)
    console.log(`🖼️ Hotels with images: ${hotels.filter(h => h.imageUrl).length}`)
    console.log(`📛 Hotels with names: ${hotels.filter(h => h.name && h.name !== 'Hotel').length}`)

    // Cache in memory for 1 hour
    memSet(cacheKey, hotels, TTL_SEARCH)

    return res.json({ hotels: { hotels, total: hotels.length, checkIn, checkOut } })

  } catch (err) {
    console.error('❌ Search error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/hotels/:code ──────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut required' })
    }

    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    console.log(`🏨 Hotel detail: ${code} | ${checkIn} → ${checkOut} | ${nights} nights`)

    // Fetch hotel static content from liteAPI
    const contentRes = await axios.get(
      `${BASE_URL}/data/hotel?hotelId=${code}`,
      { headers: getHeaders(), timeout: 15000, validateStatus: () => true }
    )

    if (contentRes.status !== 200 || !contentRes.data?.data) {
      return res.status(404).json({ error: 'Hotel not found' })
    }

    const d = contentRes.data.data

    // Images
    const images = (d.hotelImages || d.images || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(img => ({ url: img.url || img, type: img.caption || 'General' }))

    // Facilities
    const facilityGroups = { general: [], sports: [], wellness: [], dining: [], connectivity: [] }
    const facilityList = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
    const sportsKw = ['pool', 'gym', 'fitness', 'tennis', 'sport', 'beach']
    const wellnessKw = ['spa', 'sauna', 'massage', 'wellness']
    const diningKw = ['restaurant', 'bar', 'breakfast', 'dining', 'cafe', 'coffee']
    const connKw = ['wifi', 'internet', 'business']

    for (const f of facilityList) {
      const fl = f.toLowerCase()
      if (wellnessKw.some(k => fl.includes(k))) facilityGroups.wellness.push(f)
      else if (sportsKw.some(k => fl.includes(k))) facilityGroups.sports.push(f)
      else if (diningKw.some(k => fl.includes(k))) facilityGroups.dining.push(f)
      else if (connKw.some(k => fl.includes(k))) facilityGroups.connectivity.push(f)
      else facilityGroups.general.push(f)
    }

    // Fetch room rates
    const ratesBody = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'USD',
      guestNationality: 'IN',
      hotelIds: [code],
      includeHotelData: false,
      occupancies: [{
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: children > 0 ? Array(parseInt(children)).fill(5) : [],
      }],
    }

    let roomList = []
    try {
      await sleep(300)
      const ratesRes = await axios.post(`${BASE_URL}/hotels/rates`, ratesBody, {
        headers: getHeaders(), timeout: 30000, validateStatus: () => true,
      })

      if (ratesRes.status === 200) {
        const hotelData = (ratesRes.data.data || [])[0]
        const roomTypes = hotelData?.roomTypes || []

        roomList = roomTypes.map(rt => {
          const rate = rt.rates?.[0]
          const priceUSD = parseFloat(rate?.retailRate?.total?.[0]?.amount || 0)
          const priceINR = priceUSD ? Math.round(priceUSD * USD_TO_INR) : null
          const pricePerNight = priceINR ? Math.round(priceINR / nights) : null

          const refundableTag = rate?.cancellationPolicies?.refundableTag
          const boardType = rate?.boardType || rate?.boardCode || 'RO'
          const hasBreakfast = boardType !== 'RO'

          return {
            roomCode: rt.offerId || rt.roomTypeId,
            name: rate?.name || 'Room',
            maxAdults: rate?.adultCount || parseInt(adults),
            maxPax: (rate?.adultCount || parseInt(adults)) + (rate?.childCount || 0),
            boardCode: boardType,
            boardName: rate?.boardName || (hasBreakfast ? 'Breakfast Included' : 'Room Only'),
            hasBreakfast,
            pricePerNight,
            totalPrice: priceINR,
            offerId: rt.offerId,
            cancellation: {
              refundableTag: refundableTag || null,
              isRefundable: refundableTag === 'RFN',
              policies: rate?.cancellationPolicies?.cancelPolicyInfos || [],
            },
            images: images.slice(0, 3).map(i => i.url),
          }
        })
      }
    } catch (e) {
      console.error('⚠️ Room rates fetch error:', e.message)
    }

    const lowestRoom = roomList.reduce((min, r) => (!min || (r.pricePerNight && r.pricePerNight < min.pricePerNight)) ? r : min, null)

    return res.json({
      success: true,
      hotel: {
        code: d.id || code,
        name: d.name,
        description: d.hotelDescription || '',
        stars: d.starRating ? Math.round(parseFloat(d.starRating)) : null,
        rating: d.rating || null,
        reviewCount: d.reviewCount || null,
        chain: d.chainName || null,
        address: d.address || '',
        city: d.city || '',
        country: d.country || '',
        coordinates: { latitude: d.location?.latitude, longitude: d.location?.longitude },
        checkInTime: d.checkinCheckoutTimes?.checkin || '15:00',
        checkOutTime: d.checkinCheckoutTimes?.checkout || '12:00',
        images,
        rooms: roomList,
        facilityGroups,
        facilityList,
        lowestPriceINR: lowestRoom?.pricePerNight || null,
        lowestTotalINR: lowestRoom?.totalPrice || null,
        nights,
        checkIn,
        checkOut,
        adults: parseInt(adults),
      }
    })

  } catch (err) {
    console.error('❌ Hotel detail error:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router
