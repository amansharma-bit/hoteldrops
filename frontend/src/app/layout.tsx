import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rebuq — Hotel Price Protection for Indian Travelers",
  description: "Upload your hotel voucher. Our AI watches the price 24/7 and alerts you on WhatsApp when it drops.",
  keywords: ["hotel price drop", "hotel price alert", "rebuq", "hotel price tracker", "india travel", "whatsapp hotel alert"],
  authors: [{ name: "rebuq" }],
  creator: "rebuq",
  publisher: "rebuq",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "rebuq." },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website", siteName: "rebuq.",
    title: "rebuq — Hotel Price Protection for Indian Travelers",
    description: "Upload your hotel voucher. Our AI watches the price 24/7 and alerts you on WhatsApp when it drops.",
    url: "https://rebuq.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "rebuq — Hotel Price Protection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "rebuq — Hotel Price Protection for Indian Travelers",
    description: "Upload your hotel voucher. Our AI watches the price 24/7 and alerts you on WhatsApp when it drops.",
    images: ["/og-image.png"], creator: "@rebuq",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&family=Clash+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="rebuq." />
        <meta name="msapplication-TileColor" content="#1447b8" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" />
        <style dangerouslySetInnerHTML={{ __html: `
          #rq-splash {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: linear-gradient(160deg, #0a1628 0%, #0f2451 40%, #1447b8 100%);
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
          }
          #rq-word {
            display: inline-block;
            font-family: 'Sora', sans-serif;
            font-weight: 800;
            font-size: clamp(52px, 16vw, 72px);
            color: #fff;
            letter-spacing: -2.5px;
            line-height: 1;
            opacity: 0;
            transform: translateY(14px) scale(0.9);
          }
          #rq-dot {
            display: inline-block;
            font-family: 'Sora', sans-serif;
            font-weight: 800;
            font-size: clamp(52px, 16vw, 72px);
            color: #FCD34D;
            line-height: 1;
            opacity: 0;
            transform: scale(0);
          }
          #rq-tag {
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            font-size: clamp(14px, 4vw, 17px);
            color: rgba(255,255,255,0.5);
            letter-spacing: 0.01em;
            text-align: center;
            padding: 0 32px;
            margin: 0;
            opacity: 0;
            transform: translateY(8px);
          }
        `}} />
      </head>
      <body className="antialiased">

        {/* ── PWA Splash — pure HTML/JS, runs before React touches anything ── */}
        <div id="rq-splash">
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span id="rq-word">rebuq</span>
            <span id="rq-dot">.</span>
          </div>
          <p id="rq-tag">Your hotel booking just got cheaper.</p>
        </div>

        {/* Inline script — executes synchronously before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var isPwa = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
            if (!isPwa) return;

            var splash = document.getElementById('rq-splash');
            var word   = document.getElementById('rq-word');
            var dot    = document.getElementById('rq-dot');
            var tag    = document.getElementById('rq-tag');

            // Show immediately — covers page before any React renders
            splash.style.display = 'flex';

            // Animate in — two rAF frames to ensure display:flex is painted first
            requestAnimationFrame(function() {
              requestAnimationFrame(function() {

                setTimeout(function() {
                  word.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)';
                  word.style.opacity = '1';
                  word.style.transform = 'translateY(0) scale(1)';
                }, 300);

                setTimeout(function() {
                  dot.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
                  dot.style.opacity = '1';
                  dot.style.transform = 'scale(1)';
                }, 960);

                setTimeout(function() {
                  tag.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                  tag.style.opacity = '1';
                  tag.style.transform = 'translateY(0)';
                }, 1450);

                setTimeout(function() {
                  splash.style.transition = 'opacity 0.8s ease';
                  splash.style.opacity = '0';
                  splash.style.pointerEvents = 'none';
                }, 3200);

                setTimeout(function() {
                  splash.style.display = 'none';
                }, 4100);
              });
            });
          })();
        `}} />

        {children}

        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(
                function(reg) { console.log('SW registered:', reg.scope); },
                function(err) { console.log('SW registration failed:', err); }
              );
            });
          }
        `}} />
      </body>
    </html>
  );
}
