'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0F52BA';
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

const MATCH_BASIS_LABEL: Record<string, string> = {
  room_code: 'Exact room match',
  room_name: 'Matched by room name',
  cheapest_fallback: 'Different room — cheapest available',
};

export default function SearchesMadePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  function toggleExpand(id: string) {
    setExpanded((e) => (e === id ? null : id));
  }

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
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 150px 110px 110px 110px 130px 28px', gap: 14, padding: '13px 20px', borderBottom: `0.5px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booking', 'Result', 'Original', 'Live', 'Gap', 'Checked', ''].map((h, i) => (
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
                const isOpen = expanded === r.id;
                return (
                  <div key={r.id} style={{ borderBottom: `0.5px solid ${LINE}` }}>
                    <div
                      onClick={() => toggleExpand(r.id)}
                      style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 150px 110px 110px 110px 130px 28px', gap: 14, padding: '13px 20px', alignItems: 'center', cursor: 'pointer' }}
                    >
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
                      <div style={{ textAlign: 'center', color: MUTED, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    {/*
                      Expanded detail — real data, one atomic check, no invented
                      pipeline stages. This mirrors the same Original-vs-Live
                      comparison already used on the Repricing page, using the
                      match fields the backend already computes and stores
                      (room_match / board_match / dates_match / match basis).
                    */}
                    <div style={{ maxHeight: isOpen ? 900 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease', background: '#FBFCFE' }}>
                      {isOpen && (
                        <div style={{ padding: '18px 20px 22px', borderTop: `0.5px solid ${LINE}` }}>
                          {r.matchBasis && MATCH_BASIS_LABEL[r.matchBasis] && (
                            <MatchBadge basis={r.matchBasis} />
                          )}
                          <Compare r={r} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page} · {data?.total ?? 0} checks</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpanded(null); }} disabled={page === 1} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => { setPage((p) => p + 1); setExpanded(null); }} disabled={!hasMore} style={{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function MatchBadge({ basis }: { basis: string }) {
  const label = MATCH_BASIS_LABEL[basis];
  if (!label) return null;
  let bg = '#F1F5F9', fg = SLATE;
  if (basis === 'room_code') { bg = '#DCFCE7'; fg = GREEN; }
  else if (basis === 'room_name') { bg = '#DBEAFE'; fg = '#1E50A8'; }
  else if (basis === 'cheapest_fallback') { bg = '#FEF3C7'; fg = AMBER; }
  return <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: bg, color: fg, marginBottom: 12 }}>{label}</div>;
}

function Compare({ r }: { r: any }) {
  const Row = ({ label, o, l, ok }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 12, fontSize: 12.5, padding: '6px 0', borderBottom: `0.5px solid ${LINE}`, alignItems: 'center' }}>
      <span style={{ color: SLATE }}>{label}</span>
      <span style={{ color: NAVY }}>{o}</span>
      <span style={{ color: NAVY, display: 'flex', alignItems: 'center', gap: 5 }}>
        {l}
        {ok === true && <span style={{ color: GREEN, fontSize: 13 }}>✓</span>}
        {ok === false && <span style={{ color: AMBER, fontSize: 13 }}>≠</span>}
      </span>
    </div>
  );
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: MUTED, paddingBottom: 4 }}>
        <span></span><span>Original</span><span>Live</span>
      </div>
      <Row
        label="Price"
        o={r.originalUsd != null ? `$${r.originalUsd.toLocaleString()}${r.originalLocal ? ` (${r.originalCurrency} ${r.originalLocal.toLocaleString()})` : ''}` : '—'}
        l={r.liveUsd != null ? `$${r.liveUsd.toLocaleString()}${r.liveLocal ? ` (${r.liveCurrency} ${r.liveLocal.toLocaleString()})` : ''}` : (r.result === 'sold_out' ? 'Sold out' : '—')}
      />
      <Row label="Room" o={r.room || '—'} l={r.liveRoom || '—'} ok={r.roomMatch} />
      <Row label="Board" o="—" l={r.liveBoard || '—'} ok={r.boardMatch} />
      <Row label="Dates" o="same" l={r.datesMatch ? 'confirmed same' : 'differs'} ok={r.datesMatch} />
      <div style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>Checked {fmtTime(r.checkedAt)}</div>
    </div>
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
