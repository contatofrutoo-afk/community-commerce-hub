-- ═══════════════════════════════════════════════════════════════
-- WEAZE — Admin Platform: Painel Global, Bloqueios, Métricas
-- ═══════════════════════════════════════════════════════════════
--
-- Completa toda a infraestrutura administrativa:
--   1. Platform admin (role='admin') vê dados de todos os tenants
--   2. Bloqueio/desbloqueio de B2C por B2B (community_members)
--   3. Histórico de bloqueios (member_block_history)
--   4. Missing columns: name, email, avatar em community_members
--   5. RLS policies para admin global ver tudo
--
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. ENSURE 'admin' EXISTS IN tenant_role
-- ═══════════════════════════════════════════════════════════════
ALTER TYPE public.tenant_role ADD VALUE IF NOT EXISTS 'admin';

-- ═══════════════════════════════════════════════════════════════
-- 2. FUNÇÃO: is_platform_admin — checa se user é admin global
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

-- ═══════════════════════════════════════════════════════════════
-- 3. COMMUNITY MEMBERS — add colunas para bloqueio + display
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Adiciona status 'blocked' ao CHECK se ainda não existir
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_status_check;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'blocked'));

ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS block_reason TEXT;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id);

-- ═══════════════════════════════════════════════════════════════
-- 4. HISTÓRICO DE BLOQUEIOS (giro completo: bloquear e desbloquear)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.member_block_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('blocked', 'unblocked')),
  reason TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_block_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_member_block_history_member ON public.member_block_history(member_id);
