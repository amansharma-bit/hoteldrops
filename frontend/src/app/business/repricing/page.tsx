'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const NAVY = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';
const GOLD = '#F5B833';
const GOLD_DEEP = '#B8860B';
const GOLD_SOFT = '#FDF4E1';

const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY = "'Plus Jakarta Sans',sans-serif";

function fmtDate(d: string | null, withYear = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}
function fmtTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function daysUntil(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
}
function minsSince(d: string | null) {
  if (!d) return null;
  return Math.round((Date.now() - new Date(d).getTime()) / 60000);
}
function policyLabel(nonRef: boolean | null | undefined, cancelBy?: string | null) {
  if (nonRef === true) return 'Non-refundable';
  if (nonRef === false) return cancelBy ? `Refundable until ${fmtDate(cancelBy)}` : 'Refundable';
  return 'Not stated';
}

function Spinner({ color = '#3D2C00', size = 15 }: { color?: string; size?: number }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

const DEADLINE_LABELS: Record<string, string> = {
  '3d': 'Closing under 3 days', '1w': 'Closing under 1 week', '1m': 'Closing under 1 month',
  '1y': 'Closing under 1 year', 'any': 'Any deadline', 'custom': 'Custom range',
};

function DeadlineDropdown({ deadline, open, setOpen, customFrom, customTo, onPreset, onCustom }: any) {
  const [showCustom, setShowCustom] = useState(deadline === 'custom');
  const [f, setF] = useState(customFrom || '');
  const [t, setT] = useState(customTo || '');
  const label = deadline === 'custom'
    ? ((customFrom || customTo) ? `${customFrom || '…'} → ${customTo || '…'}` : 'Custom range')
    : (DEADLINE_LABELS[deadline] || DEADLINE_LABELS['3d']);
  const presets: [string, string][] = [
    ['3d', 'Closing under 3 days'], ['1w', 'Closing under 1 week'],
    ['1m', 'Closing under 1 month'], ['1y', 'Closing under 1 year'], ['any', 'Any deadline'],
  ];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); setShowCustom(deadline === 'custom'); }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 180, border: `1px solid ${LINE}`, borderRadius: 11, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, background: '#fff', color: '#0F172A', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{ position: 'absolute', top: '112%', left: 0, zIndex: 31, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth: 232 }}>
            {presets.map(([v, l]) => (
              <button key={v} onClick={() => onPreset(v)}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: deadline === v ? '#EAF6FF' : 'transparent', color: deadline === v ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                {l}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${LINE}`, margin: '6px 4px' }} />
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: deadline === 'custom' ? '#EAF6FF' : 'transparent', color: deadline === 'custom' ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                Custom range…
              </button>
            ) : (
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Deadline between</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="date" value={f} onChange={(e) => setF(e.target.value)} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 9px', fontSize: 13, color: NAVY, fontFamily: 'inherit' }} />
                  <span style={{ color: SLATE }}>→</span>
                  <input type="date" value={t} onChange={(e) => setT(e.target.value)} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 9px', fontSize: 13, color: NAVY, fontFamily: 'inherit' }} />
                </div>
                <button onClick={() => onCustom(f, t)} disabled={!f && !t}
                  style={{ marginTop: 10, width: '100%', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, background: (!f && !t) ? '#E2E8F0' : BLUE, color: (!f && !t) ? MUTED : '#fff', cursor: (!f && !t) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  Apply range
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function RepricingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [viewCounts, setViewCounts] = useState<any>({});
  const [citySearch, setCitySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [deadline, setDeadline] = useState('3d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [ddOpen, setDdOpen] = useState(false);
  const [view, setView] = useState('all');
  const [checking, setChecking] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [selectedRate, setSelectedRate] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [logTab, setLogTab] = useState<Record<string, number>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => { setCityQuery(citySearch.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [citySearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qParam = cityQuery ? `&q=${encodeURIComponent(cityQuery)}` : '';
    const customParam = deadline === 'custom'
      ? `${customFrom ? `&from=${customFrom}` : ''}${customTo ? `&to=${customTo}` : ''}`
      : '';
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?page=${page}${qParam}&deadline=${deadline}${customParam}&view=${view}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (cancelled) return;
        if (d.error) { setError(d.error); return; }
        setRows(d.rows || []); setHasMore(d.hasMore); setTotal(d.total || 0);
        setViewCounts(d.viewCounts || {});
      })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, cityQuery, deadline, customFrom, customTo, view, reloadKey]);

  async function checkPrice(bookingId: string) {
    setChecking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const d = await r.json();
      if (d.error) { setResults((p) => ({ ...p, [bookingId]: { error: d.error } })); }
      else {
        setResults((p) => ({ ...p, [bookingId]: d }));
        // Pre-select only a clean match that actually saves money. Anything
        // else the operator picks deliberately.
        const pick = (d.allRates || []).find((x: any) => x.eligible && x.vsOriginalUsd > 0) || null;
        if (pick?.rateKey) setSelectedRate((p) => ({ ...p, [bookingId]: pick.rateKey }));
        else setSelectedRate((p) => { const n = { ...p }; delete n[bookingId]; return n; });
        loadHistory(bookingId);
      }
    } catch (e: any) {
      setResults((p) => ({ ...p, [bookingId]: { error: e.message } }));
    } finally {
      setChecking(null);
    }
  }

  async function bookReplacement(bookingId: string, acknowledgeComment = false) {
    const result = results[bookingId];
    const rateKey = selectedRate[bookingId];
    const rate = (result?.allRates || []).find((x: any) => x.rateKey === rateKey);
    if (!rateKey || !rate) { alert('Select a rate first.'); return; }

    const lines = [
      `Book this replacement?`,
      ``,
      `${rate.roomDescription || rate.roomType}`,
      `${rate.board} · $${rate.usd}`,
      rate.vsOriginalUsd > 0 ? `Saves $${rate.vsOriginalUsd}` : `NOT cheaper than the original`,
    ];
    if (rate.blockers?.length) lines.push(``, `You are accepting:`, ...rate.blockers.map((b: string) => `· ${b}`));
    lines.push(``, `The original booking will NOT be cancelled yet.`);
    if (!window.confirm(lines.join('\n'))) return;

    setBooking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/book-replacement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          rate_key: rateKey,
          group_code: rate.groupCode || undefined,
          acknowledge_comment: acknowledgeComment,
        }),
      });
      const d = await r.json();
      setActionResult((p) => ({ ...p, [bookingId]: { ...d, httpStatus: r.status } }));
      loadLog(bookingId, d.rebookingId);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setActionResult((p) => ({ ...p, [bookingId]: { error: e.message } }));
    } finally {
      setBooking(null);
    }
  }

  async function cancelOriginal(bookingId: string, attemptId: number | null, standalone = false) {
    const msg = standalone
      ? 'Cancel this booking outright? There is no replacement. This permanently cancels a live reservation.'
      : 'Cancel the ORIGINAL booking? The replacement is already confirmed. This completes the rebooking.';
    if (!window.confirm(msg)) return;

    setCancelling(bookingId);
    try {
      const body: any = standalone ? { booking_id: bookingId, confirm: true } : { attempt_id: attemptId };
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/cancel-original`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      setActionResult((p) => ({ ...p, [bookingId]: { ...d, httpStatus: r.status } }));
      loadLog(bookingId, attemptId);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setActionResult((p) => ({ ...p, [bookingId]: { error: e.message } }));
    } finally {
      setCancelling(null);
    }
  }

  async function loadHistory(bookingId: string) {
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/history?booking_id=${encodeURIComponent(bookingId)}&_t=${Date.now()}`);
      const d = await r.json();
      setHistory((p) => ({ ...p, [bookingId]: d.checks || [] }));
    } catch { /* ignore */ }
  }

  async function loadLog(bookingId: string, attemptId?: number | null) {
    try {
      const q = attemptId ? `attempt_id=${attemptId}` : `booking_id=${encodeURIComponent(bookingId)}`;
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/attempt-log?${q}&_t=${Date.now()}`);
      const d = await r.json();
      setLogs((p) => ({ ...p, [bookingId]: d.steps || [] }));
    } catch { /* ignore */ }
  }

  function openDrawer(bookingId: string) {
    setExpanded(bookingId);
    if (!history[bookingId]) loadHistory(bookingId);
    if (!logs[bookingId]) loadLog(bookingId);
    // Auto-run the live check — opening the drawer *is* the intent to reprice.
    if (!results[bookingId] && checking !== bookingId) checkPrice(bookingId);
  }
  function closeDrawer() { setExpanded(null); }

  const GRID = 'minmax(0,1.6fr) 90px 116px 116px 128px 132px';
  const openRow = rows.find((r) => r.bookingId === expanded) || null;

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY }}>
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '30px 40px 0' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px', color: NAVY, margin: 0 }}>Repricing</h1>
          <p style={{ fontSize: 15, color: SLATE, marginTop: 4 }}>Check a booking&apos;s live price, pick a rate, book the replacement, then cancel the original.</p>
        </div>

        {/* Controls */}
        <div style={{ padding: '22px 40px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Universal search */}
          <div style={{ position: 'relative', flex: '0 1 340px', minWidth: 220 }}>
            <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setCityQuery(citySearch.trim()); setPage(1); } }}
              placeholder="Search city, hotel, booking ID or guest…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '10px 14px 10px 34px', fontSize: 14, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>

          {/* Deadline window */}
          <DeadlineDropdown
            deadline={deadline} open={ddOpen} setOpen={setDdOpen}
            customFrom={customFrom} customTo={customTo}
            onPreset={(v: string) => { setDeadline(v); setPage(1); setDdOpen(false); closeDrawer(); }}
            onCustom={(f: string, t: string) => { setCustomFrom(f); setCustomTo(t); setDeadline('custom'); setPage(1); setDdOpen(false); closeDrawer(); }}
          />

          {/* View */}
          <select value={view} onChange={(e) => { setView(e.target.value); setPage(1); closeDrawer(); }}
            style={{ border: `1px solid ${view === 'pending_cancel' ? RED : LINE}`, borderRadius: 11, padding: '9px 12px', fontSize: 13, fontWeight: 600, background: '#fff', color: view === 'pending_cancel' ? RED : NAVY, cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="all">All bookings</option>
            <option value="pending_cancel">Pending cancellation{viewCounts.pendingCancel ? ` (${viewCounts.pendingCancel})` : ''}</option>
            <option value="needs_review">Needs review{viewCounts.needsReview ? ` (${viewCounts.needsReview})` : ''}</option>
            <option value="rebooked">Rebooked{viewCounts.rebooked ? ` (${viewCounts.rebooked})` : ''}</option>
          </select>

          {/* Clear — only when a filter is active */}
          {(citySearch || deadline !== '3d' || view !== 'all') && (
            <button onClick={() => { setCitySearch(''); setCityQuery(''); setDeadline('3d'); setCustomFrom(''); setCustomTo(''); setView('all'); setPage(1); closeDrawer(); }}
              style={{ border: 'none', background: 'transparent', color: SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 14, color: SLATE }}>{loading ? 'Loading…' : `${total.toLocaleString()} shown`}</span>
        </div>

        {error && (
          <div style={{ margin: '18px 40px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Table */}
        <div style={{ padding: '18px 40px 40px' }}>
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, padding: '13px 22px', borderBottom: `1px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booking', 'Rebook by', 'Original', 'Live price', 'Gap', 'Status'].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: (i === 2 || i === 3 || i === 4) ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading bookings…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Nothing here.</div>
            ) : (
              rows.map((r) => {
                const at = r.attempt;
                const atRisk = Boolean(at?.awaitingCancel);
                const needsReview = at?.status === 'needs_review';
                const done = at?.status === 'confirmed';
                const result = results[r.bookingId];
                const live = result?.live ?? (r.lastCheck ? { usd: r.lastCheck.liveUsd } : null);
                const gapUsd = result ? result.gapUsd : r.lastCheck?.gapUsd ?? null;
                const gapPct = result ? result.gapPct : r.lastCheck?.gapPct ?? null;
                const dropped = result ? result.dropped : r.lastCheck?.dropped ?? false;
                const checkedAt = result?.checkedAt ?? r.lastCheck?.checkedAt ?? null;
                const isChecked = Boolean(checkedAt);
                const unavailable = result && result.available === false;
                const dLeft = daysUntil(r.cancelBy);
                const deadlineColor = dLeft == null ? SLATE : dLeft <= 3 ? RED : dLeft <= 7 ? AMBER : SLATE;

                return (
                  <div key={r.bookingId} style={{
                    borderBottom: `1px solid ${LINE}`,
                    background: atRisk ? '#FEF2F2' : needsReview ? '#FFFBEB' : isChecked ? '#F7FBFF' : '#fff',
                    borderLeft: atRisk ? `3px solid ${RED}` : needsReview ? `3px solid ${AMBER}` : isChecked ? `3px solid rgba(0,147,255,.55)` : '3px solid transparent',
                  }}>
                    {/* At-risk strip: replacement confirmed, original still live */}
                    {atRisk && (
                      <div style={{ padding: '8px 22px', background: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>
                          Original still live · replacement confirmed {minsSince(at.updatedAt)} min ago
                        </span>
                        <span style={{ fontSize: 11.5, color: '#991B1B', fontFamily: 'monospace' }}>{at.newBookingId}</span>
                        <div style={{ flex: 1 }} />
                        <button onClick={(e) => { e.stopPropagation(); cancelOriginal(r.bookingId, at.id); }} disabled={cancelling === r.bookingId}
                          style={{ border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, background: RED, color: '#fff', cursor: cancelling === r.bookingId ? 'wait' : 'pointer' }}>
                          {cancelling === r.bookingId ? 'Cancelling…' : 'Cancel original now'}
                        </button>
                      </div>
                    )}
                    {needsReview && (
                      <div style={{ padding: '8px 22px', background: '#FEF3C7', fontSize: 12, color: '#78350F' }}>
                        <strong>Needs review</strong>{at.failureStage ? ` · ${at.failureStage}` : ''} — {at.failureReason || 'unresolved'}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, padding: '16px 22px', alignItems: 'center' }}>
                      {/* Booking */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                        <div style={{ fontSize: 13, color: SLATE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, `${fmtDate(r.checkin)}→${fmtDate(r.checkout)}`].filter(Boolean).join(' · ')}</div>
                        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.bookingId}{r.supplier ? ` · ${r.supplier}` : ''}
                        </div>
                      </div>
                      {/* Rebook by */}
                      <div><div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: deadlineColor }}>{dLeft != null ? `${dLeft}d` : '—'}</div><div style={{ fontSize: 10.5, color: MUTED }}>left</div></div>
                      {/* Original */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: NAVY }}>{r.origUsd != null ? `$${r.origUsd.toLocaleString()}` : '—'}</div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginTop: 1 }}>{r.origCur} {r.origLocal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      {/* Live */}
                      <div style={{ textAlign: 'right' }}>
                        {unavailable ? <span style={{ fontSize: 12, color: AMBER }}>Sold out</span>
                          : live?.usd != null ? <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: dropped ? GREEN : NAVY }}>${live.usd.toLocaleString()}</div>
                          : <span style={{ fontSize: 13, color: MUTED }}>—</span>}
                        {checkedAt && <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{fmtTime(checkedAt)}</div>}
                      </div>
                      {/* Gap */}
                      <div style={{ textAlign: 'right' }}>
                        {dropped && gapUsd != null ? (
                          <><div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: GREEN }}>−${Math.round(gapUsd).toLocaleString()}</div><div style={{ fontSize: 10, color: GREEN, marginTop: 1 }}>{gapPct}% cheaper</div></>
                        ) : (checkedAt && !unavailable) ? <span style={{ fontSize: 12, color: MUTED }}>No drop</span>
                          : <span style={{ fontSize: 12, color: MUTED }}>—</span>}
                      </div>
                      {/* Status — the only thing that opens the drawer, so row text stays copyable */}
                      <div style={{ textAlign: 'left' }}>
                        {done ? (
                          <button onClick={() => openDrawer(r.bookingId)} style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 20, border: 'none', background: '#DCFCE7', color: GREEN, cursor: 'pointer' }}>✓ Rebooked</button>
                        ) : atRisk ? (
                          <button onClick={() => openDrawer(r.bookingId)} style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '7px 13px', borderRadius: 20, border: 'none', background: RED, color: '#fff', cursor: 'pointer' }}>Cancel original</button>
                        ) : isChecked ? (
                          <button onClick={() => openDrawer(r.bookingId)} style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 20, background: '#fff', border: `1.5px solid ${BLUE}`, color: BLUE, cursor: 'pointer' }}>Re-check</button>
                        ) : (
                          <button onClick={() => openDrawer(r.bookingId)} style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '7px 14px', borderRadius: 20, border: 'none', background: BLUE, color: '#fff', cursor: 'pointer' }}>Reprice</button>
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
                <button onClick={() => { setPage((p) => Math.max(1, p - 1)); closeDrawer(); }} disabled={page === 1} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => { setPage((p) => p + 1); closeDrawer(); }} disabled={!hasMore} style={{ border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- DRAWER: takes over the content area, sidebar stays visible ---- */}
      {openRow && (() => {
        const r = openRow;
        const at = r.attempt;
        const atRisk = Boolean(at?.awaitingCancel);
        const done = at?.status === 'confirmed';
        const result = results[r.bookingId];
        const isChecking = checking === r.bookingId;
        const act = actionResult[r.bookingId];
        const dLeft = daysUntil(r.cancelBy);
        const statusChip = done ? { t: 'Rebooked', bg: '#DCFCE7', fg: GREEN }
          : atRisk ? { t: 'Original still live', bg: '#FEE2E2', fg: RED }
          : at?.status === 'needs_review' ? { t: 'Needs review', bg: '#FEF3C7', fg: AMBER }
          : null;

        return (
          <>
            <style>{`@keyframes drawerIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 264, background: BG, zIndex: 40, display: 'flex', flexDirection: 'column', animation: 'drawerIn .3s ease', boxShadow: '-30px 0 60px -30px rgba(16,24,40,.35)', fontFamily: BODY }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 34px', borderBottom: `1px solid ${LINE}`, background: '#fff' }}>
                <button onClick={closeDrawer} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${LINE}`, background: '#fff', borderRadius: 11, padding: '9px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: NAVY }}>← Back</button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, letterSpacing: '-0.4px', color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                  <div style={{ fontSize: 13.5, color: SLATE, marginTop: 3 }}>{[r.city, `${fmtDate(r.checkin)} → ${fmtDate(r.checkout)}`, r.nights ? `${r.nights}n` : null, dLeft != null ? `rebook by ${fmtDate(r.cancelBy)} · ${dLeft}d left` : null].filter(Boolean).join(' · ')}</div>
                </div>
                {statusChip && <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 20, background: statusChip.bg, color: statusChip.fg }}>{statusChip.t}</span>}
                <div style={{ marginLeft: 'auto', fontSize: 26, color: MUTED, cursor: 'pointer', lineHeight: 1 }} onClick={closeDrawer}>×</div>
              </div>

              {/* body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '26px 34px 44px' }}>

                {/* action outcome banner */}
                {act && <ActionOutcome act={act} onCancel={() => cancelOriginal(r.bookingId, act.rebookingId)} cancelling={cancelling === r.bookingId} onAck={() => bookReplacement(r.bookingId, true)} />}

                {/* Old (left) vs New (right) */}
                <OfferCards r={r} result={result} checking={isChecking} />

                {/* Replacement action area */}
                {!atRisk && !done && (
                  isChecking && !result ? (
                    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Spinner color={BLUE} />
                        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY }}>Checking live rates…</div>
                      </div>
                      <div style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>Pulling GRN&apos;s live availability for this stay.</div>
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[0, 1, 2].map((k) => (
                          <div key={k} style={{ height: 46, borderRadius: 10, background: 'linear-gradient(90deg,#F1F3F8 25%,#E7ECF3 37%,#F1F3F8 63%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s ease infinite' }} />
                        ))}
                      </div>
                    </div>
                  ) : !result ? (
                    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: NAVY }}>Find a lower rate</div>
                        <div style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Pulls GRN&apos;s live rates for this hotel and stay, then compares.</div>
                      </div>
                      <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking}
                        style={{ border: 'none', borderRadius: 12, padding: '13px 22px', fontFamily: BODY, fontSize: 15, fontWeight: 700, background: BLUE, color: '#fff', cursor: isChecking ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {isChecking ? <><Spinner color="#fff" /> Checking live rates…</> : 'Check live price'}
                      </button>
                    </div>
                  ) : result.error ? (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: RED, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span>{result.error}</span>
                      <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking}
                        style={{ border: `1px solid #FECACA`, borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: RED, cursor: 'pointer' }}>Try again</button>
                    </div>
                  ) : null
                )}

                {/* Match detail + rate chooser */}
                {result?.live && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <MatchBadge basis={result.matchBasis} eligible={result.rebookEligible} />
                      <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking}
                        style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, background: '#fff', color: isChecking ? MUTED : BLUE, cursor: isChecking ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        {isChecking ? <><Spinner color={BLUE} size={12} /> Re-checking…</> : 'Re-check'}
                      </button>
                    </div>
                    <Compare original={result.original} live={result.live} match={result.match} />
                    <Blockers items={result.blockers} eligible={result.rebookEligible} count={result.eligibleRateCount} warnings={result.warnings} />
                  </div>
                )}

                {result?.allRates && result.allRates.length > 0 && !atRisk && !done && (
                  <RateChooser
                    rates={result.allRates}
                    selected={selectedRate[r.bookingId] || null}
                    onSelect={(k: string) => setSelectedRate((p) => ({ ...p, [r.bookingId]: k }))}
                    onBook={() => bookReplacement(r.bookingId)}
                    booking={booking === r.bookingId}
                    origUsd={r.origUsd}
                  />
                )}

                {/* Full booking detail */}
                <BookingDetail r={r} />

                {/* Check history */}
                <div style={{ marginTop: 4, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Check history</div>
                  {(history[r.bookingId] && history[r.bookingId].length) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 460 }}>
                      {history[r.bookingId].map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
                          <span style={{ color: SLATE }}>{fmtTime(h.checked_at)}</span>
                          <span style={{ color: h.dropped ? GREEN : NAVY, fontWeight: 600 }}>${h.live_usd?.toLocaleString() ?? '—'}{h.dropped ? ` · −${Math.round(h.gap_usd)}` : ''}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>Checked {history[r.bookingId].length} time{history[r.bookingId].length > 1 ? 's' : ''}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic' }}>Not checked yet.</div>
                  )}
                </div>

                {/* Per-step call log */}
                <StepLog
                  steps={logs[r.bookingId] || []}
                  activeTab={logTab[r.bookingId] ?? 0}
                  setTab={(i: number) => setLogTab((p) => ({ ...p, [r.bookingId]: i }))}
                  onRefresh={() => loadLog(r.bookingId, at?.id)}
                />

              </div>
            </div>
          </>
        );
      })()}
    </BusinessSidebarWrapper>
  );
}

