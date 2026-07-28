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
const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY = "'Plus Jakarta Sans',sans-serif";

// ─── GRID: 7 columns. Booking | Rebook by | Original | Live | Gap | Stage | Action
// Gap gets 108px, Stage 100px, Action 110px — all clearly separated.
const GRID = 'minmax(0,1.6fr) 86px 114px 114px 108px 100px 110px';

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
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
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
function Spinner({ color = BLUE, size = 15 }: { color?: string; size?: number }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

// ─── SKELETON — uses same GRID as the table ─────────────────────────────────
function SkeletonRows() {
  return (
    <>{[0,1,2,3,4,5].map((i) => (
      <div key={i} style={{ borderBottom: `1px solid ${LINE}`, padding: '18px 24px', display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
        <div><div style={{ height: 14, width: '70%', background: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} /><div style={{ height: 11, width: '50%', background: '#EEF2F7', borderRadius: 6, marginBottom: 6 }} /><div style={{ height: 10, width: '40%', background: '#EEF2F7', borderRadius: 6 }} /></div>
        <div style={{ height: 18, width: 36, background: '#E2E8F0', borderRadius: 6 }} />
        <div style={{ height: 18, width: 60, background: '#E2E8F0', borderRadius: 6, marginLeft: 'auto' }} />
        <div style={{ height: 18, width: 50, background: '#EEF2F7', borderRadius: 6, marginLeft: 'auto' }} />
        <div style={{ height: 18, width: 44, background: '#EEF2F7', borderRadius: 6, marginLeft: 'auto' }} />
        <div style={{ height: 14, width: 48, background: '#EEF2F7', borderRadius: 6 }} />
        <div style={{ height: 30, width: 64, background: '#E2E8F0', borderRadius: 20, marginLeft: 'auto' }} />
      </div>
    ))}</>
  );
}

// ─── SHARED DROPDOWN BUTTON STYLE ───────────────────────────────────────────
// All four filter controls use identical pill shape, font, and padding.
const ddBtn = (active = false, activeColor = BLUE): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 10, border: `1px solid ${active ? activeColor : LINE}`, borderRadius: 11,
  padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: '#fff',
  color: active ? activeColor : NAVY, cursor: 'pointer', fontFamily: 'inherit',
  whiteSpace: 'nowrap',
});
const ddMenu: React.CSSProperties = {
  position: 'absolute', top: '112%', left: 0, zIndex: 31, background: '#fff',
  border: `1px solid ${LINE}`, borderRadius: 12,
  boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth: 210,
};
const ddItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
  border: 'none', background: active ? '#EAF6FF' : 'transparent',
  color: active ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600,
  padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
});
function Chevron() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>;
}
function CalIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

