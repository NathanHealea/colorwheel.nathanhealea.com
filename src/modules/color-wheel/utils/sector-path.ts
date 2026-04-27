const DEG_TO_RAD = Math.PI / 180

/**
 * Generates an SVG path `d` string for a pie-slice sector.
 *
 * The path is centered at the SVG origin (0, 0) and uses clockwise winding.
 * Hue 0° corresponds to the top of the wheel (12 o'clock position).
 *
 * @param startAngleDeg - Start angle in degrees (0 = top, clockwise).
 * @param endAngleDeg - End angle in degrees.
 * @param outerRadius - Outer radius of the sector in SVG units.
 * @returns SVG path `d` attribute string.
 */
export function sectorPath(
  startAngleDeg: number,
  endAngleDeg: number,
  outerRadius: number,
): string {
  const start = (startAngleDeg - 90) * DEG_TO_RAD
  const end = (endAngleDeg - 90) * DEG_TO_RAD
  const x1 = outerRadius * Math.cos(start)
  const y1 = outerRadius * Math.sin(start)
  const x2 = outerRadius * Math.cos(end)
  const y2 = outerRadius * Math.sin(end)
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0
  return `M 0 0 L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

/**
 * Converts a hue's 0-based sort index to its sector start angle in degrees.
 *
 * Uses array index (not raw sort_order) to guarantee evenly spaced sectors
 * regardless of gaps in sort_order values.
 *
 * @param index - 0-based position of the hue in the sorted array.
 * @param totalHues - Total number of top-level hues.
 * @returns Start angle in degrees (0 = top, clockwise).
 */
export function indexToStartAngle(index: number, totalHues: number): number {
  return (index / totalHues) * 360
}
