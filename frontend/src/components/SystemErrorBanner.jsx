// components/SystemErrorBanner.jsx
// Global error banner — add to your root layout.jsx
// Handles session expired, offline, API failures

'use client'

import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'
import { ALERTS } from '@/lib/alerts'

export default function SystemErrorBanner() {
  const [error, setError] = useState(null)

  useEffect(() => {
    // Offline detection
    function handleOffline() { setError('offline') }
    function handleOnline()  { setError(null) }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)

    // Session check
    fetch('/api/auth/me').then(r => {
      if (r.status === 401) setError('session_expired')
    }).catch(() => {})

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  if (!error) return null

  const alertMap = {
    offline: { ...ALERTS.SYSTEM.OFFLINE },
    session_expired: {
      ...ALERTS.SYSTEM.SESSION_EXPIRED,
      actions: [{ label: 'Log in again →', onClick: () => window.location.href = '/auth/login' }]
    },
    api_failed: { ...ALERTS.SYSTEM.API_FAILED },
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <Alert {...alertMap[error]} />
    </div>
  )
}
