import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationMessage } from "@/lib/conversations";

export function useConversationMessages(conversationId: string | null, userId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isReady = useMemo(() => 
    !!conversationId && conversationId.length > 0 && !!userId && userId.length > 0,
    [conversationId, userId]
  );

  // Buscar mensagens iniciais
  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from("conversation_messages")
        .select(`
          *,
          profiles(name, avatar_url),
          reply_to(content, profiles(name))
        `)
        .eq("conversation_id", conversationId)
        .eq("deleted", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useConversationMessages] Query error:", error);
        return [];
      }

      return data as ConversationMessage[];
    },
    enabled: isReady,
    staleTime: 0,
  });

  // Buscar pins
  const pinnedQuery = useQuery({
    queryKey: ["conversation-pinned", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data } = await supabase
        .from("conversation_messages")
        .select("*, profiles(name, avatar_url)")
        .eq("conversation_id", conversationId)
        .eq("pinned", true)
        .eq("deleted", false)
        .order("pinned_at", { ascending: true });

      return data as ConversationMessage[];
    },
    enabled: isReady,
  });

  // Buscar membros
  const membersQuery = useQuery({
    queryKey: ["conversation-members", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data } = await supabase
        .from("conversation_members")
        .select("*, profiles(name, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      return data ?? [];
    },
    enabled: isReady,
  });

  // Buscar role do usuário
  const roleQuery = useQuery({
    queryKey: ["conversation-role", conversationId, userId],
    queryFn: async () => {
      if (!conversationId || !userId) return null;
      
      const { data } = await supabase
        .from("conversation_members")
        .select("role")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();

      return data?.role ?? null;
    },
    enabled: isReady,
  });

  // Sincronizar estado com query
  useEffect(() => {
    if (messagesQuery.data !== undefined) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  // Realtime - apenas para novas mensagens, sem refetch
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Limpar canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`conv-msgs-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as ConversationMessage;
          if (msg.deleted === false) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  // Mutation: enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (params: { content: string; replyTo?: string | null }) => {
      if (!conversationId) throw new Error("No conversation selected");
      
      const { data, error } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: params.content,
          reply_to: params.replyTo ?? null,
        })
        .select("*, profiles(name, avatar_url)")
        .single();

      if (error) throw error;
      return data as ConversationMessage;
    },
    onSuccess: (newMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    },
  });

  // Mutation: editar mensagem
  const updateMessageMutation = useMutation({
    mutationFn: async (params: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .update({ content: params.content, updated_at: new Date().toISOString() })
        .eq("id", params.messageId)
        .select("*, profiles(name, avatar_url)")
        .single();

      if (error) throw error;
      return data as ConversationMessage;
    },
    onSuccess: (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    },
  });

  // Mutation: deletar mensagem
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("conversation_messages")
        .update({ deleted: true, content: "[mensagem removida]" })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: (_, messageId) => {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, deleted: true, content: "[mensagem removida]" } : m
      ));
    },
  });

  // Mutation: fixar mensagem
  const pinMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("conversation_message_pins")
        .insert({
          conversation_id: conversationId!,
          message_id: messageId,
          pinned_by: userId,
        });

      if (error && error.code !== "23505") throw error;

      await supabase
        .from("conversation_messages")
        .update({
          pinned: true,
          pinned_at: new Date().toISOString(),
          pinned_by: userId,
        })
        .eq("id", messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-pinned", conversationId] });
    },
  });

  // Mutation: desafixar mensagem
  const unpinMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await supabase.from("conversation_message_pins").delete().eq("message_id", messageId);
      
      const { error } = await supabase
        .from("conversation_messages")
        .update({ pinned: false, pinned_at: null, pinned_by: null })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-pinned", conversationId] });
    },
  });

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || messagesQuery.isFetching) return;
    
    const newOffset = messages.length;
    const { data } = await supabase
      .from("conversation_messages")
      .select("*, profiles(name, avatar_url), reply_to(content, profiles(name))")
      .eq("conversation_id", conversationId)
      .eq("deleted", false)
      .order("created_at", { ascending: true })
      .range(newOffset, newOffset + 49);

    if (data && data.length < 50) {
      setHasMore(false);
    }
    
    if (data) {
      setMessages(prev => {
        const newMessages = data.filter((m: ConversationMessage) => 
          !prev.some(p => p.id === m.id)
        );
        return [...prev, ...newMessages];
      });
    }
  }, [conversationId, hasMore, messages.length, messagesQuery.isFetching]);

  return {
    messages,
    pinned: pinnedQuery.data ?? [],
    members: membersQuery.data ?? [],
    myRole: roleQuery.data,
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingPinned: pinnedQuery.isLoading,
    isLoadingMembers: membersQuery.isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    updateMessage: updateMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    pinMessage: pinMessageMutation.mutate,
    isPinning: pinMessageMutation.isPending,
    unpinMessage: unpinMessageMutation.mutate,
    loadMore,
    hasMore,
  };
}