'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

// Bump this string on every deploy of this file. It renders next to the page
// title, so "did my deploy actually land?" is answered by looking at the page
// instead of guessing at Vercel and browser caches.
const BUILD = 'v9 · badge + policy fixes';

const BLUE = '#0F52BA';
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
function fmtTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function daysUntil(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
}
function policyLabel(nonRef: boolean | null | undefined, cancelBy?: string | null) {
  if (nonRef === true) return 'Non-refundable';
  if (nonRef === false) return cancelBy ? `Refundable until ${fmtDate(cancelBy)}` : 'Refundable';
  return 'Not stated';
}

export default function RepricingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [citySearch, setCitySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [minDays, setMinDays] = useState(7);
  const [sortMode, setSortMode] = useState<'runway' | 'deadline'>('deadline');
  const [checking, setChecking] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({}); // live check results this session
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [rebooking, setRebooking] = useState<string | null>(null);
  const [rebookResult, setRebookResult] = useState<Record<string, any>>({});

  useEffect(() => {
    const id = setTimeout(() => { setCityQuery(citySearch.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [citySearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const cityParam = cityQuery ? `&city=${encodeURIComponent(cityQuery)}` : '';
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?page=${page}${cityParam}&min_days=${minDays}&sort=${sortMode}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (cancelled) return;
        if (d.error) { setError(d.error); return; }
        setRows(d.rows || []); setHasMore(d.hasMore); setTotal(d.total || 0);
      })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, cityQuery, minDays, sortMode]);

  async function checkPrice(bookingId: string) {
    setChecking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const d = await r.json();
      if (d.error) { setResults((p) => ({ ...p, [bookingId]: { error: d.error } })); }
      else { setResults((p) => ({ ...p, [bookingId]: d })); loadHistory(bookingId); }
    } catch (e: any) {
      setResults((p) => ({ ...p, [bookingId]: { error: e.message } }));
    } finally {
      setChecking(null);
    }
  }

  async function doRebook(bookingId: string) {
    const ok = window.confirm('This will book the new rate and cancel the original. Continue?');
    if (!ok) return;
    setRebooking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/rebook`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const d = await r.json();
      setRebookResult((p) => ({ ...p, [bookingId]: d }));
      if (d.status === 'confirmed' || r.status === 207) {
        loadHistory(bookingId);
      }
    } catch (e: any) {
      setRebookResult((p) => ({ ...p, [bookingId]: { error: e.message } }));
    } finally {
      setRebooking(null);
    }
  }

  async function loadHistory(bookingId: string) {
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/history?booking_id=${encodeURIComponent(bookingId)}&_t=${Date.now()}`);
      const d = await r.json();
      setHistory((p) => ({ ...p, [bookingId]: d.checks || [] }));
    } catch { /* ignore */ }
  }

  function toggleExpand(bookingId: string) {
    const next = expanded === bookingId ? null : bookingId;
    setExpanded(next);
    if (next && !history[next]) loadHistory(next);
  }

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '26px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Repricing</h1>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: MUTED, background: '#EEF2F7', border: `1px solid ${LINE}`, borderRadius: 20, padding: '3px 9px' }}>{BUILD}</span>
            </div>
            <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Check a booking's live price against what was paid. One booking at a time.</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '0 1 260px' }}>
            <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search city…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 12px 8px 32px', fontSize: 13, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: SLATE }}>Runway left</span>
            {[0, 3, 7, 14, 30].map((d) => (
              <button key={d} onClick={() => { setMinDays(d); setPage(1); setExpanded(null); }}
                style={{
                  border: `1px solid ${minDays === d ? BLUE : LINE}`, borderRadius: 7, padding: '6px 10px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: minDays === d ? BLUE : '#fff', color: minDays === d ? '#fff' : NAVY,
                }}>
                {d === 0 ? 'Any' : `${d}d+`}
              </button>
            ))}
          </div>
          <button onClick={() => { setSortMode((s) => (s === 'deadline' ? 'runway' : 'deadline')); setPage(1); setExpanded(null); }}
            style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: '6px 10px', fontSize: 12, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer' }}>
            {sortMode === 'deadline' ? 'Deadline soonest' : 'Furthest out'}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: SLATE }}>{loading ? 'Loading…' : `${total.toLocaleString()} ${minDays ? `with ${minDays}d+ left` : 'rebookable'}${cityQuery ? ` in "${cityQuery}"` : ''}`}</span>
        </div>

        {error && (
          <div style={{ margin: '18px 32px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Table */}
        <div style={{ padding: '18px 32px 40px' }}>
          <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 90px 116px 116px 128px 118px 28px', gap: 14, padding: '13px 20px', borderBottom: `0.5px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booking', 'Rebook by', 'Original', 'Live price', 'Gap', 'Action', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: (i === 2 || i === 3 || i === 4) ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading bookings…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>No rebookable bookings here.</div>
            ) : (
              rows.map((r) => {
                const isChecking = checking === r.bookingId;
                const isOpen = expanded === r.bookingId;
                const result = results[r.bookingId];
                // last check from server, or fresh result this session
                const live = result?.live ?? (r.lastCheck ? { usd: r.lastCheck.liveUsd } : null);
                const gapUsd = result ? result.gapUsd : r.lastCheck?.gapUsd ?? null;
                const gapPct = result ? result.gapPct : r.lastCheck?.gapPct ?? null;
                const dropped = result ? result.dropped : r.lastCheck?.dropped ?? false;
                const checkedAt = result?.checkedAt ?? r.lastCheck?.checkedAt ?? null;
                const unavailable = result && result.available === false;
                const dLeft = daysUntil(r.cancelBy);
                const deadlineColor = dLeft == null ? SLATE : dLeft <= 3 ? RED : dLeft <= 7 ? AMBER : SLATE;
                return (
                  <div key={r.bookingId} style={{ borderBottom: `0.5px solid ${LINE}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 90px 116px 116px 128px 118px 28px', gap: 14, padding: '15px 20px', alignItems: 'center' }}>
                      {/* Booking */}
                      <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => toggleExpand(r.bookingId)}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                        <div style={{ fontSize: 12, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.roomDescription || r.room, `${fmtDate(r.checkin)}→${fmtDate(r.checkout)}`].filter(Boolean).join(' · ')}</div>
                        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.bookingId}{r.hotelCode ? ` · hotel ${r.hotelCode}` : ''}{r.supplier ? ` · ${r.supplier}` : ''}
                        </div>
                      </div>
                      {/* Rebook by */}
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: deadlineColor }}>{dLeft != null ? `${dLeft}d` : '—'}</div><div style={{ fontSize: 10, color: MUTED }}>left</div></div>
                      {/* Original */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>{r.origUsd != null ? `$${r.origUsd.toLocaleString()}` : '—'}</div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginTop: 1 }}>{r.origCur} {r.origLocal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      {/* Live */}
                      <div style={{ textAlign: 'right' }}>
                        {unavailable ? <span style={{ fontSize: 12, color: AMBER }}>Sold out</span>
                          : live?.usd != null ? <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: dropped ? GREEN : NAVY }}>${live.usd.toLocaleString()}</div>
                          : <span style={{ fontSize: 13, color: MUTED }}>—</span>}
                        {checkedAt && <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{fmtTime(checkedAt)}</div>}
                      </div>
                      {/* Gap */}
                      <div style={{ textAlign: 'right' }}>
                        {dropped && gapUsd != null ? (
                          <><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: GREEN }}>−${Math.round(gapUsd).toLocaleString()}</div><div style={{ fontSize: 10, color: GREEN, marginTop: 1 }}>{gapPct}% cheaper</div></>
                        ) : (checkedAt && !unavailable) ? <span style={{ fontSize: 12, color: MUTED }}>No drop</span>
                          : <span style={{ fontSize: 12, color: MUTED }}>—</span>}
                      </div>
                      {/*
                        Action.

                        CHANGED: the button no longer reconstructs the gate in
                        the browser. It renders only when the SERVER says
                        rebookEligible === true. The server applies the same
                        rule again when the request arrives, so this is a
                        convenience, not the control.
                      */}
                      <div style={{ textAlign: 'right' }}>
                        {(() => {
                          const rr = rebookResult[r.bookingId];
                          const isRebooking = rebooking === r.bookingId;
                          if (rr?.status === 'confirmed') {
                            return <span style={{ fontSize: 12, fontWeight: 600, color: GREEN }}>✓ Rebooked</span>;
                          }
                          if (rr?.status === 'partial') {
                            return <span style={{ fontSize: 11, fontWeight: 600, color: AMBER }}>⚠ Needs review</span>;
                          }
                          if (result?.rebookEligible === true) {
                            return (
                              <button onClick={() => doRebook(r.bookingId)} disabled={isRebooking}
                                style={{ border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, background: isRebooking ? MUTED : GREEN, color: '#fff', cursor: isRebooking ? 'wait' : 'pointer' }}>
                                {isRebooking ? 'Booking…' : 'Rebook'}
                              </button>
                            );
                          }
                          return (
                            <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, background: '#fff', color: isChecking ? MUTED : NAVY, cursor: isChecking ? 'wait' : 'pointer' }}>{isChecking ? 'Checking…' : checkedAt ? 'Re-check' : 'Check price'}</button>
                          );
                        })()}
                      </div>
                      {/* Chevron */}
                      <div onClick={() => toggleExpand(r.bookingId)} style={{ textAlign: 'center', color: MUTED, cursor: 'pointer', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div style={{ maxHeight: isOpen ? 3000 : 0, overflow: 'hidden', transition: 'max-height 0.32s ease', background: '#FBFCFE' }}>
                      <div style={{ padding: isOpen ? '18px 20px 22px' : '0 20px', borderTop: isOpen ? `0.5px solid ${LINE}` : 'none' }}>
                        <BookingDetail r={r} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                          {/* Original vs Live comparison */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Original vs live</div>
                            {result?.live ? (
                              <>
                                <MatchBadge basis={result.matchBasis} eligible={result.rebookEligible} />
                                <Compare original={result.original} live={result.live} match={result.match} />
                                <Blockers items={result.blockers} eligible={result.rebookEligible} count={result.eligibleRateCount} warnings={result.warnings} />
                              </>
                            ) : (
                              <div style={{ fontSize: 12.5, color: SLATE, lineHeight: 1.8 }}>
                                <div>Room: {r.roomDescription || r.room || '—'}</div>
                                <div>Board: {r.board || '—'}</div>
                                <div>Terms: {policyLabel(r.nonRefundable, r.cancelBy)}</div>
                                <div>Stay: {fmtDate(r.checkin, true)} → {fmtDate(r.checkout, true)}</div>
                                <div style={{ marginTop: 8, color: MUTED, fontStyle: 'italic' }}>Check the price to compare against GRN's live rates.</div>
                              </div>
                            )}
                          </div>
                          {/* History log */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Check history</div>
                            {(history[r.bookingId] && history[r.bookingId].length) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {history[r.bookingId].map((h, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `0.5px solid ${LINE}` }}>
                                    <span style={{ color: SLATE }}>{fmtTime(h.checked_at)}</span>
                                    <span style={{ color: h.dropped ? GREEN : NAVY, fontWeight: 600 }}>${h.live_usd?.toLocaleString() ?? '—'}{h.dropped ? ` · −${Math.round(h.gap_usd)}` : ''}</span>
                                  </div>
                                ))}
                                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Checked {history[r.bookingId].length} time{history[r.bookingId].length > 1 ? 's' : ''}</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic' }}>Not checked yet. Each check is logged here.</div>
                            )}
                          </div>
                        </div>
                        {/* Full live rate list */}
                        {result?.allRates && result.allRates.length > 0 && (
                          <AllRates rates={result.allRates} origUsd={r.origUsd} />
                        )}
                        {rebookResult[r.bookingId]?.error && (
                          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12.5, color: RED }}>
                            {rebookResult[r.bookingId].error}
                            {Array.isArray(rebookResult[r.bookingId].blockers) && rebookResult[r.bookingId].blockers.length > 0 && (
                              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                                {rebookResult[r.bookingId].blockers.map((b: string, i: number) => <li key={i} style={{ marginTop: 2 }}>{b}</li>)}
                              </ul>
                            )}
                            {rebookResult[r.bookingId].detail && <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 11, color: '#991B1B' }}>{rebookResult[r.bookingId].detail}</div>}
                          </div>
                        )}
                        {rebookResult[r.bookingId]?.warning && (
                          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12.5, color: AMBER }}>
                            {rebookResult[r.bookingId].warning}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpanded(null); }} disabled={page === 1} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => { setPage((p) => p + 1); setExpanded(null); }} disabled={!hasMore} style={{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>Each check makes one live GRN call and is logged. Rebook appears only when the live rate is the same room code, same board, and same or better cancellation terms.</p>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

// Everything known about the booking itself, before any live comparison.
// This is the row an ops person needs when they pick up the phone about a
// booking, so it sits at the top of the panel rather than buried.
function BookingDetail({ r }: { r: any }) {
  const Field = ({ label, value, mono }: { label: string; value: any; mono?: boolean }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: NAVY, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
        {value == null || value === '' ? <span style={{ color: MUTED }}>—</span> : value}
      </div>
    </div>
  );

  const c = r.cancellation || {};
  const guestList = (r.guests || []).filter((g: any) => g.name);

  return (
    <div style={{ marginBottom: 20, border: `0.5px solid ${LINE}`, borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '9px 16px', background: '#FBFCFE', borderBottom: `0.5px solid ${LINE}`, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE }}>
        Booking detail
      </div>

      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px' }}>
        <Field label="GRN booking ID" value={r.bookingId} mono />
        <Field label="Booking reference" value={r.bookingReference} mono />
        <Field label="Supplier reference" value={r.supplierReference} mono />
        <Field label="Booked on" value={r.bookingDate ? fmtTime(r.bookingDate) : null} />
        <Field label="Supplier" value={r.supplier} />
        <Field label="Hotel code" value={r.hotelCode} mono />
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px', borderTop: `0.5px solid ${LINE}`, paddingTop: 14 }}>
        <Field label="Check-in" value={fmtDate(r.checkin, true)} />
        <Field label="Check-out" value={fmtDate(r.checkout, true)} />
        <Field label="Nights" value={r.nights} />
        <Field label="Rooms" value={r.roomCount} />
        <Field label="Room" value={r.roomDescription || r.room} />
        <Field label="Room code" value={r.roomCode} mono />
        <Field label="Board" value={r.board} />
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px', borderTop: `0.5px solid ${LINE}`, paddingTop: 14 }}>
        <Field label="Adults" value={r.adults} />
        <Field
          label="Children"
          value={r.children ? `${r.children} (ages ${r.childrenAges?.length ? r.childrenAges.join(', ') : 'not stated'})` : '0'}
        />
        <Field label="Lead guest" value={r.leadGuest} />
        <Field
          label="All guests"
          value={guestList.length ? guestList.map((g: any) => g.name + (g.type === 'CH' ? ` (child${g.age != null ? `, ${g.age}` : ''})` : '')).join(' · ') : null}
        />
      </div>

      {/* Cancellation terms as the supplier stated them — the leg the gate
          checks, so it should be readable here without opening the raw JSON. */}
      <div style={{ padding: '14px 16px', borderTop: `0.5px solid ${LINE}`, background: c.nonRefundable === true ? '#FFFBEB' : '#FBFCFE' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 5 }}>Cancellation terms</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: c.nonRefundable === true ? AMBER : c.nonRefundable === false ? GREEN : SLATE }}>
          {policyLabel(c.nonRefundable, c.cancelBy)}
        </div>
        {c.details && (
          <div style={{ fontSize: 12, color: SLATE, marginTop: 6, lineHeight: 1.5 }}>{c.details}</div>
        )}
        {Array.isArray(c.policies) && c.policies.length > 0 && (() => {
          // Some policy entries carry only a currency and no date or charge.
          // Rendering those produced a bare "USD" line, sometimes twice.
          const lines = c.policies.map((p: any) => {
            if (typeof p === 'string') return p.trim();
            const parts = [
              p.from_date && `From ${fmtDate(p.from_date, true)}`,
              p.charge != null && `charge ${p.charge}${p.currency ? ' ' + p.currency : ''}`,
            ].filter(Boolean);
            return parts.join(' · ');
          }).filter((s: string) => s && s.length > 0);
          if (!lines.length) return null;
          return (
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {lines.map((line: string, i: number) => (
                <li key={i} style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>{line}</li>
              ))}
            </ul>
          );
        })()}
        {c.remarks && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11.5, color: BLUE, cursor: 'pointer', fontWeight: 600 }}>Supplier rate conditions</summary>
            <div style={{ fontSize: 11.5, color: SLATE, marginTop: 5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{c.remarks}</div>
          </details>
        )}
      </div>
    </div>
  );
}

// Why a rate cannot be actioned. An empty screen tells the operator nothing;
// the reasons are the useful part.
function Blockers({ items, eligible, count, warnings }: { items?: string[]; eligible?: boolean; count?: number; warnings?: string[] }) {
  const warnBlock = (warnings && warnings.length > 0) ? (
    <div style={{ marginTop: 8, padding: '8px 12px', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: MUTED, marginBottom: 4 }}>Noted, not blocking</div>
      {warnings.map((w, i) => (
        <div key={i} style={{ fontSize: 11.5, color: SLATE, lineHeight: 1.45, marginTop: 2 }}>{w}</div>
      ))}
    </div>
  ) : null;

  if (eligible) {
    return (
      <>
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, color: '#166534' }}>
          Exact same room name, same board, same or better cancellation terms. Rebook is available.
        </div>
        {warnBlock}
      </>
    );
  }
  if (!items || items.length === 0) return warnBlock;
  return (
    <>
      <div style={{ marginTop: 10, padding: '9px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: AMBER, marginBottom: 5 }}>
          Not rebookable{count === 0 ? ' — no matching rate available' : ''}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {items.map((b, i) => (
            <li key={i} style={{ fontSize: 12, color: '#78350F', marginTop: 3, lineHeight: 1.45 }}>{b}</li>
          ))}
        </ul>
      </div>
      {warnBlock}
    </>
  );
}

function AllRates({ rates, origUsd }: { rates: any[]; origUsd: number | null }) {
  const [open, setOpen] = useState(false);
  const eligibleCount = rates.filter((r) => r.eligible).length;
  return (
    <div style={{ marginTop: 18, borderTop: `0.5px solid ${LINE}`, paddingTop: 14 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        All live rates ({rates.length}) · {eligibleCount} rebookable
      </button>
      {open && (
        <div style={{ marginTop: 12, border: `0.5px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 130px 110px 120px 110px', gap: 12, padding: '9px 14px', background: '#FBFCFE', borderBottom: `0.5px solid ${LINE}` }}>
            {['Room', 'Board', 'Price', 'vs yours', 'Cancel by'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {rates.map((rt, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 130px 110px 120px 110px', gap: 12, padding: '10px 14px', alignItems: 'center', borderBottom: i < rates.length - 1 ? `0.5px solid ${LINE}` : 'none', background: rt.eligible ? '#F0FDF4' : '#fff' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.roomDescription || rt.roomType}</span>
                    {rt.eligible && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: GREEN, background: '#DCFCE7', padding: '2px 6px', borderRadius: 10 }}>REBOOKABLE</span>}
                    {!rt.eligible && rt.isMatch && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: AMBER, background: '#FEF3C7', padding: '2px 6px', borderRadius: 10 }}>YOUR ROOM</span>}
                  </div>
                  {!rt.eligible && rt.blockers?.length > 0 && (
                    <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.blockers[0]}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: SLATE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.board}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{rt.usd != null ? `$${rt.usd.toLocaleString()}` : '—'}</div>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace' }}>{rt.currency} {rt.local?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: rt.vsOriginalUsd > 0 ? GREEN : rt.vsOriginalUsd < 0 ? RED : SLATE }}>
                  {rt.vsOriginalUsd == null ? '—' : rt.vsOriginalUsd > 0 ? `−$${rt.vsOriginalUsd}` : rt.vsOriginalUsd < 0 ? `+$${Math.abs(rt.vsOriginalUsd)}` : 'same'}
                </div>
                <div style={{ fontSize: 11, color: rt.refundable ? SLATE : AMBER }}>{rt.cancelBy ? fmtDate(rt.cancelBy) : (rt.refundable ? 'refundable' : 'non-ref')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchBadge({ basis, eligible }: { basis?: string; eligible?: boolean }) {
  if (!basis) return null;
  let label, bg, fg;
  // The room leg and the price leg are separate things. A matched room with
  // no price drop is still a matched room — saying "no comparable room" there
  // contradicted the green tick on the Room row.
  if (basis === 'room_code') {
    label = eligible ? 'Exact match — room code and name' : 'Exact room match — room code and name';
    bg = '#DCFCE7'; fg = GREEN;
  } else if (basis === 'room_name_exact') {
    label = eligible ? 'Exact room match' : 'Exact room match — no drop yet';
    bg = '#DCFCE7'; fg = GREEN;
  } else if (basis === 'room_name_blocked') {
    label = 'Same room — blocked on other terms'; bg = '#FEF3C7'; fg = AMBER;
  } else if (basis === 'no_room_match') {
    label = 'No matching room in live rates'; bg = '#FEF3C7'; fg = AMBER;
  } else {
    label = 'No comparable room'; bg = '#F1F5F9'; fg = SLATE;
  }
  return (
    <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: bg, color: fg, marginBottom: 10 }}>{label}</div>
  );
}

function Compare({ original, live, match }: any) {
  const Row = ({ label, o, l, ok }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: `0.5px solid ${LINE}`, alignItems: 'center' }}>
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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: MUTED, paddingBottom: 4 }}>
        <span></span><span>Original</span><span>Live</span>
      </div>
      <Row label="Price" o={original.usd != null ? `$${original.usd}` : '—'} l={live.usd != null ? `$${live.usd}` : '—'} ok={undefined} />
      {/* Both room fields shown separately. GRN stores two: room_type and
          description. On some suppliers one of them is a clean name and the
          other is a composite of type + bed + board mashed together. Showing
          both makes it obvious which field actually lines up. */}
      {(original.roomTypeRaw || live.roomTypeRaw) && (original.roomTypeRaw !== original.roomDescriptionRaw) && (
        <Row label="Room type" o={original.roomTypeRaw || '—'} l={live.roomTypeRaw || '—'} ok={undefined} />
      )}
      <Row label="Room" o={original.roomDescriptionRaw || original.room || '—'} l={live.roomDescriptionRaw || live.room || '—'} ok={match?.room} />
      <Row label="Board" o={original.board || '—'} l={live.board || '—'} ok={match?.board} />
      <Row label="Terms" o={policyLabel(original.nonRefundable, original.cancelBy)} l={policyLabel(live.nonRefundable, live.cancelBy)} ok={match?.policy} />
      <Row label="Dates" o={`${fmtDate(original.checkin)}→${fmtDate(original.checkout)}`} l={match?.dates ? 'same' : 'differs'} ok={match?.dates} />
    </div>
  );
}
