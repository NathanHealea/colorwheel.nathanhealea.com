import { hexToRgb } from '@/modules/color-wheel/utils/hex-to-hsl'

/** CIE L*a*b* color, where L is lightness (0–100) and a/b are chromatic axes. */
export type Lab = { L: number; a: number; b: number }

/**
 * Converts linear-light sRGB channels (0–1) to CIE XYZ (D65 illuminant).
 *
 * Uses the standard IEC 61966-2-1 matrix for sRGB primaries.
 *
 * @param r - Linear red channel (0–1).
 * @param g - Linear green channel (0–1).
 * @param b - Linear blue channel (0–1).
 * @returns XYZ tristimulus values scaled to the range where Y=100 represents white.
 */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)

  return {
    x: (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100,
    y: (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) * 100,
    z: (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) * 100,
  }
}

/**
 * Converts CIE XYZ to CIE L*a*b* using the D65 reference white.
 *
 * Reference white: Xn=95.047, Yn=100.000, Zn=108.883.
 *
 * @param xyz - XYZ tristimulus values.
 * @returns CIE Lab color.
 */
function xyzToLab({ x, y, z }: { x: number; y: number; z: number }): Lab {
  const Xn = 95.047
  const Yn = 100.0
  const Zn = 108.883

  const ε = 0.008856
  const κ = 903.3

  const f = (t: number) => (t > ε ? Math.cbrt(t) : (κ * t + 16) / 116)

  const fx = f(x / Xn)
  const fy = f(y / Yn)
  const fz = f(z / Zn)

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

/**
 * Converts a 6-digit hex color to CIE L*a*b* via sRGB → linear RGB → XYZ (D65) → Lab.
 *
 * Suitable for perceptual distance calculations such as {@link deltaE76}.
 *
 * @param hex - Hex color string (e.g. `"#FF8C00"` or `"FF8C00"`).
 * @returns CIE Lab representation of the color.
 */
export function hexToLab(hex: string): Lab {
  const { r, g, b } = hexToRgb(hex)
  const xyz = rgbToXyz(r / 255, g / 255, b / 255)
  return xyzToLab(xyz)
}
