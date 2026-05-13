"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, TrendingDown, IndianRupee, Calendar, Moon, Clock, RefreshCw, Check, ArrowRight, Plus } from "lucide-react";

const SUPABASE_URL = "https://wifspvhmvaavgzkepjqz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3HpgXVmSAdGA7ZPypqCdQQ_D00QN0Nh";

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

interface Booking {
  id: string;
  hotel_name: string;
  hotel_city: string;
  check_in: string;
  check_out: string;
  original_price: number;
  status: string;
  last_checked_at: string;
  nights: number;
  room_type: string;
  created_at: string;
  offers?: { offer_price: number; customer_saving: number; status: string; id: string }[];
}

const STATUS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:    { label: "Setting up",   bg: "#fef3c7", color: "#d97706", icon: "⏳" },
  tracking:   { label: "Watching",     bg: "#dbeafe", color: "#1447b8", icon: "🔍" },
  drop_found: { label: "Drop Found!",  bg: "#dbeafe", color: "#1447b8", icon: "📉" },
  offer_sent: { label: "Offer Sent",   bg: "#dbeafe", color: "#1447b8", icon: "📱" },
  accepted:   { label: "Accepted",     bg: "#dbeafe", color: "#059669", icon: "✅" },
  rebooked:   { label: "Rebooked ✓",  bg: "#dbeafe", color: "#059669", icon: "🎉" },
  expired:    { label: "Expired",      bg: "#f4f6f9", color: "#9ca3af", icon: "⏰" },
  no_drop:    { label: "No drop yet",  bg: "#f4f6f9", color: "#9ca3af", icon: "📊" },
};

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

// Mock bookings for demo — shown when no real bookings exist
const DEMO_BOOKINGS: Booking[] = [
  {
    id: "demo-1", hotel_name: "Atlantis The Palm", hotel_city: "Dubai",
    check_in: "2026-12-14", check_out: "2026-12-18", original_price: 112000,
    status: "drop_found", last_checked_at: new Date(Date.now() - 3600000).toISOString(),
    nights: 4, room_type: "Deluxe Room", created_at: new Date().toISOString(),
    offers: [{ id: "offer-1", offer_price: 89600, customer_saving: 22400, status: "sent" }],
  },
  {
    id: "demo-2", hotel_name: "Park Hyatt Bangkok", hotel_city: "Bangkok",
    check_in: "2027-01-03", check_out: "2027-01-07", original_price: 158000,
    status: "tracking", last_checked_at: new Date(Date.now() - 7200000).toISOString(),
    nights: 4, room_type: "Park King Room", created_at: new Date().toISOString(),
  },
  {
    id: "demo-3", hotel_name: "W Bali Seminyak", hotel_city: "Bali",
    check_in: "2027-02-08", check_out: "2027-02-12", original_price: 91000,
    status: "rebooked", last_checked_at: new Date(Date.now() - 86400000).toISOString(),
    nights: 4, room_type: "Wonderful Room", created_at: new Date().toISOString(),
    offers: [{ id: "offer-3", offer_price: 72800, customer_saving: 18200, status: "completed" }],
  },
];

