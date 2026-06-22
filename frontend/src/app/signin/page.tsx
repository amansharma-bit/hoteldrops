"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const B    = "#1447b8";
const NAVY = "#0f172a";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < 900);
    c(); window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);
  return m;
}

export default function SignInPage() {
  const router   = useRouter();
  const isMobile = useIsMobile();
  const [mode,     setMode]     = useState<"signin" | "signup" | "forgot">("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) setRedirectTo(redirect);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push(redirect || "/dashboard");
    });
  }, []);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const params   = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    localStorage.setItem("rebuq_auth_redirect", redirect);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://www.rebuq.com/auth/callback" },
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
    width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)",
    borderRadius: 10, padding: "13px 14px", fontSize: 14, fontFamily: "inherit",
    color: "#fff", outline: "none", transition: "border-color 0.2s",
  };

  const QUOTES = [
    { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
    { text: "Travel is the only thing you buy that makes you richer.", author: "" },
    { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  ];
  const quote = QUOTES[0];

  /* ── FORM PANEL (shared between mobile and desktop right-side) ── */
  const FormPanel = (
    <div className="form-scroll" style={{
      width: isMobile ? "100%" : "50%",
      height: "100vh",
      overflowY: "auto",
      background: "linear-gradient(135deg, #1a237e 0%, #1447b8 55%, #1565c0 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: isMobile ? "40px 24px" : "48px 56px",
      position: "relative",
    }}>
      {/* Logo */}
      <div style={{ position: "absolute", top: 28, left: isMobile ? 24 : 40 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", textDecoration: "none" }}>
          rebuq<span style={{ color: "#FCD34D" }}>.</span>
        </a>
      </div>

      {/* Top-right toggle */}
      <div style={{ position: "absolute", top: 30, right: isMobile ? 24 : 40, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        {mode === "signin" ? "No account? " : "Have an account? "}
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
          style={{ color: "#FCD34D", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </div>

      {/* Heading */}
      <div style={{ width: "100%", maxWidth: 380, marginTop: 48 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: isMobile ? 26 : 30, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 32, lineHeight: 1.6 }}>
          {mode === "signin" ? "Sign in to access your member deals and price alerts" :
           mode === "signup" ? "Join thousands of Indian travelers saving on hotels" :
           "We'll send you a password reset link"}
        </p>

        {/* Google button */}
        {mode !== "forgot" && (
          <>
            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", background: "#fff", border: "none", borderRadius: 10, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: NAVY, marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>or with email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            </div>
          </>
        )}

        {/* Name */}
        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Sharma" style={inp} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
        </div>

        {/* Password */}
        {mode !== "forgot" && (
          <div style={{ marginBottom: mode === "signin" ? 6 : 20, position: "relative" }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Password</label>
            <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"} style={inp}
              onKeyDown={e => { if (e.key === "Enter") mode === "signin" ? handleEmailSignIn() : handleEmailSignUp(); }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: 38, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              {showPw ? "hide" : "show"}
            </button>
          </div>
        )}

        {/* Forgot link */}
        {mode === "signin" && (
          <div style={{ textAlign: "right", marginBottom: 22 }}>
            <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
              style={{ fontSize: 12.5, color: "#FCD34D", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Error / Success */}
        {error   && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#86efac", marginBottom: 14, fontWeight: 600 }}>✓ {success}</div>}

        {/* Submit */}
        <button
          onClick={mode === "signin" ? handleEmailSignIn : mode === "signup" ? handleEmailSignUp : handleForgot}
          disabled={loading}
          style={{ width: "100%", background: "#FCD34D", color: NAVY, border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <><div style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
          ) : mode === "signin" ? "Sign in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
        </button>

        {mode === "forgot" && (
          <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const }}>
            ← Back to sign in
          </button>
        )}

        {/* Terms */}
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", textAlign: "center" as const, marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to our{" "}
          <a href="#" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Terms</a> and{" "}
          <a href="#" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Privacy Policy</a>
        </p>

        {/* 3 benefit pills — mobile only */}
        {isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 28 }}>
            {[
              { n: "Save 60%", s: "vs OTA rates" },
              { n: "AI 24/7", s: "watches prices" },
              { n: "WhatsApp", s: "instant alerts" },
            ].map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{b.n}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{b.s}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── PHOTO PANEL (desktop left side) ── */
  const PhotoPanel = (
    <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
      <img src="/signin-beach.jpg" alt="Beach" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,22,40,0.25) 0%, rgba(10,22,40,0.6) 100%)" }} />
      <div style={{ position: "absolute", bottom: 60, left: 48, right: 48 }}>
        <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 16 }}>
          Your next hotel stay costs less than you think.
        </p>
        <div style={{ width: 40, height: 3, background: "#FCD34D", borderRadius: 2, marginTop: 20 }} />
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 16, lineHeight: 1.6 }}>
          Become a rebuq member and unlock 2,70,000 exclusive hotel deals.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", height: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(255,255,255,0.5) !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .form-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Desktop: photo left, form right */}
      {!isMobile && PhotoPanel}
      {FormPanel}
    </div>
  );
}
