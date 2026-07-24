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

export default function RepricingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [citySearch, setCitySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [checking, setChecking] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({}); // live check results this session
  const [history, setHistory] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const id = setTimeout(() => { setCityQuery(citySearch.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [citySearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const cityParam = cityQuery ? `&city=${encodeURIComponent(cityQuery)}` : '';
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?page=${page}${cityParam}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (cancelled) return;
        if (d.error) { setError(d.error); return; }
        setRows(d.rows || []); setHasMore(d.hasMore); setTotal(d.total || 0);
      })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, cityQuery]);

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
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Repricing</h1>
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
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: SLATE }}>{loading ? 'Loading…' : cityQuery ? `${total} rebookable in "${cityQuery}"` : `${total} rebookable`}</span>
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
                        <div style={{ fontSize: 12, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.room, `${fmtDate(r.checkin)}→${fmtDate(r.checkout)}`].filter(Boolean).join(' · ')}</div>
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
                      {/* Action */}
                      <div style={{ textAlign: 'right' }}>
                        {(() => {
                          const trueMatch = dropped && result && result.match?.room === true && result.match?.board !== false && result.match?.dates === true;
                          if (trueMatch) {
                            return <button style={{ border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, background: GREEN, color: '#fff', cursor: 'pointer' }}>Rebook</button>;
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

                    {/*
                      FIX 1 of 2: the old cap of maxHeight: 520 clipped the whole
                      expanded section (comparison + history + the full rates
                      table) with overflow:hidden and NO way to scroll past it.
                      That's what made "All live rates (122)" look like it only
                      had a few rows. Raised the cap well above any realistic
                      content height so nothing outside gets silently cut off.
                      The rates table itself now scrolls internally — see FIX 2
                      in AllRates below — so this outer cap is just a safety
                      ceiling for the open/close animation, not a real limit.
                    */}
                    <div style={{ maxHeight: isOpen ? 3000 : 0, overflow: 'hidden', transition: 'max-height 0.32s ease', background: '#FBFCFE' }}>
                      <div style={{ padding: isOpen ? '18px 20px 22px' : '0 20px', borderTop: isOpen ? `0.5px solid ${LINE}` : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                          {/* Original vs Live comparison */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Original vs live</div>
                            {result?.live ? (
                              <>
                                <MatchBadge basis={result.matchBasis} />
                                <Compare original={result.original} live={result.live} match={result.match} />
                              </>
                            ) : (
                              <div style={{ fontSize: 12.5, color: SLATE, lineHeight: 1.8 }}>
                                <div>Room: {r.room || '—'}</div>
                                <div>Board: {r.board || '—'}</div>
                                <div>Stay: {fmtDate(r.checkin, true)} → {fmtDate(r.checkout, true)}</div>
                                <div style={{ marginTop: 8, color: MUTED, fontStyle: 'italic' }}>Click "Check price" to compare against GRN's live rate.</div>
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
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>Each check makes one live GRN call and is logged. This feeds the conversion story in Rebookings.</p>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function AllRates({ rates, origUsd }: { rates: any[]; origUsd: number | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 18, borderTop: `0.5px solid ${LINE}`, paddingTop: 14 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        All live rates ({rates.length})
      </button>
      {open && (
        <div style={{ marginTop: 12, border: `0.5px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 130px 110px 120px 110px', gap: 12, padding: '9px 14px', background: '#FBFCFE', borderBottom: `0.5px solid ${LINE}` }}>
            {['Room', 'Board', 'Price', 'vs yours', 'Cancel by'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {/*
            FIX 2 of 2: previously the rows rendered directly here with no
            height limit or overflow rule of their own — they only "worked"
            because the outer wrapper cut everything off at 520px. Now that
            the outer cap is raised (see FIX 1 above), this container needs
            its own explicit scroll box so a 122-row table doesn't just push
            the whole page down. maxHeight + overflowY:auto below gives a
            real, visible scrollbar for however many rates come back.
          */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {rates.map((rt, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 130px 110px 120px 110px', gap: 12, padding: '10px 14px', alignItems: 'center', borderBottom: i < rates.length - 1 ? `0.5px solid ${LINE}` : 'none', background: rt.isMatch ? '#F0FDF4' : '#fff' }}>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.roomType}</span>
                  {rt.isMatch && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: GREEN, background: '#DCFCE7', padding: '2px 6px', borderRadius: 10 }}>YOUR ROOM</span>}
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

function MatchBadge({ basis }: { basis?: string }) {
  if (!basis) return null;
  let label, bg, fg;
  if (basis === 'room_code') { label = 'Exact room match'; bg = '#DCFCE7'; fg = GREEN; }
  else if (basis === 'room_name') { label = 'Matched by room name'; bg = '#DBEAFE'; fg = '#1E50A8'; }
  else if (basis === 'cheapest_fallback') { label = 'Different room — cheapest available'; bg = '#FEF3C7'; fg = AMBER; }
  else { label = 'No comparable room'; bg = '#F1F5F9'; fg = SLATE; }
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
      <Row label="Room" o={original.room || '—'} l={live.room || '—'} ok={match?.room} />
      <Row label="Board" o={original.board || '—'} l={live.board || '—'} ok={match?.board} />
      <Row label="Dates" o={`${fmtDate(original.checkin)}→${fmtDate(original.checkout)}`} l={match?.dates ? 'same' : 'differs'} ok={match?.dates} />
    </div>
  );
}
