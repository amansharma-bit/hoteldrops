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
  users?: { email: string; name: string; phone: string; whatsapp: string };
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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("leads");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const CSS = "* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', sans-serif; } .tab { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; font-family: inherit; } .tab.active { color: #1447b8; border-bottom: 2px solid #1447b8; font-weight: 600; } .tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; } .tbl th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; border-bottom: 1.5px solid #e2e8f0; background: #f8fafc; } .tbl td { padding: 13px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: top; } .tbl tr:hover td { background: #f8fafc; } .badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }";

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
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (priceChecksRes.data) setPriceChecks(priceChecksRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1.5px solid #e2e8f0" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 4 }}>rebuq<span style={{ color: B }}>.</span> Admin</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Enter your admin password to continue</div>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12, color: NAVY }}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button onClick={handleLogin} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Sign in →
        </button>
      </div>
    </div>
  );

  const W = { maxWidth: 1200, margin: "0 auto", padding: "0 32px" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY }}>rebuq<span style={{ color: B }}>.</span> <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Admin</span></div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={fetchData} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: NAVY }}>
            ↻ Refresh
          </button>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={W}>
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "28px 0 20px" }}>
          {[
            { label: "Total Users", value: users.length, icon: "👤", color: "#eff6ff", border: "#bfdbfe" },
            { label: "Vouchers Submitted", value: bookings.length, icon: "📄", color: "#f0fdf4", border: "#bbf7d0" },
            { label: "Price Checks Run", value: priceChecks.length, icon: "📊", color: "#fefce8", border: "#fde68a" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.color, border: "1.5px solid " + s.border, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, color: NAVY }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "flex", borderBottom: "1.5px solid #e2e8f0" }}>
            {[["leads", "📄 Voucher Leads"], ["users", "👤 Users"], ["price_checks", "📊 Price Checks"]].map(([id, label]) => (
              <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {loading && <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading data...</div>}

            {/* LEADS TAB */}
            {!loading && tab === "leads" && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{bookings.length} vouchers submitted</div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Hotel</th>
                        <th>User ID</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Voucher</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: NAVY }}>{b.hotel_name || "—"}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{b.hotel_address || ""}</div>
                          </td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{b.user_id?.slice(0, 8)}...</td>
                          <td>{b.check_in ? new Date(b.check_in).toLocaleDateString("en-IN") : "—"}</td>
                          <td>{b.check_out ? new Date(b.check_out).toLocaleDateString("en-IN") : "—"}</td>
                          <td>
                            {b.voucher_url
                              ? <a href={b.voucher_url} target="_blank" rel="noopener noreferrer" style={{ color: B, fontWeight: 600, fontSize: 12 }}>View ↗</a>
                              : <span style={{ color: "#94a3b8" }}>—</span>}
                          </td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No vouchers submitted yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* USERS TAB */}
            {!loading && tab === "users" && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{users.length} registered users</div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>WhatsApp</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: NAVY }}>{u.name || "—"}</td>
                          <td>{u.email || "—"}</td>
                          <td>{u.phone || "—"}</td>
                          <td>{(u as any).whatsapp || "—"}</td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No users yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* PRICE CHECKS TAB */}
            {!loading && tab === "price_checks" && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{priceChecks.length} price checks run</div>
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Source</th>
                        <th>Found Price</th>
                        <th>Checked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceChecks.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{p.booking_id?.slice(0, 12)}...</td>
                          <td><span className="badge" style={{ background: "#eff6ff", color: B }}>{p.api_source}</span></td>
                          <td style={{ fontWeight: 700, color: NAVY }}>€{p.found_price}</td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{p.checked_at ? new Date(p.checked_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        </tr>
                      ))}
                      {priceChecks.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No price checks yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
