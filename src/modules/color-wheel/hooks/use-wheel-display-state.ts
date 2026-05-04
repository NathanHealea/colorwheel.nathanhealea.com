'use client'

import { useEffect, useState } from 'react'

const BRAND_RING_KEY = 'wheel:showBrandRing'
const OWNED_RING_KEY = 'wheel:showOwnedRing'

/**
 * Manages the boolean display toggles for the HSL color wheel dot decorations.
 *
 * Both values are persisted to `sessionStorage` so they survive page navigation
 * within a session but reset on a fresh tab. Falls back to `false` when storage
 * is unavailable (e.g. SSR or private-mode restrictions).
 *
 * @returns `showBrandRing`, `showOwnedRing`, and their respective setters.
 */
export function useWheelDisplayState() {
  const [showBrandRing, setShowBrandRingState] = useState(false)
  const [showOwnedRing, setShowOwnedRingState] = useState(false)

  useEffect(() => {
    try {
      setShowBrandRingState(sessionStorage.getItem(BRAND_RING_KEY) === 'true')
      setShowOwnedRingState(sessionStorage.getItem(OWNED_RING_KEY) === 'true')
    } catch {
      // sessionStorage unavailable — keep defaults
    }
  }, [])

  function setShowBrandRing(value: boolean) {
    setShowBrandRingState(value)
    try { sessionStorage.setItem(BRAND_RING_KEY, String(value)) } catch { /* ignore */ }
  }

  function setShowOwnedRing(value: boolean) {
    setShowOwnedRingState(value)
    try { sessionStorage.setItem(OWNED_RING_KEY, String(value)) } catch { /* ignore */ }
  }

  return { showBrandRing, showOwnedRing, setShowBrandRing, setShowOwnedRing }
}
