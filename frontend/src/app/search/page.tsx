"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const API = "https://hoteldrops-production-7e5a.up.railway.app/api/hotels";
const MAPBOX_TOKEN = "pk.eyJ1Ijoib21zYWlyYW0wMSIsImEiOiJjbXB4bngxdWwwMWI2MnBzZ3p2dGM3bW5rIn0.8qCkSAodMjGVg6qhiCZHzw";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";
const YELLOW = "#FCD34D";

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
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function getFirstDow(y: number, m: number) { return new Date(y, m, 1).getDay(); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function codeToNum(code: string | number): number {
  if (typeof code === "number") return code;
  let hash = 0;
  for (let i = 0; i < code.length; i++) { hash = ((hash << 5) - hash) + code.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

interface Hotel {
  code: string | number;
  name: string;
  stars: number | null;
  minRate: number;
  currency: string;
  imageUrl?: string;
  address?: string;
  chain?: string;
  rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
  isRefundable?: boolean | null;
  hasBreakfast?: boolean;
  lowestPriceINR?: number;
}
interface GuestState { rooms: number; adults: number; children: number; }

const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop",
];

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h2v-2h-2v2zm0-4h2V7h-2v7z",
  "Pool": "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z",
  "Restaurant": "M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-3.87-2.52-5-7.49-5C3.52 9.99 1 11.12 1 14.99v1h15.03v-1z",
  "Parking": "M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z",
  "Breakfast": "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z",
  "Spa": "M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z",
  "Gym": "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z",
};

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

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarScreen({ checkIn, checkOut, onSelect, onClose }: {
  checkIn: string; checkOut: string;
  onSelect: (ci: string, co: string) => void; onClose: () => void;
}) {
  const today = new Date();
  const [mode, setMode] = useState<"checkin"|"checkout">(checkIn ? "checkout" : "checkin");
  const [ci, setCi] = useState(checkIn);
  const [co, setCo] = useState(checkOut);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const handleDay = (ds: string) => {
    if (mode === "checkin") { setCi(ds); setCo(""); setMode("checkout"); }
    else { if (ds <= ci) return; setCo(ds); }
  };
  const renderMonth = (year: number, month: number) => {
    const days = getDaysInMonth(year, month); const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, textAlign: "center", marginBottom: 16 }}>{MONTHS[month]} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 8 }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1; const ds = toDateStr(year, month, day);
            const isDisabled = ds < todayStr;
            let bg = "transparent", clr = isDisabled ? "#cbd5e1" : NAVY, br = "50%", fw = 400;
            if (ds === ci && !!co) { bg = B; clr = "#fff"; br = "50% 0 0 50%"; fw = 700; }
            else if (ds === co) { bg = B; clr = "#fff"; br = "0 50% 50% 0"; fw = 700; }
            else if (ds === ci && !co) { bg = B; clr = "#fff"; br = "50%"; fw = 700; }
            else if (ci && co && ds > ci && ds < co) { bg = "#dbeafe"; clr = B; br = "0"; }
            else if (ds === todayStr) clr = B;
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
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>{mode === "checkin" ? "Select Check-in Date" : "Select Check-out Date"}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
        {Array.from({ length: 12 }).map((_, i) => { const dm = new Date(today.getFullYear(), today.getMonth() + i); return renderMonth(dm.getFullYear(), dm.getMonth()); })}
      </div>
      <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 20px 32px", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ border: `2px solid ${mode === "checkin" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: ci ? NAVY : "#94a3b8" }}>{ci ? formatDate(ci) : "Select"}</div>
          </div>
          <div style={{ border: `2px solid ${mode === "checkout" ? B : "#e2e8f0"}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out</div>
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

// ── Guests Screen ─────────────────────────────────────────────────────────────
function GuestsScreen({ guests, onSelect, onClose }: { guests: GuestState; onSelect: (g: GuestState) => void; onClose: () => void; }) {
  const [g, setG] = useState(guests);
  const update = (key: keyof GuestState, val: number) => setG(p => ({ ...p, [key]: val }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: NAVY }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>Rooms & Guests</div>
      </div>
      <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
        {([["Rooms","Minimum 1","rooms",1,4],["Adults","13 years & above","adults",1,16],["Children","0–12 years","children",0,8]] as [string,string,keyof GuestState,number,number][]).map(([label,sub,key,min,max]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div><div style={{ fontSize: 17, fontWeight: 600, color: NAVY }}>{label}</div><div style={{ fontSize: 13, color: "#94a3b8" }}>{sub}</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <button disabled={(g[key] as number) <= min} onClick={() => update(key, Math.max(min, (g[key] as number) - 1))} style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (g[key] as number) <= min ? 0.3 : 1 }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, minWidth: 28, textAlign: "center" as const }}>{g[key]}</span>
              <button disabled={(g[key] as number) >= max} onClick={() => update(key, Math.min(max, (g[key] as number) + 1))} style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (g[key] as number) >= max ? 0.3 : 1 }}>+</button>
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

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 8888 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", zIndex: 9999, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>×</button>
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

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
    if (error) { setLoading(false); alert("Sign in failed. Please try again."); }
  };
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 8888 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 20, zIndex: 9999, width: "min(480px, 92vw)", padding: "40px 36px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: NAVY, marginBottom: 8 }}>
            rebuq<span style={{ color: B }}>.</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Sign in to see member rates</div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>Members get exclusive hotel rates up to 40% below OTA prices. Sign in free to unlock.</div>
        </div>
        <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>Hotel rates are exclusive to members. Sign in with Google — it takes 10 seconds and is completely free.</div>
        </div>
        <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: loading ? "#f1f5f9" : "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "inherit", color: NAVY, marginBottom: 12, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {loading ? (
            <div style={{ width: 20, height: 20, border: "2px solid #e2e8f0", borderTop: `2px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          )}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        <div style={{ textAlign: "center" as const, fontSize: 12, color: "#94a3b8" }}>Free forever · No credit card required</div>
      </div>
    </>
  );
}

