-- ============================================================
-- AUTO CHECK-IN — Cole no SQL Editor do Supabase e rode tudo
-- ============================================================

-- 1. Tabela b2c_customers (clientes do estabelecimento)
CREATE TABLE IF NOT EXISTS public.b2c_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id uuid,
  name text NOT NULL,
  whatsapp text DEFAULT '',
  avatar_url text,
  first_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_form text,
  last_visit_table text,
  total_visits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2c_tenant ON public.b2c_customers(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2c_unique_auth_user
  ON public.b2c_customers(tenant_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- 2. Tabela checkins
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  table_id text,
  table_name text,
  visit_context text NOT NULL DEFAULT 'Sozinho',
  people_count integer NOT NULL DEFAULT 1,
  origin text NOT NULL DEFAULT 'link',
  start_time timestamptz NOT NULL DEFAULT now(),
  day_of_week text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_checkins_tenant_time ON public.checkins(tenant_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_customer ON public.checkins(customer_id);

-- 3. RLS
ALTER TABLE public.b2c_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colaboradores veem clientes da empresa" ON public.b2c_customers;
CREATE POLICY "Colaboradores veem clientes da empresa"
  ON public.b2c_customers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Colaboradores editam clientes da empresa" ON public.b2c_customers;
CREATE POLICY "Colaboradores editam clientes da empresa"
  ON public.b2c_customers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Checkin pode inserir clientes" ON public.b2c_customers;
CREATE POLICY "Checkin pode inserir clientes"
  ON public.b2c_customers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Checkin pode atualizar clientes" ON public.b2c_customers;
CREATE POLICY "Checkin pode atualizar clientes"
  ON public.b2c_customers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Colaboradores veem checkins da empresa" ON public.checkins;
CREATE POLICY "Colaboradores veem checkins da empresa"
  ON public.checkins FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Colaboradores editam checkins da empresa" ON public.checkins;
CREATE POLICY "Colaboradores editam checkins da empresa"
  ON public.checkins FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Checkin pode inserir checkins" ON public.checkins;
CREATE POLICY "Checkin pode inserir checkins"
  ON public.checkins FOR INSERT TO authenticated WITH CHECK (true);

-- 4. RPC: auto_checkin
CREATE OR REPLACE FUNCTION public.auto_checkin(
  p_tenant_id     uuid,
  p_auth_user_id  uuid,
  p_customer_name text,
  p_table_id      text DEFAULT '',
  p_table_name    text DEFAULT '',
  p_source        text DEFAULT 'link'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id  uuid;
  v_last_checkin timestamptz;
  v_cooldown     interval := interval '4 hours';
  v_now          timestamptz := now();
  v_dow          text;
  v_table_id     text;
  v_table_name   text;
BEGIN
  v_table_id   := nullif(p_table_id, '');
  v_table_name := nullif(p_table_name, '');

  -- Upsert do cliente vinculado ao auth_user
  INSERT INTO public.b2c_customers (tenant_id, auth_user_id, name, whatsapp, total_visits)
  VALUES (p_tenant_id, p_auth_user_id, p_customer_name, '', 1)
  ON CONFLICT (tenant_id, auth_user_id) DO UPDATE
    SET name          = EXCLUDED.name,
        last_visit_at = now(),
        total_visits  = b2c_customers.total_visits + 1
  RETURNING id INTO v_customer_id;

  -- Verifica último check-in
  SELECT start_time INTO v_last_checkin
  FROM public.checkins
  WHERE tenant_id = p_tenant_id
    AND customer_id = v_customer_id
  ORDER BY start_time DESC
  LIMIT 1;

  -- Cooldown 4h — se já tem check-in recente, não duplica
  IF v_last_checkin IS NOT NULL AND (v_now - v_last_checkin) < v_cooldown THEN
    RETURN false;
  END IF;

  -- Day of week
  v_dow := CASE EXTRACT(dow FROM v_now)
    WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terca'
    WHEN 3 THEN 'Quarta'  WHEN 4 THEN 'Quinta'  WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sabado'  ELSE ''
  END;

  -- Cria check-in
  INSERT INTO public.checkins (
    tenant_id, customer_id, customer_name,
    table_id, table_name,
    visit_context, people_count, origin,
    start_time, day_of_week
  ) VALUES (
    p_tenant_id, v_customer_id, p_customer_name,
    v_table_id, v_table_name,
    'Sozinho', 1, p_source,
    v_now, v_dow
  );

  RETURN true;
END;
$$;

-- 5. Permissões
GRANT EXECUTE ON FUNCTION public.auto_checkin(uuid, uuid, text, text, text, text) TO authenticated;
