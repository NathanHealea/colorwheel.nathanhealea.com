'use client'

import { PaintCard } from '@/modules/paints/components/paint-card'
import { PurchaseListToggle } from '@/modules/purchase-list/components/purchase-list-toggle'

/**
 * A paint card with a purchase list toggle overlaid at the bottom-right.
 *
 * Wraps {@link PaintCard} in a `relative` container and absolutely positions a
 * {@link PurchaseListToggle} so the full card remains clickable as a link while
 * the button intercepts its own clicks (via `stopPropagation` +
 * `preventDefault`).
 *
 * The toggle sits bottom-right so it stays visually distinct from the
 * collection toggle, which occupies the top-right corner on
 * `CollectionPaintCard`.
 *
 * @param props.id - The paint's database UUID.
 * @param props.name - The display name of the paint.
 * @param props.hex - The hex color value for the swatch background.
 * @param props.brand - The brand name (e.g., "Citadel").
 * @param props.paintType - The paint type (e.g., "base", "layer").
 * @param props.isMetallic - Whether the paint is metallic; passed through to {@link PaintCard} for gradient rendering.
 * @param props.isDiscontinued - Whether the paint is discontinued; renders a badge on the swatch.
 * @param props.isOnPurchaseList - Whether the paint is on the user's purchase list.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.revalidatePath - Optional page path to revalidate after toggle.
 * @param props.className - Optional additional CSS classes for the card wrapper.
 */
export function PaintCardWithPurchaseToggle({
  id,
  name,
  hex,
  brand,
  paintType,
  isMetallic = false,
  isDiscontinued = false,
  isOnPurchaseList,
  isAuthenticated,
  revalidatePath,
  className,
}: {
  id: string
  name: string
  hex: string
  brand?: string
  paintType?: string | null
  isMetallic?: boolean
  isDiscontinued?: boolean
  isOnPurchaseList: boolean
  isAuthenticated: boolean
  revalidatePath?: string
  className?: string
}) {
  return (
    <div className="relative h-full w-full">
      <PaintCard
        size="lg"
        id={id}
        name={name}
        hex={hex}
        brand={brand}
        paintType={paintType}
        isMetallic={isMetallic}
        isDiscontinued={isDiscontinued}
        className={className}
      />
      <PurchaseListToggle
        paintId={id}
        paintName={name}
        isOnPurchaseList={isOnPurchaseList}
        isAuthenticated={isAuthenticated}
        size="sm"
        revalidatePath={revalidatePath}
        className="absolute bottom-1 right-1"
      />
    </div>
  )
}
