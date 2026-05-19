-- Fix group_system_messages RLS security
-- Permits INSERT only for group creator OR group members

-- Step 1: Remove old open policy
DROP POLICY IF EXISTS "group_system_messages_insert_system" 
ON public.group_system_messages;

-- Step 2: Create secure policy (creator OR member can insert)
CREATE POLICY "group_system_messages_insert_member" 
ON public.group_system_messages
FOR INSERT
WITH CHECK (
  EXISTS(
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_system_messages.group_id
      AND gm.user_id = auth.uid()
  )
  OR
  EXISTS(
    SELECT 1
    FROM public.groups g
    WHERE g.id = group_system_messages.group_id
      AND g.created_by = auth.uid()
  )
);

-- Step 3: Add index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_group_system_messages_created_at
ON public.group_system_messages(group_id, created_at DESC);