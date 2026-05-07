-- Fix: Restrict SECURITY DEFINER functions to authenticated users only
-- Revoke execute from anon and public roles for sensitive functions

-- Revoke execute from anon and public for gamification helper functions
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(UUID, UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_tenant_owner(UUID, UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon, public;

-- Revoke execute from anon for ranking and stats functions
REVOKE EXECUTE ON FUNCTION public.get_monthly_ranking(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_yearly_ranking(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement_stats(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_feed_posts(UUID, INTEGER, INTEGER) FROM anon;

-- Revoke execute from anon for award_engagement_points (should only be called from triggers or by owners)
REVOKE EXECUTE ON FUNCTION public.award_engagement_points(UUID, UUID, TEXT, INTEGER, UUID, JSONB) FROM anon;

-- Revoke execute from anon for community member functions
REVOKE EXECUTE ON FUNCTION public.get_member_status(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_community_join(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_community_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_community_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_members(UUID) FROM anon;

-- Revoke execute from anon for notification triggers
REVOKE EXECUTE ON FUNCTION public.notify_on_topic_reply() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_live_start() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_post() FROM anon;

-- Revoke execute from anon for insights generation
REVOKE EXECUTE ON FUNCTION public.generate_insights(UUID) FROM anon;

-- Revoke execute from anon for onboarding
REVOKE EXECUTE ON FUNCTION public.update_topic_reply_count() FROM anon;