/**
 * Maps a paint's hue and lightness to SVG coordinates on the color wheel.
 *
 * Angle convention matches {@link hslToPosition}: `h=0` (red) maps to the top
 * of the wheel (12 o'clock), rotating clockwise — consistent with the
 * `sector-path.ts` drawing convention.
 *
 * Radius formula: `r = wheelRadius * (1 - l)`. `l=1` (white) → center;
 * `l=0` (black) → outer edge. No cap is applied.
 *
 * @param h - Hue as a fraction (0–1), where 0 = red.
 * @param l - Lightness as a fraction (0–1).
 * @param wheelRadius - Outer radius of the color wheel in SVG units.
 * @returns SVG `{ x, y }` coordinates for the paint marker.
 */
export function paintToWheelPosition(
  h: number,
  l: number,
  wheelRadius: number,
): { x: number; y: number } {
  const angleRad = (h * 360 - 90) * (Math.PI / 180)
  const r = wheelRadius * (1 - l)
  return {
    x: r * Math.cos(angleRad),
    y: r * Math.sin(angleRad),
  }
}