// ── Map View ──────────────────────────────────────────────────────────────────
function MapView({ hotels, checkIn, checkOut, guests, onClose, onHotelClick }: {
  hotels: Hotel[]; checkIn: string; checkOut: string; guests: GuestState;
  onClose: () => void; onHotelClick: (hotel: Hotel) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [mapSearch, setMapSearch] = useState("");
  const NIGHTS = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

  const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude);

  // Filter hotels by map search
  const filteredMapHotels = mapSearch.trim()
    ? hotelsWithCoords.filter(h => h.name.toLowerCase().includes(mapSearch.toLowerCase()))
    : hotelsWithCoords;

  useEffect(() => {
    if (!mapRef.current) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.onload = () => {
      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const centerLng = hotelsWithCoords.length > 0
        ? hotelsWithCoords.reduce((s, h) => s + (h.longitude || 0), 0) / hotelsWithCoords.length
        : 55.2708;
      const centerLat = hotelsWithCoords.length > 0
        ? hotelsWithCoords.reduce((s, h) => s + (h.latitude || 0), 0) / hotelsWithCoords.length
        : 25.2048;

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [centerLng, centerLat],
        zoom: 12,
      });
      mapInstanceRef.current = map;

      map.on("load", () => {
        hotelsWithCoords.forEach(hotel => {
          const pricePerNight = Math.round((hotel.minRate || 0) / NIGHTS);
          if (!pricePerNight) return;

          const el = document.createElement("div");
          el.setAttribute("data-hotel-id", String(hotel.code));
          el.innerHTML = `<div class="map-price-pin" style="
            background: ${B}; color: #fff; padding: 5px 10px; border-radius: 20px;
            font-family: Inter,sans-serif; font-size: 12px; font-weight: 700;
            white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 2px solid #fff; cursor: pointer; transition: all 0.15s;
          ">₹${Math.round(pricePerNight).toLocaleString("en-IN")}</div>`;

          el.addEventListener("click", () => {
            setSelectedHotel(hotel);
            document.querySelectorAll(".map-price-pin").forEach((p: any) => { p.style.background = B; p.style.transform = "scale(1)"; });
            const pin = el.querySelector(".map-price-pin") as HTMLElement;
            if (pin) { pin.style.background = NAVY; pin.style.transform = "scale(1.1)"; }
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([hotel.longitude!, hotel.latitude!])
            .addTo(map);
          markersRef.current.push({ marker, hotel, el });
        });
      });
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  // Show/hide markers based on search
  useEffect(() => {
    markersRef.current.forEach(({ el, hotel }) => {
      const visible = mapSearch.trim() === "" || hotel.name.toLowerCase().includes(mapSearch.toLowerCase());
      el.style.display = visible ? "block" : "none";
    });
    // If search matches one hotel, fly to it
    if (mapSearch.trim() && filteredMapHotels.length === 1 && mapInstanceRef.current) {
      const h = filteredMapHotels[0];
      mapInstanceRef.current.flyTo({ center: [h.longitude!, h.latitude!], zoom: 14, speed: 1.5 });
      setSelectedHotel(h);
    }
  }, [mapSearch]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 8000, display: "flex", flexDirection: "column" }}>
      {/* Map header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 1 }}>
        {/* Search input */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 14px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search hotel on map..."
            value={mapSearch}
            onChange={e => setMapSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: NAVY, background: "transparent", width: "100%", fontWeight: mapSearch ? 500 : 400 }}
          />
          {mapSearch && <button onClick={() => setMapSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
          {filteredMapHotels.length} pins
        </div>
        <button onClick={onClose} style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
          ☰ View List
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Selected hotel card */}
        {selectedHotel && (
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "min(380px, 92vw)", background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden", zIndex: 10 }}>
            <button onClick={() => setSelectedHotel(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>×</button>
            <img src={selectedHotel.imageUrl || FALLBACK_IMGS[0]} alt={selectedHotel.name}
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMGS[0]; }}
              style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 4 }}>{selectedHotel.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                {selectedHotel.stars ? <span style={{ color: "#f59e0b" }}>{"★".repeat(selectedHotel.stars)}</span> : null}
                {selectedHotel.address ? ` · ${selectedHotel.address}` : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: "'Sora',sans-serif" }}>
                    {formatINR(Math.round((selectedHotel.minRate || 0) / NIGHTS))}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>per night</div>
                </div>
                <button onClick={() => onHotelClick(selectedHotel)} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View Hotel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Search Results ───────────────────────────────────────────────────────
function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const today = new Date();

  const [destination, setDestination] = useState((searchParams.get("destination") || "Dubai").split(",")[0].trim());
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState<GuestState>({
    rooms: parseInt(searchParams.get("rooms") || "1"),
    adults: parseInt(searchParams.get("adults") || "2"),
    children: parseInt(searchParams.get("children") || "0"),
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);
  const [hotelSearch, setHotelSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Mobile overlays
  const [showCal, setShowCal] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"filter"|"sort"|null>(null);

  // Desktop search bar
  const [desktopCalOpen, setDesktopCalOpen] = useState(false);
  const [desktopCalMode, setDesktopCalMode] = useState<"checkin"|"checkout">("checkin");
  const [desktopCalOffset, setDesktopCalOffset] = useState(0);
  const [desktopGuestOpen, setDesktopGuestOpen] = useState(false);
  const [desktopDestination, setDesktopDestination] = useState(destination);
  const desktopCalRef = useRef<HTMLDivElement>(null);
  const desktopGuestRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filterStars, setFilterStars] = useState<number[]>([]);
  const [filterBreakfast, setFilterBreakfast] = useState(false);
  const [filterRefundable, setFilterRefundable] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterPriceMax, setFilterPriceMax] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member" });
      }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "Member" });
        setShowAuthModal(false);
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
    const d = dest || destination; const c1 = ci || checkIn; const c2 = co || checkOut; const gs = g || guests;
    if (!c1 || !c2) { setLoading(false); setError("Please select check-in and check-out dates."); return; }
    setLoading(true); setError(null); setPage(1);
    try {
      const res = await fetch(`${API}/search?destination=${encodeURIComponent(d)}&checkIn=${c1}&checkOut=${c2}&adults=${gs.adults}&children=${gs.children}&rooms=${gs.rooms}`, { cache: "no-store" });
      const data = await res.json();
      if (data.hotels?.hotels) setHotels(data.hotels.hotels);
      else setError(data.error || "No hotels found.");
    } catch { setError("Could not connect to server. Please try again."); }
    setLoading(false);
  }, [destination, checkIn, checkOut, guests]);

  useEffect(() => { fetchHotels(); }, []);

  const NIGHTS = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const priceINR = (hotel: Hotel) => Math.round(parseFloat(String(hotel.lowestPriceINR || hotel.minRate || 0)) / NIGHTS);
  const getRating = (code: string | number) => { const n = codeToNum(code); return [9.1,8.9,9.4,9.3,8.7,9.0,8.8,9.2][n%8]; };
  const getRatingLabel = (r: number) => r >= 9 ? "Exceptional" : r >= 8.5 ? "Excellent" : "Very Good";
  const getDiscount = (code: string | number) => [15,12,10,8,20,18,14,22][codeToNum(code)%8];
  const getImg = (hotel: Hotel, idx: number) => hotel.imageUrl || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
  const guestSummary = (g: GuestState) => `${g.rooms} Room${g.rooms>1?"s":""} · ${g.adults} Adult${g.adults>1?"s":""}${g.children>0?` · ${g.children} Child${g.children>1?"ren":""}` : ""}`;

  // Apply filters
  const filteredHotels = hotels.filter(h => {
    if (hotelSearch && !h.name.toLowerCase().includes(hotelSearch.toLowerCase())) return false;
    if (filterStars.length > 0 && !filterStars.includes(h.stars || 0)) return false;
    if (filterBreakfast && !h.hasBreakfast) return false;
    if (filterRefundable && h.isRefundable !== true) return false;
    if (filterRating !== null) { const r = h.rating || getRating(h.code); if (r < filterRating) return false; }
    if (filterPriceMax !== null && priceINR(h) > filterPriceMax) return false;
    return true;
  });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === "price-low") return priceINR(a) - priceINR(b);
    if (sortBy === "price-high") return priceINR(b) - priceINR(a);
    if (sortBy === "rating") return (b.rating || getRating(b.code)) - (a.rating || getRating(a.code));
    if (sortBy === "stars") return (b.stars || 0) - (a.stars || 0);
    return 0;
  });

  const perPage = 10;
  const paginatedHotels = sortedHotels.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(sortedHotels.length / perPage);

  const handleSearch = () => {
    if (!user) { setShowAuthModal(true); return; }
    setDestination(desktopDestination);
    fetchHotels(desktopDestination, checkIn, checkOut, guests);
    const params = new URLSearchParams({ destination: desktopDestination, checkIn, checkOut, adults: String(guests.adults), rooms: String(guests.rooms), children: String(guests.children) });
    router.replace(`/search?${params.toString()}`);
  };

  const handleHotelClick = (hotel: Hotel) => {
    if (!user) { setShowAuthModal(true); return; }
    router.push(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&rooms=${guests.rooms}&children=${guests.children}`);
  };

  // Desktop calendar render
  const desktopDayClick = (ds: string) => {
    if (desktopCalMode === "checkin") { setCheckIn(ds); setCheckOut(""); setDesktopCalMode("checkout"); }
    else { if (ds <= checkIn) return; setCheckOut(ds); setDesktopCalOpen(false); }
  };
  const renderDesktopMonth = (year: number, month: number) => {
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    const days = getDaysInMonth(year, month); const firstDow = getFirstDow(year, month);
    return (
      <div key={`${year}-${month}`} style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, textAlign: "center", marginBottom: 12 }}>{MONTHS[month]} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {DOWS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", paddingBottom: 6 }}>{d}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i+1; const ds = toDateStr(year, month, day); const isDisabled = ds < todayStr;
            let bg = "transparent", clr = isDisabled ? "#cbd5e1" : NAVY, br = "50%", fw = 400;
            if (ds === checkIn && !!checkOut) { bg=B; clr="#fff"; br="50% 0 0 50%"; fw=700; }
            else if (ds === checkOut) { bg=B; clr="#fff"; br="0 50% 50% 0"; fw=700; }
            else if (ds === checkIn && !checkOut) { bg=B; clr="#fff"; br="50%"; fw=700; }
            else if (checkIn && checkOut && ds > checkIn && ds < checkOut) { bg="#dbeafe"; clr=B; br="0"; }
            else if (ds === todayStr) clr = B;
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

  // Sidebar filters component
  const FiltersPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div>
      {/* Search by name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search by hotel name" value={hotelSearch} onChange={e => setHotelSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 13, color: NAVY, background: "transparent", width: "100%" }} />
      </div>

      {/* Price range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Total Price With Tax</div>
        {[
          { label: "Under ₹5,000", max: 5000 },
          { label: "₹5,000 – ₹10,000", max: 10000 },
          { label: "₹10,000 – ₹20,000", max: 20000 },
          { label: "₹20,000 – ₹40,000", max: 40000 },
          { label: "₹40,000+", max: null },
        ].map(({ label, max }) => (
          <div key={label} onClick={() => setFilterPriceMax(filterPriceMax === max ? null : max)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ width: 16, height: 16, border: `1.5px solid ${filterPriceMax === max ? B : "#e2e8f0"}`, borderRadius: 4, background: filterPriceMax === max ? B : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {filterPriceMax === max && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ fontSize: 13, color: "#1e293b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Suggested filters */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Suggested For You</div>
        {[
          { label: "Free Cancellation", active: filterRefundable, toggle: () => setFilterRefundable(!filterRefundable) },
          { label: "Breakfast Included", active: filterBreakfast, toggle: () => setFilterBreakfast(!filterBreakfast) },
        ].map(({ label, active, toggle }) => (
          <div key={label} onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ width: 16, height: 16, border: `1.5px solid ${active ? B : "#e2e8f0"}`, borderRadius: 4, background: active ? B : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {active && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ fontSize: 13, color: "#1e293b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Star category */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Star Category</div>
        {[5, 4, 3, 2, 1].map(s => {
          const active = filterStars.includes(s);
          return (
            <div key={s} onClick={() => setFilterStars(prev => active ? prev.filter(x => x !== s) : [...prev, s])}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
              <div style={{ width: 16, height: 16, border: `1.5px solid ${active ? B : "#e2e8f0"}`, borderRadius: 4, background: active ? B : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {active && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ color: "#f59e0b", fontSize: 13 }}>{"★".repeat(s)}</span>
              <span style={{ fontSize: 13, color: "#1e293b" }}>{s} Star</span>
            </div>
          );
        })}
      </div>

      {/* User rating */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>User Rating</div>
        {[
          { label: "Exceptional 9+", min: 9 },
          { label: "Excellent 8+", min: 8 },
          { label: "Very Good 7+", min: 7 },
        ].map(({ label, min }) => (
          <div key={label} onClick={() => setFilterRating(filterRating === min ? null : min)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ width: 16, height: 16, border: `1.5px solid ${filterRating === min ? B : "#e2e8f0"}`, borderRadius: "50%", background: filterRating === min ? B : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {filterRating === min && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </div>
            <span style={{ fontSize: 13, color: "#1e293b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Clear filters */}
      {(filterStars.length > 0 || filterBreakfast || filterRefundable || filterRating !== null || filterPriceMax !== null) && (
        <button onClick={() => { setFilterStars([]); setFilterBreakfast(false); setFilterRefundable(false); setFilterRating(null); setFilterPriceMax(null); }}
          style={{ width: "100%", background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .hotel-card-mobile { background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); cursor: pointer; animation: fadeIn 0.3s ease; }
        .hotel-card-desktop { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 16px; display: grid; grid-template-columns: 280px 1fr; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow .2s, transform .2s; cursor: pointer; min-height: 220px; animation: fadeIn 0.3s ease; }
        .hotel-card-desktop:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .hotel-card-desktop .card-img-wrap { position: relative; width: 280px; min-height: 220px; overflow: hidden; flex-shrink: 0; }
        .hotel-card-desktop .card-img-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .sfield-d { cursor: pointer; transition: background 0.15s; }
        .sfield-d:hover { background: rgba(0,0,0,0.02); }
        .fav-btn { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; background: rgba(255,255,255,0.95); border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .pg-btn { width: 38px; height: 38px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: ${NAVY}; font-size: 14px; cursor: pointer; font-family: inherit; transition: all .2s; display: flex; align-items: center; justify-content: center; }
        .pg-btn:hover { border-color: ${B}; color: ${B}; }
        .pg-btn.active { background: ${B}; color: #fff; border-color: ${B}; }
        .bottom-tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: none; border: none; cursor: pointer; font-family: inherit; font-size: 12px; color: ${NAVY}; font-weight: 500; padding: 8px 0; }
      `}</style>

      {/* Auth modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}

      {/* Map view */}
      {showMap && (
        <MapView hotels={hotels} checkIn={checkIn} checkOut={checkOut} guests={guests}
          onClose={() => setShowMap(false)}
          onHotelClick={(hotel) => { setShowMap(false); handleHotelClick(hotel); }} />
      )}

      {/* Mobile full screens */}
      {isMobile && showCal && <CalendarScreen checkIn={checkIn} checkOut={checkOut} onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co); }} onClose={() => setShowCal(false)} />}
      {isMobile && showGuests && <GuestsScreen guests={guests} onSelect={setGuests} onClose={() => setShowGuests(false)} />}

      {/* Mobile filter sheet */}
      {isMobile && mobileSheet === "filter" && (
        <BottomSheet title="Filters" onClose={() => setMobileSheet(null)}>
          <FiltersPanel mobile />
        </BottomSheet>
      )}
      {isMobile && mobileSheet === "sort" && (
        <BottomSheet title="Sort By" onClose={() => setMobileSheet(null)}>
          {[
            { val: "popularity", label: "Popularity" },
            { val: "price-low", label: "Price: Low to High" },
            { val: "price-high", label: "Price: High to Low" },
            { val: "rating", label: "User Rating" },
            { val: "stars", label: "Star Rating" },
          ].map(opt => (
            <div key={opt.val} onClick={() => { setSortBy(opt.val); setMobileSheet(null); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f8fafc", cursor: "pointer" }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: NAVY }}>{opt.label}</span>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${sortBy === opt.val ? B : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sortBy === opt.val && <div style={{ width: 10, height: 10, borderRadius: "50%", background: B }} />}
              </div>
            </div>
          ))}
        </BottomSheet>
      )}

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "0 20px" : "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
            )}
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ display: "block", width: 22, height: 2, background: NAVY, transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? "transparent" : NAVY }} />
            <span style={{ display: "block", width: 22, height: 2, background: NAVY, transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {user ? (
            <div style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9", fontSize: 15, fontWeight: 600, color: NAVY }}>Hi, {user.name.split(" ")[0]} 👋</div>
          ) : (
            <button onClick={() => { setMenuOpen(false); setShowAuthModal(true); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in to see rates</button>
          )}
        </div>
      )}

      {/* MOBILE STICKY SEARCH PILL */}
      {isMobile && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", position: "sticky", top: 60, zIndex: 200, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748b", flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 100, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => setShowCal(true)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{destination}</div>
              <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                {checkIn && checkOut ? `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}` : "Select dates"} · {guestSummary(guests)}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
      )}

      {/* DESKTOP SEARCH BAR */}
      {!isMobile && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 32px", position: "sticky", top: 60, zIndex: 200 }}>
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.3fr auto", alignItems: "stretch", height: 64, overflow: "visible", position: "relative", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="sfield-d" style={{ padding: "0 20px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: "12px 0 0 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Destination</div>
              <input value={desktopDestination} onChange={e => setDesktopDestination(e.target.value)}
                style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: NAVY, background: "transparent", padding: 0, width: "100%" }} />
            </div>
            <div className="sfield-d" style={{ padding: "0 18px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: desktopCalOpen && desktopCalMode === "checkin" ? "#f0f7ff" : "transparent" }}
              onClick={() => { setDesktopCalMode("checkin"); setDesktopCalOpen(true); setDesktopCalOffset(0); }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-in</div>
              <div style={{ fontSize: 14, fontWeight: checkIn ? 600 : 400, color: checkIn ? NAVY : "#94a3b8" }}>{checkIn ? formatDate(checkIn) : "Add date"}</div>
            </div>
            <div className="sfield-d" style={{ padding: "0 18px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", background: desktopCalOpen && desktopCalMode === "checkout" ? "#f0f7ff" : "transparent" }}
              onClick={() => { setDesktopCalMode("checkout"); setDesktopCalOpen(true); setDesktopCalOffset(0); }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Check-out</div>
              <div style={{ fontSize: 14, fontWeight: checkOut ? 600 : 400, color: checkOut ? NAVY : "#94a3b8" }}>{checkOut ? formatDate(checkOut) : "Add date"}</div>
            </div>
            <div ref={desktopGuestRef} className="sfield-d" style={{ padding: "0 18px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}
              onClick={() => setDesktopGuestOpen(!desktopGuestOpen)}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Rooms & Guests</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{guestSummary(guests)} <span style={{ fontSize: 9, color: "#94a3b8" }}>▼</span></div>
              {desktopGuestOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 9999, padding: 18 }}>
                  {([["Rooms","1+","rooms",1,4],["Adults","13+","adults",1,16],["Children","0–12","children",0,8]] as [string,string,keyof GuestState,number,number][]).map(([label,sub,key,mn,mx]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{label}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>Age {sub}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button disabled={guests[key] <= mn} onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [key]: Math.max(mn, p[key] - 1) })); }} style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: guests[key] <= mn ? 0.3 : 1 }}>−</button>
                        <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" as const }}>{guests[key]}</span>
                        <button disabled={guests[key] >= mx} onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [key]: Math.min(mx, p[key] + 1) })); }} style={{ width: 32, height: 32, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: guests[key] >= mx ? 0.3 : 1 }}>+</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setDesktopGuestOpen(false)} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Done</button>
                </div>
              )}
            </div>
            <button onClick={handleSearch} style={{ background: YELLOW, color: "#1a1a1a", border: "none", padding: "0 28px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 12px 12px 0", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" as const }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>
            {desktopCalOpen && (
              <div ref={desktopCalRef} onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", left: "28%", width: 620, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.16)", zIndex: 9999, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <button onClick={() => setDesktopCalOffset(p => Math.max(0, p-1))} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>‹</button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1 }}>
                    {renderDesktopMonth(d1.getFullYear(), d1.getMonth())}
                    {renderDesktopMonth(d2.getFullYear(), d2.getMonth())}
                  </div>
                  <button onClick={() => setDesktopCalOffset(p => p+1)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>›</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{desktopCalMode === "checkin" ? "Select check-in" : "Select check-out"}{checkIn && checkOut && <span style={{ color: "#16a34a", marginLeft: 8, fontWeight: 600 }}>✓ {formatDate(checkIn)} → {formatDate(checkOut)}</span>}</div>
                  <button onClick={() => { setCheckIn(""); setCheckOut(""); }} style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFERS STRIP */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "8px 16px" : "8px 32px", display: "flex", gap: 10, overflowX: "auto" }}>
        {[
          { title: "Flat 15% off", desc: "on International Hotels with Yes Bank Cards" },
          { title: "Flat 12% Off", desc: "with HDFC Bank Credit Cards" },
          { title: "Track price drops", desc: "Upload voucher — AI watches 24/7 for free" },
        ].map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: B, color: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>%</div>
            <div style={{ fontSize: 12 }}><strong style={{ display: "block", fontWeight: 700, color: NAVY, fontSize: 12.5 }}>{o.title}</strong><span style={{ color: "#64748b" }}>{o.desc}</span></div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "16px 16px 100px" : "20px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "268px 1fr", gap: 22 }}>

        {/* DESKTOP SIDEBAR */}
        {!isMobile && (
          <div>
            {/* Map */}
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1.5px solid #e2e8f0", cursor: "pointer" }} onClick={() => setShowMap(true)}>
              <div style={{ height: 140, background: `linear-gradient(135deg,#1e3a8a,${B},#60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600, position: "relative" }}>🗺️ Map view</span>
              </div>
              <div style={{ padding: "9px 14px", background: "#fff", textAlign: "center" as const, color: B, fontSize: 13, fontWeight: 600 }}>🗺 Explore on Map</div>
            </div>
            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 18 }}>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Filters</div>
              <FiltersPanel />
            </div>
          </div>
        )}

        {/* RESULTS */}
        <div>
          {/* Results header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 8 }}>
            <div>
              <span className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: NAVY }}>Hotels in {destination}</span>
              {!loading && <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>{sortedHotels.length} properties found</span>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!isMobile && (
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", color: NAVY, background: "#fff", cursor: "pointer", outline: "none" }}>
                  <option value="popularity">Sort by: Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">User Rating</option>
                  <option value="stars">Star Rating</option>
                </select>
              )}
              {/* Map button on desktop results */}
              {!isMobile && (
                <button onClick={() => setShowMap(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: NAVY }}>
                  🗺️ Map
                </button>
              )}
            </div>
          </div>

          {/* Auth gate overlay — shown when not logged in and hotels loaded */}
          {!user && !loading && hotels.length > 0 && (
            <div style={{ position: "relative", marginBottom: 0 }}>
              {/* Show first 2 hotel cards blurred */}
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" as const }}>
                {paginatedHotels.slice(0, 2).map((hotel, idx) => {
                  const rating = hotel.rating || getRating(hotel.code);
                  const discount = getDiscount(hotel.code);
                  const price = priceINR(hotel);
                  const wasPrice = price > 0 ? Math.round(price * (1 + discount / 100)) : 0;
                  const globalIdx = (page - 1) * perPage + idx;
                  return isMobile ? (
                    <div key={String(hotel.code)} className="hotel-card-mobile">
                      <div style={{ position: "relative", height: 200 }}>
                        <img src={getImg(hotel, globalIdx)} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      <div style={{ padding: "14px 16px 16px" }}>
                        <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{hotel.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{hotel.address || destination}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{formatINR(price)}</div>
                      </div>
                    </div>
                  ) : (
                    <div key={String(hotel.code)} className="hotel-card-desktop">
                      <div className="card-img-wrap">
                        <img src={getImg(hotel, globalIdx)} alt={hotel.name} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMGS[globalIdx % FALLBACK_IMGS.length]; }} />
                      </div>
                      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                        <div>
                          <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{hotel.name}</div>
                          <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>📍 {hotel.address || destination}</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{formatINR(price)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Lock overlay */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,0.7)", backdropFilter: "blur(2px)", borderRadius: 12 }}>
                <div onClick={() => setShowAuthModal(true)} style={{ background: "#fff", borderRadius: 20, padding: "32px 36px", textAlign: "center" as const, boxShadow: "0 16px 48px rgba(0,0,0,0.15)", cursor: "pointer", maxWidth: 380, width: "90%" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                  <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Sign in to see member rates</div>
                  <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                    {hotels.length} hotels found in {destination}. Sign in free to unlock exclusive rates — members save avg ₹24,600 per booking.
                  </div>
                  <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "13px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: NAVY, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google — it&apos;s free
                  </button>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>No credit card · Cancel anytime</div>
                </div>
              </div>
            </div>
          )}

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
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 6 }}>{error}</div>
              <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, marginTop: 16 }}>← Back to search</button>
            </div>
          )}

          {/* Hotel cards — only shown when logged in */}
          {!loading && !error && user && paginatedHotels.map((hotel, idx) => {
            const rating = hotel.rating || getRating(hotel.code);
            const discount = getDiscount(hotel.code);
            const price = priceINR(hotel);
            const wasPrice = price > 0 ? Math.round(price * (1 + discount / 100)) : 0;
            const isFav = favorites.has(hotel.code);
            const globalIdx = (page - 1) * perPage + idx;
            const amenityKeys = hotel.amenities && hotel.amenities.length > 0
              ? hotel.amenities.slice(0, 4)
              : Object.keys(AMENITY_ICONS).slice(codeToNum(hotel.code) % 5, (codeToNum(hotel.code) % 5) + 4);

            return isMobile ? (
              <div key={String(hotel.code)} className="hotel-card-mobile" onClick={() => handleHotelClick(hotel)}>
                <div style={{ position: "relative", height: 200 }}>
                  <img src={getImg(hotel, globalIdx)} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMGS[globalIdx % FALLBACK_IMGS.length]; }} />
                  <button className="fav-btn" onClick={e => { e.stopPropagation(); setFavorites(prev => { const n = new Set(prev); n.has(hotel.code) ? n.delete(hotel.code) : n.add(hotel.code); return n; }); }} style={{ color: isFav ? "#ef4444" : "#94a3b8" }}>{isFav ? "♥" : "♡"}</button>
                  {price > 0 && <div style={{ position: "absolute", top: 12, left: 12, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{discount}% off</div>}
                  {hotel.hasBreakfast && <div style={{ position: "absolute", bottom: 12, left: 12, background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>🍳 Breakfast</div>}
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{hotel.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                    {hotel.stars ? <span style={{ color: "#f59e0b" }}>{"★".repeat(hotel.stars)}</span> : null}
                    {hotel.address ? ` · ${hotel.address}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ background: rating >= 9 ? B : "#0369a1", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{rating.toFixed(1)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{getRatingLabel(rating)}</span>
                    {hotel.isRefundable !== null && hotel.isRefundable !== undefined && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: hotel.isRefundable ? "#16a34a" : "#dc2626", background: hotel.isRefundable ? "#dcfce7" : "#fee2e2", padding: "2px 7px", borderRadius: 5 }}>
                        {hotel.isRefundable ? "✓ Refundable" : "Non-refundable"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      {price > 0 ? (
                        <>
                          <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(wasPrice)}</div>
                          <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{formatINR(price)}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>+ taxes · per night</div>
                        </>
                      ) : <div style={{ fontSize: 13, color: "#64748b" }}>Price on request</div>}
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now</button>
                  </div>
                  <button onClick={e => { e.stopPropagation(); router.push("/upload"); }}
                    style={{ marginTop: 10, width: "100%", background: "#eff6ff", color: B, border: `1px solid #bfdbfe`, borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    🔔 Track price drop
                  </button>
                </div>
              </div>
            ) : (
              <div key={String(hotel.code)} className="hotel-card-desktop" onClick={() => handleHotelClick(hotel)}>
                <div className="card-img-wrap">
                  <img src={getImg(hotel, globalIdx)} alt={hotel.name}
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMGS[globalIdx % FALLBACK_IMGS.length]; }} />
                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.95)", color: NAVY, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>↗ Trending</div>
                  {hotel.hasBreakfast && <div style={{ position: "absolute", bottom: 10, left: 10, background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>🍳 Breakfast included</div>}
                  <button className="fav-btn" onClick={e => { e.stopPropagation(); setFavorites(prev => { const n = new Set(prev); n.has(hotel.code) ? n.delete(hotel.code) : n.add(hotel.code); return n; }); }} style={{ color: isFav ? "#ef4444" : "#94a3b8" }}>{isFav ? "♥" : "♡"}</button>
                </div>
                <div style={{ padding: "18px 20px 18px 22px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                          {hotel.name}
                          {hotel.stars ? <span style={{ color: "#f59e0b", fontSize: 12, marginLeft: 6 }}>{"★".repeat(hotel.stars)}</span> : null}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                          📍 {hotel.address || destination}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
                          <span style={{ background: rating >= 9 ? B : "#0369a1", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{rating.toFixed(1)}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{getRatingLabel(rating)}</span>
                          {hotel.isRefundable !== null && hotel.isRefundable !== undefined && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: hotel.isRefundable ? "#16a34a" : "#dc2626", background: hotel.isRefundable ? "#dcfce7" : "#fee2e2", padding: "2px 7px", borderRadius: 5 }}>
                              {hotel.isRefundable ? "✓ Free Cancellation" : "Non-refundable"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        {price > 0 ? (
                          <>
                            <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, marginBottom: 4, display: "inline-block" }}>{discount}% off</div>
                            <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>{formatINR(wasPrice)}</div>
                            <div className="sora" style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{formatINR(price)}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>+ taxes · per night</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: "#64748b" }}>
                            {!user ? <button onClick={e => { e.stopPropagation(); setShowAuthModal(true); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in for rates</button> : "Price on request"}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Amenities */}
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 20px", marginBottom: 10 }}>
                      {amenityKeys.map((key: string) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#475569" }}>
                          {AMENITY_ICONS[key] ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={AMENITY_ICONS[key]} /></svg>
                          ) : <span style={{ fontSize: 13 }}>•</span>}
                          {key}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#64748b" }}>
                      {hotel.chain ? `Part of ${hotel.chain}` : "Highly rated by guests"} · Great for business & leisure
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <button onClick={e => { e.stopPropagation(); router.push("/upload"); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", color: B, border: `1px solid #bfdbfe`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      🔔 Track price
                    </button>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now</button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
              {page > 1 && <button className="pg-btn" onClick={() => { setPage(p => p-1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>‹</button>}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > totalPages) return null;
                return <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{p}</button>;
              })}
              {page < totalPages && <button className="pg-btn" onClick={() => { setPage(p => Math.min(p+1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>›</button>}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 400, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <button className="bottom-tab-btn" onClick={() => setMobileSheet("filter")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet === "filter" ? B : "#64748b"} strokeWidth="2"><path d="M3 4h18M7 8h10M11 12h2M13 16h-2"/></svg>
            <span style={{ color: mobileSheet === "filter" ? B : "#64748b" }}>Filter</span>
          </button>
          <button className="bottom-tab-btn" onClick={() => setShowMap(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ color: "#64748b" }}>Map</span>
          </button>
          <button className="bottom-tab-btn" onClick={() => setMobileSheet("sort")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet === "sort" ? B : "#64748b"} strokeWidth="2"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
            <span style={{ color: mobileSheet === "sort" ? B : "#64748b" }}>Sort</span>
          </button>
          {!user && (
            <button className="bottom-tab-btn" onClick={() => setShowAuthModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ color: B, fontWeight: 700 }}>Sign in</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
