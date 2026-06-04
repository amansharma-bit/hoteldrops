"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = 'https://hoteldrops-production-7e5a.up.railway.app/api/voucher'
const B = '#1447b8'
const NAVY = '#0f172a'
const GREEN = '#16a34a'
const RED = '#dc2626'
const YELLOW = '#d97706'

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])
  return m
}

function fmt(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

function formatINR(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }

// ── Children ages picker ─────────────────────────────────────────────────────
function ChildrenPicker({ count, ages, onCountChange, onAgeChange }: {
  count: number, ages: number[], onCountChange: (n: number) => void, onAgeChange: (idx: number, age: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: count > 0 ? 12 : 0 }}>
        <span style={{ fontSize: 14, color: NAVY, fontWeight: 500 }}>Children (under 12)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => onCountChange(Math.max(0, count - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff', fontSize: 18, cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.3 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: NAVY, minWidth: 20, textAlign: 'center' as const }}>{count}</span>
          <button type="button" onClick={() => onCountChange(Math.min(8, count + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>
      {count > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 8 }}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Child {i + 1}</label>
              <select value={ages[i] ?? ''} onChange={e => onAgeChange(i, parseInt(e.target.value))}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: NAVY, cursor: 'pointer', outline: 'none' }}>
                <option value="">Age</option>
                <option value="0">Under 1</option>
                {Array.from({ length: 12 }, (_, j) => j + 1).map(a => <option key={a} value={a}>{a} yrs</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Field row ────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', editable = true }: {
  label: string, value: string, onChange?: (v: string) => void, type?: string, required?: boolean, placeholder?: string, editable?: boolean
}) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: RED }}> *</span>}
      </label>
      {editable ? (
        <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: NAVY, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }} />
      ) : (
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: value ? NAVY : '#94a3b8', fontWeight: value ? 500 : 400 }}>{value || '—'}</div>
      )}
    </div>
  )
}

// ── Warning / Alert box ──────────────────────────────────────────────────────
function AlertBox({ type, title, message, children }: { type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, children?: React.ReactNode }) {
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', title: GREEN },
    error:   { bg: '#fef2f2', border: '#fecaca', icon: '❌', title: RED },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠️', title: YELLOW },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️', title: B },
  }[type]
  return (
    <div style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{colors.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.title, marginBottom: message || children ? 4 : 0 }}>{title}</div>
          {message && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{message}</div>}
          {children}
        </div>
      </div>
    </div>
  )
}

