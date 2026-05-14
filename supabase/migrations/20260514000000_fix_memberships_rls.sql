-- Fix: Garantir que usuários possam ver suas próprias memberships
-- O problema: política atual pode estar bloqueando usuários normais

-- 1. Verificar políticas atuais de memberships
-- DROP POLICY IF EXISTS "memberships_select_self_or_owner" ON public.memberships;

-- 2. Recriar política mais permissiva para SELECT
-- Usuários devem ver suas próprias memberships + memberships de tenants que são owner/admin
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

-- 3. Garantir que INSERT funcione para membros
DROP POLICY IF EXISTS "memberships_insert_self" ON public.memberships;
CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('member', 'admin', 'owner')
  );

-- 4. Garantir que UPDATE funcione para owners
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

-- 5. Verificar se tenant_id ainda existe na tabela tenants (sem constraint quebrado)
-- Se houver orphan memberships, isso pode causar problemas no JOIN