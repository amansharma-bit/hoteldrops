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
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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

interface Booking {
  id: string; hotel_name: string; hotel_city: string;
  check_in: string; check_out: string; original_price: number;
  status: string; last_checked_at: string; nights: number;
  room_type: string; created_at: string; platform?: string; ref_no?: string;
  offers?: { offer_price: number; customer_saving: number; status: string; id: string }[];
}

type Section = "overview" | "price-monitor" | "my-bookings" | "trips" | "notifications" | "settings";

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 48, height: 26, borderRadius: 13, background: on ? B : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
    </div>
  );
}

// ── SVG icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "#64748b", stroke = 1.5 }: { d: string; size?: number; color?: string; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  monitor:   "M2.5 12c0-5.25 4.25-9.5 9.5-9.5s9.5 4.25 9.5 9.5-4.25 9.5-9.5 9.5S2.5 17.25 2.5 12zm9.5-3.5v3.5l2.5 2.5",
  bookings:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  trips:     "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  cards:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  notifs:    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  settings:  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  signout:   "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  edit:      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  mail:      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone:     "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  location:  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  arrow:     "M9 5l7 7-7 7",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  download:  "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  hotel:     "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  drop:      "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z",
  eye:       "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  check:     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  star:      "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

// Demo data
const DEMO_WATCH: Booking[] = [
  { id: "w1", hotel_name: "Manand Hotel", hotel_city: "Yerevan, Armenia", check_in: "2026-06-03", check_out: "2026-06-09", original_price: 6174, status: "tracking", last_checked_at: new Date(Date.now() - 3600000).toISOString(), nights: 6, room_type: "Standard Room", created_at: new Date().toISOString(), platform: "Agoda", ref_no: "2013580651", offers: [{ id: "o1", offer_price: 5420, customer_saving: 754, status: "sent" }] },
  { id: "w2", hotel_name: "The Leela Palace", hotel_city: "New Delhi, India", check_in: "2026-07-15", check_out: "2026-07-18", original_price: 18500, status: "drop_found", last_checked_at: new Date(Date.now() - 86400000).toISOString(), nights: 3, room_type: "Deluxe Room", created_at: new Date().toISOString(), platform: "Booking.com", ref_no: "8821934", offers: [{ id: "o2", offer_price: 16200, customer_saving: 2300, status: "sent" }] },
  { id: "w3", hotel_name: "Ibis Styles Goa", hotel_city: "Goa, India", check_in: "2026-08-20", check_out: "2026-08-25", original_price: 9800, status: "tracking", last_checked_at: new Date(Date.now() - 7200000).toISOString(), nights: 5, room_type: "Superior Room", created_at: new Date().toISOString(), platform: "MakeMyTrip", ref_no: "MMT9923411" },
];

const DEMO_BOOKINGS = [
  { id: "b1", hotel_name: "Taj Mahal Palace", hotel_city: "Mumbai", check_in: "2026-04-10", check_out: "2026-04-12", nights: 2, price: 24000, status: "completed", booking_ref: "RBQ-20240410" },
  { id: "b2", hotel_name: "Radisson Blu", hotel_city: "Bengaluru", check_in: "2026-06-05", check_out: "2026-06-07", nights: 2, price: 11200, status: "upcoming", booking_ref: "RBQ-20240605" },
  { id: "b3", hotel_name: "Hyatt Regency", hotel_city: "Chennai", check_in: "2026-02-18", check_out: "2026-02-20", nights: 2, price: 15600, status: "completed", booking_ref: "RBQ-20240218" },
];

const DEMO_ACTIVITY = [
  { icon: "monitor", text: "Price tracker activated for Manand Hotel, Yerevan", time: "2 hours ago", color: B },
  { icon: "drop", text: "Price drop detected — ₹2,300 saved on The Leela Palace", time: "1 day ago", color: "#16a34a" },
  { icon: "bookings", text: "Booking confirmed — Radisson Blu, Bengaluru", time: "3 days ago", color: GOLD },
  { icon: "check", text: "Stay completed — Taj Mahal Palace, Mumbai", time: "1 month ago", color: "#64748b" },
];

