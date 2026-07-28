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
function usdShort(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K';
  return '$' + Math.round(n);
}

// ─── SHARED DROPDOWN HELPERS (same as repricing page) ────────────────────────
const ddBtn = (active = false, activeColor = BLUE): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 10, border: `1px solid ${active ? activeColor : LINE}`, borderRadius: 11,
  padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: '#fff',
  color: active ? activeColor : NAVY, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
});
const ddMenu: React.CSSProperties = {
  position: 'absolute', top: '112%', left: 0, zIndex: 31, background: '#fff',
  border: `1px solid ${LINE}`, borderRadius: 12,
  boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth: 200,
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

// ─── CALENDAR PICKER (identical to repricing page) ────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ from, to, onApply, onClose }: { from: string; to: string; onApply: (f: string, t: string) => void; onClose: () => void }) {
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [selFrom, setSelFrom] = useState(from || '');
  const [selTo, setSelTo] = useState(to || '');
  const [stage, setStage] = useState<'from'|'to'>(from ? 'to' : 'from');
  const [hovered, setHovered] = useState('');
  const initDate = selFrom ? new Date(selFrom + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  function ds(y: number, m: number, d: number) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }

  function handleDay(d: string) {
    if (stage === 'from') {
      setSelFrom(d); setSelTo(''); setStage('to');
      const nd = new Date(d + 'T00:00:00');
      if (nd.getMonth() === 11) { setViewMonth(0); setViewYear(nd.getFullYear()+1); }
      else { setViewMonth(nd.getMonth()+1); setViewYear(nd.getFullYear()); }
    } else {
      if (d <= selFrom) {
        setSelFrom(d); setSelTo(''); setStage('to');
        const nd = new Date(d + 'T00:00:00');
        if (nd.getMonth() === 11) { setViewMonth(0); setViewYear(nd.getFullYear()+1); }
        else { setViewMonth(nd.getMonth()+1); setViewYear(nd.getFullYear()); }
      } else { setSelTo(d); setStage('from'); }
    }
  }
  function resetSelection() { setSelFrom(''); setSelTo(''); setStage('from'); const n = new Date(); setViewMonth(n.getMonth()); setViewYear(n.getFullYear()); }

  const first = new Date(viewYear, viewMonth, 1).getDay();
  const total = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells: (number|null)[] = [...Array(first).fill(null), ...Array.from({length: total}, (_,i) => i+1)];
  const inRange = (d: string) => { const end = selTo || (stage === 'to' ? hovered : ''); return selFrom && end && d > selFrom && d < end; };

  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: '0 20px 50px -20px rgba(16,24,40,.32)', padding: '18px 16px', width: 304, userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: stage === 'from' ? BLUE : SLATE }}>{stage === 'from' ? '① Pick start date' : '② Pick end date'}</div>
        {(selFrom || selTo) && <button onClick={resetSelection} style={{ border: 'none', background: '#F1F5F9', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: SLATE, cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 10px', fontSize: 18, color: SLATE, lineHeight: 1 }}>‹</button>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 14, color: NAVY }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 10px', fontSize: 18, color: SLATE, lineHeight: 1 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
        {WDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: MUTED, padding: '2px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const d = ds(viewYear, viewMonth, day);
          const isF = d === selFrom, isT = d === selTo;
          const inR = Boolean(inRange(d));
          const past = d < todayStr;
          return (
            <button key={d} disabled={past} onClick={() => !past && handleDay(d)}
              onMouseEnter={() => stage === 'to' && !past && setHovered(d)} onMouseLeave={() => setHovered('')}
              style={{ border: 'none', borderRadius: (isF||isT) ? '50%' : inR ? 0 : '50%', padding: '6px 0', fontSize: 12.5, fontWeight: (isF||isT) ? 700 : 400, background: (isF||isT) ? BLUE : inR ? '#DBEAFE' : 'transparent', color: (isF||isT) ? '#fff' : past ? '#CBD5E1' : inR ? BLUE : NAVY, cursor: past ? 'not-allowed' : 'pointer', position: 'relative', outline: 'none', textAlign: 'center' }}>
              {day}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12, padding: '9px 12px', background: '#F6F8FB', borderRadius: 9, fontSize: 12.5, color: SLATE, display: 'flex', justifyContent: 'space-between' }}>
        <span>From: <strong style={{ color: selFrom ? NAVY : MUTED }}>{selFrom ? fmtDate(selFrom, true) : '—'}</strong></span>
        <span>To: <strong style={{ color: selTo ? NAVY : MUTED }}>{selTo ? fmtDate(selTo, true) : '—'}</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onClose} style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 600, background: '#fff', color: SLATE, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={() => selFrom && selTo && onApply(selFrom, selTo)} disabled={!selFrom || !selTo}
          style={{ flex: 1, border: 'none', borderRadius: 9, padding: '8px', fontSize: 13, fontWeight: 700, background: selFrom && selTo ? BLUE : '#E2E8F0', color: selFrom && selTo ? '#fff' : MUTED, cursor: selFrom && selTo ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Apply</button>
      </div>
    </div>
  );
}

// ─── DATE RANGE DROPDOWN ──────────────────────────────────────────────────────
function DateRangeDropdown({ customFrom, customTo, open, setOpen, onApply, onClear }: any) {
  const [showCal, setShowCal] = useState(false);
  const hasRange = customFrom || customTo;
  const label = hasRange
    ? `${customFrom ? fmtDate(customFrom) : '…'} → ${customTo ? fmtDate(customTo) : '…'}`
    : 'Any date';

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); setShowCal(false); }} style={{ ...ddBtn(!!hasRange), minWidth: 148 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><CalIcon />{label}</span>
        <Chevron />
      </button>
      {open && (<>
        <div onClick={() => { setOpen(false); setShowCal(false); }} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={{ position: 'absolute', top: '112%', left: 0, zIndex: 31 }} onClick={e => e.stopPropagation()}>
          {!showCal ? (
            <div style={ddMenu}>
              <button onClick={() => setShowCal(true)} style={ddItem(!!hasRange)}>
                <CalIcon />Pick date range…
              </button>
              {hasRange && <><div style={{ borderTop: `1px solid ${LINE}`, margin: '4px 6px' }} /><button onClick={() => { onClear(); setOpen(false); }} style={ddItem(false)}>Clear date filter</button></>}
            </div>
          ) : (
            <CalendarPicker from={customFrom} to={customTo}
              onApply={(f, t) => { onApply(f, t); setShowCal(false); setOpen(false); }}
              onClose={() => setShowCal(false)} />
          )}
        </div>
      </>)}
    </div>
  );
}

