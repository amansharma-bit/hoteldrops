"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


const B = "#1447b8";
const NAVY = "#0f172a";

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member" });
      }
    });
  }, []);

  const hotelName = searchParams.get("hotel") || "Damac Maison Dubai Mall Street";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";
  const price = parseInt(searchParams.get("price") || "14341");
  const bookingId = "RBQ-" + Math.floor(100000 + Math.random() * 900000);
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const taxes = Math.round(price * 0.32);
  const total = price * nights + taxes;
  const saving = Math.round(price * nights * 0.15);

  const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const formatDate = (d: string) => { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };

  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; size: string; duration: string; delay: string; round: boolean }[]>([]);

  useEffect(() => {
    const colors = [B, "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + "vw",
      color: colors[Math.floor(Math.random() * colors.length)],
      size: (Math.random() * 8 + 6) + "px",
      duration: (Math.random() * 2.5 + 2) + "s",
      delay: (Math.random() * 0.8) + "s",
      round: Math.random() > 0.5,
    }));
    setConfetti(pieces);
    const timer = setTimeout(() => setConfetti([]), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, WebkitFontSmoothing: "antialiased" as any }}>
      <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .action-btn { display: flex; align-items: center; gap: 7px; border: 1.5px solid #e2e8f0; background: #fff; color: ${NAVY}; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-family: inherit; transition: all .2s; text-decoration: none; }
        .action-btn:hover { border-color: ${B}; color: ${B}; background: #eff6ff; }
        @keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        .confetti-piece { position: fixed; top: -10px; animation: confetti-fall linear forwards; pointer-events: none; z-index: 9999; }
      `}</style>

      {confetti.map(c => (
        <div key={c.id} className="confetti-piece" style={{ left: c.left, background: c.color, width: c.size, height: c.size, borderRadius: c.round ? "50%" : "2px", animationDuration: c.duration, animationDelay: c.delay }} />
      ))}

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in / Sign up</button>
          )}
        </div>
      </nav>

      {/* PROGRESS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 6, color: NAVY, fontSize: 13.5, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>🏠 Back to home</button>
        <div style={{ display: "flex", alignItems: "center" }}>
          {[
            { n: "✓", label: "Select Hotel", done: true },
            { n: "✓", label: "Guest Details", done: true },
            { n: "✓", label: "Payment", done: true },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#16a34a", color: "#fff" }}>{s.n}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 60, height: 2, background: "#16a34a", margin: "0 8px" }} />}
            </div>
          ))}
        </div>
        <div style={{ width: 140 }} />
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <div>
          <div style={{ background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)", borderRadius: 12, padding: "28px 28px 28px 24px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" as const, boxShadow: "0 8px 32px rgba(22,163,74,0.25)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "2px solid rgba(255,255,255,0.35)" }}>✓</div>
            <div style={{ position: "relative" }}>
              <h2 className="sora" style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Booking Confirmed!</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 16 }}>Your reservation at <strong style={{ color: "#fff" }}>{hotelName}</strong> is confirmed. A confirmation has been sent to your email.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                {[`📋 Booking ID: ${bookingId}`, `🌙 ${nights} Night${nights > 1 ? "s" : ""} · ${adults} Guests`].map(tag => (
                  <span key={tag} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 100, height: 80, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&q=80&fit=crop" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{hotelName} <span style={{ color: "#f59e0b", fontSize: 14 }}>★★★★★</span></div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>📍 Downtown Dubai</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>9.1</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Exceptional</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>· 1,517 ratings</span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
              {[
                { icon: "📅", label: "CHECK-IN", val: formatDate(checkIn), sub: "2:00 PM" },
                { icon: "📅", label: "CHECK-OUT", val: formatDate(checkOut), sub: "12:00 PM" },
                { icon: "👤", label: "GUESTS", val: `1 Room, ${adults} Guests`, sub: `${nights} Night${nights > 1 ? "s" : ""}` },
              ].map((b, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4 }}>{b.icon} {b.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{b.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Room & Booking Details</div>
            {[
              { icon: "🛏", green: false, name: "Deluxe King Room", sub: "42 m² · 1 King Bed · Free WiFi" },
              { icon: "🛡", green: true, name: "Free Cancellation", sub: "Cancel anytime for a full refund" },
              { icon: "🕐", green: true, name: "Late Check-out Available", sub: "Request at reception based on availability" },
              { icon: "🍳", green: true, name: "Breakfast Included", sub: "International buffet for 2 guests" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none" }}>
                <div style={{ width: 36, height: 36, background: item.green ? "#dcfce7" : "#eff6ff", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: NAVY, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Primary Guest</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Booking made by</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#eff6ff", color: B, fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>A</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 2 }}>Mr. Aarav Sharma</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>aarav@example.com · +91 98765 43210</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginTop: 20 }}>
              {[["⬇ Download Voucher", () => {}], ["✉ Email Confirmation", () => {}], ["🖨 Print", () => window.print()], ["⬆ Share", () => {}]].map(([label, fn]) => (
                <button key={label as string} onClick={fn as () => void} className="action-btn">{label as string}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 18 }}>What happens next?</div>
            {[
              { n: "1", title: "Check your email", sub: "We've sent your booking voucher and hotel contact details to your email address." },
              { n: "2", title: "Show voucher at check-in", sub: "Print or keep the digital voucher handy — the hotel needs it at reception." },
              { n: "3", title: "Need help?", sub: "Contact our 24/7 support team at support@rebuq.com or via WhatsApp." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", borderBottom: i < 2 ? "1px solid #e2e8f0" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: B, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: B, borderRadius: 12, padding: "24px 28px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
            <div style={{ flex: 1 }}>
              <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Watch price drops on this booking 🔔</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>Your booking is confirmed — but prices can still drop. Let rebuq watch 24/7 and alert you if it gets cheaper.</p>
            </div>
            <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", padding: "11px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Track price now →</button>
          </div>
        </div>

        <div style={{ position: "sticky", top: 76, alignSelf: "flex-start" as const, display: "flex", flexDirection: "column" as const, gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Price Summary</div>
            {[
              { label: `Room price × ${nights} night${nights > 1 ? "s" : ""}`, val: formatINR(price * nights) },
              { label: "Breakfast Included", val: "FREE", green: true },
              { label: "Taxes & Service Fees", val: formatINR(taxes) },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, marginBottom: 10 }}>
                <span style={{ color: "#64748b" }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: (r as any).green ? "#16a34a" : NAVY }}>{r.val}</span>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Total Paid</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>incl. all taxes</div>
              </div>
              <div className="sora" style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{formatINR(total)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#16a34a", fontWeight: 600 }}>
              🌱 You saved <strong style={{ color: "#15803d" }}>&nbsp;{formatINR(saving)}&nbsp;</strong> with rebuq
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" as const }}>
            <div style={{ width: 50, height: 50, background: "#eff6ff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>✉</div>
            <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Need to make changes?</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>Free cancellation available. Manage your booking online.</div>
            <button onClick={() => router.push("/dashboard")} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: B, fontSize: 14, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>My Bookings ›</button>
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
              {[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
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

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <ConfirmedContent />
    </Suspense>
  );
}
