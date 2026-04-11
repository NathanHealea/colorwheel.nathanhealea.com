# Sign Up / Sign In via Supabase Auth

**Epic:** Authentication & User Accounts
**Type:** Feature
**Status:** Todo
**Branch:** `v1/feature/sign-up-sign-in`

## Summary

Allow users to create an account and log in using email and password through Supabase Auth.

## Acceptance Criteria

- [ ] Users can sign up with email and password
- [ ] Users can sign in with existing credentials
- [ ] Users can sign out
- [ ] Auth state persists across page refreshes (SSR-compatible via `@supabase/ssr`)
- [ ] Error messages display for invalid credentials or duplicate accounts
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route | Description |
|---|---|
| `/sign-up` | Registration page |
| `/sign-in` | Login page |
| `/auth/callback` | Supabase auth callback handler for confirming email/session exchange |

## Key Files

| Action | File | Description |
|---|---|---|
| Create | `src/lib/supabase/client.ts` | Browser Supabase client |
| Create | `src/lib/supabase/server.ts` | Server-side Supabase client (cookies-based) |
| Create | `src/middleware.ts` | Auth session refresh middleware |
| Create | `src/app/(auth)/layout.tsx` | Minimal centered layout for auth pages |
| Create | `src/app/(auth)/sign-up/page.tsx` | Sign up form |
| Create | `src/app/(auth)/sign-in/page.tsx` | Sign in form |
| Create | `src/app/(auth)/actions.ts` | Server actions for `signUp`, `signIn`, `signOut` |
| Create | `src/app/auth/callback/route.ts` | Auth callback route handler |
| Create | `.env.local` | Supabase environment variables |

## Implementation

### Step 1: Install Supabase packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 2: Install shadcn/ui components needed for auth forms

```bash
npx shadcn@latest add card input label
```

These provide the form structure. The existing `Button` component is already available.

### Step 3: Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

### Step 4: Create browser Supabase client

**File:** `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 5: Create server Supabase client

**File:** `src/lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Middleware handles the session refresh in this case.
          }
        },
      },
    }
  )
}
```

### Step 6: Create middleware

**File:** `src/middleware.ts`

Session-refresh-only middleware. Does **not** handle route protection or profile checks — those are separate features ([protected-routes.md](./protected-routes.md)).

- Creates an inline `createServerClient` using request/response cookie accessors
- Calls `supabase.auth.getUser()` to refresh expired tokens into response cookies
- Matcher excludes static assets: `_next/static`, `_next/image`, `favicon.ico`, and image extensions

```ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 7: Create auth layout

**File:** `src/app/(auth)/layout.tsx`

Uses a `(auth)` route group so sign-up/sign-in pages share a minimal centered layout without the main app navigation.

```tsx
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-24">
      {children}
    </div>
  )
}
```

### Step 8: Create auth server actions

**File:** `src/app/(auth)/actions.ts`

Three actions: `signUp`, `signIn`, `signOut`. Uses `getSiteUrl()` helper for email redirect URL (supports localhost, Vercel preview, and production).

- `signUp(prevState, formData)` — calls `supabase.auth.signUp({ email, password })` with `emailRedirectTo` pointing to `/auth/callback`. Returns `{ success }` or `{ error }`.
- `signIn(prevState, formData)` — calls `supabase.auth.signInWithPassword()`. Calls `revalidatePath('/', 'layout')` then `redirect('/')` on success.
- `signOut()` — calls `supabase.auth.signOut()`, revalidates, redirects to `/`.

Shared type: `AuthState = { error?: string; success?: string } | null`.

### Step 9: Create sign-up page

**File:** `src/app/(auth)/sign-up/page.tsx`

- Client component (`'use client'`) using `useActionState` bound to `signUp` action
- shadcn/ui `Card` with `CardHeader`, `CardContent`, `CardFooter`
- `Label` + `Input` for email and password fields
- Password field has `minLength={6}`
- `Button` with loading state via `useFormStatus` or pending from `useActionState`
- Success alert: "Check your email to confirm your account."
- Error alert with Supabase error message
- Link to `/sign-in` for existing users

### Step 10: Create sign-in page

**File:** `src/app/(auth)/sign-in/page.tsx`

- Same structure as sign-up, bound to `signIn` action
- No `minLength` on password field
- No success state needed (redirects on success)
- Error alert with Supabase error message
- Link to `/sign-up` for new users

### Step 11: Create auth callback route

**File:** `src/app/auth/callback/route.ts`

- Next.js route handler (`GET`)
- Reads `code` and optional `next` (defaults to `/`) from URL search params
- Calls `supabase.auth.exchangeCodeForSession(code)` to complete email verification
- On success: `revalidatePath('/', 'layout')` then redirect to `${origin}${next}`
- On error or missing code: redirect to `/sign-in?error=Could not verify your email. Please try again.`

### Step 12: Verify

1. Run `npm run build` — must pass with no errors
2. Run `npm run lint` — must pass with no errors
3. Run `npm run prettify` — format all new files

## Notes

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- This feature uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (standard Supabase naming) rather than the grimdark project's `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
- UI uses shadcn/ui Card, Input, Label, and Button components with daisyUI-style utility classes for additional styling.
- Server actions are preferred over client-side API calls — form pages invoke them via `useActionState`.
- The middleware in this feature only refreshes sessions. Route protection and profile checks will be added by the [protected routes](./protected-routes.md) and [user profile creation](./user-profile-creation-on-first-login.md) features.
