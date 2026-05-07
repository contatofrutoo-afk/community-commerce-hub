-- Fix: Secure SECURITY DEFINER functions to require authentication
-- Functions used by RLS policies must remain SECURITY DEFINER but should check auth

-- is_tenant_member: add auth check
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

-- is_tenant_owner: add auth check
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = 'owner'
  );
$$;

-- has_role: add auth check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- get_monthly_ranking: require auth + membership
CREATE OR REPLACE FUNCTION public.get_monthly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_urL TEXT, city TEXT, state TEXT, monthly_points INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_tenant_member(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.monthly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.monthly_points
  FROM user_engagement_points uep LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.monthly_points > 0
  ORDER BY uep.monthly_points DESC LIMIT p_limit;
END;
$$;

-- get_yearly_ranking: require auth + membership
CREATE OR REPLACE FUNCTION public.get_yearly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_url TEXT, city TEXT, state TEXT, yearly_points INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_tenant_member(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.yearly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.yearly_points
  FROM user_engagement_points uep LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.yearly_points > 0
  ORDER BY uep.yearly_points DESC LIMIT p_limit;
END;
$$;

-- get_user_engagement_stats: require auth + membership
CREATE OR REPLACE FUNCTION public.get_user_engagement_stats(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(total_points INTEGER, monthly_points INTEGER, yearly_points INTEGER, monthly_rank INTEGER, yearly_rank INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_tenant_member(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT uep.total_points, uep.monthly_points, uep.yearly_points,
    (SELECT COUNT(*)+1 FROM user_engagement_points WHERE tenant_id = p_tenant_id AND monthly_points > uep.monthly_points)::INTEGER,
    (SELECT COUNT(*)+1 FROM user_engagement_points WHERE tenant_id = p_tenant_id AND yearly_points > uep.yearly_points)::INTEGER
  FROM user_engagement_points uep WHERE uep.user_id = p_user_id AND uep.tenant_id = p_tenant_id;
END;
$$;

-- get_feed_posts: require auth + membership
CREATE OR REPLACE FUNCTION public.get_feed_posts(p_tenant_id UUID, p_limit int, p_offset int)
RETURNS TABLE (
  id UUID, tenant_id UUID, type TEXT, media_url TEXT, thumbnail_url TEXT, description TEXT,
  discussion_enabled BOOLEAN, interaction_prompt TEXT, is_live BOOLEAN, created_at TIMESTAMPTZ, interactions_score NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_tenant_member(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT p.id, p.tenant_id, p.type, p.media_url, p.thumbnail_url, p.description,
    p.discussion_enabled, p.interaction_prompt, p.is_live, p.created_at,
    COALESCE((SELECT COUNT(*)::numeric * 2 FROM public.interactions i WHERE i.post_id = p.id AND i.action_type IN ('like', 'comment', 'click_cta')), 0) +
    CASE WHEN p.is_live = true THEN 50 ELSE 0 END +
    CASE WHEN p.created_at > now() - interval '1 hour' THEN 20 ELSE 0 END as interactions_score
  FROM public.posts p
  WHERE p.tenant_id = p_tenant_id
  ORDER BY interactions_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;