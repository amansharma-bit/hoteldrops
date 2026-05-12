const express = require('express')
const router  = express.Router()
const { searchHotels, getDestinationCode } = require('../utils/hotelbeds')

// GET /api/test/hotelbeds
// Quick test — hit this from browser to verify Hotelbeds API works
router.get('/hotelbeds', async (req, res) => {
  try {
    const city        = req.query.city || 'Mumbai'
    const destCode    = getDestinationCode(city) || 'MCM'

    // Set dates 3 months from now
    const checkIn  = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    const checkOut = new Date(Date.now() + 92 * 86400000).toISOString().split('T')[0]

    console.log(`🧪 Testing Hotelbeds API — ${city} (${destCode}) ${checkIn} → ${checkOut}`)

    const hotels = await searchHotels({
      destination: destCode,
      checkIn,
      checkOut,
      adults:     2,
      rooms:      1,
      maxHotels:  5,
    })

    if (!hotels.length) {
      return res.json({
        success: false,
        message: `No hotels found for ${city} (${destCode})`,
        tip: 'Try a different city — e.g. ?city=Delhi or ?city=Goa',
      })
    }

    res.json({
      success:     true,
      message:     `✅ Hotelbeds API is working!`,
      city,
      destCode,
      checkIn,
      checkOut,
      hotelsFound: hotels.length,
      hotels: hotels.map(h => ({
        code:     h.code,
        name:     h.name,
        stars:    h.categoryName,
        zone:     h.zoneName,
        minRate:  h.minRate,
        currency: h.currency,
      })),
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      error:   err.message,
      tip:     'Check Railway logs for more details',
    })
  }
})

// GET /api/test/mapping?hotel=Taj+Mahal+Palace&city=Mumbai
// Test hotel name → Hotelbeds code mapping
router.get('/mapping', async (req, res) => {
  try {
    const { hotel = 'Taj Mahal Palace', city = 'Mumbai' } = req.query
    const { findHotelCode, getDestinationCode } = require('../utils/hotelbeds')

    const destCode = getDestinationCode(city)
    if (!destCode) {
      return res.json({ success: false, error: `Unknown city: ${city}` })
    }

    console.log(`🗺️  Mapping "${hotel}" in ${city} (${destCode})`)
    const hotelCode = await findHotelCode(hotel, destCode)

    res.json({
      success:   !!hotelCode,
      hotel,
      city,
      destCode,
      hotelCode: hotelCode || null,
      message:   hotelCode
        ? `✅ Mapped! "${hotel}" → Hotelbeds code: ${hotelCode}`
        : `❌ Could not map "${hotel}" — hotel may not be in Hotelbeds inventory`,
    })

  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/test/whatsapp?phone=9876543210
router.get('/whatsapp', async (req, res) => {
  try {
    const { sendWhatsAppAlert } = require('../utils/notifications')
    const phone = req.query.phone || '9999999999'
    await sendWhatsAppAlert(phone, {
      customerName: 'Aman',
      hotelName: 'Taj Jumeirah Lakes Towers',
      city: 'Dubai',
      checkIn: '2026-12-14',
      checkOut: '2026-12-18',
      nights: 4,
      originalPrice: 112000,
      offerPrice: 89600,
      customerSaving: 22400,
      offerId: 'test-offer-123',
    })
    res.json({ success: true, message: `✅ WhatsApp sent to ${phone}!` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/test/destinations?country=IN
router.get('/destinations', async (req, res) => {
  try {
    const { country = 'IN' } = req.query
    const https  = require('https')
    const crypto = require('crypto')
    const zlib   = require('zlib')

    const API_KEY = process.env.HOTELBEDS_API_KEY
    const SECRET  = process.env.HOTELBEDS_SECRET
    const BASE    = 'https://api.test.hotelbeds.com'

    const ts  = Math.floor(Date.now() / 1000).toString()
    const sig = crypto.createHash('sha256').update(API_KEY + SECRET + ts).digest('hex')

    const url = BASE + '/hotel-content-api/1.0/locations/destinations?language=ENG&countryCode=' + country + '&useSecondaryLanguage=false&from=1&to=200'

    const options = {
      method: 'GET',
      headers: {
        'Api-key':        API_KEY,
        'X-Signature':    sig,
        'Accept':         'application/json',
        'Accept-Encoding':'gzip',
        'Content-Type':   'application/json',
      }
    }

    const req2 = https.request(url, options, (response) => {
      const chunks = []
      response.on('data', c => chunks.push(c))
      response.on('end', () => {
        const buffer   = Buffer.concat(chunks)
        const encoding = response.headers['content-encoding']

        const parse = (buf) => {
          try {
            const raw  = buf.toString('utf8')
            const data = JSON.parse(raw)
            if (data.error) return res.status(500).json({ error: JSON.stringify(data.error) })
            const destinations = (data.destinations || []).map(d => ({
              code: d.code,
              name: d.name?.content || d.name,
              countryCode: d.countryCode,
            })).sort((a,b) => (a.name||'').localeCompare(b.name||''))
            res.json({ success: true, country, total: destinations.length, destinations })
          } catch(e) {
            res.status(500).json({ error: e.message, raw: buf.toString('utf8').substring(0,200) })
          }
        }

        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return res.status(500).json({ error: err.message })
            parse(decoded)
          })
        } else { parse(buffer) }
      })
    })
    req2.on('error', e => res.status(500).json({ error: e.message }))
    req2.end()

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
