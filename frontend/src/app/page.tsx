"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const WINS = [
  { flag: "🇦🇪", hotel: "Taj Jumeirah Lakes Towers", loc: "Dubai · 4 nights · Dec 14–18", old: "₹1,12,000", new: "₹89,600", saved: "₹22,400", time: "Found in 18 hrs · refundable booking" },
  { flag: "🇹🇭", hotel: "Park Hyatt Bangkok", loc: "Bangkok · 4 nights · Jan 3–7", old: "₹1,58,000", new: "₹1,26,400", saved: "₹31,600", time: "Found in 6 hrs · refundable booking" },
  { flag: "🇮🇩", hotel: "W Bali Seminyak", loc: "Bali · 4 nights · Feb 8–12", old: "₹91,000", new: "₹72,800", saved: "₹18,200", time: "Found in 31 hrs · refundable booking" },
];

const STATS = [
  { color: "#1447b8", bg: "#EFF6FF", num: "₹18Cr", label: "Saved for Indian travelers", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { color: "#16a34a", bg: "#F0FDF4", num: "28%", label: "Avg. price drop found", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { color: "#7c3aed", bg: "#F5F3FF", num: "2.4L+", label: "Bookings monitored", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { color: "#ca8a04", bg: "#FEFCE8", num: "4.9/5", label: "Customer satisfaction", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
];

const STEPS = [
  { bg: "#DBEAFE", active: true, title: "Upload your voucher", desc: "Drop your booking confirmation — PDF, screenshot, or email. Our AI reads the hotel, dates, and price paid in seconds.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  { bg: "#F5F3FF", active: false, title: "Our AI watches 24/7", desc: "Our AI checks live rates every 6 hours. Same hotel, same room, same dates — until your cancellation deadline.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> },
  { bg: "#F0FDF4", active: false, title: "WhatsApp alert. You rebuq.", desc: "Price drops — instant WhatsApp alert. Cancel your old booking, we rebook at the lower rate. You keep the savings.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.42 2 2 0 0 1 3.62 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg> },
];

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) { setFile(f); setTimeout(() => router.push("/upload"), 700); }
  }, [router]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const handleCheck = () => { setChecking(true); setTimeout(() => router.push("/upload"), 1500); };

  const px = isMobile ? "16px" : "40px";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: "#0a0a0f" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}`, height: 62, borderBottom: "1px solid #f0f0f5", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13 }}>
            <a href="#how" style={{ color: "#6b7280", textDecoration: "none" }}>How it works</a>
            <a href="/search-hotels" style={{ color: "#6b7280", textDecoration: "none" }}>Search hotels</a>
            <a href="#" style={{ color: "#1447b8", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              Join free <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1447b8", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>Limited time</span>
            </a>
          </div>
        )}
        {!isMobile ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ fontSize: 13, color: "#374151", background: "none", border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
            <button onClick={handleCheck} style={{ fontSize: 13, color: "#fff", background: "#1447b8", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Check my booking →
            </button>
          </div>
        ) : (
          <button onClick={handleCheck} style={{ fontSize: 12, color: "#fff", background: "#1447b8", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
            Check booking →
          </button>
        )}
      </nav>

      {/* Hero */}
      <section style={{ background: "#1447b8", padding: isMobile ? "32px 16px 0" : "56px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 48, alignItems: "flex-end", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ paddingBottom: isMobile ? 24 : 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              AI-powered · watching 4,200 bookings
            </div>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, lineHeight: 1.08, letterSpacing: isMobile ? "-1px" : "-2px", marginBottom: 16 }}>
              <span style={{ fontSize: isMobile ? 28 : 46, display: "block", color: "rgba(255,255,255,0.35)" }}>Booked a hotel?</span>
              <span style={{ fontSize: isMobile ? 28 : 46, display: "block", color: "rgba(255,255,255,0.35)" }}>We&apos;ll watch the price.</span>
              <span style={{ fontSize: isMobile ? 32 : 50, display: "block", color: "#FCD34D" }}>You rebuq when it drops.</span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, maxWidth: 380, marginBottom: 20 }}>
              Upload your hotel confirmation. Our AI monitors the price 24/7 and alerts you on WhatsApp.
            </p>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex" }}>
                  {[["#7C3AED","RS"],["#059669","AM"],["#DC2626","PK"],["#D97706","JL"],["#1e3a6b","+"]].map(([bg, label], i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: bg, border: "2px solid #1447b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginLeft: i === 0 ? 0 : -8 }}>{label}</div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  <strong style={{ color: "rgba(255,255,255,0.85)" }}>12,000+ Indian travelers</strong> already saving<br />
                  Average saving: <strong style={{ color: "rgba(255,255,255,0.85)" }}>₹24,000 per booking</strong>
                </div>
              </div>
            )}
          </div>

          {/* Upload card */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
            <div id="upload-zone" style={{ background: "#fff", borderRadius: isMobile ? "16px 16px 0 0" : "20px 20px 0 0", padding: isMobile ? "20px 20px 0" : "28px 28px 0", width: "100%" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "#9ca3af", marginBottom: 8 }}>Free price check — 30 seconds</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Upload your booking voucher</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>PDF, screenshot or confirmation email</div>
              <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? "#1447b8" : file ? "#86efac" : "#BFDBFE"}`, borderRadius: 12, padding: isMobile ? "20px 12px" : "26px 16px", textAlign: "center", background: dragActive ? "#EFF6FF" : file ? "#f0fdf4" : "#F8FBFF", cursor: "pointer", marginBottom: 10, transition: "all 0.2s" }}>
                <input {...getInputProps()} />
                {file ? (
                  <><div style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 4 }}>✓ {file.name}</div><div style={{ fontSize: 11, color: "#4ade80" }}>Redirecting…</div></>
                ) : (
                  <>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>
                      {isMobile ? "Tap to upload your voucher" : "Drag & drop your voucher here"}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>PDF, PNG, JPG · Any booking platform</div>
                    <div style={{ fontSize: 11, color: "#d1d5db", margin: "6px 0" }}>— or —</div>
                    <button onClick={e => e.stopPropagation()} style={{ background: "#1447b8", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit" }}>Browse file</button>
                  </>
                )}
              </div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                No voucher? <button onClick={() => setManualOpen(!manualOpen)} style={{ color: "#1447b8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Enter manually →</button>
              </div>
              {manualOpen && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input placeholder="Hotel name" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <input placeholder="City" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input type="date" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <input type="date" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  </div>
                </div>
              )}
              <button onClick={handleCheck} style={{ width: "100%", background: checking ? "#15803d" : "#111827", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 10, transition: "background 0.3s" }}>
                {checking ? "Scanning live rates…" : "Check if I overpaid →"}
              </button>
              <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", paddingBottom: 16 }}>
                <span style={{ color: "#16A34A", fontWeight: 600 }}>Free to check</span> · We only earn when we save you money
              </div>
              <div style={{ background: "#f9fafb", borderTop: "1px solid #f0f0f5", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Works with</span>
                {["All major OTAs", "Direct bookings", "Any PDF voucher"].map(t => (
                  <span key={t} style={{ fontSize: 10, color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb", padding: "3px 9px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: isMobile ? "24px 16px 0" : "36px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, maxWidth: 1100, margin: "0 auto" }}>
          {STATS.map((st, i) => (
            <div key={i} style={{ border: "1px solid #f0f0f5", borderRadius: 14, padding: isMobile ? "14px 16px" : "20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{st.icon}</div>
              <div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, lineHeight: 1, color: st.color, marginBottom: 3 }}>{st.num}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: isMobile ? "48px 16px" : "64px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>How it works</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 28 : 42, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 28 }}>Three steps. Zero effort.</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ border: `1.5px solid ${step.active ? "#BFDBFE" : "#f0f0f5"}`, borderRadius: 16, padding: "24px 22px", background: step.active ? "#f5f9ff" : "#fff" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{step.icon}</div>
                <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent wins */}
      <section style={{ padding: isMobile ? "0 16px 48px" : "0 40px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Recent wins</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 28 : 42, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 24 }}>Real hotels. Real savings.</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 40 }}>
            {WINS.map((w, i) => (
              <div key={i} style={{ border: "1.5px solid #f0f0f5", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{w.flag}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{w.hotel}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{w.loc}</div>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: "#d1d5db", textDecoration: "line-through" }}>{w.old}</div>
                    <div style={{ color: "#e5e7eb" }}>→</div>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 700, color: "#111827" }}>{w.new}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    You kept {w.saved}
                  </div>
                  <div style={{ fontSize: 11, color: "#d1d5db" }}>{w.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA band */}
          <div style={{ background: "#0d1b2e", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto" }}>
            <div style={{ padding: isMobile ? "32px 24px" : "48px 52px" }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 10 }}>Your next trip<br />just got cheaper.</h2>
              <p style={{ color: "#4a6278", fontSize: 13, lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>Upload your booking confirmation — free. Our AI starts watching immediately.</p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "13px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer" }}>
                Upload my voucher →
              </button>
              <div style={{ fontSize: 11, color: "#2a4a62", marginTop: 10 }}>12,000+ Indian travelers already saving</div>
            </div>
            {!isMobile && (
              <div style={{ background: "#0a1628", padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: 240, borderLeft: "1px solid #1a2d42" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 52, fontWeight: 700, color: "#1447b8", lineHeight: 1 }}>₹18Cr</div>
                <div style={{ fontSize: 13, color: "#4a6278", marginTop: 6 }}>saved for travelers</div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>and counting</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f0f0f5", padding: isMobile ? "16px" : "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
          {["About", "How it works", "Privacy", "Terms"].map(l => <a key={l} href="#" style={{ color: "inherit", textDecoration: "none" }}>{l}</a>)}
        </div>
        <div style={{ fontSize: 11, color: "#d1d5db" }}>© 2026 rebuq</div>
      </footer>
    </div>
  );
}
