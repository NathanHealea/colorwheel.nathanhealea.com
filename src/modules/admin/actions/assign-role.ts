'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Assigns a role to a user.
 *
 * Inserts into `user_roles`. RLS enforces admin-only access and prevents
 * self-modification. Revalidates the role detail and users pages on success.
 *
 * @param userId - UUID of the user to assign the role to.
 * @param roleId - UUID of the role to assign.
 * @returns Object with an optional `error` message on failure.
 */
export async function assignRole(
  userId: string,
  roleId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId })

  if (error) {
    if (error.code === '23505') {
      return { error: 'User already has this role.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/roles')
  revalidatePath('/admin/users')
  return {}
}
