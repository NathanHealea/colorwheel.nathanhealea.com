import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import type { SchemeFilterState } from '@/modules/color-schemes/types/scheme-filter-state'

/**
 * Filters a paint array by the active scheme filter state.
 *
 * Applies brand and owned-only filters. `ownedOnly` is silently ignored when
 * `ownedIds` is undefined or empty, so unauthenticated users and toggling the
 * filter off both behave gracefully.
 *
 * @param paints - Full paint candidate array.
 * @param state - Active filter selections.
 * @param ownedIds - Set of paint IDs in the user's collection. Pass `undefined` when unauthenticated.
 * @returns Filtered paint array.
 */
export function applySchemeFilters(
  paints: ColorWheelPaint[],
  state: SchemeFilterState,
  ownedIds?: Set<string>,
): ColorWheelPaint[] {
  const { brandIds, ownedOnly } = state
  const noBrandFilter = brandIds.length === 0
  const noOwnedFilter = !ownedOnly || !ownedIds || ownedIds.size === 0

  if (noBrandFilter && noOwnedFilter) return paints

  const brandSet = noBrandFilter ? null : new Set(brandIds)

  return paints.filter((paint) => {
    if (!noOwnedFilter && !ownedIds!.has(paint.id)) return false
    if (brandSet && !brandSet.has(paint.brand_id)) return false
    return true
  })
}
