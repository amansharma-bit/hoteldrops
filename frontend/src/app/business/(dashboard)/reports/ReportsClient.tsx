'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../../lib/supabase-client';

// ─── This page now reads entirely from the live dashboard endpoint.
// The old grn_rebookings / grn_monthly_summary tables were populated from
// a Mize Excel dump and don't reflect rebuq's own activity.
// Chain / Speed / Supplier Match / Footprint tabs are hidden until rebuq
// has its own rebooking data to populate them.

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE  = '#0093FF';
const NAVY  = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE  = '#E7ECF3';
const BG    = '#F6F8FB';
const GREEN = '#16A34A';
const RED   = '#DC2626';
const AMBER = '#D97706';
const GOLD  = '#F5B833';

const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY    = "'Plus Jakarta Sans',sans-serif";

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

// ─── CHEVRON ──────────────────────────────────────────────────────────────────
function Chevron() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>;
}

// ─── STAT CARD — Dashboard style ─────────────────────────────────────────────
function StatCard({ label, value, sub, fill, pct, valueColor }: {
  label: string; value: string; sub?: string; fill?: string; pct?: number; valueColor?: string;
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: valueColor || NAVY, margin: '8px 0 4px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 500 }}>{sub}</div>}
      {pct !== undefined && fill && (
        <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: fill, borderRadius: 99, transition: 'width 1s cubic-bezier(.2,.7,.3,1)' }}/>
        </div>
      )}
    </div>
  );
}

