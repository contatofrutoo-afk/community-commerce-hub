import { supabase } from "@/integrations/supabase/client";

export type Group = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  members_count?: number;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  };
};

export type MemberSearchResult = {
  user_id: string;
  name: string;
  avatar_url: string | null;
};

export const groupsService = {
  async list(tenantId: string): Promise<{ data: Group[]; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  },

  async create(
    tenantId: string,
    userId: string,
    name: string,
    type: "private" | "internal"
  ): Promise<{ data: Group | null; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        type,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async delete(groupId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    return { error: error?.message || null };
  },

  async getMembers(groupId: string): Promise<{ data: GroupMember[]; error: string | null }> {
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    const userIds = data.map((m) => m.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", userIds);

    const profilesMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
    (profilesData || []).forEach((p) => {
      profilesMap[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
    });

    const members: GroupMember[] = data.map((m) => ({
      id: m.id,
      group_id: m.group_id,
      user_id: m.user_id,
      added_by: m.added_by,
      created_at: m.created_at,
      profiles: profilesMap[m.user_id] || null,
    }));

    return { data: members, error: null };
  },

  async addMember(
    groupId: string,
    userId: string,
    addedBy: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: userId,
        added_by: addedBy,
      })
      .select()
      .single();

    return { error: error?.message || null };
  },

  async removeMember(groupMemberId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", groupMemberId);

    return { error: error?.message || null };
  },

  async searchMembers(
    tenantId: string,
    groupId: string,
    query: string,
    limit: number = 15
  ): Promise<{ data: MemberSearchResult[]; error: string | null }> {
    console.log("[groupsService] searchMembers called:", { tenantId, groupId, query, length: query.length });
    
    if (query.length < 3) {
      console.log("[groupsService] Query too short, skipping");
      return { data: [], error: null };
    }

    const { data, error } = await supabase.rpc("search_group_members", {
      p_tenant_id: tenantId,
      p_group_id: groupId,
      p_search_query: query
    });

    console.log("[groupsService] RPC result:", data?.length || 0, error);

    if (error) return { data: [], error: error.message };

    const existingMemberIds = new Set<string>();
    const { data: membersData } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    
    if (membersData) {
      membersData.forEach((m: any) => existingMemberIds.add(m.user_id));
    }

    const result = (data || [])
      .filter((p: any) => !existingMemberIds.has(p.user_id))
      .map((p: any) => ({
        user_id: p.user_id,
        name: p.name || "Usuário",
        avatar_url: p.avatar_url,
      }));

    console.log("[groupsService] Final result:", result.length);
    return { data: result, error: null };
  },

  async getGroup(groupId: string): Promise<{ data: Group | null; error: string | null }> {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
};