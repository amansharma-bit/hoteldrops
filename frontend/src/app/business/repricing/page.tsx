'use client';

import { useState } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const BLUE = '#4589f0';
const NAVY = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE = '#E7ECF3';
const BG = '#F6F8FB';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';

// ---- STATIC MOCK DATA — placeholder to align on layout. Real GRN price
// checks get wired in once we agree the data points. ------------------------
const MOCK = [
  { id: 'GRN-202607-2657607', hotel: 'Moonrise Hotel St. Louis', city: 'St. Louis (MO), US', room: 'Superior King Room', board: 'Room only', checkin: '2026-08-21', checkout: '2026-08-22', deadlineDays: 31, origLocal: 175.11, origCur: 'USD', origUsd: 175, supplier: 'expedia_rapid_pkg', state: 'drop', liveUsd: 148, checkedAt: '2 min ago' },
  { id: 'GRN-202607-2657599', hotel: 'Delle Rose', city: 'Cascia, IT', room: 'Standard Triple Room', board: 'Bed and Breakfast', checkin: '2026-08-08', checkout: '2026-08-09', deadlineDays: 19, origLocal: 106.94, origCur: 'EUR', origUsd: 122, supplier: 'expedia_rapid_pkg', state: 'nodrop', liveUsd: 122, checkedAt: '5 min ago' },
  { id: 'GRN-202607-2657584', hotel: 'Bavarian Inn Lodge', city: 'Frankenmuth (MI), US', room: 'Deluxe 2 Queen Room', board: 'Room only', checkin: '2026-08-24', checkout: '2026-08-27', deadlineDays: 33, origLocal: 491.00, origCur: 'USD', origUsd: 491, supplier: 'expedia_rapid_pkg', state: 'unchecked', liveUsd: null, checkedAt: null },
  { id: 'GRN-202607-2657512', hotel: 'Hampton Inn & Suites Miami Airport South', city: 'Miami (FL), US', room: 'Standard King Room', board: 'Bed and Breakfast', checkin: '2026-08-27', checkout: '2026-08-28', deadlineDays: 3, origLocal: 100.58, origCur: 'USD', origUsd: 101, supplier: 'expedia_rapid_pkg', state: 'drop', liveUsd: 84, checkedAt: 'just now' },
  { id: 'GRN-202607-2657510', hotel: 'Red Roof Inn Corpus Christi South', city: 'Corpus Christi (TX), US', room: 'Standard Room', board: 'Room only', checkin: '2026-08-15', checkout: '2026-08-16', deadlineDays: 1, origLocal: 56.38, origCur: 'USD', origUsd: 56, supplier: 'expedia_rapid_pkg', state: 'unchecked', liveUsd: null, checkedAt: null },
];

