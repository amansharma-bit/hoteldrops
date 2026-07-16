'use client';

import React, { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

function urgencyStyle(cancelByDate: string | null) {
  if (!cancelByDate) return { bg: '#F1F5F9', color: '#64748B', label: '—' };
  const days = Math.ceil((new Date(cancelByDate).getTime() - new Date('2026-07-13').getTime()) / 86400000);
  if (days <= 3) return { bg: '#FEF2F2', color: '#DC2626', label: `${days}d left` };
  if (days <= 14) return { bg: '#FFFBEB', color: '#B8860B', label: `${days}d left` };
  return { bg: '#F0FDF4', color: '#16A34A', label: `${days}d left` };
}

export default function RepricingPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repriceResults, setRepriceResults] = useState<Record<string, any>>({});
  const [repricingId, setRepricingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authenticatedFetch(`${API_BASE}/api/live-search/bookings-list?page=${page}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (d.error) setError(d.error); else setData(d); })
      .catch((e: any) => setError('Could not load bookings: ' + e.message))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleReprice(row: any) {
    setRepricingId(row.bookingId);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/live-search/live-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_code: row.hotelCode, checkin: row.checkin, checkout: row.checkout, adults: row.adults }),
      });
      const result = await res.json();
      const hotel = result.hotels?.[0];
      setRepriceResults((prev) => ({
        ...prev,
        [row.bookingId]: hotel
          ? { found: true, price: hotel.price, currency: hotel.currency }
          : { found: false, message: 'No live availability found for these dates.' },
      }));
    } catch (e: any) {
      setRepriceResults((prev) => ({ ...prev, [row.bookingId]: { found: false, message: 'Reprice failed: ' + e.message } }));
    } finally {
      setRepricingId(null);
    }
  }

  const rows = data?.rows || [];

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '24px 32px' }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Live repricing</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Check any real booking against live GRN rates, instantly — no upload needed.</p>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>
          )}

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Booking', 'Hotel', 'Price', 'Supplier', 'Check-in / Cancel by', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading live bookings…</td></tr>
                ) : (
                  rows.map((r: any) => {
                    const urgency = urgencyStyle(r.lastCancellationDate);
                    const isExpanded = expandedId === r.bookingId;
                    const repriceResult = repriceResults[r.bookingId];
                    return (
                      <React.Fragment key={r.bookingId}>
                        <tr onClick={() => setExpandedId(isExpanded ? null : r.bookingId)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{r.bookingId}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.bookingDate ? new Date(r.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{r.hotelName}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{r.currency} {r.priceTotal?.toFixed(2) ?? '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ color: '#64748B', fontSize: 12, marginBottom: 6 }}>{r.supplier || '—'}</div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReprice(r); }}
                              disabled={repricingId === r.bookingId || !r.hotelCode}
                              style={{ border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 600, background: repricingId === r.bookingId ? '#94A3B8' : '#1447b8', color: '#fff', cursor: 'pointer' }}
                            >
                              {repricingId === r.bookingId ? 'Checking…' : 'Reprice'}
                            </button>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ color: '#334155', fontSize: 13 }}>{new Date(r.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div style={{ display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: urgency.bg, color: urgency.color }}>{urgency.label}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: 16 }}>{isExpanded ? '▲' : '▼'}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: repriceResult ? 16 : 0 }}>
                                <Detail label="City" value={r.city} />
                                <Detail label="Country" value={r.country} />
                                <Detail label="Room" value={r.roomType} />
                                <Detail label="Board basis" value={r.boardBasis} />
                                <Detail label="Checkout" value={new Date(r.checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                                <Detail label="Status" value={r.status} />
                                <Detail label="Adults / children" value={`${r.adults} / ${r.children}`} />
                                <Detail label="Hotel code" value={r.hotelCode} />
                              </div>
                              {repriceResult && (
                                <div style={{ borderRadius: 10, padding: '12px 16px', fontWeight: 700, fontSize: 13, textAlign: 'center', background: !repriceResult.found ? '#FEF2F2' : (r.priceTotal - repriceResult.price > 0.01 ? '#F0FDF4' : '#FEF2F2'), color: !repriceResult.found ? '#DC2626' : (r.priceTotal - repriceResult.price > 0.01 ? '#16A34A' : '#DC2626') }}>
                                  {!repriceResult.found
                                    ? repriceResult.message
                                    : (r.priceTotal - repriceResult.price > 0.01
                                        ? `✓ Saving found: ${repriceResult.currency} ${(r.priceTotal - repriceResult.price).toFixed(2)} (live price: ${repriceResult.currency} ${repriceResult.price})`
                                        : `No saving — live price is ${repriceResult.currency} ${repriceResult.price} (original: ${r.currency} ${r.priceTotal})`)}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {loading ? 'Loading…' : `Page ${page} of ${data?.totalPages?.toLocaleString() ?? '—'}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : '#334155', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={loading} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#1447b8', color: '#fff', cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{value || '—'}</div>
    </div>
  );
}
