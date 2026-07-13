'use client';

import { useState } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function LiveSearchPage() {
  const [hotelCode, setHotelCode] = useState('1848138');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
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
        body: JSON.stringify({ hotel_code: hotelCode, checkin, checkout, adults }),
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
                    {h.rooms && h.rooms.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {h.rooms.map((r: any, ri: number) => (
                          <div key={ri} className="text-xs text-slate-600 flex justify-between bg-slate-50 rounded px-2 py-1">
                            <span>{r.name || 'Room'} {r.board_basis ? `— ${r.board_basis}` : ''}</span>
                            <span className="font-mono font-semibold">
                              {r.price ? `${r.currency || ''} ${r.price}` : 'Rate on request'}
                            </span>
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
