'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Upload, Bell, ArrowRight, CheckCircle, ChevronDown,
  Shield, Smartphone, TrendingDown, Star, Search,
  MapPin, Calendar, Users, X
} from 'lucide-react'

export default function HomePage() {
  const [activeTab, setActiveTab]   = useState<'track' | 'search'>('track')
  const [billing, setBilling]       = useState<'monthly' | 'annual'>('monthly')
  const [faqOpen, setFaqOpen]       = useState<number | null>(null)
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn]       = useState('')
  const [checkOut, setCheckOut]     = useState('')
  const [guests, setGuests]         = useState('2')

  const prices = {
    pro:      { monthly: 12,  annual: 9  },
    business: { monthly: 29,  annual: 21 },
  }

  const popular = ['Goa 🏖️', 'Dubai 🇦🇪', 'Mumbai 🏙️', 'Bangkok 🇹🇭', 'London 🇬🇧', 'Bali 🌴']

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563eb' }}>
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">rebuq</span>
              <span className="text-white/40 text-sm">.com</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-white/75 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-white/75 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-white/75 hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-semibold text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">Sign In</Link>
              <Link href="/upload" className="bg-white text-blue-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="gradient-hero min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 lg:px-10 py-20 flex flex-col lg:flex-row items-center gap-16">

          {/* Left text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="pulse-dot" />
              <span className="text-white/90 text-sm">Live price monitoring — 24/7</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Your hotel got cheaper.<br />
              <span style={{ color: '#67e8f9' }}>We'll tell you first.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload your hotel booking voucher or search new hotels at wholesale rates. We monitor prices 24/7 and alert you via <strong className="text-white">WhatsApp</strong> the moment it drops.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mb-8">
              {[
                { num: '$2.4M+', label: 'Saved for customers' },
                { num: '18,400+', label: 'Vouchers monitored' },
                { num: '94%', label: 'Drop detection rate' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-white tabular-nums">{s.num}</div>
                  <div className="text-white/50 text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dual tab card */}
          <div className="flex-1 w-full max-w-md">
            <div className="glass rounded-2xl shadow-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab('track')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${activeTab === 'track' ? 'text-white' : 'text-white/50 hover:text-white/75'}`}
                  style={{ background: activeTab === 'track' ? '#2563eb' : 'rgba(255,255,255,0.05)', borderBottom: activeTab === 'track' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                >
                  <TrendingDown className="w-4 h-4" />
                  Track Price Drop
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${activeTab === 'search' ? 'text-white' : 'text-white/50 hover:text-white/75'}`}
                  style={{ background: activeTab === 'search' ? '#2563eb' : 'rgba(255,255,255,0.05)', borderBottom: activeTab === 'search' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Search className="w-4 h-4" />
                  Search Hotels
                </button>
              </div>

              {/* Track Tab */}
              {activeTab === 'track' && (
                <div className="p-6" style={{ background: 'rgba(255,255,255,0.97)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Price Alert 🔔</p>
                  <p className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Grand Hyatt Dubai</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-3" style={{ background: '#fee2e2' }}>
                      <p className="text-xs mb-1" style={{ color: '#64748b' }}>Booked at</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: '#dc2626', textDecoration: 'line-through' }}>$342</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>per night</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#dcfce7' }}>
                      <p className="text-xs mb-1" style={{ color: '#64748b' }}>Now available</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: '#16a34a' }}>$274</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>per night</p>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #0284c7)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-xs">Your potential savings</p>
                        <p className="text-2xl font-bold">$204 <span className="text-sm font-normal text-white/60">/ 3 nights</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-xs">WhatsApp sent</p>
                        <p className="text-sm font-semibold">Just now ✓</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/upload" className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload My Voucher — Free
                  </Link>
                  <p className="text-center text-xs mt-2" style={{ color: '#94a3b8' }}>No credit card · Free to monitor · Pay only when you save</p>
                </div>
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <div className="p-6" style={{ background: 'rgba(255,255,255,0.97)' }}>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#9ca3af' }}>Destination</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                        <input
                          type="text"
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          placeholder="City or hotel name"
                          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
                          onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff' }}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#9ca3af' }}>Check-in</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                          <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-xl text-sm outline-none"
                            style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#9ca3af' }}>Check-out</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                          <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-xl text-sm outline-none"
                            style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#9ca3af' }}>Guests</label>
                      <div className="relative">
                        <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                        <select value={guests} onChange={e => setGuests(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none appearance-none"
                          style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}>
                          <option value="1">1 Adult</option>
                          <option value="2">2 Adults</option>
                          <option value="3">3 Adults</option>
                          <option value="4">4 Adults</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Link href={`/search?destination=${destination}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                    className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" />
                    Search Hotels
                  </Link>

                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>Popular destinations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {popular.map(d => (
                        <button key={d} onClick={() => setDestination(d.split(' ')[0])}
                          className="text-xs px-2.5 py-1 rounded-full transition-colors"
                          style={{ background: '#f1f5f9', color: '#374151' }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#eff6ff'; (e.target as HTMLElement).style.color = '#1d4ed8' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = '#f1f5f9'; (e.target as HTMLElement).style.color = '#374151' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp preview */}
            <div className="mt-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: '#075e54' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#4ade80' }}>
                <span className="text-white text-xs font-bold">RQ</span>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>rebuq.com via WhatsApp</p>
                <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <p className="text-white text-xs leading-relaxed">
                    🏨 <strong>Price Drop!</strong> Grand Hyatt Dubai dropped from $342 → $274/night. Save $204 on 3 nights. Reply <strong>YES</strong> to rebook!
                  </p>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Just now · WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24" style={{ background: '#fff' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style={{ background: '#eff6ff', color: '#2563eb' }}>How It Works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#0f172a' }}>Hotel price drops happen every day.<br /><span style={{ color: '#2563eb' }}>Most travelers miss them.</span></h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#64748b' }}>Hotels constantly adjust their rates. rebuq catches every drop and puts the savings back in your pocket.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '01', icon: <Upload className="w-6 h-6" style={{ color: '#2563eb' }} />, bg: '#eff6ff', title: 'Upload Your Voucher', desc: 'Upload your hotel booking PDF or screenshot. Our AI reads the details automatically in seconds.' },
              { num: '02', icon: <Bell className="w-6 h-6" style={{ color: '#7c3aed' }} />, bg: '#ede9fe', title: '24/7 Price Monitoring', desc: 'Our bot checks the same hotel, room and dates across 50+ suppliers every few hours around the clock.' },
              { num: '03', icon: <Smartphone className="w-6 h-6" style={{ color: '#16a34a' }} />, bg: '#dcfce7', title: 'Instant WhatsApp Alert', desc: 'Price drops → WhatsApp + email alert instantly. Accept and we handle the full rebooking for you.' },
              { num: '04', icon: <TrendingDown className="w-6 h-6" style={{ color: '#d97706' }} />, bg: '#fef3c7', title: 'You Save, We Earn a Small Cut', desc: 'You keep 80% of the saving. We earn 20% only when we successfully save you money. No savings = no charge.' },
            ].map((step, i) => (
              <div key={i} className="rounded-2xl p-6 border transition-all hover:-translate-y-1" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.bg }}>
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Step {step.num}</span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl border" style={{ background: 'linear-gradient(to right, #f1f5f9, #fff)', borderColor: '#e2e8f0' }}>
          {[
            { num: '$2.4M+', label: 'Total customer savings' },
            { num: '94%', label: 'Price drop detection rate' },
            { num: '< 3 min', label: 'Avg alert delivery time' },
            { num: '18,400+', label: 'Vouchers monitored' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold tabular-nums" style={{ color: '#2563eb' }}>{s.num}</p>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24" style={{ background: '#fff' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style={{ background: '#eff6ff', color: '#2563eb' }}>Pricing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#0f172a' }}>Sign up and get your <span style={{ color: '#2563eb' }}>first year completely free</span></h2>
            <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: '#64748b' }}>No credit card required for Starter. Upgrade any time as your travel volume grows.</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
              <button onClick={() => setBilling('monthly')}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: billing === 'monthly' ? '#fff' : 'transparent', color: billing === 'monthly' ? '#0f172a' : '#64748b', boxShadow: billing === 'monthly' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                Monthly
              </button>
              <button onClick={() => setBilling('annual')}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                style={{ background: billing === 'annual' ? '#fff' : 'transparent', color: billing === 'annual' ? '#0f172a' : '#64748b', boxShadow: billing === 'annual' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                Annual
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#dcfce7', color: '#166534' }}>Save 26%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Starter */}
            <div className="rounded-2xl p-6 flex flex-col border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>Starter</h3>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>Perfect for occasional travelers with one upcoming booking to protect.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#0f172a' }}>$0</span>
                <span className="mb-1" style={{ color: '#94a3b8' }}>/ month</span>
              </div>
              <p className="text-xs font-semibold mb-4" style={{ color: '#16a34a' }}>✓ 1st Year Free — no card needed</p>
              <div className="space-y-2.5 flex-1 mb-6">
                {[
                  { text: '1 active voucher monitored', on: true },
                  { text: 'Email alerts on price drop', on: true },
                  { text: 'Price history dashboard', on: true },
                  { text: 'WhatsApp alerts', on: false },
                  { text: 'Multiple vouchers', on: false },
                  { text: 'Priority check frequency (5 min)', on: false },
                  { text: 'Savings analytics & reports', on: false },
                ].map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${!f.on ? 'line-through' : ''}`} style={{ color: f.on ? '#374151' : '#94a3b8' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: f.on ? '#16a34a' : '#d1d5db' }} />
                    {f.text}
                  </div>
                ))}
              </div>
              <Link href="/upload" className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all border-2" style={{ borderColor: '#2563eb', color: '#2563eb' }}>
                Start Free — No Card Needed
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-6 flex flex-col relative border-2" style={{ background: '#fff', borderColor: '#2563eb', boxShadow: '0 8px 32px rgba(37,99,235,0.12)' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full" style={{ background: '#2563eb' }}>Most Popular</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>Pro</h3>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>For frequent travelers who want full monitoring coverage and instant WhatsApp alerts.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#0f172a' }}>${prices.pro[billing]}</span>
                <span className="mb-1" style={{ color: '#94a3b8' }}>/ month</span>
              </div>
              {billing === 'annual' && <p className="text-xs font-semibold mb-4" style={{ color: '#16a34a' }}>✓ Save 26% with annual billing</p>}
              {billing === 'monthly' && <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>&nbsp;</p>}
              <div className="space-y-2.5 flex-1 mb-6">
                {['Up to 5 active vouchers', 'Email alerts on price drop', 'Price history dashboard', 'WhatsApp alerts', 'Multiple vouchers', 'Priority check frequency (5 min)', 'Savings analytics & reports'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/upload" className="btn-primary block w-full text-center py-3 rounded-xl text-sm">
                Start Pro — 14-Day Free Trial
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-2xl p-6 flex flex-col relative border" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full" style={{ background: '#f59e0b' }}>Best Value</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>Business</h3>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>For travel managers and high-frequency bookers who need complete savings automation.</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#0f172a' }}>${prices.business[billing]}</span>
                <span className="mb-1" style={{ color: '#94a3b8' }}>/ month</span>
              </div>
              {billing === 'annual' && <p className="text-xs font-semibold mb-4" style={{ color: '#16a34a' }}>✓ Save 26% with annual billing</p>}
              {billing === 'monthly' && <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>&nbsp;</p>}
              <div className="space-y-2.5 flex-1 mb-6">
                {['Unlimited active vouchers', 'Email alerts on price drop', 'Price history dashboard', 'WhatsApp alerts', 'Multiple vouchers', 'Priority check frequency (5 min)', 'Savings analytics & reports'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/upload" className="btn-primary block w-full text-center py-3 rounded-xl text-sm">
                Start Business Plan
              </Link>
            </div>
          </div>

          <p className="text-center text-sm mt-8" style={{ color: '#94a3b8' }}>
            All plans include our 20% commission model — you only pay when you actually save money.<br />
            <strong style={{ color: '#0f172a' }}>No savings = no commission = no charge.</strong>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style={{ background: '#eff6ff', color: '#2563eb' }}>Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#0f172a' }}>Real travelers, real savings</h2>
            <p className="text-lg" style={{ color: '#64748b' }}>Over 8,000 customers have already saved money on hotel bookings they thought were final.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Nair', role: 'Marketing Director, Mumbai', saved: '$366 saved', initials: 'PN', color: '#2563eb', text: '"Within 2 days of uploading my Maldives voucher, I got a WhatsApp from rebuq with a $366 saving. Completely effortless."' },
              { name: 'Carlos Mendoza', role: 'Consultant, Madrid', saved: '$1,200+ saved', initials: 'CM', color: '#7c3aed', text: '"Used rebuq for 3 trips this year. Each time it found a lower price. The WhatsApp alert is instant and the rebooking process was smooth."' },
              { name: 'Aisha Okonkwo', role: 'Travel Blogger, Lagos', saved: '$540 saved', initials: 'AO', color: '#16a34a', text: '"I upload every refundable booking now. It\'s found savings on 4 out of 5 bookings so far. Game changer for frequent travelers."' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border transition-all hover:-translate-y-1" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400" style={{ color: '#fbbf24' }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: '#475569' }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{t.role}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>{t.saved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-24" style={{ background: '#fff' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style={{ background: '#eff6ff', color: '#2563eb' }}>Why Trust Us</span>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#0f172a' }}>Built for travelers who value their money</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Smartphone className="w-6 h-6" style={{ color: '#16a34a' }} />, bg: '#dcfce7', title: 'WhatsApp First', desc: 'Alerts via WhatsApp — the app you use every day. No new app to download.' },
              { icon: <Shield className="w-6 h-6" style={{ color: '#2563eb' }} />, bg: '#eff6ff', title: 'Zero Risk', desc: 'Your original booking stays intact until you confirm. We never cancel without your approval.' },
              { icon: <TrendingDown className="w-6 h-6" style={{ color: '#7c3aed' }} />, bg: '#ede9fe', title: 'Pay Only When You Save', desc: 'Our 20% commission only applies when we find you a lower price. No savings = no charge.' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-6 border text-center transition-all hover:-translate-y-1" style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8" style={{ opacity: 0.5 }}>
            {['SSL Encrypted', 'GDPR Compliant', 'Google OAuth', 'WhatsApp Business API', '99.9% Uptime'].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748b' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#16a34a' }} />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style={{ background: '#eff6ff', color: '#2563eb' }}>FAQ</span>
            <h2 className="text-3xl font-extrabold" style={{ color: '#0f172a' }}>Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How is rebuq different from Booking.com?', a: 'rebuq offers two things Booking.com doesn\'t: automatic price drop monitoring on your existing bookings with WhatsApp alerts, and wholesale hotel rates for new bookings that are cheaper than OTAs.' },
              { q: 'Is my original booking safe?', a: 'Absolutely. We never touch your original booking. It stays confirmed until you explicitly agree to rebook at the lower price.' },
              { q: 'How do you find lower prices?', a: 'We use Hotelbeds — the world\'s largest hotel wholesaler used by 60,000+ travel agencies worldwide at rates the public can\'t normally access.' },
              { q: 'Which platforms do you support?', a: 'Any refundable booking — Booking.com, MakeMyTrip, Expedia, Agoda, Yatra, or direct hotel bookings.' },
              { q: 'What if no price drop is found?', a: 'Nothing happens. Your original booking stays as is. Monitoring is completely free — you only pay when we save you money.' },
              { q: 'How quickly do I get alerted?', a: 'Our bot checks every 6 hours. The moment a drop is found, you get a WhatsApp message and email instantly.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl p-5 border cursor-pointer transition-all"
                style={{ background: '#fff', borderColor: faqOpen === i ? '#bfdbfe' : '#e2e8f0' }}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>{faq.q}</p>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} style={{ color: '#94a3b8' }} />
                </div>
                {faqOpen === i && (
                  <p className="text-sm leading-relaxed mt-3 pt-3" style={{ color: '#64748b', borderTop: '1px solid #f1f5f9' }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="gradient-hero py-24">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Your next hotel booking<br />just got cheaper.</h2>
          <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">Free to start. No credit card. We only earn when we save you money.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload" className="inline-flex items-center gap-2 bg-white font-bold text-base px-8 py-4 rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ color: '#1d4ed8' }}>
              <Upload className="w-5 h-5" />
              Upload My Voucher — Free
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              <Search className="w-5 h-5" />
              Search Hotels
            </Link>
          </div>
          <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Joins 18,400+ travelers already saving · No credit card needed</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111827', color: '#fff' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563eb' }}>
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-xl">rebuq</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>.com</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>We monitor your hotel bookings 24/7 and alert you the moment the price drops. You save money, we earn a small commission. Simple.</p>
              <div className="flex gap-4 mt-6">
                {['Twitter', 'LinkedIn', 'Instagram'].map(s => (
                  <a key={s} href="#" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>{s}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Product</p>
              <ul className="space-y-3">
                {['How It Works', 'Pricing', 'Dashboard', 'Search Hotels'].map(l => (
                  <li key={l}><a href="#" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Legal</p>
              <ul className="space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Commission Policy', 'Contact Us'].map(l => (
                  <li key={l}><a href="#" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 rebuq.com. All rights reserved.</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Built to help travelers keep more of their money. 🇮🇳</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
