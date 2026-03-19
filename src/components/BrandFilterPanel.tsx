'use client'

import { brands } from '@/data/index'
import { selectIsFiltered, useFilterStore } from '@/stores/useFilterStore'
import { usePaintStore } from '@/stores/usePaintStore'

export default function BrandFilterPanel() {
  const brandFilter = useFilterStore((s) => s.brandFilter)
  const isFiltered = useFilterStore(selectIsFiltered)
  const toggleBrand = useFilterStore((s) => s.toggleBrand)

  const handleToggleBrand = (id: string) => {
    toggleBrand(id)
    usePaintStore.getState().clearSelection()
  }

  return (
    <section>
      <h3 className='mb-2 text-xs font-semibold uppercase text-base-content/60'>Brand Filter</h3>
      <div className='flex flex-col gap-1'>
        <button
          className={`btn btn-sm justify-start ${!isFiltered ? 'btn-neutral' : 'btn-outline btn-neutral'}`}
          onClick={() => handleToggleBrand('all')}>
          All Brands
        </button>
        {brands.map((brand) => (
          <button
            key={brand.id}
            className={`btn btn-sm justify-start ${brandFilter.has(brand.id) ? '' : 'btn-outline'}`}
            style={
              brandFilter.has(brand.id)
                ? { backgroundColor: brand.color, borderColor: brand.color, color: '#fff' }
                : { borderColor: brand.color, color: brand.color }
            }
            onClick={() => handleToggleBrand(brand.id)}>
            {brand.icon} {brand.name}
          </button>
        ))}
      </div>
    </section>
  )
}
