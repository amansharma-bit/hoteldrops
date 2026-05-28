"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

const B = "#1447b8";
const YELLOW = "#FCD34D";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); 
    window.addEventListener("resize", check);
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
  { flag: "🇦🇪", city: "Dubai", country: "UAE", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", badge: "Member Deal", badgeColor: "#1447b8", badgeText: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia" },
  { flag: "🇮🇳", city: "Goa", country: "India", badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia" },
  { flag: "🇮🇳", city: "Mumbai", country: "India" },
];

const HOTELS_BY_CITY: Record<string, Array<{name:string;loc:string;stars:number;rating:string;tags:string[];was:string;now:string;save:string;badges:[string,string][]}>> = {
  "All Hotels": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach","Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]] },
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view","Spa","Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending","trending"],["3.5% Off","off"]] },
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool","SkyPark","Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["AI Watching","watching"],["4% Off","off"]] },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]] },
    { name: "Burj Al Arab", loc: "Dubai, UAE", stars: 5, rating: "4.8 (12.3k)", tags: ["Iconic","Private beach"], was: "₹1,20,000", now: "₹84,000", save: "Save ₹36,000", badges: [["Luxury","luxury"],["AI Watching","watching"]] },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" }, 
  best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" }, 
  trending: { bg: "#f59e0b", color: "#1a1a1a" }, 
  off: { bg: "#ef4444", color: "#fff" },
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
  const [activeCity, setActiveCity] = useState("All Hotels");
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [statVals, setStatVals] = useState(STATS.map(s => `${s.prefix}0${s.suffix}`));
  const [searchError, setSearchError] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [calMode, setCalMode] = useState<"checkin"|"checkout">("checkin");
  const [guestOpen, setGuestOpen] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");

  const calRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
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
      setTimeout(() => { 
        setTickerIdx(p => (p + 1) % TICKER_ITEMS.length); 
        setTickerVisible(true); 
      }, 400);
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
            const progress = Math.min((ts - start) / 1200, 1);
            setStatVals(prev => {
              const n = [...prev];
              const currentCount = Math.floor(progress * s.target);
              n[i] = `${s.prefix}${currentCount.toLocaleString("en-IN")}${s.suffix}`;
              return n;
            });
            if (progress < 1) requestAnimationFrame(step);
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
      setCheckIn(ds); 
      setCheckOut("");
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
    if (data?.session) action(); else router.push(`/signin?redirect=/search-hotels`);
  };

  const handleSearch = () => {
    setSearchError("");
    if (!destination) { setSearchError("Please enter a destination or hotel name"); return; }
    if (!checkIn) { setSearchError("Please select a check-in date"); return; }
    if (!checkOut) { setSearchError("Please select a check-out date"); return; }
    requireAuth(() => {
      const params = new URLSearchParams({ 
        destination, 
        checkIn, 
        checkOut, 
        adults: String(guests.adults), 
        rooms: String(guests.rooms), 
        children: String(guests.children), 
        ...(guests.childAges.length > 0 ? { childAges: guests.childAges.join(",") } : {}) 
      });
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedbackMessage("Analyzing your voucher layout via Rebuq OCR engine...");
    setFeedbackType("info");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileDataUrl: reader.result }),
        });
        const result = await res.json();

        switch (result?.status) {
          case "VALID_PREPAID":
          case "VALID_POSTPAID":
          case "VALID_SCREENSHOT":
            setFeedbackType("success");
            setFeedbackMessage(`Success! Voucher locked. We are now scanning "${result.data.hotel_name}" every 6 hours for rate drops.`);
            setDestination(result.data.hotel_name);
            setCheckIn(result.data.check_in);
            setCheckOut(result.data.check_out);
            break;
          default:
            setFeedbackType("error");
            setFeedbackMessage("We had trouble reading this document layout clearly. Please try a cleaner snapshot file.");
        }
      } catch {
        setFeedbackType("error");
        setFeedbackMessage("Connection tracking timed out. Please verify upload network stability.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
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

  const CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .sora { font-family: 'Sora', sans-serif; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
    .ticker-visible { animation: fadeIn 0.4s ease forwards; }
    .ticker-hidden { opacity: 0; }
    .hotel-card { transition: transform .2s; }
    .hotel-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    .gbtn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: all .15s; color: #475569; }
    .gbtn:hover:not(:disabled) { border-color: ${B}; color: ${B}; background: #eff6ff; }
    .gbtn:disabled { opacity: 0.3; cursor: not-allowed; }
    .sfield { cursor: pointer; transition: background 0.15s; position: relative; }
    .sfield:hover { background: rgba(0,0,0,0.02); }
    .arrow-indicator { font-size: 10px; color: #64748b; margin-left: 6px; display: inline-block; vertical-align: middle; transition: transform 0.2s; }
    .sfield:hover .arrow-indicator { color: ${B}; }
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
            <button onClick={() => setCalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1, padding: 2 }}>←</button>
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
        </div>
      )}

      {/* ── MOBILE FULL-SCREEN GUESTS ── */}
      {isMobile && guestOpen && (
        <div className="fs">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <button onClick={() => setGuestOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1, padding: 2 }}>←</button>
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
                  <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, minWidth: 28, textAlign: "center" }}>{guests[item.key]}</span>
                  <button className="gbtn" style={{ width: 40, height: 40 }} disabled={(guests[item.key] as number) >= item.max}
                    onClick={() => updateGuests(item.key, Math.min(item.max, (guests[item.key] as number) + 1))}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 20px 32px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <button onClick={() => setGuestOpen(false)} style={{ background: YELLOW, color: "#1a1a1a", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%" }}>Select</button>
          </div>
        </div>
      )}

      {/* ── STICKY TOP NAVIGATION BAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: NAVY, color: "#fff", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "'Sora', sans-serif", color: "#fff" }}>rebuq<span style={{ color: YELLOW }}>.</span></span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {!isMobile && <span style={{ fontSize: 14, color: "#94a3b8", cursor: "pointer" }}>How it works</span>}
          {!isMobile && <span style={{ fontSize: 14, color: "#fff", fontWeight: 500, cursor: "pointer" }}>Exclusive Member Deals</span>}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{user.name[0].toUpperCase()}</div>
              {!isMobile && <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</span>}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>A</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Aman</span>
              <button style={{ background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,25
