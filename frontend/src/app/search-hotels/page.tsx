"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const B = "#1447b8";
const YELLOW = "#FCD34D";
const NAVY = "#0f172a";

export default function SearchHotelsPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [destination, setDestination] = useState("");
  const [tickerIdx, setTickerIdx] = useState(0);

  const TICKER_ITEMS = [
    { name: "Priya S.", hotel: "Atlantis The Palm, Dubai", saved: "₹22,400", time: "4 min ago" },
    { name: "Vikram S.", hotel: "Burj Al Arab, Dubai", saved: "₹48,000", time: "11 min ago" },
  ];

  const ticker = TICKER_ITEMS[tickerIdx];

  useEffect(() => {
    setIsMobile(window.innerWidth < 900);
    const interval = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.97)", borderBottom: "1px solid #e2e8f0", padding: "0 20px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: NAVY }}>rebuq<span style={{ color: B }}>.</span></div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ padding: "10px 20px", background: B, color: "white", border: "none", borderRadius: 8, fontWeight: 600 }}>Check my booking</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg, #0c1f5c, #1e4fc2)", color: "white", textAlign: "center", padding: "100px 20px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "8px 20px", borderRadius: 50, marginBottom: 24 }}>
            ✨ EXCLUSIVE MEMBER DEALS
          </div>

          <h1 style={{ fontSize: isMobile ? 48 : 68, fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>
            Find your <span style={{ color: YELLOW }}>perfect stay</span>
          </h1>

          <p style={{ fontSize: 18, maxWidth: 520, margin: "0 auto 32px", opacity: 0.9 }}>
            500,000+ exclusive deals across the globe for members only.
          </p>

          {/* Ticker */}
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "14px 28px", borderRadius: 50, display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 50, maxWidth: "100%", overflow: "hidden" }}>
            <div style={{ width: 9, height: 9, background: "#4ade80", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap" }}>
              <strong>{ticker.name}</strong> saved on <strong>{ticker.hotel}</strong> — <span style={{ color: "#4ade80" }}>{ticker.saved}</span>
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ background: "white", borderRadius: 16, padding: 8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)", color: "#111", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <input
                type="text"
                placeholder="Enter city, area or property name"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ flex: 1, padding: "18px 24px", border: "none", fontSize: 17, borderRadius: 12, outline: "none" }}
              />
              <button 
                onClick={() => alert("Search functionality coming soon")}
                style={{ background: YELLOW, color: "#111", padding: "18px 40px", border: "none", borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Search Hotels
              </button>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: "80px 20px", textAlign: "center", background: "#f8fafc" }}>
        <h2 style={{ fontSize: 32 }}>Your website is now loading properly.</h2>
        <p style={{ marginTop: 16, fontSize: 18 }}>The random \u text issue has been fixed.</p>
      </div>
    </div>
  );
}
