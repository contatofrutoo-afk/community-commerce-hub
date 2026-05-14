-- Tabela groups para grupos privados e internos
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private', 'internal')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para tenant_id
CREATE INDEX IF NOT EXISTS idx_groups_tenant ON public.groups(tenant_id);

-- Index para created_by
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário só pode ver grupos do tenant atual
CREATE POLICY "groups_select_tenant" ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = groups.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.is_active = true
    )
  );

-- INSERT: apenas owner/admin pode criar
CREATE POLICY "groups_insert_owner" ON public.groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = groups.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
        AND memberships.is_active = true
    )
  );

-- DELETE: apenas owner pode excluir
CREATE POLICY "groups_delete_owner" ON public.groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = groups.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'owner'
        AND memberships.is_active = true
    )
  );