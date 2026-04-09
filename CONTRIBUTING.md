# Contributing

Thanks for your interest in contributing to the Miniature Paint Color Wheel. This guide covers everything you need to get a local development environment running.

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [npm](https://www.npmjs.com) (included with Node.js)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [GitHub CLI](https://cli.github.com) (`gh`) — for creating pull requests

## Initial Setup

### 1. Fork and Clone

```bash
# Fork via GitHub UI, then clone your fork
git clone git@github.com:<your-username>/colorwheel.nathanhealea.com.git
cd colorwheel.nathanhealea.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Local Supabase

Make sure Docker Desktop is running, then start the local Supabase stack:

```bash
npx supabase start
```

This pulls and starts the Supabase Docker containers (Postgres, Auth, Storage, REST API, Studio, etc.). The first run takes a few minutes to download images.

Once started, the CLI prints the local service URLs and keys:

```
API URL: http://127.0.0.1:54421
GraphQL URL: http://127.0.0.1:54421/graphql/v1
S3 Storage URL: http://127.0.0.1:54421/storage/v1/s3
DB URL: postgresql://postgres:postgres@127.0.0.1:54422/postgres
Studio URL: http://127.0.0.1:54423
Inbucket URL: http://127.0.0.1:54424
...
publishable_default key: sb_publishable_...
service_role key: sb_secret_...
```

You can retrieve these values again at any time with:

```bash
npx supabase status
```

### 4. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with the values from `npx supabase start` / `npx supabase status`:

```bash
# Supabase — values from `npx supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<publishable_default key from npx supabase status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from npx supabase status>

# OAuth Providers (optional — only needed if working on social login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `API URL` from `npx supabase status` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `publishable_default key` from `npx supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` from `npx supabase status` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Request from Project Owner |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Request from Project Ower |

> **Note:** The OAuth provider variables are only required if you are working on social login features. Email/password auth works without them.

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Supabase

### Useful Commands

| Command | Description |
| --- | --- |
| `npx supabase start` | Start all local Supabase services |
| `npx supabase stop` | Stop all local Supabase services |
| `npx supabase status` | Show service URLs and API keys |
| `npx supabase db reset` | Reset database and re-run all migrations + seed |
| `npx supabase migration list` | List applied migrations |

### Supabase Studio

With the local stack running, open [http://127.0.0.1:54423](http://127.0.0.1:54423) to access the Supabase Studio dashboard. From here you can browse tables, run SQL, and manage auth users.

### Inbucket (Email Testing)

Local auth emails (sign-up confirmations, password resets) are captured by Inbucket at [http://127.0.0.1:54424](http://127.0.0.1:54424). No real emails are sent in local development.

### Database Migrations

Migrations live in `supabase/migrations/`. To apply new migrations:

```bash
npx supabase db reset
```

## Development Workflow

### Branch Naming

Use conventional branch prefixes:

- `feature/` — new features
- `fix/` — bug fixes
- `refactor/` — code refactoring

### Commit Messages

Use [conventional commits](https://www.conventionalcommits.org):

```
type(scope): description
```

Examples:

```
feat(color-wheel): add zoom-to-fit button
fix(auth): handle expired refresh token on page load
docs(readme): update setup instructions
```

### Before Submitting a PR

1. **Build** — make sure the project builds without errors:

   ```bash
   npm run build
   ```

2. **Lint** — fix any linting issues:

   ```bash
   npm run lint
   ```

3. **Test** — run the test suite:

   ```bash
   npm run test
   ```

4. **Format** — format your code with Prettier:

   ```bash
   npm run prettify
   ```

### Creating a Pull Request

Push your branch and open a PR against `main`:

```bash
git push -u origin your-branch-name
gh pr create
```

Include a clear description of what your changes do and why.

## Code Style

- **Formatting:** Prettier with no semicolons, single quotes, trailing commas (es5), 120 char line width
- **Styling:** TailwindCSS 4 + daisyUI 5 (Changing in the near feature)
- **Path aliases:** `@/*` maps to the project root
- **TypeScript:** `noImplicitAny` is disabled — implicit `any` is allowed

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
    (auth)/         # Auth-related routes (login, signup, etc.)
    auth/           # Auth callback route
  components/       # React components (ColorWheel, DetailPanel, Navbar, etc.)
  data/             # Paint data constants
  hooks/            # Custom React hooks
  lib/
    supabase/       # Supabase client (browser + server) and auth utilities
  stores/           # Zustand state stores
  types/            # TypeScript type definitions
  utils/            # Utility functions (color math, SVG helpers)
supabase/
  config.toml       # Local Supabase configuration
  migrations/       # Database migrations
```
