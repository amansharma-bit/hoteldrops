"use client";

import { useState, useEffect, useCallback } from "react";

const API = "https://hoteldrops-production.up.railway.app/api/admin";
const ADMIN_KEY = "rebuq-admin-2026"; // Change this to your actual key

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

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"overview" | "bookings" | "offers">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackerRunning, setTrackerRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const headers = { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json" };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/dashboard`, { headers });
      const data = await res.json();
      if (data.success) { setStats(data.stats); setRecentOffers(data.recentOffers || []); }
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
    if (tab === "bookings") fetchBookings();
  }, [authed, tab, fetchDashboard, fetchBookings]);

  const runTracker = async () => {
    setTrackerRunning(true);
    await fetch(`${API}/tracker/run`, { method: "POST", headers });
    setTimeout(() => { setTrackerRunning(false); fetchDashboard(); }, 5000);
  };

  const checkNow = async (id: string) => {
    setCheckingId(id);
    await fetch(`${API}/bookings/${id}/check-now`, { method: "POST", headers });
    setTimeout(() => { setCheckingId(null); fetchBookings(); }, 3000);
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1b2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 340, textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>Admin Dashboard</div>
          <input type="password" placeholder="Enter admin password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && password === ADMIN_KEY) setAuthed(true); }}
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #eaeef2", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12 }} />
          <button onClick={() => { if (password === ADMIN_KEY) setAuthed(true); else alert("Wrong password"); }}
            style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer" }}>
            Enter →
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: "📋", color: "#1447b8", bg: "#eff6ff" },
    { label: "Actively Tracking", value: stats?.activeTracking ?? "—", icon: "🔍", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Drops Found", value: stats?.dropsFound ?? "—", icon: "📉", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Rebooked", value: stats?.rebooked ?? "—", icon: "✅", color: "#059669", bg: "#d1fae5" },
    { label: "Revenue Earned", value: stats ? formatINR(stats.totalRevenue) : "—", icon: "💰", color: "#d97706", bg: "#fef3c7" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9", minHeight: "100vh" }}>

      {/* Top nav */}
      <nav style={{ background: "#0d1b2e", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
          <span style={{ fontSize: 11, color: "#4a6278", marginLeft: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={runTracker} disabled={trackerRunning}
            style={{ background: trackerRunning ? "#1a2d42" : "#1447b8", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: trackerRunning ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {trackerRunning ? "⏳ Running…" : "▶ Run Tracker"}
          </button>
          <a href="/" style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>
            ← Site
          </a>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: "0 32px", display: "flex", gap: 4 }}>
        {(["overview", "bookings", "offers"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid #1447b8" : "2px solid transparent", padding: "14px 16px", fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#1447b8" : "#6b7280", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
              {statCards.map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #eaeef2" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af" }}>{s.label}</div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                  </div>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: s.color }}>{loading ? "…" : String(s.value)}</div>
                </div>
              ))}
            </div>

            {/* Recent offers */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaeef2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>Recent Price Drops</div>
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
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading…</td></tr>
                  ) : recentOffers.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No offers yet</td></tr>
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
                  const hasOffer = b.offers && b.offers.length > 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f4f6f9", background: hasOffer ? "#f0fdf4" : "#fff" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#111827", maxWidth: 180 }}>
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
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                    No offers yet — run the tracker to find price drops
                  </td></tr>
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

      </div>
    </div>
  );
}
