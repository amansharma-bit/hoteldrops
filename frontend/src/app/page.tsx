"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const CARDS = [
  { img: "https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹22,400", name: "Atlantis The Palm, Dubai", pct: "↓19%" },
  { img: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹31,600", name: "The Westin, Maldives", pct: "↓20%" },
  { img: "https://images.pexels.com/photos/28843967/pexels-photo-28843967.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹18,200", name: "Le Meridien, Bali", pct: "↓22%" },
  { img: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹17,400", name: "Hyatt Regency, Bangkok", pct: "↓28%" },
  { img: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹14,800", name: "The Roseate, New Delhi", pct: "↓16%" },
  { img: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹21,000", name: "W Goa", pct: "↓18%" },
  { img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹19,500", name: "Andaz, Singapore", pct: "↓23%" },
  { img: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹26,200", name: "The Langham, London", pct: "↓21%" },
  { img: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹16,900", name: "Four Seasons, Mumbai", pct: "↓25%" },
  { img: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400", price: "₹48,000", name: "Crowne Plaza, Yas Island", pct: "↓12%" },
];

const STATS = [
  { target: 18, prefix: "₹", suffix: "Cr+", label: "Total saved by travelers" },
  { target: 12000, prefix: "", suffix: "+", label: "Indian travelers saving" },
  { target: 28, prefix: "", suffix: "%", label: "Average price drop caught" },
  { target: 24000, prefix: "₹", suffix: "", label: "Average saving per booking" },
];

const TESTIMONIALS = [
  { initials: "PS", name: "Priya Sharma", role: "Product Manager, Bengaluru", saved: "₹24,000", text: "Booked a resort in Maldives and completely forgot about it. rebuq caught a ₹24,000 drop 3 weeks later. The WhatsApp alert was so clear — I rebooked in 10 minutes." },
  { initials: "RM", name: "Rahul Mehta", role: "Startup Founder, Mumbai", saved: "₹80,000+", text: "I travel every month for work. rebuq has saved me over ₹80,000 this year alone. It's the smartest thing I've added to my travel routine." },
  { initials: "AK", name: "Ananya Krishnan", role: "Travel Blogger, Chennai", saved: "₹22,400", text: "Found a ₹22,400 drop in 4 hours — that's how fast rebuq caught a sudden drop in my Dubai booking. This should be mandatory for every traveler." },
];

const FAQS = [
  { q: "Is rebuq really free to check?", a: "Yes — uploading your booking and letting rebuq monitor it is completely free. We only charge a small success fee when we actually save you money. If the price doesn't drop, you pay nothing." },
  { q: "Which OTAs and hotel chains do you support?", a: "We support MakeMyTrip, Booking.com, Agoda, Goibibo, Expedia, Hotels.com, and over 50 direct hotel websites. We're constantly adding new sources." },
  { q: "How do I rebook once you find a drop?", a: "We send you a WhatsApp alert with a direct link to the lower-priced booking. Cancel your old booking (most are free to cancel), rebook at the new rate, and pocket the difference. The whole process usually takes under 10 minutes." },
  { q: "What if I have a non-refundable booking?", a: "We still monitor non-refundable bookings in case the hotel itself offers a price adjustment or the OTA runs a special promotion. However, the primary benefit is for refundable rates." },
];

interface ExtractedData {
  hotel_name: string;
  hotel_city: string;
  check_in: string;
  check_out: string;
  room_type: string;
  original_price: number;
  num_adults: number;
  num_rooms: number;
}

const EMPTY: ExtractedData = { hotel_name: "", hotel_city: "", check_in: "", check_out: "", room_type: "", original_price: 0, num_adults: 2, num_rooms: 1 };

function UploadModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData>({ ...EMPTY });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const B = "#1447b8";
  const NAVY = "#0f172a";
  const inp: React.CSSProperties = { width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827" };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#9ca3af", display: "block", marginBottom: 6 };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) { setFile(f); setDragActive(false); }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function doScan() {
    if (!file) return;
    setScanning(true);
    const msgs = ["Reading your voucher…", "Identifying hotel & dates…", "Extracting pricing…", "Almost done…"];
    let i = 0;
    setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const isImage = file.type.startsWith("image/");
      const contentBlock = isImage
        ? { type: "image", source: { type: "base64", media_type: file.type, data: base64 } }
        : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1024, messages: [{ role: "user", content: [contentBlock, { type: "text", text: 'Extract hotel booking details. Return ONLY JSON:\n{"hotel_name":"","hotel_city":"","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","room_type":"","original_price":0,"currency":"INR","num_adults":2,"num_rooms":1}' }] }] }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.content[0].text.trim().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      const rates: Record<string, number> = { USD: 84, EUR: 112, GBP: 131, AED: 22.9 };
      const priceINR = parsed.currency && parsed.currency !== "INR" ? Math.round(parsed.original_price * (rates[parsed.currency] || 83)) : parsed.original_price;
      clearInterval(interval);
      setExtracted({ hotel_name: parsed.hotel_name || "", hotel_city: parsed.hotel_city || "", check_in: parsed.check_in || "", check_out: parsed.check_out || "", room_type: parsed.room_type || "", original_price: priceINR || 0, num_adults: parsed.num_adults || 2, num_rooms: parsed.num_rooms || 1 });
    } catch {
      clearInterval(interval);
      setExtracted({ ...EMPTY });
    }
    setScanning(false);
    setStep(2);
  }

  async function submitBooking() {
    if (!phone || phone.length < 10) { alert("Please enter a valid WhatsApp number"); return; }
    if (!email) { alert("Please enter your email"); return; }
    if (!extracted.hotel_name) { alert("Please enter hotel name"); return; }
    if (!extracted.check_in) { alert("Please enter check-in date"); return; }
    if (!extracted.check_out) { alert("Please enter check-out date"); return; }
    if (!extracted.original_price) { alert("Please enter the price you paid"); return; }
    setLoading(true);
    try {
      await fetch("https://hoteldrops-production.up.railway.app/api/bookings/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: JSON.stringify({ ...extracted, phone, email }) }),
      });
    } catch (err) { console.error(err); }
    setLoading(false);
    setStep(3);
  }

  const numNights = extracted.check_in && extracted.check_out ? Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000) : 0;
  const stepBar = (active: number) => (
    <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
      {[1,2,3].map(n => <div key={n} style={{ height: 3, flex: 1, borderRadius: 2, background: n < active ? "#16a34a" : n === active ? "#fff" : "rgba(255,255,255,0.3)" }} />)}
    </div>
  );

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: B, zIndex: 1100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.2)", borderTop: "4px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{scanMsg}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Our AI is reading your booking</div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>

        {/* STEP 1 */}
        {step === 1 && <>
          <div style={{ background: B, borderRadius: "20px 20px 0 0", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Free price check — 30 seconds</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>Upload your booking voucher</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>PDF, screenshot or confirmation email</div>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
            {stepBar(1)}
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? B : file ? "#86efac" : "#BFDBFE"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragActive ? "#EFF6FF" : file ? "#f0fdf4" : "#F8FBFF", transition: "all 0.2s", marginBottom: 16 }}>
              <input {...getInputProps()} />
              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 48, height: 48, background: "#dcfce7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#16a34a" }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{(file.size / 1024).toFixed(0)} KB · Ready to scan</div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>✕ Remove</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 48, height: 48, background: "#DBEAFE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Drag &amp; drop your voucher here</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Any hotel confirmation — all major booking platforms</div>
                  <div style={{ fontSize: 12, color: "#d1d5db", margin: "4px 0" }}>— or —</div>
                  <button onClick={(e) => { e.stopPropagation(); (document.querySelector('input[type="file"]') as HTMLInputElement)?.click(); }} style={{ background: B, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 22px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit" }}>Browse file</button>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
              No voucher? <button onClick={() => setStep(2)} style={{ color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Enter manually →</button>
            </div>
            <button onClick={doScan} disabled={!file} style={{ width: "100%", background: file ? NAVY : "#e5e7eb", color: file ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, cursor: file ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s" }}>
              Scan my voucher →
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>Free to check</span> · We only earn when we save you money
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f5" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Works with</span>
              {["All major OTAs", "Direct bookings", "Any PDF voucher"].map(t => (
                <span key={t} style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", padding: "3px 10px", borderRadius: 20 }}>{t}</span>
              ))}
            </div>
          </div>
        </>}

        {/* STEP 2 */}
        {step === 2 && <>
          <div style={{ background: B, borderRadius: "20px 20px 0 0", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Step 2 of 3</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>Confirm your booking</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Review and edit if anything looks wrong</div>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
            {stepBar(2)}
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            {file && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#166534" }}>
                ✨ <span><strong>AI extracted your booking</strong> — verify the details below</span>
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 14 }}>Booking details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Hotel name *</label><input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Taj Dubai" /></div>
              <div><label style={lbl}>City *</label><input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
              <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Room type</label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King" /></div>
              <div><label style={lbl}>Price paid (₹) *</label><input style={inp} type="number" value={extracted.original_price || ""} onChange={e => setExtracted({ ...extracted, original_price: parseFloat(e.target.value) })} placeholder="e.g. 85000" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div><label style={lbl}>Adults</label><select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><label style={lbl}>Rooms</label><select style={inp} value={extracted.num_rooms} onChange={e => setExtracted({ ...extracted, num_rooms: parseInt(e.target.value) })}>{[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 14 }}>Where to send your alert</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={lbl}>WhatsApp number *</label>
                <div style={{ display: "flex" }}>
                  <span style={{ ...inp, width: 52, borderRadius: "8px 0 0 8px", borderRight: "none", background: "#f3f4f6", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>+91</span>
                  <input style={{ ...inp, borderRadius: "0 8px 8px 0", flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                </div>
              </div>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "12px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              <button onClick={submitBooking} disabled={loading} style={{ flex: 1, background: B, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {loading ? "Starting tracker…" : "Start tracking my price →"}
              </button>
            </div>
          </div>
        </>}

        {/* STEP 3 */}
        {step === 3 && <>
          <div style={{ background: NAVY, borderRadius: "20px 20px 0 0", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>🎉 Tracker activated</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>We&apos;re watching 24/7</div>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
            {stepBar(4)}
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26, color: "#16a34a" }}>✓</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Price tracker is live!</div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                We&apos;re monitoring <strong>{extracted.hotel_name}</strong> every 6 hours. The moment the price drops, you&apos;ll get a WhatsApp alert.
              </div>
            </div>
            <div style={{ background: "#f7f9fc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#c8d3de", textAlign: "center", marginBottom: 10 }}>WhatsApp alert preview</div>
              <div style={{ background: "#fff", borderRadius: "10px 10px 10px 2px", padding: "12px 14px", color: "#4a5568", lineHeight: 1.7, fontSize: 13, marginBottom: 8 }}>
                Hi there 👋<br /><br />
                Price drop on your <span style={{ color: B, fontWeight: 600 }}>{extracted.hotel_name}</span>.<br />
                You paid: ₹{extracted.original_price.toLocaleString("en-IN")}<br />
                Available now: <span style={{ color: "#15803d", fontWeight: 700 }}>₹{Math.round(extracted.original_price * 0.8).toLocaleString("en-IN")}</span><br />
                Save <strong>₹{Math.round(extracted.original_price * 0.2).toLocaleString("en-IN")}</strong> — rebook now →
              </div>
              <div style={{ background: B, color: "#fff", borderRadius: "10px 10px 2px 10px", padding: "10px 14px", fontSize: 13, fontWeight: 600, textAlign: "right" }}>YES — rebook now</div>
            </div>
            {numNights > 0 && (
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
                <div><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Hotel</div><div style={{ fontWeight: 600, color: NAVY }}>{extracted.hotel_name}</div></div>
                <div><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Duration</div><div style={{ fontWeight: 600, color: NAVY }}>{numNights} nights</div></div>
                <div><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Price paid</div><div style={{ fontWeight: 600, color: NAVY }}>₹{extracted.original_price.toLocaleString("en-IN")}</div></div>
              </div>
            )}
            <button onClick={onClose} style={{ width: "100%", background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>Back to homepage</button>
            <button onClick={() => { setStep(1); setFile(null); setExtracted({ ...EMPTY }); setPhone(""); setEmail(""); }} style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", color: "#6b7280", borderRadius: 10, padding: 13, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Track another booking</button>
          </div>
        </>}
      </div>
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [carouselPos, setCarouselPos] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({
          name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member",
          email: data.user.email || "",
        });
      }
    });
  }, []);
  const [statValues, setStatValues] = useState(STATS.map(s => ({ prefix: s.prefix, suffix: s.suffix, val: s.target })));
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  const CARD_WIDTH = isMobile ? 200 : 256;
  const VISIBLE = isMobile ? 2 : 4;
  const MAX_POS = CARDS.length - VISIBLE;

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        STATS.forEach((s, i) => {
          let start: number | null = null;
          const duration = 1400;
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const val = Math.floor(progress * s.target);
            setStatValues(prev => { const next = [...prev]; next[i] = { prefix: s.prefix, suffix: s.suffix, val }; return next; });
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const B = "#1447b8";
  const NAVY = "#0f172a";
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const scrollCarousel = (dir: number) => setCarouselPos(prev => Math.max(0, Math.min(MAX_POS, prev + dir)));

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 16, lineHeight: 1.6, WebkitFontSmoothing: "antialiased", overflowX: "hidden", maxWidth: "100vw" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .hotel-card-img { transition: transform 0.3s ease; }
        .hotel-card:hover .hotel-card-img { transform: scale(1.04); }
      `}</style>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
        <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none" }}>
            <li><button onClick={() => scrollTo("how")} style={{ fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>How it works</button></li>
            <li><button onClick={() => window.location.href = "/search-hotels"} style={{ fontSize: 14, color: B, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Exclusive Member Deals</button></li>
          </ul>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!isMobile && (user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href="/dashboard"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: "8px 12px", borderRadius: 8 }} onClick={() => window.location.href="/signin"}>Sign in</button>
          ))}
          {!isMobile && <button onClick={() => setShowModal(true)} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Check my booking</button>}
          {isMobile && (
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", width: 22, height: 2, background: showMenu ? "transparent" : NAVY, transition: "all 0.2s" }} />
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: showMenu ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: showMenu ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && showMenu && (
        <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 99, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { scrollTo("how"); setShowMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>How it works</button>
          <button onClick={() => { window.location.href = "/search-hotels"; }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button>
          <button onClick={() => { window.location.href="/signin"; setShowMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Sign in</button>
          <button onClick={() => { setShowModal(true); setShowMenu(false); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12, textAlign: "center" }}>Check my booking — it&apos;s free</button>
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>Free to check · Pay only if we save you money</p>
        </div>
      )}

      {/* HERO */}
      <section style={{ textAlign: "center", padding: isMobile ? "60px 20px 50px" : "90px 24px 70px", background: "linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e0edff", color: B, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 28, letterSpacing: "0.04em", textTransform: "uppercase" }}>✦ AI-Powered · Watches 24×7</div>
        <h1 className="sora" style={{ fontSize: isMobile ? 36 : 64, fontWeight: 800, lineHeight: 1.1, color: NAVY, maxWidth: 760, margin: "0 auto 20px" }}>
          Your hotel price just dropped. <span style={{ color: B }}>Did you notice?</span>
        </h1>
        <p style={{ fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Booked a hotel? rebuq watches the price 24/7 after you pay. When it drops, we alert you instantly — you rebook and pocket the difference. Free to check.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowModal(true)} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check my booking — it&apos;s free</button>
        </div>
      </section>

      {/* CAROUSEL */}
      <div id="deals" style={{ padding: isMobile ? "40px 0" : "20px 0 60px" }}>
        <div style={{ textAlign: "center", padding: isMobile ? "0 20px 20px" : "0 40px 28px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 12 }}>Real savings · Verified drops</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>rebuq members saved on these hotels</h2>
        </div>
        <div style={{ overflow: "hidden", padding: isMobile ? "0 16px" : "0 40px" }}>
          <div style={{ display: "flex", gap: 16, transform: `translateX(-${carouselPos * (CARD_WIDTH + 16)}px)`, transition: "transform 0.4s cubic-bezier(.4,0,.2,1)" }}>
            {CARDS.map((c, i) => (
              <div key={i} className="hotel-card" style={{ flex: `0 0 ${CARD_WIDTH}px`, borderRadius: 14, overflow: "hidden", position: "relative", height: isMobile ? 160 : 200, cursor: "pointer", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
                <img src={c.img} alt={c.name} className="hotel-card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 60%)" }} />
                <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, display: "block" }}>{c.price}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{c.name}</span>
                </div>
                <div style={{ position: "absolute", top: 12, right: 12, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>{c.pct}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
          <button onClick={() => scrollCarousel(-1)} disabled={carouselPos === 0} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos === 0 ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos === 0 ? 0.4 : 1 }}>‹</button>
          <button onClick={() => scrollCarousel(1)} disabled={carouselPos >= MAX_POS} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos >= MAX_POS ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos >= MAX_POS ? 0.4 : 1 }}>›</button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ padding: isMobile ? "60px 20px" : "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>How it works</p>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Three steps. Zero effort.</h2>
        <p style={{ fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 12 }}>Upload once. We watch forever. You save when the price drops.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 40, marginTop: 60, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column" }}>
            {["Upload", "Watch", "Save"].map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)} style={{ padding: "16px 20px", cursor: "pointer", borderLeft: isMobile ? "none" : `3px solid ${activeStep === i ? B : "#e2e8f0"}`, color: activeStep === i ? B : "#64748b", fontWeight: 600, fontSize: 15, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" as const }}>{s}</button>
            ))}
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 14, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#e0edff", color: B, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, marginBottom: 12 }}>✦ AI-powered</div>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24, lineHeight: 1.7 }}>
              {activeStep === 0 && "Upload your hotel booking confirmation — any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds. No manual entry needed."}
              {activeStep === 1 && "rebuq's AI engine checks your hotel price every 6 hours — day and night. We track flash sales, last-minute drops, and OTA-specific discounts you'd never catch manually."}
              {activeStep === 2 && "The moment we find a drop, you get a WhatsApp alert with a direct rebooking link. Cancel your old booking, rebook at the new rate, pocket the difference."}
            </p>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <span>Live Price Tracker</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#16a34a" }}>
                  <span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />Monitoring
                </span>
              </div>
              {[["MakeMyTrip", "₹41,200", "₹41,000", false], ["Booking.com", "₹41,200", "₹39,400", true], ["Agoda", "₹53,300", "₹53,300", false]].map(([site, orig, curr, drop], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid #e2e8f0" : "none", fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>{site}</span>
                  <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 13 }}>{orig}</span>
                  <span style={{ fontWeight: 700, color: NAVY }}>{curr}</span>
                  {drop ? <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>↓₹1,800</span> : <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>—</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(true)} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>Start for free</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div id="results" style={{ background: "#f8fafc", padding: isMobile ? "60px 20px" : "80px 40px" }} ref={statsRef}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>Real Results</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>₹18 crore saved. And counting.</h2>
          <p style={{ fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 12 }}>12,000+ Indian travelers are already saving on their hotel bookings.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 24, marginTop: 48 }}>
            {statValues.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "28px 24px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
                <div className="sora" style={{ fontSize: 36, fontWeight: 800, color: NAVY }}>{s.prefix}{s.val.toLocaleString("en-IN")}{s.suffix}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{STATS[i].label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20, marginTop: 32 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${B}, #60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{t.initials}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>{t.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div></div>
                </div>
                <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>{t.saved}</div>
                <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>&quot;{t.text}&quot;</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="https://g.page/r/rebuq/review" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: B, fontSize: 14, fontWeight: 600, textDecoration: "none", border: "1.5px solid #c7d8f8", borderRadius: 8, padding: "9px 18px", background: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              See all Google Reviews ↗
            </a>
          </div>
        </div>
      </div>

      {/* QUOTE BANNER */}
      <div style={{ background: NAVY, padding: isMobile ? "50px 20px" : "70px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          {["#93c5fd,#2563eb", "#6ee7b7,#2563eb", "#fca5a5,#f97316"].map((g, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${NAVY}`, background: `linear-gradient(135deg, ${g})`, margin: "0 -4px" }} />
          ))}
        </div>
        <div className="sora" style={{ fontSize: isMobile ? 22 : 38, fontWeight: 700, color: "#fff", maxWidth: 720, margin: "0 auto 20px", lineHeight: 1.25 }}>&quot;This should be mandatory for every Indian traveler who books hotels online.&quot;</div>
        <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>— Ananya Krishnan · Travel Blogger, Chennai</div>
      </div>

      {/* FEATURES */}
      <div id="why" style={{ padding: isMobile ? "60px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>Why rebuq</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Built for travelers who hate leaving money on the table.</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, marginTop: 48 }}>
            <div style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc", gridColumn: isMobile ? "auto" : "1/-1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: "#e0edff", color: B }}>Continuous</span>
                <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>AI that never sleeps</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>Our monitoring AI checks your hotel price every 6 hours — through the night, through weekends. It has found drops as close as the night before check-in.</p>
                <div className="sora" style={{ fontSize: 42, fontWeight: 800, color: B, marginTop: 16 }}>+4,200</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Price drops found this month alone</div>
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div className="sora" style={{ fontWeight: 700, fontSize: 22, color: B }}>24/7 Watching</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Every 6 hours. Day &amp; night.</div>
              </div>
            </div>
            {[
              { badge: "Instant", badgeBg: "#dcfce7", badgeColor: "#166634", title: "WhatsApp alerts", text: "The moment we find a drop, you get a WhatsApp message with a direct rebooking link — no app to install." },
              { badge: "Full Coverage", badgeBg: "#fee2e2", badgeColor: "#991b1b", title: "All major OTAs", text: "MakeMyTrip, Booking.com, Agoda, Goibibo, Hotels.com — we watch them all so you don't have to." },
              { badge: "Zero Risk", badgeBg: "#fef9c3", badgeColor: "#854d0e", title: "Zero-risk pricing", text: "Free to check. We take a small success fee only if we actually save you money. If price doesn't drop, you pay nothing." },
              { badge: "Fast · 6hr avg", badgeBg: "#f3e8ff", badgeColor: "#7c3aed", title: "Catches drops fast", text: "Average time to find a significant price drop: under 6 hours. Some drops are caught within the hour." },
            ].map((f, i) => (
              <div key={i} style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span>
                <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.text}</p>
              </div>
            ))}
            <div style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc", gridColumn: isMobile ? "auto" : "1/-1" }}>
              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: "#f3e8ff", color: "#7c3aed" }}>Privacy-first</span>
              <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Your booking data stays private</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>We only need the hotel name, dates, and price from your confirmation. We never access your payment details, passport information, or OTA login. Your data is encrypted and never sold.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: "#f8fafc", padding: isMobile ? "60px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14 }}>FAQ</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY }}>Common questions</h2>
          <div style={{ marginTop: 36 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, marginBottom: 12, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{ width: "100%", padding: "20px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: NAVY, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" }}>
                  {f.q}<span style={{ fontSize: 20, color: "#64748b", transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <div style={{ padding: "0 24px 20px", fontSize: 14.5, color: "#64748b", lineHeight: 1.7 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BOTTOM */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1447b8 100%)", padding: isMobile ? "60px 20px" : "80px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, marginBottom: 24 }}>Free to check</div>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: "#fff", maxWidth: 600, margin: "0 auto 16px", lineHeight: 1.15 }}>Your next hotel booking could cost less. Let&apos;s find out.</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops. You pay only if we save you money.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowModal(true)} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload my booking now ↗</button>
          <button onClick={() => scrollTo("how")} style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>▶ See how it works</button>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {["Free to check", "No app needed", "Pay only if you save"].map(f => (
            <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span> {f}
            </span>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 28 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <a href="https://twitter.com/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com/company/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="https://instagram.com/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
