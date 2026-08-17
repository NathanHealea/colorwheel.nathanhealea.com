'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { PurchaseListUserSummary } from '@/modules/admin/types/purchase-list-user-summary'

/**
 * Client table listing every user with the size and recency of their purchase
 * list.
 *
 * Each row links to `/admin/purchase-lists/[userId]`; the user cell is the
 * clickable target alongside an explicit "View" action so the row is usable
 * both by pointer and keyboard. The current admin's own row is labelled
 * "(you)" — admins manage their own list from `/purchase-list`.
 *
 * @param props.users - Users to render, already paginated by the page.
 * @param props.currentUserId - The authenticated admin's UUID, used to flag their own row.
 */
export function PurchaseListsListTable({
  users,
  currentUserId,
}: {
  users: PurchaseListUserSummary[]
  currentUserId: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule bg-inset/50">
            <th className="px-4 py-3 text-left font-medium text-meta">User</th>
            <th className="px-4 py-3 text-left font-medium text-meta">Email</th>
            <th className="px-4 py-3 text-right font-medium text-meta">Paints</th>
            <th className="px-4 py-3 text-left font-medium text-meta">Last activity</th>
            <th className="px-4 py-3 text-right font-medium text-meta">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-meta">
                No users match the current filters.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <PurchaseListRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function PurchaseListRow({
  user,
  isSelf,
}: {
  user: PurchaseListUserSummary
  isSelf: boolean
}) {
  const href = `/admin/purchase-lists/${user.id}`

  const initials = (user.display_name ?? '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const lastActivity = user.last_activity
    ? new Date(user.last_activity).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
    <tr className="border-b border-rule last:border-b-0 hover:bg-inset/40">
      <td className="px-4 py-3">
        <Link href={href} className="flex items-center gap-3 hover:underline">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.display_name ?? 'User'}
              width={32}
              height={32}
              className="size-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="avatar avatar-sm avatar-placeholder">{initials}</span>
          )}
          <span className="font-medium">
            {user.display_name ?? 'No display name'}
            {isSelf && <span className="ml-1.5 text-xs text-meta">(you)</span>}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 text-meta">
        {user.email ?? <span className="italic">No email</span>}
      </td>
      <td className="px-4 py-3 text-right">
        {user.paint_count === 0 ? (
          <span className="text-meta">0</span>
        ) : (
          <span className="badge badge-soft">{user.paint_count}</span>
        )}
      </td>
      <td className="px-4 py-3 text-meta">{lastActivity}</td>
      <td className="px-4 py-3 text-right">
        <Link href={href} className="btn btn-ghost btn-sm">
          View
        </Link>
      </td>
    </tr>
  )
}
