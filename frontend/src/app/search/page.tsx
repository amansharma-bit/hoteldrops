"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = "https://hoteldrops-production.up.railway.app";

interface HotelRate {
  rateKey: string;
  net: string;
  currency: string;
  boardName: string;
  rooms: number;
  adults: number;
  children: number;
}

interface Hotel {
  code: number;
  name: string;
  categoryName: string;
  destinationName: string;
  zoneName: string;
  latitude: string;
  longitude: string;
  minRate: string;
  maxRate: string;
  currency: string;
  rooms?: { rates: HotelRate[] }[];
  images?: { path: string; type: { code: string } }[];
}

interface SearchResponse {
  hotels: { hotels: Hotel[]; total: number; checkIn: string; checkOut: string };
}

function nights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function formatINR(price: string, currency: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  const rates: Record<string, number> = { EUR: 112, USD: 84, GBP: 131, AED: 22.9, THB: 2.4, IDR: 0.0052 };
  const inr = currency === "INR" ? num : num * (rates[currency] || 83);
  return "₹" + Math.round(inr).toLocaleString("en-IN");
}

function starCount(categoryName: string): number {
  const match = categoryName?.match(/(\d)/);
  return match ? parseInt(match[1]) : 0;
}

const CITY_PHOTOS: Record<string, string[]> = {
  dubai: ["photo-1512453979798-5ea266f8880c", "photo-1518684079-3c830dcef090", "photo-1547458718-b47a2b38e09a"],
  bangkok: ["photo-1508009603885-50cf7c579365", "photo-1563492065599-3520f775eeed", "photo-1555217851-6141535bd771"],
  bali: ["photo-1537996194471-e657df975ab4", "photo-1573790387438-4da905039392", "photo-1555400038-63f5ba517a47"],
  maldives: ["photo-1514282401047-d79a71a590e8", "photo-1573843981267-be1999ff37cd", "photo-1540202404-1b927e27fa8b"],
  singapore: ["photo-1525625293386-3f8f99389edd", "photo-1506965257827-39bbd0af3e8f", "photo-1508964942454-1a56651d54ac"],
  paris: ["photo-1499856871958-5b9627545d1a", "photo-1502602898657-3e91760cbb34", "photo-1543349689-9a4d426bee8e"],
  london: ["photo-1513635269975-59663e0ac1ad", "photo-1526129318478-62ed807ebdf9", "photo-1488747279002-2e4c0f68a4ac"],
  tokyo: ["photo-1540959733332-eab4deabeeaf", "photo-1536098561742-ca998e48cbcc", "photo-1490806843957-31f4c9a91c65"],
};

