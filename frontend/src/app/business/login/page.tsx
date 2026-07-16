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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#1447b8' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/business" className="inline-flex items-baseline gap-1">
            <span className="font-extrabold text-2xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              rebuq<span className="text-[#FCD34D]">.</span>
            </span>
          </a>
        </div>

        <div className="bg-white rounded-2xl px-8 py-10">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0F172A] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0F172A] mb-2">
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
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-slate-400 focus:border-[#1447b8] outline-none transition-all"
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
              className="w-full font-semibold text-sm py-3.5 rounded-lg text-[#0F172A] hover:opacity-90 transition-opacity mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#FCD34D' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign in</>
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-sm text-white/70">
          Need access?
          <a href="mailto:business@rebuq.com" className="font-medium text-[#FCD34D] hover:text-[#FCD34D]/80 transition-colors">
            Contact us
          </a>
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
