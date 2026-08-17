'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Server action that deletes every paint on a target user's purchase list.
 *
 * Self-protection: rejects if the admin is attempting to clear their own
 * purchase list through the admin UI. This is destructive and irreversible —
 * the calling UI gates it behind a type-to-confirm dialog.
 *
 * Revalidates both the admin purchase-list index and the user's detail page.
 *
 * @param userId - UUID of the target user whose purchase list is cleared.
 * @returns An object with an optional `error` string on failure.
 */
export async function clearUserPurchaseList(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  if (user.id === userId) {
    return { error: 'Use your own purchase list page to modify your paints.' }
  }

  const { error } = await supabase.from('user_purchase_list').delete().eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/purchase-lists')
  revalidatePath(`/admin/purchase-lists/${userId}`)
  return {}
}
