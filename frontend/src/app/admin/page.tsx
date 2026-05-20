"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const B = "#1447b8";
const NAVY = "#0f172a";
const ADMIN_PASSWORD = "rebuq-admin-2026";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  id: string;
  user_id: string;
  hotel_name: string;
  hotel_address: string;
  check_in: string;
  check_out: string;
  voucher_url: string;
  created_at: string;
  original_price?: number;
  currency?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  created_at: string;
}

interface PriceCheck {
  id: string;
  booking_id: string;
  checked_at: string;
  api_source: string;
  found_price: number;
}

function fmt(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

function nightsCount(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return null;
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

function initials(name: string, email: string) {
  if (name && name.trim()) return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (email || "?")[0].toUpperCase();
}

function avatarColor(str: string) {
  const colors = ["#1447b8", "#7c3aed", "#0891b2", "#d97706", "#dc2626", "#16a34a", "#db2777"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function urgencyBadge(checkIn: string) {
  const d = daysUntil(checkIn);
  if (d === null) return null;
  if (d < 0) return { label: "Past", bg: "#f1f5f9", color: "#94a3b8" };
  if (d <= 7) return { label: d === 0 ? "Today!" : d + "d left", bg: "#fef2f2", color: "#dc2626" };
  if (d <= 30) return { label: d + "d left", bg: "#fefce8", color: "#d97706" };
  return { label: d + "d left", bg: "#f0fdf4", color: "#16a34a" };
}

function downloadCSV(bookings: Booking[], userMap: Record<string, User>) {
  const rows = [["#", "Hotel", "Address", "Guest Name", "Email", "Phone", "WhatsApp", "Check-in", "Check-out", "Nights", "Days Until", "Submitted"]];
  bookings.forEach((b, i) => {
    const u = userMap[b.user_id];
    const n = nightsCount(b.check_in, b.check_out);
    const d = daysUntil(b.check_in);
    rows.push([
      String(i + 1), b.hotel_name || "", b.hotel_address || "",
      u?.name || "", u?.email || "", u?.phone || "", (u as any)?.whatsapp || "",
      fmt(b.check_in), fmt(b.check_out),
      n ? String(n) : "", d !== null ? String(d) : "",
      fmt(b.created_at)
    ]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "rebuq-leads.csv"; a.click();
}

const CSS = "* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', sans-serif; } .tab { padding: 14px 24px; border: none; background: none; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; font-family: inherit; white-space: nowrap; transition: all .15s; } .tab.active { color: #1447b8; border-bottom: 2px solid #1447b8; font-weight: 700; } .tab:hover:not(.active) { color: #0f172a; } .tbl { width: 100%; border-collapse: collapse; font-size: 13px; } .tbl th { padding: 11px 14px; text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; border-bottom: 1.5px solid #f1f5f9; background: #fafbfc; white-space: nowrap; } .tbl td { padding: 13px 14px; border-bottom: 1px solid #f8fafc; color: #1e293b; vertical-align: middle; } .tbl tr:last-child td { border-bottom: none; } .tbl tr:hover td { background: #fafbfc; } .badge { display: inline-block; padding: 3px 9px; border-radius: 100px; font-size: 11px; font-weight: 700; } .hot { background: #fef2f2 !important; } .warm { background: #fefce8 !important; } .inp { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 14px; font-size: 13.5px; font-family: inherit; outline: none; color: #0f172a; background: #fff; width: 100%; } .inp:focus { border-color: #1447b8; } .stat-card { background: #fff; border-radius: 14px; padding: 22px 24px; border: 1.5px solid #e2e8f0; } .btn { border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s; }";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("leads");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  async function fetchData() {
    setLoading(true);
    try {
      const [bRes, uRes, pRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("price_checks").select("*").order("checked_at", { ascending: false }),
      ]);
      const usrs: User[] = uRes.data || [];
      setBookings(bRes.data || []);
      setUsers(usrs);
      setPriceChecks(pRes.data || []);
      const map: Record<string, User> = {};
      usrs.forEach(u => { map[u.id] = u; });
      setUserMap(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setLoginError(""); }
    else setLoginError("Incorrect password");
  }

  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 44px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6 }}>rebuq<span style={{ color: B }}>.</span></div>
        <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32 }}>Enter your password to access leads & analytics</div>
        <input className="inp" type="password" placeholder="Admin password" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ marginBottom: 12 }} />
        {loginError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{loginError}</div>}
        <button className="btn" onClick={handleLogin} style={{ width: "100%", background: B, color: "#fff", padding: 13, fontSize: 14 }}>Sign in →</button>
      </div>
    </div>
  );

  const today = new Date();
  const todayLeads = bookings.filter(b => { const d = new Date(b.created_at); return d.getDate() === today.getDate() && d.getMonth() === today.getMonth(); }).length;
  const hotLeads = bookings.filter(b => { const d = daysUntil(b.check_in); return d !== null && d >= 0 && d <= 30; }).length;
  const uniqueHotels = new Set(bookings.map(b => b.hotel_name).filter(Boolean)).size;
  const potentialRevenue = bookings.length * 2800;

  const filteredBookings = bookings.filter(b => {
    const u = userMap[b.user_id];
    const q = search.toLowerCase();
    const matchSearch = !q || (b.hotel_name || "").toLowerCase().includes(q) || (u?.email || "").toLowerCase().includes(q) || (u?.name || "").toLowerCase().includes(q) || (u?.phone || "").includes(q);
    const d = daysUntil(b.check_in);
    const matchFilter = filter === "all" || (filter === "hot" && d !== null && d >= 0 && d <= 7) || (filter === "warm" && d !== null && d > 7 && d <= 30) || (filter === "today" && (() => { const bd = new Date(b.created_at); return bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth(); })());
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav style={{ background: NAVY, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>
          rebuq<span style={{ color: "#60a5fa" }}>.</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: 10 }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={() => downloadCSV(filteredBookings, userMap)} style={{ background: "#16a34a", color: "#fff" }}>⬇ Export CSV</button>
          <button className="btn" onClick={fetchData} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>↻ Refresh</button>
          <button className="btn" onClick={() => setAuthed(false)} style={{ background: "none", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 60px" }}>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Users", value: users.length, sub: "signed up", icon: "👤", color: B },
            { label: "Total Leads", value: bookings.length, sub: "vouchers submitted", icon: "📄", color: "#16a34a" },
            { label: "Today's Leads", value: todayLeads, sub: "submitted today", icon: "🔥", color: "#d97706" },
            { label: "Hot Leads", value: hotLeads, sub: "check-in within 30d", icon: "⚡", color: "#dc2626" },
            { label: "Est. Revenue Potential", value: "₹" + (potentialRevenue / 1000).toFixed(0) + "K", sub: "avg ₹2,800 saving/booking", icon: "💰", color: "#7c3aed" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>LIVE</span>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN TABLE CARD */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

          {/* TABS + SEARCH */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px solid #f1f5f9", padding: "0 16px 0 0" }}>
            <div style={{ display: "flex" }}>
              {[["leads", "Voucher Leads", bookings.length], ["users", "Users", users.length], ["price_checks", "Price Checks", priceChecks.length]].map(([id, label, count]) => (
                <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => setTab(id as string)}>
                  {label}
                  <span style={{ marginLeft: 7, background: tab === id ? "#eff6ff" : "#f1f5f9", color: tab === id ? B : "#94a3b8", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 100 }}>{count}</span>
                </button>
              ))}
            </div>
            {tab === "leads" && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input className="inp" placeholder="Search hotel, name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: NAVY, background: "#fff", cursor: "pointer", outline: "none" }}>
                  <option value="all">All Leads</option>
                  <option value="today">Today</option>
                  <option value="hot">Hot (within 7d)</option>
                  <option value="warm">Warm (7-30d)</option>
                </select>
              </div>
            )}
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontSize: 14 }}>Loading data...</div>}

          {/* LEADS TABLE */}
          {!loading && tab === "leads" && (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Guest</th>
                    <th>Contact</th>
                    <th>Hotel</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Nights</th>
                    <th>Urgency</th>
                    <th>Voucher</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, idx) => {
                    const u = userMap[b.user_id];
                    const d = daysUntil(b.check_in);
                    const urgency = urgencyBadge(b.check_in);
                    const isHot = d !== null && d >= 0 && d <= 7;
                    const isWarm = d !== null && d > 7 && d <= 30;
                    const n = nightsCount(b.check_in, b.check_out);
                    const av = initials(u?.name || "", u?.email || "");
                    const avColor = avatarColor(b.user_id || "x");
                    return (
                      <tr key={b.id} className={isHot ? "hot" : isWarm ? "warm" : ""}>
                        <td style={{ color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: avColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{av}</div>
                            <div>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13.5 }}>{u?.name || "Unknown"}</div>
                              <div style={{ fontSize: 11.5, color: "#64748b" }}>{u?.email || b.user_id?.slice(0, 12) + "..."}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u?.phone && <div style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>📞 {u.phone}</div>}
                          {(u as any)?.whatsapp && <div style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>💬 {(u as any).whatsapp}</div>}
                          {!u?.phone && !((u as any)?.whatsapp) && <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: NAVY, fontSize: 13.5, maxWidth: 200 }}>{b.hotel_name || "—"}</div>
                          {b.hotel_address && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>📍 {b.hotel_address}</div>}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{fmt(b.check_in)}</td>
                        <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{fmt(b.check_out)}</td>
                        <td><span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>{n ? n + "N" : "—"}</span></td>
                        <td>
                          {urgency && <span className="badge" style={{ background: urgency.bg, color: urgency.color }}>{urgency.label}</span>}
                        </td>
                        <td>
                          {b.voucher_url
                            ? <a href={b.voucher_url} target="_blank" rel="noopener noreferrer" style={{ color: B, fontWeight: 600, fontSize: 12, textDecoration: "none" }}>View PDF ↗</a>
                            : <span style={{ color: "#cbd5e1", fontSize: 12 }}>Not uploaded</span>}
                        </td>
                        <td style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{fmt(b.created_at)}</td>
                      </tr>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0", fontSize: 14 }}>No leads found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* USERS TABLE */}
          {!loading && tab === "users" && (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>WhatsApp</th>
                    <th>Vouchers</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    const av = initials(u.name, u.email);
                    const avColor = avatarColor(u.id);
                    const vCount = bookings.filter(b => b.user_id === u.id).length;
                    return (
                      <tr key={u.id}>
                        <td style={{ color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: avColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{av}</div>
                            <div style={{ fontWeight: 700, color: NAVY }}>{u.name || "—"}</div>
                          </div>
                        </td>
                        <td style={{ color: "#475569" }}>{u.email || "—"}</td>
                        <td style={{ color: "#475569", fontWeight: 500 }}>{u.phone || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td style={{ color: "#16a34a", fontWeight: 600 }}>{(u as any).whatsapp || <span style={{ color: "#cbd5e1", fontWeight: 400 }}>—</span>}</td>
                        <td>
                          <span className="badge" style={{ background: vCount > 0 ? "#eff6ff" : "#f1f5f9", color: vCount > 0 ? B : "#94a3b8" }}>
                            {vCount} {vCount === 1 ? "voucher" : "vouchers"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{fmt(u.created_at)}</td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0" }}>No users yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* PRICE CHECKS TABLE */}
          {!loading && tab === "price_checks" && (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hotel</th>
                    <th>Guest</th>
                    <th>Source</th>
                    <th>Found Price</th>
                    <th>Checked At</th>
                  </tr>
                </thead>
                <tbody>
                  {priceChecks.map((p, idx) => {
                    const booking = bookings.find(b => b.id === p.booking_id);
                    const user = booking ? userMap[booking.user_id] : null;
                    return (
                      <tr key={p.id}>
                        <td style={{ color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: NAVY }}>{booking?.hotel_name || <span style={{ color: "#94a3b8", fontSize: 12 }}>{p.booking_id?.slice(0, 10)}...</span>}</td>
                        <td>
                          {user ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name || "—"}</div>
                              <div style={{ fontSize: 11.5, color: "#64748b" }}>{user.email}</div>
                            </div>
                          ) : "—"}
                        </td>
                        <td><span className="badge" style={{ background: "#eff6ff", color: B }}>{p.api_source}</span></td>
                        <td style={{ fontWeight: 800, color: NAVY, fontSize: 16 }}>€{p.found_price}</td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{fmt(p.checked_at)}</td>
                      </tr>
                    );
                  })}
                  {priceChecks.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0" }}>No price checks yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
