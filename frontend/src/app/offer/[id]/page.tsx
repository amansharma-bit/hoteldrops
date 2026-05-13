"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

const CITY_PHOTOS: Record<string, string[]> = {
  dubai: ["photo-1582719508461-905c673771fd", "photo-1518684079-3c830dcef090", "photo-1547458718-b47a2b38e09a"],
  bangkok: ["photo-1508009603885-50cf7c579365", "photo-1563492065599-3520f775eeed", "photo-1555217851-6141535bd771"],
  bali: ["photo-1537996194471-e657df975ab4", "photo-1573790387438-4da905039392", "photo-1555400038-63f5ba517a47"],
  maldives: ["photo-1514282401047-d79a71a590e8", "photo-1573843981267-be1999ff37cd", "photo-1540202404-1b927e27fa8b"],
  singapore: ["photo-1525625293386-3f8f99389edd", "photo-1506965257827-39bbd0af3e8f", "photo-1508964942454-1a56651d54ac"],
  london: ["photo-1513635269975-59663e0ac1ad", "photo-1526129318478-62ed807ebdf9", "photo-1488747279002-2e4c0f68a4ac"],
  paris: ["photo-1499856871958-5b9627545d1a", "photo-1502602898657-3e91760cbb34", "photo-1543349689-9a4d426bee8e"],
  tokyo: ["photo-1540959733332-eab4deabeeaf", "photo-1536098561742-ca998e48cbcc", "photo-1490806843957-31f4c9a91c65"],
};

const NEARBY_HOTELS: Record<string, { name: string; area: string; stars: number; price: string; photo: string }[]> = {
  dubai: [
    { name: "Atlantis The Palm", area: "Palm Jumeirah", stars: 5, price: "₹28,400/night", photo: "photo-1582719508461-905c673771fd" },
    { name: "Address Downtown", area: "Downtown Dubai", stars: 5, price: "₹18,200/night", photo: "photo-1518684079-3c830dcef090" },
    { name: "JW Marriott Marina", area: "Dubai Marina", stars: 5, price: "₹14,800/night", photo: "photo-1547458718-b47a2b38e09a" },
  ],
  bangkok: [
    { name: "Capella Bangkok", area: "Chao Phraya", stars: 5, price: "₹18,200/night", photo: "photo-1563492065599-3520f775eeed" },
    { name: "Mandarin Oriental", area: "Riverside", stars: 5, price: "₹22,400/night", photo: "photo-1508009603885-50cf7c579365" },
    { name: "The Peninsula", area: "Silom", stars: 5, price: "₹16,800/night", photo: "photo-1555217851-6141535bd771" },
  ],
  bali: [
    { name: "Four Seasons Jimbaran", area: "Jimbaran Bay", stars: 5, price: "₹24,000/night", photo: "photo-1537996194471-e657df975ab4" },
    { name: "COMO Uma Canggu", area: "Canggu", stars: 5, price: "₹16,400/night", photo: "photo-1573790387438-4da905039392" },
    { name: "Alila Seminyak", area: "Seminyak", stars: 5, price: "₹14,200/night", photo: "photo-1555400038-63f5ba517a47" },
  ],
};

const PROOF: Record<string, { initials: string; name: string; city: string; hotel: string; saving: string; time: string }[]> = {
  dubai: [
    { initials: "RS", name: "Rahul S.", city: "Mumbai", hotel: "Atlantis The Palm", saving: "₹31,600", time: "2 hours ago" },
    { initials: "PK", name: "Priya K.", city: "Delhi", hotel: "Address Downtown", saving: "₹18,400", time: "5 hours ago" },
    { initials: "AM", name: "Arun M.", city: "Bangalore", hotel: "JW Marriott Marina", saving: "₹24,200", time: "Yesterday" },
  ],
  bangkok: [
    { initials: "VS", name: "Vikram S.", city: "Mumbai", hotel: "Capella Bangkok", saving: "₹22,800", time: "3 hours ago" },
    { initials: "ND", name: "Neha D.", city: "Pune", hotel: "Mandarin Oriental", saving: "₹16,400", time: "6 hours ago" },
    { initials: "RG", name: "Rohit G.", city: "Delhi", hotel: "The Peninsula", saving: "₹19,200", time: "Yesterday" },
  ],
};

