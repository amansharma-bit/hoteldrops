'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const BLUESOFT = '#E8F1FE';
const NAVY = '#0F172A';
const ORANGE = '#F97316';
const ORANGESOFT = '#FFF1E6';
const ORANGETEXT = '#C2410C';
const GREEN = '#16A34A';
const GREENSOFT = '#E7F7ED';
const RED = '#DC2626';
const AMBER = '#B45309';
const SLATE = '#64748B';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';

const BOARD_LABELS: Record<string, string> = { bb: 'Breakfast', hb: 'Half board', fb: 'Full board', ai: 'All inclusive', ro: 'Room only' };
const BOARD_ORDER = ['bb', 'hb', 'fb', 'ai', 'ro'];

function usd(n: number | null | undefined) { if (n == null) return '—'; return '$' + Math.round(n).toLocaleString('en-US'); }
function money(native: number | null | undefined, currency: string | null | undefined) {
  if (native == null) return '—';
  return (currency ? currency + ' ' : '') + Number(native).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function num(n: number | null | undefined) { if (n == null) return '—'; return Number(n).toLocaleString('en-US'); }
function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s); if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtShort(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s); if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function titleCase(s: string | null | undefined) { if (!s) return ''; return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
function nameNoTitle(s: string) { return (s || '').replace(/^(Mr\.|Mrs\.|Ms\.|Mstr\.|Dr\.)\s*/i, ''); }

function Dropdown({ value, onChange, options, width, grow }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; width?: number; grow?: boolean }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.v === value);
  return (
    <div style={{ position: 'relative', width: grow ? undefined : width, flex: grow ? '1 1 0' : '0 0 auto' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '10px 14px', fontSize: 13.5, background: '#fff', color: NAVY, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur ? cur.label : ''}</span>
        <span style={{ color: SLATE, fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, minWidth: '100%', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 11, boxShadow: '0 8px 24px rgba(15,23,42,0.10)', zIndex: 20, overflow: 'hidden', padding: 4 }}>
          {options.map((o) => (
            <div key={o.v} onMouseDown={(e) => { e.preventDefault(); onChange(o.v); setOpen(false); }}
              style={{ padding: '9px 12px', fontSize: 13.5, borderRadius: 8, cursor: 'pointer', color: o.v === value ? BLUE : NAVY, fontWeight: o.v === value ? 700 : 400, background: o.v === value ? '#F0F7FF' : 'transparent', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F8FC'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.v === value ? '#F0F7FF' : 'transparent'; }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RepricingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [viewCounts, setViewCounts] = useState<any>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState('');
  const [deadline, setDeadline] = useState('any');
  const [price, setPrice] = useState('');
  const [board, setBoard] = useState('any');
  const [viewed, setViewed] = useState('any');
  const [drawer, setDrawer] = useState<any>(null);

  function fetchPage(pageNum: number, append: boolean) {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', String(pageNum));
    if (q.trim()) params.set('q', q.trim());
    if (deadline !== 'any') params.set('deadline', deadline);
    if (price) params.set('price', price);
    if (board !== 'any') params.set('board', board);
    if (viewed !== 'any') params.set('viewed', viewed);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?${params.toString()}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setError(d.error); return; }
        setRows((prev) => append ? [...prev, ...(d.rows || [])] : (d.rows || []));
        setTotal(d.total || 0); setHasMore(Boolean(d.hasMore));
        setViewCounts(d.viewCounts || null);
        setPage(pageNum);
      })
      .catch((e: any) => setError('Could not load candidates: ' + e.message))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }

  useEffect(() => {
    authenticatedFetch(`${API_BASE}/api/live-search/dashboard?_t=${Date.now()}`)
      .then((r: Response) => r.json()).then((d: any) => { if (!d.error) setDashStats(d.tiles || null); }).catch(() => {});
  }, []);
  useEffect(() => { fetchPage(1, false); /* eslint-disable-next-line */ }, [deadline, board, viewed]);

  const statsLoading = !dashStats;
  const cards = [
    { label: 'Live rebookable', value: statsLoading ? '—' : usd(dashStats?.liveRebookable?.valueUsd), accent: GREEN },
    { label: 'Expiring soon', value: statsLoading ? '—' : num(dashStats?.expiringSoon?.count), accent: ORANGE },
    { label: 'Checked', value: num(viewCounts?.checked), accent: BLUE },
    { label: 'Drops found', value: num(viewCounts?.dropped), accent: NAVY },
    { label: 'Rebooked', value: num(viewCounts?.rebooked), accent: GREEN },
  ];

  // rebalanced: hotel column has hard max, data columns wider
  const GRID = 'minmax(0,1fr) 118px 84px 150px 148px 128px 104px';

  return (
    <BusinessSidebarWrapper>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: BG, minHeight: '100vh', padding: '28px 32px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @keyframes rpshimmer { 0% { background-position:-400px 0 } 100% { background-position:400px 0 } }
          @keyframes rppulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:.35; transform:scale(.8) } }
          @keyframes rppop { 0% { transform:scale(.8); opacity:0 } 60% { transform:scale(1.05) } 100% { transform:scale(1); opacity:1 } }
          @keyframes rprise { 0% { opacity:0; transform:translateY(8px) } 100% { opacity:1; transform:translateY(0) } }
          .rp-sk { background:linear-gradient(90deg,#EEF2F7 25%,#F5F8FC 50%,#EEF2F7 75%); background-size:800px 100%; animation:rpshimmer 1.4s infinite linear; border-radius:8px; }
          .rp-dot { width:8px; height:8px; border-radius:50%; background:${GREEN}; display:inline-block; animation:rppulse 1.1s infinite ease-in-out; }
          .rp-pop { animation:rppop .4s ease-out; }
          .rp-band { animation:rprise .35s ease-out; }
          .rp-in { border:1px solid ${LINE}; border-radius:11px; padding:10px 14px; font-size:13.5px; font-family:inherit; color:${NAVY}; background:#fff; outline:none; }
          .rp-in:focus { border-color:${BLUE}; }
          .rp-btn { border:1px solid ${LINE}; border-radius:11px; padding:10px 14px; font-size:13.5px; background:#fff; color:${NAVY}; cursor:pointer; font-family:inherit; }
          .rp-btn:hover { border-color:${BLUE}; }
          .rp-primary { background:${BLUE}; color:#fff; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
          .rp-primary:disabled { background:#B9D9F5; cursor:not-allowed; }
          .rp-reopen { background:${BLUESOFT}; color:${BLUE}; border:1px solid #CBE3FB; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
          .rp-chip { border:1px solid ${LINE}; border-radius:999px; padding:6px 13px; font-size:12.5px; background:#fff; color:${NAVY}; cursor:pointer; font-family:inherit; font-weight:600; }
          .rp-chip.on { background:${BLUE}; color:#fff; border-color:${BLUE}; }
          .rp-recheck { border:1px solid ${BLUE}; color:${BLUE}; background:#F0F7FF; border-radius:999px; padding:6px 14px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; }
          .rp-recheck:disabled { opacity:.5; cursor:default; }
          .rp-radio { width:18px; height:18px; border-radius:50%; border:2px solid ${LINE}; flex:0 0 auto; display:flex; align-items:center; justify-content:center; }
          .rp-radio.on { border-color:${BLUE}; }
          .rp-radio.on::after { content:''; width:9px; height:9px; border-radius:50%; background:${BLUE}; }
          .rp-expand { color:${BLUE}; font-size:12.5px; cursor:pointer; font-weight:600; }
          .rp-match { background:${ORANGESOFT}; color:${ORANGETEXT}; font-size:10px; font-weight:800; padding:2px 9px; border-radius:999px; letter-spacing:.4px; }
        `}} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 26, color: NAVY, margin: 0 }}>Repricing</h1>
          <span style={{ color: SLATE, fontSize: 13 }}>{num(total)} refundable bookings</span>
        </div>
        <p style={{ color: SLATE, fontSize: 13.5, margin: '0 0 20px' }}>Refundable bookings still inside their free-cancel window — check live rates and capture drops.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ color: SLATE, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 24, color: NAVY }}>{c.value}</div>
              <div style={{ height: 3, background: c.accent, borderRadius: 3, marginTop: 10, opacity: 0.85 }} />
            </div>
          ))}
        </div>

        {/* filter row — full width, aligned, dropdowns wide enough (no truncation) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', width: '100%' }}>
          <input className="rp-in" placeholder="Search booking ID, city, guest…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') fetchPage(1, false); }}
            style={{ flex: '1 1 0', minWidth: 200 }} />
          <button className="rp-primary" onClick={() => fetchPage(1, false)} style={{ padding: '10px 20px', flex: '0 0 auto' }}>Search</button>
          <Dropdown value={deadline} onChange={setDeadline} grow options={[
            { v: 'any', label: 'Cancellation deadline' }, { v: '3d', label: 'Next 3 days' }, { v: '1w', label: 'Next week' }, { v: '1m', label: 'Next month' }, { v: '1y', label: 'Next year' },
          ]} />
          <Dropdown value={viewed} onChange={setViewed} grow options={[
            { v: 'any', label: 'All bookings' }, { v: 'not', label: 'Not viewed' }, { v: 'viewed', label: 'Viewed' },
          ]} />
          <Dropdown value={board} onChange={setBoard} grow options={[
            { v: 'any', label: 'Any board' }, { v: 'bb', label: 'Breakfast' }, { v: 'hb', label: 'Half board' }, { v: 'fb', label: 'Full board' }, { v: 'ai', label: 'All inclusive' }, { v: 'ro', label: 'Room only' },
          ]} />
          <Dropdown value={price} onChange={setPrice} grow options={[
            { v: '', label: 'Any price' }, { v: '0-250', label: 'Under $250' }, { v: '250-1000', label: '$250–$1,000' }, { v: '1000-5000', label: '$1,000–$5,000' }, { v: '5000-999999', label: 'Above $5,000' },
          ]} />
        </div>

        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 18px', borderBottom: `1px solid ${LINE}`, color: SLATE, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <div>Hotel / Booking</div><div>Check-in</div><div>Nights</div><div>Paid</div><div>Last check</div><div>Rebook by</div><div></div>
          </div>

          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '16px 18px', borderBottom: `1px solid ${LINE}`, gap: 12 }}>
                {[...Array(7)].map((__, j) => <div key={j} className="rp-sk" style={{ height: 14 }} />)}
              </div>
            ))
          ) : error ? (
            <div style={{ padding: 24, color: RED, fontSize: 14 }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, color: SLATE, fontSize: 14, textAlign: 'center' }}>No bookings match these filters.</div>
          ) : (
            rows.map((r, idx) => (
              <div key={r.bookingId + '_' + idx} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 18px', borderBottom: `1px solid ${LINE}`, alignItems: 'center', fontSize: 13.5 }}>
                <div style={{ minWidth: 0, maxWidth: '100%' }}>
                  <div style={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.hotel || r.bookingId}>{r.hotel || r.bookingId}</div>
                  <div style={{ color: SLATE, fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[r.city, r.bookingId].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ color: NAVY }}>{fmtShort(r.checkin)}</div>
                <div style={{ color: NAVY }}>{r.nights ?? '—'}</div>
                <div style={{ color: NAVY }}>
                  <div>{money(r.origNative, r.currency)}</div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(r.origUsd)}</div>
                </div>
                <div>
                  {r.lastCheck ? (
                    <>
                      <div style={{ color: r.lastCheck.dropped ? GREEN : NAVY, fontWeight: r.lastCheck.dropped ? 700 : 400 }}>{r.lastCheck.dropped ? '+' + money(r.lastCheck.gapNative, r.currency) : 'No drop'}</div>
                      <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtShort(r.lastCheck.checkedAt)}</div>
                    </>
                  ) : <span style={{ color: SLATE }}>—</span>}
                </div>
                <div>
                  <div style={{ color: r.daysToCancel != null && r.daysToCancel <= 3 ? RED : NAVY, fontWeight: r.daysToCancel != null && r.daysToCancel <= 3 ? 700 : 400 }}>{r.daysToCancel != null ? `${r.daysToCancel}d left` : '—'}</div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtShort(r.cancelByDate)}</div>
                </div>
                <div>
                  <button className={r.viewed ? 'rp-reopen' : 'rp-primary'} onClick={() => setDrawer(r)}>{r.viewed ? 'Reopen' : 'View'}</button>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="rp-btn" disabled={loadingMore} onClick={() => fetchPage(page + 1, true)}>{loadingMore ? 'Loading…' : 'Load more'}</button>
          </div>
        )}
      </div>

      {drawer && <RepriceDrawer row={drawer} onClose={() => setDrawer(null)} />}
    </BusinessSidebarWrapper>
  );
}

function Cell({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ color: SLATE, fontSize: 11.5, marginBottom: 3 }}>{label}</div>
      <div style={{ color: NAVY, fontWeight: 500, fontSize: 13.5, wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

function RepriceDrawer({ row, onClose }: { row: any; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);       // booking detail (cheap, on open)
  const [checking, setChecking] = useState(false);        // rates fetch state (Reprice)
  const [rated, setRated] = useState(false);              // have rates been fetched?
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);        // rates result
  const [selected, setSelected] = useState<string | null>(null);
  const [refOnly, setRefOnly] = useState(false);
  const [boardFilter, setBoardFilter] = useState<string>('any');
  const [showCxl, setShowCxl] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  // On open: fetch DETAIL only (fast) — no rates.
  useEffect(() => {
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/detail`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: row.bookingId }),
    }).then((r: Response) => r.json()).then((d: any) => { if (!d.error) setDetail(d.original); }).catch(() => {});
  }, [row.bookingId]);

  function runReprice() {
    setChecking(true); setErr(null); setResult(null); setRated(true);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: row.bookingId }),
    })
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setErr(d.error); return; }
        setResult(d);
        if (d.original) setDetail(d.original);   // enrich
        const best = (d.allRates || []).find((x: any) => x.eligible && x.vsOriginalNative > 0);
        setSelected(best ? best.rateKey : null);
      })
      .catch((e: any) => setErr('Live check failed: ' + e.message))
      .finally(() => setChecking(false));
  }

  const orig = detail || {};
  const oRoom = orig.room || row.roomType;
  const oBoard = titleCase(orig.board || row.board);
  const oRooms = orig.roomCount != null ? orig.roomCount : row.roomCount;
  const oCheckin = orig.checkin || row.checkin;
  const oCheckout = orig.checkout || row.checkout;
  const oCancelBy = orig.cancelBy || row.cancelByDate;
  const oNonRef = orig.nonRefundable != null ? orig.nonRefundable : (row.status && String(row.status).toLowerCase() === 'refundable' ? false : null);
  const oSupplier = orig.supplier || row.supplier;
  const oPaidNative = orig.price?.native != null ? orig.price.native : row.origNative;
  const oPaidCur = orig.price?.currency || row.currency;
  const oPaidUsd = orig.price?.usd != null ? orig.price.usd : row.origUsd;
  const adultsCount = orig.adultsCount != null ? orig.adultsCount : (orig.adults ? orig.adults.length : null);
  const children = orig.children || [];
  const guestNames = (orig.guests || []).map((g: any) => nameNoTitle(g.name) + (g.age != null ? ` (${g.age}y)` : '')).join(', ');
  const cxlDetails = orig.cancellationDetails || [];

  const allRates: any[] = result?.allRates || [];
  const pick = allRates.find((r) => r.rateKey === selected) || null;
  const buckets = Array.from(new Set(allRates.map((r) => r.boardBucket).filter(Boolean)));
  const orderedBuckets = BOARD_ORDER.filter((b) => buckets.includes(b));
  const shown = allRates.filter((r) => {
    if (refOnly && !r.refundable) return false;
    if (boardFilter !== 'any' && r.boardBucket !== boardFilter) return false;
    return true;
  });

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 264, background: BG, zIndex: 50, overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '-8px 0 30px rgba(0,0,0,0.10)' }}>
      <div style={{ padding: '18px 32px', borderBottom: `1px solid ${LINE}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ minWidth: 0, paddingRight: 16 }}>
          <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 21, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={orig.hotel || row.hotel}>{orig.hotel || row.hotel || row.bookingId}</div>
          <div style={{ color: SLATE, fontSize: 13, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orig.address || row.city || ''}</div>
        </div>
        <button className="rp-btn" onClick={onClose} style={{ padding: '7px 16px', flex: '0 0 auto' }}>Close</button>
      </div>

      <div style={{ padding: '20px 32px' }}>
        {/* BAND 1 — CURRENT BOOKING */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 22px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12 }}>Current booking</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '13px 20px' }}>
            <Cell label="Date of booking" value={fmtDate(orig.bookingDate)} />
            <Cell label="Check-in" value={fmtDate(oCheckin)} />
            <Cell label="Check-out" value={fmtDate(oCheckout)} />
            <Cell label="Rooms" value={oRooms != null ? String(oRooms) : '—'} />
            <Cell label="Room type" value={oRoom} />
            <Cell label="Board basis" value={oBoard} />
            <Cell label="Adults" value={adultsCount != null ? String(adultsCount) : '—'} />
            <Cell label="Children" value={children.length ? children.map((c: any) => (c.name ? nameNoTitle(c.name) : 'Child') + (c.age != null ? ` (${c.age}y)` : '')).join(', ') : '0'} />
            <Cell label="Supplier" value={oSupplier} />
            <Cell label="Supplier ref" value={orig.supplierRef} />
            <Cell label="GRN reference" value={row.bookingId} />
            <div>
              <div style={{ color: SLATE, fontSize: 11.5, marginBottom: 3 }}>Cancellation</div>
              <div style={{ color: NAVY, fontWeight: 500, fontSize: 13.5 }}>
                {oNonRef == null ? '—' : (oNonRef ? 'Non-refundable' : 'Refundable')}
                {cxlDetails.length > 0 && <> · <span className="rp-expand" onClick={() => setShowCxl((v) => !v)}>Details ▾</span></>}
              </div>
            </div>
          </div>

          {guestNames && (
            <div style={{ marginTop: 13 }}>
              <div style={{ color: SLATE, fontSize: 11.5, marginBottom: 3 }}>Guests</div>
              <div style={{ color: NAVY, fontWeight: 500, fontSize: 13.5 }}>{guestNames}</div>
            </div>
          )}

          {showCxl && cxlDetails.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}`, fontSize: 12.5 }}>
              <div style={{ color: SLATE, fontSize: 11.5, marginBottom: 6 }}>Cancellation fee schedule</div>
              <div style={{ color: GREEN, marginBottom: 4 }}>Free cancellation until {fmtDate(oCancelBy)}</div>
              {cxlDetails.map((d: any, i: number) => (
                <div key={i} style={{ color: SLATE }}>From {fmtDate(d.from)}: fee {money(d.flatFee, d.currency)}</div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: SLATE }}>Paid</div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 23, color: NAVY }}>{money(oPaidNative, oPaidCur)}</div>
              <div style={{ color: SLATE, fontSize: 12.5 }}>{usd(oPaidUsd)}</div>
            </div>
            {orig.terms && <div className="rp-expand" onClick={() => setShowPolicies((v) => !v)} style={{ alignSelf: 'center' }}>Hotel policies ▾</div>}
          </div>
          {showPolicies && orig.terms && (
            <div style={{ marginTop: 12, fontSize: 11.5, color: SLATE, lineHeight: 1.6, maxHeight: 150, overflowY: 'auto', background: BG, borderRadius: 10, padding: '12px 14px' }}>{orig.terms}</div>
          )}
        </div>

        {/* BAND 2 — REPLACEMENT */}
        <div className={pick ? 'rp-band' : ''} style={{ background: '#fff', border: `1.5px solid ${pick ? (pick.eligible ? '#BDE5CC' : LINE) : LINE}`, borderRadius: 14, padding: '16px 22px', marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: pick ? 12 : 0 }}>Replacement</div>
          {pick ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '12px 28px', flex: 1, minWidth: 300 }}>
                <Cell label="Room type" value={pick.roomDescription} />
                <Cell label="Board basis" value={titleCase(pick.board)} />
                <Cell label="Cancellation" value={pick.refundable ? 'Refundable' : 'Non-refundable'} />
                <Cell label="Free cancel until" value={fmtDate(pick.cancelBy)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: SLATE }}>New price</div>
                  <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 23, color: NAVY }}>{money(pick.native, pick.currency)}</div>
                  <div style={{ color: SLATE, fontSize: 12.5 }}>{usd(pick.usd)}</div>
                  {pick.vsOriginalNative != null && (
                    <div className="rp-pop" style={{ display: 'inline-block', marginTop: 6, background: pick.vsOriginalNative > 0 ? GREENSOFT : '#FDEBEC', color: pick.vsOriginalNative > 0 ? GREEN : RED, fontWeight: 800, fontSize: 14, padding: '5px 13px', borderRadius: 999 }}>
                      {pick.vsOriginalNative > 0 ? 'Save ' : 'Costs '}{money(Math.abs(pick.vsOriginalNative), pick.currency)}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 170 }}>
                  <button className="rp-primary" disabled={!pick.selectable} style={{ width: '100%', padding: '11px' }}
                    onClick={() => alert('Rebook runs the money-path (search → recheck → rebook → confirm → cancel). Wire to /repricing/book-replacement when ready.')}>
                    Rebook this rate
                  </button>
                  {!pick.eligible && pick.selectable && <div style={{ marginTop: 6, fontSize: 11.5, color: AMBER, textAlign: 'center' }}>Not an exact match — review notes.</div>}
                  {pick.blockers && pick.blockers.length > 0 && <div style={{ marginTop: 6, fontSize: 11.5, color: AMBER, textAlign: 'center' }}>{pick.blockers.join(' · ')}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: SLATE, fontSize: 13.5, padding: '12px 0', textAlign: 'center' }}>{checking ? 'Checking live rates…' : (rated ? 'Select a room below to see the replacement details.' : 'Press Reprice to fetch live rates.')}</div>
          )}
        </div>

        {/* BAND 3 — ALL ROOMS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8 }}>
            All rooms {allRates.length ? `(${shown.length}/${allRates.length})` : ''}
            {checking && <span className="rp-dot" />}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {rated && !checking && allRates.length > 0 && (
              <>
                <button className={'rp-chip' + (refOnly ? ' on' : '')} onClick={() => setRefOnly((v) => !v)}>Refundable only</button>
                <span style={{ width: 1, height: 20, background: LINE, margin: '0 2px' }} />
                <button className={'rp-chip' + (boardFilter === 'any' ? ' on' : '')} onClick={() => setBoardFilter('any')}>All boards</button>
                {orderedBuckets.map((b) => (
                  <button key={b} className={'rp-chip' + (boardFilter === b ? ' on' : '')} onClick={() => setBoardFilter(b)}>{BOARD_LABELS[b]}</button>
                ))}
                <span style={{ width: 1, height: 20, background: LINE, margin: '0 2px' }} />
              </>
            )}
            <button className="rp-recheck" onClick={runReprice} disabled={checking}>{checking ? 'Checking…' : (rated ? 'Re-check' : 'Reprice')}</button>
          </div>
        </div>

        {!rated ? (
          <div style={{ padding: 28, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px dashed ${LINE}`, borderRadius: 12 }}>
            Press <b style={{ color: BLUE }}>Reprice</b> to fetch live rates for this booking.
          </div>
        ) : checking ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="rp-sk" style={{ height: 74 }} />)}
          </div>
        ) : err ? (
          <div style={{ padding: 16, background: '#FDEBEC', color: RED, borderRadius: 10, fontSize: 13.5 }}>{err}</div>
        ) : allRates.length === 0 ? (
          <div style={{ padding: 20, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10 }}>No live rates for these dates and occupancy.</div>
        ) : shown.length === 0 ? (
          <div style={{ padding: 20, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10 }}>No rooms match these filters.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 32 }}>
            {shown.map((rt: any, i: number) => {
              const disabled = !rt.selectable;
              const isSel = selected === rt.rateKey;
              const costMore = rt.vsOriginalNative != null && rt.vsOriginalNative < 0;
              return (
                <div key={rt.rateKey || i} onClick={() => { if (!disabled) setSelected(rt.rateKey); }}
                  style={{ background: '#fff', border: `1.5px solid ${isSel ? BLUE : (rt.eligible ? '#BDE5CC' : LINE)}`, borderRadius: 10, padding: '12px 14px', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', gap: 12 }}>
                  <div className={'rp-radio' + (isSel ? ' on' : '')} style={{ marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      {rt.eligible && <span className="rp-match">MATCH</span>}
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minWidth: 0 }}>{titleCase(rt.roomDescription)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                      <div style={{ minWidth: 0, paddingRight: 6 }}>
                        <div style={{ color: SLATE, fontSize: 12 }}>{[titleCase(rt.board), rt.refundable ? 'Refundable' : 'Non-refundable'].filter(Boolean).join(' · ')}</div>
                        {rt.cancelBy && <div style={{ color: SLATE, fontSize: 11.5, marginTop: 2 }}>Free cancel until {fmtShort(rt.cancelBy)}</div>}
                        {rt.blockers && rt.blockers.length > 0 && <div style={{ color: costMore ? RED : AMBER, fontSize: 11.5, marginTop: 4 }}>{rt.blockers.join(' · ')}</div>}
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 15, color: NAVY }}>{money(rt.native, rt.currency)}</div>
                        <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(rt.usd)}</div>
                        {rt.vsOriginalNative != null && <div style={{ fontSize: 12, fontWeight: 700, color: rt.vsOriginalNative > 0 ? GREEN : RED, marginTop: 2 }}>{rt.vsOriginalNative > 0 ? '−' : '+'}{money(Math.abs(rt.vsOriginalNative), rt.currency)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
