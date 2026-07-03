/**
 * A single swatch position on a gradient scale.
 *
 * Rendered by the `GradientScale` component as one bar in a dark-to-light
 * run of swatches. The component is brand-agnostic — items carry only the
 * display data needed to draw and link a position.
 *
 * @remarks
 * - `label` is shown as a tooltip and used for accessible naming.
 * - `href` links the bar to its paint detail page; omit it for the current
 *   paint (marked, not linked) or for purely decorative scales.
 */
export type GradientScaleItem = {
  /** Hex color used as the bar's fill (e.g., "#7B7E80"). */
  hex: string
  /** Display name for the swatch (e.g., the paint name). */
  label?: string
  /** Link target for the swatch (e.g., the paint detail page). */
  href?: string
}
