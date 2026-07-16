-- ============================================================
-- SECURITY FIX: Acesso concorrente e isolamento de dados
-- Apenas tabelas existentes no banco
-- ============================================================

-- 1. ADMIN_SETTINGS: RLS admin-only (nao tinha RLS)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_select_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_update_admin" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_insert_admin" ON public.admin_settings;

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

-- 2. COMPANIES: RLS admin-only para escrita, leitura autenticada
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;

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

-- Leitura autenticada (pagamento, onboarding)
CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

-- 3. COMPANY_ADMIN: RLS admin-only
ALTER TABLE public.company_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin vê company_admin" ON public.company_admin;
DROP POLICY IF EXISTS "Admin gerencia company_admin" ON public.company_admin;
DROP POLICY IF EXISTS "company_admin_select_admin" ON public.company_admin;
DROP POLICY IF EXISTS "company_admin_manage_admin" ON public.company_admin;

CREATE POLICY "company_admin_select_admin" ON public.company_admin
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "company_admin_manage_admin" ON public.company_admin
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. COMPANY_PAYMENTS: RLS admin-only
ALTER TABLE public.company_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin vê company_payments" ON public.company_payments;
DROP POLICY IF EXISTS "Admin gerencia company_payments" ON public.company_payments;
DROP POLICY IF EXISTS "company_payments_select_admin" ON public.company_payments;
DROP POLICY IF EXISTS "company_payments_manage_admin" ON public.company_payments;

CREATE POLICY "company_payments_select_admin" ON public.company_payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "company_payments_manage_admin" ON public.company_payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. COMPANY_LICENSES: RLS admin-only
ALTER TABLE public.company_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin vê company_licenses" ON public.company_licenses;
DROP POLICY IF EXISTS "Admin gerencia company_licenses" ON public.company_licenses;
DROP POLICY IF EXISTS "company_licenses_select_admin" ON public.company_licenses;
DROP POLICY IF EXISTS "company_licenses_manage_admin" ON public.company_licenses;

CREATE POLICY "company_licenses_select_admin" ON public.company_licenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "company_licenses_manage_admin" ON public.company_licenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. B2C_CUSTOMERS: RLS (admin le, auth insere/atualiza)
ALTER TABLE public.b2c_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "b2c_customers_select_admin" ON public.b2c_customers;
DROP POLICY IF EXISTS "b2c_customers_insert_auth" ON public.b2c_customers;
DROP POLICY IF EXISTS "b2c_customers_update_auth" ON public.b2c_customers;

CREATE POLICY "b2c_customers_select_admin" ON public.b2c_customers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "b2c_customers_insert_auth" ON public.b2c_customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "b2c_customers_update_auth" ON public.b2c_customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. CHECKINS: RLS (admin le, auth insere)
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_admin" ON public.checkins;
DROP POLICY IF EXISTS "checkins_insert_auth" ON public.checkins;

CREATE POLICY "checkins_select_admin" ON public.checkins
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "checkins_insert_auth" ON public.checkins
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. mark_payment_informed atomico (chamado pelo usuario dono, sem company_id)
CREATE OR REPLACE FUNCTION public.mark_payment_informed(
  _method text DEFAULT 'PIX'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  SELECT ca.company_id INTO _company_id
  FROM public.company_admin ca
  JOIN public.user_roles ur ON ur.user_id = auth.uid()
  WHERE ca.company_id IS NOT NULL
  LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa nao encontrada para o usuario logado';
  END IF;

  UPDATE public.companies
  SET
    payment_status      = 'paid',
    payment_method      = _method,
    last_payment_date   = CURRENT_DATE,
    next_due_date       = (CURRENT_DATE + interval '1 month')::date,
    payment_informed_at = now()
  WHERE id = _company_id;

  INSERT INTO public.company_payments (company_id, amount, payment_date, payment_method, status, notes)
  SELECT _company_id, monthly_fee, CURRENT_DATE, _method, 'paid', 'Pagamento informado pelo cliente'
  FROM public.companies WHERE id = _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_payment_informed(text) TO authenticated;

-- 9. admin_set_company_status atomico (aceita _reason como no frontend)
CREATE OR REPLACE FUNCTION public.admin_set_company_status(
  _company_id uuid,
  _new_status text,
  _reason text DEFAULT NULL
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
    status            = _new_status,
    blocked_at        = CASE WHEN _new_status = 'bloqueado' THEN now() ELSE blocked_at END,
    blocked_reason    = COALESCE(_reason, blocked_reason),
    last_payment_date = CASE WHEN _new_status = 'ativo' THEN CURRENT_DATE ELSE last_payment_date END,
    next_due_date     = CASE WHEN _new_status = 'ativo' THEN (CURRENT_DATE + interval '1 month')::date ELSE next_due_date END,
    payment_status    = CASE WHEN _new_status = 'ativo' THEN 'paid' ELSE payment_status END
  WHERE id = _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_company_status(uuid, text, text) TO authenticated;

-- 10. delete_company cascade seguro
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

-- 11. GRANTS para service_role
GRANT ALL ON public.admin_settings TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.company_admin TO service_role;
GRANT ALL ON public.company_payments TO service_role;
GRANT ALL ON public.company_licenses TO service_role;
GRANT ALL ON public.b2c_customers TO service_role;
GRANT ALL ON public.checkins TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_checkin(uuid, uuid, text, text, text, text) TO authenticated;
