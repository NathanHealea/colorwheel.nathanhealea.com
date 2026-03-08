import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'colorwheel-owned-paints'

export function useOwnedPaints() {
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setOwnedIds(new Set(JSON.parse(stored)))
      } catch {
        // ignore malformed data
      }
    }
  }, [])

  const toggleOwned = useCallback((paintId: string) => {
    setOwnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(paintId)) next.delete(paintId)
      else next.add(paintId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  return { ownedIds, toggleOwned }
}
