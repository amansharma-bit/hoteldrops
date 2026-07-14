'use client';

import { useState, useRef } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

export default function LiveSearchPage() {
  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [roomMatchFound, setRoomMatchFound] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleVoucherUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    setResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('voucher', file);
      const res = await fetch(`${API_BASE}/api/voucher/extract`, { method: 'POST', body: formData });
      const parsed = await res.json();

      if (!parsed.success || !parsed.data) {
        setError(parsed.message || 'Could not read this voucher. Please enter details manually.');
        return;
      }
      const d = parsed.data;
      setHotelCode('');
      setHotelName(d.hotel_name || '');
      setHotelCity(d.hotel_city || '');
      setCheckin(d.check_in || '');
      setCheckout(d.check_out || '');
      setAdults(d.num_adults || 2);
      setChildrenAges((d.children_ages || []).join(', '));
      setRoomType(d.room_type || '');
      setBoardBasis(d.board_basis_label || d.board_basis || '');
      setRefundable(d.cancellation_policy === 'non-refundable' ? 'No' : 'Yes');
      setLastCancelDate(d.cancellation_deadline || '');
      setOriginalPrice(d.total_price_paid ? String(d.total_price_paid) : '');
      setNotice('Voucher read successfully — please review the details below before searching.');
    } catch (e: any) {
      setError('Voucher upload failed: ' + e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSearch() {
    setError(null);
    setResult(null);
    setRoomMatchFound(null);

    const ages = childrenAges ? childrenAges.split(',').map((a) => a.trim()).filter(Boolean) : [];

    // If we have a hotel_code already (manual entry), search directly.
    // Otherwise (came from a voucher — name + city, no code yet), resolve first.
    const useDirectSearch = !!hotelCode;

    if (useDirectSearch) {
      if (!checkin || !checkout) {
        setError('Please fill in check-in and check-out dates.');
        return;
      }
    } else {
      if (!hotelName || !hotelCity || !checkin || !checkout) {
        setError('Please fill in hotel name, city, check-in, and check-out dates.');
        return;
      }
    }

    setLoading(true);
    try {
      const url = useDirectSearch
        ? `${API_BASE}/api/live-search/live-search`
        : `${API_BASE}/api/live-search/resolve-and-search`;

      const body = useDirectSearch
        ? { hotel_code: hotelCode, checkin, checkout, adults, nationality, children_ages: ages }
        : { hotel_name: hotelName, hotel_city: hotelCity, check_in: checkin, check_out: checkout, num_adults: adults, nationality, children_ages: ages, room_type: roomType, board_basis: boardBasis };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Search failed.');
      } else if (useDirectSearch) {
        if (data.hotels && data.hotels.length > 0) {
          setResult(data.hotels[0]);
        } else {
          setError('No availability found for these dates.');
        }
      } else {
        if (!data.resolved) {
          setError(data.message || data.reason || 'Could not match this hotel automatically.');
        } else if (!data.searchSuccess) {
          setError(data.message || 'Hotel matched, but no live availability found.');
        } else {
          setResult(data.result);
          setRoomMatchFound(data.roomMatchFound ?? null);
          setHotelCode(data.matched_hotel_code || '');
        }
      }
    } catch (e: any) {
      setError('Could not reach the search service. ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const originalRow: [string, string | number][] = [
    ['Hotel ID', hotelCode || '(will be resolved)'],
    ['Hotel Name', hotelName || '—'],
    ['City', hotelCity || '—'],
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
    ['City', hotelCity || '—'],
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
        <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
              Live Price Checker
            </h1>
            <p className="text-sm text-slate-500 mt-1">Upload a voucher or enter details manually to compare against live GRN rates.</p>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleVoucherUpload} className="hidden" id="voucher-upload" />
            <label
              htmlFor="voucher-upload"
              className="cursor-pointer px-5 py-2.5 rounded-lg text-sm font-semibold text-white inline-block"
              style={{ background: uploading ? '#94A3B8' : '#16A34A' }}
            >
              {uploading ? 'Reading voucher…' : '📄 Upload Voucher'}
            </label>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8">
          {notice && (
            <div className="rounded-xl p-4 mb-6" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-sm" style={{ color: '#166534' }}>✓ {notice}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <p className="font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Original Booking Details</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Hotel ID (optional)" value={hotelCode} onChange={setHotelCode} placeholder="leave blank if from voucher" />
              <Field label="Hotel Name" value={hotelName} onChange={setHotelName} />
              <Field label="City" value={hotelCity} onChange={setHotelCity} />
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
            {!hotelCode && (
              <p className="text-xs text-slate-400 mt-2">No Hotel ID entered — will look it up automatically from the hotel name and city.</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl p-4 mb-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {result && (
            <>
              {roomMatchFound === false && (
                <div className="rounded-xl p-3 mb-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p className="text-xs" style={{ color: '#B8860B' }}>⚠ Showing the cheapest available room — an exact match for the original room type / board basis wasn't found for these dates.</p>
                </div>
              )}
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
                <p className="font-bold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>New — Live Search Results</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {newRow.map(([label, val]) => (
                    <ReadField key={label} label={label} value={String(val)} />
                  ))}
                  <ReadField label="Price" value={result.price ? `${result.currency} ${result.price}` : '—'} highlight />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function ReadField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <div
        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
        style={highlight
          ? { borderColor: '#1447b8', background: '#EEF2FF', color: '#1447b8', fontWeight: 700 }
          : { borderColor: '#E2E8F0', background: '#F8FAFC', color: '#334155' }}
      >
        {value}
      </div>
    </div>
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
