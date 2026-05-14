-- =====================================================
-- AUDITORIA COMPLETA - CORREÇÃO DEFINITIVA DE TODOS OS PROBLEMAS
-- Execute este arquivo inteiro de uma vez
-- =====================================================

-- =====================================================
-- PASSO 1: Garantir que a coluna is_active existe na tabela memberships
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memberships' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.memberships ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- PASSO 2: Recriar a função is_tenant_member (versão mais simples e confiável)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND is_active = true
  );
$$;

-- =====================================================
-- PASSO 3: Recriar a função is_tenant_owner
-- =====================================================
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

-- =====================================================
-- PASSO 4: Recriar políticas de memberships
-- =====================================================
DROP POLICY IF EXISTS "memberships_select_self_or_owner" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_all_for_user" ON public.memberships;

-- Política de SELECT - permitir que o usuário veja suas próprias memberships
CREATE POLICY "memberships_select_own" ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Política de INSERT - permitir que o usuário crie sua própria membership
DROP POLICY IF EXISTS "memberships_insert_self" ON public.memberships;
CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE/DELETE - owners e admins podem gerenciar
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

-- =====================================================
-- PASSO 5: Recriar políticas de tenants
-- =====================================================
DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;
CREATE POLICY "tenants_select_all" ON public.tenants FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), id)
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- =====================================================
-- PASSO 6: Recriar políticas de posts
-- =====================================================
DROP POLICY IF EXISTS "posts_select_member" ON public.posts;
CREATE POLICY "posts_select_any_member" ON public.posts FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- =====================================================
-- PASSO 7: Recriar políticas de profiles
-- =====================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- PASSO 8: Recriar políticas de community_requests
-- =====================================================
DROP POLICY IF EXISTS "B2B can view requests for their tenant" ON public.community_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.community_requests;

CREATE POLICY "community_requests_select_all" ON public.community_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = community_requests.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their own requests" ON public.community_requests;
CREATE POLICY "community_requests_insert_own" ON public.community_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "B2B can update requests for their tenant" ON public.community_requests;
CREATE POLICY "community_requests_update_owner" ON public.community_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = community_requests.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- PASSO 9: Verificar se as tables existen e têm as colunas necessárias
-- =====================================================
-- Verificar se os dados existem no banco
SELECT 'memberships' as table_name, count(*) as total FROM public.memberships
UNION ALL
SELECT 'tenants' as table_name, count(*) as total FROM public.tenants
UNION ALL
SELECT 'profiles' as table_name, count(*) as total FROM public.profiles
UNION ALL
SELECT 'posts' as table_name, count(*) as total FROM public.posts;

-- Verificar memberships do usuário atual (substitua pelo user_id correto para testar)
-- SELECT * FROM public.memberships WHERE user_id = 'SEU_USER_ID_AQUI';

-- =====================================================
-- PASSO 10: Garantir que não há policies conflitantes
-- =====================================================
-- Listar todas as políticas existentes em memberships
SELECT polname, polqual::text FROM pg_policies WHERE tablename = 'memberships';

-- Listar todas as políticas existentes em tenants
SELECT polname, polqual::text FROM pg_policies WHERE tablename = 'tenants';

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================