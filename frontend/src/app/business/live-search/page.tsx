'use client';

import { useState } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function LiveSearchPage() {
  const [hotelCode, setHotelCode] = useState('1848138');
  const [hotelName, setHotelName] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [childrenAges, setChildrenAges] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomType, setRoomType] = useState('');
  const [boardBasis, setBoardBasis] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [refundable, setRefundable] = useState('Yes');
  const [lastCancelDate, setLastCancelDate] = useState('');
  const [panRequired, setPanRequired] = useState('No');
  const [nationality, setNationality] = useState('US');
  const [originalPrice, setOriginalPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleSearch() {
    setError(null);
    setResult(null);
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
      } else if (data.hotels && data.hotels.length > 0) {
        setResult(data.hotels[0]);
      } else {
        setError('No availability found for these dates.');
      }
    } catch (e: any) {
      setError('Could not reach the search service. ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const originalRow: [string, string | number][] = [
    ['Hotel ID', hotelCode],
    ['Hotel Name', hotelName || '—'],
    ['Check In', checkin || '—'],
    ['Check Out', checkout || '—'],
    ['Adults', adults],
    ['Children w/ Age', childrenAges || '—'],
    ['Room Code', roomCode || '—'],
    ['Room Type', roomType || '—'],
    ['Board Basis', boardBasis || '—'],
    ['Board Code', boardCode || '—'],
    ['Refundable', refundable],
    ['Last Cancellation Date', lastCancelDate || '—'],
    ['PAN Required', panRequired],
    ['Nationality', nationality],
  ];

  const newRow: [string, string | number][] = result ? [
    ['Hotel ID', result.hotel_id],
    ['Hotel Name', result.hotel_name],
    ['Check In', result.checkin],
    ['Check Out', result.checkout],
    ['Adults', result.rooms?.[0]?.adults ?? '—'],
    ['Children w/ Age', result.rooms?.[0]?.children ? `${result.rooms[0].children} (age not confirmed by GRN)` : '0'],
    ['Room Code', result.rooms?.[0]?.room_code || '—'],
    ['Room Type', result.rooms?.[0]?.room_type || '—'],
    ['Board Basis', result.board_basis || '—'],
    ['Board Code', '(use your static lookup)'],
    ['Refundable', result.refundable ? 'Yes' : 'No'],
    ['Last Cancellation Date', result.last_cancellation_date ? new Date(result.last_cancellation_date).toLocaleDateString() : '—'],
    ['PAN Required', result.pan_required === null ? 'Not confirmed' : result.pan_required ? 'Yes' : 'No'],
    ['Nationality', result.nationality || '—'],
  ] : [];

  const savingsInfo = (() => {
    if (!result || !result.price || !originalPrice || isNaN(parseFloat(originalPrice))) return null;
    const orig = parseFloat(originalPrice);
    const diff = orig - result.price;
    const pct = (diff / orig) * 100;
    return { diff, pct, hasSaving: diff > 0.01 };
  })();

  return (
    <BusinessSidebarWrapper>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
            Live Price Checker
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manually compare an original booking against live GRN rates.</p>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <p className="font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Original Booking Details</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Hotel ID" value={hotelCode} onChange={setHotelCode} />
              <Field label="Hotel Name" value={hotelName} onChange={setHotelName} />
              <Field label="Check In" value={checkin} onChange={setCheckin} type="date" />
              <Field label="Check Out" value={checkout} onChange={setCheckout} type="date" />
              <Field label="Adults" value={String(adults)} onChange={(v) => setAdults(parseInt(v, 10) || 1)} type="number" />
              <Field label="Children w/ Age" value={childrenAges} onChange={setChildrenAges} placeholder="e.g. 8, 12" />
              <Field label="Room Code" value={roomCode} onChange={setRoomCode} />
              <Field label="Room Type" value={roomType} onChange={setRoomType} />
              <Field label="Board Basis" value={boardBasis} onChange={setBoardBasis} />
              <Field label="Board Code" value={boardCode} onChange={setBoardCode} placeholder="from your static data" />
              <SelectField label="Refundable" value={refundable} onChange={setRefundable} options={['Yes', 'No']} />
              <Field label="Last Cancellation Date" value={lastCancelDate} onChange={setLastCancelDate} type="date" />
              <SelectField label="PAN Required" value={panRequired} onChange={setPanRequired} options={['Yes', 'No']} />
              <Field label="Nationality" value={nationality} onChange={(v) => setNationality(v.toUpperCase())} />
              <Field label="Original Price Paid" value={originalPrice} onChange={setOriginalPrice} type="number" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="mt-5 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: loading ? '#94A3B8' : '#1447b8' }}
            >
              {loading ? 'Searching live inventory…' : 'Search Live Rates'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl p-4 mb-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {result && (
            <>
              {savingsInfo && (
                <div
                  className="rounded-xl p-4 mb-6 text-center font-bold"
                  style={savingsInfo.hasSaving
                    ? { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }
                    : { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  {savingsInfo.hasSaving
                    ? `✓ Saving found: ${result.currency} ${savingsInfo.diff.toFixed(2)} (${savingsInfo.pct.toFixed(1)}% cheaper)`
                    : `No saving — live price is ${savingsInfo.diff < -0.01 ? 'higher' : 'the same'}`}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Comparison</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase text-slate-400">
                      <td className="pb-2 border-b border-slate-200">Field</td>
                      <td className="pb-2 border-b border-slate-200">Original (Booking)</td>
                      <td className="pb-2 border-b border-slate-200">New (Live Search)</td>
                    </tr>
                  </thead>
                  <tbody>
                    {originalRow.map(([label, origVal], i) => (
                      <tr key={label}>
                        <td className="py-2 border-b border-slate-100 font-semibold text-slate-500">{label}</td>
                        <td className="py-2 border-b border-slate-100">{String(origVal)}</td>
                        <td className="py-2 border-b border-slate-100 font-mono">{String(newRow[i]?.[1] ?? '—')}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 font-semibold text-slate-500">Price</td>
                      <td className="py-2 font-mono">{originalPrice ? `$${originalPrice}` : '—'}</td>
                      <td className="py-2 font-mono font-bold" style={{ color: '#1447b8' }}>
                        {result.price ? `${result.currency} ${result.price}` : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
      >
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}
