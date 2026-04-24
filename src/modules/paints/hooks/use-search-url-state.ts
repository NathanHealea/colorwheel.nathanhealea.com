'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Per-key history strategy:
 * - `'replace'` — always uses `replaceState` (e.g. debounced text input).
 * - `'push'`    — uses `pushState` on committed changes so Back retraces them.
 */
type HistoryMode = 'replace' | 'push'

/**
 * Configuration for {@link useSearchUrlState}.
 *
 * @param keys - Maps each state key to its history strategy.
 * @param hydrate - Parses a `URLSearchParams` snapshot into state `T`.
 * @param serialize - Converts state `T` into `URLSearchParams` for the URL.
 * @param basePath - The pathname written to the URL (e.g. `'/paints'`).
 */
type SearchUrlStateConfig<T extends Record<string, unknown>> = {
  keys: { [K in keyof T]: HistoryMode }
  hydrate: (sp: URLSearchParams) => T
  serialize: (state: T) => URLSearchParams
  basePath: string
}

/**
 * Two-way sync between search state and the browser URL.
 *
 * Uses `window.history` directly (not `router.replace`) to avoid triggering
 * server-component re-renders that would cause an infinite effect loop.
 *
 * History strategy (hybrid):
 * - `update(patch, { commit: false })` always calls `replaceState`. Use this
 *   for debounce-fired query ticks so keystrokes don't flood the history stack.
 * - `update(patch, { commit: true })` calls `pushState` if any field tagged
 *   `'push'` in `keys` changed; otherwise falls back to `replaceState`. Use
 *   this for filter, page, and size changes so Back retraces them.
 *
 * Hydrates from `window.location.search` on mount and re-hydrates on `popstate`
 * so Back / Forward restore state correctly.
 *
 * @param config - See {@link SearchUrlStateConfig}.
 * @returns `state` and an `update` function for applying partial patches.
 */
export function useSearchUrlState<T extends Record<string, unknown>>(
  config: SearchUrlStateConfig<T>
): {
  state: T
  update: (patch: Partial<T>, options?: { commit?: boolean }) => void
} {
  const { keys, hydrate, serialize, basePath } = config

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return hydrate(new URLSearchParams())
    return hydrate(new URLSearchParams(window.location.search))
  })

  // Re-hydrate when the user navigates Back / Forward
  useEffect(() => {
    function onPopState() {
      setState(hydrate(new URLSearchParams(window.location.search)))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [hydrate])

  const update = useCallback(
    (patch: Partial<T>, options?: { commit?: boolean }) => {
      const commit = options?.commit ?? false

      setState((prev) => {
        const next = { ...prev, ...patch }

        const sp = serialize(next)
        const qs = sp.toString()
        const url = qs ? `${basePath}?${qs}` : basePath

        // Use pushState if committing AND any push-keyed field changed
        const shouldPush =
          commit &&
          (Object.keys(patch) as (keyof T)[]).some(
            (k) => keys[k] === 'push' && patch[k] !== prev[k]
          )

        if (shouldPush) {
          window.history.pushState(null, '', url)
        } else {
          window.history.replaceState(null, '', url)
        }

        return next
      })
    },
    [keys, serialize, basePath]
  )

  return { state, update }
}
