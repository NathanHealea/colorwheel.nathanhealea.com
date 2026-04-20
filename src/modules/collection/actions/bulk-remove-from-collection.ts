'use server'

import { createClient } from '@/lib/supabase/server'
import { createCollectionService } from '@/modules/collection/services/collection-service'

/** Maximum number of paints that can be removed in a single bulk call. */
const MAX_BULK_SIZE = 500

/**
 * Server action that removes multiple paints from the authenticated user's collection.
 *
 * Idempotent — paint IDs not in the collection are ignored.
 * Hard-capped at {@link MAX_BULK_SIZE} IDs per call.
 *
 * @param paintIds - Array of paint UUIDs to remove (max 500).
 * @returns The number of rows removed and an optional `error` string on failure.
 */
export async function bulkRemoveFromCollection(
  paintIds: string[],
): Promise<{ error?: string; removedCount: number }> {
  if (paintIds.length > MAX_BULK_SIZE) {
    return {
      error: `Cannot remove more than ${MAX_BULK_SIZE} paints at once.`,
      removedCount: 0,
    }
  }

  if (paintIds.length === 0) {
    return { removedCount: 0 }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to remove paints from your collection.', removedCount: 0 }
  }

  const service = createCollectionService(supabase)
  return service.bulkRemovePaints(user.id, paintIds)
}
