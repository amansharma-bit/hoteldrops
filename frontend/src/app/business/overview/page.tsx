'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

// ---- Brand tokens ---------------------------------------------------------
// Softer, calmer blue (iofrm-style) — easier on the eyes across big panels,
// and lets the gold accent stand out more. Deeper shade used for gradient depth.
const BLUE = '#4589f0';       // primary (calmer than the old #1447b8)
const BLUE_DEEP = '#2f6fd0';  // gradient/hover depth
const NAVY = '#0F172A';       // text + hero background
const GOLD = '#F5B833';       // urgency / money accent
const GREEN = '#16A34A';
const SLATE = '#64748B';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';

function usd(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function usdShort(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K';
  return '$' + Math.round(n);
}
function num(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

const PERIODS = ['Today', 'WTD', 'MTD', 'YTD'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('Today');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authenticatedFetch(`${API_BASE}/api/live-search/dashboard?period=${period}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load dashboard: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const t = data?.tiles;
  const fresh = data?.sync?.syncedThrough
    ? new Date(data.sync.syncedThrough).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  const maxTrend = Math.max(1, ...(data?.dailyTrend || []).map((d: any) => d.count));
  const maxCityVal = Math.max(1, ...(data?.topCities || []).map((c: any) => c.valueUsd || c.count));

  // Which trend bars get a date label — first, last, and a few between (avoid clutter).
  const trend = data?.dailyTrend || [];
  const labelEvery = Math.max(1, Math.ceil(trend.length / 6));

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>Live GRN inventory you can still act on — and what it's worth.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              {/* Time period buttons */}
              <div style={{ display: 'flex', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 7,
                    background: period === p ? BLUE : 'transparent',
                    color: period === p ? '#fff' : SLATE,
                    transition: 'background 0.15s',
                  }}>{p}</button>
                ))}
              </div>
              {fresh && <span style={{ fontSize: 12, color: SLATE }}>Synced through <strong style={{ color: NAVY }}>{fresh}</strong></span>}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ margin: '20px 32px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        {/* HERO — always-live inventory */}
        <div style={{ padding: '24px 32px 0' }}>
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #1E293B 100%)`,
            borderRadius: 18, padding: '28px 32px', color: '#fff',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>Live rebookable value</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: GREEN, background: 'rgba(22,163,74,0.15)', padding: '3px 8px', borderRadius: 20 }}>Live now</span>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 46, fontWeight: 800, lineHeight: 1.1, marginTop: 10 }}>
                {loading ? '—' : usd(t?.liveRebookable?.valueUsd)}
                <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', marginLeft: 10 }}>USD</span>
              </div>
              <div style={{ fontSize: 14, color: '#CBD5E1', marginTop: 6 }}>
                across <strong style={{ color: '#fff' }}>{loading ? '—' : num(t?.liveRebookable?.count)}</strong> bookings still open to cancel &amp; rebook
                {t?.liveRebookable?.valueBasis === 'capped' && <span style={{ color: GOLD, marginLeft: 8, fontSize: 12 }}>(estimated)</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: GOLD }}>{loading ? '—' : num(t?.expiringSoon?.count)}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>expiring within 3 days</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff' }}>{loading ? '—' : num(t?.checkingIn7?.count)}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>checking in within a week</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY tiles — all always-live */}
        <div style={{ padding: '20px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Tile label="Checking in within 30 days" value={loading ? '—' : num(t?.checkingIn30?.count)} sub="imminent revenue" accent={BLUE} live />
          <Tile label="Live inventory" value={loading ? '—' : num(t?.liveRebookable?.count)} sub="still cancellable" accent={NAVY} live />
          <Tile
            label="Caught this month"
            value={loading ? '—' : usd(t?.caughtThisMonth?.savedUsd)}
            sub={t?.caughtThisMonth?.basis === 'no_rebookings_yet' ? 'runs after first reprice' : `${num(t?.caughtThisMonth?.count)} rebookings`}
            accent={GREEN}
            muted={t?.caughtThisMonth?.basis === 'no_rebookings_yet'}
          />
        </div>

        {/* Charts row */}
        <div style={{ padding: '24px 32px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Daily trend — responds to the period buttons */}
          <Panel title="Bookings added" badge={period}>
            {(trend.length === 0) ? (
              <Empty>No booking activity in this period.</Empty>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 150, marginTop: 12 }}>
                  {trend.map((d: any) => (
                    <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ height: `${(d.count / maxTrend) * 100}%`, background: BLUE, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                    </div>
                  ))}
                </div>
                {/* date axis */}
                <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                  {trend.map((d: any, i: number) => (
                    <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {i % labelEvery === 0 ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          {/* Top cities — count + USD value */}
          <Panel title="Top cities" badge="live rebookable">
            {(!data?.topCities || data.topCities.length === 0) ? (
              <Empty>No city data yet.</Empty>
            ) : (
              <div style={{ marginTop: 8 }}>
                {data.topCities.map((c: any) => (
                  <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 120, fontSize: 12, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.city}</div>
                    <div style={{ flex: 1, background: '#EDF1F7', borderRadius: 6, height: 8 }}>
                      <div style={{ width: `${((c.valueUsd || c.count) / maxCityVal) * 100}%`, background: GOLD, height: '100%', borderRadius: 6 }} />
                    </div>
                    <div style={{ width: 96, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>{c.valueUsd != null ? usdShort(c.valueUsd) : num(c.count)}</span>
                      <span style={{ fontSize: 10, color: SLATE, marginLeft: 5 }}>{num(c.count)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 10, textAlign: 'right' }}>value · bookings</div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Tile({ label, value, sub, accent, muted, live }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', borderTop: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: SLATE }}>{label}</span>
        {live && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: GREEN }}>Live</span>}
      </div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: muted ? '#94A3B8' : NAVY, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, color: SLATE, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Panel({ title, badge, children }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</span>
        {badge && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, background: 'rgba(69,137,240,0.1)', padding: '3px 8px', borderRadius: 20 }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: any) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{children}</div>;
}