// ---------------------------------------------------------------------------
// Original vs Replacement, side by side. Both white cards now — old on the
// left, new on the right.
// ---------------------------------------------------------------------------
function OfferCards({ r, result, checking }: { r: any; result: any; checking?: boolean }) {
  const live = result?.live;
  const at = r.attempt;
  const statusChip = at?.status === 'confirmed' ? { t: 'Rebooked', bg: '#DCFCE7', fg: GREEN }
    : at?.awaitingCancel ? { t: 'Original still live', bg: '#FEE2E2', fg: RED }
    : at?.status === 'needs_review' ? { t: 'Needs review', bg: '#FEF3C7', fg: AMBER }
    : live ? { t: 'Live rate', bg: '#EEF2F7', fg: SLATE } : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
      {/* OLD — left, white */}
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, color: NAVY }}>Current booking</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>{r.bookingDate ? `Booked ${fmtDate(r.bookingDate, true)}` : ''}</div>
        </div>
        <Field label="Room" value={r.roomDescription || r.room} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label="Board" value={r.board} />
          <Field label="Currently paying" value={r.origUsd != null ? `$${r.origUsd.toLocaleString()}` : '—'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label="Cancellation" value={policyLabel(r.nonRefundable, r.cancelBy)} />
          <Field label="Supplier" value={r.supplier} />
        </div>
      </div>

      {/* NEW — right, white */}
      <div style={{ background: '#fff', border: `1px solid ${live ? BLUE : LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: live ? '0 0 0 3px rgba(0,147,255,.08)' : '0 1px 2px rgba(16,24,40,.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, color: NAVY }}>Replacement</div>
            {statusChip && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: statusChip.bg, color: statusChip.fg }}>{statusChip.t}</span>}
          </div>
          {at?.newBookingId && <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: MUTED }}>{at.newBookingId}</span>}
        </div>
        {live ? (
          <>
            <Field label="Room" value={live.roomDescription || live.room} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <Field label="Board" value={live.board} />
              <Field label="New price" value={live.usd != null ? `$${live.usd.toLocaleString()}` : '—'} />
              <Field label="Saving" value={result.gapUsd > 0 ? `$${Math.round(result.gapUsd)}` : '—'} accent={result.gapUsd > 0 ? GREEN : undefined} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Cancellation" value={policyLabel(live.nonRefundable, live.cancelBy)} />
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic', paddingTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>{checking ? <><Spinner color={BLUE} size={13} /> Fetching live rate…</> : 'No live rate yet.'}</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: accent || NAVY, fontWeight: accent ? 700 : 500, wordBreak: 'break-word' }}>
        {value == null || value === '' ? <span style={{ color: MUTED }}>—</span> : value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The rate list. Every row is selectable — the operator is reading the whole
// list, so every rate is a candidate. The gate's match is pre-selected and
// marked, but nothing is locked.
// ---------------------------------------------------------------------------
function RateChooser({ rates, selected, onSelect, onBook, booking, origUsd }: any) {
  const [open, setOpen] = useState(true);
  const eligibleCount = rates.filter((r: any) => r.eligible).length;
  const chosen = rates.find((r: any) => r.rateKey === selected) || null;

  return (
    <div style={{ marginTop: 4, marginBottom: 20 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        Choose a room ({rates.length} live rates · {eligibleCount} clean match{eligibleCount === 1 ? '' : 'es'})
      </button>

      {open && (
        <>
          <div style={{ marginTop: 12, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1.6fr) 130px 110px 110px 110px', gap: 12, padding: '9px 14px', background: '#FBFCFE', borderBottom: `1px solid ${LINE}` }}>
              {['', 'Room', 'Board', 'Price', 'vs yours', 'Cancel by'].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, textAlign: i === 3 || i === 4 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {rates.map((rt: any, i: number) => {
                const isSel = rt.rateKey && rt.rateKey === selected;
                const bookable = Boolean(rt.rateKey);
                return (
                  <label key={i} style={{
                    display: 'grid', gridTemplateColumns: '32px minmax(0,1.6fr) 130px 110px 110px 110px', gap: 12,
                    padding: '11px 14px', alignItems: 'center', borderBottom: i < rates.length - 1 ? `1px solid ${LINE}` : 'none',
                    background: isSel ? '#EFF8FF' : rt.eligible ? '#F0FDF4' : '#fff',
                    cursor: bookable ? 'pointer' : 'not-allowed', opacity: bookable ? 1 : 0.55,
                  }}>
                    <input type="radio" checked={isSel} disabled={!bookable}
                      onChange={() => bookable && onSelect(rt.rateKey)}
                      style={{ accentColor: BLUE, cursor: bookable ? 'pointer' : 'not-allowed' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: NAVY, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.roomDescription || rt.roomType}</span>
                        {rt.eligible && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, color: GREEN, background: '#DCFCE7', padding: '2px 6px', borderRadius: 10 }}>CLEAN MATCH</span>}
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
                  </label>
                );
              })}
            </div>
          </div>

          {(() => {
            const saves = chosen && chosen.vsOriginalUsd > 0;
            const diffs = chosen?.blockers?.length || 0;
            return (
              <>
                <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    {chosen ? (
                      <>
                        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14.5, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 560 }}>{chosen.roomDescription || chosen.roomType}</div>
                        <div style={{ fontSize: 13, color: SLATE, marginTop: 5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span>{chosen.board} · <strong style={{ color: NAVY }}>${chosen.usd}</strong></span>
                          {saves
                            ? <strong style={{ color: GREEN }}>saves ${chosen.vsOriginalUsd}</strong>
                            : <strong style={{ color: RED }}>costs ${Math.abs(chosen.vsOriginalUsd || 0)} more</strong>}
                          {diffs > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, background: '#FEF3C7', padding: '3px 9px', borderRadius: 20 }}>{diffs} difference{diffs > 1 ? 's' : ''} accepted</span>}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13.5, color: MUTED }}>Select a room above to rebook.</div>
                    )}
                  </div>
                  <button onClick={onBook} disabled={!chosen || booking}
                    style={{
                      border: saves ? 'none' : `1.5px solid ${BLUE}`, borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700, fontFamily: BODY,
                      background: !chosen ? '#E2E8F0' : saves ? BLUE : '#fff', color: !chosen ? MUTED : saves ? '#fff' : BLUE,
                      cursor: !chosen || booking ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                    }}>
                    {booking ? <><Spinner color={saves ? '#fff' : BLUE} /> Rebooking…</> : saves ? 'Rebook' : 'Rebook anyway'}
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>
                  Books the replacement only. The original stays live until you cancel it.
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outcome of a book or cancel action, including the states that need a human.
// ---------------------------------------------------------------------------
function ActionOutcome({ act, onCancel, cancelling, onAck }: any) {
  if (act.status === 'awaiting_cancel') {
    return (
      <div style={{ marginBottom: 18, padding: '14px 16px', background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Replacement confirmed — both bookings are live</div>
        <div style={{ fontSize: 12.5, color: '#991B1B', marginTop: 5, lineHeight: 1.5 }}>
          New booking <strong style={{ fontFamily: 'monospace' }}>{act.newBookingId}</strong> is confirmed
          {act.grossProfit != null ? ` · GRN gross profit ${act.grossProfit}` : ''}.
          The original is still live and will be billed until it is cancelled.
        </div>
        {act.acceptedDifferences?.length > 0 && (
          <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
            {act.acceptedDifferences.map((d: string, i: number) => <li key={i} style={{ fontSize: 11.5, color: '#78350F' }}>Accepted: {d}</li>)}
          </ul>
        )}
        <button onClick={onCancel} disabled={cancelling}
          style={{ marginTop: 10, border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, background: RED, color: '#fff', cursor: cancelling ? 'wait' : 'pointer' }}>
          {cancelling ? 'Cancelling…' : 'Cancel original now'}
        </button>
      </div>
    );
  }
  if (act.status === 'confirmed') {
    return (
      <div style={{ marginBottom: 18, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, fontSize: 12.5, color: '#166534' }}>
        <strong>Done.</strong> {act.message}
        {act.cancellationReference ? <span style={{ fontFamily: 'monospace' }}> · {act.cancellationReference}</span> : null}
      </div>
    );
  }
  if (act.needsAcknowledgement) {
    return (
      <div style={{ marginBottom: 18, padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#78350F' }}>This booking has a guest comment</div>
        <div style={{ fontSize: 12.5, color: '#78350F', marginTop: 6, fontStyle: 'italic' }}>&quot;{act.guestComment}&quot;</div>
        <div style={{ fontSize: 12, color: '#78350F', marginTop: 6 }}>The rebooking payload cannot carry comments, so this request will not reach the new booking.</div>
        <button onClick={onAck}
          style={{ marginTop: 10, border: `1px solid #FDE68A`, borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: AMBER, cursor: 'pointer' }}>
          I&apos;ve read it — proceed anyway
        </button>
      </div>
    );
  }
  const isBad = act.status === 'needs_review' || act.status === 'unknown' || act.error;
  return (
    <div style={{ marginBottom: 18, padding: '12px 16px', background: isBad ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${isBad ? '#FECACA' : LINE}`, borderRadius: 12, fontSize: 12.5, color: isBad ? RED : SLATE }}>
      {act.status === 'unknown' && <div style={{ fontWeight: 700, marginBottom: 4 }}>Unknown outcome — check GRN before retrying</div>}
      {act.status === 'needs_review' && <div style={{ fontWeight: 700, marginBottom: 4 }}>Needs review</div>}
      {act.error || act.message}
      {Array.isArray(act.blockers) && act.blockers.length > 0 && (
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          {act.blockers.map((b: string, i: number) => <li key={i} style={{ marginTop: 2 }}>{b}</li>)}
        </ul>
      )}
      {Array.isArray(act.missing) && act.missing.length > 0 && (
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          {act.missing.map((b: string, i: number) => <li key={i} style={{ marginTop: 2 }}>Missing: {b}</li>)}
        </ul>
      )}
      {act.newBookingId && <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 11.5 }}>New booking: {act.newBookingId}</div>}
      {act.detail && <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 11, color: '#991B1B' }}>{act.detail}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-step GRN call log, one tab per step. Request and response verbatim.
// ---------------------------------------------------------------------------
function StepLog({ steps, activeTab, setTab, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  if (!steps.length) {
    return (
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
        <button onClick={onRefresh} style={{ border: 'none', background: 'transparent', color: BLUE, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', padding: 0 }}>
          Call log — none yet · refresh
        </button>
      </div>
    );
  }
  const s = steps[Math.min(activeTab, steps.length - 1)];
  const copy = () => {
    const txt = steps.map((x: any) =>
      `=========\n[${x.at}](${Math.round((x.durationMs || 0) / 1000)}s)\n${x.step}\n=========\n\n${x.method} ${x.url}\n\n${JSON.stringify(x.request, null, 2)}\n\n-----\nHTTP ${x.httpStatus || x.networkError || '?'}\n${JSON.stringify(x.response, null, 2)}\n`
    ).join('\n');
    navigator.clipboard?.writeText(txt);
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          Call log ({steps.length} step{steps.length > 1 ? 's' : ''})
        </button>
        <div style={{ flex: 1 }} />
        {open && <>
          <button onClick={copy} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer' }}>Copy logs</button>
          <button onClick={onRefresh} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer' }}>Refresh</button>
        </>}
      </div>

      {open && (
        <div style={{ marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${LINE}`, background: '#FBFCFE', overflowX: 'auto' }}>
            {steps.map((x: any, i: number) => {
              const bad = x.outcome === 'rejected' || x.outcome === 'unknown';
              const active = i === Math.min(activeTab, steps.length - 1);
              return (
                <button key={i} onClick={() => setTab(i)}
                  style={{
                    border: 'none', background: active ? NAVY : 'transparent', color: active ? '#fff' : bad ? RED : SLATE,
                    padding: '9px 14px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  {x.step}{bad ? ' ⚠' : ''}
                </button>
              );
            })}
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: SLATE, marginBottom: 8 }}>
              <span>{fmtTime(s.at)}</span>
              <span>{Math.round((s.durationMs || 0) / 1000)}s</span>
              <span style={{ fontWeight: 700, color: s.outcome === 'ok' ? GREEN : s.outcome === 'unknown' ? RED : AMBER }}>{s.outcome}</span>
              <span>HTTP {s.httpStatus ?? '—'}</span>
              {s.errorCode && <span style={{ color: RED, fontWeight: 600 }}>{s.errorCode}{s.errorMeaning ? ` — ${s.errorMeaning}` : ''}</span>}
              {s.networkError && <span style={{ color: RED }}>{s.networkError}</span>}
            </div>
            <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: NAVY, wordBreak: 'break-all', marginBottom: 8 }}>{s.method} {s.url}</div>
            <LogBlock title="Request" data={s.request} />
            <LogBlock title="Response" data={s.response} />
          </div>
        </div>
      )}
    </div>
  );
}

