const express = require('express')
const multer = require('multer')
const axios = require('axios')
const router = express.Router()

// Store file in memory (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only images and PDFs are allowed'))
  }
})

router.post('/extract', upload.single('voucher'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileBuffer = req.file.buffer
    const mimeType = req.file.mimetype
    const base64Data = fileBuffer.toString('base64')

    // Build the content for Claude
    let content = []

    if (mimeType === 'application/pdf') {
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data
          }
        },
        {
          type: 'text',
          text: `Extract the hotel booking details from this PDF voucher/confirmation. 
Return ONLY a JSON object with these exact fields (no markdown, no extra text):
{
  "hotel_name": "full hotel name",
  "hotel_city": "city name only",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "room_type": "room type or empty string",
  "original_price": total price as number (no currency symbol),
  "currency": "INR or USD or EUR or AED etc",
  "num_adults": number of adults,
  "num_rooms": number of rooms,
  "booking_reference": "booking ref or empty string",
  "platform": "booking platform name e.g. Booking.com, MakeMyTrip, Expedia or empty string"
}
If any field is not found, use an empty string for text fields and 0 for numbers.`
        }
      ]
    } else {
      // Image
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: `Extract the hotel booking details from this booking confirmation image.
Return ONLY a JSON object with these exact fields (no markdown, no extra text):
{
  "hotel_name": "full hotel name",
  "hotel_city": "city name only",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "room_type": "room type or empty string",
  "original_price": total price as number (no currency symbol),
  "currency": "INR or USD or EUR or AED etc",
  "num_adults": number of adults,
  "num_rooms": number of rooms,
  "booking_reference": "booking ref or empty string",
  "platform": "booking platform name e.g. Booking.com, MakeMyTrip, Expedia or empty string"
}
If any field is not found, use an empty string for text fields and 0 for numbers.`
        }
      ]
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    )

    const rawText = response.data.content[0].text.trim()

    // Parse JSON — strip any markdown fences if present
    const clean = rawText.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)

    // Convert price to INR if needed
    const rates = { USD: 83, EUR: 90, GBP: 105, AED: 22.6, THB: 2.3 }
    if (extracted.currency && extracted.currency !== 'INR' && extracted.original_price) {
      const rate = rates[extracted.currency] || 83
      extracted.original_price_inr = Math.round(extracted.original_price * rate)
    } else {
      extracted.original_price_inr = extracted.original_price
    }

    console.log(`✅ Voucher extracted: ${extracted.hotel_name} in ${extracted.hotel_city}`)
    res.json({ success: true, data: extracted })

  } catch (err) {
    console.error('❌ Voucher extraction error:', err.message)
    res.status(500).json({ error: 'Failed to extract voucher details', details: err.message })
  }
})

module.exports = router
