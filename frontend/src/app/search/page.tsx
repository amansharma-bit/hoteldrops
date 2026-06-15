"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const API = "https://hoteldrops-production-7e5a.up.railway.app/api/hotels";
const MAPBOX_TOKEN = "pk.eyJ1Ijoib21zYWlyYW0wMSIsImEiOiJjbXB4bngxdWwwMWI2MnBzZ3p2dGM3bW5rIn0.8qCkSAodMjGVg6qhiCZHzw";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const B = "#1447b8";
const NAVY = "#0f172a";
const YELLOW = "#FCD34D";

// ── Haversine distance ────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;
}

const DESTINATIONS: { label: string; key: string; flag: string; country: string; city: string }[] = [
  { label:"Dubai", key:"dubai", flag:"🇦🇪", country:"AE", city:"Dubai" },
  { label:"Abu Dhabi", key:"abu dhabi", flag:"🇦🇪", country:"AE", city:"Abu Dhabi" },
  { label:"Sharjah", key:"sharjah", flag:"🇦🇪", country:"AE", city:"Sharjah" },
  { label:"New Delhi", key:"new delhi", flag:"🇮🇳", country:"IN", city:"New Delhi" },
  { label:"Mumbai", key:"mumbai", flag:"🇮🇳", country:"IN", city:"Mumbai" },
  { label:"Goa", key:"goa", flag:"🇮🇳", country:"IN", city:"Goa" },
  { label:"Bangalore", key:"bangalore", flag:"🇮🇳", country:"IN", city:"Bangalore" },
  { label:"Chennai", key:"chennai", flag:"🇮🇳", country:"IN", city:"Chennai" },
  { label:"Kolkata", key:"kolkata", flag:"🇮🇳", country:"IN", city:"Kolkata" },
  { label:"Hyderabad", key:"hyderabad", flag:"🇮🇳", country:"IN", city:"Hyderabad" },
  { label:"Jaipur", key:"jaipur", flag:"🇮🇳", country:"IN", city:"Jaipur" },
  { label:"Kochi", key:"kochi", flag:"🇮🇳", country:"IN", city:"Kochi" },
  { label:"Agra", key:"agra", flag:"🇮🇳", country:"IN", city:"Agra" },
  { label:"Singapore", key:"singapore", flag:"🇸🇬", country:"SG", city:"Singapore" },
  { label:"Bangkok", key:"bangkok", flag:"🇹🇭", country:"TH", city:"Bangkok" },
  { label:"Phuket", key:"phuket", flag:"🇹🇭", country:"TH", city:"Phuket" },
  { label:"Bali", key:"bali", flag:"🇮🇩", country:"ID", city:"Bali" },
  { label:"Kuala Lumpur", key:"kuala lumpur", flag:"🇲🇾", country:"MY", city:"Kuala Lumpur" },
  { label:"London", key:"london", flag:"🇬🇧", country:"GB", city:"London" },
  { label:"Paris", key:"paris", flag:"🇫🇷", country:"FR", city:"Paris" },
  { label:"Rome", key:"rome", flag:"🇮🇹", country:"IT", city:"Rome" },
  { label:"Barcelona", key:"barcelona", flag:"🇪🇸", country:"ES", city:"Barcelona" },
  { label:"Amsterdam", key:"amsterdam", flag:"🇳🇱", country:"NL", city:"Amsterdam" },
  { label:"Istanbul", key:"istanbul", flag:"🇹🇷", country:"TR", city:"Istanbul" },
  { label:"Tokyo", key:"tokyo", flag:"🇯🇵", country:"JP", city:"Tokyo" },
  { label:"Hong Kong", key:"hong kong", flag:"🇭🇰", country:"HK", city:"Hong Kong" },
  { label:"Seoul", key:"seoul", flag:"🇰🇷", country:"KR", city:"Seoul" },
  { label:"Sydney", key:"sydney", flag:"🇦🇺", country:"AU", city:"Sydney" },
  { label:"New York", key:"new york", flag:"🇺🇸", country:"US", city:"New York" },
  { label:"Doha", key:"doha", flag:"🇶🇦", country:"QA", city:"Doha" },
  { label:"Riyadh", key:"riyadh", flag:"🇸🇦", country:"SA", city:"Riyadh" },
  { label:"Muscat", key:"muscat", flag:"🇴🇲", country:"OM", city:"Muscat" },
  { label:"Maldives", key:"maldives", flag:"🇲🇻", country:"MV", city:"Male" },
  { label:"Cairo", key:"cairo", flag:"🇪🇬", country:"EG", city:"Cairo" },
];

// [name, minLat, maxLat, minLng, maxLng]
const ALL_CITY_AREAS: Record<string,[string,number,number,number,number][]> = {
  dubai: [
    ["Palm Jumeirah",25.095,25.135,55.117,55.168],
    ["Dubai Marina",25.062,25.092,55.128,55.162],
    ["JBR – Jumeirah Beach Residence",25.070,25.090,55.118,55.142],
    ["Downtown Dubai",25.182,25.205,55.268,55.298],
    ["Business Bay",25.170,25.195,55.275,55.315],
    ["DIFC",25.204,25.222,55.268,55.288],
    ["Deira",25.252,25.295,55.290,55.345],
    ["Bur Dubai",25.225,25.262,55.275,55.322],
    ["Sheikh Zayed Road",25.198,25.232,55.258,55.288],
    ["Al Barsha",25.090,25.135,55.162,55.215],
    ["Jumeirah",25.152,25.208,55.212,55.268],
    ["Dubai Creek Harbour",25.192,25.228,55.325,55.368],
    ["City Walk",25.192,25.218,55.242,55.272],
    ["Dubai Hills Estate",25.112,25.158,55.218,55.272],
    ["Festival City",25.218,25.252,55.348,55.388],
    ["Jebel Ali",24.965,25.042,55.035,55.125],
    ["Al Quoz",25.138,25.175,55.218,55.258],
    ["Mirdif",25.215,25.248,55.395,55.438],
    ["Al Nahda",25.270,25.302,55.362,55.398],
    ["International City",25.158,25.192,55.398,55.438],
    ["Al Rashidiya",25.228,25.262,55.378,55.415],
    ["Oud Metha",25.228,25.248,55.308,55.332],
    ["Al Karama",25.238,25.258,55.295,55.322],
  ],
  "abu dhabi": [
    ["Corniche",24.461,24.490,54.320,54.380],["Yas Island",24.480,24.510,54.580,54.640],
    ["Saadiyat Island",24.530,24.560,54.420,54.480],["Al Reem Island",24.490,24.520,54.390,54.430],
    ["Downtown Abu Dhabi",24.470,24.500,54.350,54.400],["Al Maryah Island",24.495,24.515,54.380,54.410],
  ],
  singapore: [
    ["Orchard Road",1.295,1.320,103.820,103.845],["Marina Bay",1.270,1.295,103.845,103.875],
    ["Clarke Quay",1.285,1.300,103.840,103.860],["Sentosa",1.235,1.260,103.815,103.850],
    ["Bugis",1.295,1.315,103.850,103.870],["Little India",1.300,1.320,103.845,103.865],
    ["Chinatown",1.278,1.295,103.838,103.855],["Jurong",1.330,1.360,103.695,103.740],
    ["Changi",1.345,1.380,103.970,104.010],["Harbourfront",1.258,1.275,103.815,103.835],
  ],
  bangkok: [
    ["Sukhumvit",13.715,13.750,100.545,100.590],["Silom",13.715,13.735,100.515,100.545],
    ["Siam",13.740,13.760,100.525,100.550],["Khao San Road",13.750,13.770,100.490,100.510],
    ["Asok",13.728,13.748,100.555,100.575],["Chatuchak",13.790,13.820,100.540,100.565],
    ["Riverside",13.720,13.745,100.490,100.520],
  ],
  phuket: [
    ["Patong Beach",7.875,7.920,98.280,98.320],["Kata Beach",7.815,7.855,98.285,98.315],
    ["Karon Beach",7.845,7.880,98.285,98.310],["Phuket Town",7.875,7.910,98.375,98.410],
    ["Kamala Beach",7.940,7.975,98.255,98.285],["Surin Beach",7.975,8.010,98.255,98.285],
  ],
  bali: [
    ["Kuta",-8.740,-8.700,115.155,115.185],["Seminyak",-8.700,-8.670,115.150,115.180],
    ["Canggu",-8.660,-8.630,115.125,115.165],["Ubud",-8.525,-8.485,115.250,115.290],
    ["Nusa Dua",-8.815,-8.775,115.215,115.255],["Jimbaran",-8.800,-8.760,115.145,115.185],
    ["Seminyak",-8.700,-8.670,115.150,115.180],
  ],
  "kuala lumpur": [
    ["KLCC",3.148,3.168,101.705,101.725],["Bukit Bintang",3.140,3.158,101.705,101.725],
    ["Bangsar",3.118,3.140,101.668,101.695],["Mont Kiara",3.168,3.195,101.650,101.680],
    ["Petaling Jaya",3.090,3.120,101.625,101.660],["Chow Kit",3.160,3.180,101.690,101.715],
  ],
  london: [
    ["Mayfair",51.503,51.520,-0.160,-0.130],["Soho",51.508,51.520,-0.140,-0.120],
    ["Covent Garden",51.508,51.520,-0.130,-0.110],["Shoreditch",51.518,51.535,-0.085,-0.060],
    ["Kensington",51.492,51.510,-0.205,-0.175],["Canary Wharf",51.498,51.512,-0.030,-0.005],
    ["Westminster",51.495,51.512,-0.140,-0.110],["Camden",51.530,51.550,-0.155,-0.130],
  ],
  paris: [
    ["Eiffel Tower Area",48.847,48.868,2.285,2.310],["Champs-Élysées",48.864,48.882,2.290,2.320],
    ["Le Marais",48.852,48.868,2.345,2.370],["Montmartre",48.880,48.900,2.330,2.360],
    ["Latin Quarter",48.845,48.862,2.340,2.360],["Saint-Germain",48.848,48.862,2.325,2.345],
    ["Opera",48.866,48.880,2.325,2.350],
  ],
  rome: [
    ["Colosseum Area",41.883,41.900,12.482,12.502],["Vatican",41.895,41.912,12.445,12.465],
    ["Trastevere",41.882,41.898,12.462,12.482],["Termini",41.894,41.910,12.492,12.512],
    ["Spanish Steps",41.904,41.918,12.477,12.495],["Navona",41.895,41.910,12.468,12.482],
  ],
  barcelona: [
    ["Gothic Quarter",41.378,41.392,2.168,2.185],["Eixample",41.385,41.405,2.145,2.175],
    ["Barceloneta",41.374,41.388,2.183,2.200],["Gracia",41.400,41.420,2.148,2.168],
    ["Sagrada Familia Area",41.400,41.415,2.168,2.188],["El Born",41.382,41.396,2.178,2.195],
  ],
  amsterdam: [
    ["City Centre",52.368,52.382,4.888,4.910],["Jordaan",52.370,52.385,4.878,4.898],
    ["De Pijp",52.350,52.368,4.888,4.908],["Leidseplein",52.360,52.375,4.876,4.896],
    ["Museumplein",52.355,52.370,4.874,4.896],["Amsterdam Noord",52.385,52.410,4.885,4.920],
  ],
  istanbul: [
    ["Sultanahmet",41.004,41.020,28.970,28.992],["Taksim",41.034,41.050,28.978,28.998],
    ["Beyoglu",41.028,41.044,28.970,28.990],["Besiktas",41.040,41.058,29.000,29.025],
    ["Kadikoy",40.980,40.998,29.020,29.042],["Sisli",41.052,41.068,28.980,29.000],
  ],
  tokyo: [
    ["Shinjuku",35.685,35.705,139.688,139.715],["Shibuya",35.652,35.670,139.692,139.715],
    ["Asakusa",35.706,35.724,139.788,139.812],["Ginza",35.664,35.678,139.758,139.778],
    ["Akihabara",35.694,35.710,139.768,139.788],["Roppongi",35.655,35.672,139.725,139.745],
    ["Ikebukuro",35.726,35.742,139.706,139.726],["Odaiba",35.620,35.638,139.768,139.792],
  ],
  "hong kong": [
    ["Tsim Sha Tsui",22.292,22.310,114.165,114.185],["Central",22.278,22.295,114.152,114.172],
    ["Mong Kok",22.312,22.328,114.162,114.178],["Causeway Bay",22.276,22.292,114.178,114.198],
    ["Wan Chai",22.274,22.290,114.168,114.188],["Kowloon",22.305,22.325,114.155,114.185],
  ],
  seoul: [
    ["Gangnam",37.495,37.520,127.018,127.055],["Myeongdong",37.558,37.575,126.978,126.998],
    ["Hongdae",37.548,37.565,126.918,126.938],["Insadong",37.570,37.585,126.982,126.998],
    ["Itaewon",37.532,37.550,126.988,127.008],["Dongdaemun",37.566,37.582,127.002,127.022],
  ],
  sydney: [
    ["CBD",-33.875,-33.858,151.198,151.218],["Darling Harbour",-33.878,-33.862,151.195,151.210],
    ["Bondi Beach",-33.900,-33.882,151.268,151.290],["Manly",-33.802,-33.784,151.278,151.300],
    ["The Rocks",-33.862,-33.848,151.200,151.215],["Surry Hills",-33.890,-33.872,151.205,151.225],
  ],
  "new york": [
    ["Midtown",40.748,40.768,-73.995,-73.970],["Times Square Area",40.752,40.768,-73.995,-73.978],
    ["Upper East Side",40.768,40.790,-73.968,-73.948],["Brooklyn",40.668,40.700,-73.998,-73.960],
    ["SoHo",40.720,40.738,-74.008,-73.988],["Chelsea",40.738,40.755,-74.008,-73.988],
    ["Financial District",40.702,40.720,-74.020,-74.000],
  ],
  mumbai: [
    ["Bandra",19.048,19.072,72.818,72.842],["Juhu",19.088,19.112,72.815,72.840],
    ["Colaba",18.895,18.920,72.808,72.832],["Andheri",19.102,19.128,72.855,72.880],
    ["Lower Parel",18.988,19.008,72.818,72.838],["BKC",19.054,19.078,72.858,72.882],
    ["Powai",19.108,19.132,72.895,72.920],["Worli",18.998,19.020,72.808,72.828],
  ],
  "new delhi": [
    ["Connaught Place",28.622,28.640,77.208,77.228],["Aerocity",28.548,28.566,77.104,77.126],
    ["Hauz Khas",28.542,28.560,77.192,77.212],["Lajpat Nagar",28.564,28.582,77.230,77.250],
    ["Karol Bagh",28.644,28.660,77.182,77.202],["Saket",28.520,28.540,77.202,77.222],
    ["Dwarka",28.568,28.598,77.038,77.078],["Nehru Place",28.544,28.562,77.245,77.265],
  ],
  bangalore: [
    ["MG Road",12.972,12.988,77.608,77.628],["Whitefield",12.968,12.998,77.730,77.760],
    ["Koramangala",12.924,12.944,77.618,77.645],["Indiranagar",12.972,12.990,77.638,77.658],
    ["Electronic City",12.840,12.870,77.658,77.688],["Hebbal",13.032,13.055,77.588,77.612],
    ["Yelahanka",13.090,13.120,77.578,77.608],
  ],
  doha: [
    ["West Bay",25.315,25.340,51.520,51.548],["The Pearl",25.368,25.392,51.540,51.568],
    ["Souq Waqif",25.285,25.302,51.530,51.548],["Lusail",25.400,25.430,51.500,51.535],
    ["Al Waab",25.248,25.268,51.445,51.468],
  ],
  cairo: [
    ["Downtown",30.042,30.062,31.230,31.252],["Zamalek",30.058,30.075,31.215,31.232],
    ["Giza Pyramids Area",29.968,29.990,31.120,31.145],["Heliopolis",30.085,30.108,31.318,31.342],
    ["Maadi",29.960,29.980,31.245,31.268],
  ],
  riyadh: [
    ["Al Olaya",24.688,24.710,46.678,46.702],["Al Malaz",24.670,24.692,46.720,46.745],
    ["Diplomatic Quarter",24.685,24.710,46.595,46.625],["King Abdullah Road",24.720,24.748,46.648,46.678],
  ],
  muscat: [
    ["Muttrah",23.612,23.632,58.582,58.605],["Al Qurum",23.588,23.610,58.525,58.550],
    ["Al Khuwair",23.595,23.618,58.488,58.512],["Madinat Qaboos",23.578,23.600,58.462,58.488],
  ],
  goa: [
    ["North Goa",15.490,15.560,73.740,73.790],["Calangute",15.535,15.558,73.752,73.775],
    ["Baga",15.548,15.572,73.748,73.772],["Anjuna",15.572,15.595,73.732,73.758],
    ["South Goa",15.200,15.320,73.920,73.980],["Panjim",15.490,15.510,73.820,73.845],
  ],
  chennai: [
    ["T Nagar",13.035,13.052,80.228,80.248],["Adyar",13.000,13.020,80.248,80.268],
    ["Anna Nagar",13.068,13.088,80.198,80.218],["Egmore",13.070,13.088,80.255,80.275],
    ["ECR",12.840,12.960,80.235,80.265],["OMR",12.870,12.980,80.218,80.248],
  ],
  kolkata: [
    ["Park Street",22.548,22.565,88.348,88.368],["Salt Lake",22.568,22.592,88.388,88.415],
    ["New Town",22.572,22.602,88.440,88.472],["Howrah",22.578,22.600,88.295,88.325],
    ["Ballygunge",22.520,22.540,88.355,88.378],
  ],
  hyderabad: [
    ["Banjara Hills",17.408,17.428,78.438,78.460],["Jubilee Hills",17.418,17.440,78.402,78.428],
    ["HITEC City",17.438,17.458,78.370,78.395],["Secunderabad",17.438,17.460,78.490,78.518],
    ["Gachibowli",17.430,17.452,78.348,78.372],["Old City",17.348,17.370,78.468,78.492],
  ],
  jaipur: [
    ["Old City",26.920,26.942,75.820,75.845],["C-Scheme",26.888,26.908,75.795,75.820],
    ["Malviya Nagar",26.852,26.872,75.800,75.825],["Vaishali Nagar",26.908,26.928,75.745,75.770],
  ],
  kochi: [
    ["Fort Kochi",9.960,9.980,76.230,76.252],["Ernakulam",9.978,9.998,76.278,76.302],
    ["Marine Drive",9.978,9.998,76.285,76.308],["Aluva",10.098,10.118,76.348,76.372],
  ],
  agra: [
    ["Taj Mahal Area",27.168,27.188,78.038,78.062],["Fatehabad Road",27.158,27.178,78.025,78.050],
    ["Civil Lines",27.175,27.195,78.000,78.025],
  ],
  maldives: [
    ["Male City",4.168,4.188,73.505,73.530],["North Male Atoll",4.200,4.350,73.400,73.600],
    ["South Male Atoll",3.800,4.050,73.400,73.600],
  ],
};