// ─── PRICE DROPDOWN ───────────────────────────────────────────────────────────
const PRICE_RANGES = [
  { value: 'any', label: 'Any price' },
  { value: '0-250', label: 'Under $250' },
  { value: '251-500', label: '$251 – $500' },
  { value: '501-750', label: '$501 – $750' },
  { value: '751-1000', label: '$751 – $1,000' },
  { value: '1001-2000', label: '$1,001 – $2,000' },
  { value: '2001-999999', label: 'Above $2,000' },
];
function PriceDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = PRICE_RANGES.find(r => r.value === value)?.label || 'Any price';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={ddBtn(value !== 'any')}><span>{label}</span><Chevron /></button>
      {open && (<>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={ddMenu}>
          {PRICE_RANGES.map(({ value: v, label: l }) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={ddItem(value === v)}>{l}</button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ─── STAGE DROPDOWN ───────────────────────────────────────────────────────────
const STAGE_OPTS = [
  { value: 'all', label: 'All bookings', dot: null },
  { value: 'pending_cancel', label: 'Pending cancellation', dot: RED },
  { value: 'needs_review', label: 'Needs review', dot: AMBER },
  { value: 'rebooked', label: 'Rebooked', dot: GREEN },
];
function StageDropdown({ view, viewCounts, onChange }: { view: string; viewCounts: any; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = STAGE_OPTS.find(s => s.value === view) || STAGE_OPTS[0];
  const countFor = (v: string) => v === 'pending_cancel' ? viewCounts.pendingCancel : v === 'needs_review' ? viewCounts.needsReview : v === 'rebooked' ? viewCounts.rebooked : null;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={ddBtn(view !== 'all', cur.dot || BLUE)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {cur.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cur.dot, flexShrink: 0 }} />}
          {cur.label}{countFor(view) ? ` (${countFor(view)})` : ''}
        </span>
        <Chevron />
      </button>
      {open && (<>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={ddMenu}>
          {STAGE_OPTS.map(({ value: v, label: l, dot }) => {
            const cnt = countFor(v);
            return (
              <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={ddItem(view === v)}>
                {dot ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} /> : <span style={{ width: 7 }} />}
                {l}{cnt ? ` (${cnt})` : ''}
              </button>
            );
          })}
        </div>
      </>)}
    </div>
  );
}

// ─── CALENDAR PICKER ─────────────────────────────────────────────────────────
// Fix: selecting FROM date is always possible. Stage resets to 'from' whenever
// user clicks a date that equals or precedes the current selFrom.
// The "reset" pill lets the user restart from scratch at any time.
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ from, to, onApply, onClose }: { from: string; to: string; onApply: (f: string, t: string) => void; onClose: () => void }) {
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const initFrom = from || '';
  const [selFrom, setSelFrom] = useState(initFrom);
  const [selTo, setSelTo] = useState(to || '');
  const [stage, setStage] = useState<'from'|'to'>(initFrom ? 'to' : 'from');
  const [hovered, setHovered] = useState('');

  // Always show the month relevant to the current stage
  const initDate = selFrom ? new Date(selFrom + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(stage === 'to' && selTo ? new Date(selTo + 'T00:00:00').getFullYear() : initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(stage === 'to' && selTo ? new Date(selTo + 'T00:00:00').getMonth() : initDate.getMonth());

  function ds(y: number, m: number, d: number) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }

  function handleDay(d: string) {
    if (stage === 'from') {
      // Picking start date — always works, clears end date
      setSelFrom(d); setSelTo(''); setStage('to');
      // Advance calendar to next month for end date picking
      const nd = new Date(d + 'T00:00:00');
      if (nd.getMonth() === 11) { setViewMonth(0); setViewYear(nd.getFullYear()+1); }
      else { setViewMonth(nd.getMonth()+1); setViewYear(nd.getFullYear()); }
    } else {
      // Picking end date
      if (d <= selFrom) {
        // Clicked same or earlier — restart from this date as the new FROM
        setSelFrom(d); setSelTo(''); setStage('to');
        const nd = new Date(d + 'T00:00:00');
        if (nd.getMonth() === 11) { setViewMonth(0); setViewYear(nd.getFullYear()+1); }
        else { setViewMonth(nd.getMonth()+1); setViewYear(nd.getFullYear()); }
      } else {
        setSelTo(d); setStage('from'); // done, both set
      }
    }
  }

  function resetSelection() { setSelFrom(''); setSelTo(''); setStage('from'); const n = new Date(); setViewMonth(n.getMonth()); setViewYear(n.getFullYear()); }

  const first = new Date(viewYear, viewMonth, 1).getDay();
  const total = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells: (number|null)[] = [...Array(first).fill(null), ...Array.from({length: total}, (_,i) => i+1)];

  const inRange = (d: string) => { const end = selTo || (stage === 'to' ? hovered : ''); return selFrom && end && d > selFrom && d < end; };
  const isPast = (d: string) => d < todayStr;

  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: '0 20px 50px -20px rgba(16,24,40,.32)', padding: '18px 16px', width: 304, userSelect: 'none' }}>
      {/* Stage indicator + reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: stage === 'from' ? BLUE : SLATE }}>
          {stage === 'from' ? '① Pick start date' : '② Pick end date'}
        </div>
        {(selFrom || selTo) && (
          <button onClick={resetSelection} style={{ border: 'none', background: '#F1F5F9', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: SLATE, cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
        )}
      </div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 10px', fontSize: 18, color: SLATE, lineHeight: 1 }}>‹</button>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, color: NAVY }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 10px', fontSize: 18, color: SLATE, lineHeight: 1 }}>›</button>
      </div>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
        {WDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: MUTED, padding: '2px 0' }}>{d}</div>)}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const d = ds(viewYear, viewMonth, day);
          const isF = d === selFrom;
          const isT = d === selTo;
          const inR = Boolean(inRange(d));
          const past = isPast(d);
          // In 'to' stage, dates before selFrom are not past — they just restart the selection
          // We only truly disable dates before today
          const disabled = past;
          const isToday = d === todayStr;
          return (
            <button key={d} disabled={disabled}
              onClick={() => !disabled && handleDay(d)}
              onMouseEnter={() => stage === 'to' && !disabled && setHovered(d)}
              onMouseLeave={() => setHovered('')}
              style={{
                border: 'none',
                borderRadius: (isF || isT) ? '50%' : inR ? 0 : '50%',
                padding: '6px 0', fontSize: 12.5,
                fontWeight: (isF || isT) ? 700 : 400,
                background: (isF || isT) ? BLUE : inR ? '#DBEAFE' : 'transparent',
                color: (isF || isT) ? '#fff' : disabled ? '#CBD5E1' : inR ? BLUE : NAVY,
                cursor: disabled ? 'not-allowed' : 'pointer',
                position: 'relative', outline: 'none',
                transition: 'background 0.1s',
                textAlign: 'center',
              }}>
              {day}
              {isToday && !isF && !isT && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: BLUE }} />}
            </button>
          );
        })}
      </div>
      {/* Range display */}
      <div style={{ marginTop: 12, padding: '9px 12px', background: '#F6F8FB', borderRadius: 9, fontSize: 12.5, color: SLATE, display: 'flex', justifyContent: 'space-between' }}>
        <span>From: <strong style={{ color: selFrom ? NAVY : MUTED }}>{selFrom ? fmtDate(selFrom, true) : '—'}</strong></span>
        <span>To: <strong style={{ color: selTo ? NAVY : MUTED }}>{selTo ? fmtDate(selTo, true) : '—'}</strong></span>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onClose} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 600, background: '#fff', color: SLATE, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={() => selFrom && selTo && onApply(selFrom, selTo)} disabled={!selFrom || !selTo}
          style={{ flex: 1, border: 'none', borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 700, background: selFrom && selTo ? BLUE : '#E2E8F0', color: selFrom && selTo ? '#fff' : MUTED, cursor: selFrom && selTo ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── DEADLINE DROPDOWN ────────────────────────────────────────────────────────
const DEADLINE_LABELS: Record<string, string> = {
  '3d': 'Closing ≤ 3 days', '1w': 'Closing ≤ 1 week',
  '1m': 'Closing ≤ 1 month', '1y': 'Closing ≤ 1 year', 'any': 'Any deadline',
};
function DeadlineDropdown({ deadline, open, setOpen, customFrom, customTo, onPreset, onCustom }: any) {
  const [showCal, setShowCal] = useState(false);
  const isCustom = deadline === 'custom';
  const label = isCustom && (customFrom || customTo)
    ? `${customFrom ? fmtDate(customFrom) : '…'} → ${customTo ? fmtDate(customTo) : '…'}`
    : (DEADLINE_LABELS[deadline] || DEADLINE_LABELS['3d']);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); setShowCal(false); }} style={{ ...ddBtn(isCustom && !!(customFrom || customTo)), minWidth: 168 }}>
        <span>{label}</span><Chevron />
      </button>
      {open && (<>
        <div onClick={() => { setOpen(false); setShowCal(false); }} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={{ position: 'absolute', top: '112%', left: 0, zIndex: 31 }} onClick={e => e.stopPropagation()}>
          {!showCal ? (
            <div style={ddMenu}>
              {Object.entries(DEADLINE_LABELS).map(([v, l]) => (
                <button key={v} onClick={() => { onPreset(v); setOpen(false); }} style={ddItem(deadline === v && !isCustom)}>{l}</button>
              ))}
              <div style={{ borderTop: `1px solid ${LINE}`, margin: '4px 6px' }} />
              <button onClick={() => setShowCal(true)} style={{ ...ddItem(isCustom), color: isCustom ? BLUE : NAVY }}>
                <CalIcon />Custom range…
              </button>
            </div>
          ) : (
            <CalendarPicker
              from={customFrom} to={customTo}
              onApply={(f, t) => { onCustom(f, t); setShowCal(false); setOpen(false); }}
              onClose={() => { setShowCal(false); }}
            />
          )}
        </div>
      </>)}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
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
  const [priceRange, setPriceRange] = useState('any');
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
    setLoading(true); setError(null);
    const qParam = cityQuery ? `&q=${encodeURIComponent(cityQuery)}` : '';
    const customParam = (deadline === 'custom' && (customFrom || customTo))
      ? `${customFrom ? `&from=${encodeURIComponent(customFrom)}` : ''}${customTo ? `&to=${encodeURIComponent(customTo)}` : ''}`
      : '';
    const priceParam = priceRange !== 'any' ? `&price=${encodeURIComponent(priceRange)}` : '';
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?page=${page}${qParam}&deadline=${deadline}${customParam}${priceParam}&view=${view}&_t=${Date.now()}`)
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
  }, [page, cityQuery, deadline, customFrom, customTo, priceRange, view, reloadKey]);

  async function checkPrice(bookingId: string) {
    setChecking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: bookingId }) });
      const d = await r.json();
      if (d.error) { setResults(p => ({ ...p, [bookingId]: { error: d.error } })); }
      else {
        setResults(p => ({ ...p, [bookingId]: d }));
        const pick = (d.allRates || []).find((x: any) => x.eligible && x.vsOriginalUsd > 0) || null;
        if (pick?.rateKey) setSelectedRate(p => ({ ...p, [bookingId]: pick.rateKey }));
        else setSelectedRate(p => { const n = { ...p }; delete n[bookingId]; return n; });
        loadHistory(bookingId);
      }
    } catch (e: any) { setResults(p => ({ ...p, [bookingId]: { error: e.message } })); }
    finally { setChecking(null); }
  }

  async function bookReplacement(bookingId: string, acknowledgeComment = false) {
    const result = results[bookingId];
    const rateKey = selectedRate[bookingId];
    const rate = (result?.allRates || []).find((x: any) => x.rateKey === rateKey);
    if (!rateKey || !rate) { alert('Select a rate first.'); return; }
    const lines = [`Book this replacement?`, ``, `${rate.roomDescription || rate.roomType}`, `${rate.board} · $${rate.usd}`, rate.vsOriginalUsd > 0 ? `Saves $${rate.vsOriginalUsd}` : `NOT cheaper than the original`];
    if (rate.blockers?.length) lines.push(``, `You are accepting:`, ...rate.blockers.map((b: string) => `· ${b}`));
    lines.push(``, `The original booking will NOT be cancelled yet.`);
    if (!window.confirm(lines.join('\n'))) return;
    setBooking(bookingId);
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/book-replacement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: bookingId, rate_key: rateKey, group_code: rate.groupCode || undefined, acknowledge_comment: acknowledgeComment }) });
      const d = await r.json();
      setActionResult(p => ({ ...p, [bookingId]: { ...d, httpStatus: r.status } }));
      loadLog(bookingId, d.rebookingId);
      setReloadKey(k => k + 1);
    } catch (e: any) { setActionResult(p => ({ ...p, [bookingId]: { error: e.message } })); }
    finally { setBooking(null); }
  }

  async function cancelOriginal(bookingId: string, attemptId: number | null, standalone = false) {
    if (!window.confirm(standalone ? 'Cancel this booking outright? This permanently cancels a live reservation.' : 'Cancel the ORIGINAL booking? The replacement is already confirmed.')) return;
    setCancelling(bookingId);
    try {
      const body: any = standalone ? { booking_id: bookingId, confirm: true } : { attempt_id: attemptId };
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/cancel-original`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      setActionResult(p => ({ ...p, [bookingId]: { ...d, httpStatus: r.status } }));
      loadLog(bookingId, attemptId);
      setReloadKey(k => k + 1);
    } catch (e: any) { setActionResult(p => ({ ...p, [bookingId]: { error: e.message } })); }
    finally { setCancelling(null); }
  }

  async function loadHistory(bookingId: string) {
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/history?booking_id=${encodeURIComponent(bookingId)}&_t=${Date.now()}`);
      const d = await r.json();
      setHistory(p => ({ ...p, [bookingId]: d.checks || [] }));
    } catch { }
  }

  async function loadLog(bookingId: string, attemptId?: number | null) {
    try {
      const q = attemptId ? `attempt_id=${attemptId}` : `booking_id=${encodeURIComponent(bookingId)}`;
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/repricing/attempt-log?${q}&_t=${Date.now()}`);
      const d = await r.json();
      setLogs(p => ({ ...p, [bookingId]: d.steps || [] }));
    } catch { }
  }

  function openDrawer(bookingId: string) {
    setExpanded(bookingId);
    if (!history[bookingId]) loadHistory(bookingId);
    if (!logs[bookingId]) loadLog(bookingId);
  }
  function closeDrawer() { setExpanded(null); }

  const hasActiveFilter = citySearch || deadline !== '3d' || view !== 'all' || priceRange !== 'any';
  const openRow = rows.find(r => r.bookingId === expanded) || null;

  // Column header alignment: right-align Original(2), Live(3), Gap(4), Action(6)
  const HEADER_ALIGN = [false, false, true, true, true, false, true];

  return (
    <BusinessSidebarWrapper>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes drawerIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes skeletonPulse { 0%{opacity:1} 50%{opacity:0.4} 100%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY }}>
        {/* ── Header ── */}
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: '-0.7px', color: NAVY, margin: 0 }}>Repricing</h1>
          <p style={{ fontSize: 14.5, color: SLATE, marginTop: 4, marginBottom: 0 }}>Check a booking&apos;s live price, pick a rate, book the replacement, then cancel the original.</p>
        </div>

        {/* ── Filter bar ── */}
        <div style={{ padding: '20px 40px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 1 300px', minWidth: 180 }}>
            <input value={citySearch} onChange={e => setCitySearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setCityQuery(citySearch.trim()); setPage(1); } }}
              placeholder="Search city, hotel, booking ID or guest…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 12px 9px 34px', fontSize: 13.5, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>

          <DeadlineDropdown deadline={deadline} open={ddOpen} setOpen={setDdOpen}
            customFrom={customFrom} customTo={customTo}
            onPreset={(v: string) => { setDeadline(v); setPage(1); setDdOpen(false); closeDrawer(); }}
            onCustom={(f: string, t: string) => { setCustomFrom(f); setCustomTo(t); setDeadline('custom'); setPage(1); setDdOpen(false); closeDrawer(); }} />

          <PriceDropdown value={priceRange} onChange={v => { setPriceRange(v); setPage(1); closeDrawer(); }} />

          <StageDropdown view={view} viewCounts={viewCounts} onChange={v => { setView(v); setPage(1); closeDrawer(); }} />

          {hasActiveFilter && (
            <button onClick={() => { setCitySearch(''); setCityQuery(''); setDeadline('3d'); setCustomFrom(''); setCustomTo(''); setPriceRange('any'); setView('all'); setPage(1); closeDrawer(); }}
              style={{ border: 'none', background: 'transparent', color: SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: '9px 4px' }}>
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: MUTED }}>
            {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Spinner size={11} /> Loading…</span> : `${total.toLocaleString()} shown`}
          </span>
        </div>

        {error && <div style={{ margin: '14px 40px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 11, padding: '11px 15px', fontSize: 13, color: RED }}>{error}</div>}

        {/* ── Table ── */}
        <div style={{ padding: '16px 40px 48px' }}>
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(16,24,40,.04)' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 0, padding: '12px 24px', borderBottom: `1px solid ${LINE}`, background: '#FAFBFD' }}>
              {['Booking','Rebook by','Original','Live price','Gap','Stage','Action'].map((h, i) => (
                <div key={i} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: MUTED, textAlign: HEADER_ALIGN[i] ? 'right' : 'left', paddingRight: i === 6 ? 0 : (i >= 2 && i <= 4) ? 8 : 0 }}>{h}</div>
              ))}
            </div>

            {loading ? <SkeletonRows />
              : rows.length === 0 ? (
                <div style={{ padding: '56px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>No bookings match your filters.
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  {rows.map(r => {
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
                      <div key={r.bookingId} style={{ borderBottom: `1px solid ${LINE}`, background: atRisk ? '#FEF2F2' : needsReview ? '#FFFBEB' : isChecked ? '#F7FBFF' : '#fff', borderLeft: atRisk ? `3px solid ${RED}` : needsReview ? `3px solid ${AMBER}` : isChecked ? `3px solid rgba(0,147,255,.5)` : '3px solid transparent', transition: 'background 0.15s' }}>
                        {atRisk && (
                          <div style={{ padding: '7px 24px', background: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>Original still live · replacement confirmed {minsSince(at.updatedAt)} min ago</span>
                            <span style={{ fontSize: 11, color: '#991B1B', fontFamily: 'monospace' }}>{at.newBookingId}</span>
                            <div style={{ flex: 1 }} />
                            <button onClick={e => { e.stopPropagation(); cancelOriginal(r.bookingId, at.id); }} disabled={cancelling === r.bookingId}
                              style={{ border: 'none', borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 700, background: RED, color: '#fff', cursor: cancelling === r.bookingId ? 'wait' : 'pointer' }}>
                              {cancelling === r.bookingId ? 'Cancelling…' : 'Cancel original now'}
                            </button>
                          </div>
                        )}
                        {needsReview && <div style={{ padding: '7px 24px', background: '#FEF3C7', fontSize: 12, color: '#78350F' }}><strong>Needs review</strong>{at.failureStage ? ` · ${at.failureStage}` : ''} — {at.failureReason || 'unresolved'}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 0, padding: '16px 24px', alignItems: 'center' }}>
                          {/* Booking */}
                          <div style={{ minWidth: 0, paddingRight: 12 }}>
                            <div style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                            <div style={{ fontSize: 12, color: SLATE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, `${fmtDate(r.checkin)}→${fmtDate(r.checkout)}`].filter(Boolean).join(' · ')}</div>
                            <div style={{ fontSize: 10, color: MUTED, marginTop: 2, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.bookingId}{r.supplier ? ` · ${r.supplier}` : ''}</div>
                          </div>
                          {/* Rebook by */}
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: deadlineColor }}>{dLeft != null ? `${dLeft}d` : '—'}</div>
                            <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>left</div>
                          </div>
                          {/* Original */}
                          <div style={{ textAlign: 'right', paddingRight: 8 }}>
                            <div style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700, color: NAVY }}>{r.origUsd != null ? `$${r.origUsd.toLocaleString()}` : '—'}</div>
                            <div style={{ fontSize: 9.5, color: MUTED, fontFamily: 'monospace', marginTop: 2 }}>{r.origCur} {r.origLocal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                          {/* Live */}
                          <div style={{ textAlign: 'right', paddingRight: 8 }}>
                            {unavailable ? <span style={{ fontSize: 11.5, color: AMBER }}>Sold out</span>
                              : live?.usd != null ? <div style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700, color: dropped ? GREEN : NAVY }}>${live.usd.toLocaleString()}</div>
                              : <span style={{ fontSize: 13, color: MUTED }}>—</span>}
                            {checkedAt && <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>{fmtTime(checkedAt)}</div>}
                          </div>
                          {/* Gap */}
                          <div style={{ textAlign: 'right', paddingRight: 8 }}>
                            {dropped && gapUsd != null ? (<>
                              <div style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700, color: GREEN }}>−${Math.round(gapUsd).toLocaleString()}</div>
                              <div style={{ fontSize: 9.5, color: GREEN, marginTop: 1 }}>{gapPct}% off</div>
                            </>) : checkedAt && !unavailable ? <span style={{ fontSize: 12, color: MUTED }}>No drop</span>
                              : <span style={{ fontSize: 12, color: MUTED }}>—</span>}
                          </div>
                          {/* Stage */}
                          <div>
                            {done ? <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>✓ Rebooked</span>
                              : atRisk ? <span style={{ fontSize: 11, fontWeight: 700, color: RED }}>⚠ Action needed</span>
                              : needsReview ? <span style={{ fontSize: 11, fontWeight: 600, color: AMBER }}>Review</span>
                              : isChecked ? <span style={{ fontSize: 11, fontWeight: 600, color: BLUE }}>Checked</span>
                              : <span style={{ fontSize: 11, color: MUTED }}>—</span>}
                          </div>
                          {/* Action */}
                          <div style={{ textAlign: 'right' }}>
                            <button onClick={() => openDrawer(r.bookingId)}
                              style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                                ...(done ? { border: 'none', background: '#DCFCE7', color: GREEN }
                                  : atRisk ? { border: 'none', background: RED, color: '#fff' }
                                  : { border: `1.5px solid ${BLUE}`, background: '#fff', color: BLUE }) }}>
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPage(p => Math.max(1, p-1)); closeDrawer(); }} disabled={page === 1}
                  style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: '7px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => { setPage(p => p+1); closeDrawer(); }} disabled={!hasMore}
                  style={{ border: 'none', borderRadius: 9, padding: '7px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DRAWER ── */}
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
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 264, background: BG, zIndex: 40, display: 'flex', flexDirection: 'column', animation: 'drawerIn .28s ease', boxShadow: '-24px 0 48px -24px rgba(16,24,40,.3)', fontFamily: BODY }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 32px', borderBottom: `1px solid ${LINE}`, background: '#fff', flexShrink: 0 }}>
              <button onClick={closeDrawer} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${LINE}`, background: '#fff', borderRadius: 10, padding: '8px 14px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', color: NAVY, fontFamily: 'inherit', flexShrink: 0 }}>← Back</button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px', color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.hotel}</div>
                <div style={{ fontSize: 13, color: SLATE, marginTop: 2 }}>{[r.city, `${fmtDate(r.checkin)} → ${fmtDate(r.checkout)}`, r.nights ? `${r.nights}n` : null, dLeft != null ? `rebook by ${fmtDate(r.cancelBy)} · ${dLeft}d left` : null].filter(Boolean).join(' · ')}</div>
              </div>
              {statusChip && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: statusChip.bg, color: statusChip.fg }}>{statusChip.t}</span>}
              <div style={{ fontSize: 24, color: MUTED, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }} onClick={closeDrawer}>×</div>
            </div>

            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px' }}>
              {act && <ActionOutcome act={act} onCancel={() => cancelOriginal(r.bookingId, at?.id ?? null)} cancelling={cancelling === r.bookingId} onAck={() => bookReplacement(r.bookingId, true)} />}

              <OfferCards r={r} result={result} checking={isChecking} />

              {!atRisk && !done && (
                isChecking && !result ? (
                  <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '20px 22px', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Spinner /><div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14.5, color: NAVY }}>Checking live rates…</div>
                    </div>
                    <div style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>Pulling GRN&apos;s live availability for this stay.</div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {[0,1,2].map(k => <div key={k} style={{ height: 44, borderRadius: 9, background: 'linear-gradient(90deg,#F1F3F8 25%,#E7ECF3 37%,#F1F3F8 63%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s ease infinite' }} />)}
                    </div>
                  </div>
                ) : !result ? (
                  <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14.5, color: NAVY }}>Find a lower rate</div>
                      <div style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Pulls GRN&apos;s live rates for this hotel and stay, then compares.</div>
                    </div>
                    <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking}
                      style={{ border: 'none', borderRadius: 11, padding: '11px 22px', fontFamily: BODY, fontSize: 14.5, fontWeight: 700, background: BLUE, color: '#fff', cursor: isChecking ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isChecking ? <><Spinner color="#fff" /> Checking…</> : 'Check live price'}
                    </button>
                  </div>
                ) : result.error ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 11, padding: '13px 16px', fontSize: 13, color: RED, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span>{result.error}</span>
                    <button onClick={() => checkPrice(r.bookingId)} style={{ border: `1px solid #FECACA`, borderRadius: 7, padding: '6px 13px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: RED, cursor: 'pointer' }}>Try again</button>
                  </div>
                ) : null
              )}

              {result?.live && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <MatchBadge basis={result.matchBasis} eligible={result.rebookEligible} />
                    <button onClick={() => checkPrice(r.bookingId)} disabled={isChecking}
                      style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600, background: '#fff', color: isChecking ? MUTED : BLUE, cursor: isChecking ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      {isChecking ? <><Spinner size={11} /> Re-checking…</> : 'Re-check'}
                    </button>
                  </div>
                  <Compare original={result.original} live={result.live} match={result.match} />
                  <Blockers items={result.blockers} eligible={result.rebookEligible} warnings={result.warnings} />
                </div>
              )}

              {result?.allRates && result.allRates.length > 0 && !atRisk && !done && (
                <RateChooser rates={result.allRates} selected={selectedRate[r.bookingId] || null}
                  onSelect={(k: string) => setSelectedRate(p => ({ ...p, [r.bookingId]: k }))}
                  onBook={() => bookReplacement(r.bookingId)}
                  booking={booking === r.bookingId} origUsd={r.origUsd} />
              )}

              <BookingDetail r={r} />

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 8 }}>Check history</div>
                {(history[r.bookingId]?.length) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 440 }}>
                    {history[r.bookingId].map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
                        <span style={{ color: SLATE }}>{fmtTime(h.checked_at)}</span>
                        <span style={{ color: h.dropped ? GREEN : NAVY, fontWeight: 600 }}>${h.live_usd?.toLocaleString() ?? '—'}{h.dropped ? ` · −${Math.round(h.gap_usd)}` : ''}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Checked {history[r.bookingId].length} time{history[r.bookingId].length > 1 ? 's' : ''}</div>
                  </div>
                ) : <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic' }}>Not checked yet.</div>}
              </div>

              <StepLog steps={logs[r.bookingId] || []} activeTab={logTab[r.bookingId] ?? 0}
                setTab={(i: number) => setLogTab(p => ({ ...p, [r.bookingId]: i }))}
                onRefresh={() => loadLog(r.bookingId, at?.id)} />
            </div>
          </div>
        );
      })()}
    </BusinessSidebarWrapper>
  );
}

