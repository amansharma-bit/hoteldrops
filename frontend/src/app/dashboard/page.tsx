"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";
const GOLD = "#f59e0b";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatINR(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const m = Math.floor(diff / 2592000000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return `${m}mo ago`;
}

interface Booking {
  id?: string; hotel_name: string; hotel_city: string; check_in: string; check_out: string;
  total_nights?: number; room_type?: string; num_adults?: number; num_children?: number;
  children_ages?: (number | null)[]; board_basis?: string; board_basis_label?: string;
  total_price_paid?: number; price_per_night?: number; ota_name?: string;
  booking_reference?: string; cancellation_policy?: string; cancellation_deadline?: string;
  voucher_url?: string | null; status?: string; created_at?: string;
  offers?: { id: string; offer_price: number; customer_saving: number; status: string }[];
}

const DEMO: Booking[] = [
  { id: "w1", hotel_name: "Manand Hotel", hotel_city: "Yerevan, Armenia", check_in: "2026-06-03", check_out: "2026-06-09", total_nights: 6, room_type: "Standard Room", num_adults: 2, num_children: 1, children_ages: [5], board_basis: "BB", board_basis_label: "Bed & Breakfast", total_price_paid: 6174, price_per_night: 1029, ota_name: "Agoda", booking_reference: "2013580651", cancellation_policy: "free", cancellation_deadline: "2026-05-28", status: "tracking", created_at: new Date(Date.now()-3600000).toISOString(), offers: [{ id:"o1", offer_price:5420, customer_saving:754, status:"sent" }] },
  { id: "w2", hotel_name: "The Leela Palace", hotel_city: "New Delhi, India", check_in: "2026-07-15", check_out: "2026-07-18", total_nights: 3, room_type: "Deluxe Room", num_adults: 2, num_children: 0, children_ages: [], board_basis: "RO", board_basis_label: "Room Only", total_price_paid: 18500, price_per_night: 6167, ota_name: "Booking.com", booking_reference: "8821934", cancellation_policy: "free", cancellation_deadline: "2026-07-10", status: "drop_found", created_at: new Date(Date.now()-86400000).toISOString(), offers: [{ id:"o2", offer_price:16200, customer_saving:2300, status:"sent" }] },
  { id: "w3", hotel_name: "Ibis Styles Goa", hotel_city: "Goa, India", check_in: "2026-08-20", check_out: "2026-08-25", total_nights: 5, room_type: "Superior Room", num_adults: 2, num_children: 2, children_ages: [7,10], board_basis: "BB", board_basis_label: "Bed & Breakfast", total_price_paid: 9800, price_per_night: 1960, ota_name: "MakeMyTrip", booking_reference: "MMT9923411", cancellation_policy: "unknown", cancellation_deadline: "", status: "tracking", created_at: new Date(Date.now()-7200000).toISOString() },
];

const DEMO_BOOKINGS = [
  { id:"b1", hotel_name:"Taj Mahal Palace", hotel_city:"Mumbai", check_in:"2026-04-10", check_out:"2026-04-12", nights:2, price:24000, status:"completed", booking_ref:"RBQ-20240410" },
  { id:"b2", hotel_name:"Radisson Blu", hotel_city:"Bengaluru", check_in:"2026-06-05", check_out:"2026-06-07", nights:2, price:11200, status:"upcoming", booking_ref:"RBQ-20240605" },
  { id:"b3", hotel_name:"Hyatt Regency", hotel_city:"Chennai", check_in:"2026-02-18", check_out:"2026-02-20", nights:2, price:15600, status:"completed", booking_ref:"RBQ-20240218" },
];

const DEMO_ACTIVITY = [
  { text: "Price tracker activated for Manand Hotel, Yerevan", time: "2 hours ago", color: B },
  { text: "Price drop detected — ₹2,300 saved on The Leela Palace", time: "1 day ago", color: "#16a34a" },
  { text: "Booking confirmed — Radisson Blu, Bengaluru", time: "3 days ago", color: GOLD },
  { text: "Stay completed — Taj Mahal Palace, Mumbai", time: "1 month ago", color: "#64748b" },
];

type Section = "overview" | "price-monitor" | "my-bookings" | "trips" | "notifications" | "settings";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? B : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [section, setSection] = useState<Section>("price-monitor");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [bookingTab, setBookingTab] = useState<"all"|"upcoming"|"completed"|"cancelled">("all");
  const [notifPriceDrops, setNotifPriceDrops] = useState(true);
  const [notifBookingUpdates, setNotifBookingUpdates] = useState(true);
  const [notifDeals, setNotifDeals] = useState(false);
  const [notifSMS, setNotifSMS] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailField, setEmailField] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [passport, setPassport] = useState("");
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/signin"); return; }
      const meta = data.user.user_metadata;
      const fullName = meta?.full_name || meta?.name || "";
      const parts = fullName.trim().split(" ");
      const fn = parts[0] || ""; const ln = parts.slice(1).join(" ") || "";
      const ini = ((fn[0]||"")+(ln[0]||fn[1]||"")).toUpperCase()||"M";
      setUser({ name: fullName || data.user.email?.split("@")[0] || "Member", email: data.user.email || "", initials: ini });
      setFirstName(fn); setLastName(ln); setEmailField(data.user.email || "");
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setBookings(DEMO); setIsDemo(true); setLoading(false); return; }
        const { data, error } = await supabase.from("bookings").select("*, offers(id,offer_price,customer_saving,status)").order("created_at", { ascending: false });
        if (error || !data?.length) { setBookings(DEMO); setIsDemo(true); } else setBookings(data);
      } catch { setBookings(DEMO); setIsDemo(true); }
      setLoading(false);
    }
    load();
  }, []);

  const totalSaved = bookings.reduce((s, b) => s + (b.offers?.[0]?.customer_saving || 0), 0);
  const dropsFound = bookings.filter(b => ["drop_found","offer_sent","rebooked"].includes(b.status||"")).length;

  const inp: React.CSSProperties = { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", color: NAVY, outline: "none", background: "#fff" };

  const NAV_ITEMS: { key: Section; label: string }[] = [
    { key: "overview",       label: "Overview" },
    { key: "price-monitor",  label: "Price Monitor" },
    { key: "my-bookings",    label: "My Bookings" },
    { key: "trips",          label: "Trips" },
    { key: "notifications",  label: "Notifications" },
    { key: "settings",       label: "Settings" },
  ];

  const filteredBookings = DEMO_BOOKINGS.filter(b => bookingTab === "all" || b.status === bookingTab);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f0f2f8", minHeight: "100vh", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .nav-btn { width:100%; display:flex; align-items:center; gap:10px; padding:12px 18px; border:none; cursor:pointer; font-family:inherit; font-size:14px; text-align:left; transition:all 0.15s; background:#fff; color:#475569; border-left:3px solid transparent; }
        .nav-btn:hover { background:#f8fafc !important; }
        .nav-btn.active { background:#eff6ff !important; color:${B} !important; border-left:3px solid ${B} !important; font-weight:600; }
        .booking-card:hover { box-shadow:0 4px 24px rgba(20,71,184,0.10) !important; }
      `}</style>

      {/* ── BLUE HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)" }}>
        {/* Nav */}
        <nav style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 48px", position: "sticky", top: 0, zIndex: 300, background: "transparent" }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none" }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "5px 14px" }}>
            <div style={{ width: 7, height: 7, background: "#4ade80", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>PRICE TRACKER ACTIVATED</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {!isMobile && <a href="/search-hotels" style={{ fontSize: 14, color: "#FCD34D", textDecoration: "none", fontWeight: 600 }}>Exclusive Deals</a>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user?.initials || "M"}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user?.name?.split(" ")[0] || "Member"}</span>
            </div>
          </div>
        </nav>

        {/* Profile Banner */}
        <div style={{ padding: isMobile ? "20px 20px 28px" : "24px 48px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" as const }}>
            {/* Left: avatar + info */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {user?.initials || "M"}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 2 }}>MY ACCOUNT</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{user?.name || "Member"}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>{user?.email}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.2)" }}>Verified Member</span>
                  <span style={{ background: "rgba(252,211,77,0.15)", color: "#FCD34D", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(252,211,77,0.3)" }}>Gold Saver</span>
                </div>
              </div>
            </div>
            {/* Right: stats */}
            {!isMobile && (
              <div style={{ display: "flex", gap: 40 }}>
                {[
                  { label: "MONITORED", val: String(bookings.length) },
                  { label: "DROPS FOUND", val: String(dropsFound) },
                  { label: "TOTAL SAVED", val: formatINR(totalSaved || 31938) },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" as const }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: i === 2 ? 26 : 30, fontWeight: 800, color: i === 2 ? GOLD : "#fff" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT: sidebar + content ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 48px 80px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* ── LEFT SIDEBAR ── */}
        {!isMobile && (
          <div style={{ position: "sticky", top: 80 }}>
            {/* Nav card */}
            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  className={`nav-btn${section === item.key ? " active" : ""}`}
                  style={{ borderBottom: i < NAV_ITEMS.length - 1 ? "1px solid #f8fafc" : "none" }}
                >
                  <span>{item.label}</span>
                  <svg style={{ marginLeft: "auto" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
              <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", border: "none", borderTop: "1px solid #f1f5f9", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, background: "#fff", color: "#ef4444" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Sign Out
            </button>
          </div>
          </div>
        )}

        {/* ── RIGHT CONTENT ── */}
        <div>
          {isDemo && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <span><strong>Demo mode</strong> — Upload a real voucher to start tracking live prices.</span>
              <button onClick={() => router.push("/")} style={{ marginLeft: "auto", background: "#d97706", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload now →</button>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {section === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { val: bookings.length, label: "Bookings Monitored", color: B, bg: "#eff6ff" },
                  { val: DEMO_BOOKINGS.length, label: "Bookings With Us", color: "#0891b2", bg: "#ecfeff" },
                  { val: formatINR(totalSaved||31938), label: "Total Saved", color: "#16a34a", bg: "#f0fdf4" },
                  { val: 2, label: "Trips Completed", color: "#9333ea", bg: "#faf5ff" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, marginBottom: 14 }} />
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Recent Activity</div>
                {DEMO_ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: i < DEMO_ACTIVITY.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: NAVY, fontWeight: 500, marginBottom: 2 }}>{a.text}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRICE MONITOR ── */}
          {section === "price-monitor" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>Price Monitor</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Bookings we're actively watching for price drops</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 14px", borderRadius: 100 }}>
                  <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                  {bookings.filter(b=>["tracking","pending"].includes(b.status||"")).length} Active
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ width: 32, height: 32, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : bookings.map(b => {
                const offer = b.offers?.[0];
                const isDropFound = ["drop_found","offer_sent"].includes(b.status||"");
                const isFree = b.cancellation_policy === "free";
                const isNR = b.cancellation_policy === "non-refundable";
                const cancelColor = isFree ? "#16a34a" : isNR ? "#dc2626" : "#d97706";
                const cancelBg = isFree ? "#f0fdf4" : isNR ? "#fef2f2" : "#fefce8";
                const cancelBorder = isFree ? "#bbf7d0" : isNR ? "#fecaca" : "#fde68a";
                const cancelLabel = isFree ? `Free cancel until ${fmtDate(b.cancellation_deadline||"")}` : isNR ? "Non-refundable" : "Cancellation policy unclear";

                return (
                  <div key={b.id} className="booking-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s" }}>
                    {/* Header */}
                    <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 6 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{b.hotel_name}</div>
                          {isDropFound ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Price Drop Found
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#dbeafe", color: B, display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: B, display: "inline-block", animation: "pulse 1.5s infinite" }} /> Tracking
                            </span>
                          )}
                          {b.ota_name && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "#f1f5f9", color: "#64748b" }}>{b.ota_name}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                          {b.hotel_city}{b.created_at && <span style={{ color: "#94a3b8", marginLeft: 8 }}>· Tracked {timeAgo(b.created_at)}</span>}
                        </div>
                      </div>
                      {/* Price */}
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        {offer ? (
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(b.total_price_paid||0)}</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>{formatINR(offer.offer_price)}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Save {formatINR(offer.customer_saving)}</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>AMOUNT PAID</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>{b.total_price_paid ? formatINR(b.total_price_paid) : "—"}</div>
                            {(b.price_per_night||0) > 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatINR(b.price_per_night||0)}/night</div>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Data grid */}
                    <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: "14px 24px", borderTop: "1px solid #f1f5f9", marginTop: 16 }}>
                      {[
                        { label: "CHECK-IN",    val: fmtDate(b.check_in) },
                        { label: "CHECK-OUT",   val: fmtDate(b.check_out) },
                        { label: "GUESTS",      val: `${b.num_adults||2} adult${(b.num_adults||2)>1?"s":""}${(b.num_children||0)>0?` · ${b.num_children} child${(b.num_children||0)>1?"ren":""}`:""}` },
                        { label: "NIGHTS",      val: `${b.total_nights || Math.max(1,Math.round((new Date(b.check_out).getTime()-new Date(b.check_in).getTime())/86400000))} nights` },
                      ].map((f,i) => (
                        <div key={i}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{f.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{f.val}</div>
                        </div>
                      ))}
                      {(b.num_children||0)>0 && (b.children_ages||[]).filter(a=>a!==null).length>0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>CHILD AGES</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{(b.children_ages||[]).filter(a=>a!==null).map(a=>a===0?"Under 1":`${a} yrs`).join(", ")}</div>
                        </div>
                      )}
                      {b.room_type && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>ROOM TYPE</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.room_type}</div>
                        </div>
                      )}
                      {b.board_basis && b.board_basis !== "RO" && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>BOARD BASIS</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.board_basis_label||b.board_basis}</div>
                        </div>
                      )}
                      {b.booking_reference && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>BOOKING REF</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.booking_reference}</div>
                        </div>
                      )}
                    </div>

                    {/* Cancellation */}
                    <div style={{ margin: "0 24px 16px", background: cancelBg, border: `1px solid ${cancelBorder}`, borderRadius: 10, padding: "10px 14px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: cancelColor }}>{cancelLabel}</span>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {isDropFound ? "We found a lower price — rebook now to save." : "rebuq checks this price every 6 hours. We'll WhatsApp you the moment it drops."}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {b.voucher_url && (
                          <a href={b.voucher_url} target="_blank" rel="noreferrer" style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>View Voucher</a>
                        )}
                        {isDropFound && (
                          <button style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Claim Saving →</button>
                        )}
                        <button onClick={() => router.push("/")} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Track another</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => router.push("/")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
                + Upload new booking to track
              </button>
            </div>
          )}

          {/* ── MY BOOKINGS ── */}
          {section === "my-bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>My Bookings</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>All hotel bookings made through rebuq</div>
                </div>
                <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ New booking</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {(["all","upcoming","completed","cancelled"] as const).map(t => (
                  <button key={t} onClick={() => setBookingTab(t)}
                    style={{ padding: "7px 18px", borderRadius: 100, border: "1.5px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: bookingTab===t ? B : "#fff", color: bookingTab===t ? "#fff" : NAVY, borderColor: bookingTab===t ? B : "#e2e8f0", textTransform: "capitalize" as const, transition: "all 0.15s" }}>
                    {t}
                  </button>
                ))}
              </div>
              {filteredBookings.map(b => (
                <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 22, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 2 }}>{b.hotel_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{b.hotel_city}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(b.price)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: b.status==="upcoming" ? "#dbeafe" : "#dcfce7", color: b.status==="upcoming" ? B : "#16a34a", textTransform: "capitalize" as const }}>{b.status}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px 16px", paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                    {[
                      { label: "CHECK-IN", val: fmtDate(b.check_in) },
                      { label: "CHECK-OUT", val: fmtDate(b.check_out) },
                      { label: "NIGHTS", val: `${b.nights} nights` },
                      { label: "BOOKING REF", val: b.booking_ref },
                    ].map((f,fi) => (
                      <div key={fi}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TRIPS ── */}
          {section === "trips" && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>My Trips</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Your upcoming and past travel history</div>
              {["upcoming","completed"].map(status => (
                <div key={status}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12, marginTop: status==="completed"?24:0 }}>{status==="upcoming"?"UPCOMING":"PAST TRIPS"}</div>
                  {DEMO_BOOKINGS.filter(b=>b.status===status).map(b => (
                    <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{b.hotel_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{b.hotel_city} · {fmtDate(b.check_in)} – {fmtDate(b.check_out)}</div>
                      </div>
                      <div style={{ textAlign: "right" as const }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: status==="upcoming"?"#dbeafe":"#dcfce7", color: status==="upcoming"?B:"#16a34a", textTransform: "capitalize" as const }}>{status}</span>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginTop: 4 }}>{formatINR(b.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {section === "notifications" && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Notifications</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Manage how and when you hear from us</div>
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
                {[
                  { label: "Price Drop Alerts", desc: "Get notified when we detect a price drop on your monitored bookings", val: notifPriceDrops, set: setNotifPriceDrops },
                  { label: "Booking Updates", desc: "Confirmation, cancellation, and modification updates", val: notifBookingUpdates, set: setNotifBookingUpdates },
                  { label: "Exclusive Deals", desc: "Personalised hotel deals and member-only offers", val: notifDeals, set: setNotifDeals },
                  { label: "SMS Notifications", desc: "Receive important alerts via SMS", val: notifSMS, set: setNotifSMS },
                ].map((n,i,arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderBottom: i<arr.length-1?"1px solid #f8fafc":"none" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{n.label}</div>
                      <div style={{ fontSize: 12.5, color: "#64748b" }}>{n.desc}</div>
                    </div>
                    <Toggle on={n.val} onChange={() => n.set(!n.val)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Settings</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Manage your account and preferences</div>
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 22, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Personal Information</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap: 16, marginBottom: 18 }}>
                  {[
                    { label: "First Name", val: firstName, set: setFirstName, type: "text" },
                    { label: "Last Name", val: lastName, set: setLastName, type: "text" },
                    { label: "Email Address", val: emailField, set: setEmailField, type: "email" },
                    { label: "Phone / WhatsApp", val: phone, set: setPhone, type: "tel" },
                    { label: "Date of Birth", val: dob, set: setDob, type: "date" },
                    { label: "Nationality", val: nationality, set: setNationality, type: "text" },
                    { label: "Passport Number", val: passport, set: setPassport, type: "text" },
                  ].map((f,i) => (
                    <div key={i}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>
                <button onClick={() => { setProfileSaved(true); setTimeout(()=>setProfileSaved(false),2500); }}
                  style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {profileSaved ? "✓ Saved!" : "Save changes"}
                </button>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f8fafc" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Change Password</div>
                    <div style={{ fontSize: 12.5, color: "#64748b" }}>Last changed 3 months ago</div>
                  </div>
                  <button style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Update</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>Delete Account</div>
                    <div style={{ fontSize: 12.5, color: "#64748b" }}>Permanently delete your account and all data</div>
                  </div>
                  <button style={{ background: "#fff", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: isMobile?"20px 16px":"20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy","Terms of Service","Contact"].map(l => <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>)}
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>© 2026 rebuq. All rights reserved.</span>
      </footer>
    </div>
  );
}
