-- Admin RLS policies for user_purchase_list
-- These are additive — existing auth.uid() = user_id policies remain in place.

CREATE POLICY "Admins can read all user_purchase_list"
  ON public.user_purchase_list FOR SELECT TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can insert into any user_purchase_list"
  ON public.user_purchase_list FOR INSERT TO authenticated
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can update any user_purchase_list"
  ON public.user_purchase_list FOR UPDATE TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())))
  WITH CHECK ('admin' = ANY(public.get_user_roles(auth.uid())));

CREATE POLICY "Admins can delete any user_purchase_list"
  ON public.user_purchase_list FOR DELETE TO authenticated
  USING ('admin' = ANY(public.get_user_roles(auth.uid())));
