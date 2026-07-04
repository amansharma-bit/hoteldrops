'use client';

import { useState } from 'react';

export default function BusinessLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* LEFT: brand panel */}
      <div
        className="relative flex flex-col justify-between px-10 lg:px-14 py-12 min-h-[320px] lg:min-h-screen"
        style={{
          background:
            'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)',
        }}
      >
        <div>
          <a href="/business" className="flex items-baseline gap-2 mb-1">
            <span
              className="font-extrabold text-2xl text-white"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              rebuq<span className="text-[#FCD34D]">.</span>
            </span>
          </a>
          <p className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-14">
            Business Console
          </p>

          <h1
            className="font-extrabold text-4xl lg:text-[2.6rem] leading-[1.12] text-white mb-6 max-w-xl"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Track every booking.
            <br />
            Catch every drop.
            <br />
            Keep the margin.
          </h1>
          <p className="text-white/70 leading-relaxed max-w-sm mb-10">
            The rebuq Business console — see every booking that&apos;s been
            automatically rebooked, exactly how much you saved, and what
            needs your attention.
          </p>

          <ul className="space-y-4">
            {[
              'Live rebooking dashboard',
              'Per-client margin tracking',
              'Real-time price drop alerts',
              'Secure, API-key gated access',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">© 2026 rebuq. Business partners only.</p>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center px-6 py-16 bg-white">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-1">
            <h2
              className="font-extrabold text-2xl text-[#0F172A]"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Business Sign In
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D]" />
          </div>
          <p className="text-sm text-slate-500 mb-8">rebuq business console</p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: wire up to real auth endpoint
            }}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#0F172A] mb-2">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#0F172A] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <EyeIcon />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="apikey" className="block text-sm font-semibold text-[#0F172A] mb-2">
                GRN API Key
              </label>
              <div className="relative">
                <input
                  id="apikey"
                  type={showApiKey ? 'text' : 'password'}
                  required
                  placeholder="GRN-XXXX-XXXX"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  aria-label="Toggle API key visibility"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <EyeIcon />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Used only to read your booking book. Never shared.
              </p>
            </div>

            <button
              type="submit"
              className="w-full font-semibold text-sm py-3.5 rounded-lg bg-[#1447b8] text-white hover:bg-[#1447b8]/90 transition-colors mt-2"
            >
              Access Business Console →
            </button>
          </form>

          <div className="flex items-center justify-between mt-8">
            <a href="/business" className="text-sm text-slate-500 hover:text-[#0F172A] transition-colors">
              ← Back to home
            </a>
            <a
              href="mailto:business@rebuq.com"
              className="text-sm font-medium text-[#1447b8] hover:text-[#1447b8]/80 transition-colors"
            >
              Request access →
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
