-- =============================================
-- FIX: Conversation Creation Function
-- Fixes: memberships table has NO status column
-- memberships columns: id, user_id, tenant_id, role, created_at
-- Run this in Supabase SQL Editor
-- =============================================

-- Fix the helper function first (remove status check)
DROP FUNCTION IF EXISTS public.get_user_tenant_role(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_user_tenant_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT m.role INTO v_role
  FROM public.memberships m
  WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id
  LIMIT 1;
  RETURN COALESCE(v_role, 'none');
END;
$$;

-- Drop and recreate create_conversation with correct references
DROP FUNCTION IF EXISTS public.create_conversation(UUID, TEXT, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
  v_user_role TEXT;
BEGIN
  -- Verify user is a member of the tenant (no status column)
  v_user_role := public.get_user_tenant_role(p_created_by, p_tenant_id);

  IF v_user_role = 'none' THEN
    RAISE EXCEPTION 'User is not a member of this tenant';
  END IF;

  -- Internal conversations only for admin/owner
  IF p_visibility = 'internal' AND v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only admins can create internal conversations';
  END IF;

  -- Validate visibility
  IF p_visibility NOT IN ('public', 'private', 'internal') THEN
    RAISE EXCEPTION 'Invalid visibility value: %', p_visibility;
  END IF;

  -- Insert the conversation
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING id INTO v_conv_id;

  -- Automatically add creator as owner
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (v_conv_id, p_created_by, 'owner', p_created_by);

  RETURN v_conv_id;
END;
$$;

-- Verify both functions
SELECT proname, proargnames FROM pg_proc
WHERE proname IN ('create_conversation', 'get_user_tenant_role')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
