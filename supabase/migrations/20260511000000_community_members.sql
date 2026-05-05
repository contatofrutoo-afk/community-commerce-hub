-- Community Members with Approval System
-- Controls access to communities with pending/approved/rejected status

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own membership
CREATE POLICY "Users can view own membership" ON public.community_members
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Tenant owners/admins can manage all memberships
CREATE POLICY "Tenant owners can manage memberships" ON public.community_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = community_members.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );