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
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');});}` }} />
      </body>
    </html>
  );
}
