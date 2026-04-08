# Navbar Auth UI

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Add authentication-aware UI elements to the app's navigation. Show sign-in/sign-up links for unauthenticated users and a user menu with profile and sign-out options for authenticated users. Admins see an additional admin link.

## Acceptance Criteria

- [ ] Unauthenticated users see "Sign In" and "Sign Up" links in the navigation
- [ ] Authenticated users see their display name or avatar in the navigation
- [ ] Clicking the user menu reveals options: Profile, Sign Out
- [ ] Admin users see an "Admin" link in the navigation or user menu
- [ ] The navbar updates reactively after sign-in/sign-out without a full page reload
- [ ] Mobile navigation includes the same auth-aware elements

## Key Files

| Action | File                           | Description                                          |
| ------ | ------------------------------ | ---------------------------------------------------- |
| Modify | Navigation component(s)        | Add auth-aware user menu, sign-in/sign-up links      |
| Create | `app/components/UserMenu.tsx`  | Dropdown menu for authenticated users                |

## Approach

### 1. Server-side auth check

The navigation component (or a layout wrapping it) checks auth state server-side via `supabase.auth.getUser()`. If authenticated, queries the user's profile for display name and roles.

### 2. Unauthenticated state

Show "Sign In" and "Sign Up" links styled as DaisyUI buttons or links in the header area.

### 3. Authenticated state

Show a user menu (DaisyUI dropdown) displaying the user's display name. Menu items:

- **Profile** — links to `/profile/edit` or `/profile`
- **Sign Out** — triggers the `signOut` server action

### 4. Admin link

If the user has the `admin` role (from [Role-Based Authorization](./role-based-authorization.md)), show an "Admin" link pointing to the admin area.

### 5. Mobile navigation

Ensure the same auth-aware elements appear in the mobile navigation layout.

## Notes

- The navigation component should be a server component that fetches auth state, passing minimal props to client sub-components as needed.
- Role data comes from the `user_roles` table via the role utility functions.
