'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#0A0A0B';
const GREY = '#52525B';
const FAINT = '#A1A1AA';
const HAIR = '#ECECEF';
const CREAM = '#FAF9F6';
const SAPPHIRE = '#0F52BA';

const KEYFRAMES = `
@keyframes rebuqFadeUp {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rebuqBlurIn {
  from { opacity: 0; transform: translateY(28px); filter: blur(16px); }
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

  // Slower, more graceful entrance with wider stagger gaps
  const anim = (delay: number, blur = false): React.CSSProperties => ({
    opacity: 0,
    animation: mounted
      ? `${blur ? 'rebuqBlurIn' : 'rebuqFadeUp'} ${blur ? '1.5s' : '1.1s'} cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`
      : 'none',
  });

  return (
    <div style={{ background: CREAM, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',-apple-system,sans-serif", color: INK, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '22px clamp(20px, 4vw, 44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, ...anim(0) }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 700, color: INK, letterSpacing: '-0.03em' }}>
            rebuq<span style={{ color: SAPPHIRE }}>.</span>
          </span>
          <span style={{ fontSize: 'clamp(13px, 1.5vw, 16px)', fontWeight: 500, color: FAINT }}>business</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.2vw, 32px)', ...anim(0.06) }}>
          <a href="#how" className="rebuq-navlink" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }}>How it works</a>
          <a href="#proof" className="rebuq-navlink" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }}>Proof</a>
          <a href="#pricing" className="rebuq-navlink" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }}>Pricing</a>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 11, padding: '11px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
        </div>
      </nav>

      {/* HERO — centered vertically in remaining space so it fits one screen */}
      <header style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1180, margin: '0 auto', width: '100%', padding: 'clamp(20px, 3vh, 40px) clamp(20px, 4vw, 44px)', boxSizing: 'border-box' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 30, padding: '7px 15px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', alignSelf: 'flex-start', ...anim(0.14) }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: SAPPHIRE }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: INK }}>POST-BOOKING PRICE INTELLIGENCE</span>
        </div>

        {/* Headline — smaller, left-aligned, controlled size so buttons stay visible */}
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(34px, 5.6vw, 68px)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.035em', margin: '24px 0 0', maxWidth: 940, ...anim(0.24, true) }}>
          Recover up to <span style={{ color: SAPPHIRE }}>51% more margin</span> on bookings you've already made.
        </h1>

        {/* Subline */}
        <p style={{ fontSize: 'clamp(16px, 1.9vw, 20px)', color: GREY, margin: '24px 0 0', maxWidth: 620, lineHeight: 1.5, ...anim(0.42) }}>
          rebuq's AI watches every booking after it's confirmed, catches the price drops others miss, and turns them into margin — automatically.
        </p>

        {/* Buttons */}
        <div style={{ marginTop: 36, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', ...anim(0.56) }}>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 13, padding: '15px 30px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
          <button onClick={() => router.push('/business/login')} style={{ border: `1.5px solid ${INK}`, background: 'transparent', color: INK, borderRadius: 13, padding: '15px 30px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Sign in <span aria-hidden style={{ fontSize: 17 }}>→</span>
          </button>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `.rebuq-navlink:hover { color: ${SAPPHIRE} !important; }` }} />
    </div>
  );
}
