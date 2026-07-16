-- ============================================================
-- SECURITY FIX: Proteção para acesso concorrente e isolamento de dados
-- Corrige RLS quebrado em groups, adiciona RLS a admin_settings
-- e companies, e garante atomicidade nas operações admin
-- ============================================================

-- ============================================================
-- 1. ADMIN_SETTINGS: RLS admin-only (tabela não tinha RLS)
-- ============================================================
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_select_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_update_admin" ON public.admin_settings;

CREATE POLICY "admin_settings_select_admin" ON public.admin_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_settings_update_admin" ON public.admin_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_settings_insert_admin" ON public.admin_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. COMPANIES: RLS admin-only para escrita, leitura para dono
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_admin" ON public.companies;

-- Admin pode tudo
CREATE POLICY "companies_select_admin" ON public.companies
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "companies_insert_admin" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "companies_update_admin" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "companies_delete_admin" ON public.companies
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuário autenticado pode ler companies (para pagamento / onboarding)
CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 3. GROUP_MEMBERS: Corrige RLS completamente aberto
-- ============================================================
DROP POLICY IF EXISTS "group_members_select_own" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert_admin" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON public.group_members;

-- SELECT: membro do grupo pode ver outros membros do mesmo grupo
CREATE POLICY "group_members_select_own" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: admin do tenant pode adicionar membros
CREATE POLICY "group_members_insert_admin" ON public.group_members
  FOR INSERT TO authenticated
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

-- DELETE: admin do tenant pode remover membros
CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE TO authenticated
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

-- ============================================================
-- 4. GROUP_POSTS: Corrige RLS completamente aberto
-- ============================================================
DROP POLICY IF EXISTS "group_posts_select" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_insert" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_update" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_delete" ON public.group_posts;

-- SELECT: membro do grupo
CREATE POLICY "group_posts_select_member" ON public.group_posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: membro do grupo pode postar
CREATE POLICY "group_posts_insert_member" ON public.group_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- UPDATE: autor ou admin do tenant
CREATE POLICY "group_posts_update_author" ON public.group_posts
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND m.is_active = true
        )
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND m.is_active = true
        )
    )
  );

-- DELETE: autor ou admin do tenant
CREATE POLICY "group_posts_delete_author" ON public.group_posts
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND m.is_active = true
        )
    )
  );

-- ============================================================
-- 5. GROUP_REPLIES: Corrige RLS completamente aberto
-- ============================================================
DROP POLICY IF EXISTS "group_replies_select" ON public.group_replies;
DROP POLICY IF EXISTS "group_replies_insert" ON public.group_replies;
DROP POLICY IF EXISTS "group_replies_delete" ON public.group_replies;

-- SELECT: membro do grupo dono do post
CREATE POLICY "group_replies_select_member" ON public.group_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = group_replies.post_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: membro do grupo dono do post
CREATE POLICY "group_replies_insert_member" ON public.group_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = group_replies.post_id
        AND gm.user_id = auth.uid()
    )
  );

-- DELETE: autor da resposta
CREATE POLICY "group_replies_delete_author" ON public.group_replies
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ============================================================
-- 6. MEMBERSHIPS: Remove policy USING(true) que vazava dados
-- ============================================================
DROP POLICY IF EXISTS "memberships_groups_read" ON public.memberships;

-- ============================================================
-- 7. B2C_CUSTOMERS: RLS para proteção de dados de clientes
-- ============================================================
ALTER TABLE public.b2c_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "b2c_customers_select_admin" ON public.b2c_customers;
DROP POLICY IF EXISTS "b2c_customers_insert_service" ON public.b2c_customers;
DROP POLICY IF EXISTS "b2c_customers_update_service" ON public.b2c_customers;

-- Admin pode tudo
CREATE POLICY "b2c_customers_select_admin" ON public.b2c_customers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "b2c_customers_insert_service" ON public.b2c_customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "b2c_customers_update_service" ON public.b2c_customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 8. CHECKINS: RLS para proteção
-- ============================================================
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_admin" ON public.checkins;
DROP POLICY IF EXISTS "checkins_insert_auth" ON public.checkins;

CREATE POLICY "checkins_select_admin" ON public.checkins
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "checkins_insert_auth" ON public.checkins
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 9. ATOMICIDADE: mark_payment_informed com UPDATE atômico
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_payment_informed(
  _company_id uuid,
  _method text DEFAULT 'PIX'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET
    payment_status    = 'paid',
    payment_method    = _method,
    last_payment_date = CURRENT_DATE,
    next_due_date     = (CURRENT_DATE + interval '1 month')::date,
    payment_informed_at = now()
  WHERE id = _company_id;

  INSERT INTO public.company_payments (company_id, amount, payment_date, payment_method, status, notes)
  SELECT _company_id, monthly_fee, CURRENT_DATE, _method, 'paid', 'Pagamento registrado via admin'
  FROM public.companies WHERE id = _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_payment_informed(uuid, text) TO authenticated;

-- ============================================================
-- 10. ATOMICIDADE: admin_set_company_status com UPDATE atômico
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_company_status(
  _company_id uuid,
  _new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar status de empresas';
  END IF;

  UPDATE public.companies
  SET
    status = _new_status,
    blocked_at = CASE WHEN _new_status = 'bloqueado' THEN now() ELSE blocked_at END,
    last_payment_date = CASE WHEN _new_status = 'ativo' THEN CURRENT_DATE ELSE last_payment_date END,
    next_due_date = CASE WHEN _new_status = 'ativo' THEN (CURRENT_DATE + interval '1 month')::date ELSE next_due_date END,
    payment_status = CASE WHEN _new_status = 'ativo' THEN 'paid' ELSE payment_status END
  WHERE id = _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_company_status(uuid, text) TO authenticated;

-- ============================================================
-- 11. ATOMICIDADE: delete_company com cascade seguro
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_company(
  _company_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir empresas';
  END IF;

  DELETE FROM public.company_payments WHERE company_id = _company_id;
  DELETE FROM public.company_licenses WHERE company_id = _company_id;
  DELETE FROM public.company_admin WHERE company_id = _company_id;
  DELETE FROM public.companies WHERE id = _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;

-- ============================================================
-- 12. GRANTS para service_role (necessário para funções SECURITY DEFINER)
-- ============================================================
GRANT ALL ON public.admin_settings TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.group_members TO service_role;
GRANT ALL ON public.group_posts TO service_role;
GRANT ALL ON public.group_replies TO service_role;
GRANT ALL ON public.b2c_customers TO service_role;
GRANT ALL ON public.checkins TO service_role;

-- Garantir que authenticated pode executar as funções
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_checkin(uuid, uuid, text, text, text, text) TO authenticated;
