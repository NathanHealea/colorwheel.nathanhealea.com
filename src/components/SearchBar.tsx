'use client'

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

import { useFilterStore } from '@/stores/useFilterStore'
import { usePaintStore } from '@/stores/usePaintStore'

export default function SearchBar() {
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)

  const handleChange = (query: string) => {
    setSearchQuery(query)
    usePaintStore.getState().clearSelection()
  }

  const handleClear = () => {
    setSearchQuery('')
    usePaintStore.getState().clearSelection()
  }

  return (
    <label className='input input-sm w-full'>
      <MagnifyingGlassIcon className='size-4 opacity-50' />
      <input type='text' placeholder='Search paints...' value={searchQuery} onChange={(e) => handleChange(e.target.value)} />
      {searchQuery && (
        <button className='btn btn-circle btn-ghost btn-xs' onClick={handleClear} aria-label='Clear search'>
          <XMarkIcon className='size-3' />
        </button>
      )}
    </label>
  )
}
