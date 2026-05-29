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

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  id: string; user_id: string; hotel_name: string; hotel_city?: string;
  hotel_address?: string; check_in: string; check_out: string;
  voucher_url?: string; created_at: string; original_price?: number;
  currency?: string; status?: string; platform?: string; ref_no?: string;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return `${m} month${m > 1 ? "s" : ""} ago`;
}
function nightsCount(ci: string, co: string) {
  if (!ci || !co) return 0;
  return Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
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

// ── SVG Icon ──────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, color = "#64748b", sw = 1.5 }: { d: string; size?: number; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  bookings:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  monitor:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  drops:     "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
  mail:      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone:     "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  chat:      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  location:  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  eye:       "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  arrow:     "M9 5l7 7-7 7",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  filter:    "M3 4h18M7 8h10M11 12h2M13 16h-2",
  lock:      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  shield:    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  users:     "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  rupee:     "M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z",
  signout:   "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  refresh:   "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  download:  "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  check:     "M5 13l4 4L19 7",
  warning:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  grid:      "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
};

// ── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_BOOKINGS: Booking[] = [
  { id: "b1", user_id: "u1", hotel_name: "Manand Hotel", hotel_city: "Yerevan, Armenia", check_in: "2026-06-03", check_out: "2026-06-09", created_at: new Date(Date.now()-7200000).toISOString(), original_price: 6174, status: "upcoming", platform: "Agoda", ref_no: "RBQ-20240603", offers: [{ id: "o1", offer_price: 5420, customer_saving: 754, status: "pending" }] },
  { id: "b2", user_id: "u2", hotel_name: "The Leela Palace", hotel_city: "New Delhi, India", check_in: "2026-07-15", check_out: "2026-07-18", created_at: new Date(Date.now()-86400000).toISOString(), original_price: 18500, status: "upcoming", platform: "Booking.com", ref_no: "RBQ-20240715", offers: [{ id: "o2", offer_price: 16200, customer_saving: 2300, status: "contacted" }] },
  { id: "b3", user_id: "u3", hotel_name: "Ibis Styles Goa", hotel_city: "Goa, India", check_in: "2026-08-20", check_out: "2026-08-25", created_at: new Date(Date.now()-259200000).toISOString(), original_price: 9800, status: "tracking", platform: "MakeMyTrip", ref_no: "RBQ-20240820" },
  { id: "b4", user_id: "u4", hotel_name: "Taj Mahal Palace", hotel_city: "Mumbai, India", check_in: "2026-04-10", check_out: "2026-04-12", created_at: new Date(Date.now()-2592000000).toISOString(), original_price: 24000, status: "completed", platform: "Rebuq", ref_no: "RBQ-20240410" },
  { id: "b5", user_id: "u5", hotel_name: "Radisson Blu", hotel_city: "Bengaluru, India", check_in: "2026-06-05", check_out: "2026-06-07", created_at: new Date(Date.now()-432000000).toISOString(), original_price: 11200, status: "upcoming", platform: "Rebuq", ref_no: "RBQ-20240605" },
];
const DEMO_USERS: User[] = [
  { id: "u1", email: "arjun.mehta@gmail.com", name: "Arjun Mehta", phone: "+91 98765 43210", whatsapp: "+91 98765 43210", created_at: new Date(Date.now()-7200000).toISOString() },
  { id: "u2", email: "priya.sharma@gmail.com", name: "Priya Sharma", phone: "+91 87654 32109", whatsapp: "+91 87654 32109", created_at: new Date(Date.now()-86400000).toISOString() },
  { id: "u3", email: "rohan.kapoor@gmail.com", name: "Rohan Kapoor", phone: "+91 76543 21098", created_at: new Date(Date.now()-259200000).toISOString() },
  { id: "u4", email: "neha.gupta@gmail.com", name: "Neha Gupta", phone: "+91 65432 10987", created_at: new Date(Date.now()-2592000000).toISOString() },
  { id: "u5", email: "vikram.singh@gmail.com", name: "Vikram Singh", phone: "+91 54321 09876", created_at: new Date(Date.now()-432000000).toISOString() },
];
const DEMO_DROPS = [
  { id: "d1", booking_id: "b1", customer: "Arjun Mehta", email: "arjun.mehta@gmail.com", phone: "+91 98765 43210", hotel: "Manand Hotel", city: "Yerevan, Armenia", platform: "Agoda", ref: "2013580651", deadline: "2026-05-28", paid: 6174, newPrice: 5420, saving: 754, status: "pending" as DropStatus, priority: "P1" as Priority, detectedAt: new Date(Date.now()-7200000).toISOString() },
  { id: "d2", booking_id: "b2", customer: "Priya Sharma", email: "priya.sharma@gmail.com", phone: "+91 87654 32109", hotel: "The Leela Palace", city: "New Delhi, India", platform: "Booking.com", ref: "8821934", deadline: "2026-07-10", paid: 18500, newPrice: 16200, saving: 2300, status: "contacted" as DropStatus, priority: "P2" as Priority, detectedAt: new Date(Date.now()-86400000).toISOString() },
  { id: "d3", booking_id: "b5", customer: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "+91 54321 09876", hotel: "Hyatt Regency", city: "Chennai, India", platform: "Expedia", ref: "EXP7734521", deadline: "2026-06-20", paid: 15600, newPrice: 12800, saving: 2800, status: "claimed" as DropStatus, priority: "P1" as Priority, detectedAt: new Date(Date.now()-259200000).toISOString() },
];

const PRIORITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  P1: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  P2: { bg: "#fefce8", color: "#d97706", border: "#fde68a" },
  P3: { bg: "#eff6ff", color: B, border: "#bfdbfe" },
};
const DROP_STATUS_COLORS: Record<DropStatus, { bg: string; color: string }> = {
  pending:   { bg: "#fef3c7", color: "#d97706" },
  contacted: { bg: "#dbeafe", color: B },
  claimed:   { bg: "#dcfce7", color: "#16a34a" },
  expired:   { bg: "#f1f5f9", color: "#64748b" },
};

// ── Main Component ─────────────────────────────────────────────────────────────
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
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [drops, setDrops] = useState(DEMO_DROPS);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [isDemo, setIsDemo] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dropStatusFilter, setDropStatusFilter] = useState("all");
  const [priorities, setPriorities] = useState<Record<string, Priority>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  async function fetchData() {
    setLoading(true);
    try {
      const [bRes, uRes, pRes] = await Promise.all([
        supabase.from("bookings").select("*, offers(id,offer_price,customer_saving,status)").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("price_checks").select("*").order("checked_at", { ascending: false }),
      ]);
      const usrs: User[] = uRes.data || [];
      if (bRes.data?.length) {
        setBookings(bRes.data); setUsers(usrs); setPriceChecks(pRes.data || []);
        const map: Record<string, User> = {};
        usrs.forEach(u => { map[u.id] = u; });
        setUserMap(map);
      } else {
        setBookings(DEMO_BOOKINGS); setUsers(DEMO_USERS);
        const map: Record<string, User> = {};
        DEMO_USERS.forEach(u => { map[u.id] = u; });
        setUserMap(map); setIsDemo(true);
      }
    } catch { setBookings(DEMO_BOOKINGS); setUsers(DEMO_USERS); setIsDemo(true); }
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

  const setPriority = (bookingId: string, p: Priority) => setPriorities(prev => ({ ...prev, [bookingId]: p }));
  const setDropStatus = (dropId: string, s: DropStatus) => setDrops(prev => prev.map(d => d.id === dropId ? { ...d, status: s } : d));

  // Stats
  const totalCustomers = users.length;
  const activeMonitors = bookings.filter(b => ["tracking", "upcoming"].includes(b.status || "")).length;
  const pendingDrops = drops.filter(d => d.status === "pending").length;
  const totalSavings = drops.reduce((s, d) => s + d.saving, 0);
  const p1Count = Object.values(priorities).filter(p => p === "P1").length + drops.filter(d => d.priority === "P1").length;
  const p2Count = Object.values(priorities).filter(p => p === "P2").length + drops.filter(d => d.priority === "P2").length;
  const p3Count = Object.values(priorities).filter(p => p === "P3").length + drops.filter(d => d.priority === "P3").length;

  const filteredBookings = bookings.filter(b => {
    const u = userMap[b.user_id];
    const q = search.toLowerCase();
    const matchSearch = !q || (b.hotel_name||"").toLowerCase().includes(q) || (u?.email||"").toLowerCase().includes(q) || (u?.name||"").toLowerCase().includes(q) || (b.ref_no||"").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const bp = priorities[b.id];
    const matchPriority = priorityFilter === "all" || bp === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const filteredDrops = drops.filter(d => dropStatusFilter === "all" || d.status === dropStatusFilter);

  const SIDEBAR_ITEMS = [
    { key: "overview" as Section,      label: "Overview",      icon: ICONS.overview },
    { key: "all-bookings" as Section,  label: "All Bookings",  icon: ICONS.bookings },
    { key: "price-monitor" as Section, label: "Price Monitor", icon: ICONS.monitor },
    { key: "price-drops" as Section,   label: "Price Drops",   icon: ICONS.drops },
  ];

  // ── LOGIN PAGE ────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'Inter',sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap'); .inp { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 13px 16px; font-size: 15px; font-family: inherit; outline: none; color: ${NAVY}; background: #fff; width: 100%; transition: border-color 0.15s; } .inp:focus { border-color: ${B}; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }`}</style>

      {/* Left panel — dark */}
      <div style={{ background: "linear-gradient(160deg,#0c1535 0%,#0f172a 50%,#1a2a5e 100%)", padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div style={{ position: "relative" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20 }}>🏷️</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>rebuq<span style={{ color: GOLD }}>.</span></div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>ADMIN CONSOLE</div>
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "4px 12px", marginTop: 12, marginBottom: 48 }}>
            <Ico d={ICONS.lock} size={12} color="#94a3b8" />
            <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>Restricted — rebuq team only</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
            Manage every<br />booking, drop<br /><span style={{ color: GOLD }}>& customer.</span>
          </h1>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, maxWidth: 340, marginBottom: 48 }}>
            The rebuq operations hub — monitor live price drops, prioritize customer cases, and take action in real time.
          </p>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {[
              { icon: ICONS.monitor, text: "Live booking & price drop dashboard" },
              { icon: ICONS.users,   text: "Customer management & P1/P2/P3 tagging" },
              { icon: ICONS.drops,   text: "Real-time price monitor alerts" },
              { icon: ICONS.shield,  text: "Secure team-only access" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ico d={f.icon} size={14} color="#94a3b8" />
                </div>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Warning */}
        <div style={{ position: "relative", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Ico d={ICONS.warning} size={16} color={GOLD} sw={2} />
          <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
            <strong style={{ color: "#e2e8f0" }}>Authorised personnel only.</strong> Unauthorised access attempts are logged and reported. Contact your team lead for credentials.
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "#334155", marginTop: 16 }}>© 2026 rebuq. Internal use only.</div>
      </div>

      {/* Right panel — form */}
      <div style={{ background: "#f4f6f9", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "48px 56px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", border: "1.5px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico d={ICONS.shield} size={20} color={B} />
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>Admin Sign In</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>rebuq operations panel</div>
            </div>
          </div>

          {/* Form card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
            {/* Team email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 8 }}>Team Email</label>
              <input className="inp" type="email" placeholder="you@rebuq.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Ico d={ICONS.eye} size={18} color="#94a3b8" />
                </button>
              </div>
            </div>
            {/* Access key */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Admin Access Key</label>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Provided by team lead</span>
              </div>
              <div style={{ position: "relative" }}>
                <input className="inp" type={showKey ? "text" : "password"} placeholder="REBUQ-XXXX-XXXX" value={accessKey} onChange={e => setAccessKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Ico d={ICONS.eye} size={18} color="#94a3b8" />
                </button>
              </div>
            </div>
            {loginError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Ico d={ICONS.warning} size={14} color="#dc2626" sw={2} /> {loginError}
              </div>
            )}
            <button onClick={handleLogin} disabled={loginLoading} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 700, cursor: loginLoading ? "wait" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loginLoading ? 0.8 : 1 }}>
              {loginLoading ? "Verifying…" : <>Access Admin Panel <Ico d={ICONS.arrow} size={16} color="#fff" sw={2.5} /></>}
            </button>
          </div>

          {/* Security note */}
          <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
            <Ico d={ICONS.lock} size={15} color="#94a3b8" />
            <span style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>All admin sessions are encrypted and activity-logged. Sign out when done.</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <a href="/" style={{ color: "#64748b", textDecoration: "none" }}>← Back to home</a>
            <a href="/signin" style={{ color: B, textDecoration: "none", fontWeight: 600 }}>Member login →</a>
          </div>
        </div>
      </div>
    </div>
  );

  // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f8", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .nav-item { transition: all 0.15s; }
        .nav-item:hover { background: #f8fafc !important; }
        .inp { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-family: inherit; outline: none; color: ${NAVY}; background: #fff; }
        .inp:focus { border-color: ${B}; }
        .card { background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0; }
        .action-btn { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 14px; font-size: 12.5px; fontWeight: 500; cursor: pointer; font-family: inherit; background: #fff; color: ${NAVY}; transition: all 0.15s; width: 100%; text-align: left; }
        .action-btn:hover { border-color: ${B}; color: ${B}; }
        .action-btn.active { background: ${B}; color: #fff; border-color: ${B}; }
        .filter-pill { padding: 6px 14px; border-radius: 100px; border: 1.5px solid #e2e8f0; font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: inherit; background: #fff; color: ${NAVY}; transition: all 0.15s; white-space: nowrap; }
        .filter-pill.active { background: ${B}; color: #fff; border-color: ${B}; }
        .filter-pill:hover:not(.active) { border-color: #94a3b8; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none" }}>
          rebuq<span style={{ color: B }}>.</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "5px 14px" }}>
          <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#16a34a" }}>PRICE TRACKER ACTIVATED</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/search-hotels" style={{ fontSize: 14, color: "#64748b", textDecoration: "none" }}>Exclusive Deals</a>
          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <Ico d={ICONS.grid} size={16} color={B} />
            <span style={{ fontSize: 14, fontWeight: 600, color: B }}>Admin</span>
          </div>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <Ico d={ICONS.users} size={16} color="#64748b" />
            <span style={{ fontSize: 14, color: "#64748b" }}>My Profile</span>
          </a>
        </div>
      </nav>

      {/* ── HEADER BAND ── */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1447b8 60%,#2563eb 100%)", padding: "24px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 100, padding: "3px 12px", marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>Admin Panel</span>
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>rebuq Operations</div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)" }}>Manage bookings, track prices, and connect with customers</div>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { label: "TOTAL CUSTOMERS", val: totalCustomers },
              { label: "ACTIVE MONITORS", val: activeMonitors },
              { label: "PENDING DROPS", val: pendingDrops },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{loading ? "—" : s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 60px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 22, alignItems: "flex-start" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ position: "sticky", top: 78 }}>
          <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
            {SIDEBAR_ITEMS.map((item, i) => (
              <button key={item.key} onClick={() => setSection(item.key)} className="nav-item"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "none", background: section === item.key ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: section === item.key ? 600 : 400, color: section === item.key ? B : "#475569", borderBottom: i < SIDEBAR_ITEMS.length - 1 ? "1px solid #f8fafc" : "none", borderLeft: section === item.key ? `3px solid ${B}` : "3px solid transparent" }}>
                <Ico d={item.icon} size={15} color={section === item.key ? B : "#94a3b8"} />
                {item.label}
                <span style={{ marginLeft: "auto" }}><Ico d={ICONS.arrow} size={13} color="#cbd5e1" /></span>
              </button>
            ))}
          </div>

          {/* Quick stats */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>QUICK STATS</div>
            {[
              { label: "P1 Items", val: p1Count, color: "#dc2626" },
              { label: "P2 Items", val: p2Count, color: "#d97706" },
              { label: "P3 Items", val: p3Count, color: B },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none", fontSize: 13.5 }}>
                <span style={{ color: "#64748b" }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 8 }}>
            <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", color: NAVY }}>
              <Ico d={ICONS.refresh} size={14} color="#64748b" /> Refresh data
            </button>
            <button onClick={() => setAuthed(false)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", color: "#ef4444" }}>
              <Ico d={ICONS.signout} size={14} color="#ef4444" /> Sign out
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div>
          {isDemo && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 12.5, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <Ico d={ICONS.warning} size={14} color="#d97706" sw={2} />
              <span><strong>Demo mode</strong> — showing sample data. Connect Supabase to see real bookings.</span>
            </div>
          )}

          {/* ════ OVERVIEW ════ */}
          {section === "overview" && (
            <div>
              {/* 4 stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
                {[
                  { icon: ICONS.bookings, val: bookings.length,     label: "Total Bookings",       sub: `${bookings.filter(b=>b.status==="upcoming").length} upcoming`, color: "#0891b2", bg: "#ecfeff" },
                  { icon: ICONS.monitor,  val: activeMonitors,      label: "Price Monitors",       sub: `${Math.min(activeMonitors,2)} active`, color: GOLD, bg: "#fefce8" },
                  { icon: ICONS.drops,    val: drops.length,        label: "Price Drops",          sub: `${pendingDrops} pending action`, color: "#16a34a", bg: "#f0fdf4" },
                  { icon: ICONS.rupee,    val: formatINR(totalSavings), label: "Total Savings Found", sub: "across all customers", color: "#7c3aed", bg: "#faf5ff" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <Ico d={s.icon} size={17} color={s.color} />
                    </div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Priority Breakdown */}
              <div className="card" style={{ padding: 22, marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>Priority Breakdown</div>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>All active items</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                  {[
                    { key: "P1", label: "P1 — Urgent", val: p1Count, barColor: "#ef4444", bg: "#fef2f2" },
                    { key: "P2", label: "P2 — High",   val: p2Count, barColor: GOLD,      bg: "#fefce8" },
                    { key: "P3", label: "P3 — Normal", val: p3Count, barColor: B,          bg: "#eff6ff" },
                  ].map(p => (
                    <div key={p.key} style={{ background: p.bg, borderRadius: 12, padding: 18 }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, color: p.barColor, marginBottom: 4 }}>{p.val}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NAVY, marginBottom: 12 }}>{p.label}</div>
                      <div style={{ height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 100 }}>
                        <div style={{ height: "100%", width: `${Math.min(100, p.val * 20)}%`, background: p.barColor, borderRadius: 100 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Price Drops */}
              <div className="card" style={{ padding: 22, marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>Pending Price Drops</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Customers waiting to be contacted</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>
                    <Ico d={ICONS.clock} size={12} color="#dc2626" /> {pendingDrops} Pending
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  {drops.filter(d => d.status === "pending").map(d => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc", borderRadius: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{d.customer}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: PRIORITY_COLORS[d.priority!]?.bg, color: PRIORITY_COLORS[d.priority!]?.color }}>● {d.priority}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748b" }}>{d.hotel} · Save {formatINR(d.saving)} · Deadline {fmt(d.deadline)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={`mailto:${d.email}`} style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.mail} size={14} color="#64748b" /></a>
                        <a href={`tel:${d.phone}`} style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.phone} size={14} color="#64748b" /></a>
                        <a href={`https://wa.me/${d.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.chat} size={14} color="#16a34a" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Recent Submissions</div>
                {bookings.slice(0, 5).map((b, i) => {
                  const u = userMap[b.user_id];
                  const p = priorities[b.id] || (i < 2 ? "P1" : i < 4 ? "P2" : "P3") as Priority;
                  return (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: NAVY }}>{u?.name || "Customer"} — {b.hotel_name}</span>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{timeAgo(b.created_at)}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: PRIORITY_COLORS[p!]?.bg || "#f1f5f9", color: PRIORITY_COLORS[p!]?.color || "#64748b" }}>● {p}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ ALL BOOKINGS ════ */}
          {section === "all-bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>All Bookings</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{filteredBookings.length} bookings found</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
                  <Ico d={ICONS.search} size={15} color="#94a3b8" />
                  <input className="inp" placeholder="Search customer, hotel, ref..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", width: 220, padding: 0, fontSize: 13.5 }} />
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748b", marginRight: 4 }}>
                  <Ico d={ICONS.filter} size={13} color="#94a3b8" /> Status:
                </div>
                {["all","upcoming","completed","cancelled","tracking"].map(f => (
                  <button key={f} className={`filter-pill${statusFilter === f ? " active" : ""}`} onClick={() => setStatusFilter(f)} style={{ textTransform: "capitalize" as const }}>{f}</button>
                ))}
                <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />
                <span style={{ fontSize: 12.5, color: "#64748b", marginRight: 4 }}>Priority:</span>
                {["all","P1","P2","P3"].map(f => (
                  <button key={f} className={`filter-pill${priorityFilter === f ? " active" : ""}`} onClick={() => setPriorityFilter(f)}>{f}</button>
                ))}
              </div>

              {/* Booking cards */}
              {filteredBookings.map(b => {
                const u = userMap[b.user_id];
                const bp = priorities[b.id];
                const statusColors: Record<string, { bg: string; color: string }> = {
                  upcoming:  { bg: "#dbeafe", color: B },
                  completed: { bg: "#dcfce7", color: "#16a34a" },
                  cancelled: { bg: "#fef2f2", color: "#dc2626" },
                  tracking:  { bg: "#fef3c7", color: "#d97706" },
                };
                const sc = statusColors[b.status || "upcoming"] || statusColors.upcoming;
                return (
                  <div key={b.id} className="card" style={{ padding: "20px 22px", marginBottom: 14, display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 20, alignItems: "flex-start" }}>
                    {/* Customer */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarColor(b.user_id || "x"), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {initials(u?.name || "", u?.email || "")}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{u?.name || "Customer"}</div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{timeAgo(b.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <a href={`mailto:${u?.email}`} style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.mail} size={13} color="#64748b" /></a>
                        <a href={`tel:${u?.phone}`} style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.phone} size={13} color="#64748b" /></a>
                        <a href={`https://wa.me/${(u?.whatsapp||u?.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.chat} size={13} color="#16a34a" /></a>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{u?.email}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{u?.phone}</div>
                    </div>

                    {/* Hotel details */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY }}>{b.hotel_name}</div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{b.status || "upcoming"}</span>
                        {/* Priority selector */}
                        <select value={bp || ""} onChange={e => setPriority(b.id, (e.target.value || null) as Priority)}
                          style={{ border: `1.5px solid ${bp ? PRIORITY_COLORS[bp]?.border : "#e2e8f0"}`, borderRadius: 100, padding: "3px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: bp ? PRIORITY_COLORS[bp]?.bg : "#fff", color: bp ? PRIORITY_COLORS[bp]?.color : "#64748b", outline: "none" }}>
                          <option value="">Set Priority</option>
                          <option value="P1">● P1</option>
                          <option value="P2">● P2</option>
                          <option value="P3">● P3</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#64748b", marginBottom: 12 }}>
                        <Ico d={ICONS.location} size={13} color="#94a3b8" /> {b.hotel_city || "—"}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", gap: "6px 20px" }}>
                        {[
                          { label: "CHECK-IN",  val: fmt(b.check_in) },
                          { label: "CHECK-OUT", val: fmt(b.check_out) },
                          { label: "PLATFORM",  val: b.platform || "—" },
                          { label: "AMOUNT",    val: b.original_price ? formatINR(b.original_price) : "—" },
                        ].map((f, i) => (
                          <div key={i}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{f.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking ref + View */}
                    <div style={{ textAlign: "right" as const, minWidth: 140 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>BOOKING REF</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}>
                        {b.ref_no || "—"}
                        <button onClick={() => copyText(b.ref_no || "")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                          <Ico d={ICONS.copy} size={13} color={copied === b.ref_no ? "#16a34a" : "#94a3b8"} />
                        </button>
                      </div>
                      <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                        <Ico d={ICONS.eye} size={13} color="#fff" sw={2} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════ PRICE MONITOR ════ */}
          {section === "price-monitor" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>Price Monitor</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>All bookings being tracked for price drops</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                    <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                    {activeMonitors} Active
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "7px 13px" }}>
                    <Ico d={ICONS.search} size={14} color="#94a3b8" />
                    <input className="inp" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", width: 180, padding: 0, fontSize: 13 }} />
                  </div>
                </div>
              </div>

              {bookings.map(b => {
                const u = userMap[b.user_id];
                const offer = b.offers?.[0];
                const bp = priorities[b.id] || "P3" as Priority;
                const isTracking = ["tracking","upcoming"].includes(b.status || "");
                const isSaved = !!offer;
                return (
                  <div key={b.id} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px" }}>
                      {/* Customer col */}
                      <div style={{ padding: "20px 20px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor(b.user_id || "x"), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {initials(u?.name || "", u?.email || "")}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{u?.name || "Customer"}</div>
                            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{timeAgo(b.created_at)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <a href={`mailto:${u?.email}`} style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.mail} size={12} color="#64748b" /></a>
                          <a href={`tel:${u?.phone}`} style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.phone} size={12} color="#64748b" /></a>
                          <a href={`https://wa.me/${(u?.whatsapp||u?.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.chat} size={12} color="#16a34a" /></a>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{u?.email}</div>
                      </div>

                      {/* Hotel details */}
                      <div style={{ padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>{b.hotel_name}</div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: isSaved ? "#dcfce7" : "#dbeafe", color: isSaved ? "#16a34a" : B }}>
                            {isSaved ? "Saved" : "Tracking"}
                          </span>
                          <select value={bp || ""} onChange={e => setPriority(b.id, (e.target.value || null) as Priority)}
                            style={{ border: `1.5px solid ${bp ? PRIORITY_COLORS[bp]?.border : "#e2e8f0"}`, borderRadius: 100, padding: "2px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: bp ? PRIORITY_COLORS[bp]?.bg : "#fff", color: bp ? PRIORITY_COLORS[bp]?.color : "#64748b", outline: "none" }}>
                            <option value="P1">● P1</option>
                            <option value="P2">● P2</option>
                            <option value="P3">● P3</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#64748b", marginBottom: 14 }}>
                          <Ico d={ICONS.location} size={13} color="#94a3b8" /> {b.hotel_city || "—"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", gap: "6px 20px" }}>
                          {[
                            { label: "CHECK-IN",  val: fmt(b.check_in) },
                            { label: "PLATFORM",  val: b.platform || "—" },
                            { label: "REF NO.",   val: b.ref_no || "—" },
                            { label: "DEADLINE",  val: fmt(b.check_in) },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}>
                                {f.label === "DEADLINE" && <Ico d={ICONS.clock} size={12} color="#94a3b8" />}
                                {f.val}
                                {f.label === "REF NO." && <button onClick={() => copyText(f.val)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Ico d={ICONS.copy} size={11} color={copied === f.val ? "#16a34a" : "#94a3b8"} /></button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price panel */}
                      <div style={{ background: "#f8fafc", borderLeft: "1px solid #f1f5f9", padding: "20px 20px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>PAID</div>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: offer ? "#94a3b8" : NAVY, textDecoration: offer ? "line-through" : "none" }}>{b.original_price ? formatINR(b.original_price) : "—"}</div>
                        {offer ? (
                          <>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 6 }}>CURRENT</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: NAVY }}>{formatINR(offer.offer_price)}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                              <Ico d={ICONS.drops} size={12} color="#16a34a" sw={2} /> Save {formatINR(offer.customer_saving)}
                            </div>
                          </>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", marginTop: 6 }}>
                            <Ico d={ICONS.eye} size={13} color="#94a3b8" /> Watching
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════ PRICE DROPS ════ */}
          {section === "price-drops" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>Price Drops</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Detected price drops requiring customer action</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "5px 12px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>
                  <Ico d={ICONS.drops} size={13} color="#16a34a" /> {formatINR(totalSavings)} total savings
                </span>
              </div>

              {/* Status filter tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["all","pending","contacted","claimed","expired"].map(f => (
                  <button key={f} className={`filter-pill${dropStatusFilter === f ? " active" : ""}`} onClick={() => setDropStatusFilter(f)} style={{ textTransform: "capitalize" as const }}>{f}</button>
                ))}
              </div>

              {filteredDrops.map(d => {
                const sc = DROP_STATUS_COLORS[d.status];
                const pc = PRIORITY_COLORS[d.priority!] || PRIORITY_COLORS.P3;
                return (
                  <div key={d.id} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 160px" }}>
                      {/* Customer */}
                      <div style={{ padding: "20px 20px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor(d.customer), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {initials(d.customer, d.email)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{d.customer}</div>
                            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>Detected {timeAgo(d.detectedAt)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <a href={`mailto:${d.email}`} style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.mail} size={12} color="#64748b" /></a>
                          <a href={`tel:${d.phone}`} style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.phone} size={12} color="#64748b" /></a>
                          <a href={`https://wa.me/${d.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ width: 26, height: 26, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Ico d={ICONS.chat} size={12} color="#16a34a" /></a>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{d.email}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{d.phone}</div>
                      </div>

                      {/* Hotel + price */}
                      <div style={{ padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>{d.hotel}</div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{d.status}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: pc.bg, color: pc.color }}>● {d.priority}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#64748b", marginBottom: 14 }}>
                          <Ico d={ICONS.location} size={13} color="#94a3b8" /> {d.city}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", gap: "6px 20px", marginBottom: 16 }}>
                          {[
                            { label: "PLATFORM", val: d.platform },
                            { label: "REF NO.",  val: d.ref },
                            { label: "DEADLINE", val: fmt(d.deadline) },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}>
                                {f.label === "DEADLINE" && <Ico d={ICONS.clock} size={12} color="#94a3b8" />}
                                {f.val}
                                {f.label === "REF NO." && <button onClick={() => copyText(f.val)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Ico d={ICONS.copy} size={11} color={copied === f.val ? "#16a34a" : "#94a3b8"} /></button>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Price comparison */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>PAID</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(d.paid)}</div>
                            <Ico d={ICONS.drops} size={13} color="#16a34a" sw={2} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>NEW PRICE</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(d.newPrice)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>SAVINGS</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{formatINR(d.saving)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Status updater */}
                      <div style={{ padding: "20px 16px", borderLeft: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>UPDATE STATUS</div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                          {(["pending","contacted","claimed","expired"] as DropStatus[]).map(s => (
                            <button key={s} onClick={() => setDropStatus(d.id, s)}
                              style={{ border: "1.5px solid", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: d.status === s ? 700 : 500, cursor: "pointer", fontFamily: "inherit", background: d.status === s ? B : "#fff", color: d.status === s ? "#fff" : NAVY, borderColor: d.status === s ? B : "#e2e8f0", transition: "all 0.15s", textTransform: "capitalize" as const, textAlign: "left" as const }}>
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

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy","Terms of Service","Contact"].map(l => <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>)}
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>© 2026 rebuq. All rights reserved.</span>
      </footer>
    </div>
  );
}
