"use client";
import { useEffect, useState } from "react";

export default function PwaSplash() {
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const isPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (!isPwa) return;

    setShow(true);
    const hideTimer = setTimeout(() => {
      setHiding(true);
      setTimeout(() => setShow(false), 600);
    }, 2200);
    return () => clearTimeout(hideTimer);
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes rebuq-drop {
          0%   { transform: translateY(-50px) scale(0.6); opacity: 0; }
          60%  { transform: translateY(8px) scale(1.06); opacity: 1; }
          80%  { transform: translateY(-4px) scale(0.97); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes rebuq-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.5; }
          50%       { transform: scale(1.2);  opacity: 0.12; }
        }
        @keyframes rebuq-pulse2 {
          0%, 100% { transform: scale(0.8); opacity: 0.35; }
          50%       { transform: scale(1.35); opacity: 0.08; }
        }
        @keyframes rebuq-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rebuq-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .rebuq-splash-root {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: linear-gradient(160deg, #1a237e 0%, #1447b8 60%, #1565c0 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }
        .rebuq-splash-root.hiding {
          animation: rebuq-fade-out 0.6s ease forwards;
        }
        .rebuq-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 160px;
          height: 160px;
        }
        .rebuq-ring1 {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.18);
          animation: rebuq-pulse 2.2s ease-in-out infinite;
        }
        .rebuq-ring2 {
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.09);
          animation: rebuq-pulse2 2.2s ease-in-out infinite 0.35s;
        }
        .rebuq-logo-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #1447b8;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: rebuq-drop 0.75s cubic-bezier(.34,1.56,.64,1) forwards;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          position: relative;
          z-index: 2;
        }
        .rebuq-logo-r {
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: 38px;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
          display: flex;
          align-items: flex-end;
          gap: 0;
        }
        .rebuq-logo-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #FCD34D;
          margin-bottom: 8px;
          margin-left: 2px;
          flex-shrink: 0;
        }
        .rebuq-tagline {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          animation: rebuq-fade-up 0.5s ease 0.9s both;
          opacity: 0;
        }
        .rebuq-wordmark {
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .rebuq-wordmark span {
          color: #FCD34D;
        }
        .rebuq-sub {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
      `}</style>
      <div className={`rebuq-splash-root${hiding ? " hiding" : ""}`}>
        <div className="rebuq-logo-wrap">
          <div className="rebuq-ring1" />
          <div className="rebuq-ring2" />
          <div className="rebuq-logo-circle">
            <div className="rebuq-logo-r">
              r<div className="rebuq-logo-dot" />
            </div>
          </div>
        </div>
        <div className="rebuq-tagline">
          <div className="rebuq-wordmark">rebuq<span>.</span></div>
          <div className="rebuq-sub">Your hotel price just dropped</div>
        </div>
      </div>
    </>
  );
}
