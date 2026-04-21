import type { PaintWithBrand } from '@/modules/paints/services/paint-service'

/**
 * A paint in the user's collection, extending {@link PaintWithBrand} with the
 * timestamp the user added it.
 */
export type CollectionPaint = PaintWithBrand & {
  /** ISO 8601 timestamp of when the paint was added to the collection. */
  added_at: string
}
