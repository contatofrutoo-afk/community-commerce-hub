-- Fix RLS policies to allow B2B admins to delete topics

-- Drop existing policies if they exist and cause issues
DROP POLICY IF EXISTS "Allow B2B admins to delete own topics" ON public.topics;
DROP POLICY IF EXISTS "Allow admins to delete topics" ON public.topics;

-- Create policy for topic deletion
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

-- Also create policy for topic_messages deletion
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

-- Allow authenticated users to read topics in their tenant
DROP POLICY IF EXISTS "Allow authenticated read topics" ON public.topics;

CREATE POLICY "Allow authenticated read topics"
ON public.topics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = topics.tenant_id
  )
);

-- Allow authenticated users to read topic_messages in their tenant
DROP POLICY IF EXISTS "Allow authenticated read topic_messages" ON public.topic_messages;

CREATE POLICY "Allow authenticated read topic_messages"
ON public.topic_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_messages.topic_id
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = t.tenant_id
    )
  )
);