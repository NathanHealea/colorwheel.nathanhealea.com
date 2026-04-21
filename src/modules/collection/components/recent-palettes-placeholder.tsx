/**
 * Placeholder for the "Recently viewed palettes" section.
 *
 * This component is intentionally inert stub UI. The palettes feature is
 * tracked under the Community & Social epic. Replace this component when
 * palettes ship — do not wire up client-side tracking or localStorage hooks
 * to this component in the meantime.
 */
export function RecentPalettesPlaceholder() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recently viewed palettes</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted"
          >
            <p className="text-sm text-muted-foreground">Palettes coming soon</p>
          </div>
        ))}
      </div>
    </div>
  )
}
