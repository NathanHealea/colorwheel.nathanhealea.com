'use client'

import { CollectionPaintCard } from '@/modules/collection/components/collection-paint-card'
import type { PaintMatch } from '@/modules/color-schemes/types/paint-match'

/**
 * Wraps {@link CollectionPaintCard} and overlays a ΔE badge in the bottom-right corner.
 *
 * The badge is purely informational — it is pointer-events-none so the underlying
 * link from PaintCard remains fully clickable.
 *
 * @param props.match - The {@link PaintMatch} containing the paint and its ΔE score.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.isOwned - Whether this paint is in the user's collection.
 */
export function SchemePaintMatchCard({
  match,
  isAuthenticated,
  isOwned,
}: {
  match: PaintMatch
  isAuthenticated: boolean
  isOwned: boolean
}) {
  const { paint, deltaE } = match

  return (
    <div className="relative w-full">
      <CollectionPaintCard
        id={paint.id}
        name={paint.name}
        hex={paint.hex}
        brand={paint.brand_name}
        paintType={paint.paint_type}
        isInCollection={isOwned}
        isAuthenticated={isAuthenticated}
        revalidatePath="/schemes"
      />
      <span
        className="badge badge-soft badge-xs pointer-events-none absolute bottom-1 left-1"
        aria-label={`Delta E ${deltaE.toFixed(1)}`}
      >
        ΔE {deltaE.toFixed(1)}
      </span>
    </div>
  )
}
