-- Tabela para mensagens automáticas do sistema nos grupos
CREATE TABLE IF NOT EXISTS public.group_system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('group_created', 'member_joined', 'member_left')),
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscar mensagens por grupo
CREATE INDEX IF NOT EXISTS idx_group_system_messages_group ON public.group_system_messages(group_id);

-- RLS para group_system_messages
ALTER TABLE public.group_system_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: membro do grupo
CREATE POLICY "group_system_messages_select_member" ON public.group_system_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_system_messages.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: apenas via trigger/função (não permite insert direto)
CREATE POLICY "group_system_messages_insert_system" ON public.group_system_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );