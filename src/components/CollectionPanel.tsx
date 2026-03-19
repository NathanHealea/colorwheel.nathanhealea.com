import { useMemo, useState } from 'react'

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

import { brands } from '@/data/index'
import { useCollectionStore } from '@/stores/useCollectionStore'
import { useFilterStore } from '@/stores/useFilterStore'
import { usePaintStore } from '@/stores/usePaintStore'
import { useUIStore } from '@/stores/useUIStore'
import type { ProcessedPaint } from '@/types/paint'

interface CollectionPanelProps {
  processedPaints: ProcessedPaint[]
  onSelectPaint: (paint: ProcessedPaint) => void
}

export default function CollectionPanel({ processedPaints, onSelectPaint }: CollectionPanelProps) {
  const ownedIds = useCollectionStore((s) => s.ownedIds)
  const toggleOwned = useCollectionStore((s) => s.toggleOwned)
  const showOwnedRing = useUIStore((s) => s.showOwnedRing)
  const toggleOwnedRing = useUIStore((s) => s.toggleOwnedRing)
  const ownedFilter = useFilterStore((s) => s.ownedFilter)
  const toggleOwnedFilterAction = useFilterStore((s) => s.toggleOwnedFilter)

  const toggleOwnedFilter = () => {
    toggleOwnedFilterAction()
    usePaintStore.getState().clearSelection()
  }

  const [collectionSearch, setCollectionSearch] = useState('')
  const [paintToRemove, setPaintToRemove] = useState<ProcessedPaint | null>(null)

  const ownedPaints = useMemo(() => processedPaints.filter((p) => ownedIds.has(p.id)), [processedPaints, ownedIds])

  const filteredOwnedPaints = useMemo(() => {
    const q = collectionSearch.trim().toLowerCase()
    if (!q) return ownedPaints
    return ownedPaints.filter((p) => {
      const brandName = brands.find((b) => b.id === p.brand)?.name ?? ''
      return p.name.toLowerCase().includes(q) || p.hex.toLowerCase().includes(q) || brandName.toLowerCase().includes(q)
    })
  }, [ownedPaints, collectionSearch])

  return (
    <>
      {/* Collection controls */}
      <section>
        <div className='flex flex-col gap-1'>
          <button
            className={`btn btn-sm w-full ${showOwnedRing ? '' : 'btn-outline'}`}
            style={
              showOwnedRing
                ? { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }
                : { borderColor: '#10b981', color: '#10b981' }
            }
            onClick={toggleOwnedRing}>
            Owned Ring
          </button>
          <button
            className={`btn btn-sm w-full justify-start ${ownedFilter ? '' : 'btn-outline'}`}
            style={
              ownedFilter
                ? { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }
                : { borderColor: '#10b981', color: '#10b981' }
            }
            onClick={toggleOwnedFilter}>
            Owned Only ({ownedIds.size})
          </button>
        </div>
      </section>

      <div className='divider' />

      {/* Collection search + list */}
      <section>
        <h3 className='mb-2 text-xs font-semibold uppercase text-base-content/60'>
          My Collection ({ownedPaints.length})
        </h3>

        <label className='input input-sm mb-2 w-full'>
          <MagnifyingGlassIcon className='size-4 opacity-50' />
          <input
            type='text'
            placeholder='Search collection...'
            value={collectionSearch}
            onChange={(e) => setCollectionSearch(e.target.value)}
          />
          {collectionSearch && (
            <button
              className='btn btn-circle btn-ghost btn-xs'
              onClick={() => setCollectionSearch('')}
              aria-label='Clear collection search'>
              <XMarkIcon className='size-3' />
            </button>
          )}
        </label>

        {ownedPaints.length === 0 ? (
          <p className='text-xs text-base-content/40'>
            No paints in your collection yet. Select a paint on the wheel and click &ldquo;Add to Collection&rdquo; to
            start building your collection.
          </p>
        ) : filteredOwnedPaints.length === 0 ? (
          <p className='text-xs text-base-content/40'>No paints match &ldquo;{collectionSearch}&rdquo;</p>
        ) : (
          <div className='flex flex-col gap-0.5 overflow-y-auto' style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {filteredOwnedPaints.map((paint) => {
              const brand = brands.find((b) => b.id === paint.brand)
              return (
                <div key={paint.id} className='flex items-center gap-1'>
                  <button
                    className='flex flex-1 items-center gap-2 rounded px-2 py-1 text-left hover:bg-base-300'
                    onClick={() => onSelectPaint(paint)}>
                    <div
                      className='size-4 shrink-0 rounded border border-base-300'
                      style={{ backgroundColor: paint.hex }}
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm'>{paint.name}</p>
                      <p className='text-xs text-base-content/60'>
                        {brand?.icon} {brand?.name} &middot; {paint.type}
                      </p>
                    </div>
                  </button>
                  <button
                    className='btn btn-ghost btn-xs text-error'
                    onClick={() => setPaintToRemove(paint)}
                    aria-label={`Remove ${paint.name} from collection`}>
                    <XMarkIcon className='size-3' />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Remove confirmation dialog */}
      {paintToRemove && (
        <dialog className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='text-lg font-bold'>Remove from Collection</h3>
            <p className='py-4'>
              Remove <strong>{paintToRemove.name}</strong> from your collection?
            </p>
            <div className='modal-action'>
              <button className='btn btn-outline' onClick={() => setPaintToRemove(null)}>
                Cancel
              </button>
              <button
                className='btn btn-error'
                onClick={() => {
                  toggleOwned(paintToRemove.id)
                  setPaintToRemove(null)
                }}>
                Remove
              </button>
            </div>
          </div>
          <form method='dialog' className='modal-backdrop'>
            <button onClick={() => setPaintToRemove(null)}>close</button>
          </form>
        </dialog>
      )}
    </>
  )
}
