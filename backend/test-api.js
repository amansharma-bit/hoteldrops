/**
 * HotelDrops — Hotelbeds API Test Script
 * Run: node test-api.js
 * This verifies your API keys work before deploying
 */

require('dotenv').config()

// Inline the auth so this file is self-contained
const https  = require('https')
const crypto = require('crypto')

const API_KEY = process.env.HOTELBEDS_API_KEY || '7c4cffe425a8431decf3eea0a8145196'
const SECRET  = process.env.HOTELBEDS_SECRET  || 'WxhfeKEcBR'
const BASE    = 'https://api.test.hotelbeds.com'

function getHeaders() {
  const ts  = Math.floor(Date.now() / 1000).toString()
  const sig = crypto.createHash('sha256').update(API_KEY + SECRET + ts).digest('hex')
  return { 'Api-key': API_KEY, 'X-Signature': sig, 'Accept': 'application/json', 'Content-Type': 'application/json' }
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body)
    const headers = { ...getHeaders(), 'Content-Length': Buffer.byteLength(data) }
    const req = https.request(`${BASE}${path}`, { method: 'POST', headers }, (res) => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch (e) { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function runTests() {
  console.log('🧪 HotelDrops — Hotelbeds API Test\n')
  console.log(`API Key: ${API_KEY.substring(0,8)}...`)
  console.log(`Secret:  ${SECRET.substring(0,4)}...`)
  console.log(`Base:    ${BASE}\n`)

  // ── Test 1: Hotel availability search ──
  console.log('Test 1: Hotel availability search (Mumbai, 2 nights)...')
  const tomorrow   = new Date(Date.now() + 30 * 86400000)
  const dayAfter   = new Date(Date.now() + 32 * 86400000)
  const checkIn    = tomorrow.toISOString().split('T')[0]
  const checkOut   = dayAfter.toISOString().split('T')[0]

  const searchRes = await post('/hotel-api/1.0/hotels', {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms: 1, adults: 2, children: 0 }],
    destination: { code: 'MCM' },   // Mumbai
    filter:      { maxHotels: 3 },
  })

  if (searchRes.status === 200 && searchRes.body.hotels?.hotels?.length) {
    const hotels = searchRes.body.hotels.hotels
    console.log(`  ✅ Found ${hotels.length} hotels in Mumbai`)
    hotels.forEach(h => {
      const minRate = h.minRate || (h.rooms?.[0]?.rates?.[0]?.net)
      console.log(`     • ${h.name} — from ${searchRes.body.hotels.currency} ${minRate}`)
    })

    // ── Test 2: Check a specific hotel ──
    const firstHotel = hotels[0]
    console.log(`\nTest 2: Price check for "${firstHotel.name}" (code: ${firstHotel.code})...`)
    const priceRes = await post('/hotel-api/1.0/hotels', {
      stay:        { checkIn, checkOut },
      occupancies: [{ rooms: 1, adults: 2, children: 0 }],
      hotels:      { hotel: [firstHotel.code] },
      filter:      { maxHotels: 1 },
    })

    if (priceRes.status === 200) {
      const hotel  = priceRes.body.hotels?.hotels?.[0]
      const room   = hotel?.rooms?.[0]
      const rate   = room?.rates?.[0]
      console.log(`  ✅ Price check successful`)
      console.log(`     Room: ${room?.name}`)
      console.log(`     Rate: ${priceRes.body.hotels?.currency} ${rate?.net}`)
      console.log(`     Board: ${rate?.boardName}`)
      console.log(`     Type: ${rate?.rateType}`)
    } else {
      console.log(`  ❌ Price check failed: ${priceRes.status}`)
      console.log(`     ${JSON.stringify(priceRes.body?.error || priceRes.body).substring(0,200)}`)
    }

  } else {
    console.log(`  ❌ Search failed: HTTP ${searchRes.status}`)
    console.log(`     ${JSON.stringify(searchRes.body?.error || searchRes.body).substring(0,300)}`)

    if (searchRes.status === 401 || searchRes.status === 403) {
      console.log('\n  💡 Auth failed — double-check your API key and secret')
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log('📊 Rate limits on your test account:')
  console.log('   • 8 requests per 4 seconds')
  console.log('   • 50 requests per day (resets every 86,400 seconds)')
  console.log('   • This test used ~2 of your 50 daily calls')
  console.log('\n✅ Test complete! If you saw hotels above, your API is working.')
  console.log('🚀 You can now run: npm run dev\n')
}

runTests().catch(err => {
  console.error('❌ Test error:', err.message)
  process.exit(1)
})
