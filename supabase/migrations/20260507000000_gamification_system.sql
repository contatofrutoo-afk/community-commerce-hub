-- Gamification System: Ranking, Monitoring, Awards
-- Created: 2026-05-02

-- ============ 1. ADD LOCATION TO PROFILES ============
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- ============ 2. USER ENGAGEMENT POINTS TABLE ============
CREATE TABLE public.user_engagement_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  monthly_points INTEGER NOT NULL DEFAULT 0,
  yearly_points INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);
ALTER TABLE public.user_engagement_points ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_uep_tenant_monthly ON public.user_engagement_points(tenant_id, monthly_points DESC);
CREATE INDEX idx_uep_tenant_yearly ON public.user_engagement_points(tenant_id, yearly_points DESC);
CREATE INDEX idx_uep_user_tenant ON public.user_engagement_points(user_id, tenant_id);

CREATE POLICY "uep_select_all" ON public.user_engagement_points FOR SELECT USING (true);
CREATE POLICY "uep_insert_own" ON public.user_engagement_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uep_update_own" ON public.user_engagement_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "uep_select_owner_tenant" ON public.user_engagement_points FOR SELECT 
  USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ 3. ENGAGEMENT LOGS TABLE (AUDIT) ============
CREATE TABLE public.engagement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_el_tenant_user ON public.engagement_logs(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_el_action_type ON public.engagement_logs(action_type, created_at DESC);
CREATE INDEX idx_el_reference ON public.engagement_logs(reference_type, reference_id) WHERE reference_id IS NOT NULL;

CREATE POLICY "el_select_own" ON public.engagement_logs FOR SELECT 
  USING (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "el_insert_own" ON public.engagement_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "el_select_owner" ON public.engagement_logs FOR SELECT 
  USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ 4. TENANT REWARD CONFIG ============
CREATE TABLE public.tenant_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_rewards ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tr_tenant ON public.tenant_rewards(tenant_id) WHERE is_active = TRUE;

CREATE POLICY "tr_select_all" ON public.tenant_rewards FOR SELECT USING (true);
CREATE POLICY "tr_manage_owner" ON public.tenant_rewards FOR ALL 
  USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- ============ 5. POINT SCORING RULES ============
-- Points per action:
-- comment_created: +2
-- reply_created: +3  
-- reply_received: +5
-- live_participation: +10
-- cta_click: +2 to +5 (configurable)
-- post_like: +1

-- ============ 6. FUNCTION: ADD ENGAGEMENT POINTS ============
CREATE OR REPLACE FUNCTION public.add_engagement_points(
  p_user_id UUID,
  p_tenant_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current_points INTEGER;
  v_current_month DATE;
  v_current_year INTEGER;
BEGIN
  -- Get current period
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Check if user_engagement_points exists
  SELECT total_points INTO v_current_points
  FROM public.user_engagement_points
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;

  IF v_current_points IS NULL THEN
    -- Create new record
    INSERT INTO public.user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
    VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, now());
  ELSE
    -- Update existing record
    UPDATE public.user_engagement_points
    SET total_points = total_points + p_points,
        monthly_points = monthly_points + p_points,
        yearly_points = yearly_points + p_points,
        last_updated_at = now()
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  END IF;

  -- Log the engagement
  INSERT INTO public.engagement_logs (user_id, tenant_id, action_type, points, reference_id, reference_type)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id, p_reference_type);
END;
$$;

-- ============ 7. FUNCTION: GET MONTHLY RANKING ============
CREATE OR REPLACE FUNCTION public.get_monthly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank_pos INTEGER,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  city TEXT,
  state TEXT,
  points INTEGER
) LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uep.monthly_points DESC)::INTEGER AS rank_pos,
    uep.user_id,
    COALESCE(p.name, 'Usuário')::TEXT AS user_name,
    p.avatar_url::TEXT,
    p.city::TEXT,
    p.state::TEXT,
    uep.monthly_points AS points
  FROM public.user_engagement_points uep
  LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id
  ORDER BY uep.monthly_points DESC
  LIMIT p_limit;
END;
$$;

