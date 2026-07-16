'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase-client';

export default function BusinessLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Incorrect email or password.');
      setLoading(false);
      return;
    }
    router.push('/business/overview');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* LEFT: brand panel */}
      <div
        className="relative flex flex-col justify-between px-10 lg:px-14 py-12 min-h-[320px] lg:min-h-screen overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%)',
        }}
      >
        {/* Subtle grid texture, same pattern used on the cover deck slides */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10">
          <a href="/business" className="flex items-baseline gap-2 mb-1">
            <span className="font-extrabold text-2xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              rebuq<span className="text-[#FCD34D]">.</span>
            </span>
          </a>
          <p className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-14">
            Business Console
          </p>

          <h1
            className="font-extrabold text-4xl lg:text-[2.8rem] leading-[1.12] text-white mb-6 max-w-xl"
            style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}
          >
            Real bookings.
            <br />
            <span style={{ color: '#FCD34D' }}>Real savings.</span>
            <br />
            Live, right now.
          </h1>
          <p className="text-white/70 leading-relaxed max-w-sm mb-10">
            Direct access to your GRN booking book — real-time rates, live
            repricing, and every saving found, backed by a real API
            connection, not a spreadsheet.
          </p>

          {/* Real, live-feeling stat row instead of a generic bullet list */}
          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6 max-w-md">
            <div>
              <div className="font-extrabold text-2xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>80K+</div>
              <div className="text-xs text-white/50 mt-1">Live bookings tracked</div>
            </div>
            <div>
              <div className="font-extrabold text-2xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Real-time</div>
              <div className="text-xs text-white/50 mt-1">GRN API connection</div>
            </div>
            <div>
              <div className="font-extrabold text-2xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Secured</div>
              <div className="text-xs text-white/50 mt-1">Invite-only access</div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">© 2026 rebuq. Business partners only.</p>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center px-6 py-16 bg-white">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-extrabold text-2xl text-[#0F172A]" style={{ fontFamily: 'Sora, sans-serif' }}>
              Welcome back
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D]" />
          </div>
          <p className="text-sm text-slate-500 mb-8">Sign in to the rebuq business console</p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#0F172A] mb-2">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] focus:ring-2 focus:ring-[#1447b8]/10 outline-none transition-all"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] focus:ring-2 focus:ring-[#1447b8]/10 outline-none transition-all"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-sm py-3.5 rounded-lg bg-[#1447b8] text-white hover:bg-[#0f3a94] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Access Business Console →</>
              )}
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
