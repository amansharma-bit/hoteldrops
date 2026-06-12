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
const { runPriceTracker } = require('./jobs/priceTracker')

const app = express()

// ── CORS — must be before all routes ─────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/bookings', bookingRoutes)
app.use('/api/test',     testRoutes)
app.use('/api/alerts',   alertRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/hotels',   hotelRoutes)
app.use('/api/voucher',  voucherRoutes)

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