// ─── RESULT DROPDOWN ──────────────────────────────────────────────────────────
const RESULT_OPTS = [
  { value: 'all', label: 'All results', dot: null },
  { value: 'drop', label: 'Drop found', dot: GREEN },
  { value: 'no_drop', label: 'No drop', dot: MUTED },
  { value: 'sold_out', label: 'Sold out', dot: AMBER },
];
function ResultDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = RESULT_OPTS.find(o => o.value === value) || RESULT_OPTS[0];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={ddBtn(value !== 'all', cur.dot || BLUE)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {cur.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cur.dot, flexShrink: 0 }} />}
          {cur.label}
        </span>
        <Chevron />
      </button>
      {open && (<>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={ddMenu}>
          {RESULT_OPTS.map(({ value: v, label: l, dot }) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={ddItem(value === v)}>
              {dot ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} /> : <span style={{ width: 7 }} />}
              {l}
            </button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ─── GAP SIZE DROPDOWN ────────────────────────────────────────────────────────
const GAP_OPTS = [
  { value: 'any', label: 'Any gap' },
  { value: '0-50', label: 'Under $50' },
  { value: '50-100', label: '$50 – $100' },
  { value: '100-500', label: '$100 – $500' },
  { value: '500+', label: 'Above $500' },
];
function GapDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = GAP_OPTS.find(o => o.value === value)?.label || 'Any gap';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={ddBtn(value !== 'any')}><span>{label}</span><Chevron /></button>
      {open && (<>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
        <div style={ddMenu}>
          {GAP_OPTS.map(({ value: v, label: l }) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={ddItem(value === v)}>{l}</button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ─── RESULT CHIP ──────────────────────────────────────────────────────────────
const RESULT_CHIP: Record<string, { label: string; bg: string; fg: string }> = {
  drop_actionable: { label: 'Drop · same room', bg: '#DCFCE7', fg: GREEN },
  drop_blocked:    { label: 'Drop · diff room',  bg: '#FEF3C7', fg: AMBER },
  no_drop:         { label: 'No drop',           bg: '#F1F5F9', fg: SLATE },
  higher:          { label: 'Higher now',         bg: '#FEF2F2', fg: RED },
  sold_out:        { label: 'Sold out',           bg: '#FEF3C7', fg: AMBER },
};

// ─── FUNNEL STAT CARD — Dashboard style ───────────────────────────────────────
// Matches the Dashboard "Closing soon" cards exactly:
// white bg, Archivo number, sub-label, optional progress bar at bottom
function FunnelCard({ label, value, sub, fill, pct, loading }: { label: string; value: string; sub: string; fill: string; pct?: number; loading: boolean }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: NAVY, margin: '8px 0 4px' }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{sub}</div>
      {pct !== undefined && (
        <div style={{ height: 6, borderRadius: 99, background: '#F1F3F8', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: loading ? '0%' : `${pct}%`, background: fill, borderRadius: 99, transition: 'width 1s cubic-bezier(.2,.7,.3,1)' }} />
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SearchesMadePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const [gap, setGap] = useState('any');

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => { setSearchQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (searchQ) params.set('q', searchQ);
    if (resultFilter !== 'all') params.set('result', resultFilter);
    if (customFrom) params.set('from', customFrom);
    if (customTo) params.set('to', customTo);
    if (gap !== 'any') params.set('gap', gap);
    params.set('_t', Date.now().toString());
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/searches?${params}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load searches: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, searchQ, resultFilter, customFrom, customTo, gap]);

  const f = data?.funnel;
  const rows = data?.rows || [];
  const hasMore = data?.hasMore ?? false;
  const totalDrops = f?.dropsFound || 0;
  const totalChecks = f?.totalChecks || 0;
  const actionable = f?.actionableDrops || 0;
  const convRate = totalChecks ? Math.round((actionable / totalChecks) * 100) : 0;
  const dropPct = totalChecks ? Math.min(100, Math.round((totalDrops / totalChecks) * 100)) : 0;
  const actionPct = totalChecks ? Math.min(100, Math.round((actionable / totalChecks) * 100)) : 0;

  const hasActiveFilter = search || resultFilter !== 'all' || customFrom || customTo || gap !== 'any';

  function clearAll() { setSearch(''); setSearchQ(''); setResultFilter('all'); setCustomFrom(''); setCustomTo(''); setGap('any'); setPage(1); setExpanded(null); }

  return (
    <BusinessSidebarWrapper>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: '100vh', background: BG, fontFamily: BODY }}>
        {/* Header */}
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 800, letterSpacing: '-0.7px', color: NAVY, margin: 0 }}>Searches made</h1>
          <p style={{ fontSize: 14.5, color: SLATE, marginTop: 4, marginBottom: 0 }}>Every live price check, and what it found.</p>
        </div>

        {error && <div style={{ margin: '14px 40px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 11, padding: '11px 15px', fontSize: 13, color: RED }}>{error}</div>}

        {/* ── Funnel stat cards — Dashboard style ── */}
        <div style={{ padding: '24px 40px 0', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <FunnelCard label="Searches made" value={String(f?.totalChecks ?? 0)} sub="price checks run" fill={NAVY} pct={100} loading={loading} />
          <FunnelCard label="Bookings checked" value={String(f?.bookingsChecked ?? 0)} sub="distinct bookings" fill={BLUE} pct={f?.bookingsChecked && f?.totalChecks ? Math.round((f.bookingsChecked / f.totalChecks) * 100) : 0} loading={loading} />
          <FunnelCard label="Drops found" value={String(totalDrops)} sub="cheaper somewhere" fill={AMBER} pct={dropPct} loading={loading} />
          <FunnelCard label="Actionable" value={String(actionable)} sub="same room, cheaper" fill={GREEN} pct={actionPct} loading={loading} />
          <FunnelCard label="Conversion" value={`${convRate}%`} sub="actionable ÷ searches" fill={GREEN} pct={convRate} loading={loading} />
        </div>

        {/* ── Filter bar ── */}
        <div style={{ padding: '20px 40px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 1 300px', minWidth: 180 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearchQ(search.trim()); setPage(1); } }}
              placeholder="Search hotel, city or booking ID…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 12px 9px 34px', fontSize: 13.5, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>

          <ResultDropdown value={resultFilter} onChange={v => { setResultFilter(v); setPage(1); setExpanded(null); }} />
          <DateRangeDropdown customFrom={customFrom} customTo={customTo} open={dateOpen} setOpen={setDateOpen}
            onApply={(f: string, t: string) => { setCustomFrom(f); setCustomTo(t); setPage(1); setExpanded(null); }}
            onClear={() => { setCustomFrom(''); setCustomTo(''); setPage(1); }} />
          <GapDropdown value={gap} onChange={v => { setGap(v); setPage(1); setExpanded(null); }} />

          {hasActiveFilter && (
            <button onClick={clearAll} style={{ border: 'none', background: 'transparent', color: SLATE, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: '9px 4px' }}>Clear</button>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: MUTED }}>
            {loading ? 'Loading…' : `${(data?.total ?? 0).toLocaleString()} checks`}
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{ padding: '16px 40px 48px' }}>
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(16,24,40,.04)' }}>
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 160px 110px 110px 110px 130px 28px', gap: 14, padding: '12px 22px', borderBottom: `1px solid ${LINE}`, background: '#FAFBFD' }}>
              {['Booking', 'Result', 'Original', 'Live', 'Gap', 'Checked', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: MUTED, textAlign: (i===2||i===3||i===4) ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                No price checks match your filters.
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                {rows.map((r: any) => {
                  const chip = RESULT_CHIP[r.result] || RESULT_CHIP.no_drop;
                  const isOpen = expanded === r.id;
                  return (
                    <div key={r.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                      <div onClick={() => setExpanded(e => e === r.id ? null : r.id)}
                        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 160px 110px 110px 110px 130px 28px', gap: 14, padding: '14px 22px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s', background: isOpen ? '#F7FBFF' : '#fff' }}>
                        {/* Booking */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: DISPLAY }}>{r.hotel}</div>
                          <div style={{ fontSize: 12, color: SLATE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.room].filter(Boolean).join(' · ') || r.bookingId}</div>
                        </div>
                        {/* Result chip */}
                        <div><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.fg, whiteSpace: 'nowrap' }}>{chip.label}</span></div>
                        {/* Original */}
                        <div style={{ textAlign: 'right', fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: NAVY }}>{r.originalUsd != null ? `$${r.originalUsd.toLocaleString()}` : '—'}</div>
                        {/* Live */}
                        <div style={{ textAlign: 'right', fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: r.dropped ? GREEN : NAVY }}>{r.liveUsd != null ? `$${r.liveUsd.toLocaleString()}` : '—'}</div>
                        {/* Gap */}
                        <div style={{ textAlign: 'right', fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: r.dropped ? GREEN : MUTED }}>
                          {r.dropped && r.gapUsd != null ? `−$${Math.round(r.gapUsd)}` : '—'}
                        </div>
                        {/* Checked at */}
                        <div style={{ fontSize: 12, color: SLATE }}>{fmtTime(r.checkedAt)}</div>
                        {/* Expand chevron */}
                        <div style={{ textAlign: 'center', color: MUTED, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div style={{ padding: '16px 22px 20px', borderTop: `1px solid ${LINE}`, background: '#F7FBFF', animation: 'fadeIn 0.18s ease' }}>
                          <DetailPanel r={r} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page} · {(data?.total ?? 0).toLocaleString()} checks</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPage(p => Math.max(1,p-1)); setExpanded(null); }} disabled={page===1}
                  style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: '7px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page===1 ? '#CBD5E1' : NAVY, cursor: page===1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <button onClick={() => { setPage(p => p+1); setExpanded(null); }} disabled={!hasMore}
                  style={{ border: 'none', borderRadius: 9, padding: '7px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? MUTED : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

// ─── DETAIL PANEL (expanded row) ─────────────────────────────────────────────
function DetailPanel({ r }: { r: any }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Comparison table */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Price comparison</div>
        <CompareTable r={r} />
        {r.blockers?.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: AMBER, marginBottom: 4 }}>Why not actionable</div>
            {r.blockers.map((b: string, i: number) => <div key={i} style={{ fontSize: 11.5, color: '#78350F', marginTop: 2 }}>{b}</div>)}
          </div>
        )}
      </div>
      {/* Match detail */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BLUE, marginBottom: 10 }}>Match detail</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <MatchRow label="Room match" ok={r.roomMatch} detail={r.liveRoom} />
          <MatchRow label="Board match" ok={r.boardMatch} detail={r.liveBoard} />
          <MatchRow label="Dates match" ok={r.datesMatch} />
          <MatchRow label="Policy match" ok={r.policyMatch} />
          <MatchRow label="Actionable" ok={r.actionable} detail={r.actionable ? 'Ready to rebook' : 'Not rebookable'} />
        </div>
        {r.matchBasis && (
          <div style={{ marginTop: 12, fontSize: 11.5, color: SLATE }}>
            Match basis: <strong style={{ color: NAVY }}>{r.matchBasis.replace(/_/g, ' ')}</strong>
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 11.5, color: MUTED }}>Checked {fmtTime(r.checkedAt)}</div>
      </div>
    </div>
  );
}

function CompareTable({ r }: { r: any }) {
  const Row = ({ label, o, l, ok }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 10, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${LINE}`, alignItems: 'center' }}>
      <span style={{ color: SLATE }}>{label}</span>
      <span style={{ color: NAVY }}>{o}</span>
      <span style={{ color: NAVY, display: 'flex', alignItems: 'center', gap: 4 }}>
        {l}
        {ok === true && <span style={{ color: GREEN, fontSize: 12 }}>✓</span>}
        {ok === false && <span style={{ color: AMBER, fontSize: 12 }}>≠</span>}
      </span>
    </div>
  );
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 10, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: MUTED, paddingBottom: 3 }}>
        <span /><span>Original</span><span>Live</span>
      </div>
      <Row label="Price" o={r.originalUsd != null ? `$${r.originalUsd.toLocaleString()}` : '—'} l={r.liveUsd != null ? `$${r.liveUsd.toLocaleString()}` : (r.result === 'sold_out' ? 'Sold out' : '—')} />
      <Row label="Room" o={r.room || '—'} l={r.liveRoom || '—'} ok={r.roomMatch} />
      <Row label="Board" o="—" l={r.liveBoard || '—'} ok={r.boardMatch} />
      <Row label="Dates" o="same" l={r.datesMatch ? 'confirmed' : 'differs'} ok={r.datesMatch} />
    </div>
  );
}

function MatchRow({ label, ok, detail }: { label: string; ok: boolean | null; detail?: string }) {
  const icon = ok === true ? '✓' : ok === false ? '✗' : '—';
  const color = ok === true ? GREEN : ok === false ? RED : MUTED;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: ok === true ? '#DCFCE7' : ok === false ? '#FEF2F2' : '#F1F5F9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: SLATE, minWidth: 90 }}>{label}</span>
      {detail && <span style={{ color: NAVY, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>}
    </div>
  );
}
