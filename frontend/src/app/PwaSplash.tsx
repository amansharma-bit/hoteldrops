"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    // Start fade-out at 3.2s, remove from DOM at 4s
    const t1 = setTimeout(() => setPhase("fading"), 3200);
    const t2 = setTimeout(() => setPhase("done"), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <>
      <style>{`
        @keyframes rq-word {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes rq-dot {
          0%   { transform: scale(0);    }
          65%  { transform: scale(1.28); }
          100% { transform: scale(1);    }
        }
        @keyframes rq-tag {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .rq-word {
          display: inline-block;
          animation: rq-word 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
        .rq-dot {
          display: inline-block;
          animation: rq-dot 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) 0.96s both;
        }
        .rq-tag {
          animation: rq-tag 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1.45s both;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "linear-gradient(160deg, #0a1628 0%, #0f2451 40%, #1447b8 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          opacity: phase === "fading" ? 0 : 1,
          transition: phase === "fading" ? "opacity 0.8s ease" : "none",
          pointerEvents: phase === "fading" ? "none" : "auto",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            className="rq-word"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Sora', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(44px, 13vw, 58px)",
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            rebuq
          </span>
          <span
            className="rq-dot"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Sora', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(44px, 13vw, 58px)",
              color: "#FCD34D",
              lineHeight: 1,
            }}
          >
            .
          </span>
        </div>

        {/* Tagline */}
        <p
          className="rq-tag"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(13px, 3.8vw, 16px)",
            color: "rgba(255, 255, 255, 0.5)",
            margin: 0,
            letterSpacing: "0.01em",
            textAlign: "center",
            paddingInline: "32px",
          }}
        >
          Your hotel booking just got cheaper.
        </p>
      </div>
    </>
  );
}
