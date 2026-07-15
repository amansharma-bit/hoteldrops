'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [period, setPeriod] = useState('MTD');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [pendingStart, setPendingStart] = useState('');
  const [pendingEnd, setPendingEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function getDateRange(p: string) {
    const now = new Date('2026-07-13');
    let start = new Date(now);
    if (p === 'Today') { /* start = now */ }
    else if (p === 'WTD') { start.setDate(now.getDate() - now.getDay()); }
    else if (p === 'MTD') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (p === 'YTD') { start = new Date(now.getFullYear(), 0, 1); }
    const fmt = (d: Date) => d.toISOString().slice(0, 10) + ' 00:00:00';
    return { start: fmt(start), end: now.toISOString().slice(0, 10) + ' 23:59:59' };
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    const range = showCustom && customStart && customEnd
      ? { start: customStart + ' 00:00:00', end: customEnd + ' 23:59:59' }
      : getDateRange(period);
    fetch(`${API_BASE}/api/live-search/bookings-list?page=${page}&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError('Could not load bookings: ' + e.message))
      .finally(() => setLoading(false));
  }, [page, period, customStart, customEnd, showCustom]);

  const rows = data?.rows || [];
  const filteredRows = statusFilter === 'all' ? rows : rows.filter((r: any) =>
    statusFilter === 'rebooked' ? r.rebookedStatus === 'Rebooked' : (r.bookingStatus || '').toLowerCase() === statusFilter
  );

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Bookings</h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>All bookings across your GRN book — search, filter, and track cancellation windows in real time.</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: loading ? '#F1F5F9' : error ? '#FEF2F2' : '#F0FDF4', color: loading ? '#64748B' : error ? '#DC2626' : '#16A34A', padding: '5px 12px', borderRadius: 20, border: `1px solid ${loading ? '#E2E8F0' : error ? '#FECACA' : '#BBF7D0'}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#94A3B8' : error ? '#DC2626' : '#16A34A' }} />
              {loading ? 'Loading' : error ? 'Error' : 'Live'}
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#334155' }}>
                <option value="all">All bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rebooked">Rebooked</option>
              </select>
              <div style={{ display: 'flex', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 3 }}>
                {['Today', 'WTD', 'MTD', 'YTD'].map((p) => (
                  <button key={p} onClick={() => { setPeriod(p); setShowCustom(false); setPage(1); }} style={{ border: 'none', background: !showCustom && period === p ? '#1447b8' : 'transparent', color: !showCustom && period === p ? '#fff' : '#64748B', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>{p}</button>
                ))}
              </div>
              <button onClick={() => setShowCustom(!showCustom)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, background: showCustom ? '#1447b8' : '#fff', color: showCustom ? '#fff' : '#64748B', cursor: 'pointer' }}>Custom range</button>
              {showCustom && (
                <>
                  <input type="date" value={pendingStart} onChange={(e) => setPendingStart(e.target.value)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12 }} />
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>to</span>
                  <input type="date" value={pendingEnd} onChange={(e) => setPendingEnd(e.target.value)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12 }} />
                  <button
                    onClick={() => { if (pendingStart && pendingEnd) { setCustomStart(pendingStart); setCustomEnd(pendingEnd); setPage(1); } }}
                    disabled={!pendingStart || !pendingEnd}
                    style={{ border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, background: pendingStart && pendingEnd ? '#1447b8' : '#E2E8F0', color: pendingStart && pendingEnd ? '#fff' : '#94A3B8', cursor: pendingStart && pendingEnd ? 'pointer' : 'not-allowed' }}
                  >
                    Apply
                  </button>
                </>
              )}
            </div>
            <button style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#334155', cursor: 'pointer' }}>Export CSV</button>
          </div>


          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>
          )}

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Booking ID', 'Hotel', 'Room', 'Stay', 'Price', 'Supplier', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading live bookings…</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No bookings match this filter on this page.</td></tr>
                ) : (
                  filteredRows.map((r: any) => (
                    <tr key={r.bookingId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#94A3B8', verticalAlign: 'top' }}>{r.bookingId}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.hotelName}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.city || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ color: '#334155' }}>{r.roomType || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.boardBasis || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ color: '#334155' }}>{new Date(r.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(r.checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Cancel by {r.lastCancellationDate ? new Date(r.lastCancellationDate).toLocaleDateString() : '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{r.currency} {r.priceTotal?.toFixed(2) ?? '—'}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: r.refundable ? '#F0FDF4' : '#FEF2F2', color: r.refundable ? '#16A34A' : '#DC2626' }}>{r.refundable ? 'Refundable' : 'Non-refundable'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12, verticalAlign: 'top' }}>{r.supplier || '—'}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: r.bookingStatus === 'Confirmed' ? '#FCD34D' : r.bookingStatus === 'Cancelled' ? '#FEF2F2' : '#F1F5F9', color: r.bookingStatus === 'Confirmed' ? '#78350F' : r.bookingStatus === 'Cancelled' ? '#DC2626' : '#64748B' }}>{r.bookingStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {loading ? 'Loading…' : `Showing ${rows.length} of ${data?.totalBookings?.toLocaleString() ?? '—'} bookings · Page ${page} of ${data?.totalPages?.toLocaleString() ?? '—'}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : '#334155', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={loading || (data && page >= data.totalPages)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#1447b8', color: '#fff', cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}
