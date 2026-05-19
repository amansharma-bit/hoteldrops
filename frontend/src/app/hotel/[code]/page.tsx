"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API = "https://hoteldrops-production.up.railway.app/api/hotels";
const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 960);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function distLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

interface Room {
  roomCode: string;
  name: string;
  type: string;
  characteristic: string;
  maxAdults: number;
  size: number | null;
  bedrooms: number | null;
  hasBalcony: boolean;
  bedType: string | null;
  amenities: string[];
  images: string[];
  pricePerNight: number | null;
  totalPrice: number | null;
  boardCode: string | null;
  boardName: string | null;
  cancellation: { type: string; from: string | null } | null;
}

interface Hotel {
  code: number;
  name: string;
  description: string;
  stars: string;
  chain: string;
  address: string;
  city: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  checkInTime: string;
  checkOutTime: string;
  totalRooms: number;
  floors: number;
  images: { url: string; type: string }[];
  rooms: Room[];
  facilityGroups: Record<string, string[]>;
  boards: { code: string; name: string }[];
  distances: { label: string; distance: number }[];
  interestPoints: { name: string; distance: number }[];
  lowestPriceINR: number | null;
  lowestTotalINR: number | null;
  nights: number;
  checkIn: string;
  checkOut: string;
  adults: number;
}

interface SimilarHotel {
  code: number;
  name: string;
  stars: string;
  city: string;
  images: { url: string }[];
  lowestPriceINR: number | null;
}

const RATING_BARS = [
  { label: "Cleanliness", score: 9.4 },
  { label: "Service", score: 9.2 },
  { label: "Location", score: 9.5 },
  { label: "Amenities", score: 9.6 },
  { label: "Value", score: 8.7 },
  { label: "Comfort", score: 9.3 },
];

const REVIEWS = [
  { title: "Absolutely incredible experience", score: "10.0", text: "The Aquaventure was a highlight for the kids and the private beach was stunning. Room service was prompt and the butler service for our suite was impeccable. Will definitely return.", author: "Priya M.", type: "Family", location: "India", date: "April 2026" },
  { title: "Best hotel in Dubai, hands down", score: "9.5", text: "We celebrated our anniversary here and the hotel went above and beyond. The room was enormous, views were spectacular, and the breakfast spread was extraordinary. Worth every rupee.", author: "Rahul & Neha S.", type: "Couple", location: "Mumbai", date: "March 2026" },
  { title: "Great for families", score: "9.0", text: "Kids loved the waterpark — they didn't want to leave! Check-in was smooth, staff were incredibly helpful with everything. Dining options are excellent with so much variety.", author: "Vikram T.", type: "Family", location: "Bengaluru", date: "February 2026" },
];

const FACILITY_GROUPS = [
  { title: "🏊 Pool & Beach", items: ["Private beach access", "Aquaventure Waterpark", "Outdoor freshwater pool", "Infinity pool", "Kids pool"] },
  { title: "🍽️ Dining", items: ["21 restaurants & bars", "Nobu Dubai", "Bread Street Kitchen", "24-hour room service", "In-room dining"] },
  { title: "💆 Wellness", items: ["Spa & wellness centre", "Gym & fitness centre", "Sauna & steam room", "Yoga classes", "Massage treatments"] },
  { title: "🛎️ Services", items: ["24-hour concierge", "Butler service (suites)", "Airport transfer", "Valet parking", "Laundry service"] },
  { title: "🌐 Connectivity", items: ["Free high-speed WiFi", "Business centre", "Meeting rooms", "Multilingual staff"] },
  { title: "👨‍👩‍👧 Family", items: ["Kids club", "Babysitting service", "Kids menu", "Lost Chambers Aquarium", "Dolphin Bay"] },
];

const POLICIES = [
  { label: "🕐 Check-in", value: "From 3:00 PM · Early check-in on request (subject to availability)" },
  { label: "🕐 Check-out", value: "Until 12:00 PM · Late check-out on request" },
  { label: "👶 Children", value: "All children welcome · Infants (0–2) stay free · Children (3–12) share existing bedding free · Extra beds at additional charge" },
  { label: "🐾 Pets", value: "Pets not allowed" },
  { label: "🚬 Smoking", value: "Non-smoking rooms available · Designated smoking areas only" },
  { label: "📋 Property Info", value: "104 rooms · 18 floors · Airport: 40 min · Free WiFi · Valet parking: AED 50/day · Breakfast (if not included): AED 110" },
];