const CITY_LOCATIONS: Record<string, string[]> = {
  "abu dhabi": ["Yas Island", "Saadiyat Island", "Al Maryah Island", "Corniche", "Downtown Abu Dhabi", "Al Khalidiyah", "Al Zahiyah", "Khalifa City", "Yas Marina"],
  "adelaide": ["Adelaide CBD", "Glenelg Beachfront", "North Adelaide", "Norwood", "Hahndorf"],
  "agadir": ["Agadir Beachfront", "Cite Founty", "City Centre", "Talborjt", "Marina Agadir"],
  "agra": ["Taj Ganj", "Fatehabad Road", "Sanjay Place", "Sadar Bazaar", "Rakabganj", "Sikandra", "Dayalbagh", "Cantonment"],
  "ahmedabad": ["Ashram Road", "SG Highway", "Satellite", "Vastrapur", "CG Road", "Prahlad Nagar", "Bodakdev", "Navrangpura", "Ellisbridge", "Sabarmati"],
  "ajman": ["Ajman Corniche", "Al Rashidiya", "Al Nuaimiya", "Al Rawda", "Al Bustan", "Al Mowaihat", "Al Jurf"],
  "alexandria": ["Corniche", "Al Manshiyah", "Stanley", "El Montaza", "Smouha", "Maamoura", "San Stefano", "Sidi Gaber"],
  "algarve": ["Albufeira Old Town", "Vilamoura Marina", "Lagos Marina", "Faro Centro", "Carvoeiro", "Portimao", "Tavira", "Sagres"],
  "almaty": ["Almalinsky Downtown", "Medeusky District", "Bostandyksky", "Kok Tobe", "Republic Square"],
  "amalfi": ["Amalfi Town Centre", "Atrani", "Marina Grande", "Valle dei Mulini"],
  "amman": ["Abdali", "Jabal Amman", "Sweifieh", "Al Shmeisani", "Weibdeh", "Seventh Circle", "Third Circle", "Khalda"],
  "amritsar": ["Golden Temple", "Ranjit Avenue", "Town Hall", "Hall Bazaar", "Lawrence Road", "GT Road", "Civil Lines"],
  "amsterdam": ["Centrum Canal Ring", "Jordaan", "De Pijp", "Oud-West", "Amsterdam Noord", "Museumquarter", "Plantage"],
  "andaman islands": ["Port Blair", "Havelock Island", "Neil Island", "Baratang", "Diglipur", "Mayabunder"],
  "antalya": ["Kaleici Old Town", "Lara Beach", "Konyaalti Beachfront", "Antalya City Centre", "Kepez", "Muratpasa"],
  "aqaba": ["Aqaba City Centre", "Tala Bay", "Al-Ghandour Beach", "Marina Square", "North Beach"],
  "athens": ["Plaka", "Monastiraki", "Syntagma", "Koukaki", "Psiri", "Kolonaki", "Glyfada", "Thissio"],
  "auckland": ["Auckland CBD", "Viaduct Harbour", "Ponsonby", "Parnell", "Newmarket", "Britomart", "Devonport"],
  "bagan": ["Old Bagan", "New Bagan", "Nyaung-U", "Wetkyi-In", "Myinkaba"],
  "baku": ["Icherisheher Old City", "Baku Boulevard", "Sabayil", "Yasamal", "Nasimi", "Narimanov"],
  "bali": ["Kuta", "Seminyak", "Canggu", "Ubud", "Nusa Dua", "Jimbaran", "Legian", "Sanur", "Uluwatu", "Lovina"],
  "bandar seri begawan": ["Kianggeh Downtown", "Gadong Shopping", "Kampong Ayer", "Berakas", "Kiulap", "Jerudong"],
  "bangalore": ["Indiranagar", "Koramangala", "MG Road", "Whitefield", "Electronic City", "Jayanagar", "HSR Layout", "Malleshwaram", "Marathahalli", "Hebbal", "Yelahanka"],
  "bangkok": ["Sukhumvit", "Silom", "Siam", "Khao San Road", "Asok", "Chatuchak", "Riverside", "Ratchada", "Ekkamai", "Thong Lo"],
  "barbados": ["St. Lawrence Gap", "Bridgetown Downtown", "Holetown West Coast", "Oistins", "Hastings"],
  "barcelona": ["Gothic Quarter", "Eixample", "El Born", "El Raval", "Gracia", "Barceloneta", "Poblenou", "Sants"],
  "batumi": ["Old Batumi", "Batumi Boulevard", "New Boulevard", "Sherif Khimshiashvili Street"],
  "beijing": ["Wangfujing", "Sanlitun", "Forbidden City", "Chaoyang CBD", "Qianmen", "Houhai", "Xidan", "Zhongguancun"],
  "beirut": ["Hamra", "Ashrafieh", "Downtown", "Mar Mikhael", "Gemmayzeh", "Raouche", "Verdun", "Badaro"],
  "bengaluru": ["Indiranagar", "Koramangala", "MG Road", "Whitefield", "Electronic City", "Jayanagar", "HSR Layout", "Malleshwaram", "Marathahalli", "Hebbal"],
  "bergen": ["Bryggen Historic Wharf", "Bergen Sentrum", "Nordnes", "Sandviken", "Arstad"],
  "berlin": ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Friedrichshain", "Charlottenburg", "Neukolln", "Schoneberg", "Tiergarten"],
  "bern": ["Innere Stadt Old Town", "Breitenrain-Lorraine", "Kirchenfeld-Schosshalde", "Mattenhof-Weissenbuehl"],
  "bhopal": ["Arera Colony", "MP Nagar", "Shamla Hills", "TT Nagar", "Misrod", "Koh-e-Fiza", "Govindpura"],
  "bhubaneswar": ["Jayadev Vihar", "Nayapalli", "Master Canteen Square", "Patia", "Cuttack Road", "Sahid Nagar"],
  "birmingham": ["City Centre Bullring", "Jewellery Quarter", "Brindleyplace", "Digbeth", "Edgbaston", "Mailbox"],
  "bishkek": ["Ala-Too Square", "Chuy Avenue", "Erkindik Boulevard", "Osh Bazaar", "Pervomaysky", "Leninsky"],
  "bled": ["Lake Bled Waterfront", "Bled Center", "Mlino", "Grad Castle Hill", "Recica"],
  "bodrum": ["Bodrum Town Centre", "Gumbet", "Bitez", "Yalikavak Marina", "Turgutreis", "Turkbuku", "Ortakent"],
  "bogota": ["La Candelaria Historic", "Zona Rosa", "Parque de la 93", "Chapinero", "Usaquen"],
  "bologna": ["Centro Storico Piazza Maggiore", "Bolognina", "San Donato", "Santo Stefano"],
  "boracay": ["White Beach Station 1", "White Beach Station 2", "White Beach Station 3", "Bulabog Beach", "Diniwid Beach", "Yapak"],
  "bordeaux": ["Centre Ville", "Chartrons", "Saint-Michel", "Bastide", "Gare Saint-Jean", "Les Bassins a Flot"],
  "boston": ["Back Bay", "Downtown Faneuil Hall", "North End", "South End", "Beacon Hill", "Seaport District", "Cambridge Harvard"],
  "brisbane": ["Brisbane CBD", "South Bank", "Fortitude Valley", "West End", "Spring Hill", "New Farm", "Kangaroo Point"],
  "brno": ["Brno-stred City Centre", "Veveri", "Kralovo Pole", "Zabrdovice", "Stare Brno"],
  "bruges": ["Historic Centre Markt", "Sint-Anna", "Sint-Gilles", "Steenstraat", "Bruges Station"],
  "brussels": ["Grand Place City Centre", "European Quarter", "Ixelles", "Saint-Gilles", "Sablon", "Louise", "Atomium"],
  "budapest": ["District V Belvaros", "District VI Terezvaros", "Jewish Quarter", "Castle District", "District VIII Jozsefvaros", "Ferencvaros"],
  "buenos aires": ["Palermo Soho", "Palermo Hollywood", "Recoleta", "San Telmo", "Puerto Madero", "Microcentro", "Retiro"],
  "busan": ["Haeundae Beach", "Seomyeon", "Nampo-dong", "Gwangalli Beach", "Centum City"],
  "cairns": ["Cairns Esplanade", "Cairns CBD", "Palm Cove", "Trinity Beach", "Cairns North"],
  "cairo": ["Zamalek", "Garden City", "Downtown Cairo", "Giza", "Heliopolis", "Maadi", "New Cairo", "Nasr City", "Dokki", "Mohandessin"],
  "calgary": ["Downtown Calgary", "Beltline", "Kensington", "Inglewood", "17th Avenue SW"],
  "cambridge": ["City Centre Market", "Chesterton", "Mill Road", "Trumpington", "Newnham"],
  "cancun": ["Zona Hotelera", "El Centro Downtown", "Puerto Juarez", "Playa Mujeres"],
  "cannes": ["La Croisette", "Le Suquet Old Town", "Rue d'Antibes", "Pointe Croisette", "Carnot"],
  "cape town": ["V&A Waterfront", "Green Point", "Sea Point", "Camps Bay", "Cape Town CBD", "Woodstock", "Constantia", "Clifton", "Hout Bay"],
  "cappadocia": ["Goreme", "Urgup", "Uchisar", "Avanos", "Ortahisar", "Cavusin", "Mustafapasa"],
  "cartagena": ["Walled City", "Bocagrande", "Getsemani", "San Diego", "El Laguito"],
  "casablanca": ["Sour Djedid", "Gauthier", "Maarif", "Anfa", "Bourgogne", "Corniche Ain Diab", "Habous", "City Centre"],
  "cebu": ["Cebu Business Park", "IT Park Lahug", "Fuente Osmena", "Mactan Beachfront", "Mandaue", "Colon Street"],
  "chandigarh": ["Sector 17", "Sector 35", "Sector 22", "Sector 43", "Sector 8", "Sukhna Lake", "Sector 26"],
  "chengdu": ["Chunxi Road", "Tianfu Square", "Jinjiang District", "Wuhou District", "Qingyang", "Hi-Tech Zone"],
  "chennai": ["T Nagar", "Nungambakkam", "Mylapore", "Adyar", "OMR", "Velachery", "Anna Nagar", "Egmore", "Guindy", "Royapettah", "ECR", "Marina Beach"],
  "chiang mai": ["Old City Moat", "Nimman Road", "Chang Puak", "Riverside", "Santitham", "Night Bazaar", "Hang Dong", "Doi Suthep"],
  "chicago": ["The Loop", "Magnificent Mile", "River North", "Lincoln Park", "Wicker Park", "West Loop", "Gold Coast", "Streeterville"],
  "christchurch": ["Christchurch Central City", "Riccarton", "Merivale", "Addington", "Lyttelton"],
  "coimbatore": ["Peelamedu", "RS Puram", "Gandhipuram", "Race Course Road", "Saibaba Colony", "Ramanathapuram"],
  "cologne": ["Altstadt-Nord Cathedral", "Altstadt-Sud", "Ehrenfeld", "Belgisches Viertel", "Deutz"],
  "colombo": ["Fort", "Colombo 3 Kollupitiya", "Bambalapitiya", "Wellawatte", "Dehiwala", "Mount Lavinia", "Pettah", "Borella"],
  "copenhagen": ["Nyhavn", "Indre By City Centre", "Vesterbro", "Norrebro", "Osterbro", "Christianshavn", "Frederiksberg"],
  "corfu": ["Corfu Town Historic", "Kavos", "Paleokastritsa", "Sidari", "Kassiopi", "Gouvia", "Benitses"],
  "crete": ["Chania Old Town", "Heraklion Centro", "Rethymno Old Town", "Elounda", "Agios Nikolaos", "Hersonissos"],
  "da nang": ["My Khe Beach", "Hai Chau Downtown", "Son Tra Peninsula", "Marble Mountains", "Lien Chieu", "Hoa Vang"],
  "dammam": ["Dammam Corniche", "Al Shatea", "Al Hamra", "Al Faisaliyah", "Downtown Dammam", "Al Nour"],
  "dar es salaam": ["Kivukoni", "Masaki", "Oyster Bay", "Mikocheni", "Upanga", "Kariakoo", "City Centre", "Mbezi Beach", "Msasani Peninsula"],
  "darjeeling": ["Chauk Bazaar", "Gandhi Road", "Chowrasta Mall", "Lebong", "Ghoom", "Peace Pagoda", "Happy Valley"],
  "darwin": ["Darwin CBD", "Waterfront Precinct", "Cullen Bay", "Fannie Bay", "Parap"],
  "delhi": ["Connaught Place", "Karol Bagh", "South Extension", "Saket", "Aerocity", "Paharganj", "Chandni Chowk", "Dwarka", "Rajouri Garden", "Vasant Kunj", "Chanakyapuri", "Greater Kailash"],
  "dhaka": ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Motijheel", "Mirpur", "Bashundhara"],
  "doha": ["West Bay", "The Pearl", "Msheireb Downtown", "Souq Waqif", "Al Sadd", "Lusail", "Katara Cultural Village", "Diplomatic Area"],
  "dubai": ["Downtown Dubai", "Dubai Marina", "Palm Jumeirah", "Deira", "Bur Dubai", "JBR", "Al Barsha", "Business Bay", "Sheikh Zayed Road", "Jumeirah", "Al Fahidi", "Trade Centre"],
  "dublin": ["Temple Bar", "Grafton Street", "O'Connell Street", "Portobello", "Docklands", "Smithfield", "Ranelagh", "Ballsbridge"],
  "dubrovnik": ["Old Town", "Lapad Peninsula", "Babin Kuk", "Ploce", "Gruz Port", "Pile"],
  "durban": ["Golden Mile", "Umhlanga Rocks", "Durban North", "Morningside", "Musgrave", "Ballito Village"],
  "dusseldorf": ["Altstadt Old Town", "Stadtmitte", "MedienHafen", "Unterbilk", "Pempelfort"],
  "edinburgh": ["Old Town", "New Town", "Leith", "Stockbridge", "Haymarket", "West End", "Bruntsfield", "Holyrood"],
  "fes": ["Fes El Bali", "Fes El Jdid", "Ville Nouvelle", "Narjiss", "Atlas"],
  "fiji": ["Denarau Island", "Nadi Downtown", "Coral Coast", "Suva CBD", "Mamanuca Islands", "Yasawa Islands"],
  "florence": ["Duomo Centro", "Santa Maria Novella", "Santa Croce", "San Lorenzo", "Oltrarno", "San Marco"],
  "frankfurt": ["Innenstadt", "Bahnhofsviertel", "Sachsenhausen", "Westend", "Bornheim", "Gallus"],
  "fujairah": ["Al Aqah", "Fujairah City Centre", "Dibba Al-Fujairah", "Al Faseel", "Khor Fakkan", "Al Gurf", "Mirbah"],
  "fukuoka": ["Hakata Station", "Tenjin Downtown", "Nakasu", "Chuo Ward", "Momochi Beach"],
  "galapagos": ["Puerto Ayora Santa Cruz", "Puerto Baquerizo Moreno", "Puerto Villamil Isabela"],
  "galle": ["Galle Fort", "Unawatuna", "Hikkaduwa", "Koggala", "Ahangama", "Midigama"],
  "geneva": ["Paquis Lakefront", "Geneva Old Town", "Plainpalais", "Eaux-Vives", "Carouge"],
  "glasgow": ["City Centre", "West End Hillhead", "Merchant City", "Finnieston", "Southside", "East End"],
  "goa": ["Calangute", "Baga", "Candolim", "Panaji", "Margao", "Anjuna", "Vagator", "Colva", "Palolem", "Morjim", "Arambol", "Dona Paula", "Bambolim"],
  "gold coast": ["Surfers Paradise", "Broadbeach", "Burleigh Heads", "Main Beach", "Coolangatta", "Southport", "Mermaid Beach"],
  "grand baie": ["Grand Baie Downtown", "Pereybere", "Pointe aux Canonniers", "Bain Boeuf", "Mont Choisy", "Trou aux Biches"],
  "guangzhou": ["Tianhe CBD", "Yuexiu District", "Liwan", "Haizhu", "Panyu", "Huadu Airport", "Baiyun District"],
  "guilin": ["Elephant Trunk Hill", "Diecai", "Seven Star Park", "Yanshan", "Yangshuo West Street", "Longji Terraces"],
  "guwahati": ["Paltan Bazaar", "GS Road", "Gayanagar", "Dispur", "Khanapara", "Pan Bazaar", "Fancy Bazaar", "Kamakhya"],
  "hamburg": ["Altona", "St. Pauli", "HafenCity", "Hamburg-Mitte", "St. Georg", "Sternschanze"],
  "hanoi": ["Old Quarter", "Hoan Kiem", "Ba Dinh", "Tay Ho West Lake", "Hai Ba Trung", "Cau Giay", "Dong Da"],
  "havana": ["Old Havana", "Vedado", "Centro Habana", "Miramar", "Playa"],
  "helsinki": ["Kluuvi City Centre", "Kamppi", "Punavuori", "Kallio", "Toolo", "Katajanokka", "Ruoholahti"],
  "hiroshima": ["Downtown Hondori", "Peace Memorial Park", "Hiroshima Station", "Naka Ward", "Miyajima Island"],
  "ho chi minh city": ["District 1", "District 3", "Thao Dien", "District 5 Chinatown", "Phu My Hung", "Binh Thanh", "Tan Binh"],
  "hoi an": ["Ancient Town", "An Bang Beach", "Cam Chau", "Cua Dai Beach", "Cam An"],
  "hong kong": ["Tsim Sha Tsui", "Central", "Mong Kok", "Causeway Bay", "Wan Chai", "Sheung Wan", "Jordan", "Lantau"],
  "honolulu": ["Waikiki Beachfront", "Downtown Honolulu", "Ala Moana", "Diamond Head", "Kakaako"],
  "hua hin": ["Hua Hin Beach", "Hua Hin Town", "Khao Takiab", "Cha-am", "Pranburi"],
  "hurghada": ["Sahl Hasheesh", "Makadi Bay", "El Gouna", "Soma Bay", "El Dahar", "Sheraton Road", "Hurghada Marina"],
  "hyderabad": ["Gachibowli", "HITECH City", "Banjara Hills", "Jubilee Hills", "Madhapur", "Secunderabad", "Begumpet", "Abids", "Charminar", "Kukatpally", "Kondapur", "Ameerpet"],
  "ibiza": ["Ibiza Town", "Playa d'en Bossa", "San Antonio", "Santa Eularia", "Talamanca"],
  "indore": ["Vijay Nagar", "Palasia", "MG Road", "Rau", "Rajwada", "South Tukoganj", "Scheme 54"],
  "innsbruck": ["Innsbruck Innenstadt", "Hotting", "Pradl", "Wilten", "Mariahilf"],
  "interlaken": ["Interlaken West", "Interlaken Ost", "Hoheweg Main Strip", "Unterseen", "Matten"],
  "islamabad": ["F-6 Supermarket", "F-7 Jinnah", "F-8", "Blue Area", "G-9 Karachi Company", "DHA", "Bahria Town"],
  "istanbul": ["Sultanahmet", "Taksim / Beyoglu", "Karakoy", "Besiktas", "Kadikoy", "Nisantasi", "Sisli", "Ortakoy", "Eminonu"],
  "izmir": ["Alsancak", "Konak Square", "Karsiyaka", "Bornova", "Cesme", "Urla", "Bayrakli"],
  "jaipur": ["Pink City", "C Scheme", "Malviya Nagar", "Vaishali Nagar", "Mansarovar", "Bani Park", "Tonk Road", "Raja Park", "Amer", "MI Road", "Sitapura"],
  "jaisalmer": ["Jaisalmer Fort", "Sam Sand Dunes", "Khuri Sand Dunes", "Gadi Sagar Lake", "Kishan Ghat", "Amar Sagar Pol"],
  "jakarta": ["Sudirman SCBD", "Kuningan", "Menteng", "Kemang", "Kelapa Gading", "Grogol", "Serpong", "Senayan"],
  "jeddah": ["Corniche", "Al Hamra", "Al Rawdah", "Al Tahlia Street", "Ash Shati", "Al Balad", "Al Naeem", "Al Salamah"],
  "jeju": ["Jeju City Downtown", "Seogwipo", "Jungmun Tourist Complex", "Seongsan", "Aewol", "Hyeopjae Beach"],
  "jerusalem": ["Old City", "Mamilla", "City Centre", "Nachlaot", "German Colony", "Yemin Moshe", "Ein Karem", "Rehavia"],
  "jodhpur": ["Clock Tower", "Ratanada", "Sardarpura", "Mandore", "Paota", "Shastri Nagar", "Circuit House Road"],
  "johannesburg": ["Sandton", "Rosebank", "Melrose Arch", "Maboneng", "Braamfontein", "Fourways", "OR Tambo Airport"],
  "johor bahru": ["JB Sentral", "Bukit Indah", "Taman Mount Austin", "Tebrau", "Permas Jaya", "Danga Bay"],
  "kandy": ["Kandy City Centre", "Peradeniya", "Katugastota", "Kundasale", "Digana", "Gampola"],
  "karachi": ["Clifton", "Defence", "Korangi", "Gulshan-e-Iqbal", "Saddar", "North Nazimabad", "Malir"],
  "kathmandu": ["Thamel", "Patan", "Bhaktapur", "Boudhanath", "Pashupatinath", "Sanepa", "Lazimpat", "Durbarmarg"],
  "kochi": ["Fort Kochi", "Mattancherry", "Ernakulam South", "MG Road", "Marine Drive", "Edappally", "Kakkanad", "Vyttila", "Willingdon Island", "Kalamassery"],
  "koh samui": ["Chaweng Beach", "Lamai Beach", "Fisherman's Village", "Maenam", "Choeng Mon", "Nathon", "Bang Rak"],
  "kolkata": ["Park Street", "Salt Lake", "New Town", "Ballygunge", "Elgin Road", "Esplanade", "Alipore", "Chowringhee", "Gariahat", "Lake Town"],
  "kota kinabalu": ["KK City Centre", "Tanjung Aru", "Likas", "Inanam", "Penampang", "Sutera Harbour"],
  "krabi": ["Ao Nang", "Railay Beach", "Krabi Town", "Klong Muang", "Noppharat Thara"],
  "krakow": ["Old Town Stare Miasto", "Kazimierz Jewish Quarter", "Podgorze", "Grzegorzki", "Krowodrza"],
  "kuala lumpur": ["KLCC", "Bukit Bintang", "Bangsar", "Mont Kiara", "Chow Kit", "Petaling Jaya", "Damansara", "Ampang"],
  "kuwait city": ["Salmiya", "Sharq", "Fahaheel", "Hawally", "Downtown", "Jabriya", "Mahboula"],
  "kyoto": ["Gion", "Kawaramachi", "Kyoto Station", "Arashiyama", "Higashiyama", "Karasuma", "Fushimi"],
  "labuan bajo": ["Labuan Bajo Town", "Komodo Harbour", "Batu Cermin", "Wae Bo", "Golo Mori"],
  "lahore": ["Gulberg", "DHA", "Johar Town", "Model Town", "Old City", "Cantonment", "Bahria Town"],
  "langkawi": ["Pantai Cenang", "Kuah Town", "Pantai Tengah", "Datai Bay", "Tanjung Rhu", "Pantai Kok"],
  "las vegas": ["The Strip", "Downtown Fremont Street", "Henderson", "Summerlin", "Paradise Road"],
  "leh": ["Leh Main Bazaar", "Changspa", "Fort Road", "Tukcha", "Spituk", "Nubra Valley"],
  "leh ladakh": ["Leh Main Bazaar", "Changspa", "Fort Road", "Tukcha", "Housing Colony", "Spituk", "Nubra Valley"],
  "lima": ["Miraflores", "Barranco", "San Isidro", "Historic Centre", "San Miguel"],
  "lisbon": ["Baixa / Chiado", "Alfama", "Bairro Alto", "Belem", "Parque das Nacoes", "Principe Real", "Avenida da Liberdade", "Santos"],
  "liverpool": ["Albert Dock", "Baltic Triangle", "City Centre Ropewalks", "Georgian Quarter", "Knowledge Quarter"],
  "ljubljana": ["Old Town Center", "Trnovo", "Tabor", "Bezigrad", "Siska", "Krakovo"],
  "lombok": ["Senggigi Beach", "Gili Trawangan", "Mataram", "Kuta Lombok", "Gili Meno", "Gili Air"],
  "london": ["Westminster", "Covent Garden", "Soho", "Kensington", "Chelsea", "Paddington", "Bloomsbury", "Shoreditch", "Southwark", "Mayfair", "Camden", "City of London"],
  "los angeles": ["Hollywood", "Santa Monica", "Venice Beach", "Downtown DTLA", "Beverly Hills", "West Hollywood", "Koreatown", "Pasadena", "Malibu"],
  "los cabos": ["Cabo San Lucas Marina", "San Jose del Cabo", "Tourist Corridor", "Medano Beach"],
  "luang prabang": ["Old Town Peninsula", "Mount Phousi", "Nam Khan Riverbank", "Mekong Riverfront", "Mano Road"],
  "lucerne": ["Lucerne Old Town", "Neustadt Station", "Lucerne Lakefront", "Tribschen", "Littau"],
  "luxor": ["East Bank Downtown", "West Bank", "El Kawther", "Nile Corniche", "Khalid Ibn El Walid Street"],
  "lyon": ["Vieux Lyon", "Presqu'ile", "Croix-Rousse", "Part-Dieu", "Confluence", "Guillotiere", "Vaise"],
  "maafushi": ["Maafushi Beach", "Maafushi Town", "Cocoa Island", "Biyadhoo", "Guraidhoo"],
  "macau": ["Cotai Strip", "Macau Peninsula", "Taipa Village", "Coloane", "Fisherman's Wharf", "Outer Harbour"],
  "machu picchu": ["Aguas Calientes", "Train Station Market", "Pachacutec Avenue"],
  "madrid": ["Sol / Gran Via", "Malasana", "Chueca", "La Latina", "Lavapies", "Retiro", "Salamanca", "Chamberi"],
  "mahe": ["Beau Vallon", "Eden Island", "Anse Royale", "Glacis", "Takamaka", "Bel Ombre", "Grand Anse", "Baie Lazare"],
  "malaga": ["Centro Historico", "La Malagueta", "Soho Art District", "Pedregalejo", "Teatinos"],
  "male": ["Male City", "Hulhumale", "North Male Atoll", "South Male Atoll", "Baa Atoll"],
  "mallorca": ["Palma Centro", "Palma Nova / Magaluf", "Alcudia Bay", "Cala d'Or", "Santa Ponsa", "Soller"],
  "manali": ["Mall Road", "Old Manali", "Vashisht", "Solang Valley", "Aleo", "Prini", "Naggar Road"],
  "manama": ["Juffair", "Seef District", "Amwaj Islands", "Diplomatic Area", "Adliya", "Bahrain Bay", "Hoora"],
  "manchester": ["Northern Quarter", "Piccadilly", "Deansgate", "Spinningfields", "Ancoats", "Castlefield", "Salford Quays"],
  "mandalay": ["Downtown Mandalay", "Mandalay Palace", "Chanayethazan", "Maha Aung Mye", "Amarapura"],
  "manila": ["Makati CBD", "BGC", "Malate", "Ermita", "Intramuros", "Quezon City", "Ortigas", "Binondo Chinatown", "Alabang"],
  "marrakech": ["Medina", "Gueliz", "Hivernage", "Palmeraie", "Agdal", "Kasbah", "Mellah", "Sidi Ghanem"],
  "marseille": ["Vieux Port", "Le Panier", "La Canebiere", "La Joliette", "Prado-Perier", "Endoume", "Noailles"],
  "mecca": ["Abraj Al Bait", "Ajyad", "Al Misfalah", "Al Aziziya", "Jabal Omar", "Al Haram", "Batha Quraish"],
  "medina": ["Al Markaziya North", "Al Markaziya South", "Al Markaziya West", "Al Aridh", "Al Sayh", "Sultanah", "King Fahd District"],
  "melbourne": ["CBD", "St Kilda", "Fitzroy", "Southbank", "Carlton", "Richmond", "South Melbourne", "Chapel Street", "Docklands", "Brunswick"],
  "mexico city": ["La Condesa", "Roma Norte", "Polanco", "Centro Historico", "Coyoacan", "Zona Rosa", "Santa Fe", "San Angel"],
  "miami": ["South Beach", "Mid-Beach", "Brickell", "Wynwood", "Little Havana", "Coral Gables", "Coconut Grove", "Key Biscayne"],
  "milan": ["Duomo Centro", "Brera", "Navigli", "Porta Nuova", "Stazione Centrale", "Isola"],
  "mombasa": ["Nyali", "Bamburi Beach", "Shanzu", "Diani Beach", "Tiwi", "Mtwapa", "Mombasa Island"],
  "monaco": ["Monte Carlo", "Monaco-Ville", "La Condamine", "Fontvieille", "Larvotto Beachfront"],
  "montreal": ["Old Montreal", "Downtown", "Le Plateau-Mont-Royal", "Mile End", "Griffintown", "Quartier Latin"],
  "moscow": ["Tverskoy Red Square", "Arbat", "Presnensky Moscow City", "Basmanny", "Zamoskvorechye", "Khamovniki"],
  "mumbai": ["Colaba", "Nariman Point", "Bandra West", "Juhu", "Andheri West", "Andheri East", "Powai", "Lower Parel", "Worli", "Fort", "Marine Drive", "Vashi"],
  "munich": ["Altstadt-Lehel", "Maxvorstadt", "Ludwigsvorstadt", "Schwabing", "Au-Haidhausen", "Glockenbachviertel"],
  "munnar": ["Munnar Town", "Old Munnar", "Pallivasal", "Devikulam", "Mattupetty", "Chinnakanal", "Anachal"],
  "muscat": ["Al Khuwair", "Ruwi", "Muttrah Corniche", "Qurum", "Al Mouj", "Shatti Al Qurum", "Bawshar", "Seeb", "Ghubrah"],
  "mykonos": ["Mykonos Town", "Ornos Beach", "Platys Gialos", "Paradise Beach", "Elia Beach", "Agios Ioannis"],
  "mysore": ["Gokulam", "Mysuru Palace", "Jayalakshmipuram", "Hebbal", "Devaraja Market", "Bannimantap", "Kuvempunagar"],
  "nagpur": ["Civil Lines", "Dharampeth", "Sitabuldi", "Sadar", "Ramdaspeth", "Manish Nagar"],
  "nairobi": ["Westlands", "Kilimani", "Karen", "Upper Hill", "CBD", "Gigiri", "Lavington", "Parklands"],
  "naples": ["Centro Storico", "Chiaia", "Vomero", "Lungomare Caracciolo", "Posillipo", "Stazione Centrale"],
  "nara": ["Nara Park", "Kintetsu-Nara Station", "JR Nara Station", "Naramachi", "Shin-Omiya"],
  "nassau": ["Downtown Nassau", "Paradise Island", "Cable Beach", "West Bay Street"],
  "negombo": ["Negombo Beach", "Negombo City", "Ettukala", "Waikkal", "Kochchikade", "Kapuwatta"],
  "new delhi": ["Connaught Place", "Karol Bagh", "South Extension", "Saket", "Aerocity", "Paharganj", "Chandni Chowk", "Dwarka", "Rajouri Garden", "Vasant Kunj", "Chanakyapuri", "Greater Kailash"],
  "new orleans": ["French Quarter", "Garden District", "CBD", "Marigny", "Warehouse District", "Mid-City"],
  "new york": ["Times Square", "Midtown", "Lower East Side", "SoHo", "Upper East Side", "Upper West Side", "Greenwich Village", "Williamsburg", "Financial District", "Harlem"],
  "nha trang": ["Tran Phu Beachfront", "Loc Tho", "Vinh Phuoc", "Hon Tre Island", "Pham Van Dong Beach"],
  "nice": ["Promenade des Anglais", "Vieux Nice", "Jean-Medecin", "Le Port", "Cimiez", "Gambetta", "Quartier des Musiciens"],
  "ooty": ["Ooty Town Centre", "Botanical Garden", "Charing Cross", "Doddabetta", "Lovedale", "Fernhill", "Coonoor"],
  "orlando": ["International Drive", "Lake Buena Vista", "Kissimmee", "Universal Studios", "Downtown Orlando", "Winter Park"],
  "osaka": ["Namba", "Shinsaibashi", "Umeda", "Dotonbori", "Tennoji", "Osaka Castle", "Shin-Osaka", "Honmachi"],
  "oslo": ["Sentrum City Centre", "Grunerløkka", "Frogner", "Aker Brygge", "Tjuvholmen", "Bjørvika", "Majorstuen"],
  "oxford": ["City Centre", "Jericho", "Cowley Road", "Summertown", "Headington", "Botley"],
  "palawan": ["El Nido Town", "Puerto Princesa CBD", "Coron Town", "San Vicente Long Beach", "Port Barton"],
  "paris": ["Le Marais", "Montmartre", "Saint-Germain", "Latin Quarter", "Champs-Elysees", "Eiffel Tower District", "Opera", "Canal Saint-Martin", "Bastille", "Ile de la Cite"],
  "paro": ["Paro Town", "Paro Valley", "Kyichu Lhakhang", "Dzong area", "Bondey", "Shaba"],
  "pattaya": ["Walking Street", "Beach Road", "Jomtien Beach", "Naklua", "Pratumnak Hill", "Central Pattaya", "North Pattaya"],
  "penang": ["George Town", "Batu Ferringhi", "Tanjung Bungah", "Bayan Lepas", "Gurney Drive", "Gelugor", "Air Itam"],
  "perth": ["Perth CBD", "Fremantle", "Northbridge", "Scarborough Beach", "West Perth", "Subiaco", "East Perth"],
  "petra": ["Wadi Musa", "Petra Visitor Centre", "Tourism Street", "Al Nawafleh", "Umm Sayhoun", "Beidha"],
  "phnom penh": ["Riverside", "BKK1", "Tonle Bassac", "Tuol Kouk", "Chamkar Mon"],
  "phu quoc": ["Duong Dong Town", "Long Beach", "Ong Lang Beach", "An Thoi", "Bai Sao", "Cua Can"],
  "phuket": ["Patong Beach", "Kata Beach", "Karon Beach", "Phuket Town", "Kamala Beach", "Surin", "Bang Tao", "Rawai", "Nai Harn", "Mai Khao"],
  "playa del carmen": ["Quinta Avenida", "Playacar", "Centro Beachfront", "Gonzalo Guerrero"],
  "pokhara": ["Lakeside", "Pokhara Bazaar", "Damside", "Sarangkot", "Begnas Lake", "Bindyabasini"],
  "pondicherry": ["White Town", "Heritage Town", "Auroville", "Promenade Beach", "Ousteri", "Muthialpet"],
  "port louis": ["Caudan Waterfront", "Place d'Armes", "Ward IV", "Champ de Mars", "Sainte Croix", "Bell Village"],
  "porto": ["Ribeira", "Baixa Downtown", "Cedofeita", "Foz do Douro", "Bonfim", "Vila Nova de Gaia", "Clerigos"],
  "prague": ["Old Town", "Lesser Town", "New Town", "Zizkov", "Vinohrady", "Karlin", "Smichov", "Holesovice"],
  "pune": ["Koregaon Park", "Kalyani Nagar", "Viman Nagar", "Hinjewadi", "Shivaji Nagar", "Kothrud", "Baner", "Wakad", "Camp", "Hadapsar", "Magarpatta"],
  "punta cana": ["Bavaro Beach", "Cap Cana Marina", "Macao Beach", "Cabeza de Toro", "El Cortecito"],
  "puri": ["Jagannath Temple", "Sea Beach Road", "Swargadwar", "Marine Drive", "Baliapanda", "CT Road", "Grand Road"],
  "quebec city": ["Old Quebec", "Saint-Roch", "Montcalm", "Saint-Jean-Baptiste"],
  "queenstown": ["Queenstown Town Centre", "Frankton", "Fernhill", "Kelvin Heights", "Arthurs Point"],
  "ras al khaimah": ["Al Marjan Island", "Al Hamra Village", "Mina Al Arab", "Al Nakheel", "Al Dhait", "Jebel Jais", "Khuzam"],
  "reykjavik": ["Midborg Downtown", "Vesturbær", "Hlidar", "Laugardalur", "Grandi Harbour"],
  "rhodes": ["Rhodes Old Town", "Lindos Village", "Faliraki", "Ialyssos", "Kolymbia", "Pefkos"],
  "rio de janeiro": ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Lapa", "Santa Teresa", "Botafogo", "Centro"],
  "riyadh": ["Al Olaya", "Al Malaz", "Al Murabba", "KAFD", "Al Muhammadiyah", "Al Sulaimaniyah", "Diplomatic Quarter", "Al Yasmin"],
  "rome": ["Centro Storico", "Trastevere", "Monti", "Termini", "Prati", "Testaccio", "Campo de Fiori", "San Giovanni"],
  "rotterdam": ["Stadsdriehoek City Centre", "Kop van Zuid", "Delfshaven", "Kralingen", "Oude Noorden"],
  "salalah": ["Al Haffa", "Central Salalah", "Awqad", "Mirbat", "Taqah", "Raysut"],
  "salzburg": ["Altstadt Old Town", "Elisabeth-Vorstadt", "Neustadt", "Nonntal", "Maxglan"],
  "samarkand": ["Registan Square", "Gur-e-Amir", "Universitetskiy Boulevard", "Siab Bazaar", "Dagbit Street"],
  "san francisco": ["Fisherman's Wharf", "Union Square", "Mission District", "Castro", "SOMA", "Haight-Ashbury", "Nob Hill", "Marina District", "Chinatown"],
  "san sebastian": ["Parte Vieja Old Town", "Centro", "La Concha Beachfront", "Gros", "Antiguo"],
  "santiago": ["Providencia", "Las Condes", "Santiago Centro", "Bellavista", "Lastarria", "Vitacura"],
  "santorini": ["Fira", "Oia", "Imerovigli", "Firostefani", "Kamari Beach", "Perissa Beach", "Akrotiri", "Pyrgos"],
  "sao paulo": ["Avenida Paulista", "Jardins", "Vila Madalena", "Itaim Bibi", "Pinheiros", "Moema", "Centro Historic"],
  "sapporo": ["Odori Park", "Susukino", "Sapporo Station", "Nakajima Park", "Chuo Ward", "Jozankei Onsen"],
  "seattle": ["Downtown Pike Place", "Capitol Hill", "Seattle Center", "Ballard", "Fremont", "Pioneer Square", "Queen Anne"],
  "seoul": ["Myeongdong", "Gangnam", "Hongdae", "Itaewon", "Insadong", "Dongdaemun", "Jamsil", "Jongno", "Yeouido", "Sinchon"],
  "seville": ["Santa Cruz", "El Arenal", "Triana", "Centro Regina", "Los Remedios", "Macarena"],
  "shanghai": ["The Bund", "People's Square", "Pudong Lujiazui", "French Concession", "Jing'an", "Nanjing Road", "Xujiahui"],
  "sharjah": ["Al Majaz", "Al Khan", "Al Nahda", "Corniche Al Buhaira", "Al Qasimia", "Rolla", "Al Taawun", "Muwaileh"],
  "sharm el sheikh": ["Naama Bay", "Nabq Bay", "Sharks Bay", "El Hadaba", "Soho Square", "Ras Um Sid", "Old Market"],
  "shenzhen": ["Futian CBD", "Luohu", "Nanshan Hi-Tech Park", "Shekou", "Bao'an", "Overseas Chinese Town", "Yantian"],
  "shimla": ["Mall Road", "Ridge", "Chhotta Shimla", "Sanjauli", "New Shimla", "Summer Hill", "Kufri", "Mashobra"],
  "sicily": ["Palermo Centro", "Catania Centro", "Taormina Town", "Syracuse Ortigia", "Cefalu", "Noto"],
  "siem reap": ["Pub Street", "Old Market", "Wat Bo", "Charles de Gaulle Boulevard", "Svay Dangkum"],
  "sihanoukville": ["Ochheuteal Beach", "Serendipity Beach", "Otres Beach", "Victory Beach", "Downtown Market"],
  "singapore": ["Orchard Road", "Marina Bay", "Clarke Quay", "Sentosa", "Bugis", "Little India", "Chinatown", "Harbourfront", "Changi", "Novena", "Geylang"],
  "split": ["Old Town Diocletians Palace", "Bacvice Beachfront", "Veli Varos", "Marjan", "Meje", "Lučac"],
  "srinagar": ["Dal Lake", "Lal Chowk", "Rajbagh", "Sonwar", "Nishat", "Shalimar", "Hazratbal", "Nigeen Lake"],
  "st petersburg": ["Central District Nevsky", "Admiralteysky", "Petrogradsky Island", "Vasilievsky Island"],
  "stockholm": ["Gamla Stan Old Town", "Norrmalm Downtown", "Sodermalm", "Ostermalm", "Vasastan", "Kungsholmen", "Djurgarden"],
  "strasbourg": ["Grande Ile Old Town", "Petite France", "Krutenau", "European Quarter", "Neudorf", "Gare Centrale"],
  "stuttgart": ["Stuttgart-Mitte", "Stuttgart-West", "Stuttgart-Ost", "Bad Cannstatt", "Stuttgart-Sud"],
  "surabaya": ["Tunjungan Plaza area", "Gubeng", "Genteng", "Sukolilo", "Wiyung", "Rungkut"],
  "surat": ["Dumas Road", "Piplod", "Adajan", "Varachha", "Ring Road", "Athwa Lines", "Ghod Dod Road", "Vesu", "Katargam"],
  "sydney": ["CBD", "The Rocks", "Darling Harbour", "Bondi Beach", "Surry Hills", "Newtown", "Manly", "Paddington", "Potts Point", "Coogee"],
  "taichung": ["Fengjia Night Market", "West District", "Xitun CBD", "North District", "Central District", "Nantun"],
  "taipei": ["Ximending", "Xinyi District", "Zhongshan", "Da'an", "Datong", "Wanhua", "Shilin", "Songshan"],
  "tashkent": ["Yunusabad", "Mirabad", "Yakkasaray", "Shaykhantahur", "Chilanzar", "Chorsu Bazaar", "Alisher Navoi Opera"],
  "tbilisi": ["Old Tbilisi", "Avlabari", "Chugureti Fabrika", "Vera", "Saburtalo", "Vake", "Rustaveli Avenue"],
  "tel aviv": ["Promenade", "Rothschild Boulevard", "Jaffa", "Neve Tzedek", "Florentin", "Dizengoff Street", "Old North", "Sarona"],
  "the hague": ["City Centre", "Scheveningen Beach", "Archipelbuurt", "Statenkwartier", "Zeeheldenkwartier"],
  "thessaloniki": ["Aristotelous Square", "Ladadika", "Ano Poli Upper Town", "White Tower", "Kalamaria"],
  "thimphu": ["Thimphu City Centre", "Norzin Lam", "Jungshina", "Motithang", "Lungtenzampa", "Chubachu"],
  "thiruvananthapuram": ["Kovalam Beach", "Varkala Cliff", "Thampanoor", "Kazhakkoottam", "Technopark", "Palayam", "East Fort", "Vellayambalam", "Poovar"],
  "tokyo": ["Shinjuku", "Shibuya", "Ginza", "Roppongi", "Asakusa", "Akihabara", "Ueno", "Ikebukuro", "Shinagawa", "Odaiba", "Minato"],
  "toronto": ["Downtown", "Entertainment District", "Yorkville", "West Queen West", "Distillery District", "The Annex", "Harbourfront"],
  "turin": ["Centro Storico", "San Salvario", "Crocetta", "Aurora", "Borgo Po", "Vanchiglia"],
  "udaipur": ["Lake Pichola", "Old City", "Fatehsagar Lake", "Sukhadia Circle", "Hiran Magri", "Chetak Circle", "City Palace", "Mallatalai"],
  "valencia": ["Ciutat Vella Old Town", "Ruzafa", "El Carmen", "El Cabanyal Beach", "City of Arts and Sciences"],
  "vancouver": ["Downtown / Robson", "Gastown", "Yaletown", "West End", "Granville Island", "Kitsilano"],
  "varanasi": ["Dashashwamedh Ghat", "Assi Ghat", "Godowlia", "Cantonment", "Sarnath", "Lanka", "Sigra", "Lahurabir"],
  "venice": ["San Marco", "Cannaregio", "Dorsoduro", "San Polo", "Castello", "Santa Croce", "Lido di Venezia", "Mestre"],
  "victoria": ["Bel Air", "Mont Fleuri", "Beau Vallon", "Saint Louis", "Plaisance", "English River"],
  "vienna": ["Innere Stadt", "Leopoldstadt", "Landstrasse", "Wieden", "Neubau", "Mariahilf"],
  "vientiane": ["Vientiane Riverside", "Sisaket Temple", "Patuxay Park", "Chanthabouly", "Sisattanak"],
  "visakhapatnam": ["Rushikonda Beach", "Vizag Steel City", "RK Beach", "MVP Colony", "Madhurawada", "Gajuwaka"],
  "warsaw": ["Old Town", "Srodmiescie City Centre", "Wola", "Mokotow", "Praga-Polnoc", "Wilanow"],
  "washington dc": ["National Mall", "Dupont Circle", "Georgetown", "Downtown DC", "Adams Morgan", "Capitol Hill", "Foggy Bottom", "Navy Yard"],
  "wellington": ["Lambton Quay CBD", "Te Aro Cuba Street", "Oriental Bay", "Thorndon", "Mount Victoria"],
  "xi'an": ["Bell Tower Downtown", "Muslim Quarter", "Giant Wild Goose Pagoda", "Qujiang New District", "Xincheng"],
  "xian": ["Bell Tower Downtown", "Muslim Quarter", "Giant Wild Goose Pagoda", "Qujiang New District", "Xincheng"],
  "yangon": ["Downtown Yangon", "Bahan Shwedagon", "Yaw Min Gyi", "Kandawgyi Lake", "Inya Lake", "Mayangone"],
  "yerevan": ["Kentron Downtown", "Cascade", "Arabkir", "Shengavit", "Nor Nork"],
  "yogyakarta": ["Malioboro", "Kraton", "Prawirotaman", "Kaliurang", "Babarsari", "Condongcatur"],
  "zagreb": ["Donji Grad Lower Town", "Gornji Grad Upper Town", "Maksimir", "Tresnjevka", "Novi Zagreb", "Jarun"],
  "zanzibar": ["Stone Town", "Nungwi", "Kendwa", "Paje", "Jambiani", "Matemwe", "Kiwengwa", "Kizimkazi"],
  "zurich": ["Altstadt", "Langstrasse", "Zurich West", "Enge", "Seefeld"],
};function getAreasForCity(city: string): string[] {
  const key = city.toLowerCase().trim()
    .replace(/^(new |greater |old )/i, '')  // normalize
    .trim();
  return CITY_LOCATIONS[key] || CITY_LOCATIONS[city.toLowerCase().trim()] || [];
}

