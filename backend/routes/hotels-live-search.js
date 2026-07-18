'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

// Brand tokens (existing rebuq identity)
const NAVY = '#0F172A';
const BLUE = '#1447b8';
const GOLD = '#FCD34D';
const GREEN = '#16A34A';
const SLATE = '#64748B';
const LINE = '#E2E8F0';
const BG = '#F8FAFC';

function usd(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function num(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authenticatedFetch(`${API_BASE}/api/live-search/dashboard?_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load dashboard: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const t = data?.tiles;
  const fresh = data?.sync?.syncedThrough
    ? new Date(data.sync.syncedThrough).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  const maxTrend = Math.max(1, ...(data?.dailyTrend || []).map((d: any) => d.count));
  const maxCity = Math.max(1, ...(data?.topCities || []).map((c: any) => c.count));

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>Overview</h1>
              <p style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>Your live GRN book, and where money can still be caught.</p>
            </div>
            <span style={{ fontSize: 12, color: SLATE }}>
              {loading ? 'Loading…' : fresh ? <>Synced through <strong style={{ color: NAVY }}>{fresh}</strong></> : ''}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ margin: '20px 32px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        {/* HERO — the money still on the table */}
        <div style={{ padding: '24px 32px 0' }}>
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #1E293B 100%)`,
            borderRadius: 18, padding: '28px 32px', color: '#fff',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>Live rebookable value</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 46, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>
                {loading ? '—' : usd(t?.liveRebookable?.valueUsd)}
                <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', marginLeft: 10 }}>USD</span>
              </div>
              <div style={{ fontSize: 14, color: '#CBD5E1', marginTop: 6 }}>
                across <strong style={{ color: '#fff' }}>{loading ? '—' : num(t?.liveRebookable?.count)}</strong> bookings still open to cancel &amp; rebook
                {t?.liveRebookable?.valueBasis === 'capped' && <span style={{ color: GOLD, marginLeft: 8, fontSize: 12 }}>(estimated)</span>}
              </div>
            </div>
            {/* urgency rail */}
            <div style={{ display: 'flex', gap: 28 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: GOLD }}>{loading ? '—' : num(t?.expiringSoon?.count)}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>expiring in {t?.expiringSoon?.windowDays ?? 3}d</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff' }}>{loading ? '—' : num(t?.checkingIn7?.count)}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>check in ≤7d</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY tiles */}
        <div style={{ padding: '20px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Tile label="Checking in ≤30 days" value={loading ? '—' : num(t?.checkingIn30?.count)} sub="imminent revenue" accent={BLUE} />
          <Tile label="Live inventory" value={loading ? '—' : num(t?.liveRebookable?.count)} sub="still cancellable" accent={NAVY} />
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
          {/* Daily trend */}
          <Panel title="Refundable bookings · last 30 days">
            {(!data?.dailyTrend || data.dailyTrend.length === 0) ? (
              <Empty>No booking activity in this window yet.</Empty>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, marginTop: 8 }}>
                {data.dailyTrend.map((d: any) => (
                  <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ height: `${(d.count / maxTrend) * 100}%`, background: BLUE, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Top cities */}
          <Panel title="Top cities · live rebookable">
            {(!data?.topCities || data.topCities.length === 0) ? (
              <Empty>No city data yet.</Empty>
            ) : (
              <div style={{ marginTop: 4 }}>
                {data.topCities.map((c: any) => (
                  <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <div style={{ width: 110, fontSize: 12, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.city}</div>
                    <div style={{ flex: 1, background: '#EEF2F7', borderRadius: 6, height: 8 }}>
                      <div style={{ width: `${(c.count / maxCity) * 100}%`, background: GOLD, height: '100%', borderRadius: 6 }} />
                    </div>
                    <div style={{ width: 44, textAlign: 'right', fontSize: 12, color: SLATE, fontVariantNumeric: 'tabular-nums' }}>{num(c.count)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Tile({ label, value, sub, accent, muted }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: muted ? '#94A3B8' : NAVY, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, color: SLATE, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: any) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{children}</div>;
}
