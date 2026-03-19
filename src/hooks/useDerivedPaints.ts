'use client'

import { useMemo } from 'react'

import { brands, paints } from '@/data/index'
import type { PaintGroup, ProcessedPaint } from '@/types/paint'
import { hexToHsl, paintToWheelPosition, WHEEL_RADIUS } from '@/utils/colorUtils'

/** Process raw paint data into ProcessedPaint with computed positions and stable IDs */
export function useProcessedPaints(): ProcessedPaint[] {
  return useMemo<ProcessedPaint[]>(
    () =>
      paints.map((paint) => {
        const hsl = hexToHsl(paint.hex)
        const pos = paintToWheelPosition(hsl.h, hsl.l, WHEEL_RADIUS)
        return {
          ...paint,
          id: `${paint.brand}-${paint.name}-${paint.type}`.toLowerCase().replace(/\s+/g, '-'),
          x: pos.x,
          y: pos.y,
        }
      }),
    [],
  )
}

/** Group processed paints by hex color */
export function usePaintGroups(processedPaints: ProcessedPaint[]): PaintGroup[] {
  return useMemo<PaintGroup[]>(() => {
    const map = new Map<string, ProcessedPaint[]>()
    processedPaints.forEach((p) => {
      const key = p.hex.toLowerCase()
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    })
    return Array.from(map.entries()).map(([key, paints]) => ({
      key,
      paints,
      rep: paints[0],
    }))
  }, [processedPaints])
}

/** Count paints per brand */
export function useBrandPaintCounts(processedPaints: ProcessedPaint[]): Map<string, number> {
  return useMemo(() => {
    const counts = new Map<string, number>()
    brands.forEach((b) => counts.set(b.id, 0))
    processedPaints.forEach((p) => {
      counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1)
    })
    return counts
  }, [processedPaints])
}
