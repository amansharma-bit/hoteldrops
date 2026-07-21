'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#0A0A0B';
const GREY = '#52525B';
const FAINT = '#A1A1AA';
const HAIR = '#ECECEF';
const CREAM = '#FAF9F6';       // SaaSsy-style warm off-white
const SAPPHIRE = '#0F52BA';
const SAPPHIRE_DEEP = '#0c449c';
const GOLD = '#D9A400';

/*
  HERO BLOCK — modeled on the SaaSsy reference.
  Big logo, clean nav, badge, huge two-tone headline, subline, two buttons.
  Signature animation: staggered fade-up with a blur-clear on the headline.
  Keyframes injected at runtime so the Next build can't strip them.
*/

const KEYFRAMES = `
@keyframes rebuqFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rebuqBlurIn {
  from { opacity: 0; transform: translateY(24px); filter: blur(14px); }
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
    // next tick so the animation runs from initial state
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // staggered entrance: each element fades up a beat after the last
  const anim = (delay: number, blur = false): React.CSSProperties => ({
    opacity: 0,
    animation: mounted
      ? `${blur ? 'rebuqBlurIn' : 'rebuqFadeUp'} ${blur ? '1.1s' : '0.8s'} cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`
      : 'none',
  });

  return (
    <div style={{ background: CREAM, minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif", color: INK, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ maxWidth: 1240, margin: '0 auto', padding: '26px clamp(20px, 4vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Big logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, ...anim(0) }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>
            rebuq<span style={{ color: SAPPHIRE }}>.</span>
          </span>
          <span style={{ fontSize: 'clamp(13px, 1.6vw, 17px)', fontWeight: 500, color: FAINT, letterSpacing: '-0.01em' }}>business</span>
        </div>

        {/* Nav links (placeholder — menu reworked later) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2.5vw, 34px)', ...anim(0.05) }}>
          <a href="#how" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }} className="rebuq-navlink">How it works</a>
          <a href="#proof" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }} className="rebuq-navlink">Proof</a>
          <a href="#pricing" style={{ fontSize: 15, fontWeight: 500, color: INK, textDecoration: 'none' }} className="rebuq-navlink">Pricing</a>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 12, padding: '11px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(60px, 11vh, 130px) clamp(20px, 4vw, 40px) clamp(60px, 8vh, 100px)', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 30, padding: '8px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...anim(0.12) }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: SAPPHIRE }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', color: INK }}>POST-BOOKING PRICE INTELLIGENCE</span>
        </div>

        {/* Headline — two-tone, blur-clear entrance */}
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(40px, 7.5vw, 88px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.035em', margin: '28px auto 0', maxWidth: 920, ...anim(0.22, true) }}>
          Recover up to <span style={{ color: SAPPHIRE }}>51% more margin</span> on bookings you've already made.
        </h1>

        {/* Subline */}
        <p style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', color: GREY, margin: '30px auto 0', maxWidth: 660, lineHeight: 1.5, ...anim(0.4) }}>
          rebuq's AI watches every booking after it's confirmed, catches the price drops others miss, and turns them into margin — automatically.
        </p>

        {/* Buttons */}
        <div style={{ marginTop: 42, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', ...anim(0.52) }}>
          <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 14, padding: '16px 32px', fontSize: 16.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book a demo
          </button>
          <button onClick={() => router.push('/business/login')} style={{ border: `1.5px solid ${INK}`, background: 'transparent', color: INK, borderRadius: 14, padding: '16px 32px', fontSize: 16.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Sign in <span aria-hidden style={{ fontSize: 18 }}>→</span>
          </button>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `.rebuq-navlink:hover { color: ${SAPPHIRE} !important; }` }} />
    </div>
  );
}
