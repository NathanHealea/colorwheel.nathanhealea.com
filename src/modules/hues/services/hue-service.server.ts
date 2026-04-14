import { createClient } from '@/lib/supabase/server'

import { createHueService } from '@/modules/hues/services/hue-service'

/**
 * Creates a hue service using the server-side Supabase client.
 *
 * @returns A hue service instance bound to the server client.
 */
export async function getHueService() {
  const supabase = await createClient()
  return createHueService(supabase)
}
