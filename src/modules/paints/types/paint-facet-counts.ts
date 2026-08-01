/**
 * Per-option paint counts for each filter dimension, computed against the
 * current filter context with that dimension held out.
 *
 * Counts reflect the number of paints that would match if the user added
 * that specific option to the existing selection of all other active filters.
 *
 * @property brand - Keyed by `brand.id` (stringified). Count of paints for
 *   that brand given all other active filters.
 * @property type - Keyed by lowercased `paint_type` string. Count of paints
 *   of that type given all other active filters.
 * @property line - Keyed by `product_line.id` (stringified). Count of paints
 *   in that product line given all other active filters. Only populated when
 *   ≥1 brand is selected (mirrors the brand-gated UI).
 * @property hue - Keyed by lowercased top-level hue name. Count of paints in
 *   that hue group given all other active filters, with the hue dimension held
 *   out (parent and child selection both excluded) so selecting a hue never
 *   zeroes out the sibling options.
 * @property childHue - Keyed by lowercased child hue name. Count of paints in
 *   that child hue given all other active filters, with the child dimension
 *   held out but the selected parent kept active via its children. Populated
 *   only when a parent hue is selected; otherwise `{}` (safe to read with
 *   `?? 0` — no defensive null check needed).
 */
export type PaintFacetCounts = {
  brand: Record<string, number>
  type: Record<string, number>
  line: Record<string, number>
  hue: Record<string, number>
  childHue: Record<string, number>
}
