'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Server action that removes a single paint from a target user's purchase list.
 *
 * Self-protection: rejects if the admin is attempting to modify their own
 * purchase list through the admin UI. Deleting a row that does not exist is a
 * no-op rather than an error.
 *
 * Revalidates both the admin purchase-list index and the user's detail page.
 *
 * @param userId - UUID of the target user.
 * @param paintId - UUID of the paint to remove.
 * @returns An object with an optional `error` string on failure.
 */
export async function removePaintFromPurchaseList(
  userId: string,
  paintId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  if (user.id === userId) {
    return { error: 'Use your own purchase list page to modify your paints.' }
  }

  const { error } = await supabase
    .from('user_purchase_list')
    .delete()
    .eq('user_id', userId)
    .eq('paint_id', paintId)

  if (error) return { error: error.message }

  revalidatePath('/admin/purchase-lists')
  revalidatePath(`/admin/purchase-lists/${userId}`)
  return {}
}
