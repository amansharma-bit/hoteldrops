"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Building2, MapPin, Star, Wifi, Car, Coffee, Dumbbell, Waves, Sparkles, UtensilsCrossed, Clock, ChevronDown, ChevronUp, ArrowLeft, Bell } from "lucide-react";

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

const FACILITY_ICONS: Record<string, any> = {
  "Wi-fi": <Wifi size={14} />, "Free WiFi": <Wifi size={14} />,
  "Gym": <Dumbbell size={14} />, "Outdoor freshwater pool": <Waves size={14} />,
  "Restaurant": <UtensilsCrossed size={14} />, "Café": <Coffee size={14} />,
  "Car park": <Car size={14} />, "Spa centre": <Sparkles size={14} />,
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
  rateKey: string | null; cancellation: { type: string; from: string | null; penalty: number | null } | null;
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
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const fetchHotel = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
      const data = await res.json();
      if (data.success) { setHotel(data.hotel); }
      else setError(data.error || "Failed to load hotel");
    } catch (e) { setError("Could not connect to server"); }
    setLoading(false);
  }, [code, checkIn, checkOut, adults]);

  useEffect(() => { if (checkIn && checkOut) fetchHotel(); }, [fetchHotel]);

  const px = isMobile ? "16px" : "32px";
  const allFacilities = hotel ? [...(hotel.facilityGroups.general || []), ...(hotel.facilityGroups.sports || []), ...(hotel.facilityGroups.wellness || [])].slice(0, 12) : [];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #bfdbfe", borderTop: "3px solid #1447b8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 14, color: "#6b7280" }}>Loading hotel details…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f4f6f9", fontFamily: "'Plus Jakarta Sans', sans-serif", gap: 12 }}>
      <Building2 size={48} color="#d1d5db" />
      <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: "#1447b8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← Go back</button>
    </div>
  );

  const starCount = parseInt(hotel.stars) || 0;
  const selectedRoomData = hotel.rooms.find(r => r.roomCode === selectedRoom);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9", color: "#0a0a0f" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #eaeef2", padding: `0 ${px}`, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0a0a0f", textDecoration: "none" }}>
          rebuq<span style={{ color: "#1447b8" }}>.</span>
        </a>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "1px solid #eaeef2", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
          <ArrowLeft size={14} /> Back to results
        </button>
      </nav>

      {/* Gallery */}
      {hotel.images.length > 0 && (
        <div style={{ position: "relative", height: isMobile ? 240 : 420, overflow: "hidden", background: "#0d1b2e" }}>
          <img src={hotel.images[mainImg]?.url} alt={hotel.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />

          {/* Thumbnail strip */}
          {!isMobile && hotel.images.length > 1 && (
            <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 6 }}>
              {hotel.images.slice(0, 6).map((img, i) => (
                <div key={i} onClick={() => setMainImg(i)}
                  style={{ width: 72, height: 52, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: mainImg === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              {hotel.images.length > 6 && (
                <div style={{ width: 72, height: 52, borderRadius: 8, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                  +{hotel.images.length - 6} more
                </div>
              )}
            </div>
          )}

          {/* Hotel name overlay */}
          <div style={{ position: "absolute", bottom: isMobile ? 16 : 24, right: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: 10, padding: "8px 14px", fontSize: 11, color: "#fff" }}>
              📸 {hotel.images.length} photos
            </div>
          </div>
        </div>
      )}

      {/* Mobile thumbnail strip */}
      {isMobile && hotel.images.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", background: "#fff" }}>
          {hotel.images.slice(0, 8).map((img, i) => (
            <div key={i} onClick={() => setMainImg(i)}
              style={{ width: 64, height: 48, borderRadius: 6, overflow: "hidden", cursor: "pointer", border: mainImg === i ? "2px solid #1447b8" : "2px solid transparent", flexShrink: 0 }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "24px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20, alignItems: "flex-start" }}>

        {/* LEFT */}
        <div>

          {/* Hotel info card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 14, border: "1px solid #eaeef2" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
              {Array.from({ length: starCount }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 6 }}>{hotel.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", marginBottom: 12, flexWrap: "wrap" }}>
              <MapPin size={13} color="#1447b8" />
              <span>{hotel.address}, {hotel.city}</span>
              {hotel.chain && <><span style={{ color: "#d1d5db" }}>·</span><span>{hotel.chain}</span></>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ background: "#eff6ff", color: "#1447b8", border: "1px solid #bfdbfe", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>{hotel.stars}</span>
              {hotel.boards.slice(0, 3).map(b => (
                <span key={b.code} style={{ background: "#f4f6f9", color: "#6b7280", fontSize: 11, padding: "3px 12px", borderRadius: 20 }}>{b.name}</span>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>{hotel.description}</p>
          </div>

          {/* Amenities */}
          {allFacilities.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 14, border: "1px solid #eaeef2" }}>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Hotel amenities</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
                {allFacilities.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f0f0f5" }}>
                    <span style={{ color: "#1447b8" }}>{FACILITY_ICONS[f] || <Building2 size={14} />}</span>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 14, border: "1px solid #eaeef2" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
              {hotel.lowestPriceINR ? "Choose your room" : "Available room types"}
            </div>

            {hotel.rooms.map((room, i) => {
              const isSelected = selectedRoom === room.roomCode;
              const isExpanded = expandedRoom === room.roomCode;
              const hasPrice = room.pricePerNight !== null;
              const isFree = room.cancellation?.type === 'free' || !room.cancellation;

              return (
                <div key={room.roomCode} style={{ border: `1.5px solid ${isSelected ? "#1447b8" : "#eaeef2"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden", background: isSelected ? "#f0f7ff" : "#fff", transition: "all 0.2s" }}>

                  {/* Room header */}
                  <div style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>

                    {/* Room image */}
                    {room.images.length > 0 ? (
                      <img src={room.images[0]} alt={room.name} style={{ width: isMobile ? 70 : 90, height: isMobile ? 54 : 68, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: isMobile ? 70 : 90, height: isMobile ? 54 : 68, borderRadius: 8, background: "#f4f6f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Building2 size={24} color="#d1d5db" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{room.name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        {room.size && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#6b7280", padding: "2px 8px", borderRadius: 10 }}>{room.size} m²</span>}
                        {room.bedType && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#6b7280", padding: "2px 8px", borderRadius: 10 }}>{room.bedType}</span>}
                        {room.hasBalcony && <span style={{ fontSize: 10, background: "#f4f6f9", color: "#6b7280", padding: "2px 8px", borderRadius: 10 }}>Balcony</span>}
                        {room.boardName && <span style={{ fontSize: 10, background: "#eff6ff", color: "#1447b8", padding: "2px 8px", borderRadius: 10 }}>{room.boardName}</span>}
                        {isFree ? (
                          <span style={{ fontSize: 10, background: "#eff6ff", color: "#1447b8", fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>✓ Free cancellation</span>
                        ) : (
                          <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>Non-refundable</span>
                        )}
                      </div>
                      <button onClick={() => setExpandedRoom(isExpanded ? null : room.roomCode)}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#1447b8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? "Hide details" : "View amenities"}
                      </button>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {hasPrice ? (
                        <>
                          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#111827" }}>{formatINR(room.pricePerNight!)}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>/night</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{formatINR(room.totalPrice!)} total</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>Check dates<br/>for price</div>
                      )}
                    </div>
                  </div>

                  {/* Expanded amenities */}
                  {isExpanded && room.amenities.length > 0 && (
                    <div style={{ padding: "0 18px 14px", borderTop: "1px solid #f4f6f9" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 12 }}>
                        {room.amenities.map((a, j) => (
                          <span key={j} style={{ fontSize: 11, background: "#f9fafb", color: "#374151", padding: "3px 10px", borderRadius: 20, border: "1px solid #f0f0f5" }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select button */}
                  <div style={{ padding: "0 18px 16px" }}>
                    <button onClick={() => setSelectedRoom(isSelected ? null : room.roomCode)}
                      style={{ width: "100%", background: isSelected ? "#1447b8" : "#f4f6f9", color: isSelected ? "#fff" : "#374151", border: "none", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                      {isSelected ? "✓ Selected" : "Select this room →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Check-in info */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 14, border: "1px solid #eaeef2" }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Hotel info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                  <Clock size={10} /> Check-in
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>From {hotel.checkInTime}</div>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                  <Clock size={10} /> Check-out
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Until {hotel.checkOutTime}</div>
              </div>
              {hotel.totalRooms && (
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Total rooms</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{hotel.totalRooms}</div>
                </div>
              )}
              {hotel.floors && (
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Floors</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{hotel.floors}</div>
                </div>
              )}
            </div>

            {/* Distances */}
            {hotel.distances.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Distances</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {hotel.distances.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", padding: "6px 0", borderBottom: "1px solid #f4f6f9" }}>
                      <span>{d.label}</span>
                      <span style={{ fontWeight: 600, color: "#374151" }}>{d.distance >= 1000 ? `${(d.distance / 1000).toFixed(1)} km` : `${d.distance} m`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT — Sticky booking card */}
        {!isMobile && (
          <div style={{ position: "sticky", top: 78 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeef2", padding: 24, marginBottom: 14 }}>
              {hotel.lowestPriceINR ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 34, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{formatINR(hotel.lowestPriceINR)}</span>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>/night</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
                    {formatINR(hotel.lowestTotalINR!)} total · {hotel.nights} nights · taxes included
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Select dates to see prices</div>
              )}

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#eaeef2", border: "1px solid #eaeef2", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ background: "#fff", padding: "10px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 3 }}>Check-in</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{hotel.checkIn}</div>
                </div>
                <div style={{ background: "#fff", padding: "10px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 3 }}>Check-out</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{hotel.checkOut}</div>
                </div>
              </div>

              <div style={{ background: "#f9fafb", border: "1px solid #eaeef2", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 2 }}>Guests</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{hotel.adults} adults · 1 room</div>
                </div>
              </div>

              {selectedRoomData && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: "#1447b8", marginBottom: 2 }}>Selected: {selectedRoomData.name}</div>
                  {selectedRoomData.pricePerNight && (
                    <div style={{ color: "#374151" }}>{formatINR(selectedRoomData.pricePerNight)}/night · {formatINR(selectedRoomData.totalPrice!)} total</div>
                  )}
                </div>
              )}

              <button style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer", marginBottom: 10 }}>
                Book now →
              </button>
              <button onClick={() => router.push("/upload")} style={{ width: "100%", background: "#eff6ff", color: "#1447b8", border: "1px solid #bfdbfe", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                <Bell size={14} /> Track price drops instead
              </button>

              <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginBottom: 16 }}>
                🔒 Free cancellation on most rooms
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1447b8", marginBottom: 4 }}>💡 Already booked this hotel?</div>
                <div style={{ fontSize: 11, color: "#4a6278", lineHeight: 1.6, marginBottom: 8 }}>
                  Upload your voucher and we'll watch the price 24/7. WhatsApp alert when it drops.
                </div>
                <button onClick={() => router.push("/upload")} style={{ width: "100%", background: "#1447b8", color: "#fff", border: "none", padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  Upload voucher → Track price
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Mobile sticky CTA */}
      {isMobile && hotel.lowestPriceINR && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eaeef2", padding: "12px 16px", display: "flex", gap: 10, zIndex: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{formatINR(hotel.lowestPriceINR)}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>per night · {hotel.nights} nights</div>
          </div>
          <button style={{ background: "#1447b8", color: "#fff", border: "none", padding: "0 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: "pointer" }}>
            Book now →
          </button>
        </div>
      )}
    </div>
  );
}
