# Navbar Auth UI

**Epic:** User Authentication
**Type:** Feature
**Status:** Completed

## Summary

Add authentication-aware UI elements to the app's navigation. Show sign-in/sign-up links for unauthenticated users and a user menu with profile and sign-out options for authenticated users. Admins see an additional admin link.

## Acceptance Criteria

- [x] Unauthenticated users see "Sign In" and "Sign Up" links in the navigation
- [x] Authenticated users see their display name or avatar in the navigation
- [x] Clicking the user menu reveals options: Profile, Sign Out
- [x] Admin users see an "Admin" link in the navigation or user menu
- [x] The navbar updates reactively after sign-in/sign-out without a full page reload
- [x] Mobile navigation includes the same auth-aware elements

## Key Files

| Action | File                           | Description                                          |
| ------ | ------------------------------ | ---------------------------------------------------- |
| Modify | Navigation component(s)        | Add auth-aware user menu, sign-in/sign-up links      |
| Create | `app/components/UserMenu.tsx`  | Dropdown menu for authenticated users                |

## Approach

### 1. Create auth helper and types

Create `src/lib/supabase/auth.ts` with a `getAuthUser` server helper:

- Overloaded signatures: `getAuthUser()` returns `{ user }` or `null`; `getAuthUser({ withProfile: true })` returns `{ user, profile }` or `null`.
- Calls `supabase.auth.getUser()` via the server client, optionally queries the `profiles` table for `display_name` and `avatar_url`.

Create `src/types/profile.ts` with a `Profile` type matching the `profiles` table columns (`id`, `display_name`, `avatar_url`, `bio`, `created_at`, `updated_at`).

Create `src/types/role.ts` with a `Role` type (`'user' | 'admin'`).

Create `src/lib/supabase/roles.ts` with stub `hasRole`/`getUserRoles` utilities that return `false`/`['user']` until the role tables exist (from [Role-Based Authorization](./role-based-authorization.md)). Wrap queries in try/catch to gracefully handle missing tables.

### 2. Unauthenticated state

In the Navbar's `navbar-end` section, when `user` is `null`, render two links:

- "Sign In" — `btn btn-ghost btn-sm`
- "Sign Up" — `btn btn-primary btn-sm`

On very small screens, hide "Sign In" text using `hidden sm:flex` to save space.

### 3. Authenticated state — UserMenu

Create `src/components/UserMenu.tsx` as a client component (`'use client'`):

- Uses HeadlessUI `Menu`, `MenuButton`, `MenuItems`, `MenuItem` (already a dependency).
- Uses `UserCircleIcon` from heroicons as fallback avatar.
- Props: `displayName: string`, `avatarUrl?: string | null`, `signOutAction: () => Promise<void>`, `isAdmin?: boolean`.
- `MenuButton` shows the user's display name (or `UserCircleIcon` fallback).
- `MenuItems` dropdown (`anchor="bottom end"`, `rounded-box bg-base-200 shadow-lg ring-1 ring-base-300`) with:
  - **Profile** link → `/profile`
  - **Admin** link → `/admin` (conditional on `isAdmin`)
  - Divider
  - **Sign Out** — `<form action={signOutAction}><button type="submit">Sign Out</button></form>`
- Menu items styled with `btn btn-ghost` and `data-[focus]:bg-base-300`.

### 4. Admin link

In the Navbar server component, after getting the user, call `hasRole(user.id, 'admin')` with `.catch(() => false)` for graceful degradation. Pass `isAdmin` boolean to `UserMenu`. The admin link appears automatically once role-based authorization tables are created.

### 5. Extract Navbar and restructure layout

This is the most significant change. The current nav is inline in the client `page.tsx` (lines 76–91). It must become a server component to fetch auth state.

**Create `src/components/SidebarToggleButton.tsx`** — Client component that extracts the hamburger button from `page.tsx`. Imports `useUIStore`, `getEffectiveTabFromState`, `useIsDesktop`, `Bars3Icon`, and `Button`. Renders the same hamburger logic currently in `page.tsx`.

**Create `src/components/Navbar.tsx`** — Async server component:

- Imports `getAuthUser`, `signOut`, `hasRole`, `UserMenu`, `SidebarToggleButton`, and the search component.
- Calls `getAuthUser({ withProfile: true })` and `hasRole`.
- Renders `<nav className="navbar ...">` with three sections:
  - `navbar-start`: `<SidebarToggleButton />`
  - `navbar-center`: Search component
  - `navbar-end`: Auth links (unauthenticated) or `<UserMenu />` (authenticated)

**Modify `src/app/layout.tsx`** — Import and render `<Navbar />` inside `<body>` before `{children}`. Wrap in a `flex h-screen w-screen flex-col` container so Navbar is the first child and `{children}` fills the rest.

**Modify `src/app/page.tsx`** — Remove the inline `<nav>` block (lines 76–91) and related imports (`Bars3Icon`, `Button` if only used there). Change the outermost div from `flex h-screen w-screen flex-col` to `flex flex-1 flex-col overflow-hidden` since the layout now provides the outer flex container.

### 6. Mobile navigation

The navbar is always visible on desktop and mobile. Auth-aware elements (Sign In/Sign Up links or UserMenu) render in `navbar-end` which is visible at all breakpoints. No separate MobileNav component is needed since the app doesn't have traditional page navigation — only the hamburger (sidebar toggle), search, and auth controls.

The UserMenu dropdown uses HeadlessUI `anchor="bottom end"` for automatic positioning on all screen sizes.

## Key Files

| Action | File                                    | Description                                              |
| ------ | --------------------------------------- | -------------------------------------------------------- |
| Create | `src/lib/supabase/auth.ts`              | `getAuthUser` server helper with profile loading         |
| Create | `src/types/profile.ts`                  | `Profile` type definition                                |
| Create | `src/types/role.ts`                     | `Role` type definition                                   |
| Create | `src/lib/supabase/roles.ts`             | Stub `hasRole`/`getUserRoles` utilities                  |
| Create | `src/components/Navbar.tsx`             | Async server component with auth-aware nav               |
| Create | `src/components/UserMenu.tsx`           | Client dropdown menu for authenticated users             |
| Create | `src/components/SidebarToggleButton.tsx` | Client component for hamburger/sidebar toggle            |
| Modify | `src/app/layout.tsx`                    | Import and render `<Navbar />`                           |
| Modify | `src/app/page.tsx`                      | Remove inline `<nav>` block and related imports          |

## Notes

- The `profiles` table exists with auto-creation via trigger. Users will have auto-generated `PainterNNNN` display names until the User Profiles feature is implemented.
- The `(auth)` route group pages (`/sign-in`, `/sign-up`) will show the Navbar since it's in the root layout. This is acceptable — it provides consistent navigation and shows Sign In/Sign Up links.
- The layout restructuring (moving nav from `page.tsx` to `layout.tsx`) changes the flex hierarchy. The layout becomes the outer `flex h-screen w-screen flex-col` container; the page becomes `flex flex-1 flex-col overflow-hidden`.
- `clsx` is available and used by `Button.tsx` — use it in new components for conditional classes.
