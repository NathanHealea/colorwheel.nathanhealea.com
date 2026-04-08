'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'

import Button from '@/components/Button'
import { useIsDesktop } from '@/components/Sidebar'
import { getEffectiveTabFromState, useUIStore } from '@/stores/useUIStore'

export default function SidebarToggleButton() {
  const isDesktop = useIsDesktop()
  const sidebarState = useUIStore((s) => s.sidebarState)
  const toggleMenu = useUIStore((s) => s.toggleMenu)

  const effectiveTab = getEffectiveTabFromState(sidebarState, isDesktop)

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => toggleMenu(isDesktop)}
      aria-label={effectiveTab ? 'Close sidebar' : 'Open sidebar'}>
      <Bars3Icon className='size-5' />
    </Button>
  )
}
