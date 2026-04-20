-- ============================================================
-- Create user_paints: personal paint collection for each user
-- ============================================================

CREATE TABLE public.user_paints (
  user_id  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  paint_id uuid NOT NULL REFERENCES public.paints (id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  notes    text,
  PRIMARY KEY (user_id, paint_id)
);

-- ============================================================
-- Indexes
-- ============================================================

-- user_id: scope collection queries to the owner
CREATE INDEX idx_user_paints_user_id ON public.user_paints (user_id);

-- paint_id: reverse lookup (future "who owns this paint" community feature)
CREATE INDEX idx_user_paints_paint_id ON public.user_paints (paint_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.user_paints ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read their own collection
CREATE POLICY "Users can view their own collection"
  ON public.user_paints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: users can add to their own collection
CREATE POLICY "Users can add to their own collection"
  ON public.user_paints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update their own rows (e.g. notes)
CREATE POLICY "Users can update their own collection entries"
  ON public.user_paints
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can remove from their own collection
CREATE POLICY "Users can remove from their own collection"
  ON public.user_paints
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
