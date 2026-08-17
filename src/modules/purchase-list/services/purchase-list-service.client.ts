import { createClient } from '@/lib/supabase/client'

import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'

/**
 * Creates a purchase list service using the browser-side Supabase client.
 *
 * @returns A purchase list service instance bound to the browser client.
 */
export function getPurchaseListService() {
  return createPurchaseListService(createClient())
}
