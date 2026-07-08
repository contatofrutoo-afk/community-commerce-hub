-- ============================================================
-- WEAZE — COMPLETE DATABASE SCHEMA
-- ============================================================
-- Este arquivo contém TODAS as tabelas, triggers, RLS e seeds
-- necessários para o funcionamento completo da plataforma.
-- Copie e cole este SQL inteiro no SQL Editor do Lovable Cloud.
-- ============================================================

-- 0. ENUMS (com IF NOT EXISTS via DO block)
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'operacao', 'marketing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.financial_status AS ENUM ('paid', 'pending', 'overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'transfer', 'cash'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.company_status AS ENUM ('active', 'implantation', 'blocked', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.deployment_status AS ENUM ('waiting', 'configuring', 'training', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.contract_type AS ENUM ('monthly', 'yearly', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ticket_status AS ENUM ('open', 'resolved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('Recebido', 'Concluído', 'Cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.reaction_type AS ENUM ('love', 'want', 'dislike'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.post_kind AS ENUM ('b2b', 'b2c'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.table_status AS ENUM ('livre', 'ocupada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.visit_context AS ENUM ('Sozinho', 'Casal', 'Amigos', 'Família'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. COMPANIES (Empresas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  email_principal text NOT NULL,
  phone text,
  logo_url text,
  description text,
  whatsapp text,
  address text,
  city text,
  share_link text,
  responsible text,
  responsible_email text,
  plan text NOT NULL DEFAULT 'Plano WEAZE',
  contract_type contract_type NOT NULL DEFAULT 'monthly',
  contract_value numeric NOT NULL DEFAULT 0,
  contract_notes text,
  due_date integer NOT NULL DEFAULT 1,
  last_payment date,
  payment_method payment_method NOT NULL DEFAULT 'pix',
  status company_status NOT NULL DEFAULT 'active',
  internal_notes text,
  deployment_status deployment_status NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS share_link text;

-- ============================================================
-- 2. PROFILES (Colaboradores B2B, 1:1 com auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- ============================================================
-- 3. USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- ============================================================
-- 4. B2C CUSTOMERS (Clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.b2c_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL,
  avatar_url text,
  first_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_form text,
  last_visit_table text,
  total_visits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_b2c_company ON public.b2c_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_b2c_whatsapp ON public.b2c_customers(company_id, whatsapp);

ALTER TABLE public.b2c_customers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.b2c_customers ADD COLUMN IF NOT EXISTS total_visits integer NOT NULL DEFAULT 0;

-- ============================================================
-- 5. CHECKINS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  table_id text,
  table_name text,
  visit_context text NOT NULL,
  people_count integer NOT NULL DEFAULT 1,
  origin text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  day_of_week text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checkins_company_time ON public.checkins(company_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_customer ON public.checkins(customer_id);

-- ============================================================
-- 6. INTEGRATION CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  url text,
  token text,
  enabled boolean NOT NULL DEFAULT true,
  subscribed_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_integrations_company ON public.integration_configs(company_id);

-- ============================================================
-- 7. FINANCIAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  value numeric NOT NULL,
  payment_method text NOT NULL,
  status financial_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_company_date ON public.financial_records(company_id, date DESC);

-- ============================================================
-- 8. SUPPORT TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  last_contact date NOT NULL DEFAULT CURRENT_DATE,
  subject text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_company_contact ON public.support_tickets(company_id, last_contact DESC);

-- ============================================================
-- 9. ADMIN SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_plan_value numeric NOT NULL DEFAULT 197,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. FEED POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  kind post_kind NOT NULL DEFAULT 'b2b',
  image text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric,
  category text NOT NULL DEFAULT 'Outro',
  b2c_category text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  video_src text,
  aspect_ratio text NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1', '9:16')),
  upsell_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  love_count integer NOT NULL DEFAULT 0,
  want_count integer NOT NULL DEFAULT 0,
  dislike_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_company ON public.feed_posts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_kind ON public.feed_posts(company_id, kind);

-- ============================================================
-- 11. POST REACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  reaction reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.post_reactions(post_id);

-- ============================================================
-- 12. POST COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text NOT NULL DEFAULT '',
  text text NOT NULL,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.post_comments(post_id, created_at ASC);

-- ============================================================
-- 13. ORDERS (Pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_whatsapp text NOT NULL DEFAULT '',
  status order_status NOT NULL DEFAULT 'Recebido',
  total numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_company ON public.orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);

-- ============================================================
-- 14. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  upsell_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- 15. RESTAURANT TABLES (Mesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number integer NOT NULL,
  name text NOT NULL,
  status table_status NOT NULL DEFAULT 'livre',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
CREATE INDEX IF NOT EXISTS idx_tables_company ON public.restaurant_tables(company_id);

-- ============================================================
-- 16. TABLE SESSIONS (Ocupação de mesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.b2c_customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_avatar text NOT NULL DEFAULT '',
  people_count integer NOT NULL DEFAULT 1,
  companions jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sessions_table ON public.table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.table_sessions(end_time) WHERE end_time IS NULL;

-- ============================================================
-- 17. CUSTOMER INTERACTIONS (Engajamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.b2c_customers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  liked_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  wanted_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordered_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  comment_count integer NOT NULL DEFAULT 0,
  publication_count integer NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  visits_30d integer NOT NULL DEFAULT 0,
  value_generated numeric NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Novo' CHECK (tier IN ('Novo', 'Ativo', 'Frequente', 'VIP', 'Inativo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_interactions_company ON public.customer_interactions(company_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- current_user_company
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- find_b2c_customer (anon)
CREATE OR REPLACE FUNCTION public.find_b2c_customer(
  p_company_id uuid,
  p_whatsapp text
)
RETURNS TABLE (id uuid, name text, last_visit_at timestamptz, last_visit_form text, last_visit_table text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, last_visit_at, last_visit_form, last_visit_table
  FROM b2c_customers
  WHERE company_id = p_company_id AND whatsapp = p_whatsapp
  LIMIT 1;
$$;

-- update_b2c_customer_visit (anon)
CREATE OR REPLACE FUNCTION public.update_b2c_customer_visit(
  p_id uuid,
  p_name text,
  p_visit_form text,
  p_table text
)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE b2c_customers
  SET name = p_name,
      last_visit_at = now(),
      last_visit_form = p_visit_form,
      last_visit_table = p_table,
      total_visits = total_visits + 1
  WHERE id = p_id;
$$;

-- create_b2c_customer (anon — self check-in)
CREATE OR REPLACE FUNCTION public.create_b2c_customer(
  p_company_id uuid,
  p_name text,
  p_whatsapp text,
  p_visit_form text,
  p_table text
)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO b2c_customers (company_id, name, whatsapp, last_visit_form, last_visit_table, total_visits)
  VALUES (p_company_id, p_name, p_whatsapp, p_visit_form, p_table, 1)
  RETURNING id;
$$;

-- handle_new_b2b_user (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_b2b_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid;
  v_role public.app_role;
BEGIN
  v_company := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF v_company IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.profiles (id, company_id, name, email)
  VALUES (
    NEW.id,
    v_company,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email
  );

  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    INSERT INTO public.user_roles (user_id, company_id, role) VALUES (NEW.id, v_company, v_role);
  END IF;

  RETURN NEW;
END; $$;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS integration_configs_updated ON public.integration_configs;
CREATE TRIGGER integration_configs_updated
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS admin_settings_updated ON public.admin_settings;
CREATE TRIGGER admin_settings_updated
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS customer_interactions_updated ON public.customer_interactions;
CREATE TRIGGER customer_interactions_updated
  BEFORE UPDATE ON public.customer_interactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created_b2b ON auth.users;
CREATE TRIGGER on_auth_user_created_b2b
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_b2b_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem sua empresa" ON public.companies;
CREATE POLICY "Colaboradores veem sua empresa"
  ON public.companies FOR SELECT TO authenticated
  USING (id = public.current_user_company());
DROP POLICY IF EXISTS "Anon vê empresa por slug" ON public.companies;
CREATE POLICY "Anon vê empresa por slug"
  ON public.companies FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Admin atualiza sua empresa" ON public.companies;
CREATE POLICY "Admin atualiza sua empresa"
  ON public.companies FOR UPDATE TO authenticated
  USING (id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin vê todas empresas" ON public.companies;
CREATE POLICY "Admin vê todas empresas"
  ON public.companies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin gerencia todas empresas" ON public.companies;
CREATE POLICY "Admin gerencia todas empresas"
  ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Usuário cria sua empresa" ON public.companies;
CREATE POLICY "Usuário cria sua empresa"
  ON public.companies FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- Nota: aplicada manualmente no Supabase em 03/07/2026. Mantida aqui para referência.

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver o próprio perfil e colegas da empresa" ON public.profiles;
CREATE POLICY "Ver o próprio perfil e colegas da empresa"
  ON public.profiles FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Atualizar próprio perfil" ON public.profiles;
CREATE POLICY "Atualizar próprio perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Admin gerencia perfis da empresa" ON public.profiles;
CREATE POLICY "Admin gerencia perfis da empresa"
  ON public.profiles FOR ALL TO authenticated
  USING (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Trigger cria perfil" ON public.profiles;
CREATE POLICY "Trigger cria perfil"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário vê próprios papéis" ON public.user_roles;
CREATE POLICY "Usuário vê próprios papéis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = public.current_user_company());
DROP POLICY IF EXISTS "Trigger cria papel" ON public.user_roles;
CREATE POLICY "Trigger cria papel"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- B2C Customers
ALTER TABLE public.b2c_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem clientes da empresa" ON public.b2c_customers;
CREATE POLICY "Colaboradores veem clientes da empresa"
  ON public.b2c_customers FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores editam clientes da empresa" ON public.b2c_customers;
CREATE POLICY "Colaboradores editam clientes da empresa"
  ON public.b2c_customers FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Anon cria/atualiza para self check-in" ON public.b2c_customers;
CREATE POLICY "Anon cria/atualiza para self check-in"
  ON public.b2c_customers FOR INSERT TO anon WITH CHECK (true);
REVOKE SELECT, UPDATE ON public.b2c_customers FROM anon;

-- Checkins
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem checkins da empresa" ON public.checkins;
CREATE POLICY "Colaboradores veem checkins da empresa"
  ON public.checkins FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores editam checkins da empresa" ON public.checkins;
CREATE POLICY "Colaboradores editam checkins da empresa"
  ON public.checkins FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Anon cria checkin" ON public.checkins;
CREATE POLICY "Anon cria checkin"
  ON public.checkins FOR INSERT TO anon WITH CHECK (true);
REVOKE SELECT ON public.checkins FROM anon;

-- Integration Configs
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin gerencia integrações da empresa" ON public.integration_configs;
CREATE POLICY "Admin gerencia integrações da empresa"
  ON public.integration_configs FOR ALL TO authenticated
  USING (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Operação vê integrações da empresa" ON public.integration_configs;
CREATE POLICY "Operação vê integrações da empresa"
  ON public.integration_configs FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());

-- Financial Records
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem registros financeiros da empresa" ON public.financial_records;
CREATE POLICY "Colaboradores veem registros financeiros da empresa"
  ON public.financial_records FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Admin gerencia registros financeiros da própria empresa" ON public.financial_records;
CREATE POLICY "Admin gerencia registros financeiros da própria empresa"
  ON public.financial_records FOR ALL TO authenticated
  USING (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin vê todos registros financeiros" ON public.financial_records;
CREATE POLICY "Admin vê todos registros financeiros"
  ON public.financial_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin gerencia todos registros financeiros" ON public.financial_records;
CREATE POLICY "Admin gerencia todos registros financeiros"
  ON public.financial_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem tickets de suporte da empresa" ON public.support_tickets;
CREATE POLICY "Colaboradores veem tickets de suporte da empresa"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Admin gerencia tickets de suporte da própria empresa" ON public.support_tickets;
CREATE POLICY "Admin gerencia tickets de suporte da própria empresa"
  ON public.support_tickets FOR ALL TO authenticated
  USING (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.current_user_company() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin vê todos tickets de suporte" ON public.support_tickets;
CREATE POLICY "Admin vê todos tickets de suporte"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin gerencia todos tickets de suporte" ON public.support_tickets;
CREATE POLICY "Admin gerencia todos tickets de suporte"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin Settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin vê configurações" ON public.admin_settings;
CREATE POLICY "Admin vê configurações"
  ON public.admin_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin atualiza configurações" ON public.admin_settings;
CREATE POLICY "Admin atualiza configurações"
  ON public.admin_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Feed Posts
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem posts da empresa" ON public.feed_posts;
CREATE POLICY "Colaboradores veem posts da empresa"
  ON public.feed_posts FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores criam/gerenciam posts da empresa" ON public.feed_posts;
CREATE POLICY "Colaboradores criam/gerenciam posts da empresa"
  ON public.feed_posts FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Anon vê posts" ON public.feed_posts;
CREATE POLICY "Anon vê posts"
  ON public.feed_posts FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anon cria post (B2C)" ON public.feed_posts;
CREATE POLICY "Anon cria post (B2C)"
  ON public.feed_posts FOR INSERT TO anon WITH CHECK (true);

-- Post Reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon reage a posts" ON public.post_reactions;
CREATE POLICY "Anon reage a posts"
  ON public.post_reactions FOR ALL TO anon
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Colaboradores veem reações" ON public.post_reactions;
CREATE POLICY "Colaboradores veem reações"
  ON public.post_reactions FOR SELECT TO authenticated
  USING (true);

-- Post Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon comenta em posts" ON public.post_comments;
CREATE POLICY "Anon comenta em posts"
  ON public.post_comments FOR ALL TO anon
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Colaboradores veem comentários" ON public.post_comments;
CREATE POLICY "Colaboradores veem comentários"
  ON public.post_comments FOR SELECT TO authenticated
  USING (true);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem pedidos da empresa" ON public.orders;
CREATE POLICY "Colaboradores veem pedidos da empresa"
  ON public.orders FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores gerenciam pedidos da empresa" ON public.orders;
CREATE POLICY "Colaboradores gerenciam pedidos da empresa"
  ON public.orders FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Anon cria pedido" ON public.orders;
CREATE POLICY "Anon cria pedido"
  ON public.orders FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Anon vê próprios pedidos" ON public.orders;
CREATE POLICY "Anon vê próprios pedidos"
  ON public.orders FOR SELECT TO anon USING (true);

-- Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem itens" ON public.order_items;
CREATE POLICY "Colaboradores veem itens"
  ON public.order_items FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "Anon gerencia itens" ON public.order_items;
CREATE POLICY "Anon gerencia itens"
  ON public.order_items FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Restaurant Tables
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem mesas da empresa" ON public.restaurant_tables;
CREATE POLICY "Colaboradores veem mesas da empresa"
  ON public.restaurant_tables FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores gerenciam mesas da empresa" ON public.restaurant_tables;
CREATE POLICY "Colaboradores gerenciam mesas da empresa"
  ON public.restaurant_tables FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Anon vê mesas" ON public.restaurant_tables;
CREATE POLICY "Anon vê mesas"
  ON public.restaurant_tables FOR SELECT TO anon USING (true);

-- Table Sessions
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores gerenciam sessões da empresa" ON public.table_sessions;
CREATE POLICY "Colaboradores gerenciam sessões da empresa"
  ON public.table_sessions FOR ALL TO authenticated
  USING (true);
DROP POLICY IF EXISTS "Anon gerencia sessões" ON public.table_sessions;
CREATE POLICY "Anon gerencia sessões"
  ON public.table_sessions FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Customer Interactions
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colaboradores veem interações da empresa" ON public.customer_interactions;
CREATE POLICY "Colaboradores veem interações da empresa"
  ON public.customer_interactions FOR SELECT TO authenticated
  USING (company_id = public.current_user_company());
DROP POLICY IF EXISTS "Colaboradores gerenciam interações" ON public.customer_interactions;
CREATE POLICY "Colaboradores gerenciam interações"
  ON public.customer_interactions FOR ALL TO authenticated
  USING (company_id = public.current_user_company())
  WITH CHECK (company_id = public.current_user_company());

-- ============================================================
-- GRANTS
-- ============================================================

GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.b2c_customers TO service_role;
GRANT ALL ON public.checkins TO service_role;
GRANT ALL ON public.integration_configs TO service_role;
GRANT ALL ON public.financial_records TO service_role;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.admin_settings TO service_role;
GRANT ALL ON public.feed_posts TO service_role;
GRANT ALL ON public.post_reactions TO service_role;
GRANT ALL ON public.post_comments TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.restaurant_tables TO service_role;
GRANT ALL ON public.table_sessions TO service_role;
GRANT ALL ON public.customer_interactions TO service_role;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin Settings
INSERT INTO public.admin_settings (id, default_plan_value)
VALUES ('00000000-0000-0000-0000-000000000000', 197)
ON CONFLICT (id) DO NOTHING;

-- Empresa Bistrô Lumière
INSERT INTO public.companies (id, slug, name, email_principal, phone, logo_url, description, whatsapp, address, city, share_link, responsible, responsible_email, plan, contract_type, contract_value, due_date, payment_method, status, internal_notes, deployment_status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'lumiere',
  'Bistrô Lumière',
  'contato@bistrolumiere.com',
  '(11) 4000-1000',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  'Cozinha contemporânea com alma de bairro. Aberto desde 2021.',
  '5511999990000',
  'Rua das Palmeiras, 245 — Vila Madalena',
  'São Paulo',
  'https://weaze.app/lumiere',
  'Carlos Silva',
  'carlos@bistrolumiere.com',
  'Plano WEAZE',
  'monthly',
  197,
  5,
  'pix',
  'active',
  'Empresa principal do ecossistema WEAZE',
  'completed'
) ON CONFLICT (id) DO NOTHING;

-- Demais empresas (demonstração)
INSERT INTO public.companies (id, slug, name, email_principal, phone, logo_url, responsible, responsible_email, whatsapp, city, created_at, plan, contract_type, contract_value, due_date, last_payment, payment_method, status, internal_notes, deployment_status)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'tech-solutions', 'Tech Solutions Ltda', 'contato@techsolutions.com', '(11) 91234-5678', 'https://ui-avatars.com/api/?name=Tech+Solutions&background=8800AA&color=fff&size=128', 'Carlos Almeida', 'carlos@techsolutions.com', '5511912345678', 'São Paulo', '2025-01-15', 'Plano WEAZE', 'monthly', 197, 5, '2026-06-05', 'pix', 'active', 'Cliente referenciado pelo parceiro ABC. Sem reclamações.', 'completed'),
  ('22222222-0000-0000-0000-000000000002', 'comercial-br', 'Comercial BR Ltda', 'contato@comercialbr.com', '(21) 98765-4321', 'https://ui-avatars.com/api/?name=Comercial+BR&background=8800AA&color=fff&size=128', 'Fernanda Costa', 'fernanda@comercialbr.com', '5521987654321', 'Rio de Janeiro', '2025-03-20', 'Plano WEAZE', 'yearly', 1800, 10, '2026-06-10', 'credit_card', 'active', 'Contrato anual fechado via proposta comercial.', 'completed'),
  ('22222222-0000-0000-0000-000000000003', 'studio-design', 'Studio Design Criativo', 'contato@studiodesign.com', '(31) 99876-5432', 'https://ui-avatars.com/api/?name=Studio+Design&background=8800AA&color=fff&size=128', 'Ana Paula Mendes', 'ana@studiodesign.com', '5531998765432', 'Belo Horizonte', '2025-02-10', 'Plano WEAZE', 'monthly', 197, 15, '2026-05-15', 'pix', 'active', 'Solicitou personalização no dashboard.', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Alguns clientes B2C de exemplo
INSERT INTO public.b2c_customers (company_id, name, whatsapp, first_visit_at, last_visit_at, last_visit_form, last_visit_table)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ana Silva',      '11999990001', now() - interval '30 days', now() - interval '2 days',  'Casal',    'Mesa 03'),
  ('11111111-1111-1111-1111-111111111111', 'Bruno Costa',    '11999990002', now() - interval '60 days', now() - interval '5 days',  'Amigos',   'Mesa 07'),
  ('11111111-1111-1111-1111-111111111111', 'Carla Menezes',  '11999990003', now() - interval '10 days', now() - interval '1 day',   'Família',  'Mesa 12'),
  ('11111111-1111-1111-1111-111111111111', 'Diego Ramos',    '11999990004', now() - interval '90 days', now() - interval '10 days', 'Sozinho',  'Mesa 02')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS public.list_b2c_customers(uuid, integer);
CREATE OR REPLACE FUNCTION public.list_b2c_customers(p_company_id uuid, p_limit integer DEFAULT 500)
RETURNS SETOF public.b2c_customers
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.b2c_customers
  WHERE company_id = p_company_id
  ORDER BY last_visit_at DESC
  LIMIT p_limit;
END;
$$;

DROP FUNCTION IF EXISTS public.list_checkins(uuid, timestamptz);
CREATE OR REPLACE FUNCTION public.list_checkins(p_company_id uuid, p_cutoff timestamptz)
RETURNS SETOF public.checkins
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.checkins
  WHERE company_id = p_company_id
    AND start_time >= p_cutoff
  ORDER BY start_time DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.create_checkin(uuid, uuid, uuid, text, text, text, text, integer, text, timestamptz, text);
CREATE OR REPLACE FUNCTION public.create_checkin(
  p_id uuid,
  p_company_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_table_id text DEFAULT '',
  p_table_name text DEFAULT '',
  p_visit_context text DEFAULT 'Sozinho',
  p_people_count integer DEFAULT 1,
  p_origin text DEFAULT 'store_qr',
  p_start_time timestamptz DEFAULT now(),
  p_day_of_week text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.checkins (id, company_id, customer_id, customer_name, table_id, table_name, visit_context, people_count, origin, start_time, day_of_week)
  VALUES (p_id, p_company_id, p_customer_id, p_customer_name, nullif(p_table_id, ''), nullif(p_table_name, ''), p_visit_context, p_people_count, p_origin, p_start_time, p_day_of_week);
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_b2c_customers TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_checkins TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_b2c_customer TO anon, authenticated;
