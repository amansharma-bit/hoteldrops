'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase-client';

const SAPPHIRE = '#0F52BA';
const SAPPHIRE_DEEP = '#0c449c';
const NAVY = '#0F172A';
const GOLD = '#FCD34D';
const SLATE = '#64748B';
const LINE = '#E2E8F0';

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* LEFT — sapphire brand panel */}
      <div style={{
        flex: '1 1 46%', background: `linear-gradient(160deg, ${SAPPHIRE} 0%, ${SAPPHIRE_DEEP} 70%, #0a3a85 100%)`,
        color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* faint decorative rings */}
        <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: -160, left: -120 }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: -80, left: -40 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: '#fff' }}>rebuq<span style={{ color: GOLD }}>.</span></span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginLeft: 10 }}>Business</span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 40, fontWeight: 800, lineHeight: 1.12, margin: 0, letterSpacing: '-0.02em' }}>
            Money doesn't sleep.<br />
            Neither does <span style={{ color: GOLD }}>rebuq</span>.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)', marginTop: 22 }}>
            Post-booking price intelligence that catches savings after the booking's done — and turns them into margin.
          </p>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} rebuq · Access limited to approved partners
        </div>
      </div>

      {/* RIGHT — sign-in form */}
      <div style={{ flex: '1 1 54%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: 'min(88vw, 380px)' }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>Sign in</h2>
          <p style={{ fontSize: 14, color: SLATE, marginTop: 6, marginBottom: 30 }}>Welcome back to your rebooking console.</p>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="you@company.com"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: NAVY, outline: 'none', marginBottom: 18, fontFamily: 'inherit', transition: 'border 0.15s' }}
            onFocus={(e) => (e.currentTarget.style.border = `1px solid ${SAPPHIRE}`)}
            onBlur={(e) => (e.currentTarget.style.border = `1px solid ${LINE}`)}
          />

          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="••••••••"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: NAVY, outline: 'none', marginBottom: 22, fontFamily: 'inherit', transition: 'border 0.15s' }}
            onFocus={(e) => (e.currentTarget.style.border = `1px solid ${SAPPHIRE}`)}
            onBlur={(e) => (e.currentTarget.style.border = `1px solid ${LINE}`)}
          />

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: '#DC2626', marginBottom: 18 }}>{error}</div>
          )}

          <button
            onClick={handleSignIn} disabled={loading}
            style={{ width: '100%', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14.5, fontWeight: 700, color: '#fff', cursor: loading ? 'wait' : 'pointer', background: loading ? '#3b6fb0' : SAPPHIRE, transition: 'background 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = SAPPHIRE_DEEP)}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = SAPPHIRE)}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
