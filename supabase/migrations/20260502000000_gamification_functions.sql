-- Funções de Gamificação para Supabase Dashboard
-- Execute este SQL no Supabase SQL Editor (não no Lovable)

-- 1. Função para awarding pontos
CREATE OR REPLACE FUNCTION award_engagement_points(
  p_user_id UUID,
  p_tenant_id UUID, 
  p_action_type TEXT,
  p_points INTEGER,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN;
  END IF;
  
  -- Verifica duplicidade
  IF EXISTS (
    SELECT 1 FROM engagement_logs 
    WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id 
    AND action_type = p_action_type 
    AND reference_id IS NOT DISTINCT FROM p_reference_id 
    LIMIT 1
  ) THEN
    RETURN;
  END IF;
  
  -- Insere log
  INSERT INTO engagement_logs (user_id, tenant_id, action_type, points, reference_id)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id)
  ON CONFLICT DO NOTHING;
  
  -- Atualiza ou insere pontos
  INSERT INTO user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
  VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, NOW())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    total_points = user_engagement_points.total_points + p_points,
    monthly_points = user_engagement_points.monthly_points + p_points,
    yearly_points = user_engagement_points.yearly_points + p_points,
    last_updated_at = NOW();
END;
$$;

-- 2. Função para ranking mensal
CREATE OR REPLACE FUNCTION get_monthly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  rank INTEGER,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  monthly_points INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY uep.monthly_points DESC)::INTEGER AS rank,
    uep.user_id,
    COALESCE(p.name, 'Usuario')::TEXT AS name,
    p.avatar_url,
    p.city,
    p.state,
    uep.monthly_points
  FROM user_engagement_points uep
  LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.monthly_points > 0
  ORDER BY uep.monthly_points DESC
  LIMIT p_limit;
END;
$$;

-- 3. Função para ranking anual
CREATE OR REPLACE FUNCTION get_yearly_ranking(p_tenant_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  rank INTEGER,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  yearly_points INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY uep.yearly_points DESC)::INTEGER AS rank,
    uep.user_id,
    COALESCE(p.name, 'Usuario')::TEXT AS name,
    p.avatar_url,
    p.city,
    p.state,
    uep.yearly_points
  FROM user_engagement_points uep
  LEFT JOIN profiles p ON p.user_id = uep.user_id
  WHERE uep.tenant_id = p_tenant_id AND uep.yearly_points > 0
  ORDER BY uep.yearly_points DESC
  LIMIT p_limit;
END;
$$;

-- 4. Função para stats do usuário
CREATE OR REPLACE FUNCTION get_user_engagement_stats(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(
  total_points INTEGER,
  monthly_points INTEGER,
  yearly_points INTEGER,
  monthly_rank INTEGER,
  yearly_rank INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uep.total_points,
    uep.monthly_points,
    uep.yearly_points,
    (
      SELECT COUNT(*) + 1
      FROM user_engagement_points uep2
      WHERE uep2.tenant_id = uep.tenant_id
      AND uep2.monthly_points > uep.monthly_points
    )::INTEGER AS monthly_rank,
    (
      SELECT COUNT(*) + 1
      FROM user_engagement_points uep2
      WHERE uep2.tenant_id = uep.tenant_id
      AND uep2.yearly_points > uep.yearly_points
    )::INTEGER AS yearly_rank
  FROM user_engagement_points uep
  WHERE uep.user_id = p_user_id AND uep.tenant_id = p_tenant_id;
END;
$$;