'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
const GOLDSOFT = '#FBF3DF';
const GREEN = '#16A34A';
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
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Dropdown({ value, onChange, options, width }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; width?: number }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.v === value);
  return (
    <div style={{ position: 'relative', width: width || 'auto' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 14px', fontSize: 13.5, background: '#fff', color: NAVY, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
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

  const [q, setQ] = useState('');
  const [deadline, setDeadline] = useState('any');
  const [price, setPrice] = useState('');
  const [board, setBoard] = useState('any');
  const [viewed, setViewed] = useState('any');
  const [drawer, setDrawer] = useState<any>(null);

  function load(reset = true) {
    setLoading(true); setError(null);
    const p = reset ? 1 : page;
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (q.trim()) params.set('q', q.trim());
    if (deadline !== 'any') params.set('deadline', deadline);
    if (price) params.set('price', price);
    if (board !== 'any') params.set('board', board);
    if (viewed !== 'any') params.set('viewed', viewed);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?${params.toString()}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setError(d.error); return; }
        setRows(d.rows || []); setTotal(d.total || 0); setHasMore(Boolean(d.hasMore));
        setViewCounts(d.viewCounts || null);
        if (reset) setPage(1);
      })
      .catch((e: any) => setError('Could not load candidates: ' + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    authenticatedFetch(`${API_BASE}/api/live-search/dashboard?_t=${Date.now()}`)
      .then((r: Response) => r.json()).then((d: any) => { if (!d.error) setDashStats(d.tiles || null); }).catch(() => {});
  }, []);
  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [deadline, board, viewed]);

  const statsLoading = !dashStats;
  const cards = [
    { label: 'Live rebookable', value: statsLoading ? '—' : usd(dashStats?.liveRebookable?.valueUsd), accent: GREEN },
    { label: 'Expiring soon', value: statsLoading ? '—' : num(dashStats?.expiringSoon?.count), accent: GOLD },
    { label: 'Checked', value: num(viewCounts?.checked), accent: BLUE },
    { label: 'Drops found', value: num(viewCounts?.dropped), accent: NAVY },
    { label: 'Rebooked', value: num(viewCounts?.rebooked), accent: GREEN },
  ];

  const GRID = 'minmax(0,1.5fr) 96px 70px 128px 128px 116px 100px';

  return (
    <BusinessSidebarWrapper>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: BG, minHeight: '100vh', padding: '28px 32px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          .rp-in { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; font-family:inherit; color:${NAVY}; background:#fff; outline:none; }
          .rp-in:focus { border-color:${BLUE}; }
          .rp-btn { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; background:#fff; color:${NAVY}; cursor:pointer; font-family:inherit; }
          .rp-btn:hover { border-color:${BLUE}; }
          .rp-primary { background:${BLUE}; color:#fff; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
          .rp-primary:disabled { background:#B9D9F5; cursor:not-allowed; }
          .rp-viewed { background:${GOLDSOFT}; color:#8A6D1F; border:1px solid #EBD9A6; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
          .rp-chip { border:1px solid ${LINE}; border-radius:999px; padding:6px 13px; font-size:12.5px; background:#fff; color:${NAVY}; cursor:pointer; font-family:inherit; font-weight:600; }
          .rp-chip.on { background:${BLUE}; color:#fff; border-color:${BLUE}; }
        `}} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 26, color: NAVY, margin: 0 }}>Repricing</h1>
          <span style={{ color: SLATE, fontSize: 13 }}>{num(total)} refundable bookings in window</span>
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

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="rp-in" placeholder="Search booking ID, city, guest…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(true); }}
            style={{ width: 230 }} />
          <button className="rp-primary" onClick={() => load(true)} style={{ padding: '9px 18px' }}>Search</button>
          <Dropdown value={deadline} onChange={setDeadline} width={182} options={[
            { v: 'any', label: 'Cancellation deadline' }, { v: '3d', label: 'Next 3 days' }, { v: '1w', label: 'Next week' }, { v: '1m', label: 'Next month' }, { v: '1y', label: 'Next year' },
          ]} />
          <Dropdown value={viewed} onChange={setViewed} width={150} options={[
            { v: 'any', label: 'All bookings' }, { v: 'not', label: 'Not viewed' }, { v: 'viewed', label: 'Viewed' },
          ]} />
          <Dropdown value={board} onChange={setBoard} width={140} options={[
            { v: 'any', label: 'Any board' }, { v: 'bb', label: 'Breakfast' }, { v: 'hb', label: 'Half board' }, { v: 'fb', label: 'Full board' }, { v: 'ai', label: 'All inclusive' }, { v: 'ro', label: 'Room only' },
          ]} />
          <Dropdown value={price} onChange={setPrice} width={140} options={[
            { v: '', label: 'Any price' }, { v: '0-250', label: 'Under $250' }, { v: '250-1000', label: '$250–$1,000' }, { v: '1000-5000', label: '$1,000–$5,000' }, { v: '5000-999999', label: 'Above $5,000' },
          ]} />
        </div>

        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 18px', borderBottom: `1px solid ${LINE}`, color: SLATE, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <div>Hotel / Booking</div><div>Check-in</div><div>Nights</div><div>Paid</div><div>Last check</div><div>Rebook by</div><div></div>
          </div>

          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
                {[...Array(7)].map((__, j) => <div key={j} style={{ height: 14, background: '#EEF2F7', borderRadius: 6, marginRight: 12 }} />)}
              </div>
            ))
          ) : error ? (
            <div style={{ padding: 24, color: RED, fontSize: 14 }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, color: SLATE, fontSize: 14, textAlign: 'center' }}>No bookings match these filters.</div>
          ) : (
            rows.map((r) => (
              <div key={r.bookingId} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 18px', borderBottom: `1px solid ${LINE}`, alignItems: 'center', fontSize: 13.5 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel || r.bookingId}</div>
                  <div style={{ color: SLATE, fontSize: 12, marginTop: 2 }}>{[r.city, r.bookingId].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ color: NAVY }}>{fmtDate(r.checkin)}</div>
                <div style={{ color: NAVY }}>{r.nights ?? '—'}</div>
                <div style={{ color: NAVY }}>
                  <div>{money(r.origNative, r.currency)}</div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(r.origUsd)}</div>
                </div>
                <div>
                  {r.lastCheck ? (
                    <>
                      <div style={{ color: r.lastCheck.dropped ? GREEN : NAVY, fontWeight: r.lastCheck.dropped ? 700 : 400 }}>{r.lastCheck.dropped ? '+' + money(r.lastCheck.gapNative, r.currency) : 'No drop'}</div>
                      <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtDate(r.lastCheck.checkedAt)}</div>
                    </>
                  ) : <span style={{ color: SLATE }}>—</span>}
                </div>
                <div>
                  <div style={{ color: r.daysToCancel != null && r.daysToCancel <= 3 ? RED : NAVY, fontWeight: r.daysToCancel != null && r.daysToCancel <= 3 ? 700 : 400 }}>{r.daysToCancel != null ? `${r.daysToCancel}d left` : '—'}</div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtDate(r.cancelByDate)}</div>
                </div>
                <div>
                  <button className={r.viewed ? 'rp-viewed' : 'rp-primary'} onClick={() => setDrawer(r)}>{r.viewed ? 'Viewed' : 'View'}</button>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="rp-btn" onClick={() => { setPage((p) => p + 1); setTimeout(() => load(false), 0); }}>Load more</button>
          </div>
        )}
      </div>

      {drawer && <RepriceDrawer row={drawer} onClose={() => setDrawer(null)} />}
    </BusinessSidebarWrapper>
  );
}

function RepriceDrawer({ row, onClose }: { row: any; onClose: () => void }) {
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [refOnly, setRefOnly] = useState(false);
  const [boardFilter, setBoardFilter] = useState<string>('any');

  function runCheck() {
    setChecking(true); setErr(null); setResult(null);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: row.bookingId }),
    })
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setErr(d.error); return; }
        setResult(d);
        const best = (d.allRates || []).find((x: any) => x.eligible && x.vsOriginalNative > 0);
        setSelected(best ? best.rateKey : null);
      })
      .catch((e: any) => setErr('Live check failed: ' + e.message))
      .finally(() => setChecking(false));
  }
  useEffect(() => { runCheck(); /* eslint-disable-next-line */ }, []);

  // INSTANT original from ROW; enrich from GRN detail when it arrives.
  const orig = result?.original || {};
  const oRoom = orig.room || row.roomType;
  const oBoard = orig.board || row.board;
  const oRooms = orig.roomCount != null ? orig.roomCount : row.roomCount;
  const oCheckin = orig.checkin || row.checkin;
  const oCheckout = orig.checkout || row.checkout;
  const oCancelBy = orig.cancelBy || row.cancelByDate;
  const oNonRef = orig.nonRefundable != null ? orig.nonRefundable : (row.status && String(row.status).toLowerCase() === 'refundable' ? false : null);
  const oSupplier = orig.supplier || row.supplier;
  const oSupplierRef = orig.supplierRef;
  const oPaidNative = orig.price?.native != null ? orig.price.native : row.origNative;
  const oPaidCur = orig.price?.currency || row.currency;
  const oPaidUsd = orig.price?.usd != null ? orig.price.usd : row.origUsd;
  const oGuests = orig.guests || [];
  const guestCount = oGuests.length || null;
  const guestNames = oGuests.length ? oGuests.map((g: any) => g.name + (g.age != null ? ` (age ${g.age})` : '')).join(', ') : (row.guestName || null);

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
      {/* header */}
      <div style={{ padding: '20px 32px', borderBottom: `1px solid ${LINE}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, zIndex: 5 }}>
        <div>
          <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 21, color: NAVY }}>{orig.hotel || row.hotel || row.bookingId}</div>
          <div style={{ color: SLATE, fontSize: 13, marginTop: 3 }}>{orig.address || row.city || ''}</div>
        </div>
        <button className="rp-btn" onClick={onClose} style={{ padding: '7px 16px' }}>Close</button>
      </div>

      {/* two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '22px 32px' }}>
        {/* LEFT — original (instant from row) */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 16 }}>Current booking</div>
          <DetailGrid items={[
            ['Room type', oRoom],
            ['Board basis', oBoard],
            ['Rooms', oRooms != null ? String(oRooms) : '—'],
            ['Guests', guestCount ? `${guestCount} pax${guestNames ? ' — ' + guestNames : ''}` : (guestNames || '—')],
            ['Check-in', fmtDate(oCheckin)],
            ['Check-out', fmtDate(oCheckout)],
            ['Free cancel until', fmtDate(oCancelBy)],
            ['Cancellation', oNonRef == null ? '—' : (oNonRef ? 'Non-refundable' : 'Refundable')],
            ['Supplier', oSupplier],
            ['Supplier ref', oSupplierRef],
            ['GRN reference', row.bookingId],
          ]} />
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
            <div style={{ fontSize: 12, color: SLATE }}>Paid</div>
            <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 25, color: NAVY }}>{money(oPaidNative, oPaidCur)}</div>
            <div style={{ color: SLATE, fontSize: 12.5 }}>{usd(oPaidUsd)}</div>
          </div>
          {orig.terms && <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
            <div style={{ color: SLATE, fontSize: 11.5, marginBottom: 4 }}>Terms &amp; conditions</div>
            <div style={{ fontSize: 11.5, color: SLATE, lineHeight: 1.55, maxHeight: 120, overflowY: 'auto' }}>{orig.terms}</div>
          </div>}
        </div>

        {/* RIGHT — replacement */}
        <div style={{ background: '#fff', border: `1.5px solid ${pick ? (pick.eligible ? '#BDE5CC' : LINE) : LINE}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 16 }}>Replacement</div>
          {pick ? (
            <>
              <DetailGrid items={[
                ['Room type', pick.roomDescription],
                ['Board basis', pick.board],
                ['Cancellation', pick.refundable ? 'Refundable' : 'Non-refundable'],
                ['Free cancel until', fmtDate(pick.cancelBy)],
              ]} />
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 12, color: SLATE }}>New price</div>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 25, color: NAVY }}>{money(pick.native, pick.currency)}</div>
                <div style={{ color: SLATE, fontSize: 12.5 }}>{usd(pick.usd)}</div>
                {pick.vsOriginalNative != null && (
                  <div style={{ fontSize: 15, fontWeight: 800, color: pick.vsOriginalNative > 0 ? GREEN : RED, marginTop: 6 }}>
                    {pick.vsOriginalNative > 0 ? 'Save ' : 'Costs '}{money(Math.abs(pick.vsOriginalNative), pick.currency)}
                  </div>
                )}
              </div>
              {pick.blockers && pick.blockers.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: AMBER, lineHeight: 1.5 }}>{pick.blockers.join(' · ')}</div>
              )}
              <button className="rp-primary" disabled={!pick.selectable} style={{ marginTop: 18, width: '100%', padding: '12px' }}
                onClick={() => alert('Rebook runs the money-path (search → recheck → rebook → confirm → cancel). Wire to /repricing/book-replacement when ready.')}>
                Rebook this rate
              </button>
              {!pick.eligible && pick.selectable && (
                <div style={{ marginTop: 8, fontSize: 12, color: AMBER, textAlign: 'center' }}>Not an exact refundable match — review notes above.</div>
              )}
            </>
          ) : (
            <div style={{ color: SLATE, fontSize: 13.5, padding: '40px 0', textAlign: 'center' }}>{checking ? 'Checking live rates…' : 'Pick a rate below to see the replacement details.'}</div>
          )}
        </div>
      </div>

      {/* room list */}
      <div style={{ padding: '0 32px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3 }}>All rooms {allRates.length ? `(${shown.length}/${allRates.length})` : ''}</div>
          <button className="rp-btn" onClick={runCheck} disabled={checking} style={{ padding: '6px 14px' }}>{checking ? 'Checking…' : 'Re-check'}</button>
        </div>

        {!checking && allRates.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={'rp-chip' + (refOnly ? ' on' : '')} onClick={() => setRefOnly((v) => !v)}>Refundable only</button>
            <span style={{ width: 1, height: 20, background: LINE, margin: '0 4px' }} />
            <button className={'rp-chip' + (boardFilter === 'any' ? ' on' : '')} onClick={() => setBoardFilter('any')}>All boards</button>
            {orderedBuckets.map((b) => (
              <button key={b} className={'rp-chip' + (boardFilter === b ? ' on' : '')} onClick={() => setBoardFilter(b)}>{BOARD_LABELS[b]}</button>
            ))}
          </div>
        )}

        {checking ? (
          <div>
            <div style={{ color: SLATE, fontSize: 13, marginBottom: 12 }}>Checking live rates in {row.currency || 'booking currency'}…</div>
            {[...Array(6)].map((_, i) => <div key={i} style={{ height: 60, background: '#EEF2F7', borderRadius: 10, marginBottom: 10 }} />)}
          </div>
        ) : err ? (
          <div style={{ padding: 16, background: '#FDEBEC', color: RED, borderRadius: 10, fontSize: 13.5 }}>{err}</div>
        ) : allRates.length === 0 ? (
          <div style={{ padding: 20, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10 }}>No live rates for these dates and occupancy.</div>
        ) : shown.length === 0 ? (
          <div style={{ padding: 20, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10 }}>No rooms match these filters.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {shown.map((rt: any, i: number) => {
              const disabled = !rt.selectable;
              const isSel = selected === rt.rateKey;
              const costMore = rt.vsOriginalNative != null && rt.vsOriginalNative < 0;
              return (
                <div key={rt.rateKey || i} onClick={() => { if (!disabled) setSelected(rt.rateKey); }}
                  style={{ background: '#fff', border: `1.5px solid ${isSel ? BLUE : (rt.eligible ? '#BDE5CC' : LINE)}`, borderRadius: 10, padding: '12px 16px', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{rt.roomDescription}</div>
                      <div style={{ color: SLATE, fontSize: 12, marginTop: 2 }}>{[rt.board, rt.refundable ? 'Refundable' : 'Non-refundable'].filter(Boolean).join(' · ')}</div>
                      {rt.cancelBy && <div style={{ color: SLATE, fontSize: 11.5, marginTop: 2 }}>Free cancel until {fmtDate(rt.cancelBy)}</div>}
                      {rt.blockers && rt.blockers.length > 0 && <div style={{ color: costMore ? RED : AMBER, fontSize: 11.5, marginTop: 4 }}>{rt.blockers.join(' · ')}</div>}
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 16, color: NAVY }}>{money(rt.native, rt.currency)}</div>
                      <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(rt.usd)}</div>
                      {rt.vsOriginalNative != null && <div style={{ fontSize: 12, fontWeight: 700, color: rt.vsOriginalNative > 0 ? GREEN : RED, marginTop: 2 }}>{rt.vsOriginalNative > 0 ? '−' : '+'}{money(Math.abs(rt.vsOriginalNative), rt.currency)}</div>}
                    </div>
                  </div>
                  {rt.eligible && <div style={{ position: 'absolute', top: 0, right: 0, background: GREEN, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '0 9px 0 8px' }}>MATCH</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailGrid({ items }: { items: [string, any][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', fontSize: 13.5 }}>
      {items.map(([label, value], i) => (
        <div key={i}>
          <div style={{ color: SLATE, fontSize: 11.5 }}>{label}</div>
          <div style={{ color: NAVY, fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</div>
        </div>
      ))}
    </div>
  );
}
