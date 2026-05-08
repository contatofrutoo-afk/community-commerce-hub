-- =============================================
-- CONVERSATION PINS TABLE + NOTIFICATIONS TRIGGERS
-- =============================================

-- =============================================
-- 1. CONVERSATION_MESSAGE_PINS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversation_message_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_pin_per_message UNIQUE (message_id)
);

ALTER TABLE public.conversation_message_pins ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conv_message_pins_conv ON public.conversation_message_pins(conversation_id);
CREATE INDEX idx_conv_message_pins_msg ON public.conversation_message_pins(message_id);

DROP POLICY IF EXISTS conv_pins_select ON public.conversation_message_pins;
CREATE POLICY conv_pins_select ON public.conversation_message_pins FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR c.visibility = 'public' AND public.is_tenant_member_check(auth.uid(), c.tenant_id) OR c.visibility = 'internal' AND public.is_tenant_admin_check(auth.uid(), c.tenant_id) OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()))));

DROP POLICY IF EXISTS conv_pins_insert ON public.conversation_message_pins;
CREATE POLICY conv_pins_insert ON public.conversation_message_pins FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid() WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')) OR public.is_tenant_admin_check(auth.uid(), c.tenant_id));

DROP POLICY IF EXISTS conv_pins_delete ON public.conversation_message_pins;
CREATE POLICY conv_pins_delete ON public.conversation_message_pins FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversations c JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid() WHERE c.id = conversation_id AND cm.role IN ('owner', 'moderator')) OR public.is_tenant_admin_check(auth.uid(), c.tenant_id));

-- =============================================
-- 2. NOTIFICATION FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_new_conversation_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_tenant UUID;
  v_conv_title TEXT;
  v_sender_name TEXT;
  v_member_ids UUID[];
  v_existing_msg_count INTEGER;
BEGIN
  SELECT c.tenant_id, c.title INTO v_conv_tenant, v_conv_title FROM public.conversations c WHERE c.id = NEW.conversation_id;

  SELECT COALESCE(p.name, 'Um membro') INTO v_sender_name FROM public.profiles p WHERE p.user_id = NEW.user_id;

  IF v_conv_tenant IS NULL OR NEW.deleted = true THEN RETURN NEW; END IF;

  SELECT ARRAY_AGG(user_id) INTO v_member_ids
  FROM public.conversation_members
  WHERE conversation_id = NEW.conversation_id AND user_id != NEW.user_id;

  IF v_member_ids IS NULL OR array_length(v_member_ids, 1) IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, tenant_id, type, title, body, link, metadata)
  SELECT
    unnest(v_member_ids),
    v_conv_tenant,
    'conversation_message',
    'Nova mensagem em ' || v_conv_title,
    v_sender_name || ': ' || left(NEW.content, 100),
    '/conversas/' || NEW.conversation_id,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.user_id,
      'sender_name', v_sender_name
    )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_mention()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mentioned_ids TEXT[];
  v_mentioned_id UUID;
  v_conv_title TEXT;
  v_sender_name TEXT;
BEGIN
  IF NEW.deleted = true THEN RETURN NEW; END IF;

  SELECT c.title INTO v_conv_title FROM public.conversations c WHERE c.id = NEW.conversation_id;
  SELECT COALESCE(p.name, 'Um membro') INTO v_sender_name FROM public.profiles p WHERE p.user_id = NEW.user_id;

  SELECT ARRAY_AGG(TRIM(LOWER(m[1]))::UUID)
  INTO v_mentioned_ids
  FROM regexp_matches(NEW.content, '@([a-f0-9-]{36})', 'gi') AS m;

  IF v_mentioned_ids IS NULL OR array_length(v_mentioned_ids, 1) IS NULL THEN RETURN NEW; END IF;

  FOREACH v_mentioned_id IN ARRAY v_mentioned_ids LOOP
    IF v_mentioned_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, tenant_id, type, title, body, link, metadata)
      SELECT
        v_mentioned_id,
        (SELECT tenant_id FROM public.conversations WHERE id = NEW.conversation_id),
        'mention',
        v_sender_name || ' mencionou você',
        '"' || v_conv_title || '": ' || left(NEW.content, 80),
        '/conversas/' || NEW.conversation_id || '?msg=' || NEW.id,
        jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.user_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_message_pinned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_title TEXT;
  v_pinner_name TEXT;
BEGIN
  IF NEW.pinned = false THEN RETURN NEW; END IF;

  SELECT c.title INTO v_conv_title FROM public.conversations c WHERE c.id = NEW.conversation_id;
  SELECT COALESCE(p.name, 'Um moderador') INTO v_pinner_name FROM public.profiles p WHERE p.user_id = NEW.pinned_by;

  INSERT INTO public.notifications (user_id, tenant_id, type, title, body, link, metadata)
  SELECT
    NEW.user_id,
    (SELECT tenant_id FROM public.conversations WHERE id = NEW.conversation_id),
    'message_pinned',
    'Mensagem fixada',
    v_pinner_name || ' fixou sua mensagem em "' || v_conv_title || '"',
    '/conversas/' || NEW.conversation_id || '?msg=' || NEW.id,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'pinned_by', NEW.pinned_by)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_member_added()
RETURNS PUBLIC LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_title TEXT;
  v_added_by_name TEXT;
BEGIN
  SELECT c.title INTO v_conv_title FROM public.conversations c WHERE c.id = NEW.conversation_id;
  SELECT COALESCE(p.name, 'Um administrador') INTO v_added_by_name FROM public.profiles p WHERE p.user_id = NEW.added_by;

  INSERT INTO public.notifications (user_id, tenant_id, type, title, body, link, metadata)
  SELECT
    NEW.user_id,
    (SELECT tenant_id FROM public.conversations WHERE id = NEW.conversation_id),
    'member_added',
    'Você foi adicionado a uma conversa',
    v_added_by_name || ' adicionou você a "' || v_conv_title || '"',
    '/conversas/' || NEW.conversation_id,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'role', NEW.role, 'added_by', NEW.added_by)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- =============================================
-- 3. TRIGGERS FOR NOTIFICATIONS
-- =============================================

DROP TRIGGER IF EXISTS trigger_notify_conversation_message ON public.conversation_messages;
CREATE TRIGGER trigger_notify_conversation_message
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
WHEN (NEW.deleted = false)
EXECUTE FUNCTION public.notify_new_conversation_message();

DROP TRIGGER IF EXISTS trigger_notify_mention ON public.conversation_messages;
CREATE TRIGGER trigger_notify_mention
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
WHEN (NEW.deleted = false)
EXECUTE FUNCTION public.notify_mention();

DROP TRIGGER IF EXISTS trigger_notify_pinned ON public.conversation_messages;
CREATE TRIGGER trigger_notify_pinned
AFTER UPDATE OF pinned ON public.conversation_messages
FOR EACH ROW
WHEN (NEW.pinned = true AND OLD.pinned = false)
EXECUTE FUNCTION public.notify_message_pinned();

DROP TRIGGER IF EXISTS trigger_notify_member_added ON public.conversation_members;
CREATE TRIGGER trigger_notify_member_added
AFTER INSERT ON public.conversation_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_member_added();

-- Enable realtime for pins table
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_message_pins;
