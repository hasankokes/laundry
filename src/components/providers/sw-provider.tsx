'use client'

import { useEffect } from 'react'

export function SWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      })
    }
  }, [])

  return <>{children}</>
}
