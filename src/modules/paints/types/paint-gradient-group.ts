/**
 * A brand-defined gradient color group with its member paints.
 *
 * Represents one row of `paint_gradient_groups` joined with its members
 * (e.g., Army Painter Fanatic's "Black & Greys"). Members are ordered by
 * `position` ascending — position 1 is the darkest paint, the last
 * position the lightest.
 *
 * Returned by `getGradientGroupForPaint`; `null` when a paint belongs to
 * no gradient group.
 */
export type PaintGradientGroup = {
  /** The gradient group's UUID. */
  id: string
  /** Display name of the group (e.g., "Black & Greys"). */
  name: string
  /** Member paints ordered dark to light by `position`. */
  paints: {
    /** The paint's UUID. */
    id: string
    /** The paint's display name. */
    name: string
    /** The paint's URL slug. */
    slug: string
    /** The paint's hex color (e.g., "#7B7E80"). */
    hex: string
    /** 1-based position on the scale; 1 is the darkest. */
    position: number
  }[]
}
