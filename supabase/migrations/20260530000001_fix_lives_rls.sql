-- Fix RLS for lives table - ensure proper tenant isolation
-- Run this in Supabase SQL Editor

-- Drop existing policies that may be causing issues
DROP POLICY IF EXISTS "lives_manage_by_owner" ON public.lives;
DROP POLICY IF EXISTS "lives_read_members" ON public.lives;
DROP POLICY IF EXISTS "lives_select_all" ON public.lives;
DROP POLICY IF EXISTS "lives_select_members" ON public.lives;
DROP POLICY IF EXISTS "lives_manage_member" ON public.lives;

-- Create proper RLS policies for lives table
-- Only members of the tenant can SELECT lives
CREATE POLICY "lives_select_member" ON public.lives FOR SELECT 
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Only owners can INSERT, UPDATE, DELETE lives
CREATE POLICY "lives_manage_owner" ON public.lives FOR ALL 
  USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- Verify policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lives';