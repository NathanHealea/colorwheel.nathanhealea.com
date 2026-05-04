import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import { hexToLab } from '@/modules/color-wheel/utils/hex-to-lab'
import { deltaE76 } from '@/modules/color-wheel/utils/delta-e'
import type { PaintMatch } from '@/modules/color-schemes/types/paint-match'

/**
 * Finds the paints closest to `targetHex` ranked by CIE76 perceptual distance.
 *
 * Converts the target hex to Lab once, then scores every candidate paint and
 * returns the top `limit` results sorted ascending by ΔE (closest first).
 *
 * @param targetHex - Hex color to match against (e.g. `"#FF8C00"`).
 * @param paints - Candidate paints to search — apply brand/owned filters before calling.
 * @param limit - Maximum matches to return (default 3).
 * @returns Up to `limit` {@link PaintMatch} entries sorted by ΔE ascending.
 */
export function findMatchingPaints(
  targetHex: string,
  paints: ColorWheelPaint[],
  limit = 3,
): PaintMatch[] {
  const targetLab = hexToLab(targetHex)

  return paints
    .map((paint) => ({ paint, deltaE: deltaE76(targetLab, hexToLab(paint.hex)) }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, limit)
}
