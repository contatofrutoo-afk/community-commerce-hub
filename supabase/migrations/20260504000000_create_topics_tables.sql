-- Topics table for conversations feature
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replies_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_topics_tenant ON public.topics(tenant_id);
CREATE INDEX idx_topics_post ON public.topics(related_post_id);
CREATE INDEX idx_topics_score ON public.topics(score DESC);
CREATE INDEX idx_topics_activity ON public.topics(last_activity_at DESC);

-- Topic messages table
CREATE TABLE IF NOT EXISTS public.topic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.topic_messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.topic_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_topic_messages_topic ON public.topic_messages(topic_id);
CREATE INDEX idx_topic_messages_parent ON public.topic_messages(parent_id);
CREATE INDEX idx_topic_messages_created ON public.topic_messages(created_at);

-- RLS Policies for topics
DROP POLICY IF EXISTS "read topics" ON public.topics;
CREATE POLICY "read topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert topics" ON public.topics;
CREATE POLICY "insert topics" ON public.topics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "update topics" ON public.topics;
CREATE POLICY "update topics" ON public.topics FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete topics" ON public.topics;
CREATE POLICY "delete topics" ON public.topics FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for topic_messages
DROP POLICY IF EXISTS "read topic_messages" ON public.topic_messages;
CREATE POLICY "read topic_messages" ON public.topic_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert topic_messages" ON public.topic_messages;
CREATE POLICY "insert topic_messages" ON public.topic_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delete topic_messages" ON public.topic_messages;
CREATE POLICY "delete topic_messages" ON public.topic_messages FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update topics last_activity_at
CREATE OR REPLACE FUNCTION public.update_topic_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.topics 
  SET last_activity_at = now(), 
      replies_count = replies_count + 1
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_topic_message_insert
AFTER INSERT ON public.topic_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_activity();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_messages;