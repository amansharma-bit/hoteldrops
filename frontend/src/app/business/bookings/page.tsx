'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#4589f0';
const NAVY = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const RED = '#DC2626';
const RED_BORDER = '#EF4444';
const AMBER = '#D97706';
const AMBER_BORDER = '#F59E0B';

const USD_RATE: Record<string, number> = { USD:1, EUR:1.1446, GBP:1.3401, INR:0.011765, AED:0.27225, AUD:0.696, THB:0.0301, SGD:0.777, JPY:0.0067, CNY:0.14, HKD:0.128, SAR:0.2666, MYR:0.236, IDR:0.0000553, NPR:0.007353, CAD:0.73, MXN:0.0575, ZAR:0.055 };

function fmtDate(d: string | null, withYear = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}
function daysUntil(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
}
function toUsd(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const r = USD_RATE[currency || ''];
  return r ? Math.round(amount * r) : null;
}
function nightsBetween(a: string | null, b: string | null) {
  if (!a || !b) return null;
  const x = new Date(a), y = new Date(b);
  if (isNaN(x.getTime()) || isNaN(y.getTime())) return null;
  return Math.round((y.getTime() - x.getTime()) / 86400000);
}

// urgency tier from days-until-deadline
function tier(days: number | null) {
  if (days == null) return { key: 'none', numColor: SLATE, labelColor: MUTED, spine: LINE };
  if (days <= 3) return { key: 'red', numColor: RED, labelColor: RED, spine: RED_BORDER };
  if (days <= 7) return { key: 'amber', numColor: AMBER, labelColor: AMBER, spine: AMBER_BORDER };
  return { key: 'none', numColor: SLATE, labelColor: MUTED, spine: LINE };
}

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('MTD');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'value'>('urgency');

  useEffect(() => {
    const id = setTimeout(() => { setCityQuery(citySearch.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [citySearch]);

  function getDateRange(p: string) {
    const now = new Date();
    let start = new Date(now);
    if (p === 'Today') { /* today */ }
    else if (p === 'WTD') { start.setDate(now.getDate() - now.getDay()); }
    else if (p === 'MTD') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (p === 'YTD') { start = new Date(now.getFullYear(), 0, 1); }
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(start) + ' 00:00:00', end: fmt(now) + ' 23:59:59' };
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const range = getDateRange(period);
    const cityParam = cityQuery ? `&city=${encodeURIComponent(cityQuery)}` : '';
    authenticatedFetch(`${API_BASE}/api/live-search/bookings-list?page=${page}&status=all&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}${cityParam}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, period, cityQuery]);

  const raw = data?.rows || [];
  const rows = [...raw].sort((a: any, b: any) => {
    if (sortBy === 'value') return (toUsd(b.priceTotal, b.currency) || 0) - (toUsd(a.priceTotal, a.currency) || 0);
    const da = daysUntil(a.lastCancellationDate), db = daysUntil(b.lastCancellationDate);
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
  const hasMore = data?.hasMore ?? false;

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '26px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Bookings</h1>
              <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Your GRN book, sorted by what's closing soonest.</p>
            </div>
            {data?.diagnostics?.syncedThrough && (
              <span style={{ fontSize: 12, color: SLATE }}>Synced through <strong style={{ color: NAVY }}>{fmtDate(data.diagnostics.syncedThrough, true)}, {new Date(data.diagnostics.syncedThrough).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
            {['Today', 'WTD', 'MTD', 'YTD'].map((p) => (
              <button key={p} onClick={() => { setPeriod(p); setPage(1); setExpanded(null); }} style={{
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 7,
                background: period === p ? BLUE : 'transparent', color: period === p ? '#fff' : SLATE, transition: 'background 0.15s',
              }}>{p}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '0 1 240px' }}>
            <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search city…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 12px 8px 32px', fontSize: 13, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          {/* sort toggle */}
          <div style={{ display: 'flex', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
            {([['urgency', 'Closing soonest'], ['value', 'Highest value']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setSortBy(k)} style={{
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 7,
                background: sortBy === k ? NAVY : 'transparent', color: sortBy === k ? '#fff' : SLATE, transition: 'background 0.15s',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: SLATE }}>{loading ? 'Loading…' : cityQuery ? `${data?.total ?? 0} in "${cityQuery}"` : `${data?.total ?? 0} total`}</span>
        </div>

        {error && (
          <div style={{ margin: '18px 32px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Queue */}
        <div style={{ padding: '18px 32px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading bookings…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>No bookings match.</div>
          ) : (
            rows.map((r: any) => {
              const isOpen = expanded === r.bookingId;
              const dLeft = daysUntil(r.lastCancellationDate);
              const tr = tier(dLeft);
              const usd = toUsd(r.priceTotal, r.currency);
              const nights = nightsBetween(r.checkin, r.checkout);
              return (
                <div key={r.bookingId} style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderLeft: `3px solid ${tr.spine}`, borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.15s' }}>
                  {/* Row */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : r.bookingId)}
                    style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) 180px 130px 40px', gap: 20, alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}
                  >
                    {/* Countdown */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 700, color: tr.numColor, lineHeight: 1 }}>{dLeft != null && dLeft >= 0 ? dLeft : '—'}</span>
                        <span style={{ fontSize: 12, color: tr.labelColor }}>{dLeft != null && dLeft >= 0 ? 'days left' : 'expired'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>rebook by {fmtDate(r.lastCancellationDate)}</div>
                    </div>
                    {/* Hotel */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotelName}</div>
                      <div style={{ fontSize: 12, color: SLATE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[r.city, r.roomType, r.boardBasis].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    {/* Stay + supplier */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: NAVY }}>{fmtDate(r.checkin)} → {fmtDate(r.checkout)}{nights != null ? <span style={{ color: MUTED }}> · {nights}n</span> : null}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.supplier || '—'}</div>
                    </div>
                    {/* Value */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, color: NAVY }}>{usd != null ? `$${usd.toLocaleString()}` : '—'}</div>
                      <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', marginTop: 1 }}>{r.currency} {r.priceTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    {/* Chevron */}
                    <div style={{ textAlign: 'center', color: MUTED, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', justifySelf: 'end' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {/* Detail */}
                  <div style={{ maxHeight: isOpen ? 460 : 0, overflow: 'hidden', transition: 'max-height 0.32s ease', background: '#FBFCFE' }}>
                    <div style={{ padding: isOpen ? '18px 20px 22px' : '0 20px', borderTop: isOpen ? `0.5px solid ${LINE}` : 'none' }}>
                      <DetailGrid r={r} />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {!loading && rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 13, color: SLATE }}>Page {page}</span>
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

function DetailGrid({ r }: { r: any }) {
  const nights = nightsBetween(r.checkin, r.checkout);
  const dToCheckin = daysUntil(r.checkin);
  const guestList = (r.guests && r.guests.length) ? r.guests.join(', ') : (r.guestName || '—');
  const childText = r.childrenCount ? `${r.childrenCount}${r.childrenAges?.length ? ` (ages ${r.childrenAges.join(', ')})` : ''}` : '0';
  const usd = toUsd(r.priceTotal, r.currency);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 44px' }}>
      <Section title="Stay">
        <Field label="Check-in" value={`${fmtDate(r.checkin, true)}${dToCheckin != null && dToCheckin >= 0 ? ` · in ${dToCheckin}d` : ''}`} />
        <Field label="Check-out" value={fmtDate(r.checkout, true)} />
        <Field label="Nights" value={nights != null ? String(nights) : '—'} />
        <Field label="Room type" value={r.roomType || '—'} />
        <Field label="Board basis" value={r.boardBasis || '—'} />
      </Section>
      <Section title="Hotel">
        <Field label="Name" value={r.hotelName} />
        <Field label="Address" value={r.address || '—'} />
        <Field label="City" value={[r.city, r.country].filter(Boolean).join(', ') || '—'} />
        <Field label="Hotel code" value={r.hotelCode || '—'} mono />
      </Section>
      <Section title="Guests">
        <Field label="Names" value={guestList} />
        <Field label="Adults" value={r.adults != null ? String(r.adults) : '—'} />
        <Field label="Children" value={childText} />
        <Field label="Rooms" value={r.roomCount != null ? String(r.roomCount) : '—'} />
      </Section>
      <Section title="Price">
        <Field label="Local" value={`${r.currency || ''} ${r.priceTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}`} mono />
        <Field label="USD" value={usd != null ? `$${usd.toLocaleString()}` : '—'} mono />
      </Section>
      <Section title="Cancellation">
        <Field label="Rebook by" value={fmtDate(r.lastCancellationDate, true)} />
        <Field label="Refundable" value={r.nonRefundable === false ? 'Yes' : r.nonRefundable === true ? 'No' : '—'} />
        {r.cancellationPolicy && r.cancellationPolicy[0] && (
          <Field label="Policy" value={`Fee ${r.cancellationPolicy[0].currency || ''} ${r.cancellationPolicy[0].flat_fee || '—'} from ${fmtDate(r.cancellationPolicy[0].from, true)}`} />
        )}
      </Section>
      <Section title="References">
        <Field label="GRN booking ID" value={r.bookingId} mono />
        <Field label="Booking ref" value={r.bookingReference || '—'} mono />
        <Field label="Supplier" value={r.supplier || '—'} />
        <Field label="Supplier ref" value={r.supplierReference || '—'} mono />
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: BLUE, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
      <span style={{ color: SLATE, flexShrink: 0 }}>{label}</span>
      <span style={{ color: NAVY, fontWeight: 500, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 11.5 : 12.5, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
