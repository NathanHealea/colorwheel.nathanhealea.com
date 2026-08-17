import type { PaintWithBrand } from '@/modules/paints/services/paint-service'

/**
 * A paint on the user's purchase list, extending {@link PaintWithBrand} with
 * the timestamp the user added it.
 */
export type PurchaseListPaint = PaintWithBrand & {
  /** ISO 8601 timestamp of when the paint was added to the purchase list. */
  added_at: string
}
