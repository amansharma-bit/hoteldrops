"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const YELLOW = "#FCD34D";
const NAVY = "#0f172a";
const API = "https://hoteldrops-production-7e5a.up.railway.app";
const MAPBOX_TOKEN = "pk.eyJ1Ijoib21zYWlyYW0wMSIsImEiOiJjbXB4bngxdWwwMWI2MnBzZ3p2dGM3bW5rIn0.8qCkSAodMjGVg6qhiCZHzw";

// One fresh sessionId per real search (new destination/dates) — keeps rates
// consistent listing→detail when liteAPI's price-consistency feature is on.
function genSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Builds a flag emoji from a 2-letter ISO country code — no hardcoded lookup table needed.
function countryCodeToFlag(cc?: string): string {
  if (!cc || cc.length !== 2) return "";
  const code = cc.toUpperCase();
  return String.fromCodePoint(...code.split("").map(c => 0x1F1E6 + (c.charCodeAt(0) - 65)));
}

// Clean city-only autocomplete, sourced from liteAPI's own city/country data
// via the backend — no Mapbox, no landmarks, no embassies/councils/rivers.
async function fetchCitySuggestions(query: string): Promise<any[]> {
  try {
    const res = await fetch(`${API}/api/hotels/cities-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.cities || []).map((c: any) => ({
      type: c.type || "city",
      name: c.name,
      countryName: c.countryName || "",
      countryCode: c.countryCode || "",
      flag: c.flag || "",
      placeId: null,
      lat: c.lat ?? null,
      lng: c.lng ?? null,
      radius: c.radius ?? null,
      placeTypes: c.placeTypes || ["place"],
    }));
  } catch {
    return [];
  }
}


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getDaysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number): number { return new Date(y, m, 1).getDay(); }

function getDefaultDates() {
  const today = new Date();
  const ci = new Date(today); ci.setDate(today.getDate() + 14);
  const co = new Date(today); co.setDate(today.getDate() + 15);
  return {
    checkIn: toDateStr(ci.getFullYear(), ci.getMonth(), ci.getDate()),
    checkOut: toDateStr(co.getFullYear(), co.getMonth(), co.getDate()),
  };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TICKER_ITEMS = [
  { name: "Rahul M.", hotel: "Park Hyatt, Maldives", saved: "₹31,600", time: "Just now" },
  { name: "Priya S.", hotel: "Atlantis The Palm, Dubai", saved: "₹22,400", time: "4 min ago" },
  { name: "Vikram S.", hotel: "Burj Al Arab, Dubai", saved: "₹48,000", time: "11 min ago" },
  { name: "Neha R.", hotel: "Four Seasons, Bali", saved: "₹18,200", time: "23 min ago" },
  { name: "Arjun T.", hotel: "The Langham, London", saved: "₹26,200", time: "31 min ago" },
];

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", country: "United Arab Emirates", img: "/dubai.jpg", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", img: "/newdelhi.jpg", badge: "Member Deal", badgeColor: "#1447b8", badgeText: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Singapore", img: "/singapore.jpg" },
  { flag: "🇮🇳", city: "Goa", country: "India", img: "/goa.jpg", badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia", img: "/bali.jpg" },
  { flag: "🇮🇳", city: "Mumbai", country: "India", img: "/mumbai.jpg" },
  { flag: "🇹🇭", city: "Bangkok", country: "Thailand", img: "/bangkok.jpg" },
  { flag: "🇹🇭", city: "Phuket", country: "Thailand", img: "/phuket.jpg" },
  { flag: "🇲🇾", city: "Kuala Lumpur", country: "Malaysia", img: "/kl.jpg" },
  { flag: "🇯🇵", city: "Tokyo", country: "Japan", img: "/tokyo.jpg" },
  { flag: "🇬🇧", city: "London", country: "United Kingdom", img: "/london.jpg" },
  { flag: "🇫🇷", city: "Paris", country: "France", img: "/paris.jpg" },
  { flag: "🇮🇹", city: "Rome", country: "Italy", img: "/rome.jpg" },
  { flag: "🇪🇸", city: "Barcelona", country: "Spain", img: "/barcelona.jpg" },
  { flag: "🇳🇱", city: "Amsterdam", country: "Netherlands", img: "/amsterdam.jpg" },
  { flag: "🇹🇷", city: "Istanbul", country: "Turkey", img: "/istanbul.jpg" },
  { flag: "🇶🇦", city: "Doha", country: "Qatar", img: "/doha.jpg" },
  { flag: "🇦🇪", city: "Abu Dhabi", country: "United Arab Emirates", img: "/abudhabi.jpg" },
  { flag: "🇲🇻", city: "Maldives", country: "Maldives", img: "/maldives.jpg" },
  { flag: "🇦🇺", city: "Sydney", country: "Australia", img: "/sydney.jpg" },
  { flag: "🇰🇷", city: "Seoul", country: "South Korea", img: "/seoul.jpg" },
  { flag: "🇭🇰", city: "Hong Kong", country: "Hong Kong", img: "/hongkong.jpg" },
  { flag: "🇩🇰", city: "Copenhagen", country: "Denmark", img: "/copenhagen.jpg" },
  { flag: "🇸🇪", city: "Stockholm", country: "Sweden", img: "/stockholm.jpg" },
  { flag: "🇳🇴", city: "Oslo", country: "Norway", img: "/oslo.jpg" },
  { flag: "🇩🇪", city: "Berlin", country: "Germany", img: "/berlin.jpg" },
  { flag: "🇦🇹", city: "Vienna", country: "Austria", img: "/vienna.jpg" },
  { flag: "🇨🇭", city: "Zurich", country: "Switzerland", img: "/zurich.jpg" },
  { flag: "🇵🇹", city: "Lisbon", country: "Portugal", img: "/lisbon.jpg" },
  { flag: "🇬🇷", city: "Athens", country: "Greece", img: "/athens.jpg" },
  { flag: "🇨🇿", city: "Prague", country: "Czech Republic", img: "/prague.jpg" },
  { flag: "🇮🇪", city: "Dublin", country: "Ireland", img: "/dublin.jpg" },
  { flag: "🇭🇷", city: "Dubrovnik", country: "Croatia", img: "/dubrovnik.jpg" },
  { flag: "🇮🇳", city: "Jaipur", country: "India", img: "/jaipur.jpg" },
  { flag: "🇮🇳", city: "Bangalore", country: "India", img: "/bangalore.jpg" },
  { flag: "🇮🇳", city: "Hyderabad", country: "India", img: "/hyderabad.jpg" },
  { flag: "🇮🇳", city: "Chennai", country: "India", img: "/chennai.jpg" },
  { flag: "🇮🇳", city: "Kolkata", country: "India", img: "/kolkata.jpg" },
  { flag: "🇮🇳", city: "Kochi", country: "India", img: "/kochi.jpg" },
  { flag: "🇮🇳", city: "Agra", country: "India", img: "/agra.jpg" },
  { flag: "🇪🇬", city: "Cairo", country: "Egypt", img: "/cairo.jpg" },
  { flag: "🇸🇦", city: "Riyadh", country: "Saudi Arabia", img: "/riyadh.jpg" },
  { flag: "🇴🇲", city: "Muscat", country: "Oman", img: "/muscat.jpg" },
  { flag: "🇨🇳", city: "Beijing", country: "China", img: "/beijing.jpg" },
  { flag: "🇨🇳", city: "Shanghai", country: "China", img: "/shanghai.jpg" },
  { flag: "🇿🇦", city: "Cape Town", country: "South Africa", img: "/capetown.jpg" },
  { flag: "🇺🇸", city: "New York", country: "United States", img: "/newyork.jpg" },
  { flag: "🇺🇸", city: "Las Vegas", country: "United States", img: "/lasvegas.jpg" },
  { flag: "🇺🇸", city: "Miami", country: "United States", img: "/miami.jpg" },
];

// Known major cities we already curate above — used to make sure a famous
// city always outranks an obscure same-named village elsewhere.
const CURATED_CITY_NAMES = new Set(DESTINATIONS.map(d => d.city.toLowerCase()));

const HOTELS_BY_CITY: Record<string, Array<{
  name: string; loc: string; city: string; stars: number; rating: string;
  tags: string[]; was: string; now: string; save: string;
  badges: [string,string][]; img: string; code?: string;
}>> = {
  "Top Sellers": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", city: "Dubai", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach","Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp42f57.jpg", code: "lp42f57" },
    { name: "Roseate House", loc: "Aerocity, New Delhi, India", city: "New Delhi", stars: 5, rating: "4.6 (4.4k)", tags: ["Boutique","Rooftop","Aerocity"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp7c680.jpg", code: "lp7c680" },
    { name: "Holiday Inn Express Singapore Katong by IHG", loc: "Katong, Singapore", city: "Singapore", stars: 3, rating: "4.2 (3.8k)", tags: ["Katong","Budget","Free WiFi"], was: "₹9,000", now: "₹6,300", save: "Save ₹2,700", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp8aef1.jpg", code: "lp8aef1" },
    { name: "Le Meridien Goa, Calangute", loc: "Calangute, Goa", city: "Goa", stars: 5, rating: "4.6 (3.1k)", tags: ["Calangute","Beach","Spa"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lpaf35e.jpg", code: "lpaf35e" },
    { name: "Four Points by Sheraton Bali, Kuta", loc: "Kuta, Bali", city: "Bali", stars: 4, rating: "4.3 (3.9k)", tags: ["Kuta","City view","Pool"], was: "₹8,500", now: "₹5,950", save: "Save ₹2,550", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp82644.jpg", code: "lp82644" },
    { name: "The Oberoi Mumbai", loc: "Nariman Point, Mumbai", city: "Mumbai", stars: 5, rating: "4.8 (4.9k)", tags: ["Nariman Point","Sea view","Luxury"], was: "₹34,000", now: "₹23,800", save: "Save ₹10,200", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp1e3f7.jpg", code: "lp1e3f7" },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", city: "Dubai", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach","Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp42f57.jpg", code: "lp42f57" },
    { name: "InterContinental Dubai Marina by IHG", loc: "Dubai Marina, UAE", city: "Dubai", stars: 5, rating: "4.6 (8.7k)", tags: ["Marina view","Spa","Pool"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["AI Watching","watching"],["7% Off","off"]], img: "/hotels/lp769d6.jpg", code: "lp769d6" },
    { name: "ME Dubai by Meliá", loc: "Downtown Dubai, UAE", city: "Dubai", stars: 5, rating: "4.6 (3.1k)", tags: ["Design hotel","Rooftop","Spa"], was: "₹36,000", now: "₹25,200", save: "Save ₹10,800", badges: [["Luxury","luxury"],["Trending","trending"]], img: "/hotels/lp6554ba8e.jpg", code: "lp6554ba8e" },
    { name: "Pullman Dubai Downtown", loc: "Downtown Dubai, UAE", city: "Dubai", stars: 4, rating: "4.4 (5.6k)", tags: ["Burj view","Rooftop pool"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Best Value","best"],["AI Watching","watching"]], img: "/hotels/lp894ae.jpg", code: "lp894ae" },
    { name: "Hilton Garden Inn Dubai, Mall Avenue", loc: "Al Barsha, Dubai, UAE", city: "Dubai", stars: 4, rating: "4.3 (4.2k)", tags: ["Near Mall of Emirates","Business"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Best Value","best"],["5% Off","off"]], img: "/hotels/lp897a8.jpg", code: "lp897a8" },
    { name: "Rove Dubai Marina", loc: "Dubai Marina, UAE", city: "Dubai", stars: 3, rating: "4.4 (9.8k)", tags: ["Marina","Trendy","Budget"], was: "₹12,000", now: "₹8,400", save: "Save ₹3,600", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lpcdd85.jpg", code: "lpcdd85" },
  ],
    "Bali": [
    { name: "Hard Rock Hotel Bali", loc: "Kuta, Bali", city: "Bali", stars: 5, rating: "4.5 (12.1k)", tags: ["Kuta","Beach","Pool"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lp2d43b.jpg", code: "lp2d43b" },
    { name: "Grand Mercure Bali Seminyak", loc: "Seminyak, Bali", city: "Bali", stars: 4, rating: "4.4 (4.8k)", tags: ["Seminyak","Beach","Pool"], was: "₹11,000", now: "₹7,700", save: "Save ₹3,300", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/hotels/lp65590560.jpg", code: "lp65590560" },
    { name: "Holiday Inn Resort Baruna Bali by IHG", loc: "Kuta, Bali", city: "Bali", stars: 4, rating: "4.3 (6.2k)", tags: ["Kuta","Beach","Family"], was: "₹9,500", now: "₹6,650", save: "Save ₹2,850", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp246bd.jpg", code: "lp246bd" },
    { name: "Four Points by Sheraton Bali, Kuta", loc: "Kuta, Bali", city: "Bali", stars: 4, rating: "4.3 (3.9k)", tags: ["Kuta","City view","Pool"], was: "₹8,500", now: "₹5,950", save: "Save ₹2,550", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp82644.jpg", code: "lp82644" },
    { name: "Grand Mirage Resort & Thalasso Bali - All Inclusive", loc: "Tanjung Benoa, Bali", city: "Bali", stars: 4, rating: "4.4 (2.7k)", tags: ["Tanjung Benoa","Beach","All-Inclusive"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["Trending","trending"],["4% Off","off"]], img: "/hotels/lp558a7.jpg", code: "lp558a7" },
    { name: "The Ubud Village Resort & Spa", loc: "Ubud, Bali", city: "Bali", stars: 5, rating: "4.7 (1.8k)", tags: ["Ubud","Rice fields","Private pool"], was: "₹17,000", now: "₹11,900", save: "Save ₹5,100", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp41592.jpg", code: "lp41592" },
  ],
  
  "Singapore": [
    { name: "Hilton Singapore Orchard", loc: "Orchard Road, Singapore", city: "Singapore", stars: 5, rating: "4.5 (8.2k)", tags: ["Orchard Road","Shopping","Pool"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp23603.jpg", code: "lp23603" },
    { name: "Amara Singapore", loc: "Tanjong Pagar, Singapore", city: "Singapore", stars: 4, rating: "4.3 (6.1k)", tags: ["Tanjong Pagar","City view","Pool"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["Best Value","best"],["4% Off","off"]], img: "/hotels/lp1c24d.jpg", code: "lp1c24d" },
    { name: "Grand Copthorne Waterfront Hotel Singapore", loc: "Riverside, Singapore", city: "Singapore", stars: 4, rating: "4.4 (5.4k)", tags: ["Riverside","Spa","Pool"], was: "₹13,000", now: "₹9,100", save: "Save ₹3,900", badges: [["AI Watching","watching"],["5% Off","off"]], img: "/hotels/lp24c34.jpg", code: "lp24c34" },
    { name: "The Ritz-Carlton, Millenia Singapore", loc: "Marina Bay, Singapore", city: "Singapore", stars: 5, rating: "4.8 (9.6k)", tags: ["Marina Bay","Luxury","Spa"], was: "₹52,000", now: "₹36,400", save: "Save ₹15,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp1dac2.jpg", code: "lp1dac2" },
    { name: "Holiday Inn Express Singapore Katong by IHG", loc: "Katong, Singapore", city: "Singapore", stars: 3, rating: "4.2 (3.8k)", tags: ["Katong","Budget","Free WiFi"], was: "₹9,000", now: "₹6,300", save: "Save ₹2,700", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp8aef1.jpg", code: "lp8aef1" },
    { name: "Paradox Singapore Merchant Court at Clarke Quay", loc: "Clarke Quay, Singapore", city: "Singapore", stars: 5, rating: "4.4 (4.7k)", tags: ["Clarke Quay","Riverside","Pool"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lp1b632.jpg", code: "lp1b632" },
  ],
  
"New Delhi": [
    { name: "The Leela Palace New Delhi", loc: "Diplomatic Enclave, New Delhi, India", city: "New Delhi", stars: 5, rating: "4.9 (8.2k)", tags: ["Pool","Spa","Fine dining"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp5635d.jpg", code: "lp5635d" },
    { name: "Taj Palace, New Delhi", loc: "Diplomatic Enclave, New Delhi, India", city: "New Delhi", stars: 5, rating: "4.7 (9.6k)", tags: ["Luxury","Spa","Gardens"], was: "₹26,000", now: "₹18,200", save: "Save ₹7,800", badges: [["Luxury","luxury"],["6% Off","off"]], img: "/hotels/lp25093.jpg", code: "lp25093" },
    { name: "Roseate House", loc: "Aerocity, New Delhi, India", city: "New Delhi", stars: 5, rating: "4.6 (4.4k)", tags: ["Boutique","Rooftop","Aerocity"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp7c680.jpg", code: "lp7c680" },
    { name: "Crowne Plaza New Delhi Okhla by IHG", loc: "Okhla, New Delhi, India", city: "New Delhi", stars: 5, rating: "4.4 (6.1k)", tags: ["Business","Pool","Spa"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["Best Value","best"],["AI Watching","watching"]], img: "/hotels/lp57c34.jpg", code: "lp57c34" },
    { name: "Aloft by Marriott New Delhi Aerocity", loc: "Aerocity, New Delhi, India", city: "New Delhi", stars: 4, rating: "4.3 (5.2k)", tags: ["Trendy","Near airport"], was: "₹11,000", now: "₹7,700", save: "Save ₹3,300", badges: [["Best Value","best"],["7% Off","off"]], img: "/hotels/lpe15b1.jpg", code: "lpe15b1" },
    { name: "Radisson Blu Hotel New Delhi Dwarka", loc: "Dwarka, New Delhi, India", city: "New Delhi", stars: 4, rating: "4.3 (3.8k)", tags: ["Business","Pool"], was: "₹12,000", now: "₹8,400", save: "Save ₹3,600", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/hotels/lp5f77a.jpg", code: "lp5f77a" },
  ],
    "Goa": [
    { name: "DoubleTree by Hilton Goa - Panaji", loc: "Panaji, Goa", city: "Goa", stars: 5, rating: "4.5 (4.2k)", tags: ["Panaji","River view","Pool"], was: "₹13,000", now: "₹9,100", save: "Save ₹3,900", badges: [["AI Watching","watching"],["5% Off","off"]], img: "/hotels/lpc425f.jpg", code: "lpc425f" },
    { name: "Le Meridien Goa, Calangute", loc: "Calangute, Goa", city: "Goa", stars: 5, rating: "4.6 (3.1k)", tags: ["Calangute","Beach","Spa"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lpaf35e.jpg", code: "lpaf35e" },
    { name: "W Goa", loc: "Vagator, Goa", city: "Goa", stars: 5, rating: "4.7 (5.8k)", tags: ["Vagator","Beach","Luxury"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp97d44.jpg", code: "lp97d44" },
    { name: "Hyatt Centric Candolim Goa", loc: "Candolim, Goa", city: "Goa", stars: 4, rating: "4.5 (2.4k)", tags: ["Candolim","Beach","Pool"], was: "₹12,000", now: "₹8,400", save: "Save ₹3,600", badges: [["Best Value","best"],["4% Off","off"]], img: "/hotels/lp8956f.jpg", code: "lp8956f" },
    { name: "Park Inn by Radisson Goa Candolim", loc: "Candolim, Goa", city: "Goa", stars: 4, rating: "4.2 (3.6k)", tags: ["Candolim","Pool","Free Breakfast"], was: "₹7,000", now: "₹4,900", save: "Save ₹2,100", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp3561a.jpg", code: "lp3561a" },
    { name: "Taj Exotica Resort & Spa, Goa", loc: "Benaulim, Goa", city: "Goa", stars: 5, rating: "4.7 (9.2k)", tags: ["Benaulim","Beach","Golf"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp3a7f2.jpg", code: "lp3a7f2" },
  ],
  
  "Mumbai": [
    { name: "Ramada Plaza By Wyndham Palm Grove", loc: "Juhu, Mumbai", city: "Mumbai", stars: 4, rating: "4.2 (4.1k)", tags: ["Juhu","Pool","Free WiFi"], was: "₹9,000", now: "₹6,300", save: "Save ₹2,700", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp3a654.jpg", code: "lp3a654" },
    { name: "Novotel Mumbai Juhu Beach Hotel", loc: "Juhu Beach, Mumbai", city: "Mumbai", stars: 5, rating: "4.4 (6.7k)", tags: ["Juhu Beach","Pool","Sea view"], was: "₹12,000", now: "₹8,400", save: "Save ₹3,600", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/hotels/lp4c211.jpg", code: "lp4c211" },
    { name: "The St. Regis Mumbai", loc: "Lower Parel, Mumbai", city: "Mumbai", stars: 5, rating: "4.7 (5.9k)", tags: ["Lower Parel","Sky pool","Luxury"], was: "₹25,000", now: "₹17,500", save: "Save ₹7,500", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp655c3.jpg", code: "lp655c3" },
    { name: "The Lalit Mumbai", loc: "Sahar, Mumbai", city: "Mumbai", stars: 5, rating: "4.4 (8.3k)", tags: ["Sahar","Airport","Pool"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lp33bad.jpg", code: "lp33bad" },
    { name: "Sofitel Mumbai BKC", loc: "BKC, Mumbai", city: "Mumbai", stars: 5, rating: "4.6 (4.4k)", tags: ["BKC","Business","Luxury"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp5b6be.jpg", code: "lp5b6be" },
    { name: "The Oberoi Mumbai", loc: "Nariman Point, Mumbai", city: "Mumbai", stars: 5, rating: "4.8 (4.9k)", tags: ["Nariman Point","Sea view","Luxury"], was: "₹34,000", now: "₹23,800", save: "Save ₹10,200", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp1e3f7.jpg", code: "lp1e3f7" },
  ],
  
  "Bangalore": [
    { name: "Hilton Bangalore Embassy GolfLinks", loc: "Embassy GolfLinks, Bengaluru", city: "Bangalore", stars: 5, rating: "4.5 (5.2k)", tags: ["Embassy GolfLinks","Golf","Pool"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/hotels/lp69fec.jpg", code: "lp69fec" },
    { name: "ITC Windsor, a Luxury Collection Hotel, Bengaluru", loc: "Golf Course Road, Bengaluru", city: "Bangalore", stars: 5, rating: "4.6 (7.4k)", tags: ["Golf Course Road","Heritage","Luxury"], was: "₹19,000", now: "₹13,300", save: "Save ₹5,700", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp19d8d.jpg", code: "lp19d8d" },
    { name: "Conrad Bengaluru", loc: "Ulsoor Lake, Bengaluru", city: "Bangalore", stars: 5, rating: "4.7 (6.8k)", tags: ["Ulsoor Lake","Luxury","Spa"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lpb1787.jpg", code: "lpb1787" },
    { name: "Hyatt Centric MG Road Bangalore", loc: "MG Road, Bengaluru", city: "Bangalore", stars: 4, rating: "4.4 (3.3k)", tags: ["MG Road","City Centre","Pool"], was: "₹11,000", now: "₹7,700", save: "Save ₹3,300", badges: [["Best Value","best"],["4% Off","off"]], img: "/hotels/lp3bf1a.jpg", code: "lp3bf1a" },
    { name: "Four Points by Sheraton Bengaluru Whitefield", loc: "Whitefield, Bengaluru", city: "Bangalore", stars: 4, rating: "4.2 (2.7k)", tags: ["Whitefield","Business","Pool"], was: "₹8,000", now: "₹5,600", save: "Save ₹2,400", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp40f31.jpg", code: "lp40f31" },
    { name: "Sheraton Grand Bangalore Hotel at Brigade Gateway", loc: "Brigade Gateway, Bengaluru", city: "Bangalore", stars: 5, rating: "4.5 (4.6k)", tags: ["Brigade Gateway","Mall access","Pool"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lp5ba52.jpg", code: "lp5ba52" },
  ],
  
  "Tokyo": [
    { name: "Hilton Tokyo Bay", loc: "Tokyo Bay, Tokyo", city: "Tokyo", stars: 4, rating: "4.4 (9.1k)", tags: ["Tokyo Bay","Disney area","Pool"], was: "₹17,000", now: "₹11,900", save: "Save ₹5,100", badges: [["Trending","trending"],["5% Off","off"]], img: "/hotels/lp2207f.jpg", code: "lp2207f" },
    { name: "Millennium Mitsui Garden Hotel Tokyo - Ginza", loc: "Ginza, Tokyo", city: "Tokyo", stars: 4, rating: "4.5 (3.2k)", tags: ["Ginza","Shopping","City view"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/hotels/lp70c26.jpg", code: "lp70c26" },
    { name: "Park Hotel Tokyo", loc: "Shiodome, Tokyo", city: "Tokyo", stars: 4, rating: "4.5 (2.6k)", tags: ["Shiodome","City view","Art"], was: "₹17,000", now: "₹11,900", save: "Save ₹5,100", badges: [["Best Value","best"],["4% Off","off"]], img: "/hotels/lp32d36.jpg", code: "lp32d36" },
    { name: "Mitsui Garden Hotel Kyobashi - Tokyo Station", loc: "Kyobashi, Tokyo", city: "Tokyo", stars: 4, rating: "4.4 (1.9k)", tags: ["Tokyo Station","Business","Central"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["Best Value","best"],["3% Off","off"]], img: "/hotels/lp90c74.jpg", code: "lp90c74" },
    { name: "Citadines Central Shinjuku Tokyo", loc: "Shinjuku, Tokyo", city: "Tokyo", stars: 4, rating: "4.3 (2.4k)", tags: ["Shinjuku","Apartment-style","Central"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["4% Off","off"]], img: "/hotels/lp4170e.jpg", code: "lp4170e" },
    { name: "Hyatt Regency Tokyo Bay", loc: "Tokyo Bay, Tokyo", city: "Tokyo", stars: 5, rating: "4.5 (3.7k)", tags: ["Tokyo Bay","Disney area","Family"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/hotels/lp1e3a4c.jpg", code: "lp1e3a4c" },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" }, best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" }, trending: { bg: "#f59e0b", color: "#1a1a1a" }, off: { bg: "#ef4444", color: "#fff" },
};

const CITY_FILTERS = ["Top Sellers", "Dubai", "New Delhi", "Singapore", "Goa", "Bali", "Mumbai", "Bangalore", "Tokyo"];

const STATS = [
  { id: 0, target: 270000, prefix: "", suffix: "+", label: "Member deals live right now", boldTop: false },
  { id: 1, target: null, prefix: "", suffix: "", boldText: "Lowest Price", label: "Guaranteed", boldTop: true },
  { id: 2, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for members", boldTop: false },
  { id: 3, target: null, prefix: "", suffix: "", boldText: "Price Drop Protection", label: "Auto-monitored, 24/7", boldTop: true },
];

interface GuestState { rooms: number; adults: number; children: number; childAges: number[]; }

interface Selection {
  label: string;
  type: 'city' | 'hotel' | 'area' | 'landmark' | 'airport';
  placeId?: string;
  hotelId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  placeTypes?: string[];
  countryCode?: string;
}

// SVG icons
const IconCity = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="5" height="12"/><rect x="9" y="5" width="6" height="16"/><rect x="16" y="11" width="5" height="10"/><line x1="1" y1="21" x2="23" y2="21"/></svg>;
const IconPin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IconStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconPlane = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>;
const IconHotel = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v11"/><path d="M3 11h18"/><path d="M21 7v11"/><rect x="7" y="7" width="10" height="4" rx="2"/><path d="M7 18v2"/><path d="M17 18v2"/></svg>;

export default function SearchHotelsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const today = new Date();
  const defaults = getDefaultDates();

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [inputText, setInputText] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState<GuestState>({ rooms: 1, adults: 2, children: 0, childAges: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>({ cities: [], hotels: [], areas: [], landmarks: [], airport: null });
  const [activeCity, setActiveCity] = useState("Top Sellers");
  const [destCarouselPos, setDestCarouselPos] = useState(0);
  const [hotelCarouselPos, setHotelCarouselPos] = useState(0);
  useEffect(() => { setHotelCarouselPos(0); }, [activeCity]);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [statVals, setStatVals] = useState(STATS.map(s => s.target === null ? "" : `${s.prefix}${s.target.toLocaleString("en-IN")}${s.suffix}`));
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [calMode, setCalMode] = useState<"checkin"|"checkout">("checkin");
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [guestOpen, setGuestOpen] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  const defaultSuggestions = {
    cities: DESTINATIONS.map(d => ({ type: 'city', name: d.city, subtext: d.country, flag: d.flag, placeId: null, placeType: 'city' })),
    hotels: [], areas: [], landmarks: [], airport: null
  };

  useEffect(() => {
    if (!inputText || inputText.length === 0) { setSuggestions({ cities: [], hotels: [], areas: [], landmarks: [], airport: null }); return; }
    if (inputText.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const mapboxCities = await fetchCitySuggestions(inputText);
        if (mapboxCities.length === 0) {
          const q = inputText.toLowerCase();
          const matched = defaultSuggestions.cities.filter((c: any) =>
            c.name.toLowerCase().includes(q)
          );
          setSuggestions({ cities: matched, hotels: [], areas: [], landmarks: [], airport: null });
        } else {
          setSuggestions({ cities: mapboxCities, hotels: [], areas: [], landmarks: [], airport: null });
        }
      } catch {
        const q = inputText.toLowerCase();
        const matched = defaultSuggestions.cities.filter((c: any) =>
          c.name.toLowerCase().includes(q)
        );
        setSuggestions({ cities: matched, hotels: [], areas: [], landmarks: [], airport: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputText]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member" });
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) setGuestOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => { setTickerIdx(p => (p + 1) % TICKER_ITEMS.length); setTickerVisible(true); }, 400);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        STATS.forEach((s, i) => {
          let start: number | null = null;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1200, 1);
            setStatVals(prev => { const n = [...prev]; n[i] = `${s.prefix}${Math.floor(p * s.target).toLocaleString("en-IN")}${s.suffix}`; return n; });
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleDayClick = (ds: string) => {
    setSearchError("");
    if (calMode === "checkin") { setCheckIn(ds); setCheckOut(""); setCalMode("checkout"); }
    else { if (ds <= checkIn) return; setCheckOut(ds); setCalOpen(false); }
  };

  const updateGuests = (key: keyof GuestState, val: number) => {
    setGuests(prev => {
      const next = { ...prev, [key]: val };
      if (key === "children") {
        next.childAges = val > prev.childAges.length
          ? [...prev.childAges, ...Array(val - prev.childAges.length).fill(2)]
          : prev.childAges.slice(0, val);
      }
      return next;
    });
  };

  const guestSummary = () => {
    const p = [`${guests.rooms} Room${guests.rooms > 1 ? "s" : ""}`, `${guests.adults} Adult${guests.adults > 1 ? "s" : ""}`];
    if (guests.children > 0) p.push(`${guests.children} Child${guests.children > 1 ? "ren" : ""}`);
    return p.join(" · ");
  };

  const requireAuth = async (action: () => void) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) action(); else router.push(`/signin?redirect=/search-hotels`);
  };

  const doSearch = (sel: Selection, ci: string, co: string) => {
    requireAuth(async () => {
      const params = new URLSearchParams({
        checkIn: ci, checkOut: co,
        adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children),
        ...(guests.childAges.length > 0 ? { childAges: guests.childAges.join(",") } : {}),
      });
      params.set('sessionId', genSessionId());
      params.set('destination', sel.label);

      const isLandmark = !!sel.placeTypes?.some(t => ['poi', 'neighborhood', 'locality', 'address'].includes(t));
      const isCityLevel = !!sel.placeTypes?.some(t => ['place', 'region', 'country'].includes(t));

      if (sel.type === 'hotel' && sel.hotelId) {
        router.push(`/hotel/${sel.hotelId}?${params.toString()}`);
      } else if (isLandmark && sel.lat != null && sel.lng != null) {
        // A specific landmark/area — this is the case liteAPI's placeId search
        // doesn't reliably resolve, so we go straight to coordinates instead.
        params.set('refLat', String(sel.lat));
        params.set('refLng', String(sel.lng));
        params.set('radius', String(sel.radius || 5000));
        params.set('refLabel', sel.label);
        router.push(`/search?${params.toString()}`);
      } else if (sel.type === 'city' && sel.countryCode) {
        // City picked from our own liteAPI-sourced cache — pass cityName +
        // countryCode straight through, no Google-Places placeId round-trip,
        // no dependency on Google recognizing the name at all. liteAPI's own
        // rates search accepts this pair natively.
        params.set('cityName', sel.label);
        params.set('countryCode', sel.countryCode);
        router.push(`/search?${params.toString()}`);
      } else if (sel.placeId && !isCityLevel) {
        params.set('placeId', sel.placeId);
        router.push(`/search?${params.toString()}`);
      } else {
        // City/region/country-level pick, or a fallback-list pick with no
        // coordinates at all — resolve via the proven suggest-API placeId path
        // rather than lat/long, since whole-city radius search has shown gaps.
        try {
          const res = await fetch(`${API}/api/hotels/suggest?q=${encodeURIComponent(sel.label)}`);
          const data = await res.json();
          const match = (data.cities || []).find((c: any) =>
            c.name?.toLowerCase() === sel.label.toLowerCase()
          ) || (data.cities || [])[0];
          if (match?.placeId) {
            params.set('placeId', match.placeId);
          }
        } catch {}
        router.push(`/search?${params.toString()}`);
      }
    });
  };

  const handleSearch = () => {
    setSearchError("");
    if (!selection) { setSearchError("Please select a destination from the dropdown"); return; }
    if (!checkIn) { setSearchError("Please select a check-in date"); return; }
    if (!checkOut) { setSearchError("Please select a check-out date"); return; }
    doSearch(selection, checkIn, checkOut);
  };

  const handleSelect = (item: any, type: string) => {
    const sel: Selection = {
      label: item.name,
      type: type as any,
      placeId: item.placeId || undefined,
      hotelId: item.hotelId || undefined,
      lat: item.lat || undefined,
      lng: item.lng || undefined,
      radius: item.radius || undefined,
      placeTypes: item.placeTypes || undefined,
      countryCode: item.countryCode || undefined,
    };
    setSelection(sel);
    setInputText(type === 'city' && item.countryName ? `${item.name}, ${item.countryName}` : item.name);
    setShowSuggestions(false);
    setTimeout(() => { setCalMode("checkin"); setCalOpen(true); }, 100);
  };

  const handleHotelCardClick = async (hotelName: string, city: string, hotelCode?: string) => {
    requireAuth(async () => {
      const ci = checkIn || defaults.checkIn;
      const co = checkOut || defaults.checkOut;
      if (hotelCode) {
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children) }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
        const url = `/hotel/${hotelCode}?${params.toString()}`;
        isMobile ? router.push(url) : window.open(url, '_blank');
        return;
      }
      try {
        const res = await fetch(`${API}/api/hotels/suggest?q=${encodeURIComponent(hotelName)}`);
        const data = await res.json();
        const match = (data.hotels || []).find((h: any) => h.name.toLowerCase().includes(hotelName.toLowerCase().slice(0, 15)));
        if (match?.hotelId) {
          const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children) }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
          const url = `/hotel/${match.hotelId}?${params.toString()}`;
          isMobile ? router.push(url) : window.open(url, '_blank');
        } else {
          const cityMatch = (data.cities || []).find((c: any) => c.name?.toLowerCase().includes(city.toLowerCase()));
          const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: city }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
          if (cityMatch?.placeId) params.set('placeId', cityMatch.placeId);
          const url = `/search?${params.toString()}`;
          isMobile ? router.push(url) : window.open(url, '_blank');
        }
      } catch {
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: city }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
        const url = `/search?${params.toString()}`;
        isMobile ? router.push(url) : window.open(url, '_blank');
      }
    });
  };

  const handleDestCardClick = async (cityName: string) => {
    requireAuth(async () => {
      const ci = checkIn || defaults.checkIn;
      const co = checkOut || defaults.checkOut;
      try {
        const res = await fetch(`${API}/api/hotels/suggest?q=${encodeURIComponent(cityName)}`);
        const data = await res.json();
        const match = (data.cities || []).find((c: any) => c.name?.toLowerCase() === cityName.toLowerCase());
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: cityName }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
        if (match?.placeId) params.set('placeId', match.placeId);
        router.push(`/search?${params.toString()}`);
      } catch {
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: cityName }); if (guests.childAges.length > 0) params.set('childAges', guests.childAges.join(',')); params.set('sessionId', genSessionId());
        router.push(`/search?${params.toString()}`);
      }
    });
  };

  const renderMonth = (year: number, month: number) => {
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    const days = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, textAlign: "center", marginBottom: 16, fontFamily: "'Sora',sans-serif" }}>{MONTHS[month]} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 10 }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1; const ds = toDateStr(year, month, day); const isDisabled = ds < todayStr;
            const isStart = ds === checkIn && !!checkOut; const isEnd = ds === checkOut;
            const isOnly = ds === checkIn && !checkOut; const isInRange = !!(checkIn && checkOut && ds > checkIn && ds < checkOut);
            const isToday = ds === todayStr;
            let bg = "transparent", clr = isDisabled ? "#cbd5e1" : NAVY, br = "50%", fw = isToday ? 700 : 400;
            if (isStart) { bg = B; clr = "#fff"; br = "50% 0 0 50%"; fw = 700; }
            else if (isEnd) { bg = B; clr = "#fff"; br = "0 50% 50% 0"; fw = 700; }
            else if (isOnly) { bg = B; clr = "#fff"; br = "50%"; fw = 700; }
            else if (isInRange) { bg = "#dbeafe"; clr = B; br = "0"; }
            else if (isToday) { clr = B; }
            return (
              <div key={day} onClick={() => !isDisabled && handleDayClick(ds)}
                style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: clr, borderRadius: br, fontWeight: fw, fontSize: 14, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.35 : 1 }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ticker = TICKER_ITEMS[tickerIdx];
  const hotels = HOTELS_BY_CITY[activeCity] || HOTELS_BY_CITY["Top Sellers"];
  const HOTEL_CARD_WIDTH = isMobile ? 300 : 340;
  const HOTEL_VISIBLE = isMobile ? 1 : 3;
  const HOTEL_MAX_POS = Math.max(0, hotels.length - HOTEL_VISIBLE);
  const scrollHotelCarousel = (dir: number) => setHotelCarouselPos(prev => Math.max(0, Math.min(HOTEL_MAX_POS, prev + dir)));
  const d1 = new Date(today.getFullYear(), today.getMonth() + calMonthOffset);
  const d2 = new Date(today.getFullYear(), today.getMonth() + calMonthOffset + 1);

  const hasSuggestions = suggestions.cities.length > 0 || suggestions.hotels.length > 0 || suggestions.areas.length > 0 || suggestions.landmarks.length > 0 || suggestions.airport;

  // ── Dropdown rows ──────────────────────────────────────────────────────────
  const SectionLabel = ({ label }: { label: string }) => (
    <div style={{ padding: "6px 14px 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", borderTop: "0.5px solid #f1f5f9" }}>{label}</div>
  );

  const Row = ({ icon, name, subtext, onClick, isCity }: { icon: React.ReactNode; name: string; subtext?: string; onClick: () => void; isCity?: boolean }) => (
    <div onMouseDown={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: isCity ? "12px 14px" : "9px 14px", cursor: "pointer", borderBottom: "0.5px solid #f8fafc", transition: "background 0.1s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <div style={{ color: "#64748b", flexShrink: 0, display: "flex", alignItems: "center", width: isCity ? 20 : 18 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: isCity ? 15 : 14, fontWeight: isCity ? 600 : 500, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {subtext && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{subtext}</div>}
      </div>
    </div>
  );

  // Client-side flag+country lookup — never relies on backend sending countryCode
  const CITY_INFO: Record<string, { flag: string; country: string }> = {
    'dubai': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'abu dhabi': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'sharjah': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'dubai mall': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'dubai marina': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'downtown dubai': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'palm jumeirah': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'deira': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'dubai international airport': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'dubai hills': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'dubai silicon oasis': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'jumeirah': { flag: '🇦🇪', country: 'United Arab Emirates' },
    'mumbai': { flag: '🇮🇳', country: 'India' },
    'new delhi': { flag: '🇮🇳', country: 'India' },
    'delhi': { flag: '🇮🇳', country: 'India' },
    'goa': { flag: '🇮🇳', country: 'India' },
    'bangalore': { flag: '🇮🇳', country: 'India' },
    'bengaluru': { flag: '🇮🇳', country: 'India' },
    'jaipur': { flag: '🇮🇳', country: 'India' },
    'hyderabad': { flag: '🇮🇳', country: 'India' },
    'chennai': { flag: '🇮🇳', country: 'India' },
    'kolkata': { flag: '🇮🇳', country: 'India' },
    'agra': { flag: '🇮🇳', country: 'India' },
    'kochi': { flag: '🇮🇳', country: 'India' },
    'pune': { flag: '🇮🇳', country: 'India' },
    'ahmedabad': { flag: '🇮🇳', country: 'India' },
    'udaipur': { flag: '🇮🇳', country: 'India' },
    'varanasi': { flag: '🇮🇳', country: 'India' },
    'amritsar': { flag: '🇮🇳', country: 'India' },
    'connaught place': { flag: '🇮🇳', country: 'India' },
    'singapore': { flag: '🇸🇬', country: 'Singapore' },
    'bangkok': { flag: '🇹🇭', country: 'Thailand' },
    'phuket': { flag: '🇹🇭', country: 'Thailand' },
    'chiang mai': { flag: '🇹🇭', country: 'Thailand' },
    'bali': { flag: '🇮🇩', country: 'Indonesia' },
    'jakarta': { flag: '🇮🇩', country: 'Indonesia' },
    'kuala lumpur': { flag: '🇲🇾', country: 'Malaysia' },
    'london': { flag: '🇬🇧', country: 'United Kingdom' },
    'manchester': { flag: '🇬🇧', country: 'United Kingdom' },
    'edinburgh': { flag: '🇬🇧', country: 'United Kingdom' },
    'paris': { flag: '🇫🇷', country: 'France' },
    'nice': { flag: '🇫🇷', country: 'France' },
    'rome': { flag: '🇮🇹', country: 'Italy' },
    'milan': { flag: '🇮🇹', country: 'Italy' },
    'venice': { flag: '🇮🇹', country: 'Italy' },
    'florence': { flag: '🇮🇹', country: 'Italy' },
    'barcelona': { flag: '🇪🇸', country: 'Spain' },
    'madrid': { flag: '🇪🇸', country: 'Spain' },
    'amsterdam': { flag: '🇳🇱', country: 'Netherlands' },
    'istanbul': { flag: '🇹🇷', country: 'Turkey' },
    'tokyo': { flag: '🇯🇵', country: 'Japan' },
    'osaka': { flag: '🇯🇵', country: 'Japan' },
    'kyoto': { flag: '🇯🇵', country: 'Japan' },
    'hong kong': { flag: '🇭🇰', country: 'Hong Kong' },
    'seoul': { flag: '🇰🇷', country: 'South Korea' },
    'sydney': { flag: '🇦🇺', country: 'Australia' },
    'melbourne': { flag: '🇦🇺', country: 'Australia' },
    'doha': { flag: '🇶🇦', country: 'Qatar' },
    'muscat': { flag: '🇴🇲', country: 'Oman' },
    'riyadh': { flag: '🇸🇦', country: 'Saudi Arabia' },
    'jeddah': { flag: '🇸🇦', country: 'Saudi Arabia' },
    'maldives': { flag: '🇲🇻', country: 'Maldives' },
    'male': { flag: '🇲🇻', country: 'Maldives' },
    'cairo': { flag: '🇪🇬', country: 'Egypt' },
    'new york': { flag: '🇺🇸', country: 'United States' },
    'los angeles': { flag: '🇺🇸', country: 'United States' },
    'miami': { flag: '🇺🇸', country: 'United States' },
    'las vegas': { flag: '🇺🇸', country: 'United States' },
    'berlin': { flag: '🇩🇪', country: 'Germany' },
    'munich': { flag: '🇩🇪', country: 'Germany' },
    'vienna': { flag: '🇦🇹', country: 'Austria' },
    'zurich': { flag: '🇨🇭', country: 'Switzerland' },
    'lisbon': { flag: '🇵🇹', country: 'Portugal' },
    'athens': { flag: '🇬🇷', country: 'Greece' },
    'santorini': { flag: '🇬🇷', country: 'Greece' },
    'prague': { flag: '🇨🇿', country: 'Czech Republic' },
    'stockholm': { flag: '🇸🇪', country: 'Sweden' },
    'oslo': { flag: '🇳🇴', country: 'Norway' },
    'copenhagen': { flag: '🇩🇰', country: 'Denmark' },
    'helsinki': { flag: '🇫🇮', country: 'Finland' },
    'brussels': { flag: '🇧🇪', country: 'Belgium' },
    'toronto': { flag: '🇨🇦', country: 'Canada' },
    'vancouver': { flag: '🇨🇦', country: 'Canada' },
    'colombo': { flag: '🇱🇰', country: 'Sri Lanka' },
    'kathmandu': { flag: '🇳🇵', country: 'Nepal' },
    'nairobi': { flag: '🇰🇪', country: 'Kenya' },
    'manama': { flag: '🇧🇭', country: 'Bahrain' },
    'kuwait city': { flag: '🇰🇼', country: 'Kuwait' },
    'amman': { flag: '🇯🇴', country: 'Jordan' },
    'hanoi': { flag: '🇻🇳', country: 'Vietnam' },
    'ho chi minh': { flag: '🇻🇳', country: 'Vietnam' },
    'manila': { flag: '🇵🇭', country: 'Philippines' },
    'beijing': { flag: '🇨🇳', country: 'China' },
    'shanghai': { flag: '🇨🇳', country: 'China' },
    'marrakech': { flag: '🇲🇦', country: 'Morocco' },
  };

  function getCityInfo(name: string): { flag: string; country: string } | null {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    if (CITY_INFO[lower]) return CITY_INFO[lower];
    const keys = Object.keys(CITY_INFO).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (lower.includes(key)) return CITY_INFO[key];
    }
    return null;
  }

  const SuggestionDropdown = ({ style }: { style?: React.CSSProperties }) => {
    if (!showSuggestions || !suggestions.cities.length) return null;
    return (
      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.13)", zIndex: 9999, maxHeight: 380, overflowY: "auto", marginTop: 4, ...style }}>
        {suggestions.cities.map((c: any, i: number) => {
          const info = getCityInfo(c.name);
          const flag = c.flag || info?.flag || "";
          const country = c.countryName || info?.country || "";
          return (
            <div key={i} onMouseDown={() => handleSelect(c, 'city')}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", borderBottom: "0.5px solid #f1f5f9" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{flag}</span>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{c.name}</div>
                {country && <div style={{ fontSize: 12, color: "#94a3b8" }}>{country}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  const CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .sora { font-family: 'Sora', sans-serif; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
    .ticker-visible { animation: fadeIn 0.4s ease forwards; }
    .ticker-hidden { opacity: 0; }
    .hotel-card { transition: transform .2s, box-shadow .2s; cursor: pointer; }
    .hotel-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    .dest-card { transition: transform .25s; cursor: pointer; }
    .dest-card:hover { transform: translateY(-4px); }
    .gbtn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: all .15s; color: #475569; }
    .gbtn:hover:not(:disabled) { border-color: ${B}; color: ${B}; background: #eff6ff; }
    .gbtn:disabled { opacity: 0.3; cursor: not-allowed; }
    .sfield { cursor: pointer; transition: background 0.15s; }
    .sfield:hover { background: rgba(0,0,0,0.02); }
    .fs { position: fixed; inset: 0; background: #fff; z-index: 9999; display: flex; flex-direction: column; animation: slideInRight 0.22s ease; }
    .ybtn:hover { background: #e6b800 !important; }
    .scroll-x { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .scroll-x::-webkit-scrollbar { display: none; }
  `;

  const DEST_CARDS = DESTINATIONS.slice(0, 6);
  const DEST_CARD_WIDTH = isMobile ? 200 : 256;
  const DEST_VISIBLE = isMobile ? 2 : 4;
  const DEST_MAX_POS = DEST_CARDS.length - DEST_VISIBLE;
  const scrollDestCarousel = (dir: number) => setDestCarouselPos(prev => Math.max(0, Math.min(DEST_MAX_POS, prev + dir)));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 15, lineHeight: 1.6, overflowX: "hidden", paddingBottom: isMobile ? 72 : 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* MOBILE CALENDAR */}
      {isMobile && calOpen && (
        <div className="fs">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setCalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY }}>&#8592;</button>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: NAVY }}>{calMode === "checkin" ? "Select Check-in Date" : "Select Check-out Date"}</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
            {Array.from({ length: 12 }).map((_, i) => { const dm = new Date(today.getFullYear(), today.getMonth() + i); return renderMonth(dm.getFullYear(), dm.getMonth()); })}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 20px 32px", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ border: `2px solid ${calMode === "checkin" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Select"}</div>
              </div>
              <div style={{ border: `2px solid ${calMode === "checkout" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Select"}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
              <button onClick={() => { setCheckIn(""); setCheckOut(""); setCalMode("checkin"); }} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
              <button onClick={() => { if (checkIn && checkOut) setCalOpen(false); }} style={{ background: checkIn && checkOut ? YELLOW : "#e2e8f0", color: checkIn && checkOut ? "#1a1a1a" : "#94a3b8", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: checkIn && checkOut ? "pointer" : "default", fontFamily: "inherit" }}>Select</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE GUESTS */}
      {isMobile && guestOpen && (
        <div className="fs">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setGuestOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY }}>&#8592;</button>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: NAVY }}>Select Rooms &amp; Guests</div>
          </div>
          <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
            {([{ label: "Rooms", sub: "Minimum 1", key: "rooms" as keyof GuestState, min: 1, max: 4 }, { label: "Adults", sub: "13 years & above", key: "adults" as keyof GuestState, min: 1, max: 16 }, { label: "Children", sub: "0–12 years", key: "children" as keyof GuestState, min: 0, max: 8 }]).map(item => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div><div style={{ fontSize: 17, fontWeight: 600, color: NAVY }}>{item.label}</div><div style={{ fontSize: 13, color: "#94a3b8" }}>{item.sub}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button className="gbtn" style={{ width: 40, height: 40 }} disabled={(guests[item.key] as number) <= item.min} onClick={() => updateGuests(item.key, Math.max(item.min, (guests[item.key] as number) - 1))}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, minWidth: 28, textAlign: "center" as const }}>{guests[item.key]}</span>
                  <button className="gbtn" style={{ width: 40, height: 40 }} disabled={(guests[item.key] as number) >= item.max} onClick={() => updateGuests(item.key, Math.min(item.max, (guests[item.key] as number) + 1))}>+</button>
                </div>
              </div>
            ))}
            {guests.children > 0 && (
              <div style={{ marginTop: 16, paddingBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Age of children at check-in</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {guests.childAges.map((age, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Child {idx + 1}</div>
                      <select value={age} onChange={e => { const a = [...guests.childAges]; a[idx] = parseInt(e.target.value); setGuests(p => ({ ...p, childAges: a })); }}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", fontSize: 14, color: NAVY, background: "#f8fafc", outline: "none" }}>
                        {Array.from({ length: 13 }, (_, i) => <option key={i} value={i}>{i === 0 ? "Under 1" : `${i} year${i > 1 ? "s" : ""}`}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 20px 32px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{guests.rooms} Room{guests.rooms > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{guests.adults} Adult{guests.adults > 1 ? "s" : ""}{guests.children > 0 ? `, ${guests.children} Child${guests.children > 1 ? "ren" : ""}` : ""}</div>
            </div>
            <button onClick={() => setGuestOpen(false)} style={{ background: YELLOW, color: "#1a1a1a", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Select</button>
          </div>
        </div>
      )}

      {/* NAV + HERO */}
      <div style={{ background: "linear-gradient(160deg,#0c1f5c 0%,#1a3a8f 40%,#1e4fc2 100%)" }}>
        <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none" }}>rebuq<span style={{ color: YELLOW }}>.</span></a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <a href="/search-hotels" style={{ fontSize: 14, color: YELLOW, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name.split(" ")[0]}</span>
                </div>
              ) : (
                <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in / Sign up</button>
              )}
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.8)", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
              <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? "transparent" : "rgba(255,255,255,0.8)", transition: "all 0.2s" }} />
              <span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.8)", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
            </button>
          )}
        </nav>

        <section style={{ background: "transparent", padding: isMobile ? "48px 0 0" : "72px 0 0", textAlign: "center", position: "relative", overflow: "visible", zIndex: 1 }}>
          <div style={{ padding: isMobile ? "0 20px" : "0 40px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 700, padding: "6px 18px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Exclusive Member Deals</div>
            <h1 className="sora" style={{ fontSize: isMobile ? 34 : 60, fontWeight: 800, color: "#fff", lineHeight: 1.08, maxWidth: 760, margin: "0 auto 18px" }}>Find your <span style={{ color: YELLOW }}>perfect stay</span></h1>
            <p style={{ fontSize: isMobile ? 15 : 16.5, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>2,70,000+ exclusive deals across the globe. Members save 28% on average.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: isMobile ? 12 : 13, padding: "8px 18px", borderRadius: 100, marginBottom: 36 }}>
              <span style={{ width: 8, height: 8, background: "#4ade80", borderRadius: "50%", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
              <span className={tickerVisible ? "ticker-visible" : "ticker-hidden"} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, justifyContent: "center" }}>
                <span style={{ fontWeight: 600, color: YELLOW }}>{ticker.name}</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>saved on</span>
                <span style={{ fontWeight: 600 }}>{ticker.hotel}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>— {ticker.saved}</span>
                <span style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, padding: "2px 8px", borderRadius: 6, color: "rgba(255,255,255,0.7)" }}>{ticker.time}</span>
              </span>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div style={{ width: "100%", padding: isMobile ? "0 12px" : "0 40px" }}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", overflow: "visible", position: "relative", marginBottom: isMobile ? -32 : -36 }}>
              {isMobile ? (
                <div>
                  <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", borderRadius: "16px 16px 0 0", position: "relative" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination</div>
                    <input type="text" placeholder="Where to? e.g. Dubai" value={inputText}
                      onChange={e => { setInputText(e.target.value); setSelection(null); setShowSuggestions(true); setSearchError(""); }}
                      onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                      style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 16, fontWeight: 500, color: NAVY, background: "transparent", padding: 0 }} />
                    <SuggestionDropdown />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f1f5f9" }}>
                    <div className="sfield" style={{ padding: "12px 16px", borderRight: "1px solid #f1f5f9" }} onClick={() => { setCalMode("checkin"); setCalOpen(true); }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
                      <div style={{ fontSize: 14, fontWeight: checkIn ? 600 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
                    </div>
                    <div className="sfield" style={{ padding: "12px 16px" }} onClick={() => { setCalMode("checkout"); setCalOpen(true); }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
                      <div style={{ fontSize: 14, fontWeight: checkOut ? 600 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
                    </div>
                  </div>
                  <div className="sfield" style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setGuestOpen(true)}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Rooms &amp; Guests</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{guestSummary()}</div>
                    </div>
                    <span style={{ fontSize: 18, color: "#94a3b8" }}>&#8250;</span>
                  </div>
                  <button className="ybtn" onClick={handleSearch} style={{ background: YELLOW, color: "#1a1a1a", border: "none", width: "100%", padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 0 16px 16px" }}>Search Hotels</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.4fr auto", alignItems: "stretch", minHeight: 72 }}>
                  <div className="sfield" style={{ padding: "0 24px", borderRight: "1px solid #e2e8f0", borderRadius: "16px 0 0 16px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination</div>
                    <input type="text" placeholder="Enter City name" value={inputText}
                      onChange={e => { setInputText(e.target.value); setSelection(null); setShowSuggestions(true); setSearchError(""); }}
                      onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                      style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 500, color: NAVY, background: "transparent", padding: 0, width: "100%" }} />
                    <SuggestionDropdown style={{ width: 420 }} />
                  </div>
                  <div className="sfield" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: calOpen && calMode === "checkin" ? "#f0f7ff" : "transparent" }} onClick={() => { setCalMode("checkin"); setCalOpen(true); setCalMonthOffset(0); }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
                    <div style={{ fontSize: checkIn ? 15 : 14, fontWeight: checkIn ? 700 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
                  </div>
                  <div className="sfield" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: calOpen && calMode === "checkout" ? "#f0f7ff" : "transparent" }} onClick={() => { setCalMode("checkout"); setCalOpen(true); setCalMonthOffset(0); }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
                    <div style={{ fontSize: checkOut ? 15 : 14, fontWeight: checkOut ? 700 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
                  </div>
                  <div ref={guestRef} className="sfield" style={{ padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }} onClick={() => setGuestOpen(!guestOpen)}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Rooms &amp; Guests</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{guestSummary()}</div>
                    {guestOpen && (
                      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", zIndex: 9999, padding: 20 }}>
                        {([{ label: "Rooms", sub: "Minimum 1", key: "rooms" as keyof GuestState, min: 1, max: 4 }, { label: "Adults", sub: "Age 13+", key: "adults" as keyof GuestState, min: 1, max: 16 }, { label: "Children", sub: "Age 0–12", key: "children" as keyof GuestState, min: 0, max: 8 }]).map(item => (
                          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{item.label}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{item.sub}</div></div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <button className="gbtn" disabled={(guests[item.key] as number) <= item.min} onClick={e => { e.stopPropagation(); updateGuests(item.key, Math.max(item.min, (guests[item.key] as number) - 1)); }}>−</button>
                              <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" as const }}>{guests[item.key]}</span>
                              <button className="gbtn" disabled={(guests[item.key] as number) >= item.max} onClick={e => { e.stopPropagation(); updateGuests(item.key, Math.min(item.max, (guests[item.key] as number) + 1)); }}>+</button>
                            </div>
                          </div>
                        ))}
                        {guests.children > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Age of children at check-in</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {guests.childAges.map((age, idx) => (
                                <div key={idx}>
                                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Child {idx + 1}</div>
                                  <select value={age} onChange={e => { const a = [...guests.childAges]; a[idx] = parseInt(e.target.value); setGuests(p => ({ ...p, childAges: a })); }}
                                    style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: NAVY, background: "#f8fafc", outline: "none" }}>
                                    {Array.from({ length: 13 }, (_, i) => <option key={i} value={i}>{i === 0 ? "Under 1" : `${i} year${i > 1 ? "s" : ""}`}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <button onClick={() => setGuestOpen(false)} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 14 }}>Done</button>
                      </div>
                    )}
                  </div>
                  <button className="ybtn" onClick={handleSearch} style={{ background: YELLOW, color: "#1a1a1a", border: "none", padding: "0 36px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 16px 16px 0", whiteSpace: "nowrap" as const, minWidth: 130 }}>Search</button>
                </div>
              )}

              {!isMobile && calOpen && (
                <div ref={calRef} onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", left: "34%", width: 680, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", zIndex: 9999, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <button onClick={() => setCalMonthOffset(p => Math.max(0, p - 1))} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>&#8249;</button>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1 }}>
                      {renderMonth(d1.getFullYear(), d1.getMonth())}
                      {renderMonth(d2.getFullYear(), d2.getMonth())}
                    </div>
                    <button onClick={() => setCalMonthOffset(p => p + 1)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>&#8250;</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {calMode === "checkin" ? "Select check-in date" : "Select check-out date"}
                      {checkIn && checkOut && <span style={{ color: "#16a34a", marginLeft: 8, fontWeight: 600 }}>✓ {formatDate(checkIn)} → {formatDate(checkOut)}</span>}
                    </div>
                    <button onClick={() => { setCheckIn(""); setCheckOut(""); }} style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                  </div>
                </div>
              )}

              {searchError && (
                <div style={{ padding: "10px 20px", background: "#fef2f2", borderTop: "1px solid #fecaca", borderRadius: "0 0 16px 16px", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                  ⚠ {searchError}
                </div>
              )}
            </div>
          </div>
          <div style={{ height: isMobile ? 48 : 56 }} />
        </section>
      </div>

      {/* STATS — desktop only */}
      {!isMobile && (
        <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", paddingTop: 56 }} ref={statsRef}>
          <div style={{ padding: "26px 40px", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: "center", borderRight: i < 3 ? "1px solid #e2e8f0" : "none", padding: "0 20px" }}>
                <div className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY }}>
                  {s.boldTop ? (
                    <>
                      <span style={{ display: "block", fontSize: 22, fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{(s as any).boldText}</span>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 400, color: "#64748b", marginTop: 4 }}>{s.label}</span>
                    </>
                  ) : (
                    <>{statVals[i]}</>
                  )}
                </div>
                {!s.boldTop && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP DESTINATIONS */}
      <div style={{ padding: isMobile ? "50px 20px" : "70px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Explore by destination</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Top Destinations</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Handpicked destinations with rates unavailable anywhere else.</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
            <span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} /> Live rates
          </span>
        </div>
        <div style={{ overflow: "hidden" }}
          onTouchStart={e => { const t = e.touches[0]; (e.currentTarget as any)._touchStartX = t.clientX; }}
          onTouchEnd={e => { const startX = (e.currentTarget as any)._touchStartX; const endX = e.changedTouches[0].clientX; const diff = startX - endX; if (Math.abs(diff) > 50) { scrollDestCarousel(diff > 0 ? 1 : -1); } }}>
          <div style={{ display: "flex", gap: 14, transform: `translateX(-${destCarouselPos * (DEST_CARD_WIDTH + 14)}px)`, transition: "transform 0.4s cubic-bezier(.4,0,.2,1)" }}>
            {DEST_CARDS.map((d, i) => (
              <div key={i} className="dest-card" onClick={() => handleDestCardClick(d.city)}
                style={{ flex: `0 0 ${DEST_CARD_WIDTH}px`, borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", height: 190, cursor: "pointer" }}>
                <img src={d.img} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)" }} />
                {d.badge && <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 6, background: d.badgeColor, color: d.badgeText }}>{d.badge}</span>}
                <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                  <div className="sora" style={{ fontSize: 17, fontWeight: 700 }}>{d.flag} {d.city}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{d.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 20 }}>
          {!isMobile && <button onClick={() => scrollDestCarousel(-1)} disabled={destCarouselPos === 0} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: destCarouselPos === 0 ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: destCarouselPos === 0 ? 0.4 : 1 }}>‹</button>}
          <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: DEST_CARDS.length - DEST_VISIBLE + 1 }, (_, i) => (<div key={i} onClick={() => setDestCarouselPos(i)} style={{ width: i === destCarouselPos ? 20 : 8, height: 8, borderRadius: 100, background: i === destCarouselPos ? B : "#e2e8f0", cursor: "pointer", transition: "all 0.3s" }} />))}</div>
          {!isMobile && <button onClick={() => scrollDestCarousel(1)} disabled={destCarouselPos >= DEST_MAX_POS} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: destCarouselPos >= DEST_MAX_POS ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: destCarouselPos >= DEST_MAX_POS ? 0.4 : 1 }}>›</button>}
        </div>
      </div>

      {/* HOTELS */}
      <div id="hotels-section" style={{ background: "#f8fafc", padding: isMobile ? "50px 0" : "70px 0" }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Member exclusive rates</p>
          <div style={{ marginBottom: 24 }}>
            <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Member Exclusive Hotels</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Members save an average of <strong>₹24,600</strong> on these properties.</p>
          </div>
          <div className="scroll-x" style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
            {CITY_FILTERS.map(f => {
              const dest = DESTINATIONS.find(d => d.city === f);
              return (
                <button key={f} onClick={() => setActiveCity(f)} style={{ background: activeCity === f ? NAVY : "#fff", border: `1.5px solid ${activeCity === f ? NAVY : "#e2e8f0"}`, color: activeCity === f ? "#fff" : NAVY, fontSize: 13, fontWeight: 500, padding: "7px 18px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.2s" }}>
                  {f === "Top Sellers" ? f : `${dest?.flag || ""} ${f}`}
                </button>
              );
            })}
          </div>
          <div style={{ overflow: "hidden" }}
            onTouchStart={e => { const t = e.touches[0]; (e.currentTarget as any)._touchStartX = t.clientX; }}
            onTouchEnd={e => { const startX = (e.currentTarget as any)._touchStartX; const endX = e.changedTouches[0].clientX; const diff = startX - endX; if (Math.abs(diff) > 50) { scrollHotelCarousel(diff > 0 ? 1 : -1); } }}>
            <div style={{ display: "flex", gap: 20, transform: `translateX(-${hotelCarouselPos * (HOTEL_CARD_WIDTH + 20)}px)`, transition: "transform 0.4s cubic-bezier(.4,0,.2,1)" }}>
              {hotels.map((h, i) => (
                <div key={i} className="hotel-card" onClick={() => handleHotelCardClick(h.name, h.city, h.code)}
                  style={{ flex: `0 0 ${HOTEL_CARD_WIDTH}px`, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ height: 190, position: "relative", overflow: "hidden" }}>
                    <img src={h.img} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {h.badges.map(([label, type]) => { const s = BADGE_STYLES[type] || BADGE_STYLES.luxury; return <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: s.bg, color: s.color }}>{label}</span>; })}
                    </div>
                  </div>
                  <div style={{ padding: "16px 18px 18px" }}>
                    <div style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>{"★".repeat(h.stars)}</div>
                    <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4, minHeight: 42, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{h.loc} · {h.rating}</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 14 }}>
                      {h.tags.map(t => <span key={t} style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{t}</span>)}
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>Check Members Rate →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 20 }}>
            {!isMobile && <button onClick={() => scrollHotelCarousel(-1)} disabled={hotelCarouselPos === 0} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: hotelCarouselPos === 0 ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: hotelCarouselPos === 0 ? 0.4 : 1 }}>‹</button>}
            <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: Math.max(0, hotels.length - HOTEL_VISIBLE + 1) }, (_, i) => (<div key={i} onClick={() => setHotelCarouselPos(i)} style={{ width: i === hotelCarouselPos ? 20 : 8, height: 8, borderRadius: 100, background: i === hotelCarouselPos ? B : "#e2e8f0", cursor: "pointer", transition: "all 0.3s" }} />))}</div>
            {!isMobile && <button onClick={() => scrollHotelCarousel(1)} disabled={hotelCarouselPos >= HOTEL_MAX_POS} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: hotelCarouselPos >= HOTEL_MAX_POS ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: hotelCarouselPos >= HOTEL_MAX_POS ? 0.4 : 1 }}>›</button>}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>↑ Search for more hotels</button>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA — desktop only */}
      {!isMobile && (
        <div style={{ background: "linear-gradient(135deg,#0c1f5c 0%,#1e4fc2 100%)", padding: "64px 40px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 56, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>✦ Already booked elsewhere?</div>
              <h2 className="sora" style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>Don&apos;t overpay. Let our AI <span style={{ color: YELLOW }}>watch the price.</span></h2>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28 }}>Upload your booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops.</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
              <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 5 }}>Already booked? Check for a drop</div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>Takes 30 seconds. We handle the rest.</div>
              <button onClick={() => router.push("/")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload My Booking Voucher</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {isMobile ? (
        <footer style={{ background: NAVY, padding: "20px 20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>rebuq<span style={{ color: B }}>.</span></div>
            <span style={{ fontSize: 11.5, color: "#475569" }}>© 2026 rebuq</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>About</a>
          </div>
        </footer>
      ) : (
        <footer style={{ background: NAVY, padding: "48px 40px 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" }}>
              <div><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div><p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p></div>
              <div style={{ display: "flex", gap: 48 }}>{[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (<div key={col.title}><h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 14 }}>{col.title}</h4>{col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}</div>))}</div>
            </div>
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            </div>
          </div>
        </footer>
      )}

      {/* BOTTOM NAV — mobile only, Deals tab active */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 68, background: "#fff", borderTop: "1px solid #f1f5f9", zIndex: 200, display: "flex", alignItems: "stretch" }}>
          {([
            { label: "Home",    color: "#94a3b8", action: () => router.push("/"),             paths: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"] },
            { label: "Scan",    color: "#94a3b8", action: () => router.push("/"),             paths: ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z", "M12 17a4 4 0 100-8 4 4 0 000 8z"] },
            { label: "Deals",   color: B,         action: () => router.push("/search-hotels"),paths: ["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z", "M7 7h.01"] },
            { label: "Profile", color: "#94a3b8", action: () => router.push(user ? "/dashboard" : "/signin"), paths: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"] },
          ] as const).map(tab => (
            <button key={tab.label} onClick={tab.action}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "8px 0", color: tab.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tab.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {tab.paths.map((p, i) => <path key={i} d={p} />)}
              </svg>
              <span style={{ fontSize: 10.5, fontWeight: tab.label === "Deals" ? 600 : 400 }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
