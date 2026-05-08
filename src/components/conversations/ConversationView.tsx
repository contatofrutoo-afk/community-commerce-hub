import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation, ConversationMessage, ConversationMember } from "@/lib/conversations";
import ConversationHeader from "./ConversationHeader";
import PinnedMessagesBar from "./PinnedMessagesBar";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

type Props = {
  conversation: Conversation | null | undefined;
  messages: ConversationMessage[];
  pinned: ConversationMessage[];
  members: ConversationMember[];
  myRole: string | null;
  isLoadingConversation: boolean;
  isSending: boolean;
  onBack: () => void;
  onSend: (content: string, replyTo?: string | null) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => void;
  onReplyToMessage: (msg: ConversationMessage) => void;
  replyPreview: { id: string; name: string; content: string } | null;
  onCancelReply: () => void;
  mentionUsers: Array<{ id: string; name: string; avatar_url?: string }>;
  onMembersClick: () => void;
  userId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onGoToMessage: (messageId: string) => void;
};

export default function ConversationView({
  conversation,
  messages,
  pinned,
  members,
  myRole,
  isLoadingConversation,
  isSending,
  onBack,
  onSend,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  onReplyToMessage,
  replyPreview,
  onCancelReply,
  mentionUsers,
  onMembersClick,
  userId,
  onLoadMore,
  hasMore,
  loadingMore,
  onGoToMessage,
}: Props) {
  const canModerate = myRole === "owner" || myRole === "moderator";
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop <= 100) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const handleGoToMessage = (messageId: string) => {
    onGoToMessage(messageId);
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector(`[data-msg-id="${messageId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <ConversationHeader
        conversation={conversation}
        members={members}
        onBack={onBack}
        onMembersClick={onMembersClick}
        showBack={true}
      />

      <PinnedMessagesBar
        messages={messages}
        pinned={pinned}
        onUnpin={onUnpinMessage}
        onGoToMessage={handleGoToMessage}
        canModerate={canModerate}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400 ml-2">Carregando mensagens...</span>
          </div>
        )}

        {isLoadingConversation ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-base font-medium text-gray-500 mb-1">Nenhuma mensagem ainda</p>
            <p className="text-sm text-gray-400">Seja o primeiro a participar da conversa!</p>
          </div>
        ) : (
          <div className="py-2 pb-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <div key={msg.id} data-msg-id={msg.id} ref={msg === messages[0] ? topRef : undefined}>
                  <MessageBubble
                    message={msg}
                    isOwn={msg.user_id === userId}
                    canModerate={canModerate}
                    canPin={canModerate}
                    canUnpin={canModerate}
                    isPinned={msg.pinned}
                    onReply={onReplyToMessage}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onPin={onPinMessage}
                    onUnpin={onUnpinMessage}
                    onCopy={async (content: string) => {
                      try { await navigator.clipboard.writeText(content); } catch {}
                    }}
                  />
                </div>
              ))}
            </AnimatePresence>
            {!hasMore && messages.length >= 10 && (
              <p className="text-center text-xs text-gray-300 py-2">Fim da conversa</p>
            )}
            <div className="h-px" />
          </div>
        )}
      </div>

      <MessageComposer
        onSend={onSend}
        isSending={isSending}
        replyPreview={replyPreview}
        onCancelReply={onCancelReply}
        mentionUsers={mentionUsers}
        maxLength={2000}
      />
    </div>
  );
}
