# Collection Management

**Epic:** User Management
**Type:** Feature
**Status:** Todo
**Branch:** `feature/collection-management`
**Merge into:** `v1/main`

## Summary

Admin interface for performing CRUD operations on every user's paint collection. Admins can browse all user collections in a paginated list, drill into an individual user's collection, add or remove paints on their behalf, edit per-paint notes, and clear an entire collection. UI and interaction patterns mirror `/admin/users` and `/admin/roles` — the same search + paginated table, detail page, confirmation dialogs, and admin-sidebar placement — so the admin section stays visually and behaviourally consistent.

## Acceptance Criteria

- [ ] Admins can view a paginated list of all users with their collection size (paint count) and last-updated timestamp
- [ ] Admins can search the list by display name or email (case-insensitive partial match), with URL-synced `?q=` state
- [ ] Admins can filter the list to show only users with at least one paint, only users with empty collections, or all users
- [ ] Admins can open a user's collection detail page showing every paint in that collection with brand, paint type, hex swatch, added date, and notes
- [ ] Admins can add a paint to any user's collection via a searchable paint picker
- [ ] Admins can remove a single paint from a user's collection with an inline confirmation
- [ ] Admins can edit the per-paint `notes` field inline
- [ ] Admins can clear an entire user's collection with a type-to-confirm dialog (typing the user's display name)
- [ ] Admin sidebar shows a "Collections" nav item alongside Dashboard / Users / Roles, with active-state highlighting
- [ ] Admins cannot mutate their own collection through the admin UI (prevents accidental self-modification; admins use the standard `/collection` page for their own collection)
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route                               | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| `/admin/collections`                | Paginated user list with collection size, search, filter  |
| `/admin/collections/[userId]`       | Collection detail: user's paints with CRUD controls       |

## Database

### Dependency

This feature depends on the `user_paints` table defined in [`00-manage-collection.md`](../06-collection-tracking/00-manage-collection.md). That migration must land first. The schema expected here:

| Column     | Type          | Notes                                             |
| ---------- | ------------- | ------------------------------------------------- |
| `user_id`  | `uuid`        | FK → `profiles.id`, part of composite PK          |
| `paint_id` | `uuid`        | FK → `paints.id`, part of composite PK            |
| `added_at` | `timestamptz` | Default `now()`                                   |
| `notes`    | `text`        | Nullable                                          |

### New migration — admin RLS policies and updated-at tracking

Create `supabase/migrations/XXXXXX_admin_collection_policies.sql`:

#### 1. Admin RLS policies on `user_paints`

The base policies scope reads/writes to `auth.uid() = user_id`. Add admin-only policies so the admin UI can operate on any user's rows through the regular anon client:

```sql
CREATE POLICY "Admins can read all user_paints"
  ON public.user_paints FOR SELECT TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can insert into any user_paints"
  ON public.user_paints FOR INSERT TO authenticated
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can update any user_paints"
  ON public.user_paints FOR UPDATE TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())))
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can delete any user_paints"
  ON public.user_paints FOR DELETE TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));
```

Policies are additive — the existing `auth.uid() = user_id` policies continue to protect non-admin users.

#### 2. `updated_at` column

The list view shows "last activity" per user. Add:

```sql
ALTER TABLE public.user_paints
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_user_paints_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_paints_updated
  BEFORE UPDATE ON public.user_paints
  FOR EACH ROW EXECUTE FUNCTION public.set_user_paints_updated_at();
```

If `00-manage-collection.md` already adds `updated_at`, skip this block.

## Key Files

| Action | File                                                                       | Description                                                     |
| ------ | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Create | `supabase/migrations/XXXXXX_admin_collection_policies.sql`                 | Admin RLS policies on `user_paints` + `updated_at` column       |
| Create | `src/modules/admin/services/collection-service.ts`                         | `listUserCollections`, `getUserCollection`, `countUserPaints`   |
| Create | `src/modules/admin/actions/add-paint-to-collection.ts`                     | Server action: admin adds a paint to a user's collection        |
| Create | `src/modules/admin/actions/remove-paint-from-collection.ts`                | Server action: admin removes a single paint                     |
| Create | `src/modules/admin/actions/update-collection-note.ts`                      | Server action: update the `notes` field on a `user_paints` row  |
| Create | `src/modules/admin/actions/clear-user-collection.ts`                       | Server action: delete all `user_paints` for a given user        |
| Create | `src/app/admin/collections/page.tsx`                                       | Admin collections list page (search, filter, pagination)        |
| Create | `src/app/admin/collections/[userId]/page.tsx`                              | Admin collection detail page for a specific user                |
| Create | `src/modules/admin/components/collections-list-table.tsx`                  | Client table: users with collection size + view link            |
| Create | `src/modules/admin/components/collection-size-filter.tsx`                  | URL-synced filter: all / non-empty / empty                      |
| Create | `src/modules/admin/components/user-collection-table.tsx`                   | Client table: a user's paints with inline remove + notes edit   |
| Create | `src/modules/admin/components/add-paint-to-collection-form.tsx`            | Client paint-picker form that submits the add action            |
| Create | `src/modules/admin/components/clear-collection-dialog.tsx`                 | Type-to-confirm dialog for wiping a user's collection           |
| Modify | `src/modules/admin/components/admin-sidebar.tsx`                           | Add "Collections" nav item                                      |

