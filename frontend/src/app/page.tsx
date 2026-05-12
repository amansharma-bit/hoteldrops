"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

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

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", color: "#0a0a0f" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 62, borderBottom: "1px solid #f0f0f5", background: "#fff", position: "sticky", top: 0, zIndex: 50 },
  logo: { fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" },
  navLinks: { display: "flex", alignItems: "center", gap: 28, fontSize: 13 },
  navLink: { color: "#6b7280", textDecoration: "none" },
  freeLink: { color: "#1447b8", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 },
  freeBadge: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1447b8", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" as const },
  btnGhost: { fontSize: 13, color: "#374151", background: "none", border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" },
  btnSolid: { fontSize: 13, color: "#fff", background: "#1447b8", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" },
};

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [checking, setChecking] = useState(false);

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

  const handleCheck = () => {
    setChecking(true);
    setTimeout(() => router.push("/upload"), 1500);
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.logo}>rebuq<span style={{ color: "#1447b8" }}>.</span></a>
        <div style={s.navLinks}>
          <a href="#how" style={s.navLink}>How it works</a>
          <a href="/search-hotels" style={s.navLink}>Search hotels</a>
          <a href="#" style={s.freeLink}>Join free <span style={s.freeBadge}>Limited time</span></a>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btnGhost}>Sign in</button>
          <button style={s.btnSolid} onClick={() => document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" })}>
            Check my booking — it&apos;s free →
          </button>
        </div>
      </nav>

      <section style={{ background: "#1447b8", padding: "56px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "flex-end", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ paddingBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 28, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              AI-powered · watching 4,200 bookings right now
            </div>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 20 }}>
              <span style={{ fontSize: 46, display: "block", color: "rgba(255,255,255,0.35)" }}>Booked a hotel?</span>
              <span style={{ fontSize: 46, display: "block", color: "rgba(255,255,255,0.35)" }}>We&apos;ll watch the price.</span>
              <span style={{ fontSize: 50, display: "block", color: "#FCD34D" }}>You rebuq when it drops.</span>
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, maxWidth: 380, marginBottom: 28 }}>
              Upload your hotel confirmation. Our AI monitors the price 24/7 and alerts you on WhatsApp the moment a lower rate appears — before your cancellation deadline.
            </p>
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
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
            <div id="upload-zone" style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 28px 0", width: "100%", maxWidth: 400 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "#9ca3af", marginBottom: 10 }}>Free price check — 30 seconds</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Upload your booking voucher</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>PDF, screenshot or confirmation email</div>
              <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? "#1447b8" : file ? "#86efac" : "#BFDBFE"}`, borderRadius: 12, padding: "26px 16px", textAlign: "center", background: dragActive ? "#EFF6FF" : file ? "#f0fdf4" : "#F8FBFF", cursor: "pointer", marginBottom: 12, transition: "all 0.2s" }}>
                <input {...getInputProps()} />
                {file ? (
                  <><div style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 4 }}>✓ {file.name}</div><div style={{ fontSize: 11, color: "#4ade80" }}>Redirecting…</div></>
                ) : (
                  <>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>Drag &amp; drop your voucher here</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>Any hotel confirmation — all major booking platforms</div>
                    <div style={{ fontSize: 11, color: "#d1d5db", margin: "8px 0" }}>— or —</div>
                    <button onClick={e => e.stopPropagation()} style={{ background: "#1447b8", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit" }}>Browse file</button>
                  </>
                )}
              </div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
                No voucher handy?{" "}
                <button onClick={() => setManualOpen(!manualOpen)} style={{ color: "#1447b8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                  {manualOpen ? "Hide ↑" : "Enter details manually →"}
                </button>
              </div>
              {manualOpen && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input placeholder="Hotel name" style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <input placeholder="City" style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="date" style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <input type="date" style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Amount paid" style={{ flex: 2, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <select style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                      <option>INR</option><option>USD</option><option>EUR</option><option>AED</option>
                    </select>
                  </div>
                </div>
              )}
              <button onClick={handleCheck} style={{ width: "100%", background: checking ? "#15803d" : "#111827", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 10, transition: "background 0.3s" }}>
                {checking ? "Scanning live rates…" : "Check if I overpaid →"}
              </button>
              <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", paddingBottom: 18 }}>
                <span style={{ color: "#16A34A", fontWeight: 600 }}>Free to check</span> · We only earn when we save you money
              </div>
              <div style={{ background: "#f9fafb", borderTop: "1px solid #f0f0f5", padding: "12px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Works with</span>
                {["All major OTAs", "Direct bookings", "Any PDF voucher"].map(t => (
                  <span key={t} style={{ fontSize: 10, color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb", padding: "3px 9px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "36px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, maxWidth: 1100, margin: "0 auto" }}>
          {STATS.map((st, i) => (
            <div key={i} style={{ border: "1px solid #f0f0f5", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{st.icon}</div>
              <div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1, color: st.color, marginBottom: 4 }}>{st.num}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ padding: "64px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>How it works</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 42, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 36 }}>Three steps. Zero effort.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ border: `1.5px solid ${step.active ? "#BFDBFE" : "#f0f0f5"}`, borderRadius: 16, padding: "28px 26px", background: step.active ? "#f5f9ff" : "#fff" }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{step.icon}</div>
                <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10, letterSpacing: "-0.3px" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.75 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 40px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#1447b8", marginBottom: 10 }}>Recent wins</div>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 42, fontWeight: 700, letterSpacing: "-1.5px", marginBottom: 32 }}>Real hotels. Real savings.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 56 }}>
            {WINS.map((w, i) => (
              <div key={i} style={{ border: "1.5px solid #f0f0f5", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "18px 20px", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{w.flag}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{w.hotel}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{w.loc}</div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#d1d5db", textDecoration: "line-through" }}>{w.old}</div>
                    <div style={{ color: "#e5e7eb" }}>→</div>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>{w.new}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, marginBottom: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    You kept {w.saved}
                  </div>
                  <div style={{ fontSize: 11, color: "#d1d5db" }}>{w.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0d1b2e", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr auto" }}>
            <div style={{ padding: "48px 52px" }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 10 }}>Your next trip<br />just got cheaper.</h2>
              <p style={{ color: "#4a6278", fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 440 }}>Upload your booking confirmation — free. Our AI starts watching immediately. We only earn when we actually save you money.</p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer" }}>
                Upload my voucher →
              </button>
              <div style={{ fontSize: 11, color: "#2a4a62", marginTop: 12 }}>12,000+ Indian travelers already saving · No credit card needed</div>
            </div>
            <div style={{ background: "#0a1628", padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: 260, borderLeft: "1px solid #1a2d42" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 56, fontWeight: 700, color: "#1447b8", lineHeight: 1 }}>₹18Cr</div>
              <div style={{ fontSize: 13, color: "#4a6278", marginTop: 6, textAlign: "center" }}>saved for travelers</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>and counting</div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #f0f0f5", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>rebuq<span style={{ color: "#1447b8" }}>.</span></div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#9ca3af" }}>
          {["About", "How it works", "Privacy", "Terms", "Contact"].map(l => <a key={l} href="#" style={{ color: "inherit", textDecoration: "none" }}>{l}</a>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            <svg key="ig" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#9ca3af"/></svg>,
            <svg key="x" width="15" height="15" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            <svg key="li" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
            <svg key="wa" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
          ].map((icon, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #f0f0f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{icon}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#d1d5db" }}>© 2026 rebuq · Price protection for smart travelers</div>
      </footer>
    </div>
  );
}
