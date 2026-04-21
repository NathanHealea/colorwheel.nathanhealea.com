'use server'

import { createClient } from '@/lib/supabase/server'
import { createCollectionService } from '@/modules/collection/services/collection-service'
import type { CollectionPaint } from '@/modules/collection/types/collection-paint'

/**
 * Server action that searches the authenticated user's collection.
 *
 * Delegates to {@link CollectionService.searchCollection}. Returns an empty
 * array if the user is unauthenticated rather than an error, so the search
 * component degrades gracefully without surfacing auth errors in the UI.
 *
 * @param query - Search string. Prefix with `#` to match hex codes.
 * @returns `{ paints: CollectionPaint[] }` on success, `{ error: string }` on failure.
 */
export async function searchCollection(
  query: string,
): Promise<{ paints: CollectionPaint[] } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { paints: [] }

  const service = createCollectionService(supabase)
  const paints = await service.searchCollection(user.id, { query })
  return { paints }
}
