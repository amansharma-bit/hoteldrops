"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = "https://hoteldrops-production.up.railway.app/api/hotels";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";
const YELLOW = "#FCD34D";

// ── Helpers ──────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatINR(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function getDaysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number): number { return new Date(y, m, 1).getDay(); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Hotel {
  code: number; name: string; stars: number; zone: { name: string };
  minRate: number; currency: string; categoryName: string;
  imageUrl?: string; address?: string; chain?: string; lowestPriceINR?: number;
}
interface GuestState { rooms: number; adults: number; children: number; }

// ── Static data ───────────────────────────────────────────────────────────────
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop",
];

// Minimal amenity icons — just SVG path + label, no colored backgrounds (like Image 3)
const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi":       "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h2v-2h-2v2zm0-4h2V7h-2v7z",
  "Pool":            "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z",
  "Restaurant":      "M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-3.87-2.52-5-7.49-5C3.52 9.99 1 11.12 1 14.99v1h15.03v-1z",
  "Parking":         "M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z",
  "Breakfast":       "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z",
  "Airport Shuttle": "M17 5H3C1.9 5 1 5.9 1 7v9h2c0 1.65 1.34 3 3 3s3-1.35 3-3h6c0 1.65 1.34 3 3 3s3-1.35 3-3h2v-5l-5-6zM3 11V7h4v4H3zm3 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7-6.5H9V7h4v4zm4 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6.5h-3V7h1.5l1.5 4z",
  "Spa":             "M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z",
  "Gym":             "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z",
};

const FILTER_NAMES = ["Free Cancellation", "Free Breakfast", "Rated Exceptional (9+)", "Pool", "Private Beach", "Spa"];
const FILTER_COUNTS = [309, 617, 190, 428, 124, 201];

// ── Main export ───────────────────────────────────────────────────────────────
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#64748b", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span>Loading search…</span>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}

