'use client'

import { useCallback } from 'react'

import { createClient } from '@/lib/supabase/client'
import { PaginatedPaintGrid } from '@/modules/paints/components/paginated-paint-grid'
import { getPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service.client'
import type { PaintWithBrand } from '@/modules/paints/services/paint-service'

/**
 * Paginated paint grid scoped to the current user's purchase list.
 *
 * Wraps {@link PaginatedPaintGrid} with a purchase-list-specific fetch function
 * that resolves the authenticated user from the browser Supabase client before
 * querying. All displayed paints are already on the purchase list, so its
 * toggle removes them rather than adding; the collection toggle still adds and
 * removes normally.
 *
 * @param props.initialPaints - First page of purchase list paints (server-rendered).
 * @param props.totalCount - Total number of paints on the user's purchase list.
 * @param props.purchaseListIds - Set of all paint IDs on the purchase list for toggle state.
 * @param props.userPaintIds - Set of paint IDs in the user's collection for the collection toggle state.
 */
export function PurchaseListPaintGrid({
  initialPaints,
  totalCount,
  purchaseListIds,
  userPaintIds,
}: {
  initialPaints: PaintWithBrand[]
  totalCount: number
  purchaseListIds: Set<string>
  userPaintIds: Set<string>
}) {
  const fetchPaints = useCallback(async (options: { limit: number; offset: number }) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const purchaseListService = getPurchaseListService()
    return purchaseListService.getPurchaseListPaints(user.id, options)
  }, [])

  return (
    <PaginatedPaintGrid
      initialPaints={initialPaints}
      totalCount={totalCount}
      basePath="/purchase-list/paints"
      fetchPaints={fetchPaints}
      userPaintIds={userPaintIds}
      purchaseListIds={purchaseListIds}
      isAuthenticated={true}
    />
  )
}
