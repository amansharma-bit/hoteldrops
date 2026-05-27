"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

function getCityHotels(city: string, checkIn: string, checkOut: string) {
  const hotelsByCity: Record<string, any[]> = {
    Dubai: [
      { name: 'Atlantis The Palm', area: 'Palm Jumeirah', room: 'Ocean King Room', stars: 5, otaPrice: 42000, memberPrice: 32700, saving: 9300, pct: 22, board: 'Breakfast included' },
      { name: 'Burj Al Arab Jumeirah', area: 'Jumeirah Beach', room: 'Deluxe Suite', stars: 5, otaPrice: 68000, memberPrice: 52000, saving: 16000, pct: 24, board: 'All Inclusive' },
      { name: 'Jumeirah Beach Hotel', area: 'Jumeirah', room: 'Ocean Deluxe Room', stars: 5, otaPrice: 28000, memberPrice: 21500, saving: 6500, pct: 23, board: 'Room Only' },
    ],
    Bangkok: [
      { name: 'Mandarin Oriental Bangkok', area: 'Riverside', room: 'Superior Room', stars: 5, otaPrice: 18000, memberPrice: 13800, saving: 4200, pct: 23, board: 'Breakfast included' },
      { name: 'The Peninsula Bangkok', area: 'Charoen Nakhon', room: 'Deluxe River View', stars: 5, otaPrice: 22000, memberPrice: 16800, saving: 5200, pct: 24, board: 'Room Only' },
      { name: 'Capella Bangkok', area: 'Chao Phraya', room: 'Riverfront Suite', stars: 5, otaPrice: 35000, memberPrice: 26600, saving: 8400, pct: 24, board: 'Breakfast included' },
    ],
    Bali: [
      { name: 'Four Seasons Resort Bali', area: 'Sayan, Ubud', room: 'Villa with Pool', stars: 5, otaPrice: 32000, memberPrice: 24300, saving: 7700, pct: 24, board: 'Breakfast included' },
      { name: 'COMO Shambhala Estate', area: 'Ubud', room: 'Garden Villa', stars: 5, otaPrice: 28000, memberPrice: 21500, saving: 6500, pct: 23, board: 'All Inclusive' },
      { name: 'Amankila', area: 'Karangasem', room: 'Suite', stars: 5, otaPrice: 45000, memberPrice: 34200, saving: 10800, pct: 24, board: 'Room Only' },
    ],
    Maldives: [
      { name: 'One & Only Reethi Rah', area: 'North Malé Atoll', room: 'Beach Villa', stars: 5, otaPrice: 85000, memberPrice: 64600, saving: 20400, pct: 24, board: 'All Inclusive' },
      { name: 'Cheval Blanc Randheli', area: 'Noonu Atoll', room: 'Lagoon Villa', stars: 5, otaPrice: 92000, memberPrice: 69900, saving: 22100, pct: 24, board: 'Breakfast included' },
      { name: 'Six Senses Laamu', area: 'Laamu Atoll', room: 'Water Villa', stars: 5, otaPrice: 72000, memberPrice: 54700, saving: 17300, pct: 24, board: 'All Inclusive' },
    ],
    Singapore: [
      { name: 'Marina Bay Sands', area: 'Marina Bay', room: 'Deluxe Room', stars: 5, otaPrice: 28000, memberPrice: 21600, saving: 6400, pct: 23, board: 'Room Only' },
      { name: 'Capella Singapore', area: 'Sentosa Island', room: 'Garden Villa', stars: 5, otaPrice: 42000, memberPrice: 32200, saving: 9800, pct: 23, board: 'Breakfast included' },
      { name: 'The St. Regis Singapore', area: 'Orchard', room: 'Deluxe Room', stars: 5, otaPrice: 22000, memberPrice: 16900, saving: 5100, pct: 23, board: 'Room Only' },
    ],
  }
  const defaultHotels = [
    { name: `Grand Hyatt ${city}`, area: `City Centre, ${city}`, room: 'Deluxe King Room', stars: 5, otaPrice: 18000, memberPrice: 13700, saving: 4300, pct: 24, board: 'Breakfast included' },
    { name: `Marriott ${city}`, area: `Business District, ${city}`, room: 'Superior Room', stars: 5, otaPrice: 14200, memberPrice: 10900, saving: 3300, pct: 23, board: 'Room Only' },
    { name: `Hilton ${city}`, area: `Downtown, ${city}`, room: 'Executive Room', stars: 4, otaPrice: 11000, memberPrice: 8500, saving: 2500, pct: 23, board: 'Breakfast included' },
  ]
  return (hotelsByCity[city] || defaultHotels).map(h => ({ ...h, checkIn, checkOut }))
}

