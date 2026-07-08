-- ============================================================
-- WEAZE ADMIN — Allow admins to update/delete any company
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow admins to UPDATE any company
DROP POLICY IF EXISTS "Admin gerencia companies" ON public.companies;
CREATE POLICY "Admin gerencia companies" ON public.companies
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );

-- 2. Allow admins to DELETE any company
DROP POLICY IF EXISTS "Admin deleta companies" ON public.companies;
CREATE POLICY "Admin deleta companies" ON public.companies
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  );
