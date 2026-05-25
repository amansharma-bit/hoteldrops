// backend/utils/voucherParser.js
// PATCHED: Added board_basis, cancellation_policy, total_price_paid, children_ages

const pdfParse = require('pdf-parse')
const Tesseract = require('tesseract.js')
const fs        = require('fs')
const path      = require('path')

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
    return emptyResult(rawText)
  }
}

async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath)
  const data   = await pdfParse(buffer)
  return data.text
}

async function extractFromImage(filePath) {
  const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} })
  return result.data.text
}

function parseHotelDetails(text) {
  const t = text.replace(/\s+/g, ' ').trim()

  const checkIn   = extractDate(t, 'checkin')
  const checkOut  = extractDate(t, 'checkout')
  const numRooms  = extractRooms(t)
  const numNights = (checkIn && checkOut)
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
    : 0

  const totalPaid = extractTotalPrice(t)
  const perNight  = (totalPaid && numNights > 0 && numRooms > 0)
    ? Math.round(totalPaid / (numNights * numRooms))
    : 0

  const numChildren   = extractChildren(t)
  const childrenAges  = extractChildrenAges(t, numChildren)
  const boardBasis    = extractBoardType(t)
  const cancelPolicy  = extractCancellationPolicy(t)
  const cancelDeadline = extractCancellationDeadline(t)

  return {
    hotel_name:           extractHotelName(t),
    hotel_city:           extractCity(t),
    hotel_address:        extractAddress(t),
    check_in:             checkIn,
    check_out:            checkOut,
    total_nights:         numNights,

    room_type:            extractRoomType(t),
    num_adults:           extractAdults(t),
    num_children:         numChildren,
    children_ages:        childrenAges,
    num_rooms:            numRooms,

    board_basis:          boardBasis,
    board_basis_label:    boardBasisLabel(boardBasis),
    rate_plan_name:       extractRatePlan(t),

    original_price:       totalPaid,
    total_price_paid:     totalPaid,
    price_per_night:      perNight,
    currency:             extractCurrency(t),
    taxes_included:       true,
    price_breakdown: numNights > 0 ? {
      per_night: perNight,
      per_room:  perNight,
      rooms:     numRooms,
      nights:    numNights,
      taxes:     null,
      total:     totalPaid,
    } : null,

    ota_name:             extractOTA(t),
    booking_reference:    extractBookingRef(t),

    cancellation_policy:   cancelPolicy,
    cancellation_deadline: cancelDeadline,
    cancellation_penalty:  extractCancellationPenalty(t),

    raw_text:              t.substring(0, 500),
    extraction_confidence: 'medium',
  }
}

// ─── Individual extractors ────────────────────────────────────────────────────

function extractHotelName(text) {
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
  const CITIES = [
    'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad',
    'Chennai', 'Kolkata', 'Pune', 'Goa', 'Jaipur', 'Ahmedabad', 'Kochi',
    'Cochin', 'Udaipur', 'Agra', 'Varanasi', 'Amritsar', 'Lucknow',
    'Chandigarh', 'Srinagar', 'Shimla', 'Manali', 'Jodhpur', 'Mysore',
    'Dubai', 'Abu Dhabi', 'Bangkok', 'Singapore', 'Bali', 'Kuala Lumpur',
    'London', 'Paris', 'New York', 'Maldives', 'Mauritius',
  ]
  for (const city of CITIES) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city
  }
  return ''
}

function extractAddress(text) {
  const m = text.match(/address[:\s]+([^\n]{10,100})/i)
  return m?.[1]?.trim() || ''
}

