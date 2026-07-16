// Force fresh deploy
require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const path       = require('path')
const cron       = require('node-cron')
const bookingRoutes = require('./routes/bookings')
const testRoutes    = require('./routes/test')
const alertRoutes   = require('./routes/alerts')
const adminRoutes   = require('./routes/admin')
const hotelRoutes   = require('./routes/hotels')
const voucherRoutes = require('./routes/voucher')
const rebookingRoutes = require('./routes/rebooking')
const probeRoutes   = require('./routes/probe')
const hotelsLiveSearchRoutes = require('./routes/hotels-live-search')
const hotelsResolveSearchRoutes = require('./routes/hotels-resolve-search')
const { requireAuth } = require('./middleware/requireAuth')
const { runPriceTracker } = require('./jobs/priceTracker')
const app = express()
// ── CORS — locked down to real, trusted origins only ──────────────────────────
// Single mechanism only (previous version accidentally had two CORS
// handlers running at once, which caused real requests to fail).
const ALLOWED_ORIGINS = [
  'https://www.rebuq.com',
  'https://rebuq.com',
  'http://localhost:3000', // local dev only
]

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/bookings', bookingRoutes)
app.use('/api/test',     testRoutes)
app.use('/api/alerts',   alertRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/hotels',   hotelRoutes)
app.use('/api/voucher',  requireAuth, voucherRoutes)
app.use('/api/rebooking', rebookingRoutes)
app.use('/api/probe',    probeRoutes)
app.use('/api/live-search', requireAuth, hotelsLiveSearchRoutes)
app.use('/api/live-search', requireAuth, hotelsResolveSearchRoutes)
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))
// Manual trigger for demo
app.get('/api/run-tracker', async (req, res) => {
  console.log('🔥 Manual price tracker triggered')
  try {
    const result = await runPriceTracker(true)
    res.json({ success: true, ...result })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
cron.schedule('*/5 * * * *', async () => {
  console.log('⏰ Running price tracker job...')
  try {
    const result = await runPriceTracker()
    console.log(`✅ Price tracker done: ${result.checked} checked, ${result.dropsFound} drops found`)
  } catch (err) {
    console.error('❌ Price tracker error:', err.message)
  }
})
// NOTE: the rebooking engine is deliberately NOT on a cron schedule yet.
// It's manual-trigger-only (POST /api/rebooking/run) until dry-run results
// have been reviewed and DRY_RUN is confidently set to false. Once ready,
// a cron.schedule(...) block can be added here the same way as the price
// tracker above.
if (process.env.NODE_ENV === 'development') {
  setTimeout(async () => {
    console.log('🚀 Running initial price check on startup...')
    try { await runPriceTracker() } catch(e) { console.error(e.message) }
  }, 10000)
}
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🏨 HotelDrops backend running on port ${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
})
