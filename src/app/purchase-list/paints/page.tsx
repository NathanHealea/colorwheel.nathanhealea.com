import Link from 'next/link'

import { Main } from '@/components/main'
import { PageHeader, PageTitle, PageSubtitle } from '@/components/page-header'
import { createClient } from '@/lib/supabase/server'
import { getCollectionService } from '@/modules/collection/services/collection-service.server'
import { PurchaseListPaintGrid } from '@/modules/purchase-list/components/purchase-list-paint-grid'
import { getPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service.server'
import { pageMetadata } from '@/modules/seo/utils/page-metadata'

export const metadata = pageMetadata({
  title: 'Purchase list paints',
  description: 'Browse the paints on your Grimify purchase list.',
  path: '/purchase-list/paints',
  noindex: true,
})

/** Valid page sizes that the paginated grid supports. */
const VALID_SIZES = [25, 50, 100, 200]

export default async function PurchaseListPaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>
}) {
  const { page, size } = await searchParams
  const pageSize = VALID_SIZES.includes(Number(size)) ? Number(size) : 50
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const offset = (currentPage - 1) * pageSize

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware guarantees an authenticated user on this route
  const userId = user!.id

  const purchaseListService = await getPurchaseListService()
  const collectionService = await getCollectionService()

  const [initialPaints, totalCount, purchaseListIds, userPaintIds] = await Promise.all([
    purchaseListService.getPurchaseListPaints(userId, { limit: pageSize, offset }),
    purchaseListService.getPurchaseListCount(userId),
    purchaseListService.getUserPurchaseListIds(userId),
    collectionService.getUserPaintIds(userId),
  ])

  return (
    <Main>
      <PageHeader>
        <PageTitle>My Purchase List</PageTitle>
        <PageSubtitle>
          {totalCount === 0
            ? 'No paints on your purchase list yet.'
            : `${totalCount.toLocaleString()} ${totalCount === 1 ? 'paint' : 'paints'} on your purchase list.`}
        </PageSubtitle>
      </PageHeader>

      {totalCount === 0 ? (
        <p className="text-sm text-meta">
          Browse the <Link href="/paints" className="underline underline-offset-4">paint library</Link> and click the cart icon to add paints.
        </p>
      ) : (
        <PurchaseListPaintGrid
          initialPaints={initialPaints}
          totalCount={totalCount}
          purchaseListIds={purchaseListIds}
          userPaintIds={userPaintIds}
        />
      )}
    </Main>
  )
}
