/**
 * A row from the `user_paints` table representing a paint in a user's collection.
 *
 * Both `user_id` and `paint_id` are UUIDs. `notes` is nullable — the field
 * ships as a DB column only; no UI affordance exists until a future enhancement.
 */
export type UserPaint = {
  user_id: string
  paint_id: string
  added_at: string
  notes: string | null
}
