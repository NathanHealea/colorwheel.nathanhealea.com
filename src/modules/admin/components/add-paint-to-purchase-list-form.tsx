'use client'

import { Check, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import SearchInput from '@/components/search'
import { addPaintToPurchaseList } from '@/modules/admin/actions/add-paint-to-purchase-list'
import { useDebouncedQuery } from '@/modules/paints/hooks/use-debounced-query'
import { usePaintSearch } from '@/modules/paints/hooks/use-paint-search'
import type { PaintWithBrand } from '@/modules/paints/services/paint-service'

/** Maximum number of paint suggestions rendered by the picker. */
const PICKER_PAGE_SIZE = 10

/**
 * Inline paint-picker form that lets an admin add paints to a user's purchase
 * list.
 *
 * Debounces the search input 250ms (min 1 char), fetches up to
 * {@link PICKER_PAGE_SIZE} suggestions via {@link usePaintSearch}, and calls
 * {@link addPaintToPurchaseList} when a suggestion is selected. Suggestions stay
 * open after each add so several paints can be added without re-typing; paints
 * added during the session are marked with a check icon and cannot be added
 * twice. The server action's `revalidatePath` refreshes the table below.
 *
 * Mirrors `AdminAddPaintForm` from admin collection management.
 *
 * @param props.userId - UUID of the target user whose purchase list is being modified.
 */
export function AddPaintToPurchaseListForm({ userId }: { userId: string }) {
  const [inputValue, setInputValue] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const debouncedQuery = useDebouncedQuery(inputValue, { delay: 250, minChars: 1 })

  const { paints } = usePaintSearch({
    query: debouncedQuery || undefined,
    pageSize: PICKER_PAGE_SIZE,
    page: 1,
    scope: 'all',
  })

  const showSuggestions = inputValue.trim().length > 0 && paints.length > 0

  function handleSelect(paint: PaintWithBrand) {
    if (addedIds.has(paint.id)) return

    startTransition(async () => {
      const result = await addPaintToPurchaseList(userId, paint.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setAddedIds((prev) => new Set(prev).add(paint.id))
      toast.success(`Added '${paint.name}' to the purchase list`)
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Add paint to purchase list</p>
      <SearchInput
        placeholder="Search paints by name, brand, or type…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {showSuggestions && (
        <ul className="rounded-md border border-rule bg-panel shadow-md">
          {paints.map((paint) => {
            const isAdded = addedIds.has(paint.id)
            return (
              <li key={paint.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-inset disabled:opacity-50"
                  onClick={() => handleSelect(paint)}
                  disabled={isPending || isAdded}
                >
                  <span
                    className="size-5 shrink-0 rounded border border-rule"
                    style={{ backgroundColor: paint.hex }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate font-medium">{paint.name}</span>
                  {paint.paint_type && (
                    <span className="shrink-0 text-xs text-meta">{paint.paint_type}</span>
                  )}
                  <span className="shrink-0 text-xs text-meta">
                    {paint.product_lines.brands.name}
                  </span>
                  {isAdded ? (
                    <Check className="size-3.5 shrink-0 text-green-600" />
                  ) : (
                    <Plus className="size-3.5 shrink-0 text-meta" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