### Existing files (pattern references — no changes)

| File                                                         | Why it's a reference                                   |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `src/app/admin/users/page.tsx`                               | Paginated list w/ search, filter, URL params           |
| `src/app/admin/users/[id]/page.tsx`                          | Admin detail page shape                                |
| `src/app/admin/roles/[id]/page.tsx`                          | Detail page with assignment form + table               |
| `src/modules/user/services/profile-service.ts`               | Service module shape with `listX` + `getById`          |
| `src/modules/admin/actions/delete-role.ts`                   | Server action pattern: fetch → validate → mutate → revalidate |
| `src/modules/user/components/admin-users-table.tsx`          | Client table with `useTransition` and per-row actions  |
| `src/modules/user/components/delete-user-dialog.tsx`         | Type-to-confirm dialog pattern                         |
| `src/modules/user/components/user-search.tsx`                | Debounced URL-synced search input                      |
| `src/modules/admin/components/assign-role-form.tsx`          | Picker component that drives an assignment action      |

## Implementation

### Step 1: Migration — admin policies and `updated_at`

Create `supabase/migrations/XXXXXX_admin_collection_policies.sql` with the policies and column/trigger shown above. Regenerate Supabase types after applying: `npm run db:types`.

Commit: `feat(collections): add admin RLS policies and updated_at on user_paints`

### Step 2: Collection service

Create `src/modules/admin/services/collection-service.ts` — mirrors the shape of `profile-service.ts` and `role-service.ts`:

- `listUserCollections({ q, sizeFilter, offset, limit })` — returns `{ users, count }`:
  - Base query: `profiles` with `email, display_name, avatar_url, created_at` plus `user_paints(count)` aggregated and `MAX(user_paints.updated_at)` as `last_activity` (implement the max via a separate per-user query or a SQL view; simplest: fetch `user_paints.updated_at` alongside and reduce in JS).
  - `q` → `ilike` against `display_name` and `email` (OR via two parallel queries then dedupe, matching the pattern already used in `paint-service.ts`).
  - `sizeFilter === 'non-empty'` → inner join on `user_paints`.
  - `sizeFilter === 'empty'` → left join + filter `user_paints IS NULL`.
  - Pagination via `.range(offset, offset + limit - 1)` with `{ count: 'exact' }`.
- `getUserCollection(userId)` — returns the user's profile (`display_name`, `email`, `avatar_url`) plus an array of collection entries joined to paints:
  ```ts
  supabase
    .from('user_paints')
    .select('paint_id, added_at, updated_at, notes, paints(id, name, hex, paint_type, product_lines(brands(name)))')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
  ```
- `countUserPaints(userId)` — helper that returns just the count (used after a mutation to update UI counts).

All methods use `createClient()` (anon key, admin RLS grants access). No service-role client needed.

Commit: `feat(collections): add admin collection service`

### Step 3: Server actions

Create four server actions in `src/modules/admin/actions/`. Follow the existing pattern: `'use server'`, validate caller, perform mutation, revalidate, return `{ error?: string }`.

**`add-paint-to-collection.ts`** — `addPaintToCollection(userId: string, paintId: string)`
1. Get current user via `supabase.auth.getUser()`. Reject if not authenticated.
2. Self-protection: reject if `userId === currentUser.id` with message "Use your own collection page to modify your paints".
3. Insert into `user_paints`. Handle unique-violation (`23505` → "Paint already in this user's collection").
4. `revalidatePath('/admin/collections')` and `revalidatePath(\`/admin/collections/${userId}\`)`.

**`remove-paint-from-collection.ts`** — `removePaintFromCollection(userId: string, paintId: string)`
1. Self-protection as above.
2. `supabase.from('user_paints').delete().eq('user_id', userId).eq('paint_id', paintId)`.
3. Revalidate both paths.

