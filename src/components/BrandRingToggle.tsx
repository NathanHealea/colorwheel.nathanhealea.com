'use client'

import { useUIStore } from '@/stores/useUIStore'

export default function BrandRingToggle() {
  const showBrandRing = useUIStore((s) => s.showBrandRing)
  const toggleBrandRing = useUIStore((s) => s.toggleBrandRing)

  return (
    <section>
      <button
        className={`btn btn-sm w-full ${showBrandRing ? '' : 'btn-outline'}`}
        style={
          showBrandRing
            ? { backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }
            : { borderColor: '#6366f1', color: '#6366f1' }
        }
        onClick={toggleBrandRing}>
        Brand Ring
      </button>
    </section>
  )
}
