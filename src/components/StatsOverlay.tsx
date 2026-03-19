'use client'

import { useMemo } from 'react'

import { brands, paints } from '@/data/index'

interface StatsOverlayProps {
  filteredPaintCount: number
  filteredColorCount: number
  isAnyFilterActive: boolean
}

export default function StatsOverlay({ filteredPaintCount, filteredColorCount, isAnyFilterActive }: StatsOverlayProps) {
  const totalPaints = paints.length
  const totalBrands = brands.length
  const totalColors = useMemo(() => new Set(paints.map((p) => p.hex.toLowerCase())).size, [])

  return (
    <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2'>
      <span className='text-xs text-base-content/40'>
        {!isAnyFilterActive ? totalPaints : `${filteredPaintCount} / ${totalPaints}`} paints
      </span>
      <span className='text-xs text-base-content/40'>
        {!isAnyFilterActive ? totalColors : `${filteredColorCount} / ${totalColors}`} colors
      </span>
      <span className='text-xs text-base-content/40'>{totalBrands} brands</span>
    </div>
  )
}
