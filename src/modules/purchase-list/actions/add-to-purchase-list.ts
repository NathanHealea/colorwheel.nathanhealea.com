'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'

/**
 * Server action that adds a paint to the authenticated user's purchase list.
 *
 * Idempotent — adding a paint already on the list succeeds silently.
 * Revalidates the provided path (falling back to `/purchase-list`) after a
 * successful insert.
 *
 * @param paintId - UUID of the paint to add.
 * @param revalidate - Optional page path to revalidate after the action.
 * @returns An object with an optional `error` string on failure.
 */
export async function addToPurchaseList(
  paintId: string,
  revalidate?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to add paints to your purchase list.' }
  }

  const service = createPurchaseListService(supabase)
  const result = await service.addPaint(user.id, paintId)

  if (!result.error) {
    revalidatePath(revalidate ?? '/purchase-list', 'page')
  }

  return result
}
