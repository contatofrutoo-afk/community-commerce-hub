import { supabase } from "@/integrations/supabase/client";

type Action = "view" | "like" | "comment" | "click_cta" | "conversion";

const ACTION_POINTS: Record<string, number> = {
  view: 0,
  like: 1,
  comment: 2,
  click_cta: 3,
  conversion: 5,
};

export async function track(params: {
  tenantId: string;
  postId?: string | null;
  ctaId?: string | null;
  action: Action;
  metadata?: Record<string, any>;
}) {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  
  // Insert interaction
  await supabase.from("interactions").insert({
    tenant_id: params.tenantId,
    post_id: params.postId ?? null,
    cta_id: params.ctaId ?? null,
    action_type: params.action,
    user_id: userId ?? null,
    metadata: params.metadata ?? {},
  });
  
  // Award points if user is logged in and action has points
  if (userId && ACTION_POINTS[params.action] > 0) {
    const points = ACTION_POINTS[params.action];
    try {
      await supabase.rpc("award_engagement_points", {
        p_user_id: userId,
        p_tenant_id: params.tenantId,
        p_action_type: params.action,
        p_points: points,
        p_reference_id: params.postId ?? null,
        p_metadata: params.metadata ?? {},
      });
    } catch (e) {
      console.error("Error awarding points:", e);
    }
  }
}