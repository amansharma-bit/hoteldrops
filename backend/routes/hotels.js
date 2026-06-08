const express = require('express')
const router = express.Router()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const LITE_API_KEY = process.env.LITEAPI_KEY || 'sand_9a1ac97a-74b9-4917-8777-900e559a9e43'
const BASE_URL = 'https://api.liteapi.travel/v3.0'
const USD_TO_INR = 97
const MARKUP = 1.00

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

const COUNTRY_FLAGS = {
  AE:'🇦🇪', IN:'🇮🇳', SG:'🇸🇬', TH:'🇹🇭', ID:'🇮🇩', MY:'🇲🇾', GB:'🇬🇧',
  FR:'🇫🇷', IT:'🇮🇹', ES:'🇪🇸', NL:'🇳🇱', TR:'🇹🇷', MV:'🇲🇻', ZA:'🇿🇦',
  US:'🇺🇸', JP:'🇯🇵', HK:'🇭🇰', KR:'🇰🇷', AU:'🇦🇺', QA:'🇶🇦', OM:'🇴🇲',
  SA:'🇸🇦', VN:'🇻🇳', PH:'🇵🇭', CN:'🇨🇳', EG:'🇪🇬', MA:'🇲🇦',
  DE:'🇩🇪', AT:'🇦🇹', CH:'🇨🇭', PT:'🇵🇹', GR:'🇬🇷', CZ:'🇨🇿', SE:'🇸🇪',
  NO:'🇳🇴', DK:'🇩🇰', FI:'🇫🇮', BE:'🇧🇪', CA:'🇨🇦', NZ:'🇳🇿', LK:'🇱🇰',
  NP:'🇳🇵', MX:'🇲🇽', BR:'🇧🇷', KE:'🇰🇪', BH:'🇧🇭', KW:'🇰🇼', JO:'🇯🇴',
  MU:'🇲🇺', RU:'🇷🇺',
}

const COUNTRY_NAMES = {
  AE: 'United Arab Emirates', IN: 'India', SG: 'Singapore', TH: 'Thailand',
  ID: 'Indonesia', MY: 'Malaysia', GB: 'United Kingdom', FR: 'France',
  IT: 'Italy', ES: 'Spain', NL: 'Netherlands', TR: 'Turkey', MV: 'Maldives',
  ZA: 'South Africa', US: 'United States', JP: 'Japan', HK: 'Hong Kong',
  KR: 'South Korea', AU: 'Australia', QA: 'Qatar', OM: 'Oman', SA: 'Saudi Arabia',
  VN: 'Vietnam', PH: 'Philippines', CN: 'China', EG: 'Egypt', MA: 'Morocco',
  DE: 'Germany', AT: 'Austria', CH: 'Switzerland', PT: 'Portugal', GR: 'Greece',
  CZ: 'Czech Republic', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  BE: 'Belgium', CA: 'Canada', NZ: 'New Zealand', LK: 'Sri Lanka', NP: 'Nepal',
  MX: 'Mexico', BR: 'Brazil', KE: 'Kenya', BH: 'Bahrain', KW: 'Kuwait',
  JO: 'Jordan', MU: 'Mauritius', RU: 'Russia',
}