**`update-collection-note.ts`** — `updateCollectionNote(userId: string, paintId: string, notes: string | null)`
1. Self-protection as above.
2. Trim `notes`; treat empty string as `null`.
3. Cap at 500 characters (validation; reject otherwise).
4. `supabase.from('user_paints').update({ notes }).eq('user_id', userId).eq('paint_id', paintId)`.
5. Revalidate detail path only.

**`clear-user-collection.ts`** — `clearUserCollection(userId: string)`
1. Self-protection as above.
2. `supabase.from('user_paints').delete().eq('user_id', userId)`.
3. Revalidate both paths.

Commit: `feat(collections): add admin CRUD server actions for collections`

### Step 4: Collections list page

Create `src/app/admin/collections/page.tsx` (server component, mirrors `src/app/admin/users/page.tsx`):

1. Accepts `searchParams: { q?: string; filter?: 'empty' | 'non-empty'; page?: string }`.
2. Resolves current page, `PAGE_SIZE = 20`.
3. Calls `listUserCollections({ q, sizeFilter, offset, limit: PAGE_SIZE })`.
4. Renders page header, search input (reuse `UserSearch` with a custom `basePath="/admin/collections"` prop — see Step 8 note), `<CollectionSizeFilter />`, `<CollectionsListTable />`, and pagination identical to users page.

Create `src/modules/admin/components/collection-size-filter.tsx` — client component with a `<select>` dropdown ("All", "With paints", "Empty"), URL-synced via `useRouter().replace()`, resets `?page=1` on change.

Create `src/modules/admin/components/collections-list-table.tsx` — client component:
- **Columns:** Avatar + display name, Email, Paints (count), Last activity, Actions.
- **Actions:** "View" link to `/admin/collections/[userId]`.
- **Row click:** whole row is a link to the detail page (match `admin-users-table.tsx` affordance).
- Empty state: "No users match the current filters".

Commit: `feat(collections): add admin collections list page`

### Step 5: Collection detail page

Create `src/app/admin/collections/[userId]/page.tsx`:

1. Await `params`, call `getUserCollection(userId)`. Return `notFound()` if profile missing.
2. Also fetch the current admin user via `auth.getUser()` to pass `isSelf` flag to child components.
3. Render:
   - Header: avatar, display name, email, paint count, last activity timestamp
   - `<AddPaintToCollectionForm userId={userId} />` (hidden when `isSelf`)
   - `<UserCollectionTable userId={userId} entries={entries} isSelf={isSelf} />`
   - `<ClearCollectionDialog userId={userId} displayName={profile.display_name} paintCount={entries.length} isSelf={isSelf} />` (hidden when `isSelf` or count is 0)

Create `src/modules/admin/components/user-collection-table.tsx` — client component:
- **Columns:** Hex swatch, Paint name + brand (link to `/paints/[id]`), Paint type, Added, Notes (inline-editable), Actions.
- **Notes editing:** click-to-edit text input; `useTransition` calls `updateCollectionNote`.
- **Remove action:** inline button with a small inline-confirm pattern (one-click arms, second click confirms — same as `role-list-table.tsx` delete flow). Disabled when `isSelf`.
- Empty state: "This user has no paints in their collection".

Create `src/modules/admin/components/add-paint-to-collection-form.tsx` — client component:
- Search input that queries paints via `paintService.searchPaints({ query, limit: 10 })` through a lightweight server action (`/src/modules/admin/actions/search-paints-for-picker.ts` — or reuse an existing paint search if one is exposed). Renders up to 10 suggestions with brand + swatch.
- Clicking a suggestion calls `addPaintToCollection(userId, paint.id)` via `useTransition`.
- Success: clears input, toasts (or inline success text), relies on `revalidatePath` to re-render the table.

