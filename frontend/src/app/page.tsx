"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=400&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
];

const CARDS = [
  { img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=85&fit=crop", price: "₹22,400", name: "Atlantis The Palm, Dubai", pct: "↓19%" },
  { img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=85&fit=crop", price: "₹31,600", name: "Park Hyatt Maldives", pct: "↓20%" },
  { img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=85&fit=crop", price: "₹18,200", name: "Four Seasons Bali", pct: "↓22%" },
  { img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=85&fit=crop", price: "₹17,400", name: "Capella Bangkok", pct: "↓28%" },
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
  { q: "What if I have a non-refundable booking?", a: "We still monitor non-refundable bookings in case the hotel itself offers a price adjustment or the OTA runs a special promotion. However, the primary benefit is for refundable rates." },
];

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [statValues, setStatValues] = useState(STATS.map(s => ({ prefix: s.prefix, suffix: s.suffix, val: s.target })));
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

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
            setStatValues(prev => {
              const next = [...prev];
              next[i] = { prefix: s.prefix, suffix: s.suffix, val };
              return next;
            });
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

  const B = "#1447b8";
  const NAVY = "#0f172a";

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 16, lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
        <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>
          rebuq<span style={{ color: B }}>.</span>
        </a>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none" }}>
            {[["How it works", "how"], ["Results", "results"], ["Why rebuq", "why"], ["Search Hotels", "search"]].map(([label, id]) => (
              <li key={id}><button onClick={() => id === "search" ? router.push("/search-hotels") : scrollTo(id)}
                style={{ fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>{label}</button></li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!isMobile && <button style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: "8px 12px", borderRadius: 8 }}>Sign in</button>}
          <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: isMobile ? "8px 14px" : "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {isMobile ? "Check booking" : "Check my booking"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: isMobile ? "60px 20px 50px" : "90px 24px 70px", background: "linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e0edff", color: B, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, marginBottom: 28, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          ✦ AI-Powered · Watches 24×7
        </div>
        <h1 className="sora" style={{ fontSize: isMobile ? 36 : 64, fontWeight: 800, lineHeight: 1.1, color: NAVY, maxWidth: 760, margin: "0 auto 20px" }}>
          Your hotel price just dropped. <span style={{ color: B }}>Did you notice?</span>
        </h1>
        <p style={{ fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Booked a hotel? rebuq watches the price 24/7 after you pay. When it drops, we alert you instantly — you rebook and pocket the difference. Free to check.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, transition: "all .2s" }}>
            Check my booking — it&apos;s free
          </button>
          <button onClick={() => scrollTo("how")} style={{ background: "transparent", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ▶ See how it works
          </button>
        </div>
        <p style={{ marginTop: 18, fontSize: 12.5, color: "#64748b" }}>Free to check · We only get paid when you save · 12,000+ Indian travelers saving</p>
      </section>

      {/* SAVINGS CARDS */}
      <div style={{ padding: isMobile ? "0 16px 40px" : "0 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 16 }}>
          {CARDS.map((c, i) => (
            <div key={i} style={{ borderRadius: 14, overflow: "hidden", position: "relative", height: 180, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", cursor: "pointer" }}>
              <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, display: "block" }}>{c.price}</span>
                <span style={{ fontSize: 12, opacity: 0.85 }}>{c.name}</span>
              </div>
              <div style={{ position: "absolute", top: 12, right: 12, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>{c.pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ padding: isMobile ? "60px 20px" : "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>How it works</p>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Three steps. Zero effort.</h2>
        <p style={{ fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 12 }}>Upload once. We watch forever. You save when the price drops.</p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 40, marginTop: 60, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 0 }}>
            {["Upload", "Watch", "Save"].map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                style={{ padding: "16px 20px", cursor: "pointer", borderLeft: isMobile ? "none" : `3px solid ${activeStep === i ? B : "#e2e8f0"}`, borderBottom: isMobile ? `3px solid ${activeStep === i ? B : "#e2e8f0"}` : "none", color: activeStep === i ? B : "#64748b", fontWeight: 600, fontSize: 15, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" as const }}>
                {s}
              </button>
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
                  <span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                  Monitoring
                </span>
              </div>
              {[["MakeMyTrip", "₹41,200", "₹41,000", false], ["Booking.com", "₹41,200", "₹39,400", true], ["Agoda", "₹53,300", "₹53,300", false]].map(([site, orig, curr, drop], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid #e2e8f0" : "none", fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>{site}</span>
                  <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 13 }}>{orig}</span>
                  <span style={{ fontWeight: 700, color: NAVY }}>{curr}</span>
                  {drop ? <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>↓₹1,800</span>
                    : <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>—</span>}
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>
              Start for free
            </button>
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          {["#93c5fd,#2563eb", "#6ee7b7,#2563eb", "#fca5a5,#f97316"].map((g, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${NAVY}`, background: `linear-gradient(135deg, ${g})`, margin: "0 -4px" }} />
          ))}
        </div>
        <div className="sora" style={{ fontSize: isMobile ? 22 : 38, fontWeight: 700, color: "#fff", maxWidth: 720, margin: "0 auto 20px", lineHeight: 1.25 }}>
          &quot;This should be mandatory for every Indian traveler who books hotels online.&quot;
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>— Ananya Krishnan · Travel Blogger, Chennai</div>
      </div>

      {/* FEATURES */}
      <div id="why" style={{ padding: isMobile ? "60px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B, marginBottom: 14, textAlign: "center" }}>Why rebuq</p>
          <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: NAVY, textAlign: "center", lineHeight: 1.15 }}>Built for travelers who hate leaving money on the table.</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, marginTop: 48 }}>

            {/* Wide card */}
            <div style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc", gridColumn: isMobile ? "auto" : "1/-1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: "#e0edff", color: B }}>Continuous</span>
                <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>AI that never sleeps</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>Our monitoring AI checks your hotel price every 6 hours — through the night, through weekends. It has found drops as close as the night before check-in.</p>
                <div className="sora" style={{ fontSize: 42, fontWeight: 800, color: B, marginTop: 16 }}>+4,200</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Price drops found this month alone</div>
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                <div className="sora" style={{ fontWeight: 700, fontSize: 22, color: B }}>24/7 Watching</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Every 6 hours. Day & night.</div>
              </div>
            </div>

            {[
              { badge: "Instant", badgeBg: "#dcfce7", badgeColor: "#16a34a", icon: "💬", title: "WhatsApp alerts", text: "The moment we find a drop, you get a WhatsApp message with a direct rebooking link — no app to install." },
              { badge: "Full Coverage", badgeBg: "#fee2e2", badgeColor: "#991b1b", icon: "🌐", title: "All major OTAs", text: "MakeMyTrip, Booking.com, Agoda, Goibibo, Hotels.com — we watch them all so you don't have to." },
              { badge: "Zero Risk", badgeBg: "#fef9c3", badgeColor: "#854d0e", icon: "🛡️", title: "Zero-risk pricing", text: "Free to check. We take a small success fee only if we actually save you money. If price doesn't drop, you pay nothing." },
              { badge: "Fast · 6hr avg", badgeBg: "#f3e8ff", badgeColor: "#7c3aed", icon: "⚡", title: "Catches drops fast", text: "Average time to find a significant price drop: under 6 hours. Some drops are caught within the hour." },
            ].map((f, i) => (
              <div key={i} style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: f.badgeBg, color: f.badgeColor }}>{f.badge}</span>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.text}</p>
              </div>
            ))}

            <div style={{ borderRadius: 14, padding: 28, border: "1.5px solid #e2e8f0", background: "#f8fafc", gridColumn: isMobile ? "auto" : "1/-1" }}>
              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 12, background: "#f3e8ff", color: "#7c3aed" }}>Privacy-first</span>
              <div style={{ fontSize: 28, marginBottom: 14 }}>🔒</div>
              <h3 className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Your booking data stays private</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>We only need the hotel name, dates, and price from your confirmation. We never access your payment details, passport information, or OTA login. Your data is encrypted and never sold.</p>
            </div>
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
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  style={{ width: "100%", padding: "20px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: NAVY, background: "none", border: "none", fontFamily: "inherit", textAlign: "left" }}>
                  {f.q}
                  <span style={{ fontSize: 20, color: "#64748b", transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 20px", fontSize: 14.5, color: "#64748b", lineHeight: 1.7 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BOTTOM */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1447b8 100%)", padding: isMobile ? "60px 20px" : "80px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 100, marginBottom: 24 }}>Free to check</div>
        <h2 className="sora" style={{ fontSize: isMobile ? 28 : 46, fontWeight: 800, color: "#fff", maxWidth: 600, margin: "0 auto 16px", lineHeight: 1.15 }}>Your next hotel booking could cost less. Let&apos;s find out.</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops. You pay only if we save you money.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/upload")} style={{ background: "#fff", color: B, border: "none", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Upload my booking now ↗</button>
          <button onClick={() => scrollTo("how")} style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 10, padding: "13px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>▶ See how it works</button>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {["Free to check", "No app needed", "Pay only if you save"].map(f => (
            <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>✓</span> {f}
            </span>
          ))}
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
              {[
                { title: "Product", links: ["How it works", "Results", "Why rebuq", "Search Hotels"] },
                { title: "Company", links: ["About", "Privacy", "Terms"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: "flex", gap: 14 }}>
              {["Twitter", "LinkedIn", "Instagram"].map(s => <a key={s} href="#" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
