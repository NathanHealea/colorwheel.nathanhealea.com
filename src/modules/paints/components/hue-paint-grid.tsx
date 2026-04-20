'use client'

import { useCallback } from 'react'

import { PaginatedPaintGrid } from '@/modules/paints/components/paginated-paint-grid'
import type { PaintWithBrand } from '@/modules/paints/services/paint-service'
import { getPaintService } from '@/modules/paints/services/paint-service.client'

/**
 * Paginated paint grid filtered to a specific child hue.
 *
 * Wraps {@link PaginatedPaintGrid} with a child-hue-specific fetch function
 * and URL base path.
 *
 * @param props.hueId - The child hue UUID to filter paints by.
 * @param props.initialPaints - First page of paints (server-rendered).
 * @param props.totalCount - Total number of paints for this child hue.
 * @param props.userPaintIds - Set of paint IDs in the current user's collection.
 * @param props.isAuthenticated - Whether the current user is signed in.
 */
export function HuePaintGrid({
  hueId,
  initialPaints,
  totalCount,
  userPaintIds,
  isAuthenticated,
}: {
  hueId: string
  initialPaints: PaintWithBrand[]
  totalCount: number
  userPaintIds?: Set<string>
  isAuthenticated?: boolean
}) {
  const fetchPaints = useCallback(
    async (options: { limit: number; offset: number }) => {
      const paintService = getPaintService()
      return paintService.getPaintsByHueId(hueId, options)
    },
    [hueId]
  )

  return (
    <PaginatedPaintGrid
      initialPaints={initialPaints}
      totalCount={totalCount}
      basePath={`/hues/${hueId}`}
      fetchPaints={fetchPaints}
      userPaintIds={userPaintIds}
      isAuthenticated={isAuthenticated}
    />
  )
}
