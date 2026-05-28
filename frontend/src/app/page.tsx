"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useDropzone } from "react-dropzone";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";

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

interface ExtractedData {
  hotel_name: string; hotel_city: string; check_in: string; check_out: string;
  total_nights: number; room_type: string; num_adults: number; num_children: number;
  children_ages: (number | null)[]; num_rooms: number; board_basis: string;
  board_basis_label: string; rate_plan_name: string; original_price: number;
  total_price_paid: number; price_per_night: number; currency_original: string;
  ota_name: string; booking_reference: string; cancellation_policy: string;
  cancellation_deadline: string; cancellation_penalty: number | null;
  payment_type: string; amount_paid_upfront: number;
}

const emptyExtracted = (): ExtractedData => ({
  hotel_name: '', hotel_city: '', check_in: '', check_out: '', total_nights: 0,
  room_type: '', num_adults: 2, num_children: 0, children_ages: [], num_rooms: 1,
  board_basis: 'RO', board_basis_label: 'Room Only', rate_plan_name: '',
  original_price: 0, total_price_paid: 0, price_per_night: 0, currency_original: 'INR',
  ota_name: '', booking_reference: '',
  cancellation_policy: 'unknown', cancellation_deadline: '', cancellation_penalty: null,
  payment_type: 'pay_now', amount_paid_upfront: 0,
})

const BOARD_OPTIONS = [
  { code: 'RO', label: 'Room Only' },
  { code: 'BB', label: 'Bed & Breakfast' },
  { code: 'HB', label: 'Half Board' },
  { code: 'FB', label: 'Full Board' },
  { code: 'AI', label: 'All Inclusive' },
]

const CANCEL_OPTIONS = [
  { code: 'free', label: '✅ Free cancellation' },
  { code: 'partial', label: '⚠️ Partial refund' },
  { code: 'non-refundable', label: '❌ Non-refundable' },
  { code: 'unknown', label: '❓ Not sure' },
]

const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: NAVY }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#64748b', display: 'block', marginBottom: 6 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

const EXTRACTION_PROMPT = `You are a hotel booking voucher parser for rebuq, an Indian travel price-tracking service.
Extract ALL fields from this hotel booking confirmation/voucher.
Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation.
PRICING: total_price_paid = FINAL amount after discounts. Convert non-INR: EUR=112, USD=84, GBP=107, AED=22.8, THB=2.3, AMD=0.21, MYR=18, JPY=0.56, OMR=218, SAR=22.4, QAR=23.1, NPR=0.63
CANCELLATION: "free"=refundable, "partial"=some penalty, "non-refundable"=no refund, "unknown"=cannot determine
BOARD: RO=Room Only, BB=Bed & Breakfast, HB=Half Board, FB=Full Board, AI=All Inclusive
{
  "hotel_name":"exact name","hotel_city":"city only","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD",
  "total_nights":number,"room_type":"exact type","num_adults":number,"num_children":number,
  "children_ages":[],"num_rooms":number,"board_basis":"RO|BB|HB|FB|AI",
  "board_basis_label":"Room Only|Bed & Breakfast|Half Board|Full Board|All Inclusive",
  "rate_plan_name":"or null","original_price":number,"total_price_paid":number,"price_per_night":number,
  "currency_original":"INR|EUR|USD|AED|THB|GBP|SGD",
  "ota_name":"MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Direct|Other",
  "booking_reference":"PNR or null","cancellation_policy":"free|partial|non-refundable|unknown",
  "cancellation_deadline":"YYYY-MM-DD or null","cancellation_penalty":number or null,
  "payment_type":"pay_now|pay_at_property|partial_payment","amount_paid_upfront":0
}`

