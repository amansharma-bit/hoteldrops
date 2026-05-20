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
  nights?: number;
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

function fmt(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function nights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return "—";
  const diff = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  return diff + (diff === 1 ? " night" : " nights");
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("leads");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  const CSS = "* { box-sizing: border-box; margin: 0; padding: 0; } .tab { padding: 12px 22px; border: none; background: none; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; font-family: inherit; white-space: nowrap; } .tab.active { color: #1447b8; border-bottom: 2px solid #1447b8; font-weight: 700; } .tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; } .tbl th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; border-bottom: 1.5px solid #f1f5f9; background: #fafbfc; } .tbl td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; } .tbl tr:last-child td { border-bottom: none; } .tbl tr:hover td { background: #f8fafc; } .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }";

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  async function fetchData() {
    setLoading(true);
    try {
      const [bookingsRes, usersRes, priceChecksRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("price_checks").select("*").order("checked_at", { ascending: false }),
      ]);
      const usrs = usersRes.data || [];
      setBookings(bookingsRes.data || []);
      setUsers(usrs);
      setPriceChecks(priceChecksRes.data || []);
      const map: Record<string, User> = {};
      usrs.forEach((u: User) => { map[u.id] = u; });
      setUserMap(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setError(""); }
    else setError("Incorrect password");
  }

  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 44px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>rebuq<span style={{ color: B }}>.</span></div>
        <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32 }}>Sign in to view leads and analytics</div>
        <input
          type="password" placeholder="Enter admin password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12, color: NAVY }}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={handleLogin} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Sign in →
        </button>
      </div>
    </div>
  );

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  }).length;

  const uniqueHotels = new Set(bookings.map(b => b.hotel_name)).size;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav style={{ background: NAVY, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>rebuq<span style={{ color: "#60a5fa" }}>.</span> <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin</span></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#fff" }}>
            ↻ Refresh
          </button>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 16px", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 60px" }}>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Users", value: users.length, sub: "registered", color: B, bg: "#eff6ff" },
            { label: "Vouchers Submitted", value: bookings.length, sub: "total leads", color: "#16a34a", bg: "#f0fdf4" },
            { label: "Today's Leads", value: todayBookings, sub: "submitted today", color: "#d97706", bg: "#fefce8" },
            { label: "Unique Hotels", value: uniqueHotels, sub: "being tracked", color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Price Checks", value: priceChecks.length, sub: "checks run", color: "#0891b2", bg: "#ecfeff" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif" }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: NAVY, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN CARD */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {/* TABS */}
          <div style={{ display: "flex", borderBottom: "1.5px solid #f1f5f9", padding: "0 8px" }}>
            {[["leads", "Voucher Leads"], ["users", "Users"], ["price_checks", "Price Checks"]].map(([id, label]) => (
              <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
                {label}
                <span style={{ marginLeft: 8, background: tab === id ? "#eff6ff" : "#f1f5f9", color: tab === id ? B : "#64748b", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 100 }}>
                  {id === "leads" ? bookings.length : id === "users" ? users.length : priceChecks.length}
                </span>
              </button>
            ))}
          </div>

          <div style={{ padding: "0" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontSize: 14 }}>Loading data...</div>
            )}

            {/* LEADS */}
            {!loading && tab === "leads" && (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hotel</th>
                      <th>Guest</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Duration</th>
                      <th>Voucher</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, idx) => {
                      const user = userMap[b.user_id];
                      return (
                        <tr key={b.id}>
                          <td style={{ color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{b.hotel_name || "—"}</div>
                            {b.hotel_address && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>📍 {b.hotel_address}</div>}
                          </td>
                          <td>
                            {user ? (
                              <>
                                <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{user.name || "—"}</div>
                                <div style={{ fontSize: 11.5, color: "#64748b" }}>{user.email}</div>
                                {user.whatsapp && <div style={{ fontSize: 11.5, color: "#16a34a" }}>📱 {user.whatsapp}</div>}
                              </>
                            ) : (
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>{b.user_id?.slice(0, 10)}...</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{fmt(b.check_in)}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(b.check_out)}</td>
                          <td>
                            <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>{nights(b.check_in, b.check_out)}</span>
                          </td>
                          <td>
                            {b.voucher_url
                              ? <a href={b.voucher_url} target="_blank" rel="noopener noreferrer" style={{ color: B, fontWeight: 600, fontSize: 12, textDecoration: "none" }}>View PDF ↗</a>
                              : <span style={{ color: "#cbd5e1", fontSize: 12 }}>Not uploaded</span>}
                          </td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{fmt(b.created_at)}</td>
                        </tr>
                      );
                    })}
                    {bookings.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0", fontSize: 14 }}>No vouchers submitted yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* USERS */}
            {!loading && tab === "users" && (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>WhatsApp</th>
                      <th>Vouchers</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id}>
                        <td style={{ color: "#94a3b8", fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: NAVY }}>{u.name || "—"}</td>
                        <td style={{ color: "#475569" }}>{u.email || "—"}</td>
                        <td style={{ color: "#475569" }}>{u.phone || "—"}</td>
                        <td style={{ color: "#16a34a", fontWeight: 600 }}>{(u as any).whatsapp || "—"}</td>
                        <td>
                          <span className="badge" style={{ background: "#eff6ff", color: B }}>
                            {bookings.filter(b => b.user_id === u.id).length} vouchers
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{fmt(u.created_at)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0", fontSize: 14 }}>No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PRICE CHECKS */}
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
                              <>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name || "—"}</div>
                                <div style={{ fontSize: 11.5, color: "#64748b" }}>{user.email}</div>
                              </>
                            ) : "—"}
                          </td>
                          <td><span className="badge" style={{ background: "#eff6ff", color: B }}>{p.api_source}</span></td>
                          <td style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>€{p.found_price}</td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{fmtTime(p.checked_at)}</td>
                        </tr>
                      );
                    })}
                    {priceChecks.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0", fontSize: 14 }}>No price checks yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
