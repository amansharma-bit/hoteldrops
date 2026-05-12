'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

interface ExtractedData {
  hotel_name: string
  hotel_city: string
  check_in: string
  check_out: string
  room_type: string
  original_price: number
  num_adults: number
  num_rooms: number
}

const MOCK_EXTRACTIONS: ExtractedData[] = [
  { hotel_name: 'Taj Jumeirah Lakes Towers', hotel_city: 'Dubai', check_in: '2026-12-14', check_out: '2026-12-18', room_type: 'Deluxe King Room', original_price: 112000, num_adults: 2, num_rooms: 1 },
  { hotel_name: 'Park Hyatt Bangkok', hotel_city: 'Bangkok', check_in: '2027-01-03', check_out: '2027-01-07', room_type: 'Park King Room', original_price: 158000, num_adults: 2, num_rooms: 1 },
  { hotel_name: 'W Bali Seminyak', hotel_city: 'Bali', check_in: '2027-02-08', check_out: '2027-02-12', room_type: 'Wonderful Room', original_price: 91000, num_adults: 2, num_rooms: 1 },
]

const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827' }
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#9ca3af', display: 'block', marginBottom: 6 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (f) { setFile(f); setDragActive(false) }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function doScan() {
    if (!file) return
    setScanning(true)
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Almost done…']
    let i = 0
    setScanMsg(msgs[0])
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]) }, 900)
    await new Promise(r => setTimeout(r, 3600))
    clearInterval(interval)
    setExtracted(MOCK_EXTRACTIONS[Math.floor(Math.random() * MOCK_EXTRACTIONS.length)])
    setScanning(false)
    setStep(2)
  }

  async function submitBooking() {
    if (!phone || phone.length < 10) { alert('Please enter a valid WhatsApp number'); return }
    if (!email) { alert('Please enter your email'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setStep(3)
  }

  const numNights = extracted ? Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000) : 0

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff', color: '#0a0a0f', minHeight: '100vh' }}>

      {scanning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#1447b8', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{scanMsg}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Our AI is extracting your booking details</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <nav style={{ background: '#1447b8', padding: '0 40px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
          rebuq<span style={{ color: '#FCD34D' }}>.</span>
        </a>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>🔒 Encrypted &amp; secure</div>
      </nav>

      {step === 1 && (
        <>
          <section style={{ background: '#1447b8', padding: '40px 40px 0' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'flex-end' }}>
              <div style={{ paddingBottom: 48 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Step 1 of 3 — Upload your voucher
                </div>
                <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 16 }}>
                  <span style={{ fontSize: 38, display: 'block', color: 'rgba(255,255,255,0.35)' }}>Let&apos;s find you</span>
                  <span style={{ fontSize: 38, display: 'block', color: 'rgba(255,255,255,0.35)' }}>a lower price.</span>
                  <span style={{ fontSize: 42, display: 'block', color: '#FCD34D' }}>Upload &amp; we&apos;ll scan.</span>
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: 340 }}>
                  Our AI reads your booking confirmation in seconds. No typing needed.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 28px 0', width: '100%' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#9ca3af', marginBottom: 8 }}>Free price check — 30 seconds</div>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Upload your booking voucher</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>PDF, screenshot or confirmation email</div>
                  <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? '#1447b8' : file ? '#86efac' : '#BFDBFE'}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: dragActive ? '#EFF6FF' : file ? '#f0fdf4' : '#F8FBFF', transition: 'all 0.2s', marginBottom: 12 }}>
                    <input {...getInputProps()} />
                    {file ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 42, height: 42, background: '#dcfce7', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✓</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{(file.size / 1024).toFixed(0)} KB · Ready to scan</div>
                        <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 42, height: 42, background: '#DBEAFE', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>Drag &amp; drop your voucher here</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Any hotel confirmation — all major booking platforms</div>
                        <div style={{ fontSize: 11, color: '#d1d5db', margin: '6px 0' }}>— or —</div>
                        <button onClick={e => e.stopPropagation()} style={{ background: '#1447b8', color: '#fff', fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>Browse file</button>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                    No voucher?{' '}
                    <button onClick={() => { setExtracted({ hotel_name: '', hotel_city: '', check_in: '', check_out: '', room_type: '', original_price: 0, num_adults: 2, num_rooms: 1 }); setStep(2) }} style={{ color: '#1447b8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      Enter manually →
                    </button>
                  </div>
                  <button onClick={doScan} disabled={!file} style={{ width: '100%', background: file ? '#111827' : '#e5e7eb', color: file ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: file ? 'pointer' : 'not-allowed', marginBottom: 10, transition: 'all 0.2s' }}>
                    Scan my voucher →
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', paddingBottom: 18 }}>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>Free to check</span> · We only earn when we save you money
                  </div>
                  <div style={{ background: '#f9fafb', borderTop: '1px solid #f0f0f5', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Works with</span>
                    {['All major OTAs', 'Direct bookings', 'Any PDF voucher'].map(t => (
                      <span key={t} style={{ fontSize: 10, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', padding: '3px 9px', borderRadius: 20 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div style={{ background: '#fff', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Already have an account? <a href="#" style={{ color: '#1447b8', fontWeight: 600 }}>Sign in →</a></div>
          </div>
        </>
      )}

      {step === 2 && extracted && (
        <>
          <div style={{ background: '#1447b8', padding: '28px 40px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Confirm your booking details</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Review what our AI extracted — edit anything that looks wrong</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {[{ n: 1, label: 'Upload', done: true }, { n: 2, label: 'Confirm', active: true }, { n: 3, label: 'Tracking!' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.done ? '#16a34a' : s.active ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: s.done ? '#fff' : s.active ? '#1447b8' : 'rgba(255,255,255,0.5)' }}>{s.done ? '✓' : s.n}</div>
                      <span style={{ fontSize: 12, color: s.active ? '#fff' : s.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontWeight: s.active ? 600 : 400 }}>{s.label}</span>
                    </div>
                    {i < 2 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#f7f9fc', minHeight: '100vh', padding: '32px 40px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {file && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#166534' }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <span><strong>AI extracted successfully</strong> — we found your booking. Please verify the details below.</span>
                </div>
              )}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', padding: 28, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: 18 }}>Booking details</div>
                <div style={grid2}>
                  <div><label style={lbl}>Hotel name *</label><input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Taj Dubai" /></div>
                  <div><label style={lbl}>City *</label><input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
                  <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Room type</label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King" /></div>
                  <div><label style={lbl}>Total price paid (₹) *</label><input style={inp} type="number" value={extracted.original_price || ''} onChange={e => setExtracted({ ...extracted, original_price: parseFloat(e.target.value) })} placeholder="e.g. 85000" /></div>
                </div>
                <div style={{ ...grid2, marginBottom: 0 }}>
                  <div><label style={lbl}>Adults</label><select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                  <div><label style={lbl}>Rooms</label><select style={inp} value={extracted.num_rooms} onChange={e => setExtracted({ ...extracted, num_rooms: parseInt(e.target.value) })}>{[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f5', padding: 28, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: 18 }}>📱 Where should we send the alert?</div>
                <div style={grid2}>
                  <div>
                    <label style={lbl}>WhatsApp number *</label>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...inp, width: 52, borderRadius: '8px 0 0 8px', borderRight: 'none', background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>+91</span>
                      <input style={{ ...inp, borderRadius: '0 8px 8px 0', flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                  <div><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid #e5e7eb', color: '#6b7280', padding: '12px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                <button onClick={submitBooking} disabled={loading} style={{ flex: 1, background: '#1447b8', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: 'pointer' }}>
                  {loading ? 'Starting tracker…' : 'Start tracking my price →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 3 && extracted && (
        <>
          <div style={{ background: '#1447b8', padding: '56px 40px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
                  <span style={{ fontSize: 14 }}>🎉</span> Price tracker activated
                </div>
                <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12 }}>
                  We&apos;re watching<br />your hotel<br /><span style={{ color: '#FCD34D' }}>24/7.</span>
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 28 }}>
                  The moment <strong style={{ color: '#fff' }}>{extracted.hotel_name}</strong> drops in price, you&apos;ll get a WhatsApp message. One tap to save.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => router.push('/')} style={{ background: '#fff', color: '#1447b8', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", cursor: 'pointer' }}>← Back to home</button>
                  <button onClick={() => { setStep(1); setFile(null); setExtracted(null); setPhone(''); setEmail('') }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track another booking</button>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center', color: '#c8d3de', fontSize: 10, marginBottom: 10 }}>Today, 2:14 PM</div>
                <div style={{ background: '#f7f9fc', borderRadius: '10px 10px 10px 2px', padding: '12px 14px', color: '#4a5568', lineHeight: 1.7, marginBottom: 8 }}>
                  Hi there 👋<br /><br />
                  Price drop on your <span style={{ color: '#1447b8', fontWeight: 600 }}>{extracted.hotel_name}</span> booking.<br /><br />
                  You paid: ₹{extracted.original_price.toLocaleString('en-IN')}<br />
                  Available now: <span style={{ color: '#15803d', fontWeight: 700 }}>₹{Math.round(extracted.original_price * 0.8).toLocaleString('en-IN')}</span><br /><br />
                  Save <strong>₹{Math.round(extracted.original_price * 0.2).toLocaleString('en-IN')}</strong> by rebooking now →
                </div>
                <div style={{ background: '#1447b8', color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '10px 14px', fontSize: 12, fontWeight: 600, textAlign: 'right', marginBottom: 8 }}>YES — rebook now</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px 10px 10px 2px', padding: '10px 14px', fontSize: 11, color: '#15803d', lineHeight: 1.6 }}>
                  ✓ New booking confirmed. Please cancel your original reservation to complete the saving.
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', padding: '48px 40px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div style={{ border: '1.5px solid #f0f0f5', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9ca3af', marginBottom: 16 }}>Booking summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { l: 'Hotel', v: extracted.hotel_name },
                    { l: 'City', v: extracted.hotel_city },
                    { l: 'Check-in', v: extracted.check_in },
                    { l: 'Check-out', v: extracted.check_out },
                    { l: 'Duration', v: `${numNights} nights` },
                    { l: 'Price paid', v: `₹${extracted.original_price.toLocaleString('en-IN')}` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{item.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 14 }}>What happens next:</div>
                {[
                  { icon: '🔍', text: 'Our AI checks live rates every 6 hours — same hotel, same room, same dates' },
                  { icon: '📱', text: 'Price drops → instant WhatsApp alert straight to you' },
                  { icon: '✅', text: 'Reply YES → we handle the rebooking automatically' },
                  { icon: '💰', text: 'You keep the savings. We earn only when we deliver.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 3 ? 12 : 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
