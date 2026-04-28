/**
 * A single segment on the Itten 12-color wheel.
 *
 * All angles are in wheel-position degrees where 0° = top (12 o'clock),
 * rotating clockwise — matching the `sector-path.ts` drawing convention.
 */
export interface ColorSegment {
  /** Human-readable segment name. */
  name: string
  /** Start angle in wheel degrees (inclusive). */
  hueStart: number
  /** End angle in wheel degrees (exclusive). */
  hueEnd: number
  /** Center angle of the segment in wheel degrees. */
  midAngle: number
}

/**
 * The 12 segments of the Itten color wheel, each spanning 30° of hue space.
 *
 * Angles use the wheel-position convention (0° = Red = top, clockwise) shared
 * by `sector-path.ts` and `hslToPosition`.
 */
export const COLOR_SEGMENTS: ColorSegment[] = [
  { name: 'Red', hueStart: 345, hueEnd: 15, midAngle: 0 },
  { name: 'Red-Orange', hueStart: 15, hueEnd: 45, midAngle: 30 },
  { name: 'Orange', hueStart: 45, hueEnd: 75, midAngle: 60 },
  { name: 'Yellow-Orange', hueStart: 75, hueEnd: 105, midAngle: 90 },
  { name: 'Yellow', hueStart: 105, hueEnd: 135, midAngle: 120 },
  { name: 'Yellow-Green', hueStart: 135, hueEnd: 165, midAngle: 150 },
  { name: 'Green', hueStart: 165, hueEnd: 195, midAngle: 180 },
  { name: 'Blue-Green', hueStart: 195, hueEnd: 225, midAngle: 210 },
  { name: 'Blue', hueStart: 225, hueEnd: 255, midAngle: 240 },
  { name: 'Blue-Violet', hueStart: 255, hueEnd: 285, midAngle: 270 },
  { name: 'Violet', hueStart: 285, hueEnd: 315, midAngle: 300 },
  { name: 'Red-Violet', hueStart: 315, hueEnd: 345, midAngle: 330 },
]

/**
 * The 12 boundary angles (in wheel-position degrees) between Itten color wheel
 * segments. Sorted ascending.
 */
export const SEGMENT_BOUNDARIES: number[] = [
  15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,
]
