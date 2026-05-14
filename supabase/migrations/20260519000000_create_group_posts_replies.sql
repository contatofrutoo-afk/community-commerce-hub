-- Tabela group_posts para discussões nos grupos
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela group_replies para respostas nas discussões
CREATE TABLE IF NOT EXISTS public.group_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON public.group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON public.group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_replies_post ON public.group_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_group_replies_author ON public.group_replies(author_id);

-- Trigger para updated_at em group_posts
CREATE TRIGGER trg_group_posts_updated BEFORE UPDATE ON public.group_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para group_posts
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: membro do grupo
CREATE POLICY "group_posts_select_member" ON public.group_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: membro do grupo
CREATE POLICY "group_posts_insert_member" ON public.group_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_posts.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- UPDATE: apenas autor ou owner do grupo
CREATE POLICY "group_posts_update_author" ON public.group_posts FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
            AND m.is_active = true
        )
    )
  );

-- DELETE: apenas autor ou owner do grupo
CREATE POLICY "group_posts_delete_author" ON public.group_posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = g.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
            AND m.is_active = true
        )
    )
  );

-- RLS para group_replies
ALTER TABLE public.group_replies ENABLE ROW LEVEL SECURITY;

-- SELECT: membro do grupo
CREATE POLICY "group_replies_select_member" ON public.group_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = group_replies.post_id
        AND gm.user_id = auth.uid()
    )
  );

-- INSERT: membro do grupo
CREATE POLICY "group_replies_insert_member" ON public.group_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = group_replies.post_id
        AND gm.user_id = auth.uid()
    )
  );

-- DELETE: apenas autor
CREATE POLICY "group_replies_delete_author" ON public.group_replies FOR DELETE
  USING (author_id = auth.uid());