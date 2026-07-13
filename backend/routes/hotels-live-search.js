'use client';

import { useState } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function LiveSearchPage() {
  const [hotelCode, setHotelCode] = useState('1848138');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [childrenAges, setChildrenAges] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [nationality, setNationality] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  async function handleSearch() {
    setError(null);
    setResults(null);
    if (!hotelCode || !checkin || !checkout) {
      setError('Please fill in hotel code, check-in, and check-out dates.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/live-search/live-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_code: hotelCode, checkin, checkout, adults, nationality,
          children_ages: childrenAges ? childrenAges.split(',').map((a) => a.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed.');
      } else {
        setResults(data);
      }
    } catch (e: any) {
      setError('Could not reach the search service. ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BusinessSidebarWrapper>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
            Live Price Checker
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time search against GRN's live hotel inventory.</p>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '14px' }}>●</span>
            <p className="text-sm" style={{ color: '#166534' }}>
              Connected to GRN's live Search &amp; Availability API — confirmed working with real data.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <p className="font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Search Parameters
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Hotel Code
                </label>
                <input
                  value={hotelCode}
                  onChange={(e) => setHotelCode(e.target.value)}
                  placeholder="e.g. 1848138"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Adults
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Children Ages
                </label>
                <input
                  value={childrenAges}
                  onChange={(e) => setChildrenAges(e.target.value)}
                  placeholder="e.g. 8, 12"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Original Price Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 95.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Client Nationality
                </label>
                <input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value.toUpperCase())}
                  placeholder="e.g. US, IN, AE"
                  maxLength={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: loading ? '#94A3B8' : '#1447b8' }}
            >
              {loading ? 'Searching live inventory…' : 'Search Live Rates'}
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Note: currently requires a known GRN hotel code, not a city/hotel name search — that lookup is a
              planned next step.
            </p>
          </div>

          {error && (
            <div className="rounded-xl p-4 mb-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                Results
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {results.raw_hotel_count} hotel(s) found · search_id: {results.search_id}
              </p>
              {results.hotels && results.hotels.length > 0 ? (
                results.hotels.map((h: any, i: number) => (
                  <div key={i} className="border-b border-slate-100 py-4 last:border-b-0">
                    <p className="font-semibold text-navy" style={{ color: '#0F172A' }}>{h.name}</p>
                    <p className="text-sm text-slate-500">{h.address}</p>
                    {h.description && (
                      <p className="text-xs text-slate-400 mt-1">{h.description}...</p>
                    )}
                    {h.price && originalPrice && !isNaN(parseFloat(originalPrice)) && (() => {
                      const orig = parseFloat(originalPrice);
                      const diff = orig - h.price;
                      const pct = (diff / orig) * 100;
                      const hasSaving = diff > 0.01;
                      return (
                        <div
                          className="mt-2 rounded-lg px-3 py-2 text-sm font-semibold"
                          style={hasSaving
                            ? { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }
                            : { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                        >
                          {hasSaving
                            ? `✓ Saving found: ${h.currency} ${diff.toFixed(2)} (${pct.toFixed(1)}% cheaper than originally paid)`
                            : `No saving — live price is ${diff < -0.01 ? 'higher' : 'the same as'} the original (${h.currency} ${orig.toFixed(2)} paid vs. ${h.currency} ${h.price} now)`}
                        </div>
                      );
                    })()}
                    {h.price && (
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-lg" style={{ color: '#1447b8' }}>
                          {h.currency} {h.price}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={h.non_refundable
                            ? { background: '#FEF2F2', color: '#DC2626' }
                            : { background: '#F0FDF4', color: '#16A34A' }}
                        >
                          {h.non_refundable ? 'Non-refundable' : 'Refundable'}
                        </span>
                        {h.cancel_by_date && !h.non_refundable && (
                          <span className="text-xs text-slate-400">
                            Free cancellation until {new Date(h.cancel_by_date).toLocaleDateString()}
                          </span>
                        )}
                        {h.board_basis && (
                          <span className="text-xs text-slate-500">· {h.board_basis}</span>
                        )}
                        {h.hotel_code && (
                          <span className="text-xs text-slate-400">· Hotel ID: {h.hotel_code}</span>
                        )}
                      </div>
                    )}
                    {h.rooms && h.rooms.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {h.rooms.map((r: any, ri: number) => (
                          <div key={ri} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                            <div>{r.name} — {r.adults} adult{r.adults !== 1 ? 's' : ''}{r.children ? `, ${r.children} child(ren)` : ''}</div>
                            {r.room_reference && (
                              <div className="text-slate-400 font-mono" style={{ fontSize: '10px' }}>Room ID: {r.room_reference}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No availability found for these dates.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}