// ── Static city data: areas, landmarks, airport with lat/long ─────────────────
const CITY_DATA = {
  'dubai': {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    areas: [
      { name: 'Dubai Marina', lat: 25.0800, lng: 55.1404 },
      { name: 'Downtown Dubai', lat: 25.1972, lng: 55.2744 },
      { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390 },
      { name: 'Deira', lat: 25.2697, lng: 55.3095 },
      { name: 'Jumeirah', lat: 25.2048, lng: 55.2708 },
      { name: 'Business Bay', lat: 25.1865, lng: 55.2650 },
    ],
    landmarks: [
      { name: 'Burj Khalifa', lat: 25.1972, lng: 55.2744 },
      { name: 'Atlantis The Palm', lat: 25.1303, lng: 55.1172 },
      { name: 'Burj Al Arab', lat: 25.1412, lng: 55.1853 },
      { name: 'Dubai Mall', lat: 25.1985, lng: 55.2796 },
    ],
    airport: { name: 'Dubai International Airport (DXB)', lat: 25.2532, lng: 55.3657 },
  },
  'new delhi': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
      { name: 'Aerocity', lat: 28.5562, lng: 77.1000 },
      { name: 'Karol Bagh', lat: 28.6514, lng: 77.1907 },
      { name: 'Paharganj', lat: 28.6448, lng: 77.2167 },
      { name: 'South Delhi', lat: 28.5355, lng: 77.2500 },
    ],
    landmarks: [
      { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
      { name: 'Qutub Minar', lat: 28.5244, lng: 77.1855 },
      { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
      { name: 'Lotus Temple', lat: 28.5535, lng: 77.2588 },
    ],
    airport: { name: 'Indira Gandhi International Airport (DEL)', lat: 28.5562, lng: 77.1000 },
  },
  'mumbai': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Bandra', lat: 19.0596, lng: 72.8295 },
      { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
      { name: 'Andheri', lat: 19.1197, lng: 72.8469 },
      { name: 'Juhu', lat: 19.1075, lng: 72.8263 },
      { name: 'Lower Parel', lat: 18.9960, lng: 72.8258 },
    ],
    landmarks: [
      { name: 'Gateway of India', lat: 18.9220, lng: 72.8347 },
      { name: 'Marine Drive', lat: 18.9548, lng: 72.8237 },
      { name: 'Elephanta Caves', lat: 18.9633, lng: 72.9315 },
      { name: 'Siddhivinayak Temple', lat: 19.0169, lng: 72.8305 },
    ],
    airport: { name: 'Chhatrapati Shivaji Maharaj International Airport (BOM)', lat: 19.0896, lng: 72.8656 },
  },
  'goa': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Calangute', lat: 15.5440, lng: 73.7550 },
      { name: 'Baga', lat: 15.5557, lng: 73.7521 },
      { name: 'Anjuna', lat: 15.5740, lng: 73.7404 },
      { name: 'Candolim', lat: 15.5180, lng: 73.7614 },
      { name: 'Panjim', lat: 15.4989, lng: 73.8278 },
      { name: 'South Goa', lat: 15.1728, lng: 74.0173 },
    ],
    landmarks: [
      { name: 'Basilica of Bom Jesus', lat: 15.5009, lng: 73.9116 },
      { name: 'Fort Aguada', lat: 15.4938, lng: 73.7742 },
      { name: 'Dudhsagar Falls', lat: 15.3144, lng: 74.3144 },
    ],
    airport: { name: 'Goa International Airport (GOI)', lat: 15.3808, lng: 73.8314 },
  },
  'bangalore': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'MG Road', lat: 12.9757, lng: 77.6010 },
      { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
      { name: 'Indiranagar', lat: 12.9783, lng: 77.6408 },
      { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
      { name: 'Electronic City', lat: 12.8399, lng: 77.6770 },
    ],
    landmarks: [
      { name: 'Lalbagh Botanical Garden', lat: 12.9507, lng: 77.5848 },
      { name: 'Bangalore Palace', lat: 12.9987, lng: 77.5922 },
      { name: 'Cubbon Park', lat: 12.9763, lng: 77.5929 },
    ],
    airport: { name: 'Kempegowda International Airport (BLR)', lat: 13.1986, lng: 77.7066 },
  },
  'jaipur': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Old City', lat: 26.9238, lng: 75.8267 },
      { name: 'Bani Park', lat: 26.9124, lng: 75.7873 },
      { name: 'Civil Lines', lat: 26.9155, lng: 75.8001 },
      { name: 'Malviya Nagar', lat: 26.8634, lng: 75.8078 },
    ],
    landmarks: [
      { name: 'Hawa Mahal', lat: 26.9239, lng: 75.8267 },
      { name: 'Amber Fort', lat: 26.9855, lng: 75.8513 },
      { name: 'City Palace', lat: 26.9258, lng: 75.8237 },
      { name: 'Jantar Mantar', lat: 26.9247, lng: 75.8245 },
    ],
    airport: { name: 'Jaipur International Airport (JAI)', lat: 26.8242, lng: 75.8122 },
  },
  'singapore': {
    countryCode: 'SG',
    countryName: 'Singapore',
    areas: [
      { name: 'Marina Bay', lat: 1.2789, lng: 103.8536 },
      { name: 'Orchard Road', lat: 1.3048, lng: 103.8318 },
      { name: 'Sentosa', lat: 1.2494, lng: 103.8303 },
      { name: 'Chinatown', lat: 1.2838, lng: 103.8440 },
      { name: 'Clarke Quay', lat: 1.2906, lng: 103.8467 },
    ],
    landmarks: [
      { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607 },
      { name: 'Gardens by the Bay', lat: 1.2816, lng: 103.8636 },
      { name: 'Merlion Park', lat: 1.2868, lng: 103.8545 },
      { name: 'Universal Studios', lat: 1.2540, lng: 103.8238 },
    ],
    airport: { name: 'Changi Airport (SIN)', lat: 1.3644, lng: 103.9915 },
  },
  'bangkok': {
    countryCode: 'TH',
    countryName: 'Thailand',
    areas: [
      { name: 'Sukhumvit', lat: 13.7368, lng: 100.5607 },
      { name: 'Silom', lat: 13.7282, lng: 100.5259 },
      { name: 'Siam', lat: 13.7455, lng: 100.5342 },
      { name: 'Khao San Road', lat: 13.7587, lng: 100.4973 },
      { name: 'Riverside', lat: 13.7213, lng: 100.5093 },
    ],
    landmarks: [
      { name: 'Grand Palace', lat: 13.7500, lng: 100.4927 },
      { name: 'Wat Pho', lat: 13.7465, lng: 100.4927 },
      { name: 'Chatuchak Market', lat: 13.7999, lng: 100.5500 },
    ],
    airport: { name: 'Suvarnabhumi Airport (BKK)', lat: 13.6900, lng: 100.7501 },
  },
  'bali': {
    countryCode: 'ID',
    countryName: 'Indonesia',
    areas: [
      { name: 'Seminyak', lat: -8.6916, lng: 115.1680 },
      { name: 'Kuta', lat: -8.7180, lng: 115.1686 },
      { name: 'Ubud', lat: -8.5069, lng: 115.2625 },
      { name: 'Nusa Dua', lat: -8.7986, lng: 115.2300 },
      { name: 'Uluwatu', lat: -8.8291, lng: 115.0849 },
      { name: 'Canggu', lat: -8.6483, lng: 115.1370 },
    ],
    landmarks: [
      { name: 'Tanah Lot Temple', lat: -8.6215, lng: 115.0868 },
      { name: 'Uluwatu Temple', lat: -8.8291, lng: 115.0849 },
      { name: 'Tegalalang Rice Terrace', lat: -8.4322, lng: 115.2770 },
    ],
    airport: { name: 'Ngurah Rai International Airport (DPS)', lat: -8.7482, lng: 115.1671 },
  },
  'london': {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    areas: [
      { name: 'Mayfair', lat: 51.5099, lng: -0.1477 },
      { name: 'Covent Garden', lat: 51.5117, lng: -0.1240 },
      { name: 'Canary Wharf', lat: 51.5054, lng: -0.0235 },
      { name: 'Kensington', lat: 51.5020, lng: -0.1947 },
      { name: 'Shoreditch', lat: 51.5234, lng: -0.0780 },
    ],
    landmarks: [
      { name: 'Tower of London', lat: 51.5081, lng: -0.0759 },
      { name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419 },
      { name: 'Big Ben', lat: 51.5007, lng: -0.1246 },
      { name: 'London Eye', lat: 51.5033, lng: -0.1195 },
    ],
    airport: { name: 'Heathrow Airport (LHR)', lat: 51.4700, lng: -0.4543 },
  },
  'paris': {
    countryCode: 'FR',
    countryName: 'France',
    areas: [
      { name: 'Champs-Élysées', lat: 48.8698, lng: 2.3078 },
      { name: 'Le Marais', lat: 48.8573, lng: 2.3564 },
      { name: 'Montmartre', lat: 48.8867, lng: 2.3431 },
      { name: 'Saint-Germain', lat: 48.8534, lng: 2.3349 },
      { name: 'Opéra', lat: 48.8718, lng: 2.3316 },
    ],
    landmarks: [
      { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
      { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376 },
      { name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499 },
      { name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950 },
    ],
    airport: { name: 'Charles de Gaulle Airport (CDG)', lat: 49.0097, lng: 2.5479 },
  },
  'rome': {
    countryCode: 'IT',
    countryName: 'Italy',
    areas: [
      { name: 'Trastevere', lat: 41.8891, lng: 12.4669 },
      { name: 'Prati', lat: 41.9028, lng: 12.4586 },
      { name: 'Parioli', lat: 41.9252, lng: 12.5119 },
      { name: 'Testaccio', lat: 41.8788, lng: 12.4779 },
    ],
    landmarks: [
      { name: 'Colosseum', lat: 41.8902, lng: 12.4922 },
      { name: 'Vatican City', lat: 41.9022, lng: 12.4539 },
      { name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833 },
      { name: 'Pantheon', lat: 41.8986, lng: 12.4769 },
    ],
    airport: { name: 'Leonardo da Vinci Airport (FCO)', lat: 41.8003, lng: 12.2389 },
  },
  'barcelona': {
    countryCode: 'ES',
    countryName: 'Spain',
    areas: [
      { name: 'Gothic Quarter', lat: 41.3833, lng: 2.1777 },
      { name: 'Eixample', lat: 41.3929, lng: 2.1649 },
      { name: 'Barceloneta', lat: 41.3794, lng: 2.1896 },
      { name: 'Gracia', lat: 41.4033, lng: 2.1571 },
    ],
    landmarks: [
      { name: 'Sagrada Família', lat: 41.4036, lng: 2.1744 },
      { name: 'Park Güell', lat: 41.4145, lng: 2.1527 },
      { name: 'Camp Nou', lat: 41.3809, lng: 2.1228 },
    ],
    airport: { name: 'Barcelona El Prat Airport (BCN)', lat: 41.2974, lng: 2.0833 },
  },
  'istanbul': {
    countryCode: 'TR',
    countryName: 'Turkey',
    areas: [
      { name: 'Sultanahmet', lat: 41.0054, lng: 28.9768 },
      { name: 'Taksim', lat: 41.0369, lng: 28.9850 },
      { name: 'Besiktas', lat: 41.0436, lng: 29.0044 },
      { name: 'Kadikoy', lat: 40.9906, lng: 29.0239 },
    ],
    landmarks: [
      { name: 'Hagia Sophia', lat: 41.0086, lng: 28.9802 },
      { name: 'Blue Mosque', lat: 41.0054, lng: 28.9768 },
      { name: 'Grand Bazaar', lat: 41.0107, lng: 28.9682 },
      { name: 'Topkapi Palace', lat: 41.0115, lng: 28.9833 },
    ],
    airport: { name: 'Istanbul Airport (IST)', lat: 41.2608, lng: 28.7418 },
  },
  'tokyo': {
    countryCode: 'JP',
    countryName: 'Japan',
    areas: [
      { name: 'Shinjuku', lat: 35.6938, lng: 139.7034 },
      { name: 'Shibuya', lat: 35.6580, lng: 139.7016 },
      { name: 'Ginza', lat: 35.6717, lng: 139.7652 },
      { name: 'Asakusa', lat: 35.7147, lng: 139.7967 },
      { name: 'Roppongi', lat: 35.6641, lng: 139.7322 },
    ],
    landmarks: [
      { name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967 },
      { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 },
      { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004 },
      { name: 'Tokyo Skytree', lat: 35.7101, lng: 139.8107 },
    ],
    airport: { name: 'Narita International Airport (NRT)', lat: 35.7720, lng: 140.3929 },
  },
  'sydney': {
    countryCode: 'AU',
    countryName: 'Australia',
    areas: [
      { name: 'CBD', lat: -33.8688, lng: 151.2093 },
      { name: 'Darling Harbour', lat: -33.8748, lng: 151.1987 },
      { name: 'Bondi Beach', lat: -33.8908, lng: 151.2743 },
      { name: 'Surry Hills', lat: -33.8882, lng: 151.2110 },
    ],
    landmarks: [
      { name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153 },
      { name: 'Sydney Harbour Bridge', lat: -33.8523, lng: 151.2108 },
      { name: 'Bondi Beach', lat: -33.8908, lng: 151.2743 },
    ],
    airport: { name: 'Sydney Kingsford Smith Airport (SYD)', lat: -33.9399, lng: 151.1753 },
  },
  'kuala lumpur': {
    countryCode: 'MY',
    countryName: 'Malaysia',
    areas: [
      { name: 'KLCC', lat: 3.1570, lng: 101.7123 },
      { name: 'Bukit Bintang', lat: 3.1466, lng: 101.7127 },
      { name: 'Chinatown', lat: 3.1449, lng: 101.6962 },
      { name: 'Mont Kiara', lat: 3.1722, lng: 101.6525 },
    ],
    landmarks: [
      { name: 'Petronas Twin Towers', lat: 3.1579, lng: 101.7116 },
      { name: 'Batu Caves', lat: 3.2379, lng: 101.6840 },
      { name: 'KL Tower', lat: 3.1530, lng: 101.7037 },
    ],
    airport: { name: 'Kuala Lumpur International Airport (KUL)', lat: 2.7456, lng: 101.7099 },
  },
  'phuket': {
    countryCode: 'TH',
    countryName: 'Thailand',
    areas: [
      { name: 'Patong', lat: 7.8960, lng: 98.2975 },
      { name: 'Kata', lat: 7.8204, lng: 98.2993 },
      { name: 'Karon', lat: 7.8484, lng: 98.2958 },
      { name: 'Surin', lat: 7.9755, lng: 98.2897 },
      { name: 'Rawai', lat: 7.7817, lng: 98.3271 },
    ],
    landmarks: [
      { name: 'Big Buddha', lat: 7.8274, lng: 98.3089 },
      { name: 'Phang Nga Bay', lat: 8.2733, lng: 98.5124 },
      { name: 'Old Phuket Town', lat: 7.8846, lng: 98.3936 },
    ],
    airport: { name: 'Phuket International Airport (HKT)', lat: 8.1132, lng: 98.3162 },
  },
  'doha': {
    countryCode: 'QA',
    countryName: 'Qatar',
    areas: [
      { name: 'West Bay', lat: 25.3266, lng: 51.5310 },
      { name: 'The Pearl', lat: 25.3716, lng: 51.5498 },
      { name: 'Katara', lat: 25.3563, lng: 51.5361 },
      { name: 'Souq Waqif', lat: 25.2867, lng: 51.5308 },
    ],
    landmarks: [
      { name: 'Museum of Islamic Art', lat: 25.2948, lng: 51.5381 },
      { name: 'Aspire Tower', lat: 25.2637, lng: 51.4453 },
      { name: 'Souq Waqif', lat: 25.2867, lng: 51.5308 },
    ],
    airport: { name: 'Hamad International Airport (DOH)', lat: 25.2609, lng: 51.6138 },
  },
  'abu dhabi': {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    areas: [
      { name: 'Corniche', lat: 24.4653, lng: 54.3476 },
      { name: 'Yas Island', lat: 24.4961, lng: 54.6089 },
      { name: 'Saadiyat Island', lat: 24.5429, lng: 54.4396 },
      { name: 'Al Reem Island', lat: 24.4952, lng: 54.3960 },
    ],
    landmarks: [
      { name: 'Sheikh Zayed Grand Mosque', lat: 24.4128, lng: 54.4751 },
      { name: 'Louvre Abu Dhabi', lat: 24.5338, lng: 54.3983 },
      { name: 'Ferrari World', lat: 24.4837, lng: 54.6061 },
    ],
    airport: { name: 'Abu Dhabi International Airport (AUH)', lat: 24.4330, lng: 54.6511 },
  },
  'maldives': {
    countryCode: 'MV',
    countryName: 'Maldives',
    areas: [
      { name: 'North Malé Atoll', lat: 4.4025, lng: 73.5000 },
      { name: 'South Malé Atoll', lat: 3.8500, lng: 73.4000 },
      { name: 'Baa Atoll', lat: 5.0000, lng: 73.0000 },
      { name: 'Ari Atoll', lat: 3.8667, lng: 72.8333 },
    ],
    landmarks: [
      { name: 'Malé Fish Market', lat: 4.1748, lng: 73.5089 },
      { name: 'Banana Reef', lat: 4.2167, lng: 73.5500 },
    ],
    airport: { name: 'Velana International Airport (MLE)', lat: 4.1918, lng: 73.5290 },
  },
  'hong kong': {
    countryCode: 'HK',
    countryName: 'Hong Kong',
    areas: [
      { name: 'Tsim Sha Tsui', lat: 22.2988, lng: 114.1722 },
      { name: 'Causeway Bay', lat: 22.2803, lng: 114.1839 },
      { name: 'Central', lat: 22.2822, lng: 114.1581 },
      { name: 'Mong Kok', lat: 22.3193, lng: 114.1694 },
    ],
    landmarks: [
      { name: 'Victoria Peak', lat: 22.2759, lng: 114.1455 },
      { name: 'Temple Street Night Market', lat: 22.3060, lng: 114.1695 },
      { name: 'Disneyland Hong Kong', lat: 22.3130, lng: 114.0413 },
    ],
    airport: { name: 'Hong Kong International Airport (HKG)', lat: 22.3080, lng: 113.9185 },
  },
  'seoul': {
    countryCode: 'KR',
    countryName: 'South Korea',
    areas: [
      { name: 'Gangnam', lat: 37.5172, lng: 127.0473 },
      { name: 'Myeongdong', lat: 37.5636, lng: 126.9829 },
      { name: 'Itaewon', lat: 37.5345, lng: 126.9940 },
      { name: 'Hongdae', lat: 37.5574, lng: 126.9243 },
    ],
    landmarks: [
      { name: 'Gyeongbokgung Palace', lat: 37.5796, lng: 126.9770 },
      { name: 'N Seoul Tower', lat: 37.5512, lng: 126.9882 },
      { name: 'Bukchon Hanok Village', lat: 37.5815, lng: 126.9839 },
    ],
    airport: { name: 'Incheon International Airport (ICN)', lat: 37.4602, lng: 126.4407 },
  },
  'amsterdam': {
    countryCode: 'NL',
    countryName: 'Netherlands',
    areas: [
      { name: 'Canal Ring', lat: 52.3702, lng: 4.8952 },
      { name: 'De Pijp', lat: 52.3534, lng: 4.8978 },
      { name: 'Jordaan', lat: 52.3764, lng: 4.8828 },
      { name: 'Museum Quarter', lat: 52.3575, lng: 4.8807 },
    ],
    landmarks: [
      { name: 'Anne Frank House', lat: 52.3752, lng: 4.8840 },
      { name: 'Rijksmuseum', lat: 52.3600, lng: 4.8852 },
      { name: 'Van Gogh Museum', lat: 52.3584, lng: 4.8811 },
    ],
    airport: { name: 'Amsterdam Schiphol Airport (AMS)', lat: 52.3105, lng: 4.7683 },
  },
  'cairo': {
    countryCode: 'EG',
    countryName: 'Egypt',
    areas: [
      { name: 'Zamalek', lat: 30.0626, lng: 31.2197 },
      { name: 'Downtown', lat: 30.0444, lng: 31.2357 },
      { name: 'New Cairo', lat: 30.0131, lng: 31.4961 },
      { name: 'Maadi', lat: 29.9602, lng: 31.2569 },
    ],
    landmarks: [
      { name: 'Pyramids of Giza', lat: 29.9792, lng: 31.1342 },
      { name: 'Egyptian Museum', lat: 30.0478, lng: 31.2336 },
      { name: 'Khan el-Khalili', lat: 30.0482, lng: 31.2624 },
    ],
    airport: { name: 'Cairo International Airport (CAI)', lat: 30.1219, lng: 31.4056 },
  },
  'muscat': {
    countryCode: 'OM',
    countryName: 'Oman',
    areas: [
      { name: 'Muttrah', lat: 23.6207, lng: 58.5922 },
      { name: 'Qurum', lat: 23.5957, lng: 58.5070 },
      { name: 'Al Khuwair', lat: 23.6033, lng: 58.4833 },
    ],
    landmarks: [
      { name: 'Sultan Qaboos Grand Mosque', lat: 23.6086, lng: 58.4388 },
      { name: 'Muttrah Souq', lat: 23.6207, lng: 58.5922 },
      { name: 'Royal Opera House', lat: 23.5986, lng: 58.5038 },
    ],
    airport: { name: 'Muscat International Airport (MCT)', lat: 23.5933, lng: 58.2844 },
  },
  'riyadh': {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    areas: [
      { name: 'Al Olaya', lat: 24.6877, lng: 46.6884 },
      { name: 'Diplomatic Quarter', lat: 24.6918, lng: 46.6166 },
      { name: 'Al Malaz', lat: 24.6697, lng: 46.7328 },
    ],
    landmarks: [
      { name: 'Kingdom Centre Tower', lat: 24.7136, lng: 46.6753 },
      { name: 'Masmak Fortress', lat: 24.6877, lng: 46.7147 },
      { name: 'Diriyah', lat: 24.7345, lng: 46.5717 },
    ],
    airport: { name: 'King Khalid International Airport (RUH)', lat: 24.9576, lng: 46.6988 },
  },
  'kochi': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Fort Kochi', lat: 9.9658, lng: 76.2421 },
      { name: 'Marine Drive', lat: 9.9667, lng: 76.2832 },
      { name: 'Ernakulam', lat: 9.9816, lng: 76.2999 },
    ],
    landmarks: [
      { name: 'Chinese Fishing Nets', lat: 9.9674, lng: 76.2400 },
      { name: 'Mattancherry Palace', lat: 9.9578, lng: 76.2587 },
    ],
    airport: { name: 'Cochin International Airport (COK)', lat: 10.1520, lng: 76.4019 },
  },
  'agra': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Taj Ganj', lat: 27.1724, lng: 78.0421 },
      { name: 'Sadar Bazaar', lat: 27.1767, lng: 78.0081 },
    ],
    landmarks: [
      { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421 },
      { name: 'Agra Fort', lat: 27.1795, lng: 78.0211 },
      { name: 'Fatehpur Sikri', lat: 27.0945, lng: 77.6608 },
    ],
    airport: { name: 'Agra Airport (AGR)', lat: 27.1558, lng: 77.9609 },
  },
  'hyderabad': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Banjara Hills', lat: 17.4156, lng: 78.4347 },
      { name: 'HITEC City', lat: 17.4435, lng: 78.3772 },
      { name: 'Jubilee Hills', lat: 17.4328, lng: 78.4071 },
      { name: 'Old City', lat: 17.3616, lng: 78.4747 },
    ],
    landmarks: [
      { name: 'Charminar', lat: 17.3616, lng: 78.4747 },
      { name: 'Golconda Fort', lat: 17.3833, lng: 78.4011 },
      { name: 'Hussain Sagar Lake', lat: 17.4239, lng: 78.4738 },
    ],
    airport: { name: 'Rajiv Gandhi International Airport (HYD)', lat: 17.2403, lng: 78.4294 },
  },
  'chennai': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101 },
      { name: 'T Nagar', lat: 13.0418, lng: 80.2341 },
      { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
      { name: 'Egmore', lat: 13.0732, lng: 80.2609 },
    ],
    landmarks: [
      { name: 'Marina Beach', lat: 13.0569, lng: 80.2810 },
      { name: 'Kapaleeshwarar Temple', lat: 13.0338, lng: 80.2699 },
    ],
    airport: { name: 'Chennai International Airport (MAA)', lat: 12.9941, lng: 80.1709 },
  },
  'kolkata': {
    countryCode: 'IN',
    countryName: 'India',
    areas: [
      { name: 'Park Street', lat: 22.5513, lng: 88.3551 },
      { name: 'Salt Lake', lat: 22.5784, lng: 88.4182 },
      { name: 'New Town', lat: 22.5815, lng: 88.4740 },
      { name: 'Howrah', lat: 22.5958, lng: 88.2636 },
    ],
    landmarks: [
      { name: 'Victoria Memorial', lat: 22.5448, lng: 88.3426 },
      { name: 'Howrah Bridge', lat: 22.5850, lng: 88.3468 },
      { name: 'Dakshineswar Temple', lat: 22.6550, lng: 88.3578 },
    ],
    airport: { name: 'Netaji Subhas Chandra Bose Airport (CCU)', lat: 22.6520, lng: 88.4463 },
  },
}

