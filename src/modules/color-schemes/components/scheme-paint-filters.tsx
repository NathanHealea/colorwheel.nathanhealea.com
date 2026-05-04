'use client'

import { useState } from 'react'
import type { FilterOptions } from '@/modules/color-wheel/utils/derive-filter-options'
import type { SchemeFilterState } from '@/modules/color-schemes/types/scheme-filter-state'

/**
 * Compact filter panel for the scheme paint suggestions.
 *
 * Renders a collapsible brand multi-select and an optional "My collection only"
 * toggle. Active filters are shown as removable chips below the controls.
 * Includes a "Clear all" affordance when at least one filter is active.
 *
 * @param props.options - Available filter options derived from the full paint array.
 * @param props.state - Current active filter selections.
 * @param props.showOwnedFilter - Whether to show the owned-only toggle (true when authenticated).
 * @param props.onChange - Called with the next {@link SchemeFilterState} on any change.
 */
export function SchemePaintFilters({
  options,
  state,
  showOwnedFilter,
  onChange,
}: {
  options: FilterOptions
  state: SchemeFilterState
  showOwnedFilter: boolean
  onChange: (next: SchemeFilterState) => void
}) {
  const [brandsOpen, setBrandsOpen] = useState(false)

  const activeCount = state.brandIds.length + (state.ownedOnly ? 1 : 0)
  const brandById = new Map(options.brands.map((b) => [b.id, b.name]))

  function toggleBrand(id: string) {
    const next = state.brandIds.includes(id)
      ? state.brandIds.filter((b) => b !== id)
      : [...state.brandIds, id]
    onChange({ ...state, brandIds: next })
  }

  function removeBrand(id: string) {
    onChange({ ...state, brandIds: state.brandIds.filter((b) => b !== id) })
  }

  function clearAll() {
    onChange({ brandIds: [], ownedOnly: false })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Brand multi-select toggle */}
        {options.brands.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setBrandsOpen((v) => !v)}
              className="btn btn-sm btn-outline"
              aria-expanded={brandsOpen}
            >
              Brand
              {state.brandIds.length > 0 && (
                <span className="badge badge-sm badge-primary ml-0.5">{state.brandIds.length}</span>
              )}
            </button>

            {brandsOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 flex max-h-60 w-52 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-background p-3 shadow-lg">
                {options.brands.map((brand) => (
                  <label key={brand.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-primary"
                      checked={state.brandIds.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)}
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Owned-only toggle */}
        {showOwnedFilter && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-primary"
              checked={state.ownedOnly}
              onChange={(e) => onChange({ ...state, ownedOnly: e.target.checked })}
            />
            <span>My collection only</span>
          </label>
        )}

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="btn btn-ghost btn-sm text-muted-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {state.brandIds.map((id) => (
            <span key={id} className="badge badge-soft badge-sm inline-flex items-center gap-1">
              {brandById.get(id) ?? id}
              <button
                type="button"
                onClick={() => removeBrand(id)}
                className="ml-0.5 hover:text-foreground"
                aria-label={`Remove ${brandById.get(id) ?? id} filter`}
              >
                ✕
              </button>
            </span>
          ))}
          {state.ownedOnly && (
            <span className="badge badge-soft badge-sm inline-flex items-center gap-1">
              My collection
              <button
                type="button"
                onClick={() => onChange({ ...state, ownedOnly: false })}
                className="ml-0.5 hover:text-foreground"
                aria-label="Remove My collection filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
