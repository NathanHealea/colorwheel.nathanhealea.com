'use client'

import { useCallback, useMemo } from 'react'

import { brands } from '@/data/index'
import { selectIsFiltered, selectIsSearching, useFilterStore } from '@/stores/useFilterStore'
import { usePaintStore } from '@/stores/usePaintStore'
import type { PaintGroup, ProcessedPaint } from '@/types/paint'
import { hexToHsl, isMatchingScheme } from '@/utils/colorUtils'
import { getFilteredColorCount, getFilteredPaintCount, getSchemeMatches, searchPaints } from '@/utils/filterUtils'

import { useCollectionStore } from '../stores/useCollectionStore'

/** Search results based on current search query */
export function useSearchResults(processedPaints: ProcessedPaint[]) {
  const searchQuery = useFilterStore((s) => s.searchQuery)

  const searchResults = useMemo<ProcessedPaint[]>(
    () => searchPaints(processedPaints, searchQuery, brands),
    [processedPaints, searchQuery],
  )

  const searchMatchIds = useMemo(() => new Set(searchResults.map((p) => p.id)), [searchResults])

  return { searchResults, searchMatchIds }
}

/** Scheme matching function and matched paints */
export function useSchemeMatching(processedPaints: ProcessedPaint[]) {
  const selectedPaint = usePaintStore((s) => s.selectedPaint)
  const colorScheme = useFilterStore((s) => s.colorScheme)

  const isSchemeMatchingFn = useCallback(
    (paint: ProcessedPaint) => {
      if (!selectedPaint || colorScheme === 'none') return true
      if (paint.id === selectedPaint.id) return true
      const selectedHsl = hexToHsl(selectedPaint.hex)
      const paintHsl = hexToHsl(paint.hex)
      return isMatchingScheme(paintHsl.h, selectedHsl.h, colorScheme)
    },
    [selectedPaint, colorScheme],
  )

  const schemeMatches = useMemo<ProcessedPaint[]>(
    () => getSchemeMatches(processedPaints, selectedPaint, colorScheme),
    [colorScheme, selectedPaint, processedPaints],
  )

  return { isSchemeMatching: isSchemeMatchingFn, schemeMatches }
}

/** Filtered counts for stats overlay */
export function useFilteredCounts(
  processedPaints: ProcessedPaint[],
  paintGroups: PaintGroup[],
  uniqueColorCount: number,
  searchMatchIds: Set<string>,
  isSchemeMatchingFn: (paint: ProcessedPaint) => boolean,
) {
  const brandFilter = useFilterStore((s) => s.brandFilter)
  const ownedFilter = useFilterStore((s) => s.ownedFilter)
  const isFiltered = useFilterStore(selectIsFiltered)
  const isSearching = useFilterStore(selectIsSearching)
  const selectedPaint = usePaintStore((s) => s.selectedPaint)
  const colorScheme = useFilterStore((s) => s.colorScheme)
  const ownedIds = useCollectionStore((s) => s.ownedIds)

  const isSchemeActive = colorScheme !== 'none' && selectedPaint !== null
  const isAnyFilterActive = isFiltered || isSearching || isSchemeActive || ownedFilter

  const filteredPaintCount = useMemo(() => {
    if (!isAnyFilterActive) return processedPaints.length
    return getFilteredPaintCount(processedPaints, {
      brandFilter,
      searchMatchIds,
      isSearching,
      isSchemeActive,
      isSchemeMatching: isSchemeMatchingFn,
      ownedFilter,
      ownedIds,
      isFiltered,
    })
  }, [
    processedPaints,
    brandFilter,
    isFiltered,
    isSearching,
    searchMatchIds,
    isAnyFilterActive,
    isSchemeActive,
    isSchemeMatchingFn,
    ownedFilter,
    ownedIds,
  ])

  const filteredColorCount = useMemo(() => {
    if (!isAnyFilterActive) return uniqueColorCount
    return getFilteredColorCount(paintGroups, {
      brandFilter,
      searchMatchIds,
      isSearching,
      isSchemeActive,
      isSchemeMatching: isSchemeMatchingFn,
      ownedFilter,
      ownedIds,
      isFiltered,
    })
  }, [
    paintGroups,
    brandFilter,
    isFiltered,
    isSearching,
    searchMatchIds,
    uniqueColorCount,
    isAnyFilterActive,
    isSchemeActive,
    isSchemeMatchingFn,
    ownedFilter,
    ownedIds,
  ])

  return { filteredPaintCount, filteredColorCount, isAnyFilterActive }
}
