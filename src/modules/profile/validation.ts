export type ProfileFormState = {
  errors?: { display_name?: string }
  error?: string
} | null

/**
 * Validates a display name string.
 * Returns an error message string if invalid, or `null` if valid.
 *
 * Rules:
 * - Required (non-empty after trim)
 * - 2–50 characters
 * - Only letters, numbers, hyphens, underscores
 */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'Display name is required.'
  }

  if (trimmed.length < 2) {
    return 'Display name must be at least 2 characters.'
  }

  if (trimmed.length > 50) {
    return 'Display name must be 50 characters or fewer.'
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return 'Display name can only contain letters, numbers, hyphens, and underscores.'
  }

  return null
}
