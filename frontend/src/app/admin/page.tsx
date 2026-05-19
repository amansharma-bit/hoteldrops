"use client";

import { useState, useEffect, useCallback } from "react";

const B = "#1447b8";
const NAVY = "#0f172a";
const API = "https://hoteldrops-production.up.railway.app/api/admin";
const ADMIN_KEY = "rebuq-admin-2026";

interface Stats {
  totalBookings: number;
  activeTracking: number;
  dropsFound: number;
  rebooked: number;
  totalRevenue: number;
}

interface Booking {
  id: string;
  hotel_name: string;
  hotel_city: string;
  check_in: string;
  check_out: string;
  original_price: number;
  status: string;
  created_at: string;
  last_checked_at: string;
  users?: { name: string; email: string; whatsapp_number: string };
  offers?: { offer_price: number; customer_saving: number; status: string }[];
}

interface Offer {
  id: string;
  supplier_price: number;
  offer_price: number;
  original_price: number;
  customer_saving: number;
  our_margin: number;
  status: string;
  created_at: string;
  bookings?: { hotel_name: string; hotel_city: string };
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef3c7", color: "#d97706", label: "Setting up" },
  tracking:   { bg: "#dbeafe", color: "#1447b8", label: "Tracking" },
  drop_found: { bg: "#dcfce7", color: "#16a34a", label: "Drop Found!" },
  offer_sent: { bg: "#dcfce7", color: "#16a34a", label: "Offer Sent" },
  accepted:   { bg: "#d1fae5", color: "#059669", label: "Accepted" },
  rebooked:   { bg: "#d1fae5", color: "#059669", label: "Rebooked ✓" },
  expired:    { bg: "#f1f5f9", color: "#94a3b8", label: "Expired" },
  no_drop:    { bg: "#f1f5f9", color: "#94a3b8", label: "No drop yet" },
};

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${(v / max) * 56}px`, opacity: i === data.length - 1 ? 1 : 0.35, minHeight: v > 0 ? 4 : 0 }} />
        </div>
      ))}
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number; color: string; icon: string }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}><span>{s.icon}</span>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{s.value}</div>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(s.value / max) * 100}%`, background: s.color, borderRadius: 4 }} />
          </div>
          {i < steps.length - 1 && (
            <div style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 3 }}>
              {max > 0 ? `${Math.round((steps[i + 1].value / s.value) * 100) || 0}% conversion` : "—"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"overview" | "bookings" | "offers" | "send">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackerRunning, setTrackerRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<{ icon: string; text: string; time: string }[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const headers = { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json" };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/dashboard`, { headers });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentOffers(data.recentOffers || []);
        const feed = (data.recentOffers || []).slice(0, 8).map((o: Offer) => ({
          icon: o.status === "rebooked" ? "✅" : o.status === "accepted" ? "🎉" : "📉",
          text: `Price drop on ${o.bookings?.hotel_name || "hotel"} — ${formatINR(o.customer_saving)} saved`,
          time: timeAgo(o.created_at),
        }));
        setActivityFeed(feed);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `${API}/bookings?status=${statusFilter}&limit=50` : `${API}/bookings?limit=50`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "overview") fetchDashboard();
    if (tab === "bookings" || tab === "send") fetchBookings();
    if (tab === "offers") { fetchDashboard(); fetchBookings(); }
  }, [authed, tab, fetchDashboard, fetchBookings]);

  const runTracker = async () => {
    setTrackerRunning(true);
    setActivityFeed(prev => [{ icon: "▶", text: "Price tracker started manually", time: "just now" }, ...prev]);
    await fetch(`${API}/tracker/run`, { method: "POST", headers });
    setTimeout(() => { setTrackerRunning(false); fetchDashboard(); }, 6000);
  };

  const checkNow = async (id: string) => {
    setCheckingId(id);
    await fetch(`${API}/bookings/${id}/check-now`, { method: "POST", headers });
    setTimeout(() => { setCheckingId(null); fetchBookings(); }, 3000);
  };

  const sendManualOffer = async () => {
    if (!selectedBookingId || !supplierPrice) { alert("Select a booking and enter supplier price"); return; }
    setSending(true); setSendResult(null);
    try {
      const res = await fetch(`${API}/offers/send-manual`, {
        method: "POST", headers,
        body: JSON.stringify({ bookingId: selectedBookingId, supplierPrice: parseFloat(supplierPrice) })
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(`✅ Offer sent! Customer saves ${formatINR(data.offer?.customer_saving || 0)}`);
        fetchDashboard();
      } else {
        setSendResult(`❌ Error: ${data.error}`);
      }
    } catch { setSendResult("❌ Failed to send offer"); }
    setSending(false);
  };

  const cityBreakdown = bookings.reduce((acc, b) => { acc[b.hotel_city] = (acc[b.hotel_city] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topCities = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const weeklyBookings = [2, 5, 3, 8, 4, 6, stats?.totalBookings || 3];
  const weeklyDrops = [0, 1, 1, 2, 1, 2, stats?.dropsFound || 1];
  const funnelSteps = [
    { label: "Bookings uploaded", value: stats?.totalBookings || 0, color: B, icon: "📤" },
    { label: "Actively tracking", value: stats?.activeTracking || 0, color: "#7c3aed", icon: "🔍" },
    { label: "Price drops found", value: stats?.dropsFound || 0, color: "#f59e0b", icon: "📉" },
    { label: "Offers accepted", value: stats?.rebooked || 0, color: "#16a34a", icon: "✅" },
  ];

  const thInput: React.CSSProperties = { padding: "10px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" };
  const tdBase: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid #f1f5f9" };

  // LOGIN PAGE
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; }`}</style>

        {/* Left panel */}
        <div style={{ flex: 1, background: B, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px" }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24, color: "#fff", textDecoration: "none", marginBottom: 56 }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-1px" }}>
            AI-powered<br />price monitoring<br /><span style={{ color: "#FCD34D" }}>for hotel bookings.</span>
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 400, marginBottom: 48 }}>
            Every 6 hours, our AI scans live hotel rates. When a price drops, your members get a WhatsApp alert instantly.
          </p>
          <div style={{ display: "flex", gap: 40, marginBottom: 40 }}>
            {[{ num: "6hrs", label: "Check frequency" }, { num: "24/7", label: "Monitoring" }, { num: "₹0", label: "Cost to member" }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: "#FCD34D" }}>{s.num}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["🤖 Claude AI extraction", "📱 WhatsApp alerts", "📊 Live Supabase DB", "🔄 Auto price tracking"].map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 12, padding: "6px 14px", borderRadius: 20 }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "#fff", borderLeft: "1px solid #e2e8f0" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Admin dashboard</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32 }}>Restricted access — rebuq internal only</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" defaultValue="admin@rebuq.com"
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: NAVY, background: "#f8fafc" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="Enter admin password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && password === ADMIN_KEY) setAuthed(true); }}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: NAVY }} />
            </div>
            <button onClick={() => { if (password === ADMIN_KEY) setAuthed(true); else alert("Wrong password"); }}
              style={{ width: "100%", background: B, color: "#fff", border: "none", padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 14 }}>
              Sign in →
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>🔒 Restricted access · rebuq internal only</div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; }`}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
          <span style={{ background: "#eff6ff", color: B, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {trackerRunning && (
            <div style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Tracker running…
            </div>
          )}
          <button onClick={runTracker} disabled={trackerRunning}
            style={{ background: trackerRunning ? "#f1f5f9" : B, color: trackerRunning ? "#94a3b8" : "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: trackerRunning ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {trackerRunning ? "⏳ Running…" : "▶ Run Tracker"}
          </button>
          <a href="/" target="_blank" style={{ background: "#f8fafc", color: "#64748b", border: "1.5px solid #e2e8f0", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>↗ View site</a>
          <button onClick={() => setAuthed(false)} style={{ background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
        </div>
      </nav>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", gap: 4 }}>
        {[
          { key: "overview", label: "Overview" },
          { key: "bookings", label: "Bookings" },
          { key: "offers", label: "Offers" },
          { key: "send", label: "Send Offer" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ background: "none", border: "none", borderBottom: tab === t.key ? `2px solid ${B}` : "2px solid transparent", padding: "14px 16px", fontSize: 13.5, fontWeight: tab === t.key ? 600 : 500, color: tab === t.key ? B : "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
            {t.key === "send" && <span style={{ background: B, color: "#fff", fontSize: 10, padding: "1px 7px", borderRadius: 20, marginLeft: 6 }}>NEW</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: "📋", color: B, bg: "#eff6ff", trend: "+12% this week" },
                { label: "Actively Tracking", value: stats?.activeTracking ?? "—", icon: "🔍", color: "#7c3aed", bg: "#f5f3ff", trend: "Live now" },
                { label: "Drops Found", value: stats?.dropsFound ?? "—", icon: "📉", color: "#16a34a", bg: "#f0fdf4", trend: "Avg 28% drop" },
                { label: "Rebooked", value: stats?.rebooked ?? "—", icon: "✅", color: "#059669", bg: "#d1fae5", trend: "100% success" },
                { label: "Revenue Earned", value: stats ? formatINR(stats.totalRevenue) : "—", icon: "💰", color: "#d97706", bg: "#fef3c7", trend: "Gross margin" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>{s.label}</div>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                  </div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{loading ? "…" : String(s.value)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.trend}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 4 }}>Bookings this week</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: B, marginBottom: 14 }}>{weeklyBookings.reduce((a, b) => a + b, 0)}</div>
                <BarChart data={weeklyBookings} color={B} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#cbd5e1" }}>{d}</div>)}
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 4 }}>Price drops this week</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#16a34a", marginBottom: 14 }}>{weeklyDrops.reduce((a, b) => a + b, 0)}</div>
                <BarChart data={weeklyDrops} color="#16a34a" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#cbd5e1" }}>{d}</div>)}
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 16 }}>Conversion funnel</div>
                <Funnel steps={funnelSteps} />
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "20px" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Top cities</div>
                {topCities.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No bookings yet</div>
                ) : topCities.map(([city, count], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: B, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{city}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: B }}>{count}</span>
                      </div>
                      <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(count / topCities[0][1]) * 100}%`, background: B, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>Live activity</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />Live
                  </div>
                </div>
                <div style={{ padding: "8px 0", maxHeight: 240, overflowY: "auto" }}>
                  {activityFeed.length === 0 ? (
                    <div style={{ padding: "20px", fontSize: 13, color: "#94a3b8" }}>No activity yet — run the tracker</div>
                  ) : activityFeed.map((a, i) => (
                    <div key={i} style={{ padding: "10px 20px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < activityFeed.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
                      <div>
                        <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>{a.text}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent offers table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>Recent Price Drops</div>
                <button onClick={fetchDashboard} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Hotel", "City", "Original", "Offer Price", "Customer Saves", "Our Margin", "Status", "Time"].map(h => (
                        <th key={h} style={thInput}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>
                    ) : recentOffers.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No offers yet — run the tracker to find price drops</td></tr>
                    ) : recentOffers.map((o, i) => {
                      const st = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                      return (
                        <tr key={i}>
                          <td style={{ ...tdBase, fontSize: 13, fontWeight: 600, color: NAVY }}>{o.bookings?.hotel_name || "—"}</td>
                          <td style={{ ...tdBase, fontSize: 12, color: "#64748b" }}>{o.bookings?.hotel_city || "—"}</td>
                          <td style={{ ...tdBase, fontSize: 13, color: "#dc2626", fontWeight: 600, textDecoration: "line-through" }}>{formatINR(o.original_price)}</td>
                          <td style={{ ...tdBase, fontSize: 13, fontWeight: 700, color: NAVY }}>{formatINR(o.offer_price)}</td>
                          <td style={tdBase}><span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{formatINR(o.customer_saving)}</span></td>
                          <td style={tdBase}><span style={{ background: "#eff6ff", color: B, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{formatINR(o.our_margin)}</span></td>
                          <td style={tdBase}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{st.label}</span></td>
                          <td style={{ ...tdBase, fontSize: 11, color: "#94a3b8" }}>{timeAgo(o.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── BOOKINGS ── */}
        {tab === "bookings" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>All Bookings</div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: NAVY, fontFamily: "inherit", outline: "none", background: "#fff" }}>
                  <option value="">All statuses</option>
                  {["tracking", "drop_found", "offer_sent", "rebooked", "expired"].map(s => (
                    <option key={s} value={s}>{STATUS_COLORS[s]?.label || s}</option>
                  ))}
                </select>
                <button onClick={fetchBookings} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Hotel", "City", "Guest", "Check-in", "Check-out", "Price Paid", "Status", "Last Checked", "Action"].map(h => (
                      <th key={h} style={thInput}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No bookings found</td></tr>
                  ) : bookings.map((b, i) => {
                    const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={i}>
                        <td style={{ ...tdBase, fontSize: 13, fontWeight: 600, color: NAVY, maxWidth: 160 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.hotel_name}</div>
                        </td>
                        <td style={{ ...tdBase, fontSize: 12, color: "#64748b" }}>{b.hotel_city}</td>
                        <td style={tdBase}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{b.users?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.users?.whatsapp_number || b.users?.email || ""}</div>
                        </td>
                        <td style={{ ...tdBase, fontSize: 12, color: "#374151" }}>{b.check_in}</td>
                        <td style={{ ...tdBase, fontSize: 12, color: "#374151" }}>{b.check_out}</td>
                        <td style={{ ...tdBase, fontSize: 13, fontWeight: 700, color: NAVY }}>{formatINR(b.original_price)}</td>
                        <td style={tdBase}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>{st.label}</span></td>
                        <td style={{ ...tdBase, fontSize: 11, color: "#94a3b8" }}>{b.last_checked_at ? timeAgo(b.last_checked_at) : "Never"}</td>
                        <td style={tdBase}>
                          <button onClick={() => checkNow(b.id)} disabled={checkingId === b.id}
                            style={{ background: checkingId === b.id ? "#f1f5f9" : "#eff6ff", color: B, border: "1.5px solid #bfdbfe", padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            {checkingId === b.id ? "⏳…" : "Check now"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── OFFERS ── */}
        {tab === "offers" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>All Offers Sent</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Every price drop offer sent to members</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Hotel", "City", "Original Price", "Offer Price", "Customer Saves", "Our Margin", "Status", "Sent"].map(h => (
                      <th key={h} style={thInput}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOffers.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No offers yet</td></tr>
                  ) : recentOffers.map((o, i) => {
                    const st = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={i}>
                        <td style={{ ...tdBase, fontSize: 13, fontWeight: 600, color: NAVY }}>{o.bookings?.hotel_name || "—"}</td>
                        <td style={{ ...tdBase, fontSize: 12, color: "#64748b" }}>{o.bookings?.hotel_city || "—"}</td>
                        <td style={{ ...tdBase, fontSize: 13, color: "#dc2626", textDecoration: "line-through" }}>{formatINR(o.original_price)}</td>
                        <td style={{ ...tdBase, fontSize: 13, fontWeight: 700, color: NAVY }}>{formatINR(o.offer_price)}</td>
                        <td style={tdBase}><span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{formatINR(o.customer_saving)}</span></td>
                        <td style={tdBase}><span style={{ background: "#eff6ff", color: B, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{formatINR(o.our_margin)}</span></td>
                        <td style={tdBase}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{st.label}</span></td>
                        <td style={{ ...tdBase, fontSize: 11, color: "#94a3b8" }}>{timeAgo(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SEND OFFER ── */}
        {tab === "send" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: 28 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Send Manual Offer</div>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>Pick a booking, enter the supplier price you found, and we&apos;ll calculate the margin and send a WhatsApp alert instantly.</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Select booking</label>
                <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: NAVY }}>
                  <option value="">Choose a booking…</option>
                  {bookings.filter(b => b.status === "tracking" || b.status === "drop_found").map(b => (
                    <option key={b.id} value={b.id}>{b.hotel_name} — {b.hotel_city} ({formatINR(b.original_price)})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Supplier price found (₹)</label>
                <input type="number" placeholder="e.g. 21000" value={supplierPrice} onChange={e => setSupplierPrice(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", color: NAVY }} />
                {selectedBookingId && supplierPrice && (() => {
                  const booking = bookings.find(b => b.id === selectedBookingId);
                  if (!booking) return null;
                  const saving = booking.original_price - parseFloat(supplierPrice);
                  const ourMargin = Math.round(saving * 0.5);
                  const customerSaving = saving - ourMargin;
                  return saving > 0 ? (
                    <div style={{ marginTop: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>✅ Price drop detected!</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>Customer saves: <strong>{formatINR(customerSaving)}</strong></div>
                      <div style={{ fontSize: 12, color: "#374151" }}>Our margin: <strong>{formatINR(ourMargin)}</strong></div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#dc2626" }}>
                      ⚠ Supplier price is higher — no saving for customer
                    </div>
                  );
                })()}
              </div>

              <button onClick={sendManualOffer} disabled={sending}
                style={{ width: "100%", background: sending ? "#94a3b8" : "#16a34a", color: "#fff", border: "none", padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "⏳ Sending…" : "📱 Send WhatsApp offer →"}
              </button>
              {sendResult && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: sendResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${sendResult.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`, fontSize: 13, color: sendResult.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                  {sendResult}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{ background: B, borderRadius: 14, padding: 28 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20 }}>How manual offers work</div>
              {[
                { n: "1", title: "Find a better rate", desc: "Search the hotel on any platform — GRN, Booking.com, direct hotel site. Note the price." },
                { n: "2", title: "Select the booking", desc: "Pick the customer's booking from the dropdown. We show their original price." },
                { n: "3", title: "Enter supplier price", desc: "Enter the lower rate you found. We calculate our 50% margin automatically." },
                { n: "4", title: "Send offer", desc: "One click sends a WhatsApp alert to the customer with their savings and offer link." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                  💡 <strong>Pro tip:</strong> Use this during the first few months to manually find deals for your HNI members. Personal service builds trust and converts much better than automated alerts alone.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
