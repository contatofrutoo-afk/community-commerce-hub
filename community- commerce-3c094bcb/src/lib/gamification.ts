import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

export type ActionType =
  | "post_like"
  | "comment_created"
  | "reply_created"
  | "reply_received"
  | "live_participation"
  | "cta_click";

export const POINTS_CONFIG: Record<ActionType, number> = {
  post_like: 1,
  comment_created: 2,
  reply_created: 3,
  reply_received: 5,
  live_participation: 10,
  cta_click: 2,
};

export type UserPoints = {
  total_points: number;
  monthly_points: number;
  yearly_points: number;
  monthly_rank: number;
  yearly_rank: number;
};

export type RankingEntry = {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  points: number;
};

export async function awardPoints(
  userId: string,
  tenantId: string,
  actionType: ActionType,
  referenceId?: string,
  extraPoints?: number
): Promise<number> {
  let points = POINTS_CONFIG[actionType] ?? 1;
  if (extraPoints !== undefined) points = extraPoints;
  
  try {
    const { data, error } = await supabase.rpc("award_engagement_points", {
      p_user_id: userId,
      p_tenant_id: tenantId,
      p_action_type: actionType,
      p_points: points,
      p_reference_id: referenceId ?? null,
      p_metadata: {},
    });
    if (error) {
      console.error("awardPoints error:", error);
      return 0;
    }
    return points;
  } catch (e) {
    console.error("awardPoints exception:", e);
    return 0;
  }
}

export async function getUserStats(
  userId: string,
  tenantId: string
): Promise<UserPoints | null> {
  try {
    const { data, error } = await supabase.rpc("get_user_engagement_stats", {
      p_user_id: userId,
      p_tenant_id: tenantId,
    });
    if (error || !data) return null;
    const row = data[0];
    if (!row) return null;
    return {
      total_points: row.total_points ?? 0,
      monthly_points: row.monthly_points ?? 0,
      yearly_points: row.yearly_points ?? 0,
      monthly_rank: row.monthly_rank ?? 0,
      yearly_rank: row.yearly_rank ?? 0,
    };
  } catch (e) {
    console.error("getUserStats error:", e);
    return null;
  }
}

export async function getMonthlyRanking(
  tenantId: string,
  limit = 10
): Promise<RankingEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_monthly_ranking", {
      p_tenant_id: tenantId,
      p_limit: limit,
    });
    if (error || !data) return [];
    return (data as any[]).map((row) => ({
      rank: row.rank ?? 0,
      user_id: row.user_id ?? "",
      name: row.name ?? "Usuário",
      avatar_url: row.avatar_url ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      points: row.monthly_points ?? 0,
    }));
  } catch (e) {
    console.error("getMonthlyRanking error:", e);
    return [];
  }
}

export async function getYearlyRanking(
  tenantId: string,
  limit = 10
): Promise<RankingEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_yearly_ranking", {
      p_tenant_id: tenantId,
      p_limit: limit,
    });
    if (error || !data) return [];
    return (data as any[]).map((row) => ({
      rank: row.rank ?? 0,
      user_id: row.user_id ?? "",
      name: row.name ?? "Usuário",
      avatar_url: row.avatar_url ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      points: row.yearly_points ?? 0,
    }));
  } catch (e) {
    console.error("getYearlyRanking error:", e);
    return [];
  }
}

export async function updateUserLocation(
  userId: string,
  location: { city?: string; state?: string; country?: string }
): Promise<boolean> {
  try {
    const updates: Record<string, string> = {};
    if (location.city) updates.city = location.city;
    if (location.state) updates.state = location.state;
    if (location.country) updates.country = location.country;
    
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    
    if (error) {
      console.error("updateUserLocation error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("updateUserLocation exception:", e);
    return false;
  }
}

export type TenantReward = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  award_type: string;
  award_value: string | null;
  min_position: number;
};

export async function getTenantRewards(tenantId: string): Promise<TenantReward[]> {
  try {
    const { data, error } = await supabase
      .from("tenant_rewards")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("min_position", { ascending: true });
    
    if (error || !data) return [];
    return data as TenantReward[];
  } catch (e) {
    console.error("getTenantRewards error:", e);
    return [];
  }
}