'use client'

import { useEffect, useState } from 'react'

import { getPaintService } from '@/modules/paints/services/paint-service.client'
import type { PaintWithBrand } from '@/modules/paints/services/paint-service'

/** Parameters accepted by the optional fetchFn override. */
export type PaintSearchFetchParams = {
  query?: string
  hueIds?: string[]
  limit: number
  offset: number
  signal?: AbortSignal
}

/**
 * Fetches paints via `searchPaintsUnified` with AbortController cancellation.
 *
 * Stale in-flight responses are discarded automatically so the grid never
 * shows results from a superseded query. This is the "no-flash" guarantee.
 *
 * @remarks
 * **fetchFn override**: pass a custom async function to redirect fetching
 * through a server action (e.g. for admin surfaces that need server-side
 * data access). The override receives the same params but no `scope` — scope
 * is the override's responsibility to encapsulate.
 *
 * @param params.query - Debounced search string.
 * @param params.hueIds - Active hue UUIDs (one for child, many for parent group).
 * @param params.scope - Collection scope — `'all'` or `{ type: 'userCollection', userId }`.
 * @param params.pageSize - Number of results per page.
 * @param params.page - 1-based page number.
 * @param params.initialPaints - SSR-prefetched paints shown before the first fetch resolves.
 * @param params.initialTotalCount - SSR-prefetched total count.
 * @param params.fetchFn - Optional override to redirect fetching (e.g. a server action).
 * @returns `{ paints, totalCount, isLoading, error }`.
 */
export function usePaintSearch(params: {
  query?: string
  hueIds?: string[]
  scope?: 'all' | { type: 'userCollection'; userId: string }
  pageSize: number
  page: number
  initialPaints?: PaintWithBrand[]
  initialTotalCount?: number
  fetchFn?: (params: PaintSearchFetchParams) => Promise<{ paints: PaintWithBrand[]; count: number }>
}): {
  paints: PaintWithBrand[]
  totalCount: number
  isLoading: boolean
  error: string | null
} {
  const { query, hueIds, scope, pageSize, page, initialPaints, initialTotalCount, fetchFn } = params

  const [paints, setPaints] = useState<PaintWithBrand[]>(initialPaints ?? [])
  const [totalCount, setTotalCount] = useState(initialTotalCount ?? 0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    setIsLoading(true)
    setError(null)

    const limit = pageSize
    const offset = (page - 1) * pageSize

    const fetch = fetchFn
      ? () => fetchFn({ query, hueIds, limit, offset, signal })
      : () =>
          getPaintService().searchPaintsUnified({
            query,
            hueIds,
            scope,
            limit,
            offset,
            signal,
          })

    fetch()
      .then(({ paints: fetched, count }) => {
        if (signal.aborted) return
        setPaints(fetched)
        setTotalCount(count)
        setIsLoading(false)
      })
      .catch((err: Error) => {
        if (signal.aborted) return
        setError(err.message)
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [query, hueIds, scope, pageSize, page, fetchFn])

  return { paints, totalCount, isLoading, error }
}
