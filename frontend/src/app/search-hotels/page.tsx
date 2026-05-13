"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", desc: "UAE", photo: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇹🇭", city: "Bangkok", desc: "Thailand", photo: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇮🇩", city: "Bali", desc: "Indonesia", photo: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇲🇻", city: "Maldives", desc: "South Asia", photo: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇸🇬", city: "Singapore", desc: "Southeast Asia", photo: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇫🇷", city: "Paris", desc: "France", photo: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇬🇧", city: "London", desc: "United Kingdom", photo: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80&auto=format&fit=crop" },
  { flag: "🇯🇵", city: "Tokyo", desc: "Japan", photo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80&auto=format&fit=crop" },
];

const TRENDING = [
  { flag: "🇦🇪", city: "Dubai, UAE", hotel: "Atlantis The Palm", price: "₹28,400/night", tag: "Trending", photo: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80&auto=format&fit=crop" },
  { flag: "🇹🇭", city: "Bangkok, Thailand", hotel: "Capella Bangkok", price: "₹18,200/night", tag: "Best value", photo: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80&auto=format&fit=crop" },
  { flag: "🇲🇻", city: "Maldives", hotel: "Soneva Fushi", price: "₹1,24,000/night", tag: "Luxury", photo: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80&auto=format&fit=crop" },
];

export default function SearchHotels() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [focused, setFocused] = useState(false);
  const [dateError, setDateError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError("");
    if (!destination) { alert("Please enter a destination"); return; }
    if (!checkIn) { alert("Please select a check-in date"); return; }
    if (!checkOut) { alert("Please select a check-out date"); return; }
    if (checkOut <= checkIn) { setDateError("Check-out must be after check-in"); return; }
    const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests) });
    router.push(`/search?${params.toString()}`);
  };

  const handleCheckIn = (val: string) => {
    setCheckIn(val);
    setDateError("");
    if (!checkOut || checkOut <= val) {
      const next = new Date(val);
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  };

  const handleCheckOut = (val: string) => {
    setDateError("");
    if (checkIn && val <= checkIn) { setDateError("Check-out must be after check-in"); return; }
    setCheckOut(val);
  };

  const pickDestination = (city: string) => {
    setDestination(city);
    setFocused(false);
  };

  const px = isMobile ? "16px" : "40px";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: "#0a0a0f", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}`, height: 62, borderBottom: "1px solid #f0f0f5", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        {!isMobile ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13 }}>
              <a href="/#how" style={{ color: "#6b7280", textDecoration: "none" }}>How it works</a>
              <a href="/search-hotels" style={{ color: "#1447b8", fontWeight: 600, textDecoration: "none" }}>Search hotels</a>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ fontSize: 13, color: "#374151", background: "none", border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
              <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#fff", background: "#1447b8", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                Check my booking →
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => router.push("/")} style={{ fontSize: 12, color: "#fff", background: "#1447b8", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
            Upload voucher
          </button>
        )}
      </nav>

      {/* Hero */}
      <section style={{ background: "#1447b8", padding: isMobile ? "32px 16px 40px" : "56px 40px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 32 : 44, fontWeight: 700, color: "#fff", letterSpacing: "-1.5px", marginBottom: 8, lineHeight: 1.1 }}>
            Where are you <span style={{ color: "#FCD34D" }}>headed?</span>
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
            Live rates from global suppliers — no markup, no middleman.
          </p>

          {/* Search form — stacked on mobile, horizontal on desktop */}
          <form onSubmit={handleSearch}>
            {isMobile ? (
              /* Mobile: stacked card */
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", textAlign: "left" }}>
                {/* Destination */}
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Destination</div>
                  <input type="text" placeholder="City or hotel name" value={destination}
                    onChange={e => { setDestination(e.target.value); setFocused(true); }}
                    onFocus={() => { if (destination) setFocused(true); }}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    style={{ width: "100%", fontSize: 15, color: "#111827", background: "#f9fafb", border: "1px solid #eaeef2", borderRadius: 10, padding: "10px 14px", outline: "none", fontFamily: "inherit" }} />
                  {focused && destination.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden", marginTop: 4 }}>
                      {DESTINATIONS.filter(d => d.city.toLowerCase().includes(destination.toLowerCase())).map((d, i) => (
                        <button key={i} onMouseDown={() => pickDestination(d.city)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                          <img src={d.photo} alt={d.city} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.city}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Dates row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-in</div>
                    <input type="date" value={checkIn} min={today} onChange={e => handleCheckIn(e.target.value)}
                      style={{ width: "100%", fontSize: 13, color: checkIn ? "#111827" : "#9ca3af", background: "#f9fafb", border: "1px solid #eaeef2", borderRadius: 10, padding: "10px 12px", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-out</div>
                    <input type="date" value={checkOut} min={checkIn || today} onChange={e => handleCheckOut(e.target.value)}
                      style={{ width: "100%", fontSize: 13, color: checkOut ? "#111827" : "#9ca3af", background: "#f9fafb", border: "1px solid #eaeef2", borderRadius: 10, padding: "10px 12px", outline: "none", fontFamily: "inherit" }} />
                  </div>
                </div>
                {/* Guests */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Guests</div>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    style={{ width: "100%", fontSize: 14, color: "#111827", background: "#f9fafb", border: "1px solid #eaeef2", borderRadius: 10, padding: "10px 12px", outline: "none", fontFamily: "inherit" }}>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Search hotels
                </button>
              </div>
            ) : (
              /* Desktop: horizontal bar */
              <div style={{ background: "#fff", borderRadius: 14, overflow: "visible", display: "flex", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", position: "relative" }}>
                <div style={{ flex: 2, position: "relative" }}>
                  <div style={{ padding: "14px 20px", borderRight: "1px solid #f0f0f5" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Destination</div>
                    <input type="text" placeholder="City or hotel name" value={destination}
                      onChange={e => { setDestination(e.target.value); setFocused(true); }}
                      onFocus={() => { if (destination) setFocused(true); }}
                      onBlur={() => setTimeout(() => setFocused(false), 200)}
                      style={{ fontSize: 15, color: "#111827", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500 }} />
                  </div>
                  {focused && destination.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0 0 12px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af" }}>Popular destinations</div>
                      {DESTINATIONS.filter(d => d.city.toLowerCase().includes(destination.toLowerCase())).map((d, i) => (
                        <button key={i} onMouseDown={() => pickDestination(d.city)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                          <img src={d.photo} alt={d.city} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.city}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, padding: "14px 20px", borderRight: "1px solid #f0f0f5", cursor: "pointer" }} onClick={e => { const inp = (e.currentTarget as HTMLDivElement).querySelector("input"); inp?.showPicker?.(); }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-in</div>
                  <input type="date" value={checkIn} min={today} onChange={e => handleCheckIn(e.target.value)} required
                    style={{ fontSize: 14, color: checkIn ? "#111827" : "#9ca3af", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500, cursor: "pointer" }} />
                </div>
                <div style={{ flex: 1, padding: "14px 20px", borderRight: "1px solid #f0f0f5", cursor: "pointer" }} onClick={e => { const inp = (e.currentTarget as HTMLDivElement).querySelector("input"); inp?.showPicker?.(); }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-out</div>
                  <input type="date" value={checkOut} min={checkIn || today} onChange={e => handleCheckOut(e.target.value)} required
                    style={{ fontSize: 14, color: checkOut ? "#111827" : "#9ca3af", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500, cursor: "pointer" }} />
                </div>
                <div style={{ padding: "14px 20px", borderRight: "1px solid #f0f0f5", minWidth: 110 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Guests</div>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                    style={{ fontSize: 14, color: "#111827", background: "none", border: "none", outline: "none", fontFamily: "inherit", fontWeight: 500, cursor: "pointer", width: "100%" }}>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ background: "#1447b8", color: "#fff", border: "none", padding: "0 32px", fontSize: 15, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", borderRadius: "0 14px 14px 0", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Search
                </button>
              </div>
            )}

            {dateError && (
              <div style={{ marginTop: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#fca5a5", display: "inline-block" }}>
                ⚠ {dateError}
              </div>
            )}
          </form>

          {/* Destination chips */}
          <div style={{ display: "flex", justifyContent: isMobile ? "flex-start" : "center", gap: 8, marginTop: 16, overflowX: isMobile ? "auto" : "visible", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 4 : 0 }}>
            {DESTINATIONS.map((d, i) => (
              <button key={i} onClick={() => setDestination(d.city)}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", padding: "6px 14px", borderRadius: 100, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                {d.flag} {d.city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section style={{ padding: isMobile ? "32px 16px" : "56px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Popular with Indians</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, letterSpacing: "-1px", marginBottom: 20 }}>Top destinations right now</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
            {DESTINATIONS.map((d, i) => (
              <button key={i} onClick={() => { setDestination(d.city); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ position: "relative", height: isMobile ? 130 : 180, borderRadius: 14, overflow: "hidden", cursor: "pointer", border: "none", padding: 0 }}>
                <img src={d.photo} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "2px 8px", fontSize: 14 }}>{d.flag}</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)", padding: "12px 12px 10px" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, color: "#fff" }}>{d.city}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending hotels */}
      <section style={{ padding: isMobile ? "0 16px 40px" : "0 40px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Trending now</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, letterSpacing: "-1px", marginBottom: 20 }}>Hotels travelers love</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {TRENDING.map((t, i) => (
              <div key={i} style={{ border: "1.5px solid #f0f0f5", borderRadius: 16, overflow: "hidden", cursor: "pointer" }}
                onClick={() => { setDestination(t.city.split(",")[0]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div style={{ height: isMobile ? 160 : 200, position: "relative", overflow: "hidden" }}>
                  <img src={t.photo} alt={t.hotel} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#1447b8", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: 20 }}>{t.tag}</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{t.hotel}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{t.city}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827" }}>from {t.price}</div>
                    <button style={{ background: "#1447b8", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>View →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upsell */}
      <section style={{ background: "#f7f9fc", borderTop: "1px solid #eaeef2", padding: isMobile ? "32px 16px" : "48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", alignItems: "center", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 8 }}>Already booked elsewhere?</div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 8 }}>Don&apos;t overpay. Let our AI watch the price.</div>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>Upload your booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops.</p>
          </div>
          <button onClick={() => router.push("/")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", whiteSpace: "nowrap", width: isMobile ? "100%" : "auto", marginTop: isMobile ? 16 : 0 }}>
            Upload my voucher →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f0f0f5", padding: isMobile ? "16px" : "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
          {["About", "Privacy", "Terms"].map(l => <a key={l} href="#" style={{ color: "inherit", textDecoration: "none" }}>{l}</a>)}
        </div>
        <div style={{ fontSize: 11, color: "#d1d5db" }}>© 2026 rebuq</div>
      </footer>

    </div>
  );
}
