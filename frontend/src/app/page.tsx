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
  payment_type: string; amount_paid_upfront: number; notes: string;
}

const emptyExtracted = (): ExtractedData => ({
  hotel_name: '', hotel_city: '', check_in: '', check_out: '', total_nights: 0,
  room_type: '', num_adults: 2, num_children: 0, children_ages: [], num_rooms: 1,
  board_basis: 'RO', board_basis_label: 'Room Only', rate_plan_name: '',
  original_price: 0, total_price_paid: 0, price_per_night: 0, currency_original: 'INR',
  ota_name: '', booking_reference: '',
  cancellation_policy: 'unknown', cancellation_deadline: '', cancellation_penalty: null,
  payment_type: 'pay_now', amount_paid_upfront: 0, notes: '',
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

  const [modalOpen, setModalOpen]     = useState(false);
  const [uploadStep, setUploadStep]   = useState<1 | 2 | 'hotel_pick' | 'room_pick' | 'blocked'>(1);
  const [blockInfo, setBlockInfo]     = useState<{reason:string;message?:string}|null>(null);
  const [warnings, setWarnings]       = useState<Record<string,any>>({});
  const [file, setFile]               = useState<File | null>(null);
  // FIX 1: track which button was used (upload vs camera)
  const [fileSource, setFileSource]   = useState<'upload' | 'camera' | null>(null);
  const [dragActive, setDragActive]   = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [redirecting, setRedirecting]   = useState(false);
  const [scanMsg, setScanMsg]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [extracted, setExtracted]     = useState<ExtractedData | null>(null);
  const [phone, setPhone]             = useState('');
  const [emailVal, setEmailVal]       = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const cameraInputRef                = useRef<HTMLInputElement>(null);
  const childAgeRef                   = useRef<HTMLDivElement>(null);
  const [extractResult, setExtractResult] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [docType, setDocType] = useState<string>('confirmed_voucher');
  const [selectedHotelIdx, setSelectedHotelIdx] = useState<number | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member", email: data.user.email || "" });
      }
    });
  }, []);

  useEffect(() => {
    if (modalOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
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
    if (f) { setFile(f); setDragActive(false); setFileSource('upload'); }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const openModal = () => {
    setModalOpen(true); setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setDocType('confirmed_voucher');
    setPhone(''); setEmailVal(''); setSubmitError(''); setBlockInfo(null); setWarnings({}); setLoading(false);
    setExtractResult(null); setSelectedHotelIdx(null); setSelectedRoomIdx(null); setEditMode(false);
  };

  const closeModal = () => { setModalOpen(false); };

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

  // FIX 2: helper to display a clean file label
  function getFileLabel() {
    if (!file) return '';
    if (fileSource === 'camera') return 'Photo taken ✓';
    // Clean filename — truncate if too long
    const name = file.name;
    if (name.length > 30) return name.substring(0, 27) + '…';
    return name;
  }

  async function doScan() {
    if (!file) return;
    setScanning(true);
    // FIX 3: scanning messages with Anthropic branding
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const formData = new FormData();
      formData.append('voucher', file);
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/extract', {
        method: 'POST', body: formData,
      });
      const json = await res.json();
      clearInterval(interval);
      setScanning(false);

      if (!json.success && json.blocked) {
        setBlockInfo({ reason: json.blockReason, message: json.message });
        if (json.data) setExtracted({ ...emptyExtracted(), ...json.data });
        else setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }

      const docType = json.documentType;

      if (docType === 'search_results') {
        setExtractResult(json);
        const hotels = json.data?.hotels;
        if (hotels?.length > 1) {
          setDocType('search_results');
          setUploadStep('hotel_pick');
        } else if (hotels?.length === 1) {
          const h = hotels[0];
          const s = json.data;
          setExtracted({ ...emptyExtracted(),
            hotel_name: h.hotel_name || '',
            hotel_city: s.destination || '',
            check_in: s.check_in || '',
            check_out: s.check_out || '',
            num_adults: s.num_adults || 2,
            num_children: s.num_children || 0,
            children_ages: s.children_ages || [],
            num_rooms: s.num_rooms || 1,
            ota_name: s.ota_name || '',
            total_price_paid: h.total_price_incl_tax || h.price_per_night_incl_tax || 0,
          });
          setWarnings({});
          setDocType('search_results');
          setUploadStep(2);
        }
        return;
      }

      if (docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top') {
        setExtractResult(json);
        const rooms = json.data?.room_options;
        if (rooms?.length > 1) {
          setDocType('hotel_detail_rooms');
          setUploadStep('room_pick');
        } else if (rooms?.length === 1) {
          const d = json.data;
          const room = rooms[0];
          setExtracted({ ...emptyExtracted(),
            hotel_name: d.hotel_name || '',
            hotel_city: d.hotel_city || '',
            check_in: d.check_in || '',
            check_out: d.check_out || '',
            num_adults: d.num_adults || 2,
            num_children: d.num_children || 0,
            children_ages: d.children_ages || [],
            num_rooms: d.num_rooms || 1,
            ota_name: d.ota_name || '',
            room_type: room.room_type || '',
            board_basis: room.board_basis || 'RO',
            board_basis_label: room.board_basis_label || 'Room Only',
            cancellation_policy: room.cancellation_policy || 'unknown',
            cancellation_deadline: room.cancellation_deadline || '',
            total_price_paid: room.total_price_incl_tax || 0,
          });
          setWarnings(json.warnings || {});
          setDocType('hotel_detail_rooms');
          setUploadStep(2);
        } else {
          setExtracted({ ...emptyExtracted(), ...json.data });
          setWarnings(json.warnings || {});
          setDocType('hotel_detail_rooms');
          setUploadStep(2);
        }
        return;
      }

      if (docType === 'checkout_page') {
        const data = json.data;
        setExtracted({ ...emptyExtracted(), ...data });
        setWarnings(json.warnings || {});
        setDocType('checkout_page');
        setUploadStep(2);
        return;
      }

      const data = json.data;
      if (!data) {
        setBlockInfo({ reason: 'parse_error', message: json.message || 'Could not read voucher.' });
        setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }
      setExtracted({ ...emptyExtracted(), ...data });
      setWarnings(json.warnings || {});
      setDocType('confirmed_voucher');

      if (json.blocked && json.blockReason === 'non_refundable') {
        setBlockInfo({ reason: 'non_refundable' });
        setUploadStep('blocked');
        return;
      }
      if (json.blockReason === 'checkin_passed') {
        setBlockInfo({ reason: 'checkin_passed', message: json.message });
        setUploadStep('blocked');
        return;
      }

      setUploadStep(2);

    } catch {
      clearInterval(interval);
      setScanning(false);
      setExtracted(emptyExtracted());
      setWarnings({});
      setBlockInfo({ reason: 'network_error', message: 'Could not reach the server. Please enter your booking details manually.' });
      setUploadStep('blocked');
    }
  }

  async function submitBooking() {
    setSubmitError('');
    if (!phone || phone.length < 10)  { setSubmitError('Please enter a valid 10-digit WhatsApp number'); return; }
    if (!emailVal)                     { setSubmitError('Please enter your email'); return; }
    if (!extracted?.hotel_name)        { setSubmitError('Please enter the hotel name'); return; }
    if (!extracted?.check_in)         { setSubmitError('Please enter check-in date'); return; }
    if (!extracted?.check_out)        { setSubmitError('Please enter check-out date'); return; }
    if (!extracted?.total_price_paid) { setSubmitError('Please enter the total price you paid'); return; }
    if (extracted?.cancellation_policy === 'non-refundable') {
      setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extracted, phone: phone.startsWith('+') ? phone : `+91${phone}`, email: emailVal }),
      });
      const json = await res.json();
      if (json.blocked && json.reason === 'non_refundable') {
        setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return;
      }
      if (json.reason === 'duplicate') {
        setBlockInfo({ reason: 'duplicate', message: json.message }); setUploadStep('blocked'); return;
      }
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit');
      sessionStorage.setItem('rebuq_booking', JSON.stringify({ extracted, bookingId: json.booking_id }));
      closeModal();
      router.push('/confirmed');
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

      {/* FIX 3: Scan overlay with Anthropic branding */}
      {(scanning || redirecting) && (
        <div style={{ position: 'fixed', inset: 0, background: B, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="sora" style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{redirecting ? 'Opening hotel picker…' : scanMsg}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{redirecting ? 'Just a moment' : 'Our AI is reading your booking details'}</div>
          {!redirecting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.04em' }}>Powered by Claude AI · Anthropic</span>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: isMobile ? '16px 16px 0 0' : 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', marginTop: isMobile ? 'auto' : 60, animation: 'slideUp 0.25s ease', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', ...(isMobile ? { position: 'fixed' as const, bottom: 0, left: 0, right: 0, marginTop: 0, borderRadius: '20px 20px 0 0', maxHeight: '92vh' } : {}) }}>

            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, background: '#fff', zIndex: 10, borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0' }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY }}>
                  {uploadStep === 1 ? 'Upload your voucher' : uploadStep === 2 ? ((docType === 'search_results' || docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top' || docType === 'checkout_page') ? 'Set a price alert' : 'Confirm booking details') : uploadStep === 'hotel_pick' ? '🏨 Select a hotel' : uploadStep === 'room_pick' ? '🛏️ Select a room' :
                    blockInfo?.reason === 'non_refundable' ? '🔒 Non-refundable booking' :
                    blockInfo?.reason === 'not_hotel' ? '📄 Not a hotel booking' :
                    blockInfo?.reason === 'poor_quality' || blockInfo?.reason === 'parse_error' ? '🔍 Could not read voucher' :
                    blockInfo?.reason === 'checkin_passed' ? '📅 Check-in already passed' :
                    blockInfo?.reason === 'duplicate' ? '✅ Already tracking' :
                    blockInfo?.reason === 'network_error' ? '⚠️ Connection issue' :
                    '⚠️ We need your attention'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {uploadStep === 1 ? 'Free price check — 30 seconds' : uploadStep === 2 ? ((docType === 'search_results' || docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top' || docType === 'checkout_page') ? "We'll notify you the moment this price drops" : 'Review and correct anything that looks wrong') : ''}
                </div>
              </div>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#64748b', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
            </div>

            {uploadStep !== 'blocked' && uploadStep !== 'hotel_pick' && uploadStep !== 'room_pick' && (
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

            {uploadStep === 1 && (
              <div style={{ padding: '24px' }}>
                {isMobile ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      {/* FIX 1: Upload file card — only highlights if fileSource === 'upload' */}
                      <label style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 10, background: (file && fileSource === 'upload') ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${(file && fileSource === 'upload') ? '#86efac' : '#e2e8f0'}`, borderRadius: 14, padding: '24px 12px', cursor: 'pointer', minHeight: 110 }}>
                        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('upload'); } }} />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <div style={{ textAlign: 'center' as const }}><div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Upload file</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>PDF or screenshot</div></div>
                      </label>
                      {/* FIX 1: Camera card — only highlights if fileSource === 'camera' */}
                      <label style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 10, background: (file && fileSource === 'camera') ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${(file && fileSource === 'camera') ? '#86efac' : '#e2e8f0'}`, borderRadius: 14, padding: '24px 12px', cursor: 'pointer', minHeight: 110 }}>
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); } }} />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <div style={{ textAlign: 'center' as const }}><div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Take photo</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Use camera</div></div>
                      </label>
                    </div>
                    {file && fileSource === 'camera' && (
                      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Photo taken — does it look clear?</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <label style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const, display: 'block' }}>
                            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={cameraInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); } }} />
                            Retake
                          </label>
                          <div style={{ flex: 2, background: B, color: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={doScan}>
                            Looks good — Scan →
                          </div>
                        </div>
                      </div>
                    )}
                    {file && fileSource === 'upload' && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>✓ {getFileLabel()}</span>
                        <button onClick={() => { setFile(null); setFileSource(null); }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? B : file ? '#86efac' : '#bfdbfe'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center' as const, cursor: 'pointer', background: dragActive ? '#eff6ff' : file ? '#f0fdf4' : '#f8fbff', transition: 'all 0.2s', marginBottom: 16 }}>
                    <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
                    {file ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        {/* FIX 2: Clean filename on desktop too */}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{getFileLabel()}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB</div>
                        <button onClick={e => { e.stopPropagation(); setFile(null); setFileSource(null); }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, background: '#dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <div><div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Drag & drop your booking</div><div style={{ fontSize: 13, color: '#64748b' }}>PDF, screenshot or email</div></div>
                        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ background: B, color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>Browse file</button>
                      </div>
                    )}
                  </div>
                )}
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

            {uploadStep === 'hotel_pick' && extractResult?.data?.hotels && (
              <div style={{ padding: '24px' }}>
                <button onClick={() => setUploadStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Which hotel do you want to track?</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>We found {extractResult.data.hotels.length} hotels in your screenshot.</div>
                {extractResult.data.check_in && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: B }}>
                    📅 {new Date(extractResult.data.check_in + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} → {new Date(extractResult.data.check_out + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {extractResult.data.num_adults} Adults · {extractResult.data.num_rooms} Room
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {extractResult.data.hotels.map((hotel: any, idx: number) => (
                    <button key={idx} onClick={() => {
                      setSelectedHotelIdx(idx);
                      const h = extractResult.data.hotels[idx];
                      const s = extractResult.data;
                      setExtracted({ ...emptyExtracted(), hotel_name: h.hotel_name || '', hotel_city: s.destination || '', check_in: s.check_in || '', check_out: s.check_out || '', num_adults: s.num_adults || 2, num_children: s.num_children || 0, children_ages: s.children_ages || [], num_rooms: s.num_rooms || 1, ota_name: s.ota_name || '', total_price_paid: h.total_price_incl_tax || h.price_per_night_incl_tax || 0 });
                      setWarnings({});
                      setDocType('search_results');
                      setUploadStep(2);
                    }} style={{ background: selectedHotelIdx === idx ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${selectedHotelIdx === idx ? B : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{hotel.hotel_name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{hotel.area && `📍 ${hotel.area}`}{hotel.stars ? ` · ${'★'.repeat(Math.min(hotel.stars, 5))}` : ''}</div>
                          {hotel.free_cancellation && <span style={{ display: 'inline-block', marginTop: 6, background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ Free cancel</span>}
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          {hotel.price_per_night_incl_tax ? <><div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>₹{Math.round(hotel.price_per_night_incl_tax).toLocaleString('en-IN')}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>/ night</div></> : <div style={{ fontSize: 11, color: '#94a3b8' }}>Price n/a</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadStep === 'room_pick' && extractResult?.data?.room_options && (
              <div style={{ padding: '24px' }}>
                <button onClick={() => setUploadStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{extractResult.data.hotel_name || 'Select a room'}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  {extractResult.data.check_in && `${new Date(extractResult.data.check_in + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → ${new Date(extractResult.data.check_out + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · `}
                  Which room do you want to track?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {extractResult.data.room_options.map((room: any, idx: number) => (
                    <button key={idx} onClick={() => {
                      setSelectedRoomIdx(idx);
                      const d = extractResult.data;
                      setExtracted({ ...emptyExtracted(), hotel_name: d.hotel_name || '', hotel_city: d.hotel_city || '', check_in: d.check_in || '', check_out: d.check_out || '', num_adults: d.num_adults || 2, num_children: d.num_children || 0, children_ages: d.children_ages || [], num_rooms: d.num_rooms || 1, ota_name: d.ota_name || '', room_type: room.room_type || '', board_basis: room.board_basis || 'RO', board_basis_label: room.board_basis_label || 'Room Only', cancellation_policy: room.cancellation_policy || 'unknown', cancellation_deadline: room.cancellation_deadline || '', total_price_paid: room.total_price_incl_tax || 0 });
                      setWarnings({});
                      setDocType('hotel_detail_rooms');
                      setUploadStep(2);
                    }} style={{ background: selectedRoomIdx === idx ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${selectedRoomIdx === idx ? B : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{room.room_type}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{room.option_name || room.board_basis_label}</div>
                          <span style={{ display: 'inline-block', background: room.cancellation_policy === 'free' ? '#f0fdf4' : room.cancellation_policy === 'non-refundable' ? '#fef2f2' : '#fffbeb', color: room.cancellation_policy === 'free' ? '#16a34a' : room.cancellation_policy === 'non-refundable' ? '#dc2626' : '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            {room.cancellation_policy === 'free' ? '✓ Free cancel' : room.cancellation_policy === 'non-refundable' ? '✗ Non-refundable' : `⚠️ ${room.cancellation_policy || 'Unknown policy'}`}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          {room.price_per_night_incl_tax ? <><div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>₹{Math.round(room.price_per_night_incl_tax).toLocaleString('en-IN')}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>/ night</div></> : <div style={{ fontSize: 11, color: '#94a3b8' }}>Enter price manually</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadStep === 'blocked' && (
              <div style={{ padding: '24px' }}>
                {blockInfo?.reason === 'non_refundable' && (<div><div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div><div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>This booking is non-refundable.</div><p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.7 }}>Even if the price drops, you cannot cancel to rebook and save. rebuq works best with flexible rates. Next time, book a cancellable rate — rebuq regularly finds drops of Rs.10,000–Rs.40,000.</p></div><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setBlockInfo(null); }} style={{ width: '100%', background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Try a different booking</button></div>)}
                {blockInfo?.reason === 'not_hotel' && (<div><div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>📄</div><div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>This does not look like a hotel booking.</div><p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>Please upload a hotel booking confirmation — not a flight ticket, train ticket, restaurant receipt, or other document.</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setBlockInfo(null); }} style={{ flex: 1, background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upload a hotel voucher</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#fff', color: '#1447b8', border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
                {(blockInfo?.reason === 'poor_quality' || blockInfo?.reason === 'parse_error') && (<div><div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0369a1', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>We could not read your voucher clearly.</div><p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.7 }}>This happens with blurry screenshots, dark mode images, or password-protected PDFs.</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setBlockInfo(null); }} style={{ flex: 1, background: '#fff', color: '#1447b8', border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Try again</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
                {blockInfo?.reason === 'checkin_passed' && (<div><div style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>📅</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Check-in date has already passed.</div><p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>Your stay has already started or ended. rebuq tracks prices before check-in. For future bookings, upload right after you book!</p></div><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setBlockInfo(null); }} style={{ width: '100%', background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Track a future booking</button></div>)}
                {blockInfo?.reason === 'duplicate' && (<div><div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>✅</div><div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Already tracking this booking!</div><p style={{ fontSize: 13, color: '#15803d', lineHeight: 1.7 }}>We are already watching this booking for price drops. You will get a WhatsApp alert the moment we find a lower price.</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setBlockInfo(null); }} style={{ flex: 1, background: '#fff', color: '#1447b8', border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track another booking</button><button onClick={closeModal} style={{ flex: 1, background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button></div></div>)}
                {blockInfo?.reason === 'network_error' && (<div><div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div><div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Connection issue</div><p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{blockInfo.message || 'Could not reach the server. Please try again or enter details manually.'}</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setBlockInfo(null); }} style={{ flex: 1, background: '#fff', color: '#1447b8', border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Try again</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#1447b8', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
              </div>
            )}

            {uploadStep === 2 && extracted && (
              <div style={{ padding: '24px' }}>

                {/* ── PRE-BOOKING FLOW ── */}
                {(docType === 'search_results' || docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top' || docType === 'checkout_page') ? (
                  <div>

                    {/* ── MANDATORY FIELD CHECKS ── */}
                    {(() => {
                      const missing = [];
                      if (!extracted.hotel_name) missing.push('hotel name');
                      if (!extracted.hotel_city) missing.push('city');
                      if (!extracted.check_in) missing.push('check-in date');
                      if (!extracted.check_out) missing.push('check-out date');
                      if (!extracted.num_adults) missing.push('number of adults');
                      const missingChildAges = extracted.num_children > 0 && (extracted.children_ages.length < extracted.num_children || extracted.children_ages.some((a: any) => a === null || a === undefined || a === '' || a === -1));
                      if (missingChildAges) missing.push('child ages');
                      const hasChildAgeMissing = missingChildAges;
                      return missing.length > 0 ? (
                        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>We couldn't detect: {missing.join(', ')}</div>
                          <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>Please enter the missing details below or retake the photo.</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <label style={{ flex: 1, background: '#fff', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' as const, display: 'block' }}>
                              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); setExtracted(null); setUploadStep(1); } }} />
                              Retake photo
                            </label>
                            <button onClick={() => { setEditMode(true); setTimeout(() => { if (hasChildAgeMissing && childAgeRef.current) { childAgeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 200); }} style={{ flex: 1, background: '#dc2626', border: 'none', color: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* ── CAPTURED SUMMARY CARD ── */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#64748b', marginBottom: 6 }}>We read your screenshot</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Looks like you haven't booked yet — we'll watch this price while you decide.</div>
                      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={extracted.hotel_name ? B : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                          <div style={{ flex: 1 }}>
                            {extracted.hotel_name
                              ? <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{extracted.hotel_name}</div>
                              : <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Hotel name not detected</div>}
                            {extracted.hotel_city
                              ? <div style={{ fontSize: 12, color: '#64748b' }}>{extracted.hotel_city}</div>
                              : <div style={{ fontSize: 11, color: '#ef4444' }}>City not detected</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={extracted.check_in && extracted.check_out ? B : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {extracted.check_in && extracted.check_out
                            ? <div style={{ fontSize: 13, color: NAVY }}>{new Date(extracted.check_in + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<span style={{ color: '#94a3b8', margin: '0 6px' }}>→</span>{new Date(extracted.check_out + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{extracted.total_nights > 0 && <span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>{extracted.total_nights} nights</span>}</div>
                            : <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Dates not detected</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            {extracted.num_adults} adult{extracted.num_adults > 1 ? 's' : ''}
                            {extracted.num_children > 0 ? ` · ${extracted.num_children} child${extracted.num_children > 1 ? 'ren' : ''}` : ''}
                          </div>
                        </div>
                        {(extracted.total_price_paid > 0 || extracted.price_per_night > 0) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: B, flexShrink: 0, width: 16, textAlign: 'center' as const }}>₹</span>
                            <div style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>{extracted.total_price_paid > 0 ? `₹${Math.round(extracted.total_price_paid).toLocaleString('en-IN')} total` : `₹${Math.round(extracted.price_per_night).toLocaleString('en-IN')}/night`}</div>
                          </div>
                        )}
                        <button onClick={() => setEditMode(!editMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: B, textAlign: 'left' as const, padding: 0, fontFamily: 'inherit', fontWeight: 600, marginTop: 2 }}>{editMode ? '✕ Close edit' : 'Something wrong? Edit details'}</button>
                      </div>
                    </div>

                    {/* ── EDIT FORM ── */}
                    {editMode && extracted && (
                      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#64748b' }}>Edit details</div>

                        <div>
                          <label style={lbl}>Hotel name {!extracted.hotel_name && <span style={{ color: '#ef4444' }}>*</span>}</label>
                          <input style={{ ...inp, borderColor: !extracted.hotel_name ? '#ef4444' : '#e2e8f0' }} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Crowne Plaza Dubai Deira" autoFocus={!extracted.hotel_name} />
                          {!extracted.hotel_name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Required — needed for price comparison</div>}
                        </div>

                        <div>
                          <label style={lbl}>City {!extracted.hotel_city && <span style={{ color: '#ef4444' }}>*</span>}</label>
                          <input style={{ ...inp, borderColor: !extracted.hotel_city ? '#ef4444' : '#e2e8f0' }} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" />
                          {!extracted.hotel_city && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Required — needed to search hotels</div>}
                        </div>

                        <div style={grid2}>
                          <div>
                            <label style={lbl}>Check-in {!extracted.check_in && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <input style={{ ...inp, borderColor: !extracted.check_in ? '#ef4444' : '#e2e8f0' }} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} />
                          </div>
                          <div>
                            <label style={lbl}>Check-out {!extracted.check_out && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <input style={{ ...inp, borderColor: !extracted.check_out ? '#ef4444' : '#e2e8f0' }} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} />
                          </div>
                        </div>

                        <div style={grid2}>
                          <div>
                            <label style={lbl}>Adults *</label>
                            <select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select>
                          </div>
                          <div>
                            <label style={lbl}>Children</label>
                            <select style={inp} value={extracted.num_children} onChange={e => { const n = parseInt(e.target.value); const ages = [...extracted.children_ages]; while (ages.length < n) ages.push(null); setExtracted({ ...extracted, num_children: n, children_ages: ages.slice(0, n) }); }}>{[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n === 0 ? 'No children' : n === 1 ? '1 child' : `${n} children`}</option>)}</select>
                          </div>
                        </div>

                        {extracted.num_children > 0 && (
                          <div ref={childAgeRef}>
                            <label style={lbl}>Child ages <span style={{ color: '#ef4444' }}>*</span></label>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                              {Array.from({ length: extracted.num_children }, (_, i) => (
                                <div key={i} style={{ flex: 1, minWidth: 100 }}>
                                  <select style={{ ...inp, borderColor: (extracted.children_ages[i] === null || extracted.children_ages[i] === undefined || extracted.children_ages[i] as any === '') ? '#ef4444' : '#e2e8f0' }} value={extracted.children_ages[i] ?? ''} onChange={e => { const ages = [...extracted.children_ages]; ages[i] = e.target.value === '' ? null : parseInt(e.target.value); setExtracted({ ...extracted, children_ages: ages }); }}>
                                    <option value=''>Child {i+1} age</option>
                                    <option value='0'>Under 1</option>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(a => <option key={a} value={a}>{a} yrs</option>)}
                                  </select>
                                  {(extracted.children_ages[i] === null || extracted.children_ages[i] === undefined || extracted.children_ages[i] as any === '') && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Age required</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={grid2}>
                          <div><label style={lbl}>Room type <span style={{ fontWeight: 400, textTransform: 'none' as const }}>optional</span></label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King" /></div>
                          <div><label style={lbl}>Board basis <span style={{ fontWeight: 400, textTransform: 'none' as const }}>optional</span></label><select style={inp} value={extracted.board_basis} onChange={e => { const opt = BOARD_OPTIONS.find(o => o.code === e.target.value); setExtracted({ ...extracted, board_basis: e.target.value, board_basis_label: opt?.label || '' }); }}>{BOARD_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></div>
                        </div>

                        <div>
                          <label style={lbl}>Total price (₹ incl. taxes) <span style={{ fontWeight: 400, textTransform: 'none' as const }}>optional</span></label>
                          <input style={inp} type="number" value={extracted.total_price_paid || ''} onChange={e => setExtracted({ ...extracted, total_price_paid: parseFloat(e.target.value), original_price: parseFloat(e.target.value) })} placeholder="e.g. 3929" />
                        </div>

                        <div>
                          <label style={lbl}>Notes <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>optional</span></label>
                          <textarea style={{ ...inp, height: 64, resize: 'none' as const }} value={(extracted as any).notes || ''} onChange={e => setExtracted({ ...extracted, ...(extracted as any), notes: e.target.value })} placeholder="e.g. corporate booking, need flexible cancellation…" />
                        </div>
                      </div>
                    )}

                    {/* ── CTA BOX ── */}
                    {(() => {
                      const mandatoryMissing =
                        !extracted.hotel_name || !extracted.hotel_city ||
                        !extracted.check_in || !extracted.check_out || !extracted.num_adults ||
                        (extracted.num_children > 0 && (extracted.children_ages.length < extracted.num_children || extracted.children_ages.some((a: any) => a === null || a === undefined || a === '' || a === -1)));
                      return (
                        <div style={{ background: NAVY, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Sora',sans-serif" }}>Get alerted when this price drops</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.5 }}>One WhatsApp message the moment the price moves. Free. No spam.</div>
                          <div style={{ display: 'flex', marginBottom: 12 }}>
                            <span style={{ ...inp, width: 52, borderRadius: '10px 0 0 10px', borderRight: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>+91</span>
                            <input style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)', borderLeft: 'none' }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number" maxLength={10} />
                          </div>
                          <input style={{ ...inp, marginBottom: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)' }} type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="Email address" />
                          {submitError && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>{submitError}</div>}
                          {mandatoryMissing && (
                            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>
                              Please complete all required fields above before submitting.
                            </div>
                          )}
                          <button onClick={mandatoryMissing ? () => setEditMode(true) : submitBooking} disabled={loading} style={{ width: '100%', background: mandatoryMissing ? '#475569' : '#FCD34D', color: mandatoryMissing ? 'rgba(255,255,255,0.6)' : NAVY, border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {loading ? 'Setting up alert…' : mandatoryMissing ? 'Complete required fields first' : 'Alert me when price drops →'}
                          </button>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <label style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '11px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textAlign: 'center' as const, display: 'block' }}>
                        {fileSource === 'camera' ? (
                          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); setExtracted(null); setUploadStep(1); } }} />
                        ) : (
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('upload'); setExtracted(null); setUploadStep(1); } }} />
                        )}
                        {fileSource === 'camera' ? 'Retake photo' : 'Re-upload'}
                      </label>
                      <button onClick={() => setUploadStep(1)} style={{ flex: 1, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                    </div>
                  </div>

                ) : (
                  /* ── CONFIRMED VOUCHER FLOW ── */
                  <div>
                    {warnings.partialExtraction && (<div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#92400e' }}><strong>Partial read</strong> — We could not read all fields. Please check and fill in missing details.</div>)}
                    {warnings.checkInSoon && (<div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#c2410c' }}><strong>Check-in very soon</strong> — Your check-in is {warnings.checkInSoonDays === 0 ? 'today' : 'tomorrow'}. We will scan immediately but the window to rebook is tight.</div>)}
                    {warnings.payAtProperty && (<div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#0369a1' }}><strong>Pay at property</strong> — You have not paid yet so amount shows Rs.0. We will still track the rate.</div>)}
                    {warnings.unknownPolicy && (<div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#92400e' }}><strong>Cancellation policy unclear</strong> — Please select your policy below.</div>)}
                    {warnings.currencyConverted && extracted?.total_price_paid > 0 && (<div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#166534' }}><strong>Currency converted</strong> — Original was in {warnings.originalCurrency}, converted to INR. Please verify.</div>)}
                    {file && (<div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#166534' }}><strong>AI extracted successfully</strong> — verify and correct anything that looks wrong.</div>)}

                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Hotel details</div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Hotel name *</label>
                        <input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Crowne Plaza Dubai Deira" />
                      </div>
                      <div style={grid2}>
                        <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
                        <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
                      </div>
                      <div style={grid2}>
                        <div><label style={lbl}>City *</label><input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" /></div>
                        <div><label style={lbl}>Room type</label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King" /></div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Booked on</label>
                        <select style={inp} value={extracted.ota_name} onChange={e => setExtracted({ ...extracted, ota_name: e.target.value })}>{['MakeMyTrip','Booking.com','Agoda','Goibibo','Hotels.com','Expedia','GRNConnect','Direct','Other'].map(o => <option key={o} value={o}>{o}</option>)}</select>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Pricing</div>
                      {extracted.currency_original && extracted.currency_original !== 'INR' && (<div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>Original: <strong>{extracted.currency_original}</strong> — converted to INR. Please verify.</div>)}
                      <div style={grid2}>
                        <div><label style={lbl}>Total price paid (₹) *</label><input style={inp} type="number" value={extracted.total_price_paid || ''} onChange={e => setExtracted({ ...extracted, total_price_paid: parseFloat(e.target.value), original_price: parseFloat(e.target.value) })} placeholder="e.g. 85000" /></div>
                        <div><label style={lbl}>Adults</label><select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select></div>
                      </div>
                      <div style={grid2}>
                        <div><label style={lbl}>Children (under 12)</label>
                          <select style={inp} value={extracted.num_children} onChange={e => { const n = parseInt(e.target.value); const ages = [...extracted.children_ages]; while (ages.length < n) ages.push(null); setExtracted({ ...extracted, num_children: n, children_ages: ages.slice(0, n) }); }}>
                            {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n === 0 ? 'No children' : n === 1 ? '1 child' : `${n} children`}</option>)}
                          </select>
                        </div>
                        <div>
                          {extracted.num_children > 0 && <label style={lbl}>Ages</label>}
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                            {extracted.num_children > 0 && Array.from({ length: extracted.num_children }, (_, i) => (
                              <select key={i} style={{ ...inp, width: 90 }} value={extracted.children_ages[i] ?? ''} onChange={e => { const ages = [...extracted.children_ages]; ages[i] = e.target.value === '' ? null : parseInt(e.target.value); setExtracted({ ...extracted, children_ages: ages }); }}>
                                <option value=''>Child {i+1}</option>
                                <option value='0'>Under 1</option>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(a => <option key={a} value={a}>{a} yrs</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Cancellation policy</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {CANCEL_OPTIONS.map(o => (<button key={o.code} onClick={() => { if (o.code === 'non-refundable') { setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return; } setExtracted({ ...extracted, cancellation_policy: o.code }); }} style={{ padding: '9px 8px', borderRadius: 8, border: `2px solid ${extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#ef4444' : B) : '#e2e8f0'}`, background: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#fef2f2' : '#eff6ff') : '#fff', color: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#dc2626' : B) : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' as const }}>{o.label}</button>))}
                      </div>
                      {(extracted.cancellation_policy === 'free' || extracted.cancellation_policy === 'partial') && (<div><label style={lbl}>Free cancel deadline</label><input style={inp} type="date" value={extracted.cancellation_deadline} onChange={e => setExtracted({ ...extracted, cancellation_deadline: e.target.value })} /></div>)}
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Where should we send the alert?</div>
                      <div style={grid2}>
                        <div><label style={lbl}>WhatsApp *</label><div style={{ display: 'flex' }}><span style={{ ...inp, width: 52, borderRadius: '10px 0 0 10px', borderRight: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>+91</span><input style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} /></div></div>
                        <div><label style={lbl}>Email *</label><input style={inp} type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="you@example.com" /></div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Notes</div>
                      <textarea style={{ ...inp, height: 72, resize: 'none' as const }} value={extracted.notes || ''} onChange={e => setExtracted({ ...extracted, notes: e.target.value })} placeholder="e.g. corporate booking, honeymoon, need flexible cancellation…" />
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Optional — helps us find a more accurate price match</div>
                    </div>

                    {submitError && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>{submitError}</div>)}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <label style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '11px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textAlign: 'center' as const, display: 'block' }}>
                        {fileSource === 'camera' ? (
                          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); setExtracted(null); setUploadStep(1); } }} />
                        ) : (
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('upload'); setExtracted(null); setUploadStep(1); } }} />
                        )}
                        {fileSource === 'camera' ? 'Retake photo' : 'Re-upload'}
                      </label>
                      <button onClick={() => setUploadStep(1)} style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '11px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>← Back</button>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={submitBooking} disabled={loading || extracted.cancellation_policy === 'non-refundable'} style={{ flex: 1, background: extracted.cancellation_policy === 'non-refundable' ? '#e2e8f0' : B, color: extracted.cancellation_policy === 'non-refundable' ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: extracted.cancellation_policy === 'non-refundable' ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Starting tracker…' : extracted.cancellation_policy === 'non-refundable' ? 'Cannot track non-refundable' : 'Start tracking my price →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
        <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none", flexShrink: 0 }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
        {!isMobile && (<div style={{ display: "flex", gap: 28, alignItems: "center" }}><button onClick={() => window.location.href = "/search-hotels"} style={{ fontSize: 14, color: "#FCD34D", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Exclusive Member Deals</button>{user ? (<div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div><span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name.split(" ")[0]}</span></div>) : (<button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Log in / Sign up</button>)}</div>)}
        {isMobile && (<button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}><span style={{ display: "block", width: 22, height: 2, background: showMenu ? "transparent" : "rgba(255,255,255,0.8)", transition: "all 0.2s" }} /><span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.8)", transition: "all 0.2s", transform: showMenu ? "rotate(45deg) translate(5px,5px)" : "none" }} /><span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.8)", transition: "all 0.2s", transform: showMenu ? "rotate(-45deg) translate(5px,-5px)" : "none" }} /></button>)}
      </nav>
      {isMobile && showMenu && (<div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 99, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}><button onClick={() => { scrollTo("how"); setShowMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>How it works</button><button onClick={() => { window.location.href = "/search-hotels"; }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button><button onClick={() => { window.location.href = "/signin"; setShowMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Sign in</button></div>)}
      <section style={{ textAlign: "center", padding: isMobile ? "60px 20px 50px" : "90px 24px 70px", background: "transparent" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 28, letterSpacing: "0.04em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.2)" }}>✦ AI-Powered · Watches 24×7</div>
        <h1 className="sora" style={{ fontSize: isMobile ? 36 : 64, fontWeight: 800, lineHeight: 1.1, color: "#fff", maxWidth: 760, margin: "0 auto 20px" }}>Your hotel price just dropped. <span style={{ color: "#FCD34D" }}>Did you notice?</span></h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>Booked a hotel? rebuq watches the price 24/7 after you pay. When it drops, we alert you instantly — you rebook and pocket the difference. Free to check.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
          <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Check my booking — it&apos;s free</button>
          <button onClick={() => window.location.href = "/search-hotels"} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Explore exclusive member deals →</button>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 16 }}>Free to check · No app needed · WhatsApp alerts · Zero-risk pricing</p>
      </section>
      </div>

      <div id="deals" style={{ padding: isMobile ? "40px 0" : "20px 0 60px" }}>
        <div style={{ textAlign: "center", padding: isMobile ? "0 20px 20px" : "0 40px 28px" }}><p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 12 }}>Real savings · Verified drops</p><h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>rebuq members saved on these hotels</h2></div>
        <div style={{ overflow: "hidden", padding: isMobile ? "0 16px" : "0 40px" }} onTouchStart={e => { const t = e.touches[0]; (e.currentTarget as any)._touchStartX = t.clientX; }} onTouchEnd={e => { const startX = (e.currentTarget as any)._touchStartX; const endX = e.changedTouches[0].clientX; const diff = startX - endX; if (Math.abs(diff) > 50) { scrollCarousel(diff > 0 ? 1 : -1); } }}>
          <div style={{ display: "flex", gap: 16, transform: `translateX(-${carouselPos * (CARD_WIDTH + 16)}px)`, transition: "transform 0.4s cubic-bezier(.4,0,.2,1)" }}>
            {CARDS.map((c, i) => (<div key={i} className="hotel-card" style={{ flex: `0 0 ${CARD_WIDTH}px`, borderRadius: 14, overflow: "hidden", position: "relative", height: isMobile ? 160 : 200, cursor: "pointer", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}><img src={c.img} alt={c.name} className="hotel-card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 60%)" }} /><div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}><span style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, display: "block" }}>{c.price}</span><span style={{ fontSize: 12, opacity: 0.85 }}>{c.name}</span></div><div style={{ position: "absolute", top: 12, right: 12, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>{c.pct}</div></div>))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}><button onClick={() => scrollCarousel(-1)} disabled={carouselPos === 0} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos === 0 ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos === 0 ? 0.4 : 1 }}>‹</button><div style={{ display: "flex", gap: 6 }}>{Array.from({ length: CARDS.length - VISIBLE + 1 }, (_, i) => (<div key={i} onClick={() => setCarouselPos(i)} style={{ width: i === carouselPos ? 20 : 8, height: 8, borderRadius: 100, background: i === carouselPos ? B : "#e2e8f0", cursor: "pointer", transition: "all 0.3s" }} />))}</div><button onClick={() => scrollCarousel(1)} disabled={carouselPos >= MAX_POS} style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: carouselPos >= MAX_POS ? "default" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: carouselPos >= MAX_POS ? 0.4 : 1 }}>›</button></div>
        <div style={{ textAlign: "center", marginTop: 16 }}><button onClick={() => window.location.href = "/search-hotels"} style={{ background: "none", border: "1.5px solid #e2e8f0", color: NAVY, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Explore all member deals →</button></div>
      </div>

      <div id="how" style={{ padding: isMobile ? "60px 20px" : "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>How it works</p>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Three steps. Zero effort.</h2>
        <p style={{ fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 12 }}>Upload once. We watch forever. You save when the price drops.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 40, marginTop: 60, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column" }}>{["Upload", "Watch", "Save"].map((s, i) => (<button key={i} onClick={() => setActiveStep(i)} style={{ padding: "16px 20px", cursor: "pointer", borderLeft: isMobile ? "none" : `3px solid ${activeStep === i ? B : "#e2e8f0"}`, color: activeStep === i ? B : "#64748b", fontWeight: 600, fontSize: 15, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" as const }}>{s}</button>))}</div>
          <div style={{ background: "#f8fafc", borderRadius: 14, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#e0edff", color: B, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, marginBottom: 12 }}>✦ AI-powered</div>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24, lineHeight: 1.7 }}>{activeStep === 0 && "Upload your hotel booking confirmation — any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds. No manual entry needed."}{activeStep === 1 && "rebuq's AI engine checks your hotel price every 6 hours — day and night. We track flash sales, last-minute drops, and OTA-specific discounts you'd never catch manually."}{activeStep === 2 && "The moment we find a drop, you get a WhatsApp alert with a direct rebooking link. Cancel your old booking, rebook at the new rate, pocket the difference."}</p>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}><span>Live Price Tracker</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#16a34a" }}><span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />Monitoring</span></div>
              {[["MakeMyTrip", "₹41,200", "₹41,000", false], ["Booking.com", "₹41,200", "₹39,400", true], ["Agoda", "₹53,300", "₹53,300", false]].map(([site, orig, curr, drop], i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid #e2e8f0" : "none", fontSize: 14 }}><span style={{ color: "#64748b" }}>{site}</span><span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 13 }}>{orig}</span><span style={{ fontWeight: 700, color: NAVY }}>{curr}</span>{drop ? <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>↓₹1,800</span> : <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>—</span>}</div>))}
            </div>
            <button onClick={openModal} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>Start for free</button>
          </div>
        </div>
      </div>

      <div id="results" style={{ background: "#f8fafc", padding: isMobile ? "60px 20px" : "80px 40px" }} ref={statsRef}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>Real Results</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>₹18 crore saved. And counting.</h2>
          <p style={{ fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 12 }}>12,000+ Indian travelers are already saving on their hotel bookings.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 24, marginTop: 48 }}>{statValues.map((s, i) => (<div key={i} style={{ background: "#fff", borderRadius: 14, padding: "28px 24px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}><div className="sora" style={{ fontSize: 36, fontWeight: 800, color: NAVY }}>{s.prefix}{s.val.toLocaleString("en-IN")}{s.suffix}</div><div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{STATS[i].label}</div></div>))}</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20, marginTop: 32 }}>{TESTIMONIALS.map((t, i) => (<div key={i} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${B}, #60a5fa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{t.initials}</div><div><div style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>{t.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div></div></div><div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>{t.saved}</div><div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>&quot;{t.text}&quot;</div></div>))}</div>
        </div>
      </div>

      <div style={{ background: NAVY, padding: isMobile ? "50px 20px" : "70px 40px", textAlign: "center" }}><div className="sora" style={{ fontSize: isMobile ? 22 : 38, fontWeight: 700, color: "#fff", maxWidth: 720, margin: "0 auto 20px", lineHeight: 1.25 }}>&quot;This should be mandatory for every Indian traveler who books hotels online.&quot;</div><div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>— Ananya Krishnan · Travel Blogger, Chennai</div></div>

      <div id="why" style={{ padding: isMobile ? "60px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>Why rebuq</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Built for travelers who hate leaving money on the table.</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, marginTop: 48 }}>
            <div style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc", gridColumn: isMobile ? "auto" : "1/-1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, alignItems: "center" }}><div><span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: "#e0edff", color: B }}>Continuous</span><h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>AI that never sleeps</h3><p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>Our monitoring AI checks your hotel price every 6 hours — through the night, through weekends.</p><div className="sora" style={{ fontSize: 42, fontWeight: 800, color: B, marginTop: 16 }}>+4,200</div><div style={{ fontSize: 13, color: "#64748b" }}>Price drops found this month alone</div></div><div style={{ background: "#eff6ff", borderRadius: 12, padding: 28, textAlign: "center" }}><div className="sora" style={{ fontWeight: 700, fontSize: 22, color: B }}>24/7 Watching</div><div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Every 6 hours. Day &amp; night.</div></div></div>
            {[{ badge: "Instant", badgeBg: "#dcfce7", badgeColor: "#166634", title: "WhatsApp alerts", text: "The moment we find a drop, you get a WhatsApp message with a direct rebooking link — no app to install." }, { badge: "Full Coverage", badgeBg: "#fee2e2", badgeColor: "#991b1b", title: "All major OTAs", text: "MakeMyTrip, Booking.com, Agoda, Goibibo, Hotels.com — we watch them all so you don't have to." }, { badge: "Zero Risk", badgeBg: "#fef9c3", badgeColor: "#854d0e", title: "Zero-risk pricing", text: "Free to check. We take a small success fee only if we actually save you money." }, { badge: "Fast · 6hr avg", badgeBg: "#f3e8ff", badgeColor: "#7c3aed", title: "Catches drops fast", text: "Average time to find a significant price drop: under 6 hours." }].map((f, i) => (<div key={i} style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc" }}><span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span><h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{f.title}</h3><p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.text}</p></div>))}
          </div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", padding: isMobile ? "60px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14 }}>FAQ</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY }}>Common questions</h2>
          <div style={{ marginTop: 36 }}>{FAQS.map((f, i) => (<div key={i} style={{ background: "#fff", borderRadius: 12, marginBottom: 12, border: "1.5px solid #e2e8f0", overflow: "hidden" }}><button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{ width: "100%", padding: "20px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: NAVY, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" }}>{f.q}<span style={{ fontSize: 20, color: "#64748b", transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}>+</span></button>{openFaq === i && <div style={{ padding: "0 24px 20px", fontSize: 14.5, color: "#64748b", lineHeight: 1.7 }}>{f.a}</div>}</div>))}</div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1447b8 100%)", padding: isMobile ? "60px 20px" : "80px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, marginBottom: 24 }}>Free to check</div>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: "#fff", maxWidth: 600, margin: "0 auto 16px", lineHeight: 1.15 }}>Your next hotel booking could cost less. Let&apos;s find out.</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
          <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload my booking now ↗</button>
          <button onClick={() => scrollTo("how")} style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>▶ See how it works</button>
        </div>
      </div>

      <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
            <div><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div><p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p></div>
            <div style={{ display: "flex", gap: isMobile ? 28 : 48, flexDirection: isMobile ? "column" : "row" }}>{[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (<div key={col.title}><h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 14 }}>{col.title}</h4>{col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}</div>))}</div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
