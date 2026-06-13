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
const BACKEND = "https://hoteldrops-production-7e5a.up.railway.app";

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
  const [liteapiHotelId, setLiteapiHotelId] = useState<string | null>(null);

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
        const bk = parsed.extracted || parsed;
        setBooking(bk);
        setLiteapiHotelId(parsed.liteapi_hotel_id || null);
      } else {
        router.replace("/");
      }
    } catch { router.replace("/"); }
  }, []);

  if (!booking) return null;

  const numNights = booking.check_in && booking.check_out
    ? Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000))
    : 0;
  const totalPaid = booking.total_price_paid || booking.original_price || 0;
  const newPriceExample = Math.round(totalPaid * 0.82);
  const savingExample = Math.round(totalPaid * 0.18);

  const hotelDetailUrl = liteapiHotelId
    ? `/hotel/${liteapiHotelId}?checkIn=${booking.check_in}&checkOut=${booking.check_out}&adults=${booking.num_adults || 2}&children=${booking.num_children || 0}&rooms=${booking.num_rooms || 1}`
    : `/search-hotels`;

  const fmtDate = (d: string) => {
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const IcoClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: NAVY, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      {/* FULL PAGE GRADIENT WRAPPER — nav + hero in one block */}
      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)", minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>

        {/* NAV — solid bg so scroll doesn't bleed */}
        <nav style={{ background: "#1447b8", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", position: "sticky", top: 0, zIndex: 300, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", textDecoration: "none" }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <a href="/search-hotels" style={{ fontSize: 14, color: "#FCD34D", textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name.split(" ")[0]}</span>
                </div>
              ) : (
                <button onClick={() => router.push("/signin")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
              )}
            </div>
          )}
        </nav>

        {/* HERO — fills remaining height */}
        <div style={{ flex: 1, padding: isMobile ? "48px 20px 60px" : "80px 40px 80px", display: "flex", alignItems: "center" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 64, alignItems: "center" }}>

            {/* LEFT */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(252,211,77,0.2)", border: "1px solid rgba(252,211,77,0.4)", padding: "6px 16px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#FCD34D", marginBottom: 32, letterSpacing: "0.04em" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FCD34D", display: "inline-block", animation: "pulse 2s infinite" }} />
                PRICE TRACKER ACTIVATED
              </div>

              <h1 className="sora" style={{ fontSize: isMobile ? 40 : 56, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginBottom: 24 }}>
                We&apos;re on it.<br />
                <span style={{ color: "#FCD34D" }}>Watching 24/7</span><br />
                for a better deal.
              </h1>

              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 32, maxWidth: 460 }}>
                Every 6 hours, our AI scans live rates for <strong style={{ color: "#fff" }}>{booking.hotel_name}</strong> — same room, same meals, same dates. The moment we find a lower price, you&apos;ll get a WhatsApp instantly.
              </p>

              {booking.cancellation_deadline && (
                <div style={{ background: "rgba(252,211,77,0.12)", border: "1.5px solid rgba(252,211,77,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <IcoClock />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", marginBottom: 3 }}>Free cancellation deadline</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Cancel for free until <strong style={{ color: "#fff" }}>{fmtDate(booking.cancellation_deadline)}</strong> — we&apos;ll alert you well before then if we find a drop.</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                <button onClick={() => { sessionStorage.removeItem("rebuq_booking"); router.push("/"); }} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Track another booking
                </button>
                <button onClick={() => router.push(hotelDetailUrl)} style={{ background: "#FCD34D", color: "#0f172a", border: "none", padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Check member deals for {booking.hotel_name} →
                </button>
              </div>
            </div>

            {/* RIGHT — WhatsApp preview */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
              <div style={{ background: "#0f172a", borderRadius: "12px 12px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, margin: "-20px -20px 16px" }}>
                <div style={{ width: 36, height: 36, background: B, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>r.</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>rebuq.</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Business Account · online</div>
                </div>
              </div>
              <div style={{ textAlign: "center" as const, color: "#94a3b8", fontSize: 11, marginBottom: 12 }}>Today · just now</div>
              <div style={{ background: "#f0f0f0", borderRadius: "0 14px 14px 14px", padding: "14px 16px", color: "#1e293b", lineHeight: 1.75, fontSize: 13, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <strong>Price Drop Alert — rebuq</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <strong style={{ color: NAVY }}>{booking.hotel_name}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{booking.check_in} → {booking.check_out}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M2 4v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
                  <span>{booking.room_type || "Standard Room"}</span>
                </div>
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
                  <div style={{ color: "#64748b", textDecoration: "line-through", fontSize: 12 }}>You paid: ₹{totalPaid.toLocaleString("en-IN")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    <span>New price: <strong style={{ color: "#16a34a", fontSize: 15 }}>₹{newPriceExample.toLocaleString("en-IN")}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>You save: ₹{savingExample.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>Same room · same meals · like-for-like</div>
              </div>
              <div style={{ background: "#FCD34D", borderRadius: "14px 14px 2px 14px", padding: "11px 16px", fontSize: 13, fontWeight: 700, color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                YES — rebook now
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", textAlign: "center" as const }}>This is a preview — you&apos;ll get the real alert on WhatsApp</div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 28 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[
                { title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] },
                { title: "Company", links: ["About", "Privacy", "Terms"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#1447b8", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Loading...</div></div>}>
      <TrackingContent />
    </Suspense>
  );
}
