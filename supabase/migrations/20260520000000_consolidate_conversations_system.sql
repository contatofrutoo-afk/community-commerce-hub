-- =============================================
-- CONVERSATIONS SYSTEM - CONSOLIDATED
-- Estabilização estrutural - única fonte de verdade
-- =============================================

-- =============================================
-- 1. LIMPEZA: Remove todas as funções antigas
-- =============================================

DROP FUNCTION IF EXISTS public.update_conversation_activity();
DROP FUNCTION IF EXISTS public.update_conversation_on_member_change();
DROP FUNCTION IF EXISTS public.create_default_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_conversation_member_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_conversation_owner_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_moderate_conversation_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_pin_message_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_conversation_member_count(UUID);
DROP FUNCTION IF EXISTS public.can_add_pin_check(UUID);
DROP FUNCTION IF EXISTS public.get_user_tenant_role(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_all_conversations_for_tenant(UUID);
DROP FUNCTION IF EXISTS public.is_tenant_member_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_tenant_admin_check(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_conversation(UUID, TEXT, TEXT, TEXT, UUID);

-- =============================================
-- 2. FUNÇÕES DE HELPER (únicas, definitivas)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_tenant_member_check(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin_check(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = p_user_id AND m.tenant_id = p_tenant_id AND m.role IN ('owner', 'admin')
  );
END;
$$;

-- =============================================
-- 3. FUNÇÃO DE CRIAÇÃO DE CONVERSA (única)
-- =============================================

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_created_by UUID
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations;
  v_user_role TEXT;
BEGIN
  -- Verificar se usuário é membro
  IF NOT public.is_tenant_member_check(p_created_by, p_tenant_id) THEN
    RAISE EXCEPTION 'Usuário não é membro desta comunidade';
  END IF;

  -- Buscar role do usuário
  SELECT m.role INTO v_user_role
  FROM public.memberships m
  WHERE m.user_id = p_created_by AND m.tenant_id = p_tenant_id
  LIMIT 1;

  -- Apenas admins/owners podem criar conversas internas
  IF p_visibility = 'internal' AND v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem criar conversas internas';
  END IF;

  -- Validar visibilidade
  IF p_visibility NOT IN ('public', 'private', 'internal') THEN
    RAISE EXCEPTION 'Valor de visibilidade inválido';
  END IF;

  -- Inserir conversa
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING * INTO v_conv;

  -- Adicionar criador como owner da conversa
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (v_conv.id, p_created_by, 'owner', p_created_by);

  RETURN v_conv;
END;
$$;

-- =============================================
-- 4. RLS POLICIES (únicas, consistentes)
-- =============================================

-- conversas - SELECT
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (
  archived = false
  AND (
    public.is_tenant_member_check(auth.uid(), tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  )
);

-- conversas - INSERT (apenas membros)
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT WITH CHECK (
  public.is_tenant_member_check(auth.uid(), tenant_id)
);

-- conversas - UPDATE (apenas membros da conversa ou admins do tenant)
DROP POLICY IF EXISTS conversations_update ON public.conversations;
CREATE POLICY conversations_update ON public.conversations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = id AND cm.user_id = auth.uid() AND cm.role = 'owner'
  )
  OR public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- conversas - DELETE (apenas admins do tenant)
DROP POLICY IF EXISTS conversations_delete ON public.conversations;
CREATE POLICY conversations_delete ON public.conversations FOR DELETE USING (
  public.is_tenant_admin_check(auth.uid(), tenant_id)
);

-- conversation_members - SELECT
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
CREATE POLICY conv_members_select ON public.conversation_members FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm2
    WHERE cm2.conversation_id = conversation_id AND cm2.user_id = auth.uid()
  )
);

-- conversation_members - INSERT (apenas owner/moderator da conversa)
DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;
CREATE POLICY conv_members_insert ON public.conversation_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_members - UPDATE (apenas admins do tenant)
DROP POLICY IF EXISTS conv_members_update ON public.conversation_members;
CREATE POLICY conv_members_update ON public.conversation_members FOR UPDATE USING (
  public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_members - DELETE (apenas admins do tenant)
DROP POLICY IF EXISTS conv_members_delete ON public.conversation_members;
CREATE POLICY conv_members_delete ON public.conversation_members FOR DELETE USING (
  public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_messages - SELECT
DROP POLICY IF EXISTS conv_messages_select ON public.conversation_messages;
CREATE POLICY conv_messages_select ON public.conversation_messages FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
  )
);

-- conversation_messages - INSERT (apenas membros da conversa ou do tenant)
DROP POLICY IF EXISTS conv_messages_insert ON public.conversation_messages;
CREATE POLICY conv_messages_insert ON public.conversation_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_tenant_member_check(auth.uid(),
      (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
  )
);

-- conversation_messages - UPDATE (autor da mensagem ou moderadores)
DROP POLICY IF EXISTS conv_messages_update ON public.conversation_messages;
CREATE POLICY conv_messages_update ON public.conversation_messages FOR UPDATE USING (
  auth.uid() = user_id
  OR auth.uid() = pinned_by
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    JOIN public.conversations c ON c.id = cm.conversation_id
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_messages - DELETE (autor ou moderadores)
DROP POLICY IF EXISTS conv_messages_delete ON public.conversation_messages;
CREATE POLICY conv_messages_delete ON public.conversation_messages FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    JOIN public.conversations c ON c.id = cm.conversation_id
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_message_pins - SELECT
DROP POLICY IF EXISTS conv_pins_select ON public.conversation_message_pins;
CREATE POLICY conv_pins_select ON public.conversation_message_pins FOR SELECT USING (
  public.is_tenant_member_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
  )
);

-- conversation_message_pins - INSERT (moderadores)
DROP POLICY IF EXISTS conv_pins_insert ON public.conversation_message_pins;
CREATE POLICY conv_pins_insert ON public.conversation_message_pins FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- conversation_message_pins - DELETE (moderadores)
DROP POLICY IF EXISTS conv_pins_delete ON public.conversation_message_pins;
CREATE POLICY conv_pins_delete ON public.conversation_message_pins FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'moderator')
  )
  OR public.is_tenant_admin_check(auth.uid(),
    (SELECT tenant_id FROM public.conversations WHERE id = conversation_id)
  )
);