-- ============ 8. FUNCTION: GET YEARLY RANKING ============
CREATE OR REPLACE FUNCTION public.get_yearly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank_pos INTEGER,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  city TEXT,
  state TEXT,
  points INTEGER
) LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uep.yearly_points DESC)::INTEGER AS rank_pos,
    uep.user_id,
    COALESCE(p.name, 'Usuário')::TEXT AS user_name,
    p.avatar_url::TEXT,
    p.city::TEXT,
    p.state::TEXT,
    uep.yearly_points AS points
  FROM public.user_engagement_points uep
  LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id
  ORDER BY uep.yearly_points DESC
  LIMIT p_limit;
END;
$$;

-- ============ 9. FUNCTION: RESET MONTHLY POINTS (cron job) ============
CREATE OR REPLACE FUNCTION public.reset_monthly_points()
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.user_engagement_points
  SET monthly_points = 0;
END;
$$;

-- ============ 10. FUNCTION: RESET YEARLY POINTS (cron job) ============
CREATE OR REPLACE FUNCTION public.reset_yearly_points()
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.user_engagement_points
  SET yearly_points = 0;
END;
$$;

-- ============ 11. FUNCTION: GET USER STATS ============
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE (
  total_points INTEGER,
  monthly_points INTEGER,
  yearly_points INTEGER,
  monthly_rank INTEGER,
  yearly_rank INTEGER
) LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      uep.total_points,
      uep.monthly_points,
      uep.yearly_points
    FROM public.user_engagement_points uep
    WHERE uep.user_id = p_user_id AND uep.tenant_id = p_tenant_id
  ),
  monthly_ranking AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY monthly_points DESC)::INTEGER AS rank
    FROM public.user_engagement_points WHERE tenant_id = p_tenant_id
  ),
  yearly_ranking AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY yearly_points DESC)::INTEGER AS rank
    FROM public.user_engagement_points WHERE tenant_id = p_tenant_id
  )
  SELECT 
    COALESCE(us.total_points, 0),
    COALESCE(us.monthly_points, 0),
    COALESCE(us.yearly_points, 0),
    COALESCE((SELECT rank FROM monthly_ranking WHERE user_id = p_user_id), 0),
    COALESCE((SELECT rank FROM yearly_ranking WHERE user_id = p_user_id), 0)
  FROM user_stats us;
END;
$$;

-- ============ 12. FUNCTION: GET ENGAGEMENT INSIGHTS (FOR BRANDS) ============
CREATE OR REPLACE FUNCTION public.get_engagement_insights(p_tenant_id UUID)
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT
) LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_total_actions INTEGER;
  v_feed_actions INTEGER;
  v_conversations_actions INTEGER;
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_cta_clicks INTEGER;
BEGIN
  -- Total actions in period
  SELECT COUNT(*)::INTEGER INTO v_total_actions
  FROM public.engagement_logs
  WHERE tenant_id = p_tenant_id 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Feed actions (likes, views)
  SELECT COUNT(*)::INTEGER INTO v_feed_actions
  FROM public.engagement_logs
  WHERE tenant_id = p_tenant_id 
    AND action_type IN ('post_like', 'post_view')
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Conversations actions (comments, replies)
  SELECT COUNT(*)::INTEGER INTO v_conversations_actions
  FROM public.engagement_logs
  WHERE tenant_id = p_tenant_id 
    AND action_type IN ('comment_created', 'reply_created', 'reply_received')
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Total users
  SELECT COUNT(*)::INTEGER INTO v_total_users
  FROM public.memberships
  WHERE tenant_id = p_tenant_id;

  -- Active users (with engagement in last 30 days)
  SELECT COUNT(DISTINCT user_id)::INTEGER INTO v_active_users
  FROM public.engagement_logs
  WHERE tenant_id = p_tenant_id 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- CTA clicks
  SELECT COUNT(*)::INTEGER INTO v_cta_clicks
  FROM public.engagement_logs
  WHERE tenant_id = p_tenant_id 
    AND action_type = 'cta_click'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  RETURN QUERY SELECT 'total_actions_30d'::TEXT, v_total_actions::TEXT;
  RETURN QUERY SELECT 'feed_engagement_pct'::TEXT, 
    CASE WHEN v_total_actions > 0 THEN ((v_feed_actions::FLOAT / v_total_actions::FLOAT) * 100)::INTEGER::TEXT || '%' ELSE '0%' END;
  RETURN QUERY SELECT 'conversations_engagement_pct'::TEXT,
    CASE WHEN v_total_actions > 0 THEN ((v_conversations_actions::FLOAT / v_total_actions::FLOAT) * 100)::INTEGER::TEXT || '%' ELSE '0%' END;
  RETURN QUERY SELECT 'total_members'::TEXT, v_total_users::TEXT;
  RETURN QUERY SELECT 'active_users_30d'::TEXT, v_active_users::TEXT;
  RETURN QUERY SELECT 'cta_clicks_30d'::TEXT, v_cta_clicks::TEXT;
  RETURN QUERY SELECT 'engagement_rate_pct'::TEXT,
    CASE WHEN v_total_users > 0 THEN ((v_active_users::FLOAT / v_total_users::FLOAT) * 100)::INTEGER::TEXT || '%' ELSE '0%' END;
