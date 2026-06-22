"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const B = "#1447b8";
const NAVY = "#0f172a";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return m;
}

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const isMobile = useIsMobile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) setRedirectTo(redirect);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push(redirect || "/dashboard");
    });
  }, []);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmailSignIn = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirectTo);
  };

  const handleEmailSignUp = async () => {
    if (!name) { setError("Please enter your name"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Check your email to confirm your account!");
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Password reset link sent to your email!");
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
    color: NAVY, outline: "none", background: "#fff", transition: "border-color 0.2s",
  };

  const BENEFITS = [
    { icon: "↓", label: "Save up to 60%", sub: "vs public OTA rates" },
    { icon: "◉", label: "AI watches 24/7", sub: "price drops while you sleep" },
    { icon: "✉", label: "WhatsApp alerts", sub: "instant when price drops" },
  ];

  const FormCard = (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "24px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 20 }}>
      {mode !== "forgot" && (
        <>
          <button onClick={handleGoogle} disabled={loading}
            style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: NAVY, marginBottom: 18 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>
        </>
      )}
      {mode === "signup" && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Sharma" style={inp} />
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Email address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
      </div>
      {mode !== "forgot" && (
        <div style={{ marginBottom: mode === "signin" ? 8 : 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"} style={inp}
            onKeyDown={e => { if (e.key === "Enter") mode === "signin" ? handleEmailSignIn() : handleEmailSignUp(); }} />
        </div>
      )}
      {mode === "signin" && (
        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
            style={{ fontSize: 12.5, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Forgot password?
          </button>
        </div>
      )}
      {error && <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 14, fontWeight: 600 }}>✓ {success}</div>}
      <button onClick={mode === "signin" ? handleEmailSignIn : mode === "signup" ? handleEmailSignUp : handleForgot} disabled={loading}
        style={{ width: "100%", background: loading ? "#94a3b8" : B, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {loading ? (<><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>) :
          mode === "signin" ? "Sign in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
      </button>
      {mode === "forgot" && (
        <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
          style={{ width: "100%", background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 12, textAlign: "center" as const }}>
          ← Back to sign in
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        input:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: NAVY, textDecoration: "none" }}>
          rebuq<span style={{ color: B }}>.</span>
        </a>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {mode === "signin" ? "No account? " : "Have an account? "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
            style={{ color: B, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </nav>

      {isMobile ? (
        /* ── MOBILE LAYOUT ── */
        <>
          <div style={{ background: `linear-gradient(135deg, #1a237e 0%, ${B} 100%)`, padding: "28px 20px 48px", textAlign: "center" }}>
            <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Join rebuq" : "Reset password"}
            </div>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              {mode === "signin" ? "Access your member deals and price alerts" :
               mode === "signup" ? "Start saving on hotel bookings today" :
               "We'll send you a password reset link"}
            </p>
          </div>

          <div style={{ padding: "0 16px", marginTop: -24 }}>
            {FormCard}
            <div style={{ textAlign: "center", marginBottom: 24, fontSize: 12, color: "#94a3b8" }}>
              By continuing you agree to our{" "}
              <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Terms</a> and{" "}
              <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingBottom: 32 }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 10px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 18, marginBottom: 6, color: B }}>{b.icon}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, marginBottom: 3, lineHeight: 1.3 }}>{b.label}</div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", lineHeight: 1.4 }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ── DESKTOP LAYOUT — original centered design ── */
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", minHeight: "calc(100vh - 56px)" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, background: B, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>r.</div>
              <h1 className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
              </h1>
              <p style={{ fontSize: 14, color: "#64748b" }}>
                {mode === "signin" ? "Sign in to access your member deals and price alerts" :
                 mode === "signup" ? "Join rebuq and start saving on hotel bookings" :
                 "Enter your email and we'll send you a reset link"}
              </p>
            </div>
            {FormCard}
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>
              By continuing you agree to our{" "}
              <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Terms</a> and{" "}
              <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
            </div>
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px 18px", marginTop: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ color: B, fontSize: 18, flexShrink: 0, marginTop: 1 }}>↓</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 2 }}>Member-only hotel rates</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>Sign in to unlock 2,70,000+ exclusive deals across the globe — unavailable on any OTA.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
