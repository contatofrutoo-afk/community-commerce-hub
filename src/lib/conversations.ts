import { supabase } from "@/integrations/supabase/client";

export type ConversationRole = "admin" | "moderator" | "member" | "viewer";
export type ConversationVisibility = "public" | "members_only" | "admins_only";

export interface Conversation {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  visibility: ConversationVisibility;
  created_by: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  my_role?: ConversationRole;
  conversation_members?: { user_id: string; role: ConversationRole }[];
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  reply_to: string | null;
  deleted: boolean;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; avatar_url: string } | { name: string; avatar_url: string }[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationRole;
  added_by: string | null;
  created_at: string;
  profiles?: { name: string; avatar_url: string };
}

export async function getMyConversationsWithRole(
  tenantId: string,
  userId: string
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_members(user_id, role)
    `)
    .eq("tenant_id", tenantId)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[conversations] getMyConversationsWithRole error:", error);
    return [];
  }

  return (data ?? []).map((c: any) => ({
    ...c,
    my_role:
      c.conversation_members?.find((m: any) => m.user_id === userId)?.role ??
      null,
  })) as Conversation[];
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[conversations] getConversation error:", error);
    return null;
  }

  return data as Conversation;
}

export async function getConversationMessages(
  conversationId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select(
      `
      *,
      profiles(name, avatar_url),
      reply_to(content, profiles(name))
    `
    )
    .eq("conversation_id", conversationId)
    .eq("deleted", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[conversations] getConversationMessages error:", error);
    return [];
  }

  return data as ConversationMessage[];
}

export async function getPinnedMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*, profiles(name, avatar_url)")
    .eq("conversation_id", conversationId)
    .eq("pinned", true)
    .eq("deleted", false)
    .order("pinned_at", { ascending: true });

  if (error) {
    console.error("[conversations] getPinnedMessages error:", error);
    return [];
  }

  return data as ConversationMessage[];
}

export async function getConversationMembers(
  conversationId: string
): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("*, profiles(name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[conversations] getConversationMembers error:", error);
    return [];
  }

  return data as ConversationMember[];
}

export async function getMyRole(
  conversationId: string,
  userId: string
): Promise<ConversationRole | null> {
  const { data, error } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[conversations] getMyRole error:", error);
    return null;
  }

  return (data?.role as ConversationRole) ?? null;
}

export async function createConversation(params: {
  tenantId: string;
  title: string;
  description?: string;
  visibility: ConversationVisibility;
  createdBy: string;
}): Promise<Conversation> {
  const { data, error } = await supabase.rpc("create_conversation", {
    p_tenant_id: params.tenantId,
    p_title: params.title.trim(),
    p_description: params.description?.trim() || null,
    p_visibility: params.visibility,
    p_created_by: params.createdBy,
  });

  if (error) {
    console.error("[conversations] createConversation error:", error);
    throw error;
  }

  return data as Conversation;
}

export async function archiveConversation(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[conversations] archiveConversation error:", error);
    throw error;
  }
}

export async function sendMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  replyTo?: string | null;
}): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      content: params.content,
      reply_to: params.replyTo ?? null,
    })
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) {
    console.error("[conversations] sendMessage error:", error);
    throw error;
  }

  return data as ConversationMessage;
}

export async function updateMessage(
  messageId: string,
  content: string
): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("*, profiles(name, avatar_url)")
    .single();

  if (error) {
    console.error("[conversations] updateMessage error:", error);
    throw error;
  }

  return data as ConversationMessage;
}

export async function softDeleteMessage(
  messageId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversation_messages")
    .update({ deleted: true, content: "[mensagem removida]" })
    .eq("id", messageId);

  if (error) {
    console.error("[conversations] softDeleteMessage error:", error);
    throw error;
  }
}

export async function pinMessage(params: {
  messageId: string;
  conversationId: string;
  pinnedBy: string;
}): Promise<void> {
  const { error: pinError } = await supabase
    .from("conversation_message_pins")
    .insert({
      conversation_id: params.conversationId,
      message_id: params.messageId,
      pinned_by: params.pinnedBy,
    });

  if (pinError && pinError.code !== "23505") throw pinError;

  const { error } = await supabase
    .from("conversation_messages")
    .update({
      pinned: true,
      pinned_at: new Date().toISOString(),
      pinned_by: params.pinnedBy,
    })
    .eq("id", params.messageId);

  if (error) {
    console.error("[conversations] pinMessage error:", error);
    throw error;
  }
}

export async function unpinMessage(
  messageId: string
): Promise<void> {
  await supabase
    .from("conversation_message_pins")
    .delete()
    .eq("message_id", messageId);

  const { error } = await supabase
    .from("conversation_messages")
    .update({ pinned: false, pinned_at: null, pinned_by: null })
    .eq("id", messageId);

  if (error) {
    console.error("[conversations] unpinMessage error:", error);
    throw error;
  }
}

export async function addConversationMember(params: {
  conversationId: string;
  userId: string;
  role: ConversationRole;
  addedBy: string;
}): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      added_by: params.addedBy,
    });

  if (error) {
    console.error("[conversations] addConversationMember error:", error);
    throw error;
  }
}

export async function removeConversationMember(
  memberId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("[conversations] removeConversationMember error:", error);
    throw error;
  }
}

export async function updateMemberRole(params: {
  memberId: string;
  role: ConversationRole;
}): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .update({ role: params.role })
    .eq("id", params.memberId);

  if (error) {
    console.error("[conversations] updateMemberRole error:", error);
    throw error;
  }
}
