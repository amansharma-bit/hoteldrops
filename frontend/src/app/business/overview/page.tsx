'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [real, setReal] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, realRes] = await Promise.all([
          authenticatedFetch(`${API_BASE}/api/live-search/dashboard-summary`),
          authenticatedFetch(`${API_BASE}/api/live-search/dashboard-real`),
        ]);
        const summaryData = await summaryRes.json();
        const realData = await realRes.json();
        setSummary(summaryData);
        setReal(realData);
      } catch (e: any) {
        setError('Could not load dashboard data: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const trend = summary?.dailyTrend || [];
  const maxCount = trend.length ? Math.max(...trend.map((t: [string, number]) => t[1])) : 1;

  return (
    <BusinessSidebarWrapper>
      <div style={{ height: '100vh', overflow: 'hidden', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", padding: '28px 36px', display: 'flex', flexDirection: 'column' }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Bookings overview</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              GRN · live data
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: loading ? '#F1F5F9' : error ? '#FEF2F2' : '#F0FDF4', color: loading ? '#64748B' : error ? '#DC2626' : '#16A34A', padding: '5px 12px', borderRadius: 20, border: `1px solid ${loading ? '#E2E8F0' : error ? '#FECACA' : '#BBF7D0'}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#94A3B8' : error ? '#DC2626' : '#16A34A' }} />
                {loading ? 'Loading' : error ? 'Error' : 'Connected'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4 }}>
            {['Today', 'WTD', 'MTD', 'YTD'].map((p, i) => (
              <button key={p} style={{ border: 'none', background: i === 0 ? '#1447b8' : 'transparent', color: i === 0 ? '#fff' : '#64748B', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#12379b 0%,#1447b8 55%,#2e5fe0 100%)', borderRadius: 16, padding: '24px 28px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Total bookings</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>{loading ? '—' : (real?.totalBookings ?? summary?.totalBookings ?? '—').toLocaleString?.() ?? real?.totalBookings ?? '—'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>across all suppliers · June 1 – July 13</div>
          </div>
          <StatCard label="Refundable" value={loading ? '—' : `${real?.refundablePctFromSample ?? '—'}%`} sub="of sampled bookings" />
          <StatCard label="Avg. booking value" value={loading ? '—' : `$${real?.avgValueFromSample ?? '—'}`} sub="USD, sample-based" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
          <StatCard label="Rebooked" value="10,129" sub="via Mize, 6mo" />
          <StatCard label="Conversion" value="6.72%" sub="profit-to-GMV" gold />
          <StatCard label="Business type" value="B2B" sub="primary channel" />
          <StatCard label="Top country" value={loading ? '—' : (real?.topCountries?.[0]?.country ?? '—')} sub={loading ? '' : `${real?.topCountries?.[0]?.pct ?? '—'}% of sample`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Booking volume trend</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, minHeight: 0, paddingTop: 8 }}>
              {loading ? (
                <div style={{ margin: 'auto', fontSize: 13, color: '#94A3B8' }}>Loading real trend data…</div>
              ) : trend.length === 0 ? (
                <div style={{ margin: 'auto', fontSize: 13, color: '#94A3B8' }}>No trend data available</div>
              ) : (
                trend.map(([day, count]: [string, number], i: number) => (
                  <div key={day} title={`${day}: ${count} bookings`} style={{ flex: 1, background: '#1447b8', borderRadius: '3px 3px 0 0', height: `${Math.max(4, (count / maxCount) * 100)}%` }} />
                ))
              )}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>Real daily counts from /dashboard-summary</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Top countries by volume</div>
            {loading ? (
              <div style={{ margin: 'auto', fontSize: 13, color: '#94A3B8' }}>Loading…</div>
            ) : (
              (real?.topCountries || []).map((c: any, i: number) => (
                <div key={c.country} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 44px', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{c.country}</span>
                  <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#1447b8', borderRadius: 4, opacity: 1 - i * 0.15, width: `${c.pct}%` }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#64748B', textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))
            )}
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 'auto', textAlign: 'center' }}>From dashboard-real, {real?.sampleSize ?? '—'}-booking live sample</div>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function StatCard({ label, value, sub, gold = false }: { label: string; value: string; sub: string; gold?: boolean }) {
  return (
    <div style={{ background: gold ? '#FCD34D' : '#fff', border: gold ? 'none' : '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: gold ? '#78350F' : '#94A3B8', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: gold ? '#78350F' : '#94A3B8', marginTop: 6, fontWeight: gold ? 600 : 400 }}>{sub}</div>
    </div>
  );
}