export default function Dashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [section, setSection] = useState<Section>("overview");
  const [watchBookings, setWatchBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // User info
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [passport, setPassport] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification prefs
  const [notifPriceDrops, setNotifPriceDrops] = useState(true);
  const [notifBookingUpdates, setNotifBookingUpdates] = useState(true);
  const [notifDeals, setNotifDeals] = useState(false);
  const [notifSMS, setNotifSMS] = useState(true);

  // Settings
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Booking tabs
  const [bookingTab, setBookingTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/signin"); return; }
      const meta = data.user.user_metadata;
      const fullName = meta?.full_name || meta?.name || "";
      const parts = fullName.trim().split(" ");
      const fn = parts[0] || "";
      const ln = parts.slice(1).join(" ") || "";
      const initials = (fn[0] || "") + (ln[0] || fn[1] || "");
      setUser({ name: fullName || data.user.email?.split("@")[0] || "Member", email: data.user.email || "", initials: initials.toUpperCase() || "M" });
      setFirstName(fn); setLastName(ln); setEmail(data.user.email || "");
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setWatchBookings(DEMO_WATCH); setIsDemo(true); setLoading(false); return; }
        const { data, error } = await supabase.from("bookings").select("*, offers(id,offer_price,customer_saving,status)").order("created_at", { ascending: false });
        if (error || !data?.length) { setWatchBookings(DEMO_WATCH); setIsDemo(true); } else setWatchBookings(data);
      } catch { setWatchBookings(DEMO_WATCH); setIsDemo(true); }
      setLoading(false);
    }
    load();
  }, []);

  const totalSaved = watchBookings.reduce((s, b) => s + (b.offers?.[0]?.customer_saving || 0), 0);
  const activeWatch = watchBookings.filter(b => ["tracking", "pending"].includes(b.status)).length;
  const dropsFound = watchBookings.filter(b => ["drop_found", "offer_sent", "rebooked"].includes(b.status)).length;
  const bookingsMonitored = watchBookings.length;

  const copyRef = (ref: string) => { navigator.clipboard.writeText(ref); setCopied(ref); setTimeout(() => setCopied(null), 1500); };

  const NAV = [
    { key: "overview" as Section,       label: "Overview",       icon: ICONS.overview },
    { key: "price-monitor" as Section,  label: "Price Monitor",  icon: ICONS.monitor },
    { key: "my-bookings" as Section,    label: "My Bookings",    icon: ICONS.bookings },
    { key: "trips" as Section,          label: "Trips",          icon: ICONS.trips },
    { key: "notifications" as Section,  label: "Notifications",  icon: ICONS.notifs },
    { key: "settings" as Section,       label: "Settings",       icon: ICONS.settings },
  ];

  const inp: React.CSSProperties = { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", color: NAVY, outline: "none", background: "#fff" };

  const filteredBookings = DEMO_BOOKINGS.filter(b => bookingTab === "all" || b.status === bookingTab);

  const SectionTitle = ({ title, sub }: { title: string; sub: string }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, fontFamily: "'Sora',sans-serif" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );

  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, ...style }}>{children}</div>
  );

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f0f2f8", minHeight: "100vh", color: "#1e293b" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .nav-item { transition: all 0.15s; }
        .nav-item:hover { background: #f8fafc !important; }
        .stat-card { transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .setting-row { transition: background 0.1s; }
        .setting-row:hover { background: #f8fafc; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          rebuq<span style={{ color: B }}>.</span>
        </a>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "5px 14px" }}>
            <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#16a34a" }}>PRICE TRACKER ACTIVATED</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {!isMobile && <a href="/search-hotels" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>Exclusive Deals</a>}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setSection("overview")}>
              <Icon d={ICONS.overview} color={B} />
              <span style={{ fontSize: 14, fontWeight: 600, color: B }}>My Profile</span>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: mobileSidebarOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
                <span style={{ display: "block", width: 22, height: 2, background: mobileSidebarOpen ? "transparent" : NAVY, transition: "all 0.2s" }} />
                <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: mobileSidebarOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
              </div>
            </button>
          )}
        </div>
      </nav>

      {/* ── PROFILE HEADER BAND ── */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1447b8 60%,#2563eb 100%)", padding: isMobile ? "24px 20px" : "28px 40px", position: "relative", overflow: "hidden" }}>
        {/* Subtle grid overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72, borderRadius: 16, background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "#fff" }}>
                {user?.initials || "M"}
              </div>
              <button onClick={() => setSection("settings")} style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: GOLD, border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={ICONS.edit} size={11} color="#fff" stroke={2} />
              </button>
            </div>
            {/* User info */}
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{user?.name || "Member"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 20, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
                  <Icon d={ICONS.mail} size={13} color="rgba(255,255,255,0.75)" />
                  {user?.email || ""}
                </div>
                {!isMobile && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
                    <Icon d={ICONS.location} size={13} color="rgba(255,255,255,0.75)" />
                    Mumbai, India
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" as const }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Icon d={ICONS.check} size={11} color="#4ade80" stroke={2} /> Verified Member
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Icon d={ICONS.star} size={11} color={GOLD} stroke={2} /> Gold Saver
                </span>
              </div>
            </div>
          </div>
          {/* Total savings */}
          <div style={{ textAlign: isMobile ? "left" : "right" as const }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL SAVINGS</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 800, color: GOLD }}>{formatINR(totalSaved || 3054)}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>across {bookingsMonitored} monitored bookings</div>
          </div>
        </div>
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {isMobile && mobileSidebarOpen && (
        <>
          <div onClick={() => setMobileSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 400 }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, background: "#fff", zIndex: 500, boxShadow: "4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 20px 10px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: NAVY }}>rebuq<span style={{ color: B }}>.</span></div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {NAV.map(item => (
                <button key={item.key} onClick={() => { setSection(item.key); setMobileSidebarOpen(false); }} className="nav-item"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", border: "none", background: section === item.key ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: section === item.key ? 600 : 400, color: section === item.key ? B : "#1e293b", borderLeft: section === item.key ? `3px solid ${B}` : "3px solid transparent" }}>
                  <Icon d={item.icon} size={16} color={section === item.key ? B : "#64748b"} />
                  {item.label}
                  <span style={{ marginLeft: "auto" }}><Icon d={ICONS.arrow} size={14} color="#cbd5e1" /></span>
                </button>
              ))}
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} className="nav-item"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", border: "none", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 400, color: "#ef4444", borderLeft: "3px solid transparent" }}>
                <Icon d={ICONS.signout} size={16} color="#ef4444" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px 40px" : "28px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* ── SIDEBAR (desktop) ── */}
        {!isMobile && (
          <div style={{ position: "sticky", top: 78 }}>
            <Card style={{ overflow: "hidden" }}>
              {NAV.map((item, i) => (
                <button key={item.key} onClick={() => setSection(item.key)} className="nav-item"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", border: "none", background: section === item.key ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: section === item.key ? 600 : 400, color: section === item.key ? B : "#475569", borderBottom: i < NAV.length - 1 ? "1px solid #f8fafc" : "none", borderLeft: section === item.key ? `3px solid ${B}` : "3px solid transparent" }}>
                  <Icon d={item.icon} size={15} color={section === item.key ? B : "#94a3b8"} />
                  {item.label}
                  <span style={{ marginLeft: "auto" }}><Icon d={ICONS.arrow} size={13} color="#cbd5e1" /></span>
                </button>
              ))}
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} className="nav-item"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", border: "none", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 400, color: "#ef4444", borderLeft: "3px solid transparent" }}>
                <Icon d={ICONS.signout} size={15} color="#ef4444" />
                Sign Out
              </button>
            </Card>
          </div>
        )}

        {/* ── CONTENT AREA ── */}
        <div>

          {/* ══════════ OVERVIEW ══════════ */}
          {section === "overview" && (
            <div>
              {/* 4 stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { icon: ICONS.monitor,  val: bookingsMonitored, label: "Bookings Monitored", color: B,       bg: "#eff6ff" },
                  { icon: ICONS.bookings, val: DEMO_BOOKINGS.length, label: "Bookings With Us", color: "#0891b2", bg: "#ecfeff" },
                  { icon: ICONS.drop,     val: formatINR(totalSaved || 3054), label: "Total Saved",  color: "#16a34a", bg: "#f0fdf4" },
                  { icon: ICONS.trips,    val: 2,                label: "Trips Completed",  color: "#9333ea", bg: "#faf5ff" },
                ].map((s, i) => (
                  <Card key={i} style={{ padding: 20 }} className="stat-card">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Icon d={s.icon} size={18} color={s.color} />
                    </div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                  </Card>
                ))}
              </div>

              {/* Personal Information */}
              <Card style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif" }}>Personal Information</div>
                  <button onClick={() => setSection("settings")} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: B, fontWeight: 600, fontFamily: "inherit" }}>
                    <Icon d={ICONS.edit} size={14} color={B} /> Edit
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px 32px" }}>
                  {[
                    { label: "FULL NAME", val: user?.name || "—" },
                    { label: "EMAIL ADDRESS", val: user?.email || "—" },
                    { label: "PHONE NUMBER", val: phone || "+91 98765 43210" },
                    { label: "DATE OF BIRTH", val: dob || "14 March 1990" },
                    { label: "NATIONALITY", val: nationality },
                    { label: "PASSPORT NO.", val: passport || "Z1234567 (expires Jun 2029)" },
                  ].map((f, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.09em", marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{f.val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card style={{ padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif", marginBottom: 18 }}>Recent Activity</div>
                {DEMO_ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: i < DEMO_ACTIVITY.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon d={(ICONS as any)[a.icon] || ICONS.check} size={15} color={a.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: NAVY, fontWeight: 500, marginBottom: 2 }}>{a.text}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ══════════ PRICE MONITOR ══════════ */}
          {section === "price-monitor" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, fontFamily: "'Sora',sans-serif" }}>Price Monitor</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Bookings we&apos;re actively tracking for price drops</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                  <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                  {activeWatch} Active
                </div>
              </div>

              {isDemo && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12.5, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                  👀 <span><strong>Demo mode</strong> — Upload a real voucher to start tracking.</span>
                  <button onClick={() => router.push("/upload")} style={{ marginLeft: "auto", background: "#d97706", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload now →</button>
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ width: 32, height: 32, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : watchBookings.map(b => {
                const offer = b.offers?.[0];
                const isDropFound = ["drop_found", "offer_sent"].includes(b.status);
                const isSaved = b.status === "rebooked";
                const badgeMap: Record<string, { label: string; bg: string; color: string }> = {
                  tracking:   { label: "Tracking",    bg: "#dbeafe", color: B },
                  drop_found: { label: "Saved ↓",     bg: "#dcfce7", color: "#16a34a" },
                  offer_sent: { label: "Saved ↓",     bg: "#dcfce7", color: "#16a34a" },
                  rebooked:   { label: "Saved ✓",     bg: "#dcfce7", color: "#16a34a" },
                  pending:    { label: "Setting up",  bg: "#fef3c7", color: "#d97706" },
                  no_drop:    { label: "Watching",    bg: "#f1f5f9", color: "#64748b" },
                };
                const badge = badgeMap[b.status] || badgeMap.tracking;
                return (
                  <Card key={b.id} style={{ marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 0 }}>
                      {/* Left */}
                      <div style={{ padding: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" as const }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif" }}>{b.hotel_name}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#64748b", marginBottom: 14 }}>
                          <Icon d={ICONS.location} size={13} color="#94a3b8" /> {b.hotel_city}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", gap: "6px 24px", marginBottom: 14 }}>
                          {[
                            { label: "CHECK-IN",  val: fmtDate(b.check_in) },
                            { label: "CHECK-OUT", val: fmtDate(b.check_out) },
                            { label: "PLATFORM",  val: b.platform || "—" },
                            { label: "REF NO.",   val: b.ref_no || "—" },
                          ].map((f, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}>
                                {f.val}
                                {f.label === "REF NO." && f.val !== "—" && (
                                  <button onClick={() => copyRef(f.val)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                                    <Icon d={ICONS.copy} size={12} color={copied === f.val ? "#16a34a" : "#94a3b8"} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                          <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={13} color="#94a3b8" />
                          Free cancellation deadline: {b.check_in}
                        </div>
                      </div>
                      {/* Right — price panel */}
                      <div style={{ background: "#f8fafc", borderLeft: isMobile ? "none" : "1px solid #e2e8f0", borderTop: isMobile ? "1px solid #e2e8f0" : "none", padding: "20px 22px", display: "flex", flexDirection: "column" as const, alignItems: isMobile ? "flex-start" : "flex-end" as const, justifyContent: "center", minWidth: 160, gap: 4 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>YOU PAID</div>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: offer ? "#94a3b8" : NAVY, textDecoration: offer ? "line-through" : "none" }}>{formatINR(b.original_price)}</div>
                        {offer && (
                          <>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 6 }}>CURRENT PRICE</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: NAVY }}>{formatINR(offer.offer_price)}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
                              <Icon d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" size={13} color="#16a34a" /> Save {formatINR(offer.customer_saving)}
                            </div>
                          </>
                        )}
                        {!offer && b.status === "tracking" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            <Icon d={ICONS.eye} size={13} color="#94a3b8" /> Watching
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Footer actions */}
                    <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View Details</button>
                      {(isDropFound || isSaved) && (
                        <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Claim Refund</button>
                      )}
                    </div>
                  </Card>
                );
              })}

              <button onClick={() => router.push("/upload")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
                + Upload new booking to track
              </button>
            </div>
          )}

          {/* ══════════ MY BOOKINGS ══════════ */}
          {section === "my-bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, fontFamily: "'Sora',sans-serif" }}>Bookings With Us</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>All hotel bookings made through rebuq</div>
                </div>
                <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ New booking</button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {(["all","upcoming","completed","cancelled"] as const).map(t => (
                  <button key={t} onClick={() => setBookingTab(t)}
                    style={{ padding: "7px 18px", borderRadius: 100, border: "1.5px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: bookingTab === t ? B : "#fff", color: bookingTab === t ? "#fff" : NAVY, borderColor: bookingTab === t ? B : "#e2e8f0", textTransform: "capitalize" as const, transition: "all 0.15s" }}>
                    {t}
                  </button>
                ))}
              </div>

              {filteredBookings.length === 0 ? (
                <Card style={{ padding: 40, textAlign: "center" as const }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🏨</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 6 }}>No {bookingTab} bookings</div>
                  <button onClick={() => router.push("/search-hotels")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Search hotels →</button>
                </Card>
              ) : filteredBookings.map((b, i) => (
                <Card key={b.id} style={{ marginBottom: 14, padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={ICONS.hotel} size={18} color={B} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif" }}>{b.hotel_name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          <Icon d={ICONS.location} size={12} color="#94a3b8" /> {b.hotel_city}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif" }}>{formatINR(b.price)}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: b.status === "upcoming" ? "#dbeafe" : "#dcfce7", color: b.status === "upcoming" ? B : "#16a34a", textTransform: "capitalize" as const }}>{b.status}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px 16px", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                    {[
                      { label: "CHECK-IN",    val: fmtDate(b.check_in) },
                      { label: "CHECK-OUT",   val: fmtDate(b.check_out) },
                      { label: "NIGHTS",      val: `${b.nights} nights` },
                      { label: "BOOKING REF", val: b.booking_ref },
                    ].map((f, fi) => (
                      <div key={fi}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 4 }}>
                          {f.val}
                          {f.label === "BOOKING REF" && (
                            <button onClick={() => copyRef(f.val)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                              <Icon d={ICONS.copy} size={12} color={copied === f.val ? "#16a34a" : "#94a3b8"} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      <Icon d={ICONS.download} size={13} color={NAVY} /> Download Invoice
                    </button>
                    {b.status === "upcoming" ? (
                      <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Manage Booking</button>
                    ) : (
                      <button style={{ background: "#fff", color: GOLD, border: `1.5px solid ${GOLD}`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Write a Review</button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ══════════ TRIPS ══════════ */}
          {section === "trips" && (
            <div>
              <SectionTitle title="My Trips" sub="Your upcoming and past travel history" />

              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>UPCOMING</div>
              {DEMO_BOOKINGS.filter(b => b.status === "upcoming").map(b => (
                <Card key={b.id} style={{ padding: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={ICONS.hotel} size={20} color={B} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>{b.hotel_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon d={ICONS.location} size={12} color="#94a3b8" />{b.hotel_city}</span>
                      <span>·</span>
                      <span>{fmtDate(b.check_in)} – {fmtDate(b.check_out)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#dbeafe", color: B }}>Upcoming</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif", marginTop: 6 }}>{formatINR(b.price)}</div>
                  </div>
                </Card>
              ))}

              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "24px 0 12px" }}>PAST TRIPS</div>
              {DEMO_BOOKINGS.filter(b => b.status === "completed").map(b => (
                <Card key={b.id} style={{ padding: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={ICONS.hotel} size={20} color="#94a3b8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>{b.hotel_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon d={ICONS.location} size={12} color="#94a3b8" />{b.hotel_city}</span>
                      <span>·</span>
                      <span>{fmtDate(b.check_in)} – {fmtDate(b.check_out)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#dcfce7", color: "#16a34a" }}>Completed</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: "'Sora',sans-serif", marginTop: 6 }}>{formatINR(b.price)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ══════════ NOTIFICATIONS ══════════ */}
          {section === "notifications" && (
            <div>
              <SectionTitle title="Notifications" sub="Manage how and when you hear from us" />

              <Card style={{ marginBottom: 20 }}>
                {[
                  { label: "Price Drop Alerts", desc: "Get notified when we detect a price drop on your monitored bookings", icon: ICONS.monitor, val: notifPriceDrops, set: setNotifPriceDrops },
                  { label: "Booking Updates", desc: "Confirmation, cancellation, and modification updates for your bookings", icon: ICONS.bookings, val: notifBookingUpdates, set: setNotifBookingUpdates },
                  { label: "Exclusive Deals", desc: "Personalised hotel deals and member-only offers", icon: ICONS.star, val: notifDeals, set: setNotifDeals },
                  { label: "SMS Notifications", desc: "Receive important alerts via SMS on your registered mobile number", icon: ICONS.phone, val: notifSMS, set: setNotifSMS },
                ].map((n, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon d={n.icon} size={18} color={B} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{n.label}</div>
                      <div style={{ fontSize: 12.5, color: "#64748b" }}>{n.desc}</div>
                    </div>
                    <Toggle on={n.val} onChange={() => n.set(!n.val)} />
                  </div>
                ))}
              </Card>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>RECENT NOTIFICATIONS</div>
              <Card>
                {[
                  { dot: "#16a34a", text: "Price drop detected on The Leela Palace — save ₹2,300", time: "1 day ago" },
                  { dot: B,         text: "Your booking at Radisson Blu is confirmed for 5 Jun", time: "3 days ago" },
                  { dot: GOLD,      text: "Exclusive deal: 20% off on Goa resorts this weekend", time: "5 days ago" },
                ].map((n, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 22px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.dot, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: NAVY, fontWeight: 500, marginBottom: 3 }}>{n.text}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ══════════ SETTINGS ══════════ */}
          {section === "settings" && (
            <div>
              <SectionTitle title="Account Settings" sub="Manage your account preferences and security" />

              {/* Security */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>SECURITY</div>
              <Card style={{ marginBottom: 20 }}>
                {[
                  { label: "Change Password", sub: "Last changed 3 months ago", btn: "Update", action: () => {} },
                  { label: "Two-Factor Authentication", sub: "Add an extra layer of security", btn: "Enable", action: () => {} },
                  { label: "Login Activity", sub: "View recent sign-in sessions", btn: "View", action: () => {} },
                ].map((row, i, arr) => (
                  <div key={i} className="setting-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{row.label}</div>
                      <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>{row.sub}</div>
                    </div>
                    <button onClick={row.action} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{row.btn}</button>
                  </div>
                ))}
              </Card>

              {/* Preferences */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>PREFERENCES</div>
              <Card style={{ marginBottom: 20 }}>
                {[
                  { label: "Currency", sub: "INR — Indian Rupee", btn: "Change" },
                  { label: "Language", sub: "English (India)", btn: "Change" },
                  { label: "Time Zone", sub: "Asia/Kolkata (IST +5:30)", btn: "Change" },
                ].map((row, i, arr) => (
                  <div key={i} className="setting-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{row.label}</div>
                      <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>{row.sub}</div>
                    </div>
                    <button style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{row.btn}</button>
                  </div>
                ))}
              </Card>

              {/* Personal info edit */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>PERSONAL INFORMATION</div>
              <Card style={{ padding: 22, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
                  {[
                    { label: "First Name", val: firstName, set: setFirstName, type: "text" },
                    { label: "Last Name", val: lastName, set: setLastName, type: "text" },
                    { label: "Email Address", val: email, set: setEmail, type: "email" },
                    { label: "Phone Number", val: phone, set: setPhone, type: "tel" },
                    { label: "Date of Birth", val: dob, set: setDob, type: "date" },
                    { label: "Nationality", val: nationality, set: setNationality, type: "text" },
                    { label: "Passport Number", val: passport, set: setPassport, type: "text" },
                  ].map((f, i) => (
                    <div key={i}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>
                <button onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500); }}
                  style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {profileSaved ? "✓ Saved!" : "Save changes"}
                </button>
              </Card>

              {/* Privacy */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>PRIVACY</div>
              <Card style={{ marginBottom: 20 }}>
                <div className="setting-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f8fafc" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Data & Privacy</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Manage your personal data and privacy settings</div>
                  </div>
                  <button style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Manage</button>
                </div>
                <div className="setting-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>Delete Account</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Permanently delete your account and all data</div>
                  </div>
                  <button style={{ background: "#fff", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: isMobile ? "20px 16px" : "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>© 2026 rebuq. All rights reserved.</span>
      </footer>
    </div>
  );
}
