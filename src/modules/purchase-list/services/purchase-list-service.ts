import type { SupabaseClient } from '@supabase/supabase-js'

import type { PaintWithBrand } from '@/modules/paints/services/paint-service'
import type { PurchaseListPaint } from '@/modules/purchase-list/types/purchase-list-paint'

/**
 * Creates a purchase list service bound to the given Supabase client.
 *
 * All `user_purchase_list` queries are encapsulated here. Use the `.server.ts`
 * or `.client.ts` wrappers to obtain an instance with the correct client.
 *
 * Write operations rely on RLS to enforce ownership, but `userId` is passed
 * explicitly so the intent is clear when reading the code.
 *
 * @param supabase - A Supabase client instance (server or browser).
 * @returns An object with purchase list query and mutation methods.
 */
export function createPurchaseListService(supabase: SupabaseClient) {
  return {
    /**
     * Returns the set of paint IDs on the user's purchase list.
     *
     * Returns a `Set<string>` for O(1) `has()` lookups from render code.
     *
     * @param userId - The authenticated user's UUID.
     * @returns Set of paint UUID strings.
     */
    async getUserPurchaseListIds(userId: string): Promise<Set<string>> {
      const { data } = await supabase
        .from('user_purchase_list')
        .select('paint_id')
        .eq('user_id', userId)

      return new Set((data ?? []).map((row: { paint_id: string }) => row.paint_id))
    },

    /**
     * Checks whether a specific paint is on the user's purchase list.
     *
     * @param userId - The authenticated user's UUID.
     * @param paintId - The paint's UUID.
     * @returns `true` if the paint is on the purchase list.
     */
    async isOnPurchaseList(userId: string, paintId: string): Promise<boolean> {
      const { data } = await supabase
        .from('user_purchase_list')
        .select('paint_id')
        .eq('user_id', userId)
        .eq('paint_id', paintId)
        .maybeSingle()

      return data !== null
    },

    /**
     * Adds a paint to the user's purchase list.
     *
     * Idempotent — if the paint is already on the list (unique constraint
     * violation, code `23505`) the call succeeds silently.
     *
     * @param userId - The authenticated user's UUID.
     * @param paintId - The paint's UUID to add.
     * @returns An object with an optional `error` string on failure.
     */
    async addPaint(userId: string, paintId: string): Promise<{ error?: string }> {
      const { error } = await supabase
        .from('user_purchase_list')
        .insert({ user_id: userId, paint_id: paintId })

      if (error) {
        if (error.code === '23505') return {}
        return { error: error.message }
      }

      return {}
    },

    /**
     * Removes a paint from the user's purchase list.
     *
     * Idempotent — if the row does not exist the call succeeds silently.
     *
     * @param userId - The authenticated user's UUID.
     * @param paintId - The paint's UUID to remove.
     * @returns An object with an optional `error` string on failure.
     */
    async removePaint(userId: string, paintId: string): Promise<{ error?: string }> {
      const { error } = await supabase
        .from('user_purchase_list')
        .delete()
        .eq('user_id', userId)
        .eq('paint_id', paintId)

      if (error) return { error: error.message }
      return {}
    },

    /**
     * Returns the paints on the user's purchase list, most recently added first.
     *
     * @param userId - The authenticated user's UUID.
     * @param options.limit - Max rows to return (default 50).
     * @param options.offset - Row offset for pagination (default 0).
     * @returns Array of {@link PurchaseListPaint} rows.
     */
    async getPurchaseListPaints(
      userId: string,
      options?: { limit?: number; offset?: number },
    ): Promise<PurchaseListPaint[]> {
      const limit = options?.limit ?? 50
      const offset = options?.offset ?? 0

      const { data } = await supabase
        .from('user_purchase_list')
        .select('added_at, paints(*, product_lines(*, brands(*)))')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })
        .range(offset, offset + limit - 1)

      type RawRow = { added_at: string; paints: PaintWithBrand | null }

      return ((data ?? []) as unknown as RawRow[])
        .filter((row): row is RawRow & { paints: PaintWithBrand } => row.paints !== null)
        .map((row) => ({ ...row.paints, added_at: row.added_at }))
    },

    /**
     * Returns the total number of paints on the user's purchase list.
     *
     * @param userId - The authenticated user's UUID.
     * @returns Total count of paints on the purchase list.
     */
    async getPurchaseListCount(userId: string): Promise<number> {
      const { count } = await supabase
        .from('user_purchase_list')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      return count ?? 0
    },
  }
}

/** The purchase list service instance type. */
export type PurchaseListService = ReturnType<typeof createPurchaseListService>
