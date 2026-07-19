'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const NAVY = '#081633';
const SAPPHIRE = '#0F52BA';
const SAPPHIRE_LT = '#3b82f6';
const GOLD = '#FCD34D';
const MINT = '#34D399';
const INK = '#0F172A';
const SLATE = '#64748B';
const CLOUD = '#F8FAFC';
const LINE = '#E7ECF3';

/* ---- Hero animation: cities across India, prices dropping & being caught ---- */
const CITIES = [
  { name: 'Mumbai', x: 0.30, y: 0.62 }, { name: 'Delhi', x: 0.42, y: 0.28 },
  { name: 'Bengaluru', x: 0.42, y: 0.80 }, { name: 'Goa', x: 0.30, y: 0.72 },
  { name: 'Chennai', x: 0.50, y: 0.82 }, { name: 'Kolkata', x: 0.66, y: 0.50 },
  { name: 'Jaipur', x: 0.36, y: 0.34 }, { name: 'Hyderabad', x: 0.46, y: 0.68 },
  { name: 'Dubai', x: 0.08, y: 0.44 }, { name: 'Bangkok', x: 0.86, y: 0.66 },
  { name: 'Singapore', x: 0.84, y: 0.86 }, { name: 'London', x: 0.02, y: 0.10 },
];

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pulses: { cx: number; cy: number; t: number; amount: number }[] = [];
    let lastSpawn = 0;

    function resize() {
      const parent = canvas.parentElement!;
      w = parent.clientWidth; h = parent.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const pad = 0.12;
    const px = (nx: number) => (pad + nx * (1 - pad * 2)) * w;
    const py = (ny: number) => (0.08 + ny * 0.84) * h;

    function spawn(now: number) {
      const c = CITIES[Math.floor(Math.random() * CITIES.length)];
      pulses.push({ cx: px(c.x), cy: py(c.y), t: now, amount: Math.floor(20 + Math.random() * 380) });
      if (pulses.length > 14) pulses.shift();
    }

    function frame(now: number) {
      ctx.clearRect(0, 0, w, h);

      // faint connection lines between nearby cities
      ctx.strokeStyle = 'rgba(96,140,220,0.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < CITIES.length; i++) {
        for (let j = i + 1; j < CITIES.length; j++) {
          const dx = CITIES[i].x - CITIES[j].x, dy = CITIES[i].y - CITIES[j].y;
          if (Math.hypot(dx, dy) < 0.26) {
            ctx.beginPath();
            ctx.moveTo(px(CITIES[i].x), py(CITIES[i].y));
            ctx.lineTo(px(CITIES[j].x), py(CITIES[j].y));
            ctx.stroke();
          }
        }
      }

      // base city dots
      for (const c of CITIES) {
        ctx.beginPath();
        ctx.arc(px(c.x), py(c.y), 2.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150,185,240,0.5)';
        ctx.fill();
      }

      if (now - lastSpawn > 900) { spawn(now); lastSpawn = now; }

      // pulses = a price caught
      for (const p of pulses) {
        const age = (now - p.t) / 1800;
        if (age > 1) continue;
        const r = 3 + age * 26;
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52,211,153,${(1 - age) * 0.7})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        // bright core
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(252,211,77,${1 - age * 0.6})`;
        ctx.fill();
        // rising saved amount
        if (age < 0.85) {
          ctx.font = '600 12px Inter, sans-serif';
          ctx.fillStyle = `rgba(52,211,153,${1 - age})`;
          ctx.textAlign = 'center';
          ctx.fillText(`−$${p.amount}`, p.cx, p.cy - 12 - age * 26);
        }
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true" />;
}

/* ---- Animated counter ---- */
function Counter({ target, prefix = '', suffix = '', duration = 1800 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  const display = target >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : Math.round(val).toLocaleString();
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

export default function BusinessHome() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: INK, background: '#fff', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px clamp(20px, 5vw, 56px)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff' }}>rebuq<span style={{ color: GOLD }}>.</span></span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Business</span>
        </div>
        <button onClick={() => router.push('/business/login')} style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 9, padding: '9px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
      </nav>

      {/* HERO */}
      <header style={{ position: 'relative', background: `linear-gradient(165deg, ${NAVY} 0%, #0a1f4d 55%, #0c2f6e 100%)`, color: '#fff', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}><HeroCanvas /></div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, transparent 40%, rgba(5,12,35,0.5) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '0 clamp(20px, 5vw, 56px)', maxWidth: 1180, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: 30, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, color: GOLD, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINT }} /> India's first post-booking repricing engine
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0, maxWidth: 780 }}>
            The price dropped<br />after you booked.<br /><span style={{ color: GOLD }}>We caught it.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', marginTop: 26, maxWidth: 520 }}>
            rebuq watches every booking after it's confirmed. When the same room gets cheaper, our AI catches the drop and turns it into savings — before the window closes.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: GOLD, color: NAVY, borderRadius: 11, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Access the console →</button>
            <a href="#how" style={{ border: '1px solid rgba(255,255,255,0.28)', background: 'transparent', color: '#fff', borderRadius: 11, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>See how it works</a>
          </div>
        </div>
      </header>

      {/* PROOF STRIP */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, padding: 'clamp(36px, 6vw, 60px) clamp(20px, 5vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(24px, 4vw, 56px)' }}>
          <Stat value={<Counter prefix="$" target={14800000} />} label="Rebookable value being watched" />
          <Stat value={<Counter target={21087} />} label="Live bookings under watch" />
          <Stat value={<span>Real-time</span>} label="Direct supplier price connection" />
          <Stat value={<span>Catches<span style={{ color: MINT }}>.</span></span>} label="What passive automation misses" />
        </div>
      </section>

      {/* HOW IT WORKS — a real 3-beat sequence, so numbering earns its place */}
      <section id="how" style={{ background: CLOUD, padding: 'clamp(56px, 9vw, 110px) clamp(20px, 5vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SAPPHIRE, margin: 0 }}>How rebuq works</p>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '10px 0 0', maxWidth: 640, lineHeight: 1.1 }}>
            Three steps, running quietly in the background.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 52 }}>
            <Step n="01" title="Book stays confirmed" body="Your booking is made and confirmed as normal. Nothing changes for the guest. rebuq simply starts watching it." tint="#E6F0FB" />
            <Step n="02" title="AI watches the price" body="Our engine re-checks the live rate for the exact same room and dates — again and again — hunting for a genuine drop the automated tools miss." tint="#FEF3C7" />
            <Step n="03" title="The saving is caught" body="When a real like-for-like drop appears, rebuq flags it and captures the difference as margin — before the cancellation window closes." tint="#DCFCE7" />
          </div>
        </div>
      </section>

      {/* THE DIFFERENCE — first in India */}
      <section style={{ background: '#fff', padding: 'clamp(56px, 9vw, 110px) clamp(20px, 5vw, 56px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(32px, 5vw, 72px)', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SAPPHIRE, margin: 0 }}>Why it's different</p>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '10px 0 20px', lineHeight: 1.12 }}>
              Nobody in India has done repricing. We're the first.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE, marginBottom: 16 }}>
              Passive automation only catches the obvious. It leaves whole cities — and the savings inside them — completely untouched.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE }}>
              rebuq is built to go where automation gives up: checking real live rates, matching the exact room, and catching the drops others never see.
            </p>
          </div>
          <div style={{ background: `linear-gradient(160deg, ${SAPPHIRE} 0%, #0c449c 100%)`, borderRadius: 20, padding: 'clamp(28px, 4vw, 44px)', color: '#fff' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>A booking rebuq caught</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Clayton Hotel Dublin Airport · Deluxe Room</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', textDecoration: 'line-through' }}>$2,581</span>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 40, fontWeight: 800, color: '#fff' }}>$2,302</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 30, padding: '6px 14px', fontSize: 13.5, fontWeight: 700, color: MINT, marginTop: 10 }}>
              −$279 caught · 11% cheaper
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0c2f6e 100%)`, color: '#fff', padding: 'clamp(60px, 9vw, 120px) clamp(20px, 5vw, 56px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.08, margin: 0 }}>
            The savings are already there.<br /><span style={{ color: GOLD }}>Start catching them.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', marginTop: 20, lineHeight: 1.6 }}>
            Access the rebuq console and see what your book is leaving on the table.
          </p>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: GOLD, color: NAVY, borderRadius: 12, padding: '15px 34px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 32, fontFamily: 'inherit' }}>Access the console →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#060f24', color: 'rgba(255,255,255,0.55)', padding: '32px clamp(20px, 5vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff' }}>rebuq<span style={{ color: GOLD }}>.</span></span>
        <span style={{ fontSize: 12.5 }}>© {new Date().getFullYear()} rebuq · Post-booking price intelligence</span>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 13.5, color: SLATE, marginTop: 6, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function Step({ n, title, body, tint }: { n: string; title: string; body: string; tint: string }) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 16, padding: '28px 26px' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: INK, marginBottom: 18 }}>{n}</div>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 700, color: INK, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: SLATE, margin: 0 }}>{body}</p>
    </div>
  );
}
