'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase-client';

const KEYFRAMES = `
@keyframes rebuqFlow {
  0%   { transform: translate(-10%, -10%) rotate(0deg)   scale(1.2); }
  33%  { transform: translate(8%, 5%)     rotate(120deg) scale(1.35); }
  66%  { transform: translate(-5%, 8%)    rotate(240deg) scale(1.25); }
  100% { transform: translate(-10%, -10%) rotate(360deg) scale(1.2); }
}
@keyframes rebuqFlow2 {
  0%   { transform: translate(10%, 10%)   rotate(0deg)   scale(1.3); }
  50%  { transform: translate(-8%, -6%)   rotate(180deg) scale(1.15); }
  100% { transform: translate(10%, 10%)   rotate(360deg) scale(1.3); }
}
@keyframes rebuqRise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inject keyframes at runtime — cannot be stripped by the Next build.
  useEffect(() => {
    if (document.getElementById('rebuq-login-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'rebuq-login-keyframes';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);

  async function handleSignIn() {
    setError(null);
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(error.message || 'Sign-in failed. Check your details.'); setLoading(false); return; }
      router.push('/business/overview');
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setLoading(false);
    }
  }

  const blobBase: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', willChange: 'transform' };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", background: '#0a1a3f' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* flowing color blobs — keyframes injected at runtime via useEffect */}
      <div style={{ ...blobBase, width: '55vw', height: '55vw', top: '-15%', left: '-10%', opacity: 0.55, background: 'radial-gradient(circle, #1560c9 0%, #0F52BA 45%, transparent 70%)', animation: 'rebuqFlow 22s ease-in-out infinite' }} />
      <div style={{ ...blobBase, width: '50vw', height: '50vw', bottom: '-15%', right: '-10%', opacity: 0.55, background: 'radial-gradient(circle, #3b3bdb 0%, #2a2a9c 45%, transparent 70%)', animation: 'rebuqFlow2 26s ease-in-out infinite' }} />
      <div style={{ ...blobBase, width: '35vw', height: '35vw', top: '40%', left: '55%', opacity: 0.28, background: 'radial-gradient(circle, #FCD34D 0%, #d9a616 40%, transparent 68%)', animation: 'rebuqFlow 30s ease-in-out infinite reverse' }} />
      <div style={{ ...blobBase, width: '40vw', height: '40vw', top: '10%', left: '30%', opacity: 0.4, background: 'radial-gradient(circle, #0F52BA 0%, transparent 68%)', animation: 'rebuqFlow2 20s ease-in-out infinite' }} />

      {/* subtle dark vignette for card contrast */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(6,16,45,0.55) 100%)' }} />

      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 2, width: 'min(92vw, 400px)',
        background: 'rgba(255,255,255,0.98)', borderRadius: 18,
        boxShadow: '0 24px 70px rgba(6,16,45,0.45), 0 2px 8px rgba(6,16,45,0.2)',
        padding: '40px 36px', animation: 'rebuqRise 0.6s ease both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#0F172A' }}>rebuq<span style={{ color: '#FCD34D' }}>.</span></span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8' }}>Business</span>
        </div>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 28 }}>Sign in to your rebooking console.</p>

        {/* Email */}
        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
          placeholder="you@company.com"
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#0F172A', outline: 'none', marginBottom: 18, fontFamily: 'inherit', transition: 'border 0.15s' }}
          onFocus={(e) => (e.currentTarget.style.border = '1px solid #0F52BA')}
          onBlur={(e) => (e.currentTarget.style.border = '1px solid #E2E8F0')}
        />

        {/* Password */}
        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Password</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
          placeholder="••••••••"
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#0F172A', outline: 'none', marginBottom: 20, fontFamily: 'inherit', transition: 'border 0.15s' }}
          onFocus={(e) => (e.currentTarget.style.border = '1px solid #0F52BA')}
          onBlur={(e) => (e.currentTarget.style.border = '1px solid #E2E8F0')}
        />

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: '#DC2626', marginBottom: 16 }}>{error}</div>
        )}

        {/* Sign in */}
        <button
          onClick={handleSignIn} disabled={loading}
          style={{ width: '100%', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: loading ? 'wait' : 'pointer', background: loading ? '#3b6fb0' : '#0F52BA', transition: 'background 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#0c449c')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#0F52BA')}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', marginTop: 20 }}>Access is limited to approved GRN partners.</p>
      </div>
    </div>
  );
}
