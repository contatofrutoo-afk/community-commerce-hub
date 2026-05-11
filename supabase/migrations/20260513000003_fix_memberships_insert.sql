-- Fix: Restringir memberships_insert_self para prevenir elevação de privilégios
-- Usuários só podem criar memberships com role='member' para si mesmos
-- Owners podem atribuir 'owner' ou 'admin' via memberships_owner_manage

DROP POLICY IF EXISTS "memberships_insert_self" ON public.memberships;
CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'member');