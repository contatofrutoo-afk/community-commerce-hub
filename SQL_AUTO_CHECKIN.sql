-- ============================================================
-- AUTO CHECK-IN — Cole no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona coluna auth_user_id na tabela b2c_customers (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'b2c_customers' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.b2c_customers ADD COLUMN auth_user_id uuid;
  END IF;
END $$;

-- 2. Index unico: um cliente auth por empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_b2c_unique_auth_user'
  ) THEN
    CREATE UNIQUE INDEX idx_b2c_unique_auth_user
      ON public.b2c_customers(company_id, auth_user_id)
      WHERE auth_user_id IS NOT NULL;
  END IF;
END $$;

-- 3. RPC: auto_checkin
CREATE OR REPLACE FUNCTION public.auto_checkin(
  p_company_id    uuid,
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
  INSERT INTO public.b2c_customers (company_id, auth_user_id, name, whatsapp, total_visits)
  VALUES (p_company_id, p_auth_user_id, p_customer_name, '', 1)
  ON CONFLICT (company_id, auth_user_id) DO UPDATE
    SET name          = EXCLUDED.name,
        last_visit_at = now(),
        total_visits  = b2c_customers.total_visits + 1
  RETURNING id INTO v_customer_id;

  -- Verifica ultimo check-in
  SELECT start_time INTO v_last_checkin
  FROM public.checkins
  WHERE company_id = p_company_id
    AND customer_id = v_customer_id
  ORDER BY start_time DESC
  LIMIT 1;

  -- Cooldown 4h
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
    company_id, customer_id, customer_name,
    table_id, table_name,
    visit_context, people_count, origin,
    start_time, day_of_week
  ) VALUES (
    p_company_id, v_customer_id, p_customer_name,
    v_table_id, v_table_name,
    'Sozinho', 1, p_source,
    v_now, v_dow
  );

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_checkin(uuid, uuid, text, text, text, text) TO authenticated;
