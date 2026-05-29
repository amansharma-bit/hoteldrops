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

      {/* ── MOBILE FULL-SCREEN CALENDAR ── */}
      {isMobile && calOpen && (
        <div className="fs">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setCalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1, padding: 2 }}>&#8592;</button>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: NAVY }}>
              {calMode === "checkin" ? "Select Check-in Date" : "Select Check-out Date"}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const dm = new Date(today.getFullYear(), today.getMonth() + i);
              return renderMonth(dm.getFullYear(), dm.getMonth());
            })}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 20px 32px", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ border: `2px solid ${calMode === "checkin" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in date</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Select"}</div>
              </div>
              <div style={{ border: `2px solid ${calMode === "checkout" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out date</div>
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

      {/* ── MOBILE FULL-SCREEN GUESTS ── */}
      {isMobile && guestOpen && (
        <div className="fs">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setGuestOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1, padding: 2 }}>&#8592;</button>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: NAVY }}>Select Rooms &amp; Guests</div>
          </div>
          <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
            {[
              { label: "Rooms", sub: "Minimum 1", key: "rooms" as keyof GuestState, min: 1, max: 4 },
              { label: "Adults", sub: "13 years & above", key: "adults" as keyof GuestState, min: 1, max: 16 },
              { label: "Children", sub: "0–12 years", key: "children" as keyof GuestState, min: 0, max: 8 },
            ].map(item => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: NAVY }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{item.sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button className="gbtn" style={{ width: 40, height: 40 }} disabled={(guests[item.key] as number) <= item.min}
                    onClick={() => updateGuests(item.key, Math.max(item.min, (guests[item.key] as number) - 1))}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, minWidth: 28, textAlign: "center" as const }}>{guests[item.key]}</span>
                  <button className="gbtn" style={{ width: 40, height: 40 }} disabled={(guests[item.key] as number) >= item.max}
                    onClick={() => updateGuests(item.key, Math.min(item.max, (guests[item.key] as number) + 1))}>+</button>
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
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: "#FCD34D", textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
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

      {/* HERO */}
      <section style={{ background: "transparent", padding: isMobile ? "48px 0 0" : "72px 0 0", textAlign: "center", position: "relative", overflow: "visible", zIndex: 1 }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 700, padding: "6px 18px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            ✦ Exclusive Member Deals
          </div>
          <h1 className="sora" style={{ fontSize: isMobile ? 34 : 60, fontWeight: 800, color: "#fff", lineHeight: 1.08, maxWidth: 760, margin: "0 auto 18px" }}>
            Find your <span style={{ color: YELLOW }}>perfect stay</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
            500,000+ exclusive deals across the globe for members only.
          </p>
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
        <div ref={searchBoxRef} style={{ width: "100%", padding: isMobile ? "0 12px" : "0 40px" }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", overflow: "visible", position: "relative", marginBottom: isMobile ? -32 : -36 }}>

            {isMobile ? (
              <div>
                <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", borderRadius: "16px 16px 0 0", position: "relative" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination or hotel</div>
                  <input type="text" placeholder="Where to? e.g. Dubai, UAE" value={destination}
                    onChange={e => { setDestination(e.target.value); setShowSuggestions(true); setSearchError(""); }}
                    onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 16, fontWeight: 500, color: NAVY, background: "transparent", padding: 0 }} />
                  {showSuggestions && destination.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 9999, maxHeight: 220, overflowY: "auto" as const, marginTop: 4 }}>
                      {DESTINATIONS.filter(d => `${d.city}, ${d.country}`.toLowerCase().includes(destination.toLowerCase())).map((d, i) => (
                        <div key={i} onMouseDown={() => { setDestination(`${d.city}, ${d.country}`); setShowSuggestions(false); }}
                          style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: NAVY, borderBottom: "1px solid #f8fafc" }}>
                          <span style={{ fontSize: 20 }}>{d.flag}</span>
                          <div><div style={{ fontWeight: 600 }}>{d.city}</div><div style={{ fontSize: 12, color: "#64748b" }}>{d.country}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f1f5f9" }}>
                  <div className="sfield" style={{ padding: "12px 16px", borderRight: "1px solid #f1f5f9", background: calOpen && calMode === "checkin" ? "#f0f7ff" : "transparent" }}
                    onClick={() => { setCalMode("checkin"); setCalOpen(true); }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
                    <div style={{ fontSize: 14, fontWeight: checkIn ? 600 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
                  </div>
                  <div className="sfield" style={{ padding: "12px 16px", background: calOpen && calMode === "checkout" ? "#f0f7ff" : "transparent" }}
                    onClick={() => { setCalMode("checkout"); setCalOpen(true); }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
                    <div style={{ fontSize: 14, fontWeight: checkOut ? 600 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
                  </div>
                </div>
                <div className="sfield" style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setGuestOpen(true)}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Rooms &amp; Guests</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{guestSummary()}</div>
                  </div>
                  <span style={{ fontSize: 18, color: "#94a3b8" }}>&#8250;</span>
                </div>
                <button className="ybtn" onClick={handleSearch} style={{ background: YELLOW, color: "#1a1a1a", border: "none", width: "100%", padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 0 16px 16px" }}>
                  Search Hotels
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.4fr auto", alignItems: "stretch", minHeight: 72 }}>
                <div className="sfield" style={{ padding: "0 24px", borderRight: "1px solid #e2e8f0", borderRadius: "16px 0 0 16px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination or hotel</div>
                  <input type="text" placeholder="Enter city, area or property name" value={destination}
                    onChange={e => { setDestination(e.target.value); setShowSuggestions(true); setSearchError(""); }}
                    onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 500, color: NAVY, background: "transparent", padding: 0, width: "100%" }} />
                  {showSuggestions && destination.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, width: 340, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 9999, maxHeight: 240, overflowY: "auto" as const, marginTop: 6 }}>
                      {DESTINATIONS.filter(d => `${d.city}, ${d.country}`.toLowerCase().includes(destination.toLowerCase())).map((d, i) => (
                        <div key={i} onMouseDown={() => { setDestination(`${d.city}, ${d.country}`); setShowSuggestions(false); }}
                          style={{ padding: "11px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: NAVY, borderBottom: "1px solid #f8fafc" }}
                          onMouseOver={e => (e.currentTarget.style.background = "#f0f7ff")} onMouseOut={e => (e.currentTarget.style.background = "#fff")}>
                          <span style={{ fontSize: 20 }}>{d.flag}</span>
                          <div><div style={{ fontWeight: 600 }}>{d.city}</div><div style={{ fontSize: 12, color: "#64748b" }}>{d.country}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sfield" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: calOpen && calMode === "checkin" ? "#f0f7ff" : "transparent" }}
                  onClick={() => { setCalMode("checkin"); setCalOpen(true); setCalMonthOffset(0); }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
                  <div style={{ fontSize: checkIn ? 15 : 14, fontWeight: checkIn ? 700 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
                </div>
                <div className="sfield" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: calOpen && calMode === "checkout" ? "#f0f7ff" : "transparent" }}
                  onClick={() => { setCalMode("checkout"); setCalOpen(true); setCalMonthOffset(0); }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
                  <div style={{ fontSize: checkOut ? 15 : 14, fontWeight: checkOut ? 700 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
                </div>
                <div ref={guestRef} className="sfield" style={{ padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }} onClick={() => setGuestOpen(!guestOpen)}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Rooms &amp; Guests</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}><span>{guestSummary()}</span><span style={{ fontSize: 9, color: "#94a3b8" }}></span></div>
                  {guestOpen && (
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", zIndex: 9999, padding: 20 }}>
                      {[
                        { label: "Rooms", sub: "Minimum 1", key: "rooms" as keyof GuestState, min: 1, max: 4 },
                        { label: "Adults", sub: "Age 13+", key: "adults" as keyof GuestState, min: 1, max: 16 },
                        { label: "Children", sub: "Age 0–12", key: "children" as keyof GuestState, min: 0, max: 8 },
                      ].map(item => (
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

            {/* Desktop calendar popup — opens UPWARD */}
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
                    {checkIn && checkOut && <span style={{ color: "#16a34a", marginLeft: 8, fontWeight: 600 }}>&#10003; {formatDate(checkIn)} → {formatDate(checkOut)}</span>}
                  </div>
                  <button onClick={() => { setCheckIn(""); setCheckOut(""); }} style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                </div>
              </div>
            )}

            {searchError && (
              <div style={{ padding: "10px 20px", background: "#fef2f2", borderTop: "1px solid #fecaca", borderRadius: "0 0 16px 16px", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                &#9888; {searchError}
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
          {DESTINATIONS.map((d, i) => (
            <div key={i} onClick={() => { setActiveCity(d.city); setDestination(`${d.city}, ${d.country}`); document.getElementById("hotels-section")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ borderRadius: 14, overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", transition: "transform .25s", height: isMobile ? 140 : 200 }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-4px)")} onMouseOut={e => (e.currentTarget.style.transform = "none")}>
              <img src={d.img} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop"; }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)" }} />
              {d.badge && <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 6, background: d.badgeColor, color: d.badgeText }}>{d.badge}</span>}
              <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700 }}>{d.city}</div>
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
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Members save an average of <strong>₹24,600</strong> on these properties.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
            {CITY_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveCity(f)} style={{ background: activeCity === f ? NAVY : "#fff", border: `1.5px solid ${activeCity === f ? NAVY : "#e2e8f0"}`, color: activeCity === f ? "#fff" : NAVY, fontSize: 13, fontWeight: 500, padding: "7px 18px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.2s" }}>
                {f === "All Hotels" ? f : `${DESTINATIONS.find(d => d.city === f)?.flag || ""} ${f}`}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {hotels.map((h, i) => (
              <div key={i} className="hotel-card" onClick={() => requireAuth(() => router.push(`/hotel/372446?checkIn=${checkIn || "2026-08-11"}&checkOut=${checkOut || "2026-08-13"}&adults=${guests.adults}&rooms=${guests.rooms}`))}
                style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
                <div style={{ height: 190, position: "relative", overflow: "hidden" }}>
                  <img src={h.img} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {h.badges.map(([label, type]) => { const s = BADGE_STYLES[type] || BADGE_STYLES.luxury; return <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: s.bg, color: s.color }}>{label}</span>; })}
                  </div>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>{"&#9733;".repeat(0).padStart(0) + "★★★★★".slice(0, h.stars)}</div>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{h.loc} · {h.rating}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 14 }}>
                    {h.tags.map(t => <span key={t} style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{t}</span>)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>{h.was}</div>
                      <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{h.now} <span style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span></div>
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>{h.save}</div>
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>View deal →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>↑ Search for more hotels</button>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ background: "linear-gradient(135deg,#0c1f5c 0%,#1e4fc2 100%)", padding: isMobile ? "50px 20px" : "64px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>✦ Already booked elsewhere?</div>
            <h2 className="sora" style={{ fontSize: isMobile ? 26 : 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>Don&apos;t overpay. Let our AI <span style={{ color: YELLOW }}>watch the price.</span></h2>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28 }}>Upload your booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops.</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 5 }}>Already booked? Check for a drop</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>Takes 30 seconds. We handle the rest.</div>
            <button onClick={() => router.push("/")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload my booking →</button>
            <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748b", marginTop: 10 }}>Free to check · Pay only if we save you money</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 28 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
