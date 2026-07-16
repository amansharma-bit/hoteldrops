'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';
const B = '#1447b8';
const NAVY = '#0f172a';

const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: NAVY };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', display: 'block', marginBottom: 6 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };

function Row({ icon, label, value, sub, highlight }: { icon: string; label: string; value: string; sub?: string; highlight?: boolean }) {
  const icons: Record<string, React.ReactElement> = {
    tag: <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3.24L3 3v6.59a2 2 0 00.59 1.41l9.58 9.58a2 2 0 002.83 0l4.59-4.58a2 2 0 000-2.83z"/>,
    hotel: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    guests: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    room: <><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/></>,
    board: <><path d="M3 3h18v18H3z"/><path d="M3 9h18"/></>,
    check: <><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    price: <><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5S10.3 12 12 12s3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/></>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={highlight ? '#B8860B' : B} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>{icons[icon]}</svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>{label}</div>
        <div style={{ fontSize: 13, color: highlight ? '#B8860B' : NAVY, fontWeight: highlight ? 700 : 500 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#64748b' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function LiveSearchPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>([]);
  const [roomType, setRoomType] = useState('');
  const [boardBasis, setBoardBasis] = useState('');
  const [refundable, setRefundable] = useState('Yes');
  const [lastCancelDate, setLastCancelDate] = useState('');
  const [nationality, setNationality] = useState('US');
  const [originalPrice, setOriginalPrice] = useState('');
  const [otaName, setOtaName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [panRequired, setPanRequired] = useState('No');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [roomMatchFound, setRoomMatchFound] = useState<boolean | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1,
  });

  async function doScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const formData = new FormData();
      formData.append('voucher', file);
      const res = await authenticatedFetch(`${API_BASE}/api/voucher/extract`, { method: 'POST', body: formData });
      const json = await res.json();
      clearInterval(interval);
      setScanning(false);

      if (!json.success || !json.data) {
        setError(json.message || 'Could not read this voucher. Please enter details manually.');
        setStep(2);
        return;
      }
      const d = json.data;
      setHotelCode('');
      setHotelName(d.hotel_name || '');
      setHotelCity(d.hotel_city || '');
      setCheckin(d.check_in || '');
      setCheckout(d.check_out || '');
      setAdults(d.num_adults || 2);
      setNumChildren(d.num_children || 0);
      setChildrenAges(d.children_ages || []);
      setRoomType(d.room_type || '');
      setBoardBasis(d.board_basis_label || d.board_basis || '');
      setRefundable(d.cancellation_policy === 'non-refundable' ? 'No' : 'Yes');
      setLastCancelDate(d.cancellation_deadline || '');
      setOriginalPrice(d.total_price_paid ? String(d.total_price_paid) : '');
      setOtaName(d.ota_name || '');
      setStep(2);
    } catch (e: any) {
      clearInterval(interval);
      setScanning(false);
      setError('Could not reach the server: ' + e.message);
      setStep(2);
    }
  }

  async function handleSearch() {
    setSearchError(null);
    setResult(null);
    setRoomMatchFound(null);
    const ages = childrenAges.filter((a) => a !== null).map(String);
    const useDirectSearch = !!hotelCode;

    if (useDirectSearch ? (!checkin || !checkout) : (!hotelName || !hotelCity || !checkin || !checkout)) {
      setSearchError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const url = useDirectSearch ? `${API_BASE}/api/live-search/live-search` : `${API_BASE}/api/live-search/resolve-and-search`;
      const body = useDirectSearch
        ? { hotel_code: hotelCode, checkin, checkout, adults, nationality, children_ages: ages }
        : { hotel_name: hotelName, hotel_city: hotelCity, check_in: checkin, check_out: checkout, num_adults: adults, nationality, children_ages: ages, room_type: roomType, board_basis: boardBasis };

      const res = await authenticatedFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || 'Search failed.');
      } else if (useDirectSearch) {
        if (data.hotels?.length > 0) setResult(data.hotels[0]);
        else setSearchError('No availability found for these dates.');
      } else {
        if (!data.resolved) setSearchError(data.message || data.reason || 'Could not match this hotel automatically.');
        else if (!data.searchSuccess) setSearchError(data.message || 'Hotel matched, but no live availability found.');
        else {
          setResult(data.result);
          setRoomMatchFound(data.roomMatchFound ?? null);
          setHotelCode(data.matched_hotel_code || '');
        }
      }
    } catch (e: any) {
      setSearchError('Could not reach the search service: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const savingsInfo = (() => {
    if (!result?.price || !originalPrice || isNaN(parseFloat(originalPrice))) return null;
    const orig = parseFloat(originalPrice);
    const diff = orig - result.price;
    const pct = (diff / orig) * 100;
    return { diff, pct, hasSaving: diff > 0.01 };
  })();

  return (
    <BusinessSidebarWrapper>
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

        {scanning && (
          <div style={{ position: 'fixed', inset: 0, background: B, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>{scanMsg}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Our AI is reading your booking details</div>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '24px 32px' }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: NAVY }}>Live Price Checker</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Upload a voucher and instantly compare against live GRN rates.</p>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {[{ n: step === 2 ? '✓' : '1', label: 'Upload', done: step === 2 }, { n: '2', label: 'Confirm & Search', active: step === 2 }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#16a34a' : s.active ? B : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: s.done || s.active ? '#fff' : '#94a3b8' }}>{s.n}</div>
                  <span style={{ fontSize: 12, color: s.done ? '#16a34a' : s.active ? B : '#94a3b8', fontWeight: s.active || s.done ? 600 : 400 }}>{s.label}</span>
                </div>
                {i < 1 && <div style={{ width: 24, height: 1, background: '#e2e8f0' }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <div {...getRootProps()} style={{ border: `2px dashed ${file ? '#86efac' : '#bfdbfe'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? '#f0fdf4' : '#f8fbff', marginBottom: 16 }}>
                <input {...getInputProps()} ref={fileInputRef} />
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{file.name}</div>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: '#dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div><div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Drag & drop a voucher</div><div style={{ fontSize: 13, color: '#64748b' }}>PDF, screenshot or email</div></div>
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} style={{ background: B, color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Browse file</button>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                No voucher?{' '}
                <button onClick={() => setStep(2)} style={{ color: B, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Enter details manually →</button>
              </div>
              <button onClick={doScan} disabled={!file} style={{ width: '100%', background: file ? NAVY : '#e2e8f0', color: file ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed' }}>
                {file ? 'Continue →' : 'Upload a file to continue'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              {error && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>
              )}

              {hotelName && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 6, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.5px' }}>Spotted.</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Review the details, then search live GRN rates.</div>
                  <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {otaName === 'GRNConnect' && (
                      <Row icon="tag" label="Hotel ID" value={hotelCode || '(will be resolved)'} />
                    )}
                    <Row icon="hotel" label="Hotel Name" value={hotelName || '—'} sub={hotelCity} />
                    <Row icon="calendar" label="Dates" value={`${checkin} → ${checkout}`} />
                    <Row icon="guests" label="Guests" value={`${adults} adult${adults > 1 ? 's' : ''}${numChildren > 0 ? ` · ${numChildren} child${numChildren > 1 ? 'ren' : ''}${childrenAges.filter(a=>a!==null).length ? ' (' + childrenAges.filter(a=>a!==null).join(', ') + ')' : ''}` : ''}`} />
                    <Row icon="room" label="Room" value={`${roomType || '—'}${roomCode ? ` · Code: ${roomCode}` : ''}`} />
                    <Row icon="board" label="Board Basis" value={`${boardBasis || '—'}${boardCode ? ` · Code: ${boardCode}` : ''}`} />
                    <Row icon="check" label="Refundable" value={refundable} />
                    <Row icon="calendar" label="Last Cancellation Date" value={lastCancelDate || '—'} />
                    <Row icon="doc" label="PAN Required" value={panRequired} />
                    <Row icon="flag" label="Nationality" value={nationality} />
                    {originalPrice && <Row icon="price" label="Original Price Paid" value={originalPrice} highlight />}
                    <button onClick={() => setEditMode(!editMode)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: B, textAlign: 'left', padding: 0, fontWeight: 600, marginTop: 2 }}>
                      {editMode ? '✕ Close edit' : 'Something wrong? Edit details'}
                    </button>
                  </div>
                </div>
              )}

              {(editMode || !hotelName) && (
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>Booking details</div>
                  <div><label style={lbl}>Hotel ID (optional)</label><input style={inp} value={hotelCode} onChange={(e) => setHotelCode(e.target.value)} placeholder="leave blank if from voucher" /></div>
                  <div><label style={lbl}>Hotel name</label><input style={inp} value={hotelName} onChange={(e) => setHotelName(e.target.value)} /></div>
                  <div><label style={lbl}>City</label><input style={inp} value={hotelCity} onChange={(e) => setHotelCity(e.target.value)} /></div>
                  <div style={grid2}>
                    <div><label style={lbl}>Check-in</label><input style={inp} type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
                    <div><label style={lbl}>Check-out</label><input style={inp} type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Adults</label><select style={inp} value={adults} onChange={(e) => setAdults(parseInt(e.target.value, 10))}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select></div>
                    <div><label style={lbl}>Children</label><select style={inp} value={numChildren} onChange={(e) => { const n = parseInt(e.target.value, 10); const ages = [...childrenAges]; while (ages.length < n) ages.push(null); setNumChildren(n); setChildrenAges(ages.slice(0, n)); }}>{[0,1,2,3,4].map((n) => <option key={n} value={n}>{n === 0 ? 'No children' : `${n} child${n > 1 ? 'ren' : ''}`}</option>)}</select></div>
                  </div>
                  {numChildren > 0 && (
                    <div>
                      <label style={lbl}>Child ages</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Array.from({ length: numChildren }, (_, i) => (
                          <select key={i} style={{ ...inp, width: 100 }} value={childrenAges[i] ?? ''} onChange={(e) => { const ages = [...childrenAges]; ages[i] = e.target.value === '' ? null : parseInt(e.target.value, 10); setChildrenAges(ages); }}>
                            <option value="">Age</option>
                            {Array.from({ length: 17 }, (_, a) => a + 1).map((a) => <option key={a} value={a}>{a} yrs</option>)}
                          </select>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={grid2}>
                    <div><label style={lbl}>Room type</label><input style={inp} value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="e.g. Deluxe Twin" /></div>
                    <div><label style={lbl}>Room code</label><input style={inp} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="from your static data" /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Board basis</label><input style={inp} value={boardBasis} onChange={(e) => setBoardBasis(e.target.value)} placeholder="e.g. Room Only" /></div>
                    <div><label style={lbl}>Board code</label><input style={inp} value={boardCode} onChange={(e) => setBoardCode(e.target.value)} placeholder="from your static data" /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Refundable</label><select style={inp} value={refundable} onChange={(e) => setRefundable(e.target.value)}><option>Yes</option><option>No</option></select></div>
                    <div><label style={lbl}>PAN required</label><select style={inp} value={panRequired} onChange={(e) => setPanRequired(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Nationality</label><input style={inp} value={nationality} onChange={(e) => setNationality(e.target.value.toUpperCase())} maxLength={2} /></div>
                    <div><label style={lbl}>Original price paid</label><input style={inp} type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g. 95.00" /></div>
                  </div>
                  {otaName === 'GRNConnect' && (
                    <div><label style={lbl}>Hotel ID</label><input style={inp} value={hotelCode} onChange={(e) => setHotelCode(e.target.value)} placeholder="GRN hotel code" /></div>
                  )}
                </div>
              )}

              {searchError && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{searchError}</div>
              )}

              <button onClick={handleSearch} disabled={loading} style={{ width: '100%', background: loading ? '#94a3b8' : B, color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 10 }}>
                {loading ? 'Searching live inventory…' : '🔍 Search Live Rates'}
              </button>
              <button onClick={() => { setStep(1); setFile(null); setResult(null); setError(null); setSearchError(null); setHotelName(''); }} style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>← Start over</button>

              {result && (
                <div style={{ marginTop: 24 }}>
                  {roomMatchFound === false && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12, color: '#b8860b' }}>
                      ⚠ Showing the cheapest available room — no exact match for the original room type / board basis.
                    </div>
                  )}
                  {savingsInfo && (
                    <div style={{ borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center', fontWeight: 700, background: savingsInfo.hasSaving ? '#f0fdf4' : '#fef2f2', color: savingsInfo.hasSaving ? '#16a34a' : '#dc2626', border: `1px solid ${savingsInfo.hasSaving ? '#bbf7d0' : '#fecaca'}` }}>
                      {savingsInfo.hasSaving
                        ? `✓ Saving found: ${result.currency} ${savingsInfo.diff.toFixed(2)} (${savingsInfo.pct.toFixed(1)}% cheaper)`
                        : 'No saving — live price is the same or higher'}
                    </div>
                  )}
                  <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>Live GRN Result</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{result.hotel_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{result.checkin} → {result.checkout}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: B, fontFamily: "'Sora',sans-serif" }}>{result.currency} {result.price}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: result.refundable ? '#f0fdf4' : '#fef2f2', color: result.refundable ? '#16a34a' : '#dc2626' }}>{result.refundable ? 'Refundable' : 'Non-refundable'}</span>
                      {result.board_basis && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>{result.board_basis}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}
