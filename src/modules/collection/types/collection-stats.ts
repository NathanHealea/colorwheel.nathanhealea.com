/**
 * Aggregated statistics for a user's paint collection.
 *
 * Returned by {@link CollectionService.getStats}.
 */
export type CollectionStats = {
  /** Total number of paints in the collection. */
  total: number
  /** Top brands by paint count, descending, capped at 5. */
  byBrand: Array<{ brand: string; count: number }>
  /** All paint types with their counts. */
  byType: Array<{ type: string; count: number }>
}
