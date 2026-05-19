"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const B = "#1447b8";
const NAVY = "#0f172a";
const SUPABASE_URL = "https://wifspvhmvaavgzkepjqz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3HpgXVmSAdGA7ZPypqCdQQ_D00QN0Nh";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
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

const WATCH_STATUS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:    { label: "Setting up",  bg: "#fef3c7", color: "#d97706", icon: "⏳" },
  tracking:   { label: "Watching",    bg: "#dbeafe", color: "#1447b8", icon: "🔍" },
  drop_found: { label: "Drop Found!", bg: "#dcfce7", color: "#16a34a", icon: "📉" },
  offer_sent: { label: "Offer Sent",  bg: "#dbeafe", color: "#1447b8", icon: "📱" },
  rebooked:   { label: "Saved ✓",    bg: "#dcfce7", color: "#16a34a", icon: "🎉" },
  expired:    { label: "Expired",     bg: "#f4f6f9", color: "#9ca3af", icon: "⏰" },
  no_drop:    { label: "No drop yet", bg: "#f4f6f9", color: "#9ca3af", icon: "📊" },
};

const DEMO_CONFIRMED = [
  {
    id: "conf-1", hotel_name: "Damac Maison Dubai Mall Street", hotel_city: "Dubai",
    check_in: "2026-08-11", check_out: "2026-08-13", room: "Suite Two Bedrooms",
    guests: 2, nights: 2, price: 21262, status: "upcoming", booking_ref: "RBQ-482910",
    img: "https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=300&fit=crop&h=200",
  },
  {
    id: "conf-2", hotel_name: "Atlantis The Palm", hotel_city: "Dubai",
    check_in: "2025-12-20", check_out: "2025-12-24", room: "Deluxe King Room",
    guests: 2, nights: 4, price: 112000, status: "completed", booking_ref: "RBQ-371204",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=85&fit=crop",
  },
];

const DEMO_WATCH: Booking[] = [
  {
    id: "watch-1", hotel_name: "Atlantis The Palm", hotel_city: "Dubai",
    check_in: "2026-12-14", check_out: "2026-12-18", original_price: 112000,
    status: "drop_found", last_checked_at: new Date(Date.now() - 3600000).toISOString(),
    nights: 4, room_type: "Deluxe Room", created_at: new Date().toISOString(),
    offers: [{ id: "offer-1", offer_price: 89600, customer_saving: 22400, status: "sent" }],
  },
  {
    id: "watch-2", hotel_name: "Park Hyatt Bangkok", hotel_city: "Bangkok",
    check_in: "2027-01-03", check_out: "2027-01-07", original_price: 158000,
    status: "tracking", last_checked_at: new Date(Date.now() - 7200000).toISOString(),
    nights: 4, room_type: "Park King Room", created_at: new Date().toISOString(),
  },
  {
    id: "watch-3", hotel_name: "W Bali Seminyak", hotel_city: "Bali",
    check_in: "2027-02-08", check_out: "2027-02-12", original_price: 91000,
    status: "rebooked", last_checked_at: new Date(Date.now() - 86400000).toISOString(),
    nights: 4, room_type: "Wonderful Room", created_at: new Date().toISOString(),
    offers: [{ id: "offer-3", offer_price: 72800, customer_saving: 18200, status: "completed" }],
  },
];