const HOTEL_CITIES = [
  { city: 'Dubai', country: 'AE' },
  { city: 'Mumbai', country: 'IN' },
  { city: 'New Delhi', country: 'IN' },
  { city: 'Goa', country: 'IN' },
  { city: 'Bangalore', country: 'IN' },
  { city: 'Jaipur', country: 'IN' },
  { city: 'Singapore', country: 'SG' },
  { city: 'Bangkok', country: 'TH' },
  { city: 'Bali', country: 'ID' },
  { city: 'London', country: 'GB' },
  { city: 'Paris', country: 'FR' },
  { city: 'Rome', country: 'IT' },
  { city: 'Istanbul', country: 'TR' },
  { city: 'Doha', country: 'QA' },
  { city: 'Abu Dhabi', country: 'AE' },
  { city: 'Phuket', country: 'TH' },
  { city: 'Kuala Lumpur', country: 'MY' },
  { city: 'Tokyo', country: 'JP' },
  { city: 'Sydney', country: 'AU' },
  { city: 'Maldives', country: 'MV' },
  { city: 'Barcelona', country: 'ES' },
]

let HOTEL_CACHE = []

async function buildHotelIndex() {
  console.log('📦 Building hotel index...')
  const allHotels = []
  for (const { city, country } of HOTEL_CITIES) {
    try {
      const resp = await axios.get(`${BASE_URL}/data/hotels?countryCode=${country}&cityName=${encodeURIComponent(city)}&limit=1000`, {
        headers: getHeaders(), timeout: 10000, validateStatus: () => true,
      })
      if (resp.status === 200 && resp.data?.data) {
        resp.data.data.forEach(h => {
          if (h.name && h.id) allHotels.push({
            type: 'hotel',
            name: h.name,
            city: h.city || city,
            country: h.country || country,
            countryCode: h.countryCode || country,
            hotelId: h.id,
            flag: COUNTRY_FLAGS[h.countryCode || country] || '🏨',
          })
        })
      }
      await sleep(200)
    } catch (e) { console.log(`⚠️ Hotels ${city}: ${e.message}`) }
  }
  HOTEL_CACHE = allHotels
  console.log(`✅ Hotel index ready: ${HOTEL_CACHE.length} hotels`)
}

