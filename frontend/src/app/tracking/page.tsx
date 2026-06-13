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

  // Live deal state
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveRoomName, setLiveRoomName] = useState<string | null>(null);
  const [liveHotelImg, setLiveHotelImg] = useState<string | null>(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState(false);

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

  // Fetch live price for the uploaded hotel once booking is loaded
  useEffect(() => {
    if (!booking || !liteapiHotelId || !booking.check_in || !booking.check_out) return;
    setLivePriceLoading(true);
    setLivePriceError(false);

    const url = `${BACKEND}/api/hotels/search?hotelId=${encodeURIComponent(liteapiHotelId)}&checkIn=${booking.check_in}&checkOut=${booking.check_out}&adults=${booking.num_adults || 2}&children=${booking.num_children || 0}&rooms=${booking.num_rooms || 1}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const hotels = data?.hotels?.hotels || [];
        if (hotels.length > 0) {
          const h = hotels[0];
          setLivePrice(h.lowestPriceINR || h.minRate || null);
          setLiveRoomName(h.roomTypes?.[0]?.rates?.[0]?.name || null);
          setLiveHotelImg(h.imageUrl || null);
        } else {
          setLivePriceError(true);
        }
      })
      .catch(() => setLivePriceError(true))
      .finally(() => setLivePriceLoading(false));
  }, [booking, liteapiHotelId]);

  if (!booking) return null;

  const numNights = booking.check_in && booking.check_out
    ? Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000))
    : 0;
  const totalPaid = booking.total_price_paid || booking.original_price || 0;
  const newPriceExample = Math.round(totalPaid * 0.82);
  const savingExample = Math.round(totalPaid * 0.18);
  const city = booking.hotel_city || "your city";

  // Live deal savings calc
  const liveSaving = livePrice && totalPaid ? Math.max(0, totalPaid - livePrice) : null;
  const liveSavingPct = liveSaving && totalPaid ? Math.round((liveSaving / totalPaid) * 100) : null;

  const fmtDate = (d: string) => {
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const IcoMsg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const IcoCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const IcoCoin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a3 3 0 0 1 5 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const IcoClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

  const whatNext = [
    { icon: <IcoSearch />, title: "Scanning every 6 hours", text: "Same hotel, same room, same meal plan — like-for-like comparison, no tricks." },
    { icon: <IcoMsg />, title: "Instant WhatsApp alert", text: "The moment a lower price is found, you get a direct message with a rebooking link." },
    { icon: <IcoCheck />, title: "You rebook in 2 minutes", text: "Cancel your original booking, tap our link, select your room and confirm. Done." },
    { icon: <IcoCoin />, title: "You keep every rupee saved", text: "Free to use. We only earn when you save." },
  ];

  // Hotel detail page link with dates pre-filled
  const hotelDetailUrl = liteapiHotelId
    ? `/hotel/${liteapiHotelId}?checkIn=${booking.check_in}&checkOut=${booking.check_out}&adults=${booking.num_adults || 2}&children=${booking.num_children || 0}&rooms=${booking.num_rooms || 1}`
    : `/search-hotels`;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: NAVY }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; } @keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      {/* NAV + HERO wrapper */}
      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)" }}>
        <nav style={{ background: "transparent", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 32px", position: "sticky", top: 0, zIndex: 300 }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none" }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <a href="/search-hotels" style={{ fontSize: 14, color: "#FCD34D", textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name.split(" ")[0]}</span>
                </div>
              ) : (
                <button onClick={() => router.push("/signin")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
              )}
            </div>
          )}
        </nav>

        {/* HERO */}
        <div style={{ padding: isMobile ? "40px 20px" : "64px 40px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(252,211,77,0.2)", border: "1px solid rgba(252,211,77,0.4)", padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, color: "#FCD34D", marginBottom: 28, letterSpacing: "0.04em" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FCD34D", display: "inline-block", animation: "pulse 2s infinite" }} />
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
                  <div style={{ background: "rgba(252,211,77,0.12)", border: "1.5px solid rgba(252,211,77,0.35)", borderRadius: 12, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <IcoClock />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", marginBottom: 2 }}>Free cancellation deadline</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Cancel for free until <strong style={{ color: "#fff" }}>{fmtDate(booking.cancellation_deadline)}</strong> — we&apos;ll alert you well before then if we find a drop.</div>
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
                <div style={{ background: "#0f172a", borderRadius: "12px 12px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, margin: "-20px -20px 16px" }}>
                  <div style={{ width: 36, height: 36, background: B, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>r.</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>rebuq.</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Business Account · online</div>
                  </div>
                </div>
                <div style={{ textAlign: "center" as const, color: "#94a3b8", fontSize: 11, marginBottom: 12 }}>Today · just now</div>
                <div style={{ background: "#f0f0f0", borderRadius: "0 14px 14px 14px", padding: "14px 16px", color: "#1e293b", lineHeight: 1.75, fontSize: 13, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <strong>Price Drop Alert — rebuq</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    <strong style={{ color: NAVY }}>{booking.hotel_name}</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
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
                <div style={{ background: "#FCD34D", border: "none", borderRadius: "14px 14px 2px 14px", padding: "11px 16px", fontSize: 13, fontWeight: 700, color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  YES — rebook now
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8", textAlign: "center" as const }}>This is a preview — you&apos;ll get the real alert on WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING SUMMARY + WHAT'S NEXT */}
      <div style={{ background: "#f8fafc", padding: isMobile ? "32px 20px" : "48px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 48 }}>
          {/* Booking summary */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Booking summary</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { l: "Hotel", v: booking.hotel_name },
                { l: "City", v: booking.hotel_city },
                { l: "Check-in", v: booking.check_in ? fmtDate(booking.check_in) : "—" },
                { l: "Check-out", v: booking.check_out ? fmtDate(booking.check_out) : "—" },
                { l: "Duration", v: numNights ? `${numNights} nights` : "—" },
                { l: "Room", v: booking.room_type || "—" },
                { l: "Meals", v: booking.board_basis_label || "—" },
                { l: "Total paid", v: totalPaid ? `₹${totalPaid.toLocaleString("en-IN")}` : "—" },
                { l: "Booked on", v: booking.ota_name || "—" },
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
              <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>What happens next</div>
            </div>
            {whatNext.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 20 : 0 }}>
                <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE MEMBER DEAL — for the actual uploaded hotel */}
        <div style={{ maxWidth: 1000, margin: "0 auto", marginBottom: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 6 }}>Members only · exclusive rate</div>
            <div className="sora" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: NAVY }}>Current member deal — {booking.hotel_name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Live rate for your same dates. Members get pre-negotiated pricing.</div>
          </div>

          {/* Live price card */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", minHeight: 200 }}>
              {/* Hotel image */}
              <div style={{ background: "#e2e8f0", position: "relative" as const, minHeight: 200, overflow: "hidden" }}>
                {liveHotelImg ? (
                  <img src={liveHotelImg} alt={booking.hotel_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0 }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1447b8 0%, #1e3a5f 100%)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", opacity: 0.4 }}>r.</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{booking.hotel_name}</div>
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute" as const, top: 12, left: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff" }}>Member rate</div>
              </div>

              {/* Price details */}
              <div style={{ padding: 28, display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{booking.hotel_name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{booking.hotel_city} · {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)} · {numNights} nights</div>

                  {livePriceLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                      <div style={{ width: 20, height: 20, border: "2px solid #e2e8f0", borderTop: `2px solid ${B}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#64748b" }}>Fetching live member rate…</span>
                    </div>
                  )}

                  {!livePriceLoading && livePrice && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Your member rate</div>
                          <div style={{ fontSize: 32, fontWeight: 800, color: B, fontFamily: "'Sora',sans-serif" }}>₹{livePrice.toLocaleString("en-IN")}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>total for {numNights} nights · taxes included</div>
                        </div>
                        {liveSaving && liveSaving > 0 && (
                          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", textAlign: "center" as const }}>
                            <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 2 }}>YOU SAVE</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>₹{liveSaving.toLocaleString("en-IN")}</div>
                            {liveSavingPct && <div style={{ fontSize: 11, color: "#16a34a" }}>{liveSavingPct}% off</div>}
                          </div>
                        )}
                      </div>
                      {totalPaid > 0 && (
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          You paid: <span style={{ textDecoration: "line-through" }}>₹{totalPaid.toLocaleString("en-IN")}</span>
                          {liveSaving && liveSaving <= 0 && <span style={{ color: "#16a34a", marginLeft: 8 }}>✓ You got a great rate!</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {!livePriceLoading && (livePriceError || !livePrice) && !livePriceLoading && (
                    <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        {liteapiHotelId
                          ? "Live rate not available for these dates. Check the hotel page for availability."
                          : "Enter your dates on the hotel page to see live member rates."}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push(hotelDetailUrl)}
                  style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, width: "fit-content" }}
                >
                  View hotel & book →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1447b8 100%)", borderRadius: 16, padding: isMobile ? "28px 20px" : "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>rebuq member deals</div>
              <div className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Explore more hotels in {city}.</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 420 }}>Browse exclusive member rates across 50,000+ hotels. Book flexible, upload to rebuq, and we&apos;ll watch for drops from day one.</div>
            </div>
            <button onClick={() => router.push("/search-hotels")} style={{ background: "#FCD34D", color: NAVY, border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
              Browse all member deals →
            </button>
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
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, color: "#64748b" }}>Loading...</div></div>}>
      <TrackingContent />
    </Suspense>
  );
}
