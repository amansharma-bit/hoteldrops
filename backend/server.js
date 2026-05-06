require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const path       = require('path')
const cron       = require('node-cron')

const bookingRoutes = require('./routes/bookings')
const alertRoutes   = require('./routes/alerts')
const adminRoutes   = require('./routes/admin')
const { runPriceTracker } = require('./jobs/priceTracker')

const app = express()

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/bookings', bookingRoutes)
app.use('/api/alerts',   alertRoutes)
app.use('/api/admin',    adminRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// ==============================
// PRICE TRACKER CRON JOB
// Runs every 6 hours
// ==============================
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Running price tracker job...')
  try {
    const result = await runPriceTracker()
    console.log(`✅ Price tracker done: ${result.checked} checked, ${result.dropsFound} drops found`)
  } catch (err) {
    console.error('❌ Price tracker error:', err.message)
  }
})

// Also run on startup in dev (after 10 seconds)
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