function hotelImage(hotel: Hotel, destination: string): string {
  if (hotel.images?.length) {
    const preferred = hotel.images.find(img => img.type?.code === "GEN" || img.type?.code === "HAB");
    const img = preferred || hotel.images[0];
    if (img?.path) return `https://photos.hotelbeds.com/giata/bigger/${img.path}`;
  }
  const key = destination.toLowerCase();
  const photos = CITY_PHOTOS[key] || CITY_PHOTOS["dubai"];
  const photoId = photos[hotel.code % photos.length];
  return `https://images.unsplash.com/${photoId}?w=400&h=300&q=80&auto=format&fit=crop`;
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden", display: "grid", gridTemplateColumns: "220px 1fr", height: 180 }}>
      <div style={{ background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 16, background: "#f0f0f0", borderRadius: 6, width: "60%" }} />
        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, width: "40%" }} />
        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, width: "50%" }} />
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: 24, background: "#f0f0f0", borderRadius: 6, width: 100 }} />
          <div style={{ height: 36, background: "#f0f0f0", borderRadius: 9, width: 110 }} />
        </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel, checkIn, checkOut, guests, destination, onViewDeal }: {
  hotel: Hotel; checkIn: string; checkOut: string; guests: number; destination: string; onViewDeal: (code: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const numNights = nights(checkIn, checkOut);
  const stars = starCount(hotel.categoryName);
  const pricePerNight = hotel.minRate ? formatINR(String(parseFloat(hotel.minRate) / numNights), hotel.currency) : null;
  const totalPrice = hotel.minRate ? formatINR(hotel.minRate, hotel.currency) : null;
  const imgSrc = imgError
    ? `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&q=80&auto=format&fit=crop`
    : hotelImage(hotel, destination);
  const boardName = hotel.rooms?.[0]?.rates?.[0]?.boardName;

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #eaeef2", overflow: "hidden", display: "grid", gridTemplateColumns: "220px 1fr", transition: "box-shadow 0.2s, border-color 0.2s", cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#d0d8e4"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#eaeef2"; }}>
      <div style={{ position: "relative", overflow: "hidden", background: "#f4f6f9" }}>
        <img src={imgSrc} alt={hotel.name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
        {hotel.categoryName && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#374151" }}>
            {hotel.categoryName}
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
        {stars > 0 && (
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={i < stars ? "#f59e0b" : "#e5e7eb"}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{hotel.name}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {[hotel.zoneName, hotel.destinationName].filter(Boolean).join(", ")}
        </div>
        {boardName && (
          <div style={{ display: "inline-block", background: "#f4f6f9", color: "#6b7280", fontSize: 11, padding: "2px 10px", borderRadius: 20, width: "fit-content" }}>{boardName}</div>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f4f6f9", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            {pricePerNight && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827" }}>{pricePerNight}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>/night</span>
              </div>
            )}
            {totalPrice && numNights > 1 && (
              <div style={{ fontSize: 11, color: "#b0bec8", marginTop: 2 }}>{totalPrice} total · {numNights} nights</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => {}} style={{ background: "#eff6ff", color: "#1447b8", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              🔔 Track
            </button>
            <button onClick={() => onViewDeal(hotel.code)} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              View deal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({ minPrice, maxPrice, priceRange, onPriceRange, starFilter, onStarFilter, sortBy, onSortBy, hotelName, onHotelName }: {
  minPrice: number; maxPrice: number; priceRange: [number, number]; onPriceRange: (v: [number, number]) => void;
  starFilter: number[]; onStarFilter: (v: number[]) => void; sortBy: string; onSortBy: (v: string) => void;
  hotelName: string; onHotelName: (v: string) => void;
}) {
  const toggleStar = (s: number) => onStarFilter(starFilter.includes(s) ? starFilter.filter(x => x !== s) : [...starFilter, s]);
  const sStyle: React.CSSProperties = { background: "#fff", border: "1px solid #eaeef2", borderRadius: 14, padding: "18px 16px" };
  const titleStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#9ca3af", marginBottom: 12 };

  return (
    <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 80 }}>
      <div style={sStyle}>
        <div style={titleStyle}>Search by name</div>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="e.g. Hyatt, Marriott…" value={hotelName} onChange={e => onHotelName(e.target.value)}
            style={{ width: "100%", paddingLeft: 30, paddingRight: hotelName ? 28 : 10, paddingTop: 8, paddingBottom: 8, border: "1px solid #eaeef2", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f9fafb", color: "#111827" }} />
          {hotelName && (
            <button onClick={() => onHotelName("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af" }}>✕</button>
          )}
        </div>
      </div>
      <div style={sStyle}>
        <div style={titleStyle}>Sort by</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[{ v: "price_asc", l: "Price: Low to high" }, { v: "price_desc", l: "Price: High to low" }, { v: "name_asc", l: "Name A–Z" }, { v: "stars_desc", l: "Stars: High to low" }].map(opt => (
            <label key={opt.v} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#374151" }}>
              <input type="radio" name="sort" value={opt.v} checked={sortBy === opt.v} onChange={() => onSortBy(opt.v)} style={{ accentColor: "#1447b8" }} />
              {opt.l}
            </label>
          ))}
        </div>
      </div>
      <div style={sStyle}>
        <div style={titleStyle}>Star rating</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[5, 4, 3, 2, 1].map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={starFilter.includes(s)} onChange={() => toggleStar(s)} style={{ accentColor: "#1447b8" }} />
              <span style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: s }).map((_, i) => (
                  <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
            </label>
          ))}
        </div>
      </div>
      {maxPrice > minPrice && (
        <div style={sStyle}>
          <div style={titleStyle}>Max price/night</div>
          <input type="range" min={minPrice} max={maxPrice} value={priceRange[1]}
            onChange={e => onPriceRange([priceRange[0], Number(e.target.value)])}
            style={{ width: "100%", accentColor: "#1447b8" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            <span>₹{Math.round(minPrice).toLocaleString("en-IN")}</span>
            <span>₹{Math.round(priceRange[1]).toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1447b8", marginBottom: 6 }}>💡 Already booked?</div>
        <div style={{ fontSize: 11, color: "#4a6278", lineHeight: 1.6, marginBottom: 10 }}>Upload your voucher and our AI watches for a lower price.</div>
        <button onClick={() => window.location.href = "/upload"} style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
          Track my price →
        </button>
      </div>
    </aside>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests") || 2);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("price_asc");
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 9999999]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(9999999);
  const [hotelName, setHotelName] = useState("");

  const fetchHotels = useCallback(async () => {
    if (!destination || !checkIn || !checkOut) { setError("Missing search parameters."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url = new URL(`${API_BASE}/api/hotels/search`);
      url.searchParams.set("destination", destination);
      url.searchParams.set("checkIn", checkIn);
      url.searchParams.set("checkOut", checkOut);
      url.searchParams.set("adults", String(guests));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: SearchResponse = await res.json();
      const list = data?.hotels?.hotels || [];
      setHotels(list);
      const INR_RATES: Record<string, number> = { EUR: 112, USD: 84, GBP: 131, AED: 22.9 };
      const prices = list.map(h => {
        const p = parseFloat(h.minRate);
        const rate = INR_RATES[h.currency] || 1;
        return isNaN(p) ? 0 : p * rate;
      }).filter(p => p > 0);
      if (prices.length) {
        const lo = Math.floor(Math.min(...prices));
        const hi = Math.ceil(Math.max(...prices));
        setMinPrice(lo); setMaxPrice(hi); setPriceRange([lo, hi]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [destination, checkIn, checkOut, guests]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const INR_RATES: Record<string, number> = { EUR: 112, USD: 84, GBP: 131, AED: 22.9, THB: 2.4, IDR: 0.0052 };
  const numNights = nights(checkIn, checkOut);

  const filtered = hotels.filter(h => {
    if (hotelName && !h.name.toLowerCase().includes(hotelName.toLowerCase())) return false;
    if (starFilter.length && !starFilter.includes(starCount(h.categoryName))) return false;
    const priceINR = parseFloat(h.minRate) * (INR_RATES[h.currency] || 1);
    if (!isNaN(priceINR) && priceINR > priceRange[1]) return false;
    return true;
  }).sort((a, b) => {
    const aINR = parseFloat(a.minRate) * (INR_RATES[a.currency] || 1);
    const bINR = parseFloat(b.minRate) * (INR_RATES[b.currency] || 1);
    if (sortBy === "price_asc") return aINR - bINR;
    if (sortBy === "price_desc") return bINR - aINR;
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "stars_desc") return starCount(b.categoryName) - starCount(a.categoryName);
    return 0;
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9", minHeight: "100vh" }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", background: "#f4f6f9", border: "1px solid #eaeef2", borderRadius: 100, overflow: "hidden", fontSize: 13 }}>
          <div style={{ padding: "8px 16px", borderRight: "1px solid #eaeef2", fontWeight: 500, color: "#111827" }}>{destination}</div>
          <div style={{ padding: "8px 16px", borderRight: "1px solid #eaeef2", color: "#6b7280" }}>{checkIn} – {checkOut}</div>
          <div style={{ padding: "8px 16px", borderRight: "1px solid #eaeef2", color: "#6b7280" }}>{guests} {guests === 1 ? "guest" : "guests"}</div>
          <button onClick={() => router.push("/search-hotels")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            Search
          </button>
        </div>
        <a href="#" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Sign in</a>
      </nav>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 26, fontWeight: 700, color: "#0a0a0f", letterSpacing: "-0.5px", marginBottom: 12 }}>
            {loading ? "Searching hotels…" : error ? "Search error" : `${filtered.length} hotels in ${destination}`}
          </h1>
          {!loading && !error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Check-in: <span style={{ color: "#1447b8" }}>{checkIn}</span>
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>→</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Check-out: <span style={{ color: "#1447b8" }}>{checkOut}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                🌙 {numNights} night{numNights !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                👥 {guests} {guests === 1 ? "guest" : "guests"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#1447b8" }}>
                ₹ Prices in INR
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {!loading && !error && hotels.length > 0 && (
            <FilterSidebar minPrice={minPrice} maxPrice={maxPrice} priceRange={priceRange} onPriceRange={setPriceRange}
              starFilter={starFilter} onStarFilter={setStarFilter} sortBy={sortBy} onSortBy={setSortBy}
              hotelName={hotelName} onHotelName={setHotelName} />
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : error ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #fee2e2", padding: "32px", textAlign: "center" }}>
                <p style={{ color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>Couldn&apos;t load results</p>
                <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</p>
                <button onClick={fetchHotels} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", padding: "48px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>No hotels match your filters</p>
                <button onClick={() => { setStarFilter([]); setPriceRange([minPrice, maxPrice]); setHotelName(""); }} style={{ color: "#1447b8", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>
              </div>
            ) : (
              filtered.map(hotel => (
                <HotelCard key={hotel.code} hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} destination={destination}
                  onViewDeal={code => {
                    const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests) });
                    router.push(`/hotel/${code}?${params.toString()}`);
                  }} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
