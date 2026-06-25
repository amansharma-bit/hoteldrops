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
  hotel_name: string; hotel_city: string; hotel_address: string; check_in: string; check_out: string;
  total_nights: number; room_type: string; num_adults: number; num_children: number;
  children_ages: (number | null)[]; num_rooms: number; board_basis: string;
  board_basis_label: string; rate_plan_name: string; original_price: number;
  total_price_paid: number; price_per_night: number; currency_original: string;
  ota_name: string; booking_reference: string; cancellation_policy: string;
  cancellation_deadline: string; cancellation_penalty: number | null;
  payment_type: string; amount_paid_upfront: number; notes: string;
}

const emptyExtracted = (): ExtractedData => ({
  hotel_name: '', hotel_city: '', hotel_address: '', check_in: '', check_out: '', total_nights: 0,
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

const OTA_OPTIONS = [
  { code: '', label: 'Select platform' },
  { code: 'MakeMyTrip', label: 'MakeMyTrip' },
  { code: 'Agoda', label: 'Agoda' },
  { code: 'Booking.com', label: 'Booking.com' },
  { code: 'Cleartrip', label: 'Cleartrip' },
  { code: 'Goibibo', label: 'Goibibo' },
  { code: 'Yatra', label: 'Yatra' },
  { code: 'Flipkart Travel', label: 'Flipkart Travel' },
  { code: 'Expedia', label: 'Expedia' },
  { code: 'Hotels.com', label: 'Hotels.com' },
  { code: 'Others', label: 'Others' },
]

const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: NAVY }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

const CARDS = [
  { img: "/atlantisdubai.jpg",        name: "Dubai",     country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪", placeId: "ChIJRcbZaklDXz4RYlEphFBu5r0", hotels: "2,400+" },
  { img: "/Westinmaldives.jpg",       name: "Maldives",  country: "Maldives",             countryCode: "MV", flag: "🇲🇻", placeId: "ChIJvXv7qr-ZtSQRiWKVgeEJRUE", hotels: "180+"   },
  { img: "/lemeridienbali.jpg",       name: "Bali",      country: "Indonesia",            countryCode: "ID", flag: "🇮🇩", placeId: "ChIJoQ8Q6NNB0S0RkOYkS7EPkSQ", hotels: "1,200+" },
  { img: "/hyattregencybangkok.jpg",  name: "Bangkok",   country: "Thailand",             countryCode: "TH", flag: "🇹🇭", placeId: "ChIJ82ENKDJgHTERIEjiXbIAAQE", hotels: "3,100+" },
  { img: "/theroseatenewdelhi.jpg",   name: "New Delhi", country: "India",                countryCode: "IN", flag: "🇮🇳", placeId: "ChIJLbZ-NFv9DDkRQJY4FbcFcgM", hotels: "900+"   },
  { img: "/wgoa.jpg",                 name: "Goa",       country: "India",                countryCode: "IN", flag: "🇮🇳", placeId: "ChIJQbc2YxC6vzsRkkDzYv-H-Oo", hotels: "600+"   },
  { img: "/andazsingapore.jpg",       name: "Singapore", country: "Singapore",            countryCode: "SG", flag: "🇸🇬", placeId: "ChIJdZOLiiMR2jERxPWrUs9peIg", hotels: "700+"   },
  { img: "/langhamlondon.jpg",        name: "London",    country: "United Kingdom",       countryCode: "GB", flag: "🇬🇧", placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI", hotels: "4,200+" },
  { img: "/fourseasonsmumbai.jpg",    name: "Mumbai",    country: "India",                countryCode: "IN", flag: "🇮🇳", placeId: "ChIJwe1EZjDG5zsRaYxkjY_tpF0", hotels: "1,800+" },
  { img: "/Crowneplazayasidland.jpg", name: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪", placeId: "ChIJufI-cg9EXj4RCBGXQZMuzMc", hotels: "500+"   },
];

const FAQS = [
  { q: "Is rebuq really free to check?", a: "Yes — uploading your booking and letting rebuq monitor it is completely free. We only charge a small success fee when we actually save you money. If the price doesn't drop, you pay nothing." },
  { q: "Which OTAs and hotel chains do you support?", a: "We support MakeMyTrip, Booking.com, Agoda, Goibibo, Expedia, Hotels.com, and over 50 direct hotel websites. We're constantly adding new sources." },
  { q: "How do I rebook once you find a drop?", a: "We send you a WhatsApp alert with a direct link to the lower-priced booking. Cancel your old booking (most are free to cancel), rebook at the new rate, and pocket the difference. The whole process usually takes under 10 minutes." },
  { q: "What if I have a non-refundable booking?", a: "rebuq works best with refundable bookings. If your booking is non-refundable, we'll let you know when you upload — and suggest booking a flexible rate next time so you can benefit from price drops." },
];

async function compressImage(inputFile: File): Promise<File> {
  return new Promise((resolve) => {
    if (inputFile.type === 'application/pdf') { resolve(inputFile); return; }
    const img = new Image();
    const url = URL.createObjectURL(inputFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 2000;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], 'voucher.jpg', { type: 'image/jpeg' }));
        else resolve(inputFile);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(inputFile); };
    img.src = url;
  });
}

async function uploadVoucherToStorage(file: File): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('vouchers').upload(path, file, { contentType: file.type, upsert: false });
    if (error) { console.error('Storage upload error:', error); return null; }
    const { data } = supabase.storage.from('vouchers').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) { console.error('Storage error:', e); return null; }
}

