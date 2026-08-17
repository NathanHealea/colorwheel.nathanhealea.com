/**
 * Aggregated statistics for a user's purchase list.
 *
 * Mirrors the shape of the collection stats so both dashboards can share the
 * same card layout.
 */
export type PurchaseListStats = {
  /** Total number of paints on the purchase list. */
  total: number
  /** Paint counts grouped by brand name, highest first, capped at the top 5. */
  byBrand: Array<{ brand: string; count: number }>
  /** Paint counts grouped by paint type, highest first. Missing types are grouped as `Unknown`. */
  byType: Array<{ type: string; count: number }>
}
