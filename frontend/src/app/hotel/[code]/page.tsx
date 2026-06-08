"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API = "https://hoteldrops-production-7e5a.up.railway.app/api/hotels";
const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 960); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return m;
}

const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtDate = (s: string) => { try { if (!s) return ''; const d = new Date(s); if (isNaN(d.getTime())) return ''; return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

const FAC_PATHS: Record<string, string> = {
  "Swimming Pool": "M3 12h18M3 8c0 0 3-4 9-4s9 4 9 4M3 16c0 0 3 4 9 4s9-4 9-4",
  "Free WiFi": "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  "Breakfast": "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z",
  "24/7 Room Service": "M3 11l19-9-9 19-2-8-8-2z",
  "Fitness Centre": "M18 7v13M6 7v13M3 10h18M3 14h18",
  "Spa & Wellness": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "Parking": "M8 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5",
  "Airport Transfer": "M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2C4.2 5 3.5 5.3 3.1 5.9L2 7l9 3.4L8.5 13H5L4 14l5 2 2 5 1-1 .5-3.5L16 18z",
  "Restaurant": "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3",
};

function FacIcon({ name, size = 20 }: { name: string; size?: number }) {
  const d = FAC_PATHS[name] || "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={d} /></svg>;
}

function HotelDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const code = params.code as string;
  const checkIn  = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults   = searchParams.get("adults") || "2";
  const offerId  = searchParams.get("offerId") || "";
  const saving   = searchParams.get("saving") || "";
  const newPrice = searchParams.get("newPrice") || "";
  const oldPrice = searchParams.get("oldPrice") || "";

  const [user, setUser]   = useState<{ name: string } | null>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [roomPhotoIdx, setRoomPhotoIdx] = useState<Record<string, number>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState<string|null>(null);
  const [similarHotels, setSimilarHotels] = useState<any[]>([]);
  const [editCheckIn, setEditCheckIn] = useState(checkIn);
  const [editCheckOut, setEditCheckOut] = useState(checkOut);
  const [editAdults, setEditAdults] = useState(adults);
  const [editRooms, setEditRooms] = useState("1");
  const [editChildren, setEditChildren] = useState("0");
  const [guestDropOpen, setGuestDropOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calMode, setCalMode] = useState<"checkin"|"checkout">("checkin");
  const [calMonthOffset, setCalMonthOffset] = useState(0);

  const refSearchBar  = useRef<HTMLDivElement>(null);
  const refOverview   = useRef<HTMLDivElement>(null);
  const refRooms      = useRef<HTMLDivElement>(null);
  const refLocation   = useRef<HTMLDivElement>(null);
  const refReviews    = useRef<HTMLDivElement>(null);
  const refFacilities = useRef<HTMLDivElement>(null);
  const refPolicies   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { const m = data.user.user_metadata; setUser({ name: m?.full_name || m?.name || data.user.email?.split("@")[0] || "Member" }); }
    });
  }, []);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(`${API}/${code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rooms=${editRooms}&children=${editChildren}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setHotel(d.hotel);
          if (d.hotel.rooms?.[0]) setSelectedOffer(d.hotel.rooms[0].offerId);
          fetch(`${API}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&destination=${encodeURIComponent(d.hotel.city)}&limit=4`)
            .then(r2 => r2.json())
            .then(d2 => { if (d2.success) setSimilarHotels((d2.hotels?.hotels || []).filter((h: any) => String(h.code) !== String(d.hotel.code)).slice(0, 3)); })
            .catch(() => {});
        } else setError(d.error);
      })
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));
  }, [code, checkIn, checkOut, adults]);

  const goTo = (tab: string) => {
    setActiveTab(tab);
    const map: Record<string, React.RefObject<HTMLDivElement>> = { overview: refOverview, rooms: refRooms, location: refLocation, reviews: refReviews, facilities: refFacilities, policies: refPolicies };
    const ref = map[tab];
    if (ref?.current) {
      const offset = 60 + (offerId && saving ? 60 : 0) + (refSearchBar.current?.offsetHeight || 80) + 52;
      window.scrollTo({ top: ref.current.getBoundingClientRect().top + window.pageYOffset - offset, behavior: "smooth" });
    }
  };

  const openLightbox = (i: number) => { setLightboxIdx(i); setLightboxOpen(true); document.body.style.overflow = "hidden"; };
  const closeLightbox = () => { setLightboxOpen(false); document.body.style.overflow = ""; };
  const navLight = (dir: number) => hotel && setLightboxIdx(p => (p + dir + hotel.images.length) % hotel.images.length);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowLeft") navLight(-1); if (e.key === "ArrowRight") navLight(1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [hotel]);

  const selectedRoom = hotel?.rooms?.find((r: any) => r.offerId === selectedOffer) || hotel?.rooms?.[0];
  const stars = Math.min(5, Math.max(1, Math.round(parseFloat(hotel?.stars || "4"))));
  const topOffset = 60 + (offerId && saving ? 60 : 0);
  const filteredReviews = (hotel?.reviews || []).filter((r: any) => reviewFilter === "all" || r.type?.toLowerCase().includes(reviewFilter));

  // Group rooms by room type name (for Ixigo-style: room image left, multiple rate options right)
  const groupedRooms: Record<string, any[]> = {};
  for (const r of (hotel?.rooms || [])) {
    const key = r.name || r.offerId;
    if (!groupedRooms[key]) groupedRooms[key] = [];
    groupedRooms[key].push(r);
  }

  const CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .sora { font-family: 'Sora', sans-serif; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .tab-btn { padding: 14px 18px; font-size: 13.5px; font-weight: 500; color: #64748b; cursor: pointer; border: none; background: none; font-family: inherit; border-bottom: 2.5px solid transparent; transition: all .15s; white-space: nowrap; }
    .tab-btn.active { color: ${B}; font-weight: 700; border-bottom-color: ${B}; }
    .tab-btn:hover:not(.active) { color: ${NAVY}; }
    .card { background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0; padding: 28px; margin-bottom: 20px; }
    .sim-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; cursor: pointer; transition: all .2s; }
    .sim-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }
    .rate-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; align-items: center; }
    .rate-row:last-child { border-bottom: none; }
    .rate-row.selected { background: #eff6ff; }
    .reserve-btn { background: ${B}; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .reserve-btn:hover { background: #1038a0; }
    .reserve-btn-yellow { background: #f97316; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; width: 100%; }
    .reserve-btn-yellow:hover { background: #ea6c0a; }
    .fac-icon-box { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; min-width: 80px; text-align: center; }
    .review-filter-btn { padding: 6px 14px; border-radius: 100px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .review-filter-btn.active { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
    .sentiment-bar { height: 5px; background: #e2e8f0; border-radius: 100px; flex: 1; overflow: hidden; }
    .sentiment-fill { height: 100%; border-radius: 100px; background: ${B}; }
    .check-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #374151; }
  `;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #bfdbfe", borderTop: `3px solid ${B}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading hotel...</div>
      </div>
    </div>
  );

  if (error || !hotel) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Could not load hotel</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: B, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Go back</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={closeLightbox} style={{ position: "absolute", top: 20, right: 28, color: "#fff", fontSize: 28, cursor: "pointer", background: "none", border: "none" }}>✕</button>
          <img src={hotel.images[lightboxIdx]?.url} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "88vw", maxHeight: "78vh", objectFit: "contain", borderRadius: 8 }} />
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
            <button onClick={() => navLight(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer" }}>‹</button>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{lightboxIdx + 1} / {hotel.images.length}</span>
            <button onClick={() => navLight(1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 20, cursor: "pointer" }}>›</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", height: 60, position: "sticky", top: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: B, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <button onClick={() => router.push("/signin")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
            )}
          </div>
        )}
      </nav>

      {/* OFFER BANNER */}
      {offerId && saving && (
        <div style={{ background: "#16a34a", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, position: "sticky", top: 60, zIndex: 290 }}>
          <div>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>rebuq found you a better deal!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>You paid <span style={{ textDecoration: "line-through" }}>₹{Number(oldPrice).toLocaleString("en-IN")}</span> — new price <strong>₹{Number(newPrice).toLocaleString("en-IN")}</strong></div>
          </div>
          <div style={{ background: "#fff", color: "#16a34a", fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, padding: "8px 20px", borderRadius: 10 }}>Save ₹{Number(saving).toLocaleString("en-IN")}</div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div ref={refSearchBar} style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 40px", position: "sticky", top: topOffset, zIndex: 250, overflow: "visible" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.4fr auto", alignItems: "stretch", minHeight: 64, position: "relative" }}>
          <div style={{ padding: "0 22px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Hotel</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hotel.name}</div>
          </div>
          {[
            { label: "Check-in", val: editCheckIn, mode: "checkin" as const },
            { label: "Check-out", val: editCheckOut, mode: "checkout" as const },
          ].map(f => (
            <div key={f.label} style={{ padding: "0 18px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer" }}
              onClick={() => { setCalMode(f.mode); setCalOpen(true); }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: f.val ? 600 : 400, color: f.val ? NAVY : "#94a3b8" }}>
                {f.val ? new Date(f.val + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "Add date"}
              </div>
            </div>
          ))}
          <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", position: "relative" }} onClick={() => setGuestDropOpen(p => !p)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Rooms & Guests</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{editRooms} Room · {editAdults} Adult{parseInt(editAdults) > 1 ? "s" : ""}</div>
            {guestDropOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 300, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", zIndex: 9999, padding: 20 }}>
                {[{ label: "Rooms", min: 1, max: 4, val: parseInt(editRooms), set: (v: number) => setEditRooms(String(v)) }, { label: "Adults", min: 1, max: 16, val: parseInt(editAdults), set: (v: number) => setEditAdults(String(v)) }, { label: "Children", min: 0, max: 8, val: parseInt(editChildren), set: (v: number) => setEditChildren(String(v)) }].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{item.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button disabled={item.val <= item.min} onClick={e => { e.stopPropagation(); item.set(Math.max(item.min, item.val - 1)); }} style={{ width: 30, height: 30, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 16, cursor: "pointer", opacity: item.val <= item.min ? 0.3 : 1, fontFamily: "inherit" }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: "center" as const }}>{item.val}</span>
                      <button disabled={item.val >= item.max} onClick={e => { e.stopPropagation(); item.set(Math.min(item.max, item.val + 1)); }} style={{ width: 30, height: 30, borderRadius: 6, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 16, cursor: "pointer", opacity: item.val >= item.max ? 0.3 : 1, fontFamily: "inherit" }}>+</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setGuestDropOpen(false)} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Done</button>
              </div>
            )}
          </div>
          <button onClick={() => router.push(`/search?destination=${encodeURIComponent(hotel.city)}&checkIn=${editCheckIn}&checkOut=${editCheckOut}&adults=${editAdults}&rooms=${editRooms}`)}
            style={{ background: "#fff", color: NAVY, border: "none", borderLeft: "1px solid #e2e8f0", padding: "0 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Sora',sans-serif", borderRadius: "0 12px 12px 0" }}>
            Search
          </button>
        </div>
        {calOpen && <div onClick={() => setCalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />}
        {calOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "40px", width: 600, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.16)", zIndex: 9999, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => setCalMonthOffset(p => Math.max(0, p - 1))} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b" }}>‹</button>
              <span className="sora" style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{calMode === "checkin" ? "Select check-in" : "Select check-out"}</span>
              <button onClick={() => setCalMonthOffset(p => p + 1)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {[0, 1].map(off => {
                const d = new Date(new Date().getFullYear(), new Date().getMonth() + calMonthOffset + off);
                const y = d.getFullYear(); const mo = d.getMonth();
                const days = new Date(y, mo + 1, 0).getDate();
                const firstDow = new Date(y, mo, 1).getDay();
                const today = new Date().toISOString().split("T")[0];
                const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                return (
                  <div key={off}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: NAVY, textAlign: "center", marginBottom: 10 }}>{MONTHS[mo]} {y}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", paddingBottom: 6 }}>{d}</div>)}
                      {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const ds = `${y}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                        const disabled = ds < today;
                        const isStart = ds === editCheckIn; const isEnd = ds === editCheckOut;
                        const inRange = !!(editCheckIn && editCheckOut && ds > editCheckIn && ds < editCheckOut);
                        return (
                          <div key={day} onClick={() => { if (disabled) return; if (calMode === "checkin") { setEditCheckIn(ds); setEditCheckOut(""); setCalMode("checkout"); } else { if (ds <= editCheckIn) return; setEditCheckOut(ds); setCalOpen(false); } }}
                            style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: (isStart||isEnd) ? B : inRange ? "#dbeafe" : "transparent", color: (isStart||isEnd) ? "#fff" : inRange ? B : disabled ? "#cbd5e1" : NAVY, borderRadius: (isStart||isEnd) ? "50%" : inRange ? "0" : "50%", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1 }}>{day}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PAGE BODY */}
      <div style={{ padding: isMobile ? "0 16px" : "0 40px" }}>

        {/* BREADCRUMB */}
        <div style={{ padding: "12px 0", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => router.push("/search-hotels")} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Hotels</button>
          <span>›</span>
          <button onClick={() => router.push(`/search?destination=${encodeURIComponent(hotel.city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{hotel.city}</button>
          <span>›</span>
          <strong style={{ color: NAVY, fontWeight: 500 }}>{hotel.name}</strong>
        </div>

        {/* TABS */}
        <div style={{ background: "#fff", borderBottom: "2px solid #e2e8f0", display: "flex", overflow: "auto", marginBottom: 20, position: "sticky", top: topOffset + (refSearchBar.current?.offsetHeight || 80), zIndex: 200, borderRadius: 0 }}>
          {[["overview","Overview"],["rooms","Rooms"],["location","Location"],["reviews","Reviews"],["facilities","Facilities"],["policies","Policies"]].map(([id, label]) => (
            <button key={id} className={"tab-btn" + (activeTab === id ? " active" : "")} onClick={() => goTo(id)}>{label}</button>
          ))}
        </div>

        {/* HOTEL NAME */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 6 }}>
            <h1 className="sora" style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: NAVY }}>{hotel.name}</h1>
            <span style={{ color: "#f59e0b", fontSize: 16 }}>{"★".repeat(stars)}</span>
            {hotel.rating && <span style={{ background: B, color: "#fff", fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 8 }}>{parseFloat(hotel.rating).toFixed(1)}</span>}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {hotel.address}, {hotel.city}, {hotel.country}
            <button onClick={() => goTo("location")} style={{ color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>View on map</button>
          </div>
        </div>

        {/* PHOTO GRID + RIGHT SIDEBAR */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20, marginBottom: 24, alignItems: "start" }}>
          {/* Photos */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gridTemplateRows: "230px 230px", gap: 6, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ gridRow: "1/3", overflow: "hidden", cursor: "pointer", position: "relative" }} onClick={() => openLightbox(0)}>
              <img src={hotel.images[0]?.url} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                See all {hotel.images.length} photos
              </div>
            </div>
            {[1, 2].map(i => (
              <div key={i} style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => openLightbox(i)}>
                <img src={hotel.images[i]?.url || hotel.images[0]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>

          {/* RIGHT SIDEBAR — deal box + rating */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Deal box */}
            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", color: B, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, marginBottom: 14 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Recommended Deal
              </div>
              {hotel.cheapestRoom && (
                <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <img src={hotel.cheapestRoom.photos?.[0] || hotel.images?.[0]?.url} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.35 }}>{hotel.cheapestRoom.name}</div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {hotel.cheapestRoom?.isRefundable && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Free Cancellation
                    {hotel.cheapestRoom?.freeCancelUntil && fmtDate(hotel.cheapestRoom.freeCancelUntil) && <span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>until {fmtDate(hotel.cheapestRoom.freeCancelUntil)}</span>}
                  </div>
                )}
                {hotel.cheapestRoom?.hasBreakfast && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
                    Breakfast Included
                  </div>
                )}
              </div>
              {hotel.lowestPriceINR ? (
                <>
                  <div className="sora" style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginBottom: 2 }}>{fmtINR(hotel.lowestPriceINR)}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>per night · taxes included</div>
                </>
              ) : <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Select dates for price</div>}
              <button onClick={() => goTo("rooms")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>Reserve a Room →</button>
              <button onClick={() => goTo("rooms")} style={{ width: "100%", background: "#fff", color: B, border: `1.5px solid ${B}`, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View All Rooms ↓</button>
              {hotel.rating && (
                <div style={{ borderTop: "1.5px solid #f1f5f9", marginTop: 14, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: NAVY, color: "#fff", borderRadius: 8, padding: "4px 8px", fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 800 }}>{parseFloat(hotel.rating).toFixed(1)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{parseFloat(hotel.rating) >= 9 ? "Exceptional" : parseFloat(hotel.rating) >= 8 ? "Excellent" : "Very Good"}</div>
                      {hotel.reviewCount && <div style={{ fontSize: 11, color: "#94a3b8" }}>{Number(hotel.reviewCount).toLocaleString()} Ratings</div>}
                    </div>
                  </div>
                  <button onClick={() => goTo("reviews")} style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>See reviews →</button>
                </div>
              )}
            </div>


          </div>
        </div>



        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        <div className="card" ref={refOverview}>
          <h2 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 14 }}>About</h2>
          <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.8, marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: (hotel.description || "").replace(/<[^>]+>/g, "").slice(0, 500) + ((hotel.description?.length || 0) > 500 ? "..." : "") }} />
          {hotel.popularFacilities?.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Popular Facilities</h3>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
                {hotel.popularFacilities.map((f: string) => (
                  <div key={f} className="fac-icon-box">
                    <FacIcon name={f} size={20} />
                    <span style={{ fontSize: 11, color: "#374151", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── ROOMS ───────────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", marginBottom: 20 }} ref={refRooms}>
          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <h2 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>Select your room</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {[["Free Cancellation","free"],["Breakfast Included","breakfast"]].map(([label,val]) => (
                <button key={val} onClick={() => setRoomFilter((p: any) => p === val ? null : val)}
                  style={{ padding: "5px 14px", borderRadius: 100, border: `1.5px solid ${roomFilter === val ? B : "#e2e8f0"}`, fontSize: 12, fontWeight: 600, color: roomFilter === val ? B : "#374151", cursor: "pointer", background: roomFilter === val ? "#eff6ff" : "#fff", fontFamily: "inherit" }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", background: "#f8fafc", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ padding: "0 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
              {Object.keys(groupedRooms).length} Room Type{Object.keys(groupedRooms).length > 1 ? "s" : ""}
            </div>
            <div style={{ padding: "0 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Options</div>
            <div style={{ padding: "0 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", textAlign: "right" as const }}>Price</div>
          </div>

          {/* Room groups */}
          {Object.entries(groupedRooms).filter(([, rates]) =>
            !roomFilter || (rates as any[]).some((r: any) => roomFilter === "free" ? r.isRefundable : r.hasBreakfast)
          ).map(([roomName, rates], groupIdx, allGroups) => {
            const ratesArr = rates as any[];
            const firstRate = ratesArr[0];
            const pIdx = roomPhotoIdx[roomName] || 0;
            const photos = firstRate.photos?.length ? firstRate.photos : [hotel.images?.[0]?.url].filter(Boolean);
            const filteredRates = roomFilter
              ? ratesArr.filter((r: any) => roomFilter === "free" ? r.isRefundable : r.hasBreakfast)
              : ratesArr;

            return (
              <div key={roomName} style={{ display: "grid", gridTemplateColumns: "300px 1fr", borderBottom: groupIdx < allGroups.length - 1 ? "2px solid #e2e8f0" : "none" }}>

                {/* LEFT: Room photo + info — spans all rate rows */}
                <div style={{ borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" as const }}>
                  {/* Photo */}
                  <div style={{ position: "relative", height: 200, overflow: "hidden", flexShrink: 0 }}>
                    <img
                      src={photos[pIdx] || hotel.images?.[0]?.url} alt={roomName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = hotel.images?.[0]?.url || ""; }}
                    />
                    {photos.length > 1 && (
                      <div
                        onClick={() => setRoomPhotoIdx((p: Record<string,number>) => ({ ...p, [roomName]: (pIdx + 1) % photos.length }))}
                        style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        {pIdx + 1}/{photos.length}
                      </div>
                    )}
                  </div>

                  {/* Room details */}
                  <div style={{ padding: "14px 16px", flex: 1 }}>
                    <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8, lineHeight: 1.3 }}>{roomName}</div>

                    {/* Size · Bed · View inline */}
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#64748b", marginBottom: 6, flexWrap: "wrap" as const }}>
                      {firstRate.sizeM2 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                          {firstRate.sizeM2} sq. mt.
                        </span>
                      )}
                      {firstRate.bedTypes?.[0] && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16M22 4v16M2 12h20"/></svg>
                          {firstRate.bedTypes[0]}
                        </span>
                      )}
                    </div>

                    {/* Sleeps */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      Sleeps {firstRate.maxOccupancy || 2}
                    </div>

                    {/* Amenities */}
                    {firstRate.amenities?.length > 0 && (
                      <>
                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, marginBottom: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
                            {firstRate.amenities.slice(0, 6).map((a: string) => (
                              <div key={a} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#374151" }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                {a}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <button onClick={() => goTo("facilities")} style={{ fontSize: 12, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>View Details</button>
                  </div>
                </div>

                {/* RIGHT: Rate rows */}
                <div style={{ display: "flex", flexDirection: "column" as const }}>
                  {filteredRates.map((room: any, rIdx: number) => {
                    const isSel = selectedOffer === room.offerId;
                    const discountPct = room.otaTotalINR && room.pricePerNight
                      ? Math.round((1 - (room.pricePerNight / (room.otaTotalINR / hotel.nights))) * 100)
                      : null;

                    // Rate label
                    const rateLabel = room.isRefundable && room.hasBreakfast
                      ? "Room With Free Cancellation, Breakfast"
                      : room.isRefundable
                      ? "Room With Free Cancellation"
                      : room.hasBreakfast
                      ? "Room Only, Breakfast"
                      : "Room Only";

                    return (
                      <div key={room.offerId}
                        style={{ display: "grid", gridTemplateColumns: "1fr 220px", borderBottom: rIdx < filteredRates.length - 1 ? "1px solid #f1f5f9" : "none", background: isSel ? "#f0f7ff" : "#fff", minHeight: 140 }}>

                        {/* Options column */}
                        <div style={{ padding: "18px 20px", borderRight: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{rateLabel}</div>
                          {/* Inline option chips */}
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 16px", marginBottom: 6 }}>
                            {room.isRefundable && (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
                                Free Cancellation
                                {room.freeCancelUntil && fmtDate(room.freeCancelUntil) && (
                                  <span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>until {fmtDate(room.freeCancelUntil)}</span>
                                )}
                              </span>
                            )}
                            {!room.isRefundable && (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                Non-refundable
                              </span>
                            )}
                            {room.hasBreakfast && (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#64748b" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
                                Breakfast
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#64748b" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              Taxes included
                            </span>
                          </div>
                        </div>

                        {/* Price column */}
                        <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column" as const, alignItems: "flex-end", justifyContent: "space-between" }}>
                          <div style={{ textAlign: "right" as const }}>
                            {/* Discount badge */}
                            {discountPct && discountPct > 0 && (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, border: "1px solid #fecaca" }}>{discountPct}% off</span>
                              </div>
                            )}
                            {/* Strikethrough OTA price */}
                            {room.otaTotalINR > 0 && room.pricePerNight && (
                              <div style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through", marginBottom: 2 }}>
                                {fmtINR(Math.round(room.otaTotalINR / hotel.nights))}
                              </div>
                            )}
                            {/* Main price */}
                            <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                              {room.pricePerNight ? fmtINR(room.pricePerNight) : "On request"}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>per night</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Total: {fmtINR(room.totalPrice)}</div>
                          </div>

                          {/* Button */}
                          <button
                            onClick={() => {
                              setSelectedOffer(room.offerId);
                              if (isSel) router.push(`/checkout?hotel=${encodeURIComponent(hotel.name)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&room=${encodeURIComponent(room.name)}&price=${room.pricePerNight}&offerId=${room.offerId}`);
                            }}
                            style={{ background: isSel ? NAVY : "#FCD34D", color: isSel ? "#fff" : NAVY, border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: 8 }}>
                            {isSel ? "Book Now →" : "Reserve 1 Room"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {/* ── LOCATION ─────────────────────────────────────────────────────── */}
        <div className="card" ref={refLocation}>
          <h2 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 14 }}>Explore the Area</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>{hotel.address}, {hotel.city}</div>
            <a href={`https://www.google.com/maps?q=${hotel.coordinates?.latitude},${hotel.coordinates?.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: B, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>View on Google Maps ↗</a>
          </div>
          {hotel.coordinates?.latitude && (
            <iframe src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${hotel.coordinates.longitude}!3d${hotel.coordinates.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sin!4v1`}
              width="100%" height="340" style={{ border: "none", borderRadius: 12, display: "block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>

        {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
        <div className="card" ref={refReviews}>
          <h2 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Guest Reviews</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: 32 }}>
            <div>
              {hotel.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div className="sora" style={{ fontSize: 52, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{parseFloat(hotel.rating).toFixed(1)}</div>
                  <div>
                    <div className="sora" style={{ fontSize: 17, fontWeight: 700, color: NAVY }}>{parseFloat(hotel.rating) >= 9 ? "Exceptional" : parseFloat(hotel.rating) >= 8 ? "Excellent" : "Very Good"}</div>
                    {hotel.reviewCount && <div style={{ fontSize: 12, color: "#64748b" }}>{Number(hotel.reviewCount).toLocaleString()} Ratings</div>}
                  </div>
                </div>
              )}
              {hotel.sentimentAnalysis?.categories?.map((cat: any) => (
                <div key={cat.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: NAVY, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span><span style={{ fontWeight: 700 }}>{cat.rating?.toFixed(1)}</span>
                  </div>
                  {cat.description && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, lineHeight: 1.5 }}>{cat.description?.slice(0, 70)}...</div>}
                  <div className="sentiment-bar"><div className="sentiment-fill" style={{ width: (cat.rating / 10 * 100) + "%" }} /></div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 20 }}>
                {["all", "family", "couple", "business", "solo"].map(f => (
                  <button key={f} className={"review-filter-btn" + (reviewFilter === f ? " active" : "")} onClick={() => setReviewFilter(f)}>
                    {f === "all" ? `All Reviews (${hotel.reviews?.length || 0})` : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {filteredReviews.length === 0 && <div style={{ fontSize: 13, color: "#94a3b8" }}>No reviews for this filter.</div>}
              {filteredReviews.map((r: any, i: number) => (
                <div key={i} style={{ borderBottom: i < filteredReviews.length - 1 ? "1px solid #f1f5f9" : "none", padding: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{r.headline || "Guest Review"}</div>
                    <span style={{ background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>{r.score?.toFixed(1) || "—"}</span>
                  </div>
                  {r.pros && <div style={{ fontSize: 13, color: "#16a34a", marginBottom: 3 }}>+ {r.pros}</div>}
                  {r.cons && <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 6 }}>− {r.cons}</div>}
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.name} · {r.type} · {r.country?.toUpperCase()} · {r.date?.substring(0, 7)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FACILITIES ───────────────────────────────────────────────────── */}
        <div className="card" ref={refFacilities}>
          <h2 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 24 }}>Hotel Facilities</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: "28px 40px" }}>
            {Object.entries(hotel.facilityGroups || {}).filter(([, items]) => (items as string[]).length > 0).map(([group, items]) => (
              <div key={group}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{group}</div>
                </div>
                {(items as string[]).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151", padding: "4px 0" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── POLICIES ─────────────────────────────────────────────────────── */}
        <div className="card" ref={refPolicies}>
          <h2 className="sora" style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Hotel Policies</h2>
          {[
            { label: "Check-in", value: `From ${hotel.checkInTime}` },
            { label: "Check-out", value: `Until ${hotel.checkOutTime}` },
            ...(hotel.importantInfo ? [{ label: "Property Policies", value: hotel.importantInfo.replace(/<[^>]+>/g, "").slice(0, 600) }] : []),
          ].map((p, i, arr) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{p.label}</div>
              <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7 }}>{p.value}</div>
            </div>
          ))}
        </div>

        {/* TRACK BANNER */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${B} 100%)`, borderRadius: 14, padding: isMobile ? "24px 20px" : "28px 36px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 20 }}>
          <div>
            <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Already booked this hotel?</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 420 }}>Upload your voucher — we watch the price 24/7 and alert you on WhatsApp the moment it drops.</p>
          </div>
          <button onClick={() => router.push("/")} style={{ background: "#FCD34D", color: NAVY, border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
            Upload voucher → Track price
          </button>
        </div>

        {/* SIMILAR HOTELS */}
        <div style={{ marginBottom: 40 }}>
          <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 20 }}>People also viewed</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {(similarHotels.length > 0 ? similarHotels : [
              { code: "lp1", name: "Burj Al Arab", city: "Dubai, UAE", imageUrl: "/burjalarab.jpg", rebuqPriceINR: 84000, rating: "9.5" },
              { code: "lp2", name: "Jumeirah Al Qasr", city: "Dubai, UAE", imageUrl: "/jumeirahalqasr.jpg", rebuqPriceINR: 31800, rating: "9.2" },
              { code: "lp3", name: "Address Downtown", city: "Dubai, UAE", imageUrl: "/addressdowntown.jpg", rebuqPriceINR: 37400, rating: "9.0" },
            ]).map((h: any, i: number) => (
              <div key={i} className="sim-card" onClick={() => window.open(`/hotel/${h.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`, "_blank")}>
                <div style={{ height: 170, overflow: "hidden" }}>
                  <img src={h.imageUrl || h.images?.[0]?.url} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{h.city}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {(h.rebuqPriceINR || h.lowestPriceINR) && <div className="sora" style={{ fontSize: 17, fontWeight: 800, color: NAVY }}>{fmtINR(h.rebuqPriceINR || h.lowestPriceINR)}<span style={{ fontSize: 11, color: "#64748b", fontFamily: "inherit", fontWeight: 400 }}>/night</span></div>}
                    {h.rating && <span style={{ background: B, color: "#fff", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{parseFloat(h.rating).toFixed(1)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div className="sora" style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: "#94a3b8", maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 28 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[{ title: "Product", links: ["How it works", "Results", "Why rebuq", "Exclusive Member Deals"] }, { title: "Company", links: ["About", "Privacy", "Terms"] }].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY FOOTER */}
      {isMobile && selectedRoom?.pricePerNight && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99 }}>
          <div>
            <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{fmtINR(selectedRoom.pricePerNight)}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>per night · taxes included</div>
          </div>
          <button onClick={() => router.push(`/checkout?hotel=${encodeURIComponent(hotel.name)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&room=${encodeURIComponent(selectedRoom.name)}&price=${selectedRoom.pricePerNight}&offerId=${selectedRoom.offerId}`)}
            style={{ background: B, color: "#fff", border: "none", padding: "12px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Book Now →</button>
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
