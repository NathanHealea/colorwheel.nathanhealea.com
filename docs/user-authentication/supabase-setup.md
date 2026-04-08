# Supabase Setup

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Configure Supabase client libraries and middleware for cookie-based auth session management. This is the foundation that all other auth features depend on.

## Acceptance Criteria

- [ ] `@supabase/supabase-js` and `@supabase/ssr` packages are installed
- [ ] Browser Supabase client exists for client components
- [ ] Server Supabase client exists for server components and server actions (cookie-based)
- [ ] Middleware refreshes auth session on every request via `supabase.auth.getUser()`
- [ ] Environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are referenced
- [ ] Auth state persists across page refreshes (SSR-compatible via `@supabase/ssr`)

## Key Files

| Action | File                        | Description                                          |
| ------ | --------------------------- | ---------------------------------------------------- |
| Create | `app/lib/supabase/client.ts` | Browser Supabase client                              |
| Create | `app/lib/supabase/server.ts` | Server-side Supabase client (cookies-based)          |
| Create | `middleware.ts`              | Auth session refresh middleware                      |
| Modify | `.env.local`                 | Add Supabase URL and anon key                        |
| Modify | `package.json`               | Add `@supabase/supabase-js` and `@supabase/ssr`     |

## Approach

### 1. Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Browser client

Create `app/lib/supabase/client.ts` using `createBrowserClient()` from `@supabase/ssr`. References `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` env vars.

### 3. Server client

Create `app/lib/supabase/server.ts` — async server client created with `createServerClient()` from `@supabase/ssr`. Reads/writes auth tokens via Next.js `cookies()` from `next/headers`. The `setAll` callback is wrapped in a try/catch to handle calls from Server Components where cookies are read-only (middleware handles the refresh in that case).

### 4. Middleware

Create `middleware.ts` that refreshes the auth session on every request:

- Creates a `createServerClient` inline using request/response cookie accessors (sets cookies on both the request and a new `NextResponse`).
- Calls `supabase.auth.getUser()` to refresh the session and rewrite expired tokens into the response cookies.
- Matcher excludes static assets: `_next/static`, `_next/image`, `favicon.ico`, and common image extensions (`svg|png|jpg|jpeg|gif|webp`).
- Does **not** handle redirects or route protection at this stage — that is added later in [Role-Based Authorization](./role-based-authorization.md).

## Notes

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
- The local Supabase instance is already configured (`supabase/config.toml`) with API on port 54421, DB on port 54422, Studio on port 54423.
