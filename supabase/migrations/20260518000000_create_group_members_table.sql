-- Tabela group_members para participantes dos grupos
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário só vê membros dos grupos que participa
CREATE POLICY "group_members_select_own" ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin do grupo pode adicionar
CREATE POLICY "group_members_insert_admin" ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND m.is_active = true
        )
    )
  );

-- DELETE: owner/admin do grupo pode remover
CREATE POLICY "group_members_delete_admin" ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND m.is_active = true
        )
    )
  );