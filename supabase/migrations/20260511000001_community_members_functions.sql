-- Functions for Community Members Management

-- Request to join a community (creates pending membership)
CREATE OR REPLACE FUNCTION public.request_community_join(
  p_tenant_id UUID
)
RETURNS TABLE(id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_membership_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if already has a request
  SELECT id INTO v_membership_id
  FROM public.community_members
  WHERE user_id = v_user_id AND tenant_id = p_tenant_id;
  
  IF v_membership_id IS NOT NULL THEN
    -- Update existing to pending if rejected
    UPDATE public.community_members
    SET status = 'pending', approved_at = NULL
    WHERE id = v_membership_id;
  ELSE
    -- Create new request
    INSERT INTO public.community_members (user_id, tenant_id, status)
    VALUES (v_user_id, p_tenant_id, 'pending')
    RETURNING id INTO v_membership_id;
  END IF;
  
  RETURN QUERY SELECT v_membership_id, 'pending'::TEXT;
END;
$$;

-- Approve community member
CREATE OR REPLACE FUNCTION public.approve_community_member(
  p_membership_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Get tenant and user
  SELECT cm.tenant_id, cm.user_id INTO v_tenant_id, v_user_id
  FROM public.community_members cm
  WHERE cm.id = p_membership_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;
  
  -- Check permission (owner or admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = v_tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE public.community_members
  SET status = 'approved',
      approved_at = NOW()
  WHERE id = p_membership_id;
  
  RETURN TRUE;
END;
$$;

-- Reject community member
CREATE OR REPLACE FUNCTION public.reject_community_member(
  p_membership_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT cm.tenant_id INTO v_tenant_id
  FROM public.community_members cm
  WHERE cm.id = p_membership_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;
  
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = v_tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE public.community_members
  SET status = 'rejected',
      approved_at = NULL
  WHERE id = p_membership_id;
  
  RETURN TRUE;
END;
$$;

-- Get user's membership status for a tenant
-- Owner/admin always returns 'approved'
CREATE OR REPLACE FUNCTION public.get_member_status(
  p_tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if user is owner or admin of the tenant
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) INTO v_is_owner;
  
  -- If owner/admin, always allow access
  IF v_is_owner THEN
    RETURN 'approved';
  END IF;
  
  -- Otherwise check community_members status
  SELECT cm.status INTO v_status
  FROM public.community_members cm
  WHERE cm.user_id = auth.uid() AND cm.tenant_id = p_tenant_id;
  
  RETURN COALESCE(v_status, 'none');
END;
$$;

-- Get pending members for a tenant (for B2B)
CREATE OR REPLACE FUNCTION public.get_pending_members(
  p_tenant_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  tenant_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  RETURN QUERY SELECT 
    cm.id,
    cm.user_id,
    cm.tenant_id,
    cm.status,
    cm.created_at,
    u.email::TEXT,
    p.name::TEXT
  FROM public.community_members cm
  JOIN auth.users u ON u.id = cm.user_id
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id
  WHERE cm.tenant_id = p_tenant_id AND cm.status = 'pending'
  ORDER BY cm.created_at DESC;
END;
$$;