// ─── CITY TABLE ───────────────────────────────────────────────────────────────
function CityTable({ cities, maxVal }: { cities: any[]; maxVal: number }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ padding: '16px 22px 10px' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY }}>Top cities by rebookable value</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>Live from GRN sync — all refundable bookings with a future check-in</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${LINE}`, background: '#FAFBFD' }}>
            {['#', 'City', '', 'Value', 'Bookings'].map((h, i) => (
              <td key={i} style={{ padding: '10px 22px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: MUTED, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {cities.map((city: any, i: number) => (
            <tr key={city.city} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td style={{ padding: '11px 22px', fontSize: 13, color: MUTED, fontWeight: 700, width: 36 }}>{i + 1}</td>
              <td style={{ padding: '11px 0', fontSize: 14, fontWeight: 600, color: NAVY, width: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.city}</td>
              <td style={{ padding: '11px 22px' }}>
                <div style={{ background: '#F1F3F8', borderRadius: 99, height: 8, overflow: 'hidden', minWidth: 80 }}>
                  <div style={{ width: `${((city.valueUsd || 0) / maxVal) * 100}%`, background: GOLD, height: '100%', borderRadius: 99 }}/>
                </div>
              </td>
              <td style={{ padding: '11px 22px', textAlign: 'right', fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: '-0.3px' }}>{usdShort(city.valueUsd)}</td>
              <td style={{ padding: '11px 22px', textAlign: 'right', fontSize: 13, color: MUTED, fontWeight: 600 }}>{num(city.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CLOSING WINDOW TABLE ─────────────────────────────────────────────────────
function ClosingTable({ closing }: { closing: any }) {
  const rows = [
    { label: 'Next 7 days',  data: closing?.d7,  fill: GOLD  },
    { label: 'Next 30 days', data: closing?.d30, fill: BLUE  },
    { label: 'Next 90 days', data: closing?.d90, fill: BLUE  },
    { label: 'All open',     data: closing?.all, fill: SLATE },
  ];
  const maxVal = closing?.all?.valueUsd || 1;
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ padding: '16px 22px 10px' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY }}>Cancellation window breakdown</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>Rebookable value grouped by how soon the free-cancellation window closes</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${LINE}`, background: '#FAFBFD' }}>
            {['Window', '', 'Value (USD)', 'Bookings'].map((h, i) => (
              <td key={i} style={{ padding: '10px 22px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: MUTED, textAlign: i >= 2 ? 'right' : 'left' }}>{h}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, data, fill }) => (
            <tr key={label} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td style={{ padding: '13px 22px', fontSize: 14, fontWeight: 600, color: NAVY, width: 160 }}>{label}</td>
              <td style={{ padding: '13px 22px', minWidth: 120 }}>
                <div style={{ background: '#F1F3F8', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, ((data?.valueUsd || 0) / maxVal) * 100)}%`, background: fill, height: '100%', borderRadius: 99, transition: 'width 0.8s cubic-bezier(.2,.7,.3,1)' }}/>
                </div>
              </td>
              <td style={{ padding: '13px 22px', textAlign: 'right', fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, color: NAVY, letterSpacing: '-0.3px' }}>{usdShort(data?.valueUsd)}</td>
              <td style={{ padding: '13px 22px', textAlign: 'right', fontSize: 13, color: MUTED, fontWeight: 600 }}>{num(data?.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── COMING SOON PLACEHOLDER ──────────────────────────────────────────────────
function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '56px 32px', textAlign: 'center', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: SLATE, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
        This view will populate once rebuq completes its first rebookings. The data source (Mize historical export) has been retired in favour of live rebuq activity.
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
type ViewType = 'overview' | 'city' | 'closing' | 'rebookings';

const TABS: { id: ViewType; label: string }[] = [
  { id: 'overview',   label: 'Overview'     },
  { id: 'city',       label: 'By City'      },
  { id: 'closing',    label: 'Closing soon' },
  { id: 'rebookings', label: 'Rebookings'   },
];

// ─── MAIN CLIENT ─────────────────────────────────────────────────────────────
export default function ReportsClient(_props: any) {
  const [view, setView]     = useState<ViewType>('overview');
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    const url = isRefresh
      ? `${API_BASE}/api/live-search/dashboard-refresh`
      : `${API_BASE}/api/live-search/dashboard`;
    authenticatedFetch(`${url}?_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { d.error ? setError(d.error) : setData(d); })
      .catch((e: any) => setError('Could not load analytics: ' + e.message))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, []);

  const t          = data?.tiles;
  const closing    = data?.closing;
  const topCities  = data?.topCities || [];
  const maxCityVal = Math.max(1, ...topCities.map((x: any) => x.valueUsd || 0));
  const snapAt     = data?.snapshot?.computedAt;
  const fresh      = snapAt ? new Date(snapAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <BusinessSidebarWrapper>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY }}>

        {/* Header */}
        <div style={{ padding: '32px 40px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: '-0.7px', color: NAVY, margin: 0 }}>Analytics</h1>
            <p style={{ fontSize: 14.5, color: SLATE, marginTop: 4, marginBottom: 0 }}>Live from your GRN bookings — real data, updated every 4 hours.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <button onClick={() => load(true)} disabled={refreshing || loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, background: '#fff', color: NAVY, cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            {fresh && <span style={{ fontSize: 12, color: MUTED }}>Updated {fresh}{data?.snapshot?.stale ? ' · refreshing' : ''}</span>}
          </div>
        </div>

        {error && <div style={{ margin: '14px 40px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 11, padding: '11px 15px', fontSize: 13, color: RED }}>{error}</div>}

        {/* Tab pills */}
        <div style={{ padding: '20px 40px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: view === tab.id ? 'none' : `1px solid ${LINE}`, background: view === tab.id ? BLUE : '#fff', color: view === tab.id ? '#fff' : SLATE, transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 40px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── OVERVIEW ── */}
          {view === 'overview' && (<>
            {/* Hero stat cards — same as Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <StatCard label="Total rebookable value" value={loading ? '—' : usdShort(t?.liveRebookable?.valueUsd)} sub={loading ? '' : `${num(t?.liveRebookable?.count)} live bookings`} fill={BLUE} pct={100} />
              <StatCard label="Expiring in 3 days" value={loading ? '—' : num(t?.expiringSoon?.count)} sub="cancellation windows closing" fill={RED} pct={100} />
              <StatCard label="Checking in (7 days)" value={loading ? '—' : num(t?.checkingIn7?.count)} sub="bookings arriving soon" fill={AMBER} pct={100} />
              <StatCard label="Checking in (30 days)" value={loading ? '—' : num(t?.checkingIn30?.count)} sub="bookings in next month" fill={BLUE} pct={100} />
            </div>

            {/* Rebookings row — honest zeros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <StatCard label="Rebooked this month" value={loading ? '—' : num(t?.caughtThisMonth?.count ?? 0)} sub="rebuq rebookings completed" fill={GREEN} pct={0} />
              <StatCard label="Margin captured" value={loading ? '—' : usdShort(t?.caughtThisMonth?.savedUsd ?? 0)} sub="gross savings from rebookings" fill={GREEN} pct={0} />
              <StatCard label="Conversion" value="—" sub="available once rebookings begin" fill={MUTED} pct={0} valueColor={MUTED} />
            </div>

            {/* Sync info */}
            {data?.sync && (
              <div style={{ fontSize: 12, color: MUTED, display: 'flex', gap: 16 }}>
                <span>GRN sync: <strong style={{ color: NAVY }}>{data.sync.lastStatus || '—'}</strong></span>
                {data.sync.syncedThrough && <span>Synced through: <strong style={{ color: NAVY }}>{String(data.sync.syncedThrough).slice(0, 16).replace('T', ' ')} UTC</strong></span>}
              </div>
            )}
          </>)}

          {/* ── BY CITY ── */}
          {view === 'city' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <StatCard label="Cities tracked" value={loading ? '—' : String(topCities.length)} sub="with live rebookable bookings" fill={BLUE} pct={100} />
              <StatCard label="Top city value" value={loading ? '—' : usdShort(topCities[0]?.valueUsd)} sub={topCities[0]?.city || '—'} fill={GOLD} pct={100} valueColor={AMBER} />
              <StatCard label="Top city bookings" value={loading ? '—' : num(topCities[0]?.count)} sub={topCities[0]?.city || '—'} fill={BLUE} pct={100} />
            </div>
            {loading
              ? <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED }}>Loading…</div>
              : <CityTable cities={topCities} maxVal={maxCityVal} />}
          </>)}

          {/* ── CLOSING SOON ── */}
          {view === 'closing' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <StatCard label="Next 7 days" value={loading ? '—' : usdShort(closing?.d7?.valueUsd)} sub={loading ? '' : `${num(closing?.d7?.count)} bookings`} fill={GOLD} pct={closing?.all?.valueUsd ? Math.round((closing?.d7?.valueUsd / closing?.all?.valueUsd) * 100) : 0} />
              <StatCard label="Next 30 days" value={loading ? '—' : usdShort(closing?.d30?.valueUsd)} sub={loading ? '' : `${num(closing?.d30?.count)} bookings`} fill={BLUE} pct={closing?.all?.valueUsd ? Math.round((closing?.d30?.valueUsd / closing?.all?.valueUsd) * 100) : 0} />
              <StatCard label="Next 90 days" value={loading ? '—' : usdShort(closing?.d90?.valueUsd)} sub={loading ? '' : `${num(closing?.d90?.count)} bookings`} fill={BLUE} pct={closing?.all?.valueUsd ? Math.round((closing?.d90?.valueUsd / closing?.all?.valueUsd) * 100) : 0} />
              <StatCard label="All open" value={loading ? '—' : usdShort(closing?.all?.valueUsd)} sub={loading ? '' : `${num(closing?.all?.count)} bookings`} fill={SLATE} pct={100} />
            </div>
            {loading
              ? <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED }}>Loading…</div>
              : <ClosingTable closing={closing} />}
          </>)}

          {/* ── REBOOKINGS ── */}
          {view === 'rebookings' && (
            <ComingSoon label="Rebooking analytics" />
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </BusinessSidebarWrapper>
  );
}
