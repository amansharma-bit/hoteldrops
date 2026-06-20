"use client";
import { useEffect, useState } from "react";

export default function PwaSplash() {
  // Start as "show" — covers the homepage during SSR/hydration so there's
  // no flash of page content before the splash appears. useEffect then
  // immediately removes it for non-PWA visitors (one imperceptible frame),
  // or runs the full animation for PWA visitors.
  const [phase, setPhase] = useState<"show" | "hiding" | "done">("show");

  useEffect(() => {
    const isPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (!isPwa) {
      setPhase("done"); // hide instantly — browser visitors never see it
      return;
    }

    const t1 = setTimeout(() => setPhase("hiding"), 3200);
    const t2 = setTimeout(() => setPhase("done"),   4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <>
      <style>{`
        @keyframes rq-word {
          from { opacity: 0; transform: scale(0.88) translateY(14px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes rq-dot {
          0%   { transform: scale(0);   }
          65%  { transform: scale(1.3); }
          100% { transform: scale(1);   }
        }
        @keyframes rq-tag {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes rq-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .rq-root {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: linear-gradient(160deg, #0a1628 0%, #0f2451 40%, #1447b8 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }
        .rq-root.rq-hiding {
          animation: rq-out 0.8s ease forwards;
          pointer-events: none;
        }
        .rq-word {
          display: inline-block;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: clamp(52px, 16vw, 72px);
          color: #ffffff;
          letter-spacing: -2.5px;
          line-height: 1;
          animation: rq-word 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
        .rq-dot {
          display: inline-block;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: clamp(52px, 16vw, 72px);
          color: #FCD34D;
          line-height: 1;
          animation: rq-dot 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.96s both;
        }
        .rq-tagline {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: clamp(14px, 4vw, 17px);
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.01em;
          text-align: center;
          padding-inline: 32px;
          margin: 0;
          animation: rq-tag 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1.45s both;
        }
      `}</style>

      <div className={`rq-root${phase === "hiding" ? " rq-hiding" : ""}`}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span className="rq-word">rebuq</span>
          <span className="rq-dot">.</span>
        </div>
        <p className="rq-tagline">
          Your hotel booking just got cheaper.
        </p>
      </div>
    </>
  );
}
