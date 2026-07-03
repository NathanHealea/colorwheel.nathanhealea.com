import Link from 'next/link'

import type { GradientScaleItem } from '@/modules/paints/types/gradient-scale-item'

/** Bar height (percent of the row) for the first — darkest — position. */
const MIN_BAR_HEIGHT_PCT = 40

/** Bar height (percent of the row) for the last — lightest — position. */
const MAX_BAR_HEIGHT_PCT = 100

/**
 * A dark-to-light gradient scale of color swatch bars.
 *
 * Renders an ordered run of swatches as bars that step up in height from
 * left (darkest, shortest) to right (lightest, tallest), with a triangle
 * marker above the current position. Brand-agnostic — it only knows about
 * hex colors, labels, and links, so any brand's color groups (Army Painter
 * Fanatic, Citadel, Green Stuff World, …) can drive it.
 *
 * Items with an `href` link to their paint detail page and show their
 * `label` as a tooltip. The current item is marked (`aria-current`) and not
 * linked.
 *
 * @param props.label - Heading shown above the scale (e.g., the group name
 *   "Black & Greys").
 * @param props.items - Swatch positions ordered dark to light. See
 *   {@link GradientScaleItem}.
 * @param props.currentIndex - Index into `items` of the current paint's
 *   position; marked with a triangle and rendered as a non-link.
 */
export function GradientScale({
  label,
  items,
  currentIndex,
}: {
  label: string
  items: GradientScaleItem[]
  currentIndex: number
}) {
  if (items.length === 0) return null

  /** Percent height of the bar at `index`, ramping darkest to lightest. */
  const barHeight = (index: number) =>
    items.length === 1
      ? MAX_BAR_HEIGHT_PCT
      : MIN_BAR_HEIGHT_PCT +
        ((MAX_BAR_HEIGHT_PCT - MIN_BAR_HEIGHT_PCT) * index) / (items.length - 1)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      <ol className="flex h-20 max-w-md items-end gap-1 pt-5" aria-label={label}>
        {items.map((item, index) => {
          const isCurrent = index === currentIndex
          return (
            <li
              key={`${item.hex}-${index}`}
              className="relative flex-1"
              style={{ height: `${barHeight(index)}%` }}
            >
              {isCurrent && (
                <span
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs leading-none text-foreground"
                  aria-hidden="true"
                >
                  &#9660;
                </span>
              )}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className="block h-full w-full rounded-sm border border-border transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  style={{ backgroundColor: item.hex }}
                />
              ) : (
                <div
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={
                    isCurrent
                      ? 'h-full w-full rounded-sm border border-border ring-2 ring-primary'
                      : 'h-full w-full rounded-sm border border-border'
                  }
                  style={{ backgroundColor: item.hex }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
