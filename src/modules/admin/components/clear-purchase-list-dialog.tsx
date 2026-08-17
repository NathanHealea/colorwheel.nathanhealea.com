'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { clearUserPurchaseList } from '@/modules/admin/actions/clear-user-purchase-list'

/**
 * Destructive control that clears every paint from a user's purchase list.
 *
 * Renders its own trigger button and a type-to-confirm dialog: the admin must
 * type the user's display name before the confirm button activates, mirroring
 * `DeleteUserDialog`. On confirm, calls {@link clearUserPurchaseList}; on
 * failure the dialog stays open so the admin can retry.
 *
 * @param props.userId - UUID of the user whose purchase list will be cleared.
 * @param props.displayName - Name shown in the prompt and required for type-to-confirm.
 * @param props.paintCount - Number of paints currently on the list, shown in the prompt.
 */
export function ClearPurchaseListDialog({
  userId,
  displayName,
  paintCount,
}: {
  userId: string
  displayName: string
  paintCount: number
}) {
  const [open, setOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    setConfirmValue('')
    setOpen(false)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await clearUserPurchaseList(userId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Cleared ${displayName}'s purchase list`)
      handleClose()
    })
  }

  const canConfirm = confirmValue === displayName && !isPending

  return (
    <>
      <Button type="button" className="btn-sm btn-destructive" onClick={() => setOpen(true)}>
        Clear purchase list
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="w-full max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>Clear purchase list?</DialogTitle>
            <p className="mt-1 text-sm text-meta">
              Remove all {paintCount} {paintCount === 1 ? 'paint' : 'paints'} from{' '}
              <span className="font-medium">{displayName}</span>&apos;s purchase list. This action
              cannot be undone.
            </p>
          </DialogHeader>

          <div className="form-item mt-2">
            <label className="form-label text-sm" htmlFor="confirm-clear-purchase-list">
              Type <span className="font-medium">{displayName}</span> to confirm
            </label>
            <Input
              id="confirm-clear-purchase-list"
              type="text"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              className="input-sm w-full"
              placeholder={displayName}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="btn-sm btn-ghost"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="btn-sm btn-destructive"
            >
              {isPending ? 'Clearing…' : 'Clear purchase list'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
