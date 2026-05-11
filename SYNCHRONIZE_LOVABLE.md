-- RESUMO COMPLETO DAS CORREÇÕES DE SEGURANÇA
-- Todas as correções estão no GitHub - apenas precisam ser aplicadas

-- ==================== VERIFICAÇÃO DO CÓDIGO ====================

-- profiles_select_own (já corrigido em 20260424173042_f3b2e114...sql):
--CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (
--  auth.uid() = user_id
--  OR EXISTS (
--    SELECT 1 FROM public.memberships m
--    WHERE m.user_id = auth.uid()
--      AND m.role IN ('owner', 'admin')
--      AND EXISTS (
--        SELECT 1 FROM public.community_members cm
--        WHERE cm.user_id = profiles.user_id
--          AND cm.tenant_id = m.tenant_id
--          AND cm.status = 'approved'
--      )
--  )
--);

-- tenants_select_members (já corrigido):
--CREATE POLICY "tenants_select_members" ON public.tenants FOR SELECT USING (
--  public.is_tenant_member(auth.uid(), id)
--  OR public.has_role(auth.uid(), 'admin')
--);

-- memberships_insert_self (já corrigido):
--CREATE POLICY "memberships_insert_self" ON public.memberships FOR INSERT
--  WITH CHECK (auth.uid() = user_id AND role = 'member');

-- tenant_rewards (já corrigido):
--CREATE POLICY "tr_select" ON tenant_rewards FOR SELECT USING (
--  public.is_tenant_member(auth.uid(), tenant_id)
--);
--CREATE POLICY "tr_manage" ON tenant_rewards FOR ALL USING (
--  public.is_tenant_owner(auth.uid(), tenant_id)
--);

-- ==================== CÓDIGO QUE DEVE SER APLICADO ====================

-- ERRO 1: "All user emails and personal data are publicly readable"
-- SOLUÇÃO: profile_visibility = restrictivo (código já existe)

-- ERRO 2: "Tenant phone numbers and MRR are publicly readable"
-- SOLUÇÃO: tenants_select_members (código já existe)

-- ERRO 3: "Any authenticated user can post topics or replies in any tenant's forum"
-- SOLUÇÃO: topics/topic_messages INSERT verificado por membership (código já existe)

-- ERRO 4: "Tenant rewards table has no RLS protection"
-- SOLUÇÃO: tr_select e tr_manage (código já existe)

-- ERRO 5: "Any authenticated user can assign themselves any role including owner"
-- SOLUÇÃO: memberships_insert_self COM role = 'member' (código já existe)

-- ERRO 6: "Any authenticated user can subscribe to any Realtime channel"
-- SOLUÇÃO: ALTER PUBLICATION supabase_realtime DROP TABLE public.community_messages;
-- (código já existe em 20260513000004_fix_realtime_rls.sql)

-- ERRO 7: "RLS Disabled in Public"
-- SOLUÇÃO: Todas as tabelas já têm ALTER TABLE ... ENABLE ROW LEVEL SECURITY

-- ==================== PROMPT PARA LOVABLE ====================

/*
Execute este PROCEDIMENTO COMPLETO para sincronizar o projeto:

PASSO 1: Forçar Pull do GitHub
- Abra painel Git
- Clique em "Discard all changes" (se houver)
- Clique em "Pull" para puxar master

PASSO 2: Limpar Cache e Rebuild
- Vá em Settings → Build & Deploy
- Clique "Clear cache and rebuild" OU "Redeploy"
- Aguarde 2-5 minutos

PASSO 3: Reset de Schema do Supabase
- Vá em Database → SQL Editor
- Execute a query de verificação:
*/
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT EXISTS (
  SELECT 1 FROM pg_policy WHERE polrelid = tablename::regclass
);

/*
PASSO 4: Se ainda mostrar erros, force reset de migrations
- Database → migrations → Reset (ou delete e re-deploy)

PASSO 5: Publicar depois do rebuild
*/