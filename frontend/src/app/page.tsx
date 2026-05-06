'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Upload, Bell, ArrowRight, CheckCircle, Star, ChevronDown, Zap, Shield, Smartphone } from 'lucide-react'

export default function HomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HD</span>
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">HotelDrops</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-white/80 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-white/80 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-white/80 hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-600 text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                Sign In
              </Link>
              <Link href="/upload" className="btn-primary text-sm px-5 py-2.5">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="gradient-hero min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-10 py-20 flex flex-col lg:flex-row items-center gap-16">
          {/* Left text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="pulse-dot" />
              <span className="text-white/90 text-sm font-500">Live price monitoring — 24/7</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-800 text-white leading-tight mb-6">
              Your hotel got cheaper.<br />
              <span className="text-cyan-300">We'll tell you first.</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload your hotel booking voucher. HotelDrops monitors the price 24/7 and alerts you via <strong className="text-white">WhatsApp</strong> the moment it drops — you keep the savings.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link href="/upload" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
                <Upload className="w-5 h-5" />
                Upload My Voucher
              </Link>
              <a href="#how-it-works" className="text-white/80 hover:text-white text-sm font-500 flex items-center gap-1 underline underline-offset-4 transition-colors">
                See how it works
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
              {[
                { num: '₹2.4Cr+', label: 'Saved for customers' },
                { num: '18,400+', label: 'Vouchers monitored' },
                { num: '94%',     label: 'Drop detection rate' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-700 text-white tabular-nums">{s.num}</div>
                  <div className="text-white/50 text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live alert card */}
          <div className="flex-1 w-full max-w-md animate-slide-up">
            <div className="glass rounded-2xl p-6 shadow-modal">
              {/* Alert card header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-500 text-gray-500 uppercase tracking-wide">Price Alert 🔔</p>
                  <p className="text-base font-700 text-gray-900 mt-0.5">Taj Mahal Palace, Mumbai</p>
                </div>
                <span className="badge badge-drop flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Price Dropped!
                </span>
              </div>

              {/* Price comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">You booked at</p>
                  <p className="text-2xl font-700 text-red-500 line-through tabular-nums">₹18,500</p>
                  <p className="text-xs text-gray-400 mt-0.5">per night</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">We found</p>
                  <p className="text-2xl font-700 text-green-600 tabular-nums">₹14,200</p>
                  <p className="text-xs text-gray-400 mt-0.5">per night</p>
                </div>
              </div>

              {/* Offer */}
              <div className="bg-blue-600 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-500">Our offer to you</p>
                    <p className="text-white text-xl font-700 tabular-nums">₹16,350</p>
                    <p className="text-blue-200 text-xs mt-0.5">You save ₹2,150 per night 🎉</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs">3 nights</p>
                    <p className="text-white text-lg font-700 tabular-nums">₹6,450</p>
                    <p className="text-blue-200 text-xs">total saving</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-green-600 text-white text-sm font-600 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                  Yes, rebook! ✓
                </button>
                <button className="flex-1 border border-gray-200 text-gray-600 text-sm font-500 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Not now
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                Offer valid for 24 hours · Same hotel · Same room · Same dates
              </p>
            </div>

            {/* WhatsApp preview */}
            <div className="mt-4 bg-[#075e54] rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-700">HD</span>
              </div>
              <div>
                <p className="text-white/80 text-xs font-500 mb-1">HotelDrops via WhatsApp</p>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <p className="text-white text-xs leading-relaxed">
                    🏨 <strong>Price Drop Alert!</strong> Your Taj Mahal Palace booking just got cheaper.<br/>
                    Save ₹6,450 on 3 nights. Reply <strong>YES</strong> to rebook now!
                  </p>
                </div>
                <p className="text-white/40 text-xs mt-1">Just now · WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-700 uppercase tracking-widest text-primary-600 mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-800 text-gray-900 mb-4">Three steps. Zero effort.</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">You do nothing after uploading. We handle the monitoring, alerts and rebooking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Upload className="w-6 h-6 text-blue-600" />,
                bg: 'bg-blue-50',
                step: '01',
                title: 'Upload your voucher',
                desc: 'Upload your hotel booking PDF or screenshot. Our AI reads the hotel name, dates, room type and price automatically.',
              },
              {
                icon: <Bell className="w-6 h-6 text-purple-600" />,
                bg: 'bg-purple-50',
                step: '02',
                title: 'We monitor 24/7',
                desc: 'Our bot checks the price for the exact same hotel, room and dates every few hours — across multiple sources.',
              },
              {
                icon: <Zap className="w-6 h-6 text-green-600" />,
                bg: 'bg-green-50',
                step: '03',
                title: 'Price drops → You save',
                desc: 'The moment price drops, we WhatsApp and email you with our offer. Accept and we handle the rebooking for you.',
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${step.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-xs font-700 text-gray-400 mb-1">Step {step.step}</p>
                      <h3 className="font-700 text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 z-10">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-700 uppercase tracking-widest text-primary-600 mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-800 text-gray-900 mb-4">We only earn when you save</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Zero upfront cost. Zero subscription. We take 50% of the saving — you keep the other 50%.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card border-2 border-primary-200 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-700 px-4 py-1 rounded-full">
                Simple & Transparent
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">You originally paid</p>
                  <p className="text-3xl font-800 text-gray-900">₹20,000</p>
                </div>
                <div className="border-x border-gray-100 px-8">
                  <p className="text-sm text-gray-500 mb-2">We find it for</p>
                  <p className="text-3xl font-800 text-green-600">₹18,000</p>
                  <p className="text-xs text-gray-400 mt-1">₹2,000 saving found</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">We offer you</p>
                  <p className="text-3xl font-800 text-primary-600">₹19,000</p>
                  <p className="text-xs text-gray-400 mt-1">You save ₹1,000 · We earn ₹1,000</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Free to upload',
                  'Free monitoring',
                  'Free WhatsApp alerts',
                  'Pay only when you save',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-24 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-700 uppercase tracking-widest text-primary-600 mb-3">Why Trust Us</p>
            <h2 className="text-3xl md:text-4xl font-800 text-gray-900">Built for Indian travelers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Smartphone className="w-6 h-6 text-green-600" />, bg: 'bg-green-50', title: 'WhatsApp First', desc: 'Alerts via WhatsApp — the app you already use. No new app to download.' },
              { icon: <Shield className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50', title: 'Zero Risk', desc: 'Your original booking stays intact until you confirm the new one. 100% safe.' },
              { icon: <Star className="w-6 h-6 text-yellow-500" />, bg: 'bg-yellow-50', title: 'Works with all hotels', desc: 'Booking.com, MakeMyTrip, Expedia, Agoda, direct hotel bookings — we handle all.' },
            ].map((item, i) => (
              <div key={i} className="card text-center">
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {item.icon}
                </div>
                <h3 className="font-700 text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-700 uppercase tracking-widest text-primary-600 mb-3">FAQ</p>
            <h2 className="text-3xl font-800 text-gray-900">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Is my original booking safe?', a: 'Absolutely. We never touch your original booking. It stays confirmed until you explicitly agree to rebook at the lower price.' },
              { q: 'Which hotels do you support?', a: 'Any refundable hotel booking — from Booking.com, MakeMyTrip, Expedia, Agoda, Yatra, or direct hotel bookings. As long as it\'s refundable, we can track it.' },
              { q: 'How do you find lower prices?', a: 'We use multiple hotel APIs to check the same hotel, same room type, same dates across different suppliers. Hotel prices fluctuate constantly — we catch those drops.' },
              { q: 'What if no price drop is found?', a: 'Absolutely nothing happens. Your original booking stays as is. You paid nothing and lost nothing.' },
              { q: 'How quickly do I get alerted?', a: 'Our bot checks every 6 hours. The moment a drop is found, you get a WhatsApp message and email instantly.' },
              { q: 'Is the 50% split always fixed?', a: 'The split can vary. Our goal is to always make sure you save meaningfully — sometimes we may give you more of the saving, sometimes less, depending on the deal.' },
            ].map((faq, i) => (
              <div key={i} className="card cursor-pointer" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <p className="font-600 text-gray-900 text-sm">{faq.q}</p>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-4 ${faqOpen === i ? 'rotate-180' : ''}`} />
                </div>
                {faqOpen === i && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="gradient-hero py-24">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-800 text-white mb-4">
            Your next hotel booking<br />just got cheaper.
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
            Free to start. No credit card. We only earn when we save you money.
          </p>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-primary-700 font-700 text-base px-8 py-4 rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150">
            <Upload className="w-5 h-5" />
            Upload My Voucher — It's Free
          </Link>
          <p className="text-white/40 text-sm mt-4">Joins 18,400+ travelers already saving</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">HD</span>
                </div>
                <span className="font-800 text-lg">HotelDrops</span>
              </div>
              <p className="text-white/40 text-sm">We monitor your hotel bookings 24/7 and alert you the moment the price drops.</p>
            </div>
            <div className="flex gap-8 text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/30 text-sm">
            © 2026 HotelDrops. All rights reserved. · Made with ❤️ in India
          </div>
        </div>
      </footer>

    </div>
  )
}
