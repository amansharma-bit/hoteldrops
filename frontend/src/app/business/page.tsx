 export const dynamic = 'force-dynamic';

export default function BusinessLandingPage() {
  return (
    <div className="bg-white text-[#0F172A] antialiased">

      {/* NAV + HERO (blue gradient) */}
      <section
        style={{ background: 'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)' }}
      >
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="#" className="font-extrabold text-xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            rebuq<span className="text-[#FCD34D]">.AI</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#capabilities" className="hover:text-white transition-colors">Features</a>
            <a href="#process" className="hover:text-white transition-colors">How It Works</a>
            <a href="#technology" className="hover:text-white transition-colors">Technology</a>
            <a href="#demo" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <a href="#demo" className="font-semibold text-sm px-5 py-2.5 rounded-full bg-white text-[#1447b8] hover:bg-white/90 transition-colors">
            Get a Demo →
          </a>
        </header>

        <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest text-white uppercase bg-white/10 border border-white/25 rounded-full px-4 py-2 mb-7">
              Built &amp; validated on real production data
            </span>
            <h1
              className="font-extrabold text-5xl leading-[1.08] mb-6 text-white"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Maximize Hotel
              <br />
              Booking Margins
              <br />
              <span className="text-[#FCD34D]">Automatically.</span>
            </h1>
            <p className="text-white/85 text-lg leading-relaxed mb-9 max-w-md">
              rebuq.AI monitors rates across your existing suppliers post-booking, matches the exact same
              room at a lower price, and captures the margin — without the traveler ever noticing a thing.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <a href="#demo" className="font-semibold text-sm px-7 py-3.5 rounded-full bg-white text-[#1447b8] hover:bg-white/90 transition-colors">
                Request a Demo →
              </a>
              <a href="#process" className="font-semibold text-sm px-7 py-3.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors">
                See How It Works
              </a>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs font-medium text-white/90 border border-white/25 rounded-full px-3.5 py-2">✓ Enterprise-grade API</span>
              <span className="text-xs font-medium text-white/90 border border-white/25 rounded-full px-3.5 py-2">✓ Zero traveler disruption</span>
              <span className="text-xs font-medium text-white/90 border border-white/25 rounded-full px-3.5 py-2">✓ Fully automated</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 text-[#0F172A]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Live Repricing Engine</p>
                <p className="font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>Validated Performance</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE ON GRN
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>98.86%</p>
                <p className="text-xs text-slate-500 mt-1">System reliability</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#B8860B' }}>~7%</p>
                <p className="text-xs text-slate-500 mt-1">Avg. saving per rebooking</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>98.6%</p>
                <p className="text-xs text-slate-500 mt-1">Same-supplier match rate</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#B8860B' }}>10.7%</p>
                <p className="text-xs text-slate-500 mt-1">Conversion, scaling to 15%</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">A real rebooking</p>
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
              <div>
                <p className="text-sm font-semibold">COMO Metropolitan Singapore</p>
                <p className="text-xs text-slate-500">Standard Twin Room · $810 → $772</p>
              </div>
              <span className="text-sm font-bold text-emerald-600" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>−$38</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-extrabold text-4xl" style={{ fontFamily: 'Sora, sans-serif', color: '#B8860B' }}>~7%</p>
            <p className="text-sm text-slate-500 mt-2">Average saving per rebooking</p>
          </div>
          <div>
            <p className="font-extrabold text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>98.86%</p>
            <p className="text-sm text-slate-500 mt-2">System reliability</p>
          </div>
          <div>
            <p className="font-extrabold text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>98.6%</p>
            <p className="text-sm text-slate-500 mt-2">Same-supplier match rate</p>
          </div>
          <div>
            <p className="font-extrabold text-4xl" style={{ fontFamily: 'Sora, sans-serif', color: '#B8860B' }}>10.7%</p>
            <p className="text-sm text-slate-500 mt-2">Current conversion, scaling to 15%</p>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="capabilities" className="max-w-7xl mx-auto px-6 py-24">
        <span className="inline-block text-xs font-bold tracking-widest text-[#1447b8] uppercase bg-[#1447b8]/5 border border-[#1447b8]/20 rounded-full px-4 py-2 mb-6">
          Core Capabilities
        </span>
        <h2 className="font-extrabold text-4xl mb-14 max-w-xl" style={{ fontFamily: 'Sora, sans-serif' }}>
          Every lever for maximum margin.
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl p-8 md:col-span-2" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Same-Supplier Rate Matching</h3>
            <p className="text-slate-600 leading-relaxed max-w-2xl">
              Rechecks rates against the exact same supplier the booking was made with — never a downgrade,
              never a guessed substitution. This is the matching rule validated against real GRN production
              data, holding at a 98.6% same-supplier rate in practice.
            </p>
          </div>
          <div className="rounded-2xl p-8" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Expanded Post-Booking Savings</h3>
            <p className="text-slate-600 leading-relaxed">Rechecks rates across your existing supplier relationships to find the same room at a lower price, automatically, post-confirmation.</p>
          </div>
          <div className="rounded-2xl p-8" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Verified Match Guarantee</h3>
            <p className="text-slate-600 leading-relaxed">Matches identical room type and board basis before ever proposing a swap. If it isn&apos;t a genuine like-for-like match, it&apos;s skipped — never a downgrade.</p>
          </div>
          <div className="rounded-2xl p-8" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Safety-First Cancellation Logic</h3>
            <p className="text-slate-600 leading-relaxed">Only refundable, in-window bookings are ever touched. Cancellation terms are never made worse to chase a saving.</p>
          </div>
          <div className="rounded-2xl p-8" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Full Audit Trail</h3>
            <p className="text-slate-600 leading-relaxed">Every stage — search, match, recheck, rebook, confirm, cancel — logged and auditable, with the same rigor as an enterprise finance tool.</p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div
            className="rounded-2xl p-8 flex items-center justify-between flex-wrap gap-6 mb-16"
            style={{ background: 'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)' }}
          >
            <p className="font-bold text-2xl max-w-lg text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Fully automated margin expansion — powered by <span className="text-[#FCD34D]">real, validated logic.</span>
            </p>
            <a href="#demo" className="font-semibold text-sm px-6 py-3 rounded-full bg-white text-[#1447b8] whitespace-nowrap">
              Get a Demo →
            </a>
          </div>

          <span className="inline-block text-xs font-bold tracking-widest text-[#1447b8] uppercase mb-4">The Process</span>
          <h2 className="font-extrabold text-4xl mb-14" style={{ fontFamily: 'Sora, sans-serif' }}>
            From booking to profit
            <br />
            <span className="text-slate-400">in six steps.</span>
          </h2>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">
            {[
              { n: '01', t: 'Search', d: 'Re-shops every eligible booking against live rates.', gold: false },
              { n: '02', t: 'Match', d: 'Same supplier, same room, same board basis.', gold: false },
              { n: '03', t: 'Verify', d: 'Rechecks the rate live — never acts on stale prices.', gold: false },
              { n: '04', t: 'Rebook', d: 'Moves the reservation to the lower rate instantly.', gold: true },
              { n: '05', t: 'Confirm', d: 'Locks in the new booking before anything else moves.', gold: true },
              { n: '06', t: 'Release', d: 'Cancels the original — free, inside its window.', gold: true },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-xl border border-slate-200 p-5">
                <p
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: 'IBM Plex Mono, monospace', color: step.gold ? '#B8860B' : '#1447b8' }}
                >
                  {step.n}
                </p>
                <h3 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{step.t}</h3>
                <p className="text-sm text-slate-500">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section id="technology" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase rounded-full px-4 py-2 mb-6"
              style={{ color: '#B8860B', background: '#FEF3C7', border: '1px solid #FDE68A' }}
            >
              Enterprise Technology
            </span>
            <h2 className="font-extrabold text-4xl mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
              Built on real infrastructure.
              <br />
              <span style={{ color: '#B8860B' }}>Not a slide deck.</span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8 max-w-md">
              rebuq.AI is built on GRN Connect&apos;s hotel API — the same production system used by India&apos;s
              second-largest hotel wholesaler. Every endpoint, every match, every rebooking in this deck is
              real, not simulated.
            </p>
            <div className="space-y-4">
              <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <div className="w-10 h-10 rounded-lg bg-[#1447b8]/10 flex items-center justify-center text-lg">🔗</div>
                <div>
                  <p className="font-semibold">Real Supplier Integration</p>
                  <p className="text-sm text-slate-500">Live on GRN Connect&apos;s production booking API</p>
                </div>
              </div>
              <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <div className="w-10 h-10 rounded-lg bg-[#1447b8]/10 flex items-center justify-center text-lg">🛡️</div>
                <div>
                  <p className="font-semibold">Safety-Gated Automation</p>
                  <p className="text-sm text-slate-500">Dry-run validation before any live action, every time</p>
                </div>
              </div>
              <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: '#F5F8FF', border: '1px solid #E2E8F0' }}>
                <div className="w-10 h-10 rounded-lg bg-[#1447b8]/10 flex items-center justify-center text-lg">📊</div>
                <div>
                  <p className="font-semibold">Transparent Reporting</p>
                  <p className="text-sm text-slate-500">Full audit trails and margin attribution dashboards</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-white/50" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>GRN production pipeline</span>
            </div>
            <div className="text-sm leading-relaxed text-white/90 space-y-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <p><span className="text-[#FCD34D]">POST</span> /hotels/availability</p>
              <p className="text-white/50 pl-4">→ search live rates, same hotel/dates</p>
              <p><span className="text-[#FCD34D]">POST</span> /hotels/rebookings/{'{ref}'}</p>
              <p className="text-white/50 pl-4">→ tie new rate to existing booking</p>
              <p><span className="text-[#FCD34D]">DELETE</span> /hotels/bookings/{'{ref}'}</p>
              <p className="text-white/50 pl-4">→ cancel original, $0 charge</p>
              <p className="mt-4 text-emerald-300">// Real result</p>
              <p>{'{ '}<span className="text-[#FCD34D]">&quot;saving&quot;</span>: 38.00, <span className="text-[#FCD34D]">&quot;pct&quot;</span>: 4.69{' }'}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="font-bold text-lg text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>98.86%</p>
                <p className="text-xs text-white/60">Reliability</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="font-bold text-lg text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>6</p>
                <p className="text-xs text-white/60">Pipeline stages</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="font-bold text-lg text-[#FCD34D]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>$0</p>
                <p className="text-xs text-white/60">Cancellation cost</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1447b8] uppercase mb-6">Who We Serve</span>
          <div className="flex flex-wrap items-start justify-between gap-8 mb-14">
            <h2 className="font-extrabold text-4xl max-w-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              Built for hotel wholesalers and travel platforms.
            </h2>
            <p className="text-slate-500 max-w-sm">rebuq.AI integrates directly into your existing GRN-connected booking flow — no new supplier relationships needed.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: '✈️', t: 'Online Travel Agencies', s: 'OTAs' },
              { icon: '🏨', t: 'Hotel Wholesalers', s: 'Bed Banks' },
              { icon: '💼', t: 'Travel Management', s: 'TMCs' },
              { icon: '🗺️', t: 'Tour Operators', s: 'Tour Ops' },
              { icon: '🌐', t: 'Travel Agencies', s: 'Agencies' },
              { icon: '📍', t: 'DMCs', s: 'Destination Mgmt.' },
            ].map((seg) => (
              <div key={seg.t} className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <div className="text-3xl mb-3">{seg.icon}</div>
                <p className="font-semibold">{seg.t}</p>
                <p className="text-xs text-slate-400 mt-1">{seg.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CTA */}
      <section
        id="demo"
        style={{ background: 'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-10">
          <div>
            <span className="inline-block text-xs font-bold tracking-widest text-white uppercase bg-white/10 border border-white/25 rounded-full px-4 py-2 mb-7">
              Get Started
            </span>
            <h2 className="font-extrabold text-4xl mb-6 text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              See it work on
              <br />
              <span className="text-[#FCD34D]">your own bookings.</span>
            </h2>
            <p className="text-white/80 leading-relaxed mb-8">
              Leave your details and we&apos;ll walk you through exactly how rebuq.AI performs on real GRN
              production data — no fabricated numbers, no simulated demo.
            </p>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-white/85"><span className="text-[#FCD34D]">✓</span> No setup fees</p>
              <p className="flex items-center gap-2 text-sm text-white/85"><span className="text-[#FCD34D]">✓</span> See real validated data, not a mockup</p>
              <p className="flex items-center gap-2 text-sm text-white/85"><span className="text-[#FCD34D]">✓</span> Dedicated onboarding</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-10 text-[#0F172A]">
            <h3 className="font-extrabold text-2xl mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>Request a Demo</h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: wire up to real lead-capture endpoint
              }}
            >
              <input type="text" placeholder="Full Name *" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-[#1447b8] outline-none" />
              <input type="email" placeholder="Work Email *" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-[#1447b8] outline-none" />
              <input type="text" placeholder="Company Name *" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-[#1447b8] outline-none" />
              <input type="text" placeholder="Type of Company" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-[#1447b8] outline-none" />
              <textarea placeholder="Tell us about your booking volume and goals (optional)" rows={3} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-[#1447b8] outline-none" />
              <button type="submit" className="w-full font-semibold text-sm py-3.5 rounded-lg bg-[#1447b8] text-white hover:bg-[#1447b8]/90 transition-colors">
                Request Demo →
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-400">© 2026 rebuq.AI</div>
      </footer>

    </div>
  );
}