const CARDS = [
  { img: "/atlantisdubai.jpg", price: "₹22,400", name: "Atlantis The Palm, Dubai", pct: "↓19%" },
  { img: "/Westinmaldives.jpg", price: "₹31,600", name: "The Westin, Maldives", pct: "↓20%" },
  { img: "/lemeridienbali.jpg", price: "₹18,200", name: "Le Meridien, Bali", pct: "↓22%" },
  { img: "/hyattregencybangkok.jpg", price: "₹17,400", name: "Hyatt Regency, Bangkok", pct: "↓28%" },
  { img: "/theroseatenewdelhi.jpg", price: "₹14,800", name: "The Roseate, New Delhi", pct: "↓16%" },
  { img: "/wgoa.jpg", price: "₹21,000", name: "W Goa", pct: "↓18%" },
  { img: "/andazsingapore.jpg", price: "₹19,500", name: "Andaz, Singapore", pct: "↓23%" },
  { img: "/langhamlondon.jpg", price: "₹26,200", name: "The Langham, London", pct: "↓21%" },
  { img: "/fourseasonsmumbai.jpg", price: "₹16,900", name: "Four Seasons, Mumbai", pct: "↓25%" },
  { img: "/Crowneplazayasidland.jpg", price: "₹48,000", name: "Crowne Plaza, Yas Island", pct: "↓12%" },
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
  { q: "What if I have a non-refundable booking?", a: "rebuq works best with refundable bookings. If your booking is non-refundable, we'll let you know when you upload — and suggest booking a flexible rate next time so you can benefit from price drops." },
];

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [carouselPos, setCarouselPos] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // ── Modal state ────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]     = useState(false);
  const [uploadStep, setUploadStep]   = useState<1 | 2 | 'blocked'>(1);
  const [file, setFile]               = useState<File | null>(null);
  const [dragActive, setDragActive]   = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [scanMsg, setScanMsg]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [extracted, setExtracted]     = useState<ExtractedData | null>(null);
  const [phone, setPhone]             = useState('');
  const [emailVal, setEmailVal]       = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member", email: data.user.email || "" });
      }
    });
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const [statValues, setStatValues] = useState(STATS.map(s => ({ prefix: s.prefix, suffix: s.suffix, val: s.target })));
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  const CARD_WIDTH = isMobile ? 200 : 256;
  const VISIBLE = isMobile ? 2 : 4;
  const MAX_POS = CARDS.length - VISIBLE;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) { setFile(f); setDragActive(false); }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const openModal = () => {
    setModalOpen(true);
    setUploadStep(1);
    setFile(null);
    setExtracted(null);
    setPhone('');
    setEmailVal('');
    setSubmitError('');
  };

  const closeModal = () => {
    setModalOpen(false);
  };

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

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const scrollCarousel = (dir: number) => setCarouselPos(prev => Math.max(0, Math.min(MAX_POS, prev + dir)));

  async function doScan() {
    if (!file) return;
    setScanning(true);
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const contentBlock = file.type.startsWith('image/')
        ? { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }] }] })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      const RATES: Record<string, number> = { EUR: 112, USD: 84, GBP: 107, AED: 22.8, THB: 2.3, SGD: 62, AMD: 0.21, MYR: 18, IDR: 0.005, JPY: 0.56, KRW: 0.063, TRY: 2.5, SAR: 22.4, OMR: 218, BHD: 223, QAR: 23.1, MXN: 4.2, ZAR: 4.5, EGP: 1.7, NPR: 0.63, LKR: 0.26, MUR: 1.9 };
      const rate = RATES[parsed.currency_original] || 1;
      if (parsed.currency_original && parsed.currency_original !== 'INR' && rate !== 1) {
        if (parsed.original_price)       parsed.original_price       = Math.round(parsed.original_price       * rate);
        if (parsed.total_price_paid)     parsed.total_price_paid     = Math.round(parsed.total_price_paid     * rate);
        if (parsed.price_per_night)      parsed.price_per_night      = Math.round(parsed.price_per_night      * rate);
        if (parsed.cancellation_penalty) parsed.cancellation_penalty = Math.round(parsed.cancellation_penalty * rate);
      }
      if (!parsed.total_nights && parsed.check_in && parsed.check_out) {
        parsed.total_nights = Math.round((new Date(parsed.check_out).getTime() - new Date(parsed.check_in).getTime()) / 86400000);
      }
      if (!parsed.total_price_paid) parsed.total_price_paid = parsed.original_price || 0;
      clearInterval(interval);
      setExtracted({ ...emptyExtracted(), ...parsed });
      if (parsed.cancellation_policy === 'non-refundable') setUploadStep('blocked');
      else setUploadStep(2);
    } catch {
      clearInterval(interval);
      setExtracted(emptyExtracted());
      setUploadStep(2);
    }
    setScanning(false);
  }

  async function submitBooking() {
    setSubmitError('');
    if (!phone || phone.length < 10)  { setSubmitError('Please enter a valid 10-digit WhatsApp number'); return; }
    if (!emailVal)                     { setSubmitError('Please enter your email'); return; }
    if (!extracted?.hotel_name)        { setSubmitError('Please enter the hotel name'); return; }
    if (!extracted?.check_in)         { setSubmitError('Please enter check-in date'); return; }
    if (!extracted?.check_out)        { setSubmitError('Please enter check-out date'); return; }
    if (!extracted?.total_price_paid) { setSubmitError('Please enter the total price you paid'); return; }
    if (extracted?.cancellation_policy === 'non-refundable') { setUploadStep('blocked'); return; }
    setLoading(true);
    try {
      const res = await fetch('https://hoteldrops-production-9107.up.railway.app/api/voucher/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extracted, phone, email: emailVal }),
      });
      const json = await res.json();
      if (json.blocked && json.reason === 'non_refundable') { setUploadStep('blocked'); return; }
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit');
      sessionStorage.setItem('rebuq_booking', JSON.stringify({ extracted, bookingId: json.booking_id }));
      router.push('/upload');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 16, lineHeight: 1.6, WebkitFontSmoothing: "antialiased", overflowX: "hidden", maxWidth: "100vw" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: translateY(0); } }
        .hotel-card-img { transition: transform 0.3s ease; }
        .hotel-card:hover .hotel-card-img { transform: scale(1.04); }
        input:focus, select:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
      `}</style>

      {/* ── SCANNING OVERLAY ── */}
      {scanning && (
        <div style={{ position: 'fixed', inset: 0, background: B, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="sora" style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{scanMsg}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Our AI is reading your booking details</div>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          {/* Backdrop */}
          <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }} />

          {/* Modal panel */}
          <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: isMobile ? '16px 16px 0 0' : 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', marginTop: isMobile ? 'auto' : 60, animation: 'slideUp 0.25s ease', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', ...(isMobile ? { position: 'fixed' as const, bottom: 0, left: 0, right: 0, marginTop: 0, borderRadius: '20px 20px 0 0', maxHeight: '92vh' } : {}) }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, background: '#fff', zIndex: 10, borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0' }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY }}>
                  {uploadStep === 1 ? '📎 Upload your voucher' : uploadStep === 2 ? '✏️ Confirm booking details' : '🔒 Non-refundable booking'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {uploadStep === 1 ? 'Free price check — 30 seconds' : uploadStep === 2 ? 'Review and correct anything that looks wrong' : ''}
                </div>
              </div>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#64748b', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
            </div>

            {/* Step indicator */}
            {uploadStep !== 'blocked' && (
              <div style={{ padding: '12px 24px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                {[{ n: uploadStep === 2 ? '✓' : '1', label: 'Upload', done: uploadStep === 2 }, { n: '2', label: 'Confirm', active: uploadStep === 2 }].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#16a34a' : s.active ? B : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: s.done || s.active ? '#fff' : '#94a3b8' }}>{s.n}</div>
                      <span style={{ fontSize: 12, color: s.done ? '#16a34a' : s.active ? B : '#94a3b8', fontWeight: s.active || s.done ? 600 : 400 }}>{s.label}</span>
                    </div>
                    {i < 1 && <div style={{ width: 24, height: 1, background: '#e2e8f0' }} />}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1 — Upload */}
            {uploadStep === 1 && (
              <div style={{ padding: '24px' }}>
                <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? B : file ? '#86efac' : '#bfdbfe'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center' as const, cursor: 'pointer', background: dragActive ? '#eff6ff' : file ? '#f0fdf4' : '#f8fbff', transition: 'all 0.2s', marginBottom: 16 }}>
                  <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
                  {file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 52, height: 52, background: '#dcfce7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✓</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#166534' }}>{file.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB · Ready to scan</div>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>✕ Remove file</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 52, height: 52, background: '#dbeafe', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Drag & drop your booking voucher</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Any hotel confirmation — PDF, screenshot or email</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ background: B, color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>Browse file</button>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' as const, fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  No voucher?{' '}
                  <button onClick={() => { setExtracted(emptyExtracted()); setUploadStep(2); }} style={{ color: B, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Enter details manually →</button>
                </div>

                <button onClick={doScan} disabled={!file} style={{ width: '100%', background: file ? NAVY : '#e2e8f0', color: file ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: file ? 'pointer' : 'not-allowed', marginBottom: 12, transition: 'all 0.2s' }}>
                  Scan my voucher →
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const }}>
                  {['Booking.com', 'Agoda', 'MakeMyTrip', 'Expedia', 'Direct'].map(t => (
                    <span key={t} style={{ fontSize: 11, color: '#94a3b8' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* BLOCKED */}
            {uploadStep === 'blocked' && extracted && (
              <div style={{ padding: '24px' }}>
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>This booking is non-refundable.</div>
                  <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.7 }}>
                    Even if the price drops, you can&apos;t cancel — so there&apos;s nothing to save. rebuq works best with refundable bookings. Flexible rates often cost a little more upfront but rebuq regularly finds drops of <strong>₹10,000–₹40,000</strong>.
                  </p>
                </div>
                <button onClick={() => { setUploadStep(1); setFile(null); setExtracted(null); }} style={{ width: '100%', background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Try a different booking
                </button>
              </div>
            )}

            {/* STEP 2 — Confirm */}
            {uploadStep === 2 && extracted && (
              <div style={{ padding: '24px' }}>
                {file && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                    <span style={{ fontSize: 16 }}>✨</span>
                    <span><strong>AI extracted successfully</strong> — verify and correct anything that looks wrong.</span>
                  </div>
                )}

                {/* Hotel */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>🏨 Hotel details</div>
                  <div style={grid2}>
                    <div><label style={lbl}>Hotel name *</label><input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Taj Dubai" /></div>
                    <div><label style={lbl}>City *</label><input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
                    <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Room type</label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King" /></div>
                    <div>
                      <label style={lbl}>Meal plan</label>
                      <select style={inp} value={extracted.board_basis} onChange={e => { const opt = BOARD_OPTIONS.find(o => o.code === e.target.value); setExtracted({ ...extracted, board_basis: e.target.value, board_basis_label: opt?.label || '' }); }}>
                        {BOARD_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Booked on</label>
                      <select style={inp} value={extracted.ota_name} onChange={e => setExtracted({ ...extracted, ota_name: e.target.value })}>
                        {['MakeMyTrip','Booking.com','Agoda','Goibibo','Hotels.com','Expedia','Direct','Other'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Booking ref</label><input style={inp} value={extracted.booking_reference} onChange={e => setExtracted({ ...extracted, booking_reference: e.target.value })} placeholder="PNR / ref no." /></div>
                  </div>
                </div>

                {/* Pricing */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>💳 Pricing</div>
                  {extracted.currency_original && extracted.currency_original !== 'INR' && (
                    <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
                      💱 Original: <strong>{extracted.currency_original}</strong> — converted to INR. Please verify.
                    </div>
                  )}
                  <div style={grid2}>
                    <div>
                      <label style={lbl}>Total price paid (₹) *</label>
                      <input style={inp} type="number" value={extracted.total_price_paid || ''} onChange={e => setExtracted({ ...extracted, total_price_paid: parseFloat(e.target.value), original_price: parseFloat(e.target.value) })} placeholder="e.g. 85000" />
                    </div>
                    <div>
                      <label style={lbl}>Adults</label>
                      <select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cancellation */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>🔒 Cancellation policy</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {CANCEL_OPTIONS.map(o => (
                      <button key={o.code} onClick={() => setExtracted({ ...extracted, cancellation_policy: o.code })} style={{ padding: '9px 8px', borderRadius: 8, border: `2px solid ${extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#ef4444' : B) : '#e2e8f0'}`, background: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#fef2f2' : '#eff6ff') : '#fff', color: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#dc2626' : B) : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' as const }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {(extracted.cancellation_policy === 'free' || extracted.cancellation_policy === 'partial') && (
                    <div>
                      <label style={lbl}>Free cancel deadline</label>
                      <input style={inp} type="date" value={extracted.cancellation_deadline} onChange={e => setExtracted({ ...extracted, cancellation_deadline: e.target.value })} />
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>📱 Where should we send the alert?</div>
                  <div style={grid2}>
                    <div>
                      <label style={lbl}>WhatsApp *</label>
                      <div style={{ display: 'flex' }}>
                        <span style={{ ...inp, width: 52, borderRadius: '10px 0 0 10px', borderRight: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>+91</span>
                        <input style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                      </div>
                    </div>
                    <div><label style={lbl}>Email *</label><input style={inp} type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="you@example.com" /></div>
                  </div>
                </div>

                {submitError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>⚠️ {submitError}</div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setUploadStep(1)} style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '12px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>← Back</button>
                  <button onClick={submitBooking} disabled={loading || extracted.cancellation_policy === 'non-refundable'} style={{ flex: 1, background: extracted.cancellation_policy === 'non-refundable' ? '#e2e8f0' : B, color: extracted.cancellation_policy === 'non-refundable' ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: extracted.cancellation_policy === 'non-refundable' ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Starting tracker…' : extracted.cancellation_policy === 'non-refundable' ? 'Cannot track non-refundable' : 'Start tracking my price →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
            </div>
          ) : (
            <button style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: "8px 12px", borderRadius: 8 }} onClick={() => window.location.href = "/signin"}>Sign in</button>
          ))}
          {!isMobile && <button onClick={openModal} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Check my booking</button>}
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
          <button onClick={() => { window.location.href = "/signin"; setShowMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Sign in</button>
          <button onClick={() => { openModal(); setShowMenu(false); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12, textAlign: "center" }}>Check my booking — it&apos;s free</button>
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
        <button onClick={openModal} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check my booking — it&apos;s free</button>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 14 }}>Real savings · Verified drops</p>
      </section>

      {/* CAROUSEL */}
      <div id="deals" style={{ padding: isMobile ? "40px 0" : "20px 0 60px" }}>
        <div style={{ textAlign: "center", padding: isMobile ? "0 20px 20px" : "0 40px 28px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 12 }}>Real savings · Verified drops</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>rebuq members saved on these hotels</h2>
        </div>
        <div style={{ overflow: "hidden", padding: isMobile ? "0 16px" : "0 40px" }}
          onTouchStart={e => { const t = e.touches[0]; (e.currentTarget as any)._touchStartX = t.clientX; }}
          onTouchEnd={e => {
            const startX = (e.currentTarget as any)._touchStartX;
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) { scrollCarousel(diff > 0 ? 1 : -1); }
          }}>
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button onClick={() => scrollCarousel(-1)} disabled={carouselPos === 0} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos === 0 ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos === 0 ? 0.4 : 1 }}>‹</button>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: CARDS.length - VISIBLE + 1 }, (_, i) => (
              <div key={i} onClick={() => setCarouselPos(i)} style={{ width: i === carouselPos ? 20 : 8, height: 8, borderRadius: 100, background: i === carouselPos ? B : "#e2e8f0", cursor: "pointer", transition: "all 0.3s" }} />
            ))}
          </div>
          <button onClick={() => scrollCarousel(1)} disabled={carouselPos >= MAX_POS} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos >= MAX_POS ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos >= MAX_POS ? 0.4 : 1 }}>›</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => window.location.href = "/search-hotels"} style={{ background: "none", border: "1.5px solid #e2e8f0", color: NAVY, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Explore all member deals →
          </button>
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
            <button onClick={openModal} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>Start for free</button>
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
        </div>
      </div>

      {/* QUOTE BANNER */}
      <div style={{ background: NAVY, padding: isMobile ? "50px 20px" : "70px 40px", textAlign: "center" }}>
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
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>Our monitoring AI checks your hotel price every 6 hours — through the night, through weekends.</p>
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
              { badge: "Zero Risk", badgeBg: "#fef9c3", badgeColor: "#854d0e", title: "Zero-risk pricing", text: "Free to check. We take a small success fee only if we actually save you money." },
              { badge: "Fast · 6hr avg", badgeBg: "#f3e8ff", badgeColor: "#7c3aed", title: "Catches drops fast", text: "Average time to find a significant price drop: under 6 hours." },
            ].map((f, i) => (
              <div key={i} style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span>
                <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.text}</p>
              </div>
            ))}
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
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload my booking now ↗</button>
          <button onClick={() => scrollTo("how")} style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>▶ See how it works</button>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
