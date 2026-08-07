'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DeleteAccountDialog } from '@/modules/user/components/delete-account-dialog'

/**
 * Props for {@link DangerZone}.
 */
type DangerZoneProps = {
  /** The user's display name, used as the type-to-confirm value. */
  displayName: string
  /** Whether the current user has the admin role. Admin self-deletion is blocked. */
  isAdmin: boolean
}

/**
 * Profile edit page section for permanent account self-deletion.
 *
 * Renders a "Delete Account" button that opens {@link DeleteAccountDialog}.
 * Admin users see the section but with the button disabled and a callout
 * explaining how to remove the admin role first.
 *
 * @param props - See {@link DangerZoneProps}.
 */
export function DangerZone({ displayName, isAdmin }: DangerZoneProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card className="border-danger">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <div className="rounded-md border border-danger/40 bg-danger/5 p-4 text-sm space-y-2">
              <p className="font-medium text-danger">
                Admin accounts cannot be self-deleted.
              </p>
              <p className="text-meta">
                To delete your account: remove your admin role via the{' '}
                <Link href="/admin/roles" className="underline hover:text-copy">
                  admin roles panel
                </Link>
                , then return here to complete account deletion.
              </p>
              <Button
                type="button"
                className="btn-destructive btn-sm"
                disabled
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-meta">
                Once you delete your account, there is no going back. All your
                data will be permanently removed.
              </p>
              <Button
                type="button"
                className="btn-destructive btn-sm"
                onClick={() => setOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isAdmin && (
        <DeleteAccountDialog
          displayName={displayName}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
