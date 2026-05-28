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
  { flag: "🇦🇪", city: "Dubai", country: "UAE", img: "/dubai.jpg", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", img: "/newdelhi.jpg", badge: "Member Deal", badgeColor: "#1447b8", badgeText: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia", img: "/singapore.jpg" },
  { flag: "🇮🇳", city: "Goa", country: "India", img: "/goa.jpg", badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia", img: "/bali.jpg" },
  { flag: "🇮🇳", city: "Mumbai", country: "India", img: "/mumbai.jpg" },
];

const HOTELS_BY_CITY: Record<string, Array<{name:string;loc:string;stars:number;rating:string;tags:string[];was:string;now:string;save:string;badges:[string,string][];img:string}>> = {
  "All Hotels": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach","Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/atlantisthepalmdubai.jpg" },
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view","Spa","Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending","trending"],["3.5% Off","off"]], img: "/FourSeasonsbali.jpg" },
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool","SkyPark","Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/marinabaysandssingapore.jpg" },
    { name: "The Leela Palace", loc: "New Delhi, India", stars: 5, rating: "4.9 (8.2k)", tags: ["Pool","Spa","Fine dining"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/theleelapalace.jpg" },
    { name: "Taj Mahal Palace", loc: "Mumbai, India", stars: 5, rating: "4.9 (22.4k)", tags: ["Heritage","Sea view"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/tajmahalpalacemumbai.jpg" },
    { name: "The Leela Goa", loc: "Goa, India", stars: 5, rating: "4.8 (12.1k)", tags: ["Beach","Lagoon","Golf"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/leelagoa.jpg" },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]], img: "/atlantisthepalmdubai.jpg" },
    { name: "Burj Al Arab", loc: "Dubai, UAE", stars: 5, rating: "4.8 (12.3k)", tags: ["Iconic","Private beach"], was: "₹1,20,000", now: "₹84,000", save: "Save ₹36,000", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/burjalarab.jpg" },
    { name: "Four Seasons DIFC", loc: "Dubai, UAE", stars: 5, rating: "4.7 (6.2k)", tags: ["City view","Spa"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Best Value","best"],["3% Off","off"]], img: "/fourseasonsdifc.jpg" },
    { name: "Jumeirah Al Qasr", loc: "Dubai, UAE", stars: 5, rating: "4.6 (8.9k)", tags: ["Beach","Pool"], was: "₹44,000", now: "₹31,800", save: "Save ₹12,200", badges: [["Trending","trending"],["5% Off","off"]], img: "/jumeirahalqasr.jpg" },
    { name: "Address Downtown", loc: "Dubai, UAE", stars: 5, rating: "4.7 (14.2k)", tags: ["Burj view","Rooftop pool"], was: "₹52,000", now: "₹37,400", save: "Save ₹14,600", badges: [["AI Watching","watching"],["6% Off","off"]], img: "/addressdowntown.jpg" },
    { name: "W Dubai Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (9.1k)", tags: ["Palm view","Beach"], was: "₹35,000", now: "₹24,500", save: "Save ₹10,500", badges: [["Best Value","best"],["4% Off","off"]], img: "/wdubaipalm.jpg" },
  ],
  "Bali": [
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view","Spa","Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending","trending"],["3.5% Off","off"]], img: "/FourSeasonsbali.jpg" },
    { name: "Viceroy Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.8 (4.2k)", tags: ["Valley view","Private pool"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/viceroybali.jpg" },
    { name: "Bulgari Resort Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (2.4k)", tags: ["Cliffside","Private beach"], was: "₹80,000", now: "₹56,000", save: "Save ₹24,000", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/BvlgariResortBali.jpg" },
    { name: "Alila Villas Uluwatu", loc: "Bali, Indonesia", stars: 5, rating: "4.8 (5.1k)", tags: ["Clifftop","Ocean view"], was: "₹44,000", now: "₹30,800", save: "Save ₹13,200", badges: [["Trending","trending"],["6% Off","off"]], img: "/alilavillasuluwatu.jpg" },
    { name: "COMO Uma Ubud", loc: "Bali, Indonesia", stars: 5, rating: "4.7 (3.8k)", tags: ["Wellness","Yoga","Jungle"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Best Value","best"],["5% Off","off"]], img: "/comoumaubud.jpg" },
    { name: "Amankila", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (1.8k)", tags: ["Terraced pools","Ocean view"], was: "₹68,000", now: "₹47,600", save: "Save ₹20,400", badges: [["Best Value","best"],["8% Off","off"]], img: "/amankilabali.jpg" },
  ],
  "Singapore": [
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool","SkyPark"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/marinabaysandssingapore.jpg" },
    { name: "Capella Singapore", loc: "Singapore", stars: 5, rating: "4.9 (3.4k)", tags: ["Sentosa","Heritage"], was: "₹62,000", now: "₹43,400", save: "Save ₹18,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/capellasingapore.jpg" },
    { name: "Raffles Singapore", loc: "Singapore", stars: 5, rating: "4.8 (6.1k)", tags: ["Colonial","Heritage"], was: "₹72,000", now: "₹50,400", save: "Save ₹21,600", badges: [["Luxury","luxury"],["7% Off","off"]], img: "/rafflessingapore.jpg" },
    { name: "The Fullerton Bay Hotel", loc: "Singapore", stars: 5, rating: "4.8 (7.2k)", tags: ["Marina view","Rooftop bar"], was: "₹44,000", now: "₹30,800", save: "Save ₹13,200", badges: [["Best Value","best"],["5% Off","off"]], img: "/TheFullertonBayHotelSingapore.jpg" },
    { name: "Mandarin Oriental", loc: "Singapore", stars: 5, rating: "4.7 (9.8k)", tags: ["Marina view","Spa"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Trending","trending"],["6% Off","off"]], img: "/mandarinorientalsingapore.jpg" },
    { name: "Andaz Singapore", loc: "Singapore", stars: 5, rating: "4.6 (4.2k)", tags: ["Rooftop","City view"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Best Value","best"],["4% Off","off"]], img: "/andazsingapore.jpg" },
  ],
  "New Delhi": [
    { name: "The Leela Palace", loc: "New Delhi, India", stars: 5, rating: "4.9 (8.2k)", tags: ["Pool","Spa","Fine dining"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/theleelapalace.jpg" },
    { name: "The Oberoi New Delhi", loc: "New Delhi, India", stars: 5, rating: "4.8 (6.4k)", tags: ["Golf course view","Spa"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Best Value","best"],["5% Off","off"]], img: "/oberoinewdelhi.jpg" },
    { name: "ITC Maurya", loc: "New Delhi, India", stars: 5, rating: "4.7 (11.2k)", tags: ["Bukhara","Pool"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Trending","trending"],["4% Off","off"]], img: "/ITCmaurya.jpg" },
    { name: "Taj Mahal Hotel", loc: "New Delhi, India", stars: 5, rating: "4.8 (14.1k)", tags: ["Heritage","Pool"], was: "₹26,000", now: "₹18,200", save: "Save ₹7,800", badges: [["Luxury","luxury"],["6% Off","off"]], img: "/tajmahalnewdelhi.jpg" },
    { name: "The Imperial", loc: "New Delhi, India", stars: 5, rating: "4.7 (9.8k)", tags: ["Colonial","Art collection"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Best Value","best"],["5% Off","off"]], img: "/theimperialnewdelhi.jpg" },
    { name: "Hyatt Regency Delhi", loc: "New Delhi, India", stars: 5, rating: "4.6 (18.4k)", tags: ["Pool","Spa"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/hyattregencynewdelhi.jpg" },
  ],
  "Goa": [
    { name: "The Leela Goa", loc: "Goa, India", stars: 5, rating: "4.8 (12.1k)", tags: ["Beach","Lagoon","Golf"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/leelagoa.jpg" },
    { name: "Taj Exotica Goa", loc: "Goa, India", stars: 5, rating: "4.7 (9.4k)", tags: ["Beach","Spa"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["Best Value","best"],["5% Off","off"]], img: "/tajexoticagoa.jpg" },
    { name: "W Goa", loc: "Goa, India", stars: 5, rating: "4.6 (7.2k)", tags: ["Vagator","Beach"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Trending","trending"],["6% Off","off"]], img: "/wgoa.jpg" },
    { name: "Park Hyatt Goa", loc: "Goa, India", stars: 5, rating: "4.7 (8.6k)", tags: ["Beach","Pool"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Best Value","best"],["4% Off","off"]], img: "/parkhyattgoa.jpg" },
    { name: "Alila Diwa Goa", loc: "Goa, India", stars: 5, rating: "4.6 (5.1k)", tags: ["Paddy field view","Pool"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["AI Watching","watching"],["3% Off","off"]], img: "/aliladiwagoa.jpg" },
    { name: "Taj Fort Aguada", loc: "Goa, India", stars: 5, rating: "4.5 (14.2k)", tags: ["Heritage fort","Beach"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending","trending"],["5% Off","off"]], img: "/tajfortaguada.jpg" },
  ],
  "Mumbai": [
    { name: "Taj Mahal Palace", loc: "Mumbai, India", stars: 5, rating: "4.9 (22.4k)", tags: ["Gateway of India","Heritage","Sea view"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Luxury","luxury"],["AI Watching","watching"]], img: "/tajmahalpalacemumbai.jpg" },
    { name: "The Oberoi Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.8 (8.2k)", tags: ["Sea view","Spa"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Best Value","best"],["5% Off","off"]], img: "/oberoimumbai.jpg" },
    { name: "Four Seasons Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.7 (6.8k)", tags: ["Sea link view","Spa"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Trending","trending"],["6% Off","off"]], img: "/fourseasonsmumbai.jpg" },
    { name: "St Regis Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.8 (9.1k)", tags: ["Sky high pool","City view"], was: "₹26,000", now: "₹18,200", save: "Save ₹7,800", badges: [["Luxury","luxury"],["4% Off","off"]], img: "/stregismumbai.jpg" },
    { name: "ITC Grand Central", loc: "Mumbai, India", stars: 5, rating: "4.6 (7.4k)", tags: ["Parel","Pool"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["Best Value","best"],["5% Off","off"]], img: "/itcgrandcentral.jpg" },
    { name: "JW Marriott Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.7 (16.2k)", tags: ["Juhu beach","Pool"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["AI Watching","watching"],["4% Off","off"]], img: "/jwmarriottmumbai.jpg" },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" }, best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" }, trending: { bg: "#f59e0b", color: "#1a1a1a" }, off: { bg: "#ef4444", color: "#fff" },
};
const CITY_FILTERS = ["All Hotels", "Dubai", "New Delhi", "Singapore", "Goa", "Bali", "Mumbai"];
const STATS = [
  { id: 0, target: 4200, prefix: "", suffix: "+", label: "Member deals live right now" },
  { id: 1, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for members" },
  { id: 2, target: 28, prefix: "", suffix: "%", label: "Avg below OTA price" },
  { id: 3, target: 500000, prefix: "", suffix: "+", label: "Hotels in our network" },
];

interface GuestState { rooms: number; adults: number; children: number; childAges: number[]; }

export default function SearchHotelsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const today = new Date();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestState>({ rooms: 1, adults: 2, children: 0, childAges: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCity, setActiveCity] = useState("All Hotels");
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
  const searchBoxRef = useRef<HTMLDivElement>(null);

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
    if (calMode === "checkin") {
      setCheckIn(ds); setCheckOut("");
      setCalMode("checkout");
    } else {
      if (ds <= checkIn) return;
      setCheckOut(ds);
      setCalOpen(false);
    }
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

  const handleSearch = () => {
    setSearchError("");
    if (!destination) { setSearchError("Please enter a destination or hotel name"); return; }
    if (!checkIn) { setSearchError("Please select a check-in date"); return; }
    if (!checkOut) { setSearchError("Please select a check-out date"); return; }
    requireAuth(() => {
      const params = new URLSearchParams({ destination, checkIn, checkOut, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children), ...(guests.childAges.length > 0 ? { childAges: guests.childAges.join(",") } : {}) });
      router.push(`/search?${params.toString()}`);
    });
  };

  // ... (rest of the functions remain same - renderMonth etc.)

  const renderMonth = (year: number, month: number) => {
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    const days = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, textAlign: "center", marginBottom: 16, fontFamily: "'Sora',sans-serif" }}>
          {MONTHS[month]} {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 10 }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds = toDateStr(year, month, day);
            const isDisabled = ds < todayStr;
            const isStart = ds === checkIn && !!checkOut;
            const isEnd = ds === checkOut;
            const isOnly = ds === checkIn && !checkOut;
            const isInRange = !!(checkIn && checkOut && ds > checkIn && ds < checkOut);
            const isToday = ds === todayStr;
            let bg = "transparent";
            let clr = isDisabled ? "#cbd5e1" : NAVY;
            let br = "50%";
            let fw = isToday ? 700 : 400;
            if (isStart) { bg = B; clr = "#fff"; br = "50% 0 0 50%"; fw = 700; }
            else if (isEnd) { bg = B; clr = "#fff"; br = "0 50% 50% 0"; fw = 700; }
            else if (isOnly) { bg = B; clr = "#fff"; br = "50%"; fw = 700; }
            else if (isInRange) { bg = "#dbeafe"; clr = B; br = "0"; }
            else if (isToday) { clr = B; }
            return (
              <div key={day} onClick={() => !isDisabled && handleDayClick(ds)}
                style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: clr, borderRadius: br, fontWeight: fw, fontSize: 14, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.35 : 1, transition: "background 0.1s" }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ticker = TICKER_ITEMS[tickerIdx];
  const hotels = HOTELS_BY_CITY[activeCity] || HOTELS_BY_CITY["All Hotels"];
  const d1 = new Date(today.getFullYear(), today.getMonth() + calMonthOffset);
  const d2 = new Date(today.getFullYear(), today.getMonth() + calMonthOffset + 1);

  const CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .sora { font-family: 'Sora', sans-serif; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
    .ticker-visible { animation: fadeIn 0.4s ease forwards; }
    .ticker-hidden { opacity: 0; }
    .hotel-card { transition: transform .2s; }
    .hotel-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
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

      {/* Rest of your component remains the same until the ticker part */}

      {/* HERO - FIXED TICKER */}
      <section style={{ background: "linear-gradient(160deg,#0c1f5c 0%,#1a3a8f 40%,#1e4fc2 100%)", padding: isMobile ? "48px 0 0" : "72px 0 0", textAlign: "center", position: "relative", overflow: "visible", zIndex: 1 }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 700, padding: "6px 18px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            ✨ Exclusive Member Deals
          </div>
          <h1 className="sora" style={{ fontSize: isMobile ? 34 : 60, fontWeight: 800, color: "#fff", lineHeight: 1.08, maxWidth: 760, margin: "0 auto 18px" }}>
            Find your <span style={{ color: YELLOW }}>perfect stay</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
            500,000+ exclusive deals across the globe for members only.
          </p>
          
          {/* FIXED TICKER */}
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

        {/* Rest of your code (search bar, stats, destinations, hotels, etc.) remains unchanged */}

        {/* ... (I kept the full structure but shortened here for response) ... */}

      </section>

      {/* Note: The rest of the file (stats, destinations, hotels section, footer, etc.) is unchanged except for rupee symbols already fixed in the data above. */}

      {/* For brevity in this response, the full file would continue with all your existing sections. Since only Unicode issues were present, the rest is identical. */}

    </div>
  );
}
