'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const INK = '#0A0A0B';
const GREY = '#52525B';
const FAINT = '#A1A1AA';
const HAIR = '#E4E4E7';
const MIST = '#FAFAFA';
const MINT = '#16A34A';
const RED = '#DC2626';
const SAPPHIRE = '#0F52BA';

function Reveal({ children, delay = 0, style = {} }: any) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ ...style, opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(22px)', transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}>{children}</div>;
}

function CountUp({ target, prefix = '', suffix = '', decimals = 0 }: any) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now(), dur = 1900;
        const tick = (n: number) => { const p = Math.min((n - t0) / dur, 1); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

const EYEBROW: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', color: FAINT, fontFamily: 'monospace', margin: 0 };
const H2: React.CSSProperties = { fontFamily: "'Sora',sans-serif", fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, color: INK, margin: '14px 0 0' };
const WRAP: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '0 24px' };

export default function BusinessHome() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', s); return () => window.removeEventListener('scroll', s);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", color: INK, background: '#fff', overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent', backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none', borderBottom: `1px solid ${scrolled ? HAIR : 'transparent'}`, transition: 'all 0.3s' }}>
        <div style={{ ...WRAP, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 21, fontWeight: 800, color: INK }}>rebuq<span style={{ color: MINT }}>.</span></span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: FAINT, border: `1px solid ${HAIR}`, borderRadius: 5, padding: '1px 6px' }}>v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <a href="#spec" style={{ fontSize: 13.5, color: GREY, textDecoration: 'none', fontWeight: 500 }}>Engine</a>
            <a href="#compare" style={{ fontSize: 13.5, color: GREY, textDecoration: 'none', fontWeight: 500 }}>Compare</a>
            <a href="#cases" style={{ fontSize: 13.5, color: GREY, textDecoration: 'none', fontWeight: 500 }}>Use cases</a>
            <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ paddingTop: 'clamp(120px, 16vh, 180px)', paddingBottom: 'clamp(50px, 8vh, 90px)' }}>
        <div style={WRAP}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: GREY, marginBottom: 24 }}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: MINT }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: MINT, animation: 'none', opacity: 0.4 }} />
              </span>
              Live · 21,087 bookings under watch right now
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(40px, 7vw, 82px)', fontWeight: 800, lineHeight: 1.03, letterSpacing: '-0.04em', margin: 0, maxWidth: 820 }}>
              The price dropped after you booked.<span style={{ color: MINT }}>_</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', color: GREY, margin: '24px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              rebuq re-checks every confirmed booking, catches the genuine drops automation misses, and turns them into margin — before the window closes.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div style={{ marginTop: 34, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 10, padding: '13px 26px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Access the console →</button>
              <a href="#spec" style={{ color: SAPPHIRE, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>See the engine</a>
            </div>
          </Reveal>

          {/* Live dashboard mock */}
          <Reveal delay={0.26}>
            <div style={{ marginTop: 64 }}>
              <DashboardMock />
            </div>
          </Reveal>
        </div>
      </header>

      {/* marquee of capabilities */}
      <div style={{ borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}`, padding: '16px 0', overflow: 'hidden', background: MIST }}>
        <div style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, color: GREY, fontFamily: 'monospace', animation: 'rebuqMarquee 28s linear infinite' }}>
          {Array(2).fill(0).map((_, k) => (
            <span key={k} style={{ display: 'flex', gap: 40 }}>
              {['Live GRN price checks', 'Exact-room matching', 'Like-for-like verification', 'Cancellation-window aware', 'Real-time currency', 'Every check logged', 'Conversion tracking', 'Zero guest disruption'].map((t) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>{t} <span style={{ color: MINT }}>·</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* § 01 SPEC SHEET */}
      <section id="spec" style={{ padding: 'clamp(72px, 12vh, 140px) 0' }}>
        <div style={WRAP}>
          <Reveal>
            <p style={EYEBROW}>§ 01 — The engine</p>
            <h2 style={{ ...H2, maxWidth: 620 }}>Every number earns its place.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ marginTop: 44, border: `1px solid ${HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
              {[
                ['Bookings under watch', 'Live, refundable, cancellation window open', '21,087'],
                ['Rebookable value tracked', 'Normalized to USD across every currency', '$14.8M'],
                ['Median time to catch a drop', 'From booking to detected saving', '8 days'],
                ['Room match', 'Exact room_code, not a fuzzy name guess', 'Verified'],
                ['Price source', 'Direct supplier availability, checked live', 'Real-time'],
                ['Every check', 'Logged, timestamped, auditable', 'On record'],
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', padding: '18px 22px', borderTop: i > 0 ? `1px solid ${HAIR}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{r[0]}</div>
                    <div style={{ fontSize: 13, color: FAINT, marginTop: 2 }}>{r[1]}</div>
                  </div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>{r[2]}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* § 02 COMPARISON */}
      <section id="compare" style={{ padding: 'clamp(72px, 12vh, 140px) 0', background: MIST, borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}` }}>
        <div style={WRAP}>
          <Reveal>
            <p style={EYEBROW}>§ 02 — The difference</p>
            <h2 style={{ ...H2, maxWidth: 640 }}>Every row is a quiet argument.</h2>
            <p style={{ fontSize: 16, color: GREY, marginTop: 16, maxWidth: 520, lineHeight: 1.5 }}>Passive automation catches the obvious and leaves the rest. rebuq is built for the rest.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ marginTop: 40, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560, background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${HAIR}` }}>
                    <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 13, fontWeight: 600, color: FAINT }}>Capability</th>
                    <th style={{ textAlign: 'center', padding: '16px 16px', fontSize: 13, fontWeight: 700, color: MINT }}>rebuq</th>
                    <th style={{ textAlign: 'center', padding: '16px 16px', fontSize: 13, fontWeight: 500, color: FAINT }}>Passive automation</th>
                    <th style={{ textAlign: 'center', padding: '16px 16px', fontSize: 13, fontWeight: 500, color: FAINT }}>Doing nothing</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Catches drops in ignored cities', true, false, false],
                    ['Manual human override', true, false, false],
                    ['Exact-room like-for-like check', true, 'Partial', false],
                    ['Live supplier price, on demand', true, 'Partial', false],
                    ['Full audit log of every check', true, false, false],
                    ['Refuses unsafe downgrades', true, 'Partial', false],
                    ['Built for the India market', true, false, false],
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${HAIR}` }}>
                      <td style={{ padding: '15px 20px', fontSize: 14.5, color: INK, fontWeight: 500 }}>{r[0] as string}</td>
                      {[r[1], r[2], r[3]].map((c, j) => (
                        <td key={j} style={{ textAlign: 'center', padding: '15px 16px' }}>
                          {c === true ? <span style={{ color: MINT, fontSize: 17, fontWeight: 700 }}>✓</span>
                            : c === false ? <span style={{ color: HAIR, fontSize: 16 }}>—</span>
                            : <span style={{ fontSize: 12.5, color: FAINT, fontWeight: 500 }}>{c as string}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: FAINT, marginTop: 14, fontFamily: 'monospace' }}>First post-booking repricing engine built in India.</p>
          </Reveal>
        </div>
      </section>

      {/* § 03 REAL CATCHES */}
      <section style={{ padding: 'clamp(72px, 12vh, 140px) 0' }}>
        <div style={WRAP}>
          <Reveal>
            <p style={EYEBROW}>§ 03 — Field reports</p>
            <h2 style={{ ...H2, maxWidth: 620 }}>Real drops, really caught.</h2>
          </Reveal>
          <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { hotel: 'Clayton Hotel Dublin Airport', city: 'Dublin, IE', orig: '$2,581', live: '$2,302', saved: '$279', pct: '11%' },
              { hotel: 'Zocalo Central', city: 'Mexico City, MX', orig: '$906', live: '$821', saved: '$85', pct: '9%' },
              { hotel: 'Anantara Riverside', city: 'Bangkok, TH', orig: '$772', live: '$715', saved: '$57', pct: '7%' },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ border: `1px solid ${HAIR}`, borderRadius: 16, padding: '24px', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{c.hotel}</div>
                  <div style={{ fontSize: 13, color: FAINT, marginTop: 2 }}>{c.city}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 20 }}>
                    <span style={{ fontSize: 16, color: FAINT, textDecoration: 'line-through' }}>{c.orig}</span>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>{c.live}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, background: 'rgba(22,163,74,0.09)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: MINT }}>
                    −{c.saved} caught · {c.pct} cheaper
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* § 04 USE CASES */}
      <section id="cases" style={{ padding: 'clamp(72px, 12vh, 140px) 0', background: INK, color: '#fff' }}>
        <div style={WRAP}>
          <Reveal>
            <p style={{ ...EYEBROW, color: 'rgba(255,255,255,0.5)' }}>§ 04 — Who it's for</p>
            <h2 style={{ ...H2, color: '#fff', maxWidth: 620 }}>Built for the margin others leave behind.</h2>
          </Reveal>
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { t: 'Wholesalers & bedbanks', d: 'Your book is enormous and mostly unwatched. rebuq works the long tail — the cities and bookings automation never touches — and turns silent expiry into recovered margin.' },
              { t: 'OTAs & travel platforms', d: 'Layer post-booking repricing onto your existing inventory. No guest disruption, no re-platforming — just a quiet margin engine running underneath what you already sell.' },
              { t: 'Operations teams', d: 'A human console for deliberate, high-value checks. Point it at the bookings that matter, see the live rate, and catch the drop with a verified like-for-like match.' },
            ].map((u, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.15)`, paddingTop: 22 }}>
                  <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: '#fff' }}>{u.t}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', marginTop: 12 }}>{u.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(90px, 15vh, 180px) 0', textAlign: 'center' }}>
        <div style={WRAP}>
          <Reveal>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(34px, 6vw, 68px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
              The savings are already there.
            </h2>
            <p style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', color: GREY, margin: '20px auto 0', maxWidth: 480, lineHeight: 1.45 }}>rebuq is how you finally catch them.</p>
            <button onClick={() => router.push('/business/login')} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 10, padding: '15px 34px', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 36, fontFamily: 'inherit' }}>Access the console →</button>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${HAIR}`, padding: '30px 0' }}>
        <div style={{ ...WRAP, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: INK }}>rebuq<span style={{ color: MINT }}>.</span></span>
          <span style={{ fontSize: 12.5, color: FAINT }}>© {new Date().getFullYear()} rebuq · Post-booking price intelligence · India</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes rebuqMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }` }} />
    </div>
  );
}

