"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = "https://hoteldrops-production.up.railway.app/api/hotels";
const B = "#1447b8";
const NAVY = "#0f172a";

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

interface Hotel {
  code: number; name: string; stars: number; zone: { name: string };
  minRate: number; currency: string; categoryName: string;
  imageUrl?: string; address?: string; chain?: string;
  lowestPriceINR?: number;
}

const AMENITIES_MAP = ["📶 Free WiFi", "🏊 Swimming Pool", "🍽️ Restaurant", "🏋️ Gym", "💆 Spa", "🚗 Parking", "🍳 Breakfast", "✈️ Airport Shuttle"];
const FILTERS = ["Free Cancellation", "Free Breakfast", "Rated Exceptional (9+)", "Pool", "Private Beach", "Spa"];
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop",
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#64748b" }}>Loading search…</div>}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const destination = searchParams.get("destination") || "Dubai";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [checkedFilters, setCheckedFilters] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);

  const fetchHotels = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/search?destination=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
      const data = await res.json();
      if (data.hotels?.hotels) {
        setHotels(data.hotels.hotels);
        setTotal(data.hotels.total || data.hotels.hotels.length);
      } else setError(data.error || "No hotels found");
    } catch { setError("Could not connect to server"); }
    setLoading(false);
  }, [destination, checkIn, checkOut, adults]);

  useEffect(() => { if (checkIn && checkOut) fetchHotels(); }, [fetchHotels]);

  const EUR_TO_INR = 112;
  const NIGHTS = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

  const sortedHotels = [...hotels].sort((a, b) => {
    if (sortBy === "price-low") return (a.minRate || 0) - (b.minRate || 0);
    if (sortBy === "price-high") return (b.minRate || 0) - (a.minRate || 0);
    return 0;
  });

  const perPage = 10;
  const paginatedHotels = sortedHotels.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sortedHotels.length / perPage);

  const getRating = (code: number) => {
    const ratings = [9.1, 8.9, 9.4, 9.3, 8.7, 9.0, 8.8, 9.2];
    return ratings[code % ratings.length];
  };

  const getRatingLabel = (r: number) => r >= 9 ? "Exceptional" : r >= 8.5 ? "Excellent" : "Very Good";

  const getDiscount = (code: number) => {
    const discounts = [15, 12, 10, 8, 20, 18, 14, 22];
    return discounts[code % discounts.length];
  };

  const getAmenities = (code: number) => {
    const start = code % AMENITIES_MAP.length;
    return AMENITIES_MAP.slice(start, start + 4).concat(AMENITIES_MAP.slice(0, Math.max(0, 4 - (AMENITIES_MAP.length - start))));
  };

  const getImg = (hotel: Hotel, idx: number) => hotel.imageUrl || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];

  const priceINR = (hotel: Hotel) => hotel.lowestPriceINR || Math.round((hotel.minRate || 0) * EUR_TO_INR / NIGHTS);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, WebkitFontSmoothing: "antialiased" as any }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        .hotel-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 16px; display: grid; grid-template-columns: 280px 1fr; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: box-shadow .2s, transform .2s; cursor: pointer; }
        .hotel-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .hc-fav { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.07); font-size: 16px; color: #cbd5e1; transition: color .2s; border: none; }
        .hc-fav.active { color: #ef4444; }
        .filter-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; cursor: pointer; padding: 4px 0; }
        .checkbox { width: 17px; height: 17px; border: 1.5px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; font-size: 11px; }
        .checkbox.checked { background: ${B}; border-color: ${B}; color: #fff; }
        .pg-btn { width: 38px; height: 38px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: ${NAVY}; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; display: flex; align-items: center; justify-content: center; }
        .pg-btn:hover { border-color: ${B}; color: ${B}; }
        .pg-btn.active { background: ${B}; color: #fff; border-color: ${B}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:768px) { .hotel-card { grid-template-columns: 1fr; } }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "0 16px" : "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="/" style={{ background: B, color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, padding: "7px 16px", borderRadius: 8, textDecoration: "none" }}>rebuq</a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 2 }}>
              {[["🏨 Hotels", true], ["How it works", false], ["Results", false]].map(([l, active]) => (
                <button key={l as string} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? B : "#64748b", cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", borderBottom: active ? `2px solid ${B}` : "2px solid transparent" }}>{l as string}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/upload")} style={{ display: "flex", alignItems: "center", gap: 6, background: B, color: "#fff", border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ✦ Price Watch
          </button>
          {!isMobile && <button style={{ fontSize: 13.5, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>👤 Sign in</button>}
        </div>
      </nav>

      {/* SEARCH BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "12px 16px" : "12px 32px", display: "flex", alignItems: "center", gap: 0, flexWrap: isMobile ? "wrap" as const : "nowrap" as const }}>
        {[
          { label: "Destination", val: destination },
          { label: "Check-in", val: checkIn || "Select date" },
          { label: "Check-out", val: checkOut || "Select date" },
          { label: "Rooms & Guests", val: `1 Room, ${adults} Guests` },
        ].map((f, i) => (
          <div key={i} style={{ flex: 1, padding: isMobile ? "6px 0" : "6px 20px", borderRight: !isMobile && i < 3 ? "1px solid #e2e8f0" : "none", borderBottom: isMobile ? "1px solid #e2e8f0" : "none", minWidth: isMobile ? "50%" : "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{f.val}</div>
          </div>
        ))}
        <button onClick={fetchHotels} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "12px" : "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: isMobile ? 0 : 16, marginTop: isMobile ? 10 : 0, width: isMobile ? "100%" : "auto", whiteSpace: "nowrap" as const }}>
          🔍 Search
        </button>
      </div>

      {/* OFFERS STRIP */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 32px", display: "flex", gap: 14, overflowX: "auto" }}>
        {[
          { title: "Flat 15% off", desc: "on International Hotels with Yes Bank Cards" },
          { title: "Flat 12% Off", desc: "with HDFC Bank Credit Cards" },
          { title: "Track price drops", desc: "Upload voucher — AI watches 24/7 for free" },
        ].map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", whiteSpace: "nowrap" as const, flexShrink: 0, cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, background: B, color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>%</div>
            <div style={{ fontSize: 12.5, color: "#1e293b" }}><strong style={{ display: "block", fontWeight: 700, color: NAVY, fontSize: 13 }}>{o.title}</strong>{o.desc}</div>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "20px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 24 }}>

        {/* SIDEBAR */}
        {!isMobile && (
          <div>
            {/* Map card */}
            <div style={{ background: "#eff6ff", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
              <div style={{ height: 160, background: `linear-gradient(135deg, #1e3a8a, ${B}, #60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, position: "relative" }}>🗺️ Map view</span>
              </div>
              <div style={{ padding: "10px 14px", background: "#fff", textAlign: "center" as const, color: B, fontSize: 13.5, fontWeight: 600 }}>🗺 Explore on Map</div>
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 20 }}>
              <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Filters</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", marginBottom: 20 }}>
                <span style={{ color: "#64748b" }}>🔍</span>
                <input type="text" placeholder="Enter area, locality or hotel" style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, color: NAVY, background: "transparent", width: "100%" }} />
              </div>

              {/* Most Popular */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Most Popular</div>
                {FILTERS.map((f, i) => (
                  <div key={i} className="filter-row" onClick={() => {
                    setCheckedFilters(prev => {
                      const next = new Set(prev);
                      next.has(i) ? next.delete(i) : next.add(i);
                      return next;
                    });
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#1e293b" }}>
                      <div className={`checkbox${checkedFilters.has(i) ? " checked" : ""}`}>{checkedFilters.has(i) ? "✓" : ""}</div>
                      {f}
                    </div>
                    <span style={{ fontSize: 12.5, color: "#64748b" }}>{[309, 617, 190, 428, 124, 201][i]}</span>
                  </div>
                ))}
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Price per night</div>
                <div style={{ position: "relative", height: 5, background: "#e2e8f0", borderRadius: 100, margin: "14px 0 6px" }}>
                  <div style={{ position: "absolute", left: "5%", right: "25%", height: "100%", background: B, borderRadius: 100 }} />
                  <div style={{ position: "absolute", width: 16, height: 16, background: "#fff", border: `2.5px solid ${B}`, borderRadius: "50%", top: "50%", transform: "translateY(-50%)", left: "5%", cursor: "grab", boxShadow: "0 2px 6px rgba(20,71,184,0.3)" }} />
                  <div style={{ position: "absolute", width: 16, height: 16, background: "#fff", border: `2.5px solid ${B}`, borderRadius: "50%", top: "50%", transform: "translateY(-50%)", right: "25%", cursor: "grab", boxShadow: "0 2px 6px rgba(20,71,184,0.3)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#64748b" }}>
                  <span>₹2,500</span><span>₹50,000+</span>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Star Rating</div>
                {[5, 4, 3].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                    <div style={{ width: 17, height: 17, border: "1.5px solid #e2e8f0", borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ color: "#f59e0b", fontSize: 14 }}>{"★".repeat(s)}</span>
                    <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{s} Star</span>
                    <span style={{ fontSize: 12.5, color: "#64748b", marginLeft: "auto" }}>{[210, 318, 425][5 - s]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap" as const, gap: 10 }}>
            <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>
              Hotels in {destination}
              {!loading && <span style={{ fontSize: 14, fontWeight: 400, color: "#64748b", fontFamily: "Inter,sans-serif", marginLeft: 10 }}>{total} properties found</span>}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 13.5, fontFamily: "inherit", color: NAVY, background: "#fff", cursor: "pointer", outline: "none", fontWeight: 500 }}>
              <option value="popularity">Sort by: Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 36, height: 36, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 14, color: "#64748b" }}>Finding the best hotels in {destination}…</div>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏨</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{error}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Try searching for a different destination or dates</div>
              <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>← Back to search</button>
            </div>
          )}

          {!loading && !error && paginatedHotels.map((hotel, idx) => {
            const rating = getRating(hotel.code);
            const discount = getDiscount(hotel.code);
            const price = priceINR(hotel);
            const wasPrice = Math.round(price * (1 + discount / 100));
            const amenities = getAmenities(hotel.code);
            const isFav = favorites.has(hotel.code);
            const globalIdx = (page - 1) * perPage + idx;

            return (
              <div key={hotel.code} className="hotel-card"
                onClick={() => router.push(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)}>

                {/* Image */}
                <div style={{ position: "relative", minHeight: 220 }}>
                  <img src={getImg(hotel, globalIdx)} alt={hotel.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 220 }} />
                  <div style={{ position: "absolute", top: 12, left: 12, background: "#fff", color: NAVY, fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <span>↗</span> Trending
                  </div>
                  <button className={`hc-fav${isFav ? " active" : ""}`}
                    onClick={e => { e.stopPropagation(); setFavorites(prev => { const n = new Set(prev); n.has(hotel.code) ? n.delete(hotel.code) : n.add(hotel.code); return n; }); }}>
                    {isFav ? "♥" : "♡"}
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 20px 20px 24px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: isMobile ? "wrap" as const : "nowrap" as const, gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 5 }}>
                          {hotel.name}
                          <span style={{ color: "#f59e0b", fontSize: 13, marginLeft: 6 }}>{"★".repeat(Math.min(hotel.stars || 5, 5))}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                          📍 {hotel.zone?.name || hotel.address || hotel.chain || "Dubai"} · {hotel.categoryName || "5 Star"}
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ background: rating >= 9 ? B : "#0369a1", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 9px", borderRadius: 7, fontFamily: "'Sora',sans-serif" }}>{rating.toFixed(1)}</span>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>{getRatingLabel(rating)}</span>
                          <span style={{ fontSize: 12.5, color: "#64748b" }}>· {(1000 + hotel.code % 3000).toLocaleString()} Ratings</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        {price > 0 ? (
                          <>
                            <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, marginBottom: 6, display: "inline-block" }}>{discount}% off</div>
                            <div style={{ fontSize: 12.5, color: "#64748b", textDecoration: "line-through" }}>{formatINR(wasPrice)}</div>
                            <div className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{formatINR(price)}</div>
                            <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4, marginTop: 2 }}>+ taxes & fees<br />per night, per room</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: "#64748b", paddingTop: 8 }}>Price on request</div>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px 16px", marginBottom: 12 }}>
                      {amenities.slice(0, 4).map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#1e293b", fontWeight: 500 }}>
                          {a}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
                      • {hotel.chain ? `Part of ${hotel.chain}` : "Highly rated by guests"} · {hotel.zone?.name || "Central location"} · Great for business & leisure
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={e => { e.stopPropagation(); router.push("/upload"); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", color: B, border: `1px solid #bfdbfe`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      🔔 Track price
                    </button>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28 }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{p}</button>
              ))}
              {totalPages > 5 && <button className="pg-btn" onClick={() => { setPage(p => Math.min(p + 1, totalPages)); }}>›</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
