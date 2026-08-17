import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUserPurchaseListLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Skeleton className="mb-6 h-4 w-40" />

      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="mb-8 h-10 w-full max-w-md" />

      <div className="rounded-lg border border-rule">
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
