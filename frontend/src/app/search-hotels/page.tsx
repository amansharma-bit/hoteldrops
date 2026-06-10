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

const CONTINENT_CITIES = [
  {
    continent: "Asia",
    cities: [
      { city: "Dubai", country: "UAE", img: "/dubai.jpg", flag: "🇦🇪", placeId: "ChIJRcbZaklDXz4RRlNFzTjIBrw" },
      { city: "Bali", country: "Indonesia", img: "/bali.jpg", flag: "🇮🇩", placeId: "ChIJoQ8Q6NB1HTURKbCGSA2IXBQ" },
      { city: "Bangkok", country: "Thailand", img: "/hyattregencybangkok.jpg", flag: "🇹🇭", placeId: "ChIJ82ENKDJgHTERIEjiXbIAAQE" },
      { city: "Singapore", country: "Singapore", img: "/singapore.jpg", flag: "🇸🇬", placeId: "ChIJdZODzGQX2jERqFKjFmBRoEA" },
      { city: "Goa", country: "India", img: "/goa.jpg", flag: "🇮🇳", placeId: "ChIJH7LEFpqFvzsRf4mEr62lFRQ" },
      { city: "Mumbai", country: "India", img: "/mumbai.jpg", flag: "🇮🇳", placeId: "ChIJwe1EZjDG5zsRmKxMaa4f36o" },
      { city: "New Delhi", country: "India", img: "/newdelhi.jpg", flag: "🇮🇳", placeId: "ChIJLbZ-NFv9DDkRzk0gTkm3wlI" },
      { city: "Maldives", country: "Maldives", img: "/Westinmaldives.jpg", flag: "🇲🇻", placeId: "ChIJo1WKZL-AxTkRIZE_gWVbHhI" },
    ]
  },
  {
    continent: "Middle East",
    cities: [
      { city: "Abu Dhabi", country: "UAE", img: "/Crowneplazayasidland.jpg", flag: "🇦🇪", placeId: "ChIJi5RHN7ZrXj4RLgFiiLuMeCA" },
    ]
  },
  {
    continent: "Europe",
    cities: [
      { city: "London", country: "United Kingdom", img: "/langhamlondon.jpg", flag: "🇬🇧", placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI" },
    ]
  },
];

// CITY_FILTERS removed

const STATS = [
  { id: 0, target: 4200, prefix: "", suffix: "+", label: "Member deals live right now" },
  { id: 1, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for members" },
  { id: 2, target: 28, prefix: "", suffix: "%", label: "Avg below OTA price" },
  { id: 3, target: 500000, prefix: "", suffix: "+", label: "Hotels in our network" },
];

interface GuestState { rooms: number; adults: number; children: number; childAges: number[]; }

interface Selection {
  label: string;
  type: 'city' | 'hotel' | 'area' | 'landmark' | 'airport';
  placeId?: string;
  hotelId?: string;
  lat?: number;
  lng?: number;
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
    const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [statVals, setStatVals] = useState(STATS.map(s => `${s.prefix}${s.target.toLocaleString("en-IN")}${s.suffix}`));
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
        const res = await fetch(`${API}/api/hotels/suggest?q=${encodeURIComponent(inputText)}`);
        const data = await res.json();
        const cities = data.cities || [];
        const hotels = data.hotels || [];
        // Only fall back to defaults if API returned nothing AND input is short
        if (cities.length === 0 && hotels.length === 0) {
          const q = inputText.toLowerCase();
          const matched = defaultSuggestions.cities.filter((c: any) =>
            c.name.toLowerCase().includes(q)
          );
          setSuggestions({ cities: matched, hotels: [], areas: [], landmarks: [], airport: null });
        } else {
          setSuggestions({ cities, hotels, areas: [], landmarks: [], airport: null });
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
      if (sel.type === 'hotel' && sel.hotelId) {
        router.push(`/hotel/${sel.hotelId}?${params.toString()}`);
      } else if (sel.placeId) {
        params.set('placeId', sel.placeId);
        params.set('destination', sel.label);
        router.push(`/search?${params.toString()}`);
      } else {
        // No placeId — fetch it from suggest API first
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
        params.set('destination', sel.label);
        if (sel.lat) params.set('refLat', String(sel.lat));
        if (sel.lng) params.set('refLng', String(sel.lng));
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
    };
    setSelection(sel);
    setInputText(item.name);
    setShowSuggestions(false);
    setTimeout(() => { setCalMode("checkin"); setCalOpen(true); }, 100);
  };

  const handleHotelCardClick = async (hotelName: string, city: string) => {
    requireAuth(async () => {
      const ci = checkIn || defaults.checkIn;
      const co = checkOut || defaults.checkOut;
      try {
        const res = await fetch(`${API}/api/hotels/suggest?q=${encodeURIComponent(hotelName)}`);
        const data = await res.json();
        const match = (data.hotels || []).find((h: any) => h.name.toLowerCase().includes(hotelName.toLowerCase().slice(0, 15)));
        if (match?.hotelId) {
          const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children) });
          const url = `/hotel/${match.hotelId}?${params.toString()}`;
          isMobile ? router.push(url) : window.open(url, '_blank');
        } else {
          const cityMatch = (data.cities || []).find((c: any) => c.name?.toLowerCase().includes(city.toLowerCase()));
          const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: city });
          if (cityMatch?.placeId) params.set('placeId', cityMatch.placeId);
          const url = `/search?${params.toString()}`;
          isMobile ? router.push(url) : window.open(url, '_blank');
        }
      } catch {
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: city });
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
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: cityName });
        if (match?.placeId) params.set('placeId', match.placeId);
        router.push(`/search?${params.toString()}`);
      } catch {
        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: cityName });
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
  const hotels: any[] = [];
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
    if (!showSuggestions || (!suggestions.cities.length && !suggestions.hotels.length)) return null;
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
        {suggestions.hotels.length > 0 && (
          <>
            <div style={{ padding: "5px 16px 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>Hotels</div>
            {suggestions.hotels.map((h: any, i: number) => {
              const hInfo = getCityInfo(h.city || h.name);
              const hFlag = h.flag || hInfo?.flag || "🏨";
              const hCountry = h.countryName || hInfo?.country || "";
              return (
                <div key={i} onMouseDown={() => handleSelect(h, 'hotel')}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: "0.5px solid #f1f5f9" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{hFlag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: NAVY, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{h.city}{hCountry ? `, ${hCountry}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
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
  `;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 15, lineHeight: 1.6, overflowX: "hidden" }}>
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

        {isMobile && menuOpen && (
          <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { router.push("/search-hotels"); setMenuOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button>
            <button onClick={() => window.location.href = "/signin"} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Log in / Sign up</button>
          </div>
        )}

        <section style={{ background: "transparent", padding: isMobile ? "48px 0 0" : "72px 0 0", textAlign: "center", position: "relative", overflow: "visible", zIndex: 1 }}>
          <div style={{ padding: isMobile ? "0 20px" : "0 40px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 700, padding: "6px 18px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>✦ Exclusive Member Deals</div>
            <h1 className="sora" style={{ fontSize: isMobile ? 34 : 60, fontWeight: 800, color: "#fff", lineHeight: 1.08, maxWidth: 760, margin: "0 auto 18px" }}>Find your <span style={{ color: YELLOW }}>perfect stay</span></h1>
            <p style={{ fontSize: isMobile ? 15 : 16.5, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>500,000+ exclusive deals across the globe for members only.</p>
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
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination or hotel</div>
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
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination or hotel</div>
                    <input type="text" placeholder="Enter city or hotel name" value={inputText}
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

      {/* STATS */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", paddingTop: isMobile ? 48 : 56 }} ref={statsRef}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px" : "26px 40px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: !isMobile && i < 3 ? "1px solid #e2e8f0" : "none", padding: "0 20px" }}>
              <div className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY }}>{statVals[i]}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP DESTINATIONS */}
      <div style={{ padding: isMobile ? "50px 20px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 14 }}>
          {DESTINATIONS.slice(0, 6).map((d, i) => (
            <div key={i} className="dest-card" onClick={() => handleDestCardClick(d.city)}
              style={{ borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", height: isMobile ? 140 : 200 }}>
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

      {/* HOTELS */}
      <div id="hotels-section" style={{ background: "#f8fafc", padding: isMobile ? "50px 0" : "70px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Member exclusive rates</p>
          <div style={{ marginBottom: 24 }}>
            <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Member Exclusive Hotels</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>rebuq members get exclusive rates at top hotels across the world.</p>
          </div>
          <div>
            {CONTINENT_CITIES.map(group => (
              <div key={group.continent} style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 16 }}>{group.continent}</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
                  {group.cities.map(c => (
                    <div key={c.city} onClick={async () => {
                      requireAuth(async () => {
                        const today = new Date();
                        const ci = today.toISOString().split("T")[0];
                        const co = new Date(today.getTime() + 2*86400000).toISOString().split("T")[0];
                        const params = new URLSearchParams({ checkIn: ci, checkOut: co, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), destination: c.city });
                        if (c.placeId) params.set("placeId", c.placeId);
                        router.push(`/search?${params.toString()}`);
                      });
                    }}
                    style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer", position: "relative", height: isMobile ? 130 : 160, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "transform 0.2s" }}
                    className="city-card">
                      <img src={c.img} alt={c.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
                      <div style={{ position: "absolute", bottom: 10, left: 12, color: "#fff" }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 14 : 16, fontWeight: 800 }}>{c.flag} {c.city}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{c.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
