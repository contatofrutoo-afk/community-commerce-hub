-- Fix: Restringir políticas RLS nas tabelas de gamificação
-- tenant_rewards, user_engagement_points, engagement_logs

DROP POLICY IF EXISTS "tr_select" ON tenant_rewards;
DROP POLICY IF EXISTS "tr_manage" ON tenant_rewards;
CREATE POLICY "tr_select" ON tenant_rewards FOR SELECT USING (
  public.is_tenant_member(auth.uid(), tenant_id)
);
CREATE POLICY "tr_manage" ON tenant_rewards FOR ALL USING (
  public.is_tenant_owner(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "uep_select" ON user_engagement_points;
DROP POLICY IF EXISTS "uep_insert" ON user_engagement_points;
DROP POLICY IF EXISTS "uep_update" ON user_engagement_points;
DROP POLICY IF EXISTS "uep_all" ON user_engagement_points;
CREATE POLICY "uep_select" ON user_engagement_points FOR SELECT USING (
  public.is_tenant_member(auth.uid(), tenant_id)
);
CREATE POLICY "uep_insert" ON user_engagement_points FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "uep_update" ON user_engagement_points FOR UPDATE USING (
  public.is_tenant_owner(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS "el_select" ON engagement_logs;
DROP POLICY IF EXISTS "el_insert" ON engagement_logs;
DROP POLICY IF EXISTS "el_all" ON engagement_logs;
CREATE POLICY "el_select" ON engagement_logs FOR SELECT USING (
  public.is_tenant_member(auth.uid(), tenant_id)
);
CREATE POLICY "el_insert" ON engagement_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id
);