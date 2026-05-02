import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export interface UserStats {
  total_points: number;
  monthly_points: number;
  yearly_points: number;
  monthly_rank: number;
  yearly_rank: number;
}

export interface RankingEntry {
  rank_pos: number;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  city: string | null;
  state: string | null;
  points: number;
}

export interface EngagementInsight {
  metric_name: string;
  metric_value: string;
}

export interface RewardConfig {
  id: string;
  title: string;
  description: string | null;
}

const ACTION_POINTS: Record<string, number> = {
  post_like: 1,
  comment_created: 2,
  reply_created: 3,
  reply_received: 5,
  cta_click: 3,
  conversion: 5,
  live_participation: 10,
};

export function useGamification() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getUserStats = useCallback(async (): Promise<UserStats | null> => {
    if (!user || !tenant) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_user_stats", {
        p_user_id: user.id,
        p_tenant_id: tenant.id,
      });
      
      setLoading(false);
      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (err) {
      setLoading(false);
      console.error("Error in getUserStats:", err);
      return null;
    }
  }, [user?.id, tenant?.id]);

  const getMonthlyRanking = useCallback(async (limit = 10): Promise<RankingEntry[]> => {
    if (!tenant) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_monthly_ranking", {
        p_tenant_id: tenant.id,
        p_limit: limit,
      });
      
      setLoading(false);
      if (error) {
        console.error("Error fetching monthly ranking:", error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      setLoading(false);
      console.error("Error in getMonthlyRanking:", err);
      return [];
    }
  }, [tenant?.id]);

  const getYearlyRanking = useCallback(async (limit = 10): Promise<RankingEntry[]> => {
    if (!tenant) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_yearly_ranking", {
        p_tenant_id: tenant.id,
        p_limit: limit,
      });
      
      setLoading(false);
      if (error) {
        console.error("Error fetching yearly ranking:", error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      setLoading(false);
      console.error("Error in getYearlyRanking:", err);
      return [];
    }
  }, [tenant?.id]);

  const getEngagementInsights = useCallback(async (): Promise<EngagementInsight[]> => {
    if (!tenant) return [];
    
    try {
      const { data, error } = await supabase.rpc("get_engagement_insights", {
        p_tenant_id: tenant.id,
      });
      
      if (error) {
        console.error("Error fetching insights:", error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error("Error in getEngagementInsights:", err);
      return [];
    }
  }, [tenant?.id]);

  const getRewardConfig = useCallback(async (): Promise<RewardConfig | null> => {
    if (!tenant) return null;
    
    try {
      const { data, error } = await supabase
        .from("tenant_rewards")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching reward config:", error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error in getRewardConfig:", err);
      return null;
    }
  }, [tenant?.id]);

  const updateRewardConfig = useCallback(async (title: string, description?: string): Promise<boolean> => {
    if (!tenant) return false;
    
    try {
      const { error } = await supabase
        .from("tenant_rewards")
        .upsert({
          tenant_id: tenant.id,
          title,
          description: description || null,
          is_active: true,
        }, { onConflict: "tenant_id" });
      
      if (error) {
        console.error("Error updating reward config:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in updateRewardConfig:", err);
      return false;
    }
  }, [tenant?.id]);

  const getPointsForAction = useCallback((actionType: string): number => {
    return ACTION_POINTS[actionType] || 0;
  }, []);

  return {
    loading,
    getUserStats,
    getMonthlyRanking,
    getYearlyRanking,
    getEngagementInsights,
    getRewardConfig,
    updateRewardConfig,
    getPointsForAction,
  };
}

export function formatLocation(city?: string | null, state?: string | null): string {
  if (city && state) return `${city} - ${state}`;
  if (city) return city;
  if (state) return state;
  return "";
}