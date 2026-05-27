"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API = "https://hoteldrops-production-9107.up.railway.app/api/hotels";
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
  if (m >= 1000) return (m / 1000).toFixed(1) + " km";
  return m + " m";
}

interface Room {
  roomCode: string; name: string; type: string; characteristic: string;
  maxAdults: number; size: number | null; bedrooms: number | null;
  hasBalcony: boolean; bedType: string | null; amenities: string[];
  images: string[]; pricePerNight: number | null; totalPrice: number | null;
  boardCode: string | null; boardName: string | null;
  cancellation: { type: string; from: string | null } | null;
}

interface Hotel {
  code: number; name: string; description: string; stars: string; chain: string;
  address: string; city: string; country: string;
  coordinates: { latitude: number; longitude: number };
  checkInTime: string; checkOutTime: string; totalRooms: number; floors: number;
  images: { url: string; type: string }[]; rooms: Room[];
  facilityGroups: Record<string, string[]>;
  boards: { code: string; name: string }[];
  distances: { label: string; distance: number }[];
  interestPoints: { name: string; distance: number }[];
  lowestPriceINR: number | null; lowestTotalINR: number | null;
  nights: number; checkIn: string; checkOut: string; adults: number;
}

interface SimilarHotel {
  code: number; name: string; stars: string; city: string;
  images: { url: string }[]; lowestPriceINR: number | null;
}

const RATING_BARS = [
  { label: "Cleanliness", score: 9.4 }, { label: "Service", score: 9.2 },
  { label: "Location", score: 9.5 }, { label: "Amenities", score: 9.6 },
  { label: "Value", score: 8.7 }, { label: "Comfort", score: 9.3 },
];

const REVIEWS = [
  { title: "Absolutely incredible experience", score: "10.0", text: "The Aquaventure was a highlight for the kids and the private beach was stunning. Room service was prompt and the butler service for our suite was impeccable. Will definitely return.", author: "Priya M.", type: "Family", location: "India", date: "April 2026" },
  { title: "Best hotel in Dubai, hands down", score: "9.5", text: "We celebrated our anniversary here and the hotel went above and beyond. The room was enormous, views were spectacular, and the breakfast spread was extraordinary. Worth every rupee.", author: "Rahul & Neha S.", type: "Couple", location: "Mumbai", date: "March 2026" },
  { title: "Great for families", score: "9.0", text: "Kids loved the waterpark. Check-in was smooth, staff were incredibly helpful with everything. Dining options are excellent.", author: "Vikram T.", type: "Family", location: "Bengaluru", date: "February 2026" },
];

const FACILITY_GROUPS = [
  { title: "Pool & Beach", items: ["Private beach access", "Aquaventure Waterpark", "Outdoor pool", "Infinity pool", "Kids pool"] },
  { title: "Dining", items: ["21 restaurants & bars", "Nobu Dubai", "Bread Street Kitchen", "24-hour room service"] },
  { title: "Wellness", items: ["Spa & wellness centre", "Gym & fitness centre", "Sauna & steam room", "Yoga classes"] },
  { title: "Services", items: ["24-hour concierge", "Butler service", "Airport transfer", "Valet parking"] },
  { title: "Connectivity", items: ["Free high-speed WiFi", "Business centre", "Meeting rooms"] },
  { title: "Family", items: ["Kids club", "Babysitting service", "Kids menu", "Lost Chambers Aquarium"] },
];

const POLICIES = [
  { label: "Children", value: "All children welcome. Infants (0-2) stay free." },
  { label: "Pets", value: "Pets not allowed" },
  { label: "Smoking", value: "Non-smoking rooms available. Designated smoking areas only." },
  { label: "Property", value: "104 rooms. 18 floors. Airport: 40 min. Free WiFi." },
];

