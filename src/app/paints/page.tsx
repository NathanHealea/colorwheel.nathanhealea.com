import { getHueService } from '@/modules/hues/services/hue-service.server'
import { PaintExplorer } from '@/modules/paints/components/paint-explorer'
import { getPaintService } from '@/modules/paints/services/paint-service.server'

/** Valid page sizes that the paginated grid supports. */
const VALID_SIZES = [25, 50, 100, 200]

export default async function PaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>
}) {
  const { size } = await searchParams
  const pageSize = VALID_SIZES.includes(Number(size)) ? Number(size) : 50

  const paintService = await getPaintService()
  const hueService = await getHueService()

  const [initialPaints, totalPaints, ittenHues] = await Promise.all([
    paintService.getAllPaints({ limit: pageSize, offset: 0 }),
    paintService.getTotalPaintCount(),
    hueService.getIttenHues(),
  ])

  // Fetch paint counts per hue group in parallel
  const hueCountEntries = await Promise.all(
    ittenHues.map(async (hue) => {
      const count = await paintService.getPaintCountByHueGroup(hue.id)
      return [hue.name.toLowerCase(), count] as const
    })
  )
  const huePaintCounts = Object.fromEntries(hueCountEntries)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Paints</h1>
        <p className="text-sm text-muted-foreground">
          Browse {totalPaints.toLocaleString()} paints.
        </p>
      </div>

      <PaintExplorer
        initialPaints={initialPaints}
        initialTotalCount={totalPaints}
        ittenHues={ittenHues}
        huePaintCounts={huePaintCounts}
      />
    </div>
  )
}
