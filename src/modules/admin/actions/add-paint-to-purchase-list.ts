'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Server action that adds a paint to a target user's purchase list.
 *
 * Self-protection: rejects if the admin is attempting to modify their own
 * purchase list through the admin UI. Handles duplicate inserts gracefully
 * (unique constraint violation returns a human-readable error).
 *
 * Revalidates both the admin purchase-list index and the user's detail page so
 * the new row and updated count render on the next navigation.
 *
 * @param userId - UUID of the target user.
 * @param paintId - UUID of the paint to add.
 * @returns An object with an optional `error` string on failure.
 */
export async function addPaintToPurchaseList(
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
    .insert({ user_id: userId, paint_id: paintId })

  if (error) {
    if (error.code === '23505') {
      return { error: "Paint is already on this user's purchase list." }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/purchase-lists')
  revalidatePath(`/admin/purchase-lists/${userId}`)
  return {}
}