// Mock offer data — in production this comes from Supabase via offer ID
const MOCK_OFFER = {
  customerName: "Rahul",
  hotelName: "Taj Jumeirah Lakes Towers",
  city: "Dubai",
  area: "JLT",
  stars: 4,
  checkIn: "2026-12-14",
  checkOut: "2026-12-18",
  nights: 4,
  adults: 2,
  originalPrice: 112000,
  offerPrice: 89600,
  saving: 22400,
  savingPct: 20,
  expiresIn: 23 * 3600 + 47 * 60 + 12,
};

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function OfferPage() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [confirmed, setConfirmed] = useState(false);
  const [seconds, setSeconds] = useState(MOCK_OFFER.expiresIn);
  const offer = MOCK_OFFER;

  const city = offer.city.toLowerCase();
  const cityPhotos = CITY_PHOTOS[city] || CITY_PHOTOS["dubai"];
  const nearbyHotels = NEARBY_HOTELS[city] || NEARBY_HOTELS["dubai"];
  const proofItems = PROOF[city] || PROOF["dubai"];

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const timerDisplay = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" };
  const eyebrow: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#9ca3af", marginBottom: 8 };
  const cardTitle: React.CSSProperties = { fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 14, letterSpacing: "-0.3px" };

  if (confirmed) {
    return (
      <div style={{ background: "#1447b8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 8 }}>Rebooking confirmed!</div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28, maxWidth: 400 }}>
          We&apos;ve secured your room at {formatINR(offer.offerPrice)}. Please cancel your original booking to pocket the savings.
        </p>
        <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "20px 40px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>You saved</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 56, fontWeight: 700, color: "#FCD34D", lineHeight: 1 }}>{formatINR(offer.saving)}</div>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
          Confirmation sent to your WhatsApp · Booking ref: RBQ-{new Date().getFullYear()}-{Math.floor(Math.random() * 9000 + 1000)}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "#25D366", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer" }}>
            📱 Share on WhatsApp
          </button>
          <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ← Back to rebuq
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9", minHeight: "100vh", color: "#0a0a0f" }}>

      {/* Nav */}
      <nav style={{ background: "#1447b8", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
          rebuq<span style={{ color: "#FCD34D" }}>.</span>
        </a>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>🔒 Secure rebooking</div>
      </nav>

      {/* Hero */}
      <div style={{ background: "#1447b8", padding: isMobile ? "32px 16px 48px" : "48px 32px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "5px 14px", borderRadius: 100, fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Price drop detected — offer expires in <strong style={{ marginLeft: 4 }}>{timerDisplay()}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 32 : 40, fontWeight: 700, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: 12 }}>
                Great news,<br />{offer.customerName}! Save<br /><span style={{ color: "#FCD34D" }}>{formatINR(offer.saving)}</span>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 20 }}>
                We found a lower price on your {offer.hotelName} booking. Same room, same dates — just a better deal.
              </p>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { num: `${offer.savingPct}%`, lbl: "Price drop" },
                  { num: String(offer.nights), lbl: "Nights" },
                  { num: "Free", lbl: "Cancellation" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{s.num}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && <div style={{ background: "#fff", borderRadius: 20, padding: 24, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#9ca3af", marginBottom: 6 }}>You save</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 52, fontWeight: 700, color: "#16a34a", lineHeight: 1, marginBottom: 4 }}>{formatINR(offer.saving)}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>on your {offer.city} booking</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#d1d5db", textDecoration: "line-through" }}>{formatINR(offer.originalPrice)}</span>
                <span style={{ color: "#9ca3af", fontSize: 16 }}>→</span>
                <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>{formatINR(offer.offerPrice)}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20 }}>
                ⏰ Expires in {timerDisplay()}
              </div>
            </div>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: isMobile ? "0 auto" : "-40px auto 0", padding: isMobile ? "0 16px 40px" : "0 20px 60px", position: "relative", zIndex: 1 }}>

        {/* Hotel info */}
        <div style={card}>
          <div style={eyebrow}>Your booking</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{offer.hotelName}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {offer.area}, {offer.city} · {offer.stars} Stars
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "Check-in", value: offer.checkIn },
              { label: "Check-out", value: offer.checkOut },
              { label: "Nights", value: String(offer.nights) },
              { label: "Guests", value: `${offer.adults} adults` },
            ].map((d, i) => (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div style={card}>
          <div style={cardTitle}>Price breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#dc2626", marginBottom: 6 }}>You paid</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#dc2626", textDecoration: "line-through", opacity: 0.7 }}>{formatINR(offer.originalPrice)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{offer.nights} nights total</div>
            </div>
            <div style={{ fontSize: 22, color: "#9ca3af", textAlign: "center" }}>→</div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#16a34a", marginBottom: 6 }}>New price</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#16a34a" }}>{formatINR(offer.offerPrice)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{offer.nights} nights total</div>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#0d1b2e,#1447b8)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Total saving</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#FCD34D" }}>{formatINR(offer.saving)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{offer.savingPct}% less than what you paid</div>
            </div>
            <div style={{ fontSize: 36 }}>💰</div>
          </div>
        </div>

        {/* CTA */}
        <div style={card}>
          <div style={cardTitle}>Confirm rebooking</div>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 18 }}>
            We&apos;ll secure your new booking at {formatINR(offer.offerPrice)} and send you the confirmation on WhatsApp. Then cancel your original booking to pocket the {formatINR(offer.saving)} difference.
          </p>
          <button onClick={() => setConfirmed(true)} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✅ Yes — rebook and save {formatINR(offer.saving)} →
          </button>
          <button style={{ width: "100%", background: "none", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
            No thanks, keep my current booking
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#9ca3af" }}>
            <span>🔒</span>
            <span>Free cancellation confirmed · Same room type · Same dates · No hidden fees</span>
          </div>
        </div>

        {/* What happens next */}
        <div style={card}>
          <div style={cardTitle}>What happens next</div>
          {[
            { n: 1, title: "You confirm", desc: "Click the button above to approve the rebooking" },
            { n: 2, title: "We rebook", desc: `We secure your room at ${formatINR(offer.offerPrice)} and send you a new confirmation on WhatsApp` },
            { n: 3, title: "You cancel", desc: "Cancel your original booking (it's free). The refund goes back to your original payment method." },
            { n: 4, title: `You keep ${formatINR(offer.saving)}`, desc: "The difference is yours. We earn a small commission only when we save you money." },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1447b8", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                <strong style={{ color: "#111827" }}>{s.title}</strong> — {s.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Other deals */}
        <div style={card}>
          <div style={eyebrow}>While you&apos;re here</div>
          <div style={cardTitle}>Other great deals in {offer.city} 🇦🇪</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {nearbyHotels.map((h, i) => (
              <div key={i} style={{ border: "1.5px solid #eaeef2", borderRadius: 14, overflow: "hidden", cursor: "pointer" }} onClick={() => router.push("/search-hotels")}>
                <img src={`https://images.unsplash.com/${h.photo}?w=300&h=120&q=80&auto=format&fit=crop`} alt={h.name} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>{h.area} · {h.stars}★</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>{h.price}</div>
                    <button onClick={e => { e.stopPropagation(); router.push("/upload"); }} style={{ background: "#eff6ff", color: "#1447b8", border: "1px solid #bfdbfe", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>🔔 Track</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div style={card}>
          <div style={eyebrow}>Recent wins in {offer.city}</div>
          <div style={cardTitle}>Indians saving on {offer.city} hotels</div>
          {proofItems.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0", borderBottom: i < 2 ? "1px solid #f4f6f9" : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1447b8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{p.initials}</div>
              <div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}><strong style={{ color: "#111827" }}>{p.name}</strong> from {p.city} saved on {p.hotel}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{p.time}</div>
                <div style={{ display: "inline-block", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginTop: 4 }}>Saved {p.saving}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
