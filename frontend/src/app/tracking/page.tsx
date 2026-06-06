"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768);
    c(); window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);
  return m;
}

function TrackingContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member" });
      }
    });
    try {
      const stored = sessionStorage.getItem("rebuq_booking");
      if (stored) {
        const parsed = JSON.parse(stored);
        setBooking(parsed.extracted || parsed);
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    }
  }, []);

  if (!booking) return null;

  const numNights = booking.check_in && booking.check_out
    ? Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000))
    : 0;
  const totalPaid = booking.total_price_paid || booking.original_price || 0;
  const savingExample = Math.round(totalPaid * 0.18);
  const newPriceExample = Math.round(totalPaid * 0.82);
  const hotel_city = booking.hotel_city || "your city";

  const cityDeals = [
    { name: `Top-rated hotel in ${hotel_city}`, stars: 5, saving: "22% below OTA", badge: "Member rate",  gradient: `${B}, #0f172a` },
    { name: `Luxury stay in ${hotel_city}`,     stars: 5, saving: "18% below OTA", badge: "Best value",   gradient: "#0f6e56, #064e3b" },
    { name: `Boutique hotel in ${hotel_city}`,  stars: 4, saving: "15% below OTA", badge: "Popular pick", gradient: "#7c3aed, #4c1d95" },
  ];

  const fmtDate = (d: string) => {
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: NAVY }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; }`}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
          </div>
        )}
      </nav>

      {/* HERO — blue background */}
      <div style={{ background: B, padding: isMobile ? "40px 20px" : "64px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 28, letterSpacing: "0.04em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            PRICE TRACKER ACTIVATED
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "center" }}>
            <div>
              <h1 className="sora" style={{ fontSize: isMobile ? 34 : 48, fontWeight: 800, color: "#fff", lineHeight: 1.08, marginBottom: 20 }}>
                We&apos;re on it.<br />
                <span style={{ color: "#FCD34D" }}>Watching 24/7</span><br />
                for a better deal.
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 28, maxWidth: 420 }}>
                Every 6 hours, our AI scans live rates for <strong style={{ color: "#fff" }}>{booking.hotel_name}</strong> — same room, same meals, same dates. The moment we find a lower price, you&apos;ll get a WhatsApp instantly.
              </p>

              {booking.cancellation_deadline && (
                <div style={{ background: "rgba(252,211,77,0.12)", border: "1.5px solid rgba(252,211,77,0.35)", borderRadius: 12, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", marginBottom: 2 }}>Free cancellation deadline</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Cancel for free until <strong style={{ color: "#fff" }}>{fmtDate(booking.cancellation_deadline)}</strong> — we&apos;ll alert you well before then if we find a drop.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                <button onClick={() => { sessionStorage.removeItem("rebuq_booking"); router.push("/"); }} style={{ background: "#fff", color: B, border: "none", padding: "13px 26px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>← Back to home</button>
                <button onClick={() => { sessionStorage.removeItem("rebuq_booking"); router.push("/"); }} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", padding: "13px 26px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Track another booking</button>
              </div>
            </div>

            {/* WhatsApp preview */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ background: "#075E54", borderRadius: "12px 12px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, margin: "-20px -20px 16px" }}>
                <div style={{ width: 36, height: 36, background: B, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>r.</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>rebuq.</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Business Account · online</div>
                </div>
              </div>
              <div style={{ textAlign: "center" as const, color: "#94a3b8", fontSize: 11, marginBottom: 12 }}>Today · just now</div>
              <div style={{ background: "#f0f0f0", borderRadius: "0 14px 14px 14px", padding: "14px 16px", color: "#1e293b", lineHeight: 1.75, fontSize: 13, marginBottom: 12 }}>
                💰 <strong>Price Drop Alert — rebuq</strong><br /><br />
                <strong style={{ color: NAVY }}>{booking.hotel_name}</strong><br />
                📅 {booking.check_in} → {booking.check_out}<br />
                🛏️ {booking.room_type || "Standard Room"}<br /><br />
                <span style={{ color: "#64748b", textDecoration: "line-through" }}>You paid: ₹{totalPaid.toLocaleString("en-IN")}</span><br />
                New price: <strong style={{ color: "#16a34a", fontSize: 15 }}>₹{newPriceExample.toLocaleString("en-IN")}</strong><br />
                💚 <strong>You save: ₹{savingExample.toLocaleString("en-IN")}</strong><br /><br />
                <em style={{ fontSize: 11, color: "#64748b" }}>Same room · same meals · like-for-like ✓</em>
              </div>
              <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: "14px 14px 2px 14px", padding: "11px 16px", fontSize: 13, fontWeight: 700, color: "#15803d", textAlign: "right" as const }}>YES — rebook now 👍</div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", textAlign: "center" as const }}>This is a preview — you&apos;ll get the real alert on WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING SUMMARY + WHAT HAPPENS NEXT */}
      <div style={{ background: "#f8fafc", padding: isMobile ? "32px 20px" : "48px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 48 }}>

          {/* Booking summary */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Booking summary</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { l: "Hotel",      v: booking.hotel_name },
                { l: "City",       v: booking.hotel_city },
                { l: "Check-in",   v: booking.check_in ? fmtDate(booking.check_in) : "—" },
                { l: "Check-out",  v: booking.check_out ? fmtDate(booking.check_out) : "—" },
                { l: "Duration",   v: numNights ? `${numNights} nights` : "—" },
                { l: "Room",       v: booking.room_type || "—" },
                { l: "Meals",      v: booking.board_basis_label || "—" },
                { l: "Total paid", v: totalPaid ? `₹${totalPaid.toLocaleString("en-IN")}` : "—" },
                { l: "Booked on",  v: booking.ota_name || "—" },
                ...(booking.booking_reference ? [{ l: "Ref no.", v: booking.booking_reference }] : []),
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 600 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>What happens next</div>
            </div>
            {[
              { icon: "search", title: "Scanning every 6 hours", text: "Same hotel, same room, same meal plan — like-for-like, no tricks." },
              { icon: "whatsapp", title: "Instant WhatsApp alert", text: "The moment a lower price is found, you get a direct message with a rebooking link." },
              { icon: "check", title: "You rebook in 2 minutes", text: "Cancel your original booking, tap our link, select your room and confirm. Done." },
              { icon: "rupee", title: "You keep every rupee saved", text: "We earn a small success fee only when we save you money. Zero cost otherwise." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 20 : 0 }}>
                <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon === "search" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                {item.icon === "whatsapp" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>}
                {item.icon === "check" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {item.icon === "rupee" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="3" x2="18" y2="3"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="12" y1="8" x2="6" y2="21"/><path d="M6 8a6 6 0 0 0 0 0h5a3 3 0 0 0 0-6H6"/></svg>}
              </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EXPLORE DEALS IN THIS CITY */}
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 6 }}>Members only · exclusive rates</div>
              <div className="sora" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: NAVY }}>
                While you&apos;re here — explore deals in {hotel_city}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Pre-negotiated member rates for your same dates — often 15–30% below any OTA.</div>
            </div>
            <button onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(hotel_city)}`)} style={{ background: B, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              See all {hotel_city} deals →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {cityDeals.map((deal, i) => (
              <div key={i} onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(hotel_city)}`)}
                style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ height: 140, background: `linear-gradient(135deg, ${deal.gradient})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <div style={{ position: "absolute" as const, top: 12, left: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff" }}>{deal.badge}</div>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", marginBottom: 6 }}>
                    {Array.from({ length: deal.stars }).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 12 }}>★</span>)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10, lineHeight: 1.4 }}>{deal.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "3px 10px", borderRadius: 20 }}>✓ {deal.saving}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{numNights} nights</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1447b8 100%)", borderRadius: 16, padding: isMobile ? "28px 20px" : "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>rebuq member deals</div>
              <div className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Plan your next trip smarter.</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 420 }}>
                Browse exclusive member rates across 50,000+ hotels. Book flexible, upload to rebuq, and we&apos;ll watch for drops from day one.
              </div>
            </div>
            <button onClick={() => router.push("/search-hotels")} style={{ background: "#FCD34D", color: NAVY, border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              Browse all member deals →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, color: "#64748b" }}>Loading...</div></div>}>
      <TrackingContent />
    </Suspense>
  );
}
