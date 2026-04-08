import type { Role } from '@/types/role'

/**
 * Check whether a user has a specific role.
 *
 * Stub implementation — always returns `false` until the role tables
 * exist (from the Role-Based Authorization feature).
 */
export async function hasRole(_userId: string, _role: Role): Promise<boolean> {
  try {
    // TODO: query the `user_roles` table once it exists
    return false
  } catch {
    return false
  }
}

/**
 * Get all roles for a user.
 *
 * Stub implementation — always returns `['user']` until the role tables exist.
 */
export async function getUserRoles(_userId: string): Promise<Role[]> {
  try {
    // TODO: query the `user_roles` table once it exists
    return ['user']
  } catch {
    return ['user']
  }
}
