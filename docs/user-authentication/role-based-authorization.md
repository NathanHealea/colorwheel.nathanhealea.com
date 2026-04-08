# Role-Based Authorization

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Assign roles to user accounts to control access levels across the application. Users can hold **multiple roles** simultaneously. Two roles exist:

- **user** — default role assigned to every account on sign-up. Grants basic access (view content, manage own profile, manage own paint collection and recipes).
- **admin** — promoted role for platform administrators. Grants full management capabilities (role assignment, content moderation, recipe/tag management).

Admins can grant or revoke the `admin` role through an admin interface. The `user` role is always present and cannot be removed.

## Acceptance Criteria

- [ ] A `roles` table exists with seeded `user` and `admin` entries
- [ ] A `user_roles` table links users to roles (many-to-many — a user can hold multiple roles)
- [ ] New users are automatically assigned the `user` role upon profile creation
- [ ] The `user` role cannot be removed from any account
- [ ] At least one admin is seeded or manually assigned in the database
- [ ] Admins can grant or revoke the `admin` role via an admin interface
- [ ] RLS policies on `user_roles` prevent non-admin users from modifying role assignments
- [ ] A helper function or utility exists to check a user's roles on the server
- [ ] Role information is available in middleware for route-level access control
- [ ] Unauthenticated users are redirected to the sign-in page when accessing protected routes
- [ ] Admin routes (`/admin/*`) require the `admin` role
- [ ] Public pages remain accessible without login

## Data Model

### `roles` Table

| Column | Type     | Constraints      |
| ------ | -------- | ---------------- |
| `id`   | `serial` | Primary key      |
| `name` | `text`   | Unique, not null |

Seeded with two rows: `user`, `admin`.

### `user_roles` Table

| Column        | Type          | Constraints                                                |
| ------------- | ------------- | ---------------------------------------------------------- |
| `user_id`     | `uuid`        | FK → `profiles.id` on delete cascade, part of composite PK |
| `role_id`     | `int`         | FK → `roles.id`, part of composite PK                      |
| `assigned_at` | `timestamptz` | Not null, default `now()`                                  |

Composite primary key on `(user_id, role_id)`.

## Row Level Security

### `roles` Table

- **SELECT**: All authenticated users can read roles (needed for display/lookups).
- **INSERT / UPDATE / DELETE**: No user-facing mutations — managed via migrations/seed only.

### `user_roles` Table

- **SELECT**: Authenticated users can read all role assignments (needed for role badges, etc.).
- **INSERT**: Only users with the `admin` role can assign roles to other users.
- **UPDATE**: Only admins can change role assignments.
- **DELETE**: Only admins can remove role assignments. The `user` role cannot be deleted (enforced in policy).
- Users cannot modify their own role assignment regardless of their role.

## Key Files

| Action | File                                                         | Description                                                                    |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Create | `supabase/migrations/XXXXXX_create_roles_tables.sql`         | Migration for `roles`, `user_roles`, RLS policies, helper function, trigger    |
| Create | `app/types/role.ts`                                          | `Role` type definition                                                         |
| Create | `app/lib/supabase/roles.ts`                                  | Server-side `getUserRoles` and `hasRole` utilities                             |
| Modify | `middleware.ts`                                               | Add protected route redirects and admin route protection                       |

## Approach

### 1. Database Migration

Create a new migration that:

1. Creates the `roles` table and seeds `user` and `admin` rows.
2. Creates the `user_roles` table with foreign keys to `profiles` and `roles`.
3. Enables RLS on both tables.
4. Creates RLS policies as described above.
5. Creates a helper SQL function `public.get_user_roles(user_uuid uuid)` that returns an array of the user's role names.

### 2. Auto-Assign Default `user` Role

A database trigger on `profiles` insert automatically inserts into `user_roles`, linking the user to the `user` role. This guarantees every profile has the `user` role regardless of how it was created.

### 3. Server-Side Role Check Utility

Add a utility in `app/lib/supabase/roles.ts` that exposes:

```ts
type Role = 'user' | 'admin'

async function getUserRoles(userId: string): Promise<Role[]>
async function hasRole(userId: string, role: Role): Promise<boolean>
```

`getUserRoles` queries `user_roles` joined with `roles` and returns all role names for the user. `hasRole` is a convenience wrapper. Used by server actions and API routes to gate role-specific operations.

### 4. Middleware Integration

Extend `middleware.ts` to handle route protection:

1. Define `PUBLIC_ROUTES` (`/sign-in`, `/sign-up`, `/auth/callback`, `/forgot-password`, `/reset-password`, `/auth/confirm`) that skip all protection checks.
2. Unauthenticated users accessing non-public routes are redirected to `/sign-in`.
3. Authenticated users without a profile are redirected to `/profile/setup`.
4. For admin routes (`/admin/*`), query the user's roles and redirect users who lack the `admin` role to `/`.

### 5. Seeding the First Admin

The first admin must be assigned manually since no admin UI exists yet at the start:

1. Create an account through the normal sign-up flow (assigned the `user` role by default).
2. Run a SQL command or use Supabase Studio to insert an `admin` role assignment for that user.

## Key Design Decisions

1. **Two-tier role system (`user`, `admin`)** — The `user` role is a permanent baseline assigned to every account. `admin` is a promotional role granted by other admins. This keeps the system simple — users either have basic access or full management access.

2. **Multi-role support (many-to-many)** — Users can hold multiple roles simultaneously. This avoids a strict hierarchy and makes permission checks explicit. The structure supports future role expansion (e.g., adding `moderator`) without schema changes — just insert a new row into `roles`.

3. **Separate `roles` and `user_roles` tables over a column on `profiles`** — A dedicated join table supports the many-to-many relationship, keeps role data normalized, and makes it straightforward to add new roles in the future.

4. **Database trigger for auto-assignment** — A PostgreSQL trigger on `profiles` insert automatically assigns the `user` role. This guarantees consistency regardless of how the profile is created.

5. **`user` role cannot be deleted via RLS** — The delete policy on `user_roles` explicitly excludes rows where `role_id` matches the `user` role. Enforced at the database level.

6. **Self-modification prevention** — All write policies on `user_roles` include `auth.uid() != user_id`, preventing admins from modifying their own roles.

7. **`security definer` on helper functions** — The `get_user_roles` SQL function and the trigger function use `security definer` so they execute with the permissions of the function owner, bypassing RLS. Necessary because the trigger runs during insert (before the user has any roles) and the helper function is used inside other RLS policies.

8. **Server-only role enforcement** — All role checks happen on the server (middleware, server actions, RLS policies). The client never receives role data for authorization purposes.

## Notes

- The `user` role is the baseline — it is always assigned and cannot be removed.
- The many-to-many structure supports future expansion (e.g., adding `moderator`) without schema changes — just insert a new row into `roles`.
- Role checks should happen server-side only — never trust the client to enforce role-based access.
- The `get_user_roles` SQL function can be used inside other RLS policies to gate table access by role (e.g., only admins can delete community recipes).
