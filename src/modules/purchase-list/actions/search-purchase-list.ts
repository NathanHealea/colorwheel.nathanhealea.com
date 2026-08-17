'use server'

import { createClient } from '@/lib/supabase/server'
import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'
import type { PurchaseListPaint } from '@/modules/purchase-list/types/purchase-list-paint'

/**
 * Server action that searches the authenticated user's purchase list.
 *
 * Delegates to `searchPurchaseList` on the purchase list service. Returns an
 * empty array if the user is unauthenticated rather than an error, so the
 * search component degrades gracefully without surfacing auth errors in the UI.
 *
 * @param query - Search string. Prefix with `#` to match hex codes.
 * @returns `{ paints: PurchaseListPaint[] }` on success, `{ error: string }` on failure.
 */
export async function searchPurchaseList(
  query: string,
): Promise<{ paints: PurchaseListPaint[] } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { paints: [] }

  const service = createPurchaseListService(supabase)
  const paints = await service.searchPurchaseList(user.id, { query })
  return { paints }
}
