-- Auditoria completa - verificar e corrigir políticas RLS da tabela memberships
-- Problemas identificados: políticas podem estar bloqueando queries do frontend

-- ==================== CORREÇÃO 1: Políticas de Memberships ====================

-- Dropar e recriar política de SELECT mais permissiva
DROP POLICY IF EXISTS "memberships_select_self_or_owner" ON public.memberships;
CREATE POLICY "memberships_select_all_for_user" ON public.memberships FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.memberships m2 
      WHERE m2.tenant_id = memberships.tenant_id 
      AND m2.user_id = auth.uid() 
      AND m2.role IN ('owner', 'admin')
    )
  );

-- Dropar e recriar política de INSERT
DROP POLICY IF EXISTS "memberships_insert_self" ON public.memberships;
CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('member', 'admin', 'owner')
  );

-- Dropar e recriar política de UPDATE/DELETE
DROP POLICY IF EXISTS "memberships_owner_manage" ON public.memberships;
CREATE POLICY "memberships_owner_manage" ON public.memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2 
      WHERE m2.tenant_id = memberships.tenant_id 
      AND m2.user_id = auth.uid() 
      AND m2.role IN ('owner', 'admin')
    )
  );

-- ==================== CORREÇÃO 2: Garantir que is_tenant_member funcione ====================
-- Recriar função is_tenant_member para garantir que funciona corretamente
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND is_active = true
  );
$$;

-- ==================== CORREÇÃO 3: Garantir que is_tenant_owner funcione ====================
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id 
    AND role = 'owner'
    AND is_active = true
  );
$$;

-- ==================== CORREÇÃO 4: Verificar se há dados órfãos ====================
-- Identificar memberships sem tenant válido
SELECT 
  m.id as membership_id,
  m.tenant_id,
  m.user_id,
  t.id as tenant_exists
FROM public.memberships m
LEFT JOIN public.tenants t ON m.tenant_id = t.id
WHERE t.id IS NULL;

-- ==================== CORREÇÃO 5: Forçar tenant_id da sessão ====================
-- Às vezes o problema é que a sessão não está passando o tenant_id corretamente
-- Isso ajuda a debugar
SELECT 
  m.user_id,
  m.tenant_id,
  t.name as tenant_name,
  m.role,
  m.is_active
FROM public.memberships m
LEFT JOIN public.tenants t ON m.tenant_id = t.id
ORDER BY m.created_at DESC
LIMIT 20;