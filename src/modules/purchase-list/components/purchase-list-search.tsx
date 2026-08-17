'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import SearchInput from '@/components/search'
import { searchPurchaseList } from '@/modules/purchase-list/actions/search-purchase-list'
import { PaintCardWithPurchaseToggle } from '@/modules/purchase-list/components/paint-card-with-purchase-toggle'
import type { PurchaseListPaint } from '@/modules/purchase-list/types/purchase-list-paint'

/**
 * Client component that provides a debounced search over the user's purchase list.
 *
 * When the query is empty, displays the 10 most recently added paints passed in
 * via `initialPaints`. When the user types, calls the {@link searchPurchaseList}
 * server action 250ms after they stop and replaces the grid with results.
 *
 * Every card rendered here is by definition already on the purchase list, so
 * each {@link PaintCardWithPurchaseToggle} receives `isOnPurchaseList={true}` —
 * the toggle removes rather than adds.
 *
 * @param props.initialPaints - The 10 most recently added paints, server-fetched.
 */
export function PurchaseListSearch({ initialPaints }: { initialPaints: PurchaseListPaint[] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PurchaseListPaint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSearching = query.trim().length > 0

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    const delay = trimmed ? 250 : 0

    debounceRef.current = setTimeout(async () => {
      if (!trimmed) {
        setResults([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const result = await searchPurchaseList(trimmed)
      setResults('paints' in result ? result.paints : [])
      setIsLoading(false)
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const paintsToShow = isSearching ? results : initialPaints

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search your purchase list by name, brand, type, or #hex…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!isSearching && initialPaints.length > 0 && (
        <p className="text-sm font-medium">Recently added</p>
      )}

      {isSearching && !isLoading && results.length === 0 && (
        <p className="text-sm text-meta">No paints found.</p>
      )}

      {paintsToShow.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paintsToShow.map((paint) => (
            <PaintCardWithPurchaseToggle
              key={paint.id}
              id={paint.id}
              name={paint.name}
              hex={paint.hex}
              brand={paint.product_lines.brands.name}
              paintType={paint.paint_type}
              isMetallic={paint.is_metallic}
              isDiscontinued={paint.is_discontinued}
              isOnPurchaseList={true}
              isAuthenticated={true}
              revalidatePath="/purchase-list"
            />
          ))}
        </div>
      )}

      <div className="text-right">
        <Link href="/purchase-list/paints" className="text-sm text-meta hover:underline">
          View full purchase list →
        </Link>
      </div>
    </div>
  )
}
