'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch, supabase } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
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
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif", padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Every live booking still open to a better rate — and what&apos;s closing before you can act.</p>
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Closing soon</span>
            <span style={{ fontSize: 12, color: SLATE }}>Rebookable value grouped by how soon its free-cancellation window closes. Once that window passes, the rate is locked and the saving is gone.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <ClosingCard label="Next 7 days" win={c?.d7} loading={loading} accent={GOLD} />
            <ClosingCard label="Next 30 days" win={c?.d30} loading={loading} accent={BLUE} />
            <ClosingCard label="Next 90 days" win={c?.d90} loading={loading} accent={BLUE} />
            <ClosingCard label="All open" win={c?.all} loading={loading} accent={NAVY} />
          </div>
        </div>

        {/* REBOOKINGS — the achievement story (fills once live) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Rebookings</span>
            <span style={{ fontSize: 12, color: SLATE }}>How much of the value above you&apos;ve actually moved to a lower rate.</span>
          </div>

          {/* rebookings-per-day chart — real data */}
          <RebookingsPerDay />

          {/* KPI strip — white, with Conversion as the single highlight */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
            <Kpi label="Rebooked" value={loading ? '—' : num(t?.caughtThisMonth?.count ?? 0)} sub="bookings moved to a lower rate" />
            <Kpi label="Revenue" value={loading ? '—' : usd(t?.caughtThisMonth?.savedUsd ?? 0)} sub="extra margin generated" />
            <Kpi label="Rebooked GMV" value={loading ? '—' : usdShort(0)} sub={`of ${loading ? '—' : usdShort(t?.liveRebookable?.valueUsd)} rebookable`} progress={0} />
            <Kpi label="Conversion" value={loading ? '—' : '0%'} sub="rebooked ÷ opportunity" hot />
          </div>
        </div>

        {/* Top cities — full width */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>Top cities by rebookable value</span>
            <span style={{ fontSize: 11, color: SLATE }}>value · bookings</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {(!data?.topCities || data.topCities.length === 0) ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No city data yet.</div>
            ) : (
              data.topCities.slice(0, 10).map((city: any, i: number) => (
                <div key={city.city} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
                  <div style={{ width: 20, flexShrink: 0, fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: '#94A3B8', textAlign: 'right' }}>{i + 1}</div>
                  <div style={{ width: 150, flexShrink: 0, fontSize: 13, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.city}</div>
                  <div style={{ flex: 1, minWidth: 60, background: '#EDF1F7', borderRadius: 6, height: 9 }}>
                    <div style={{ width: `${((city.valueUsd || city.count) / maxCityVal) * 100}%`, background: GOLD, height: '100%', borderRadius: 6 }} />
                  </div>
                  <div style={{ width: 110, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, color: NAVY, fontWeight: 700 }}>{usdShort(city.valueUsd)}</span>
                    <span style={{ fontSize: 12, color: SLATE, marginLeft: 8 }}>{num(city.count)}</span>
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

/* ---------- Rebookings per day (real data, same file) ---------- */

type RbRow = { day: string; rebooked: number; saved_usd: number };

function RebookingsPerDay() {
  const DAYS = 14;
  const [rows, setRows] = useState<RbRow[] | null>(null);
  const [err, setErr] = useState<string>('');
  const [grow, setGrow] = useState(false);

  useEffect(() => {
    supabase
      .rpc('rebookings_daily', { days: DAYS })
      .then(({ data, error }: { data: RbRow[] | null; error: any }) => {
        if (error) { setErr(error.message); setRows([]); return; }
        setRows(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (rows) { const tm = setTimeout(() => setGrow(true), 60); return () => clearTimeout(tm); }
  }, [rows]);

  const chartCard: React.CSSProperties = {
    background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14,
    padding: '20px 22px 16px', boxShadow: '0 1px 2px rgba(16,24,40,.03)',
  };

  if (rows === null) {
    return <div style={chartCard}><p style={{ fontSize: 13, color: SLATE }}>Loading rebookings…</p></div>;
  }

  const counts = rows.map((r) => r.rebooked);
  const maxVal = Math.max(0, ...counts);
  const axisMax = Math.max(6, Math.ceil(maxVal / 6) * 6);
  const totalRebooked = counts.reduce((a, b) => a + b, 0);
  const totalSaved = rows.reduce((a, b) => a + Number(b.saved_usd || 0), 0);
  const avg = rows.length ? totalRebooked / rows.length : 0;
  const isEmpty = maxVal === 0;
  const ticks = [axisMax, (axisMax * 3) / 4, axisMax / 2, axisMax / 4, 0];

  return (
    <div style={chartCard}>
      <style>{`
        .rb-col { transition: height .8s cubic-bezier(.2,.7,.3,1); }
        .rb-col:hover { filter: brightness(1.08); }
        .rb-col:hover .rb-tip { opacity:1; }
        @media (prefers-reduced-motion: reduce){ .rb-col{ transition:none } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 15, color: NAVY, margin: 0 }}>Rebookings per day</h3>
          <p style={{ color: SLATE, fontSize: 12, marginTop: 3 }}>bookings moved to a lower rate · last {DAYS} days</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
          {totalRebooked} <span style={{ color: '#94A3B8', fontWeight: 600 }}>rebooked</span>
          <span style={{ color: '#CBD5E1', margin: '0 7px' }}>·</span>
          ${Math.round(totalSaved).toLocaleString('en-US')} <span style={{ color: '#94A3B8', fontWeight: 600 }}>saved</span>
        </span>
      </div>

      <div style={{ position: 'relative', height: 200, marginTop: 20, paddingLeft: 34 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 26, width: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {ticks.map((tk, i) => (
            <span key={i} style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textAlign: 'right', transform: 'translateY(-6px)' }}>{Math.round(tk)}</span>
          ))}
        </div>

        <div style={{ position: 'absolute', left: 34, right: 0, top: 0, bottom: 26 }}>
          {[0, 25, 50, 75, 100].map((p) => (
            <i key={p} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: '#F1F3F8', display: 'block' }} />
          ))}
        </div>

        {!isEmpty && (
          <div style={{ position: 'absolute', left: 34, right: 0, top: `${(1 - avg / axisMax) * 100}%`, borderTop: '1.5px dashed #C3CCDB' }}>
            <span style={{ position: 'absolute', right: 0, top: -9, fontSize: 11, fontWeight: 700, color: SLATE, background: '#fff', padding: '0 6px' }}>
              avg {avg.toFixed(avg < 10 ? 1 : 0)}/day
            </span>
          </div>
        )}

        <div style={{ position: 'absolute', left: 34, right: 0, top: 0, bottom: 26, display: 'flex', alignItems: 'flex-end', gap: 9 }}>
          {rows.map((r, i) => {
            const h = grow ? (r.rebooked / axisMax) * 100 : 0;
            return (
              <div key={r.day} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                <div className="rb-col" style={{ width: '100%', maxWidth: 34, borderRadius: '6px 6px 0 0', background: BLUE, height: `${h}%`, position: 'relative', transitionDelay: `${i * 45}ms` }}>
                  <span className="rb-tip" style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', background: NAVY, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6, opacity: 0, whiteSpace: 'nowrap', transition: 'opacity .15s' }}>
                    {r.rebooked} rebooked
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 34, right: 0, bottom: 0, height: 22, display: 'flex', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.day} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>{new Date(r.day).getUTCDate()}</div>
          ))}
        </div>
      </div>

      <div style={{ color: SLATE, fontSize: 12.5, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F3F8' }}>
        {err ? (
          <span style={{ color: '#B91C1C' }}>Couldn&apos;t load rebookings ({err}).</span>
        ) : isEmpty ? (
          <><b style={{ color: NAVY }}>No rebookings in the last {DAYS} days yet.</b> Each bar fills the day the engine confirms a replacement booking.</>
        ) : (
          <>Live data · updates as the engine confirms replacement bookings.</>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, hot, progress }: any) {
  return (
    <div style={{ background: hot ? GOLD : '#fff', border: `1px solid ${hot ? '#E0A52A' : LINE}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: hot ? '#7A5A00' : SLATE }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, marginTop: 8, color: hot ? '#3D2C00' : NAVY }}>{value}</div>
      <div style={{ fontSize: 12, color: hot ? '#7A5A00' : SLATE, marginTop: 4 }}>{sub}</div>
      {progress !== undefined && (
        <div style={{ height: 6, borderRadius: 99, background: '#EDF1F7', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: BLUE, borderRadius: 99 }} />
        </div>
      )}
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
