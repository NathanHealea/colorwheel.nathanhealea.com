# User Profiles

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Automatically prompt new users to create their profile after their first successful login. A `profiles` table stores user display names linked to Supabase auth users.

## Acceptance Criteria

- [ ] After first login, user is redirected to a profile setup flow
- [ ] User must provide required profile fields before accessing authenticated features
- [ ] Profile record is created in the database linked to the Supabase auth user
- [ ] Returning users skip the setup flow and go directly to the app
- [ ] Display names are unique (case-insensitive)
- [ ] A `profiles` table exists with RLS policies

## Routes

- `/profile/setup` — Profile setup form (display name required)

## Data Model

### `profiles` Table

| Column         | Type          | Constraints                                              |
| -------------- | ------------- | -------------------------------------------------------- |
| `id`           | `uuid`        | Primary key, FK → `auth.users(id)` on delete cascade    |
| `display_name` | `text`        | Not null, unique (case-insensitive via unique index)     |
| `bio`          | `text`        | Nullable                                                 |
| `created_at`   | `timestamptz` | Not null, default `now()`                                |
| `updated_at`   | `timestamptz` | Not null, default `now()`                                |

### Row Level Security

- **SELECT**: Authenticated users can read all profiles.
- **INSERT**: Authenticated users can insert their own profile only (`auth.uid() = id`).
- **UPDATE**: Authenticated users can update their own profile only (`auth.uid() = id`).

## Key Files

| Action | File                                                             | Description                                                    |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Create | `app/profile/setup/page.tsx`                                     | Setup page (renders `ProfileForm` component)                   |
| Create | `app/profile/setup/profile-form.tsx`                             | Client component with display name form, field-level errors    |
| Create | `app/profile/setup/actions.ts`                                   | `setupProfile` server action (validates, checks uniqueness, inserts) |
| Create | `app/modules/profile/validation.ts`                              | Shared validation logic (`validateDisplayName`) and types      |
| Create | `supabase/migrations/XXXXXX_create_profiles_table.sql`           | Creates `profiles` table with RLS policies                     |
| Create | `supabase/migrations/XXXXXX_add_unique_display_name.sql`         | Case-insensitive unique index on `display_name`                |
| Modify | `middleware.ts`                                                  | Redirect authenticated users without a profile to `/profile/setup` |

## Approach

### 1. Profiles table migration

Create the `profiles` table with `id` (uuid FK to `auth.users`), `display_name`, `bio`, and timestamps. Enable RLS. Create policies: authenticated users can SELECT all; users can INSERT/UPDATE own row only. Add a case-insensitive unique index on `display_name`.

### 2. Middleware redirect

After refreshing the auth session, middleware checks if the authenticated user has a profile. If not, redirects to `/profile/setup`. If they already have a profile and visit `/profile/setup`, redirects to `/`. Public routes (`/sign-in`, `/sign-up`, `/auth/callback`) skip this check.

### 3. Profile form

Client component using `useActionState` with the `setupProfile` server action. Runs client-side validation from shared `validateDisplayName` before submitting. Displays field-level errors below the input with `input-error` styling.

### 4. Server action

Validates display name (required, 2-50 chars, alphanumeric/hyphens/underscores only), checks for existing display name (case-insensitive via `ilike`), inserts profile, and redirects to `/`. Handles duplicate constraint violation (`23505`) as a fallback for race conditions.

### 5. Auto-assign user role

A database trigger on `profiles` insert automatically assigns the `user` role via the `user_roles` table (see [Role-Based Authorization](./role-based-authorization.md)).

## Notes

- Display names are unique (case-insensitive) — "Ragnar" and "ragnar" are treated as the same name.
- Display names cannot contain spaces — only letters, numbers, hyphens, and underscores.
- The profile setup flow is enforced at the middleware level, so no authenticated route can be accessed without a profile.
