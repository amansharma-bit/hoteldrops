import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "rebuq — Your hotel got cheaper. We'll tell you first.",
  description: 'Upload your hotel booking voucher. rebuq monitors the price 24/7 and alerts you via WhatsApp the moment it drops.',
  keywords: 'hotel price drop, hotel refund, cheaper hotel, hotel price tracker India, rebuq',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
