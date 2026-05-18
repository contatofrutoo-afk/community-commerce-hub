-- Fix infinite recursion in group_members policies
-- This allows adding members without recursion error

DROP POLICY IF EXISTS "group_members_select_own" ON group_members;

CREATE POLICY "group_members_select_own" ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    INNER JOIN public.memberships m ON m.tenant_id = g.tenant_id
    WHERE g.id = group_members.group_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
  )
);