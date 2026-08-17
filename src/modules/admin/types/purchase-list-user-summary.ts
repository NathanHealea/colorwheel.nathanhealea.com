/**
 * One row of the admin purchase-list index table: a user profile plus the
 * aggregated size and recency of their purchase list.
 *
 * `display_name`, `email`, and `avatar_url` are nullable because the
 * `profiles` row may be incomplete (legacy rows have no synced email).
 * `paint_count` is `0` for users who have never added a paint, and
 * `last_activity` is `null` for those same users — there is no
 * `user_purchase_list` row to read a timestamp from.
 */
export type PurchaseListUserSummary = {
  /** UUID of the user (`profiles.id`). */
  id: string
  /** The user's display name, or `null` when not set. */
  display_name: string | null
  /** The user's email synced from `auth.users`, or `null` for legacy rows. */
  email: string | null
  /** The user's avatar URL, or `null` when not set. */
  avatar_url: string | null
  /** ISO timestamp of when the profile was created. */
  created_at: string
  /** Number of paints on this user's purchase list. */
  paint_count: number
  /**
   * ISO timestamp of the most recent `updated_at` across the user's purchase
   * list rows, or `null` when the list is empty.
   */
  last_activity: string | null
}
