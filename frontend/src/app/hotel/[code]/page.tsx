"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const API = "https://hoteldrops-production.up.railway.app/api/hotels";

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

function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function distLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

const AMENITY_ICONS: Record<string, string> = {
  "Wi-fi": "📶", "Gym": "🏋️", "Outdoor freshwater pool": "🏊",
  "Restaurant": "🍽️", "Café": "☕", "Bar": "🍸",
  "Car park": "🚗", "Spa centre": "💆", "Sauna": "🧖",
  "24-hour reception": "🕐", "Concierge": "🛎️", "Room service": "🍽️",
  "Laundry service": "👕", "Airport Shuttle": "✈️", "Transfer service": "🚐",
  "Lift access": "🛗", "Terrace": "🌅", "Kids' club": "🧒",
  "Massage": "💆", "Steam bath": "♨️", "Valet parking": "🚙",
  "24-hour security": "🔒", "Multilingual staff": "🌍", "Newspapers": "📰",
};

interface HotelData {
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

interface Room {
  roomCode: string; name: string; type: string; characteristic: string;
  maxAdults: number; maxPax: number; size: number | null;
  bedrooms: number | null; hasBalcony: boolean; bedType: string | null;
  amenities: string[]; images: string[];
  pricePerNight: number | null; totalPrice: number | null;
  boardCode: string | null; boardName: string | null;
  rateKey: string | null;
  cancellation: { type: string; from: string | null; penalty: number | null } | null;
  paymentType: string | null;
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

  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImg, setMainImg] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const overviewRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const fetchHotel = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
      const data = await res.json();
      if (data.success) setHotel(data.hotel);
      else setError(data.error || "Failed to load hotel");
    } catch { setError("Could not connect to server"); }
    setLoading(false);
  }, [code, checkIn, checkOut, adults]);

  useEffect(() => { if (checkIn && checkOut) fetchHotel(); }, [fetchHotel]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, tab: string) => {
    setActiveTab(tab);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: "3px solid #1447b8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading hotel…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ fontSize: 40 }}>🏨</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← Go back</button>
    </div>
  );

  const starCount = hotel.stars?.includes("5") ? 5 : hotel.stars?.includes("4") ? 4 : hotel.stars?.includes("3") ? 3 : 0;
  const allFacilities = [
    ...(hotel.facilityGroups.general || []),
    ...(hotel.facilityGroups.sports || []),
    ...(hotel.facilityGroups.wellness || []),
    ...(hotel.facilityGroups.dining || []),
  ].filter((f, i, arr) => arr.indexOf(f) === i).slice(0, showAllAmenities ? 50 : 12);

  const fallbackImg = hotel.images[0]?.url || "";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f7f9fc", color: "#111827", paddingBottom: isMobile ? 80 : 0 }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: `0 ${isMobile ? "16px" : "40px"}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #eaeef2", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back
        </button>
      </nav>

      {/* Photo Grid — IXIGO style */}
      <div style={{ background: "#000", maxHeight: isMobile ? 220 : 420 }}>
        {hotel.images.length === 0 ? (
          <div style={{ height: isMobile ? 220 : 420, background: "#1447b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏨</div>
        ) : isMobile ? (
          <div style={{ position: "relative", height: 220 }}>
            <img src={hotel.images[mainImg]?.url} alt={hotel.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={() => setImgError(p => ({ ...p, [mainImg]: true }))} />
            <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
              {mainImg + 1} / {hotel.images.length}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "210px 210px", gap: 3, height: 420 }}>
            <div style={{ gridRow: "1 / 3", position: "relative", overflow: "hidden", cursor: "pointer" }} onClick={() => setMainImg(0)}>
              <img src={hotel.images[0]?.url} alt={hotel.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                onMouseOver={e => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
            </div>
            {hotel.images.slice(1, 3).map((img, i) => (
              <div key={i} style={{ position: "relative", overflow: "hidden", cursor: "pointer" }} onClick={() => setMainImg(i + 1)}>
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                  onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                {i === 1 && hotel.images.length > 3 && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>
                    +{hotel.images.length - 3} photos
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile photo strip */}
      {isMobile && hotel.images.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto", background: "#fff", borderBottom: "1px solid #f0f0f5" }}>
          {hotel.images.slice(0, 10).map((img, i) => (
            <div key={i} onClick={() => setMainImg(i)}
              style={{ width: 56, height: 42, borderRadius: 6, overflow: "hidden", flexShrink: 0, cursor: "pointer", border: mainImg === i ? "2px solid #1447b8" : "2px solid transparent" }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 0 20px" : "0 32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20, alignItems: "flex-start" }}>

          {/* LEFT */}
          <div>

            {/* Hotel header */}
            <div style={{ background: "#fff", padding: isMobile ? "16px" : "20px 24px", marginBottom: 8, borderBottom: isMobile ? "1px solid #f0f0f5" : "none", borderRadius: isMobile ? 0 : "0 0 12px 12px", border: isMobile ? "none" : "1px solid #eaeef2" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                {Array.from({ length: starCount }).map((_, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
                ))}
                {hotel.stars && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{hotel.stars}</span>}
              </div>
              <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 6, lineHeight: 1.2 }}>{hotel.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280", marginBottom: 12, flexWrap: "wrap" }}>
                <span>📍</span>
                <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {hotel.boards.map(b => (
                  <span key={b.code} style={{ fontSize: 11, background: "#f4f6f9", color: "#374151", padding: "3px 10px", borderRadius: 20 }}>{b.name}</span>
                ))}
                <span style={{ fontSize: 11, background: "#eff6ff", color: "#1447b8", padding: "3px 10px", borderRadius: 20 }}>✓ Free cancellation available</span>
              </div>
            </div>

            {/* Sticky tab nav */}
            <div style={{ background: "#fff", borderBottom: "1px solid #eaeef2", position: "sticky", top: 56, zIndex: 40, display: "flex", overflowX: "auto" }}>
              {[
                { id: "overview", label: "Overview", ref: overviewRef },
                { id: "rooms", label: "Rooms", ref: roomsRef },
                { id: "amenities", label: "Amenities", ref: amenitiesRef },
                { id: "location", label: "Location", ref: locationRef },
              ].map(tab => (
                <button key={tab.id} onClick={() => scrollToSection(tab.ref, tab.id)}
                  style={{ padding: isMobile ? "12px 14px" : "14px 20px", fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? "#1447b8" : "#6b7280", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #1447b8" : "2px solid transparent", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            <div ref={overviewRef} style={{ background: "#fff", padding: isMobile ? "16px" : "20px 24px", marginBottom: 8, borderRadius: isMobile ? 0 : 12, border: isMobile ? "none" : "1px solid #eaeef2", borderTop: isMobile ? "1px solid #f0f0f5" : undefined }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>About this property</div>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>{hotel.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                {[
                  { label: "Check-in", value: `From ${hotel.checkInTime}` },
                  { label: "Check-out", value: `Until ${hotel.checkOutTime}` },
                  hotel.totalRooms && { label: "Total rooms", value: hotel.totalRooms },
                  hotel.floors && { label: "Floors", value: hotel.floors },
                ].filter(Boolean).map((item: any, i) => (
                  <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div ref={roomsRef} style={{ background: "#fff", padding: isMobile ? "16px" : "20px 24px", marginBottom: 8, borderRadius: isMobile ? 0 : 12, border: isMobile ? "none" : "1px solid #eaeef2", borderTop: isMobile ? "1px solid #f0f0f5" : undefined }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Select a room</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>{hotel.checkIn} → {hotel.checkOut} · {hotel.nights} nights · {hotel.adults} adults</div>

              {hotel.rooms.map((room) => {
                const isSelected = selectedRoom === room.roomCode;
                const roomImg = room.images[0] || fallbackImg;
                const isFree = !room.cancellation || room.cancellation.type === "free";

                return (
                  <div key={room.roomCode}
                    style={{ border: `1.5px solid ${isSelected ? "#1447b8" : "#eaeef2"}`, borderRadius: 12, marginBottom: 10, overflow: "hidden", transition: "border-color 0.2s", background: isSelected ? "#f0f7ff" : "#fff" }}>

                    {/* IXIGO style — horizontal layout */}
                    <div style={{ display: "flex", gap: 0 }}>

                      {/* Room image */}
                      <div style={{ width: isMobile ? 100 : 160, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                        {roomImg ? (
                          <img src={roomImg} alt={room.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: isMobile ? 100 : 140 }} />
                        ) : (
                          <div style={{ width: "100%", minHeight: isMobile ? 100 : 140, background: "#f4f6f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🛏️</div>
                        )}
                      </div>

                      {/* Room details */}
                      <div style={{ flex: 1, padding: isMobile ? "12px 12px 12px" : "16px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{room.name}</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                            {room.size && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#374151", padding: "2px 7px", borderRadius: 8 }}>{room.size} m²</span>}
                            {room.bedType && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#374151", padding: "2px 7px", borderRadius: 8 }}>{room.bedType}</span>}
                            {room.hasBalcony && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#374151", padding: "2px 7px", borderRadius: 8 }}>Balcony</span>}
                          </div>
                          {room.boardName && (
                            <div style={{ fontSize: 11, color: "#1447b8", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              🍳 {room.boardName}
                            </div>
                          )}
                          <div style={{ fontSize: 11, fontWeight: 600, color: isFree ? "#16a34a" : "#dc2626" }}>
                            {isFree ? "✓ Free cancellation" : "✗ Non-refundable"}
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                          <div>
                            {room.pricePerNight ? (
                              <>
                                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{formatINR(room.pricePerNight)}</div>
                                <div style={{ fontSize: 10, color: "#9ca3af" }}>per night · {formatINR(room.totalPrice!)} total</div>
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: "#9ca3af" }}>Price on request</div>
                            )}
                          </div>
                          <button onClick={() => setSelectedRoom(isSelected ? null : room.roomCode)}
                            style={{ background: isSelected ? "#1447b8" : "#fff", color: isSelected ? "#fff" : "#1447b8", border: "1.5px solid #1447b8", padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                            {isSelected ? "✓ Selected" : "Select →"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Room amenities strip */}
                    {room.amenities.length > 0 && (
                      <div style={{ borderTop: "1px solid #f0f0f5", padding: "8px 14px", display: "flex", gap: 8, overflowX: "auto" }}>
                        {room.amenities.slice(0, 6).map((a, i) => (
                          <span key={i} style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", background: "#f9fafb", padding: "3px 8px", borderRadius: 8 }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Amenities */}
            <div ref={amenitiesRef} style={{ background: "#fff", padding: isMobile ? "16px" : "20px 24px", marginBottom: 8, borderRadius: isMobile ? 0 : 12, border: isMobile ? "none" : "1px solid #eaeef2", borderTop: isMobile ? "1px solid #f0f0f5" : undefined }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Amenities</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
                {allFacilities.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f9fafb", borderRadius: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{AMENITY_ICONS[f] || "✓"}</span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAllAmenities(!showAllAmenities)}
                style={{ marginTop: 12, fontSize: 12, color: "#1447b8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {showAllAmenities ? "Show less ↑" : `Show all amenities ↓`}
              </button>
            </div>

            {/* Location */}
            <div ref={locationRef} style={{ background: "#fff", padding: isMobile ? "16px" : "20px 24px", marginBottom: 8, borderRadius: isMobile ? 0 : 12, border: isMobile ? "none" : "1px solid #eaeef2", borderTop: isMobile ? "1px solid #f0f0f5" : undefined }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Location</div>

              {/* Map placeholder */}
              <a href={`https://www.google.com/maps?q=${hotel.coordinates?.latitude},${hotel.coordinates?.longitude}`} target="_blank" rel="noopener noreferrer">
                <div style={{ height: 160, background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 14, border: "1px solid #bfdbfe", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
                  <div style={{ fontSize: 13, color: "#1447b8", fontWeight: 600 }}>{hotel.address}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Click to view on Google Maps →</div>
                </div>
              </a>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {hotel.distances.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{distLabel(d.distance)}</span>
                  </div>
                ))}
              </div>

              {hotel.interestPoints.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 14, marginBottom: 8 }}>Nearby attractions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {hotel.interestPoints.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid #f4f6f9", color: "#6b7280" }}>
                        <span>📌 {p.name}</span>
                        <span style={{ fontWeight: 600, color: "#374151" }}>{distLabel(p.distance)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Already booked upsell */}
            <div style={{ background: "#1447b8", padding: isMobile ? "20px 16px" : "24px", borderRadius: isMobile ? 0 : 12, border: isMobile ? "none" : "none" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 16 }}>
                Upload your voucher and our AI watches the price 24/7. WhatsApp alert the moment it drops.
              </p>
              <button onClick={() => router.push("/upload")}
                style={{ background: "#fff", color: "#1447b8", border: "none", padding: "11px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Upload voucher → Track price
              </button>
            </div>

          </div>

          {/* RIGHT — Sticky booking card (desktop only) */}
          {!isMobile && (
            <div style={{ position: "sticky", top: 112 }}>
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

                {/* Price header */}
                <div style={{ padding: "20px 22px", borderBottom: "1px solid #f0f0f5" }}>
                  {hotel.lowestPriceINR ? (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 30, fontWeight: 700, color: "#111827" }}>{formatINR(hotel.lowestPriceINR)}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>/night</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatINR(hotel.lowestTotalINR!)} total · {hotel.nights} nights · incl. taxes</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: "#9ca3af" }}>Select dates to see price</div>
                  )}
                </div>

                {/* Dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f9fafb", borderBottom: "1px solid #f0f0f5" }}>
                  <div style={{ padding: "12px 16px", borderRight: "1px solid #eaeef2" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 3 }}>Check-in</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{hotel.checkIn}</div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 3 }}>Check-out</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{hotel.checkOut}</div>
                  </div>
                </div>

                <div style={{ padding: "14px 22px", borderBottom: "1px solid #f0f0f5" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 3 }}>Guests</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{hotel.adults} adults · 1 room</div>
                </div>

                {/* Selected room */}
                {selectedRoom && (
                  <div style={{ padding: "12px 22px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe" }}>
                    <div style={{ fontSize: 11, color: "#1447b8", fontWeight: 700, marginBottom: 2 }}>Selected room</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>{hotel.rooms.find(r => r.roomCode === selectedRoom)?.name}</div>
                  </div>
                )}

                <div style={{ padding: "16px 22px" }}>
                  <button style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 10 }}>
                    Book now →
                  </button>
                  <button onClick={() => router.push("/upload")}
                    style={{ width: "100%", background: "#f4f6f9", color: "#374151", border: "1px solid #eaeef2", borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
                    🔔 Track price drops
                  </button>
                  <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>🔒 Free cancellation on most rooms</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {isMobile && hotel.lowestPriceINR && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eaeef2", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{formatINR(hotel.lowestPriceINR)}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>per night · {hotel.nights} nights</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/upload")}
              style={{ background: "#f4f6f9", color: "#1447b8", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              🔔 Track
            </button>
            <button style={{ background: "#1447b8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Clash Display', sans-serif" }}>
              Book now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