END;
$$;

-- ============ 13. TRIGGER: AUTO-AWARD POINTS ON INTERACTIONS ============
CREATE OR REPLACE FUNCTION public.trigger_award_points_on_interaction()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_points INTEGER := 0;
  v_action TEXT;
BEGIN
  -- Determine action type and points
  IF TG_OP = 'INSERT' THEN
    v_action := NEW.action_type::TEXT;
    
    CASE v_action
      WHEN 'like' THEN
        v_points := 1;
      WHEN 'comment' THEN
        v_points := 2;
      WHEN 'click_cta' THEN
        v_points := 3;
      WHEN 'conversion' THEN
        v_points := 5;
      WHEN 'view' THEN
        v_points := 0;
      ELSE
        v_points := 0;
    END CASE;

    -- Award points if > 0 and user_id exists
    IF v_points > 0 AND NEW.user_id IS NOT NULL THEN
      PERFORM public.add_engagement_points(
        NEW.user_id,
        NEW.tenant_id,
        v_action,
        v_points,
        NEW.post_id,
        'post'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on interactions table
CREATE TRIGGER trg_award_points_interaction
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_award_points_on_interaction();

-- ============ 14. TRIGGER: AUTO-AWARD POINTS ON TOPIC MESSAGES ============
CREATE OR REPLACE FUNCTION public.trigger_award_points_on_topic_message()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_points INTEGER := 0;
  v_action TEXT;
  v_parent_exists BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    -- Check if it's a reply (has parent_id) or a new comment
    SELECT EXISTS (SELECT 1 FROM public.topic_messages WHERE id = NEW.parent_id) INTO v_parent_exists;
    
    IF v_parent_exists THEN
      v_action := 'reply_created';
      v_points := 3;
      
      -- Award points to parent message author (reply received)
      IF NEW.parent_id IS NOT NULL THEN
        UPDATE public.topic_messages tm
        SET user_id = tm.user_id
        WHERE tm.id = NEW.parent_id;
        
        PERFORM public.add_engagement_points(
          (SELECT user_id FROM public.topic_messages WHERE id = NEW.parent_id),
          (SELECT t.tenant_id FROM public.topics t JOIN public.topic_messages tm2 ON tm2.topic_id = t.id WHERE tm2.id = NEW.id LIMIT 1),
          'reply_received',
          5,
          NEW.id,
          'topic_message'
        );
      END IF;
    ELSE
      v_action := 'comment_created';
      v_points := 2;
    END IF;

    -- Award points to the user who created the message
    PERFORM public.add_engagement_points(
      NEW.user_id,
      (SELECT t.tenant_id FROM public.topics t JOIN public.topic_messages tm ON tm.topic_id = t.id WHERE tm.id = NEW.id LIMIT 1),
      v_action,
      v_points,
      NEW.id,
      'topic_message'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_topic_message
AFTER INSERT ON public.topic_messages
FOR EACH ROW EXECUTE FUNCTION public.trigger_award_points_on_topic_message();