setTimeout(buildHotelIndex, 2000)

function buildOccupancies(rooms, adults, children) {
  const r = parseInt(rooms) || 1
  const a = parseInt(adults) || 2
  const c = parseInt(children) || 0
  const childAges = c > 0 ? Array(c).fill(5) : []
  return [{ rooms: r, adults: a, children: childAges }]
}

function parseRoomName(rawName) {
  if (!rawName) return { displayName: 'Room', sizeM2: null, parsedAmenities: [] }
  const parts = rawName.split(',')
  const displayName = parts[0].trim().toLowerCase().replace(/\w/g, l => l.toUpperCase())
  const sizeMatch = rawName.match(/(\d+)\s*SQM/i)
  const sizeM2 = sizeMatch ? parseInt(sizeMatch[1]) : null
  const amenityTokens = parts.slice(1).join('/').split(/[,\/]/)
  const AMENITY_MAP = {
    'wifi': 'Free WiFi', 'wi-fi': 'Free WiFi', 'espresso': 'Espresso Machine',
    'coffee': 'Coffee Maker', 'tea kettle': 'Tea Kettle', 'kettle': 'Electric Kettle',
    'minibar': 'Minibar', 'mini bar': 'Minibar', 'hdtv': 'HD TV', 'tv': 'Flat-screen TV',
    'usb port': 'USB Ports', 'usb': 'USB Ports', 'iron': 'Iron & Board',
    'balcony': 'Balcony', 'terrace': 'Terrace', 'bathtub': 'Bathtub', 'shower': 'Shower',
    'safe': 'In-room Safe', 'air condition': 'Air Conditioning', 'a/c': 'Air Conditioning',
    'breakfast': 'Breakfast Included', 'ocean view': 'Ocean View', 'sea view': 'Sea View',
    'city view': 'City View', 'pool view': 'Pool View', 'king bed': 'King Bed',
    'queen bed': 'Queen Bed', 'twin bed': 'Twin Beds', 'double bed': 'Double Bed',
    'sofa bed': 'Sofa Bed', 'kitchen': 'Kitchen', 'kitchenette': 'Kitchenette',
    'desk': 'Work Desk',
  }
  const parsedAmenities = []
  const seen = new Set()
  for (const token of amenityTokens) {
    const t = token.trim().toLowerCase()
    if (!t || t.match(/^\d+\s*sqm$/i)) continue
    for (const [key, label] of Object.entries(AMENITY_MAP)) {
      if (t.includes(key) && !seen.has(label)) { seen.add(label); parsedAmenities.push(label) }
    }
  }
  return { displayName, sizeM2, parsedAmenities }
}

