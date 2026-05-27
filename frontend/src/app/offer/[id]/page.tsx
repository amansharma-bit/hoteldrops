"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const NEARBY_HOTELS: Record<string, { name: string; area: string; stars: number; price: string }[]> = {
  dubai: [
    { name: "Atlantis The Palm", area: "Palm Jumeirah", stars: 5, price: "₹28,400/night" },
    { name: "Address Downtown", area: "Downtown Dubai", stars: 5, price: "₹18,200/night" },
    { name: "JW Marriott Marina", area: "Dubai Marina", stars: 5, price: "₹14,800/night" },
  ],
  bangkok: [
    { name: "Capella Bangkok", area: "Chao Phraya", stars: 5, price: "₹18,200/night" },
    { name: "Mandarin Oriental", area: "Riverside", stars: 5, price: "₹22,400/night" },
    { name: "The Peninsula", area: "Silom", stars: 5, price: "₹16,800/night" },
  ],
  bali: [
    { name: "Four Seasons Jimbaran", area: "Jimbaran Bay", stars: 5, price: "₹24,000/night" },
    { name: "COMO Uma Canggu", area: "Canggu", stars: 5, price: "₹16,400/night" },
    { name: "Alila Seminyak", area: "Seminyak", stars: 5, price: "₹14,200/night" },
  ],
  default: [
    { name: "Grand Hyatt", area: "City Centre", stars: 5, price: "₹18,000/night" },
    { name: "Marriott", area: "Business District", stars: 5, price: "₹14,200/night" },
    { name: "Hilton", area: "Downtown", stars: 4, price: "₹11,000/night" },
  ],
};

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function OfferPage() {
  const params   = useParams();
  const router   = useRouter();
  const isMobile = useIsMobile();
  const offerId  = params?.id as string;

  const [offer, setOffer]       = useState<any>(null);
  const [booking, setBooking]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [seconds, setSeconds]   = useState(0);

  useEffect(() => {
    if (!offerId) return;
    loadOffer();
  }, [offerId]);

  async function loadOffer() {
    try {
      const { data: offerData, error: offerErr } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerErr || !offerData) { setError('Offer not found or expired.'); setLoading(false); return; }

      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', offerData.booking_id)
        .single();

      if (bookingErr || !bookingData) { setError('Booking not found.'); setLoading(false); return; }

      setOffer(offerData);
      setBooking(bookingData);

      // Calculate seconds until expiry
      const expiresAt = new Date(offerData.expires_at).getTime();
      const now = Date.now();
      setSeconds(Math.max(0, Math.floor((expiresAt - now) / 1000)));
    } catch (e) {
      setError('Something went wrong loading this offer.');
    }
    setLoading(false);
  }

  // Countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const timerDisplay = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 24, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" };
  const eyebrow: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.5px", color: "#9ca3af", marginBottom: 8 };
  const cardTitle: React.CSSProperties = { fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 14 };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#1447b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontSize: 16 }}>Loading your offer...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 40 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Offer not found</div>
      <div style={{ fontSize: 14, color: "#64748b" }}>{error}</div>
      <button onClick={() => router.push("/")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Back to home</button>
    </div>
  );

  if (!offer || !booking) return null;

  const city         = (booking.hotel_city || "Dubai").toLowerCase();
  const nearbyHotels = NEARBY_HOTELS[city] || NEARBY_HOTELS["default"];
  const nights       = booking.total_nights || 1;
  const savingPct    = Math.round((offer.customer_saving / offer.original_price) * 100);
  const firstName    = booking.email?.split("@")[0] || "there";

  if (confirmed) {
    return (
      <div style={{ background: "#1447b8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Rebooking confirmed!</div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28, maxWidth: 400 }}>
          We&apos;ve secured your room at {formatINR(offer.offer_price)}. Please cancel your original booking to pocket the savings.
        </p>
        <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "20px 40px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>You saved</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 56, fontWeight: 800, color: "#FCD34D", lineHeight: 1 }}>{formatINR(offer.customer_saving)}</div>
        </div>
        <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back to rebuq
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f4f6f9", minHeight: "100vh", color: "#0a0a0f" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; }`}</style>

      {/* Nav */}
      <nav style={{ background: "#1447b8", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
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
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: isMobile ? 32 : 40, fontWeight: 800, color: "#fff", lineHeight: 1.08, marginBottom: 12 }}>
                Great news,<br />{firstName}! Save<br /><span style={{ color: "#FCD34D" }}>{formatINR(offer.customer_saving)}</span>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 20 }}>
                We found a lower price on your {booking.hotel_name} booking. Same room, same dates — just a better deal.
              </p>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { num: `${savingPct}%`, lbl: "Price drop" },
                  { num: String(nights), lbl: "Nights" },
                  { num: "Free", lbl: "Cancellation" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{s.num}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && (
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "2px", color: "#9ca3af", marginBottom: 6 }}>You save</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 800, color: "#16a34a", lineHeight: 1, marginBottom: 4 }}>{formatINR(offer.customer_saving)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>on your {booking.hotel_city} booking</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: "#d1d5db", textDecoration: "line-through" }}>{formatINR(offer.original_price)}</span>
                  <span style={{ color: "#9ca3af", fontSize: 16 }}>→</span>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>{formatINR(offer.offer_price)}</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20 }}>
                  ⏰ Expires in {timerDisplay()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: isMobile ? "0 auto" : "-40px auto 0", padding: isMobile ? "0 16px 40px" : "0 20px 60px", position: "relative", zIndex: 1 }}>

        {/* Hotel info */}
        <div style={card}>
          <div style={eyebrow}>Your booking</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{booking.hotel_name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
            📍 {booking.hotel_city} · {booking.room_type || "Standard Room"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "Check-in",  value: formatDate(booking.check_in) },
              { label: "Check-out", value: formatDate(booking.check_out) },
              { label: "Nights",    value: String(nights) },
              { label: "Guests",    value: `${booking.num_adults || 2} adults` },
            ].map((d, i) => (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 3 }}>{d.label}</div>
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
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#dc2626", marginBottom: 6 }}>You paid</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: "#dc2626", textDecoration: "line-through", opacity: 0.7 }}>{formatINR(offer.original_price)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{nights} nights total</div>
            </div>
            <div style={{ fontSize: 22, color: "#9ca3af", textAlign: "center" }}>→</div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#16a34a", marginBottom: 6 }}>New price</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: "#16a34a" }}>{formatINR(offer.offer_price)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{nights} nights total</div>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#0f172a,#1447b8)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Total saving</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: "#FCD34D" }}>{formatINR(offer.customer_saving)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{savingPct}% less than what you paid</div>
            </div>
            <div style={{ fontSize: 36 }}>💰</div>
          </div>
        </div>

        {/* CTA */}
        <div style={card}>
          <div style={cardTitle}>Confirm rebooking</div>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 18 }}>
            We&apos;ll secure your new booking at {formatINR(offer.offer_price)} and send you the confirmation on WhatsApp. Then cancel your original booking to pocket the {formatINR(offer.customer_saving)} difference.
          </p>
          <button onClick={() => setConfirmed(true)} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, fontFamily: "'Sora', sans-serif", cursor: "pointer", marginBottom: 10 }}>
            ✅ Yes — rebook and save {formatINR(offer.customer_saving)} →
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
            { n: 2, title: "We rebook", desc: `We secure your room at ${formatINR(offer.offer_price)} and send you a new confirmation on WhatsApp` },
            { n: 3, title: "You cancel", desc: "Cancel your original booking (it's free). The refund goes back to your original payment method." },
            { n: 4, title: `You keep ${formatINR(offer.customer_saving)}`, desc: "The difference is yours." },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1447b8", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                <strong style={{ color: "#111827" }}>{s.title}</strong> — {s.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Nearby deals */}
        <div style={card}>
          <div style={eyebrow}>While you&apos;re here</div>
          <div style={cardTitle}>Other great deals in {booking.hotel_city}</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
            {nearbyHotels.map((h, i) => (
              <div key={i} style={{ border: "1.5px solid #eaeef2", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "#fff" }} onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(booking.hotel_city)}`)}>
                <div style={{ height: 80, background: `linear-gradient(135deg, #1447b8, #0f172a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏨</div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{h.area} · {h.stars}★</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{h.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
