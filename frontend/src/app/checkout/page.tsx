"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


const B = "#1447b8";
const NAVY = "#0f172a";

/* Flat, modern line icons — same stroke style used across the rest of rebuq */
const IconCalendar = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconUsers = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconUser = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg>;
const IconMail = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>;
const IconPhone = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconTag = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 11.6 4.42a2 2 0 0 0-1.42-.59H4a2 2 0 0 0-2 2v6.17a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.83 0l6.17-6.17a2 2 0 0 0 0-2.84z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>;
const IconLock = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconLeaf = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 1 5.5 1 9 0 4-2 9-9 9z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.7 14.43 12 13 13 9" /></svg>;
const IconPin = ({ size = 12 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconCheck = ({ size = 10 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconCard = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
const IconChevron = ({ size = 14, open }: { size?: number; open: boolean }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>;
const IconBuilding = ({ size = 34 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6"><path d="M3 21V8l9-5 9 5v13M3 21h18M9 21V13h6v8" /></svg>;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member" });
      }
    });
  }, []);

  const hotelName = searchParams.get("hotel") || "Hotel";
  const address = searchParams.get("address") || "";
  const city = searchParams.get("city") || "";
  const img = searchParams.get("img") || "";
  const stars = parseInt(searchParams.get("stars") || "0");
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";
  const rooms = searchParams.get("rooms") || "1";
  const children = parseInt(searchParams.get("children") || "0");
  const childAges = (searchParams.get("childAges") || "").split(",").map(s => parseInt(s)).filter(n => !isNaN(n));
  const roomName = searchParams.get("room") || "Room";
  const price = parseInt(searchParams.get("price") || "0");
  const board = searchParams.get("board") || "";
  const refundable = searchParams.get("refundable") === "1";
  const cancelInfo = searchParams.get("cancelInfo") || (refundable ? "Free cancellation" : "Non-refundable");
  const checkInTime = searchParams.get("checkInTime") || "";
  const checkOutTime = searchParams.get("checkOutTime") || "";
  const importantInfo = searchParams.get("importantInfo") || "";
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

  const [title, setTitle] = useState("Mr.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [specialNote, setSpecialNote] = useState("");
  const [specialOpen, setSpecialOpen] = useState(false);
  const [policyExpanded, setPolicyExpanded] = useState(false);

  const REQUESTS = ["Smoking room", "Late check-in", "Early check-in", "Room on a high floor", "Large bed", "Twin beds", "Airport transfer"];
  const POLICY_PREVIEW_LEN = 180;
  const policyIsLong = importantInfo.length > POLICY_PREVIEW_LEN;
  const policyDisplay = policyExpanded || !policyIsLong ? importantInfo : importantInfo.slice(0, POLICY_PREVIEW_LEN).trim() + "…";

  const taxes = Math.round(price * 0.32);
  const discount = couponApplied ? Math.round(price * 0.08) : 0;
  const total = price * nights + taxes - discount;
  const saving = Math.round(price * nights * 0.15) + (couponApplied ? discount : 0);

  const toggleRequest = (i: number) => { setSelectedRequests(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };

  const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const formatDate = (d: string) => { if (!d) return "—"; const dt = new Date(d); return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
  const formatTime = (t: string) => { if (!t) return "—"; const [h, m] = t.split(":"); const hh = parseInt(h); const ampm = hh >= 12 ? "PM" : "AM"; const h12 = hh % 12 === 0 ? 12 : hh % 12; return `${h12}:${m || "00"} ${ampm}`; };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, WebkitFontSmoothing: "antialiased" as any, overflowX: "hidden" as const, width: "100%" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }
        .sora { font-family: 'Sora', sans-serif; }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .form-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 14px; font-family: inherit; color: ${NAVY}; outline: none; transition: border-color .2s; background: #fff; display: flex; align-items: center; gap: 10px; width: 100%; }
        .form-input:focus-within { border-color: ${B}; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
        .form-input input { border: none; outline: none; font-family: inherit; font-size: 14px; color: ${NAVY}; background: transparent; width: 100%; min-width: 0; }
        .form-input input::placeholder { color: #94a3b8; }
        .req-item { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 13px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all .2s; }
        .req-item.selected { border-color: ${B}; background: #eff6ff; }
        .price-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #1e293b; margin-bottom: 10px; }
        .btn-pay { width: 100%; background: linear-gradient(135deg, #1d4ed8, ${B}); color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(20,71,184,0.35); }
        textarea { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; font-family: inherit; color: ${NAVY}; resize: vertical; min-height: 90px; outline: none; transition: border-color .2s; }
        textarea:focus { border-color: ${B}; }
        textarea::placeholder { color: #94a3b8; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .hotel-meta { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .info-row { display: grid; grid-template-columns: 140px 1fr; gap: 16px; }
        .back-short { display: none; }
        .step-label { display: inline; }
        .progress-spacer { display: block; }
        @media (max-width: 768px) {
          .ckgrid { grid-template-columns: 1fr !important; }
          .ckside { position: static !important; }
          .ck-nav { padding: 0 16px !important; gap: 12px !important; }
          .nav-extra { display: none !important; }
          .ck-progress { padding: 12px 16px !important; }
          .progress-spacer { display: none !important; }
          .back-full { display: none !important; }
          .back-short { display: inline !important; }
          .step-label { display: none !important; }
          .ck-main { padding: 16px 16px 90px !important; gap: 0 !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .hotel-meta { grid-template-columns: 1fr !important; }
          .info-row { grid-template-columns: 1fr !important; gap: 4px !important; }
          .card { padding: 18px !important; }
        }
      `}</style>

      {/* NAV — matches homepage */}
      <nav className="ck-nav" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="/search-hotels" className="nav-extra" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{user.name[0].toUpperCase()}</div>
              <span className="nav-extra" style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in</button>
          )}
        </div>
      </nav>

      {/* PROGRESS */}
      <div className="ck-progress" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: NAVY, fontSize: 13.5, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          <span className="back-full">‹ Back to hotel details</span><span className="back-short">‹ Back</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { n: "✓", label: "Select Hotel", state: "done" },
            { n: "2", label: "Guest Details", state: "active" },
            { n: "3", label: "Payment", state: "pending" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s.state === "done" ? "#16a34a" : s.state === "active" ? B : "#e2e8f0", color: s.state === "pending" ? "#64748b" : "#fff", flexShrink: 0 }}>{s.n === "✓" ? <IconCheck size={12} /> : s.n}</div>
                <span className="step-label" style={{ fontSize: 13, fontWeight: 600, color: s.state === "done" ? "#16a34a" : s.state === "active" ? B : "#64748b" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 40, height: 2, background: i === 0 ? "#16a34a" : "#e2e8f0", margin: "0 8px" }} />}
            </div>
          ))}
        </div>
        <div className="progress-spacer" style={{ width: 100, flexShrink: 0 }} />
      </div>

      {/* MAIN — full width, matches search/search-hotels pages */}
      <div className="ckgrid ck-main" style={{ width: "100%", padding: "24px 32px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, boxSizing: "border-box" as const }}>

        {/* LEFT */}
        <div style={{ minWidth: 0 }}>
          {/* Hotel section */}
          <div className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 100, height: 80, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {img ? (
                  <img src={img} alt={hotelName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <IconBuilding />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                  {hotelName} {stars > 0 && <span style={{ color: "#f59e0b", fontSize: 14 }}>{"★".repeat(stars)}</span>}
                </div>
                {(address || city) && <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}><IconPin size={12} />{address || city}</div>}
              </div>
            </div>
            <div className="hotel-meta" style={{ marginTop: 20 }}>
              {[
                { icon: <IconCalendar />, label: "CHECK-IN", val: formatDate(checkIn), sub: checkInTime ? formatTime(checkInTime) : "" },
                { icon: <IconCalendar />, label: "CHECK-OUT", val: formatDate(checkOut), sub: checkOutTime ? formatTime(checkOutTime) : "" },
                { icon: <IconUsers />, label: "GUESTS", val: `${rooms} Room${parseInt(rooms) > 1 ? "s" : ""}, ${adults} Adult${parseInt(adults) > 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}`, sub: `${nights} Night${nights > 1 ? "s" : ""}` },
              ].map((b, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    {b.icon}{b.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{b.val}</div>
                  {b.sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{b.sub}</div>}
                </div>
              ))}
            </div>
            {children > 0 && childAges.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Age of children at check-in</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {childAges.map((age, i) => (
                    <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: NAVY, background: "#f1f5f9", padding: "4px 10px", borderRadius: 20 }}>Child {i + 1}: {age === 0 ? "Under 1" : `${age} yr`}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="two-col" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4 }}>Room Type</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{roomName}</div>
                {board && <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 1 }}>{board}</div>}
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4 }}>Cancellation Policy</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: refundable ? "#16a34a" : "#dc2626" }}>{cancelInfo}</div>
              </div>
            </div>
          </div>

          {/* Guest + Contact details — merged */}
          <div className="card">
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Customer Details</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Primary guest staying at the hotel</div>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Title</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {["Mr.", "Ms.", "Mrs."].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{ border: `1.5px solid ${title === t ? B : "#e2e8f0"}`, borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: title === t ? 600 : 500, fontFamily: "inherit", background: title === t ? B : "#fff", color: title === t ? "#fff" : NAVY, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>

            <div className="two-col" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><IconUser size={15} /><input type="text" placeholder="Aarav" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><input type="text" placeholder="Sharma" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
            </div>

            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, color: B, fontSize: 13.5, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>+ Add another guest</button>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>We&apos;ll send your booking confirmation here</div>
              <div className="two-col" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input"><IconMail size={15} /><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input"><IconPhone size={15} /><input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setWhatsapp(!whatsapp)}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: whatsapp ? B : "#fff", border: `2px solid ${whatsapp ? B : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{whatsapp && <IconCheck size={11} />}</div>
                <span style={{ fontSize: 13.5, color: "#1e293b", fontWeight: 500 }}>Send booking updates on WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Important Information */}
          {(checkInTime || checkOutTime || importantInfo) && (
            <div className="card">
              <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Important Information</div>
              {[
                checkInTime ? { label: "Check-in", value: `From ${formatTime(checkInTime)}`, long: false } : null,
                checkOutTime ? { label: "Check-out", value: `Until ${formatTime(checkOutTime)}`, long: false } : null,
                importantInfo ? { label: "Property Policies", value: policyDisplay, long: true } : null,
              ].filter(Boolean).map((p: any, i, arr) => (
                <div key={i} className="info-row" style={{ padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{p.label}</div>
                  <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7 }}>
                    {p.value}
                    {p.long && policyIsLong && (
                      <button onClick={() => setPolicyExpanded(!policyExpanded)} style={{ display: "block", marginTop: 4, background: "none", border: "none", color: B, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                        {policyExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Request — accordion, closed by default */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setSpecialOpen(!specialOpen)}>
              <div>
                <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: specialOpen ? 4 : 0 }}>Special Request</div>
                {specialOpen && <div style={{ fontSize: 12.5, color: "#dc2626" }}>Special requests are subject to each hotel&apos;s availability, may be chargeable &amp; can&apos;t be guaranteed.</div>}
              </div>
              <span style={{ color: B, flexShrink: 0, marginLeft: 12, marginTop: 2 }}><IconChevron open={specialOpen} /></span>
            </div>
            {specialOpen && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Commonly Requested</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                  {REQUESTS.map((r, i) => (
                    <div key={i} className={`req-item${selectedRequests.has(i) ? " selected" : ""}`} onClick={() => toggleRequest(i)}>
                      <div style={{ width: 17, height: 17, border: `1.5px solid ${selectedRequests.has(i) ? B : "#e2e8f0"}`, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: selectedRequests.has(i) ? B : "#fff", color: "#fff" }}>{selectedRequests.has(i) && <IconCheck size={10} />}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "#1e293b" }}>{r}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Any other request?</div>
                <textarea placeholder="Enter your special request" maxLength={500} value={specialNote} onChange={e => setSpecialNote(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="ckside" style={{ position: "sticky", top: 76, alignSelf: "flex-start" as const, display: "flex", flexDirection: "column" as const, gap: 16, minWidth: 0 }}>
          {/* Coupon */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 14 }}><IconTag />Apply Coupon</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="REBUQ8"
                style={{ flex: 1, border: "1.5px dashed #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: NAVY, outline: "none", letterSpacing: "0.06em", fontWeight: 600, minWidth: 0 }} />
              <button onClick={() => { if (coupon === "REBUQ8") setCouponApplied(true); }}
                style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Apply</button>
            </div>
            {couponApplied && <div style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><IconCheck size={11} /> REBUQ8 applied — 8% off!</div>}
            {!couponApplied && <div style={{ fontSize: 12.5, color: "#64748b" }}>Try <span style={{ color: B, fontWeight: 600, cursor: "pointer" }} onClick={() => setCoupon("REBUQ8")}>REBUQ8</span> for 8% off</div>}
          </div>

          {/* Price summary */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Price Summary</div>
            <div className="price-row"><span style={{ color: "#64748b" }}>Room price × {nights} night{nights > 1 ? "s" : ""}</span><span style={{ fontWeight: 600, color: NAVY }}>{formatINR(price * nights)}</span></div>
            <div className="price-row"><span style={{ color: "#64748b" }}>Taxes & Service Fees</span><span style={{ fontWeight: 600, color: NAVY }}>{formatINR(taxes)}</span></div>
            {couponApplied && <div className="price-row"><span style={{ color: "#16a34a", fontWeight: 600 }}>Coupon REBUQ8</span><span style={{ fontWeight: 600, color: "#16a34a" }}>−{formatINR(discount)}</span></div>}
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Total Payable</div><div style={{ fontSize: 12, color: "#64748b" }}>incl. all taxes</div></div>
              <div className="sora" style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{formatINR(total)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", margin: "14px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#16a34a", fontWeight: 600 }}>
              <IconLeaf /> You&apos;re saving <strong style={{ color: "#15803d" }}>&nbsp;{formatINR(saving)}&nbsp;</strong> on this booking
            </div>
            <button className="btn-pay"><IconLock /> Pay {formatINR(total)} Securely</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconLock size={13} /> SSL Secured</span><span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconCard size={13} /> All cards · UPI · Wallets</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, textAlign: "center" as const, marginTop: 14 }}>
              By proceeding, you agree to our <a href="#" style={{ color: B, fontWeight: 600, textDecoration: "none" }}>Terms</a> and <a href="#" style={{ color: B, fontWeight: 600, textDecoration: "none" }}>Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" as const }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              {[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