function Icon({ d, size = 22, color = "currentColor", sw = 1.5 }: { d: string | string[]; size?: number; color?: string; sw?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const ICONS = {
  home:    ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  camera:  ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z", "M12 17a4 4 0 100-8 4 4 0 000 8z"],
  tag:     ["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z", "M7 7h.01"],
  user:    ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"],
  clock:   ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"],
  bell:    ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"],
  globe:   ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M2 12h20", "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"],
  shield:  ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
};

const SOCIAL_PROOFS = [
  "Priya S. saved ₹22,400 on Atlantis Dubai · just now",
  "Rahul M. saved ₹18,600 on W Maldives · 4 min ago",
  "Ananya K. saved ₹31,000 on Mandarin Oriental Bangkok · 9 min ago",
  "Vikram S. saved ₹14,200 on Conrad Singapore · 12 min ago",
  "Meera P. saved ₹27,800 on Four Seasons Mumbai · 18 min ago",
];

function SocialProofTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % SOCIAL_PROOFS.length); setVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 100, padding: "6px 16px", marginBottom: 28, transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.88)", fontWeight: 500, whiteSpace: "nowrap" }}>{SOCIAL_PROOFS[idx]}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState(0);
  const [carouselPos, setCarouselPos] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [signupPopup, setSignupPopup] = useState(false);
  const [popupMode, setPopupMode] = useState<'signup' | 'signin'>('signup');
  const [popupSigninEmail, setPopupSigninEmail] = useState('');
  const [popupSigninPw, setPopupSigninPw] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupPw, setPopupPw] = useState("");
  const [popupErr, setPopupErr] = useState("");
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'deals' | 'profile'>('home');

  const [modalOpen, setModalOpen]     = useState(false);
  const [uploadStep, setUploadStep]   = useState<1 | 2 | 'hotel_pick' | 'room_pick' | 'blocked' | 'success'>(1);
  const [blockInfo, setBlockInfo]     = useState<{reason:string;message?:string}|null>(null);
  const [warnings, setWarnings]       = useState<Record<string,any>>({});
  const [file, setFile]               = useState<File | null>(null);
  const [fileSource, setFileSource]   = useState<'upload' | 'camera' | null>(null);
  const [dragActive, setDragActive]   = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [scanMsg, setScanMsg]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [extracted, setExtracted]     = useState<ExtractedData | null>(null);
  const [phone, setPhone]             = useState('');
  const [emailVal, setEmailVal]       = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const cameraInputRef                = useRef<HTMLInputElement>(null);
  const [showChildAgePopup, setShowChildAgePopup] = useState(false);
  const [extractResult, setExtractResult] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [docType, setDocType] = useState<string>('confirmed_voucher');
  const [selectedHotelIdx, setSelectedHotelIdx] = useState<number | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number | null>(null);
  const [voucherUrl, setVoucherUrl]   = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "Member", email: data.user.email || "" });
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get("signup") === "1") {
          setSignupPopup(true);
        } else {
          setTimeout(() => setSignupPopup(true), 3000);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (modalOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

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
    setModalOpen(true); setUploadStep(1); setFile(null); setFileSource(null); setVoucherUrl(null); setExtracted(null); setDocType('confirmed_voucher');
    setPhone(''); setEmailVal(''); setSubmitError(''); setBlockInfo(null); setWarnings({}); setLoading(false);
    setExtractResult(null); setSelectedHotelIdx(null); setSelectedRoomIdx(null); setEditMode(false); setShowChildAgePopup(false);
  };

  const closeModal = () => { setModalOpen(false); };
  const scrollCarousel = (dir: number) => setCarouselPos(prev => Math.max(0, Math.min(MAX_POS, prev + dir)));

  function getFileLabel() {
    if (!file) return '';
    if (fileSource === 'camera') return 'Photo taken ✓';
    const name = file.name;
    if (name.length > 30) return name.substring(0, 27) + '…';
    return name;
  }

  async function doScan() {
    if (!file) return;
    setScanning(true);
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    const uploadedUrl = await uploadVoucherToStorage(file);
    setVoucherUrl(uploadedUrl);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('voucher', compressedFile);
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/extract', {
        method: 'POST', body: formData,
      });
      const json = await res.json();
      clearInterval(interval);
      setScanning(false);
      if (!json.success) {
        setBlockInfo({ reason: json.blockReason || 'parse_error', message: json.message });
        setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }
      const docTypeResult = json.documentType || json.doc_type || 'confirmed_voucher';
      setDocType(docTypeResult);
      if (docTypeResult === 'not_hotel') {
        setBlockInfo({ reason: 'not_hotel' });
        setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }
      if (docTypeResult === 'search_results') {
        if (json.data?.hotels?.length > 1) {
          setExtractResult(json);
          setUploadStep('hotel_pick');
        } else if (json.data?.hotels?.length === 1) {
          const _h0 = json.data.hotels[0];
          setExtracted({ ...emptyExtracted(), check_in: json.data.check_in || '', check_out: json.data.check_out || '', total_nights: json.data.total_nights || 0, num_adults: json.data.num_adults || 2, num_children: json.data.num_children || 0, children_ages: json.data.children_ages || [], ota_name: json.data.ota_name || '', ..._h0 });
          if (!_h0?.total_price_paid && !_h0?.price_per_night_incl_tax) setEditMode(true);
          setUploadStep(2);
        } else {
          setExtracted({ ...emptyExtracted(), ...json.data });
          setUploadStep(2);
        }
        return;
      }
      if (docTypeResult === 'hotel_detail_top' || docTypeResult === 'hotel_detail_rooms') {
        if (json.data?.room_options?.length > 1) {
          setExtractResult(json);
          setUploadStep('room_pick');
        } else if (json.data?.room_options?.length === 1) {
          const room = json.data.room_options[0];
          setExtracted({ ...emptyExtracted(), ...json.data, room_type: room.room_type || '', original_price: room.price_per_night || 0, board_basis: room.board_basis || 'RO', board_basis_label: room.board_basis_label || 'Room Only', cancellation_policy: room.cancellation_policy || 'unknown', cancellation_deadline: room.cancellation_deadline || '', total_price_paid: room.total_price_incl_tax || 0 });
          setWarnings(json.warnings || {});
          setDocType('hotel_detail_rooms');
          setUploadStep(2);
        } else {
          setExtracted({ ...emptyExtracted(), ...json.data });
          setWarnings(json.warnings || {});
          setDocType('hotel_detail_rooms');
          setEditMode(true);
          setUploadStep(2);
        }
        return;
      }
      if (docTypeResult === 'checkout_page') {
        setExtracted({ ...emptyExtracted(), ...json.data });
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
      if (json.blocked && json.blockReason === 'non_refundable') { setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return; }
      if (json.blockReason === 'checkin_passed') { setBlockInfo({ reason: 'checkin_passed', message: json.message }); setUploadStep('blocked'); return; }
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
    const effectivePrice = extracted?.total_price_paid || extracted?.price_per_night || 0;
    if (!effectivePrice) { setSubmitError('Please enter the total price you paid'); return; }
    if (!extracted?.total_price_paid && extracted?.price_per_night) setExtracted(prev => ({ ...prev, total_price_paid: prev.price_per_night * (prev.total_nights || 1) }));
    if (extracted?.cancellation_policy === 'non-refundable') { setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return; }
    setLoading(true);
    try {
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extracted, phone: phone.startsWith('+') ? phone : `+91${phone}`, email: emailVal, voucher_url: voucherUrl || null, doc_type: docType }),
      });
      const json = await res.json();
      if (json.blocked && json.reason === 'non_refundable') { setBlockInfo({ reason: 'non_refundable' }); setUploadStep('blocked'); return; }
      if (json.reason === 'duplicate') { setBlockInfo({ reason: 'duplicate', message: json.message }); setUploadStep('blocked'); return; }
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit');
      sessionStorage.setItem('rebuq_booking', JSON.stringify({ extracted, bookingId: json.booking_id, liteapi_hotel_id: json.liteapi_hotel_id || null }));
      router.push('/tracking');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  const handlePopupGoogle = async () => {
    setPopupLoading(true); setPopupErr("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/` } });
    if (error) { setPopupErr(error.message); setPopupLoading(false); }
  };

  const handlePopupSignup = async () => {
    if (!popupEmail || !popupPw) { setPopupErr("Please enter email and password"); return; }
    setPopupLoading(true); setPopupErr("");
    const { error } = await supabase.auth.signUp({ email: popupEmail, password: popupPw });
    if (error) { setPopupErr(error.message); setPopupLoading(false); return; }
    setSignupPopup(false); setPopupLoading(false);
  };

  const dismissPopup = () => { setSignupPopup(false); setPopupMode('signup'); };

  const handlePopupSignin = async () => {
    if (!popupSigninEmail || !popupSigninPw) { setPopupErr('Please enter email and password'); return; }
    setPopupLoading(true); setPopupErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: popupSigninEmail, password: popupSigninPw });
    if (error) { setPopupErr(error.message); setPopupLoading(false); return; }
    setSignupPopup(false); setPopupLoading(false); router.refresh();
  };

  // ── CONFIRM FORM (used in both confirmed_voucher and browsing flows) ──────
  function ConfirmForm({ isBrowsing }: { isBrowsing: boolean }) {
    if (!extracted) return null;
    return (
      <div>
        {/* Banner */}
        {isBrowsing ? (
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: B, marginBottom: 3, fontFamily: "'Sora',sans-serif" }}>Looks like you haven't booked yet — that's perfect.</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                {extracted.hotel_name && extracted.check_in && extracted.check_out
                  ? <>We've picked up <strong>{extracted.hotel_name}</strong> for <strong>{new Date(extracted.check_in+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})} → {new Date(extracted.check_out+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</strong>. Confirm the details below and we'll alert you the moment this price drops.</>
                  : <>We'll monitor this hotel's price and alert you the moment it drops. Please fill in the details below.</>
                }
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: B, borderRadius: 12, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2, fontFamily: "'Sora',sans-serif" }}>Your booking is ready to track</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Review the details below and we'll start watching the price 24/7.</div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.partialExtraction && <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#92400e' }}><strong>Partial read</strong> — Please check and fill in any missing details.</div>}
        {warnings.checkInSoon && <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#c2410c' }}><strong>Check-in very soon</strong> — Your check-in is {warnings.checkInSoonDays === 0 ? 'today' : 'tomorrow'}. We will scan immediately but the window to rebook is tight.</div>}
        {warnings.payAtProperty && <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#0369a1' }}><strong>Pay at property</strong> — You have not paid yet so amount shows ₹0. We will still track the rate.</div>}
        {warnings.unknownPolicy && <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#92400e' }}><strong>Cancellation policy unclear</strong> — Please select your policy below.</div>}
        {warnings.currencyConverted && extracted?.total_price_paid > 0 && <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#166534' }}><strong>Currency converted</strong> — Original was in {warnings.originalCurrency}, converted to INR. Please verify.</div>}

        {/* Hotel details form */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Hotel details</div>

          {/* Hotel name */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Hotel name *</label>
            <input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Sofitel Dubai Downtown" />
          </div>

          {/* City */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>City</label>
            <input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" />
          </div>

          {/* Dates */}
          <div style={grid2}>
            <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
            <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
          </div>

          {/* Adults + Rooms */}
          <div style={grid2}>
            <div><label style={lbl}>Adults *</label><input style={inp} type="number" min={1} max={10} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: Number(e.target.value) })} /></div>
            <div><label style={lbl}>Rooms</label><input style={inp} type="number" min={1} max={10} value={extracted.num_rooms} onChange={e => setExtracted({ ...extracted, num_rooms: Number(e.target.value) })} /></div>
          </div>

          {/* Children — only show if > 0, with age per child */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Children</label>
            <input style={inp} type="number" min={0} max={9} value={extracted.num_children}
              onChange={e => {
                const n = Number(e.target.value);
                const ages = Array.from({ length: n }, (_, i) => extracted.children_ages[i] ?? null);
                setExtracted({ ...extracted, num_children: n, children_ages: ages });
              }}
              placeholder="0"
            />
          </div>
          {extracted.num_children > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Age of each child (years)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {Array.from({ length: extracted.num_children }, (_, i) => (
                  <div key={i}>
                    <label style={{ ...lbl, fontSize: 11 }}>Child {i + 1}</label>
                    <input style={{ ...inp, padding: '9px 10px', textAlign: 'center' as const }} type="number" min={0} max={17}
                      value={extracted.children_ages[i] ?? ''}
                      placeholder="Age"
                      onChange={e => {
                        const ages = [...(extracted.children_ages || [])];
                        ages[i] = e.target.value ? Number(e.target.value) : null;
                        setExtracted({ ...extracted, children_ages: ages });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total paid */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Total paid incl. taxes (₹) *</label>
            <input style={inp} type="number" value={extracted.total_price_paid || ''} onChange={e => setExtracted({ ...extracted, total_price_paid: Number(e.target.value) })} placeholder="e.g. 95000" />
          </div>

          {/* Booked on OTA */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Booked on</label>
            <select style={inp} value={extracted.ota_name} onChange={e => setExtracted({ ...extracted, ota_name: e.target.value })}>
              {OTA_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>

          {/* Cancellation policy */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Cancellation policy</label>
            <select style={inp} value={extracted.cancellation_policy} onChange={e => setExtracted({ ...extracted, cancellation_policy: e.target.value })}>
              {CANCEL_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>

          {/* Meal plan */}
          <div style={{ marginBottom: 0 }}>
            <label style={lbl}>Meal plan</label>
            <select style={inp} value={extracted.board_basis} onChange={e => { const opt = BOARD_OPTIONS.find(o => o.code === e.target.value); setExtracted({ ...extracted, board_basis: e.target.value, board_basis_label: opt?.label || '' }); }}>
              {BOARD_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Alert contact section — clean white card */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Where should we send your price drop alert?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>We'll WhatsApp you the moment the price falls.</div>
          </div>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <span style={{ ...inp, width: 52, borderRadius: '10px 0 0 10px', borderRight: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>+91</span>
            <input style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1, borderLeft: 'none' }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number" maxLength={10} />
          </div>
          <input style={{ ...inp, marginBottom: 14 }} type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="Email address" />
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 14 }}>Free · No app needed · No spam</div>
          {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#dc2626' }}>{submitError}</div>}
          <button onClick={submitBooking} disabled={loading || extracted.cancellation_policy === 'non-refundable'}
            style={{ width: '100%', background: extracted.cancellation_policy === 'non-refundable' ? '#e2e8f0' : '#FCD34D', color: extracted.cancellation_policy === 'non-refundable' ? '#94a3b8' : NAVY, border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: extracted.cancellation_policy === 'non-refundable' ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Starting tracker…' : extracted.cancellation_policy === 'non-refundable' ? 'Cannot track non-refundable' : 'Start tracking my price →'}
          </button>
        </div>

        {/* Back / re-upload */}
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
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 16, lineHeight: 1.6, WebkitFontSmoothing: "antialiased", overflowX: "hidden", maxWidth: "100vw", paddingBottom: isMobile ? 72 : 0 }}>
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
        .bottom-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 4px; cursor: pointer; background: none; border: none; padding: 8px 0; font-family: inherit; }
        .bottom-tab:active { opacity: 0.7; }
      `}</style>

      {/* ── Scanning overlay ── */}
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

      {/* ── Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: isMobile ? '16px 16px 0 0' : 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', marginTop: isMobile ? 'auto' : 60, animation: 'slideUp 0.25s ease', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', ...(isMobile ? { position: 'fixed' as const, bottom: 0, left: 0, right: 0, marginTop: 0, borderRadius: '20px 20px 0 0', maxHeight: '92vh' } : {}) }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, background: '#fff', zIndex: 10, borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0' }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY }}>
                  {uploadStep === 1 ? 'Upload your voucher'
                    : uploadStep === 2 ? ((['search_results','hotel_detail_rooms','hotel_detail_top','checkout_page'].includes(docType)) ? 'Set a price alert' : 'Confirm booking details')
                    : uploadStep === 'hotel_pick' ? '🏨 Select a hotel'
                    : uploadStep === 'room_pick' ? '🛏️ Select a room'
                    : blockInfo?.reason === 'non_refundable' ? '🔒 Non-refundable booking'
                    : blockInfo?.reason === 'not_hotel' ? '📄 Not a hotel booking'
                    : blockInfo?.reason === 'poor_quality' || blockInfo?.reason === 'parse_error' ? '🔍 Could not read voucher'
                    : blockInfo?.reason === 'checkin_passed' ? '📅 Check-in already passed'
                    : blockInfo?.reason === 'duplicate' ? '✅ Already tracking'
                    : blockInfo?.reason === 'network_error' ? '⚠️ Connection issue'
                    : uploadStep === 'success' ? '✅ Booking tracked!'
                    : '⚠️ We need your attention'}
                </div>
                {uploadStep !== 'blocked' && uploadStep !== 'hotel_pick' && uploadStep !== 'room_pick' && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {uploadStep === 2 ? ((['search_results','hotel_detail_rooms','hotel_detail_top','checkout_page'].includes(docType)) ? "We'll notify you the moment this price drops" : 'Review and correct anything that looks wrong') : ''}
                  </div>
                )}
              </div>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
            </div>

            {/* Step indicator */}
            {uploadStep !== 'blocked' && uploadStep !== 'hotel_pick' && uploadStep !== 'room_pick' && (
              <div style={{ padding: '12px 24px', background: '#f8fafc', display: 'flex', gap: 0, borderBottom: '1px solid #f1f5f9' }}>
                {[{ n: uploadStep === 2 ? '✓' : '1', label: 'Upload', done: uploadStep === 2 }, { n: '2', label: 'Confirm', active: uploadStep === 2 }].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.done ? '#16a34a' : s.active ? B : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.done ? '#16a34a' : s.active ? B : '#94a3b8' }}>{s.label}</span>
                    {i === 0 && <div style={{ width: 32, height: 1, background: '#e2e8f0', margin: '0 8px' }} />}
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: '20px 24px 32px' }}>

              {/* ── STEP 1: Upload ── */}
              {uploadStep === 1 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <label style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 10, background: (file && fileSource === 'upload') ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${(file && fileSource === 'upload') ? '#86efac' : '#e2e8f0'}`, borderRadius: 14, padding: '24px 12px', cursor: 'pointer', minHeight: 110 }}>
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('upload'); } }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={(file && fileSource === 'upload') ? '#16a34a' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <div style={{ textAlign: 'center' as const }}><div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Upload file</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>PDF, JPG, PNG</div></div>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 10, background: (file && fileSource === 'camera') ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${(file && fileSource === 'camera') ? '#86efac' : '#e2e8f0'}`, borderRadius: 14, padding: '24px 12px', cursor: 'pointer', minHeight: 110 }}>
                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={cameraInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); } }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={(file && fileSource === 'camera') ? '#16a34a' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      <div style={{ textAlign: 'center' as const }}><div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Take photo</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Use camera</div></div>
                    </label>
                  </div>
                  {file && fileSource === 'camera' && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Photo taken ✓</span>
                      <button onClick={() => cameraInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#16a34a', fontFamily: 'inherit', fontWeight: 600 }}>Retake</button>
                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={cameraInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileSource('camera'); } }} />
                    </div>
                  )}
                  {file && fileSource === 'upload' && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{getFileLabel()}</span>
                      <button onClick={() => { setFile(null); setFileSource(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontFamily: 'inherit' }}>✕</button>
                    </div>
                  )}
                  <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
                  {(!file || fileSource === 'upload') && (
                    <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? B : '#e2e8f0'}`, borderRadius: 12, padding: '20px', marginBottom: 16, textAlign: 'center' as const, cursor: 'pointer', background: dragActive ? '#eff6ff' : '#fafafa', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 13, color: '#64748b' }}>or drag & drop your voucher here</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>PDF, PNG, JPG up to 10MB</div>
                    </div>
                  )}
                  <button onClick={doScan} disabled={!file} style={{ width: '100%', background: file ? B : '#e2e8f0', color: file ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: file ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                    {file ? 'Scan with AI →' : 'Choose a file to continue'}
                  </button>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center' as const, marginTop: 12, lineHeight: 1.6 }}>Free to check · No app needed · WhatsApp alerts</p>
                </div>
              )}

              {/* ── Hotel picker ── */}
              {uploadStep === 'hotel_pick' && extractResult?.data?.hotels && (
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>We found multiple hotels in your screenshot. Pick the one you want to track:</p>
                  {extractResult.data.hotels.map((h: any, i: number) => (
                    <button key={i} onClick={() => { setSelectedHotelIdx(i); const _merged = { ...emptyExtracted(), check_in: extractResult.data.check_in || '', check_out: extractResult.data.check_out || '', total_nights: extractResult.data.total_nights || 0, num_adults: extractResult.data.num_adults || 2, num_children: extractResult.data.num_children || 0, children_ages: extractResult.data.children_ages || [], ota_name: extractResult.data.ota_name || '', ...h }; setExtracted(_merged); setWarnings(extractResult.warnings || {}); if (!_merged.total_price_paid) setEditMode(true); setUploadStep(2); }}
                      style={{ width: '100%', background: selectedHotelIdx === i ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${selectedHotelIdx === i ? B : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 4 }}>{h.hotel_name || 'Unknown hotel'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{h.hotel_city} · {h.check_in} → {h.check_out}{h.total_price_paid ? ` · ₹${Math.round(h.total_price_paid).toLocaleString('en-IN')}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Room picker ── */}
              {uploadStep === 'room_pick' && extractResult?.data?.room_options && (
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Select the room you booked:</p>
                  {extractResult.data.room_options.map((r: any, i: number) => (
                    <button key={i} onClick={() => { setSelectedRoomIdx(i); setExtracted({ ...emptyExtracted(), ...extractResult.data, room_type: r.room_type || '', original_price: r.price_per_night || 0, board_basis: r.board_basis || 'RO', board_basis_label: r.board_basis_label || 'Room Only', cancellation_policy: r.cancellation_policy || 'unknown', cancellation_deadline: r.cancellation_deadline || '', total_price_paid: r.total_price_incl_tax || 0 }); setUploadStep(2); }}
                      style={{ width: '100%', background: selectedRoomIdx === i ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${selectedRoomIdx === i ? B : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 4 }}>{r.room_type || 'Standard Room'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.board_basis_label || 'Room Only'}{r.total_price_incl_tax ? ` · ₹${Math.round(r.total_price_incl_tax).toLocaleString('en-IN')} total` : ''}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── STEP 2: Confirm ── */}
              {uploadStep === 2 && extracted && (
                <ConfirmForm isBrowsing={['search_results','hotel_detail_rooms','hotel_detail_top','checkout_page'].includes(docType)} />
              )}

              {/* ── Blocked states ── */}
              {uploadStep === 'blocked' && blockInfo && (
                <div>
                  {blockInfo.reason === 'not_hotel' && (<div><div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>📄</div><div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>This does not look like a hotel booking.</div><p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>Please upload a hotel booking confirmation — not a flight ticket, train ticket, restaurant receipt, or other document.</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setBlockInfo(null); }} style={{ flex: 1, background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upload a hotel voucher</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#fff', color: B, border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
                  {blockInfo.reason === 'checkin_passed' && (<div><div style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>📅</div><div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Check-in date has already passed.</div><p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>Your stay has already started or ended. rebuq tracks prices before check-in. For future bookings, upload right after you book!</p></div><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setBlockInfo(null); }} style={{ width: '100%', background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Track a future booking</button></div>)}
                  {blockInfo.reason === 'non_refundable' && (<div><div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div><div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Non-refundable booking</div><p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.7 }}>rebuq can't help with non-refundable bookings — even if the price drops, you can't cancel and rebook. Next time, book a flexible rate so you can take advantage of any drops.</p></div><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setExtracted(null); setBlockInfo(null); }} style={{ width: '100%', background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Try another booking</button></div>)}
                  {(blockInfo.reason === 'parse_error' || blockInfo.reason === 'poor_quality') && (<div><div style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Could not read your voucher</div><p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{blockInfo.message || 'The image may be blurry or the text is not clear enough. Try a clearer photo or enter your details manually.'}</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setUploadStep(1); setFile(null); setFileSource(null); setBlockInfo(null); }} style={{ flex: 1, background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Try again</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#fff', color: B, border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
                  {blockInfo.reason === 'duplicate' && (<div><div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>✅</div><div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Already tracking this booking</div><p style={{ fontSize: 13, color: '#14532d', lineHeight: 1.7 }}>{blockInfo.message || 'We are already watching this booking for you.'}</p></div><button onClick={() => window.location.href = '/dashboard'} style={{ width: '100%', background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View my dashboard</button></div>)}
                  {blockInfo.reason === 'network_error' && (<div><div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14, padding: 24, marginBottom: 20 }}><div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div><div style={{ fontSize: 16, fontWeight: 700, color: '#c2410c', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Connection issue</div><p style={{ fontSize: 13, color: '#7c2d12', lineHeight: 1.7 }}>{blockInfo.message}</p></div><div style={{ display: 'flex', gap: 10 }}><button onClick={() => { setBlockInfo(null); if (file) doScan(); else setUploadStep(1); }} style={{ flex: 1, background: B, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Try again</button><button onClick={() => { setExtracted(emptyExtracted()); setBlockInfo(null); setUploadStep(2); }} style={{ flex: 1, background: '#fff', color: B, border: '1.5px solid #bfdbfe', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button></div></div>)}
                </div>
              )}

              {/* ── Success ── */}
              {uploadStep === 'success' && (
                <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>You're all set!</div>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>We're watching your hotel price 24/7. You'll get a WhatsApp alert the moment it drops.</p>
                  <button onClick={closeModal} style={{ width: '100%', background: B, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ══ TOP NAV ══ */}
      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)" }}>
        <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
          <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none" }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <button onClick={() => window.location.href = "/search-hotels"} style={{ fontSize: 14, color: "#FCD34D", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Member Deals</button>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name.split(" ")[0]}</span>
                </div>
              ) : (
                <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
              )}
            </div>
          )}
        </nav>

        {/* ══ HERO ══ */}
        {isMobile ? (
          <section style={{ textAlign: "center", padding: "48px 20px 52px" }}>
            <SocialProofTicker />
            <h1 className="sora" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: "#fff", margin: "0 auto 18px" }}>
              Hotels drop their prices<br />after you book.<br /><span style={{ color: "#FCD34D" }}>We catch it. You save.</span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", margin: "0 auto 32px", lineHeight: 1.7 }}>
              rebuq monitors your hotel price 24/7. The moment it drops below what you paid, we alert you instantly. Rebook in minutes and keep the difference.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>Free · No credit card needed</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 12, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                Check my booking — it&apos;s free
              </button>
              <button onClick={() => window.location.href = "/search-hotels"} style={{ background: "transparent", color: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                Explore member deals
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 18 }}>Free to check · No app needed · WhatsApp alerts · Zero-risk pricing</p>
          </section>
        ) : (
          <section style={{ textAlign: "center", padding: "90px 24px 70px", background: "transparent" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 28, letterSpacing: "0.04em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.2)" }}>✦ AI-Powered · Watches 24×7</div>
            <h1 className="sora" style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, color: "#fff", maxWidth: 760, margin: "0 auto 20px" }}>
              Hotels drop their prices after you book.<br /><span style={{ color: "#FCD34D" }}>We catch it. You save.</span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", maxWidth: 540, margin: "0 auto 12px", lineHeight: 1.7 }}>
              rebuq monitors your hotel price 24/7. The moment it drops below what you paid, we alert you instantly. Rebook in minutes and keep the difference.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 36 }}>Free · No credit card needed · Works on all major OTAs</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
              <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Check my booking — it&apos;s free</button>
              <button onClick={() => window.location.href = "/search-hotels"} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Explore exclusive member deals →</button>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 16 }}>Free to check · No app needed · WhatsApp alerts · Zero-risk pricing</p>
          </section>
        )}
      </div>

      {/* ══ MEMBER DEALS ══ */}
      <div id="deals" style={{ padding: isMobile ? "48px 0" : "64px 0" }}>
        <div style={{ textAlign: "center", padding: isMobile ? "0 20px 24px" : "0 40px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 10 }}>Member Exclusive Rates</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: NAVY }}>Save up to 60% on member rates.</h2>
        </div>
        <div style={{ overflow: "hidden", padding: isMobile ? "0 16px" : "0 40px" }}
          onTouchStart={e => { (e.currentTarget as any)._tx = e.touches[0].clientX; }}
          onTouchEnd={e => { const diff = (e.currentTarget as any)._tx - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) scrollCarousel(diff > 0 ? 1 : -1); }}>
          <div style={{ display: "flex", gap: 16, transform: `translateX(-${carouselPos * (CARD_WIDTH + 16)}px)`, transition: "transform 0.4s cubic-bezier(.4,0,.2,1)" }}>
            {CARDS.map((c, i) => {
              const ci = new Date(Date.now() + 14*86400000).toISOString().split('T')[0];
              const co = new Date(Date.now() + 15*86400000).toISOString().split('T')[0];
              const fullDest = c.country ? `${c.name}, ${c.country}` : c.name;
              const url = `/search?destination=${encodeURIComponent(fullDest)}&checkIn=${ci}&checkOut=${co}&adults=2&rooms=1&children=0&placeId=${c.placeId}&countryCode=${c.countryCode||""}&cityName=${encodeURIComponent(c.name)}`;
              return (
                <div key={i} className="hotel-card" onClick={() => window.location.href = url} style={{ flex: `0 0 ${CARD_WIDTH}px`, borderRadius: 14, overflow: "hidden", position: "relative", height: isMobile ? 160 : 200, cursor: "pointer" }}>
                  <img src={c.img} alt={c.name} className="hotel-card-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                    <span className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, display: "block", lineHeight: 1.1 }}>{c.flag} {c.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.8, marginTop: 3, display: "block" }}>{c.hotels} hotels</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
          {Array.from({ length: MAX_POS + 1 }, (_, i) => (
            <div key={i} onClick={() => setCarouselPos(i)} style={{ width: i === carouselPos ? 20 : 8, height: 8, borderRadius: 100, background: i === carouselPos ? B : "#e2e8f0", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => window.location.href = "/search-hotels"} style={{ background: "none", border: "1.5px solid #e2e8f0", color: NAVY, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Explore all member deals
          </button>
        </div>
      </div>

      {/* ══ HOW IT WORKS ══ */}
      <div id="how" style={{ background: "#f8fafc", padding: isMobile ? "56px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 12, textAlign: "center" }}>How it works</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15, marginBottom: 8 }}>Three steps. Zero effort.</h2>
          <p style={{ fontSize: 15, color: "#64748b", textAlign: "center", marginBottom: 48 }}>Upload once. We watch forever. You save when the price drops.</p>
          {isMobile ? (
            <div style={{ overflowX: "auto", margin: "0 -20px", padding: "0 20px 12px", scrollbarWidth: "none" }}>
              <div style={{ display: "flex", gap: 14, width: "max-content", paddingRight: 20 }}>
                {[
                  { n: "01", title: "Upload", desc: "Scan or upload your hotel booking confirmation. Any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds." },
                  { n: "02", title: "Watch", desc: "rebuq's AI checks your hotel price every 6 hours, day and night. We track flash sales and last-minute drops you'd never catch manually." },
                  { n: "03", title: "Save", desc: "The moment we find a drop, you get a WhatsApp alert with a direct rebooking link. Cancel and rebook. Pocket the difference." },
                ].map((s, i) => (
                  <div key={i} style={{ width: 240, flexShrink: 0, background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #e2e8f0" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: B, letterSpacing: "0.1em", marginBottom: 16 }}>{s.n}</div>
                    <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { n: "01", title: "Upload", desc: "Scan or upload your hotel booking confirmation. Any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds — no manual entry needed." },
                { n: "02", title: "Watch", desc: "rebuq's AI checks your hotel price every 6 hours, day and night. We track flash sales, last-minute drops, and OTA-specific discounts you'd never catch manually." },
                { n: "03", title: "Save", desc: "The moment we find a drop, you get a WhatsApp alert with a direct rebooking link. Cancel your old booking, rebook at the new rate, pocket the difference." },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1.5px solid #e2e8f0" }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: B, letterSpacing: "0.1em", marginBottom: 18 }}>{s.n}</div>
                  <h3 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={openModal} style={{ background: B, color: "#fff", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Start for free</button>
          </div>
        </div>
      </div>

      {/* ══ WHY REBUQ ══ */}
      <div id="why" style={{ padding: isMobile ? "56px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 12, textAlign: "center" }}>Why rebuq</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15, marginBottom: 48 }}>Built for travelers who hate leaving money on the table.</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 14 : 20 }}>
            {[
              { icon: ICONS.clock,  title: "AI never sleeps",   desc: "Checks your hotel price every 6 hours, through the night, through weekends.", bg: "#eff6ff", ic: B },
              { icon: ICONS.bell,   title: "WhatsApp alerts",   desc: "Instant alert with a rebooking link the moment the price drops. No app to install.", bg: "#f0fdf4", ic: "#16a34a" },
              { icon: ICONS.globe,  title: "All major OTAs",    desc: "MakeMyTrip, Booking.com, Agoda, Goibibo, Cleartrip, Expedia, Hotels.com and more.", bg: "#fefce8", ic: "#d97706" },
              { icon: ICONS.shield, title: "Zero risk",         desc: "Free to check. We take a small success fee only if we actually save you money.", bg: "#fdf4ff", ic: "#7c3aed" },
            ].map((f, i) => (
              <div key={i} style={{ background: f.bg, borderRadius: 16, padding: isMobile ? 18 : 28 }}>
                <div style={{ marginBottom: 14 }}><Icon d={f.icon} size={22} color={f.ic} /></div>
                <div className="sora" style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{f.title}</div>
                <p style={{ fontSize: isMobile ? 12 : 13.5, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BAND — desktop only */}
      {!isMobile && (
        <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 100%)", padding: "80px 40px", textAlign: "center" }}>
          <h2 className="sora" style={{ fontSize: 44, fontWeight: 800, color: "#fff", maxWidth: 560, margin: "0 auto 16px", lineHeight: 1.15 }}>
            Your next hotel booking could cost less. Let&apos;s find out.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops.
          </p>
          <button onClick={openModal} style={{ background: "#fff", color: B, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Upload my booking now
          </button>
        </div>
      )}

      {/* FOOTER */}
      {isMobile ? (
        <footer style={{ background: NAVY, padding: "20px 20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>rebuq<span style={{ color: B }}>.</span></div>
            <span style={{ fontSize: 11.5, color: "#475569" }}>© 2026 rebuq</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>About</a>
          </div>
        </footer>
      ) : (
        <footer style={{ background: NAVY, padding: "48px 40px 32px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 36, gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
                <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 240, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
              </div>
              <div style={{ display: "flex", gap: 48 }}>
                {[
                  { title: "Product", links: [{ l: "How it works", h: "#how" }, { l: "Member Deals", h: "/search-hotels" }, { l: "Dashboard", h: "/dashboard" }] },
                  { title: "Company", links: [{ l: "About", h: "#" }, { l: "Privacy", h: "#" }, { l: "Terms", h: "#" }] },
                ].map(col => (
                  <div key={col.title}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                    {col.links.map(l => <a key={l.l} href={l.h} style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l.l}</a>)}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: "#475569" }}>© 2026 rebuq. All rights reserved.</span>
              <span style={{ fontSize: 12.5, color: "#334155" }}>Powered by Claude AI · Anthropic</span>
            </div>
          </div>
        </footer>
      )}

      {/* BOTTOM NAV — mobile */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 68, background: "#fff", borderTop: "1px solid #f1f5f9", zIndex: 200, display: "flex", alignItems: "stretch" }}>
          {[
            { key: "home",    label: "Home",    icon: ICONS.home,   action: () => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
            { key: "scan",    label: "Scan",    icon: ICONS.camera, action: () => { setActiveTab('scan'); openModal(); } },
            { key: "deals",   label: "Deals",   icon: ICONS.tag,    action: () => { setActiveTab('deals'); window.location.href = "/search-hotels"; } },
            { key: "profile", label: "Profile", icon: ICONS.user,   action: () => { setActiveTab('profile'); window.location.href = user ? "/dashboard" : "/signin"; } },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} className="bottom-tab" onClick={tab.action} style={{ color: isActive ? B : "#94a3b8" }}>
                <Icon d={tab.icon} size={22} color={isActive ? B : "#94a3b8"} />
                <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 400, letterSpacing: "0.01em" }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* SIGNUP POPUP */}
      {signupPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1447b8 60%, #1565c0 100%)", borderRadius: 20, padding: isMobile ? "32px 24px" : "44px 48px", width: "100%", maxWidth: 420, position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <button onClick={dismissPopup} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 16 }}>rebuq<span style={{ color: "#FCD34D" }}>.</span></div>
            {popupMode === 'signup' ? (<>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: isMobile ? 22 : 26, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>Your next hotel stay costs less than you think.</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.6 }}>Join rebuq and unlock 2,70,000 exclusive member deals.</p>
              <button onClick={handlePopupGoogle} disabled={popupLoading} style={{ width: "100%", background: "#fff", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#0f172a", marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <input type="email" value={popupEmail} onChange={e => setPopupEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none", marginBottom: 10 }} />
              <input type="password" value={popupPw} onChange={e => setPopupPw(e.target.value)} placeholder="Password (min. 8 characters)" style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none", marginBottom: 14 }} />
              {popupErr && <div style={{ fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{popupErr}</div>}
              <button onClick={handlePopupSignup} disabled={popupLoading} style={{ width: "100%", background: "#FCD34D", color: "#0f172a", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: popupLoading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12 }}>
                {popupLoading ? "Creating account…" : "Create free account →"}
              </button>
              <button onClick={dismissPopup} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "8px" }}>Maybe later</button>
            </>) : (<>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: isMobile ? 22 : 26, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>Welcome back.</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>Sign in to access your member deals.</p>
              <button onClick={handlePopupGoogle} disabled={popupLoading} style={{ width: "100%", background: "#fff", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#0f172a", marginBottom: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <input type="email" value={popupSigninEmail} onChange={e => setPopupSigninEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none", marginBottom: 10 }} />
              <input type="password" value={popupSigninPw} onChange={e => setPopupSigninPw(e.target.value)} placeholder="Password" style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none", marginBottom: 14 }} />
              {popupErr && <div style={{ fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{popupErr}</div>}
              <button onClick={handlePopupSignin} disabled={popupLoading} style={{ width: "100%", background: "#FCD34D", color: "#0f172a", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: popupLoading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12 }}>
                {popupLoading ? "Signing in…" : "Sign in →"}
              </button>
              <button onClick={() => { setPopupMode('signup'); setPopupErr(''); }} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "8px" }}>Back to sign up</button>
            </>)}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" as const, marginTop: 12 }}>
              Already a member?{" "}
              <button onClick={() => { setPopupMode('signin'); setPopupErr(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Sign in</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
