/**
 * Lightweight paint projection for color wheel rendering.
 *
 * Contains only the fields needed to position a paint on the wheel,
 * style its marker, and populate the hover tooltip.
 */
export type ColorWheelPaint = {
  id: string
  name: string
  hex: string
  hue: number
  saturation: number
  lightness: number
  is_metallic: boolean
  brand_name: string
  product_line_name: string
}
