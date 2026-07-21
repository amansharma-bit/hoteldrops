'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* Exact SaaSsy palette (from the real theme CSS) — but accent kept as rebuq sapphire */
const HEADING = '#111111';
const TEXT = '#545454';
const FAINT = '#989898';
const BORDER = '#EAE9E7';
const BG = '#FBFAF9';
const ALT = '#FFFFFF';
const SAPPHIRE = '#0F52BA';   // rebuq brand accent (replaces their #5051F9)

const KEYFRAMES = `
@keyframes rebuqFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rebuqBlurIn {
  from { opacity: 0; transform: translateY(26px); filter: blur(14px); }
  to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
}
`;

export default function BusinessHero() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!document.getElementById('rebuq-hero-keyframes')) {
      const el = document.createElement('style');
      el.id = 'rebuq-hero-keyframes';
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const anim = (delay: number, blur = false): React.CSSProperties => ({
    opacity: 0,
    animation: mounted
      ? `${blur ? 'rebuqBlurIn' : 'rebuqFadeUp'} ${blur ? '1.4s' : '1s'} cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`
      : 'none',
  });

  return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Onest',-apple-system,sans-serif", color: HEADING, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Caveat:wght@600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '24px clamp(20px, 4vw, 44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, ...anim(0) }}>
          <span style={{ fontFamily: "'Onest',sans-serif", fontSize: 'clamp(26px, 3vw, 33px)', fontWeight: 800, color: HEADING, letterSpacing: '-0.03em' }}>
            rebuq<span style={{ color: SAPPHIRE }}>.</span>
          </span>
          <span style={{ fontSize: 'clamp(14px, 1.6vw, 18px)', fontWeight: 500, color: FAINT }}>business</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.2vw, 34px)', ...anim(0.05) }}>
          <a href="#how" className="rebuq-navlink" style={{ fontSize: 15.5, fontWeight: 500, color: HEADING, textDecoration: 'none' }}>How it works</a>
          <a href="#proof" className="rebuq-navlink" style={{ fontSize: 15.5, fontWeight: 500, color: HEADING, textDecoration: 'none' }}>Proof</a>
          <a href="#pricing" className="rebuq-navlink" style={{ fontSize: 15.5, fontWeight: 500, color: HEADING, textDecoration: 'none' }}>Pricing</a>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: HEADING, color: '#fff', borderRadius: 40, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
        </div>
      </nav>

      {/* HERO — centered, fits one screen */}
      <header style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', maxWidth: 1080, margin: '0 auto', width: '100%', padding: 'clamp(20px, 3vh, 44px) clamp(20px, 4vw, 44px)', boxSizing: 'border-box' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: ALT, border: `1px solid ${BORDER}`, borderRadius: 40, padding: '8px 16px', ...anim(0.14) }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: SAPPHIRE }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', color: HEADING }}>POST-BOOKING PRICE INTELLIGENCE</span>
        </div>

        {/* Headline — Onest, heavy, centered */}
        <h1 style={{ fontFamily: "'Onest',sans-serif", fontSize: 'clamp(36px, 5.8vw, 74px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '26px auto 0', maxWidth: 940, ...anim(0.24, true) }}>
          Recover up to <span style={{ color: SAPPHIRE }}>51% more margin</span> on bookings you've already made.
        </h1>

        {/* Subline */}
        <p style={{ fontSize: 'clamp(16px, 1.9vw, 21px)', color: TEXT, margin: '26px auto 0', maxWidth: 660, lineHeight: 1.55, fontWeight: 400, ...anim(0.42) }}>
          rebuq's AI watches every booking after it's confirmed, catches the price drops others miss, and turns them into margin — automatically.
        </p>

        {/* Buttons */}
        <div style={{ marginTop: 38, display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', ...anim(0.56) }}>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: HEADING, color: '#fff', borderRadius: 44, padding: '15px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
          <button onClick={() => router.push('/business/login')} style={{ border: `1.5px solid ${HEADING}`, background: 'transparent', color: HEADING, borderRadius: 44, padding: '15px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Sign in <span aria-hidden style={{ fontSize: 17 }}>→</span>
          </button>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `.rebuq-navlink:hover { color: ${SAPPHIRE} !important; }` }} />
    </div>
  );
}
