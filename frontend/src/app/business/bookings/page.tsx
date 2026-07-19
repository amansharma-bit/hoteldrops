'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE = '#4589f0';
const NAVY = '#0F172A';
const GOLD = '#F5B833';
const SLATE = '#64748B';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const RED = '#DC2626';
const AMBER = '#D97706';

function fmtDate(d: string | null, withYear = true) {
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
function money(amount: number | null, currency: string | null) {
  if (amount == null) return '—';
  return `${currency || ''} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('MTD');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');

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
    authenticatedFetch(`${API_BASE}/api/live-search/bookings-list?page=${page}&status=all&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, period]);

  const allRows = data?.rows || [];
  const rows = citySearch.trim()
    ? allRows.filter((r: any) => (r.city || '').toLowerCase().includes(citySearch.trim().toLowerCase()))
    : allRows;
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
              <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Every booking on your GRN book — click any row for full details.</p>
            </div>
            {data?.diagnostics?.syncedThrough && (
              <span style={{ fontSize: 12, color: SLATE }}>Synced through <strong style={{ color: NAVY }}>{fmtDate(data.diagnostics.syncedThrough)}, {new Date(data.diagnostics.syncedThrough).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
            {['Today', 'WTD', 'MTD', 'YTD'].map((p) => (
              <button key={p} onClick={() => { setPeriod(p); setPage(1); setExpanded(null); }} style={{
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 7,
                background: period === p ? BLUE : 'transparent', color: period === p ? '#fff' : SLATE, transition: 'background 0.15s',
              }}>{p}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '0 1 260px' }}>
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city…"
              style={{ width: '100%', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 12px 8px 32px', fontSize: 13, color: NAVY, background: '#fff', outline: 'none', fontFamily: 'inherit' }}
            />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: SLATE }}>{loading ? 'Loading…' : `${rows.length} shown · ${data?.total ?? 0} total`}</span>
        </div>

        {error && (
          <div style={{ margin: '18px 32px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: RED }}>{error}</div>
        )}

        {/* Table */}
        <div style={{ padding: '18px 32px 40px' }}>
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Column header */}
            <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 130px 120px 96px 100px 28px', gap: 14, padding: '13px 20px', borderBottom: `1px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booked', 'Hotel', 'Supplier', 'Amount', 'Rebook by', 'Status', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', textAlign: i === 3 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Loading bookings…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '50px 0', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No bookings match.</div>
            ) : (
              rows.map((r: any) => {
                const isOpen = expanded === r.bookingId;
                const dLeft = daysUntil(r.lastCancellationDate);
                const deadlineColor = dLeft == null ? SLATE : dLeft <= 3 ? RED : dLeft <= 7 ? AMBER : NAVY;
                return (
                  <div key={r.bookingId} style={{ borderBottom: `1px solid ${LINE}` }}>
                    {/* Summary row */}
                    <div
                      onClick={() => setExpanded(isOpen ? null : r.bookingId)}
                      style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 130px 120px 96px 100px 28px', gap: 14, padding: '14px 20px', cursor: 'pointer', alignItems: 'center', background: isOpen ? '#F7FAFF' : '#fff', transition: 'background 0.15s' }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>{fmtDate(r.bookingDate, false)}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>{r.bookingId}</div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotelName}</div>
                        <div style={{ fontSize: 12, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.city || '—'}</div>
                      </div>
                      <div style={{ fontSize: 12, color: SLATE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.supplier || '—'}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: 'monospace' }}>{money(r.priceTotal, r.currency)}</div>
                        {r.priceUsd != null && r.currency !== 'USD' && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>${r.priceUsd.toLocaleString()}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: deadlineColor }}>{fmtDate(r.lastCancellationDate, false)}</div>
                        {dLeft != null && dLeft >= 0 && <div style={{ fontSize: 10, color: deadlineColor, marginTop: 1 }}>{dLeft === 0 ? 'today' : `${dLeft}d left`}</div>}
                      </div>
                      <div>
                        <UrgencyPill days={dLeft} />
                      </div>
                      <div style={{ textAlign: 'center', color: '#94A3B8', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    {/* Inline detail — animated */}
                    <div style={{ maxHeight: isOpen ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.32s ease', background: '#F7FAFF' }}>
                      <div style={{ padding: isOpen ? '4px 20px 22px' : '0 20px', borderTop: isOpen ? `1px solid ${LINE}` : 'none' }}>
                        <DetailGrid r={r} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: SLATE }}>{loading ? '' : `Page ${page}`}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpanded(null); }} disabled={page === 1 || loading} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : NAVY, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
              <button onClick={() => { setPage((p) => p + 1); setExpanded(null); }} disabled={loading || !hasMore} style={{ border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : BLUE, color: !hasMore ? '#94A3B8' : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function UrgencyPill({ days }: { days: number | null }) {
  if (days == null || days < 0) return null;
  let label, bg, fg;
  if (days <= 3) { label = 'Closing soon'; bg = '#FEE2E2'; fg = '#B91C1C'; }
  else if (days <= 7) { label = 'This week'; bg = '#FEF3C7'; fg = '#92400E'; }
  else if (days <= 14) { label = '2 weeks'; bg = '#E0EDFF'; fg = '#1E50A8'; }
  else return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', padding: '3px 9px', borderRadius: 20, background: bg, color: fg, whiteSpace: 'nowrap' }}>{label}</span>
  );
}

function DetailGrid({ r }: { r: any }) {
  const nights = (() => {
    if (!r.checkin || !r.checkout) return null;
    const a = new Date(r.checkin), b = new Date(r.checkout);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  })();
  const dToCheckin = daysUntil(r.checkin);
  const dToDeadline = daysUntil(r.lastCancellationDate);
  const guestList = (r.guests && r.guests.length) ? r.guests.join(', ') : (r.guestName || '—');
  const childText = r.childrenCount ? `${r.childrenCount}${r.childrenAges?.length ? ` (ages ${r.childrenAges.join(', ')})` : ''}` : '0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 40px', paddingTop: 16 }}>
      <Section title="Stay">
        <Field label="Check-in" value={`${fmtDate(r.checkin)}${dToCheckin != null && dToCheckin >= 0 ? ` · in ${dToCheckin}d` : ''}`} />
        <Field label="Check-out" value={fmtDate(r.checkout)} />
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
        <Field label="Local" value={money(r.priceTotal, r.currency)} mono />
        <Field label="USD" value={r.priceUsd != null ? `$${r.priceUsd.toLocaleString()}` : '—'} mono />
      </Section>

      <Section title="Cancellation">
        <Field label="Rebook by" value={`${fmtDate(r.lastCancellationDate)}${dToDeadline != null && dToDeadline >= 0 ? ` · ${dToDeadline}d left` : ''}`} />
        <Field label="Refundable" value={r.nonRefundable === false ? 'Yes' : r.nonRefundable === true ? 'No' : '—'} />
        {r.cancellationPolicy && r.cancellationPolicy[0] && (
          <Field label="Policy" value={`Fee ${r.cancellationPolicy[0].currency || ''} ${r.cancellationPolicy[0].flat_fee || '—'} from ${fmtDate(r.cancellationPolicy[0].from)}`} />
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
