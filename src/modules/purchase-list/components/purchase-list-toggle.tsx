'use client'

import { useOptimistic, useTransition } from 'react'
import type { MouseEvent } from 'react'

import { ShoppingCart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { addToPurchaseList } from '@/modules/purchase-list/actions/add-to-purchase-list'
import { removeFromPurchaseList } from '@/modules/purchase-list/actions/remove-from-purchase-list'

/**
 * A toggle button that adds or removes a paint from the user's purchase list.
 *
 * Uses `useOptimistic` for an instant state flip on click and reverts on error.
 * When `isAuthenticated` is false, clicking redirects to `/sign-in?next={pathname}`.
 *
 * On success, surfaces a green Sonner toast describing which side of the toggle
 * fired (e.g. _"Added 'Mephiston Red' to your purchase list"_). On error,
 * surfaces a red toast carrying the action's `error` message and reverts the
 * optimistic flip.
 *
 * Place this inside a `relative` wrapper with an absolute position to overlay
 * on top of a paint card `<Link>` — the click handler stops propagation so
 * the card navigation is not triggered.
 *
 * @param props.paintId - UUID of the paint to toggle.
 * @param props.paintName - Display name of the paint, used in success toast messages.
 * @param props.isOnPurchaseList - Server-rendered initial membership state.
 * @param props.isAuthenticated - Whether the current user is signed in.
 * @param props.size - Button size: `'sm'` (default) or `'md'`.
 * @param props.revalidatePath - Optional page path to revalidate after the action.
 * @param props.className - Optional additional CSS classes for the button.
 */
export function PurchaseListToggle({
  paintId,
  paintName,
  isOnPurchaseList,
  isAuthenticated,
  size = 'sm',
  revalidatePath,
  className,
}: {
  paintId: string
  paintName: string
  isOnPurchaseList: boolean
  isAuthenticated: boolean
  size?: 'sm' | 'md'
  revalidatePath?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [optimisticOnPurchaseList, setOptimisticOnPurchaseList] = useOptimistic(isOnPurchaseList)

  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`)
      return
    }

    startTransition(async () => {
      // `next` is captured here, before the await, so the toast message
      // describes the user's intent for *this* click. Reading
      // `optimisticOnPurchaseList` after the await would reflect the settled
      // server state and produce the wrong message in the error-revert path.
      const next = !optimisticOnPurchaseList
      setOptimisticOnPurchaseList(next)

      const result = next
        ? await addToPurchaseList(paintId, revalidatePath)
        : await removeFromPurchaseList(paintId, revalidatePath)

      if (result.error) {
        // Revert — useOptimistic automatically resets to the server value on
        // re-render, but we trigger one explicitly by flipping back.
        setOptimisticOnPurchaseList(!next)
        toast.error(result.error)
        return
      }

      toast.success(
        next
          ? `Added '${paintName}' to your purchase list`
          : `Removed '${paintName}' from your purchase list`,
      )
    })
  }

  const iconSize = size === 'md' ? 20 : 16
  const btnSize = size === 'md' ? 'btn-md btn-square' : 'btn-sm btn-square'

  return (
    <Button
      type="button"
      aria-pressed={optimisticOnPurchaseList}
      aria-label={optimisticOnPurchaseList ? 'Remove from purchase list' : 'Add to purchase list'}
      disabled={isPending}
      onClick={handleClick}
      className={cn(
        'btn-ghost',
        btnSize,
        optimisticOnPurchaseList ? 'text-signal-on' : 'text-meta hover:text-copy',
        className,
      )}
    >
      <ShoppingCart
        size={iconSize}
        className={cn('transition-colors', optimisticOnPurchaseList && 'fill-current')}
        aria-hidden="true"
      />
    </Button>
  )
}
