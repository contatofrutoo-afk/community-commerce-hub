import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, ConversationVisibility } from "@/lib/conversations";

export function useConversationsList(tenantId: string, userId: string) {
  const queryClient = useQueryClient();

  const isReady = useMemo(() => 
    !!tenantId && tenantId.length > 0 && !!userId && userId.length > 0,
    [tenantId, userId]
  );

  const conversationsQuery = useQuery({
    queryKey: ["conversations", "list", tenantId],
    queryFn: async () => {
      if (!tenantId || !userId) return [];
      
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
        console.error("[useConversationsList] Query error:", error);
        return [];
      }

      return (data ?? []).map((c: any) => ({
        ...c,
        my_role: c.conversation_members?.find((m: any) => m.user_id === userId)?.role ?? null,
      })) as Conversation[];
    },
    enabled: isReady,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: async (params: { 
      title: string; 
      description?: string; 
      visibility: ConversationVisibility 
    }) => {
      const { data, error } = await supabase.rpc("create_conversation", {
        p_tenant_id: tenantId,
        p_title: params.title.trim(),
        p_description: params.description?.trim() || null,
        p_visibility: params.visibility,
        p_created_by: userId,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Já existe uma conversa com esse nome");
        }
        throw error;
      }

      return data as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData<Conversation[]>(["conversations", "list", tenantId], (old) => {
        if (!old) return [newConversation];
        const exists = old.some(c => c.id === newConversation.id);
        if (exists) return old;
        return [newConversation, ...old];
      });
    },
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["conversations", "list", tenantId] });
  }, [queryClient, tenantId]);

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    refetch,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}