Create `src/modules/admin/components/clear-collection-dialog.tsx` — client component:
- Mirrors `delete-user-dialog.tsx` exactly: native `<dialog>`, trigger button labelled "Clear collection", warning copy, type-to-confirm input (must match user's display name), disabled "Clear" button until match.
- On confirm, calls `clearUserCollection(userId)` via `useTransition`.

Commit: `feat(collections): add admin collection detail page and components`

### Step 6: Admin sidebar

Modify `src/modules/admin/components/admin-sidebar.tsx` — add to `NAV_ITEMS`:

```ts
const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/roles', label: 'Roles' },
  { href: '/admin/collections', label: 'Collections' },
]
```

Commit: `feat(collections): add collections link to admin sidebar`

### Step 7: Build and verify

1. `npm run build` and `npm run lint` pass.
2. Regenerate Supabase types if the migration added/changed columns.
3. Manual test scenarios:
   - Non-admin visiting `/admin/collections` is redirected to `/` (middleware).
   - Admin sees every user's collection in the list, including empty ones.
   - Search filters by display name and email.
   - Size filter returns only empty / non-empty / all users.
   - Detail page renders the correct user's paints with correct counts.
   - Admin can add a paint to another user's collection; count updates on revalidation.
   - Admin can remove a paint; count decrements.
   - Admin can edit and save notes; value persists.
   - Admin can clear a user's collection after typing the display name; count becomes 0.
   - Admin cannot mutate their own collection from `/admin/collections/[selfId]` (controls hidden).
   - Adding a paint already in a user's collection shows the "already in collection" error.

### Step 8: Shared primitives (optional polish)

`UserSearch` currently hardcodes its route. To avoid duplicating the component, add a `basePath` prop defaulting to `/admin/users`. If that change would affect an unrelated feature, instead create a thin `CollectionsSearch` wrapper. Prefer generalising `UserSearch` when the change is mechanical.

## Key Design Decisions

1. **Additive admin RLS policies, no service-role client.** The base `user_paints` policies scope reads/writes to the owning user. Adding admin-scoped `USING ('admin' = ANY(get_user_roles(auth.uid())))` policies lets the admin UI use the same anon Supabase client as the rest of the app — no `SUPABASE_SECRET_KEY` leakage risk, and middleware's role check already gates the routes.
2. **Self-protection at the action layer, not just the UI.** Every mutation action refuses when `userId === currentUser.id`. The UI also hides these controls, but defense-in-depth keeps a rogue client-side call from modifying the admin's own data through the admin path (they already have `/collection` for their own).
3. **Type-to-confirm only for the destructive "clear all" action.** Single-paint removes use an inline one-click-arms pattern (matches role deletion). A typed confirmation is reserved for wiping an entire collection, matching the `delete-user-dialog` standard for irreversible bulk operations.
4. **Pagination and search state lives in URL params.** Matches `/admin/users` — the list is linkable, supports browser navigation, and needs no client state library.
5. **"Last activity" uses `updated_at`, not `added_at`.** A trigger keeps `updated_at` current on any row mutation (notes edits count as activity). This gives admins a meaningful signal for churn triage.
6. **Detail page uses the admin client only if RLS is insufficient.** In this design, admin RLS on `user_paints` is sufficient for every admin read and write. The service-role client is not required and should not be introduced here — doing so would bypass RLS unnecessarily and widen the attack surface.

## Risks & Considerations

- **Hard dependency on `user_paints`.** If `00-manage-collection.md` has not landed, this feature cannot be implemented. Verify at the start of `/implement` — if the table is missing, pause and implement `00-manage-collection.md` first.
- **RLS subtlety.** Adding admin policies to `user_paints` means any bug in `get_user_roles` instantly affects data access. Test the migration by: (a) admin can read/write any row, (b) non-admin user cannot read/write another user's row, (c) non-admin user can still read/write their own rows.
- **Paint-picker performance.** A naive `paints` `ilike` search per keystroke is fine for the current paint count but revisit if the table grows past ~10k. Reuse `paintService.searchPaints()` which already handles brand+name search.
- **Pagination cost for `updated_at` aggregation.** Computing `MAX(user_paints.updated_at)` per user across a paginated profiles query can require a join or subquery. If the simplest Supabase select-with-aggregate is awkward, fall back to a SQL view (`v_user_collection_summary`) or defer the "Last activity" column to v2. Do not block the feature on this.
- **Empty-collection filter semantics.** Decide whether users with deleted profiles but leftover `user_paints` rows (shouldn't happen thanks to `ON DELETE CASCADE`, but worth confirming) are surfaced or hidden. Rely on the cascade and don't add dead-row cleanup here.
- **Consistency with future "named collections".** If the product later introduces named collections (multiple per user), this admin UI will need to be extended to pick a collection within a user. For now, a user has exactly one implicit collection = their `user_paints` rows, which matches the current data model.

## Notes

- Middleware already protects `/admin/*` for non-admin users — no additional route guard required, but keep the defensive `if (!user)` narrowing in each page.
- Do not introduce a new Supabase admin client for this feature. All operations can go through the standard server client with admin RLS policies.
- Follow the existing JSDoc and module-structure conventions from `CLAUDE.md` when creating service, action, component, and type files.
