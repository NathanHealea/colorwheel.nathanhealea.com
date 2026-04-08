# Social Login (Google & Discord)

**Epic:** User Authentication
**Type:** Feature
**Status:** Todo

## Summary

Allow users to sign in or sign up using their Google or Discord accounts via Supabase OAuth, in addition to the existing email/password flow.

## Acceptance Criteria

- [ ] Users can sign in/sign up with Google
- [ ] Users can sign in/sign up with Discord
- [ ] OAuth users are redirected through `/auth/callback` and session is established
- [ ] New OAuth users are redirected to `/profile/setup` (existing middleware handles this)
- [ ] Existing OAuth users bypass setup and go to `/`
- [ ] OAuth buttons appear on both sign-in and sign-up pages
- [ ] Email/password login continues to work alongside OAuth
- [ ] `avatar_url` column added to `profiles` table (nullable text)
- [ ] On OAuth sign-in/sign-up, if `avatar_url` is null, populate it from the provider's profile picture via a Supabase database trigger
- [ ] Profile setup page pre-fills display name from OAuth provider metadata (`full_name`, `name`, or `custom_username`)
- [ ] If the suggested display name is already taken, a warning is shown on the profile setup page

## Routes

No new routes required — reuses existing `/auth/callback`.

## Key Files

| Action | File                                                              | Description                                                              |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Modify | `app/(auth)/sign-in/page.tsx`                                     | Add Google and Discord OAuth buttons                                     |
| Modify | `app/(auth)/sign-up/page.tsx`                                     | Add Google and Discord OAuth buttons                                     |
| Modify | `app/(auth)/actions.ts`                                           | Add `signInWithGoogle()` and `signInWithDiscord()` server actions        |
| Modify | `supabase/config.toml`                                            | Enable Google and Discord providers                                      |
| Create | `supabase/migrations/XXXXXX_add_avatar_url_to_profiles.sql`      | Add `avatar_url` column and trigger to sync from OAuth provider          |
| Modify | `app/profile/setup/page.tsx`                                      | Fetch OAuth display name from user metadata, check uniqueness            |
| Modify | `app/profile/setup/profile-form.tsx`                              | Accept `suggestedName` and `nameAlreadyTaken` props, pre-fill and warn   |

## Approach

### 1. Enable OAuth providers in Supabase

Update `supabase/config.toml` to enable Google and Discord:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"

[auth.external.discord]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
```

### 2. Add environment variables

Add OAuth client IDs and secrets to `.env.local` for local development and to the production Supabase project settings.

### 3. Add `avatar_url` column to profiles

Create a migration that adds the column and a database trigger to sync the avatar from the OAuth provider:

```sql
alter table public.profiles
  add column avatar_url text;

create or replace function public.sync_avatar_from_provider()
returns trigger as $$
declare
  provider_avatar text;
begin
  if new.avatar_url is not null then
    return new;
  end if;

  select raw_user_meta_data->>'avatar_url'
    into provider_avatar
    from auth.users
    where id = new.id;

  if provider_avatar is not null and provider_avatar <> '' then
    new.avatar_url := provider_avatar;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_sync_avatar
  before insert or update on public.profiles
  for each row
  execute function public.sync_avatar_from_provider();
```

### 4. Create OAuth server actions

Add two server actions to `app/(auth)/actions.ts`:

- `signInWithGoogle()` — calls `supabase.auth.signInWithOAuth({ provider: 'google' })` with a redirect URL pointing to `/auth/callback`
- `signInWithDiscord()` — calls `supabase.auth.signInWithOAuth({ provider: 'discord' })` with a redirect URL pointing to `/auth/callback`

Both actions receive the OAuth redirect URL from Supabase and redirect the browser to the provider's consent screen.

### 5. Add OAuth buttons to sign-in and sign-up pages

Add "Continue with Google" and "Continue with Discord" buttons to both pages, separated from the email/password form by a divider. Each button submits a form that calls the corresponding server action.

### 6. Pre-fill display name on profile setup

When an OAuth user lands on `/profile/setup`, the setup page reads the user's metadata from `auth.users.user_metadata` (fields: `full_name`, `name`, or `custom_username`) and passes it to the form as `suggestedName`. The page also checks if that name is already taken and passes `nameAlreadyTaken` to the form.

The form pre-fills the display name input via `defaultValue` and shows a warning alert if the name is taken. Email/password users see an empty input.

### 7. Reuse existing auth callback

The existing `/auth/callback` route handler already exchanges the authorization code for a session and redirects. No changes needed.

## Key Design Decisions

- **Server actions for OAuth** — `signInWithOAuth()` returns a redirect URL. The server action performs the redirect, keeping the flow server-side.
- **Avatar sync via database trigger** — A `BEFORE INSERT OR UPDATE` trigger on `profiles` checks `auth.users.raw_user_meta_data->>'avatar_url'` and populates `avatar_url` only when null. Uses `security definer` to read from `auth.users`.
- **Existing middleware handles new OAuth users** — Supabase Auth creates the user in `auth.users` automatically. The middleware detects the missing profile and redirects to `/profile/setup`.

## Notes

- **Google OAuth** requires a Google Cloud Console project with OAuth 2.0 credentials. Authorized redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`.
- **Discord OAuth** requires a Discord Developer Application. Redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`.
- For local development, redirect URIs must include `http://localhost:54321/auth/v1/callback` (Supabase local auth server).
