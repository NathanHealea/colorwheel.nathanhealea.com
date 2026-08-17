import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Main } from '@/components/main'
import { PageHeader, PageTitle, PageSubtitle } from '@/components/page-header'
import { createClient } from '@/lib/supabase/server'
import { AddPaintToPurchaseListForm } from '@/modules/admin/components/add-paint-to-purchase-list-form'
import { ClearPurchaseListDialog } from '@/modules/admin/components/clear-purchase-list-dialog'
import { UserPurchaseListTable } from '@/modules/admin/components/user-purchase-list-table'
import { getUserPurchaseList } from '@/modules/admin/services/purchase-list-service'
import { pageMetadata } from '@/modules/seo/utils/page-metadata'

export const metadata = pageMetadata({
  title: 'User purchase list',
  description: "Admin: manage a user's Grimify purchase list.",
  noindex: true,
})

export default async function AdminUserPurchaseListPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Middleware guarantees an authenticated admin, but guard defensively
  if (!currentUser) return null

  const { profile, entries } = await getUserPurchaseList(userId)

  if (!profile) notFound()

  const isSelf = currentUser.id === userId
  const displayName = profile.display_name ?? profile.email ?? 'Unknown user'

  const lastActivity = entries[0]
    ? new Date(
        entries.reduce(
          (latest, entry) => (entry.updated_at > latest ? entry.updated_at : latest),
          entries[0].updated_at
        )
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const initials = (profile.display_name ?? '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <Main as="div">
      <div className="mb-6">
        <Link href="/admin/purchase-lists" className="text-sm text-meta hover:text-copy">
          ← Back to purchase lists
        </Link>
      </div>

      <PageHeader>
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={40}
              height={40}
              className="size-10 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="avatar avatar-md avatar-placeholder">{initials}</span>
          )}
          <PageTitle size="md">{displayName}</PageTitle>
        </div>
        <PageSubtitle>
          {profile.email ?? 'No email'} · {entries.length}{' '}
          {entries.length === 1 ? 'paint' : 'paints'}
          {lastActivity ? ` · last activity ${lastActivity}` : ''}
        </PageSubtitle>
      </PageHeader>

      {isSelf ? (
        <p className="mb-6 rounded-lg border border-rule bg-inset/50 px-4 py-3 text-sm text-meta">
          This is your own purchase list. Use{' '}
          <Link href="/purchase-list" className="underline hover:text-copy">
            your purchase list page
          </Link>{' '}
          to make changes.
        </p>
      ) : (
        <div className="mb-8">
          <AddPaintToPurchaseListForm userId={userId} />
        </div>
      )}

      <UserPurchaseListTable userId={userId} entries={entries} isSelf={isSelf} />

      {!isSelf && entries.length > 0 && (
        <div className="mt-6 flex justify-end">
          <ClearPurchaseListDialog
            userId={userId}
            displayName={displayName}
            paintCount={entries.length}
          />
        </div>
      )}
    </Main>
  )
}
