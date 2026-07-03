-- Gradient scale color groups
--
-- Brand-defined color groups (e.g. Army Painter Fanatic's "Black & Greys")
-- whose member paints form a dark-to-light tonal gradient. Groups are keyed
-- to a product line so any brand can define its own groups; members carry an
-- explicit 1-based position ordered dark -> light.

-- ============================================================
-- Tables
-- ============================================================
CREATE TABLE public.paint_gradient_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id int NOT NULL REFERENCES public.product_lines (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_line_id, slug),
  UNIQUE (product_line_id, position)
);

CREATE TABLE public.paint_gradient_group_members (
  group_id uuid NOT NULL REFERENCES public.paint_gradient_groups (id) ON DELETE CASCADE,
  paint_id uuid NOT NULL REFERENCES public.paints (id) ON DELETE CASCADE,
  position int NOT NULL,
  PRIMARY KEY (group_id, paint_id),
  UNIQUE (group_id, position),
  -- A paint belongs to at most one gradient group; relax if a future brand
  -- reuses a paint across groups.
  UNIQUE (paint_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_paint_gradient_groups_product_line_id
  ON public.paint_gradient_groups (product_line_id);

-- ============================================================
-- Row Level Security: paint_gradient_groups
-- ============================================================
ALTER TABLE public.paint_gradient_groups ENABLE ROW LEVEL SECURITY;

-- SELECT: Public read access (anon + authenticated)
CREATE POLICY "Anyone can view paint gradient groups"
  ON public.paint_gradient_groups
  FOR SELECT
  USING (true);

-- INSERT: Admin only
CREATE POLICY "Admins can insert paint gradient groups"
  ON public.paint_gradient_groups
  FOR INSERT
  TO authenticated
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

-- UPDATE: Admin only
CREATE POLICY "Admins can update paint gradient groups"
  ON public.paint_gradient_groups
  FOR UPDATE
  TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())))
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

-- DELETE: Admin only
CREATE POLICY "Admins can delete paint gradient groups"
  ON public.paint_gradient_groups
  FOR DELETE
  TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));

-- ============================================================
-- Row Level Security: paint_gradient_group_members
-- ============================================================
ALTER TABLE public.paint_gradient_group_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Public read access (anon + authenticated)
CREATE POLICY "Anyone can view paint gradient group members"
  ON public.paint_gradient_group_members
  FOR SELECT
  USING (true);

-- INSERT: Admin only
CREATE POLICY "Admins can insert paint gradient group members"
  ON public.paint_gradient_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

-- UPDATE: Admin only
CREATE POLICY "Admins can update paint gradient group members"
  ON public.paint_gradient_group_members
  FOR UPDATE
  TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())))
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

-- DELETE: Admin only
CREATE POLICY "Admins can delete paint gradient group members"
  ON public.paint_gradient_group_members
  FOR DELETE
  TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));
