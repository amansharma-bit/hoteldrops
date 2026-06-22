"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      router.push(`/?error=${error}`);
      return;
    }

    if (code) {
      // PKCE flow: exchange code using client-side supabase (has access to localStorage code verifier)
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("Auth exchange error:", error.message);
          router.push("/?error=auth_failed");
        } else {
          router.push(redirect);
        }
      });
      return;
    }

    // Fallback: wait for session via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.push(redirect);
      }
    });

    // Also check if already signed in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        subscription.unsubscribe();
        router.push(redirect);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1447b8" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "\'Sora\', sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", marginBottom: 24 }}>
          rebuq<span style={{ color: "#FCD34D" }}>.</span>
        </div>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Signing you in…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
