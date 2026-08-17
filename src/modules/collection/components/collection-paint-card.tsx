'use client'

import { PaintCard } from '@/modules/paints/components/paint-card'
import { CollectionToggle } from '@/modules/collection/components/collection-toggle'
import { AddToPaletteButton } from '@/modules/palettes/components/add-to-palette-button'
import { PurchaseListToggle } from '@/modules/purchase-list/components/purchase-list-toggle'

/**
 * A paint card with a collection toggle and add-to-palette button overlaid at the top-right,
 * and an optional purchase list toggle at the bottom-right.
 *
 * Wraps {@link PaintCard} in a `relative` container and absolutely positions
 * a {@link CollectionToggle} and {@link AddToPaletteButton} so the full card
 * remains clickable as a link while each button intercepts its own clicks
 * (via `stopPropagation` + `preventDefault`).
 *
 * @remarks
 * The {@link PurchaseListToggle} only renders when `showPurchaseToggle` is
 * `true`. Call-sites must opt in so the toggle is never shown with a stale
 * `isOnPurchaseList={false}` on surfaces that do not fetch purchase list state.
 *
 * @param props.id - The paint's database UUID.
 * @param props.name - The display name of the paint.
 * @param props.hex - The hex color value for the swatch background.
 * @param props.brand - The brand name (e.g., "Citadel").
 * @param props.paintType - The paint type (e.g., "base", "layer").
 * @param props.isMetallic - Whether the paint is metallic; passed through to {@link PaintCard} for gradient rendering.
 * @param props.isInCollection - Whether the paint is in the user's collection.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.showPurchaseToggle - Renders the purchase list toggle at the bottom-right when `true`.
 * @param props.isOnPurchaseList - Whether the paint is on the user's purchase list.
 * @param props.revalidatePath - Optional page path to revalidate after toggle.
 * @param props.className - Optional additional CSS classes for the card wrapper.
 */
export function CollectionPaintCard({
  id,
  name,
  hex,
  brand,
  paintType,
  isMetallic = false,
  isInCollection,
  isAuthenticated,
  showPurchaseToggle = false,
  isOnPurchaseList = false,
  revalidatePath,
  className,
}: {
  id: string
  name: string
  hex: string
  brand?: string
  paintType?: string | null
  isMetallic?: boolean
  isInCollection: boolean
  isAuthenticated: boolean
  showPurchaseToggle?: boolean
  isOnPurchaseList?: boolean
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
        className={className}
      />
      <CollectionToggle
        paintId={id}
        paintName={name}
        isInCollection={isInCollection}
        isAuthenticated={isAuthenticated}
        size="sm"
        revalidatePath={revalidatePath}
        className="absolute right-1 top-1"
      />
      <AddToPaletteButton
        paintId={id}
        paintName={name}
        variant="icon"
        isAuthenticated={isAuthenticated}
        className="absolute right-1 top-9"
      />
      {showPurchaseToggle && (
        <PurchaseListToggle
          paintId={id}
          paintName={name}
          isOnPurchaseList={isOnPurchaseList}
          isAuthenticated={isAuthenticated}
          size="sm"
          revalidatePath={revalidatePath}
          className="absolute bottom-1 right-1"
        />
      )}
    </div>
  )
}
