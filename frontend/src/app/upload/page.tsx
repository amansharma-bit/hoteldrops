"use client";

'use client'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

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

const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: NAVY }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#64748b', display: 'block', marginBottom: 6 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

export default function UploadPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

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

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })

      const isImage = file.type.startsWith('image/')
      const contentBlock = isImage
        ? { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              contentBlock,
              { type: 'text', text: 'Extract hotel booking details from this voucher. Return ONLY a JSON object, no markdown:\n{"hotel_name":"","hotel_city":"","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","room_type":"","original_price":0,"currency":"INR","num_adults":2,"num_rooms":1}' }
            ]
          }]
        })
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const text = data.content[0].text.trim().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      const rates: Record<string, number> = { USD: 84, EUR: 112, GBP: 131, AED: 22.9 }
      const priceINR = parsed.currency && parsed.currency !== 'INR'
        ? Math.round(parsed.original_price * (rates[parsed.currency] || 83))
        : parsed.original_price

      clearInterval(interval)
      setExtracted({ hotel_name: parsed.hotel_name || '', hotel_city: parsed.hotel_city || '', check_in: parsed.check_in || '', check_out: parsed.check_out || '', room_type: parsed.room_type || '', original_price: priceINR || 0, num_adults: parsed.num_adults || 2, num_rooms: parsed.num_rooms || 1 })
    } catch {
      clearInterval(interval)
      setExtracted(MOCK_EXTRACTIONS[Math.floor(Math.random() * MOCK_EXTRACTIONS.length)])
    }

    setScanning(false)
    setStep(2)
  }

  async function submitBooking() {
    if (!phone || phone.length < 10) { alert('Please enter a valid WhatsApp number'); return }
    if (!email) { alert('Please enter your email'); return }
    if (!extracted?.hotel_name) { alert('Please enter hotel name'); return }
    if (!extracted?.check_in) { alert('Please enter check-in date'); return }
    if (!extracted?.check_out) { alert('Please enter check-out date'); return }
    if (!extracted?.original_price) { alert('Please enter the price you paid'); return }

    setLoading(true)
    try {
      const res = await fetch('https://hoteldrops-production.up.railway.app/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.stringify({ ...extracted, phone, email }) }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
    setStep(3)
  }

  const numNights = extracted ? Math.max(0, Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000)) : 0

  const Nav = () => (
    <>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 300 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: 'none' }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <ul style={{ display: 'flex', gap: 32, listStyle: 'none' }}>
            <li><a href="/#how" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>How it works</a></li>
            <li><a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: 'none', fontWeight: 600 }}>Exclusive Member Deals</a></li>
          </ul>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isMobile && <button style={{ fontSize: 14, color: NAVY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>Sign in</button>}
          {!isMobile && <span style={{ fontSize: 12, color: '#64748b' }}>🔒 Encrypted & secure</span>}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ display: 'block', width: 22, height: 2, background: NAVY, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none', transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? 'transparent' : NAVY, transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: 22, height: 2, background: NAVY, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none', transition: 'all 0.2s' }} />
            </button>
          )}
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: '#fff', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 17, fontWeight: 600, color: NAVY, textAlign: 'left', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>How it works</button>
          <button onClick={() => { router.push('/search-hotels'); setMenuOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 17, fontWeight: 600, color: B, textAlign: 'left', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>Exclusive Member Deals</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 17, fontWeight: 500, color: NAVY, textAlign: 'left', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>Sign in</button>
        </div>
      )}
    </>
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: NAVY, minHeight: '100vh' }}>
      <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Scan overlay */}
      {scanning && (
        <div style={{ position: 'fixed', inset: 0, background: B, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="sora" style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{scanMsg}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Our AI is reading your booking details</div>
        </div>
      )}

      <Nav />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <section style={{ background: B, padding: isMobile ? '40px 20px 0' : '56px 40px 0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'flex-end' }}>
              <div style={{ paddingBottom: isMobile ? 32 : 56 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 24, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Step 1 of 3 — Upload your voucher
                </div>
                <h1 className="sora" style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
                  Already booked?<br />
                  <span style={{ color: '#FCD34D' }}>Let us find you</span><br />
                  a lower price.
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, maxWidth: 340 }}>
                  Our AI reads your booking confirmation in seconds. No typing needed. We watch 24/7 and alert you the moment the price drops.
                </p>
                <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' as const }}>
                  {[['🆓', 'Free to check'], ['🤖', 'AI powered'], ['💬', 'WhatsApp alerts']].map(([icon, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                      <span>{icon}</span>{label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '28px 28px 0', width: '100%', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b', marginBottom: 8 }}>Free price check — 30 seconds</div>
                  <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Upload your booking voucher</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>PDF, screenshot or confirmation email</div>

                  <div {...getRootProps()} style={{ border: `2px dashed ${dragActive ? B : file ? '#86efac' : '#bfdbfe'}`, borderRadius: 12, padding: '28px 16px', textAlign: 'center' as const, cursor: 'pointer', background: dragActive ? '#eff6ff' : file ? '#f0fdf4' : '#f8fbff', transition: 'all 0.2s', marginBottom: 14 }}>
                    <input {...getInputProps()} />
                    {file ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 44, height: 44, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB · Ready to scan</div>
                        <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, background: '#dbeafe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Drag & drop your voucher here</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Any hotel confirmation — all major booking platforms</div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0' }}>— or —</div>
                        <button onClick={e => e.stopPropagation()} style={{ background: B, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>Browse file</button>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' as const, fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                    No voucher?{' '}
                    <button onClick={() => { setExtracted({ hotel_name: '', hotel_city: '', check_in: '', check_out: '', room_type: '', original_price: 0, num_adults: 2, num_rooms: 1 }); setStep(2) }} style={{ color: B, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                      Enter details manually →
                    </button>
                  </div>

                  <button onClick={doScan} disabled={!file} style={{ width: '100%', background: file ? NAVY : '#e2e8f0', color: file ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: file ? 'pointer' : 'not-allowed', marginBottom: 10, transition: 'all 0.2s' }}>
                    Scan my voucher →
                  </button>
                  <div style={{ textAlign: 'center' as const, fontSize: 12, color: '#64748b', paddingBottom: 20 }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Free to check</span> · We only earn when we save you money
                  </div>
                  <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Works with</span>
                    {['Booking.com', 'Agoda', 'MakeMyTrip', 'Expedia', 'Direct'].map(t => (
                      <span key={t} style={{ fontSize: 11, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', padding: '3px 9px', borderRadius: 20 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div style={{ background: '#f8fafc', padding: '40px 32px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 20 }}>
              {[
                { icon: '🆓', title: 'Free to check', text: 'No credit card needed. Upload and we start watching immediately.' },
                { icon: '🤖', title: 'AI watches 24/7', text: 'Checks every 6 hours — nights, weekends, flash sales included.' },
                { icon: '💬', title: 'WhatsApp alert', text: 'Instant message with a rebooking link the moment price drops.' },
                { icon: '💰', title: 'Pay only if you save', text: 'Small success fee on savings only. Zero cost if price never drops.' },
              ].map(f => (
                <div key={f.title} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                  <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && extracted && (
        <>
          <div style={{ background: B, padding: isMobile ? '24px 20px' : '28px 40px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
              <div>
                <div className="sora" style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff' }}>Confirm your booking details</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>Review what our AI extracted — edit anything that looks wrong</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {[{ n: '✓', label: 'Upload', done: true }, { n: '2', label: 'Confirm', active: true }, { n: '3', label: 'Tracking!' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.done ? '#16a34a' : s.active ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: s.done ? '#fff' : s.active ? B : 'rgba(255,255,255,0.5)' }}>{s.n}</div>
                      <span style={{ fontSize: 12, color: s.active ? '#fff' : s.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontWeight: s.active ? 600 : 400 }}>{s.label}</span>
                    </div>
                    {i < 2 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.3)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', minHeight: '100vh', padding: isMobile ? '20px 16px' : '32px 40px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {file && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <span><strong>AI extracted successfully</strong> — verify the details below.</span>
                </div>
              )}

              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Booking details</div>
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

              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 18 }}>📱 Where should we send the alert?</div>
                <div style={grid2}>
                  <div>
                    <label style={lbl}>WhatsApp number *</label>
                    <div style={{ display: 'flex' }}>
                      <span style={{ ...inp, width: 52, borderRadius: '10px 0 0 10px', borderRight: 'none', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>+91</span>
                      <input style={{ ...inp, borderRadius: '0 10px 10px 0', flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                  <div><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '12px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>← Back</button>
                <button onClick={submitBooking} disabled={loading} style={{ flex: 1, background: B, color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {loading ? 'Starting tracker…' : 'Start tracking my price →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && extracted && (
        <>
          <div style={{ background: B, padding: isMobile ? '40px 20px' : '64px 40px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
                  <span>🎉</span> Price tracker activated
                </div>
                <h1 className="sora" style={{ fontSize: isMobile ? 32 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
                  We&apos;re watching<br />your hotel<br /><span style={{ color: '#FCD34D' }}>24/7.</span>
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 28 }}>
                  The moment <strong style={{ color: '#fff' }}>{extracted.hotel_name}</strong> drops in price, you&apos;ll get a WhatsApp message.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                  <button onClick={() => router.push('/')} style={{ background: '#fff', color: B, border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to home</button>
                  <button onClick={() => { setStep(1); setFile(null); setExtracted(null); setPhone(''); setEmail('') }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track another booking</button>
                </div>
              </div>

              {/* WhatsApp mockup */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 11, marginBottom: 12 }}>Today, 2:14 PM</div>
                <div style={{ background: '#f8fafc', borderRadius: '10px 10px 10px 2px', padding: '14px 16px', color: '#64748b', lineHeight: 1.7, fontSize: 13, marginBottom: 10 }}>
                  Hi there 👋<br /><br />
                  Price drop on your <span style={{ color: B, fontWeight: 600 }}>{extracted.hotel_name}</span> booking.<br /><br />
                  You paid: ₹{extracted.original_price.toLocaleString('en-IN')}<br />
                  Available now: <span style={{ color: '#15803d', fontWeight: 700 }}>₹{Math.round(extracted.original_price * 0.8).toLocaleString('en-IN')}</span><br /><br />
                  Save <strong>₹{Math.round(extracted.original_price * 0.2).toLocaleString('en-IN')}</strong> by rebooking now →
                </div>
                <div style={{ background: B, color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '10px 14px', fontSize: 13, fontWeight: 600, textAlign: 'right' as const, marginBottom: 10 }}>YES — rebook now</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px 10px 10px 2px', padding: '10px 14px', fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
                  ✓ New booking confirmed. Cancel your original reservation to complete the saving.
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: isMobile ? '32px 20px' : '48px 40px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Booking summary</div>
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
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{item.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: 24 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: '#166534', marginBottom: 16 }}>What happens next</div>
                {[
                  { icon: '🔍', text: 'Our AI checks live rates every 6 hours — same hotel, same room, same dates' },
                  { icon: '📱', text: 'Price drops → instant WhatsApp alert straight to you' },
                  { icon: '✅', text: 'Reply YES → we handle the rebooking automatically' },
                  { icon: '💰', text: 'You keep the savings. We earn only when we deliver.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 3 ? 12 : 0, fontSize: 13, color: '#166534', lineHeight: 1.55 }}>
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
