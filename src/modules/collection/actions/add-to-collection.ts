'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createCollectionService } from '@/modules/collection/services/collection-service'

/**
 * Server action that adds a paint to the authenticated user's collection.
 *
 * Idempotent — adding a paint already in the collection succeeds silently.
 * Revalidates the provided path (if any) after a successful insert.
 *
 * @param paintId - UUID of the paint to add.
 * @param revalidate - Optional page path to revalidate after the action.
 * @returns An object with an optional `error` string on failure.
 */
export async function addToCollection(
  paintId: string,
  revalidate?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to add paints to your collection.' }
  }

  const service = createCollectionService(supabase)
  const result = await service.addPaint(user.id, paintId)

  if (!result.error && revalidate) {
    revalidatePath(revalidate, 'page')
  }

  return result
}
