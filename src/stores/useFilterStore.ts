import { create } from 'zustand'

import type { ColorScheme } from '@/types/paint'

interface FilterState {
  brandFilter: Set<string>
  searchQuery: string
  colorScheme: ColorScheme
  ownedFilter: boolean

  toggleBrand: (id: string) => void
  setSearchQuery: (query: string) => void
  setColorScheme: (scheme: ColorScheme) => void
  toggleOwnedFilter: () => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>()((set) => ({
  brandFilter: new Set<string>(),
  searchQuery: '',
  colorScheme: 'none',
  ownedFilter: false,

  toggleBrand: (id) =>
    set((state) => {
      if (id === 'all') return { brandFilter: new Set<string>() }
      const next = new Set(state.brandFilter)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { brandFilter: next }
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setColorScheme: (scheme) => set({ colorScheme: scheme }),

  toggleOwnedFilter: () => set((state) => ({ ownedFilter: !state.ownedFilter })),

  clearFilters: () =>
    set({
      brandFilter: new Set<string>(),
      searchQuery: '',
      colorScheme: 'none',
      ownedFilter: false,
    }),
}))

// Derived selectors
export const selectIsFiltered = (state: FilterState) => state.brandFilter.size > 0
export const selectIsSearching = (state: FilterState) => state.searchQuery.trim().length > 0
