-- Corrigir políticas RLS para permitir leitura básica
-- Problema: as políticas restritivas bloqueavam queries do frontend

-- Abrir memberships para leitura
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_select_all" ON public.memberships;
CREATE POLICY "memberships_open" ON public.memberships FOR SELECT USING (true);

-- Abrir tenants para leitura
DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_all" ON public.tenants;
CREATE POLICY "tenants_open" ON public.tenants FOR SELECT USING (true);

-- Abrir posts para leitura
DROP POLICY IF EXISTS "posts_select_member" ON public.posts;
DROP POLICY IF EXISTS "posts_select_any_member" ON public.posts;
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_open" ON public.posts FOR SELECT USING (true);

-- Abrir profiles para leitura
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_open" ON public.profiles FOR SELECT USING (true);

-- Abrir topics para leitura
DROP POLICY IF EXISTS "topics_select_all" ON public.topics;
DROP POLICY IF EXISTS "topics_select_member" ON public.topics;
CREATE POLICY "topics_open" ON public.topics FOR SELECT USING (true);

-- Abrir community_requests para leitura
DROP POLICY IF EXISTS "B2B can view requests for their tenant" ON public.community_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.community_requests;
DROP POLICY IF EXISTS "community_requests_select_all" ON public.community_requests;
CREATE POLICY "community_requests_open" ON public.community_requests FOR SELECT USING (true);