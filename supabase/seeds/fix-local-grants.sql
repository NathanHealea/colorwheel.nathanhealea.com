-- Local-only repair for a supabase/postgres image regression (17.6.1.140).
--
-- That image ships broken default privileges for objects created by the
-- `postgres` role (the role that runs migrations): tables lose
-- SELECT/INSERT/UPDATE/DELETE and functions lose EXECUTE for the API roles
-- (`anon`, `authenticated`, `service_role`), so PostgREST returns
-- "permission denied" for every table before RLS is even evaluated.
--
-- This file runs after all migrations on `supabase db reset` (registered in
-- config.toml [db.seed] sql_paths, local only — hosted Supabase manages these
-- grants itself and is unaffected). It restores the standard Supabase grants
-- and fixes the default privileges so migrations applied later via `db push`
-- are covered too. On a healthy image every statement is a no-op.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Re-apply deliberate lockdowns that the blanket function grant above undoes.
-- See 20260417000000_admin_profile_operations.sql: authenticated-only RPC.
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
