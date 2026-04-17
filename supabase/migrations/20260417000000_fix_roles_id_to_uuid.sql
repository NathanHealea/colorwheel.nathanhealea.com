-- ============================================================
-- Fix roles.id and user_roles.role_id to use UUID
--
-- The original migration was applied to remote with serial/int
-- types. Local uses uuid. This migration converts the remote
-- schema to match, preserving existing role assignments.
-- No-op if columns are already uuid.
-- ============================================================
DO $$
BEGIN
  -- Skip if roles.id is already uuid
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'roles'
      AND column_name = 'id'
  ) = 'uuid' THEN
    RAISE NOTICE 'roles.id is already uuid — skipping migration';
    RETURN;
  END IF;

  -- --------------------------------------------------------
  -- Save existing role assignments by role name (not by ID)
  -- --------------------------------------------------------
  CREATE TEMP TABLE _saved_role_assignments AS
    SELECT ur.user_id, r.name AS role_name, ur.assigned_at
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id;

  -- --------------------------------------------------------
  -- Drop dependent triggers
  -- --------------------------------------------------------
  DROP TRIGGER IF EXISTS on_user_role_delete_prevent_user ON public.user_roles;
  DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;

  -- --------------------------------------------------------
  -- Drop and recreate tables with uuid types
  -- --------------------------------------------------------
  DROP TABLE public.user_roles;
  DROP TABLE public.roles;

  CREATE TABLE public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL
  );

  INSERT INTO public.roles (name) VALUES ('user'), ('admin');

  CREATE TABLE public.user_roles (
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles (id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
  );

  -- --------------------------------------------------------
  -- Restore saved role assignments
  -- --------------------------------------------------------
  INSERT INTO public.user_roles (user_id, role_id, assigned_at)
  SELECT sa.user_id, r.id, sa.assigned_at
  FROM _saved_role_assignments sa
  JOIN public.roles r ON r.name = sa.role_name;

  DROP TABLE _saved_role_assignments;

  -- --------------------------------------------------------
  -- Re-enable RLS
  -- --------------------------------------------------------
  ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

  -- roles: SELECT only
  CREATE POLICY "Authenticated users can view roles"
    ON public.roles FOR SELECT TO authenticated USING (true);

  -- user_roles: SELECT for all, INSERT/UPDATE/DELETE for admins only
  CREATE POLICY "Authenticated users can view user roles"
    ON public.user_roles FOR SELECT TO authenticated USING (true);

  CREATE POLICY "Admins can assign roles"
    ON public.user_roles FOR INSERT TO authenticated
    WITH CHECK (
      'admin' = ANY(public.get_user_roles(auth.uid()))
      AND auth.uid() != user_id
    );

  CREATE POLICY "Admins can update role assignments"
    ON public.user_roles FOR UPDATE TO authenticated
    USING (
      'admin' = ANY(public.get_user_roles(auth.uid()))
      AND auth.uid() != user_id
    )
    WITH CHECK (
      'admin' = ANY(public.get_user_roles(auth.uid()))
      AND auth.uid() != user_id
    );

  CREATE POLICY "Admins can remove role assignments"
    ON public.user_roles FOR DELETE TO authenticated
    USING (
      'admin' = ANY(public.get_user_roles(auth.uid()))
      AND auth.uid() != user_id
    );

  -- --------------------------------------------------------
  -- Recreate triggers
  -- --------------------------------------------------------
  CREATE TRIGGER on_profile_created_assign_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_role();

  CREATE TRIGGER on_user_role_delete_prevent_user
    BEFORE DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_deletion();

  -- --------------------------------------------------------
  -- Backfill: ensure every profile has the user role
  -- --------------------------------------------------------
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT p.id, r.id
  FROM public.profiles p
  CROSS JOIN public.roles r
  WHERE r.name = 'user'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id AND ur.role_id = r.id
    );

  RAISE NOTICE 'Successfully converted roles.id and user_roles.role_id to uuid';
END;
$$;
