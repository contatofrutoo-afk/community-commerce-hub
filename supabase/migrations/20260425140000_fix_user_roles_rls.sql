-- Corrigir política RLS para user_roles
-- Remover políticas existentes
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

-- Nova política mais permissiva: qualquer usuário logado pode ler roles
CREATE POLICY "user_roles_select_authenticated" ON public.user_roles FOR SELECT USING (
  auth.uid() IS NOT NULL
);