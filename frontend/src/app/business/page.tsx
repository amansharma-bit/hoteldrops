'use client';

import { useEffect, useRef, useState } from 'react';

const HEADING = '#111111';
const TEXT = '#545454';
const FAINT = '#989898';
const BORDER = '#EAE9E7';
const WHITE = '#FFFFFF';
const MIST = '#F5F5F7';
const SAPPHIRE = '#0F52BA';
const MINT = '#16A34A';
const GOLD = '#D9A400';

/* Reveal on scroll (matches the hero's fade language) */
function Reveal({ children, delay = 0, style = {} }: any) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ ...style, opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(28px)', transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>
      {children}
    </div>
  );
}

export default function FloatingDashboard() {
  return (
    <section style={{ background: WHITE, fontFamily: "'Onest',-apple-system,sans-serif", padding: 'clamp(60px, 10vh, 130px) clamp(20px, 4vw, 44px)', position: 'relative', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Caveat:wght@600&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>

        {/* Handwritten accent, top-right (like SaaSsy's "Your workflow, simplified") */}
        <Reveal delay={0.1} style={{ position: 'absolute', top: -6, right: 10, zIndex: 5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ fontFamily: "'Caveat',cursive", fontSize: 'clamp(20px, 2.6vw, 30px)', fontWeight: 600, color: HEADING, transform: 'rotate(-4deg)', whiteSpace: 'nowrap' }}>
            Money you already made.
          </span>
        </Reveal>

        {/* Dashboard frame in a gradient border */}
        <Reveal>
          <div style={{ position: 'relative', borderRadius: 26, padding: 'clamp(6px, 1vw, 12px)', background: 'linear-gradient(120deg, #FCD34D 0%, #F97362 30%, #C15FE8 62%, #4C6EF5 100%)', boxShadow: '0 40px 90px -30px rgba(15,23,42,0.28)' }}>
            <div style={{ background: WHITE, borderRadius: 18, overflow: 'hidden' }}>
              {/* top bar */}
              <div style={{ height: 52, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', background: '#FCFCFD' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: SAPPHIRE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Onest',sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>r</span>
                </div>
                <div style={{ flex: 1, maxWidth: 420, height: 34, borderRadius: 9, background: MIST, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, color: FAINT }}>
                  Search bookings…
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: MINT, background: 'rgba(22,163,74,0.1)', padding: '3px 10px', borderRadius: 20 }}>● LIVE</span>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8ECF3' }} />
                </div>
              </div>

              {/* body */}
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', minHeight: 380 }}>
                {/* rail */}
                <div style={{ borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: '20px 0', background: '#FCFCFD' }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ width: 22, height: 22, borderRadius: 7, background: i === 0 ? SAPPHIRE : '#E4E7EC' }} />
                  ))}
                </div>

                {/* main */}
                <div style={{ padding: 'clamp(16px, 2.4vw, 26px)' }}>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                    {[['Watched', '21,087', ''], ['Rebookable', '$14.8M', ''], ['Checks run', '312', '+18'], ['Caught', '$4,120', '+$279']].map((k, i) => (
                      <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 15px' }}>
                        <div style={{ fontSize: 11.5, color: FAINT, fontWeight: 500 }}>{k[0]}</div>
                        <div style={{ fontFamily: "'Onest',sans-serif", fontSize: 'clamp(17px, 2.2vw, 23px)', fontWeight: 800, color: HEADING, marginTop: 5, letterSpacing: '-0.02em' }}>{k[1]}</div>
                        {k[2] && <div style={{ fontSize: 10.5, color: MINT, fontWeight: 600, marginTop: 2 }}>{k[2]} today</div>}
                      </div>
                    ))}
                  </div>
                  {/* rows */}
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 76px 88px', gap: 10, padding: '10px 16px', background: '#FCFCFD', borderBottom: `1px solid ${BORDER}` }}>
                      {['Booking', 'Original', 'Live', 'Gap'].map((h, i) => (
                        <div key={i} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: FAINT, textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
                      ))}
                    </div>
                    {[
                      { h: 'Clayton Hotel Dublin', c: 'Dublin, IE', o: '$2,581', l: '$2,302', g: '−$279', drop: true },
                      { h: 'Zocalo Central', c: 'Mexico City, MX', o: '$906', l: '$821', g: '−$85', drop: true },
                      { h: 'Anantara Riverside', c: 'Bangkok, TH', o: '$772', l: '$715', g: '−$57', drop: true },
                      { h: 'Motel 6 Fremont North', c: 'Fremont, US', o: '$197', l: '$224', g: 'No drop', drop: false },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 76px 76px 88px', gap: 10, padding: '12px 16px', alignItems: 'center', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: HEADING, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.h}</div>
                          <div style={{ fontSize: 11, color: FAINT }}>{r.c}</div>
                        </div>
                        <div style={{ fontSize: 12.5, color: TEXT, textAlign: 'right' }}>{r.o}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: r.drop ? MINT : HEADING, textAlign: 'right' }}>{r.l}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: r.drop ? MINT : FAINT, background: r.drop ? 'rgba(22,163,74,0.1)' : 'transparent', padding: r.drop ? '3px 9px' : 0, borderRadius: 20 }}>{r.g}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Floating card — top-left: worldwide-clients style stat */}
        <Reveal delay={0.25} style={{ position: 'absolute', top: 'clamp(60px, 12%, 130px)', left: 'clamp(-8px, -1vw, 0px)', zIndex: 6 }}>
          <div style={{ background: WHITE, borderRadius: 16, boxShadow: '0 18px 48px -12px rgba(15,23,42,0.22)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex' }}>
              {['#FCD34D', '#34D399', '#60A5FA'].map((c, i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: '2px solid #fff', marginLeft: i ? -10 : 0 }} />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'Onest',sans-serif", fontSize: 22, fontWeight: 800, color: HEADING, letterSpacing: '-0.02em' }}>21,087</div>
              <div style={{ fontSize: 12.5, color: TEXT }}>Bookings watched</div>
            </div>
          </div>
        </Reveal>

        {/* Floating card — bottom-left: testimonial */}
        <Reveal delay={0.35} style={{ position: 'absolute', bottom: 'clamp(20px, 6%, 60px)', left: 'clamp(-8px, -1vw, 6px)', zIndex: 6, maxWidth: 300 }}>
          <div style={{ background: WHITE, borderRadius: 16, boxShadow: '0 18px 48px -12px rgba(15,23,42,0.22)', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', border: `1px solid ${BORDER}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: HEADING, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Onest',sans-serif", fontWeight: 800, fontSize: 18 }}>D</div>
            <div>
              <div style={{ fontFamily: "'Onest',sans-serif", fontSize: 16, fontWeight: 700, color: HEADING, lineHeight: 1.25 }}>"Margin we were leaving on the table."</div>
              <div style={{ fontSize: 12, color: FAINT, marginTop: 6 }}>— GRN partner</div>
            </div>
          </div>
        </Reveal>

        {/* Floating card — bottom-right: the money moment */}
        <Reveal delay={0.45} style={{ position: 'absolute', bottom: 'clamp(-6px, 2%, 30px)', right: 'clamp(-8px, -1vw, 8px)', zIndex: 6 }}>
          <div style={{ background: HEADING, borderRadius: 16, boxShadow: '0 18px 48px -12px rgba(15,23,42,0.32)', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(217,164,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Onest',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>+51% margin</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>recovered, automatically</div>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