function LogBlock({ title, data }: { title: string; data: any }) {
  if (data == null) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, marginBottom: 4 }}>{title}</div>
      <pre style={{ margin: 0, padding: '10px 12px', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 11, lineHeight: 1.5, color: NAVY, overflowX: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
function BookingDetail({ r }: { r: any }) {
  const F = ({ label, value, mono }: { label: string; value: any; mono?: boolean }) => (
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
    <div style={{ marginBottom: 20, border: `1px solid ${LINE}`, borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '9px 16px', background: '#FBFCFE', borderBottom: `1px solid ${LINE}`, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE }}>Booking detail</div>

      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px' }}>
        <F label="GRN booking ID" value={r.bookingId} mono />
        <F label="Booking reference" value={r.bookingReference} mono />
        <F label="Supplier reference" value={r.supplierReference} mono />
        <F label="Booked on" value={r.bookingDate ? fmtTime(r.bookingDate) : null} />
        <F label="Supplier" value={r.supplier} />
        <F label="Hotel code" value={r.hotelCode} mono />
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px', borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
        <F label="Check-in" value={fmtDate(r.checkin, true)} />
        <F label="Check-out" value={fmtDate(r.checkout, true)} />
        <F label="Nights" value={r.nights} />
        <F label="Rooms" value={r.roomCount} />
        <F label="Room code" value={r.roomCode} mono />
        <F label="Board" value={r.board} />
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px 20px', borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
        <F label="Adults" value={r.adults} />
        <F label="Children" value={r.children ? `${r.children} (ages ${r.childrenAges?.length ? r.childrenAges.join(', ') : 'not stated'})` : '0'} />
        <F label="Lead guest" value={r.leadGuest} />
        <F label="All guests" value={guestList.length ? guestList.map((g: any) => g.name + (g.type === 'CH' ? ` (child${g.age != null ? `, ${g.age}` : ''})` : '')).join(' · ') : null} />
      </div>

      {r.guestComment && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${LINE}`, background: '#FFFBEB' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: AMBER, marginBottom: 4 }}>Guest comment — will not carry over</div>
          <div style={{ fontSize: 12.5, color: '#78350F', fontStyle: 'italic' }}>&quot;{r.guestComment}&quot;</div>
        </div>
      )}

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${LINE}`, background: c.nonRefundable === true ? '#FFFBEB' : '#FBFCFE' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 5 }}>Cancellation terms</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: c.nonRefundable === true ? AMBER : c.nonRefundable === false ? GREEN : SLATE }}>
          {policyLabel(c.nonRefundable, c.cancelBy)}
        </div>
        {r.supportsCancellation === false && (
          <div style={{ fontSize: 12, fontWeight: 600, color: RED, marginTop: 5 }}>GRN reports this booking does not support cancellation — it cannot be rebooked.</div>
        )}
        {c.underCancellation === true && (
          <div style={{ fontSize: 12, fontWeight: 600, color: AMBER, marginTop: 5 }}>A cancellation is already in progress on this booking.</div>
        )}
        {c.details && <div style={{ fontSize: 12, color: SLATE, marginTop: 6, lineHeight: 1.5 }}>{c.details}</div>}
        {Array.isArray(c.policies) && c.policies.length > 0 && (() => {
          const lines = c.policies.map((p: any) => {
            if (typeof p === 'string') return p.trim();
            const from = p.from || p.from_date;
            const fee = p.flat_fee ?? p.charge ?? p.amount;
            return [
              from && `From ${fmtDate(from, true)}`,
              fee != null && `fee ${Number(fee).toLocaleString()}${p.currency ? ' ' + p.currency : ''}`,
            ].filter(Boolean).join(' · ');
          }).filter((s: string) => s && s.length > 0);
          if (!lines.length) return null;
          return (
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {lines.map((line: string, i: number) => <li key={i} style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>{line}</li>)}
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

function Blockers({ items, eligible, count, warnings }: any) {
  const warnBlock = (warnings && warnings.length > 0) ? (
    <div style={{ marginTop: 8, padding: '8px 12px', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: MUTED, marginBottom: 4 }}>Noted, not blocking</div>
      {warnings.map((w: string, i: number) => <div key={i} style={{ fontSize: 11.5, color: SLATE, lineHeight: 1.45, marginTop: 2 }}>{w}</div>)}
    </div>
  ) : null;

  if (eligible) {
    return (
      <>
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, color: '#166534' }}>
          Exact same room, same board, same or better cancellation terms.
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
          No clean match — pick a rate below if you want to book one anyway
        </div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {items.map((b: string, i: number) => <li key={i} style={{ fontSize: 12, color: '#78350F', marginTop: 3, lineHeight: 1.45 }}>{b}</li>)}
        </ul>
      </div>
      {warnBlock}
    </>
  );
}

function MatchBadge({ basis, eligible }: { basis?: string; eligible?: boolean }) {
  if (!basis) return null;
  let label, bg, fg;
  if (basis === 'room_code') { label = eligible ? 'Exact match — room code and name' : 'Exact room match — room code and name'; bg = '#DCFCE7'; fg = GREEN; }
  else if (basis === 'room_name_exact') { label = eligible ? 'Exact room match' : 'Exact room match — no drop yet'; bg = '#DCFCE7'; fg = GREEN; }
  else if (basis === 'room_name_blocked') { label = 'Same room — blocked on other terms'; bg = '#FEF3C7'; fg = AMBER; }
  else if (basis === 'no_room_match') { label = 'No matching room in live rates'; bg = '#FEF3C7'; fg = AMBER; }
  else { label = 'No comparable room'; bg = '#F1F5F9'; fg = SLATE; }
  return <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: bg, color: fg, marginBottom: 10 }}>{label}</div>;
}

function Compare({ original, live, match }: any) {
  const Row = ({ label, o, l, ok }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${LINE}`, alignItems: 'center' }}>
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
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: MUTED, paddingBottom: 4 }}>
        <span></span><span>Original</span><span>Live</span>
      </div>
      <Row label="Price" o={original.usd != null ? `$${original.usd}` : '—'} l={live.usd != null ? `$${live.usd}` : '—'} ok={undefined} />
      {(original.roomTypeRaw || live.roomTypeRaw) && original.roomTypeRaw !== original.roomDescriptionRaw && (
        <Row label="Room type" o={original.roomTypeRaw || '—'} l={live.roomTypeRaw || '—'} ok={undefined} />
      )}
      <Row label="Room" o={original.roomDescriptionRaw || original.room || '—'} l={live.roomDescriptionRaw || live.room || '—'} ok={match?.room} />
      <Row label="Board" o={original.board || '—'} l={live.board || '—'} ok={match?.board} />
      <Row label="Terms" o={policyLabel(original.nonRefundable, original.cancelBy)} l={policyLabel(live.nonRefundable, live.cancelBy)} ok={match?.policy} />
      <Row label="Dates" o={`${fmtDate(original.checkin)}→${fmtDate(original.checkout)}`} l={match?.dates ? 'same' : 'differs'} ok={match?.dates} />
    </div>
  );
}
