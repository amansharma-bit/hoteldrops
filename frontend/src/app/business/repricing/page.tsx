'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#0093FF';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
const GREEN = '#16A34A';
const RED = '#DC2626';
const SLATE = '#64748B';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';

function usd(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function money(native: number | null | undefined, currency: string | null | undefined) {
  if (native == null) return '—';
  const c = currency ? currency + ' ' : '';
  return c + Number(native).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function num(n: number | null | undefined) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}
function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const [drawer, setDrawer] = useState<any>(null);   // the candidate row being viewed

  function load(reset = true) {
    setLoading(true);
    setError(null);
    const p = reset ? 1 : page;
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (q.trim()) params.set('q', q.trim());
    if (deadline !== 'any') params.set('deadline', deadline);
    if (price) params.set('price', price);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/candidates?${params.toString()}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setError(d.error); return; }
        setRows(d.rows || []);
        setTotal(d.total || 0);
        setHasMore(Boolean(d.hasMore));
        setViewCounts(d.viewCounts || null);
        if (reset) setPage(1);
      })
      .catch((e: any) => setError('Could not load candidates: ' + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    authenticatedFetch(`${API_BASE}/api/live-search/dashboard?_t=${Date.now()}`)
      .then((r: Response) => r.json()).then((d: any) => { if (!d.error) setDashStats(d.tiles || null); })
      .catch(() => {});
  }, []);
  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [deadline]);

  const statsLoading = !dashStats;
  const cards = [
    { label: 'Live rebookable', value: statsLoading ? '—' : usd(dashStats?.liveRebookable?.valueUsd), accent: GREEN },
    { label: 'Expiring soon', value: statsLoading ? '—' : num(dashStats?.expiringSoon?.count), accent: GOLD },
    { label: 'Checked', value: num(viewCounts?.checked), accent: BLUE },
    { label: 'Drops found', value: num(viewCounts?.dropped), accent: NAVY },
    { label: 'Rebooked', value: num(viewCounts?.rebooked), accent: GREEN },
  ];

  return (
    <BusinessSidebarWrapper>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: BG, minHeight: '100vh', padding: '28px 32px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          .rp-in { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; font-family:inherit; color:${NAVY}; background:#fff; outline:none; }
          .rp-in:focus { border-color:${BLUE}; }
          .rp-btn { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; background:#fff; color:${NAVY}; cursor:pointer; }
          .rp-btn:hover { border-color:${BLUE}; }
          .rp-primary { background:${BLUE}; color:#fff; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; }
          .rp-primary:disabled { background:#B9D9F5; cursor:not-allowed; }
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

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input className="rp-in" placeholder="Search hotel, city, guest, booking ID…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(true); }}
            style={{ minWidth: 260, flex: '1 1 260px' }} />
          <select className="rp-in" value={deadline} onChange={(e) => setDeadline(e.target.value)}>
            <option value="any">Any deadline</option>
            <option value="3d">Next 3 days</option>
            <option value="1w">Next week</option>
            <option value="1m">Next month</option>
            <option value="1y">Next year</option>
          </select>
          <select className="rp-in" value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="">Any price</option>
            <option value="0-250">Under $250</option>
            <option value="250-1000">$250–$1,000</option>
            <option value="1000-5000">$1,000–$5,000</option>
            <option value="5000-999999">Above $5,000</option>
          </select>
          <button className="rp-btn" onClick={() => load(true)}>Search</button>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 90px 120px 120px 108px 110px', padding: '12px 18px', borderBottom: `1px solid ${LINE}`, color: SLATE, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <div>Hotel / Booking</div><div>Nights</div><div>Paid</div><div>Last check</div><div>Rebook by</div><div></div>
          </div>

          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 90px 120px 120px 108px 110px', padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
                {[...Array(6)].map((__, j) => <div key={j} style={{ height: 14, background: '#EEF2F7', borderRadius: 6, marginRight: 12 }} />)}
              </div>
            ))
          ) : error ? (
            <div style={{ padding: 24, color: RED, fontSize: 14 }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, color: SLATE, fontSize: 14, textAlign: 'center' }}>No bookings match these filters.</div>
          ) : (
            rows.map((r) => (
              <div key={r.bookingId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 90px 120px 120px 108px 110px', padding: '14px 18px', borderBottom: `1px solid ${LINE}`, alignItems: 'center', fontSize: 13.5 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel || r.bookingId}</div>
                  <div style={{ color: SLATE, fontSize: 12, marginTop: 2 }}>{[r.city, r.bookingId].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ color: NAVY }}>{r.nights ?? '—'}</div>
                <div style={{ color: NAVY }}>
                  <div>{money(r.origNative, r.currency)}</div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(r.origUsd)}</div>
                </div>
                <div>
                  {r.lastCheck ? (
                    <>
                      <div style={{ color: r.lastCheck.dropped ? GREEN : NAVY, fontWeight: r.lastCheck.dropped ? 700 : 400 }}>
                        {r.lastCheck.dropped ? '+' + money(r.lastCheck.gapNative, r.currency) : 'No drop'}
                      </div>
                      <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtDate(r.lastCheck.checkedAt)}</div>
                    </>
                  ) : <span style={{ color: SLATE }}>—</span>}
                </div>
                <div>
                  <div style={{ color: r.daysToCancel != null && r.daysToCancel <= 3 ? RED : NAVY, fontWeight: r.daysToCancel != null && r.daysToCancel <= 3 ? 700 : 400 }}>
                    {r.daysToCancel != null ? `${r.daysToCancel}d left` : '—'}
                  </div>
                  <div style={{ color: SLATE, fontSize: 11.5 }}>{fmtDate(r.cancelByDate)}</div>
                </div>
                <div><button className="rp-primary" onClick={() => setDrawer(r)}>Reprice</button></div>
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

// ── Drawer: pulls live rates, shows all rooms with dual currency + greyed-if-pricier ──
function RepriceDrawer({ row, onClose }: { row: any; onClose: () => void }) {
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);

  function runCheck() {
    setChecking(true); setErr(null); setResult(null);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: row.bookingId }),
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

  const orig = result?.original;
  const rates = result?.allRates || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 620, maxWidth: '94vw', background: BG, height: '100%', overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${LINE}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 18, color: NAVY }}>{row.hotel || row.bookingId}</div>
            <div style={{ color: SLATE, fontSize: 12.5, marginTop: 3 }}>{[row.city, row.bookingId].filter(Boolean).join(' · ')}</div>
          </div>
          <button className="rp-btn" onClick={onClose} style={{ padding: '6px 12px' }}>Close</button>
        </div>

        {/* Current booking */}
        <div style={{ padding: '18px 24px' }}>
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12 }}>Current booking</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5 }}>
              <Field label="Room" value={orig?.room} />
              <Field label="Board" value={orig?.board} />
              <Field label="Supplier" value={orig?.supplier} />
              <Field label="Guests" value={orig?.guests ? orig.guests.length + ' pax' : (row.nights != null ? '—' : '—')} />
              <Field label="Check-in" value={fmtDate(orig?.checkin)} />
              <Field label="Free cancel until" value={fmtDate(orig?.cancelBy)} />
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
              <div style={{ fontSize: 12, color: SLATE }}>Paid</div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 22, color: NAVY }}>
                {orig ? money(orig.price?.native, orig.price?.currency) : money(row.origNative, row.currency)}
              </div>
              <div style={{ color: SLATE, fontSize: 12.5 }}>{orig ? usd(orig.price?.usd) : usd(row.origUsd)}</div>
            </div>
          </div>
        </div>

        {/* Live rates */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.3 }}>Live rates {rates.length ? `(${rates.length})` : ''}</div>
            <button className="rp-btn" onClick={runCheck} disabled={checking} style={{ padding: '6px 12px' }}>{checking ? 'Checking…' : 'Re-check'}</button>
          </div>

          {checking ? (
            <div>
              <div style={{ color: SLATE, fontSize: 13, marginBottom: 12 }}>Checking live rates in {row.currency || 'booking currency'}…</div>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 56, background: '#EEF2F7', borderRadius: 10, marginBottom: 10 }} />)}
            </div>
          ) : err ? (
            <div style={{ padding: 16, background: '#FDEBEC', color: RED, borderRadius: 10, fontSize: 13.5 }}>{err}</div>
          ) : rates.length === 0 ? (
            <div style={{ padding: 20, color: SLATE, fontSize: 13.5, textAlign: 'center', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10 }}>
              No live rates for these dates and occupancy.
            </div>
          ) : (
            <>
              {result?.message && (
                <div style={{ fontSize: 12.5, color: SLATE, marginBottom: 12 }}>{result.message}</div>
              )}
              {rates.map((rt: any, i: number) => {
                const costMore = rt.vsOriginalNative != null && rt.vsOriginalNative < 0;
                const disabled = !rt.selectable;
                const isSel = selected === rt.rateKey;
                return (
                  <div key={rt.rateKey || i}
                    onClick={() => { if (!disabled) setSelected(rt.rateKey); }}
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${isSel ? BLUE : (rt.eligible ? '#BDE5CC' : LINE)}`,
                      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
                      opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                      position: 'relative',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{rt.roomDescription}</div>
                        <div style={{ color: SLATE, fontSize: 12, marginTop: 2 }}>
                          {[rt.board, rt.refundable ? 'Refundable' : 'Non-refundable'].filter(Boolean).join(' · ')}
                        </div>
                        {rt.cancelBy && <div style={{ color: SLATE, fontSize: 11.5, marginTop: 2 }}>Free cancel until {fmtDate(rt.cancelBy)}</div>}
                        {rt.blockers && rt.blockers.length > 0 && (
                          <div style={{ color: costMore ? RED : '#B45309', fontSize: 11.5, marginTop: 4 }}>{rt.blockers.join(' · ')}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 16, color: NAVY }}>{money(rt.native, rt.currency)}</div>
                        <div style={{ color: SLATE, fontSize: 11.5 }}>{usd(rt.usd)}</div>
                        {rt.vsOriginalNative != null && (
                          <div style={{ fontSize: 12, fontWeight: 700, color: rt.vsOriginalNative > 0 ? GREEN : RED, marginTop: 2 }}>
                            {rt.vsOriginalNative > 0 ? '−' : '+'}{money(Math.abs(rt.vsOriginalNative), rt.currency)}
                          </div>
                        )}
                      </div>
                    </div>
                    {rt.eligible && <div style={{ position: 'absolute', top: 10, right: -1, background: GREEN, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '0 10px 0 8px' }}>MATCH</div>}
                  </div>
                );
              })}

              {/* action */}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="rp-primary" disabled={!selected} onClick={() => alert('Rebook flow runs the money-path chain (search → recheck → rebook → confirm → cancel). Wire to /repricing/book-replacement when ready.')}>
                  Rebook selected
                </button>
                {selected && rates.find((r: any) => r.rateKey === selected && !r.eligible) && (
                  <span style={{ color: '#B45309', fontSize: 12.5 }}>Heads up: selected rate isn’t an exact refundable match — review the notes above.</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ color: SLATE, fontSize: 11.5 }}>{label}</div>
      <div style={{ color: NAVY, fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}
