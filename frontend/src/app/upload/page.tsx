"use client";

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

const B    = "#1447b8"
const NAVY = "#0f172a"

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

// ── All fields Claude now extracts ───────────────────────────────────────────
interface ExtractedData {
  hotel_name:            string
  hotel_city:            string
  check_in:              string
  check_out:             string
  total_nights:          number
  room_type:             string
  num_adults:            number
  num_children:          number
  children_ages:         (number | null)[]
  num_rooms:             number
  board_basis:           string
  board_basis_label:     string
  rate_plan_name:        string
  original_price:        number
  total_price_paid:      number
  price_per_night:       number
  currency_original:     string
  ota_name:              string
  booking_reference:     string
  cancellation_policy:   string
  cancellation_deadline: string
  cancellation_penalty:  number | null
  payment_type:          string  // 'pay_now' | 'pay_at_property' | 'partial_payment'
  amount_paid_upfront:   number  // 0 if pay at property
}

// ── Claude extraction prompt (full version matching backend) ─────────────────
const EXTRACTION_PROMPT = `You are a hotel booking voucher parser for rebuq, an Indian travel price-tracking service.

Extract ALL fields below from this hotel booking confirmation/voucher.
Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation.

PRICING RULES (critical — read carefully):
- "total_price_paid" = the FINAL amount customer actually pays — AFTER all discounts and savings
- If voucher shows "You saved X" or a crossed-out higher price, IGNORE that higher number completely
- The LOWER final amount = total_price_paid. Example: shows INR 24441 then INR 20519 → use 20519
- "original_price" = same as total_price_paid (never use the pre-discount or crossed-out price)
- If only one price shown, use it for both fields
- Convert non-INR: EUR=112, USD=84, GBP=107, AED=22.8, THB=2.3, SGD=62
- Always output prices in INR as plain numbers

CHILDREN AGE RULES:
- List each child's age: [4, 7]. If ages not stated: [null, null]. Empty [] if no children.

CANCELLATION RULES:
- "free" = fully refundable before deadline
- "partial" = some penalty even before deadline
- "non-refundable" = NO refund under ANY circumstance
- "unknown" = cannot determine
- cancellation_deadline = last free-cancel date YYYY-MM-DD, null if non-refundable
- cancellation_penalty = penalty in INR if cancelled after deadline, null if free

BOARD BASIS: RO=Room Only, BB=Bed & Breakfast, HB=Half Board, FB=Full Board, AI=All Inclusive

{
  "hotel_name": "exact hotel name",
  "hotel_city": "city only",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "total_nights": number,
  "room_type": "exact room type",
  "num_adults": number,
  "num_children": number,
  "children_ages": [],
  "num_rooms": number,
  "board_basis": "RO|BB|HB|FB|AI",
  "board_basis_label": "Room Only|Bed & Breakfast|Half Board|Full Board|All Inclusive",
  "rate_plan_name": "plan name or null",
  "original_price": number,
  "total_price_paid": number,
  "price_per_night": number,
  "currency_original": "INR|EUR|USD|AED|THB|GBP|SGD",
  "ota_name": "MakeMyTrip|Booking.com|Agoda|Goibibo|Hotels.com|Expedia|Direct|Other",
  "booking_reference": "PNR/ref number or null",
  "cancellation_policy": "free|partial|non-refundable|unknown",
  "cancellation_deadline": "YYYY-MM-DD or null",
  "cancellation_penalty": number or null
}`

const BOARD_OPTIONS = [
  { code: 'RO', label: 'Room Only' },
  { code: 'BB', label: 'Bed & Breakfast' },
  { code: 'HB', label: 'Half Board' },
  { code: 'FB', label: 'Full Board' },
  { code: 'AI', label: 'All Inclusive' },
]

