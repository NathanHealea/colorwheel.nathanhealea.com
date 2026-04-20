'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createCollectionService } from '@/modules/collection/services/collection-service'

/**
 * Server action that removes a paint from the authenticated user's collection.
 *
 * Idempotent — removing a paint not in the collection succeeds silently.
 * Revalidates the provided path (if any) after a successful delete.
 *
 * @param paintId - UUID of the paint to remove.
 * @param revalidate - Optional page path to revalidate after the action.
 * @returns An object with an optional `error` string on failure.
 */
export async function removeFromCollection(
  paintId: string,
  revalidate?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to remove paints from your collection.' }
  }

  const service = createCollectionService(supabase)
  const result = await service.removePaint(user.id, paintId)

  if (!result.error && revalidate) {
    revalidatePath(revalidate, 'page')
  }

  return result
}
