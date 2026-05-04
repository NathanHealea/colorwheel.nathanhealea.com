'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import type { ColorScheme } from '@/modules/color-wheel/types/color-scheme'
import { deriveFilterOptions } from '@/modules/color-wheel/utils/derive-filter-options'
import { BaseColorPicker } from '@/modules/color-schemes/components/base-color-picker'
import { SchemeTypeSelector } from '@/modules/color-schemes/components/scheme-type-selector'
import { SchemeSwatchGrid } from '@/modules/color-schemes/components/scheme-swatch-grid'
import { SchemePaintFilters } from '@/modules/color-schemes/components/scheme-paint-filters'
import { generateScheme } from '@/modules/color-schemes/utils/generate-scheme'
import { findMatchingPaints } from '@/modules/color-schemes/utils/find-matching-paints'
import { applySchemeFilters } from '@/modules/color-schemes/utils/apply-scheme-filters'
import type { BaseColor } from '@/modules/color-schemes/types/base-color'
import {
  EMPTY_SCHEME_FILTER_STATE,
  type SchemeFilterState,
} from '@/modules/color-schemes/types/scheme-filter-state'

/**
 * Main client component for the Color Scheme Explorer.
 *
 * Manages base color selection, active scheme type, analogous spread angle,
 * and paint suggestion filters (brand + owned-only). Derives scheme colors
 * with perceptual paint matches via useMemo.
 *
 * @param props.paints - Full paint list fetched server-side and passed as a prop.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.collectionPaintIds - Array of paint IDs in the user's collection.
 */
export function SchemeExplorer({
  paints,
  isAuthenticated,
  collectionPaintIds,
}: {
  paints: ColorWheelPaint[]
  isAuthenticated: boolean
  collectionPaintIds: string[]
}) {
  const [baseColor, setBaseColor] = useState<BaseColor | null>(null)
  const [activeScheme, setActiveScheme] = useState<ColorScheme>('complementary')
  const [analogousAngle, setAnalogousAngle] = useState(30)
  const [filterState, setFilterState] = useState<SchemeFilterState>(EMPTY_SCHEME_FILTER_STATE)

  const ownedIds = useMemo(() => new Set(collectionPaintIds), [collectionPaintIds])

  const filterOptions = useMemo(() => deriveFilterOptions(paints), [paints])

  const candidatePaints = useMemo(
    () => applySchemeFilters(paints, filterState, ownedIds),
    [paints, filterState, ownedIds],
  )

  const schemeColors = useMemo(() => {
    if (!baseColor) return []
    return generateScheme(baseColor, activeScheme, analogousAngle).map((color) => ({
      ...color,
      nearestPaints: findMatchingPaints(color.hex, candidatePaints, 3),
    }))
  }, [baseColor, activeScheme, analogousAngle, candidatePaints])

  return (
    <section className="flex flex-col gap-6">
      <BaseColorPicker paints={paints} onChange={setBaseColor} />

      {baseColor && (
        <>
          <SchemeTypeSelector
            value={activeScheme}
            onChange={setActiveScheme}
            analogousAngle={analogousAngle}
            onAnalogousAngleChange={setAnalogousAngle}
          />
          <SchemePaintFilters
            options={filterOptions}
            state={filterState}
            showOwnedFilter={isAuthenticated}
            onChange={setFilterState}
          />
          <SchemeSwatchGrid colors={schemeColors} isAuthenticated={isAuthenticated} ownedIds={ownedIds} />
        </>
      )}

      {!baseColor && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">Select a base color to generate a scheme.</p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
