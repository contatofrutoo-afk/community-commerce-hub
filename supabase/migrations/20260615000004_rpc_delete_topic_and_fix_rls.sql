-- Create RPC function to delete topic (bypasses RLS issues)
CREATE OR REPLACE FUNCTION delete_topic(p_topic_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all messages in the topic first
  DELETE FROM public.topic_messages
  WHERE topic_id = p_topic_id;
  
  -- Then delete the topic
  DELETE FROM public.topics
  WHERE id = p_topic_id
  AND tenant_id = p_tenant_id;
  
  RETURN TRUE;
END;
$$;

-- Fix RLS policies to allow B2B admins to delete topics
DROP POLICY IF EXISTS "Allow topic deletion for admins" ON public.topics;

CREATE POLICY "Allow topic deletion for admins"
ON public.topics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = topics.tenant_id
    AND m.role IN ('owner', 'admin')
  )
);

-- Also fix topic_messages deletion policy
DROP POLICY IF EXISTS "Allow message deletion for topic members" ON public.topic_messages;

CREATE POLICY "Allow message deletion for topic members"
ON public.topic_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_messages.topic_id
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = t.tenant_id
      AND m.role IN ('owner', 'admin')
    )
  )
);