/* Live-feeling console dashboard mock */
function DashboardMock() {
  return (
    <div style={{ border: `1px solid ${HAIR}`, borderRadius: 16, background: '#fff', boxShadow: '0 40px 80px -24px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ height: 40, borderBottom: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#FBFBFD' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: FAINT, fontFamily: 'monospace' }}>rebuq.com/business/repricing</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: MINT, background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 20 }}>● LIVE</span>
      </div>
      <div style={{ padding: 'clamp(18px, 3vw, 26px)' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          {[['Watched', '21,087', ''], ['Rebookable', '$14.8M', ''], ['Checks run', '312', '+18'], ['Caught', '$4,120', '+$279']].map((k, i) => (
            <div key={i} style={{ border: `1px solid ${HAIR}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: FAINT, fontWeight: 500 }}>{k[0]}</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(16px, 2.4vw, 22px)', fontWeight: 800, color: INK, marginTop: 4, letterSpacing: '-0.02em' }}>{k[1]}</div>
              {k[2] && <div style={{ fontSize: 10.5, color: MINT, fontWeight: 600, marginTop: 2 }}>{k[2]} today</div>}
            </div>
          ))}
        </div>
        {/* rows */}
        <div style={{ border: `1px solid ${HAIR}`, borderRadius: 10, overflow: 'hidden' }}>
          {[
            { h: 'Clayton Hotel Dublin Airport', c: 'Dublin, IE', o: '$2,581', l: '$2,302', g: '−$279', drop: true },
            { h: 'Zocalo Central', c: 'Mexico City, MX', o: '$906', l: '$821', g: '−$85', drop: true },
            { h: 'Motel 6 Fremont North', c: 'Fremont, US', o: '$197', l: '$224', g: 'No drop', drop: false },
            { h: 'Anantara Riverside Resort', c: 'Bangkok, TH', o: '$772', l: '$715', g: '−$57', drop: true },
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 74px 74px 84px', gap: 10, alignItems: 'center', padding: '12px 16px', borderTop: i > 0 ? `1px solid ${HAIR}` : 'none' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.h}</div>
                <div style={{ fontSize: 11, color: FAINT }}>{r.c}</div>
              </div>
              <div style={{ fontSize: 12.5, color: GREY, textAlign: 'right', fontFamily: 'monospace' }}>{r.o}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: r.drop ? MINT : INK, textAlign: 'right', fontFamily: 'monospace' }}>{r.l}</div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: r.drop ? MINT : FAINT, background: r.drop ? 'rgba(22,163,74,0.1)' : 'transparent', padding: r.drop ? '3px 9px' : 0, borderRadius: 20 }}>{r.g}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