// ── Calendar component ────────────────────────────────────────────────────────
function CalendarScreen({
  checkIn, checkOut, onSelect, onClose
}: {
  checkIn: string; checkOut: string;
  onSelect: (ci: string, co: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [mode, setMode] = useState<"checkin"|"checkout">(checkIn ? "checkout" : "checkin");
  const [ci, setCi] = useState(checkIn);
  const [co, setCo] = useState(checkOut);

  const handleDay = (ds: string) => {
    if (mode === "checkin") {
      setCi(ds); setCo(""); setMode("checkout");
    } else {
      if (ds <= ci) return;
      setCo(ds);
    }
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const renderMonth = (year: number, month: number) => {
    const days = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, textAlign: "center", marginBottom: 16 }}>
          {MONTHS[month]} {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 8 }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds = toDateStr(year, month, day);
            const isDisabled = ds < todayStr;
            const isStart = ds === ci && !!co;
            const isEnd = ds === co;
            const isOnly = ds === ci && !co;
            const isInRange = !!(ci && co && ds > ci && ds < co);
            const isToday = ds === todayStr;
            let bg = "transparent", clr = isDisabled ? "#cbd5e1" : NAVY, br = "50%", fw = isToday ? 700 : 400;
            if (isStart) { bg = B; clr = "#fff"; br = "50% 0 0 50%"; fw = 700; }
            else if (isEnd) { bg = B; clr = "#fff"; br = "0 50% 50% 0"; fw = 700; }
            else if (isOnly) { bg = B; clr = "#fff"; br = "50%"; fw = 700; }
            else if (isInRange) { bg = "#dbeafe"; clr = B; br = "0"; }
            else if (isToday) clr = B;
            return (
              <div key={day} onClick={() => !isDisabled && handleDay(ds)}
                style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: clr, borderRadius: br, fontWeight: fw, fontSize: 14, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.35 : 1 }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column", animation: "slideInRight 0.22s ease" }}>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1 }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>
          {mode === "checkin" ? "Select Check-in Date" : "Select Check-out Date"}
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
          <div style={{ border: `2px solid ${mode === "checkin" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in date</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: ci ? NAVY : "#94a3b8" }}>{ci ? formatDate(ci) : "Select"}</div>
          </div>
          <div style={{ border: `2px solid ${mode === "checkout" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out date</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: co ? NAVY : "#94a3b8" }}>{co ? formatDate(co) : "Select"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
          <button onClick={() => { setCi(""); setCo(""); setMode("checkin"); }} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Clear</button>
          <button onClick={() => { if (ci && co) { onSelect(ci, co); onClose(); } }} style={{ background: ci && co ? YELLOW : "#e2e8f0", color: ci && co ? "#1a1a1a" : "#94a3b8", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: ci && co ? "pointer" : "default" }}>Select</button>
        </div>
      </div>
    </div>
  );
}

// ── Guests screen ─────────────────────────────────────────────────────────────
function GuestsScreen({
  guests, onSelect, onClose
}: { guests: GuestState; onSelect: (g: GuestState) => void; onClose: () => void; }) {
  const [g, setG] = useState(guests);
  const update = (key: keyof GuestState, val: number) => setG(p => ({ ...p, [key]: val }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column", animation: "slideInRight 0.22s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY, lineHeight: 1 }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>Select Rooms & Guests</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <button disabled={(g[item.key] as number) <= item.min} onClick={() => update(item.key, Math.max(item.min, (g[item.key] as number) - 1))}
                style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (g[item.key] as number) <= item.min ? 0.3 : 1 }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, minWidth: 28, textAlign: "center" as const }}>{g[item.key]}</span>
              <button disabled={(g[item.key] as number) >= item.max} onClick={() => update(item.key, Math.min(item.max, (g[item.key] as number) + 1))}
                style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (g[item.key] as number) >= item.max ? 0.3 : 1 }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 20px 32px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{g.rooms} Room{g.rooms > 1 ? "s" : ""}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{g.adults} Adult{g.adults > 1 ? "s" : ""}{g.children > 0 ? `, ${g.children} Child${g.children > 1 ? "ren" : ""}` : ""}</div>
        </div>
        <button onClick={() => { onSelect(g); onClose(); }} style={{ background: YELLOW, color: "#1a1a1a", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Select</button>
      </div>
    </div>
  );
}

// ── Bottom sheet ──────────────────────────────────────────────────────────────
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 8888, animation: "fadeOverlay 0.2s ease" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", zIndex: 9999, maxHeight: "80vh", display: "flex", flexDirection: "column", animation: "slideUp 0.25s cubic-bezier(0.32,0.72,0,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1 }}>×</button>
          <div style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>{title}</div>
          <div style={{ width: 20 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>{children}</div>
        <div style={{ padding: "14px 20px 32px", borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Clear</button>
          <button onClick={onClose} style={{ background: B, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Show results</button>
        </div>
      </div>
    </>
  );
}

// ── SearchResults ─────────────────────────────────────────────────────────────
function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const today = new Date();

  // Search state — initialised from URL params
  const [destination, setDestination] = useState((searchParams.get("destination") || "Dubai").split(",")[0].trim());
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState<GuestState>({
    rooms: parseInt(searchParams.get("rooms") || "1"),
    adults: parseInt(searchParams.get("adults") || "2"),
    children: parseInt(searchParams.get("children") || "0"),
  });

  // UI state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [checkedFilters, setCheckedFilters] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);
  const [hotelSearch, setHotelSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

  // Mobile overlay states
  const [showCal, setShowCal] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"filter"|"rating"|"price"|"sort"|null>(null);

  // Desktop search bar states
  const [desktopCalOpen, setDesktopCalOpen] = useState(false);
  const [desktopCalMode, setDesktopCalMode] = useState<"checkin"|"checkout">("checkin");
  const [desktopCalOffset, setDesktopCalOffset] = useState(0);
  const [desktopGuestOpen, setDesktopGuestOpen] = useState(false);
  const [desktopDestination, setDesktopDestination] = useState(destination);
  const desktopCalRef = useRef<HTMLDivElement>(null);
  const desktopGuestRef = useRef<HTMLDivElement>(null);

  // Unregister any old service workers that may be caching API calls
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          // Force update to pick up the new sw.js
          reg.update();
        });
      });
    }
  }, []);

  // Close desktop popups on outside click
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
      if (desktopCalRef.current && !desktopCalRef.current.contains(e.target as Node)) setDesktopCalOpen(false);
      if (desktopGuestRef.current && !desktopGuestRef.current.contains(e.target as Node)) setDesktopGuestOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchHotels = useCallback(async (dest?: string, ci?: string, co?: string, g?: GuestState) => {
    const d = dest || destination;
    const c1 = ci || checkIn;
    const c2 = co || checkOut;
    const gs = g || guests;
    if (!c1 || !c2) { setLoading(false); setError("Please select check-in and check-out dates."); return; }
    setLoading(true); setError(null); setPage(1);
    try {
      const res = await fetch(`${API}/search?destination=${encodeURIComponent(d)}&checkIn=${c1}&checkOut=${c2}&adults=${gs.adults}&children=${gs.children}&rooms=${gs.rooms}`, { cache: "no-store" });
      const data = await res.json();
      if (data.hotels?.hotels) {
        setHotels(data.hotels.hotels);
        setTotal(data.hotels.total || data.hotels.hotels.length);
      } else setError(data.error || "No hotels found for this destination.");
    } catch { setError("Could not connect to server. Please try again."); }
    setLoading(false);
  }, [destination, checkIn, checkOut, guests]);

  useEffect(() => { fetchHotels(); }, []);

  const EUR_TO_INR = 112;
  const NIGHTS = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

  const priceINR = (hotel: Hotel) => hotel.lowestPriceINR || Math.round((hotel.minRate || 0) * EUR_TO_INR / NIGHTS);
  const getRating = (code: number) => { const r = [9.1, 8.9, 9.4, 9.3, 8.7, 9.0, 8.8, 9.2]; return r[code % r.length]; };
  const getRatingLabel = (r: number) => r >= 9 ? "Exceptional" : r >= 8.5 ? "Excellent" : "Very Good";
  const getDiscount = (code: number) => { const d = [15, 12, 10, 8, 20, 18, 14, 22]; return d[code % d.length]; };
  const getImg = (hotel: Hotel, idx: number) => hotel.imageUrl || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
  const getAmenityKeys = (code: number) => {
    const all = Object.keys(AMENITY_ICONS);
    const start = code % all.length;
    return [...all.slice(start), ...all.slice(0, start)].slice(0, 4);
  };

  const filteredHotels = hotels.filter(h => {
    if (hotelSearch && !h.name.toLowerCase().includes(hotelSearch.toLowerCase())) return false;
    return true;
  });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === "price-low") return priceINR(a) - priceINR(b);
    if (sortBy === "price-high") return priceINR(b) - priceINR(a);
    if (sortBy === "rating") return getRating(b.code) - getRating(a.code);
    return 0;
  });

  const perPage = 10;
  const paginatedHotels = sortedHotels.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sortedHotels.length / perPage);

  const handleNewSearch = () => {
    setDestination(desktopDestination);
    setDesktopCalOpen(false);
    setDesktopGuestOpen(false);
    fetchHotels(desktopDestination, checkIn, checkOut, guests);
    const params = new URLSearchParams({ destination: desktopDestination, checkIn, checkOut, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children) });
    router.replace(`/search?${params.toString()}`);
  };

  const guestSummary = (g: GuestState) => `${g.rooms} Room${g.rooms > 1 ? "s" : ""} · ${g.adults} Adult${g.adults > 1 ? "s" : ""}${g.children > 0 ? ` · ${g.children} Child${g.children > 1 ? "ren" : ""}` : ""}`;

  // Desktop calendar day click
  const desktopDayClick = (ds: string) => {
    if (desktopCalMode === "checkin") {
      setCheckIn(ds); setCheckOut(""); setDesktopCalMode("checkout");
    } else {
      if (ds <= checkIn) return;
      setCheckOut(ds); setDesktopCalOpen(false);
    }
  };

  const renderDesktopMonth = (year: number, month: number) => {
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    const days = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, textAlign: "center", marginBottom: 12 }}>{MONTHS[month]} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 6 }}>{d}</div>)}
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
            let bg = "transparent", clr = isDisabled ? "#cbd5e1" : NAVY, br = "50%", fw = isToday ? 700 : 400;
            if (isStart) { bg = B; clr = "#fff"; br = "50% 0 0 50%"; fw = 700; }
            else if (isEnd) { bg = B; clr = "#fff"; br = "0 50% 50% 0"; fw = 700; }
            else if (isOnly) { bg = B; clr = "#fff"; br = "50%"; fw = 700; }
            else if (isInRange) { bg = "#dbeafe"; clr = B; br = "0"; }
            else if (isToday) clr = B;
            return (
              <div key={day} onClick={() => !isDisabled && desktopDayClick(ds)}
                style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: clr, borderRadius: br, fontWeight: fw, fontSize: 13, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.35 : 1 }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const d1 = new Date(today.getFullYear(), today.getMonth() + desktopCalOffset);
  const d2 = new Date(today.getFullYear(), today.getMonth() + desktopCalOffset + 1);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeOverlay { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        .hotel-card-mobile { background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); cursor: pointer; }
        .hotel-card-desktop { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 16px; display: grid; grid-template-columns: 260px 1fr; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow .2s, transform .2s; cursor: pointer; }
        .hotel-card-desktop:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .sfield-d { cursor: pointer; transition: background 0.15s; }
        .sfield-d:hover { background: rgba(0,0,0,0.02); }
        .fav-btn { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; background: rgba(255,255,255,0.95); border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: transform 0.15s; }
        .fav-btn:hover { transform: scale(1.1); }
        .pg-btn { width: 38px; height: 38px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: ${NAVY}; font-size: 14px; cursor: pointer; font-family: inherit; transition: all .2s; display: flex; align-items: center; justify-content: center; }
        .pg-btn:hover { border-color: ${B}; color: ${B}; }
        .pg-btn.active { background: ${B}; color: #fff; border-color: ${B}; }
        .bottom-tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 12px; color: ${NAVY}; font-weight: 500; padding: 8px 0; }
        .cbx { width: 18px; height: 18px; border: 1.5px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; transition: all .2s; }
        .cbx.on { background: ${B}; border-color: ${B}; color: #fff; }
      `}</style>

      {/* ── MOBILE FULL SCREENS ── */}
      {isMobile && showCal && (
        <CalendarScreen checkIn={checkIn} checkOut={checkOut}
          onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
          onClose={() => setShowCal(false)} />
      )}
      {isMobile && showGuests && (
        <GuestsScreen guests={guests} onSelect={setGuests} onClose={() => setShowGuests(false)} />
      )}

      {/* ── MOBILE BOTTOM SHEETS ── */}
      {isMobile && mobileSheet === "filter" && (
        <BottomSheet title="Filters" onClose={() => setMobileSheet(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Most Popular</div>
            {FILTER_NAMES.map((f, i) => (
              <div key={i} onClick={() => setCheckedFilters(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f8fafc", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
                  <div className={`cbx${checkedFilters.has(i) ? " on" : ""}`}>{checkedFilters.has(i) ? "✓" : ""}</div>
                  {f}
                </div>
                <span style={{ fontSize: 13, color: "#64748b" }}>{FILTER_COUNTS[i]}</span>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
      {isMobile && mobileSheet === "rating" && (
        <BottomSheet title="Rating" onClose={() => setMobileSheet(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>User Rating</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 20 }}>
              {["Exceptional: 9+", "Excellent: 8+", "Very Good: 7+", "Good: 6+", "Pleasant: 5+"].map((r, i) => (
                <button key={i} style={{ border: "1.5px solid #e2e8f0", borderRadius: 100, padding: "8px 14px", fontSize: 13, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: NAVY }}>{r}</button>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Star Rating</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {["5 Star", "4 Star", "3 Star", "2 Star", "1 Star"].map((s, i) => (
                <button key={i} style={{ border: "1.5px solid #e2e8f0", borderRadius: 100, padding: "8px 14px", fontSize: 13, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: NAVY }}>{s}</button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
      {isMobile && mobileSheet === "price" && (
        <BottomSheet title="Price" onClose={() => setMobileSheet(null)}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Filter by Price</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 20 }}>
              {["₹0–₹1,000", "₹1,000–₹2,500", "₹2,500–₹4,000", "₹4,000–₹6,000", "₹6,000–₹10,000", "₹10,000+"].map((p, i) => (
                <button key={i} style={{ border: "1.5px solid #e2e8f0", borderRadius: 100, padding: "8px 14px", fontSize: 13, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: NAVY }}>{p}</button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
      {isMobile && mobileSheet === "sort" && (
        <BottomSheet title="Sort By" onClose={() => setMobileSheet(null)}>
          {[
            { val: "popularity", label: "Popularity" },
            { val: "price-low", label: "Price", sub: "Low to High" },
            { val: "price-high", label: "Price", sub: "High to Low" },
            { val: "rating", label: "User Rating", sub: "Highest First" },
          ].map(opt => (
            <div key={opt.val} onClick={() => { setSortBy(opt.val); setMobileSheet(null); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f8fafc", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: NAVY }}>{opt.label}</div>
                {opt.sub && <div style={{ fontSize: 13, color: "#94a3b8" }}>{opt.sub}</div>}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${sortBy === opt.val ? B : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sortBy === opt.val && <div style={{ width: 10, height: 10, borderRadius: "50%", background: B }} />}
              </div>
            </div>
          ))}
        </BottomSheet>
      )}

      {/* ── NAV ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "0 20px" : "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in / Sign up</button>
            )}
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? "transparent" : NAVY, transition: "all 0.2s" }} />
            <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>How it works</button>
          <button onClick={() => router.push("/search-hotels")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Sign in</button>
          <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Check my booking</button>
        </div>
      )}

      {/* ── MOBILE STICKY SEARCH PILL ── */}
      {isMobile && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", position: "sticky", top: 60, zIndex: 200, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748b", padding: 2, lineHeight: 1, flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 100, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => setShowCal(true)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{destination}</div>
              <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                {checkIn && checkOut ? `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}` : "Select dates"} · {guestSummary(guests)}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
      )}

      {/* ── DESKTOP SEARCH BAR ── */}
      {!isMobile && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 32px", position: "sticky", top: 60, zIndex: 200 }}>
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.3fr auto", alignItems: "stretch", height: 64, overflow: "visible", position: "relative", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

            {/* Destination */}
            <div className="sfield-d" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: "12px 0 0 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Destination</div>
              <input value={desktopDestination} onChange={e => setDesktopDestination(e.target.value)}
                style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: NAVY, background: "transparent", padding: 0, width: "100%" }} />
            </div>

            {/* Check-in */}
            <div className="sfield-d" style={{ padding: "0 18px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: desktopCalOpen && desktopCalMode === "checkin" ? "#f0f7ff" : "transparent" }}
              onClick={() => { setDesktopCalMode("checkin"); setDesktopCalOpen(true); setDesktopCalOffset(0); }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in</div>
              <div style={{ fontSize: 14, fontWeight: checkIn ? 600 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
            </div>

            {/* Check-out */}
            <div className="sfield-d" style={{ padding: "0 18px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: desktopCalOpen && desktopCalMode === "checkout" ? "#f0f7ff" : "transparent" }}
              onClick={() => { setDesktopCalMode("checkout"); setDesktopCalOpen(true); setDesktopCalOffset(0); }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out</div>
              <div style={{ fontSize: 14, fontWeight: checkOut ? 600 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
            </div>

            {/* Rooms & Guests */}
            <div ref={desktopGuestRef} className="sfield-d" style={{ padding: "0 18px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}
              onClick={() => setDesktopGuestOpen(!desktopGuestOpen)}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Rooms & Guests</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{guestSummary(guests)}</span><span style={{ fontSize: 9, color: "#94a3b8" }}>▼</span>
              </div>
              {desktopGuestOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 9999, padding: 18 }}>
                  {([["Rooms","1+",1,4],["Adults","13+",1,16],["Children","0–12",0,8]] as [string,string,number,number][]).map(([label,sub,mn,mx], ki) => {
                    const key = (["rooms","adults","children"] as (keyof GuestState)[])[ki];
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{label}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>Age {sub}</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button disabled={guests[key] <= mn} onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [key]: Math.max(mn, p[key] - 1) })); }}
                            style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: guests[key] <= mn ? 0.3 : 1 }}>−</button>
                          <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" as const }}>{guests[key]}</span>
                          <button disabled={guests[key] >= mx} onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [key]: Math.min(mx, p[key] + 1) })); }}
                            style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: guests[key] >= mx ? 0.3 : 1 }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setDesktopGuestOpen(false)} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Done</button>
                </div>
              )}
            </div>

            {/* Search button */}
            <button onClick={handleNewSearch} style={{ background: "#FCD34D", color: "#1a1a1a", border: "none", padding: "0 28px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 12px 12px 0", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" as const }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>

            {/* Desktop calendar popup */}
            {desktopCalOpen && (
              <div ref={desktopCalRef} onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", left: "28%", width: 620, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.16)", zIndex: 9999, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <button onClick={() => setDesktopCalOffset(p => Math.max(0, p - 1))} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>‹</button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1 }}>
                    {renderDesktopMonth(d1.getFullYear(), d1.getMonth())}
                    {renderDesktopMonth(d2.getFullYear(), d2.getMonth())}
                  </div>
                  <button onClick={() => setDesktopCalOffset(p => p + 1)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>›</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {desktopCalMode === "checkin" ? "Select check-in date" : "Select check-out date"}
                    {checkIn && checkOut && <span style={{ color: "#16a34a", marginLeft: 8, fontWeight: 600 }}>✓ {formatDate(checkIn)} → {formatDate(checkOut)}</span>}
                  </div>
                  <button onClick={() => { setCheckIn(""); setCheckOut(""); }} style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OFFERS STRIP ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "8px 16px" : "8px 32px", display: "flex", gap: 10, overflowX: "auto" }}>
        {[
          { title: "Flat 15% off", desc: "on International Hotels with Yes Bank Cards" },
          { title: "Flat 12% Off", desc: "with HDFC Bank Credit Cards" },
          { title: "Track price drops", desc: "Upload voucher — AI watches 24/7 for free" },
        ].map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", whiteSpace: "nowrap" as const, flexShrink: 0, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, background: B, color: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>%</div>
            <div style={{ fontSize: 12 }}><strong style={{ display: "block", fontWeight: 700, color: NAVY, fontSize: 12.5 }}>{o.title}</strong><span style={{ color: "#64748b" }}>{o.desc}</span></div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "16px 16px 100px" : "20px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "268px 1fr", gap: 22 }}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <div>
            {/* Map */}
            <div style={{ background: "#eff6ff", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
              <div style={{ height: 140, background: `linear-gradient(135deg,#1e3a8a,${B},#60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, position: "relative" }}>🗺️ Map view</span>
              </div>
              <div style={{ padding: "9px 14px", background: "#fff", textAlign: "center" as const, color: B, fontSize: 13, fontWeight: 600 }}>🗺 Explore on Map</div>
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 18 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Filters</div>
              {/* Hotel name search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", marginBottom: 18 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search by hotel name" value={hotelSearch} onChange={e => setHotelSearch(e.target.value)}
                  style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 13, color: NAVY, background: "transparent", width: "100%" }} />
              </div>
              {/* Popular filters */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Most Popular</div>
                {FILTER_NAMES.map((f, i) => (
                  <div key={i} onClick={() => setCheckedFilters(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#1e293b" }}>
                      <div className={`cbx${checkedFilters.has(i) ? " on" : ""}`}>{checkedFilters.has(i) ? "✓" : ""}</div>
                      {f}
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{FILTER_COUNTS[i]}</span>
                  </div>
                ))}
              </div>
              {/* Price range */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Price per night</div>
                <div style={{ position: "relative", height: 4, background: "#e2e8f0", borderRadius: 100, margin: "12px 0 6px" }}>
                  <div style={{ position: "absolute", left: "5%", right: "25%", height: "100%", background: B, borderRadius: 100 }} />
                  <div style={{ position: "absolute", width: 14, height: 14, background: "#fff", border: `2.5px solid ${B}`, borderRadius: "50%", top: "50%", transform: "translateY(-50%)", left: "5%", cursor: "grab" }} />
                  <div style={{ position: "absolute", width: 14, height: 14, background: "#fff", border: `2.5px solid ${B}`, borderRadius: "50%", top: "50%", transform: "translateY(-50%)", right: "25%", cursor: "grab" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}><span>₹2,500</span><span>₹50,000+</span></div>
              </div>
              {/* Star rating */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Star Rating</div>
                {[5, 4, 3, 2, 1].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, cursor: "pointer" }}>
                    <div style={{ width: 16, height: 16, border: "1.5px solid #e2e8f0", borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ color: "#f59e0b", fontSize: 13 }}>{"★".repeat(s)}</span>
                    <span style={{ fontSize: 13, color: "#1e293b" }}>{s} Star</span>
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>{[210, 318, 425, 156, 89][5 - s]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        <div>
        {/* ── MOBILE HOTEL NAME SEARCH ── */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by hotel name..."
              value={hotelSearch}
              onChange={e => setHotelSearch(e.target.value)}
              style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: NAVY, background: "transparent", width: "100%", fontWeight: hotelSearch ? 500 : 400 }}
            />
            {hotelSearch && (
              <button onClick={() => setHotelSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        )}

        {/* Results header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 8 }}>
            <div className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: NAVY }}>
              Hotels in {destination}
              {!loading && <span style={{ fontSize: 13, fontWeight: 400, color: "#64748b", fontFamily: "Inter,sans-serif", marginLeft: 8 }}>{sortedHotels.length} properties found</span>}
            </div>
            {!isMobile && (
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", color: NAVY, background: "#fff", cursor: "pointer", outline: "none" }}>
                <option value="popularity">Sort by: Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 14, color: "#64748b" }}>Finding the best hotels in {destination}…</div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏨</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{error}</div>
              <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, marginTop: 16 }}>← Back to search</button>
            </div>
          )}

          {/* Hotel cards */}
          {!loading && !error && paginatedHotels.map((hotel, idx) => {
            const rating = getRating(hotel.code);
            const discount = getDiscount(hotel.code);
            const price = priceINR(hotel);
            const wasPrice = Math.round(price * (1 + discount / 100));
            const amenityKeys = getAmenityKeys(hotel.code);
            const isFav = favorites.has(hotel.code);
            const globalIdx = (page - 1) * perPage + idx;

            return isMobile ? (
              // ── MOBILE CARD ──
              <div key={hotel.code} className="hotel-card-mobile"
                onClick={() => router.push(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&rooms=${guests.rooms}&children=${guests.children}`)}>
                {/* Photo */}
                <div style={{ position: "relative", height: 200 }}>
                  <img src={getImg(hotel, globalIdx)} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button className="fav-btn" onClick={e => { e.stopPropagation(); setFavorites(prev => { const n = new Set(prev); n.has(hotel.code) ? n.delete(hotel.code) : n.add(hotel.code); return n; }); }}
                    style={{ color: isFav ? "#ef4444" : "#94a3b8" }}>
                    {isFav ? "♥" : "♡"}
                  </button>
                  {price > 0 && <div style={{ position: "absolute", top: 12, left: 12, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{discount}% off</div>}
                </div>
                {/* Info */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{hotel.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {hotel.zone?.name || hotel.address || "Dubai"} · {hotel.categoryName || `${hotel.stars || 5} Stars`}
                  </div>
                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ background: rating >= 9 ? B : "#0369a1", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{rating.toFixed(1)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{getRatingLabel(rating)}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>· {(1000 + hotel.code % 3000).toLocaleString()} ratings</span>
                  </div>
                  {/* Amenities — minimal style like Image 3 */}
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 16px", marginBottom: 12 }}>
                    {amenityKeys.map(key => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#475569" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={AMENITY_ICONS[key]} />
                        </svg>
                        {key}
                      </div>
                    ))}
                  </div>
                  {/* Price + CTA */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      {price > 0 ? (
                        <>
                          <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(wasPrice)}</div>
                          <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{formatINR(price)}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>+ taxes · per night</div>
                        </>
                      ) : <div style={{ fontSize: 13, color: "#64748b" }}>Price on request</div>}
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now</button>
                  </div>
                  {/* Track price */}
                  <button onClick={e => { e.stopPropagation(); router.push("/upload"); }}
                    style={{ marginTop: 10, width: "100%", background: "#eff6ff", color: B, border: `1px solid #bfdbfe`, borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    🔔 Track price drop
                  </button>
                </div>
              </div>
            ) : (
              // ── DESKTOP CARD ──
              <div key={hotel.code} className="hotel-card-desktop"
                onClick={() => router.push(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&rooms=${guests.rooms}&children=${guests.children}`)}>
                <div style={{ position: "relative", minHeight: 200 }}>
                  <img src={getImg(hotel, globalIdx)} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 200 }} />
                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.95)", color: NAVY, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    ↗ Trending
                  </div>
                  <button className="fav-btn" onClick={e => { e.stopPropagation(); setFavorites(prev => { const n = new Set(prev); n.has(hotel.code) ? n.delete(hotel.code) : n.add(hotel.code); return n; }); }}
                    style={{ color: isFav ? "#ef4444" : "#94a3b8" }}>
                    {isFav ? "♥" : "♡"}
                  </button>
                </div>
                <div style={{ padding: "18px 20px 18px 22px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                          {hotel.name}
                          <span style={{ color: "#f59e0b", fontSize: 12, marginLeft: 6 }}>{"★".repeat(Math.min(hotel.stars || 5, 5))}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                          📍 {hotel.zone?.name || hotel.address || "Dubai"} · {hotel.categoryName || `${hotel.stars || 5} Stars`}
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ background: rating >= 9 ? B : "#0369a1", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{rating.toFixed(1)}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{getRatingLabel(rating)}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>· {(1000 + hotel.code % 3000).toLocaleString()} Ratings</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        {price > 0 ? (
                          <>
                            <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, marginBottom: 4, display: "inline-block" }}>{discount}% off</div>
                            <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>{formatINR(wasPrice)}</div>
                            <div className="sora" style={{ fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{formatINR(price)}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>+ taxes & fees<br />per night, per room</div>
                          </>
                        ) : <div style={{ fontSize: 13, color: "#64748b" }}>Price on request</div>}
                      </div>
                    </div>
                    {/* Amenities — minimal like Image 3 */}
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 20px", marginBottom: 10 }}>
                      {amenityKeys.map(key => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#475569" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={AMENITY_ICONS[key]} />
                          </svg>
                          {key}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>
                      • {hotel.chain ? `Part of ${hotel.chain}` : "Highly rated by guests"} · {hotel.zone?.name || "Central location"} · Great for business & leisure
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <button onClick={e => { e.stopPropagation(); router.push("/upload"); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", color: B, border: `1px solid #bfdbfe`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      🔔 Track price
                    </button>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
              {page > 1 && <button className="pg-btn" onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>‹</button>}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > totalPages) return null;
                return <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{p}</button>;
              })}
              {page < totalPages && <button className="pg-btn" onClick={() => { setPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>›</button>}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 400, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { id: "filter", icon: "M3 4h18M7 8h10M11 12h2M13 16h-2", label: "Filter" },
            { id: "rating", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", label: "Rating" },
            { id: "price", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", label: "Price" },
            { id: "sort", icon: "M3 6h18M7 12h10M11 18h2", label: "Sort" },
          ].map(tab => (
            <button key={tab.id} className="bottom-tab-btn" onClick={() => setMobileSheet(tab.id as any)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet === tab.id ? B : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span style={{ color: mobileSheet === tab.id ? B : "#64748b" }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