const CANCEL_OPTIONS = [
  { code: 'free',           label: '✅ Free cancellation' },
  { code: 'partial',        label: '⚠️ Partial refund' },
  { code: 'non-refundable', label: '❌ Non-refundable' },
  { code: 'unknown',        label: '❓ Not sure' },
]

// ── Shared styles ────────────────────────────────────────────────────────────
const inp: React.CSSProperties  = { width: '100%', background: '#f9fafb', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: NAVY }
const lbl: React.CSSProperties  = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#64748b', display: 'block', marginBottom: 6 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

const emptyExtracted = (): ExtractedData => ({
  hotel_name: '', hotel_city: '', check_in: '', check_out: '', total_nights: 0,
  room_type: '', num_adults: 2, num_children: 0, children_ages: [], num_rooms: 1,
  board_basis: 'RO', board_basis_label: 'Room Only', rate_plan_name: '',
  original_price: 0, total_price_paid: 0, price_per_night: 0, currency_original: 'INR',
  ota_name: '', booking_reference: '',
  cancellation_policy: 'unknown', cancellation_deadline: '', cancellation_penalty: null,
  payment_type: 'pay_now', amount_paid_upfront: 0,
})

export default function UploadPage() {
  const router   = useRouter()
  const isMobile = useIsMobile()

  const [file,        setFile]        = useState<File | null>(null)
  const [dragActive,  setDragActive]  = useState(false)
  const [step,        setStep]        = useState<1 | 2 | 3 | 'blocked'>(1)
  const [scanning,    setScanning]    = useState(false)
  const [scanMsg,     setScanMsg]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [extracted,   setExtracted]   = useState<ExtractedData | null>(null)
  const [phone,       setPhone]       = useState('')
  const [email,       setEmail]       = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [submitError, setSubmitError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (f) { setFile(f); setDragActive(false) }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  // ── Scan voucher via Claude ──────────────────────────────────────────────
  async function doScan() {
    if (!file) return
    setScanning(true)
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…']
    let i = 0; setScanMsg(msgs[0])
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]) }, 900)

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })

      const contentBlock = file.type.startsWith('image/')
        ? { type: 'image',    source: { type: 'base64', media_type: file.type,          data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf',  data: base64 } }

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
          max_tokens: 1500,
          messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }] }]
        })
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const text = data.content[0].text.trim().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)

      // Currency conversion
      const RATES: Record<string, number> = { EUR: 112, USD: 84, GBP: 107, AED: 22.8, THB: 2.3, SGD: 62 }
      const rate = RATES[parsed.currency_original] || 1
      if (parsed.currency_original && parsed.currency_original !== 'INR' && rate !== 1) {
        if (parsed.original_price)        parsed.original_price        = Math.round(parsed.original_price        * rate)
        if (parsed.total_price_paid)      parsed.total_price_paid      = Math.round(parsed.total_price_paid      * rate)
        if (parsed.price_per_night)       parsed.price_per_night       = Math.round(parsed.price_per_night       * rate)
        if (parsed.cancellation_penalty)  parsed.cancellation_penalty  = Math.round(parsed.cancellation_penalty  * rate)
      }

      // Derive total_nights if missing
      if (!parsed.total_nights && parsed.check_in && parsed.check_out) {
        parsed.total_nights = Math.round((new Date(parsed.check_out).getTime() - new Date(parsed.check_in).getTime()) / 86400000)
      }

      // Ensure total_price_paid is always set
      if (!parsed.total_price_paid) parsed.total_price_paid = parsed.original_price || 0

      clearInterval(interval)
      setExtracted({ ...emptyExtracted(), ...parsed })

      // Non-refundable: go straight to blocked screen
      if (parsed.cancellation_policy === 'non-refundable') {
        setStep('blocked')
      } else {
        setStep(2)
      }

    } catch {
      clearInterval(interval)
      // Fallback: let user fill manually
      setExtracted(emptyExtracted())
      setStep(2)
    }
    setScanning(false)
  }

  // ── Submit booking ────────────────────────────────────────────────────────
  async function submitBooking() {
    setSubmitError('')
    if (!phone || phone.length < 10)     { setSubmitError('Please enter a valid 10-digit WhatsApp number'); return }
    if (!email)                           { setSubmitError('Please enter your email'); return }
    if (!extracted?.hotel_name)           { setSubmitError('Please enter the hotel name'); return }
    if (!extracted?.check_in)            { setSubmitError('Please enter check-in date'); return }
    if (!extracted?.check_out)           { setSubmitError('Please enter check-out date'); return }
    if (!extracted?.total_price_paid)    { setSubmitError('Please enter the total price you paid'); return }

    // Last gate: block non-refundable before hitting backend
    if (extracted?.cancellation_policy === 'non-refundable') {
      setStep('blocked')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('https://hoteldrops-production.up.railway.app/api/voucher/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extracted, phone, email }),
      })
      const json = await res.json()

      if (json.blocked && json.reason === 'non_refundable') {
        setStep('blocked')
        return
      }

      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to submit')
      setStep(3)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const numNights = extracted
    ? (extracted.total_nights || Math.max(0, Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000)))
    : 0

  // ── Nav ───────────────────────────────────────────────────────────────────
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
          <button onClick={() => { router.push('/search-hotels'); setMenuOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 17, fontWeight: 600, color: B, textAlign: 'left', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>Exclusive Member Deals</button>
        </div>
      )}
    </>
  )

  // ── Step header with progress ─────────────────────────────────────────────
  const StepHeader = ({ stepNum, title, subtitle }: { stepNum: string; title: string; subtitle: string }) => (
    <div style={{ background: B, padding: isMobile ? '24px 20px' : '28px 40px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
        <div>
          <div className="sora" style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[{ n: '✓', label: 'Upload', done: stepNum !== '1' }, { n: '2', label: 'Confirm', active: stepNum === '2' }, { n: '3', label: 'Tracking!', active: stepNum === '3' }].map((s, i) => (
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
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: NAVY, minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
        .cancel-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* Scanning overlay */}
      {scanning && (
        <div style={{ position: 'fixed', inset: 0, background: B, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="sora" style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{scanMsg}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Our AI is reading your booking details</div>
        </div>
      )}

      <Nav />

      {/* ════════════════════════════════════════════════════════
          STEP 1 — Upload
      ════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          <section style={{ background: B, padding: isMobile ? '40px 20px 0' : '56px 40px 0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'flex-end' }}>
              <div style={{ paddingBottom: isMobile ? 32 : 56 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 24, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Step 1 of 3 — Upload your voucher
                </div>
                <h1 className="sora" style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
                  Already booked?<br /><span style={{ color: '#FCD34D' }}>Let us find you</span><br />a lower price.
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
                    <input {...getInputProps()} id="voucher-file-input" />
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
                        <label htmlFor="voucher-file-input" style={{ background: B, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit', display: 'inline-block' }}>Browse file</label>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' as const, fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                    No voucher?{' '}
                    <button onClick={() => { setExtracted(emptyExtracted()); setStep(2) }} style={{ color: B, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
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
                { icon: '🆓', title: 'Free to check',    text: 'No credit card needed. Upload and we start watching immediately.' },
                { icon: '🤖', title: 'AI watches 24/7',  text: 'Checks every 6 hours — nights, weekends, flash sales included.' },
                { icon: '💬', title: 'WhatsApp alert',   text: 'Instant message with a rebooking link the moment price drops.' },
                { icon: '💰', title: 'Pay only if you save', text: 'Small success fee on savings only. Zero cost if price never drops.' },
              ].map(f => (
                <div key={f.title} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                  <div className="sora" style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{f.text}</div>
                </div>
              ))}
            </div>

            {/* ── Exclusive deals banner ─────────────────────────────── */}
            <div style={{ maxWidth: 1000, margin: '32px auto 0', background: 'linear-gradient(135deg, #0f172a 0%, #1447b8 100%)', borderRadius: 16, padding: isMobile ? '28px 20px' : '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Members only</div>
                <div className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Browse exclusive hotel deals</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>Pre-negotiated rates only available to rebuq members — up to 40% below OTA prices.</div>
              </div>
              <button onClick={() => router.push('/search-hotels')} style={{ background: '#FCD34D', color: NAVY, border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                Browse deals →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          BLOCKED — Non-refundable booking (rebuq blue theme)
      ════════════════════════════════════════════════════════ */}
      {step === 'blocked' && extracted && (
        <>
          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1447b8 100%)', padding: isMobile ? '48px 20px' : '72px 40px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' as const }}>
              <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 28px', border: '2px solid rgba(255,255,255,0.2)' }}>🔒</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 20, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Non-refundable booking detected
              </div>
              <h1 className="sora" style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
                We can&apos;t track this one —<br />
                <span style={{ color: '#FCD34D' }}>but here&apos;s what to do next</span>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
                rebuq works by finding a lower price and helping you rebook. With a non-refundable booking, even if the price drops, you can&apos;t cancel — so there&apos;s nothing to save.
              </p>
            </div>
          </div>

          {/* Booking card + advice */}
          <div style={{ background: '#f8fafc', padding: isMobile ? '32px 20px' : '48px 40px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>

              {/* Booking summary card */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: 24, marginBottom: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b', marginBottom: 16 }}>Your booking</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{extracted.hotel_name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { icon: '📍', label: 'City', value: extracted.hotel_city },
                    { icon: '📅', label: 'Dates', value: `${extracted.check_in} → ${extracted.check_out}` },
                    { icon: '🛏️', label: 'Room', value: extracted.room_type || 'Standard Room' },
                    { icon: '🍽️', label: 'Meals', value: extracted.board_basis_label || 'Room Only' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {extracted.total_price_paid > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #0f172a, #1447b8)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>💳 Total paid</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#FCD34D' }}>₹{extracted.total_price_paid.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Tip card */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #bfdbfe', padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
                  <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Next time, book a flexible rate</div>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>
                  Flexible rates often cost only a little more upfront — but rebuq regularly finds drops that save <strong style={{ color: '#1447b8' }}>₹10,000–₹40,000</strong>. The savings far outweigh the small premium.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: '✅', text: 'Cancel anytime for free' },
                    { icon: '💰', text: 'rebuq can find price drops' },
                    { icon: '🔄', text: 'Rebook if price drops' },
                    { icon: '🎯', text: 'Avg saving: ₹24,000' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>{item.icon}</span>{item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Search deals CTA */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1447b8 100%)', borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center' as const }}>
                <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Browse exclusive member deals</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.6 }}>Pre-negotiated flexible rates — so rebuq can track them from day one.</div>
                <button onClick={() => router.push('/search-hotels')} style={{ background: '#FCD34D', color: '#0f172a', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Browse deals →
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => { setStep(1); setFile(null); setExtracted(null) }} style={{ flex: 1, background: B, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Track another booking
                </button>
                <button onClick={() => router.push('/')} style={{ background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Home
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 2 — Confirm details
      ════════════════════════════════════════════════════════ */}
      {step === 2 && extracted && (
        <>
          <StepHeader stepNum="2" title="Confirm your booking details" subtitle="Review what our AI extracted — edit anything that looks wrong" />

          <div style={{ background: '#f8fafc', minHeight: '100vh', padding: isMobile ? '20px 16px' : '32px 40px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>

              {file && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <span><strong>AI extracted successfully</strong> — verify the details below and correct anything that looks wrong.</span>
                </div>
              )}

              {/* Pay at property special banner */}
              {extracted.payment_type === 'pay_at_property' && (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1447b8', marginBottom: 4 }}>🏨 Pay at property booking — perfect for rebuq!</div>
                  <div style={{ fontSize: 12, color: '#3b82f6', lineHeight: 1.6 }}>
                    You haven&apos;t paid yet — you pay at the hotel. These bookings are almost always free to cancel, which means if we find a lower price, you can rebook instantly with zero hassle.
                  </div>
                </div>
              )}

              {/* ── Hotel details ─────────────────────────────────────── */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 18 }}>🏨 Hotel details</div>
                <div style={grid2}>
                  <div><label style={lbl}>Hotel name *</label><input style={inp} value={extracted.hotel_name} onChange={e => setExtracted({ ...extracted, hotel_name: e.target.value })} placeholder="e.g. Taj Dubai" /></div>
                  <div><label style={lbl}>City *</label><input style={inp} value={extracted.hotel_city} onChange={e => setExtracted({ ...extracted, hotel_city: e.target.value })} placeholder="e.g. Dubai" /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Check-in *</label><input style={inp} type="date" value={extracted.check_in} onChange={e => setExtracted({ ...extracted, check_in: e.target.value })} /></div>
                  <div><label style={lbl}>Check-out *</label><input style={inp} type="date" value={extracted.check_out} onChange={e => setExtracted({ ...extracted, check_out: e.target.value })} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Room type</label><input style={inp} value={extracted.room_type} onChange={e => setExtracted({ ...extracted, room_type: e.target.value })} placeholder="e.g. Deluxe King Room" /></div>
                  <div>
                    <label style={lbl}>Meal plan</label>
                    <select style={inp} value={extracted.board_basis} onChange={e => {
                      const opt = BOARD_OPTIONS.find(o => o.code === e.target.value)
                      setExtracted({ ...extracted, board_basis: e.target.value, board_basis_label: opt?.label || '' })
                    }}>
                      {BOARD_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Booked on</label>
                    <select style={inp} value={extracted.ota_name} onChange={e => setExtracted({ ...extracted, ota_name: e.target.value })}>
                      {['MakeMyTrip','Booking.com','Agoda','Goibibo','Hotels.com','Expedia','Direct','Other'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Booking reference</label><input style={inp} value={extracted.booking_reference} onChange={e => setExtracted({ ...extracted, booking_reference: e.target.value })} placeholder="PNR / confirmation no." /></div>
                </div>
              </div>

              {/* ── Pricing ───────────────────────────────────────────── */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 18 }}>💳 Pricing</div>
                <div style={grid2}>
                  <div>
                    <label style={lbl}>Total price paid (₹) *</label>
                    <input style={inp} type="number" value={extracted.total_price_paid || ''} onChange={e => setExtracted({ ...extracted, total_price_paid: parseFloat(e.target.value), original_price: parseFloat(e.target.value) })} placeholder="e.g. 85000" />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>All rooms · all nights · incl. taxes</div>
                  </div>
                  <div>
                    <label style={lbl}>Price per night (₹)</label>
                    <input style={inp} type="number" value={extracted.price_per_night || ''} onChange={e => setExtracted({ ...extracted, price_per_night: parseFloat(e.target.value) })} placeholder="Auto-calculated" />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Per room per night</div>
                  </div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Adults</label><select style={inp} value={extracted.num_adults} onChange={e => setExtracted({ ...extracted, num_adults: parseInt(e.target.value) })}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select></div>
                  <div><label style={lbl}>Rooms</label><select style={inp} value={extracted.num_rooms} onChange={e => setExtracted({ ...extracted, num_rooms: parseInt(e.target.value) })}>{[1,2,3,4].map(n => <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>)}</select></div>
                </div>
                <div style={grid2}>
                  <div>
                    <label style={lbl}>Children</label>
                    <select style={inp} value={extracted.num_children} onChange={e => {
                      const n = parseInt(e.target.value)
                      setExtracted({ ...extracted, num_children: n, children_ages: Array(n).fill(null) })
                    }}>
                      {[0,1,2,3,4].map(n => <option key={n} value={n}>{n === 0 ? 'No children' : `${n} child${n > 1 ? 'ren' : ''}`}</option>)}
                    </select>
                  </div>
                  {extracted.num_children > 0 && (
                    <div>
                      <label style={lbl}>Children ages</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {Array.from({ length: extracted.num_children }).map((_, i) => (
                          <input key={i} style={{ ...inp, width: 60 }} type="number" min={0} max={17} placeholder="Age" value={extracted.children_ages[i] ?? ''} onChange={e => {
                            const ages = [...extracted.children_ages]
                            ages[i] = e.target.value ? parseInt(e.target.value) : null
                            setExtracted({ ...extracted, children_ages: ages })
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Age of each child at check-in</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Cancellation policy ───────────────────────────────── */}
              <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${extracted.cancellation_policy === 'non-refundable' ? '#fecaca' : '#e2e8f0'}`, padding: 24, marginBottom: 16 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>🔒 Cancellation policy</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>This is critical — we can only track refundable bookings.</div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                  {CANCEL_OPTIONS.map(o => (
                    <button key={o.code} onClick={() => setExtracted({ ...extracted, cancellation_policy: o.code })} style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#ef4444' : B) : '#e2e8f0'}`, background: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#fef2f2' : '#eff6ff') : '#fff', color: extracted.cancellation_policy === o.code ? (o.code === 'non-refundable' ? '#dc2626' : B) : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' as const, transition: 'all 0.15s' }}>
                      {o.label}
                    </button>
                  ))}
                </div>

                {/* Non-refundable warning inline */}
                {extracted.cancellation_policy === 'non-refundable' && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>⚠️ rebuq cannot track non-refundable bookings</div>
                    <div style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.6 }}>
                      Even if the price drops, you would not be able to cancel and rebook. Please change to a refundable rate next time — or if you selected this by mistake, change above.
                    </div>
                  </div>
                )}

                {/* Free cancellation deadline */}
                {(extracted.cancellation_policy === 'free' || extracted.cancellation_policy === 'partial') && (
                  <div style={grid2}>
                    <div>
                      <label style={lbl}>Free cancel deadline</label>
                      <input style={inp} type="date" value={extracted.cancellation_deadline} onChange={e => setExtracted({ ...extracted, cancellation_deadline: e.target.value })} />
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Last date to cancel for free</div>
                    </div>
                    <div>
                      <label style={lbl}>Penalty if cancelled late (₹)</label>
                      <input style={inp} type="number" value={extracted.cancellation_penalty ?? ''} onChange={e => setExtracted({ ...extracted, cancellation_penalty: e.target.value ? parseFloat(e.target.value) : null })} placeholder="e.g. 5000 or leave blank" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── WhatsApp / email ──────────────────────────────────── */}
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

              {submitError && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cancel-btn" onClick={() => setStep(1)} style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '12px 20px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s' }}>← Back</button>
                <button onClick={submitBooking} disabled={loading || extracted.cancellation_policy === 'non-refundable'} style={{ flex: 1, background: extracted.cancellation_policy === 'non-refundable' ? '#e2e8f0' : B, color: extracted.cancellation_policy === 'non-refundable' ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: extracted.cancellation_policy === 'non-refundable' ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {loading ? 'Starting tracker…' : extracted.cancellation_policy === 'non-refundable' ? 'Cannot track non-refundable bookings' : 'Start tracking my price →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 3 — Success / Tracking started
      ════════════════════════════════════════════════════════ */}
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
                  The moment <strong style={{ color: '#fff' }}>{extracted.hotel_name}</strong> drops in price for the <strong style={{ color: '#fff' }}>same room and meal plan</strong>, you&apos;ll get a WhatsApp message instantly.
                </p>
                {extracted.cancellation_deadline && (
                  <div style={{ background: 'rgba(252,211,77,0.15)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#FCD34D', fontWeight: 600 }}>
                    ⚠️ Remember: Free cancel until {new Date(extracted.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                  <button onClick={() => router.push('/')} style={{ background: '#fff', color: B, border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to home</button>
                  <button onClick={() => { setStep(1); setFile(null); setExtracted(null); setPhone(''); setEmail('') }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track another booking</button>
                </div>
              </div>

              {/* WhatsApp mockup — now shows meal plan + cancellation */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 11, marginBottom: 12 }}>Today, 2:14 PM</div>
                <div style={{ background: '#f8fafc', borderRadius: '10px 10px 10px 2px', padding: '14px 16px', color: '#64748b', lineHeight: 1.7, fontSize: 13, marginBottom: 10 }}>
                  💰 <strong>Price Drop — rebuq</strong><br /><br />
                  <strong style={{ color: NAVY }}>{extracted.hotel_name}</strong><br />
                  🛏️ {extracted.room_type || 'Standard Room'}<br />
                  {extracted.board_basis_label && <>🍽️ {extracted.board_basis_label}<br /></>}
                  <br />
                  You paid: ₹{(extracted.total_price_paid || extracted.original_price).toLocaleString('en-IN')}<br />
                  New price: <span style={{ color: '#15803d', fontWeight: 700 }}>₹{Math.round((extracted.total_price_paid || extracted.original_price) * 0.82).toLocaleString('en-IN')}</span><br />
                  💚 Save: <strong>₹{Math.round((extracted.total_price_paid || extracted.original_price) * 0.18).toLocaleString('en-IN')}</strong><br /><br />
                  {extracted.cancellation_deadline && <><em style={{ fontSize: 12 }}>⚠️ Free cancel until {new Date(extracted.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</em><br /></>}
                  <em style={{ fontSize: 12 }}>Same room · same meals · like-for-like</em>
                </div>
                <div style={{ background: B, color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '10px 14px', fontSize: 13, fontWeight: 600, textAlign: 'right' as const, marginBottom: 10 }}>YES — rebook now</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px 10px 10px 2px', padding: '10px 14px', fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
                  ✓ Rebooking confirmed. Cancel your original reservation to complete the saving.
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: isMobile ? '32px 20px' : '48px 40px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              {/* Booking summary — now shows all new fields */}
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
                <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Booking summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { l: 'Hotel',       v: extracted.hotel_name },
                    { l: 'City',        v: extracted.hotel_city },
                    { l: 'Check-in',    v: extracted.check_in },
                    { l: 'Check-out',   v: extracted.check_out },
                    { l: 'Duration',    v: `${numNights} nights` },
                    { l: 'Room',        v: extracted.room_type || '—' },
                    { l: 'Meals',       v: extracted.board_basis_label || '—' },
                    { l: 'Total paid',  v: `₹${(extracted.total_price_paid || extracted.original_price).toLocaleString('en-IN')}` },
                    { l: 'Per night',   v: extracted.price_per_night ? `₹${extracted.price_per_night.toLocaleString('en-IN')}` : '—' },
                    { l: 'Booked on',   v: extracted.ota_name || '—' },
                    ...(extracted.booking_reference ? [{ l: 'Ref no.', v: extracted.booking_reference }] : []),
                    ...(extracted.cancellation_deadline ? [{ l: 'Free cancel by', v: new Date(extracted.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
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
                  { icon: '🔍', text: 'Our AI checks live rates every 6 hours — same hotel, same room, same meal plan' },
                  { icon: '📱', text: 'Price drops → instant WhatsApp alert straight to your phone' },
                  { icon: '✅', text: 'Reply YES → we send you a secure rebooking link' },
                  { icon: '💰', text: 'You keep the savings. We earn only when we deliver.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 3 ? 12 : 0, fontSize: 13, color: '#166534', lineHeight: 1.55 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.text}
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