async function enrichWithCoords(hotels) {
  if (!hotels.length) return hotels
  const ids = hotels.map(h => String(h.code))
  const { data: rows, error } = await supabase
    .from('hotels_cache')
    .select('hotel_id, latitude, longitude, amenities, star_rating')
    .in('hotel_id', ids)
  if (error) console.warn('⚠️ Supabase read error:', error.message)
  const cached = {}
  for (const row of (rows || [])) cached[row.hotel_id] = row
  const missing = hotels.filter(h => !cached[String(h.code)])
  if (missing.length > 0) {
    const toUpsert = []
    for (const hotel of missing) {
      try {
        await sleep(200)
        const r = await axios.get(`${BASE_URL}/data/hotel?hotelId=${hotel.code}`, {
          headers: getHeaders(), timeout: 8000, validateStatus: () => true
        })
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
        cached[String(hotel.code)] = { hotel_id: String(hotel.code), latitude: null, longitude: null, amenities: [] }
      }
    }
    if (toUpsert.length) {
      await supabase.from('hotels_cache').upsert(toUpsert, { onConflict: 'hotel_id' })
    }
  }
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

function getPlaceType(place) {
  const types = (place.types || place.type || [])
  const t = Array.isArray(types) ? types.join(' ') : String(types || '')
  const name = (place.name || place.displayName || '').toLowerCase()
  if (/airport|airfield/.test(t) || /airport/.test(name)) return 'airport'
  if (/train_station|railway_station|transit_station|subway_station|bus_station|light_rail/.test(t) || /station|centralstation|central station/.test(name)) return 'station'
  if (/lodging/.test(t)) return 'hotel'
  if (/neighborhood|sublocality|district|premise|point_of_interest/.test(t)) return 'area'
  return 'city'
}

// ── GET /api/hotels/suggest?q= ────────────────────────────────────────────────
router.get('/suggest', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ cities: [], hotels: [], areas: [], landmarks: [], airport: null })

  const query = q.toLowerCase().trim()

  // 1. Check static CITY_DATA first — instant, no API call needed
  const cityKey = Object.keys(CITY_DATA).find(k => k === query || k.startsWith(query) || query.startsWith(k))
  const staticData = cityKey ? CITY_DATA[cityKey] : null

  // 2. City suggestions from liteAPI /data/places
  let cities = []
  try {
    const resp = await axios.get(`${BASE_URL}/data/places?textQuery=${encodeURIComponent(q)}`, {
      headers: getHeaders(), timeout: 5000, validateStatus: () => true,
    })
    if (resp.status === 200 && resp.data?.data) {
      cities = resp.data.data.slice(0, 5).map(place => {
        const countryCode = place.countryCode || place.country_code || ''
        const countryName = place.countryName || place.country || COUNTRY_NAMES[countryCode] || countryCode || ''
        return {
          type: 'city',
          name: place.name || place.displayName || q,
          subtext: countryName,
          placeId: place.placeId || place.place_id,
          countryCode,
          flag: COUNTRY_FLAGS[countryCode] || '🌍',
          placeType: getPlaceType(place),
        }
      }).filter(c => c.placeId)
    }
  } catch (e) {
    console.warn(`⚠️ /data/places error: ${e.message}`)
  }

  // 3. Hotel suggestions from cache
  const hotels = HOTEL_CACHE
    .filter(h => h.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aStart = a.name.toLowerCase().startsWith(query)
      const bStart = b.name.toLowerCase().startsWith(query)
      if (aStart && !bStart) return -1
      if (!aStart && bStart) return 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, 5)
    .map(h => ({
      type: 'hotel',
      name: h.name,
      subtext: `${h.city}, ${COUNTRY_NAMES[h.countryCode] || h.country}`,
      placeType: 'hotel',
      hotelId: h.hotelId,
    }))

  // 4. Return static areas/landmarks/airport if we have them
  const areas = staticData ? staticData.areas.map(a => ({ ...a, type: 'area', placeType: 'area' })) : []
  const landmarks = staticData ? staticData.landmarks.map(l => ({ ...l, type: 'landmark', placeType: 'landmark' })) : []
  const airport = staticData ? { ...staticData.airport, type: 'airport', placeType: 'airport' } : null

  console.log(`🔎 Suggest "${q}": ${cities.length} cities, ${hotels.length} hotels, ${areas.length} areas, ${landmarks.length} landmarks`)
  return res.json({ cities, hotels, areas, landmarks, airport, total: cities.length + hotels.length })
})

