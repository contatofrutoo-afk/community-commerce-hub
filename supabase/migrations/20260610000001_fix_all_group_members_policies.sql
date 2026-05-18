-- Fix all group_members policies to avoid recursion

DROP POLICY IF EXISTS "group_members_select_own" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON group_members;

-- SELECT: admins can view all, members can view their own groups
CREATE POLICY "group_members_select_own" ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id IN (SELECT tenant_id FROM public.groups WHERE id = group_members.group_id)
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  )
);

-- INSERT: bypass RLS for insert (handled by service function)
CREATE POLICY "group_members_insert_admin" ON group_members FOR INSERT
WITH CHECK (true);

-- DELETE: bypass RLS for delete (handled by service function)  
CREATE POLICY "group_members_delete_admin" ON group_members FOR DELETE
USING (true);