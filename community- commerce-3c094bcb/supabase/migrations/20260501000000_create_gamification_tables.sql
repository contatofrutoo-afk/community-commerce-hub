-- Gamification Tables for Community Commerce Hub
-- Tables: user_engagement_points, engagement_logs, tenant_rewards

-- 1. user_engagement_points: tracks total, monthly, yearly points per user
CREATE TABLE IF NOT EXISTS user_engagement_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  monthly_points INTEGER NOT NULL DEFAULT 0,
  yearly_points INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uep_user_tenant ON user_engagement_points(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_uep_monthly ON user_engagement_points(tenant_id, monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_uep_yearly ON user_engagement_points(tenant_id, yearly_points DESC);

ALTER TABLE user_engagement_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON user_engagement_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage points"
  ON user_engagement_points FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 2. engagement_logs: audit trail of all actions
CREATE TABLE IF NOT EXISTS engagement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_el_user_tenant ON engagement_logs(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_el_type_created ON engagement_logs(tenant_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_el_created ON engagement_logs(created_at DESC);

ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON engagement_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage logs"
  ON engagement_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 3. tenant_rewards: brand-defined rewards/premiacao
CREATE TABLE IF NOT EXISTS tenant_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  award_type TEXT DEFAULT 'discount',
  award_value TEXT,
  min_position INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenant_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
  ON tenant_rewards FOR SELECT
  USING (is_active = true);

CREATE POLICY "B2B users can manage rewards"
  ON tenant_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = tenant_rewards.tenant_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'b2b'
    )
  );

-- 4. Add location fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';

-- 5. Add cta_points field to tenants for brand-configurable CTA points
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cta_min_points INTEGER DEFAULT 2;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cta_max_points INTEGER DEFAULT 5;

-- Function to award points atomically
CREATE OR REPLACE FUNCTION award_engagement_points(
  p_user_id UUID,
  p_tenant_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_points <= 0 THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM engagement_logs
    WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND action_type = p_action_type
    AND reference_id = p_reference_id
    LIMIT 1
  ) THEN RETURN;
  END IF;
  INSERT INTO engagement_logs (user_id, tenant_id, action_type, points, reference_id, metadata)
  VALUES (p_user_id, p_tenant_id, p_action_type, p_points, p_reference_id, p_metadata)
  ON CONFLICT DO NOTHING;
  INSERT INTO user_engagement_points (user_id, tenant_id, total_points, monthly_points, yearly_points, last_updated_at)
  VALUES (p_user_id, p_tenant_id, p_points, p_points, p_points, now())
  ON CONFLICT (user_id, tenant_id)
  DO UPDATE SET
    total_points = user_engagement_points.total_points + p_points,
    monthly_points = user_engagement_points.monthly_points + p_points,
    yearly_points = user_engagement_points.yearly_points + p_points,
    last_updated_at = now();
END;
$$;

-- Function to get monthly ranking
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
    COALESCE(p.name, 'Usuário')::TEXT AS name,
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

-- Function to get yearly ranking
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
    COALESCE(p.name, 'Usuário')::TEXT AS name,
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

-- Function to reset monthly points (called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_engagement_points SET monthly_points = 0;
END;
$$;

-- Function to reset yearly points (called by cron at year end)
CREATE OR REPLACE FUNCTION reset_yearly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_engagement_points SET yearly_points = 0;
END;
$$;

-- Function to get user stats
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
      AND uep2.tenant_id = p_tenant_id
    )::INTEGER AS monthly_rank,
    (
      SELECT COUNT(*) + 1
      FROM user_engagement_points uep2
      WHERE uep2.tenant_id = uep.tenant_id
      AND uep2.yearly_points > uep.yearly_points
      AND uep2.tenant_id = p_tenant_id
    )::INTEGER AS yearly_rank
  FROM user_engagement_points uep
  WHERE uep.user_id = p_user_id AND uep.tenant_id = p_tenant_id;
END;
$$;

-- Enable RLS on profiles for location fields
DROP POLICY IF EXISTS "profiles_location_view" ON profiles;
CREATE POLICY "profiles_location_view" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_location_update" ON profiles;
CREATE POLICY "profiles_location_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);