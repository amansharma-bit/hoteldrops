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

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/live-search/bookings-list?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError('Could not load bookings: ' + e.message))
      .finally(() => setLoading(false));
  }, [page]);

  const rows = data?.rows || [];
  const filteredRows = statusFilter === 'all' ? rows : rows.filter((r: any) =>
    statusFilter === 'rebooked' ? r.rebookedStatus === 'Rebooked' : r.status.toLowerCase() === statusFilter
  );

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Bookings</h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Every booking in your GRN book — not just the ones we've rebooked.</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: loading ? '#F1F5F9' : error ? '#FEF2F2' : '#F0FDF4', color: loading ? '#64748B' : error ? '#DC2626' : '#16A34A', padding: '5px 12px', borderRadius: 20, border: `1px solid ${loading ? '#E2E8F0' : error ? '#FECACA' : '#BBF7D0'}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#94A3B8' : error ? '#DC2626' : '#16A34A' }} />
              {loading ? 'Loading' : error ? 'Error' : 'Live'}
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#334155' }}>
                <option value="all">All statuses</option>
                <option value="rebooked">Rebooked</option>
                <option value="eligible">Eligible</option>
                <option value="not eligible">Not eligible</option>
              </select>
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
                  {['Booking ID', 'Hotel', 'City', 'Room', 'Check-in', 'Check-out', 'Price', 'Refundable', 'Supplier', 'Board Basis', 'Cancel By', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading live bookings…</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No bookings match this filter on this page.</td></tr>
                ) : (
                  filteredRows.map((r: any) => (
                    <tr key={r.bookingId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{r.bookingId}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{r.hotelName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.city || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.roomType || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.checkin}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.checkout}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0F172A' }}>{r.currency} {r.priceTotal?.toFixed(2) ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>{r.refundable ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12 }}>{r.supplier || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{r.boardBasis || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12 }}>{r.lastCancellationDate ? new Date(r.lastCancellationDate).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: r.status === 'Eligible' ? '#F0FDF4' : '#FEF2F2', color: r.status === 'Eligible' ? '#16A34A' : '#DC2626' }}>{r.status}</span>
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
