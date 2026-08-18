'use client'

import { useEffect, useState } from 'react'
import { MOBILE_MAX_MEDIA_QUERY } from '@/lib/responsive-tokens'

/**
 * SSR-safe hook for the single mobile/desktop switch point
 * (see docs/RESPONSIVE.md). Use this instead of ad-hoc width media queries
 * in JS — the audit (R3) rejects those.
 *
 * Returns false during SSR and the first client render, then tracks the
 * media query live.
 */
export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MAX_MEDIA_QUERY)
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return isMobile
}
