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
function num(n: number | null | undefined) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}
function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RebookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [counts, setCounts] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');   // all | successful | errors
  const [saving, setSaving] = useState('any');    // any | 0-50 | 50-100 | 100-500 | 500+

  function load(reset = true) {
    setLoading(true);
    setError(null);
    const p = reset ? 1 : page;
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'all') params.set('status', status);
    if (saving !== 'any') params.set('saving', saving);
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/rebookings?${params.toString()}&_t=${Date.now()}`)
      .then((r: Response) => r.json())
      .then((d: any) => {
        if (d.error) { setError(d.error); return; }
        setStats(d.stats || null);
        setCounts(d.counts || null);
        setRows(d.rows || []);
        setTotal(d.total || 0);
        setHasMore(Boolean(d.hasMore));
        if (reset) setPage(1);
      })
      .catch((e: any) => setError('Could not load rebookings: ' + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [status, saving]);

  const cards = [
    { label: 'Total saved', value: usd(stats?.totalSavedUsd), accent: GREEN },
    { label: 'Successful', value: num(counts?.successful), accent: BLUE },
    { label: 'Errors', value: num(counts?.errors), accent: RED },
    { label: 'Avg saving', value: usd(stats?.avgSavingUsd), accent: NAVY },
    { label: 'Conversion', value: stats?.conversionPct != null ? Math.round(stats.conversionPct) + '%' : '—', accent: GOLD },
  ];

  return (
    <BusinessSidebarWrapper>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: BG, minHeight: '100vh', padding: '28px 32px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          .rb-in { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; font-family:inherit; color:${NAVY}; background:#fff; outline:none; }
          .rb-in:focus { border-color:${BLUE}; }
          .rb-btn { border:1px solid ${LINE}; border-radius:11px; padding:9px 14px; font-size:13.5px; background:#fff; color:${NAVY}; cursor:pointer; }
          .rb-btn:hover { border-color:${BLUE}; }
        `}} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 26, color: NAVY, margin: 0 }}>Rebookings</h1>
          <span style={{ color: SLATE, fontSize: 13 }}>{num(total)} total</span>
        </div>
        <p style={{ color: SLATE, fontSize: 13.5, margin: '0 0 20px' }}>Every rebooking attempt, the savings captured, and any that need review.</p>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ color: SLATE, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 26, color: NAVY }}>{c.value}</div>
              <div style={{ height: 3, background: c.accent, borderRadius: 3, marginTop: 10, opacity: 0.85 }} />
            </div>
          ))}
        </div>

        {/* filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input className="rb-in" placeholder="Search hotel, city, booking ID…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(true); }}
            style={{ minWidth: 260, flex: '1 1 260px' }} />
          <select className="rb-in" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="successful">Successful</option>
            <option value="errors">Errors / review</option>
          </select>
          <select className="rb-in" value={saving} onChange={(e) => setSaving(e.target.value)}>
            <option value="any">Any saving</option>
            <option value="0-50">Under $50</option>
            <option value="50-100">$50–$100</option>
            <option value="100-500">$100–$500</option>
            <option value="500+">Above $500</option>
          </select>
          <button className="rb-btn" onClick={() => load(true)}>Search</button>
        </div>

        {/* table */}
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 120px 110px 110px 110px 130px', gap: 0, padding: '12px 18px', borderBottom: `1px solid ${LINE}`, color: SLATE, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            <div>Hotel / Booking</div><div>Room</div><div>Original</div><div>Rebooked</div><div>Saved</div><div>Status</div>
          </div>

          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 120px 110px 110px 110px 130px', padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
                {[...Array(6)].map((__, j) => <div key={j} style={{ height: 14, background: '#EEF2F7', borderRadius: 6, marginRight: 12 }} />)}
              </div>
            ))
          ) : error ? (
            <div style={{ padding: 24, color: RED, fontSize: 14 }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 32, color: SLATE, fontSize: 14, textAlign: 'center' }}>No rebookings yet.</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 120px 110px 110px 110px 130px', padding: '14px 18px', borderBottom: `1px solid ${LINE}`, alignItems: 'center', fontSize: 13.5 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel || r.bookingId}</div>
                  <div style={{ color: SLATE, fontSize: 12, marginTop: 2 }}>{[r.city, r.bookingId].filter(Boolean).join(' · ')}</div>
                  <div style={{ color: SLATE, fontSize: 11.5, marginTop: 2 }}>{fmtDate(r.createdAt)}</div>
                </div>
                <div style={{ color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.room || '—'}</div>
                <div style={{ color: NAVY }}>{usd(r.originalUsd)}</div>
                <div style={{ color: NAVY }}>{usd(r.rebookedUsd)}</div>
                <div style={{ color: r.savedUsd > 0 ? GREEN : NAVY, fontWeight: 700 }}>{r.savedUsd != null ? '+' + usd(r.savedUsd) : '—'}</div>
                <div>
                  <StatusPill status={r.status} failureStage={r.failureStage} />
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="rb-btn" onClick={() => { setPage((p) => p + 1); setTimeout(() => load(false), 0); }}>Load more</button>
          </div>
        )}
      </div>
    </BusinessSidebarWrapper>
  );
}

function StatusPill({ status, failureStage }: { status: string; failureStage?: string }) {
  const s = (status || '').toLowerCase();
  let bg = '#EEF2F7', color = SLATE, label = status || '—';
  if (s === 'confirmed' || s === 'successful') { bg = '#E7F7ED'; color = GREEN; label = 'Confirmed'; }
  else if (s === 'needs_review' || s === 'awaiting_cancel') { bg = '#FEF3E2'; color = '#B45309'; label = 'Needs review'; }
  else if (s === 'error' || s === 'failed') { bg = '#FDEBEC'; color = RED; label = failureStage ? `Error: ${failureStage}` : 'Error'; }
  else if (s === 'pending' || s === 'searching' || s === 'booked') { bg = '#E8F1FE'; color = BLUE; label = 'In progress'; }
  return <span style={{ background: bg, color, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{label}</span>;
}
