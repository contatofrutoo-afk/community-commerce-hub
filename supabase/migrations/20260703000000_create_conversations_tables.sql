-- Complete schema: base tables + conversations system
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)

-- ============================================================
-- ENUMS
-- ============================================================
DO $enum$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $enum$;

DO $enum$ BEGIN
  CREATE TYPE public.conversation_visibility AS ENUM ('public', 'members_only', 'admins_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $enum$;

DO $enum$ BEGIN
  CREATE TYPE public.conversation_role AS ENUM ('admin', 'moderator', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $enum$;

-- ============================================================
-- BASE TABLES (only if not exist)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#111111',
  secondary_color TEXT DEFAULT '#F5F5F0',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $trigger$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenants_updated') THEN
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $trigger$;

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

DO $rls$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_memberships_updated') THEN
    ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
  END IF;
END $rls$;

CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $trigger$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $trigger$;

-- ============================================================
-- CONVERSATIONS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility public.conversation_visibility NOT NULL DEFAULT 'members_only',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.conversation_role NOT NULL DEFAULT 'member',
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversation_message_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, message_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(archived);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON public.conversation_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conv_messages_deleted ON public.conversation_messages(deleted);
CREATE INDEX IF NOT EXISTS idx_conv_messages_pinned ON public.conversation_messages(pinned) WHERE pinned = true;

CREATE INDEX IF NOT EXISTS idx_conv_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);

CREATE INDEX IF NOT EXISTS idx_conv_pins_conversation ON public.conversation_message_pins(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_pins_message ON public.conversation_message_pins(message_id);

-- ============================================================
-- TRIGGER (conversations updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

DO $trigger$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conversations_updated') THEN
    CREATE TRIGGER trg_conversations_updated
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();
  END IF;
END $trigger$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_message_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conversations they are members of"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversations.id
      AND conversation_members.user_id = auth.uid()
    ) OR visibility = 'public'
  );

CREATE POLICY "Members can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.tenant_id = conversations.tenant_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation admins can update"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversations.id
      AND conversation_members.user_id = auth.uid()
      AND conversation_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Conversation admins can delete"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversations.id
      AND conversation_members.user_id = auth.uid()
      AND conversation_members.role = 'admin'
    )
  );

CREATE POLICY "Members can view messages"
  ON public.conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversation_messages.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert messages"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversation_messages.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.conversation_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can soft-delete own messages"
  ON public.conversation_messages FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Members can view member list"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update member roles"
  ON public.conversation_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can remove members"
  ON public.conversation_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Members can view pins"
  ON public.conversation_message_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversation_message_pins.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can pin messages"
  ON public.conversation_message_pins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversation_message_pins.conversation_id
      AND conversation_members.user_id = auth.uid()
      AND conversation_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can unpin messages"
  ON public.conversation_message_pins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_members.conversation_id = conversation_message_pins.conversation_id
      AND conversation_members.user_id = auth.uid()
      AND conversation_members.role IN ('admin', 'moderator')
    )
  );

-- ============================================================
-- FUNCTIONS (RPCs)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = _user_id AND tenant_id = _tenant_id);
$func$;

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_visibility public.conversation_visibility DEFAULT 'members_only',
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS SETOF public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $func$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO public.conversations (tenant_id, title, description, visibility, created_by)
  VALUES (p_tenant_id, p_title, p_description, p_visibility, p_created_by)
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_members (conversation_id, user_id, role, added_by)
  VALUES (v_conversation_id, p_created_by, 'admin', p_created_by);

  RETURN QUERY SELECT * FROM public.conversations WHERE id = v_conversation_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member TO authenticated;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
DO $pub$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $pub$;

DO $pub$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $pub$;

DO $pub$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_messages'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  END IF;
END $pub$;

DO $pub$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_members'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
  END IF;
END $pub$;

DO $pub$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_message_pins'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_message_pins;
  END IF;
END $pub$;
