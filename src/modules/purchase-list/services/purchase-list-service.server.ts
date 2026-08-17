import { createClient } from '@/lib/supabase/server'

import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'

/**
 * Creates a purchase list service using the server-side Supabase client.
 *
 * @returns A purchase list service instance bound to the server client.
 */
export async function getPurchaseListService() {
  const supabase = await createClient()
  return createPurchaseListService(supabase)
}
