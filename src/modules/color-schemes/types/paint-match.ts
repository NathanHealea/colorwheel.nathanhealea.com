import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'

/**
 * A paint candidate paired with its perceptual distance from a target color.
 *
 * Produced by {@link findMatchingPaints} and consumed by {@link SchemePaintMatchCard}.
 */
export type PaintMatch = {
  /** The candidate paint from the database. */
  paint: ColorWheelPaint
  /** CIE76 Δ vs the target color — lower means a closer perceptual match. */
  deltaE: number
}