-- =============================================
-- 5. REALTIME (ativa apenas tabelas necessárias)
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_message_pins;

-- =============================================
-- 6. FUNÇÕES DE SUPORTE (apenas para queries específicas)
-- =============================================

-- Buscar role do usuário na conversa
CREATE OR REPLACE FUNCTION public.get_my_conversation_role(p_conv_id UUID, p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT cm.role INTO v_role
  FROM public.conversation_members cm
  WHERE cm.conversation_id = p_conv_id AND cm.user_id = p_user_id
  LIMIT 1;
  RETURN COALESCE(v_role, 'none');
END;
$$;

-- Verificar se pode fixar mensagem
CREATE OR REPLACE FUNCTION public.can_pin_message(p_conv_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_max_pins INTEGER;
  v_current INTEGER;
BEGIN
  -- Verificar se usuário é moderador/owner da conversa
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conv_id AND cm.user_id = p_user_id AND cm.role IN ('owner', 'moderator')
  ) THEN
    RETURN false;
  END IF;

  -- Verificar se ainda pode fixar (limite de 3)
  SELECT COALESCE(c.max_pins, 3) INTO v_max_pins FROM public.conversations c WHERE c.id = p_conv_id;
  SELECT COUNT(*) INTO v_current FROM public.conversation_messages WHERE conversation_id = p_conv_id AND pinned = true;

  RETURN v_current < v_max_pins;
END;
$$;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Funções criadas:' AS info;
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('is_tenant_member_check', 'is_tenant_admin_check', 'create_conversation', 'get_my_conversation_role', 'can_pin_message');

SELECT 'Policies criadas:' AS info;
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_members', 'conversation_messages', 'conversation_message_pins');