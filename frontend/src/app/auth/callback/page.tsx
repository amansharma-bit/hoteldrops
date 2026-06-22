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
    // Get redirect destination from localStorage (set before OAuth redirect)
    const redirect = localStorage.getItem("rebuq_auth_redirect") || "/dashboard";
    localStorage.removeItem("rebuq_auth_redirect");

    const code = new URLSearchParams(window.location.search).get("code");
    const error = new URLSearchParams(window.location.search).get("error");

    if (error) {
      router.push("/?error=" + error);
      return;
    }

    if (code) {
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

    // Fallback: wait for session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.push(redirect);
      }
    });

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
        <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", marginBottom: 24 }}>
          rebuq<span style={{ color: "#FCD34D" }}>.</span>
        </div>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Signing you in…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
