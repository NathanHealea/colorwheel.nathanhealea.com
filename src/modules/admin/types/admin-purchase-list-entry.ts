/**
 * A single `user_purchase_list` row as rendered by the admin detail table.
 *
 * Flattens the nested `paints → product_lines → brands` join into the fields
 * the table actually renders. Rows whose paint join resolved to `null` (a
 * deleted paint racing the read) are filtered out by the service, so every
 * field here is guaranteed present except the nullable columns below.
 */
export type AdminPurchaseListEntry = {
  /** UUID of the paint on the purchase list. */
  paint_id: string
  /** Paint name. */
  name: string
  /** Paint hex colour, including the leading `#`. */
  hex: string
  /** Paint type (e.g. `Base`, `Wash`), or `null` when untyped. */
  paint_type: string | null
  /** Name of the brand that makes the paint. */
  brand_name: string
  /** ISO timestamp of when the paint was added to the purchase list. */
  added_at: string
  /** ISO timestamp of the last mutation to the row (maintained by trigger). */
  updated_at: string
  /** Free-form admin/user note attached to the row, or `null` when unset. */
  notes: string | null
}
