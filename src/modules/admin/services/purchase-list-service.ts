import { createClient } from '@/lib/supabase/server'
import type { AdminPurchaseListEntry } from '@/modules/admin/types/admin-purchase-list-entry'
import type { PurchaseListUserSummary } from '@/modules/admin/types/purchase-list-user-summary'
import { getProfileById } from '@/modules/user/services/profile-service'
import type { ProfileRow } from '@/modules/user/services/profile-service'

/** Page size used when sweeping `user_purchase_list` for per-user aggregates. PostgREST caps a single response at 1000 rows. */
const AGGREGATE_PAGE_SIZE = 1000

/** Purchase-list size filter accepted by {@link listUserPurchaseLists}. */
export type PurchaseListSizeFilter = 'all' | 'non-empty' | 'empty'

/**
 * Parameters for the paginated admin purchase-list index query.
 */
export type ListUserPurchaseListsParams = {
  /** Search term matched case-insensitively against display name and email. */
  q?: string | null
  /** Restrict results by purchase list size. Defaults to `'all'`. */
  sizeFilter?: PurchaseListSizeFilter | null
  /** Zero-based row offset for pagination. */
  offset: number
  /** Maximum number of rows to return. */
  limit: number
}

/**
 * Per-user purchase list aggregate: row count and most recent `updated_at`.
 */
type PurchaseListAggregate = {
  count: number
  lastActivity: string | null
}

/**
 * Builds a per-user aggregate map of purchase list size and last activity.
 *
 * Aggregation runs in JS rather than SQL because PostgREST aggregate functions
 * are disabled by default on Supabase projects, and a `GROUP BY` would
 * otherwise require a dedicated database function. Rows are swept in
 * {@link AGGREGATE_PAGE_SIZE} pages so the read is not silently truncated by
 * PostgREST's default row cap.
 *
 * @returns Map keyed by `user_id`. Users with an empty list are absent.
 */
async function fetchPurchaseListAggregates(): Promise<Map<string, PurchaseListAggregate>> {
  const supabase = await createClient()
  const aggregates = new Map<string, PurchaseListAggregate>()

  for (let offset = 0; ; offset += AGGREGATE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('user_purchase_list')
      .select('user_id, updated_at')
      .range(offset, offset + AGGREGATE_PAGE_SIZE - 1)

    if (error || !data || data.length === 0) break

    for (const row of data as { user_id: string; updated_at: string }[]) {
      const existing = aggregates.get(row.user_id)

      if (!existing) {
        aggregates.set(row.user_id, { count: 1, lastActivity: row.updated_at })
        continue
      }

      existing.count += 1
      if (existing.lastActivity === null || row.updated_at > existing.lastActivity) {
        existing.lastActivity = row.updated_at
      }
    }

    if (data.length < AGGREGATE_PAGE_SIZE) break
  }

  return aggregates
}

/**
 * Returns a paginated list of users alongside their purchase list size and
 * last activity timestamp.
 *
 * Search matches `display_name` or `email` case-insensitively. The size filter
 * is applied by constraining the `profiles` query to (or excluding) the set of
 * user IDs that have at least one `user_purchase_list` row, so pagination and
 * the exact count stay consistent with the filter.
 *
 * @param params - Search, filter, and pagination options.
 * @returns {@link PurchaseListUserSummary} rows for the page plus the total
 *   number of users matching the search and filter.
 */
export async function listUserPurchaseLists(
  params: ListUserPurchaseListsParams
): Promise<{ users: PurchaseListUserSummary[]; count: number }> {
  const supabase = await createClient()
  const sizeFilter: PurchaseListSizeFilter = params.sizeFilter ?? 'all'

  const aggregates = await fetchPurchaseListAggregates()
  const nonEmptyIds = Array.from(aggregates.keys())

  // No user has a purchase list yet — the 'non-empty' filter can only be empty.
  if (sizeFilter === 'non-empty' && nonEmptyIds.length === 0) {
    return { users: [], count: 0 }
  }

  let query = supabase
    .from('profiles')
    .select('id, display_name, avatar_url, email, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1)

  if (params.q) {
    query = query.or(`display_name.ilike.%${params.q}%,email.ilike.%${params.q}%`)
  }

  if (sizeFilter === 'non-empty') {
    query = query.in('id', nonEmptyIds)
  } else if (sizeFilter === 'empty' && nonEmptyIds.length > 0) {
    query = query.not('id', 'in', `(${nonEmptyIds.join(',')})`)
  }

  const { data, count } = await query

  type ProfileListRow = {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string | null
    created_at: string
  }

  const users: PurchaseListUserSummary[] = ((data ?? []) as ProfileListRow[]).map((profile) => {
    const aggregate = aggregates.get(profile.id)

    return {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      email: profile.email,
      created_at: profile.created_at,
      paint_count: aggregate?.count ?? 0,
      last_activity: aggregate?.lastActivity ?? null,
    }
  })

  return { users, count: count ?? 0 }
}

/**
 * Combined result of the admin purchase-list detail page fetch.
 */
export type AdminUserPurchaseList = {
  /** The target user's profile row, or `null` when the user does not exist. */
  profile: ProfileRow | null
  /** The user's purchase list, most recently added first. */
  entries: AdminPurchaseListEntry[]
}

/**
 * Fetches a user's profile and full purchase list for the admin detail page.
 *
 * Both reads run in parallel. The nested `paints → product_lines → brands`
 * join is flattened into {@link AdminPurchaseListEntry}; rows whose paint join
 * resolved to `null` are dropped.
 *
 * @param userId - UUID of the target user.
 * @returns Profile row (or `null`) alongside the user's purchase list entries.
 */
export async function getUserPurchaseList(userId: string): Promise<AdminUserPurchaseList> {
  const supabase = await createClient()

  const [profile, { data }] = await Promise.all([
    getProfileById(userId),
    supabase
      .from('user_purchase_list')
      .select(
        'paint_id, added_at, updated_at, notes, paints(id, name, hex, paint_type, product_lines(brands(name)))'
      )
      .eq('user_id', userId)
      .order('added_at', { ascending: false }),
  ])

  type RawRow = {
    paint_id: string
    added_at: string
    updated_at: string
    notes: string | null
    paints: {
      id: string
      name: string
      hex: string
      paint_type: string | null
      product_lines: { brands: { name: string } }
    } | null
  }

  const entries: AdminPurchaseListEntry[] = ((data ?? []) as unknown as RawRow[])
    .filter((row): row is RawRow & { paints: NonNullable<RawRow['paints']> } => row.paints !== null)
    .map((row) => ({
      paint_id: row.paint_id,
      name: row.paints.name,
      hex: row.paints.hex,
      paint_type: row.paints.paint_type,
      brand_name: row.paints.product_lines.brands.name,
      added_at: row.added_at,
      updated_at: row.updated_at,
      notes: row.notes,
    }))

  return { profile, entries }
}

/**
 * Counts the paints on a single user's purchase list.
 *
 * Uses a `head: true` count query so no rows are transferred.
 *
 * @param userId - UUID of the target user.
 * @returns Number of paints on the user's purchase list (`0` on error).
 */
export async function countUserPurchaseListPaints(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('user_purchase_list')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count ?? 0
}
