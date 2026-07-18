'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

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

  // -------------------------------------------------------------------------
  // Sync control.
  //
  // The sync can't be triggered from the browser address bar: /api/live-search/*
  // sits behind this app's auth middleware, and a URL typed into the address
  // bar carries no login token — it just returns "Not authenticated."
  //
  // authenticatedFetch attaches the Supabase session token, so triggering it
  // from this page (where you're already signed in) works, and needs no
  // separate secret.
  // -------------------------------------------------------------------------
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncState, setSyncState] = useState<any>(null);

  async function startSync() {
    setSyncBusy(true);
    setSyncMsg('Starting sync…');
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/sync-run?from=2026-04-15`);
      const d = await r.json();
      if (d.error) {
        setSyncMsg(`Error: ${d.error}${d.missing ? ' — missing: ' + d.missing.join(', ') : ''}${d.hint ? ' — ' + d.hint : ''}`);
      } else {
        setSyncMsg(d.started ? 'Sync started. It runs in the background — this can take 10–15 minutes.' : d.message);
      }
    } catch (e: any) {
      setSyncMsg('Could not start sync: ' + e.message);
    } finally {
      setSyncBusy(false);
    }
  }

  async function checkSync() {
    try {
      const r = await authenticatedFetch(`${API_BASE}/api/live-search/sync-status?_t=${Date.now()}`);
      const d = await r.json();
      setSyncState(d);
      if (d.error) setSyncMsg(`Error: ${d.error}`);
    } catch (e: any) {
      setSyncMsg('Could not read sync status: ' + e.message);
    }
  }

  // While a sync is running, poll every 5s so progress is visible.
  useEffect(() => {
    if (!syncState?.running) return;
    const id = setInterval(checkSync, 5000);
    return () => clearInterval(id);
  }, [syncState?.running]);

  // -------------------------------------------------------------------------
  // THE OFF-BY-ONE-DAY BUG.
  //
  // Old code:  d.toISOString().slice(0, 10)
  //
  // toISOString() converts to UTC. We're at UTC+5:30, so a Date built from
  // LOCAL parts — new Date(2026, 6, 1) = Jul 1 00:00 IST — becomes
  // "2026-06-30T18:30:00Z", and slicing gives "2026-06-30". Every preset
  // queried from the day before; "Today" queried yesterday. It's why MTD
  // showed rows booked Jun 30.
  //
  // Fix: format from the LOCAL calendar fields. No UTC conversion.
  // -------------------------------------------------------------------------
  const fmtLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function getDateRange(p: string) {
    const now = new Date();
    let start = new Date(now);
    if (p === 'Today') { /* start = today */ }
    else if (p === 'WTD') { start.setDate(now.getDate() - now.getDay()); }
    else if (p === 'MTD') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (p === 'YTD') { start = new Date(now.getFullYear(), 0, 1); }
    return { start: fmtLocalDate(start) + ' 00:00:00', end: fmtLocalDate(now) + ' 23:59:59' };
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    const range = showCustom && customStart && customEnd
      ? { start: customStart + ' 00:00:00', end: customEnd + ' 23:59:59' }
      : getDateRange(period);
    authenticatedFetch(`${API_BASE}/api/live-search/bookings-list?page=${page}&status=${statusFilter}&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (cancelled) return;
        if (d.error) setError(d.error + (d.hint ? ` — ${d.hint}` : ''));
        else setData(d);
      })
      .catch((e: any) => { if (!cancelled) setError('Could not load bookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, period, customStart, customEnd, showCustom, statusFilter]);

  const rows = data?.rows || [];
  const diag = data?.diagnostics;
  const hasMore = data?.hasMore ?? false;

  const fmtSynced = (v: string | null) =>
    v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Bookings</h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>All bookings across your GRN book — search, filter, and track cancellation windows.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={startSync} disabled={syncBusy} style={{ border: '1px solid #1447b8', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, background: syncBusy ? '#E2E8F0' : '#1447b8', color: syncBusy ? '#94A3B8' : '#fff', cursor: syncBusy ? 'not-allowed' : 'pointer' }}>
                {syncBusy ? 'Starting…' : 'Sync now'}
              </button>
              <button onClick={checkSync} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, background: '#fff', color: '#334155', cursor: 'pointer' }}>
                Check status
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: loading ? '#F1F5F9' : error ? '#FEF2F2' : '#F0FDF4', color: loading ? '#64748B' : error ? '#DC2626' : '#16A34A', padding: '5px 12px', borderRadius: 20, border: `1px solid ${loading ? '#E2E8F0' : error ? '#FECACA' : '#BBF7D0'}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#94A3B8' : error ? '#DC2626' : '#16A34A' }} />
                {loading ? 'Loading' : error ? 'Error' : 'Synced'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Data freshness. This page no longer pretends to be "live" — it
              shows our own synced copy, and says exactly how fresh it is.
              An honest timestamp beats a "Live" badge over stale numbers. */}
          {diag?.syncedThrough && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1E40AF' }}>
              Data synced through <strong>{fmtSynced(diag.syncedThrough)}</strong>
              {diag.lastSyncStatus === 'running' && <> · <span style={{ color: '#B45309' }}>sync in progress: {diag.lastSyncProgress}</span></>}
              {diag.lastSyncStatus === 'error' && <> · <span style={{ color: '#B91C1C' }}>last sync failed</span></>}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#334155' }}>
                <option value="all">All bookings</option>
                <option value="cancelled">Cancelled</option>
                <option value="refundable">Refundable</option>
                <option value="non-refundable">Non-Refundable</option>
                <option value="unknown">Unclassified</option>
              </select>
              <div style={{ display: 'flex', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 3 }}>
                {['Today', 'WTD', 'MTD', 'YTD'].map((p) => (
                  <button key={p} onClick={() => { setPeriod(p); setShowCustom(false); setPage(1); }} style={{ border: 'none', background: !showCustom && period === p ? '#1447b8' : 'transparent', color: !showCustom && period === p ? '#fff' : '#64748B', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>{p}</button>
                ))}
              </div>
              <button onClick={() => setShowCustom(!showCustom)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, background: showCustom ? '#1447b8' : '#fff', color: showCustom ? '#fff' : '#64748B', cursor: 'pointer' }}>Custom range</button>
              {showCustom && (
                <>
                  <input type="date" value={pendingStart} onChange={(e) => { setPendingStart(e.target.value); document.getElementById('bookingsEndDateInput')?.focus(); }} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12 }} />
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>to</span>
                  <input id="bookingsEndDateInput" type="date" value={pendingEnd} onChange={(e) => setPendingEnd(e.target.value)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12 }} />
                  <button onClick={() => { if (pendingStart && pendingEnd) { setCustomStart(pendingStart); setCustomEnd(pendingEnd); setPage(1); } }} disabled={!pendingStart || !pendingEnd} style={{ border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, background: pendingStart && pendingEnd ? '#1447b8' : '#E2E8F0', color: pendingStart && pendingEnd ? '#fff' : '#94A3B8', cursor: pendingStart && pendingEnd ? 'pointer' : 'not-allowed' }}>Apply</button>
                </>
              )}
            </div>
            <button style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#334155', cursor: 'pointer' }}>Export CSV</button>
          </div>

          {/* The real status distribution in this window. This is the answer to
              "why is the dropdown empty?" — either there genuinely are none, or
              they're all landing in Unclassified because GRN never sent the
              field. Remove this box once the data is trusted. */}
          {diag?.statusBreakdown && (
            <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
              in this window: {Object.entries(diag.statusBreakdown).map(([k, v]) => `${k}=${v}`).join('  ')} · total={data?.totalAllStatuses ?? 0}
            </div>
          )}

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
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                    No bookings match this filter.
                    {data && data.totalAllStatuses === 0 && <div style={{ marginTop: 8, fontSize: 12 }}>The table is empty for this window — has the sync run yet?</div>}
                  </td></tr>
                ) : (
                  rows.map((r: any) => (
                    <tr key={r.bookingId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{r.bookingId}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.bookingDate ? new Date(r.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.hotelName}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.city || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ color: '#334155' }}>{r.roomType || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.boardBasis || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ color: '#334155' }}>{r.checkin ? new Date(r.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} → {r.checkout ? new Date(r.checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Cancel by {r.lastCancellationDate ? new Date(r.lastCancellationDate).toLocaleDateString() : '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{r.currency} {r.priceTotal?.toFixed(2) ?? '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12, verticalAlign: 'top' }}>{r.supplier || '—'}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <span title={`GRN sent: booking_status=${r.rawBookingStatus ?? 'null'}, non_refundable=${String(r.rawNonRefundable)}`} style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: r.status === 'Refundable' ? '#FCD34D' : r.status === 'Cancelled' ? '#FEE2E2' : r.status === 'Unknown' ? '#FEF3C7' : '#E2E8F0',
                          color: r.status === 'Refundable' ? '#78350F' : r.status === 'Cancelled' ? '#B91C1C' : r.status === 'Unknown' ? '#92400E' : '#475569',
                        }}>{r.status === 'Unknown' ? 'Unclassified' : r.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {loading ? 'Loading…' : `Showing ${rows.length} of ${data?.total ?? 0} matching bookings`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: page === 1 ? '#CBD5E1' : '#334155', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={loading || !hasMore} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: !hasMore ? '#E2E8F0' : '#1447b8', color: !hasMore ? '#94A3B8' : '#fff', cursor: !hasMore ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}
