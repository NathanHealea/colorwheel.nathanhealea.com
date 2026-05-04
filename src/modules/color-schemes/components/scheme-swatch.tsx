'use client'

import { SchemePaintMatchCard } from '@/modules/color-schemes/components/scheme-paint-match-card'
import type { SchemeColor } from '@/modules/color-schemes/types/scheme-color'

/**
 * Displays a single computed scheme color — swatch block, label, hex/hue values, and nearest paint cards.
 *
 * Each nearest paint card shows a ΔE badge and includes a collection toggle for authenticated users.
 * When all candidates are filtered out an inline empty-state message is shown.
 *
 * @param props.color - The computed {@link SchemeColor} to display.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.ownedIds - Set of paint IDs in the user's collection.
 */
export function SchemeSwatch({
  color,
  isAuthenticated,
  ownedIds,
}: {
  color: SchemeColor
  isAuthenticated: boolean
  ownedIds: Set<string>
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 min-w-40">
      <div
        className="w-full rounded-lg border border-border aspect-square"
        style={{ backgroundColor: color.hex }}
        aria-label={`${color.label} color: ${color.hex}`}
      />
      <p className="text-sm font-semibold">{color.label}</p>
      <p className="font-mono text-xs text-muted-foreground">
        {color.hex} &nbsp; {Math.round(color.hue)}°
      </p>
      {color.nearestPaints.length > 0 ? (
        <div className="flex flex-col gap-2">
          {color.nearestPaints.map((match) => (
            <SchemePaintMatchCard
              key={match.paint.id}
              match={match}
              isOwned={ownedIds.has(match.paint.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No matching paints with the current filters.</p>
      )}
    </div>
  )
}
