import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

type Thread = {
  id: string;
  user_id: string;
  last_message_at: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
};

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const profileCache = useRef<Map<string, { name: string; avatar: string }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchProfile = async (userId: string): Promise<{ name: string; avatar: string } | null> => {
    if (profileCache.current.has(userId)) return profileCache.current.get(userId)!;
    const { data } = await supabase.from("profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle();
    const profile = { name: data?.name ?? null, avatar: data?.avatar_url ?? null };
    if (profile.name) profileCache.current.set(userId, profile);
    return profile;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 2 * day) return "ontem";
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" });
  };

  useEffect(() => {
    if (!tenant || !user) return;

    const loadData = async () => {
      setLoadingThreads(true);
      try {
        if (isOwner) {
          const { data, error } = await supabase.from("message_threads")
            .select("id, user_id, tenant_id, last_message_at, created_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });
          
          if (error) {
            console.error("Error loading threads:", error);
            toast.error("Erro ao carregar conversas");
            return;
          }

          const rows = data ?? [];
          const uniqueUserIds = Array.from(new Set(rows.map((t: any) => t.user_id)));
          if (uniqueUserIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", uniqueUserIds);
            (profs ?? []).forEach((p: any) => profileCache.current.set(p.user_id, { name: p.name, avatar: p.avatar_url }));
          }
          
          const threadsWithProfiles = rows.map((t: any) => {
            const p = profileCache.current.get(t.user_id);
            return { ...t, author_name: p?.name ?? null, author_avatar: p?.avatar ?? null };
          });
          setThreads(threadsWithProfiles);
        } else {
          const { data: existingThread, error: threadError } = await supabase.from("message_threads").select("id")
            .eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
          
          if (threadError) {
            console.error("Error loading thread:", threadError);
            toast.error("Erro ao carregar conversa");
            return;
          }

          if (existingThread) {
            setThreadId(existingThread.id);
          } else {
            const { data: newThread, error: insertError } = await supabase.from("message_threads")
              .insert({ tenant_id: tenant.id, user_id: user.id })
              .select("id")
              .single();
            
            if (insertError) {
              console.error("Error creating thread:", insertError);
              toast.error("Erro ao iniciar conversa");
              return;
            }
            
            if (newThread) {
              setThreadId(newThread.id);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("Erro inesperado ao carregar dados");
      } finally {
        setLoadingThreads(false);
      }
    };

    loadData();
  }, [tenant?.id, user?.id, isOwner]);

  const createThread = async () => {
    if (!tenant || !user || creatingThread) return;
    setCreatingThread(true);
    try {
      const { data: existingThread } = await supabase.from("message_threads")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingThread) {
        setThreadId(existingThread.id);
        toast.success("Conversa encontrada!");
        return;
      }

      const { data: newThread, error } = await supabase.from("message_threads")
        .insert({ tenant_id: tenant.id, user_id: user.id })
        .select("id")
        .single();
      
      if (error) {
        console.error("Error creating thread:", error);
        toast.error("Erro ao criar conversa");
        return;
      }
      
      if (newThread) {
        setThreadId(newThread.id);
        toast.success("Conversa iniciada!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado");
    } finally {
      setCreatingThread(false);
    }
  };

  useEffect(() => {
    if (!threadId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
        
        if (error) {
          console.error("Error loading messages:", error);
          toast.error("Erro ao carregar mensagens");
          return;
        }

        const rows = (data ?? []) as Msg[];
        const uniqueUserIds = Array.from(new Set(rows.map(m => m.sender_id)));
        if (uniqueUserIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", uniqueUserIds);
          (profs ?? []).forEach((p: any) => profileCache.current.set(p.user_id, { name: p.name, avatar: p.avatar_url }));
        }

        setMessages(rows.map(m => {
          const p = profileCache.current.get(m.sender_id);
          return { ...m, author_name: p?.name ?? null, author_avatar: p?.avatar ?? null };
        }));
      } catch (err) {
        console.error("Unexpected error loading messages:", err);
        toast.error("Erro inesperado ao carregar mensagens");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    const ch = supabase.channel(`thread-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const row = payload.new as Msg;
          const profile = await fetchProfile(row.sender_id);
          setMessages(prev => [...prev, { ...row, author_name: profile?.name ?? null, author_avatar: profile?.avatar ?? null }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!threadId || !user || !text.trim()) return;
    const content = text.trim().slice(0, 2000);
    const currentText = text;
    setText("");
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({ 
        thread_id: threadId, 
        sender_id: user.id, 
        content 
      });
      if (error) {
        console.error("Error sending message:", error);
        toast.error("Erro ao enviar mensagem");
        setText(currentText);
        return;
      }
      await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
    } catch (err) {
      console.error("Unexpected error sending message:", err);
      toast.error("Erro inesperado ao enviar mensagem");
      setText(currentText);
    } finally {
      setSending(false);
    }
  };

  const getCurrentChatName = () => {
    if (!threadId) return null;
    const currentThread = threads.find(t => t.id === threadId);
    if (isOwner) return currentThread?.author_name || "Usuário";
    return tenant?.name || "Marca";
  };

  const getCurrentChatAvatar = () => {
    if (!threadId) return null;
    const currentThread = threads.find(t => t.id === threadId);
    if (isOwner) return currentThread?.author_avatar;
    return tenant?.logo_url;
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full overflow-hidden">
        {loadingThreads ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : threadId ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0">
              <Button variant="ghost" size="icon" onClick={() => setThreadId(null)} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-9 w-9 rounded-full overflow-hidden bg-muted shrink-0">
                {getCurrentChatAvatar() ? (
                  <img src={getCurrentChatAvatar()!} alt={getCurrentChatName()!} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                    {getCurrentChatName()?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{getCurrentChatName()}</p>
                <p className="text-xs text-muted-foreground">WhatsApp-style</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Nenhuma mensagem ainda.</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user?.id;
                  const time = formatTime(m.created_at);
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine 
                          ? "bg-[#25D366] text-white" 
                          : "bg-[#E5E5EA] text-gray-900"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-gray-500"}`}>
                          {time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 bg-background border-t flex items-center gap-2">
              <input 
                type="text"
                placeholder="Digite uma mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !sending && !e.shiftKey) { e.preventDefault(); send(); } }}
                maxLength={2000}
                disabled={sending}
                className="flex-1 bg-[#F0F0F0] rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#25D366]"
              />
              <button 
                onClick={send}
                disabled={sending || !text.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${sending || !text.trim() ? "bg-gray-300" : "bg-[#25D366]"}`}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : isOwner ? (
          <div className="flex-1 overflow-y-auto">
            <h1 className="font-display text-2xl px-4 pt-4 pb-2">Conversas</h1>
            {threads.length === 0 ? (
              <p className="text-muted-foreground text-sm px-4 py-8 text-center">Nenhuma conversa ainda.</p>
            ) : (
              <div className="divide-y">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThreadId(t.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0">
                      {t.author_avatar ? (
                        <img src={t.author_avatar} alt={t.author_name || "U"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                          {t.author_name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.author_name || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t.last_message_at ? formatTime(t.last_message_at) : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <div className="text-center">
              <p className="font-medium">{tenant?.name}</p>
              <p className="text-sm text-muted-foreground">Inicie uma conversa privada</p>
            </div>
            <Button onClick={createThread} disabled={creatingThread} className="bg-[#25D366] hover:bg-[#20BD5A]">
              {creatingThread ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2 text-white" />}
              <span className="text-white">Iniciar conversa</span>
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}