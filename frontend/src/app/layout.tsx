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
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="rebuq." />
        <meta name="msapplication-TileColor" content="#1447b8" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">

        {/*
          PWA Splash Screen
          Pure HTML + inline-script approach — no React state, no hydration gap.
          Shows once per session via sessionStorage so it never repeats on
          page navigation, only on a fresh app open.
        */}
        <div
          id="rq-splash"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "linear-gradient(160deg, #0a1628 0%, #0f2451 40%, #1447b8 100%)",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              id="rq-w"
              style={{
                display: "inline-block",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(52px, 16vw, 72px)",
                color: "#ffffff",
                letterSpacing: "-2.5px",
                lineHeight: 1,
                opacity: 0,
                transform: "translateY(14px) scale(0.9)",
              }}
            >
              rebuq
            </span>
            <span
              id="rq-d"
              style={{
                display: "inline-block",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(52px, 16vw, 72px)",
                color: "#FCD34D",
                lineHeight: 1,
                opacity: 0,
                transform: "scale(0)",
              }}
            >
              .
            </span>
          </div>
          <p
            id="rq-t"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(14px, 4vw, 17px)",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.01em",
              textAlign: "center",
              padding: "0 32px",
              margin: 0,
              opacity: 0,
              transform: "translateY(8px)",
            }}
          >
            Your hotel booking just got cheaper.
          </p>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    // Show once per session — not on every page navigation
    if (sessionStorage.getItem('rq-splashed')) return;
    sessionStorage.setItem('rq-splashed', '1');

    var splash = document.getElementById('rq-splash');
    var w = document.getElementById('rq-w');
    var d = document.getElementById('rq-d');
    var t = document.getElementById('rq-t');
    if (!splash || !w || !d || !t) return;

    splash.style.display = 'flex';

    function animate() {
      setTimeout(function() {
        w.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)';
        w.style.opacity = '1';
        w.style.transform = 'translateY(0) scale(1)';
      }, 300);

      setTimeout(function() {
        d.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        d.style.opacity = '1';
        d.style.transform = 'scale(1)';
      }, 960);

      setTimeout(function() {
        t.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
      }, 1450);

      setTimeout(function() {
        splash.style.transition = 'opacity 0.8s ease';
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none';
      }, 3200);

      setTimeout(function() {
        splash.style.display = 'none';
      }, 4100);
    }

    // Two rAF frames ensure the flex display is painted before transitions start
    requestAnimationFrame(function() {
      requestAnimationFrame(animate);
    });
  } catch(e) {}
})();
            `,
          }}
        />

        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(
      function(reg) { console.log('SW registered:', reg.scope); },
      function(err) { console.log('SW registration failed:', err); }
    );
  });
}
            `,
          }}
        />
      </body>
    </html>
  );
}
