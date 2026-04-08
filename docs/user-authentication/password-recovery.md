# Password Recovery

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Add two password flows: (1) a "forgot password" flow from the sign-in page that sends a reset email, and (2) an in-app "change password" option on the profile edit page. Both use Supabase Auth's built-in password reset methods with the PKCE flow for SSR compatibility.

## Acceptance Criteria

- [ ] Sign-in page displays a "Forgot your password?" link below the password field
- [ ] Forgot password page (`/forgot-password`) accepts an email and sends a reset link
- [ ] Clicking the email link lands on a reset password page (`/reset-password`) where the user enters a new password
- [ ] After resetting, the user is redirected to the sign-in page with a success message
- [ ] Profile edit page (`/profile/edit`) displays a "Change Password" section for email-authenticated users
- [ ] OAuth-only users do not see the "Change Password" section
- [ ] Password change requires a minimum of 6 characters (matching sign-up validation)
- [ ] Error states are handled: invalid/expired token, mismatched passwords, rate limiting

## Routes

| Route              | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `/forgot-password` | Public page — email input to request password reset         |
| `/reset-password`  | Public page — new password form after email verification    |
| `/auth/confirm`    | API route — exchanges token hash for session (PKCE flow)    |
| `/profile/edit`    | Existing — add "Change Password" section                    |

## Database

No database schema changes required. Password management is handled entirely by Supabase Auth (`auth.users` table). The only infrastructure change is adding a custom email template and updating Supabase config.

## Key Files

| Action | File                                            | Description                                       |
| ------ | ----------------------------------------------- | ------------------------------------------------- |
| Modify | `app/(auth)/sign-in/page.tsx`                   | Add "Forgot your password?" link                  |
| Create | `app/(auth)/forgot-password/page.tsx`           | Email input form to request reset                 |
| Create | `app/(auth)/reset-password/page.tsx`            | New password form after token verification        |
| Modify | `app/(auth)/actions.ts`                         | Add `requestPasswordReset` and `updatePassword`   |
| Create | `app/auth/confirm/route.ts`                     | Token hash exchange endpoint for PKCE flow        |
| Modify | `app/profile/edit/edit-profile-form.tsx`        | Add "Change Password" section                     |
| Create | `app/profile/edit/actions.ts`                   | Add `changePassword` server action                |
| Create | `supabase/templates/recovery.html`              | Password reset email template                     |
| Modify | `supabase/config.toml`                          | Reference recovery email template                 |
| Modify | `middleware.ts`                                 | Add `/forgot-password` and `/reset-password` to public routes |

## Approach

### 1. Create custom password reset email template

Create `supabase/templates/recovery.html` with Color Wheel branding. The template must use the PKCE token format:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  Reset Password
</a>
```

Update `supabase/config.toml` to reference the template:

```toml
[auth.email.template.recovery]
subject = "Reset Your Password — Color Wheel"
content_path = "./supabase/templates/recovery.html"
```

### 2. Create `/auth/confirm` route (PKCE token exchange)

Create `app/auth/confirm/route.ts` that handles the token hash verification:

- Reads `token_hash` and `type` from URL params
- Calls `supabase.auth.verifyOtp({ type, token_hash })`
- On success: redirects to the `next` param (e.g., `/reset-password`)
- On failure: redirects to `/sign-in` with error message

This is separate from the existing `/auth/callback` route which handles OAuth code exchange.

### 3. Create forgot password page and server action

**Page:** `app/(auth)/forgot-password/page.tsx`
- Client component with `useActionState` (matching sign-in/sign-up pattern)
- Email input field, submit button, success/error states
- Link back to sign-in page

**Action:** Add `requestPasswordReset` to `app/(auth)/actions.ts`:
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- Always shows success message to prevent email enumeration

### 4. Create reset password page and server action

**Page:** `app/(auth)/reset-password/page.tsx`
- Client component with `useActionState`
- New password + confirm password fields
- On success: redirect to sign-in with success message

**Action:** Add `updatePassword` to `app/(auth)/actions.ts`:
- Validates passwords match
- Calls `supabase.auth.updateUser({ password })`
- Signs out and redirects to `/sign-in`

### 5. Add "Forgot password?" link to sign-in page

Add a link between the password field and the submit button. Handle the `?message=` query param for post-reset success messages.

### 6. Add "Change Password" section to profile edit page

Add a "Change Password" section at the bottom of the profile edit form:
- Only visible to email-authenticated users (check `user.identities` for an email provider)
- New password + confirm password fields
- Separate form with its own `changePassword` server action

## Key Design Decisions

1. **PKCE flow with `/auth/confirm` route** — The project uses SSR via `@supabase/ssr`, which requires the PKCE flow. Separate from `/auth/callback` which handles OAuth.
2. **Always show success on forgot password** — Prevents email enumeration attacks.
3. **Sign out after password reset** — Forces login with new password. In-app change does NOT sign out.
4. **OAuth users cannot change password** — Hidden for users without an email identity.

## Notes

- The local Supabase Inbucket email server at `127.0.0.1:54424` can be used to test reset emails during development.
- Rate limiting is configured in Supabase config, which prevents spam of reset emails.
