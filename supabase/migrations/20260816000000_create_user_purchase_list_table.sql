-- ============================================================
-- Purchase list
--
-- Tracks paints a user intends to buy. One row per
-- (user, paint) pair so a paint can only be on a given user's
-- list once. `notes` is reserved for future editing UI.
-- ============================================================

CREATE TABLE public.user_purchase_list (
  user_id    uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  paint_id   uuid        NOT NULL REFERENCES public.paints (id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, paint_id)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_user_purchase_list_user_id
  ON public.user_purchase_list (user_id);

CREATE INDEX idx_user_purchase_list_paint_id
  ON public.user_purchase_list (paint_id);

-- ============================================================
-- updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_user_purchase_list_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_purchase_list_updated
  BEFORE UPDATE ON public.user_purchase_list
  FOR EACH ROW EXECUTE FUNCTION public.set_user_purchase_list_updated_at();

-- ============================================================
-- Row level security — owner-only access
-- ============================================================

ALTER TABLE public.user_purchase_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own purchase list"
  ON public.user_purchase_list FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own purchase list"
  ON public.user_purchase_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase list"
  ON public.user_purchase_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own purchase list"
  ON public.user_purchase_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
