/**
 * A row from the `user_purchase_list` table representing a paint a user
 * intends to buy.
 *
 * Both `user_id` and `paint_id` are UUIDs. `notes` is nullable — the field
 * ships as a DB column only; no UI affordance exists until a future
 * enhancement. `updated_at` is maintained by a database trigger.
 */
export type UserPurchaseList = {
  user_id: string
  paint_id: string
  added_at: string
  notes: string | null
  updated_at: string
}
