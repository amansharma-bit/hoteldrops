import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'rebuq.com — Your hotel got cheaper. We\'ll tell you first.',
  description: 'Upload your hotel booking voucher. rebuq monitors the price 24/7 and alerts you via WhatsApp the moment it drops — you keep the savings.',
  keywords: 'hotel price drop, hotel refund, cheaper hotel, hotel price tracker India, rebuq',
  openGraph: {
    title: 'rebuq.com — Your hotel got cheaper. We\'ll tell you first.',
    description: 'Upload your hotel voucher. We monitor 24/7 and alert you when price drops.',
    type: 'website',
  },
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
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111827',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: '500',
            },
            success: { style: { background: '#166534' } },
            error:   { style: { background: '#991b1b' } },
          }}
        />
        {children}
      </body>
    </html>
  )
}
