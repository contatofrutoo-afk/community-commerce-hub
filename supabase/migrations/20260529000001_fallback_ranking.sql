-- Ranking functions - NO membership check (read-only data, no sensitive exposure)
-- Uses $body$ dollar quoting for compatibility with Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_monthly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10, p_exclude_user_id UUID DEFAULT NULL)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_url TEXT, city TEXT, state TEXT, monthly_points INTEGER)
LANGUAGE plpgsql
AS $body$
BEGIN
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.monthly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.monthly_points
  FROM public.user_engagement_points uep LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id 
    AND uep.monthly_points > 0
    AND (p_exclude_user_id IS NULL OR uep.user_id != p_exclude_user_id)
  ORDER BY uep.monthly_points DESC LIMIT p_limit;
END;
$body$;

CREATE OR REPLACE FUNCTION public.get_yearly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10, p_exclude_user_id UUID DEFAULT NULL)
RETURNS TABLE(rank INTEGER, user_id UUID, name TEXT, avatar_url TEXT, city TEXT, state TEXT, yearly_points INTEGER)
LANGUAGE plpgsql
AS $body$
BEGIN
  RETURN QUERY SELECT ROW_NUMBER() OVER (ORDER BY uep.yearly_points DESC)::INTEGER AS rank,
    uep.user_id, COALESCE(p.name, 'Usuário')::TEXT, p.avatar_url, p.city, p.state, uep.yearly_points
  FROM public.user_engagement_points uep LEFT JOIN public.profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id 
    AND uep.yearly_points > 0
    AND (p_exclude_user_id IS NULL OR uep.user_id != p_exclude_user_id)
  ORDER BY uep.yearly_points DESC LIMIT p_limit;
END;
$body$;