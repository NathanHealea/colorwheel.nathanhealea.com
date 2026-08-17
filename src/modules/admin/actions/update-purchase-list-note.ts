'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/** Maximum number of characters accepted in a purchase list note. */
const MAX_NOTE_LENGTH = 500

/**
 * Server action that updates the `notes` field on a target user's purchase
 * list row.
 *
 * Self-protection: rejects if the admin is attempting to modify their own
 * purchase list through the admin UI. Notes are trimmed, an empty string is
 * stored as `null`, and anything longer than {@link MAX_NOTE_LENGTH} characters
 * is rejected before the write.
 *
 * Revalidates the user's detail page only — the index table does not render
 * note content.
 *
 * @param userId - UUID of the target user.
 * @param paintId - UUID of the paint whose row is being edited.
 * @param notes - The new note text, or `null` to clear it.
 * @returns An object with an optional `error` string on failure.
 */
export async function updatePurchaseListNote(
  userId: string,
  paintId: string,
  notes: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  if (user.id === userId) {
    return { error: 'Use your own purchase list page to modify your paints.' }
  }

  const trimmed = notes?.trim() ?? ''

  if (trimmed.length > MAX_NOTE_LENGTH) {
    return { error: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` }
  }

  const { error } = await supabase
    .from('user_purchase_list')
    .update({ notes: trimmed === '' ? null : trimmed })
    .eq('user_id', userId)
    .eq('paint_id', paintId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/purchase-lists/${userId}`)
  return {}
}
