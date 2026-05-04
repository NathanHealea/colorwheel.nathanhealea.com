/**
 * Active filter selections for the scheme paint suggestions panel.
 *
 * `brandIds` restricts candidates to specific brands; an empty array means no brand filter.
 * `ownedOnly` limits candidates to paints in the user's collection (silently ignored when unauthenticated).
 */
export type SchemeFilterState = {
  brandIds: string[]
  ownedOnly: boolean
}

/** Default filter state with no active filters. */
export const EMPTY_SCHEME_FILTER_STATE: SchemeFilterState = {
  brandIds: [],
  ownedOnly: false,
}
