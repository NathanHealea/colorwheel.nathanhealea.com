'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Revokes a role from a user.
 *
 * Looks up the role name and rejects if it is the baseline `user` role,
 * which cannot be removed from any account. The existing
 * `prevent_user_role_deletion` trigger also guards this at the database
 * level. RLS enforces admin-only access and prevents self-modification.
 *
 * @param userId - UUID of the user to revoke the role from.
 * @param roleId - UUID of the role to revoke.
 * @returns Object with an optional `error` message on failure.
 */
export async function revokeRole(
  userId: string,
  roleId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Look up role name to check for the protected "user" role
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single()

  if (fetchError || !role) {
    return { error: 'Role not found.' }
  }

  if (role.name === 'user') {
    return { error: 'The "user" role cannot be revoked from any account.' }
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/roles')
  revalidatePath('/admin/users')
  return {}
}
