const pdfParse = require('pdf-parse')
const Tesseract = require('tesseract.js')
const fs        = require('fs')
const path      = require('path')

// ==============================
// MAIN EXTRACT FUNCTION
// Tries PDF parse first, falls back to OCR
// ==============================
async function extractVoucherDetails(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  let rawText = ''

  try {
    if (ext === '.pdf') {
      rawText = await extractFromPDF(filePath)
    } else {
      rawText = await extractFromImage(filePath)
    }

    if (!rawText || rawText.trim().length < 20) {
      throw new Error('Could not read enough text from voucher')
    }

    return parseHotelDetails(rawText)

  } catch (err) {
    console.error('Voucher extraction error:', err.message)
    // Return empty structure so UI can let user fill manually
    return {
      hotel_name:     '',
      hotel_city:     '',
      hotel_address:  '',
      check_in:       '',
      check_out:      '',
      room_type:      '',
      original_price: 0,
      num_adults:     2,
      num_rooms:      1,
      board_type:     '',
      raw_text:       rawText,
      extraction_confidence: 'low',
    }
  }
}

// Extract text from PDF
async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath)
  const data   = await pdfParse(buffer)
  return data.text
}

// Extract text from image using OCR
async function extractFromImage(filePath) {
  const result = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {}, // suppress logs
  })
  return result.data.text
}

// ==============================
// SMART PARSER
// Extracts structured data from raw text
// ==============================
function parseHotelDetails(text) {
  const t = text.replace(/\s+/g, ' ').trim()

  return {
    hotel_name:     extractHotelName(t),
    hotel_city:     extractCity(t),
    hotel_address:  extractAddress(t),
    check_in:       extractDate(t, 'checkin'),
    check_out:      extractDate(t, 'checkout'),
    room_type:      extractRoomType(t),
    original_price: extractPrice(t),
    num_adults:     extractAdults(t),
    num_rooms:      extractRooms(t),
    board_type:     extractBoardType(t),
    raw_text:       t.substring(0, 500), // Store first 500 chars
    extraction_confidence: 'medium',
  }
}

// ---- Individual extractors ----

function extractHotelName(text) {
  // Common patterns in booking confirmations
  const patterns = [
    /hotel[:\s]+([A-Z][^\n,]{3,50})/i,
    /property[:\s]+([A-Z][^\n,]{3,50})/i,
    /accommodation[:\s]+([A-Z][^\n,]{3,50})/i,
    /staying at[:\s]+([A-Z][^\n,]{3,50})/i,
    /^([A-Z][a-zA-Z\s&']{5,50}(?:Hotel|Palace|Resort|Inn|Suites|Taj|Marriott|Hilton|Hyatt|Oberoi|ITC|Leela|Radisson|Novotel|Holiday Inn|Courtyard|Westin|Sheraton))/m,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractCity(text) {
  const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad',
    'Chennai', 'Kolkata', 'Pune', 'Goa', 'Jaipur', 'Ahmedabad', 'Kochi',
    'Cochin', 'Udaipur', 'Agra', 'Varanasi', 'Amritsar', 'Lucknow',
    'Chandigarh', 'Srinagar', 'Shimla', 'Manali', 'Coimbatore', 'Surat',
    'Nagpur', 'Bhopal', 'Indore', 'Visakhapatnam', 'Mysore', 'Mysuru',
    'Pondicherry', 'Ooty', 'Darjeeling', 'Gangtok', 'Leh', 'Jodhpur',
  ]
  for (const city of INDIAN_CITIES) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city
  }
  return ''
}

function extractAddress(text) {
  const m = text.match(/address[:\s]+([^\n]{10,100})/i)
  return m?.[1]?.trim() || ''
}

function extractDate(text, type) {
  // Patterns: check-in / check-out / arrival / departure
  const checkInPatterns  = [/check[\s-]?in[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i, /arrival[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i]
  const checkOutPatterns = [/check[\s-]?out[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i, /departure[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i]

  const patterns = type === 'checkin' ? checkInPatterns : checkOutPatterns
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return parseDate(m[1].trim())
  }
  return ''
}

function parseDate(raw) {
  // Try various date formats → convert to YYYY-MM-DD
  const months = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  }

  // DD-Mon-YYYY or DD/Mon/YYYY
  const m1 = raw.match(/(\d{1,2})[\s\/\-]([A-Za-z]{3})[\s\/\-](\d{2,4})/i)
  if (m1) {
    const [, d, mon, y] = m1
    const month = months[mon.toLowerCase().substring(0,3)]
    const year  = y.length === 2 ? '20' + y : y
    if (month) return `${year}-${month}-${d.padStart(2,'0')}`
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const m2 = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (m2) {
    const [, d, mo, y] = m2
    const year = y.length === 2 ? '20' + y : y
    return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }

  return ''
}

function extractPrice(text) {
  // Look for total amount in INR
  const patterns = [
    /total[\s\w]*?[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /amount[\s\w]*?[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /grand total[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /₹\s*([0-9,]+(?:\.[0-9]{2})?)/,
    /INR\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /Rs\.?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ''))
      if (price > 500 && price < 10000000) return price // Sanity check
    }
  }
  return 0
}

function extractRoomType(text) {
  const patterns = [
    /room type[:\s]+([^\n,]{3,40})/i,
    /room[:\s]+([^\n,]{3,40}(?:room|suite|villa|deluxe|superior|standard|king|twin|double)[^\n,]{0,20})/i,
    /(deluxe|superior|standard|premium|executive|junior suite|suite|villa|studio)[^\n,]{0,30}/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractAdults(text) {
  const m = text.match(/(\d+)\s*adult/i)
  return m ? parseInt(m[1]) : 2
}

function extractRooms(text) {
  const m = text.match(/(\d+)\s*room/i)
  return m ? Math.min(parseInt(m[1]), 5) : 1
}

function extractBoardType(text) {
  if (/all[\s-]inclusive/i.test(text))  return 'AI'
  if (/full[\s-]board/i.test(text))     return 'FB'
  if (/half[\s-]board/i.test(text))     return 'HB'
  if (/bed and breakfast/i.test(text))  return 'BB'
  if (/breakfast included/i.test(text)) return 'BB'
  if (/room only/i.test(text))          return 'RO'
  return 'RO'
}

module.exports = { extractVoucherDetails }
