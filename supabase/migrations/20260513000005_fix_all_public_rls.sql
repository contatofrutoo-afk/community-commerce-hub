-- Fix: Ensure RLS is enabled on all public tables exposed to PostgREST
-- and restrict any remaining policies using 'using (true)'

-- Ensure RLS is enabled on all critical tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

-- Fix: topics SELECT policy - restrict to members only
DROP POLICY IF EXISTS "topics_select_all" ON public.topics;
CREATE POLICY "topics_select_member" ON public.topics FOR SELECT USING (
  public.is_tenant_member(auth.uid(), tenant_id)
);

-- Fix: topic_messages SELECT policy - restrict to members
DROP POLICY IF EXISTS "topic_messages_select_all" ON public.topic_messages;
CREATE POLICY "topic_messages_select_member" ON public.topic_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = topic_id AND public.is_tenant_member(auth.uid(), t.tenant_id)
  )
);

-- Fix: community_events SELECT policy - restrict to members
DROP POLICY IF EXISTS "community_events_select_all" ON public.community_events;
CREATE POLICY "community_events_select_member" ON public.community_events FOR SELECT USING (
  public.is_tenant_member(auth.uid(), tenant_id)
);

-- Fix: insights_cache - already restricted, ensure all policies
DROP POLICY IF EXISTS "insights_cache_select_owner" ON public.insights_cache;
DROP POLICY IF EXISTS "insights_cache_insert_owner" ON public.insights_cache;
DROP POLICY IF EXISTS "insights_cache_update_owner" ON public.insights_cache;
DROP POLICY IF EXISTS "insights_cache_delete_owner" ON public.insights_cache;
CREATE POLICY "insights_cache_select_owner" ON public.insights_cache FOR SELECT
  USING (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_insert_owner" ON public.insights_cache FOR INSERT WITH CHECK
  (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_update_owner" ON public.insights_cache FOR UPDATE USING
  (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "insights_cache_delete_owner" ON public.insights_cache FOR DELETE USING
  (public.is_tenant_owner(auth.uid(), tenant_id));

-- Fix: onboarding_state - restrict to members
DROP POLICY IF EXISTS "onboarding_state_select_own" ON public.onboarding_state;
DROP POLICY IF EXISTS "onboarding_state_insert_own" ON public.onboarding_state;
DROP POLICY IF EXISTS "onboarding_state_update_own" ON public.onboarding_state;
CREATE POLICY "onboarding_state_select_member" ON public.onboarding_state FOR SELECT
  USING (auth.uid() = user_id OR public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "onboarding_state_insert_own" ON public.onboarding_state FOR INSERT WITH CHECK
  (auth.uid() = user_id);
CREATE POLICY "onboarding_state_update_own" ON public.onboarding_state FOR UPDATE USING
  (auth.uid() = user_id OR public.is_tenant_owner(auth.uid(), tenant_id));