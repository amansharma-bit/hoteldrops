'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#4589f0';
const NAVY = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';

function fmtTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const RESULT_META: Record<string, { label: string; bg: string; fg: string }> = {
  drop_actionable:      { label: 'Drop · same room', bg: '#DCFCE7', fg: GREEN },
  drop_different_room:  { label: 'Drop · diff room', bg: '#FEF3C7', fg: AMBER },
  no_drop:              { label: 'No drop',          bg: '#F1F5F9', fg: SLATE },
  higher:               { label: 'Higher now',       bg: '#FEF2F2', fg: RED },
  sold_out:             { label: 'Sold out',         bg: '#FEF3C7', fg: AMBER },
};

export default function SearchesMadePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/searches?page=${page}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load searches: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const f = data?.funnel;
  const rows = data?.rows || [];
  const hasMore = data?.hasMore ?? false;
  const convRate = f && f.totalChecks ? Math.round((f.actionableDrops / f.totalChecks) * 100) : 0;

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '26px 32px 0' }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Searches made</h1>
          <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Every live price check, and what it found. This is the conversion story.</p>
        </div>

        {error && (
          <div style={{ margin: '18px 32px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Funnel */}
        <div style={{ padding: '20px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          <Stat label="Searches made" value={loading ? '—' : String(f?.totalChecks ?? 0)} sub="price checks run" accent={NAVY} />
          <Stat label="Bookings checked" value={loading ? '—' : String(f?.bookingsChecked ?? 0)} sub="distinct bookings" accent={BLUE} />
          <Stat label="Drops found" value={loading ? '—' : String(f?.dropsFound ?? 0)} sub="cheaper somewhere" accent={AMBER} />
          <Stat label="Actionable" value={loading ? '—' : String(f?.actionableDrops ?? 0)} sub="same room, cheaper" accent={GREEN} />
          <Stat label="Conversion" value={loading ? '—' : `${convRate}%`} sub="actionable ÷ searches" accent={GREEN} money />
        </div>

        {/* List */}
        <div style={{ padding: '20px 32px 40px' }}>
          <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 150px 110px 110px 110px 130px', gap: 14, padding: '13px 20px', borderBottom: `0.5px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booking', 'Result', 'Original', 'Live', 'Gap', 'Checked'].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: (i === 2 || i === 3 || i === 4) ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>No price checks yet. Run some from the Repricing page.</div>
            ) : (
              rows.map((r: any) => {
                const meta = RESULT_META[r.result] || RESULT_META.no_drop;
                return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 150px 110px 110px 110px 130px', gap: 14, padding: '13px 20px', alignItems: 'center', borderBottom: `0.5px solid ${LINE}` }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                      <div style={{ fontSize: 11.5, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.room].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <div><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: meta.bg, color: meta.fg, whiteSpace: 'nowrap' }}>{meta.label}</span></div>
                    <div style={{ textAlign: 'right', fontSize: 13, color: NAVY, fontFamily: 'monospace' }}>{r.originalUsd != null ? `$${r.originalUsd.toLocaleString()}` : '—'}</div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: r.dropped ? GREEN : NAVY, fontFamily: 'monospace' }}>{r.liveUsd != null ? `$${r.liveUsd.toLocaleString()}` : '—'}</div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: r.dropped ? GREEN : MUTED }}>
                      {r.dropped && r.gapUsd != null ? `−$${Math.round(r.gapUsd)}` : '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: SLATE }}>{fmtTime(r.checkedAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page} · {data?.total ?? 0} checks</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore} style={{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Stat({ label, value, sub, accent, money }: any) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: money ? GREEN : NAVY, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: SLATE, marginTop: 3 }}>{sub}</div>
    </div>
  );
}
