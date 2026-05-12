"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [focused, setFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !checkIn || !checkOut) return;
    const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests) });
    router.push(`/search?${params.toString()}`);
  };

  const pickDestination = (city: string) => {
    setDestination(city);
    setFocused(false);
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: "#0a0a0f", minHeight: "100vh" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 62, borderBottom: "1px solid #f0f0f5", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13 }}>
          <a href="/#how" style={{ color: "#6b7280", textDecoration: "none" }}>How it works</a>
          <a href="/search-hotels" style={{ color: "#1447b8", fontWeight: 600, textDecoration: "none" }}>Search hotels</a>
          <a href="#" style={{ color: "#1447b8", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            Join free
            <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1447b8", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>Limited time</span>
          </a>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ fontSize: 13, color: "#374151", background: "none", border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
          <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#fff", background: "#1447b8", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
            Check my booking →
          </button>
        </div>
      </nav>

      <section style={{ background: "#1447b8", padding: "56px 40px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 44, fontWeight: 700, color: "#fff", letterSpacing: "-1.5px", marginBottom: 8, lineHeight: 1.1 }}>
            Where are you <span style={{ color: "#FCD34D" }}>headed?</span>
          </div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>
            Live rates from global suppliers — no markup, no middleman.
          </p>
          <form onSubmit={handleSearch} style={{ background: "#fff", borderRadius: 14, overflow: "visible", display: "flex", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", position: "relative" }}>
            <div style={{ flex: 2, position: "relative" }}>
              <div style={{ padding: "14px 20px", borderRight: "1px solid #f0f0f5", cursor: "text" }} onClick={() => setFocused(true)}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Destination</div>
                <input type="text" placeholder="City or hotel name" value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  style={{ fontSize: 15, color: "#111827", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500 }}
                  autoFocus />
              </div>
              {focused && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0 0 12px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af" }}>Popular destinations</div>
                  {DESTINATIONS.filter(d => !destination || d.city.toLowerCase().includes(destination.toLowerCase())).map((d, i) => (
                    <button key={i} onMouseDown={() => pickDestination(d.city)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        <img src={d.photo} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.city}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: 1, padding: "14px 20px", borderRight: "1px solid #f0f0f5" }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-in</div>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required
                style={{ fontSize: 14, color: "#111827", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500 }} />
            </div>
            <div style={{ flex: 1, padding: "14px 20px", borderRight: "1px solid #f0f0f5" }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Check-out</div>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required
                style={{ fontSize: 14, color: "#111827", background: "none", border: "none", outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 500 }} />
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
          </form>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            {DESTINATIONS.map((d, i) => (
              <button key={i} onClick={() => setDestination(d.city)}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", padding: "6px 16px", borderRadius: 100, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {d.flag} {d.city}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Popular with Indians</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, letterSpacing: "-1px", marginBottom: 28 }}>Top destinations right now</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {DESTINATIONS.map((d, i) => (
              <button key={i} onClick={() => { setDestination(d.city); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ position: "relative", height: 180, borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "none", padding: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
                <img src={d.photo} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "3px 10px", fontSize: 16 }}>{d.flag}</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)", padding: "16px 14px 14px" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{d.city}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 40px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Trending now</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, letterSpacing: "-1px", marginBottom: 28 }}>Hotels travelers love right now</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {TRENDING.map((t, i) => (
              <div key={i} style={{ border: "1.5px solid #f0f0f5", borderRadius: 16, overflow: "hidden", cursor: "pointer" }}
                onClick={() => { setDestination(t.city.split(",")[0]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
                  <img src={t.photo} alt={t.hotel} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#1447b8", background: "rgba(255,255,255,0.95)", padding: "3px 10px", borderRadius: 20 }}>{t.tag}</span>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{t.hotel}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{t.city}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>from {t.price}</div>
                    <button style={{ background: "#1447b8", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>View →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#f7f9fc", borderTop: "1px solid #eaeef2", padding: "48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Already booked elsewhere?</div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 10 }}>Don&apos;t overpay. Let our AI watch the price.</div>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, maxWidth: 480 }}>Upload your existing booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops — before your cancellation deadline.</p>
          </div>
          <button onClick={() => router.push("/")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>
            Upload my voucher →
          </button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #f0f0f5", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#9ca3af" }}>
          {["About", "How it works", "Privacy", "Terms", "Contact"].map(l => <a key={l} href="#" style={{ color: "inherit", textDecoration: "none" }}>{l}</a>)}
        </div>
        <div style={{ fontSize: 11, color: "#d1d5db" }}>© 2026 rebuq · Price protection for smart travelers</div>
      </footer>

    </div>
  );
}
