import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationMessage } from "./conversations";

type MessageCallback = (message: ConversationMessage, type: "INSERT" | "UPDATE" | "DELETE") => void;

const channels = new Map<string, ReturnType<typeof supabase.channel>>();
const listeners = new Map<string, Set<MessageCallback>>();

export function useConversationRealtime(
  conversationId: string | null,
  onMessage: MessageCallback
) {
  const conversationIdRef = useRef(conversationId);
  
  conversationIdRef.current = conversationId;

  useEffect(() => {
    if (!conversationId) {
      // Cleanup
      const ch = channels.get(conversationIdRef.current ?? "");
      if (ch) {
        supabase.removeChannel(ch);
        channels.delete(conversationIdRef.current ?? "");
        listeners.delete(conversationIdRef.current ?? "");
      }
      return;
    }

    // Se já existe canal para esta conversa, apenas adicionar listener
    if (channels.has(conversationId)) {
      listeners.get(conversationId)?.add(onMessage);
      return;
    }

    // Criar novo canal
    const ch = supabase
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
            listeners.get(conversationId)?.forEach(cb => cb(msg, "INSERT"));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as ConversationMessage;
          listeners.get(conversationId)?.forEach(cb => cb(msg, "UPDATE"));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.old as ConversationMessage;
          listeners.get(conversationId)?.forEach(cb => cb(msg, "DELETE"));
        }
      )
      .subscribe();

    channels.set(conversationId, ch);
    listeners.set(conversationId, new Set([onMessage]));

    return () => {
      const convListeners = listeners.get(conversationId);
      convListeners?.delete(onMessage);

      if ((convListeners?.size ?? 0) === 0) {
        const chToRemove = channels.get(conversationId);
        if (chToRemove) {
          supabase.removeChannel(chToRemove);
          channels.delete(conversationId);
          listeners.delete(conversationId);
        }
      }
    };
  }, [conversationId, onMessage]);
}

export function cleanupConversationRealtime() {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels.clear();
  listeners.clear();
}