export default function Dashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "tracking" | "drops" | "completed">("all");
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/bookings?select=*,offers(id,offer_price,customer_saving,status)&order=created_at.desc`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBookings(data);
        } else {
          setBookings(DEMO_BOOKINGS);
          setIsDemo(true);
        }
      } catch {
        setBookings(DEMO_BOOKINGS);
        setIsDemo(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = bookings.filter(b => {
    if (tab === "tracking")  return ["tracking", "pending"].includes(b.status);
    if (tab === "drops")     return ["drop_found", "offer_sent"].includes(b.status);
    if (tab === "completed") return b.status === "rebooked";
    return true;
  });

  const totalSaved = bookings
    .filter(b => b.status === "rebooked")
    .reduce((sum, b) => sum + (b.offers?.[0]?.customer_saving || 0), 0);

  const activeTracking = bookings.filter(b => ["tracking", "pending"].includes(b.status)).length;
  const dropsFound = bookings.filter(b => ["drop_found", "offer_sent", "rebooked"].includes(b.status)).length;
  const hasAlert = bookings.some(b => ["drop_found", "offer_sent"].includes(b.status));

  const px = isMobile ? "16px" : "32px";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading your bookings…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f7f9fc", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: `0 ${px}`, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasAlert && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1447b8", boxShadow: "0 0 0 3px rgba(22,163,74,0.2)" }} />
          )}
          <button onClick={() => router.push("/upload")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 8, fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Track booking
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 32px" }}>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
            <span>👀</span>
            <span><strong>Demo mode</strong> — Upload a real voucher to start tracking your bookings.</span>
            <button onClick={() => router.push("/upload")} style={{ marginLeft: "auto", background: "#d97706", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Upload now →
            </button>
          </div>
        )}

        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
            My tracked bookings
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>We&apos;re monitoring your hotel prices 24/7. Sit back and relax.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Bookings tracked", value: bookings.length, icon: <Building2 size={18} />, color: "#1447b8", bg: "#eff6ff" },
            { label: "Actively watching", value: activeTracking, icon: <Eye size={18} />, color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Price drops found", value: dropsFound, icon: <TrendingDown size={18} />, color: "#1447b8", bg: "#eff6ff" },
            { label: "Total saved", value: formatINR(totalSaved), icon: <IndianRupee size={18} />, color: "#d97706", bg: "#fef3c7" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #eaeef2", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        {hasAlert && (
          <div style={{ background: "#1447b8", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TrendingDown size={20} color="#fff" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Price drop found on your booking!</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  {bookings.find(b => b.status === "drop_found")?.hotel_name} — Save {formatINR(bookings.find(b => b.status === "drop_found")?.offers?.[0]?.customer_saving || 0)}
                </div>
              </div>
            </div>
            <button onClick={() => router.push(`/offer/${bookings.find(b => b.status === "drop_found")?.offers?.[0]?.id || ""}`)}
              style={{ background: "#fff", color: "#1447b8", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              View offer →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#f0f0f5", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
          {([
            { key: "all", label: `All (${bookings.length})` },
            { key: "tracking", label: `Watching (${activeTracking})` },
            { key: "drops", label: `Drops (${dropsFound})` },
            { key: "completed", label: "Completed" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ background: tab === t.key ? "#fff" : "none", border: "none", padding: isMobile ? "7px 12px" : "8px 16px", borderRadius: 9, fontSize: isMobile ? 11 : 12, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "#111827" : "#6b7280", cursor: "pointer", fontFamily: "inherit", boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏨</div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>No bookings here yet</div>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Upload a hotel voucher to start tracking</p>
            <button onClick={() => router.push("/upload")} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Upload voucher →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(b => {
              const st = STATUS[b.status] || STATUS.tracking;
              const offer = b.offers?.[0];
              const numNights = b.nights || nights(b.check_in, b.check_out);
              const isAlert = ["drop_found", "offer_sent"].includes(b.status);

              return (
                <div key={b.id} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${isAlert ? "#bfdbfe" : "#eaeef2"}`, padding: "20px", background: isAlert ? "#f0f7ff" : "#fff" } as React.CSSProperties}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={20} color="#1447b8" /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>{b.hotel_name}</span>
                          <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.icon} {st.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{b.hotel_city}{b.room_type ? ` · ${b.room_type}` : ""}</div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>📅 {b.check_in} → {b.check_out}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>🌙 {numNights} nights</span>
                          {b.last_checked_at && <span style={{ fontSize: 11, color: "#9ca3af" }}>🔍 {new Date(b.last_checked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>You paid</div>
                      <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: offer ? "#9ca3af" : "#111827", textDecoration: offer ? "line-through" : "none" }}>
                        {formatINR(b.original_price)}
                      </div>
                      {offer && (
                        <>
                          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#1447b8" }}>{formatINR(offer.offer_price)}</div>
                          <div style={{ fontSize: 11, color: "#1447b8", fontWeight: 700 }}>Save {formatINR(offer.customer_saving)} 🎉</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Drop found CTA */}
                  {isAlert && offer && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #dcfce7", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, color: "#1447b8" }}>
                        🎉 We found a lower price! Save <strong>{formatINR(offer.customer_saving)}</strong> on your stay.
                      </div>
                      <button onClick={() => router.push(`/offer/${offer.id}`)}
                        style={{ background: "#1447b8", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                        View offer <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Tracking status bar */}
                  {b.status === "tracking" && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f4f6f9", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, background: "#f4f6f9", borderRadius: 4, height: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "60%", background: "#1447b8", borderRadius: 4, animation: "pulse 2s infinite" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} /> Checking every 6 hours</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload CTA at bottom */}
        <div style={{ marginTop: 24, background: "#1447b8", borderRadius: 16, padding: isMobile ? "24px 20px" : "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Got another booking?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Upload your voucher — we&apos;ll watch it 24/7.</div>
          </div>
          <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: "#1447b8", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Clash Display', sans-serif", whiteSpace: "nowrap" }}>
            Track new booking →
          </button>
        </div>

      </div>
    </div>
  );
}
