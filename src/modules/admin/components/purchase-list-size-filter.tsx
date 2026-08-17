'use client'

import { useRouter } from 'next/navigation'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Sentinel value for the "all users" option — `Select` cannot use an empty string. */
const ALL_SIZES_VALUE = '__all__'

/** Label shown for each purchase-list size filter option. */
const FILTER_LABELS: Record<string, string> = {
  [ALL_SIZES_VALUE]: 'All users',
  'non-empty': 'With paints',
  empty: 'Empty lists',
}

/**
 * Purchase-list size filter dropdown that syncs the selection to the
 * `?filter=` URL param.
 *
 * Preserves the existing `?q=` (search) param and resets `?page=` to 1 when the
 * filter changes. Mirrors `UserRoleFilter` from the admin users page.
 *
 * @param props.initialValue - Current filter from the URL (`?filter=`): `'non-empty'`, `'empty'`, or `''` for all.
 */
export function PurchaseListSizeFilter({ initialValue }: { initialValue: string }) {
  const router = useRouter()

  function handleChange(value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value && value !== ALL_SIZES_VALUE) {
      params.set('filter', value)
    } else {
      params.delete('filter')
    }
    params.delete('page')
    router.replace(`?${params.toString()}`)
  }

  const currentLabel = FILTER_LABELS[initialValue || ALL_SIZES_VALUE] ?? FILTER_LABELS[ALL_SIZES_VALUE]

  return (
    <Select defaultValue={initialValue || ALL_SIZES_VALUE} onValueChange={handleChange}>
      <SelectTrigger aria-label="Filter by purchase list size">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_SIZES_VALUE}>{FILTER_LABELS[ALL_SIZES_VALUE]}</SelectItem>
        <SelectItem value="non-empty">{FILTER_LABELS['non-empty']}</SelectItem>
        <SelectItem value="empty">{FILTER_LABELS.empty}</SelectItem>
      </SelectContent>
    </Select>
  )
}
