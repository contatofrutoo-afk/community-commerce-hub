-- ═══════════════════════════════════════════════════════════════
-- WEAZE — Conversas (Direct Messages) + RLS Faltantes
-- ═══════════════════════════════════════════════════════════════
--
-- Cobre os GAPS identificados na varredura:
--   1. Tabelas de conversas (direct messages)
--   2. RPC create_conversation
--   3. UPDATE/DELETE policies para appointment_cta e event_cta
--   4. Admin RLS para tabelas que faltavam
--   5. Realtime para conversas
--
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. CONVERSATIONS (Direct Messages)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'group')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations(tenant_id, updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ✉️ Conversas: SELECT — membro vê as que participa, B2B owner vê todas, admin vê todas
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = conversations.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ✉️ Conversas: INSERT — qualquer autenticado do tenant
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = conversations.tenant_id AND user_id = auth.uid()
    )
  );

-- ✉️ Conversas: UPDATE — criador, B2B owner ou platform admin
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = conversations.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ✉️ Conversas: DELETE — B2B owner ou platform admin
CREATE POLICY "conversations_delete" ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = conversations.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 2. CONVERSATION MEMBERS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- 👥 Membros: SELECT — participantes da conversa, B2B owner, admin
CREATE POLICY "conv_members_select" ON public.conversation_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id AND cm2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_members.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 👥 Membros: INSERT — owner da conversa ou B2B owner
CREATE POLICY "conv_members_insert" ON public.conversation_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id AND cm2.user_id = auth.uid() AND cm2.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_members.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 👥 Membros: DELETE — admin da conversa ou B2B owner
CREATE POLICY "conv_members_delete" ON public.conversation_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id AND cm2.user_id = auth.uid() AND cm2.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_members.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 👥 Membros: UPDATE role — só admin da conversa ou B2B owner
CREATE POLICY "conv_members_update" ON public.conversation_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id AND cm2.user_id = auth.uid() AND cm2.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_members.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. CONVERSATION MESSAGES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_msgs_conversation ON public.conversation_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conv_msgs_pinned ON public.conversation_messages(conversation_id) WHERE pinned = true;

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 💬 Mensagens: SELECT — participantes da conversa
CREATE POLICY "conv_msgs_select" ON public.conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversation_messages.conversation_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_messages.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 💬 Mensagens: INSERT — membro da conversa
CREATE POLICY "conv_msgs_insert" ON public.conversation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversation_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- 💬 Mensagens: UPDATE — autor, admin da conversa ou B2B owner
CREATE POLICY "conv_msgs_update" ON public.conversation_messages FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_messages.conversation_id AND cm2.user_id = auth.uid() AND cm2.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_messages.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 💬 Mensagens: DELETE — autor ou admin ou B2B owner
CREATE POLICY "conv_msgs_delete" ON public.conversation_messages FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_messages.conversation_id AND cm2.user_id = auth.uid() AND cm2.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_messages.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 4. CONVERSATION MESSAGE PINS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversation_message_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_pins_conversation ON public.conversation_message_pins(conversation_id);

ALTER TABLE public.conversation_message_pins ENABLE ROW LEVEL SECURITY;

-- 📌 Pins: SELECT — participantes da conversa
CREATE POLICY "conv_pins_select" ON public.conversation_message_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversation_message_pins.conversation_id AND user_id = auth.uid()
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 📌 Pins: INSERT — admin/moderador da conversa ou B2B owner
CREATE POLICY "conv_pins_insert" ON public.conversation_message_pins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversation_message_pins.conversation_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_message_pins.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- 📌 Pins: DELETE — mesmo que INSERT
CREATE POLICY "conv_pins_delete" ON public.conversation_message_pins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversation_message_pins.conversation_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.memberships m ON m.tenant_id = c.tenant_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
      WHERE c.id = conversation_message_pins.conversation_id
    )
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 5. RPC: create_conversation
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'public',
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
  v_result JSONB;
BEGIN
  -- Valida tenant e membro
  IF NOT EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = p_tenant_id AND user_id = p_created_by) THEN
    RAISE EXCEPTION 'User is not a member of this tenant';
  END IF;

  -- Cria conversa
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING id INTO v_conv_id;

  -- Adiciona criador como admin
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES (v_conv_id, p_created_by, 'admin');

  -- Retorna a conversa criada
  SELECT jsonb_build_object(
    'id', c.id,
    'tenant_id', c.tenant_id,
    'title', c.title,
    'description', c.description,
    'visibility', c.visibility,
    'archived', c.archived,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conv_id;

  RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 6. APPOINTMENT_CTA — UPDATE/DELETE policies para B2B
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "B2B owners can update appointment_cta" ON public.appointment_cta;
CREATE POLICY "B2B owners can update appointment_cta" ON public.appointment_cta FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = appointment_cta.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "B2B owners can delete appointment_cta" ON public.appointment_cta;
CREATE POLICY "B2B owners can delete appointment_cta" ON public.appointment_cta FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = appointment_cta.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 7. APPOINTMENT_CTA — Admin global pode ver
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "appointment_cta_admin_all" ON public.appointment_cta;
CREATE POLICY "appointment_cta_admin_all" ON public.appointment_cta FOR SELECT
  USING (
    true  -- já existe "Anyone can view"
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 8. EVENT_CTA — UPDATE/DELETE policies para B2B
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "B2B owners can update event_cta" ON public.event_cta;
CREATE POLICY "B2B owners can update event_cta" ON public.event_cta FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = event_cta.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "B2B owners can delete event_cta" ON public.event_cta;
CREATE POLICY "B2B owners can delete event_cta" ON public.event_cta FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = event_cta.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 9. EVENT_CTA — Admin global pode ver
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "event_cta_admin_all" ON public.event_cta;
CREATE POLICY "event_cta_admin_all" ON public.event_cta FOR SELECT
  USING (
    true  -- já existe "Anyone can view"
    OR public.is_platform_admin(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 10. REALTIME — conversas com suporte a realtime
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_members;
