/**
 * Converts HSL values to a 6-digit hex color string.
 *
 * @param h - Hue in degrees (0–360).
 * @param s - Saturation as a fraction (0–1).
 * @param l - Lightness as a fraction (0–1).
 * @returns A 6-digit hex string with `#` prefix (e.g. `"#ff4400"`).
 */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
