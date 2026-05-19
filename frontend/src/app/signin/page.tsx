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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) setRedirectTo(redirect);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push(redirect || "/dashboard");
    });
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirectTo);
  };

  const handleEmailSignUp = async () => {
    if (!name) { setError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Check your email to confirm your account!");
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true);
    setError("");
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        input:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(20,71,184,0.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
            style={{ color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: B, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>r.</div>
            <h1 className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
            </h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              {mode === "signin" ? "Sign in to access your member deals and price alerts" :
               mode === "signup" ? "Join rebuq and start saving on hotel bookings" :
               "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {/* Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

            {/* Google button */}
            {mode !== "forgot" && (
              <>
                <button onClick={handleGoogle} disabled={loading}
                  style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: NAVY, marginBottom: 20, transition: "border-color 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "#94a3b8")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or with email</span>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                </div>
              </>
            )}

            {/* Name field (signup only) */}
            {mode === "signup" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Sharma" style={inp} />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div style={{ marginBottom: mode === "signin" ? 8 : 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                  style={inp}
                  onKeyDown={e => { if (e.key === "Enter") mode === "signin" ? handleEmailSignIn() : handleEmailSignUp(); }} />
              </div>
            )}

            {/* Forgot password link */}
            {mode === "signin" && (
              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  style={{ fontSize: 12.5, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#16a34a", marginBottom: 14, fontWeight: 600 }}>
                ✓ {success}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={mode === "signin" ? handleEmailSignIn : mode === "signup" ? handleEmailSignUp : handleForgot}
              disabled={loading}
              style={{ width: "100%", background: loading ? "#94a3b8" : B, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
              ) : mode === "signin" ? "Sign in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
            </button>

            {/* Back to signin from forgot */}
            {mode === "forgot" && (
              <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
                style={{ width: "100%", background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 12, textAlign: "center" }}>
                ← Back to sign in
              </button>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8" }}>
            By continuing you agree to our{" "}
            <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Terms</a> and{" "}
            <a href="#" style={{ color: B, textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
          </div>

          {/* Member deals promo */}
          <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px 18px", marginTop: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 2 }}>Member-only hotel rates</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>Sign in to unlock 500,000+ exclusive deals across the globe — unavailable on any OTA.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
