import type { Lab } from '@/modules/color-wheel/utils/hex-to-lab'

/**
 * Computes the CIE76 perceptual color distance between two Lab colors.
 *
 * CIE76 is the Euclidean distance in L*a*b* space. It is the simplest
 * perceptual metric and runs in constant time per pair — adequate for
 * ranking paint candidates. CIEDE2000 is deferred until ranking quality
 * complaints surface around saturated or very dark colors.
 *
 * Lower values mean the colors are more similar; 0 means identical.
 *
 * @param a - First Lab color.
 * @param b - Second Lab color.
 * @returns CIE76 Δ distance (non-negative).
 */
export function deltaE76(a: Lab, b: Lab): number {
  const dL = a.L - b.L
  const da = a.a - b.a
  const db = a.b - b.b
  return Math.sqrt(dL * dL + da * da + db * db)
}
