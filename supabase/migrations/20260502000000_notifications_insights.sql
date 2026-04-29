-- Weaze Evolution: Items 4, 8, 11, 12
-- Notifications Priority, Insights, Reengajamento, Feed Dynamic Ranking

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_notifications_priority ON public.notifications(priority) WHERE read_at IS NULL;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "notifications_insert_owner" ON public.notifications FOR INSERT WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ NOTIFICATION TRIGGERS ============
CREATE OR REPLACE FUNCTION public.notify_on_topic_reply()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_topic_title TEXT;
  v_tenant_id UUID;
  v_post_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT t.title, t.tenant_id, t.related_post_id
    INTO v_topic_title, v_tenant_id, v_post_id
    FROM public.topics t WHERE t.id = NEW.topic_id;
    
    INSERT INTO public.notifications (tenant_id, user_id, type, title, priority, data)
    SELECT v_tenant_id, t.created_by, 'topic_reply', 'Nova resposta em: ' || v_topic_title, 'medium',
      jsonb_build_object('topic_id', NEW.topic_id, 'post_id', v_post_id)
    FROM public.topics t WHERE t.id = NEW.topic_id AND t.created_by != NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_topic_reply AFTER INSERT ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_topic_reply();

CREATE OR REPLACE FUNCTION public.notify_on_live_start()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_live = true AND OLD.is_live IS DISTINCT FROM true THEN
    INSERT INTO public.notifications (user_id, type, title, priority, data)
    SELECT user_id, 'live_start', 'LIVE iniciada!', 'high',
      jsonb_build_object('post_id', NEW.id)
    FROM public.posts p WHERE p.id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

-- ============ INSIGHTS GENERATION FUNCTION ============
CREATE OR REPLACE FUNCTION public.generate_insights(p_tenant_id UUID)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_best_post RECORD;
  v_best_hour INTEGER;
  v_active_users INTEGER;
  v_best_cta RECORD;
BEGIN
  -- Best post (most interactions)
  SELECT p.id, p.description, COUNT(i.id)::numeric as interactions
  INTO v_best_post
  FROM public.posts p
  LEFT JOIN public.interactions i ON i.post_id = p.id
  WHERE p.tenant_id = p_tenant_id
  GROUP BY p.id
  ORDER BY interactions DESC
  LIMIT 1;
  
  -- Best hour for posts
  SELECT EXTRACT(HOUR FROM created_at)::integer
  INTO v_best_hour
  FROM public.posts
  WHERE tenant_id = p_tenant_id
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- Active users
  SELECT COUNT(DISTINCT user_id)::integer
  INTO v_active_users
  FROM public.memberships
  WHERE tenant_id = p_tenant_id;
  
  -- Best CTA
  SELECT pcta.type, COUNT(i.id)::numeric as clicks
  INTO v_best_cta
  FROM public.post_cta pcta
  LEFT JOIN public.interactions i ON i.cta_id = pcta.id AND i.action_type = 'click_cta'
  JOIN public.posts p ON p.id = pcta.post_id AND p.tenant_id = p_tenant_id
  GROUP BY pcta.type
  ORDER BY clicks DESC
  LIMIT 1;
  
  -- Insert insights
  INSERT INTO public.insights_cache (tenant_id, type, content)
  VALUES (
    p_tenant_id,
    'daily',
    jsonb_build_object(
      'best_post', v_best_post.description,
      'best_hour', v_best_hour,
      'active_users', v_active_users,
      'best_cta', v_best_cta.type,
      'generated_at', now()
    )
  ) ON CONFLICT DO NOTHING;
END; $$;

-- ============ FEED DYNAMIC RANKING ============
-- Function to get posts with dynamic ranking (recent + popular + live boost)
CREATE OR REPLACE FUNCTION public.get_feed_posts(p_tenant_id UUID, p_limit int, p_offset int)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  type TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  discussion_enabled BOOLEAN,
  interaction_prompt TEXT,
  is_live BOOLEAN,
  created_at TIMESTAMPTZ,
  interactions_score NUMERIC
) LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.tenant_id, p.type, p.media_url, p.thumbnail_url, p.description,
    p.discussion_enabled, p.interaction_prompt, p.is_live, p.created_at,
    COALESCE(
      (SELECT COUNT(*)::numeric * 2 FROM public.interactions i WHERE i.post_id = p.id AND i.action_type IN ('like', 'comment', 'click_cta')),
      0
    ) + 
    CASE WHEN p.is_live = true THEN 50 ELSE 0 END +
    CASE WHEN p.created_at > now() - interval '1 hour' THEN 20 ELSE 0 END as interactions_score
  FROM public.posts p
  WHERE p.tenant_id = p_tenant_id
  ORDER BY interactions_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END; $$;

-- ============ REENGAGEMENT TRIGGER ============
CREATE OR REPLACE FUNCTION public.notify_on_new_post()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (tenant_id, user_id, type, title, priority, data)
    SELECT NEW.tenant_id, m.user_id, 'new_post', 'Novo post disponível!', 'low',
      jsonb_build_object('post_id', NEW.id)
    FROM public.memberships m
    WHERE m.tenant_id = NEW.tenant_id AND m.user_id != NEW.author_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_new_post AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_post();