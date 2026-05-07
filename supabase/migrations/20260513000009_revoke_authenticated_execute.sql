-- Fix: Restrict SECURITY DEFINER functions from authenticated users
-- These functions should only be called by triggers or RLS policies, not via PostgREST

-- Functions that should NOT be callable by any PostgREST client (even authenticated)
-- Only triggers and service_role should call these

-- Community member management functions
REVOKE EXECUTE ON FUNCTION public.get_member_status(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.request_community_join(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_community_member(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_community_member(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_members(UUID) FROM authenticated;

-- Ranking and stats functions (these need auth check inside, but revoke from PostgREST)
REVOKE EXECUTE ON FUNCTION public.get_monthly_ranking(UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_yearly_ranking(UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement_stats(UUID, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_feed_posts(UUID, INTEGER, INTEGER) FROM authenticated;

-- Award points function (should only be called from triggers)
REVOKE EXECUTE ON FUNCTION public.award_engagement_points(UUID, UUID, TEXT, INTEGER, UUID, JSONB) FROM authenticated;

-- Trigger functions
REVOKE EXECUTE ON FUNCTION public.notify_on_topic_reply() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_live_start() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_post() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_topic_reply_count() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_topic_activity() FROM authenticated;

-- Insights and generation
REVOKE EXECUTE ON FUNCTION public.generate_insights(UUID) FROM authenticated;