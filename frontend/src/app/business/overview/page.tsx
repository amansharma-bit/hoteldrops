'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch, supabase } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
const SLATE = '#64748B';
const FAINT = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';

const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY = "'Plus Jakarta Sans',sans-serif";

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

  const allVal = c?.all?.valueUsd || 0;
  const pct = (v: number | undefined) => (allVal ? Math.min(100, Math.round(((v || 0) / allVal) * 100)) : 0);

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY, padding: '30px 40px 56px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1520 }}>
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', color: NAVY, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 15, color: SLATE, marginTop: 4 }}>Every live booking still open to a better rate — and what&apos;s closing before you can act.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <button
              onClick={() => load(`${API_BASE}/api/live-search/dashboard-refresh`, true)}
              disabled={refreshing || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${LINE}`, borderRadius: 12,
                padding: '11px 16px', fontSize: 14, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer',
                background: refreshing ? '#EDF1F7' : '#fff', color: refreshing ? SLATE : NAVY, boxShadow: '0 1px 2px rgba(16,24,40,.04)',
              }}
            >
              <span style={{ fontSize: 14 }}>{refreshing ? '↻' : '⟳'}</span>
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            {fresh && <span style={{ fontSize: 13, color: FAINT }}>Updated {fresh}{data?.snapshot?.stale ? ' · refreshing' : ''}</span>}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        {/* HERO — total live rebookable value */}
        <div style={{ background: 'linear-gradient(120deg,#0D1526,#16223B)', borderRadius: 20, padding: '30px 34px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 22, boxShadow: '0 18px 40px -22px rgba(13,21,38,.5)' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(255,255,255,.62)' }}>Total rebookable value · live</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 58, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, margin: '12px 0 10px' }}>
              {t?.liveRebookable?.valueUsd == null
                ? '—'
                : <><span style={{ fontSize: '0.62em', fontWeight: 800, color: 'rgba(255,255,255,.85)', marginRight: 2 }}>$</span>{Math.round(t.liveRebookable.valueUsd).toLocaleString('en-US')}</>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,.72)' }}>USD · <b style={{ color: '#fff', fontWeight: 700 }}>{loading ? '—' : num(t?.liveRebookable?.count)}</b> bookings</div>
          </div>
          <a href="/business/bookings" style={{ textDecoration: 'none', textAlign: 'right', background: 'rgba(245,184,51,.1)', border: '1px solid rgba(245,184,51,.32)', borderRadius: 16, padding: '20px 26px', display: 'block' }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 48, color: GOLD, lineHeight: 1 }}>{loading ? '—' : num(t?.expiringSoon?.count)}</div>
            <div style={{ color: 'rgba(255,255,255,.72)', fontSize: 13.5, marginTop: 6 }}>expiring within 3 days</div>
            <div style={{ color: GOLD, fontSize: 12.5, fontWeight: 700, marginTop: 10, letterSpacing: '.3px' }}>Open worklist →</div>
          </a>
        </div>

        {/* CLOSING SOON — the wedge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 15, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: NAVY }}>Closing soon</span>
            <span style={{ fontSize: 14, color: SLATE }}>Rebookable value grouped by how soon its free-cancellation window closes. Once that window passes, the rate is locked and the saving is gone.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <ClosingCard label="Next 7 days" win={c?.d7} loading={loading} fill={GOLD} pct={pct(c?.d7?.valueUsd)} />
            <ClosingCard label="Next 30 days" win={c?.d30} loading={loading} fill={BLUE} pct={pct(c?.d30?.valueUsd)} />
            <ClosingCard label="Next 90 days" win={c?.d90} loading={loading} fill={BLUE} pct={pct(c?.d90?.valueUsd)} />
            <ClosingCard label="All open" win={c?.all} loading={loading} fill="#334155" pct={100} />
          </div>
        </div>

        {/* REBOOKINGS — the achievement story (fills once live) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 15 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: NAVY }}>Rebookings</span>
            <span style={{ fontSize: 14, color: SLATE }}>How much of the value above you&apos;ve actually moved to a lower rate.</span>
          </div>

          {/* rebookings-per-day chart — real data */}
          <RebookingsPerDay />

          {/* KPI strip — white, with Conversion as the single highlight */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
            <Kpi label="Rebooked" value={loading ? '—' : num(t?.caughtThisMonth?.count ?? 0)} sub="bookings moved to a lower rate" />
            <Kpi label="Revenue" value={loading ? '—' : usd(t?.caughtThisMonth?.savedUsd ?? 0)} sub="extra margin generated" />
            <Kpi label="Rebooked GMV" value={loading ? '—' : usdShort(0)} sub={`of ${loading ? '—' : usdShort(t?.liveRebookable?.valueUsd)} rebookable`} progress={0} />
            <Kpi label="Conversion" value={loading ? '—' : '0%'} sub="rebooked ÷ opportunity" hot />
          </div>
        </div>

        {/* Top cities — full width */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '26px 28px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px', color: NAVY }}>Top cities by rebookable value</span>
            <span style={{ fontSize: 13, color: FAINT, fontWeight: 600 }}>value · bookings</span>
          </div>
          <div>
            {(!data?.topCities || data.topCities.length === 0) ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: FAINT, fontSize: 13 }}>No city data yet.</div>
            ) : (
              data.topCities.slice(0, 10).map((city: any, i: number) => (
                <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '26px 175px 1fr auto', alignItems: 'center', gap: 16, padding: '9px 0' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: FAINT, textAlign: 'right' }}>{i + 1}</div>
                  <div style={{ fontSize: 15, color: NAVY, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.city}</div>
                  <div style={{ background: '#F1F3F8', borderRadius: 99, height: 9, overflow: 'hidden' }}>
                    <div style={{ width: `${((city.valueUsd || city.count) / maxCityVal) * 100}%`, background: GOLD, height: '100%', borderRadius: 99 }} />
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 16, color: NAVY, fontWeight: 800, letterSpacing: '-0.3px' }}>{usdShort(city.valueUsd)}</span>
                    <span style={{ fontSize: 13, color: FAINT, fontWeight: 600, marginLeft: 8 }}>{num(city.count)}</span>
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
    background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
    padding: '24px 26px 18px', boxShadow: '0 1px 2px rgba(16,24,40,.03)',
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
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', color: NAVY, margin: 0 }}>Rebookings per day</h3>
          <p style={{ color: SLATE, fontSize: 13.5, marginTop: 3 }}>bookings moved to a lower rate · last {DAYS} days</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
          {totalRebooked} <span style={{ color: FAINT, fontWeight: 600 }}>rebooked</span>
          <span style={{ color: '#CBD5E1', margin: '0 7px' }}>·</span>
          ${Math.round(totalSaved).toLocaleString('en-US')} <span style={{ color: FAINT, fontWeight: 600 }}>saved</span>
        </span>
      </div>

      <div style={{ position: 'relative', height: 210, marginTop: 22, paddingLeft: 34 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 26, width: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {ticks.map((tk, i) => (
            <span key={i} style={{ fontSize: 11, color: FAINT, fontWeight: 600, textAlign: 'right', transform: 'translateY(-6px)' }}>{Math.round(tk)}</span>
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
            <div key={r.day} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: FAINT, fontWeight: 600 }}>{new Date(r.day).getUTCDate()}</div>
          ))}
        </div>
      </div>

      <div style={{ color: SLATE, fontSize: 13, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F3F8' }}>
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
    <div style={{ background: hot ? GOLD : '#fff', border: `1px solid ${hot ? '#E0A52A' : LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: hot ? '#7A5A00' : SLATE }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', marginTop: 8, color: hot ? '#231600' : NAVY }}>{value}</div>
      <div style={{ fontSize: 13, color: hot ? '#7A5A00' : FAINT, fontWeight: 500, marginTop: 4 }}>{sub}</div>
      {progress !== undefined && (
        <div style={{ height: 7, borderRadius: 99, background: '#F1F3F8', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: BLUE, borderRadius: 99 }} />
        </div>
      )}
    </div>
  );
}

function ClosingCard({ label, win, loading, fill, pct }: any) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: NAVY, margin: '8px 0 4px' }}>
        {loading ? '—' : usdShort(win?.valueUsd)}
      </div>
      <div style={{ fontSize: 13, color: FAINT, fontWeight: 500 }}>{loading ? '' : `${num(win?.count)} bookings`}</div>
      <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${loading ? 0 : pct}%`, background: fill, borderRadius: 99, transition: 'width 1s cubic-bezier(.2,.7,.3,1)' }} />
      </div>
    </div>
  );
}
