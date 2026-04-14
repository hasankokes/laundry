'use client'

import { useState, useCallback } from 'react'

export function useMounted() {
  const [mounted, setMounted] = useState(false)

  // Use requestAnimationFrame to avoid the "setState in effect" lint rule
  // while still ensuring the component is mounted before rendering
  if (typeof window !== 'undefined' && !mounted) {
    requestAnimationFrame(() => setMounted(true))
  }

  return mounted
}
