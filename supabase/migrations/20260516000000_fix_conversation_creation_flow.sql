-- =============================================
-- CONVERSATION CREATION FLOW FIX
-- Atomic creation + membership + improved RLS
-- =============================================

-- Helper: get user's tenant membership role
CREATE OR REPLACE FUNCTION public.get_user_tenant_role(user_uuid UUID, tenant_uuid UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT m.role INTO user_role
  FROM public.memberships m
  WHERE m.user_id = user_uuid AND m.tenant_id = tenant_uuid AND m.status = 'approved'
  LIMIT 1;
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- =============================================
-- ATOMIC CONVERSATION CREATION FUNCTION
-- Creates conversation + adds creator as owner
-- in a single transaction
-- =============================================

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_created_by UUID
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_id UUID;
  v_user_role TEXT;
BEGIN
  -- Verify user is tenant admin/member
  v_user_role := public.get_user_tenant_role(p_created_by, p_tenant_id);

  IF v_user_role = 'none' THEN
    RAISE EXCEPTION 'User is not a member of this tenant';
  END IF;

  -- Any member can create conversations (RLS policy handles restrictions)
  -- Internal conversations only for admin/owner
  IF p_visibility = 'internal' AND v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only admins can create internal conversations';
  END IF;

  -- Validate visibility
  IF p_visibility NOT IN ('public', 'private', 'internal') THEN
    RAISE EXCEPTION 'Invalid visibility value';
  END IF;

  -- Insert conversation
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING id INTO v_conv_id;

  -- Automatically add creator as owner of the conversation
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (v_conv_id, p_created_by, 'owner', p_created_by);

  RETURN v_conv_id;
END;
$$;

-- =============================================
-- IMPROVED RLS POLICIES
-- =============================================

-- conversations: anyone who is tenant member can see public
-- members can see private
-- admins can see internal
-- owner of conversation always sees their conversation
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (
  archived = false
  AND (
    -- user is admin of the tenant
    public.is_tenant_admin_check(auth.uid(), tenant_id)
    -- OR conversation is public and user is a tenant member
    OR (visibility = 'public' AND public.is_tenant_member_check(auth.uid(), tenant_id))
    -- OR conversation is internal and user is tenant admin
    OR (visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), tenant_id))
    -- OR user is a member of this specific conversation
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  )
);

-- conversations_insert: any member of the tenant can create
-- (the function itself enforces role restrictions)
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT WITH CHECK (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
  OR public.is_tenant_member_check(auth.uid(), tenant_id)
);

-- conversation_members: anyone in tenant can see members of public convs
-- members see members of their conversations
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
CREATE POLICY conv_members_select ON public.conversation_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (
      -- user is tenant admin
      public.is_tenant_admin_check(auth.uid(), c.tenant_id)
      -- OR the conversation is public and user is tenant member
      OR (c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id))
      -- OR the conversation is internal and user is tenant admin
      OR (c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id))
      -- OR user is a member of this conversation
      OR EXISTS (
        SELECT 1 FROM public.conversation_members cm2
        WHERE cm2.conversation_id = c.id AND cm2.user_id = auth.uid()
      )
    )
  )
);

-- Allow members to add other members to conversations they're part of
DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;
CREATE POLICY conv_members_insert ON public.conversation_members FOR INSERT WITH CHECK (
  -- user is tenant admin
  public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  -- OR the conversation is private and user is owner/moderator of it
  OR (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid()
      WHERE c.id = conversation_id
      AND c.visibility = 'private'
      AND cm.role IN ('owner', 'moderator')
    )
  )
);

-- Ensure realtime is enabled for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