function HotelDetailContent() {
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
  const checkIn  = searchParams.get("checkIn")  || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults   = searchParams.get("adults")   || "2";
  const offerId  = searchParams.get("offerId")  || "";
  const saving   = searchParams.get("saving")   || "";
  const newPrice = searchParams.get("newPrice") || "";
  const oldPrice = searchParams.get("oldPrice") || "";

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [similarHotels, setSimilarHotels] = useState<SimilarHotel[]>([]);

  const refSearchBar = useRef<HTMLDivElement>(null);
  const refOverview  = useRef<HTMLDivElement>(null);
  const refRooms     = useRef<HTMLDivElement>(null);
  const refReviews   = useRef<HTMLDivElement>(null);
  const refFacilities = useRef<HTMLDivElement>(null);
  const refLocation  = useRef<HTMLDivElement>(null);
  const refPolicies  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(API + "/" + code + "?checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setHotel(d.hotel);
          if (d.hotel.rooms?.[0]) {
            setSelectedRoom(d.hotel.rooms[0].roomCode);
            setSelectedRoomName(d.hotel.rooms[0].name + (d.hotel.rooms[0].boardName ? " · " + d.hotel.rooms[0].boardName : ""));
          }
          fetch(API + "?checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults + "&destination=" + encodeURIComponent(d.hotel.city) + "&limit=3")
            .then(r2 => r2.json())
            .then(d2 => { if (d2.success) setSimilarHotels((d2.hotels || []).filter((h: SimilarHotel) => h.code !== d.hotel.code).slice(0, 3)); })
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
    const map: Record<string, React.RefObject<HTMLDivElement>> = {
      overview: refOverview, rooms: refRooms, reviews: refReviews,
      facilities: refFacilities, location: refLocation, policies: refPolicies,
    };
    const ref = map[tab];
    if (ref?.current) {
      const navH    = 60;
      const offerH  = offerId && saving ? 60 : 0;
      const searchH = refSearchBar.current?.offsetHeight ?? 80;
      const tabsH   = 50;
      const offset  = navH + offerH + searchH + tabsH + 8;
      const top = ref.current.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); document.body.style.overflow = "hidden"; };
  const closeLightbox = () => { setLightboxOpen(false); document.body.style.overflow = ""; };
  const navLightbox = (dir: number) => { if (!hotel) return; setLightboxIdx(prev => (prev + dir + hotel.images.length) % hotel.images.length); };

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
  const inp: React.CSSProperties = { border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: NAVY, background: "transparent", width: "100%", overflow: "hidden", textOverflow: "ellipsis" };

  const CSS = "* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; } @keyframes spin { to { transform: rotate(360deg); } } .tab-btn { flex: 1; padding: 14px 8px; text-align: center; font-size: 13.5px; font-weight: 500; color: #64748b; cursor: pointer; border: none; background: none; font-family: inherit; border-bottom: 2px solid transparent; transition: all .15s; } .tab-btn.active { color: #1447b8; font-weight: 600; border-bottom: 2px solid #1447b8; background: #eff6ff; } .tab-btn:hover:not(.active) { color: #0f172a; background: #f8fafc; } .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 24px; margin-bottom: 20px; } .fac-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; padding: 4px 0; } .rooms-table { width: 100%; border-collapse: collapse; } .rooms-table th { padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748b; text-align: left; border-bottom: 1.5px solid #e2e8f0; background: #f8fafc; } .rooms-table td { padding: 14px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; } .select-btn { border: 1.5px solid #1447b8; color: #1447b8; background: #fff; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s; } .select-btn.sel { background: #1447b8; color: #fff; } .sim-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; cursor: pointer; transition: all .2s; } .sim-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: "3px solid " + B, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading hotel...</div>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ fontSize: 40 }}>🏨</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Go back</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, lineHeight: 1.6 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {lightboxOpen && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={closeLightbox} style={{ position: "absolute", top: 20, right: 28, color: "#fff", fontSize: 32, cursor: "pointer", background: "none", border: "none" }}>x</button>
          <img src={hotel.images[lightboxIdx]?.url || fallbackImg} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }} />
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
            <button onClick={() => navLightbox(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer" }}>‹</button>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{lightboxIdx + 1} / {hotel.images.length}</span>
            <button onClick={() => navLightbox(1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer" }}>›</button>
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
            {!isMobile && user && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => window.location.href = "/dashboard"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
              </div>
            )}
            {!isMobile && !user && (
              <button onClick={() => window.location.href = "/signin"} style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Sign in</button>
            )}
            <button onClick={() => router.push("/")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {isMobile ? "Check booking" : "Check my booking"}
            </button>
          </div>
        </div>
      </nav>

      {/* OFFER BANNER — shown only when coming from price drop alert */}
      {offerId && saving && (
        <div style={{ background: "#16a34a", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, position: "sticky", top: 60, zIndex: 290 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>rebuq found you a better deal!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                You paid <span style={{ textDecoration: "line-through" }}>₹{Number(oldPrice).toLocaleString("en-IN")}</span> — new price is <strong>₹{Number(newPrice).toLocaleString("en-IN")}</strong> · Select a room below and book
              </div>
            </div>
          </div>
          <div style={{ background: "#fff", color: "#16a34a", fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, padding: "8px 20px", borderRadius: 10, flexShrink: 0 }}>
            Save ₹{Number(saving).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div ref={refSearchBar} style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 32px", position: "sticky", top: offerId && saving ? 120 : 60, zIndex: 250 }}>
        <div style={{ display: "flex", alignItems: "stretch", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div style={{ flex: 2.5, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Destination or Hotel</div>
            <div style={{ ...inp }}>{hotel.name}</div>
          </div>
          <div style={{ flex: 1.2, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-in</div>
            <div style={{ ...inp }}>{hotel.checkIn}</div>
          </div>
          <div style={{ flex: 1.2, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Check-out</div>
            <div style={{ ...inp }}>{hotel.checkOut}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 16px", borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 3 }}>Guests</div>
            <div style={{ ...inp }}>{hotel.adults} Adults</div>
          </div>
          <button onClick={() => router.push("/search?destination=" + encodeURIComponent(hotel.city) + "&checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults)}
            style={{ background: B, color: "#fff", border: "none", padding: "0 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            Search
          </button>
        </div>
      </div>

      <div style={W}>
        {/* BREADCRUMB */}
        <div style={{ padding: "12px 0", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => router.push("/search-hotels")} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Hotels</button>
          <span>›</span>
          <button onClick={() => router.push("/search?destination=" + encodeURIComponent(hotel.city) + "&checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{hotel.city}</button>
          <span>›</span>
          <strong style={{ color: "#1e293b", fontWeight: 500 }}>{hotel.name}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
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
          <div style={{ gridRow: "1/3", position: "relative", cursor: "pointer", overflow: "hidden", borderRadius: 12 }} onClick={() => openLightbox(0)}>
            <img src={hotel.images[0]?.url || fallbackImg} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>
              📸 +{hotel.images.length} Photos
            </div>
          </div>
          <div style={{ cursor: "pointer", overflow: "hidden", borderRadius: 10 }} onClick={() => openLightbox(1)}>
            <img src={hotel.images[1]?.url || fallbackImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 22px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, marginBottom: 10, width: "fit-content" }}>
              Member price · Save up to 28%
            </div>
            {hotel.lowestPriceINR ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: NAVY }}>{formatINR(hotel.lowestPriceINR)}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{formatINR(Math.round(hotel.lowestPriceINR * 1.28))}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 12 }}>per night · {hotel.nights} nights</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>Select dates to see price</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {["✓ Free cancellation available", "✓ No payment needed today"].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{item}</div>
              ))}
            </div>
            <button onClick={() => goToSection("rooms")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 7, width: "100%" }}>View best deal →</button>
            <button onClick={() => goToSection("rooms")} style={{ background: "#f8fafc", color: B, border: "1.5px solid #dbeafe", borderRadius: 8, padding: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>See all room options ↓</button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, display: "flex", overflow: "hidden", marginBottom: 20, position: "sticky", top: offerId && saving ? 180 : 140, zIndex: 200 }}>
          {[["overview", "Overview"], ["rooms", "Rooms"], ["reviews", "Reviews"], ["facilities", "Facilities"], ["location", "Location"], ["policies", "Policies"]].map(([id, label]) => (
            <button key={id} className={"tab-btn" + (activeTab === id ? " active" : "")} onClick={() => goToSection(id)}>{label}</button>
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: "16px 32px" }}>
            {RATING_BARS.map(rb => (
              <div key={rb.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1e293b", marginBottom: 5, fontWeight: 500 }}>
                  <span>{rb.label}</span><span style={{ fontWeight: 700, color: NAVY }}>{rb.score}</span>
                </div>
                <div style={{ height: 5, background: "#e2e8f0", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: B, borderRadius: 100, width: (rb.score * 10) + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROOMS */}
        <div className="card" ref={refRooms}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Select your room</div>
          <table className="rooms-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Room Type</th>
                <th style={{ width: "18%" }}>Board</th>
                <th style={{ width: "17%" }}>Cancellation</th>
                <th style={{ width: "20%", textAlign: "right" }}>Price/night</th>
                <th style={{ width: "10%", textAlign: "center" }}>Select</th>
              </tr>
            </thead>
            <tbody>
              {hotel.rooms.map(room => {
                const isSel = selectedRoom === room.roomCode;
                const isFree = !room.cancellation || room.cancellation.type === "free";
                return (
                  <tr key={room.roomCode} style={{ background: isSel ? "#f0f7ff" : "" }}>
                    <td>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 3 }}>{room.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{room.size ? room.size + " m²" : ""}{room.bedType ? " · " + room.bedType : ""}</div>
                    </td>
                    <td>
                      {room.boardName
                        ? <span style={{ background: "#f0fdf4", color: "#166634", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 100 }}>{room.boardName}</span>
                        : <span style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, padding: "3px 8px", borderRadius: 100 }}>Room only</span>}
                    </td>
                    <td>
                      <span style={{ background: isFree ? "#f0fdf4" : "#fef2f2", color: isFree ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 100 }}>
                        {isFree ? "Free cancel" : "Non-refundable"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {room.pricePerNight ? (
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(room.pricePerNight)}</div>
                      ) : <div style={{ fontSize: 13, color: "#64748b" }}>On request</div>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button className={"select-btn" + (isSel ? " sel" : "")}
                        onClick={() => { setSelectedRoom(room.roomCode); setSelectedRoomName(room.name + (room.boardName ? " · " + room.boardName : "")); }}>
                        {isSel ? "Selected" : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {selectedRoomData && displayPrice && (
            <div style={{ marginTop: 20, background: "#f0f7ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: B, fontWeight: 600, marginBottom: 2 }}>Selected: {selectedRoomName}</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>{formatINR(displayPrice)}<span style={{ fontSize: 12, color: "#64748b", fontFamily: "inherit", fontWeight: 400 }}>/night</span></div>
              </div>
              <button onClick={() => router.push("/checkout?hotel=" + encodeURIComponent(hotel.name) + "&checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults + "&room=" + encodeURIComponent(selectedRoomName) + "&price=" + displayPrice + (offerId ? "&offerId=" + offerId : ""))}
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
                  <div key={j} className="fac-item">{item}</div>
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
            <a href={"https://www.google.com/maps?q=" + hotel.coordinates?.latitude + "," + hotel.coordinates?.longitude} target="_blank" rel="noopener noreferrer" style={{ color: B, fontWeight: 500, fontSize: 13, textDecoration: "none" }}>Open in Google Maps ↗</a>
          </div>
          {hotel.coordinates?.latitude && (
            <iframe
              src={"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d" + hotel.coordinates.longitude + "!3d" + hotel.coordinates.latitude + "!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1"}
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
        </div>

        {/* POLICIES */}
        <div className="card" ref={refPolicies}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Hotel Policies</div>
          {[
            { label: "Check-in", value: "From " + (hotel.checkInTime || "15:00") + " · Early check-in on request" },
            { label: "Check-out", value: "Until " + (hotel.checkOutTime || "12:00") + " · Late check-out on request" },
            ...POLICIES,
          ].map((p, i, arr) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 1fr", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{p.label}</div>
              <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{p.value}</div>
            </div>
          ))}
        </div>

        {/* TRACK BANNER */}
        <div style={{ background: B, borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 14 }}>Upload your voucher and our AI watches the price 24/7. WhatsApp alert the moment it drops.</p>
          <button onClick={() => router.push("/")} style={{ background: "#fff", color: B, border: "none", padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Upload voucher → Track price
          </button>
        </div>

        {/* SIMILAR HOTELS */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 20 }}>People also viewed</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {(similarHotels.length > 0 ? similarHotels : [
              { code: 1, name: "Burj Al Arab", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" }], lowestPriceINR: 84000 },
              { code: 2, name: "Jumeirah Al Qasr", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" }], lowestPriceINR: 31800 },
              { code: 3, name: "Address Downtown", city: "Dubai, UAE", stars: "5", images: [{ url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" }], lowestPriceINR: 37400 },
            ] as SimilarHotel[]).map((h, i) => (
              <div key={i} className="sim-card" onClick={() => router.push("/hotel/" + h.code + "?checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults)}>
                <div style={{ height: 160, overflow: "hidden" }}>
                  <img src={h.images[0]?.url} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📍 {h.city}</div>
                  {h.lowestPriceINR && (
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(h.lowestPriceINR)}<span style={{ fontSize: 11, color: "#64748b", fontFamily: "inherit", fontWeight: 400 }}>/night</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ background: NAVY, padding: "40px 0 28px" }}>
        <div style={W}>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "#475569" }}>© 2026 rebuq. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {isMobile && displayPrice && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99 }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: NAVY }}>{formatINR(displayPrice)}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>per night</div>
          </div>
          <button onClick={() => router.push("/checkout?hotel=" + encodeURIComponent(hotel.name) + "&checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults + "&room=" + encodeURIComponent(selectedRoomName) + "&price=" + displayPrice + (offerId ? "&offerId=" + offerId : ""))}
            style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now →</button>
        </div>
      )}
    </div>
  );
}

export default function HotelDetailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, color: "#64748b" }}>Loading...</div></div>}>
      <HotelDetailContent />
    </Suspense>
  );
}