const GRADIENTS = [`${B}, #0a1a6e`, '#0f6e56, #064e3b', '#7c3aed, #4c1d95']
const BADGES    = ['Member rate', 'Best value', 'Popular pick']

export default function ConfirmationPage() {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const [extracted, setExtracted] = useState<any>(null)
  const [loaded, setLoaded]       = useState(false)
  const [user, setUser]           = useState<any>(null)
  const [countdown, setCountdown] = useState('')
  const [showMenu, setShowMenu]   = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata
        setUser({ name: meta?.full_name || meta?.name || data.user.email?.split('@')[0] || 'Member', email: data.user.email })
      }
    })
    try {
      const stored = sessionStorage.getItem('rebuq_booking')
      if (stored) {
        const { extracted: data } = JSON.parse(stored)
        setExtracted(data)
      }
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const key = 'rebuq_submitted_at'
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, new Date().toISOString())
    const nextScan = new Date(new Date(sessionStorage.getItem(key)!).getTime() + 6 * 3600000)
    const tick = () => {
      const diff = nextScan.getTime() - Date.now()
      if (diff <= 0) { setCountdown('Scanning now...'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${m}m ${s}s`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [loaded])

  useEffect(() => { if (loaded && !extracted) router.push('/') }, [loaded, extracted, router])

  if (!extracted) return null

  const numNights = extracted.total_nights ||
    Math.max(0, Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000))

  const cityHotels = getCityHotels(extracted.hotel_city, extracted.check_in, extracted.check_out)

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  const firstName = user?.name?.split(' ')[0] || null

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f8fafc', color: NAVY, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .deal-card { transition: all 0.2s ease; cursor: pointer; }
        .deal-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(20,71,184,0.13) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 20px' : '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: 'none' }}>
          rebuq<span style={{ color: B }}>.</span>
        </a>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/search-hotels" style={{ fontSize: 14, color: B, fontWeight: 600, textDecoration: 'none' }}>Exclusive Member Deals</a>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: B, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {user.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{firstName}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => router.push('/signin')} style={{ background: 'none', border: 'none', fontSize: 14, color: NAVY, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px', borderRadius: 8 }}>Sign in</button>
                <button onClick={() => router.push('/signin')} style={{ background: B, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Join free</button>
              </div>
            )}
          </div>
        )}

        {isMobile && (
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: showMenu ? 'transparent' : NAVY, transition: 'all 0.2s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: NAVY, transition: 'all 0.2s', transform: showMenu ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: NAVY, transition: 'all 0.2s', transform: showMenu ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        )}
      </nav>

      {isMobile && showMenu && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 99, background: '#fff', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/search-hotels" style={{ fontSize: 16, fontWeight: 600, color: B, padding: '14px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', display: 'block' }}>Exclusive Member Deals</a>
          {user
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: B, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{user.name[0].toUpperCase()}</div>
                <span style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{firstName}</span>
              </div>
            : <>
                <button onClick={() => router.push('/signin')} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: NAVY }}>Sign in</button>
                <button onClick={() => router.push('/signin')} style={{ background: B, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Join free</button>
              </>
          }
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ background: B, padding: isMobile ? '52px 20px 60px' : '72px 40px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', padding: '6px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 32, letterSpacing: '0.06em' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            PRICE TRACKER ACTIVATED
          </div>

          <h1 className="sora" style={{ fontSize: isMobile ? 36 : 56, fontWeight: 800, color: '#fff', lineHeight: 1.08, marginBottom: 20 }}>
            We&apos;re on it.<br />
            <span style={{ color: '#FCD34D' }}>Watching 24/7</span><br />
            for a better deal.
          </h1>

          <p style={{ fontSize: isMobile ? 15 : 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, maxWidth: 540, margin: '0 auto 32px' }}>
            Every 6 hours, our AI scans live rates for <strong style={{ color: '#fff' }}>{extracted.hotel_name}</strong> — same room, same meals, same dates. The moment we find a lower price, you&apos;ll get a WhatsApp instantly.
          </p>

          {extracted.cancellation_deadline && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(252,211,77,0.1)', border: '1.5px solid rgba(252,211,77,0.3)', borderRadius: 14, padding: '14px 20px', marginBottom: 36 }}>
              <span style={{ fontSize: 22 }}>⏰</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D' }}>Free cancellation deadline</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  Cancel for free until <strong style={{ color: '#fff' }}>{fmt(extracted.cancellation_deadline)}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/')} style={{ background: '#fff', color: B, border: 'none', padding: '13px 26px', borderRadius: 100, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to home</button>
            <button onClick={() => { sessionStorage.removeItem('rebuq_booking'); sessionStorage.removeItem('rebuq_submitted_at'); router.push('/'); }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', padding: '13px 26px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↺ Track another booking</button>
          </div>
        </div>
      </div>

      {/* ── MONITORING STRIP ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '14px 20px' : '14px 40px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 32, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Tracker active</span>
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>Checking every 6 hours</span>
          {countdown && <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Next scan in <span style={{ color: B }}>{countdown}</span></span>}
          <span style={{ fontSize: 13, color: '#64748b' }}>Monitoring across Booking.com, Agoda, Hotels.com and 20+ OTAs</span>
        </div>
      </div>

      {/* ── BOOKING + WHAT HAPPENS ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 20px' : '48px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>

        {/* Tracked booking */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 38, height: 38, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
            <div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Your tracked booking</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>We're watching this for price drops</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { l: 'Hotel',      v: extracted.hotel_name },
              { l: 'City',       v: extracted.hotel_city },
              { l: 'Check-in',   v: fmt(extracted.check_in) },
              { l: 'Check-out',  v: fmt(extracted.check_out) },
              { l: 'Duration',   v: `${numNights} nights` },
              { l: 'Room',       v: extracted.room_type || '—' },
              { l: 'Meals',      v: extracted.board_basis_label || '—' },
              { l: 'Amount paid', v: `₹${(extracted.total_price_paid || extracted.original_price || 0).toLocaleString('en-IN')}`, highlight: true },
              { l: 'Booked on',  v: extracted.ota_name || '—' },
              ...(extracted.booking_reference ? [{ l: 'Ref no.', v: extracted.booking_reference }] : []),
            ].map((item: any, i: number) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>{item.l}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: item.highlight ? B : NAVY, lineHeight: 1.4 }}>{item.v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Tracker active</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>— next scan in <strong style={{ color: NAVY }}>{countdown || '...'}</strong></span>
          </div>
        </div>

        {/* What happens next */}
        <div style={{ background: NAVY, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚀</div>
            <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>What happens next</div>
          </div>

          {[
            { icon: '🔍', n: '1', title: 'Scanning every 6 hours', text: 'Same hotel, same room, same meal plan — like-for-like, no tricks.' },
            { icon: '📱', n: '2', title: 'Instant WhatsApp alert', text: 'The moment a lower price is found, you get a direct message with a rebooking link.' },
            { icon: '✅', n: '3', title: 'You rebook in 2 minutes', text: 'Cancel your original booking, tap our link, select your room and confirm. Done.' },
            { icon: '💰', n: '4', title: 'You keep every rupee saved', text: 'Your saving goes straight into your pocket.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 24 : 0 }}>
              <div style={{ position: 'relative' as const, flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.07)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div>
                <div style={{ position: 'absolute' as const, top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: B, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{item.n}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.text}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            rebuq monitors prices across {extracted.ota_name || 'Agoda'}, Booking.com, Hotels.com and 20+ OTAs — always comparing like-for-like.
          </div>
        </div>
      </div>

      {/* ── CITY DEALS ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 40px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 8 }}>MEMBERS ONLY · EXCLUSIVE RATES</div>
            <div className="sora" style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: NAVY }}>
              While you&apos;re here — explore deals in <span style={{ color: B }}>{extracted.hotel_city}</span>
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>Pre-negotiated member rates — often 15–30% below any OTA.</div>
          </div>
          <button onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(extracted.hotel_city)}`)}
            style={{ background: B, color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            See all {extracted.hotel_city} deals →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
          {cityHotels.map((hotel, i) => (
            <div key={i} className="deal-card" onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(extracted.hotel_city)}`)}
              style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ height: 160, background: `linear-gradient(135deg, ${GRADIENTS[i]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                <span style={{ fontSize: 48 }}>🏨</span>
                <div style={{ position: 'absolute' as const, top: 14, left: 14, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#fff' }}>{BADGES[i]}</div>
                <div style={{ position: 'absolute' as const, bottom: 14, right: 14, display: 'flex', gap: 2 }}>
                  {Array.from({ length: hotel.stars }).map((_: any, j: number) => <span key={j} style={{ color: '#FCD34D', fontSize: 13 }}>★</span>)}
                </div>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{hotel.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{hotel.area}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{hotel.room} · {fmt(hotel.checkIn)} → {fmt(hotel.checkOut)}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 500 }}>✦ {hotel.board}</span>
                  <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 500 }}>✓ Free cancellation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>₹{hotel.otaPrice.toLocaleString('en-IN')}</span>
                      <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>-{hotel.pct}%</span>
                    </div>
                    <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>₹{hotel.memberPrice.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>You save ₹{hotel.saving.toLocaleString('en-IN')}</div>
                  </div>
                  <button style={{ background: B, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View deal →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 40px 64px' }}>
        <div style={{ background: NAVY, borderRadius: 20, padding: isMobile ? '32px 24px' : '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>REBUQ MEMBER DEALS</div>
            <div className="sora" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Plan your next trip smarter.</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 440 }}>
              Browse exclusive member rates across 50,000+ hotels. Book flexible, upload to rebuq, and we&apos;ll watch for drops from day one.
            </div>
          </div>
          <button onClick={() => router.push('/search-hotels')} style={{ background: '#FCD34D', color: NAVY, border: 'none', borderRadius: 100, padding: '14px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            Browse all member deals →
          </button>
        </div>
      </div>

      {/* ── FOOTER (matches homepage) ── */}
      <footer style={{ background: NAVY, padding: isMobile ? '40px 20px 24px' : '48px 40px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, gap: 40, flexWrap: 'wrap' as const, flexDirection: isMobile ? 'column' : 'row' }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 10 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13.5, color: '#94a3b8', maxWidth: 260, lineHeight: 1.6 }}>AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? 28 : 48, flexDirection: isMobile ? 'column' : 'row' }}>
              {[
                { title: 'Product', links: ['How it works', 'Results', 'Why rebuq', 'Exclusive Member Deals'] },
                { title: 'Company', links: ['About', 'Privacy', 'Terms', 'Contact'] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#64748b', marginBottom: 14 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: 'block', fontSize: 14, color: '#94a3b8', textDecoration: 'none', marginBottom: 10 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0 }}>
            <span style={{ fontSize: 13, color: '#475569' }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {[
                { href: 'https://twitter.com/rebuq', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { href: 'https://linkedin.com/company/rebuq', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { href: 'https://instagram.com/rebuq', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
