# User Profile Creation on First Login

**Epic:** Authentication & User Accounts
**Type:** Feature
**Status:** Done

## Summary

When a user signs up (email/password or OAuth), a skeleton profile record is automatically created in the database via a trigger. The user is then redirected to a profile setup page to complete their profile (display name). Until the profile is completed, authenticated routes are inaccessible.

## Acceptance Criteria

- [x] A profile record is automatically created when a new auth user is created (database trigger)
- [x] New users with incomplete profiles are redirected to `/profile/setup`
- [x] User must provide a display name before accessing authenticated features
- [x] Returning users with completed profiles skip setup and go directly to the app
- [x] Display names are unique (case-insensitive)
- [x] The setup page updates the existing profile record (not insert)
- [x] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route            | Description                                |
| ---------------- | ------------------------------------------ |
| `/profile/setup` | Profile setup form (display name required) |

## Key Files

| Action | File                                                   | Description                                                        |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Create | `src/app/profile/setup/page.tsx`                       | Setup page (renders ProfileForm component)                         |
| Create | `src/app/profile/setup/profile-form.tsx`               | Client component with display name form                            |
| Create | `src/app/profile/setup/actions.ts`                     | `setupProfile` server action                                       |
| Create | `src/modules/profile/validation.ts`                    | Shared validation logic and `ProfileFormState` type                |
| Modify | `src/middleware.ts`                                    | Redirect authenticated users without a profile to `/profile/setup` |
| Create | `supabase/migrations/XXXXXX_create_profiles_table.sql` | Creates profiles table with RLS policies                           |

## Database

### `profiles` Table

| Column         | Type          | Constraints                                       |
| -------------- | ------------- | ------------------------------------------------- |
| `id`           | `uuid`        | PK, FK to `auth.users.id` on delete cascade       |
| `display_name` | `text`        | Nullable, unique (case-insensitive partial index)  |
| `bio`          | `text`        | Nullable                                           |
| `avatar_url`   | `text`        | Nullable                                           |
| `created_at`   | `timestamptz` | Not null, default `now()`                          |
| `updated_at`   | `timestamptz` | Not null, default `now()`                          |

`display_name` is nullable so the trigger can create a skeleton row without a name. The unique index is a partial index (`WHERE display_name IS NOT NULL`) so multiple incomplete profiles can coexist.

A profile is considered "complete" when `display_name IS NOT NULL`.

### Auto-Create Trigger

A `handle_new_user()` function runs `AFTER INSERT` on `auth.users`. It inserts a skeleton row into `profiles` with only the `id` set. The function uses `SECURITY DEFINER` to bypass RLS.

### Row Level Security

- **SELECT**: All authenticated users can read all profiles
- **INSERT**: Service role only (trigger handles creation)
- **UPDATE**: Users can update their own profile (`auth.uid() = id`)

## Implementation

### 1. Profiles table and auto-create trigger migration

**File:** `supabase/migrations/<timestamp>_create_profiles_table.sql`

Create a single migration that:

1. Creates the `profiles` table with the schema above.
2. Adds a case-insensitive partial unique index on `display_name`:
   ```sql
   CREATE UNIQUE INDEX profiles_display_name_unique
     ON public.profiles (lower(display_name))
     WHERE display_name IS NOT NULL;
   ```
3. Enables RLS with these policies:
   - `SELECT` — all authenticated users
   - `INSERT` — none (trigger handles creation via `SECURITY DEFINER`)
   - `UPDATE` — own row only (`auth.uid() = id`)
4. Creates the `handle_new_user()` function (`SECURITY DEFINER`, set `search_path = ''`) that inserts a skeleton profile:
   ```sql
   INSERT INTO public.profiles (id) VALUES (NEW.id);
   ```
5. Creates the trigger on `auth.users`:
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

This ensures every new auth user (email, OAuth, etc.) immediately has a profile row. The `display_name` is NULL, marking it as incomplete.

### 2. Middleware redirect

**File:** `src/middleware.ts`

After the existing `supabase.auth.getUser()` call, add profile completion checks:

1. Define `PUBLIC_ROUTES`: `/sign-in`, `/sign-up`, `/auth/callback`.
2. If the request path matches a public route, skip all checks.
3. If no authenticated user, skip (the Protected Routes feature handles auth redirects).
4. For authenticated users, query `profiles` for the user's row and check if `display_name` is not null.
5. If the profile is incomplete (`display_name IS NULL` or no row found) and the path is NOT `/profile/setup`, redirect to `/profile/setup`.
6. If the profile is complete and the path IS `/profile/setup`, redirect to `/` (prevent re-visiting setup).

The profile check uses `supabase.from('profiles').select('display_name').eq('id', user.id).single()`. This adds one lightweight query per request for authenticated users. The middleware Supabase client already exists.

### 3. Profile setup page

**File:** `src/app/profile/setup/page.tsx`

Server component that:

1. Creates a Supabase server client and gets the authenticated user.
2. If no user, redirects to `/sign-in`.
3. Fetches the user's profile row.
4. If profile has a non-null `display_name`, redirects to `/` (already complete).
5. If no profile row exists (edge case — trigger failed), inserts a skeleton row.
6. Renders a `Card` with a title "Complete your profile" and the `ProfileForm` client component.

### 4. Profile form

**File:** `src/app/profile/setup/profile-form.tsx`

Client component using `useActionState` with the `setupProfile` server action (matching the pattern in `sign-in/page.tsx` and `sign-up/page.tsx`):

1. A single `display_name` input field with a label "Display name" and helper text showing the format rules.
2. Field-level error display using `form-message` class when the server action returns errors.
3. A submit button ("Complete setup") that shows a pending state.
4. Client-side validation via the shared `validateDisplayName` function before submission (prevents unnecessary server round-trips).

### 5. Server action

**File:** `src/app/profile/setup/actions.ts`

`setupProfile` server action:

1. Gets the authenticated user. If none, returns an error.
2. Extracts `display_name` from form data.
3. Validates using `validateDisplayName` from the shared validation module.
4. If invalid, returns field-level errors.
5. **Updates** (not inserts) the profile row: `supabase.from('profiles').update({ display_name, updated_at: new Date().toISOString() }).eq('id', user.id)`.
6. Handles unique constraint violation (Postgres error code `23505`) by returning "Display name is already taken."
7. On success, calls `revalidatePath('/', 'layout')` and `redirect('/')`.

### 6. Shared validation

**File:** `src/modules/profile/validation.ts`

Exports:

- `ProfileFormState` type — `{ errors?: { display_name?: string }; error?: string } | null`
- `validateDisplayName(name: string)` — returns an error string or `null`:
  - Required (non-empty after trim)
  - 2–50 characters
  - Only letters, numbers, hyphens, underscores (`/^[a-zA-Z0-9_-]+$/`)

### 7. Verify build and lint

Run `npm run build` and `npm run lint` to confirm no errors are introduced.

## Notes

- Display names are unique (case-insensitive) — "Ragnar" and "ragnar" are treated as the same name.
- Display names cannot contain spaces — only letters, numbers, hyphens, and underscores.
- The profile setup flow is enforced at the middleware level, so no authenticated route can be accessed without a completed profile.
- The auto-create trigger means profile rows always exist for authenticated users — the setup page updates rather than inserts.
- The partial unique index on `display_name` allows multiple NULL values (incomplete profiles) without violating uniqueness.
