import { supabase } from "@/integrations/supabase/client";

export type UserState = {
  isB2B: boolean;
  hasCommunity: boolean;
  hasJoinedCommunities: boolean;
};

export async function getUserState(userId: string): Promise<UserState> {
  if (!userId) {
    return { isB2B: false, hasCommunity: false, hasJoinedCommunities: false };
  }

  try {
    const { data: memberships, error } = await supabase
      .from("memberships")
      .select("role, tenant_id")
      .eq("user_id", userId);

    if (error) {
      console.error("getUserState error:", error);
      return { isB2B: false, hasCommunity: false, hasJoinedCommunities: false };
    }

    const roles = memberships?.map((m) => m.role) || [];
    const isB2B = roles.some((r) => r === "owner" || r === "admin");
    const hasCommunity = isB2B && roles.some((r) => r === "owner" || r === "admin");
    const hasJoinedCommunities = roles.includes("member");

    return {
      isB2B,
      hasCommunity,
      hasJoinedCommunities,
    };
  } catch (e) {
    console.error("getUserState exception:", e);
    return { isB2B: false, hasCommunity: false, hasJoinedCommunities: false };
  }
}