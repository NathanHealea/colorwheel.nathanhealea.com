import { redirect } from 'next/navigation'

import { Main } from '@/components/main'
import { PageHeader, PageTitle } from '@/components/page-header'
import { createClient } from '@/lib/supabase/server'
import { PurchaseListSearch } from '@/modules/purchase-list/components/purchase-list-search'
import { PurchaseListStats } from '@/modules/purchase-list/components/purchase-list-stats'
import { createPurchaseListService } from '@/modules/purchase-list/services/purchase-list-service'
import { pageMetadata } from '@/modules/seo/utils/page-metadata'

export const metadata = pageMetadata({
  title: 'My purchase list',
  description: 'Paints you plan to buy, saved to your Grimify purchase list.',
  path: '/purchase-list',
  noindex: true,
})

export default async function PurchaseListPage() {
  // auth: middleware enforces auth; redirect guard is for type narrowing only
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createPurchaseListService(supabase)
  const [stats, recentPaints] = await Promise.all([
    service.getStats(user.id),
    service.getPurchaseListPaints(user.id, { limit: 10 }),
  ])

  return (
    <Main className="space-y-6">
      <PageHeader>
        <PageTitle>My Purchase List</PageTitle>
      </PageHeader>
      <PurchaseListStats stats={stats} />
      <PurchaseListSearch initialPaints={recentPaints} />
    </Main>
  )
}
