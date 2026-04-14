import Link from 'next/link'

import type { IttenHue } from '@/types/color'

/**
 * A clickable card displaying a child hue swatch, name, and paint count.
 *
 * Accepts a child-level {@link IttenHue} entry (one with `parent_id` set).
 * Links to `/hues/[id]` showing all paints assigned to this child hue.
 *
 * @param props.hue - The child hue (named color) data to display.
 * @param props.paintCount - Number of paints assigned to this child hue.
 */
export function ChildHueCard({ hue, paintCount }: { hue: IttenHue; paintCount: number }) {
  return (
    <Link
      href={`/hues/${hue.id}`}
      className="group flex flex-col items-center gap-2 rounded-lg border border-border p-3 transition-shadow hover:shadow-md"
    >
      <div
        className="size-16 rounded-lg border border-border"
        style={{ backgroundColor: hue.hex_code }}
        aria-hidden="true"
      />
      <p className="text-center text-sm font-medium leading-tight">{hue.name}</p>
      <p className="text-xs text-muted-foreground">
        {paintCount} {paintCount === 1 ? 'paint' : 'paints'}
      </p>
    </Link>
  )
}
