-- Fix get_member_status to check owner/admin first
-- This ensures brand owners/admins can always access their community

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