function getAreaFromCoords(lat?: number|null, lng?: number|null, city?: string): string|null {
  if (!lat||!lng||!city) return null;
  const areas = ALL_CITY_AREAS[city.toLowerCase().trim()];
  if (!areas) return null;
  for (const [name,minLat,maxLat,minLng,maxLng] of areas as [string,number,number,number,number][]) {
    if (lat>=minLat&&lat<=maxLat&&lng>=minLng&&lng<=maxLng) return name;
  }
  return null;
}

const PRIORITY_AMENITIES = ["Swimming Pool","Fitness Centre","Restaurant","Free WiFi"];
const TOP_FACILITIES = ["Swimming Pool","Room Service","Fitness Centre","On-site Dining","Spa","Parking","Free WiFi","Airport Shuttle","Business Centre","Kids Club"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(()=>{ const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener("resize",c); return()=>window.removeEventListener("resize",c); },[]);
  return isMobile;
}

function formatINR(n: number) { return "₹"+Math.round(n).toLocaleString("en-IN"); }
function formatDate(s: string) { if(!s)return""; const d=new Date(s+"T00:00:00"); return d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}); }
function formatDateShort(s: string) { if(!s)return""; const d=new Date(s+"T00:00:00"); return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }
function toDateStr(y:number,m:number,d:number){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function getDaysInMonth(y:number,m:number){return new Date(y,m+1,0).getDate();}
function getFirstDow(y:number,m:number){return new Date(y,m,1).getDay();}
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function codeToNum(code:string|number):number{if(typeof code==="number")return code;let h=0;for(let i=0;i<code.length;i++){h=((h<<5)-h)+code.charCodeAt(i);h|=0;}return Math.abs(h);}

const IconBreakfast=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>;

interface Hotel{code:string|number;name:string;stars:number|null;minRate:number;currency:string;imageUrl?:string;address?:string;city?:string;chain?:string;rating?:number|null;latitude?:number|null;longitude?:number|null;amenities?:string[];isRefundable?:boolean|null;hasBreakfast?:boolean;lowestPriceINR?:number;otaPriceINR?:number;memberSaving?:number;taxesIncluded?:boolean;}
interface GuestState{rooms:number;adults:number;children:number;childAges:number[];}

const FALLBACK_IMGS=["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop"];

interface FiltersPanelProps{destination:string;areaOptions:string[];filterLocation:string;setFilterLocation:(v:string)=>void;filterPriceMin:number|null;filterPriceMax:number|null;setPriceRange:(min:number|null,max:number|null)=>void;filterRefundable:boolean;setFilterRefundable:(v:boolean)=>void;filterBreakfast:boolean;setFilterBreakfast:(v:boolean)=>void;filterRating:number|null;setFilterRating:(v:number|null)=>void;filterStars:number[];setFilterStars:(v:number[])=>void;filterFacilities:string[];setFilterFacilities:(v:string[])=>void;hasActiveFilters:boolean;clearAllFilters:()=>void;onHotelSearch:(v:string)=>void;}

function FiltersPanel({areaOptions,filterLocation,setFilterLocation,filterPriceMin,filterPriceMax,setPriceRange,filterRefundable,setFilterRefundable,filterBreakfast,setFilterBreakfast,filterRating,setFilterRating,filterStars,setFilterStars,filterFacilities,setFilterFacilities,hasActiveFilters,clearAllFilters,onHotelSearch}:FiltersPanelProps){
  const [showMore,setShowMore]=useState(false);const [sv,setSv]=useState("");
  const CB=({active,onClick}:{active:boolean;onClick:()=>void})=><div onClick={onClick} style={{width:16,height:16,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:4,background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>{active&&<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}</div>;
  const RB=({active,onClick}:{active:boolean;onClick:()=>void})=><div onClick={onClick} style={{width:16,height:16,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:"50%",background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>{active&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}</div>;
  const Row=({children,onClick}:{children:React.ReactNode;onClick:()=>void})=><div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>{children}</div>;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",marginBottom:16}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Hotel name, area or landmark" value={sv} onChange={e=>{setSv(e.target.value);onHotelSearch(e.target.value);}} style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:13,color:NAVY,background:"transparent",width:"100%"}}/>
        {sv&&<button onClick={()=>{setSv("");onHotelSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:0}}>×</button>}
      </div>
      
      {areaOptions.length>0&&<div style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Location</div>
        {areaOptions.map(a=><Row key={a} onClick={()=>setFilterLocation(filterLocation===a?"":a)}>
          <CB active={filterLocation===a} onClick={()=>setFilterLocation(filterLocation===a?"":a)}/>
          <span style={{fontSize:13,color:"#1e293b"}}>{a}</span>
        </Row>)}
        {filterLocation&&<button onClick={()=>setFilterLocation("")} style={{background:"none",border:"none",fontSize:12,color:B,cursor:"pointer",fontFamily:"inherit",padding:"4px 0",fontWeight:600}}>Clear</button>}
      </div>}
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Price per night</div>{([{label:"Under ₹5,000",min:null,max:5000},{label:"₹5,000 – ₹10,000",min:5000,max:10000},{label:"₹10,000 – ₹20,000",min:10000,max:20000},{label:"₹20,000 – ₹40,000",min:20000,max:40000},{label:"₹40,000+",min:40000,max:null}] as {label:string;min:number|null;max:number|null}[]).map(({label,min,max})=>{const a=filterPriceMin===min&&filterPriceMax===max;return<Row key={label} onClick={()=>a?setPriceRange(null,null):setPriceRange(min,max)}><CB active={a} onClick={()=>a?setPriceRange(null,null):setPriceRange(min,max)}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Suggested</div>{[{label:"Free Cancellation",active:filterRefundable,toggle:()=>setFilterRefundable(!filterRefundable)},{label:"Free Breakfast",active:filterBreakfast,toggle:()=>setFilterBreakfast(!filterBreakfast)},{label:"Rating 9+",active:filterRating===9,toggle:()=>setFilterRating(filterRating===9?null:9)}].map(({label,active,toggle})=><Row key={label} onClick={toggle}><CB active={active} onClick={toggle}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>)}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Star category</div>{[5,4,3,2,1].map(s=>{const a=filterStars.includes(s);return<Row key={s} onClick={()=>setFilterStars(a?filterStars.filter(x=>x!==s):[...filterStars,s])}><CB active={a} onClick={()=>setFilterStars(a?filterStars.filter(x=>x!==s):[...filterStars,s])}/><span style={{color:"#f59e0b",fontSize:13}}>{"★".repeat(s)}</span><span style={{fontSize:13,color:"#1e293b"}}>{s} Star</span></Row>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>User rating</div>{[{label:"Exceptional 9+",min:9},{label:"Excellent 8+",min:8},{label:"Very Good 7+",min:7}].map(({label,min})=><Row key={label} onClick={()=>setFilterRating(filterRating===min?null:min)}><RB active={filterRating===min} onClick={()=>setFilterRating(filterRating===min?null:min)}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>)}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Facilities</div>{(showMore?TOP_FACILITIES:TOP_FACILITIES.slice(0,6)).map(label=>{const a=filterFacilities.includes(label);return<Row key={label} onClick={()=>setFilterFacilities(a?filterFacilities.filter(f=>f!==label):[...filterFacilities,label])}><CB active={a} onClick={()=>setFilterFacilities(a?filterFacilities.filter(f=>f!==label):[...filterFacilities,label])}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>;})}
        <button onClick={()=>setShowMore(!showMore)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:B,fontWeight:600,fontFamily:"inherit",padding:"4px 0"}}>{showMore?"Show less":"View more"}</button>
      </div>
      {hasActiveFilters&&<button onClick={clearAllFilters} style={{width:"100%",background:"#fef3c7",color:"#92400e",border:"none",borderRadius:8,padding:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Clear all filters</button>}
    </div>
  );
}

function CalendarScreen({checkIn,checkOut,onSelect,onClose}:{checkIn:string;checkOut:string;onSelect:(ci:string,co:string)=>void;onClose:()=>void;}){
  const today=new Date();const[mode,setMode]=useState<"checkin"|"checkout">(checkIn?"checkout":"checkin");const[ci,setCi]=useState(checkIn);const[co,setCo]=useState(checkOut);
  const todayStr=toDateStr(today.getFullYear(),today.getMonth(),today.getDate());
  const handleDay=(ds:string)=>{if(mode==="checkin"){setCi(ds);setCo("");setMode("checkout");}else{if(ds<=ci)return;setCo(ds);}};
  const renderMonth=(year:number,month:number)=>{const days=getDaysInMonth(year,month);const firstDow=getFirstDow(year,month);return(<div key={`${year}-${month}`} style={{marginBottom:32}}><div style={{fontWeight:700,fontSize:16,color:NAVY,textAlign:"center",marginBottom:16}}>{MONTHS[month]} {year}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{DOWS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",paddingBottom:8}}>{d}</div>)}{Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}{Array.from({length:days}).map((_,i)=>{const day=i+1;const ds=toDateStr(year,month,day);const isDisabled=ds<todayStr;let bg="transparent",clr=isDisabled?"#cbd5e1":NAVY,br="50%",fw=400;if(ds===ci&&!!co){bg=B;clr="#fff";br="50% 0 0 50%";fw=700;}else if(ds===co){bg=B;clr="#fff";br="0 50% 50% 0";fw=700;}else if(ds===ci&&!co){bg=B;clr="#fff";br="50%";fw=700;}else if(ci&&co&&ds>ci&&ds<co){bg="#dbeafe";clr=B;br="0";}else if(ds===todayStr)clr=B;return<div key={day} onClick={()=>!isDisabled&&handleDay(ds)} style={{height:38,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:clr,borderRadius:br,fontWeight:fw,fontSize:14,cursor:isDisabled?"not-allowed":"pointer",opacity:isDisabled?0.35:1}}>{day}</div>;})}</div></div>);};
  return(<div style={{position:"fixed",inset:0,background:"#fff",zIndex:9999,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:NAVY}}>←</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>{mode==="checkin"?"Select Check-in":"Select Check-out"}</div></div>
    <div style={{flex:1,overflowY:"auto",padding:"20px 20px 0"}}>{Array.from({length:12}).map((_,i)=>{const dm=new Date(today.getFullYear(),today.getMonth()+i);return renderMonth(dm.getFullYear(),dm.getMonth());})}</div>
    <div style={{borderTop:"1px solid #e2e8f0",padding:"14px 20px 32px",background:"#fff",flexShrink:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div style={{border:`2px solid ${mode==="checkin"?B:"#e2e8f0"}`,borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-in</div><div style={{fontSize:14,fontWeight:600,color:ci?NAVY:"#94a3b8"}}>{ci?formatDate(ci):"Select"}</div></div>
        <div style={{border:`2px solid ${mode==="checkout"?B:"#e2e8f0"}`,borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-out</div><div style={{fontSize:14,fontWeight:600,color:co?NAVY:"#94a3b8"}}>{co?formatDate(co):"Select"}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
        <button onClick={()=>{setCi("");setCo("");setMode("checkin");}} style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:600,cursor:"pointer"}}>Clear</button>
        <button onClick={()=>{if(ci&&co){onSelect(ci,co);onClose();}}} style={{background:ci&&co?YELLOW:"#e2e8f0",color:ci&&co?"#1a1a1a":"#94a3b8",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:ci&&co?"pointer":"default"}}>Select</button>
      </div>
    </div>
  </div>);
}

function GuestsScreen({guests,onSelect,onClose}:{guests:GuestState;onSelect:(g:GuestState)=>void;onClose:()=>void;}){
  const[g,setG]=useState(guests);
  const upd=(key:"rooms"|"adults"|"children",val:number)=>setG(prev=>{const n={...prev,[key]:val};if(key==="children"){const ages=[...prev.childAges];if(val>ages.length){while(ages.length<val)ages.push(5);}else ages.splice(val);n.childAges=ages;}return n;});
  return(<div style={{position:"fixed",inset:0,background:"#fff",zIndex:9999,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:NAVY}}>←</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>Rooms & Guests</div></div>
    <div style={{flex:1,padding:"0 20px",overflowY:"auto"}}>
      {([["Rooms","Min 1","rooms",1,4],["Adults","13+ years","adults",1,16],["Children","0–12 years","children",0,8]] as [string,string,"rooms"|"adults"|"children",number,number][]).map(([label,sub,key,min,max])=>(
        <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0",borderBottom:"1px solid #f1f5f9"}}>
          <div><div style={{fontSize:17,fontWeight:600,color:NAVY}}>{label}</div><div style={{fontSize:13,color:"#94a3b8"}}>{sub}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:18}}>
            <button disabled={g[key]<=min} onClick={()=>upd(key,Math.max(min,g[key]-1))} style={{width:40,height:40,borderRadius:8,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:g[key]<=min?0.3:1}}>−</button>
            <span style={{fontSize:18,fontWeight:700,color:NAVY,minWidth:28,textAlign:"center"}}>{g[key]}</span>
            <button disabled={g[key]>=max} onClick={()=>upd(key,Math.min(max,g[key]+1))} style={{width:40,height:40,borderRadius:8,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:g[key]>=max?0.3:1}}>+</button>
          </div>
        </div>
      ))}
      {g.children>0&&<div style={{padding:"16px 0"}}><div style={{fontSize:14,fontWeight:600,color:NAVY,marginBottom:12}}>Age of children at check-in</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{Array.from({length:g.children}).map((_,idx)=><div key={idx}><div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>Child {idx+1}</div><select value={g.childAges[idx]??5} onChange={e=>setG(prev=>{const ages=[...prev.childAges];ages[idx]=parseInt(e.target.value);return{...prev,childAges:ages};})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"inherit",color:NAVY,background:"#fff"}}>{Array.from({length:13},(_,a)=><option key={a} value={a}>{a===0?"Under 1":`${a} year${a>1?"s":""}`}</option>)}</select></div>)}</div></div>}
    </div>
    <div style={{borderTop:"1px solid #e2e8f0",padding:"16px 20px 32px",background:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
      <div><div style={{fontSize:15,fontWeight:700,color:NAVY}}>{g.rooms} Room{g.rooms>1?"s":""}</div><div style={{fontSize:13,color:"#64748b"}}>{g.adults} Adult{g.adults>1?"s":""}{g.children>0?`, ${g.children} Child${g.children>1?"ren":""}`:""}</div></div>
      <button onClick={()=>{onSelect(g);onClose();}} style={{background:YELLOW,color:"#1a1a1a",border:"none",borderRadius:12,padding:"14px 28px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Select</button>
    </div>
  </div>);
}

function AuthModal({onClose}:{onClose:()=>void}){
  const[loading,setLoading]=useState(false);
  const handleGoogle=async()=>{setLoading(true);const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href}});if(error){setLoading(false);alert("Sign in failed.");}};
  return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:8888}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:20,zIndex:9999,width:"min(480px,92vw)",padding:"40px 36px"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:NAVY,marginBottom:8}}>rebuq<span style={{color:B}}>.</span></div><div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:8}}>Sign in to see member rates</div><div style={{fontSize:14,color:"#64748b",lineHeight:1.6}}>Members get exclusive hotel rates up to 40% below OTA prices.</div></div>
    <button onClick={handleGoogle} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:NAVY,marginBottom:12}}>
      {loading?<div style={{width:20,height:20,border:"2px solid #e2e8f0",borderTop:`2px solid ${B}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
      {loading?"Signing in...":"Continue with Google"}
    </button>
    <div style={{textAlign:"center",fontSize:12,color:"#94a3b8"}}>Free forever · No credit card required</div>
  </div></>);
}

function BottomSheet({title,onClose,children,onClear}:{title:string;onClose:()=>void;children:React.ReactNode;onClear?:()=>void;}){
  return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:8888}}/><div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",zIndex:9999,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 14px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8"}}>×</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>{title}</div><div style={{width:20}}/></div>
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>{children}</div>
    <div style={{padding:"14px 20px 32px",borderTop:"1px solid #f1f5f9",display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,flexShrink:0}}>
      <button onClick={onClear||onClose} style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:600,cursor:"pointer"}}>Clear</button>
      <button onClick={onClose} style={{background:B,color:"#fff",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>Show results</button>
    </div>
  </div></>);
}

function ChipDropdown({id,label,openChip,setOpenChip,children}:{id:string;label:string;openChip:string|null;setOpenChip:(v:string|null)=>void;children:React.ReactNode}){
  const isOpen=openChip===id;
  return(<div style={{position:"relative"}}><button onClick={()=>setOpenChip(isOpen?null:id)} style={{display:"flex",alignItems:"center",gap:6,background:isOpen?"#eff6ff":"#fff",border:`1.5px solid ${isOpen?B:"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:isOpen?B:NAVY,whiteSpace:"nowrap"}}>{label} <span style={{fontSize:10}}>▼</span></button>
    {isOpen&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,minWidth:220,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.16)",zIndex:99999,padding:14,maxHeight:320,overflowY:"auto"}}>{children}</div>}
  </div>);
}

function MapView({hotels,checkIn,checkOut,filterProps,onClose,onHotelClick,isMobile}:{hotels:Hotel[];checkIn:string;checkOut:string;filterProps:FiltersPanelProps;onClose:()=>void;onHotelClick:(h:Hotel)=>void;isMobile:boolean;}){
  const mapRef=useRef<HTMLDivElement>(null);const mapInstanceRef=useRef<any>(null);const markersRef=useRef<{el:HTMLElement;hotel:Hotel;pinDiv:HTMLElement}[]>([]);const listRef=useRef<HTMLDivElement>(null);
  const[selectedHotel,setSelectedHotel]=useState<Hotel|null>(null);const[openChip,setOpenChip]=useState<string|null>(null);const chipRef=useRef<HTMLDivElement>(null);
  const NIGHTS=checkIn&&checkOut?Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)):1;
  const hotelsWithCoords=hotels.filter(h=>h.latitude&&h.longitude);
  useEffect(()=>{const handler=(e:MouseEvent)=>{if(openChip&&chipRef.current&&!chipRef.current.contains(e.target as Node)){setOpenChip(null);}};document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);},[openChip]);
  const selectHotel=(hotel:Hotel)=>{setSelectedHotel(hotel);markersRef.current.forEach(({pinDiv})=>{pinDiv.style.background="#fff";pinDiv.style.color=NAVY;pinDiv.style.transform="scale(1)";});const found=markersRef.current.find(m=>String(m.hotel.code)===String(hotel.code));if(found){found.pinDiv.style.background=YELLOW;found.pinDiv.style.color=NAVY;found.pinDiv.style.transform="scale(1.15)";}if(hotel.latitude&&hotel.longitude&&mapInstanceRef.current)mapInstanceRef.current.flyTo({center:[hotel.longitude,hotel.latitude],zoom:14,speed:1.5});if(listRef.current){const card=listRef.current.querySelector(`[data-hotel="${hotel.code}"]`) as HTMLElement;if(card)card.scrollIntoView({behavior:"smooth",block:"nearest"});}};
  useEffect(()=>{if(!mapRef.current)return;const initMap=()=>{const mapboxgl=(window as any).mapboxgl;if(!mapboxgl)return;mapboxgl.accessToken=MAPBOX_TOKEN;const cLng=hotelsWithCoords.length>0?hotelsWithCoords.reduce((s,h)=>s+(h.longitude||0),0)/hotelsWithCoords.length:55.2708;const cLat=hotelsWithCoords.length>0?hotelsWithCoords.reduce((s,h)=>s+(h.latitude||0),0)/hotelsWithCoords.length:25.2048;const map=new mapboxgl.Map({container:mapRef.current,style:"mapbox://styles/mapbox/streets-v12",center:[cLng,cLat],zoom:11});mapInstanceRef.current=map;const addMarkers=()=>{hotelsWithCoords.forEach(hotel=>{const price=Math.round((hotel.lowestPriceINR||hotel.minRate||0)/NIGHTS);if(!price)return;const el=document.createElement("div");const pinDiv=document.createElement("div");pinDiv.style.cssText=`background:#fff;color:${NAVY};padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);border:1.5px solid #e2e8f0;cursor:pointer;transition:all 0.15s;`;pinDiv.textContent=`₹${price.toLocaleString("en-IN")}`;el.appendChild(pinDiv);el.addEventListener("click",()=>selectHotel(hotel));new mapboxgl.Marker({element:el,anchor:"bottom"}).setLngLat([hotel.longitude!,hotel.latitude!]).addTo(map);markersRef.current.push({el,hotel,pinDiv});});};if(map.loaded())addMarkers();else map.on("load",addMarkers);};if(!document.querySelector('link[href*="mapbox-gl"]')){const l=document.createElement("link");l.rel="stylesheet";l.href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";document.head.appendChild(l);}if((window as any).mapboxgl){initMap();return()=>{if(mapInstanceRef.current)mapInstanceRef.current.remove();};}const s=document.createElement("script");s.src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";s.onload=initMap;document.head.appendChild(s);return()=>{if(mapInstanceRef.current)mapInstanceRef.current.remove();};},[]);
  const handleMapSearch=(q:string)=>{markersRef.current.forEach(({el,hotel})=>{el.style.display=!q||hotel.name.toLowerCase().includes(q.toLowerCase())?"block":"none";});if(q&&mapInstanceRef.current){const h=hotelsWithCoords.find(h=>h.name.toLowerCase().includes(q.toLowerCase()));if(h)mapInstanceRef.current.flyTo({center:[h.longitude!,h.latitude!],zoom:14,speed:1.5});}};
  const CB=({active,onClick,label}:{active:boolean;onClick:()=>void;label:string})=>(<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",cursor:"pointer"}}><div style={{width:15,height:15,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:3,background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{active&&<svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}</div><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></div>);
  if(isMobile)return(<div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column"}}><div style={{position:"absolute",top:12,right:12,zIndex:10}}><button onClick={onClose} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:NAVY,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>✕ Close map</button></div><div ref={mapRef} style={{width:"100%",height:"100%"}}/>{selectedHotel&&<div style={{position:"absolute",bottom:20,left:16,right:16,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",overflow:"hidden",zIndex:10,display:"flex"}}><img src={selectedHotel.imageUrl||FALLBACK_IMGS[0]} alt={selectedHotel.name} style={{width:90,height:90,objectFit:"cover",flexShrink:0}}/><div style={{padding:"10px 12px",flex:1}}><div style={{fontWeight:700,fontSize:13,color:NAVY,marginBottom:2}}>{selectedHotel.name}</div><div style={{fontSize:18,fontWeight:800,color:NAVY}}>{formatINR(Math.round((selectedHotel.lowestPriceINR||selectedHotel.minRate||0)/NIGHTS))}</div><div style={{fontSize:11,color:"#64748b"}}>per night</div></div><button onClick={()=>onHotelClick(selectedHotel)} style={{background:B,color:"#fff",border:"none",padding:"0 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View</button></div>}</div>);
  return(<div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column"}}>
    <div ref={chipRef} style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"nowrap",overflowX:"visible",position:"relative",zIndex:99999}}>
      <div style={{fontSize:14,fontWeight:700,color:NAVY,whiteSpace:"nowrap",marginRight:4}}>{hotelsWithCoords.length} hotels</div>
      {filterProps.areaOptions.length>0&&<ChipDropdown id="loc" label={filterProps.filterLocation||"Location"} openChip={openChip} setOpenChip={setOpenChip}>{filterProps.areaOptions.map(a=><CB key={a} active={filterProps.filterLocation===a} onClick={()=>{filterProps.setFilterLocation(filterProps.filterLocation===a?"":a);setOpenChip(null);}} label={a}/>)}</ChipDropdown>}
      <ChipDropdown id="price" label={filterProps.filterPriceMax||filterProps.filterPriceMin?"Price ✓":"Price"} openChip={openChip} setOpenChip={setOpenChip}>{([{label:"Under ₹5,000",min:null,max:5000},{label:"₹5,000–₹10,000",min:5000,max:10000},{label:"₹10,000–₹20,000",min:10000,max:20000},{label:"₹20,000–₹40,000",min:20000,max:40000},{label:"₹40,000+",min:40000,max:null}] as {label:string;min:number|null;max:number|null}[]).map(({label,min,max})=>{const a=filterProps.filterPriceMin===min&&filterProps.filterPriceMax===max;return<CB key={label} active={a} onClick={()=>{a?filterProps.setPriceRange(null,null):filterProps.setPriceRange(min,max);setOpenChip(null);}} label={label}/>;})}</ChipDropdown>
      <ChipDropdown id="stars" label={filterProps.filterStars.length>0?`Stars ✓`:"Stars"} openChip={openChip} setOpenChip={setOpenChip}>{[5,4,3,2,1].map(s=>{const a=filterProps.filterStars.includes(s);return<CB key={s} active={a} onClick={()=>filterProps.setFilterStars(a?filterProps.filterStars.filter(x=>x!==s):[...filterProps.filterStars,s])} label={`${"★".repeat(s)} ${s} Star`}/>;})}</ChipDropdown>
      <ChipDropdown id="rating" label={filterProps.filterRating?`Rating ${filterProps.filterRating}+`:"Rating"} openChip={openChip} setOpenChip={setOpenChip}>{[{label:"Exceptional 9+",min:9},{label:"Excellent 8+",min:8},{label:"Very Good 7+",min:7}].map(({label,min})=><CB key={min} active={filterProps.filterRating===min} onClick={()=>{filterProps.setFilterRating(filterProps.filterRating===min?null:min);setOpenChip(null);}} label={label}/>)}</ChipDropdown>
      <button onClick={()=>filterProps.setFilterRefundable(!filterProps.filterRefundable)} style={{display:"flex",alignItems:"center",gap:6,background:filterProps.filterRefundable?"#dcfce7":"#fff",border:`1.5px solid ${filterProps.filterRefundable?"#16a34a":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:filterProps.filterRefundable?"#16a34a":NAVY,whiteSpace:"nowrap"}}>{filterProps.filterRefundable&&"✓ "}Free Cancellation</button>
      <button onClick={()=>filterProps.setFilterBreakfast(!filterProps.filterBreakfast)} style={{display:"flex",alignItems:"center",gap:6,background:filterProps.filterBreakfast?YELLOW:"#fff",border:`1.5px solid ${filterProps.filterBreakfast?"#d97706":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:filterProps.filterBreakfast?"#92400e":NAVY,whiteSpace:"nowrap"}}>{filterProps.filterBreakfast&&"✓ "}Free Breakfast</button>
      <div style={{flex:1}}/>
      <button onClick={onClose} style={{background:NAVY,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕ Close map</button>
    </div>
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{width:360,flexShrink:0,display:"flex",flexDirection:"column",background:"#f8fafc",borderRight:"1px solid #e2e8f0"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid #e2e8f0",background:"#fff",flexShrink:0}}><div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 12px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="Search hotel on map..." onChange={e=>handleMapSearch(e.target.value)} style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:13,color:NAVY,background:"transparent",width:"100%"}}/></div></div>
        <div ref={listRef} style={{flex:1,overflowY:"auto",padding:10}}>{hotels.map((hotel,idx)=>{const price=Math.round((hotel.lowestPriceINR||hotel.minRate||0)/NIGHTS);const rating=hotel.rating||[9.1,8.9,9.4,9.3,8.7,9.0,8.8,9.2][codeToNum(hotel.code)%8];const isSelected=selectedHotel?.code===hotel.code;return(<div key={String(hotel.code)} data-hotel={hotel.code} onClick={()=>selectHotel(hotel)} style={{background:"#fff",borderRadius:12,border:`1.5px solid ${isSelected?B:"#e2e8f0"}`,marginBottom:8,overflow:"hidden",cursor:"pointer",display:"flex",minHeight:96,transition:"border-color 0.15s"}}><img src={hotel.imageUrl||FALLBACK_IMGS[idx%FALLBACK_IMGS.length]} alt={hotel.name} style={{width:96,height:96,objectFit:"cover",flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[idx%FALLBACK_IMGS.length];}}/><div style={{padding:"10px 12px",flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:700,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hotel.name}</div><div style={{fontSize:12,color:"#f59e0b"}}>{hotel.stars?"★".repeat(hotel.stars):""}</div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:4}}>{rating.toFixed(1)}</span>{hotel.isRefundable&&<span style={{fontSize:10,color:"#16a34a",background:"#dcfce7",padding:"1px 6px",borderRadius:3}}>✓ Free cancel</span>}</div><div style={{fontSize:15,fontWeight:800,color:NAVY}}>{price>0?formatINR(price):"—"}</div></div></div>);})}</div>
      </div>
      <div style={{flex:1,position:"relative"}}>
        <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
        {selectedHotel&&(<div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",width:"min(320px,90%)",background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",overflow:"hidden",zIndex:10}}><button onClick={()=>{setSelectedHotel(null);markersRef.current.forEach(({pinDiv})=>{pinDiv.style.background="#fff";pinDiv.style.color=NAVY;pinDiv.style.transform="scale(1)";});}} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>×</button><img src={selectedHotel.imageUrl||FALLBACK_IMGS[0]} alt={selectedHotel.name} style={{width:"100%",height:130,objectFit:"cover",display:"block"}}/><div style={{padding:"12px 14px"}}><div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:6}}>{selectedHotel.name}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:18,fontWeight:800,color:NAVY}}>{formatINR(Math.round((selectedHotel.lowestPriceINR||selectedHotel.minRate||0)/NIGHTS))}</div><div style={{fontSize:11,color:"#64748b"}}>per night</div></div><button onClick={()=>onHotelClick(selectedHotel)} style={{background:B,color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Hotel</button></div></div></div>)}
      </div>
    </div>
  </div>);
}

export default function SearchPage(){
  return(<Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>Loading…</div>}><SearchResults/></Suspense>);
}

function SearchResults(){
  const searchParams=useSearchParams();const router=useRouter();const isMobile=useIsMobile();const today=new Date();
  const[destination,setDestination]=useState((searchParams.get("destination")||"Dubai").split(",")[0].trim());
  const[checkIn,setCheckIn]=useState(searchParams.get("checkIn")||"");
  const[checkOut,setCheckOut]=useState(searchParams.get("checkOut")||"");
  const[guests,setGuests]=useState<GuestState>({rooms:parseInt(searchParams.get("rooms")||"1"),adults:parseInt(searchParams.get("adults")||"2"),children:parseInt(searchParams.get("children")||"0"),childAges:[]});
  const[hotels,setHotels]=useState<Hotel[]>([]);
  const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);
  const[user,setUser]=useState<{name:string}|null>(null);const[showAuthModal,setShowAuthModal]=useState(false);
  const[showMap,setShowMap]=useState(false);const[favorites,setFavorites]=useState<Set<string|number>>(new Set());
  const[sortBy,setSortBy]=useState("popularity");const[page,setPage]=useState(1);
  const[showCal,setShowCal]=useState(false);const[showGuests,setShowGuests]=useState(false);
  const[mobileSheet,setMobileSheet]=useState<"filter"|"sort"|null>(null);
  const[desktopCalOpen,setDesktopCalOpen]=useState(false);const[desktopCalMode,setDesktopCalMode]=useState<"checkin"|"checkout">("checkin");
  const[desktopCalOffset,setDesktopCalOffset]=useState(0);const[desktopGuestOpen,setDesktopGuestOpen]=useState(false);
  const[destInput,setDestInput]=useState(destination);const[selectedPlaceId,setSelectedPlaceId]=useState(searchParams.get('placeId')||'');const[destSuggestions,setDestSuggestions]=useState<typeof DESTINATIONS>([]);const[showDestDrop,setShowDestDrop]=useState(false);const[destFocused,setDestFocused]=useState(false);
  const destRef=useRef<HTMLDivElement>(null);const desktopCalRef=useRef<HTMLDivElement>(null);const desktopGuestRef=useRef<HTMLDivElement>(null);
  const[chatOpen,setChatOpen]=useState(false);
  const[chatMessages,setChatMessages]=useState<{role:string;content:string}[]>([
    {role:"assistant",content:`Hi! I'm your rebuq AI assistant. Ask me anything about ${""} — best areas, local food, weather, what to pack, or just filter your hotel search. How can I help?`}
  ]);
  const[chatInput,setChatInput]=useState("");
  const[chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef<HTMLDivElement>(null);
  const[filterStars,setFilterStars]=useState<number[]>([]);const[filterBreakfast,setFilterBreakfast]=useState(false);const[filterRefundable,setFilterRefundable]=useState(false);const[filterRating,setFilterRating]=useState<number|null>(null);const[filterPriceMin,setFilterPriceMin]=useState<number|null>(null);const[filterPriceMax,setFilterPriceMax]=useState<number|null>(null);const[filterFacilities,setFilterFacilities]=useState<string[]>([]);const[filterLocation,setFilterLocation]=useState("");const[hotelSearch,setHotelSearch]=useState("");

  // ── Distance reference point from URL ────────────────────────────────────
  const refLat = searchParams.get("refLat") ? parseFloat(searchParams.get("refLat")!) : null;
  const refLng = searchParams.get("refLng") ? parseFloat(searchParams.get("refLng")!) : null;
  const refLabel = searchParams.get("refLabel") || null;

  useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(data.user){const m=data.user.user_metadata;setUser({name:m?.full_name||m?.name||data.user.email?.split("@")[0]||"Member"});}});supabase.auth.onAuthStateChange((_,session)=>{if(session?.user){const m=session.user.user_metadata;setUser({name:m?.full_name||m?.name||session.user.email?.split("@")[0]||"Member"});setShowAuthModal(false);}});},[]);
  useEffect(()=>{const handler=(e:MouseEvent)=>{if(desktopCalRef.current&&!desktopCalRef.current.contains(e.target as Node))setDesktopCalOpen(false);if(desktopGuestRef.current&&!desktopGuestRef.current.contains(e.target as Node))setDesktopGuestOpen(false);if(destRef.current&&!destRef.current.contains(e.target as Node))setShowDestDrop(false);};document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);},[]);
  const handleDestInput=(val:string)=>{setDestInput(val);if(val.length>=1){const q=val.toLowerCase();setDestSuggestions(DESTINATIONS.filter(d=>d.label.toLowerCase().includes(q)||d.key.includes(q)));setShowDestDrop(true);}else{setDestSuggestions([]);setShowDestDrop(false);}};
  const selectDest=(d:typeof DESTINATIONS[0])=>{setDestInput(d.label);setDestination(d.label);setSelectedPlaceId((d as any).placeId||'');setShowDestDrop(false);};

  const fetchHotels=useCallback(async(dest?:string,ci?:string,co?:string,g?:GuestState,pid?:string)=>{
    const d=dest||destination,c1=ci||checkIn,c2=co||checkOut,gs=g||guests;
    const placeId=pid!==undefined?pid:(searchParams.get("placeId")||"");
    if(!c1||!c2){setLoading(false);setError("Please select check-in and check-out dates.");return;}
    setLoading(true);setError(null);setPage(1);setHotels([]);

    const baseUrl=placeId
      ?`${API}/search?placeId=${encodeURIComponent(placeId)}&destination=${encodeURIComponent(d)}&checkIn=${c1}&checkOut=${c2}&adults=${gs.adults}&children=${gs.children}&rooms=${gs.rooms}`
      :`${API}/search?destination=${encodeURIComponent(d)}&checkIn=${c1}&checkOut=${c2}&adults=${gs.adults}&children=${gs.children}&rooms=${gs.rooms}`;

    try{
      // Page 0 first — fast first paint
      const res=await fetch(`${baseUrl}&page=0`,{cache:"no-store"});const data=await res.json();
      if(!data.hotels?.hotels){setError(data.error||"No hotels found.");setLoading(false);return;}
      setHotels(data.hotels.hotels);
      setLoading(false);

      // Only placeId-based searches paginate; destination-only searches return everything in one go
      if(!placeId||!data.hotels.hasMore)return;

      // Pages 1-4 stream in afterwards and get appended silently
      for(let p=1;p<=4;p++){
        try{
          const r=await fetch(`${baseUrl}&page=${p}`,{cache:"no-store"});
          const d=await r.json();
          const more:Hotel[]=d.hotels?.hotels||[];
          if(more.length){
            setHotels(prev=>{
              const seen=new Set(prev.map(h=>String(h.code)));
              const fresh=more.filter(h=>!seen.has(String(h.code)));
              return [...prev,...fresh];
            });
          }
          if(!d.hotels?.hasMore)break;
        }catch{break;}
      }
    }catch{setError("Could not connect to server.");setLoading(false);}
  },[destination,checkIn,checkOut,guests,searchParams]);

  useEffect(()=>{
    const pid = searchParams.get("placeId") || "";
    const dest = searchParams.get("destination") || "";
    const ci = searchParams.get("checkIn") || "";
    const co = searchParams.get("checkOut") || "";
    const adults = parseInt(searchParams.get("adults") || "2");
    const children = parseInt(searchParams.get("children") || "0");
    const rooms = parseInt(searchParams.get("rooms") || "1");
    if (pid && dest) {
      setSelectedPlaceId(pid);
      setDestInput(dest);
      setDestination(dest);
      fetchHotels(dest, ci, co, { adults, children, rooms, childAges: [] }, pid);
    } else {
      fetchHotels();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[searchParams.get("placeId"), searchParams.get("destination"), searchParams.get("checkIn"), searchParams.get("checkOut")]);

  const NIGHTS=checkIn&&checkOut?Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)):1;
  const priceINR=(h:Hotel)=>Math.round(parseFloat(String(h.lowestPriceINR||h.minRate||0))/NIGHTS);
  const getRating=(code:string|number)=>[9.1,8.9,9.4,9.3,8.7,9.0,8.8,9.2][codeToNum(code)%8];
  const getRatingLabel=(r:number)=>r>=9?"Exceptional":r>=8.5?"Excellent":"Very Good";
  const getDiscount=(code:string|number)=>[15,12,10,8,20,18,14,22][codeToNum(code)%8];
  const getImg=(hotel:Hotel,idx:number)=>hotel.imageUrl||FALLBACK_IMGS[idx%FALLBACK_IMGS.length];
  const guestSummary=(g:GuestState)=>`${g.rooms} Room${g.rooms>1?"s":""} · ${g.adults} Adult${g.adults>1?"s":""}${g.children>0?` · ${g.children} Child${g.children>1?"ren":""}` :""}`;
  const getCardAmenities=(hotel:Hotel)=>PRIORITY_AMENITIES.filter(p=>(hotel.amenities||[]).some(a=>a.toLowerCase().includes(p.toLowerCase())));

  // ── Distance helper ───────────────────────────────────────────────────────
  const getDistanceLabel = (hotel: Hotel): string | null => {
    if (!refLat || !refLng || !hotel.latitude || !hotel.longitude) return null;
    return formatDistance(haversineKm(refLat, refLng, hotel.latitude, hotel.longitude));
  };
  const activeRefLabel=refLabel;

  const areaOptions=useMemo(()=>getAreasForCity(destination),[destination]);
  const sendChat=async(msg:string)=>{
    if(!msg.trim()||chatLoading)return;
    const userMsg={role:"user",content:msg};
    const newMsgs=[...chatMessages,userMsg];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);
    try{
      const res=await fetch("https://hoteldrops-production-7e5a.up.railway.app/api/hotels/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          messages:newMsgs,
          destination,checkIn,checkOut,
          hotelCount:hotels.length,
          hotelList:sortedHotels.map(h=>({
            name:h.name,
            stars:h.stars,
            area:h.address||h.city||"",
            price:priceINR(h),
            rating:h.rating||null,
            isRefundable:h.isRefundable||false,
            hasBreakfast:h.hasBreakfast||false,
            amenities:(h.amenities||[]).slice(0,5),
          }))
        })
      });
      const data=await res.json();
      const reply=data.reply||"Sorry, I could not process that.";
      // Check if reply is a filter action
      try{
        const cleaned=reply.replace(/```json|```/g,"").trim();
        const parsed=JSON.parse(cleaned);
        if(parsed.action==="filter"){
          // Clear all previous filters first
          setFilterStars([]);setFilterPriceMax(null);setFilterPriceMin(null);
          setFilterRefundable(false);setFilterBreakfast(false);setFilterRating(null);
          setHotelSearch("");setFilterLocation("");setFilterFacilities([]);
          if(parsed.clearAll){setChatMessages(m=>[...m,{role:"assistant",content:parsed.message||"Showing all hotels!"}]);return;}
          // Apply new filters
          if(parsed.stars)setFilterStars([parsed.stars]);
          if(parsed.priceMax)setFilterPriceMax(parsed.priceMax);
          if(parsed.priceMin)setFilterPriceMin(parsed.priceMin);
          if(parsed.isRefundable)setFilterRefundable(true);
          if(parsed.hasBreakfast)setFilterBreakfast(true);
          if(parsed.minRating)setFilterRating(parsed.minRating);
          if(parsed.hotelName)setHotelSearch(parsed.hotelName);
          if(parsed.area)setFilterLocation(parsed.area);
          if(parsed.amenity){
            const amenityMap:Record<string,string>={pool:"Swimming Pool",spa:"Spa & Wellness",gym:"Fitness Centre",restaurant:"Restaurant",wifi:"Free WiFi",breakfast:"Breakfast",parking:"Parking",bar:"Bar"};
            const key=parsed.amenity.toLowerCase();
            const mapped=Object.keys(amenityMap).find(k=>key.includes(k));
            if(mapped)setFilterFacilities([amenityMap[mapped]]);
          }
          setChatMessages(m=>[...m,{role:"assistant",content:parsed.message||"Done! Filters applied — check the results list."}]);
        } else {
          setChatMessages(m=>[...m,{role:"assistant",content:reply}]);
        }
      }catch{
        setChatMessages(m=>[...m,{role:"assistant",content:reply}]);
      }
    }catch{
      setChatMessages(m=>[...m,{role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again."}]);
    }
    setChatLoading(false);
    setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  const clearAllFilters=()=>{setFilterStars([]);setFilterBreakfast(false);setFilterRefundable(false);setFilterRating(null);setFilterPriceMax(null);setFilterPriceMin(null);setFilterFacilities([]);setFilterLocation("");setHotelSearch("");};
  const hasActiveFilters=filterStars.length>0||filterBreakfast||filterRefundable||filterRating!==null||filterPriceMax!==null||filterPriceMin!==null||filterFacilities.length>0||!!filterLocation||!!hotelSearch;

  const filteredHotels=useMemo(()=>hotels.filter(h=>{const price=priceINR(h);if(hotelSearch&&!h.name.toLowerCase().includes(hotelSearch.toLowerCase()))return false;if(filterStars.length>0&&!filterStars.includes(h.stars||0))return false;if(filterBreakfast&&!h.hasBreakfast)return false;if(filterRefundable&&h.isRefundable!==true)return false;if(filterRating!==null){const r=h.rating||getRating(h.code);if(r<filterRating)return false;}if(filterPriceMin!==null&&price<filterPriceMin)return false;if(filterPriceMax!==null&&price>filterPriceMax)return false;if(filterFacilities.length>0){const am=(h.amenities||[]).map(a=>a.toLowerCase());if(!filterFacilities.every(f=>am.some(a=>a.includes(f.toLowerCase()))))return false;}if(filterLocation){const addr=(h.address||h.city||"").toLowerCase();if(!addr.includes(filterLocation.toLowerCase()))return false;}return true;}),[hotels,hotelSearch,filterStars,filterBreakfast,filterRefundable,filterRating,filterPriceMin,filterPriceMax,filterFacilities,filterLocation]);

  const sortedHotels=useMemo(()=>[...filteredHotels].sort((a,b)=>{
    if(sortBy==="price-low")return priceINR(a)-priceINR(b);
    if(sortBy==="price-high")return priceINR(b)-priceINR(a);
    if(sortBy==="rating")return(b.rating||getRating(b.code))-(a.rating||getRating(a.code));
    if(sortBy==="stars")return(b.stars||0)-(a.stars||0);
    // Distance sort — when landmark active OR sortBy=distance
    const rlat=refLat;const rlng=refLng;
    if((sortBy==="distance"||(rlat&&rlng))&&rlat&&rlng){
      const da=a.latitude&&a.longitude?haversineKm(rlat,rlng,a.latitude,a.longitude):9999;
      const db=b.latitude&&b.longitude?haversineKm(rlat,rlng,b.latitude,b.longitude):9999;
      return da-db;
    }
    return 0;
  }),[filteredHotels,sortBy,refLat,refLng]);

  const perPage=10;const paginatedHotels=sortedHotels.slice((page-1)*perPage,page*perPage);const totalPages=Math.ceil(sortedHotels.length/perPage);
  const filterProps:FiltersPanelProps={destination,areaOptions,filterLocation,setFilterLocation,filterPriceMin,filterPriceMax,setPriceRange:(min,max)=>{setFilterPriceMin(min);setFilterPriceMax(max);},filterRefundable,setFilterRefundable,filterBreakfast,setFilterBreakfast,filterRating,setFilterRating,filterStars,setFilterStars,filterFacilities,setFilterFacilities,hasActiveFilters,clearAllFilters,onHotelSearch:setHotelSearch};

  const handleSearch=()=>{
    if(!user){setShowAuthModal(true);return;}
    const d=destInput.trim()||destination;
    const currentPlaceId=selectedPlaceId||searchParams.get("placeId")||"";
    const p=new URLSearchParams({destination:d,checkIn,checkOut,adults:String(guests.adults),rooms:String(guests.rooms),children:String(guests.children)});
    if(currentPlaceId)p.set("placeId",currentPlaceId);
    // Hard navigation forces full remount so new city loads fresh
    window.location.href=`/search?${p.toString()}`;
  };

  const handleHotelClick=(hotel:Hotel)=>{if(!user){setShowAuthModal(true);return;}window.open(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&rooms=${guests.rooms}&children=${guests.children}`,'_blank');};
  const desktopDayClick=(ds:string)=>{if(desktopCalMode==="checkin"){setCheckIn(ds);setCheckOut("");setDesktopCalMode("checkout");}else{if(ds<=checkIn)return;setCheckOut(ds);setDesktopCalOpen(false);}};

  const renderDesktopMonth=(year:number,month:number)=>{
    const todayStr=toDateStr(today.getFullYear(),today.getMonth(),today.getDate());
    const days=getDaysInMonth(year,month);const firstDow=getFirstDow(year,month);
    return(<div key={`${year}-${month}`} style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:NAVY,textAlign:"center",marginBottom:12}}>{MONTHS[month]} {year}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{DOWS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",paddingBottom:6}}>{d}</div>)}{Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}{Array.from({length:days}).map((_,i)=>{const day=i+1;const ds=toDateStr(year,month,day);const isDisabled=ds<todayStr;let bg="transparent",clr=isDisabled?"#cbd5e1":NAVY,br="50%",fw=400;if(ds===checkIn&&!!checkOut){bg=B;clr="#fff";br="50% 0 0 50%";fw=700;}else if(ds===checkOut){bg=B;clr="#fff";br="0 50% 50% 0";fw=700;}else if(ds===checkIn&&!checkOut){bg=B;clr="#fff";br="50%";fw=700;}else if(checkIn&&checkOut&&ds>checkIn&&ds<checkOut){bg="#dbeafe";clr=B;br="0";}else if(ds===todayStr)clr=B;return<div key={day} onClick={()=>!isDisabled&&desktopDayClick(ds)} style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:clr,borderRadius:br,fontWeight:fw,fontSize:13,cursor:isDisabled?"not-allowed":"pointer",opacity:isDisabled?0.35:1}}>{day}</div>;})}</div></div>);
  };

  const d1=new Date(today.getFullYear(),today.getMonth()+desktopCalOffset);
  const d2=new Date(today.getFullYear(),today.getMonth()+desktopCalOffset+1);

  return(
    <div style={{fontFamily:"'Inter',sans-serif",background:"#f8fafc",color:"#1e293b",minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.sora{font-family:'Sora',sans-serif;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.hcard{background:#fff;border-radius:12px;border:1.5px solid #e2e8f0;margin-bottom:16px;display:grid;grid-template-columns:260px 1fr;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);transition:box-shadow .2s,transform .2s;cursor:pointer;min-height:210px;animation:fadeIn 0.3s ease;}.hcard:hover{box-shadow:0 8px 32px rgba(0,0,0,0.12);transform:translateY(-2px);}.hcard-img{position:relative;width:260px;min-height:210px;overflow:hidden;flex-shrink:0;}.hcard-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}.hcard-m{background:#fff;border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);cursor:pointer;animation:fadeIn 0.3s ease;}.sfd{cursor:pointer;transition:background 0.15s;}.sfd:hover{background:rgba(0,0,0,0.02);}.pgb{width:38px;height:38px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:${NAVY};font-size:14px;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;}.pgb:hover{border-color:${B};color:${B};}.pgb.on{background:${B};color:#fff;border-color:${B};}.btb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px;color:${NAVY};font-weight:500;padding:8px 0;}@keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}.skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:800px 100%;animation:shimmer 1.5s infinite;border-radius:6px;}`}</style>

      {showAuthModal&&<AuthModal onClose={()=>setShowAuthModal(false)}/>}
      {showMap&&<MapView hotels={filteredHotels.length>0?filteredHotels:hotels} checkIn={checkIn} checkOut={checkOut} filterProps={filterProps} onClose={()=>setShowMap(false)} onHotelClick={h=>{setShowMap(false);handleHotelClick(h);}} isMobile={isMobile}/>}
      {isMobile&&showCal&&<CalendarScreen checkIn={checkIn} checkOut={checkOut} onSelect={(ci,co)=>{setCheckIn(ci);setCheckOut(co);}} onClose={()=>setShowCal(false)}/>}
      {isMobile&&showGuests&&<GuestsScreen guests={guests} onSelect={setGuests} onClose={()=>setShowGuests(false)}/>}
      {isMobile&&mobileSheet==="filter"&&<BottomSheet title="Filters" onClose={()=>setMobileSheet(null)} onClear={clearAllFilters}><FiltersPanel {...filterProps}/></BottomSheet>}
      {isMobile&&mobileSheet==="sort"&&<BottomSheet title="Sort by" onClose={()=>setMobileSheet(null)}>{[{val:"popularity",label:"Popularity"},{val:"price-low",label:"Price: Low to High"},{val:"price-high",label:"Price: High to Low"},{val:"rating",label:"User Rating"},{val:"stars",label:"Star Rating"}].map(opt=><div key={opt.val} onClick={()=>{setSortBy(opt.val);setMobileSheet(null);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid #f8fafc",cursor:"pointer"}}><span style={{fontSize:16,fontWeight:500,color:NAVY}}>{opt.label}</span><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${sortBy===opt.val?B:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{sortBy===opt.val&&<div style={{width:10,height:10,borderRadius:"50%",background:B}}/>}</div></div>)}</BottomSheet>}

      <nav style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:isMobile?"0 20px":"0 32px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:300}}>
        <a href="/" style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:NAVY,textDecoration:"none"}}>rebuq<span style={{color:B}}>.</span></a>
        {!isMobile&&<div style={{display:"flex",gap:24,alignItems:"center"}}><a href="/search-hotels" style={{fontSize:14,color:B,textDecoration:"none",fontWeight:600}}>Exclusive Member Deals</a>{user?<div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>window.location.href="/dashboard"}><div style={{width:32,height:32,borderRadius:"50%",background:B,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{user.name[0].toUpperCase()}</div><span style={{fontSize:14,fontWeight:600,color:NAVY}}>{user.name.split(" ")[0]}</span></div>:<button onClick={()=>setShowAuthModal(true)} style={{background:B,color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign in</button>}</div>}
      </nav>

      {/* Distance reference banner */}
      {activeRefLabel&&<div style={{background:"#eff6ff",borderBottom:"1px solid #bfdbfe",padding:"8px 32px",fontSize:13,color:B,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        Showing hotels near <strong>{activeRefLabel}</strong> — sorted by distance
      </div>}

      {isMobile&&<div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",position:"sticky",top:60,zIndex:200,display:"flex",alignItems:"center",gap:10}}><button onClick={()=>router.back()} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b",flexShrink:0}}>←</button><div style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:100,padding:"10px 16px",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setShowCal(true)}><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,color:NAVY,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{destination}</div><div style={{fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{checkIn&&checkOut?`${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`:"Select dates"} · {guestSummary(guests)}</div></div></div></div>}

      {!isMobile&&<div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 32px",position:"sticky",top:60,zIndex:200}}>
        <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.3fr auto",alignItems:"stretch",height:64,overflow:"visible",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <div ref={destRef} className="sfd" style={{padding:"0 20px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",borderRadius:"12px 0 0 12px",position:"relative"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Destination</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}><input value={destInput} onChange={e=>handleDestInput(e.target.value)} onFocus={()=>{setDestFocused(true);if(destInput.length>=1)setShowDestDrop(true);}} onBlur={()=>{setTimeout(()=>{setDestFocused(false);if(!destInput.trim())setDestInput(destination);setShowDestDrop(false);},200);}} onKeyDown={e=>{if(e.key==="Enter"){setShowDestDrop(false);handleSearch();}if(e.key==="Escape"){setDestInput(destination);setShowDestDrop(false);}}} placeholder="City or destination" style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:15,fontWeight:600,color:NAVY,background:"transparent",padding:0,flex:1}}/>{destInput&&destFocused&&<button onClick={()=>{setDestInput("");setDestSuggestions([]);setShowDestDrop(false);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:18,padding:"0 2px",flexShrink:0,lineHeight:1}}>×</button>}</div>
            {showDestDrop&&destSuggestions.length>0&&<div style={{position:"absolute",top:"calc(100% + 10px)",left:0,width:"100%",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",zIndex:9999,maxHeight:280,overflowY:"auto"}}>{destSuggestions.map(d=><div key={d.key} onClick={()=>selectDest(d)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid #f8fafc",transition:"background 0.1s"}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="#fff")}><span style={{fontSize:20}}>{d.flag}</span><div><div style={{fontSize:14,fontWeight:600,color:NAVY}}>{d.label}</div><div style={{fontSize:12,color:"#94a3b8"}}>{d.country}</div></div></div>)}</div>}
          </div>
          <div className="sfd" style={{padding:"0 18px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",background:desktopCalOpen&&desktopCalMode==="checkin"?"#f0f7ff":"transparent"}} onClick={()=>{setDesktopCalMode("checkin");setDesktopCalOpen(true);setDesktopCalOffset(0);}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-in</div>
            <div style={{fontSize:14,fontWeight:checkIn?600:400,color:checkIn?NAVY:"#94a3b8"}}>{checkIn?formatDate(checkIn):"Add date"}</div>
          </div>
          <div className="sfd" style={{padding:"0 18px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",background:desktopCalOpen&&desktopCalMode==="checkout"?"#f0f7ff":"transparent"}} onClick={()=>{setDesktopCalMode("checkout");setDesktopCalOpen(true);setDesktopCalOffset(0);}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-out</div>
            <div style={{fontSize:14,fontWeight:checkOut?600:400,color:checkOut?NAVY:"#94a3b8"}}>{checkOut?formatDate(checkOut):"Add date"}</div>
          </div>
          <div ref={desktopGuestRef} className="sfd" style={{padding:"0 18px",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative"}} onClick={()=>setDesktopGuestOpen(!desktopGuestOpen)}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Rooms & Guests</div>
            <div style={{fontSize:14,fontWeight:600,color:NAVY}}>{guestSummary(guests)} <span style={{fontSize:9,color:"#94a3b8"}}>▼</span></div>
            {desktopGuestOpen&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 10px)",right:0,width:340,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",zIndex:9999,padding:18}}>
              {([["Rooms","1+","rooms",1,4],["Adults","13+","adults",1,16],["Children","0–12","children",0,8]] as [string,string,"rooms"|"adults"|"children",number,number][]).map(([label,sub,key,mn,mx])=><div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}><div><div style={{fontSize:14,fontWeight:600,color:NAVY}}>{label}</div><div style={{fontSize:12,color:"#94a3b8"}}>Age {sub}</div></div><div style={{display:"flex",alignItems:"center",gap:12}}><button disabled={guests[key]<=mn} onClick={e=>{e.stopPropagation();setGuests(prev=>{const n={...prev,[key]:Math.max(mn,prev[key]-1)};if(key==="children")n.childAges=n.childAges.slice(0,n.children);return n;});}} style={{width:32,height:32,borderRadius:6,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:guests[key]<=mn?0.3:1}}>−</button><span style={{fontSize:15,fontWeight:700,color:NAVY,minWidth:20,textAlign:"center"}}>{guests[key]}</span><button disabled={guests[key]>=mx} onClick={e=>{e.stopPropagation();setGuests(prev=>{const n={...prev,[key]:Math.min(mx,prev[key]+1)};if(key==="children"){n.childAges=[...n.childAges];while(n.childAges.length<n.children)n.childAges.push(5);}return n;});}} style={{width:32,height:32,borderRadius:6,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:guests[key]>=mx?0.3:1}}>+</button></div></div>)}
              {guests.children>0&&<div style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:13,color:"#64748b",marginBottom:8}}>Age of children</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Array.from({length:guests.children}).map((_,idx)=><div key={idx}><div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Child {idx+1}</div><select value={guests.childAges[idx]??5} onChange={e=>{e.stopPropagation();setGuests(prev=>{const ages=[...prev.childAges];ages[idx]=parseInt(e.target.value);return{...prev,childAges:ages};});}} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:6,padding:"6px 8px",fontSize:13,fontFamily:"inherit",color:NAVY,background:"#fff"}}>{Array.from({length:13},(_,a)=><option key={a} value={a}>{a===0?"Under 1":`${a} yr`}</option>)}</select></div>)}</div></div>}
              <button onClick={()=>setDesktopGuestOpen(false)} style={{width:"100%",background:B,color:"#fff",border:"none",borderRadius:10,padding:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>Done</button>
            </div>}
          </div>
          <button onClick={handleSearch} style={{background:YELLOW,color:"#1a1a1a",border:"none",padding:"0 28px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",borderRadius:"0 12px 12px 0",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
          </button>
          {desktopCalOpen&&<div ref={desktopCalRef} onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 10px)",left:"28%",width:620,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,boxShadow:"0 8px 40px rgba(0,0,0,0.16)",zIndex:9999,padding:22}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8}}><button onClick={()=>setDesktopCalOffset(p=>Math.max(0,p-1))} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>‹</button><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,flex:1}}>{renderDesktopMonth(d1.getFullYear(),d1.getMonth())}{renderDesktopMonth(d2.getFullYear(),d2.getMonth())}</div><button onClick={()=>setDesktopCalOffset(p=>p+1)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>›</button></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #f1f5f9",paddingTop:12,marginTop:8}}><div style={{fontSize:13,color:"#64748b"}}>{checkIn&&checkOut&&<span style={{color:"#16a34a",fontWeight:600}}>✓ {formatDate(checkIn)} → {formatDate(checkOut)}</span>}</div><button onClick={()=>{setCheckIn("");setCheckOut("");}} style={{background:"none",border:"none",fontSize:13,color:"#94a3b8",cursor:"pointer",fontFamily:"inherit"}}>Clear</button></div>
          </div>}
        </div>
      </div>}

      <div style={{padding:isMobile?"16px 16px 100px":"20px 32px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"268px 1fr",gap:22}}>
          {!isMobile&&<div style={{minWidth:0}}>
            <div style={{borderRadius:12,overflow:"hidden",marginBottom:16,border:"1.5px solid #e2e8f0",cursor:"pointer",position:"relative"}} onClick={()=>setShowMap(true)}>
              <img src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${hotels.find(h=>h.longitude&&h.latitude)?`${hotels.find(h=>h.longitude&&h.latitude)!.longitude},${hotels.find(h=>h.longitude&&h.latitude)!.latitude},11`:"55.2708,25.2048,11"}/268x140?access_token=${MAPBOX_TOKEN}`} alt="Map" style={{width:"100%",height:140,objectFit:"cover",display:"block"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:28,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{background:"rgba(255,255,255,0.92)",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,color:NAVY,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>🗺️ {hotels.filter(h=>h.latitude&&h.longitude).length} hotels on map</div></div>
              <div style={{padding:"9px 14px",background:"#fff",textAlign:"center",color:B,fontSize:13,fontWeight:700,borderTop:"1px solid #e2e8f0"}}>📍 Explore on Map</div>
            </div>
            <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #e2e8f0",padding:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div className="sora" style={{fontSize:16,fontWeight:700,color:NAVY}}>Filters</div>{hasActiveFilters&&<button onClick={clearAllFilters} style={{background:"none",border:"none",fontSize:12,color:B,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear all</button>}</div>
              <FiltersPanel {...filterProps}/>
            </div>
          </div>}

          <div style={{minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <span className="sora" style={{fontSize:isMobile?18:22,fontWeight:800,color:NAVY}}>
                  {activeRefLabel ? `Hotels near ${activeRefLabel}` : `Hotels in ${destination}`}
                </span>
                {!loading&&<span style={{fontSize:13,color:"#64748b",marginLeft:8}}>{sortedHotels.length} properties found</span>}
              </div>
              {!isMobile&&<select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",color:NAVY,background:"#fff",cursor:"pointer",outline:"none"}}>
                {(activeRefLabel)&&<option value="distance">Nearest first</option>}
                <option value="popularity">Sort by: Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">User Rating</option>
                <option value="stars">Star Rating</option>
              </select>}
            </div>

            {loading&&<div>{Array.from({length:5}).map((_,i)=><div key={i} className="hcard" style={{marginBottom:16}}><div style={{width:260,minHeight:210,background:"#f0f0f0",flexShrink:0}}/><div style={{padding:"18px 22px",flex:1,display:"flex",flexDirection:"column",gap:12}}><div className="skeleton" style={{height:20,width:"70%"}}/><div className="skeleton" style={{height:14,width:"40%"}}/><div style={{display:"flex",gap:8}}><div className="skeleton" style={{height:28,width:50,borderRadius:6}}/><div className="skeleton" style={{height:28,width:100}}/></div><div style={{display:"flex",gap:16}}><div className="skeleton" style={{height:14,width:80}}/><div className="skeleton" style={{height:14,width:80}}/><div className="skeleton" style={{height:14,width:80}}/></div><div style={{marginTop:"auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div className="skeleton" style={{height:36,width:120}}/><div className="skeleton" style={{height:44,width:100,borderRadius:10}}/></div></div></div>)}</div>}
            {error&&!loading&&<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>🏨</div><div style={{fontSize:15,fontWeight:600,color:NAVY,marginBottom:6}}>{error}</div><button onClick={()=>router.push("/search-hotels")} style={{background:B,color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,marginTop:16}}>← Back to search</button></div>}

            {!user&&!loading&&hotels.length>0&&<div style={{position:"relative"}}>
              <div style={{filter:"blur(4px)",pointerEvents:"none",userSelect:"none"}}>{paginatedHotels.slice(0,2).map((hotel,idx)=><div key={String(hotel.code)} className="hcard"><div className="hcard-img"><img src={getImg(hotel,idx)} alt={hotel.name}/></div><div style={{padding:"18px 22px"}}><div className="sora" style={{fontSize:17,fontWeight:700,color:NAVY}}>{hotel.name}</div><div style={{fontSize:24,fontWeight:800,color:NAVY,marginTop:8}}>{priceINR(hotel)>0?formatINR(priceINR(hotel)):"Price on request"}</div></div></div>)}</div>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(248,250,252,0.7)",backdropFilter:"blur(2px)",borderRadius:12}}>
                <div onClick={()=>setShowAuthModal(true)} style={{background:"#fff",borderRadius:20,padding:"32px 36px",textAlign:"center",boxShadow:"0 16px 48px rgba(0,0,0,0.15)",cursor:"pointer",maxWidth:380,width:"90%"}}>
                  <div style={{fontSize:36,marginBottom:12}}>🔒</div><div className="sora" style={{fontSize:20,fontWeight:800,color:NAVY,marginBottom:8}}>Sign in to see member rates</div>
                  <div style={{fontSize:14,color:"#64748b",marginBottom:20,lineHeight:1.6}}>{hotels.length} hotels found in {destination}. Sign in free to unlock exclusive rates.</div>
                  <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"13px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:NAVY}}>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google — it&apos;s free
                  </button>
                </div>
              </div>
            </div>}

            {!loading&&!error&&user&&paginatedHotels.map((hotel,idx)=>{
              const rating=hotel.rating||getRating(hotel.code);const discount=getDiscount(hotel.code);const price=priceINR(hotel);const globalIdx=(page-1)*perPage+idx;const cardAmenities=getCardAmenities(hotel);
              const area=hotel.city||null;
              const distLabel=getDistanceLabel(hotel);
              // Prefer a specific area/neighbourhood (first segment of the address) over the
              // generic city name, which is identical for every hotel and not useful as a label.
              const shortAddress=hotel.address?hotel.address.split(",")[0].trim():null;
              // Location line: distance from ref if available, else neighbourhood, else city
              const locationLine = distLabel
                ? `${distLabel} from ${activeRefLabel}`
                : (shortAddress&&shortAddress.toLowerCase()!==String(area||"").toLowerCase()?shortAddress:null) || area || hotel.address || destination;

              return isMobile?(
                <div key={String(hotel.code)} className="hcard-m" onClick={()=>handleHotelClick(hotel)}>
                  <div style={{position:"relative",height:200}}>
                    <img src={getImg(hotel,globalIdx)} alt={hotel.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[globalIdx%FALLBACK_IMGS.length];}}/>
                    <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.95)",color:NAVY,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6}}>↗ Trending</div>
                  </div>
                  <div style={{padding:"14px 16px 16px"}}>
                    <div className="sora" style={{fontSize:16,fontWeight:700,color:NAVY,marginBottom:3}}>{hotel.name}</div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                      {hotel.stars?<span style={{color:"#f59e0b"}}>{"★".repeat(hotel.stars)}</span>:null}
                      <span>· <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{display:"inline-block",verticalAlign:"-1px",flexShrink:0}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg> {locationLine}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:6}}>{rating.toFixed(1)}</span>
                      <span style={{fontSize:13,fontWeight:600,color:NAVY}}>{getRatingLabel(rating)}</span>
                      {hotel.isRefundable!=null&&<span style={{fontSize:11,fontWeight:600,color:hotel.isRefundable?"#16a34a":"#dc2626",background:hotel.isRefundable?"#dcfce7":"#fee2e2",padding:"2px 7px",borderRadius:5}}>{hotel.isRefundable?"✓ Refundable":"Non-refundable"}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                      <div>{price>0?(<>{hotel.otaPriceINR&&hotel.otaPriceINR>price?<div style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,marginBottom:4,display:"inline-block"}}>Members save {formatINR(hotel.otaPriceINR-price)}</div>:<div style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,marginBottom:4,display:"inline-block"}}>{discount}% off</div>}<div style={{fontSize:12,color:"#94a3b8",textDecoration:"line-through"}}>{formatINR(hotel.otaPriceINR&&hotel.otaPriceINR>price?hotel.otaPriceINR:Math.round(price*(1+discount/100)))}</div><div className="sora" style={{fontSize:22,fontWeight:800,color:NAVY}}>{formatINR(price)}</div><div style={{fontSize:11,color:"#64748b"}}>Taxes included · per night</div></>):<div style={{fontSize:13,color:"#64748b"}}>Price on request</div>}</div>
                      <button style={{background:B,color:"#fff",border:"none",borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Book Now</button>
                    </div>
                  </div>
                </div>
              ):(
                <div key={String(hotel.code)} className="hcard" onClick={()=>handleHotelClick(hotel)}>
                  <div className="hcard-img">
                    <img src={getImg(hotel,globalIdx)} alt={hotel.name} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[globalIdx%FALLBACK_IMGS.length];}}/>
                    <div style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,0.95)",color:NAVY,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6}}>↗ Trending</div>
                  </div>
                  <div style={{padding:"18px 20px 18px 22px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                        <div style={{flex:1}}>
                          <div className="sora" style={{fontSize:17,fontWeight:700,color:NAVY,marginBottom:4}}>{hotel.name}{hotel.stars?<span style={{color:"#f59e0b",fontSize:12,marginLeft:6}}>{"★".repeat(hotel.stars)}</span>:null}</div>
                          <div style={{fontSize:12.5,color:"#64748b",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
                            <span><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{display:"inline-block",verticalAlign:"-1px",flexShrink:0}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></span>
                            <span>{locationLine}</span>
                            {distLabel&&<span style={{background:"#eff6ff",color:B,fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:10,marginLeft:4}}>{distLabel} away</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                            <span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:12.5,fontWeight:700,padding:"3px 8px",borderRadius:6}}>{rating.toFixed(1)}</span>
                            <span style={{fontSize:13,fontWeight:600,color:NAVY}}>{getRatingLabel(rating)}</span>
                            {hotel.isRefundable!=null&&<span style={{fontSize:11,fontWeight:600,color:hotel.isRefundable?"#16a34a":"#dc2626",background:hotel.isRefundable?"#dcfce7":"#fee2e2",padding:"2px 7px",borderRadius:5}}>{hotel.isRefundable?"Free Cancellation":"Non-refundable"}</span>}
                          </div>
                          {cardAmenities.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",marginBottom:8}}>{cardAmenities.map((a,i)=><span key={i} style={{fontSize:12.5,color:"#475569"}}>• {a}</span>)}</div>}
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          {price>0?(<>{hotel.otaPriceINR&&hotel.otaPriceINR>price?<div style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,marginBottom:4,display:"inline-block"}}>Members save {formatINR(hotel.otaPriceINR-price)}</div>:<div style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,marginBottom:4,display:"inline-block"}}>{discount}% off</div>}<div style={{fontSize:12,color:"#64748b",textDecoration:"line-through"}}>{formatINR(hotel.otaPriceINR&&hotel.otaPriceINR>price?hotel.otaPriceINR:Math.round(price*(1+discount/100)))}</div><div className="sora" style={{fontSize:24,fontWeight:800,color:NAVY}}>{formatINR(price)}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>Taxes included · per night</div></>):<div style={{fontSize:13,color:"#64748b"}}>Price on request</div>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>{hotel.hasBreakfast?<div style={{display:"inline-flex",alignItems:"center",gap:6,background:YELLOW,color:"#92400e",borderRadius:8,padding:"8px 14px",fontSize:12.5,fontWeight:600}}><IconBreakfast/> Free Breakfast</div>:<div/>}<button style={{background:B,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Book Now</button></div>
                  </div>
                </div>
              );
            })}

            {!loading&&!error&&totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginTop:24}}>{page>1&&<button className="pgb" onClick={()=>{setPage(p=>p-1);window.scrollTo({top:0,behavior:"smooth"});}}>‹</button>}{Array.from({length:Math.min(totalPages,5)},(_,i)=>{const p=Math.max(1,page-2)+i;if(p>totalPages)return null;return<button key={p} className={`pgb${page===p?" on":""}`} onClick={()=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"});}}>{p}</button>;})} {page<totalPages&&<button className="pgb" onClick={()=>{setPage(p=>Math.min(p+1,totalPages));window.scrollTo({top:0,behavior:"smooth"});}}>›</button>}</div>}
          </div>
        </div>
      </div>

      {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #e2e8f0",display:"flex",zIndex:400,paddingBottom:"env(safe-area-inset-bottom)"}}>
        <button className="btb" onClick={()=>setMobileSheet("filter")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet==="filter"?B:"#64748b"} strokeWidth="2"><path d="M3 4h18M7 8h10M11 12h2M13 16h-2"/></svg><span style={{color:mobileSheet==="filter"?B:"#64748b"}}>Filter</span></button>
        <button className="btb" onClick={()=>setShowMap(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span style={{color:"#64748b"}}>Map</span></button>
        <button className="btb" onClick={()=>setMobileSheet("sort")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet==="sort"?B:"#64748b"} strokeWidth="2"><path d="M3 6h18M7 12h10M11 18h2"/></svg><span style={{color:mobileSheet==="sort"?B:"#64748b"}}>Sort</span></button>
        {!user&&<button className="btb" onClick={()=>setShowAuthModal(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span style={{color:B,fontWeight:700}}>Sign in</span></button>}
      </div>}

      {/* FLOATING AI CHAT WIDGET */}
      <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:12}}>
        {chatOpen&&(
          <div style={{width:360,height:520,background:"#fff",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden",border:"1.5px solid #e2e8f0"}}>
            <div style={{background:`linear-gradient(135deg,${NAVY},${B})`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:"rgba(255,255,255,0.18)",borderRadius:8,padding:"4px 8px",display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:14,color:"#fff"}}>r.</span>
                  <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>AI</span>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>rebuq Assistant</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.65)",display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80"}}/>
                    Powered by Claude AI
                  </div>
                </div>
              </div>
              <button onClick={()=>setChatOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
              {chatMessages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?B:"#f1f5f9",color:m.role==="user"?"#fff":NAVY,fontSize:13,lineHeight:1.6}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading&&(
                <div style={{display:"flex",justifyContent:"flex-start"}}>
                  <div style={{background:"#f1f5f9",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",display:"flex",gap:4,alignItems:"center"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#94a3b8",animation:"pulse 1s ease-in-out 0s infinite"}}/>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#94a3b8",animation:"pulse 1s ease-in-out 0.2s infinite"}}/>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#94a3b8",animation:"pulse 1s ease-in-out 0.4s infinite"}}/>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            {chatMessages.length<=1&&(
              <div style={{padding:"0 12px 8px",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
                {[`Best areas in ${destination}`,`Local food near hotels`,`Weather in ${destination}`,`Is ₹8,000 good value?`].map(p=>(
                  <button key={p} onClick={()=>sendChat(p)} style={{background:"#eff6ff",color:B,border:"none",borderRadius:20,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>
                ))}
              </div>
            )}
            <div style={{padding:"12px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,flexShrink:0}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendChat(chatInput);}} placeholder="Ask anything about your trip..." style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:NAVY,outline:"none"}}/>
              <button onClick={()=>sendChat(chatInput)} disabled={!chatInput.trim()||chatLoading} style={{background:B,color:"#fff",border:"none",borderRadius:10,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:!chatInput.trim()||chatLoading?0.5:1,flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
        <button onClick={()=>setChatOpen(p=>!p)} style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${NAVY},${B})`,border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(20,71,184,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:1}}>
          {chatOpen?(
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ):(
            <>
              <span style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:15,color:"#fff",lineHeight:1}}>r.</span>
              <span style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.8)",letterSpacing:"0.05em"}}>AI</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