// ── GET /api/hotels/search ────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const {
      destination, checkIn, checkOut,
      adults = '2', children = '0', rooms = '1',
      placeId,
      hotelId,
    } = req.query

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut are required' })
    }

    const cacheKey = `s:${placeId || hotelId || destination}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}`
    const hit = memGet(cacheKey)
    if (hit) return res.json({ hotels: { hotels: hit, total: hit.length, checkIn, checkOut } })

    const body = {
      checkin: checkIn,
      checkout: checkOut,
      currency: 'USD',
      guestNationality: 'IN',
      occupancies: buildOccupancies(rooms, adults, children),
      limit: 50,
      maxRatesPerHotel: 1,
      includeHotelData: true,
      timeout: 8,
    }

    if (hotelId) {
      body.hotelIds = [hotelId]
      body.limit = 1
    } else if (placeId) {
      body.placeId = placeId
    } else if (destination) {
      return res.status(400).json({ error: 'Please select a destination from the dropdown' })
    } else {
      return res.status(400).json({ error: 'destination, placeId, or hotelId required' })
    }

    const resp = await axios.post(`${BASE_URL}/hotels/rates`, body, {
      headers: getHeaders(), timeout: 30000, validateStatus: () => true,
    })

    if (resp.status !== 200) {
      return res.status(502).json({ error: `liteAPI returned ${resp.status}`, detail: resp.data })
    }

    const ratesList = resp.data.data || []
    const hotelMeta = {}
    for (const h of (resp.data.hotels || [])) hotelMeta[h.id] = h

    let hotels = ratesList.map(h => {
      const meta = hotelMeta[h.hotelId] || {}
      const firstRT = h.roomTypes?.[0]
      const firstRate = firstRT?.rates?.[0]
      if (!firstRate) return null
      const taxes = firstRate?.taxesAndFees || []
      const hasPayAtHotel = Array.isArray(taxes) && taxes.some(t => t.included === false)
      if (hasPayAtHotel) return null
      const netUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || firstRate?.net || 0)
      if (!netUSD) return null
      const rebuqPriceINR = Math.round(netUSD * USD_TO_INR * MARKUP)
      const retailUSD = parseFloat(firstRate?.retailRate?.total?.[0]?.amount || 0)
      const otaPriceINR = retailUSD ? Math.round(retailUSD * USD_TO_INR) : 0
      const memberSaving = otaPriceINR > rebuqPriceINR ? otaPriceINR - rebuqPriceINR : 0
      const refTag = firstRate?.cancellationPolicies?.refundableTag || null
      const boardType = firstRate?.boardType || firstRate?.boardCode || 'RO'
      return {
        code: h.hotelId,
        name: meta.name || 'Hotel',
        city: meta.city || destination || '',
        stars: meta.stars || (meta.starRating ? Math.round(parseFloat(meta.starRating)) : null),
        minRate: rebuqPriceINR,
        lowestPriceINR: rebuqPriceINR,
        otaPriceINR,
        memberSaving,
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
        taxesIncluded: true,
        amenities: [],
        roomTypes: h.roomTypes || [],
      }
    }).filter(Boolean)

    hotels = await enrichWithCoords(hotels)
    memSet(cacheKey, hotels)
    return res.json({ hotels: { hotels, total: hotels.length, checkIn, checkOut } })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/hotels/:code ─────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { checkIn, checkOut, adults = '2', children = '0', rooms = '1' } = req.query
    if (!checkIn || !checkOut) return res.status(400).json({ error: 'checkIn and checkOut required' })
    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))

    const [contentResp, ratesResp, reviewsResp, roomsResp] = await Promise.all([
      axios.get(`${BASE_URL}/data/hotel?hotelId=${code}`, { headers: getHeaders(), timeout: 12000, validateStatus: () => true }),
      axios.post(`${BASE_URL}/hotels/rates`, { checkin: checkIn, checkout: checkOut, currency: 'USD', guestNationality: 'IN', hotelIds: [code], occupancies: buildOccupancies(rooms, adults, children), includeHotelData: false, roomMapping: true }, { headers: getHeaders(), timeout: 30000, validateStatus: () => true }),
      axios.get(`${BASE_URL}/data/reviews?hotelId=${code}&timeout=4&getSentiment=true`, { headers: getHeaders(), timeout: 6000, validateStatus: () => true }),
      axios.get(`${BASE_URL}/data/rooms?hotelId=${code}`, { headers: getHeaders(), timeout: 10000, validateStatus: () => true }),
    ])

    const d = contentResp.data?.data
    if (!d) return res.status(404).json({ error: 'Hotel not found' })

    const images = (d.hotelImages || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(img => ({ url: img.url, caption: img.caption || 'Hotel' }))
    const roomsData = (roomsResp?.status === 200 && roomsResp?.data?.data) ? roomsResp.data.data : (d.rooms || [])

    const staticRooms = {}
    for (const sr of roomsData) {
      const roomData = {
        description: sr.description || '',
        sizeM2: sr.roomSizeSquare || null,
        bedTypes: (sr.bedTypes || []).map(b => [b.quantity > 1 ? b.quantity + ' ' : '', b.bedType || '', b.bedSize ? ' (' + b.bedSize + ')' : ''].join('')).filter(Boolean),
        amenities: (sr.roomAmenities || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).slice(0, 8),
        photos: (sr.photos || []).sort((a,b) => (b.score||0)-(a.score||0)).map(p => p.url || p.failoverPhoto).filter(p => p && p.startsWith('http')).slice(0, 5),
      }
      const roomId = sr.id || sr.roomId
      if (roomId !== undefined && roomId !== null) { staticRooms[roomId] = roomData; staticRooms[String(roomId)] = roomData; staticRooms[Number(roomId)] = roomData }
      if (sr.name) { staticRooms[sr.name.toLowerCase().trim()] = roomData; staticRooms[sr.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData }
      if (sr.roomName) { staticRooms[sr.roomName.toLowerCase().trim()] = roomData; staticRooms[sr.roomName.toLowerCase().replace(/[^a-z0-9]/g, '')] = roomData }
    }

    const allFacilities = (d.hotelFacilities || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean)
    const facilityGroups = { Access: [], 'Activities & Sports': [], 'Services & Conveniences': [], 'Safety & Security': [], 'Room Amenities': [], 'Safety & Cleanliness': [] }
    for (const f of allFacilities) {
      const fl = f.toLowerCase()
      if (/front desk|check.in|check.out|concierge|lobby|reception/.test(fl)) facilityGroups['Access'].push(f)
      else if (/pool|gym|fitness|sport|tennis|golf|spa|sauna|massage|wellness|aqua/.test(fl)) facilityGroups['Activities & Sports'].push(f)
      else if (/restaurant|bar|breakfast|dining|cafe|room service|laundry|dry.clean|currency|luggage|parking|airport|shuttle|wifi|internet|business/.test(fl)) facilityGroups['Services & Conveniences'].push(f)
      else if (/security|cctv|fire|smoke|safe|safety/.test(fl)) facilityGroups['Safety & Security'].push(f)
      else if (/clean|sanitiz|hygiene|disinfect/.test(fl)) facilityGroups['Safety & Cleanliness'].push(f)
      else facilityGroups['Room Amenities'].push(f)
    }

    const popularFacilityKeywords = [
      { key: /pool|swimming/i, label: 'Swimming Pool' }, { key: /wifi|internet/i, label: 'Free WiFi' },
      { key: /breakfast/i, label: 'Breakfast' }, { key: /room service/i, label: '24/7 Room Service' },
      { key: /fitness|gym/i, label: 'Fitness Centre' }, { key: /spa|massage/i, label: 'Spa & Wellness' },
      { key: /parking/i, label: 'Parking' }, { key: /airport|transfer/i, label: 'Airport Transfer' },
      { key: /restaurant/i, label: 'Restaurant' }, { key: /bar/i, label: 'Bar' },
    ]
    const popularFacilities = popularFacilityKeywords.filter(pk => allFacilities.some(f => pk.key.test(f))).map(pk => pk.label).slice(0, 8)

    let roomList = []
    if (ratesResp.status === 200) {
      const hotelData = (ratesResp.data?.data || [])[0]
      roomList = (hotelData?.roomTypes || []).map(rt => {
        const rate = rt.rates?.[0]
        if (!rate) return null
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
        const mappedId = rt.mappedRoomId || rt.roomId || null
        const roomName = (rate?.name || rt.name || '').toLowerCase().trim()
        const normName = roomName.replace(/[^a-z0-9]/g, '')
        const staticRoom = (mappedId !== null && staticRooms[mappedId] !== undefined) ? staticRooms[mappedId]
          : (mappedId !== null && staticRooms[String(mappedId)] !== undefined) ? staticRooms[String(mappedId)]
          : (roomName && staticRooms[roomName]) ? staticRooms[roomName]
          : (normName && staticRooms[normName]) ? staticRooms[normName]
          : (() => { const keys = Object.keys(staticRooms); const match = keys.find(k => normName.length > 4 && (k.includes(normName.slice(0,6)) || normName.includes(k.replace(/[^a-z0-9]/g,'').slice(0,6)))); return match ? staticRooms[match] : {} })()
        const roomPhotos = staticRoom.photos?.length ? staticRoom.photos.slice(0, 5) : images.slice(0, 3).map(i => i.url)
        const rawName = rate?.name || rt.name || 'Room'
        const parsed = parseRoomName(rawName)
        return {
          offerId: rt.offerId, mappedRoomId: mappedId, rawName,
          name: parsed.displayName, description: staticRoom.description || '',
          boardCode: boardType, boardName: rate?.boardName || (boardType === 'RO' ? 'Room Only' : 'Breakfast Included'),
          hasBreakfast: !['RO', 'Room Only'].includes(boardType),
          maxOccupancy: rate?.maxOccupancy || parseInt(adults),
          sizeM2: staticRoom.sizeM2 || parsed.sizeM2,
          bedTypes: staticRoom.bedTypes?.length ? staticRoom.bedTypes : [],
          amenities: staticRoom.amenities?.length ? staticRoom.amenities : parsed.parsedAmenities,
          photos: roomPhotos, pricePerNight: perNightINR, totalPrice: totalINR,
          otaTotalINR, memberSaving, taxesIncluded: true,
          isRefundable: refTag === 'RFN', refundableTag: refTag || null,
          cancelPolicies: rate?.cancellationPolicies?.cancelPolicyInfos || [],
          freeCancelUntil: (() => {
            const policies = rate?.cancellationPolicies?.cancelPolicyInfos || []
            const freePolicy = policies.find(p => p.cancelCharge === 0 || p.amount === 0)
            if (freePolicy?.cancelTime) return freePolicy.cancelTime.split('T')[0]
            if (refTag === 'RFN' && policies[0]?.cancelTime) return policies[0].cancelTime.split('T')[0]
            return null
          })(),
        }
      }).filter(Boolean)
    }

    const cheapest = roomList.reduce((m, r) => (!m || (r.pricePerNight && r.pricePerNight < m.pricePerNight)) ? r : m, null)
    let reviews = [], sentimentAnalysis = null
    if (reviewsResp.status === 200 && reviewsResp.data?.data) {
      const rd = reviewsResp.data.data
      reviews = (Array.isArray(rd) ? rd : (rd.reviews || [])).slice(0, 10).map(r => ({ score: r.averageScore || null, name: r.name || 'Guest', country: r.country || '', type: r.type || '', date: r.date ? r.date.substring(0, 10) : '', headline: r.headline || '', pros: r.pros || '', cons: r.cons || '' }))
      sentimentAnalysis = rd.sentimentAnalysis || reviewsResp.data?.sentimentAnalysis || null
    }

    return res.json({
      success: true,
      hotel: {
        code: d.id || code, name: d.name, description: d.hotelDescription || '',
        importantInfo: d.hotelImportantInformation || '',
        stars: d.starRating ? Math.round(parseFloat(d.starRating)) : null,
        rating: d.rating || null, reviewCount: d.reviewCount || null,
        chain: d.chainName || null, address: d.address || '',
        city: d.city || '', country: d.country || '',
        coordinates: { latitude: d.location?.latitude || null, longitude: d.location?.longitude || null },
        checkInTime: d.checkinCheckoutTimes?.checkin || '15:00',
        checkOutTime: d.checkinCheckoutTimes?.checkout || '12:00',
        images, rooms: roomList, facilityGroups, allFacilities, popularFacilities,
        lowestPriceINR: cheapest?.pricePerNight || null,
        lowestTotalINR: cheapest?.totalPrice || null,
        cheapestRoom: cheapest || null, nights, checkIn, checkOut,
        adults: parseInt(adults), reviews, sentimentAnalysis,
      }
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router