// ─── OFFER CARDS ──────────────────────────────────────────────────────────────
function OfferCards({ r, result, checking }: { r: any; result: any; checking?: boolean }) {
  const live = result?.live;
  const at = r.attempt;
  const statusChip = at?.status === 'confirmed' ? { t: 'Rebooked', bg: '#DCFCE7', fg: GREEN }
    : at?.awaitingCancel ? { t: 'Original still live', bg: '#FEE2E2', fg: RED }
    : at?.status === 'needs_review' ? { t: 'Needs review', bg: '#FEF3C7', fg: AMBER }
    : live ? { t: 'Live rate', bg: '#EEF2F7', fg: SLATE } : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, color: NAVY }}>Current booking</div>
          <div style={{ fontSize: 11, color: MUTED }}>{r.bookingDate ? `Booked ${fmtDate(r.bookingDate, true)}` : ''}</div>
        </div>
        <Field label="Room" value={r.roomDescription || r.room} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Field label="Board" value={r.board} />
          <Field label="Paying" value={r.origUsd != null ? `$${r.origUsd.toLocaleString()}` : '—'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Field label="Cancellation" value={policyLabel(r.nonRefundable, r.cancelBy)} />
          <Field label="Supplier" value={r.supplier} />
        </div>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${live ? BLUE : LINE}`, borderRadius: 14, padding: '18px 20px', boxShadow: live ? '0 0 0 3px rgba(0,147,255,.07)' : '0 1px 2px rgba(16,24,40,.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, color: NAVY }}>Replacement</div>
            {statusChip && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: statusChip.bg, color: statusChip.fg }}>{statusChip.t}</span>}
          </div>
          {at?.newBookingId && <span style={{ fontSize: 10, fontFamily: 'monospace', color: MUTED }}>{at.newBookingId}</span>}
        </div>
        {live ? (<>
          <Field label="Room" value={live.roomDescription || live.room} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
            <Field label="Board" value={live.board} />
            <Field label="New price" value={live.usd != null ? `$${live.usd.toLocaleString()}` : '—'} />
            <Field label="Saving" value={result.gapUsd > 0 ? `$${Math.round(result.gapUsd)}` : '—'} accent={result.gapUsd > 0 ? GREEN : undefined} />
          </div>
          <div style={{ marginTop: 10 }}><Field label="Cancellation" value={policyLabel(live.nonRefundable, live.cancelBy)} /></div>
        </>) : (
          <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic', paddingTop: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
            {checking ? <><Spinner size={12} /> Fetching live rate…</> : 'No live rate yet. Use "Check live price" above.'}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: accent || NAVY, fontWeight: accent ? 700 : 500, wordBreak: 'break-word' }}>
        {value == null || value === '' ? <span style={{ color: MUTED }}>—</span> : value}
      </div>
    </div>
  );
}

// ─── RATE CHOOSER ─────────────────────────────────────────────────────────────
function RateChooser({ rates, selected, onSelect, onBook, booking, origUsd }: any) {
  const [open, setOpen] = useState(true);
  const eligibleCount = rates.filter((r: any) => r.eligible).length;
  const chosen = rates.find((r: any) => r.rateKey === selected) || null;

  return (
    <div style={{ marginBottom: 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: '0 0 8px 0' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        Choose a room ({rates.length} live rates · {eligibleCount} clean match{eligibleCount === 1 ? '' : 'es'})
      </button>

      {open && (<>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1.6fr) 120px 100px 90px 95px', gap: 10, padding: '8px 14px', background: '#FBFCFE', borderBottom: `1px solid ${LINE}` }}>
            {['','Room','Board','Price','vs yours','Cancel by'].map((h, i) => (
              <div key={i} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: (i===3||i===4) ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {rates.map((rt: any, i: number) => {
              const isSel = rt.rateKey && rt.rateKey === selected;
              const bookable = Boolean(rt.rateKey);
              const costMore = rt.vsOriginalUsd != null && rt.vsOriginalUsd < 0;
              return (
                <label key={i} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1.6fr) 120px 100px 90px 95px', gap: 10, padding: '10px 14px', alignItems: 'center', borderBottom: i < rates.length-1 ? `1px solid ${LINE}` : 'none', background: isSel ? '#EFF8FF' : rt.eligible ? '#F0FDF4' : '#fff', cursor: bookable ? 'pointer' : 'not-allowed', opacity: bookable ? 1 : 0.5 }}>
                  <input type="radio" checked={isSel} disabled={!bookable} onChange={() => bookable && onSelect(rt.rateKey)} style={{ accentColor: BLUE }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 12.5, color: NAVY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rt.roomDescription || rt.roomType}</span>
                      {rt.eligible && <span style={{ flexShrink: 0, fontSize: 8.5, fontWeight: 700, color: GREEN, background: '#DCFCE7', padding: '2px 5px', borderRadius: 8 }}>MATCH</span>}
                      {!rt.eligible && rt.isMatch && <span style={{ flexShrink: 0, fontSize: 8.5, fontWeight: 700, color: AMBER, background: '#FEF3C7', padding: '2px 5px', borderRadius: 8 }}>YOUR ROOM</span>}
                    </div>
                    {!rt.eligible && rt.blockers?.length > 0 && <div style={{ fontSize: 10, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rt.blockers[0]}</div>}
                  </div>
                  <div style={{ fontSize: 11.5, color: SLATE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rt.board}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY }}>{rt.usd != null ? `$${rt.usd.toLocaleString()}` : '—'}</div>
                    <div style={{ fontSize: 9.5, color: MUTED, fontFamily: 'monospace' }}>{rt.currency} {rt.local?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: rt.vsOriginalUsd > 0 ? GREEN : rt.vsOriginalUsd < 0 ? RED : SLATE }}>
                    {rt.vsOriginalUsd == null ? '—' : rt.vsOriginalUsd > 0 ? `−$${rt.vsOriginalUsd}` : rt.vsOriginalUsd < 0 ? `+$${Math.abs(rt.vsOriginalUsd)}` : 'same'}
                  </div>
                  <div style={{ fontSize: 10.5, color: rt.refundable ? SLATE : AMBER }}>{rt.cancelBy ? fmtDate(rt.cancelBy) : (rt.refundable ? 'refundable' : 'non-ref')}</div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Rebook action bar — stacks vertically so text never overflows */}
        {(() => {
          const vs = chosen?.vsOriginalUsd ?? null;
          const saves = vs != null && vs > 0;
          const same = vs != null && vs === 0;
          const costMore = vs != null && vs < 0;
          const diffs = chosen?.blockers?.length || 0;
          const btnDisabled = !chosen || costMore || booking;

          return (
            <div style={{ marginTop: 12, background: '#fff', border: `1px solid ${costMore ? '#FECACA' : LINE}`, borderRadius: 13, padding: '14px 16px' }}>
              {chosen ? (<>
                {/* Room name + meta */}
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13.5, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chosen.roomDescription || chosen.roomType}</div>
                <div style={{ fontSize: 12.5, color: SLATE, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{chosen.board} · <strong style={{ color: NAVY }}>${chosen.usd}</strong></span>
                  {saves && <strong style={{ color: GREEN }}>saves ${vs}</strong>}
                  {same && <span style={{ fontWeight: 600, color: AMBER }}>Same price as original</span>}
                  {costMore && <strong style={{ color: RED }}>↑ ${Math.abs(vs!)} more than original</strong>}
                  {diffs > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, background: '#FEF3C7', padding: '2px 8px', borderRadius: 20 }}>{diffs} difference{diffs > 1 ? 's' : ''} accepted</span>}
                </div>
                {/* Inline warning line — always visible, full width */}
                {costMore && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: RED, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Select a cheaper rate to enable rebooking
                  </div>
                )}
                {same && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: AMBER, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    No price saving — only rebook if cancellation terms are better
                  </div>
                )}
                {/* Button on its own row — never squished */}
                <div style={{ marginTop: 12 }}>
                  <button onClick={!btnDisabled ? onBook : undefined} disabled={btnDisabled}
                    style={{ border: saves ? 'none' : `1.5px solid ${BLUE}`, borderRadius: 10, padding: '11px 28px', fontSize: 14.5, fontWeight: 700, fontFamily: BODY, background: !chosen || costMore ? '#E2E8F0' : saves ? BLUE : '#fff', color: !chosen || costMore ? MUTED : saves ? '#fff' : BLUE, cursor: btnDisabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, opacity: costMore ? 0.6 : 1 }}>
                    {booking ? <><Spinner color={saves ? '#fff' : BLUE} /> Rebooking…</> : saves ? 'Rebook' : same ? 'Rebook (same price)' : 'Rebook'}
                  </button>
                </div>
              </>) : (
                <div style={{ fontSize: 13.5, color: MUTED }}>Select a room above to rebook.</div>
              )}
              <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>Books the replacement only. The original stays live until you cancel it.</div>
            </div>
          );
        })()}
      </>)}
    </div>
  );
}

// ─── ACTION OUTCOME ───────────────────────────────────────────────────────────
function ActionOutcome({ act, onCancel, cancelling, onAck }: any) {
  if (act.status === 'awaiting_cancel') {
    return (
      <div style={{ marginBottom: 16, padding: '13px 15px', background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 11 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Replacement confirmed — both bookings are live</div>
        <div style={{ fontSize: 12.5, color: '#991B1B', marginTop: 4, lineHeight: 1.5 }}>New booking <strong style={{ fontFamily: 'monospace' }}>{act.newBookingId}</strong> is confirmed{act.grossProfit != null ? ` · GRN gross profit ${act.grossProfit}` : ''}. The original is still live.</div>
        {act.acceptedDifferences?.length > 0 && <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>{act.acceptedDifferences.map((d: string, i: number) => <li key={i} style={{ fontSize: 11.5, color: '#78350F' }}>Accepted: {d}</li>)}</ul>}
        <button onClick={onCancel} disabled={cancelling} style={{ marginTop: 9, border: 'none', borderRadius: 9, padding: '8px 15px', fontSize: 12.5, fontWeight: 700, background: RED, color: '#fff', cursor: cancelling ? 'wait' : 'pointer' }}>{cancelling ? 'Cancelling…' : 'Cancel original now'}</button>
      </div>
    );
  }
  if (act.status === 'confirmed') {
    return <div style={{ marginBottom: 16, padding: '11px 15px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 11, fontSize: 12.5, color: '#166534' }}><strong>Done.</strong> {act.message}{act.cancellationReference ? <span style={{ fontFamily: 'monospace' }}> · {act.cancellationReference}</span> : null}</div>;
  }
  if (act.needsAcknowledgement) {
    return (
      <div style={{ marginBottom: 16, padding: '13px 15px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 11 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#78350F' }}>This booking has a guest comment</div>
        <div style={{ fontSize: 12.5, color: '#78350F', marginTop: 5, fontStyle: 'italic' }}>&quot;{act.guestComment}&quot;</div>
        <div style={{ fontSize: 12, color: '#78350F', marginTop: 5 }}>The rebooking payload cannot carry comments.</div>
        <button onClick={onAck} style={{ marginTop: 9, border: `1px solid #FDE68A`, borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: AMBER, cursor: 'pointer' }}>I&apos;ve read it — proceed anyway</button>
      </div>
    );
  }
  const isBad = act.status === 'needs_review' || act.status === 'unknown' || act.error;
  return (
    <div style={{ marginBottom: 16, padding: '11px 15px', background: isBad ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${isBad ? '#FECACA' : LINE}`, borderRadius: 11, fontSize: 12.5, color: isBad ? RED : SLATE }}>
      {act.status === 'unknown' && <div style={{ fontWeight: 700, marginBottom: 3 }}>Unknown outcome — check GRN before retrying</div>}
      {act.status === 'needs_review' && <div style={{ fontWeight: 700, marginBottom: 3 }}>Needs review</div>}
      {act.error || act.message}
      {Array.isArray(act.blockers) && act.blockers.length > 0 && <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>{act.blockers.map((b: string, i: number) => <li key={i} style={{ marginTop: 2 }}>{b}</li>)}</ul>}
      {act.newBookingId && <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 11 }}>New booking: {act.newBookingId}</div>}
      {act.detail && <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 10.5, color: '#991B1B' }}>{act.detail}</div>}
    </div>
  );
}

// ─── STEP LOG ─────────────────────────────────────────────────────────────────
function StepLog({ steps, activeTab, setTab, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  if (!steps.length) {
    return <div style={{ marginTop: 14, paddingTop: 11, borderTop: `1px solid ${LINE}` }}><button onClick={onRefresh} style={{ border: 'none', background: 'transparent', color: BLUE, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', padding: 0 }}>Call log — none yet · refresh</button></div>;
  }
  const s = steps[Math.min(activeTab, steps.length-1)];
  const copy = () => { const txt = steps.map((x: any) => `=========\n[${x.at}]\n${x.step}\n=========\n\n${x.method} ${x.url}\n\n${JSON.stringify(x.request, null, 2)}\n\n-----\nHTTP ${x.httpStatus || x.networkError || '?'}\n${JSON.stringify(x.response, null, 2)}\n`).join('\n'); navigator.clipboard?.writeText(txt); };

  return (
    <div style={{ marginTop: 14, paddingTop: 11, borderTop: `1px solid ${LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <button onClick={() => setOpen((o: boolean) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BLUE, padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          Call log ({steps.length} step{steps.length > 1 ? 's' : ''})
        </button>
        <div style={{ flex: 1 }} />
        {open && <>
          <button onClick={copy} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer' }}>Copy logs</button>
          <button onClick={onRefresh} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 600, background: '#fff', color: NAVY, cursor: 'pointer' }}>Refresh</button>
        </>}
      </div>
      {open && (
        <div style={{ marginTop: 9, border: `1px solid ${LINE}`, borderRadius: 11, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${LINE}`, background: '#FBFCFE', overflowX: 'auto' }}>
            {steps.map((x: any, i: number) => { const bad = x.outcome === 'rejected' || x.outcome === 'unknown'; const active = i === Math.min(activeTab, steps.length-1); return <button key={i} onClick={() => setTab(i)} style={{ border: 'none', background: active ? NAVY : 'transparent', color: active ? '#fff' : bad ? RED : SLATE, padding: '8px 13px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{x.step}{bad ? ' ⚠' : ''}</button>; })}
          </div>
          <div style={{ padding: '11px 13px' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: SLATE, marginBottom: 7 }}>
              <span>{fmtTime(s.at)}</span><span>{Math.round((s.durationMs||0)/1000)}s</span>
              <span style={{ fontWeight: 700, color: s.outcome === 'ok' ? GREEN : s.outcome === 'unknown' ? RED : AMBER }}>{s.outcome}</span>
              <span>HTTP {s.httpStatus ?? '—'}</span>
              {s.errorCode && <span style={{ color: RED, fontWeight: 600 }}>{s.errorCode}</span>}
              {s.networkError && <span style={{ color: RED }}>{s.networkError}</span>}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: NAVY, wordBreak: 'break-all', marginBottom: 7 }}>{s.method} {s.url}</div>
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
    <div style={{ marginTop: 7 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, marginBottom: 3 }}>{title}</div>
      <pre style={{ margin: 0, padding: '9px 11px', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 7, fontSize: 10.5, lineHeight: 1.5, color: NAVY, overflowX: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ─── BOOKING DETAIL ───────────────────────────────────────────────────────────
function BookingDetail({ r }: { r: any }) {
  const F = ({ label, value, mono }: { label: string; value: any; mono?: boolean }) => (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: NAVY, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
        {value == null || value === '' ? <span style={{ color: MUTED }}>—</span> : value}
      </div>
    </div>
  );
  const c = r.cancellation || {};
  const guestList = (r.guests || []).filter((g: any) => g.name);
  return (
    <div style={{ marginBottom: 18, border: `1px solid ${LINE}`, borderRadius: 11, background: '#fff', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', background: '#FBFCFE', borderBottom: `1px solid ${LINE}`, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE }}>Booking detail</div>
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 18px' }}>
        <F label="GRN booking ID" value={r.bookingId} mono />
        <F label="Booking reference" value={r.bookingReference} mono />
        <F label="Supplier reference" value={r.supplierReference} mono />
        <F label="Booked on" value={r.bookingDate ? fmtTime(r.bookingDate) : null} />
        <F label="Supplier" value={r.supplier} />
        <F label="Hotel code" value={r.hotelCode} mono />
      </div>
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 18px', borderTop: `1px solid ${LINE}` }}>
        <F label="Check-in" value={fmtDate(r.checkin, true)} />
        <F label="Check-out" value={fmtDate(r.checkout, true)} />
        <F label="Nights" value={r.nights} />
        <F label="Rooms" value={r.roomCount} />
        <F label="Room code" value={r.roomCode} mono />
        <F label="Board" value={r.board} />
      </div>
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 18px', borderTop: `1px solid ${LINE}` }}>
        <F label="Adults" value={r.adults} />
        <F label="Children" value={r.children ? `${r.children} (ages ${r.childrenAges?.length ? r.childrenAges.join(', ') : 'not stated'})` : '0'} />
        <F label="Lead guest" value={r.leadGuest} />
        <F label="All guests" value={guestList.length ? guestList.map((g: any) => g.name + (g.type === 'CH' ? ` (child${g.age != null ? `, ${g.age}` : ''})` : '')).join(' · ') : null} />
      </div>
      {r.guestComment && <div style={{ padding: '10px 14px', borderTop: `1px solid ${LINE}`, background: '#FFFBEB' }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: AMBER, marginBottom: 3 }}>Guest comment — will not carry over</div><div style={{ fontSize: 12, color: '#78350F', fontStyle: 'italic' }}>&quot;{r.guestComment}&quot;</div></div>}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${LINE}`, background: c.nonRefundable === true ? '#FFFBEB' : '#FBFCFE' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>Cancellation terms</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.nonRefundable === true ? AMBER : c.nonRefundable === false ? GREEN : SLATE }}>{policyLabel(c.nonRefundable, c.cancelBy)}</div>
        {r.supportsCancellation === false && <div style={{ fontSize: 11.5, fontWeight: 600, color: RED, marginTop: 4 }}>GRN reports this booking does not support cancellation.</div>}
        {c.underCancellation === true && <div style={{ fontSize: 11.5, fontWeight: 600, color: AMBER, marginTop: 4 }}>A cancellation is already in progress.</div>}
        {c.details && <div style={{ fontSize: 11.5, color: SLATE, marginTop: 5, lineHeight: 1.5 }}>{c.details}</div>}
        {c.remarks && <details style={{ marginTop: 7 }}><summary style={{ fontSize: 11, color: BLUE, cursor: 'pointer', fontWeight: 600 }}>Supplier rate conditions</summary><div style={{ fontSize: 11, color: SLATE, marginTop: 4, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{c.remarks}</div></details>}
      </div>
    </div>
  );
}

function Blockers({ items, eligible, warnings }: any) {
  const warnBlock = warnings?.length ? (
    <div style={{ marginTop: 7, padding: '7px 11px', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 7 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: MUTED, marginBottom: 3 }}>Noted, not blocking</div>
      {warnings.map((w: string, i: number) => <div key={i} style={{ fontSize: 11, color: SLATE, lineHeight: 1.45, marginTop: 2 }}>{w}</div>)}
    </div>
  ) : null;
  if (eligible) return <><div style={{ marginTop: 9, padding: '7px 11px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, fontSize: 11.5, color: '#166534' }}>Exact same room, same board, same or better cancellation terms.</div>{warnBlock}</>;
  if (!items?.length) return warnBlock;
  return <><div style={{ marginTop: 9, padding: '8px 11px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7 }}><div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: AMBER, marginBottom: 4 }}>No clean match</div><ul style={{ margin: 0, paddingLeft: 15 }}>{items.map((b: string, i: number) => <li key={i} style={{ fontSize: 11.5, color: '#78350F', marginTop: 3, lineHeight: 1.45 }}>{b}</li>)}</ul></div>{warnBlock}</>;
}

function MatchBadge({ basis, eligible }: { basis?: string; eligible?: boolean }) {
  if (!basis) return null;
  const MAP: Record<string, [string, string, string]> = {
    room_code: ['Exact match — room code and name', '#DCFCE7', GREEN],
    room_name_exact: [eligible ? 'Exact room match' : 'Exact room match — no drop yet', '#DCFCE7', GREEN],
    room_name_blocked: ['Same room — blocked on other terms', '#FEF3C7', AMBER],
    no_room_match: ['No matching room in live rates', '#FEF3C7', AMBER],
  };
  const [label, bg, fg] = MAP[basis] || ['No comparable room', '#F1F5F9', SLATE];
  return <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: bg, color: fg, marginBottom: 9 }}>{label}</div>;
}

function Compare({ original, live, match }: any) {
  const Row = ({ label, o, l, ok }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr 1fr', gap: 10, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${LINE}`, alignItems: 'center' }}>
      <span style={{ color: SLATE }}>{label}</span>
      <span style={{ color: NAVY }}>{o}</span>
      <span style={{ color: NAVY, display: 'flex', alignItems: 'center', gap: 4 }}>{l}{ok === true && <span style={{ color: GREEN }}>✓</span>}{ok === false && <span style={{ color: AMBER }}>≠</span>}</span>
    </div>
  );
  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr 1fr', gap: 10, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: MUTED, paddingBottom: 3 }}>
        <span/><span>Original</span><span>Live</span>
      </div>
      <Row label="Price" o={original.usd != null ? `$${original.usd}` : '—'} l={live.usd != null ? `$${live.usd}` : '—'} ok={undefined} />
      {(original.roomTypeRaw || live.roomTypeRaw) && original.roomTypeRaw !== original.roomDescriptionRaw && <Row label="Room type" o={original.roomTypeRaw || '—'} l={live.roomTypeRaw || '—'} ok={undefined} />}
      <Row label="Room" o={original.roomDescriptionRaw || original.room || '—'} l={live.roomDescriptionRaw || live.room || '—'} ok={match?.room} />
      <Row label="Board" o={original.board || '—'} l={live.board || '—'} ok={match?.board} />
      <Row label="Terms" o={policyLabel(original.nonRefundable, original.cancelBy)} l={policyLabel(live.nonRefundable, live.cancelBy)} ok={match?.policy} />
      <Row label="Dates" o={`${fmtDate(original.checkin)}→${fmtDate(original.checkout)}`} l={match?.dates ? 'same' : 'differs'} ok={match?.dates} />
    </div>
  );
}
