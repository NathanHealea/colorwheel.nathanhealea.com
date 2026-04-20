import { createClient } from '@/lib/supabase/client'

import { createCollectionService } from '@/modules/collection/services/collection-service'

/**
 * Creates a collection service using the browser-side Supabase client.
 *
 * @returns A collection service instance bound to the browser client.
 */
export function getCollectionService() {
  return createCollectionService(createClient())
}
