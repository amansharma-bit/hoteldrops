'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const SAPPHIRE = '#0F52BA';
const NAVY = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';

function fmtDate(d: string | null, withYear = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

const TABS = [
  { key: 'successful', label: 'Successful' },
  { key: 'errors', label: 'Errors' },
  { key: 'all', label: 'All attempts' },
];

export default function RebookingsPage() {
  const [tab, setTab] = useState('successful');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/rebookings?status=${tab}&page=${page}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load rebookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, page]);

  const rows = data?.rows || [];
  const counts = data?.counts || { successful: 0, errors: 0, all: 0 };
  const hasMore = data?.hasMore ?? false;

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '26px 32px 0' }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Rebookings</h1>
          <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Every rebooking rebuq has completed — original price, rebooked price, and what it saved.</p>
        </div>

        {/* Tabs */}
        <div style={{ padding: '20px 32px 0', display: 'flex', gap: 4, borderBottom: `1px solid ${LINE}`, marginBottom: 0 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = t.key === 'all' ? counts.all : t.key === 'successful' ? counts.successful : counts.errors;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} style={{
                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                padding: '10px 16px', color: active ? SAPPHIRE : SLATE, borderBottom: active ? `2px solid ${SAPPHIRE}` : '2px solid transparent',
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                {t.label}
                <span style={{ fontSize: 11, fontWeight: 700, background: active ? '#E6F0FB' : '#F1F5F9', color: active ? SAPPHIRE : MUTED, padding: '1px 8px', borderRadius: 20 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ margin: '18px 32px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Content */}
        <div style={{ padding: '24px 32px 40px' }}>
          {loading ? (
            <div style={{ padding: '70px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading…</div>
          ) : rows.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 110px 110px 110px 110px 120px', gap: 14, padding: '13px 20px', borderBottom: `0.5px solid ${LINE}`, background: '#FBFCFE' }}>
                {['Booking', 'Check-in', 'Original', 'Rebooked', 'Saved', 'Status'].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: (i >= 2 && i <= 4) ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
              {rows.map((r: any) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 110px 110px 110px 110px 120px', gap: 14, padding: '14px 20px', alignItems: 'center', borderBottom: `0.5px solid ${LINE}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                    <div style={{ fontSize: 12, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.room].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  <div style={{ fontSize: 13, color: NAVY }}>{fmtDate(r.checkin)}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: NAVY, fontFamily: 'monospace' }}>{r.originalUsd != null ? `$${r.originalUsd.toLocaleString()}` : '—'}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: NAVY, fontFamily: 'monospace' }}>{r.rebookedUsd != null ? `$${r.rebookedUsd.toLocaleString()}` : '—'}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: GREEN }}>{r.savedUsd != null ? `−$${r.savedUsd.toLocaleString()}` : '—'}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: r.status === 'confirmed' || r.status === 'success' ? '#DCFCE7' : '#FEF2F2', color: r.status === 'confirmed' || r.status === 'success' ? GREEN : RED }}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore} style={{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : SAPPHIRE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E6F0FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SAPPHIRE} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY, margin: 0 }}>No rebookings yet</h3>
      <p style={{ fontSize: 13.5, color: SLATE, marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        When a price check finds a genuine like-for-like saving and it's rebooked, it'll appear here with the original price, the rebooked price, and the margin captured. Start by checking prices on the Repricing page.
      </p>
    </div>
  );
}
