import { createClient } from '@/lib/supabase/server'

import { createCollectionService } from '@/modules/collection/services/collection-service'

/**
 * Creates a collection service using the server-side Supabase client.
 *
 * @returns A collection service instance bound to the server client.
 */
export async function getCollectionService() {
  const supabase = await createClient()
  return createCollectionService(supabase)
}
