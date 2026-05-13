"use client";

import { useState, useEffect, useCallback } from "react";

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
  expired:    { bg: "#f4f6f9", color: "#9ca3af", label: "Expired" },
  no_drop:    { bg: "#f4f6f9", color: "#9ca3af", label: "No drop yet" },
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

// Simple bar chart component
function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${(v / max) * 56}px`, opacity: i === data.length - 1 ? 1 : 0.4, transition: "height 0.3s", minHeight: v > 0 ? 4 : 0 }} />
        </div>
      ))}
    </div>
  );
}

// Funnel component
function Funnel({ steps }: { steps: { label: string; value: number; color: string; icon: string }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{s.icon}</span> {s.label}
            </div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>{s.value}</div>
          </div>
          <div style={{ background: "#f4f6f9", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(s.value / max) * 100}%`, background: s.color, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          {i < steps.length - 1 && (
            <div style={{ textAlign: "center", fontSize: 10, color: "#d1d5db", marginTop: 2 }}>
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
  const [activityFeed, setActivityFeed] = useState<{ icon: string; text: string; time: string; color: string }[]>([]);

  // Manual offer sender state
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
        // Build activity feed from recent offers
        const feed = (data.recentOffers || []).slice(0, 8).map((o: Offer) => ({
          icon: o.status === "rebooked" ? "✅" : o.status === "accepted" ? "🎉" : "📉",
          text: `Price drop found for ${o.bookings?.hotel_name || "hotel"} — ${formatINR(o.customer_saving)} saved`,
          time: timeAgo(o.created_at),
          color: o.status === "rebooked" ? "#16a34a" : "#1447b8",
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
    setActivityFeed(prev => [{ icon: "▶", text: "Price tracker started manually", time: "just now", color: "#7c3aed" }, ...prev]);
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
        setActivityFeed(prev => [{ icon: "📱", text: `Manual offer sent — WhatsApp delivered`, time: "just now", color: "#16a34a" }, ...prev]);
        fetchDashboard();
      } else {
        setSendResult(`❌ Error: ${data.error}`);
      }
    } catch (e) { setSendResult("❌ Failed to send offer"); }
    setSending(false);
  };

  // City breakdown from bookings
  const cityBreakdown = bookings.reduce((acc, b) => {
    acc[b.hotel_city] = (acc[b.hotel_city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Fake weekly data for chart (replace with real data when available)
  const weeklyBookings = [2, 5, 3, 8, 4, 6, stats?.totalBookings || 3];
  const weeklyDrops = [0, 1, 1, 2, 1, 2, stats?.dropsFound || 1];

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1b2e", display: "flex", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 48 }}>
            rebuq<span style={{ color: "#1447b8" }}>.</span>
          </div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 40, fontWeight: 700, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16 }}>
            AI-powered<br />price monitoring<br /><span style={{ color: "#FCD34D" }}>for hotel bookings.</span>
          </div>
          <p style={{ fontSize: 14, color: "#4a6278", lineHeight: 1.8, maxWidth: 400, marginBottom: 48 }}>
            Every 6 hours, our AI scans live hotel rates across global suppliers. When a price drops, your members get a WhatsApp alert instantly.
          </p>
          <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
            {[{ num: "6hrs", label: "Check frequency" }, { num: "24/7", label: "Monitoring active" }, { num: "₹0", label: "Cost to member" }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: "#1447b8" }}>{s.num}</div>
                <div style={{ fontSize: 11, color: "#4a6278", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["🤖 Claude AI extraction", "📱 WhatsApp alerts", "📊 Live Supabase DB", "🔄 Auto price tracking"].map((f, i) => (
              <div key={i} style={{ background: "rgba(20,71,184,0.15)", border: "1px solid rgba(20,71,184,0.3)", color: "#7eb3ff", fontSize: 12, padding: "6px 14px", borderRadius: 20 }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ width: 460, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ background: "#111d2e", borderRadius: 20, padding: "40px 36px", width: "100%", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 13, color: "#4a6278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Admin Access</div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 28 }}>Sign in to dashboard</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4a6278", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Email</div>
              <input type="email" placeholder="admin@rebuq.com"
                style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4a6278", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Password</div>
              <input type="password" placeholder="Enter admin password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && password === ADMIN_KEY) setAuthed(true); }}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
            </div>
            <button onClick={() => { if (password === ADMIN_KEY) setAuthed(true); else alert("Wrong password"); }}
              style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 16 }}>
              Sign in →
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "#2a3f52" }}>🔒 Restricted access · rebuq internal only</div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: "📋", color: "#1447b8", bg: "#eff6ff", trend: "+12% this week" },
    { label: "Actively Tracking", value: stats?.activeTracking ?? "—", icon: "🔍", color: "#7c3aed", bg: "#f5f3ff", trend: "Live now" },
    { label: "Drops Found", value: stats?.dropsFound ?? "—", icon: "📉", color: "#16a34a", bg: "#f0fdf4", trend: "Avg 28% drop" },
    { label: "Rebooked", value: stats?.rebooked ?? "—", icon: "✅", color: "#059669", bg: "#d1fae5", trend: "100% success rate" },
    { label: "Revenue Earned", value: stats ? formatINR(stats.totalRevenue) : "—", icon: "💰", color: "#d97706", bg: "#fef3c7", trend: "Gross margin" },
  ];

  const funnelSteps = [
    { label: "Bookings uploaded", value: stats?.totalBookings || 0, color: "#1447b8", icon: "📤" },
    { label: "Actively tracking", value: stats?.activeTracking || 0, color: "#7c3aed", icon: "🔍" },
    { label: "Price drops found", value: stats?.dropsFound || 0, color: "#f59e0b", icon: "📉" },
    { label: "Offers accepted", value: stats?.rebooked || 0, color: "#16a34a", icon: "✅" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9", minHeight: "100vh" }}>

      {/* Top nav */}
      <nav style={{ background: "#0d1b2e", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
          <span style={{ fontSize: 11, color: "#4a6278", marginLeft: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {trackerRunning && (
            <div style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Tracker running…
            </div>
          )}
          <button onClick={runTracker} disabled={trackerRunning}
            style={{ background: trackerRunning ? "#1a2d42" : "#1447b8", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: trackerRunning ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {trackerRunning ? "⏳ Running…" : "▶ Run Tracker"}
          </button>
          <a href="/" target="_blank" style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>
            ↗ Site
          </a>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: "0 32px", display: "flex", gap: 4 }}>
        {[
          { key: "overview", label: "Overview" },
          { key: "bookings", label: "Bookings" },
          { key: "offers", label: "Offers" },
          { key: "send", label: "Send Offer" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ background: "none", border: "none", borderBottom: tab === t.key ? "2px solid #1447b8" : "2px solid transparent", padding: "14px 16px", fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "#1447b8" : "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
            {t.key === "send" && <span style={{ background: "#1447b8", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 20, marginLeft: 6 }}>NEW</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
              {statCards.map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #eaeef2" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af" }}>{s.label}</div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                  </div>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 30, fontWeight: 700, color: s.color, marginBottom: 4 }}>{loading ? "…" : String(s.value)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.trend}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>

              {/* Weekly bookings chart */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #eaeef2" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Bookings this week</div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: "#1447b8", marginBottom: 12 }}>{weeklyBookings.reduce((a, b) => a + b, 0)}</div>
                <BarChart data={weeklyBookings} color="#1447b8" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#d1d5db" }}>{d}</div>
                  ))}
                </div>
              </div>

              {/* Drops found chart */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #eaeef2" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 4 }}>Price drops this week</div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: "#16a34a", marginBottom: 12 }}>{weeklyDrops.reduce((a, b) => a + b, 0)}</div>
                <BarChart data={weeklyDrops} color="#16a34a" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#d1d5db" }}>{d}</div>
                  ))}
                </div>
              </div>

              {/* Conversion funnel */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #eaeef2" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 16 }}>Conversion funnel</div>
                <Funnel steps={funnelSteps} />
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Top cities */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", padding: "20px 22px" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Top cities by bookings</div>
                {topCities.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No bookings yet</div>
                ) : topCities.map(([city, count], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#1447b8", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{city}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1447b8" }}>{count}</span>
                      </div>
                      <div style={{ background: "#f4f6f9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(count / (topCities[0][1])) * 100}%`, background: "#1447b8", borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live activity feed */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: "1px solid #eaeef2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>Live activity</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4ade80" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    Live
                  </div>
                </div>
                <div style={{ padding: "8px 0", maxHeight: 240, overflowY: "auto" }}>
                  {activityFeed.length === 0 ? (
                    <div style={{ padding: "20px 22px", fontSize: 13, color: "#9ca3af" }}>No activity yet — run the tracker</div>
                  ) : activityFeed.map((a, i) => (
                    <div key={i} style={{ padding: "10px 22px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < activityFeed.length - 1 ? "1px solid #f9fafb" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f4f6f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{a.text}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent offers table */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden", marginTop: 14 }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaeef2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700 }}>Recent Price Drops</div>
                <button onClick={fetchDashboard} style={{ background: "none", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Hotel", "City", "Original", "Offer Price", "Customer Saves", "Our Margin", "Status", "Time"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #eaeef2" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
                  ) : recentOffers.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No offers yet — run the tracker to find price drops</td></tr>
                  ) : recentOffers.map((o, i) => {
                    const st = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f4f6f9" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{o.bookings?.hotel_name || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>{o.bookings?.hotel_city || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#dc2626", fontWeight: 600, textDecoration: "line-through" }}>{formatINR(o.original_price)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatINR(o.offer_price)}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{formatINR(o.customer_saving)}</span></td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: "#eff6ff", color: "#1447b8", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{formatINR(o.our_margin)}</span></td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{st.label}</span></td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#9ca3af" }}>{timeAgo(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaeef2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700 }}>All Bookings</div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#374151", fontFamily: "inherit", outline: "none", background: "#fff" }}>
                  <option value="">All statuses</option>
                  {["tracking", "drop_found", "offer_sent", "rebooked", "expired"].map(s => (
                    <option key={s} value={s}>{STATUS_COLORS[s]?.label || s}</option>
                  ))}
                </select>
                <button onClick={fetchBookings} style={{ background: "none", border: "1px solid #eaeef2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Hotel", "City", "Guest", "Check-in", "Check-out", "Price Paid", "Status", "Last Checked", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #eaeef2" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No bookings found</td></tr>
                ) : bookings.map((b, i) => {
                  const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f6f9" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#111827", maxWidth: 160 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.hotel_name}</div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#6b7280" }}>{b.hotel_city}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{b.users?.name || "—"}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.users?.whatsapp_number || b.users?.email || ""}</div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{b.check_in}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{b.check_out}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatINR(b.original_price)}</td>
                      <td style={{ padding: "11px 14px" }}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.label}</span></td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: "#9ca3af" }}>{b.last_checked_at ? timeAgo(b.last_checked_at) : "Never"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <button onClick={() => checkNow(b.id)} disabled={checkingId === b.id}
                          style={{ background: checkingId === b.id ? "#f4f6f9" : "#eff6ff", color: "#1447b8", border: "1px solid #bfdbfe", padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          {checkingId === b.id ? "⏳…" : "Check now"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* OFFERS TAB */}
        {tab === "offers" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaeef2" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700 }}>All Offers Sent</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Every price drop offer sent to members</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Hotel", "City", "Original Price", "Offer Price", "Customer Saves", "Our Margin", "Status", "Sent"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #eaeef2" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOffers.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No offers yet</td></tr>
                ) : recentOffers.map((o, i) => {
                  const st = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f6f9" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{o.bookings?.hotel_name || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>{o.bookings?.hotel_city || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#dc2626", textDecoration: "line-through" }}>{formatINR(o.original_price)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700 }}>{formatINR(o.offer_price)}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{formatINR(o.customer_saving)}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: "#eff6ff", color: "#1447b8", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{formatINR(o.our_margin)}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{st.label}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "#9ca3af" }}>{timeAgo(o.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SEND OFFER TAB */}
        {tab === "send" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", padding: "28px" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Send Manual Offer</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
                Pick a booking, enter the supplier price you found, and we&apos;ll calculate the margin and send a WhatsApp alert instantly.
              </p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 6 }}>Select booking</div>
                <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)}
                  style={{ width: "100%", border: "1px solid #eaeef2", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111827" }}>
                  <option value="">Choose a booking…</option>
                  {bookings.filter(b => b.status === "tracking" || b.status === "drop_found").map(b => (
                    <option key={b.id} value={b.id}>{b.hotel_name} — {b.hotel_city} ({formatINR(b.original_price)})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 6 }}>Supplier price found (₹)</div>
                <input type="number" placeholder="e.g. 21000" value={supplierPrice} onChange={e => setSupplierPrice(e.target.value)}
                  style={{ width: "100%", border: "1px solid #eaeef2", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                {selectedBookingId && supplierPrice && (() => {
                  const booking = bookings.find(b => b.id === selectedBookingId);
                  if (!booking) return null;
                  const saving = booking.original_price - parseFloat(supplierPrice);
                  const ourMargin = Math.round(saving * 0.5);
                  const customerSaving = saving - ourMargin;
                  return saving > 0 ? (
                    <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>✅ Price drop detected!</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>Customer saves: <strong>{formatINR(customerSaving)}</strong></div>
                      <div style={{ fontSize: 12, color: "#374151" }}>Our margin: <strong>{formatINR(ourMargin)}</strong></div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#dc2626" }}>
                      ⚠ Supplier price is higher than original — no saving for customer
                    </div>
                  );
                })()}
              </div>
              <button onClick={sendManualOffer} disabled={sending}
                style={{ width: "100%", background: sending ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "⏳ Sending…" : "📱 Send WhatsApp offer →"}
              </button>
              {sendResult && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: sendResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${sendResult.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`, fontSize: 13, color: sendResult.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                  {sendResult}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{ background: "#0d1b2e", borderRadius: 16, padding: "28px" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>How manual offers work</div>
              {[
                { n: "1", title: "Find a better rate", desc: "Search the hotel on any platform — GRN, Booking.com, direct hotel site. Note the price." },
                { n: "2", title: "Select the booking", desc: "Pick the customer's booking from the dropdown. We show their original price." },
                { n: "3", title: "Enter supplier price", desc: "Enter the lower rate you found. We calculate our 50% margin automatically." },
                { n: "4", title: "Send offer", desc: "One click sends a WhatsApp alert to the customer with their savings and offer link." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1447b8", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "#4a6278", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: "rgba(20,71,184,0.2)", border: "1px solid rgba(20,71,184,0.3)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                <div style={{ fontSize: 12, color: "#7eb3ff", lineHeight: 1.6 }}>
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
