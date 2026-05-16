"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", country: "UAE", code: "DXB", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=85&fit=crop", large: true },
  { flag: "🇲🇻", city: "Maldives", country: "South Asia", code: "MLE", img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=85&fit=crop", featured: true, badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇹🇭", city: "Bangkok", country: "Thailand", code: "BKK", img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=85&fit=crop", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia", code: "DPS", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85&fit=crop" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia", code: "SIN", img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=85&fit=crop" },
  { flag: "🇫🇷", city: "Paris", country: "France", code: "CDG", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=85&fit=crop", badge: "Great Value", badgeColor: B, badgeText: "#fff" },
  { flag: "🇬🇧", city: "London", country: "UK", code: "LHR", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=85&fit=crop" },
  { flag: "🇯🇵", city: "Tokyo", country: "Japan", code: "TYO", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=85&fit=crop" },
];

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop", // Maldives overwater
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=85&fit=crop", // Paris Eiffel
  "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=85&fit=crop", // Singapore MBS
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&q=85&fit=crop", // Dubai Atlantis
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85&fit=crop", // Bali temple
  "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=85&fit=crop", // Bangkok luxury
];

const HOTELS = [
  { name: "Soneva Fushi", loc: "Maldives, South Asia", stars: 5, rating: "4.9 (5.1k)", tags: ["Overwater", "Private pool", "Snorkeling", "Butler"], was: "₹1,70,000", now: "₹1,24,000", save: "Save ₹46,000", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: HOTEL_IMAGES[0] },
  { name: "The Ritz Paris", loc: "Paris, France", stars: 5, rating: "4.8 (4.2k)", tags: ["Fine dining", "Spa", "Pool", "Concierge"], was: "₹74,000", now: "₹52,000", save: "Save ₹22,000", badges: [["Best Value", "best"], ["↓ 15% Off", "off"]], img: HOTEL_IMAGES[1] },
  { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool", "Casino", "SkyPark"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["⚡ AI Watching", "watching"], ["↓ 4% Off", "off"]], img: HOTEL_IMAGES[2] },
  { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark", "Beach", "Resort", "Golf"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending", "trending"], ["⚡ AI Watching", "watching"]], img: HOTEL_IMAGES[3] },
  { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view", "Spa", "Pool", "Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending", "trending"], ["↓ 3.5% Off", "off"]], img: HOTEL_IMAGES[4] },
  { name: "Capella Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.8 (2.1k)", tags: ["River view", "Pool", "Fine dining"], was: "₹26,600", now: "₹18,200", save: "Save ₹8,400", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: HOTEL_IMAGES[5] },
];

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" },
  best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" },
  trending: { bg: "#f59e0b", color: "#1a1a1a" },
  off: { bg: "#ef4444", color: "#fff" },
};

const PILLS = ["🇦🇪 Dubai","🇹🇭 Bangkok","🇮🇩 Bali","🇲🇻 Maldives","🇸🇬 Singapore","🇫🇷 Paris","🇬🇧 London","🇯🇵 Tokyo","🇺🇸 New York","🇮🇹 Rome"];
const FILTERS = ["All Hotels","🇦🇪 Dubai","🇹🇭 Bangkok","🇮🇩 Bali","🇲🇻 Maldives","🇸🇬 Singapore","🇫🇷 Paris"];
const SORTS = ["↓ Savings","★ Rating","₹ Price"];

const STATS = [
  { id: 0, target: 4200, prefix: "", suffix: "+", label: "Bookings monitored live" },
  { id: 1, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for travelers" },
  { id: 2, target: 28, prefix: "", suffix: "%", label: "Avg price drop caught" },
  { id: 3, target: 6, prefix: "", suffix: " hrs", label: "Avg time to find drop" },
];

export default function SearchHotelsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeSort, setActiveSort] = useState(0);
  const [activePill, setActivePill] = useState(-1);
  const [statVals, setStatVals] = useState(STATS.map(s => `${s.prefix}${s.target}${s.suffix}`));
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        STATS.forEach((s, i) => {
          let start: number | null = null;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1200, 1);
            setStatVals(prev => {
              const next = [...prev];
              next[i] = `${s.prefix}${Math.floor(p * s.target).toLocaleString("en-IN")}${s.suffix}`;
              return next;
            });
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    if (!destination) return;
    router.push(`/search?destination=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}`);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" as any }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 58 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 19, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 28, listStyle: "none" }}>
            {[["How it works", "/"], ["Results", "/"], ["Why rebuq", "/"], ["Search hotels", "/search-hotels"]].map(([l, h]) => (
              <li key={l}><a href={h} style={{ fontSize: 13.5, color: l === "Search hotels" ? NAVY : "#64748b", textDecoration: "none", fontWeight: l === "Search hotels" ? 600 : 500 }}>{l}</a></li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isMobile && <button style={{ fontSize: 13.5, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: "7px 12px" }}>Sign in</button>}
          <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {isMobile ? "Check booking" : "Check my booking"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg,#0c1f5c 0%,#1a3a8f 40%,#1e4fc2 100%)", padding: isMobile ? "40px 20px 60px" : "60px 40px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 30%,rgba(255,255,255,0.05) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(37,99,235,0.3) 0%,transparent 50%)" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 600, padding: "5px 16px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.15)", letterSpacing: "0.06em", textTransform: "uppercase" as const, position: "relative" }}>
          <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", animation: "pulse 1.5s infinite", display: "inline-block" }} />
          Live rates · No markup · No middleman
        </div>

        <h1 className="sora" style={{ fontSize: isMobile ? 32 : 58, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14, position: "relative" }}>
          Find your hotel<br />at <span style={{ color: "#f59e0b" }}>wholesale price</span>
        </h1>
        <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.72)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.65, position: "relative" }}>
          Search 500,000+ hotels at live rates from global suppliers — then let our AI watch the price after you book.
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12.5, padding: "6px 16px", borderRadius: 100, marginBottom: 28, position: "relative" }}>
          🔔 <span style={{ fontWeight: 600, color: "#fcd34d" }}>Priya S.</span> saved ₹22,400 on Atlantis Dubai
          <span style={{ background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>Just now</span>
        </div>

        {/* SEARCH BOX */}
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", maxWidth: 880, margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr 1.2fr 0.8fr auto", gap: 0, position: "relative" }}>
          {[
            { label: "📍 Destination or Hotel", type: "text", placeholder: "Where to?", value: destination, onChange: (e: any) => setDestination(e.target.value) },
            { label: "📅 Check-in", type: "date", value: checkIn, onChange: (e: any) => setCheckIn(e.target.value) },
            { label: "📅 Check-out", type: "date", value: checkOut, onChange: (e: any) => setCheckOut(e.target.value) },
            { label: "👤 Guests", type: "select", value: guests, onChange: (e: any) => setGuests(e.target.value) },
          ].map((f, i) => (
            <div key={i} style={{ padding: isMobile ? "10px 0" : "8px 16px", borderRight: isMobile ? "none" : i < 3 ? "1px solid #e2e8f0" : "none", borderBottom: isMobile ? "1px solid #e2e8f0" : "none" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{f.label}</label>
              {f.type === "select" ? (
                <select value={f.value} onChange={f.onChange} style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent", cursor: "pointer" }}>
                  {["1 Adult", "2 Adults", "3 Adults", "4 Adults"].map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} placeholder={(f as any).placeholder} value={f.value} onChange={f.onChange}
                  style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent", cursor: "pointer" }} />
              )}
            </div>
          ))}
          <button onClick={handleSearch} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 12 : 0, whiteSpace: "nowrap" as const, width: isMobile ? "100%" : "auto" }}>
            🔍 Search
          </button>
        </div>

        {/* DEST PILLS */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" as const, position: "relative" }}>
          {PILLS.map((p, i) => (
            <button key={i} onClick={() => { setActivePill(i); setDestination(p.split(" ").slice(1).join(" ")); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: activePill === i ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 500, padding: "5px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit" }}>
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }} ref={statsRef}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px" : "26px 40px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: isMobile ? "none" : i < 3 ? "1px solid #e2e8f0" : "none", padding: "0 20px" }}>
              <div className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY }}>{statVals[i]}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP DESTINATIONS */}
      <div style={{ padding: isMobile ? "50px 20px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Popular with Indians</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Top destinations right now</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Live prices from 100+ booking platforms — updated every 6 hours.</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a", whiteSpace: "nowrap" as const }}>
            <span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} /> Prices live
          </span>
        </div>

        {/* DEST GRID */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gridTemplateRows: isMobile ? "auto" : "170px 170px", gap: 14, marginTop: 28 }}>
          {DESTINATIONS.map((d, i) => (
            <div key={i} onClick={() => setDestination(d.city)}
              style={{ borderRadius: 14, overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", transition: "transform .25s", gridColumn: !isMobile && d.large ? "1" : !isMobile && d.featured ? "2" : "auto", gridRow: !isMobile && (d.large || d.featured) ? "1/3" : "auto" }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-4px)")} onMouseOut={e => (e.currentTarget.style.transform = "none")}>
              <div style={{ background: "#1a3a8f", width: "100%", height: "100%", minHeight: !isMobile && (d.large || d.featured) ? 340 : 160, position: "relative" }}>
                <img src={d.img} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: !isMobile && (d.large || d.featured) ? 340 : 160 }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)" }} />
              {d.badge && (
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 6, background: d.badgeColor, color: d.badgeText }}>{d.badge}</span>
              )}
              <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700 }}>{d.city}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{d.country}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: B, fontWeight: 600, cursor: "pointer" }}>Don&apos;t see your destination? Search any city or hotel →</p>
      </div>

      {/* HOTELS */}
      <div style={{ background: "#f8fafc", padding: isMobile ? "50px 0" : "70px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Trending Now</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap" as const, gap: 16 }}>
            <div>
              <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Hotels travelers love</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>rebuq users saved an average of <strong>₹24,600</strong> on these properties.</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Sort</span>
              {SORTS.map((s, i) => (
                <button key={i} onClick={() => setActiveSort(i)}
                  style={{ border: `1.5px solid ${activeSort === i ? NAVY : "#e2e8f0"}`, background: activeSort === i ? NAVY : "#fff", color: activeSort === i ? "#fff" : NAVY, fontSize: 12.5, fontWeight: 600, padding: "6px 16px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
            {FILTERS.map((f, i) => (
              <button key={i} onClick={() => setActiveFilter(i)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: activeFilter === i ? NAVY : "#fff", border: `1.5px solid ${activeFilter === i ? NAVY : "#e2e8f0"}`, color: activeFilter === i ? "#fff" : NAVY, fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit" }}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {HOTELS.map((h, i) => (
              <div key={i} onClick={() => router.push(`/hotel/372446?checkIn=${checkIn || "2026-08-11"}&checkOut=${checkOut || "2026-08-13"}&adults=${guests || "2"}`)}
                style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid #e2e8f0", cursor: "pointer", transition: "transform .2s" }}
                onMouseOver={e => (e.currentTarget.style.transform = "translateY(-4px)")} onMouseOut={e => (e.currentTarget.style.transform = "none")}>
                <div style={{ height: 190, position: "relative", overflow: "hidden" }}>
                  <img src={h.img} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {h.badges.map(([label, type]) => {
                      const s = BADGE_STYLES[type as string] || BADGE_STYLES.luxury;
                      return <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: s.bg, color: s.color }}>{label}</span>;
                    })}
                  </div>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>{"★".repeat(h.stars)}</div>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📍 {h.loc} · {h.rating}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 14 }}>
                    {h.tags.map(t => <span key={t} style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{t}</span>)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>{h.was}</div>
                      <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{h.now} <span style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span></div>
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>{h.save}</div>
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
                      View deal →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={handleSearch} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ↓ Search more hotels
            </button>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: "#fff", padding: isMobile ? "50px 20px" : "70px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 32, marginTop: 24 }}>
            {[
              { n: "01", title: "Upload your booking", text: "Share your hotel confirmation — any platform works. Upload once and we start watching immediately." },
              { n: "02", title: "We watch the price", text: "AI monitors the price every 6 hours, 24/7 — nights, weekends, flash sales included." },
              { n: "03", title: "Price drops → you save", text: "Instant WhatsApp alert with a rebooking link the moment it drops. Rebook in minutes." },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div className="sora" style={{ fontSize: 13, fontWeight: 800, color: B, background: "#eff6ff", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                <div>
                  <h3 className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 20, marginTop: 40 }}>
            {[
              { icon: "🆓", title: "Free to check", text: "No credit card needed. Upload and we start watching immediately." },
              { icon: "🤖", title: "AI watches 24/7", text: "Our engine checks every 6 hours — nights, weekends, flash sales included." },
              { icon: "💬", title: "WhatsApp alert", text: "Instant message with a rebooking link the moment the price drops." },
              { icon: "💰", title: "Pay only if you save", text: "Small success fee on savings only. Zero cost if price never drops." },
            ].map(f => (
              <div key={f.title} style={{ background: "#f8fafc", borderRadius: 12, padding: "22px 20px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <h4 className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{f.title}</h4>
                <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ background: "linear-gradient(135deg,#0c1f5c 0%,#1e4fc2 100%)", padding: isMobile ? "50px 20px" : "64px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              ✦ Already booked elsewhere?
            </div>
            <h2 className="sora" style={{ fontSize: isMobile ? 26 : 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
              Don&apos;t overpay. Let our AI <span style={{ color: "#f59e0b" }}>watch the price.</span>
            </h2>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28 }}>
              Upload your booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops.
            </p>
            <div style={{ display: "flex", gap: 28 }}>
              {[["₹18Cr+", "Total saved"], ["12,000+", "Travelers"], ["28%", "Avg drop"]].map(([n, l]) => (
                <div key={l}>
                  <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{n}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: B, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6, marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              📤 Upload your voucher
            </div>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 5 }}>Upload your booking confirmation</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>Takes 30 seconds. We handle the rest.</div>
            <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" as const }}>
              {["Booking.com", "Agoda", "MakeMyTrip"].map(o => (
                <span key={o} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "4px 10px", fontSize: 11.5, fontWeight: 500, color: NAVY }}>{o}</span>
              ))}
            </div>
            <button onClick={() => router.push("/upload")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              📤 Upload my booking →
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ width: "100%", background: "transparent", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Search hotels instead
            </button>
            <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748b", marginTop: 10 }}>Free to check · Pay only if we save you money</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "36px 20px 24px" : "40px 40px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 32, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 240, lineHeight: 1.6 }}>AI price monitoring for hotel bookings. Free to check — we earn only when you save.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 24 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[
                { title: "Product", links: ["How it works", "Results", "Why rebuq", "Search Hotels"] },
                { title: "Company", links: ["Privacy", "Terms"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 12 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13.5, color: "#94a3b8", textDecoration: "none", marginBottom: 9 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: "flex", gap: 14 }}>
              {["Twitter", "LinkedIn", "Instagram"].map(s => <a key={s} href="#" style={{ fontSize: 12.5, color: "#475569", textDecoration: "none" }}>{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