export default function HotelDetailPage() {
  const params = useParams();
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
  const isMobile = useIsMobile();
  const code = params.code as string;
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState("All");
  const [similarHotels, setSimilarHotels] = useState<SimilarHotel[]>([]);

  const refOverview = useRef<HTMLDivElement>(null);
  const refRooms = useRef<HTMLDivElement>(null);
  const refReviews = useRef<HTMLDivElement>(null);
  const refFacilities = useRef<HTMLDivElement>(null);
  const refLocation = useRef<HTMLDivElement>(null);
  const refPolicies = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    overview: refOverview,
    rooms: refRooms,
    reviews: refReviews,
    facilities: refFacilities,
    location: refLocation,
    policies: refPolicies,
  };

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setHotel(d.hotel);
          if (d.hotel.rooms?.[0]) {
            setSelectedRoom(d.hotel.rooms[0].roomCode);
            setSelectedRoomName(d.hotel.rooms[0].name + (d.hotel.rooms[0].boardName ? ` · ${d.hotel.rooms[0].boardName}` : ""));
          }
          // Fetch similar hotels
          fetch(`${API}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&destination=${encodeURIComponent(d.hotel.city)}&limit=3`)
            .then(r2 => r2.json())
            .then(d2 => { if (d2.success) setSimilarHotels(d2.hotels?.filter((h: SimilarHotel) => h.code !== d.hotel.code).slice(0, 3) || []); })
            .catch(() => {});
        } else {
          setError(d.error);
        }
      })
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));
  }, [code, checkIn, checkOut, adults]);

  const goToSection = (tab: string) => {
    setActiveTab(tab);
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      overview: refOverview, rooms: refRooms, reviews: refReviews,
      facilities: refFacilities, location: refLocation, policies: refPolicies,
    };
    const ref = refMap[tab];
    if (ref?.current) {
      const top = ref.current.getBoundingClientRect().top + window.pageYOffset - 130;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const navLightbox = (dir: number) => {
    if (!hotel) return;
    setLightboxIdx(prev => (prev + dir + hotel.images.length) % hotel.images.length);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navLightbox(-1);
      if (e.key === "ArrowRight") navLightbox(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotel]);

  const stars = hotel?.stars?.includes("5") ? 5 : hotel?.stars?.includes("4") ? 4 : 3;
  const bestRoom = hotel?.rooms?.[0];
  const selectedRoomData = hotel?.rooms?.find(r => r.roomCode === selectedRoom) || bestRoom;
  const displayPrice = selectedRoomData?.pricePerNight || hotel?.lowestPriceINR;
  const fallbackImg = hotel?.images?.[0]?.url || "";

  const W: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "0 32px" };

  const inp: React.CSSProperties = { border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: NAVY, background: "transparent", width: "100%", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading hotel…</div>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ fontSize: 40 }}>🏨</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Go back</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn { flex: 1; padding: 14px 8px; text-align: center; font-size: 13.5px; font-weight: 500; color: #64748b; cursor: pointer; border: none; background: none; font-family: inherit; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: ${B}; font-weight: 600; border-bottom: 2px solid ${B}; background: #eff6ff; }
        .tab-btn:hover:not(.active) { color: ${NAVY}; background: #f8fafc; }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 28px; margin-bottom: 20px; }
        .rooms-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .rooms-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; border-bottom: 1.5px solid #e2e8f0; background: #f8fafc; }
        .rooms-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .rooms-table tbody tr:hover td { background: #fafbff; }
        .rooms-table tbody tr:last-child td { border-bottom: none; }
        .select-btn { background: ${B}; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .select-btn.sel { background: #16a34a; }
        .review-filter { border: 1.5px solid #e2e8f0; border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #1e293b; font-family: inherit; }
        .review-filter.active { background: ${B}; color: #fff; border-color: ${B}; }
        .sim-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .sim-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .ph-main-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
        .ph-main-wrap:hover .ph-main-img { transform: scale(1.03); }
        .ph-sm-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
        .ph-sm-wrap:hover .ph-sm-img { transform: scale(1.03); }
        .fac-item::before { content: "✓"; color: ${B}; font-weight: 700; margin-right: 7px; }
      `}</style>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={closeLightbox} style={{ position: "absolute", top: 20, right: 28, color: "#fff", fontSize: 32, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}>✕</button>
          <img src={hotel.images[lightboxIdx]?.url || fallbackImg} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }} />
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
            <button onClick={() => navLightbox(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer", fontFamily: "inherit" }}>‹</button>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{lightboxIdx + 1} / {hotel.images.length}</span>
            <button onClick={() => navLightbox(1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer", fontFamily: "inherit" }}>›</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 60, position: "sticky", top: 0, zIndex: 300 }}>
        <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
          {!isMobile && (
            <ul style={{ display: "flex", gap: 28, listStyle: "none" }}>
              <li><a href="/#how" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>How it works</a></li>
              <li><a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a></li>
            </ul>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {!isMobile && {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href="/dashboard"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <button onClick={() => window.location.href="/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Sign in</button>
            )}}
            <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {isMobile ? "Check booking" : "Check my booking"}
            </button>
          </div>
        </div>
      </nav>

      {/* SEARCH BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 32px" }}>
        <div style={{ display: "flex", alignItems: "stretch", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            <div style={{ flex: 2.5, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Destination or Hotel</div>
              <div style={{ ...inp }}>{hotel.name}</div>
            </div>
            <div style={{ flex: 1.2, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
              <div style={{ ...inp }}>{hotel.checkIn}</div>
            </div>
            <div style={{ flex: 1.2, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
              <div style={{ ...inp }}>{hotel.checkOut}</div>
            </div>
            <div style={{ flex: 1, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Guests</div>
              <div style={{ ...inp }}>{hotel.adults} Adults · 1 Room</div>
            </div>
            <button onClick={() => router.push(`/search?destination=${encodeURIComponent(hotel.city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)}
              style={{ background: B, color: "#fff", border: "none", padding: "0 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
              🔍 Search
            </button>
        </div>
      </div>

      <div style={W}>
        {/* BREADCRUMB */}
        <div style={{ padding: "12px 0", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => router.push("/search-hotels")} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Hotels</button>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <button onClick={() => router.push(`/search?destination=${encodeURIComponent(hotel.city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{hotel.city}</button>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <strong style={{ color: "#1e293b", fontWeight: 500 }}>{hotel.name}</strong>
        </div>

        {/* HOTEL HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 800, color: NAVY }}>{hotel.name}</h1>
              <span style={{ color: "#f59e0b", fontSize: 18 }}>{"★".repeat(stars)}</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
              📍 {hotel.address}, {hotel.city}, {hotel.country}
              <button onClick={() => goToSection("location")} style={{ color: B, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, marginLeft: 8 }}>Show on map</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 16 }}>⬆</button>
            <button style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 16 }}>♡</button>
          </div>
        </div>

        {/* PHOTO GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gridTemplateRows: "220px 220px", gap: 8, marginBottom: 24, borderRadius: 14, overflow: "hidden" }}>
          {/* Main photo */}
          <div className="ph-main-wrap" style={{ gridRow: "1/3", position: "relative", cursor: "pointer", overflow: "hidden" }} onClick={() => openLightbox(0)}>
            <img className="ph-main-img" src={hotel.images[0]?.url || fallbackImg} alt={hotel.name} />
            <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>
              📸 +{hotel.images.length} Photos
            </div>
          </div>
          {/* Top right photo */}
          <div className="ph-sm-wrap" style={{ position: "relative", cursor: "pointer", overflow: "hidden" }} onClick={() => openLightbox(1)}>
            <img className="ph-sm-img" src={hotel.images[1]?.url || fallbackImg} alt="" />
          </div>
          {/* Bottom right: price card */}
          <div style={{ background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 22px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, marginBottom: 10, width: "fit-content" }}>
              <span style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%" }} />
              Member price · Save up to 28%
            </div>
            {hotel.lowestPriceINR ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: NAVY }}>{formatINR(hotel.lowestPriceINR)}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(Math.round(hotel.lowestPriceINR * 1.28))}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 12 }}>per night · {hotel.nights} nights · <strong style={{ color: NAVY }}>{formatINR(hotel.lowestPriceINR * hotel.nights)} total</strong></div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>Select dates to see price</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {[hotel.rooms[0]?.boardName ? `✓ ${hotel.rooms[0].boardName}` : "✓ Room options available",
                "✓ Free cancellation available",
                "✓ No payment needed today"].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{item}</div>
              ))}
            </div>
            <button onClick={() => goToSection("rooms")}
              style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 7, width: "100%" }}>
              View best deal →
            </button>
            <button onClick={() => goToSection("rooms")}
              style={{ background: "#f8fafc", color: B, border: "1.5px solid #dbeafe", borderRadius: 8, padding: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
              See all room options ↓
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, display: "flex", overflow: "hidden", marginBottom: 20, position: "sticky", top: 60, zIndex: 200 }}>
          {[["overview", "Overview"], ["rooms", "Rooms"], ["reviews", "Reviews"], ["facilities", "Facilities"], ["location", "Location"], ["policies", "Policies"]].map(([id, label]) => (
            <button key={id} className={`tab-btn${activeTab === id ? " active" : ""}`} onClick={() => goToSection(id)}>{label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        <div className="card" ref={refOverview}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ background: B, color: "#fff", borderRadius: 12, width: 64, height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>9.1</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>/10</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY }}>Exceptional</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Based on verified guest reviews</div>
            </div>
          </div>
          <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.75, marginBottom: 24 }}>{hotel.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[["🏖️", "Private Beach", "700m of exclusive beachfront with full service"],
              ["🌊", "Aquaventure", "Award-winning waterpark included for guests"],
              ["🍽️", "21 Restaurants", "Nobu, Bread Street Kitchen & 19 more"]].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: "16px 32px" }}>
            {RATING_BARS.map(rb => (
              <div key={rb.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1e293b", marginBottom: 5, fontWeight: 500 }}>
                  <span>{rb.label}</span><span style={{ fontWeight: 700, color: NAVY }}>{rb.score}</span>
                </div>
                <div style={{ height: 5, background: "#e2e8f0", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: B, borderRadius: 100, width: `${rb.score * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROOMS */}
        <div className="card" ref={refRooms}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Select your room</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {hotel.rooms.some(r => !r.cancellation || r.cancellation.type === "free") && (
              <span style={{ background: "#f0fdf4", color: "#166534", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 100 }}>Free Cancellation</span>
            )}
            {hotel.rooms.some(r => r.boardCode === "BB") && (
              <span style={{ background: "#eff6ff", color: B, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 100 }}>Free Breakfast</span>
            )}
          </div>
          {isMobile ? (
            // Mobile: card layout
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {hotel.rooms.map(room => {
                const isSel = selectedRoom === room.roomCode;
                const isFree = !room.cancellation || room.cancellation.type === "free";
                return (
                  <div key={room.roomCode} style={{ border: `1.5px solid ${isSel ? B : "#e2e8f0"}`, borderRadius: 12, padding: 18, background: isSel ? "#f0f7ff" : "#fff" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{room.size && `${room.size} m²`}{room.bedType && ` · ${room.bedType}`} · Up to {room.maxAdults} adults</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {room.boardName && <span style={{ background: "#f0fdf4", color: "#166634", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100 }}>🍳 {room.boardName}</span>}
                      <span style={{ background: isFree ? "#f0fdf4" : "#fef2f2", color: isFree ? "#166534" : "#991b1b", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100 }}>{isFree ? "✓ Free cancel" : "✕ Non-refundable"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        {room.pricePerNight && <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(Math.round(room.pricePerNight * 1.28))}</div>}
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>{room.pricePerNight ? formatINR(room.pricePerNight) : "—"}<span style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span></div>
                        {room.totalPrice && <div style={{ fontSize: 11, color: "#64748b" }}>{formatINR(room.totalPrice)} total</div>}
                        {room.pricePerNight && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Save {formatINR(Math.round(room.pricePerNight * 0.28 * hotel.nights))}</div>}
                      </div>
                      <button className={`select-btn${isSel ? " sel" : ""}`}
                        onClick={() => { setSelectedRoom(room.roomCode); setSelectedRoomName(room.name + (room.boardName ? ` · ${room.boardName}` : "")); }}>
                        {isSel ? "✓ Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Desktop: table layout
            <table className="rooms-table">
              <thead>
                <tr>
                  <th style={{ width: "33%" }}>Room Type</th>
                  <th style={{ width: "17%" }}>Board Basis</th>
                  <th style={{ width: "16%" }}>Cancellation</th>
                  <th style={{ width: "22%", textAlign: "right" }}>Price (incl. taxes)</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {hotel.rooms.map(room => {
                  const isSel = selectedRoom === room.roomCode;
                  const isFree = !room.cancellation || room.cancellation.type === "free";
                  return (
                    <tr key={room.roomCode} style={{ background: isSel ? "#f0f7ff" : "" }}>
                      <td>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, color: NAVY, fontSize: 15, marginBottom: 4 }}>{room.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{room.size && `${room.size} m²`}{room.bedType && ` · ${room.bedType}`} · Up to {room.maxAdults} adults</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {room.hasBalcony && <span style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>Balcony</span>}
                          {room.amenities.slice(0, 2).map((a, i) => <span key={i} style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>{a}</span>)}
                        </div>
                      </td>
                      <td>
                        {room.boardName
                          ? <span style={{ background: "#f0fdf4", color: "#166634", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100 }}>🍳 {room.boardName}</span>
                          : <span style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100 }}>Room only</span>}
                      </td>
                      <td>
                        <span style={{ background: isFree ? "#f0fdf4" : "#fef2f2", color: isFree ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100 }}>
                          {isFree ? "✓ Free cancel" : "✕ Non-refundable"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {room.pricePerNight ? (
                          <>
                            <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(Math.round(room.pricePerNight * 1.28))}</div>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: NAVY }}>{formatINR(room.pricePerNight)}<span style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span></div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{room.totalPrice ? formatINR(room.totalPrice) : formatINR(room.pricePerNight * hotel.nights)} total</div>
                            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Save {formatINR(Math.round(room.pricePerNight * 0.28 * hotel.nights))}</div>
                          </>
                        ) : <div style={{ fontSize: 13, color: "#64748b" }}>Price on request</div>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button className={`select-btn${isSel ? " sel" : ""}`}
                          onClick={() => { setSelectedRoom(room.roomCode); setSelectedRoomName(room.name + (room.boardName ? ` · ${room.boardName}` : "")); }}>
                          {isSel ? "✓ Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Book now bar */}
          {selectedRoomData && displayPrice && (
            <div style={{ marginTop: 20, background: "#f0f7ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: B, fontWeight: 600, marginBottom: 2 }}>Selected: {selectedRoomName}</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>{formatINR(displayPrice)}<span style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night · {hotel.nights} nights</span></div>
              </div>
              <button onClick={() => router.push(`/checkout?hotel=${encodeURIComponent(hotel.name)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&room=${encodeURIComponent(selectedRoomName)}&price=${displayPrice}`)}
                style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Book Now →
              </button>
            </div>
          )}
        </div>

        {/* REVIEWS */}
        <div className="card" ref={refReviews}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Guest Reviews</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 48, fontWeight: 800, color: NAVY, lineHeight: 1 }}>9.1</div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY }}>Exceptional</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Based on 2,341 verified reviews</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["All Reviews (2341)", "Couples (842)", "Family (614)", "Business (287)", "Solo (598)"].map(f => (
              <button key={f} className={`review-filter${reviewFilter === f.split(" ")[0] ? " active" : ""}`} onClick={() => setReviewFilter(f.split(" ")[0])}>{f}</button>
            ))}
          </div>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ borderBottom: i < REVIEWS.length - 1 ? "1px solid #f1f5f9" : "none", padding: "20px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                {r.title}
                <span style={{ background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{r.score}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, marginBottom: 8 }}>{r.text}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.author} · {r.type} · {r.location} · {r.date}</div>
            </div>
          ))}
          <button style={{ color: B, fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>View all 2,341 reviews →</button>
        </div>

        {/* FACILITIES */}
        <div className="card" ref={refFacilities}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Hotel Facilities</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: "24px 32px" }}>
            {(hotel.facilityGroups && Object.keys(hotel.facilityGroups).length > 0
              ? Object.entries(hotel.facilityGroups).slice(0, 6).map(([key, items]) => ({ title: key, items: items as string[] }))
              : FACILITY_GROUPS
            ).map((group, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{group.title}</div>
                {group.items.slice(0, 5).map((item, j) => (
                  <div key={j} className="fac-item" style={{ fontSize: 13, color: "#64748b", padding: "4px 0", display: "flex", alignItems: "center" }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* LOCATION */}
        <div className="card" ref={refLocation}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Location</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, color: "#64748b" }}>📍 {hotel.address}, {hotel.city}</span>
            <a href={`https://www.google.com/maps?q=${hotel.coordinates?.latitude},${hotel.coordinates?.longitude}`} target="_blank" rel="noopener noreferrer"
              style={{ color: B, fontWeight: 500, fontSize: 13, textDecoration: "none" }}>Open in Google Maps ↗</a>
          </div>
          {hotel.coordinates?.latitude && (
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${hotel.coordinates.longitude}!3d${hotel.coordinates.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1`}
              width="100%" height="240"
              style={{ border: "none", borderRadius: 12, display: "block", marginBottom: 14 }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {hotel.distances.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{d.label}</span>
                <span style={{ fontWeight: 700, color: NAVY }}>{distLabel(d.distance)}</span>
              </div>
            ))}
          </div>
          {hotel.interestPoints?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Nearby attractions</div>
              {hotel.interestPoints.slice(0, 6).map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f5", fontSize: 13, color: "#64748b" }}>
                  <span>📌 {p.name}</span>
                  <span style={{ fontWeight: 600, color: NAVY }}>{distLabel(p.distance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POLICIES */}
        <div className="card" ref={refPolicies}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Hotel Policies</div>
          <div style={{ marginTop: 16 }}>
            {[
              { label: "🕐 Check-in", value: `From ${hotel.checkInTime || "15:00"} · Early check-in on request` },
              { label: "🕐 Check-out", value: `Until ${hotel.checkOutTime || "12:00"} · Late check-out on request` },
              ...POLICIES.slice(2),
            ].map((p, i, arr) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "180px 1fr", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{p.label}</div>
                <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* UPSELL */}
        <div style={{ background: B, borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 14 }}>Upload your voucher and our AI watches the price 24/7. WhatsApp alert the moment it drops. Free to track.</p>
          <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Upload voucher → Track price
          </button>
        </div>

        {/* SIMILAR HOTELS */}
        {(similarHotels.length > 0 || true) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 20 }}>People also viewed</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
              {(similarHotels.length > 0 ? similarHotels : [
                { code: 1, name: "Burj Al Arab", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" }], lowestPriceINR: 84000 },
                { code: 2, name: "Jumeirah Al Qasr", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" }], lowestPriceINR: 31800 },
                { code: 3, name: "Address Downtown", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" }], lowestPriceINR: 37400 },
              ] as SimilarHotel[]).map((h, i) => (
                <div key={i} className="sim-card" onClick={() => router.push(`/hotel/${h.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)}>
                  <div style={{ height: 160, position: "relative", overflow: "hidden" }}>
                    <img src={h.images[0]?.url} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>Member rate</span>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📍 {h.city}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      {h.lowestPriceINR && (
                        <>
                          <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(Math.round(h.lowestPriceINR * 1.28))}</span>
                          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(h.lowestPriceINR)}</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>/night</span>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Free cancel</span>
                      <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Free WiFi</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "36px 20px 24px" : "40px 0 28px" }}>
        <div style={W}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 32, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 240, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 24 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[{ title: "Product", links: ["How it works", "Member Deals", "Why rebuq", "Check my booking"] },
                { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 12 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13.5, color: "#94a3b8", textDecoration: "none", marginBottom: 9 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {[
                { href: "https://twitter.com/rebuq", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { href: "https://linkedin.com/company/rebuq", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map(({ href, path }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BAR */}
      {isMobile && displayPrice && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{formatINR(displayPrice)}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>per night · {hotel.nights} nights</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/upload")} style={{ background: "#f4f6f9", color: B, border: `1px solid #bfdbfe`, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔔 Track</button>
            <button onClick={() => router.push(`/checkout?hotel=${encodeURIComponent(hotel.name)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&room=${encodeURIComponent(selectedRoomName)}&price=${displayPrice}`)}
              style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now →</button>
          </div>
        </div>
      )}
    </div>
  );
}