export default function UploadPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'upload' | 'hotel_pick' | 'room_pick' | 'review' | 'error' | 'blocked' | 'success'>('upload')

  // Backend response
  const [extractResult, setExtractResult] = useState<any>(null)

  // Hotel selection (for search_results)
  const [selectedHotelIdx, setSelectedHotelIdx] = useState<number | null>(null)

  // Room selection (for hotel_detail_rooms)
  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number | null>(null)

  // Review form state
  const [form, setForm] = useState({
    hotel_name: '', hotel_city: '', hotel_address: '',
    check_in: '', check_out: '',
    num_adults: '2', num_children: 0, children_ages: [] as number[],
    num_rooms: '1',
    room_type: '', board_basis: '', board_basis_label: '',
    cancellation_policy: '', cancellation_deadline: '',
    total_price_paid: '', ota_name: '', booking_reference: '',
    phone: '', email: '',
  })

  // Warnings
  const [warnings, setWarnings] = useState<any>({})
  const [agodaWarning, setAgodaWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata
        setUser({
          name: meta?.full_name || meta?.name || data.user.email?.split('@')[0] || 'Member',
          email: data.user.email
        })
        setForm(f => ({ ...f, email: data.user.email || '' }))
      }
    })
    // Redirect to homepage if accessed directly (no extract result)
    // Check if redirected from homepage modal with extract result
    try {
      const stored = sessionStorage.getItem('rebuq_extract_result')
      if (stored) {
        sessionStorage.removeItem('rebuq_extract_result')
        const json = JSON.parse(stored)
        setExtractResult(json)
        const docType = json.documentType
        if (docType === 'search_results') {
          setStep('hotel_pick')
        } else if (docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top') {
          if (json.data?.room_options?.length > 0) setStep('room_pick')
          else { prefillForm(json.data, null, null); setStep('review') }
        }
      } else {
        // No extract result — redirect to homepage
        router.replace('/')
      }
    } catch {
      router.replace('/')
    }
  }, [])

  const handleFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)) {
      alert('Only JPG, PNG, WebP or PDF files are allowed.')
      return
    }
    if (f.size > 10 * 1024 * 1024) { alert('File size must be under 10MB.'); return }
    setFile(f)
    if (f.type !== 'application/pdf') {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleExtract = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('voucher', file)
      const res = await fetch(`${API}/extract`, { method: 'POST', body: formData })
      const data = await res.json()
      setExtractResult(data)

      if (!data.success && data.blocked) {
        if (data.blockReason === 'not_hotel') { setStep('error'); return }
        if (data.blockReason === 'poor_quality') { setStep('error'); return }
        if (data.blockReason === 'parse_error') { setStep('error'); return }
      }

      if (!data.success && data.blockReason === 'checkin_passed') { setStep('blocked'); return }

      const docType = data.documentType

      if (docType === 'search_results') {
        setStep('hotel_pick')
        return
      }

      if (docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top') {
        const hasRooms = data.data?.room_options?.length > 0
        if (hasRooms) { setStep('room_pick'); return }
        // No rooms visible — pre-fill what we have and go to review
        prefillForm(data.data, null, null)
        setStep('review')
        return
      }

      // confirmed_voucher or checkout_page
      prefillForm(data.data, null, null)
      setWarnings(data.warnings || {})
      setAgodaWarning(data.agodaPretaxWarning || false)

      if (data.blocked && data.blockReason === 'non_refundable') {
        setStep('blocked'); return
      }

      setStep('review')

    } catch (e) {
      setExtractResult({ success: false, blocked: true, blockReason: 'parse_error', message: 'Something went wrong. Please try again.' })
      setStep('error')
    } finally {
      setUploading(false)
    }
  }

  const prefillForm = (data: any, selectedHotel: any, selectedRoom: any) => {
    setForm(f => ({
      ...f,
      hotel_name:            selectedHotel?.hotel_name || data?.hotel_name || '',
      hotel_city:            selectedHotel?.destination || data?.destination || data?.hotel_city || '',
      hotel_address:         selectedHotel?.area || data?.hotel_address || '',
      check_in:              selectedHotel?.check_in || data?.check_in || '',
      check_out:             selectedHotel?.check_out || data?.check_out || '',
      num_adults:            String(selectedHotel?.num_adults || data?.num_adults || 2),
      num_children:          selectedHotel?.num_children || data?.num_children || 0,
      children_ages:         selectedHotel?.children_ages || data?.children_ages || [],
      num_rooms:             String(selectedHotel?.num_rooms || data?.num_rooms || 1),
      room_type:             selectedRoom?.room_type || data?.room_type || '',
      board_basis:           selectedRoom?.board_basis || data?.board_basis || '',
      board_basis_label:     selectedRoom?.board_basis_label || data?.board_basis_label || '',
      cancellation_policy:   selectedRoom?.cancellation_policy || data?.cancellation_policy || '',
      cancellation_deadline: selectedRoom?.cancellation_deadline || data?.cancellation_deadline || '',
      total_price_paid:      String(selectedRoom?.total_price_incl_tax || data?.total_price_paid || ''),
      ota_name:              data?.ota_name || '',
      booking_reference:     data?.booking_reference || '',
    }))
  }

  const handleHotelSelect = (idx: number) => {
    setSelectedHotelIdx(idx)
    const hotel = extractResult.data.hotels[idx]
    const searchData = extractResult.data
    prefillForm({
      hotel_name: hotel.hotel_name,
      hotel_city: searchData.destination,
      hotel_address: hotel.area || '',
      check_in: searchData.check_in,
      check_out: searchData.check_out,
      num_adults: searchData.num_adults,
      num_children: searchData.num_children,
      children_ages: searchData.children_ages,
      num_rooms: searchData.num_rooms,
      ota_name: searchData.ota_name,
      total_price_paid: hotel.total_price_incl_tax || hotel.price_per_night_incl_tax || '',
    }, null, null)
    setAgodaWarning(hotel.agoda_pretax_warning || false)
    setStep('review')
  }

  const handleRoomSelect = (idx: number) => {
    setSelectedRoomIdx(idx)
    const room = extractResult.data.room_options[idx]
    const hotelData = extractResult.data
    prefillForm(hotelData, null, room)
    setAgodaWarning(room.agoda_pretax_warning || false)
    setStep('review')
  }

  const handleSubmit = async () => {
    if (!form.phone || form.phone.length < 10) { alert('Please enter a valid WhatsApp number.'); return }
    if (!form.hotel_name) { alert('Hotel name is required.'); return }
    if (!form.check_in || !form.check_out) { alert('Check-in and check-out dates are required.'); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        num_adults: parseInt(form.num_adults),
        num_rooms: parseInt(form.num_rooms),
        total_price_paid: form.total_price_paid ? parseFloat(form.total_price_paid) : 0,
        documentType: extractResult?.documentType || 'confirmed_voucher',
        taxes_included: true,
      }
      const res = await fetch(`${API}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem('rebuq_booking', JSON.stringify({ extracted: { ...payload, hotel_name: form.hotel_name, hotel_city: form.hotel_city } }))
        router.push('/confirmed')
      } else if (data.reason === 'duplicate') {
        alert('This booking is already being tracked!')
        router.push('/dashboard')
      } else {
        alert(data.message || 'Something went wrong.')
      }
    } catch (e) {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setStep('upload')
    setExtractResult(null); setSelectedHotelIdx(null); setSelectedRoomIdx(null)
    setWarnings({}); setAgodaWarning(false)
    setForm(f => ({ ...f, hotel_name: '', hotel_city: '', hotel_address: '', check_in: '', check_out: '', room_type: '', board_basis: '', board_basis_label: '', cancellation_policy: '', cancellation_deadline: '', total_price_paid: '', ota_name: '', booking_reference: '' }))
  }

  const firstName = user?.name?.split(' ')[0] || null

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#f8fafc', color: NAVY, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease; }
        .upload-zone { transition: all 0.2s; }
        .upload-zone:hover { border-color: ${B} !important; background: #eff6ff !important; }
        .hotel-option { transition: all 0.2s; cursor: pointer; }
        .hotel-option:hover { border-color: ${B} !important; box-shadow: 0 4px 16px rgba(20,71,184,0.1) !important; }
        .room-option { transition: all 0.2s; cursor: pointer; }
        .room-option:hover { border-color: ${B} !important; }
        input:focus { outline: none !important; border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(20,71,184,0.08) !important; }
        select:focus { outline: none !important; border-color: ${B} !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 20px' : '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: 'none' }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: B, fontWeight: 600, textDecoration: 'none' }}>Member Deals</a>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: B, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{firstName}</span>
              </div>
            ) : (
              <button onClick={() => router.push('/signin')} style={{ background: B, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
            )}
          </div>
        )}
        {isMobile && (
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: NAVY, marginBottom: 5 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: NAVY, marginBottom: 5 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: NAVY }} />
          </button>
        )}
      </nav>

      {/* PAGE */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '40px 20px 80px' }}>

        {/* ── STEP: UPLOAD — redirect to homepage ── */}
        {step === 'upload' && null}

        {/* ── STEP: HOTEL PICK (search results) ── */}
        {step === 'hotel_pick' && extractResult?.data?.hotels && (
          <div className="fade-up">
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
            <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Which hotel?</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>We found {extractResult.data.hotels.length} hotels in this screenshot. Select the one you want to monitor.</p>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: B }}>
              📅 {extractResult.data.check_in && fmt(extractResult.data.check_in)} → {extractResult.data.check_out && fmt(extractResult.data.check_out)} · {extractResult.data.num_adults} Adults · {extractResult.data.num_rooms} Room
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {extractResult.data.hotels.map((hotel: any, idx: number) => (
                <div key={idx} className="hotel-option"
                  onClick={() => handleHotelSelect(idx)}
                  style={{ background: '#fff', border: `1.5px solid ${selectedHotelIdx === idx ? B : '#e2e8f0'}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: selectedHotelIdx === idx ? `0 0 0 3px rgba(20,71,184,0.1)` : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{hotel.hotel_name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                      {hotel.area && `📍 ${hotel.area} · `}
                      {hotel.stars && '★'.repeat(hotel.stars)}
                      {hotel.user_rating && ` · ${hotel.user_rating} rating`}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {hotel.free_cancellation && <span style={{ background: '#f0fdf4', color: GREEN, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ Free cancel</span>}
                      {hotel.breakfast_included && <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>🍳 Breakfast</span>}
                      {hotel.agoda_pretax_warning && <span style={{ background: '#fef2f2', color: RED, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>⚠️ Pre-tax price</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    {hotel.price_per_night_incl_tax ? (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(hotel.price_per_night_incl_tax)}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>per night</div>
                      </>
                    ) : <div style={{ fontSize: 12, color: '#94a3b8' }}>Price n/a</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: ROOM PICK (hotel detail rooms) ── */}
        {step === 'room_pick' && extractResult?.data?.room_options && (
          <div className="fade-up">
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
            <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
              {extractResult.data.hotel_name || 'Select your room'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              {extractResult.data.check_in && `${fmt(extractResult.data.check_in)} → ${fmt(extractResult.data.check_out)} · `}
              {extractResult.data.num_adults} Adults · Select the room option you want to monitor.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {extractResult.data.room_options.map((room: any, idx: number) => (
                <div key={idx} className="room-option"
                  onClick={() => handleRoomSelect(idx)}
                  style={{ background: '#fff', border: `1.5px solid ${selectedRoomIdx === idx ? B : '#e2e8f0'}`, borderRadius: 14, padding: '16px 18px', boxShadow: selectedRoomIdx === idx ? `0 0 0 3px rgba(20,71,184,0.1)` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{room.room_type}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{room.option_name || room.board_basis_label}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                        <span style={{
                          background: room.cancellation_policy === 'free' ? '#f0fdf4' : room.cancellation_policy === 'non-refundable' ? '#fef2f2' : '#fffbeb',
                          color: room.cancellation_policy === 'free' ? GREEN : room.cancellation_policy === 'non-refundable' ? RED : YELLOW,
                          fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600
                        }}>
                          {room.cancellation_policy === 'free' ? '✓ Free cancel' : room.cancellation_policy === 'non-refundable' ? '✗ Non-refundable' : `⚠️ ${room.cancellation_policy}`}
                        </span>
                        {room.agoda_pretax_warning && <span style={{ background: '#fef2f2', color: RED, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>⚠️ Pre-tax price</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      {room.price_per_night_incl_tax ? (
                        <>
                          <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{formatINR(room.price_per_night_incl_tax)}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>/ night</div>
                        </>
                      ) : room.agoda_pretax_warning ? (
                        <div style={{ fontSize: 12, color: RED }}>Enter total manually</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === 'review' && (
          <div className="fade-up">
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
            <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Confirm your details</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Please review and correct anything that looks wrong before we start monitoring.</p>

            {/* Warnings */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 20 }}>
              {warnings?.partialExtraction && <AlertBox type="warning" title="Some details may be missing" message="We extracted what we could. Please fill in any blank fields below." />}
              {warnings?.cameraPhoto && <AlertBox type="info" title="Camera photo detected" message="We did our best to read your screen photo. Please verify the details carefully." />}
              {warnings?.checkInSoon && <AlertBox type="warning" title={`Check-in is ${warnings.checkInSoonDays === 0 ? 'today' : 'tomorrow'}!`} message="The window to rebook is very tight. We'll scan immediately but can't guarantee a result." />}
              {warnings?.unknownPolicy && <AlertBox type="warning" title="Cancellation policy unclear" message="We'll ask you to confirm via WhatsApp after submission." />}
              {warnings?.payAtProperty && <AlertBox type="info" title="Pay at property booking" message="You haven't paid yet. We'll monitor rates so you get the best price at check-in." />}
              {warnings?.currencyConverted && <AlertBox type="info" title={`Price converted from ${warnings.originalCurrency} to INR`} message="We used live exchange rates. Please verify the total below." />}
              {agodaWarning && (
                <AlertBox type="warning" title="Agoda shows prices before taxes">
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Agoda doesn't show taxes on this screen. Please enter the final total you'll pay (including all taxes) in the price field below.</div>
                </AlertBox>
              )}
              {!form.hotel_name && extractResult?.data?.ota_name === 'Agoda' && (
                <AlertBox type="warning" title="Hotel name not visible on this Agoda screen" message="Agoda's booking form doesn't show the hotel name. Please enter it manually below." />
              )}
              {!form.total_price_paid && (extractResult?.documentType === 'checkout_page' || extractResult?.documentType === 'confirmed_voucher') && !agodaWarning && (
                <AlertBox type="info" title="Price not visible on this screen" message="The price summary wasn't visible in your screenshot. Please scroll to it and enter the total amount manually." />
              )}
              {extractResult?.documentType === 'search_results' || extractResult?.documentType === 'hotel_detail_rooms' || extractResult?.documentType === 'hotel_detail_top' || extractResult?.documentType === 'checkout_page' ? (
                <AlertBox type="info" title="Pre-booking monitor" message="You haven't booked yet — we'll monitor this price so you know the best time to book. Once you book, upload your confirmation for full tracking." />
              ) : null}
            </div>

            {/* Form */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column' as const, gap: 18 }}>

              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>🏨 Hotel Details</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Hotel Name <span style={{ color: RED }}>*</span></label>
                <input value={form.hotel_name} onChange={e => setForm(f => ({ ...f, hotel_name: e.target.value }))}
                  placeholder={extractResult?.data?.ota_name === 'Agoda' && !form.hotel_name ? "Enter hotel name — not shown on Agoda checkout" : "e.g. Taj Dubai"}
                  style={{ width: '100%', border: `1.5px solid ${!form.hotel_name && extractResult?.data?.ota_name === 'Agoda' ? RED : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: NAVY, background: '#fff', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="City" value={form.hotel_city} onChange={v => setForm(f => ({ ...f, hotel_city: v }))} required />
                <Field label="OTA" value={form.ota_name} onChange={v => setForm(f => ({ ...f, ota_name: v }))} />
              </div>
              <Field label="Hotel Address" value={form.hotel_address} onChange={v => setForm(f => ({ ...f, hotel_address: v }))} placeholder="Optional — we'll look it up" />

              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginTop: 4 }}>📅 Stay Details</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Check-in" value={form.check_in} onChange={v => setForm(f => ({ ...f, check_in: v }))} type="date" required />
                <Field label="Check-out" value={form.check_out} onChange={v => setForm(f => ({ ...f, check_out: v }))} type="date" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Adults" value={form.num_adults} onChange={v => setForm(f => ({ ...f, num_adults: v }))} type="number" />
                <Field label="Rooms" value={form.num_rooms} onChange={v => setForm(f => ({ ...f, num_rooms: v }))} type="number" />
              </div>

              {/* Children */}
              <ChildrenPicker
                count={form.num_children}
                ages={form.children_ages}
                onCountChange={n => {
                  const newAges = [...form.children_ages]
                  while (newAges.length < n) newAges.push(0)
                  setForm(f => ({ ...f, num_children: n, children_ages: newAges.slice(0, n) }))
                }}
                onAgeChange={(idx, age) => {
                  const newAges = [...form.children_ages]
                  newAges[idx] = age
                  setForm(f => ({ ...f, children_ages: newAges }))
                }}
              />

              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginTop: 4 }}>🛏️ Room & Price</div>

              <Field label="Room Type" value={form.room_type} onChange={v => setForm(f => ({ ...f, room_type: v }))} placeholder="e.g. Deluxe King Room (optional)" />

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Board Basis</label>
                <select value={form.board_basis} onChange={e => {
                  const labels: Record<string, string> = { RO: 'Room Only', BB: 'Bed & Breakfast', HB: 'Half Board', FB: 'Full Board', AI: 'All Inclusive' }
                  setForm(f => ({ ...f, board_basis: e.target.value, board_basis_label: labels[e.target.value] || '' }))
                }} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', background: '#fff', color: NAVY, cursor: 'pointer' }}>
                  <option value="">Not specified</option>
                  <option value="RO">Room Only</option>
                  <option value="BB">Bed & Breakfast</option>
                  <option value="HB">Half Board</option>
                  <option value="FB">Full Board</option>
                  <option value="AI">All Inclusive</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Total Price Paid (₹){agodaWarning && <span style={{ color: RED }}> *</span>}
                </label>
                <input type="number" value={form.total_price_paid} onChange={e => setForm(f => ({ ...f, total_price_paid: e.target.value }))}
                  placeholder={agodaWarning ? "Enter total incl. taxes (Agoda pre-tax price)" : "Total amount paid in ₹"}
                  style={{ width: '100%', border: `1.5px solid ${agodaWarning && !form.total_price_paid ? RED : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: NAVY, background: '#fff', outline: 'none' }} />
                {agodaWarning && !form.total_price_paid && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>Required — Agoda shows pre-tax prices. Enter the final amount you'll pay.</div>}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginTop: 4 }}>🔔 Cancellation</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Cancellation Policy</label>
                <select value={form.cancellation_policy} onChange={e => setForm(f => ({ ...f, cancellation_policy: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', background: '#fff', color: NAVY, cursor: 'pointer' }}>
                  <option value="">Unknown</option>
                  <option value="free">Free Cancellation</option>
                  <option value="partial">Partial Refund</option>
                  <option value="non-refundable">Non-Refundable</option>
                </select>
              </div>

              {form.cancellation_policy === 'free' && (
                <Field label="Free Cancellation Until" value={form.cancellation_deadline} onChange={v => setForm(f => ({ ...f, cancellation_deadline: v }))} type="date" />
              )}

              {form.booking_reference && (
                <Field label="Booking Reference" value={form.booking_reference} onChange={v => setForm(f => ({ ...f, booking_reference: v }))} />
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginTop: 4 }}>📱 WhatsApp Alerts</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>WhatsApp Number <span style={{ color: RED }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', padding: '10px 12px', fontSize: 14, color: '#64748b', fontWeight: 600 }}>+91</div>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '0 10px 10px 0', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: NAVY, background: '#fff', outline: 'none' }} />
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>We'll send you a WhatsApp when the price drops — instant alert, no spam.</div>
              </div>

              <Field label="Email (optional)" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="For booking confirmation copies" />

              {/* Submit */}
              <button onClick={handleSubmit} disabled={submitting || (agodaWarning && !form.total_price_paid)}
                style={{ width: '100%', background: submitting || (agodaWarning && !form.total_price_paid) ? '#94a3b8' : B, color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, cursor: submitting || (agodaWarning && !form.total_price_paid) ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                {submitting ? (
                  <><div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Starting tracker…</>
                ) : '🔔 Start Price Monitoring →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === 'error' && (
          <div className="fade-up" style={{ textAlign: 'center' as const, padding: '40px 0' }}>
            {extractResult?.blockReason === 'not_hotel' ? (
              <>
                <div style={{ fontSize: 64, marginBottom: 20 }}>📋</div>
                <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 12 }}>Not a hotel booking</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8, lineHeight: 1.7 }}>Please upload a hotel booking confirmation — not a flight ticket, train ticket, restaurant receipt, or other document.</p>
                {extractResult?.reason && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>{extractResult.reason}</p>}
              </>
            ) : extractResult?.blockReason === 'poor_quality' ? (
              <>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
                <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 12 }}>Couldn't read your document</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.7 }}>The image is too blurry or dark to read. Try a clearer photo, or use a PDF from your email.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
                <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 12 }}>Something went wrong</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>{extractResult?.message || 'Please try again.'}</p>
              </>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={reset} style={{ background: B, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upload a hotel voucher</button>
              <button onClick={() => { reset(); setStep('review'); }} style={{ background: '#fff', color: NAVY, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter manually</button>
            </div>
          </div>
        )}

        {/* ── STEP: BLOCKED ── */}
        {step === 'blocked' && (
          <div className="fade-up" style={{ textAlign: 'center' as const, padding: '40px 0' }}>
            {extractResult?.blockReason === 'non_refundable' ? (
              <>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
                <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 12 }}>Non-refundable booking</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 8 }}>
                  <strong>{form.hotel_name || extractResult?.data?.hotel_name}</strong> was booked as non-refundable.
                </p>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>Even if the price drops, you can't cancel and rebook. We've let you know via WhatsApp.</p>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' as const }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: YELLOW, marginBottom: 4 }}>💡 For next time</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Book a flexible/free cancellation rate — rebuq regularly finds drops of ₹10,000–₹40,000 that more than cover any price difference.</div>
                </div>
              </>
            ) : extractResult?.blockReason === 'checkin_passed' ? (
              <>
                <div style={{ fontSize: 64, marginBottom: 20 }}>📅</div>
                <h2 className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 12 }}>Check-in has already passed</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>The check-in date on this booking has passed. Nothing left to monitor.</p>
              </>
            ) : null}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={reset} style={{ background: B, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↺ Track another booking</button>
              <button onClick={() => router.push('/search-hotels')} style={{ background: '#fff', color: NAVY, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Browse member deals →</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