function extractDate(text, type) {
  const checkInPatterns  = [
    /check[\s-]?in[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
    /arrival[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
  ]
  const checkOutPatterns = [
    /check[\s-]?out[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
    /departure[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
  ]
  const patterns = type === 'checkin' ? checkInPatterns : checkOutPatterns
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return parseDate(m[1].trim())
  }
  return ''
}

function parseDate(raw) {
  const months = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }
  const m1 = raw.match(/(\d{1,2})[\s\/\-]([A-Za-z]{3})[\s\/\-](\d{2,4})/i)
  if (m1) {
    const [, d, mon, y] = m1
    const month = months[mon.toLowerCase().substring(0,3)]
    const year  = y.length === 2 ? '20' + y : y
    if (month) return `${year}-${month}-${d.padStart(2,'0')}`
  }
  const m2 = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (m2) {
    const [, d, mo, y] = m2
    const year = y.length === 2 ? '20' + y : y
    return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  return ''
}

// ── Price extractors ──────────────────────────────────────────────────────────

function extractTotalPrice(text) {
  // Prioritise "total" / "grand total" over standalone amounts
  const totalPatterns = [
    /grand\s*total[\s\w]*?[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /total\s*amount[\s\w]*?[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /amount\s*paid[\s\w]*?[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /total[\s\w]{0,10}[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i,
    /₹\s*([0-9,]+(?:\.[0-9]{2})?)/,
    /INR\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    /Rs\.?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
  ]
  for (const p of totalPatterns) {
    const m = text.match(p)
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ''))
      if (price > 500 && price < 10000000) return price
    }
  }
  return 0
}

function extractCurrency(text) {
  if (/₹|INR/i.test(text))  return 'INR'
  if (/€|EUR/i.test(text))  return 'EUR'
  if (/\$|USD/i.test(text)) return 'USD'
  if (/£|GBP/i.test(text))  return 'GBP'
  if (/AED/i.test(text))    return 'AED'
  if (/THB/i.test(text))    return 'THB'
  return 'INR'
}

// ── Room / occupancy ──────────────────────────────────────────────────────────

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

function extractChildren(text) {
  const m = text.match(/(\d+)\s*child(?:ren)?/i)
  return m ? parseInt(m[1]) : 0
}

function extractChildrenAges(text, numChildren) {
  if (numChildren === 0) return []
  // Try to find ages: "children aged 4, 7" or "child (6 years)"
  const agesMatch = text.match(/child(?:ren)?\s*(?:aged?|age)[:\s(]+([0-9,\s&and]+)/i)
  if (agesMatch) {
    const ages = agesMatch[1]
      .split(/[,\s&and]+/)
      .map(a => parseInt(a))
      .filter(a => !isNaN(a) && a >= 0 && a < 18)
    if (ages.length > 0) return ages
  }
  // Ages not found — return nulls as placeholders
  return Array(numChildren).fill(null)
}

function extractRooms(text) {
  const m = text.match(/(\d+)\s*room/i)
  return m ? Math.min(parseInt(m[1]), 5) : 1
}

// ── Board basis ───────────────────────────────────────────────────────────────

function extractBoardType(text) {
  if (/all[\s-]inclusive/i.test(text))          return 'AI'
  if (/full[\s-]board/i.test(text))             return 'FB'
  if (/half[\s-]board/i.test(text))             return 'HB'
  if (/bed\s*and\s*breakfast/i.test(text))      return 'BB'
  if (/breakfast\s*included/i.test(text))       return 'BB'
  if (/with\s*breakfast/i.test(text))           return 'BB'
  if (/room\s*only/i.test(text))                return 'RO'
  if (/no\s*meals/i.test(text))                 return 'RO'
  return 'RO'
}

function boardBasisLabel(code) {
  const map = { RO: 'Room Only', BB: 'Bed & Breakfast', HB: 'Half Board', FB: 'Full Board', AI: 'All Inclusive' }
  return map[code] || 'Room Only'
}

function extractRatePlan(text) {
  const patterns = [
    /rate\s*plan[:\s]+([^\n,]{3,50})/i,
    /room\s*rate[:\s]+([^\n,]{3,50})/i,
    /(early\s*bird|flexible\s*rate|non[\s-]refundable\s*saver|saver\s*rate|advance\s*purchase)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

// ── OTA / booking reference ───────────────────────────────────────────────────

function extractOTA(text) {
  if (/makemytrip/i.test(text))        return 'MakeMyTrip'
  if (/booking\.com/i.test(text))      return 'Booking.com'
  if (/agoda/i.test(text))             return 'Agoda'
  if (/goibibo/i.test(text))           return 'Goibibo'
  if (/expedia/i.test(text))           return 'Expedia'
  if (/hotels\.com/i.test(text))       return 'Hotels.com'
  if (/yatra/i.test(text))             return 'Yatra'
  if (/cleartrip/i.test(text))         return 'Cleartrip'
  if (/ixigo/i.test(text))             return 'Ixigo'
  if (/airbnb/i.test(text))            return 'Airbnb'
  return 'Other'
}

function extractBookingRef(text) {
  const patterns = [
    /booking\s*(?:id|ref(?:erence)?|no\.?|number)[:\s#]+([A-Z0-9]{4,20})/i,
    /confirmation\s*(?:no\.?|number|code)[:\s#]+([A-Z0-9]{4,20})/i,
    /reservation\s*(?:no\.?|id|number)[:\s#]+([A-Z0-9]{4,20})/i,
    /PNR[:\s#]+([A-Z0-9]{4,20})/i,
    /voucher\s*(?:no\.?|number)[:\s#]+([A-Z0-9]{4,20})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

// ── Cancellation ──────────────────────────────────────────────────────────────

function extractCancellationPolicy(text) {
  if (/non[\s-]refundable|no\s*refund|cannot\s*be\s*cancelled|not\s*cancellable/i.test(text)) {
    return 'non-refundable'
  }
  if (/free\s*cancellation|fully\s*refundable|cancel\s*for\s*free/i.test(text)) {
    return 'free'
  }
  if (/partial\s*refund|cancellation\s*fee|cancellation\s*charge/i.test(text)) {
    return 'partial'
  }
  return 'unknown'
}

function extractCancellationDeadline(text) {
  // "Free cancellation until 15 Jun 2026" or "Cancel by 2026-06-15"
  const patterns = [
    /(?:free\s*cancellation|cancel)\s*(?:until|by|before)[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
    /cancellation\s*deadline[:\s]+([0-9]{1,2}[\s\/\-][A-Za-z0-9]+[\s\/\-][0-9]{2,4})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return parseDate(m[1].trim())
  }
  return null
}

function extractCancellationPenalty(text) {
  const m = text.match(/cancellation\s*(?:fee|charge|penalty)[:\s₹Rs.]+([0-9,]+(?:\.[0-9]{2})?)/i)
  if (m?.[1]) {
    const amt = parseFloat(m[1].replace(/,/g, ''))
    if (amt > 0 && amt < 1000000) return amt
  }
  return null
}

function emptyResult(rawText) {
  return {
    hotel_name: '', hotel_city: '', hotel_address: '',
    check_in: '', check_out: '', total_nights: 0,
    room_type: '', num_adults: 2, num_children: 0,
    children_ages: [], num_rooms: 1,
    board_basis: 'RO', board_basis_label: 'Room Only', rate_plan_name: null,
    original_price: 0, total_price_paid: 0, price_per_night: 0,
    currency: 'INR', taxes_included: true, price_breakdown: null,
    ota_name: null, booking_reference: null,
    cancellation_policy: 'unknown', cancellation_deadline: null, cancellation_penalty: null,
    raw_text: (rawText || '').substring(0, 500),
    extraction_confidence: 'low',
  }
}

module.exports = { extractVoucherDetails }