CREATE INDEX IF NOT EXISTS idx_member_block_history_created ON public.member_block_history(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 5. FUNÇÕES: block/unblock member (B2B owner/admin, platform admin)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.block_community_member(
  p_member_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  SELECT tenant_id, user_id INTO v_tenant_id, v_user_id
  FROM public.community_members WHERE id = p_member_id;
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;

  -- Autorização: dono/admin do tenant OU platform admin
  IF NOT (
    EXISTS (SELECT 1 FROM public.memberships
      WHERE tenant_id = v_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin'))
    OR public.is_platform_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized to block members';
  END IF;

  -- Não pode bloquear owner ou admin do tenant
  IF EXISTS (SELECT 1 FROM public.memberships
    WHERE tenant_id = v_tenant_id AND user_id = v_user_id AND role IN ('owner','admin')) THEN
    RAISE EXCEPTION 'Cannot block tenant owner or admin';
  END IF;

  UPDATE public.community_members
  SET status = 'blocked',
      block_reason = p_reason,
      blocked_at = now(),
      blocked_by = auth.uid()
  WHERE id = p_member_id;

  INSERT INTO public.member_block_history (member_id, action, reason, performed_by)
  VALUES (p_member_id, 'blocked', p_reason, auth.uid());

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_community_member(
  p_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.community_members WHERE id = p_member_id;
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.memberships
      WHERE tenant_id = v_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin'))
    OR public.is_platform_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized to unblock members';
  END IF;

  UPDATE public.community_members
  SET status = 'approved',
      block_reason = NULL,
      blocked_at = NULL,
      blocked_by = NULL
  WHERE id = p_member_id AND status = 'blocked';

  INSERT INTO public.member_block_history (member_id, action, reason, performed_by)
  VALUES (p_member_id, 'unblocked', NULL, auth.uid());

  RETURN TRUE;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 6. FUNÇÕES: listar membros (com bloqueio) para B2B
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_community_members(p_tenant_id UUID)
RETURNS TABLE(
  id UUID, user_id UUID, tenant_id UUID, status TEXT, name TEXT, email TEXT, avatar TEXT,
  created_at TIMESTAMPTZ, approved_at TIMESTAMPTZ,
  block_reason TEXT, blocked_at TIMESTAMPTZ, blocked_by UUID
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')
  ) AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT cm.id, cm.user_id, cm.tenant_id, cm.status,
         COALESCE(cm.name, p.name, u.email::text)::TEXT,
         COALESCE(cm.email, u.email::text)::TEXT,
         COALESCE(cm.avatar, p.avatar_url)::TEXT,
         cm.created_at, cm.approved_at,
         cm.block_reason, cm.blocked_at, cm.blocked_by
  FROM public.community_members cm
  JOIN auth.users u ON u.id = cm.user_id
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id
  WHERE cm.tenant_id = p_tenant_id
  ORDER BY cm.status, cm.created_at DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 7. RLS: COMMUNITY MEMBERS — policies revisadas com block + admin
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own membership" ON public.community_members;
DROP POLICY IF EXISTS "Tenant owners can manage memberships" ON public.community_members;
DROP POLICY IF EXISTS "community_members_select_self_or_owner" ON public.community_members;
DROP POLICY IF EXISTS "community_members_admin_all" ON public.community_members;

CREATE POLICY "community_members_select_self_or_owner" ON public.community_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = community_members.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "community_members_insert_self" ON public.community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "community_members_manage_owner" ON public.community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = community_members.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "community_members_delete_owner" ON public.community_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = community_members.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 8. RLS: MEMBER BLOCK HISTORY
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "member_block_history_select_owner" ON public.member_block_history;
DROP POLICY IF EXISTS "member_block_history_insert_owner" ON public.member_block_history;

CREATE POLICY "member_block_history_select_owner" ON public.member_block_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.memberships m ON m.tenant_id = cm.tenant_id AND m.user_id = auth.uid()
      WHERE cm.id = member_block_history.member_id
        AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "member_block_history_insert_owner" ON public.member_block_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.memberships m ON m.tenant_id = cm.tenant_id AND m.user_id = auth.uid()
      WHERE cm.id = member_block_history.member_id
        AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 9. RLS: GLOBAL PLATFORM ADMIN — ver todos os tenants e dados
-- ═══════════════════════════════════════════════════════════════

-- Tenants: admin vê todos
DROP POLICY IF EXISTS "tenants_admin_all" ON public.tenants;
CREATE POLICY "tenants_admin_all" ON public.tenants FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), id)
    OR public.is_platform_admin(auth.uid())
  );

-- Interactions: admin vê todas
DROP POLICY IF EXISTS "interactions_admin_all" ON public.interactions;
CREATE POLICY "interactions_admin_all" ON public.interactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Posts: admin vê todos
DROP POLICY IF EXISTS "posts_admin_all" ON public.posts;
CREATE POLICY "posts_admin_all" ON public.posts FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Memberships: admin vê todas
DROP POLICY IF EXISTS "memberships_admin_all" ON public.memberships;
CREATE POLICY "memberships_admin_all" ON public.memberships FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Profiles: admin vê todos (para montar ranking, listas etc.)
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_platform_admin(auth.uid())
  );

-- Notifications: admin vê/gerencia todas
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications;
CREATE POLICY "notifications_admin_all" ON public.notifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Invite link events: admin vê todos
DROP POLICY IF EXISTS "invite_link_events_admin_all" ON public.invite_link_events;
CREATE POLICY "invite_link_events_admin_all" ON public.invite_link_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND tenant_id = invite_link_events.tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Lives: admin vê todas
DROP POLICY IF EXISTS "lives_admin_all" ON public.lives;
CREATE POLICY "lives_admin_all" ON public.lives FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Services: admin vê todos
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Events: admin vê todos
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all" ON public.events FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Topics: admin vê todos
DROP POLICY IF EXISTS "topics_admin_all" ON public.topics;
CREATE POLICY "topics_admin_all" ON public.topics FOR SELECT
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Appointments: admin vê todos
DROP POLICY IF EXISTS "appointments_admin_all" ON public.appointments;
CREATE POLICY "appointments_admin_all" ON public.appointments FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Quotes: admin vê todos
DROP POLICY IF EXISTS "quotes_admin_all" ON public.quotes;
CREATE POLICY "quotes_admin_all" ON public.quotes FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- Event registrations: admin vê todos
DROP POLICY IF EXISTS "event_registrations_admin_all" ON public.event_registrations;
CREATE POLICY "event_registrations_admin_all" ON public.event_registrations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_tenant_owner(auth.uid(), e.tenant_id))
    OR public.is_platform_admin(auth.uid())
  );

-- Tenant plans: admin vê todos
DROP POLICY IF EXISTS "tenant_plans_admin_all" ON public.tenant_plans;
CREATE POLICY "tenant_plans_admin_all" ON public.tenant_plans FOR SELECT
  USING (
    public.is_tenant_owner(auth.uid(), tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 10. RLS: INVITE LINK EVENTS — admin pode inserir (via sistema)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "invite_link_events_tenant_access" ON public.invite_link_events;
CREATE POLICY "invite_link_events_tenant_access" ON public.invite_link_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND tenant_id = invite_link_events.tenant_id)
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 11. BACKFILL: copiar name/email/avatar para community_members
-- ═══════════════════════════════════════════════════════════════
UPDATE public.community_members cm
SET
  name = COALESCE(cm.name, p.name, u.email::text),
  email = COALESCE(cm.email, u.email::text),
  avatar = COALESCE(cm.avatar, p.avatar_url)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE cm.user_id = u.id
  AND (cm.name IS NULL OR cm.email IS NULL);
