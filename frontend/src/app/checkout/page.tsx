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

  const hotelName = searchParams.get("hotel") || "Damac Maison Dubai Mall Street";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";
  const roomName = searchParams.get("room") || "Suite Two Bedrooms";
  const price = parseInt(searchParams.get("price") || "14341");
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
  const [extras, setExtras] = useState<Set<number>>(new Set([0]));
  const [specialNote, setSpecialNote] = useState("");

  const REQUESTS = ["Early check-in", "Late check-out", "Airport pickup", "High floor", "Twin beds", "Honeymoon setup"];
  const EXTRAS = [
    { icon: "☕", name: "Breakfast Buffet", tag: "POPULAR", desc: "International spread for 2 guests", price: 1200 },
    { icon: "🚗", name: "Airport Transfer", tag: "", desc: "Private chauffeur, one-way from DXB", price: 2400 },
    { icon: "🕐", name: "Early Check-in", tag: "", desc: "Guaranteed 10 AM check-in", price: 1800 },
  ];

  const taxes = Math.round(price * 0.32);
  const extraTotal = Array.from(extras).reduce((sum, i) => sum + EXTRAS[i].price, 0);
  const discount = couponApplied ? Math.round(price * 0.08) : 0;
  const total = price * nights + extraTotal + taxes - discount;
  const saving = Math.round(price * nights * 0.15) + (couponApplied ? discount : 0);

  const toggleRequest = (i: number) => { setSelectedRequests(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };
  const toggleExtra = (i: number) => { setExtras(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };

  const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const formatDate = (d: string) => { if (!d) return "—"; const dt = new Date(d); return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, WebkitFontSmoothing: "antialiased" as any }}>
      <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .form-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 14px; font-family: inherit; color: ${NAVY}; outline: none; transition: border-color .2s; background: #fff; display: flex; align-items: center; gap: 10px; width: 100%; }
        .form-input:focus-within { border-color: ${B}; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
        .form-input input { border: none; outline: none; font-family: inherit; font-size: 14px; color: ${NAVY}; background: transparent; width: 100%; }
        .form-input input::placeholder { color: #94a3b8; }
        .req-item { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 13px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all .2s; }
        .req-item.selected { border-color: ${B}; background: #eff6ff; }
        .enhance-item { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all .2s; }
        .enhance-item:hover { border-color: ${B}; }
        .enhance-item.added { border-color: ${B}; background: #f0f7ff; }
        .price-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #1e293b; margin-bottom: 10px; }
        .btn-pay { width: 100%; background: linear-gradient(135deg, #1d4ed8, ${B}); color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(20,71,184,0.35); }
        textarea { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; font-family: inherit; color: ${NAVY}; resize: vertical; min-height: 90px; outline: none; transition: border-color .2s; }
        textarea:focus { border-color: ${B}; }
        textarea::placeholder { color: #94a3b8; }
      `}</style>

      {/* NAV — matches homepage */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in / Sign up</button>
          )}
        </div>
      </nav>

      {/* PROGRESS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: NAVY, fontSize: 13.5, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>‹ Back to hotel details</button>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { n: "✓", label: "Select Hotel", state: "done" },
            { n: "2", label: "Guest Details", state: "active" },
            { n: "3", label: "Payment", state: "pending" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s.state === "done" ? "#16a34a" : s.state === "active" ? B : "#e2e8f0", color: s.state === "pending" ? "#64748b" : "#fff" }}>{s.n}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.state === "done" ? "#16a34a" : s.state === "active" ? B : "#64748b" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 60, height: 2, background: i === 0 ? "#16a34a" : "#e2e8f0", margin: "0 8px" }} />}
            </div>
          ))}
        </div>
        <div style={{ width: 180 }} />
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>

        {/* LEFT */}
        <div>
          {/* Hotel summary */}
          <div className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 100, height: 80, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&q=80&fit=crop" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                  {hotelName} <span style={{ color: "#f59e0b", fontSize: 14 }}>★★★★★</span>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>📍 Downtown Dubai</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>9.1</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Exceptional</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>· 1,517 ratings</span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 20 }}>
              {[
                { icon: "📅", label: "CHECK-IN", val: formatDate(checkIn), sub: "2:00 PM" },
                { icon: "📅", label: "CHECK-OUT", val: formatDate(checkOut), sub: "12:00 PM" },
                { icon: "👤", label: "GUESTS", val: `1 Room, ${adults} Guests`, sub: `${nights} Night${nights > 1 ? "s" : ""}` },
              ].map((b, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{b.icon}</span>{b.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{b.val}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Room selected */}
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 18, color: "#16a34a", flexShrink: 0 }}>🛡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>Free cancellation available</div>
              <div style={{ fontSize: 12.5, color: "#15803d" }}>No payment needed today · Pay at hotel option available · Room: {roomName}</div>
            </div>
          </div>

          {/* Guest details */}
          <div className="card">
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Guest Details</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Primary guest staying at the hotel</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><span style={{ color: "#94a3b8", fontSize: 15 }}>👤</span><input type="text" placeholder="Aarav" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><input type="text" placeholder="Sharma" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Title</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {["Mr.", "Ms.", "Mrs."].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{ border: `1.5px solid ${title === t ? B : "#e2e8f0"}`, borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: title === t ? 600 : 500, fontFamily: "inherit", background: title === t ? B : "#fff", color: title === t ? "#fff" : NAVY, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, color: B, fontSize: 13.5, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Add another guest</button>
          </div>

          {/* Contact details */}
          <div className="card">
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Contact Details</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>We&apos;ll send your booking confirmation here</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><span style={{ color: "#94a3b8" }}>✉</span><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input"><span style={{ color: "#94a3b8" }}>📞</span><input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setWhatsapp(!whatsapp)}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: whatsapp ? B : "#fff", border: `2px solid ${whatsapp ? B : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, flexShrink: 0 }}>{whatsapp ? "✓" : ""}</div>
              <span style={{ fontSize: 13.5, color: "#1e293b", fontWeight: 500 }}>Send booking updates on WhatsApp</span>
            </div>
          </div>

          {/* Special requests */}
          <div className="card">
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Special Requests</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Optional — hotel will try to accommodate</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {REQUESTS.map((r, i) => (
                <div key={i} className={`req-item${selectedRequests.has(i) ? " selected" : ""}`} onClick={() => toggleRequest(i)}>
                  <div style={{ width: 17, height: 17, border: `1.5px solid ${selectedRequests.has(i) ? B : "#e2e8f0"}`, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: selectedRequests.has(i) ? B : "#fff", color: "#fff", fontSize: 11 }}>{selectedRequests.has(i) ? "✓" : ""}</div>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "#1e293b" }}>{r}</span>
                </div>
              ))}
            </div>
            <textarea placeholder="Anything else? (max 500 chars)" maxLength={500} value={specialNote} onChange={e => setSpecialNote(e.target.value)} />
          </div>

          {/* Enhance your stay */}
          <div className="card">
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Enhance Your Stay</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Add extras now and save vs booking later</div>
            {EXTRAS.map((e, i) => {
              const added = extras.has(i);
              return (
                <div key={i} className={`enhance-item${added ? " added" : ""}`} onClick={() => toggleExtra(i)}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: added ? B : "#f8fafc", color: added ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{e.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      {e.name}
                      {e.tag && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{e.tag}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#64748b" }}>{e.desc}</div>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>+{formatINR(e.price)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: added ? "#16a34a" : B, marginTop: 4 }}>{added ? "Added ✓" : "Add"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ position: "sticky", top: 76, alignSelf: "flex-start" as const, display: "flex", flexDirection: "column" as const, gap: 16 }}>
          {/* Coupon */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 14 }}>🏷 Apply Coupon</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="REBUQ8"
                style={{ flex: 1, border: "1.5px dashed #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", color: NAVY, outline: "none", letterSpacing: "0.06em", fontWeight: 600 }} />
              <button onClick={() => { if (coupon === "REBUQ8") setCouponApplied(true); }}
                style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Apply</button>
            </div>
            {couponApplied && <div style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 600 }}>✓ REBUQ8 applied — 8% off!</div>}
            {!couponApplied && <div style={{ fontSize: 12.5, color: "#64748b" }}>Try <span style={{ color: B, fontWeight: 600, cursor: "pointer" }} onClick={() => setCoupon("REBUQ8")}>REBUQ8</span> for 8% off</div>}
          </div>

          {/* Price summary */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Price Summary</div>
            <div className="price-row"><span style={{ color: "#64748b" }}>Room price × {nights} night{nights > 1 ? "s" : ""}</span><span style={{ fontWeight: 600, color: NAVY }}>{formatINR(price * nights)}</span></div>
            {Array.from(extras).map(i => (
              <div key={i} className="price-row"><span style={{ color: "#64748b" }}>{EXTRAS[i].name}</span><span style={{ fontWeight: 600, color: NAVY }}>{formatINR(EXTRAS[i].price)}</span></div>
            ))}
            <div className="price-row"><span style={{ color: "#64748b" }}>Taxes & Service Fees</span><span style={{ fontWeight: 600, color: NAVY }}>{formatINR(taxes)}</span></div>
            {couponApplied && <div className="price-row"><span style={{ color: "#16a34a", fontWeight: 600 }}>Coupon REBUQ8</span><span style={{ fontWeight: 600, color: "#16a34a" }}>−{formatINR(discount)}</span></div>}
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Total Payable</div><div style={{ fontSize: 12, color: "#64748b" }}>incl. all taxes</div></div>
              <div className="sora" style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{formatINR(total)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", margin: "14px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#16a34a", fontWeight: 600 }}>
              🌱 You&apos;re saving <strong style={{ color: "#15803d" }}>&nbsp;{formatINR(saving)}&nbsp;</strong> on this booking
            </div>
            <button className="btn-pay">🔒 Pay {formatINR(total)} Securely</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              <span>🔒 SSL Secured</span><span>💳 All cards · UPI · Wallets</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, textAlign: "center" as const, marginTop: 14 }}>
              By proceeding, you agree to our <a href="#" style={{ color: B, fontWeight: 600, textDecoration: "none" }}>Terms</a> and <a href="#" style={{ color: B, fontWeight: 600, textDecoration: "none" }}>Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
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
