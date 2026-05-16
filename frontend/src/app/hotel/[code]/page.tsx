"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const API = "https://hoteldrops-production.up.railway.app/api/hotels";
const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 960);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatINR(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
function distLabel(m: number) { return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${m} m`; }

interface Room {
  roomCode: string; name: string; type: string; characteristic: string;
  maxAdults: number; size: number | null; bedrooms: number | null;
  hasBalcony: boolean; bedType: string | null; amenities: string[];
  images: string[]; pricePerNight: number | null; totalPrice: number | null;
  boardCode: string | null; boardName: string | null;
  cancellation: { type: string; from: string | null } | null;
}

interface Hotel {
  code: number; name: string; description: string; stars: string;
  chain: string; address: string; city: string; country: string;
  coordinates: { latitude: number; longitude: number };
  checkInTime: string; checkOutTime: string; totalRooms: number; floors: number;
  images: { url: string; type: string }[];
  rooms: Room[]; facilityGroups: Record<string, string[]>;
  boards: { code: string; name: string }[];
  distances: { label: string; distance: number }[];
  interestPoints: { name: string; distance: number }[];
  lowestPriceINR: number | null; lowestTotalINR: number | null;
  nights: number; checkIn: string; checkOut: string; adults: number;
}

const AMENITY_ICONS: Record<string, string> = {
  "Wi-fi": "📶", "Gym": "🏋️", "Outdoor freshwater pool": "🏊",
  "Restaurant": "🍽️", "Café": "☕", "Bar": "🍸",
  "Car park": "🚗", "Spa centre": "💆", "Sauna": "🧖",
  "24-hour reception": "🕐", "Concierge": "🛎️", "Room service": "🍱",
  "Laundry service": "👕", "Airport Shuttle": "✈️", "Transfer service": "🚐",
  "Lift access": "🛗", "Terrace": "🌅", "Kids' club": "🧒",
  "Massage": "💆", "Steam bath": "♨️", "Valet parking": "🚙",
  "24-hour security": "🔒", "Multilingual staff": "🌍", "Breakfast": "🍳",
};

export default function HotelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const code = params.code as string;
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImg, setMainImg] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const overviewRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)
      .then(r => r.json())
      .then(d => { if (d.success) setHotel(d.hotel); else setError(d.error); })
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));
  }, [code, checkIn, checkOut, adults]);

  const scrollToTab = (ref: React.RefObject<HTMLDivElement | null>, tab: string) => {
    setActiveTab(tab);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid #bfdbfe`, borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading hotel…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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

  const stars = hotel.stars?.includes("5") ? 5 : hotel.stars?.includes("4") ? 4 : 3;
  const allFacilities = [...(hotel.facilityGroups.general || []), ...(hotel.facilityGroups.sports || []), ...(hotel.facilityGroups.wellness || []), ...(hotel.facilityGroups.dining || [])].filter((f, i, a) => a.indexOf(f) === i);
  const shownFacilities = showAllAmenities ? allFacilities : allFacilities.slice(0, 10);
  const fallback = hotel.images[0]?.url || "";
  const selectedRoomData = hotel.rooms.find(r => r.roomCode === selectedRoom) || hotel.rooms[0];
  const displayPrice = selectedRoomData?.pricePerNight || hotel.lowestPriceINR;
  const ratingBars = [
    { label: "Cleanliness", score: 9.4 },
    { label: "Service", score: 9.2 },
    { label: "Location", score: 8.8 },
    { label: "Amenities", score: 9.0 },
    { label: "Value for Money", score: 8.7 },
    { label: "Comfort", score: 9.3 },
  ];

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" as any }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 28px; margin-bottom: 20px; }
        .room-card { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 14px; transition: box-shadow .2s; background: #fff; }
        .room-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .room-feat { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #16a34a; font-weight: 500; margin-bottom: 6px; }
        .room-feat::before { content: '✓'; font-weight: 700; }
        .photo-cell { cursor: pointer; overflow: hidden; transition: filter .2s; }
        .photo-cell:hover { filter: brightness(0.9); }
        .stab { flex: 1; padding: 14px; text-align: center; font-size: 13.5px; font-weight: 500; color: #64748b; cursor: pointer; border: none; background: none; font-family: inherit; transition: all .2s; border-bottom: 2px solid transparent; }
        .stab:hover { color: ${NAVY}; }
        .amenity-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #1e293b; }
        .amenity-icon { width: 36px; height: 36px; background: #f8fafc; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .perk { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #16a34a; font-weight: 500; margin-bottom: 8px; }
        .perk::before { content: '✓'; font-weight: 800; }
        .icon-btn { width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 17px; transition: all .2s; color: #64748b; }
        .icon-btn:hover { border-color: ${B}; color: ${B}; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: isMobile ? "0 16px" : "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/" style={{ background: B, color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, padding: "7px 16px", borderRadius: 8, textDecoration: "none" }}>rebuq</a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 4 }}>
              {[["🏨 Hotels", true], ["How it works", false], ["Results", false]].map(([l, active]) => (
                <button key={l as string} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? B : "#64748b", cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", borderBottom: active ? `2px solid ${B}` : "2px solid transparent" }}>
                  {l as string}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {!isMobile && <button style={{ fontSize: 13.5, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>🎧 Support</button>}
          <button onClick={() => router.push("/upload")} style={{ color: B, fontWeight: 600, fontSize: 13.5, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>👤 Sign in</button>
          <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check my booking</button>
        </div>
      </nav>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px 16px" : "14px 32px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
        <button onClick={() => router.push("/search-hotels")} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Hotels</button>
        <span style={{ color: "#cbd5e1" }}>›</span>
        <span style={{ color: "#64748b" }}>{hotel.city}</span>
        <span style={{ color: "#cbd5e1" }}>›</span>
        <span style={{ color: "#1e293b", fontWeight: 500 }}>{hotel.name}</span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px 40px" : "0 32px 60px" }}>

        {/* HOTEL HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
              <h1 className="sora" style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: NAVY }}>{hotel.name}</h1>
              <span style={{ color: "#f59e0b", fontSize: 18 }}>{"★".repeat(stars)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#64748b", marginTop: 8 }}>
              📍 {hotel.address}, {hotel.city}, {hotel.country}
              <button onClick={() => scrollToTab(locationRef, "location")} style={{ color: B, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5 }}>Show on map</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button className="icon-btn">⬆</button>
            <button className="icon-btn">♡</button>
          </div>
        </div>

        {/* PHOTO GRID */}
        {hotel.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: isMobile ? "180px 180px" : "220px 220px", gap: 8, borderRadius: 16, overflow: "hidden", marginBottom: 0 }}>
            {/* Main large photo */}
            <div className="photo-cell" style={{ gridColumn: "1", gridRow: "1/3" }} onClick={() => setMainImg(0)}>
              <img src={hotel.images[mainImg]?.url || fallback} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            {/* 3 smaller photos */}
            {hotel.images.slice(1, 3).map((img, i) => (
              <div key={i} className="photo-cell" onClick={() => setMainImg(i + 1)}>
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
            {/* +more overlay */}
            {hotel.images.length > 3 && (
              <div className="photo-cell" style={{ position: "relative" }} onClick={() => setMainImg(3)}>
                <img src={hotel.images[3]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="sora" style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>+{hotel.images.length - 3} Photos</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENT + SIDEBAR */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 28, marginTop: 24 }}>

          {/* LEFT */}
          <div>
            {/* STICKY TABS */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", display: "flex", overflow: "hidden", marginBottom: 20, position: "sticky", top: 62, zIndex: 100 }}>
              {[["Overview", overviewRef], ["Rooms", roomsRef], ["Amenities", amenitiesRef], ["Location", locationRef]].map(([label, ref]) => (
                <button key={label as string} className="stab"
                  onClick={() => scrollToTab(ref as React.RefObject<HTMLDivElement>, (label as string).toLowerCase())}
                  style={{ borderBottom: activeTab === (label as string).toLowerCase() ? `2px solid ${B}` : "2px solid transparent", color: activeTab === (label as string).toLowerCase() ? B : "#64748b", fontWeight: activeTab === (label as string).toLowerCase() ? 600 : 500, background: activeTab === (label as string).toLowerCase() ? "#eff6ff" : "none" }}>
                  {label as string}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            <div ref={overviewRef} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ background: B, color: "#fff", borderRadius: 12, width: 64, height: 64, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div className="sora" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>9.1</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>/10</div>
                </div>
                <div>
                  <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>Exceptional</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Based on verified guest reviews</div>
                </div>
              </div>
              <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.75, marginBottom: 24 }}>{hotel.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: "16px 32px" }}>
                {ratingBars.map(rb => (
                  <div key={rb.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1e293b", marginBottom: 5, fontWeight: 500 }}>
                      <span>{rb.label}</span><span style={{ fontWeight: 700, color: NAVY }}>{rb.score}</span>
                    </div>
                    <div style={{ height: 5, background: "#e2e8f0", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: B, borderRadius: 100, width: `${rb.score * 10}%`, transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AMENITIES */}
            <div ref={amenitiesRef} className="card">
              <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Amenities</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: "14px 20px" }}>
                {shownFacilities.map((f, i) => (
                  <div key={i} className="amenity-item">
                    <div className="amenity-icon">{AMENITY_ICONS[f] || "✓"}</div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAllAmenities(!showAllAmenities)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, color: B, fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>
                {showAllAmenities ? "Show less ↑" : `View all ${allFacilities.length} amenities →`}
              </button>
            </div>

            {/* ROOMS */}
            <div ref={roomsRef} className="card">
              <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Choose your room</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>{hotel.checkIn} → {hotel.checkOut} · {hotel.nights} nights · {hotel.adults} adults</div>

              {hotel.rooms.map((room) => {
                const isSelected = selectedRoom === room.roomCode || (!selectedRoom && hotel.rooms[0]?.roomCode === room.roomCode);
                const isFree = !room.cancellation || room.cancellation.type === "free";
                const roomImg = room.images[0] || fallback;

                return (
                  <div key={room.roomCode} className="room-card" style={{ border: `1.5px solid ${isSelected ? B : "#e2e8f0"}`, background: isSelected ? "#f0f7ff" : "#fff" }}>
                    {/* Room image */}
                    {roomImg && (
                      <img src={roomImg} alt={room.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: 14, display: "block" }} />
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{room.name}</div>
                        <div style={{ fontSize: 12.5, color: "#64748b" }}>
                          {room.size && `${room.size} m²`}
                          {room.size && room.bedType && " · "}
                          {room.bedType}
                          {room.maxAdults && ` · Up to ${room.maxAdults} adults`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        {room.pricePerNight ? (
                          <>
                            <div style={{ fontSize: 13, color: "#64748b", textDecoration: "line-through" }}>
                              {formatINR(Math.round(room.pricePerNight * 1.15))}
                            </div>
                            <div className="sora" style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>
                              {formatINR(room.pricePerNight)}<span style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: "#64748b" }}>Price on request</div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      {room.boardName && <div className="room-feat">{room.boardName}</div>}
                      <div className="room-feat">{isFree ? "Free Cancellation" : "Non-refundable"}</div>
                      {room.hasBalcony && <div className="room-feat">Balcony</div>}
                      {room.amenities.slice(0, 3).map((a, i) => <div key={i} className="room-feat">{a}</div>)}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => setSelectedRoom(room.roomCode)}
                        style={{ background: isSelected ? "#16a34a" : B, color: "#fff", border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {isSelected ? "✓ Selected" : "Select Room"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LOCATION */}
            <div ref={locationRef} className="card">
              <div className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Location</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13.5, color: "#64748b" }}>📍 {hotel.address}, {hotel.city}</span>
                <a href={`https://www.google.com/maps?q=${hotel.coordinates?.latitude},${hotel.coordinates?.longitude}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: B, fontWeight: 500, fontSize: 13, textDecoration: "none", marginLeft: "auto" }}>Open in Google Maps ↗</a>
              </div>
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610!2d${hotel.coordinates?.longitude}!3d${hotel.coordinates?.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1`}
                width="100%" height="240"
                style={{ border: "none", borderRadius: 12, display: "block", marginBottom: 14 }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {hotel.distances.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>{d.label}</span>
                    <span style={{ fontWeight: 700, color: NAVY }}>{distLabel(d.distance)}</span>
                  </div>
                ))}
              </div>
              {hotel.interestPoints.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Nearby attractions</div>
                  {hotel.interestPoints.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f5", fontSize: 13, color: "#64748b" }}>
                      <span>📌 {p.name}</span>
                      <span style={{ fontWeight: 600, color: NAVY }}>{distLabel(p.distance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Already booked upsell */}
            <div style={{ background: B, borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
              <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 14 }}>Upload your voucher and our AI watches the price 24/7. WhatsApp alert the moment it drops. Free to track.</p>
              <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Upload voucher → Track price
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ position: isMobile ? "static" : "sticky", top: 72, alignSelf: "flex-start" as const }}>
            <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              {/* Offer badge */}
              {hotel.lowestPriceINR && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 14 }}>
                  <span style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", display: "inline-block" }} />
                  Member price · Save up to 28%
                </div>
              )}

              {/* Price */}
              {displayPrice ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <div className="sora" style={{ fontSize: 34, fontWeight: 800, color: NAVY }}>{formatINR(displayPrice)}</div>
                    <div style={{ fontSize: 15, color: "#64748b", textDecoration: "line-through" }}>{formatINR(Math.round(displayPrice * 1.15))}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 18 }}>
                    + taxes · per night · {hotel.nights} nights · {formatINR(displayPrice * hotel.nights)} total
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 18 }}>Select dates to see price</div>
              )}

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[["📅 Check-in", hotel.checkIn], ["📅 Check-out", hotel.checkOut]].map(([label, val]) => (
                  <div key={label} style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Guests */}
              <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, cursor: "pointer" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>👤 Guests</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{hotel.adults} Adults · 1 Room</div>
              </div>

              {/* Selected room */}
              {selectedRoomData && (
                <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: B, fontWeight: 700, marginBottom: 2 }}>Selected room</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{selectedRoomData.name}</div>
                </div>
              )}

              <button style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 15, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
                Book Now
              </button>
              <div style={{ textAlign: "center" as const, fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>No payment needed today</div>

              <div>
                <div className="perk">Free cancellation available</div>
                <div className="perk">Reserve now, pay at hotel</div>
                <div className="perk">Best price guarantee</div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: B, marginBottom: 6 }}>💡 Already booked this hotel?</div>
                <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.6, marginBottom: 10 }}>Upload your voucher and we watch the price 24/7. WhatsApp alert when it drops.</div>
                <button onClick={() => router.push("/upload")} style={{ width: "100%", background: "#eff6ff", color: B, border: "1px solid #bfdbfe", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Track price drops →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BAR */}
      {isMobile && displayPrice && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div>
            <div className="sora" style={{ fontSize: 22, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{formatINR(displayPrice)}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>per night · {hotel.nights} nights</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/upload")} style={{ background: "#f4f6f9", color: B, border: `1px solid #bfdbfe`, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔔 Track</button>
            <button style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now →</button>
          </div>
        </div>
      )}
    </div>
  );
}
