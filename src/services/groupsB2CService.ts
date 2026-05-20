import { supabase } from "@/integrations/supabase/client";

export type B2CGroup = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  members_count?: number;
};

export type B2CGroupPost = {
  id: string;
  group_id: string;
  author_id: string;
  content: string | null;
  created_at: string;
  profiles?: { name: string | null; avatar_url: string | null };
};

export type B2CGroupMember = {
  user_id: string;
  profiles?: { name: string | null; avatar_url: string | null };
};

export async function getMyGroups(userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members!inner(user_id)")
    .eq("group_members.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null as B2CGroup[] | null, error: error.message };
  return { data: data as unknown as B2CGroup[], error: null };
}

export async function getGroupDetail(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) return { data: null as B2CGroup | null, error: error.message };
  return { data: data as unknown as B2CGroup, error: null };
}

export async function getGroupMembersCount(groupId: string) {
  const { count, error } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) return { count: 0, error: error.message };
  return { count: count || 0, error: null };
}

export async function getGroupPosts(groupId: string) {
  const { data, error } = await supabase
    .from("group_posts")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) return { data: null as B2CGroupPost[] | null, error: error.message };

  const posts = data as B2CGroupPost[];
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .rpc("get_profiles_by_ids", { p_user_ids: authorIds });
    const profileMap = Object.fromEntries(
      (profiles as { user_id: string; name: string; avatar_url: string | null }[] | null)?.map((p) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]) || []
    );
    for (const post of posts) {
      post.profiles = profileMap[post.author_id] || null;
    }
  }

  return { data: posts, error: null };
}

export async function createGroupPost(groupId: string, authorId: string, content: string) {
  const { data, error } = await supabase
    .from("group_posts")
    .insert({
      group_id: groupId,
      author_id: authorId,
      title: content.slice(0, 60),
      content,
    })
    .select()
    .single();

  if (error) return { data: null as B2CGroupPost | null, error: error.message };
  return { data: data as unknown as B2CGroupPost, error: null };
}