function fmtDate(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function money(amount: number | null, cur: string) {
  if (amount == null) return '—';
  return `${cur} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RepricingPage() {
  const [rows, setRows] = useState(MOCK);
  const [checking, setChecking] = useState<string | null>(null);

  // Simulate a price check on the mock data (real GRN call wired later)
  function checkPrice(id: string) {
    setChecking(id);
    setTimeout(() => {
      setRows((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        const dropped = Math.random() > 0.5;
        const live = dropped ? Math.round(r.origUsd * (0.82 + Math.random() * 0.1)) : r.origUsd;
        return { ...r, state: dropped ? 'drop' : 'nodrop', liveUsd: live, checkedAt: 'just now' };
      }));
      setChecking(null);
    }, 1200);
  }

  const summary = {
    total: rows.length,
    checked: rows.filter((r) => r.state !== 'unchecked').length,
    drops: rows.filter((r) => r.state === 'drop').length,
    savingUsd: rows.filter((r) => r.state === 'drop').reduce((s, r) => s + (r.origUsd - (r.liveUsd ?? r.origUsd)), 0),
  };

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ padding: '26px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 23, fontWeight: 800, color: NAVY, margin: 0 }}>Repricing</h1>
            <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>Check a booking's live price against what was paid — and catch the drop before the window closes.</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: AMBER, background: '#FEF3C7', padding: '5px 12px', borderRadius: 20 }}>Sample data</span>
        </div>

        {/* Summary strip */}
        <div style={{ padding: '20px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Stat label="Rebookable" value={String(summary.total)} sub="in this view" accent={NAVY} />
          <Stat label="Checked" value={`${summary.checked} / ${summary.total}`} sub="prices pulled" accent={BLUE} />
          <Stat label="Drops found" value={String(summary.drops)} sub="cheaper now" accent={GREEN} />
          <Stat label="Potential saving" value={`$${summary.savingUsd.toLocaleString()}`} sub="across drops" accent={GREEN} money />
        </div>

        {/* Table */}
        <div style={{ padding: '20px 32px 40px' }}>
          <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 96px 120px 120px 130px 120px', gap: 16, padding: '13px 20px', borderBottom: `0.5px solid ${LINE}`, background: '#FBFCFE' }}>
              {['Booking', 'Rebook by', 'Original', 'Live price', 'Gap', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED, textAlign: i === 2 || i === 3 || i === 4 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {rows.map((r) => {
              const isChecking = checking === r.id;
              const gap = r.liveUsd != null ? r.origUsd - r.liveUsd : null;
              const gapPct = gap != null && r.origUsd ? Math.round((gap / r.origUsd) * 100) : null;
              const deadlineColor = r.deadlineDays <= 3 ? RED : r.deadlineDays <= 7 ? AMBER : SLATE;
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 96px 120px 120px 130px 120px', gap: 16, padding: '15px 20px', alignItems: 'center', borderBottom: `0.5px solid ${LINE}` }}>
                  {/* Booking */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.hotel}</div>
                    <div style={{ fontSize: 12, color: SLATE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.city} · {r.room} · {fmtDate(r.checkin)}→{fmtDate(r.checkout)}</div>
                  </div>
                  {/* Rebook by */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deadlineColor }}>{r.deadlineDays}d</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>left</div>
                  </div>
                  {/* Original */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: NAVY }}>${r.origUsd.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginTop: 1 }}>{money(r.origLocal, r.origCur)}</div>
                  </div>
                  {/* Live price */}
                  <div style={{ textAlign: 'right' }}>
                    {r.state === 'unchecked' ? (
                      <span style={{ fontSize: 13, color: MUTED }}>—</span>
                    ) : (
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: r.state === 'drop' ? GREEN : NAVY }}>${r.liveUsd?.toLocaleString()}</div>
                    )}
                    {r.checkedAt && <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{r.checkedAt}</div>}
                  </div>
                  {/* Gap */}
                  <div style={{ textAlign: 'right' }}>
                    {r.state === 'drop' && gap != null ? (
                      <>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: GREEN }}>−${gap.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: GREEN, marginTop: 1 }}>{gapPct}% cheaper</div>
                      </>
                    ) : r.state === 'nodrop' ? (
                      <span style={{ fontSize: 12, color: MUTED }}>No drop</span>
                    ) : (
                      <span style={{ fontSize: 12, color: MUTED }}>—</span>
                    )}
                  </div>
                  {/* Action */}
                  <div style={{ textAlign: 'right' }}>
                    {r.state === 'drop' ? (
                      <button style={{ border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, background: GREEN, color: '#fff', cursor: 'pointer' }}>Rebook</button>
                    ) : (
                      <button onClick={() => checkPrice(r.id)} disabled={isChecking} style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, background: '#fff', color: isChecking ? MUTED : NAVY, cursor: isChecking ? 'wait' : 'pointer' }}>{isChecking ? 'Checking…' : r.state === 'nodrop' ? 'Re-check' : 'Check price'}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>Every price check is logged and feeds the conversion story in Rebookings.</p>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Stat({ label, value, sub, accent, money }: any) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: SLATE }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: money ? GREEN : NAVY, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, color: SLATE, marginTop: 3 }}>{sub}</div>
    </div>
  );
}
