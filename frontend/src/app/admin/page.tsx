"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";
const GOLD = "#f59e0b";
const ADMIN_KEY = "REBUQ-2026-ADMIN";

interface Booking {
  id: string; user_id: string; hotel_name: string; hotel_city?: string;
  hotel_address?: string; check_in: string; check_out: string;
  voucher_url?: string; created_at: string; total_price_paid?: number;
  original_price?: number; currency?: string; status?: string;
  ota_name?: string; booking_reference?: string; phone?: string;
  whatsapp_number?: string; email?: string; num_adults?: number;
  num_children?: number; num_rooms?: number; cancellation_policy?: string;
  board_basis_label?: string; liteapi_hotel_id?: string;
  offers?: { id: string; offer_price: number; customer_saving: number; status: string }[];
}
interface User {
  id: string; email: string; name: string; phone: string; whatsapp?: string; created_at: string;
}
interface PriceCheck {
  id: string; booking_id: string; checked_at: string; api_source: string; found_price: number;
}

type Priority = "P1" | "P2" | "P3" | null;
type DropStatus = "pending" | "contacted" | "claimed" | "expired";
type Section = "overview" | "all-bookings" | "price-monitor" | "price-drops";

function fmt(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
function initials(name: string, email: string) {
  if (name?.trim()) return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (email || "?")[0].toUpperCase();
}
function avatarColor(str: string) {
  const colors = [B, "#7c3aed", "#0891b2", "#d97706", "#dc2626", "#16a34a", "#db2777"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function formatINR(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

// Flat minimal SVG icon
const Ico = ({ d, size = 15, color = "#64748b", sw = 1.5 }: { d: string; size?: number; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  overview:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  bookings:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  monitor:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  drops:     "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
  mail:      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone:     "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  chat:      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  location:  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  arrow:     "M9 5l7 7-7 7",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  filter:    "M3 6h18M7 12h10M11 18h2",
  lock:      "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  users:     "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  rupee:     "M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z",
  signout:   "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  refresh:   "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check:     "M5 13l4 4L19 7",
  warning:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  grid:      "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  building:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  tag:       "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
};

const DEMO_BOOKINGS: Booking[] = [
  { id: "b1", user_id: "u1", hotel_name: "Manand Hotel", hotel_city: "Yerevan", hotel_address: "Northern Ave, Yerevan, Armenia", check_in: "2026-06-03", check_out: "2026-06-09", created_at: new Date(Date.now()-7200000).toISOString(), total_price_paid: 6174, status: "upcoming", ota_name: "Agoda", booking_reference: "2013580651", phone: "+91 98765 43210", whatsapp_number: "+91 98765 43210", email: "arjun.mehta@gmail.com", num_adults: 2, num_rooms: 1, cancellation_policy: "free", offers: [{ id: "o1", offer_price: 5420, customer_saving: 754, status: "pending" }] },
  { id: "b2", user_id: "u2", hotel_name: "The Leela Palace", hotel_city: "New Delhi", hotel_address: "Diplomatic Enclave, Chanakyapuri, New Delhi", check_in: "2026-07-15", check_out: "2026-07-18", created_at: new Date(Date.now()-86400000).toISOString(), total_price_paid: 18500, status: "upcoming", ota_name: "Booking.com", booking_reference: "8821934", phone: "+91 87654 32109", email: "priya.sharma@gmail.com", num_adults: 2, num_rooms: 1, cancellation_policy: "free", offers: [{ id: "o2", offer_price: 16200, customer_saving: 2300, status: "contacted" }] },
  { id: "b3", user_id: "u3", hotel_name: "Ibis Styles Goa", hotel_city: "Goa", hotel_address: "Candolim, North Goa, Goa", check_in: "2026-08-20", check_out: "2026-08-25", created_at: new Date(Date.now()-259200000).toISOString(), total_price_paid: 9800, status: "tracking", ota_name: "MakeMyTrip", booking_reference: "NH20240820123", phone: "+91 76543 21098", email: "rohan.kapoor@gmail.com", num_adults: 2, num_rooms: 1, cancellation_policy: "free" },
  { id: "b4", user_id: "u4", hotel_name: "Taj Mahal Palace", hotel_city: "Mumbai", hotel_address: "Apollo Bunder, Colaba, Mumbai", check_in: "2026-04-10", check_out: "2026-04-12", created_at: new Date(Date.now()-2592000000).toISOString(), total_price_paid: 24000, status: "completed", ota_name: "MakeMyTrip", booking_reference: "NH20240410456", phone: "+91 65432 10987", email: "neha.gupta@gmail.com", num_adults: 2, num_rooms: 1, cancellation_policy: "non-refundable" },
  { id: "b5", user_id: "u5", hotel_name: "Radisson Blu", hotel_city: "Bengaluru", hotel_address: "Outer Ring Road, Marathahalli, Bengaluru", check_in: "2026-06-05", check_out: "2026-06-07", created_at: new Date(Date.now()-432000000).toISOString(), total_price_paid: 11200, status: "upcoming", ota_name: "Goibibo", booking_reference: "GH75084256211442", phone: "+91 54321 09876", email: "vikram.singh@gmail.com", num_adults: 2, num_rooms: 1, cancellation_policy: "free" },
];
const DEMO_USERS: User[] = [
  { id: "u1", email: "arjun.mehta@gmail.com",   name: "Arjun Mehta",   phone: "+91 98765 43210", whatsapp: "+91 98765 43210", created_at: new Date(Date.now()-7200000).toISOString() },
  { id: "u2", email: "priya.sharma@gmail.com",  name: "Priya Sharma",  phone: "+91 87654 32109", whatsapp: "+91 87654 32109", created_at: new Date(Date.now()-86400000).toISOString() },
  { id: "u3", email: "rohan.kapoor@gmail.com",  name: "Rohan Kapoor",  phone: "+91 76543 21098", created_at: new Date(Date.now()-259200000).toISOString() },
  { id: "u4", email: "neha.gupta@gmail.com",    name: "Neha Gupta",    phone: "+91 65432 10987", created_at: new Date(Date.now()-2592000000).toISOString() },
  { id: "u5", email: "vikram.singh@gmail.com",  name: "Vikram Singh",  phone: "+91 54321 09876", created_at: new Date(Date.now()-432000000).toISOString() },
];
const DEMO_DROPS = [
  { id: "d1", booking_id: "b1", customer: "Arjun Mehta",  email: "arjun.mehta@gmail.com",  phone: "+91 98765 43210", hotel: "Manand Hotel",     city: "Yerevan, Armenia",   address: "Northern Ave, Yerevan", platform: "Agoda",       ref: "2013580651",    deadline: "2026-05-28", paid: 6174,  newPrice: 5420,  saving: 754,  status: "pending"   as DropStatus, priority: "P1" as Priority, detectedAt: new Date(Date.now()-7200000).toISOString() },
  { id: "d2", booking_id: "b2", customer: "Priya Sharma", email: "priya.sharma@gmail.com", phone: "+91 87654 32109", hotel: "The Leela Palace", city: "New Delhi, India",    address: "Chanakyapuri, New Delhi", platform: "Booking.com", ref: "8821934",       deadline: "2026-07-10", paid: 18500, newPrice: 16200, saving: 2300, status: "contacted" as DropStatus, priority: "P2" as Priority, detectedAt: new Date(Date.now()-86400000).toISOString() },
  { id: "d3", booking_id: "b5", customer: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "+91 54321 09876", hotel: "Hyatt Regency",    city: "Chennai, India",     address: "Anna Salai, Chennai",    platform: "Expedia",     ref: "EXP7734521",    deadline: "2026-06-20", paid: 15600, newPrice: 12800, saving: 2800, status: "claimed"   as DropStatus, priority: "P1" as Priority, detectedAt: new Date(Date.now()-259200000).toISOString() },
];

const PRIORITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  P1: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  P2: { bg: "#fefce8", color: "#d97706", border: "#fde68a" },
  P3: { bg: "#eff6ff", color: B,         border: "#bfdbfe" },
};
const DROP_STATUS_COLORS: Record<DropStatus, { bg: string; color: string }> = {
  pending:   { bg: "#fef3c7", color: "#d97706" },
  contacted: { bg: "#dbeafe", color: B },
  claimed:   { bg: "#dcfce7", color: "#16a34a" },
  expired:   { bg: "#f1f5f9", color: "#64748b" },
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [section, setSection] = useState<Section>("overview");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drops, setDrops] = useState(DEMO_DROPS);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [isDemo, setIsDemo] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dropStatusFilter, setDropStatusFilter] = useState("all");
  const [priorities, setPriorities] = useState<Record<string, Priority>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  async function fetchData() {
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        supabase.from("bookings").select("*, offers(id,offer_price,customer_saving,status)").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
      ]);
      const usrs: User[] = uRes.data || [];
      if (bRes.data?.length) {
        setBookings(bRes.data); setUsers(usrs);
        const map: Record<string, User> = {};
        usrs.forEach(u => { map[u.id] = u; });
        setUserMap(map);
      } else {
        setBookings(DEMO_BOOKINGS); setUsers(DEMO_USERS);
        const map: Record<string, User> = {};
        DEMO_USERS.forEach(u => { map[u.id] = u; });
        setUserMap(map); setIsDemo(true);
      }
    } catch {
      setBookings(DEMO_BOOKINGS); setUsers(DEMO_USERS);
      const map: Record<string, User> = {};
      DEMO_USERS.forEach(u => { map[u.id] = u; });
      setUserMap(map); setIsDemo(true);
    }
    setLoading(false);
  }

  function handleLogin() {
    setLoginLoading(true);
    setTimeout(() => {
      if (accessKey === ADMIN_KEY && password.length >= 6) {
        setAuthed(true); setLoginError("");
      } else {
        setLoginError("Invalid credentials. Please check your access key and password.");
      }
      setLoginLoading(false);
    }, 800);
  }

  function copyText(t: string) { navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(null), 1500); }
  const setPriority = (id: string, p: Priority) => setPriorities(prev => ({ ...prev, [id]: p }));
  const setDropStatus = (id: string, s: DropStatus) => setDrops(prev => prev.map(d => d.id === id ? { ...d, status: s } : d));

  // Helper: get phone for a booking — prefer booking-level phone, fallback to userMap
  function getPhone(b: Booking) {
    return b.whatsapp_number || b.phone || userMap[b.user_id]?.whatsapp || userMap[b.user_id]?.phone || "";
  }
  function getEmail(b: Booking) {
    return b.email || userMap[b.user_id]?.email || "";
  }

  const totalCustomers = users.length;
  const activeMonitors = bookings.filter(b => ["tracking", "upcoming"].includes(b.status || "")).length;
  const pendingDrops = drops.filter(d => d.status === "pending").length;
  const totalSavings = drops.reduce((s, d) => s + d.saving, 0);
  const p1Count = drops.filter(d => d.priority === "P1").length;
  const p2Count = drops.filter(d => d.priority === "P2").length;
  const p3Count = drops.filter(d => d.priority === "P3").length;

  const filteredBookings = bookings.filter(b => {
    const u = userMap[b.user_id];
    const q = search.toLowerCase();
    const matchSearch = !q || (b.hotel_name||"").toLowerCase().includes(q) || (getEmail(b)).toLowerCase().includes(q) || (u?.name||"").toLowerCase().includes(q) || (b.booking_reference||"").toLowerCase().includes(q) || (b.hotel_city||"").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const bp = priorities[b.id];
    const matchPriority = priorityFilter === "all" || bp === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const filteredDrops = drops.filter(d => dropStatusFilter === "all" || d.status === dropStatusFilter);

  const SIDEBAR_ITEMS = [
    { key: "overview"      as Section, label: "Overview",      icon: ICONS.overview  },
    { key: "all-bookings"  as Section, label: "All Bookings",  icon: ICONS.bookings  },
    { key: "price-monitor" as Section, label: "Price Monitor", icon: ICONS.monitor   },
    { key: "price-drops"   as Section, label: "Price Drops",   icon: ICONS.drops     },
  ];

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'Inter',sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap'); .inp { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 13px 16px; font-size: 15px; font-family: inherit; outline: none; color: ${NAVY}; background: #fff; width: 100%; transition: border-color 0.15s; } .inp:focus { border-color: ${B}; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }`}</style>
      <div style={{ background: "linear-gradient(160deg,#0c1535 0%,#0f172a 50%,#1a2a5e 100%)", padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 4 }}>rebuq<span style={{ color: GOLD }}>.</span></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 48 }}>ADMIN CONSOLE</div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 14 }}>
            Manage every<br />booking, drop<br /><span style={{ color: GOLD }}>& customer.</span>
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 320, marginBottom: 40 }}>
            The rebuq operations hub — monitor live price drops, prioritize customer cases, and take action in real time.
          </p>
          {[
            { icon: ICONS.monitor, text: "Live booking & price drop dashboard" },
            { icon: ICONS.users,   text: "Customer management & P1/P2/P3 tagging" },
            { icon: ICONS.drops,   text: "Real-time price monitor alerts" },
            { icon: ICONS.shield,  text: "Secure team-only access" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Ico d={f.icon} size={14} color="#64748b" />
              <span style={{ fontSize: 13.5, color: "#64748b" }}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "#334155" }}>© 2026 rebuq. Internal use only.</div>
      </div>
      <div style={{ background: "#f4f6f9", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "48px 56px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Admin Sign In</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>rebuq operations panel</div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 7 }}>Team Email</label>
              <input className="inp" type="email" placeholder="you@rebuq.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 7 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <Ico d={ICONS.eye} size={16} color="#94a3b8" />
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 7 }}>Admin Access Key</label>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showKey ? "text" : "password"} placeholder="REBUQ-XXXX-XXXX" value={accessKey} onChange={e => setAccessKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  <Ico d={ICONS.eye} size={16} color="#94a3b8" />
                </button>
              </div>
            </div>
            {loginError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{loginError}</div>}
            <button onClick={handleLogin} disabled={loginLoading} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 700, cursor: loginLoading ? "wait" : "pointer", fontFamily: "inherit" }}>
              {loginLoading ? "Verifying…" : "Access Admin Panel →"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>← Back to home</a>
            <a href="/signin" style={{ color: B, textDecoration: "none", fontWeight: 600 }}>Member login →</a>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f8", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .inp { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-family: inherit; outline: none; color: ${NAVY}; background: #fff; }
        .inp:focus { border-color: ${B}; }
        .card { background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0; }
        .filter-pill { padding: 6px 14px; border-radius: 100px; border: 1.5px solid #e2e8f0; font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: inherit; background: #fff; color: ${NAVY}; transition: all 0.15s; white-space: nowrap; }
        .filter-pill.active { background: ${B}; color: #fff; border-color: ${B}; }
        .filter-pill:hover:not(.active) { border-color: #94a3b8; }
        .action-icon { width: 28px; height: 28px; border-radius: 7px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; transition: all 0.15s; }
        .action-icon:hover { background: #eff6ff; border-color: ${B}; }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 19, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "4px 12px" }}>
          <div style={{ width: 6, height: 6, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>PRICE TRACKER ACTIVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#64748b" }}>
            <Ico d={ICONS.refresh} size={13} color="#64748b" /> Refresh
          </button>
          <button onClick={() => setAuthed(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #fecaca", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#ef4444" }}>
            <Ico d={ICONS.signout} size={13} color="#ef4444" /> Sign out
          </button>
        </div>
      </nav>

      {/* HEADER BAND */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1447b8 60%,#2563eb 100%)", padding: "22px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 2 }}>rebuq Operations</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Manage bookings, track prices, connect with customers</div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {[
              { label: "CUSTOMERS", val: totalCustomers },
              { label: "ACTIVE MONITORS", val: activeMonitors },
              { label: "PENDING DROPS", val: pendingDrops },
              { label: "TOTAL SAVINGS", val: formatINR(totalSavings) },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{loading ? "—" : s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 60px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <div style={{ position: "sticky", top: 72 }}>
          <div className="card" style={{ overflow: "hidden", marginBottom: 14 }}>
            {SIDEBAR_ITEMS.map((item, i) => (
              <button key={item.key} onClick={() => setSection(item.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", border: "none", background: section === item.key ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: section === item.key ? 600 : 400, color: section === item.key ? B : "#475569", borderBottom: i < SIDEBAR_ITEMS.length - 1 ? "1px solid #f8fafc" : "none", borderLeft: section === item.key ? `3px solid ${B}` : "3px solid transparent" }}>
                <Ico d={item.icon} size={14} color={section === item.key ? B : "#94a3b8"} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>PRIORITY</div>
            {[{ label: "P1 Urgent", val: p1Count, color: "#dc2626" }, { label: "P2 High", val: p2Count, color: "#d97706" }, { label: "P3 Normal", val: p3Count, color: B }].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div>
          {isDemo && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <Ico d={ICONS.warning} size={13} color="#d97706" sw={2} />
              <strong>Demo mode</strong> — showing sample data. Connect Supabase to see real bookings.
            </div>
          )}

          {/* ═══ OVERVIEW ═══ */}
          {section === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { icon: ICONS.bookings, val: bookings.length,    label: "Total Bookings",    sub: `${bookings.filter(b=>b.status==="upcoming").length} upcoming`, color: "#0891b2", bg: "#ecfeff" },
                  { icon: ICONS.monitor,  val: activeMonitors,     label: "Price Monitors",    sub: "actively tracking",                                            color: GOLD,       bg: "#fefce8" },
                  { icon: ICONS.drops,    val: drops.length,       label: "Price Drops",       sub: `${pendingDrops} pending`,                                      color: "#16a34a",  bg: "#f0fdf4" },
                  { icon: ICONS.rupee,    val: formatINR(totalSavings), label: "Savings Found", sub: "across all customers",                                        color: "#7c3aed",  bg: "#faf5ff" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: 18 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Ico d={s.icon} size={16} color={s.color} />
                    </div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pending drops */}
              <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Pending Price Drops</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Customers waiting to be contacted</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: 100 }}>
                    {pendingDrops} pending
                  </span>
                </div>
                {drops.filter(d => d.status === "pending").map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: NAVY }}>{d.customer}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: PRIORITY_COLORS[d.priority!]?.bg, color: PRIORITY_COLORS[d.priority!]?.color }}>● {d.priority}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#64748b" }}>{d.hotel} · Save {formatINR(d.saving)} · Deadline {fmt(d.deadline)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`mailto:${d.email}`} className="action-icon"><Ico d={ICONS.mail} size={13} color="#64748b" /></a>
                      <a href={`tel:${d.phone}`} className="action-icon"><Ico d={ICONS.phone} size={13} color="#64748b" /></a>
                      <a href={`https://wa.me/${d.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="action-icon"><Ico d={ICONS.chat} size={13} color="#16a34a" /></a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent submissions */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Recent Submissions</div>
                {bookings.slice(0, 5).map((b, i) => {
                  const u = userMap[b.user_id];
                  const p = (priorities[b.id] || (i < 2 ? "P1" : i < 4 ? "P2" : "P3")) as Priority;
                  return (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(b.user_id || "x"), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {initials(u?.name || "", getEmail(b))}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: NAVY }}>{u?.name || getEmail(b)} — {b.hotel_name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{b.hotel_city} · {timeAgo(b.created_at)}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: PRIORITY_COLORS[p!]?.bg || "#f1f5f9", color: PRIORITY_COLORS[p!]?.color || "#64748b" }}>● {p}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ ALL BOOKINGS ═══ */}
          {section === "all-bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: NAVY }}>All Bookings</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{filteredBookings.length} bookings</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "7px 12px" }}>
                  <Ico d={ICONS.search} size={14} color="#94a3b8" />
                  <input className="inp" placeholder="Search name, hotel, city, ref..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", width: 220, padding: 0, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 12.5, color: "#64748b" }}>Status:</span>
                {["all","upcoming","tracking","completed","cancelled"].map(f => (
                  <button key={f} className={`filter-pill${statusFilter === f ? " active" : ""}`} onClick={() => setStatusFilter(f)} style={{ textTransform: "capitalize" as const }}>{f}</button>
                ))}
                <div style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 4px" }} />
                <span style={{ fontSize: 12.5, color: "#64748b" }}>Priority:</span>
                {["all","P1","P2","P3"].map(f => (
                  <button key={f} className={`filter-pill${priorityFilter === f ? " active" : ""}`} onClick={() => setPriorityFilter(f)}>{f}</button>
                ))}
              </div>

              {filteredBookings.map(b => {
                const u = userMap[b.user_id];
                const bp = priorities[b.id];
                const phone = getPhone(b);
                const emailAddr = getEmail(b);
                const isExpanded = expandedBooking === b.id;
                const statusColors: Record<string, { bg: string; color: string }> = {
                  upcoming:  { bg: "#dbeafe", color: B },
                  completed: { bg: "#dcfce7", color: "#16a34a" },
                  cancelled: { bg: "#fef2f2", color: "#dc2626" },
                  tracking:  { bg: "#fef3c7", color: "#d97706" },
                };
                const sc = statusColors[b.status || "upcoming"] || statusColors.upcoming;

                return (
                  <div key={b.id} className="card" style={{ marginBottom: 12, overflow: "hidden" }}>
                    {/* Main row */}
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, padding: "16px 20px", alignItems: "center" }}>

                      {/* Customer */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(b.user_id || "x"), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {initials(u?.name || "", emailAddr)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>{u?.name || "Customer"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(b.created_at)}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 4 }}>{emailAddr}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>{phone || "No phone"}</div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <a href={`mailto:${emailAddr}`} className="action-icon"><Ico d={ICONS.mail} size={12} color="#64748b" /></a>
                          {phone && <a href={`tel:${phone}`} className="action-icon"><Ico d={ICONS.phone} size={12} color="#64748b" /></a>}
                          {phone && <a href={`https://wa.me/${phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="action-icon"><Ico d={ICONS.chat} size={12} color="#16a34a" /></a>}
                        </div>
                      </div>

                      {/* Hotel info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>{b.hotel_name}</div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 9px", borderRadius: 100, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{b.status || "upcoming"}</span>
                          <select value={bp || ""} onChange={e => setPriority(b.id, (e.target.value || null) as Priority)}
                            style={{ border: `1.5px solid ${bp ? PRIORITY_COLORS[bp]?.border : "#e2e8f0"}`, borderRadius: 100, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: bp ? PRIORITY_COLORS[bp]?.bg : "#fff", color: bp ? PRIORITY_COLORS[bp]?.color : "#64748b", outline: "none" }}>
                            <option value="">Priority</option>
                            <option value="P1">● P1</option>
                            <option value="P2">● P2</option>
                            <option value="P3">● P3</option>
                          </select>
                        </div>
                        {/* City + address */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                          <Ico d={ICONS.location} size={13} color="#94a3b8" />
                          <div>
                            <div>{b.hotel_city || "—"}</div>
                            {b.hotel_address && <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{b.hotel_address}</div>}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: "4px 16px" }}>
                          {[
                            { label: "Check-in",   val: fmt(b.check_in) },
                            { label: "Check-out",  val: fmt(b.check_out) },
                            { label: "Platform",   val: b.ota_name || "—" },
                            { label: "Amount",     val: b.total_price_paid ? formatINR(b.total_price_paid) : "—" },
                            { label: "Guests",     val: b.num_adults ? `${b.num_adults} adults${b.num_children ? `, ${b.num_children} child` : ''}` : "—" },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>{f.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right col */}
                      <div style={{ textAlign: "right" as const, minWidth: 120 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>Booking Ref</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginBottom: 12 }}>
                          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{b.booking_reference || "—"}</span>
                          {b.booking_reference && <button onClick={() => copyText(b.booking_reference!)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Ico d={ICONS.copy} size={12} color={copied === b.booking_reference ? "#16a34a" : "#94a3b8"} /></button>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, alignItems: "flex-end" }}>
                          <button onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                            style={{ background: isExpanded ? "#f1f5f9" : B, color: isExpanded ? "#64748b" : "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                            <Ico d={ICONS.eye} size={12} color={isExpanded ? "#64748b" : "#fff"} sw={2} /> {isExpanded ? "Close" : "Details"}
                          </button>
                          {b.voucher_url && (
                            <a href={b.voucher_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const }}>
                              Voucher ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #f1f5f9", background: "#fafbfc", padding: "14px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                          {[
                            { label: "Full Address",        val: b.hotel_address || "—" },
                            { label: "Cancellation Policy", val: b.cancellation_policy || "—" },
                            { label: "Board Basis",         val: b.board_basis_label || "—" },
                            { label: "Rooms",               val: b.num_rooms ? `${b.num_rooms} room${b.num_rooms > 1 ? 's' : ''}` : "—" },
                            { label: "liteAPI Hotel ID",    val: b.liteapi_hotel_id || "—" },
                            { label: "Phone",               val: getPhone(b) || "—" },
                            { label: "Email",               val: getEmail(b) || "—" },
                            { label: "Booking Ref",         val: b.booking_reference || "—" },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 12.5, color: NAVY, wordBreak: "break-all" as const }}>{f.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ PRICE MONITOR ═══ */}
          {section === "price-monitor" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: NAVY }}>Price Monitor</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>All bookings tracked for price drops</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                    <div style={{ width: 6, height: 6, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                    {activeMonitors} Active
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "6px 12px" }}>
                    <Ico d={ICONS.search} size={13} color="#94a3b8" />
                    <input className="inp" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", width: 160, padding: 0, fontSize: 13 }} />
                  </div>
                </div>
              </div>

              {bookings.map(b => {
                const u = userMap[b.user_id];
                const offer = b.offers?.[0];
                const bp = priorities[b.id] || "P3" as Priority;
                const phone = getPhone(b);
                const emailAddr = getEmail(b);
                return (
                  <div key={b.id} className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 160px" }}>
                      {/* Customer */}
                      <div style={{ padding: "16px 18px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarColor(b.user_id || "x"), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {initials(u?.name || "", emailAddr)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{u?.name || "Customer"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(b.created_at)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
                          <a href={`mailto:${emailAddr}`} className="action-icon"><Ico d={ICONS.mail} size={12} color="#64748b" /></a>
                          {phone && <a href={`tel:${phone}`} className="action-icon"><Ico d={ICONS.phone} size={12} color="#64748b" /></a>}
                          {phone && <a href={`https://wa.me/${phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="action-icon"><Ico d={ICONS.chat} size={12} color="#16a34a" /></a>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{emailAddr}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{phone || "No phone"}</div>
                      </div>

                      {/* Hotel */}
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY }}>{b.hotel_name}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: offer ? "#dcfce7" : "#dbeafe", color: offer ? "#16a34a" : B }}>{offer ? "Drop found" : "Watching"}</span>
                          <select value={bp || ""} onChange={e => setPriority(b.id, (e.target.value || null) as Priority)}
                            style={{ border: `1.5px solid ${bp ? PRIORITY_COLORS[bp]?.border : "#e2e8f0"}`, borderRadius: 100, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: bp ? PRIORITY_COLORS[bp]?.bg : "#fff", color: bp ? PRIORITY_COLORS[bp]?.color : "#64748b", outline: "none" }}>
                            <option value="P1">● P1</option>
                            <option value="P2">● P2</option>
                            <option value="P3">● P3</option>
                          </select>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                          <Ico d={ICONS.location} size={12} color="#94a3b8" /> {b.hotel_city || "—"}
                        </div>
                        {b.hotel_address && <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 10 }}>{b.hotel_address}</div>}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "4px 14px" }}>
                          {[
                            { label: "Check-in",  val: fmt(b.check_in) },
                            { label: "Platform",  val: b.ota_name || "—" },
                            { label: "Ref",       val: b.booking_reference || "—" },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 3 }}>
                                {f.val}
                                {f.label === "Ref" && b.booking_reference && <button onClick={() => copyText(b.booking_reference!)} style={{ background: "none", border: "none", cursor: "pointer", padding: 1 }}><Ico d={ICONS.copy} size={11} color={copied === b.booking_reference ? "#16a34a" : "#94a3b8"} /></button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ background: "#f8fafc", borderLeft: "1px solid #f1f5f9", padding: "16px 16px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>PAID</div>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: offer ? "#94a3b8" : NAVY, textDecoration: offer ? "line-through" : "none" }}>
                          {b.total_price_paid ? formatINR(b.total_price_paid) : "—"}
                        </div>
                        {offer ? (
                          <>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginTop: 4 }}>NOW</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY }}>{formatINR(offer.offer_price)}</div>
                            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>Save {formatINR(offer.customer_saving)}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Monitoring 24/7</div>
                        )}
                        {b.voucher_url && (
                          <a href={b.voucher_url} target="_blank" rel="noreferrer" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0", borderRadius: 7, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, textDecoration: "none" }}>
                            Voucher ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ PRICE DROPS ═══ */}
          {section === "price-drops" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: NAVY }}>Price Drops</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Detected drops requiring customer action</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: 100 }}>
                  {formatINR(totalSavings)} total savings
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["all","pending","contacted","claimed","expired"].map(f => (
                  <button key={f} className={`filter-pill${dropStatusFilter === f ? " active" : ""}`} onClick={() => setDropStatusFilter(f)} style={{ textTransform: "capitalize" as const }}>{f}</button>
                ))}
              </div>

              {filteredDrops.map(d => {
                const sc = DROP_STATUS_COLORS[d.status];
                const pc = PRIORITY_COLORS[d.priority!] || PRIORITY_COLORS.P3;
                return (
                  <div key={d.id} className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 150px" }}>
                      {/* Customer */}
                      <div style={{ padding: "16px 18px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarColor(d.customer), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {initials(d.customer, d.email)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{d.customer}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Detected {timeAgo(d.detectedAt)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
                          <a href={`mailto:${d.email}`} className="action-icon"><Ico d={ICONS.mail} size={12} color="#64748b" /></a>
                          <a href={`tel:${d.phone}`} className="action-icon"><Ico d={ICONS.phone} size={12} color="#64748b" /></a>
                          <a href={`https://wa.me/${d.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="action-icon"><Ico d={ICONS.chat} size={12} color="#16a34a" /></a>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{d.email}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{d.phone}</div>
                      </div>

                      {/* Hotel + price */}
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY }}>{d.hotel}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{d.status}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: pc.bg, color: pc.color }}>● {d.priority}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Ico d={ICONS.location} size={12} color="#94a3b8" /> {d.city}
                        </div>
                        {d.address && <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 10 }}>{d.address}</div>}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "4px 14px", marginBottom: 12 }}>
                          {[
                            { label: "Platform", val: d.platform },
                            { label: "Ref",      val: d.ref },
                            { label: "Deadline", val: fmt(d.deadline) },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 3 }}>
                                {f.val}
                                {f.label === "Ref" && <button onClick={() => copyText(f.val)} style={{ background: "none", border: "none", cursor: "pointer", padding: 1 }}><Ico d={ICONS.copy} size={11} color={copied === f.val ? "#16a34a" : "#94a3b8"} /></button>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Price comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "#f8fafc", borderRadius: 9, padding: "10px 14px" }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>PAID</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(d.paid)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>NEW PRICE</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: NAVY }}>{formatINR(d.newPrice)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>SAVE</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{formatINR(d.saving)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Status updater */}
                      <div style={{ padding: "16px 14px", borderLeft: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 }}>UPDATE STATUS</div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                          {(["pending","contacted","claimed","expired"] as DropStatus[]).map(s => (
                            <button key={s} onClick={() => setDropStatus(d.id, s)}
                              style={{ border: "1.5px solid", borderRadius: 8, padding: "7px 10px", fontSize: 12.5, fontWeight: d.status === s ? 700 : 500, cursor: "pointer", fontFamily: "inherit", background: d.status === s ? B : "#fff", color: d.status === s ? "#fff" : NAVY, borderColor: d.status === s ? B : "#e2e8f0", textTransform: "capitalize" as const, textAlign: "left" as const }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>© 2026 rebuq. All rights reserved.</span>
      </footer>
    </div>
  );
}
