'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#4589f0';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
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
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K';
  return '$' + Math.round(n);
}
function num(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load(url: string, isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    authenticatedFetch(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { d.error ? setError(d.error) : setData(d); })
      .catch((e: any) => setError('Could not load dashboard: ' + e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(`${API_BASE}/api/live-search/dashboard`); }, []);

  const t = data?.tiles;
  const c = data?.closing;
  const snapAt = data?.snapshot?.computedAt;
  const fresh = snapAt
    ? new Date(snapAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
  const maxCityVal = Math.max(1, ...(data?.topCities || []).map((x: any) => x.valueUsd || x.count));

  return (
    <BusinessSidebarWrapper>
      <div style={{ height: '100vh', overflow: 'hidden', background: BG, fontFamily: "'Inter',sans-serif", padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>All live rebookable inventory on your GRN book — and what's closing soon.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <button
              onClick={() => load(`${API_BASE}/api/live-search/dashboard-refresh`, true)}
              disabled={refreshing || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, border: `1px solid ${LINE}`, borderRadius: 8,
                padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer',
                background: refreshing ? '#EDF1F7' : '#fff', color: refreshing ? SLATE : NAVY,
              }}
            >
              <span style={{ fontSize: 13 }}>{refreshing ? '↻' : '⟳'}</span>
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            {fresh && <span style={{ fontSize: 11, color: SLATE }}>Updated {fresh}{data?.snapshot?.stale ? ' · refreshing' : ''}</span>}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        {/* HERO — total live rebookable value */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E293B 100%)`, borderRadius: 16, padding: '22px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>Total rebookable value · live</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>
              {loading ? '—' : usd(t?.liveRebookable?.valueUsd)}
              <span style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginLeft: 10 }}>USD · {loading ? '—' : num(t?.liveRebookable?.count)} bookings</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: GOLD }}>{loading ? '—' : num(t?.expiringSoon?.count)}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>expiring within 3 days</div>
          </div>
        </div>

        {/* CLOSING SOON — the wedge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Closing soon</span>
            <span style={{ fontSize: 12, color: SLATE }}>rebookable value by cancellation deadline — money that expires if left unworked</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <ClosingCard label="This week" win={c?.week} loading={loading} accent={GOLD} />
            <ClosingCard label="This month" win={c?.month} loading={loading} accent={BLUE} />
            <ClosingCard label="This quarter" win={c?.quarter} loading={loading} accent={BLUE} />
            <ClosingCard label="This year" win={c?.year} loading={loading} accent={NAVY} />
          </div>
        </div>

        {/* REBOOKINGS SCOREBOARD — the achievement story (fills once live) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Rebookings</span>
            <span style={{ fontSize: 12, color: SLATE }}>what we've captured against the opportunity above</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <ScoreBlock
              label="Rebooked"
              value={loading ? '—' : num(t?.caughtThisMonth?.count ?? 0)}
              sub="bookings moved to a lower rate"
              bg={`linear-gradient(135deg, ${BLUE} 0%, #3576dd 100%)`}
              fg="#fff"
            />
            <ScoreBlock
              label="Revenue"
              value={loading ? '—' : usd(t?.caughtThisMonth?.savedUsd ?? 0)}
              sub="extra margin generated"
              bg={`linear-gradient(135deg, ${GREEN} 0%, #12833e 100%)`}
              fg="#fff"
            />
            <ScoreBlock
              label="Rebooked GMV"
              value={loading ? '—' : usdShort(0)}
              sub={`of ${loading ? '—' : usdShort(t?.liveRebookable?.valueUsd)} rebookable`}
              bg={`linear-gradient(135deg, ${NAVY} 0%, #1E293B 100%)`}
              fg="#fff"
            />
            <ScoreBlock
              label="Conversion"
              value={loading ? '—' : '0%'}
              sub="rebooked ÷ opportunity"
              bg={`linear-gradient(135deg, ${GOLD} 0%, #e0a52a 100%)`}
              fg="#3d2c00"
            />
          </div>
        </div>

        {/* Top cities — full width */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Top cities by rebookable value</span>
            <span style={{ fontSize: 11, color: SLATE }}>value · bookings</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 44px', alignContent: 'start' }}>
            {(!data?.topCities || data.topCities.length === 0) ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No city data yet.</div>
            ) : (
              data.topCities.slice(0, 8).map((city: any) => (
                <div key={city.city} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
                  <div style={{ width: 118, flexShrink: 0, fontSize: 12, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.city}</div>
                  <div style={{ flex: 1, minWidth: 40, background: '#EDF1F7', borderRadius: 6, height: 8 }}>
                    <div style={{ width: `${((city.valueUsd || city.count) / maxCityVal) * 100}%`, background: GOLD, height: '100%', borderRadius: 6 }} />
                  </div>
                  <div style={{ width: 92, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: 13, color: NAVY, fontWeight: 700 }}>{usdShort(city.valueUsd)}</span>
                    <span style={{ fontSize: 11, color: SLATE, marginLeft: 6 }}>{num(city.count)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function ScoreBlock({ label, value, sub, bg, fg }: any) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '18px 20px', color: fg }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.85 }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ClosingCard({ label, win, loading, accent }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 8 }}>
        {loading ? '—' : usdShort(win?.valueUsd)}
      </div>
      <div style={{ fontSize: 12, color: SLATE, marginTop: 3 }}>{loading ? '' : `${num(win?.count)} bookings`}</div>
    </div>
  );
}
