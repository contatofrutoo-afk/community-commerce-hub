-- Corrigir política RLS para user_roles
-- Remover políticas existentes
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

-- Política restrita: apenas próprio usuário ou admins podem ver roles
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

-- Admin pode gerenciar todos os roles
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
);