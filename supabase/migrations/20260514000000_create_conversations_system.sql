-- =============================================
-- CONVERSATIONS SYSTEM - TABLES ONLY
-- Create tables first, policies after
-- =============================================

-- =============================================
-- 1. HELPER FUNCTIONS (needed by policies)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_tenant_member_check(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = user_uuid AND m.tenant_id = tenant_uuid AND m.status = 'approved'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin_check(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = user_uuid AND m.tenant_id = tenant_uuid AND m.status = 'approved' AND m.role IN ('owner', 'admin')
  );
END;
$$;

-- =============================================
-- 2. CONVERSATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'internal')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  max_pins INTEGER DEFAULT 3,
  CONSTRAINT unique_conversation_title_per_tenant UNIQUE (tenant_id, title)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX idx_conversations_visibility ON public.conversations(visibility);
CREATE INDEX idx_conversations_archived ON public.conversations(archived);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- =============================================
-- 3. CONVERSATION MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_member_per_conversation UNIQUE (conversation_id, user_id)
);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversation_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX idx_conversation_members_user ON public.conversation_members(user_id);

-- =============================================
-- 4. CONVERSATION MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  reply_to UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted BOOLEAN DEFAULT false
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_user ON public.conversation_messages(user_id);
CREATE INDEX idx_conversation_messages_pinned ON public.conversation_messages(conversation_id) WHERE pinned = true;
CREATE INDEX idx_conversation_messages_created ON public.conversation_messages(created_at);
CREATE INDEX idx_conversation_messages_reply ON public.conversation_messages(reply_to);

-- =============================================
-- 5. SECURITY FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.is_conversation_member_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;
  IF conv_tenant IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conv_id AND cm.user_id = user_uuid)
  OR public.is_tenant_admin_check(user_uuid, conv_tenant)
  OR (SELECT visibility FROM public.conversations WHERE id = conv_id) = 'public' AND public.is_tenant_member_check(user_uuid, conv_tenant);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_owner_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conv_id AND cm.user_id = user_uuid AND cm.role = 'owner'); END;
$$;

CREATE OR REPLACE FUNCTION public.can_moderate_conversation_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;
  IF conv_tenant IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conv_id AND cm.user_id = user_uuid AND cm.role IN ('owner', 'moderator'))
  OR public.is_tenant_admin_check(user_uuid, conv_tenant);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_pin_message_check(user_uuid UUID, conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE conv_tenant UUID;
BEGIN
  SELECT tenant_id INTO conv_tenant FROM public.conversations WHERE id = conv_id;
  IF conv_tenant IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conv_id AND cm.user_id = user_uuid AND cm.role IN ('owner', 'moderator'))
  OR public.is_tenant_admin_check(user_uuid, conv_tenant);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversation_member_count(conv_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN RETURN (SELECT COUNT(*) FROM public.conversation_members WHERE conversation_id = conv_id); END;
$$;

CREATE OR REPLACE FUNCTION public.can_add_pin_check(conv_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE max_p INTEGER; current_pins INTEGER;
BEGIN
  SELECT COALESCE(max_pins, 3) INTO max_p FROM public.conversations WHERE id = conv_id;
  SELECT COUNT(*) INTO current_pins FROM public.conversation_messages WHERE conversation_id = conv_id AND pinned = true;
  RETURN current_pins < max_p;
END;
$$;

-- =============================================
-- 6. TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id; RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_on_member_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.conversations SET updated_at = now() WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id); RETURN COALESCE(NEW, OLD); END;
$$;

-- =============================================
-- 7. DEFAULT CONVERSATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.create_default_conversation(p_tenant_id UUID, p_created_by UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE conv_id UUID;
BEGIN
  SELECT id INTO conv_id FROM public.conversations WHERE tenant_id = p_tenant_id AND title = 'Geral';
  IF conv_id IS NOT NULL THEN RETURN conv_id; END IF;
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, 'Geral', 'Conversa geral da comunidade', 'public', p_created_by) RETURNING id INTO conv_id;
  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (conv_id, p_created_by, 'owner', p_created_by);
  RETURN conv_id;
END;
$$;

-- =============================================
-- 8. REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

COMMENT ON TABLE public.conversations IS 'Stores conversation/group metadata per tenant';
COMMENT ON TABLE public.conversation_members IS 'Maps users to conversations with scoped roles';
COMMENT ON TABLE public.conversation_messages IS 'Individual messages within conversations';
