import Link from 'next/link'

import { Main } from '@/components/main'
import { PageHeader, PageTitle, PageSubtitle } from '@/components/page-header'
import { createClient } from '@/lib/supabase/server'
import { PurchaseListSizeFilter } from '@/modules/admin/components/purchase-list-size-filter'
import { PurchaseListsListTable } from '@/modules/admin/components/purchase-lists-list-table'
import { listUserPurchaseLists } from '@/modules/admin/services/purchase-list-service'
import type { PurchaseListSizeFilter as SizeFilter } from '@/modules/admin/services/purchase-list-service'
import { UserSearch } from '@/modules/user/components/user-search'
import { pageMetadata } from '@/modules/seo/utils/page-metadata'

export const metadata = pageMetadata({
  title: 'Purchase list management',
  description: "Admin: manage every user's Grimify purchase list.",
  path: '/admin/purchase-lists',
  noindex: true,
})

/** Number of users shown per page. */
const PAGE_SIZE = 20

/** Filter values accepted from the `?filter=` search param. */
const VALID_FILTERS = ['non-empty', 'empty'] as const

export default async function AdminPurchaseListsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>
}) {
  const { q, filter, page } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware guarantees an authenticated admin, but guard defensively
  if (!user) {
    return null
  }

  const sizeFilter: SizeFilter = VALID_FILTERS.includes(filter as (typeof VALID_FILTERS)[number])
    ? (filter as SizeFilter)
    : 'all'

  // Resolve current page (1-based)
  const currentPage = Math.max(1, parseInt(page ?? '1', 10))
  const offset = (currentPage - 1) * PAGE_SIZE

  const { users, count } = await listUserPurchaseLists({
    q,
    sizeFilter,
    offset,
    limit: PAGE_SIZE,
  })

  const totalPages = Math.ceil(count / PAGE_SIZE)

  // Build pagination URL helper
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sizeFilter !== 'all') params.set('filter', sizeFilter)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/admin/purchase-lists${qs ? `?${qs}` : ''}`
  }

  return (
    <Main as="div">
      <PageHeader>
        <PageTitle>Purchase List Management</PageTitle>
        <PageSubtitle>
          Browse every user&apos;s purchase list. Search, filter by list size, and drill in to add,
          remove, or annotate paints.
        </PageSubtitle>
      </PageHeader>

      {/* Search + filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <UserSearch
          initialValue={q ?? ''}
          placeholder="Search by display name or email…"
          ariaLabel="Search users by display name or email"
        />

        <PurchaseListSizeFilter initialValue={sizeFilter === 'all' ? '' : sizeFilter} />

        {(q || sizeFilter !== 'all') && (
          <Link href="/admin/purchase-lists" className="btn btn-ghost btn-sm">
            Clear filters
          </Link>
        )}

        <span className="ml-auto text-xs text-meta">
          {count} user{count !== 1 ? 's' : ''}
        </span>
      </div>

      <PurchaseListsListTable users={users} currentUserId={user.id} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Link href={pageUrl(currentPage - 1)} className="btn btn-ghost btn-sm">
              ← Prev
            </Link>
          ) : (
            <span className="btn btn-ghost btn-sm btn-disabled opacity-50">← Prev</span>
          )}

          <span className="text-sm text-meta">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link href={pageUrl(currentPage + 1)} className="btn btn-ghost btn-sm">
              Next →
            </Link>
          ) : (
            <span className="btn btn-ghost btn-sm btn-disabled opacity-50">Next →</span>
          )}
        </div>
      )}
    </Main>
  )
}
