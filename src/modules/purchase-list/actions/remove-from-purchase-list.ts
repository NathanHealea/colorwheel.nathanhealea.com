'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'

/**
 * Server action that removes a paint from the authenticated user's purchase list.
 *
 * Idempotent — removing a paint that is not on the list succeeds silently.
 * Revalidates the provided path (falling back to `/purchase-list`) after a
 * successful delete.
 *
 * @param paintId - UUID of the paint to remove.
 * @param revalidate - Optional page path to revalidate after the action.
 * @returns An object with an optional `error` string on failure.
 */
export async function removeFromPurchaseList(
  paintId: string,
  revalidate?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to remove paints from your purchase list.' }
  }

  const service = createPurchaseListService(supabase)
  const result = await service.removePaint(user.id, paintId)

  if (!result.error) {
    revalidatePath(revalidate ?? '/purchase-list', 'page')
  }

  return result
}