export default function Dashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<"bookings" | "watch" | "profile">("bookings");
  const [watchBookings, setWatchBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState("Aarav");
  const [lastName, setLastName] = useState("Sharma");
  const [email, setEmail] = useState("aarav@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [whatsapp, setWhatsapp] = useState("+91 98765 43210");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/bookings?select=*,offers(id,offer_price,customer_saving,status)&order=created_at.desc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWatchBookings(data);
        } else {
          setWatchBookings(DEMO_WATCH);
          setIsDemo(true);
        }
      } catch {
        setWatchBookings(DEMO_WATCH);
        setIsDemo(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalSaved = watchBookings.filter(b => b.status === "rebooked").reduce((s, b) => s + (b.offers?.[0]?.customer_saving || 0), 0);
  const activeWatch = watchBookings.filter(b => ["tracking", "pending"].includes(b.status)).length;
  const dropsFound = watchBookings.filter(b => ["drop_found", "offer_sent", "rebooked"].includes(b.status)).length;

  const NAV_ITEMS = [
    { key: "bookings", label: "My Bookings", icon: "🏨" },
    { key: "watch", label: "Price Watch", icon: "🔔" },
    { key: "profile", label: "Profile & Settings", icon: "👤" },
  ] as const;

  const inp: React.CSSProperties = {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, fontFamily: "inherit",
    color: NAVY, outline: "none", background: "#fff",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none" }}>
            <li><a href="/#how" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>How it works</a></li>
            <li><a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a></li>
          </ul>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isMobile && (
            <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Check my booking
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none", transition: "all 0.2s" }} />
              <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? "transparent" : NAVY, transition: "all 0.2s" }} />
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none", transition: "all 0.2s" }} />
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>How it works</button>
          <button onClick={() => { router.push("/search-hotels"); setMenuOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button>
          <button onClick={() => { router.push("/upload"); setMenuOpen(false); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Check my booking</button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 32px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <div>
          {/* Profile card */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "20px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: B, color: "#fff", fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              {firstName[0]}{lastName[0]}
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: NAVY, marginBottom: 4 }}>{firstName} {lastName}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{email}</div>
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100 }}>
              ✓ rebuq Member
            </div>
          </div>

          {/* Nav */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            {NAV_ITEMS.map((item, i) => (
              <button key={item.key} onClick={() => setActiveSection(item.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "none", background: activeSection === item.key ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: activeSection === item.key ? 600 : 500, color: activeSection === item.key ? B : "#1e293b", borderBottom: i < NAV_ITEMS.length - 1 ? "1px solid #f1f5f9" : "none", borderLeft: activeSection === item.key ? `3px solid ${B}` : "3px solid transparent", transition: "all 0.15s" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Your stats</div>
            {[
              { label: "Bookings tracked", val: watchBookings.length, color: NAVY },
              { label: "Actively watching", val: activeWatch, color: B },
              { label: "Drops found", val: dropsFound, color: "#16a34a" },
              { label: "Total saved", val: formatINR(totalSaved), color: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div>

          {/* ── MY BOOKINGS ── */}
          {activeSection === "bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>My Bookings</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Hotels you&apos;ve booked through rebuq</div>
                </div>
                <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ New booking</button>
              </div>

              {isDemo && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                  👀 <span><strong>Demo mode</strong> — these are sample bookings. Sign in to see your real bookings.</span>
                </div>
              )}

              {/* Upcoming */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Upcoming</div>
              {DEMO_CONFIRMED.filter(b => b.status === "upcoming").map(b => (
                <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: 0 }}>
                    <img src={b.img} alt={b.hotel_name} style={{ width: "100%", height: isMobile ? 160 : "100%", minHeight: 120, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{b.hotel_name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>📍 {b.hotel_city} · {b.room} · {b.guests} guests</div>
                        </div>
                        <span style={{ background: "#dbeafe", color: B, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>Upcoming</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Check-in</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.check_in}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Check-out</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.check_out}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Total paid</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{formatINR(b.price)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Ref: {b.booking_ref}</span>
                        <button style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>⬇ Download voucher</button>
                        <button style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>✉ Email</button>
                        <button style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>✕ Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Past */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 12px" }}>Past Bookings</div>
              {DEMO_CONFIRMED.filter(b => b.status === "completed").map(b => (
                <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 14, opacity: 0.85 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: 0 }}>
                    <img src={b.img} alt={b.hotel_name} style={{ width: "100%", height: isMobile ? 140 : "100%", minHeight: 100, objectFit: "cover", display: "block", filter: "grayscale(20%)" }} />
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{b.hotel_name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>📍 {b.hotel_city} · {b.room} · {b.guests} guests</div>
                        </div>
                        <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>Completed</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Check-in</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.check_in}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Check-out</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.check_out}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Total paid</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{formatINR(b.price)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>⬇ Download voucher</button>
                        <button style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Book again</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PRICE WATCH ── */}
          {activeSection === "watch" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>Price Watch</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Vouchers you&apos;ve uploaded for repricing</div>
                </div>
                <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Upload voucher</button>
              </div>

              {isDemo && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                  👀 <span><strong>Demo mode</strong> — Upload a real voucher to start tracking.</span>
                  <button onClick={() => router.push("/upload")} style={{ marginLeft: "auto", background: "#d97706", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Upload now →</button>
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ width: 32, height: 32, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {watchBookings.map(b => {
                    const st = WATCH_STATUS[b.status] || WATCH_STATUS.tracking;
                    const offer = b.offers?.[0];
                    const isAlert = ["drop_found", "offer_sent"].includes(b.status);
                    return (
                      <div key={b.id} style={{ background: isAlert ? "#f0f7ff" : "#fff", border: `1.5px solid ${isAlert ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 14, padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{b.hotel_name}</div>
                              <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20 }}>{st.icon} {st.label}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{b.hotel_city}{b.room_type ? ` · ${b.room_type}` : ""}</div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>📅 {b.check_in} → {b.check_out}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>🌙 {b.nights} nights</span>
                              {b.last_checked_at && <span style={{ fontSize: 11, color: "#94a3b8" }}>🔍 Last checked {new Date(b.last_checked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>You paid</div>
                            <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: offer ? "#94a3b8" : NAVY, textDecoration: offer ? "line-through" : "none" }}>{formatINR(b.original_price)}</div>
                            {offer && (
                              <>
                                <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: B }}>{formatINR(offer.offer_price)}</div>
                                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Save {formatINR(offer.customer_saving)} 🎉</div>
                              </>
                            )}
                          </div>
                        </div>

                        {isAlert && offer && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ fontSize: 13, color: B }}>🎉 Lower price found! Save <strong>{formatINR(offer.customer_saving)}</strong></div>
                            <button onClick={() => router.push(`/offer/${offer.id}`)} style={{ background: B, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View offer →</button>
                          </div>
                        )}

                        {b.status === "tracking" && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, height: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: "60%", background: B, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>⟳ Checking every 6 hours</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 24, background: B, borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Got another booking?</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Upload your voucher — we watch it 24/7.</div>
                </div>
                <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", padding: "11px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Track new booking →</button>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {activeSection === "profile" && (
            <div>
              <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 20 }}>Profile & Settings</div>

              {/* Personal info */}
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Personal Information</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>WhatsApp Number</label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={inp} />
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 5 }}>Price drop alerts will be sent here</div>
                  </div>
                </div>
                <button onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }}
                  style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {profileSaved ? "✓ Saved!" : "Save changes"}
                </button>
              </div>

              {/* Notifications */}
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Notification Preferences</div>
                {[
                  { label: "WhatsApp alerts", desc: "Get price drop alerts on WhatsApp instantly", val: whatsappAlerts, set: setWhatsappAlerts },
                  { label: "Email alerts", desc: "Receive price drop summaries by email", val: emailAlerts, set: setEmailAlerts },
                ].map((n, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i === 0 ? "1px solid #f1f5f9" : "none" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{n.label}</div>
                      <div style={{ fontSize: 12.5, color: "#64748b" }}>{n.desc}</div>
                    </div>
                    <div onClick={() => n.set(!n.val)} style={{ width: 44, height: 24, borderRadius: 12, background: n.val ? B : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 3, left: n.val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Change password */}
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Change Password</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Current Password</label>
                    <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••" style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>New Password</label>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 8 characters" style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Confirm New Password</label>
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" style={inp} />
                  </div>
                  <button onClick={() => { setPassSaved(true); setTimeout(() => setPassSaved(false), 3000); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }}
                    style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "fit-content" }}>
                    {passSaved ? "✓ Password updated!" : "Update password"}
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div style={{ background: "#fff", border: "1.5px solid #fecaca", borderRadius: 14, padding: 24 }}>
                <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Danger Zone</div>
                <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 16 }}>Once you delete your account, all your data and bookings will be permanently removed. This cannot be undone.</div>
                <button style={{ background: "#fff", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Delete my account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
