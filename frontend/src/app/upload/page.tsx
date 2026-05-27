"use client";

import { useEffect, useState } from 'react'
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

interface ExtractedData {
  hotel_name: string; hotel_city: string; check_in: string; check_out: string;
  total_nights: number; room_type: string; num_adults: number; board_basis_label: string;
  total_price_paid: number; original_price: number; ota_name: string;
  booking_reference: string; cancellation_deadline: string; cancellation_policy: string;
}

export default function ConfirmationPage() {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const stored = sessionStorage.getItem('rebuq_booking')
      if (stored) {
        const { extracted: data } = JSON.parse(stored)
        setExtracted(data)
      }
    } catch {}
    setLoaded(true)
  }, [])

  // If no data — redirect home
  useEffect(() => {
    if (loaded && !extracted) {
      router.push('/')
    }
  }, [loaded, extracted, router])

  if (!extracted) return null

  const numNights = extracted.total_nights ||
    Math.max(0, Math.round((new Date(extracted.check_out).getTime() - new Date(extracted.check_in).getTime()) / 86400000))

  const savingExample   = Math.round((extracted.total_price_paid || extracted.original_price) * 0.18)
  const newPriceExample = Math.round((extracted.total_price_paid || extracted.original_price) * 0.82)

  const cityDeals = [
    { name: `Top-rated hotel in ${extracted.hotel_city}`, stars: 5, saving: '22% below OTA', badge: 'Member rate',  gradient: `${B}, #0f172a` },
    { name: `Luxury stay in ${extracted.hotel_city}`,     stars: 5, saving: '18% below OTA', badge: 'Best value',   gradient: '#0f6e56, #064e3b' },
    { name: `Boutique hotel in ${extracted.hotel_city}`,  stars: 4, saving: '15% below OTA', badge: 'Popular pick', gradient: '#7c3aed, #4c1d95' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: NAVY, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .sora { font-family: 'Sora', sans-serif; }`}</style>

      {/* NAV */}
      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 20px' : '0 40px', height: 60, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: 'none' }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/search-hotels" style={{ fontSize: 14, color: B, fontWeight: 600, textDecoration: 'none' }}>Exclusive Deals</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: B, padding: isMobile ? '40px 20px' : '64px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 28, letterSpacing: '0.04em' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            PRICE TRACKER ACTIVATED
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'center' }}>
            <div>
              <h1 className="sora" style={{ fontSize: isMobile ? 34 : 48, fontWeight: 800, color: '#fff', lineHeight: 1.08, marginBottom: 20 }}>
                We&apos;re on it.<br />
                <span style={{ color: '#FCD34D' }}>Watching 24/7</span><br />
                for a better deal.
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 28, maxWidth: 420 }}>
                Every 6 hours, our AI scans live rates for <strong style={{ color: '#fff' }}>{extracted.hotel_name}</strong> — same room, same meals, same dates. The moment we find a lower price, you&apos;ll get a WhatsApp instantly.
              </p>
              {extracted.cancellation_deadline && (
                <div style={{ background: 'rgba(252,211,77,0.12)', border: '1.5px solid rgba(252,211,77,0.35)', borderRadius: 12, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⏰</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D', marginBottom: 2 }}>Free cancellation deadline</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                      Cancel for free until <strong style={{ color: '#fff' }}>{new Date(extracted.cancellation_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                <button onClick={() => router.push('/')} style={{ background: '#fff', color: B, border: 'none', padding: '13px 26px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>← Back to home</button>
                <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', padding: '13px 26px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track another booking</button>
              </div>
            </div>

            {/* WhatsApp preview */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ background: '#075E54', borderRadius: '12px 12px 0 0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, margin: '-20px -20px 16px' }}>
                <div style={{ width: 36, height: 36, background: B, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>r.</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>rebuq.</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Business Account · online</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 11, marginBottom: 12 }}>Today · just now</div>
              <div style={{ background: '#f0f0f0', borderRadius: '0 14px 14px 14px', padding: '14px 16px', color: '#1e293b', lineHeight: 1.75, fontSize: 13, marginBottom: 12 }}>
                💰 <strong>Price Drop Alert — rebuq</strong><br /><br />
                <strong style={{ color: NAVY }}>{extracted.hotel_name}</strong><br />
                📅 {extracted.check_in} → {extracted.check_out}<br />
                🛏️ {extracted.room_type || 'Standard Room'}<br /><br />
                <span style={{ color: '#64748b', textDecoration: 'line-through' }}>You paid: ₹{(extracted.total_price_paid || extracted.original_price).toLocaleString('en-IN')}</span><br />
                New price: <strong style={{ color: '#16a34a', fontSize: 15 }}>₹{newPriceExample.toLocaleString('en-IN')}</strong><br />
                💚 <strong>You save: ₹{savingExample.toLocaleString('en-IN')}</strong><br /><br />
                <em style={{ fontSize: 11, color: '#64748b' }}>Same room · same meals · like-for-like ✓</em>
              </div>
              <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '14px 14px 2px 14px', padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#15803d', textAlign: 'right' as const }}>YES — rebook now 👍</div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', textAlign: 'center' as const }}>This is a preview of what you&apos;ll receive on WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOOKING SUMMARY + WHAT HAPPENS NEXT */}
      <div style={{ background: '#f8fafc', padding: isMobile ? '32px 20px' : '48px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 48 }}>

          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Booking summary</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { l: 'Hotel',      v: extracted.hotel_name },
                { l: 'City',       v: extracted.hotel_city },
                { l: 'Check-in',   v: new Date(extracted.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { l: 'Check-out',  v: new Date(extracted.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { l: 'Duration',   v: `${numNights} nights` },
                { l: 'Room',       v: extracted.room_type || '—' },
                { l: 'Meals',      v: extracted.board_basis_label || '—' },
                { l: 'Total paid', v: `₹${(extracted.total_price_paid || extracted.original_price).toLocaleString('en-IN')}` },
                { l: 'Booked on',  v: extracted.ota_name || '—' },
                ...(extracted.booking_reference ? [{ l: 'Ref no.', v: extracted.booking_reference }] : []),
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 600 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚀</div>
              <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>What happens next</div>
            </div>
            {[
              { icon: '🔍', title: 'Scanning every 6 hours', text: 'Same hotel, same room, same meal plan — like-for-like, no tricks.' },
              { icon: '📱', title: 'Instant WhatsApp alert', text: 'The moment a lower price is found, you get a direct message with a rebooking link.' },
              { icon: '✅', title: 'You rebook in 2 minutes', text: 'Cancel your original booking, tap our link, select your room and confirm. Done.' },
              { icon: '💰', title: 'You keep every rupee saved', text: 'We earn a small success fee only when we save you money. Zero cost otherwise.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 20 : 0 }}>
                <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CITY DEALS */}
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 6 }}>Members only · exclusive rates</div>
              <div className="sora" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: NAVY }}>
                While you&apos;re here — explore deals in {extracted.hotel_city}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Pre-negotiated member rates — often 15–30% below any OTA.</div>
            </div>
            <button onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(extracted.hotel_city)}`)} style={{ background: B, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              See all {extracted.hotel_city} deals →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {cityDeals.map((deal, i) => (
              <div key={i} onClick={() => router.push(`/search-hotels?city=${encodeURIComponent(extracted.hotel_city)}`)}
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ height: 140, background: `linear-gradient(135deg, ${deal.gradient})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                  <span style={{ fontSize: 40 }}>🏨</span>
                  <div style={{ position: 'absolute' as const, top: 12, left: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff' }}>{deal.badge}</div>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', marginBottom: 6 }}>
                    {Array.from({ length: deal.stars }).map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 12 }}>★</span>)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10, lineHeight: 1.4 }}>{deal.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>✓ {deal.saving}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{numNights} nights</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1447b8 100%)', borderRadius: 16, padding: isMobile ? '28px 20px' : '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>rebuq member deals</div>
              <div className="sora" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Plan your next trip smarter.</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 420 }}>
                Browse exclusive member rates across 50,000+ hotels. Book flexible, upload to rebuq, and we&apos;ll watch for drops from day one.
              </div>
            </div>
            <button onClick={() => router.push('/search-hotels')} style={{ background: '#FCD34D', color: NAVY, border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              Browse all member deals →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
