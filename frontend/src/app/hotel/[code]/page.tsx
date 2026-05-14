"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const API = "https://hoteldrops-production.up.railway.app/api/hotels";
const SIMILAR_HOTELS = [
  { name: "Atlantis The Palm", city: "Dubai", price: "₹28,400", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80" },
  { name: "Jumeirah Al Naseem", city: "Dubai", price: "₹18,500", img: "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=300&q=80" },
  { name: "W Dubai – The Palm", city: "Dubai", price: "₹22,100", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&q=80" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
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
  boardCode: string | null; boardName: string | null; rateKey: string | null;
  cancellation: { type: string; from: string | null; penalty: number | null } | null;
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
  const [activeTab, setActiveTab] = useState("overview");
  const roomsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [showAllFac, setShowAllFac] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)
      .then(r => r.json())
      .then(d => { if (d.success) { setHotel(d.hotel); setSelectedRoom(d.hotel.rooms[0]?.roomCode || null); } else setError(d.error); })
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));
  }, [code, checkIn, checkOut, adults]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: "3px solid #1447b8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading hotel…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 40 }}>🏨</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Go back</button>
    </div>
  );

  const stars = hotel.stars?.includes("5") ? 5 : hotel.stars?.includes("4") ? 4 : hotel.stars?.includes("3") ? 3 : 0;
  const allFacilities = [...(hotel.facilityGroups.general || []), ...(hotel.facilityGroups.sports || []), ...(hotel.facilityGroups.wellness || []), ...(hotel.facilityGroups.dining || [])].filter((f, i, a) => a.indexOf(f) === i);
  const selectedRoomData = hotel.rooms.find(r => r.roomCode === selectedRoom);
  const B = "#1447b8";
  const px = isMobile ? 16 : 24;

  const HIGHLIGHTS = [
    { icon: "🛎️", title: "Premium Service", desc: "Luxury aparthotel with exceptional concierge and 24/7 services." },
    { icon: "🌆", title: "Downtown Dubai", desc: "Steps from Dubai Mall and panoramic views of the Dubai Fountains." },
    { icon: "🧖", title: "World-class Spa", desc: "Seven high-tech treatment rooms, sauna, and steam facilities." },
  ];

  const facilityGroups = [
    { title: "🏠 General", items: (hotel.facilityGroups.general || []).slice(0, 8) },
    { title: "🏃 Sports & Recreation", items: (hotel.facilityGroups.sports || []).slice(0, 8) },
    { title: "💆 Wellness", items: (hotel.facilityGroups.wellness || []).slice(0, 8) },
    { title: "🍽️ Dining", items: (hotel.facilityGroups.dining || []).slice(0, 8) },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f5f6fa", color: "#1a1a2e", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: `0 ${px}px`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
          <button onClick={() => router.back()} style={{ fontSize: 13, color: "#6b7280", background: "#f5f6fa", border: "1px solid #e5e7eb", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>← Back to results</button>
        </div>
      </nav>

      {/* Search bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: `10px ${px}px` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", border: "1.5px solid #e5e7eb", borderRadius: 12, display: isMobile ? "none" : "flex", overflow: "hidden", background: "#fff" }}>
          {[
            { label: "Hotel", value: hotel.name },
            { label: "Check-in", value: hotel.checkIn },
            { label: "Check-out", value: hotel.checkOut },
            { label: "Guests", value: `${hotel.adults} Adults · 1 Room` },
          ].map((f, i) => (
            <div key={i} style={{ flex: i === 0 ? 2 : 1, padding: "10px 16px", borderRight: i < 3 ? "1px solid #e5e7eb" : "none", cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.value}</div>
            </div>
          ))}
          <button style={{ background: B, color: "#fff", border: "none", padding: "0 28px", cursor: "pointer", fontSize: 15, fontWeight: 700, minWidth: 120 }}>Search ›</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 56, zIndex: 90 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: `0 ${px}px`, display: "flex", overflowX: "auto" }}>
          {["Overview", "Rooms", "Location", "Facilities", "Policies"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
              style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: activeTab === tab.toLowerCase() ? B : "#6b7280", background: "none", border: "none", borderBottom: activeTab === tab.toLowerCase() ? `2px solid ${B}` : "2px solid transparent", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Page */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `20px ${px}px`, display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "flex-start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Hotel header + photos */}
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "20px 22px 0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: "#1a1a2e" }}>{hotel.name}</h1>
                  <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                    {Array.from({ length: stars }).map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  <button style={{ color: B, fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer" }}>🤍 Save</button>
                  <button style={{ color: B, fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer" }}>⬆ Share</button>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: B, marginBottom: 14, cursor: "pointer" }}>📍 {hotel.address}, {hotel.city} · <span style={{ fontWeight: 400 }}>View on map</span></div>
            </div>

            {/* Photo grid */}
            {hotel.images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: isMobile ? "180px 150px" : "230px 185px", gap: 3 }}>
                <div style={{ gridRow: "1/3", overflow: "hidden" }}>
                  <img src={hotel.images[0]?.url} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", cursor: "pointer" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.04)")} onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
                <div style={{ overflow: "hidden", cursor: "pointer" }}>
                  <img src={hotel.images[1]?.url || hotel.images[0]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")} onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
                <div style={{ overflow: "hidden", position: "relative", cursor: "pointer" }}>
                  <img src={hotel.images[2]?.url || hotel.images[0]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")} onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                  {hotel.images.length > 3 && (
                    <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.65)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      🖼 +{hotel.images.length - 3} photos
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", gap: isMobile ? 10 : 16, flexDirection: isMobile ? "column" : "row" }}>
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", gap: 12, alignItems: "flex-start", padding: "14px", background: "#f5f6fa", borderRadius: 10 }}>
                <span style={{ fontSize: 26 }}>{h.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{h.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>About</div>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
              {showAllDesc ? hotel.description : hotel.description.slice(0, 250) + (hotel.description.length > 250 ? "..." : "")}
            </p>
            {hotel.description.length > 250 && (
              <button onClick={() => setShowAllDesc(!showAllDesc)} style={{ color: B, fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer", marginTop: 8, padding: 0 }}>
                {showAllDesc ? "Show less ↑" : "View more ›"}
              </button>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
              {[
                { icon: "🕐", label: "Check-in", value: `From ${hotel.checkInTime}` },
                { icon: "🚪", label: "Check-out", value: `Until ${hotel.checkOutTime}` },
                hotel.totalRooms && { icon: "🏢", label: "Total rooms", value: hotel.totalRooms },
                hotel.floors && { icon: "🏗️", label: "Floors", value: hotel.floors },
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} style={{ background: "#f5f6fa", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular facilities */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Popular Facilities</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 3 : 6}, 1fr)`, gap: 12, marginBottom: 14 }}>
              {[
                { icon: "🏊", label: "Pool" }, { icon: "💆", label: "Spa" }, { icon: "📶", label: "Free WiFi" },
                { icon: "🍳", label: "Breakfast" }, { icon: "🏋️", label: "Gym" }, { icon: "🚗", label: "Parking" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{f.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textAlign: "center" }}>{f.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAllFac(!showAllFac)} style={{ color: B, fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showAllFac ? "Show less ↑" : `View ${allFacilities.length}+ More ▾`}
            </button>
          </div>

          {/* Room selection — IXIGO table style */}
          <div ref={roomsRef} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>Select your room</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{hotel.checkIn} → {hotel.checkOut} · {hotel.nights} nights · {hotel.adults} adults</div>
            </div>

            {!isMobile && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px", padding: "10px 22px", background: "#f5f6fa", fontSize: 13, fontWeight: 700, color: "#6b7280", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                <span>{hotel.rooms.length} Room Types</span>
                <span>Options</span>
                <span>Price</span>
              </div>
            )}

            {hotel.rooms.map((room, idx) => {
              const isSelected = selectedRoom === room.roomCode;
              const roomImg = room.images[0] || hotel.images[idx % hotel.images.length]?.url || hotel.images[0]?.url;
              const isFree = !room.cancellation || room.cancellation.type === "free";

              return (
                <div key={room.roomCode} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  {isMobile ? (
                    // Mobile — stacked
                    <div style={{ padding: "16px", background: isSelected ? "#eff6ff" : "#fff" }}>
                      {roomImg && <img src={roomImg} alt={room.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />}
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{room.name}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        {room.size && <span style={{ fontSize: 12, color: "#6b7280" }}>📐 {room.size} m²</span>}
                        {room.bedType && <span style={{ fontSize: 12, color: "#6b7280" }}>🛏 {room.bedType}</span>}
                        <span style={{ fontSize: 12, color: "#6b7280" }}>👥 {room.maxAdults} adults</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isFree ? "#16a34a" : "#dc2626", marginBottom: 10 }}>
                        {isFree ? "✓ Free cancellation" : "✗ Non-refundable"}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          {room.pricePerNight ? (
                            <><div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>{formatINR(room.pricePerNight)}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>per night · {formatINR(room.totalPrice!)} total</div></>
                          ) : <div style={{ fontSize: 13, color: "#9ca3af" }}>Price on request</div>}
                        </div>
                        <button onClick={() => setSelectedRoom(isSelected ? null : room.roomCode)}
                          style={{ background: isSelected ? B : "#fff", color: isSelected ? "#fff" : B, border: `1.5px solid ${B}`, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          {isSelected ? "✓ Selected" : "Reserve →"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Desktop — 3 column IXIGO style
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px", background: isSelected ? "#f0f7ff" : "#fff" }}>
                      {/* Room info */}
                      <div style={{ padding: "20px 22px", borderRight: "1px solid #e5e7eb" }}>
                        {roomImg && <img src={roomImg} alt={room.name} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />}
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{room.name}</div>
                        <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                          {room.size && <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>📐 {room.size} m²</span>}
                          {room.bedType && <span style={{ fontSize: 12, color: "#6b7280" }}>🛏 {room.bedType}</span>}
                          <span style={{ fontSize: 12, color: "#6b7280" }}>👥 {room.maxAdults} adults</span>
                          {room.hasBalcony && <span style={{ fontSize: 12, color: "#6b7280" }}>🏙 Balcony</span>}
                        </div>
                        {room.amenities.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 10 }}>
                            {room.amenities.slice(0, 6).map((a, i) => (
                              <div key={i} style={{ fontSize: 12, color: "#6b7280" }}>✓ {a}</div>
                            ))}
                          </div>
                        )}
                        <button style={{ color: B, fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View Details ›</button>
                      </div>

                      {/* Options */}
                      <div style={{ borderRight: "1px solid #e5e7eb" }}>
                        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e5e7eb" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{room.boardName || "Room Only"}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isFree ? "#16a34a" : "#dc2626" }}>
                              {isFree ? "✓ Free cancellation" : "✗ Non-refundable"}
                            </span>
                            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Free WiFi</span>
                            {room.boardName?.includes("BREAKFAST") && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Breakfast included</span>}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                        {room.pricePerNight ? (
                          <>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>{formatINR(room.pricePerNight)}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>per night for 1 room</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>+ taxes · {formatINR(room.totalPrice!)} total</div>
                          </>
                        ) : <div style={{ fontSize: 13, color: "#9ca3af" }}>Price on request</div>}
                        <button onClick={() => setSelectedRoom(isSelected ? null : room.roomCode)}
                          style={{ background: isSelected ? B : B, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, marginTop: 8, fontFamily: "inherit" }}>
                          {isSelected ? "✓ Reserved" : "Reserve 1 Room"}
                        </button>
                        {idx === 0 && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, marginTop: 4 }}>Only 2 rooms left</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Location */}
          <div ref={locationRef} style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Explore the Area</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>📍 {hotel.address}, {hotel.city}</span>
              <a href={`https://www.google.com/maps?q=${hotel.coordinates?.latitude},${hotel.coordinates?.longitude}`} target="_blank" rel="noopener noreferrer"
                style={{ marginLeft: "auto", background: "#fff5ec", color: B, border: `1px solid #bfdbfe`, padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                View on Google Maps
              </a>
            </div>
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610!2d${hotel.coordinates?.longitude}!3d${hotel.coordinates?.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1`}
              width="100%" height="220"
              style={{ border: "none", borderRadius: 12, display: "block", marginBottom: 14 }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            {hotel.distances.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{d.label}</span>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>{distLabel(d.distance)}</span>
              </div>
            ))}
            {hotel.interestPoints.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>📌 {p.name}</span>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>{distLabel(p.distance)}</span>
              </div>
            ))}
          </div>

          {/* All Facilities */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Hotel Facilities</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 20 }}>
              {facilityGroups.filter(g => g.items.length > 0).map((group, i) => (
                <div key={i}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#1a1a2e" }}>{group.title}</div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {group.items.map((item, j) => (
                      <li key={j} style={{ fontSize: 13, color: "#6b7280" }}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Hotel Policies</div>
            {[
              { label: "🕐 Check-in / Check-out", content: `Check-in from ${hotel.checkInTime} · Check-out until ${hotel.checkOutTime}` },
              { label: "💳 Payment", content: "American Express, Diners Club, JCB, MasterCard, Visa accepted." },
              { label: "🚭 Smoking", content: "This is a non-smoking establishment." },
              { label: "🐾 Pets", content: "Please contact the hotel directly for pet policy." },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 20, padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, minWidth: 180, flexShrink: 0 }}>{p.label}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{p.content}</div>
              </div>
            ))}
          </div>

          {/* Already booked upsell */}
          <div style={{ background: B, borderRadius: 14, padding: "24px 22px" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 16 }}>
              Upload your voucher and our AI watches the price 24/7. Get a WhatsApp alert the moment it drops.
            </p>
            <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Upload voucher → Track price
            </button>
          </div>

          {/* People also viewed */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>People also viewed</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
              {SIMILAR_HOTELS.map((h, i) => (
                <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", cursor: "pointer" }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}>
                  <div style={{ position: "relative" }}>
                    <img src={h.img} alt={h.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(30,30,30,0.75)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>Member rates</div>
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤍</div>
                  </div>
                  <div style={{ padding: "10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>from {h.price}/night</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR — only track card + map */}
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 110, alignSelf: "flex-start" }}>

            {/* Track price card */}
            <div style={{ background: "#eff6ff", borderRadius: 14, padding: 18, border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: B, marginBottom: 6 }}>💡 Already booked?</div>
              <div style={{ fontSize: 12, color: "#4a6278", lineHeight: 1.6, marginBottom: 12 }}>Upload your voucher. Our AI watches the price 24/7 and alerts you on WhatsApp when it drops.</div>
              <button onClick={() => router.push("/upload")}
                style={{ width: "100%", background: B, color: "#fff", border: "none", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
                Upload voucher → Track price
              </button>
              <button onClick={() => roomsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                style={{ width: "100%", background: "#fff", color: B, border: `1.5px solid ${B}`, padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                View all rooms ↓
              </button>
            </div>

            {/* Mini map — clicking scrolls to location section */}
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610!2d${hotel.coordinates?.longitude}!3d${hotel.coordinates?.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1`}
                width="100%" height="150" style={{ border: "none", display: "block" }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <button onClick={() => locationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                style={{ display: "block", width: "100%", textAlign: "center", padding: 12, color: B, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}>
                View on Map ›
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Mobile sticky bar */}
      {isMobile && hotel.lowestPriceINR && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{formatINR(hotel.lowestPriceINR)}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>per night · {hotel.nights} nights</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/upload")} style={{ background: "#f4f6f9", color: B, border: `1px solid #bfdbfe`, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔔 Track</button>
            <button style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reserve →</button>
          </div>
        </div>
      )}
    </div>
  );
}
