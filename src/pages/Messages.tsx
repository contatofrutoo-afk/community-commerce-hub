import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Send, MessageCircle } from "lucide-react";
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
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const profileCache = useRef<Map<string, { name: string; avatar: string }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
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
          
          if (error) throw error;
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
          
          if (threadError) throw threadError;
          if (existingThread) {
            setThreadId(existingThread.id);
          } else {
            const { data: newThread, error: insertError } = await supabase.from("message_threads")
              .insert({ tenant_id: tenant.id, user_id: user.id })
              .select("id")
              .single();
            if (insertError) throw insertError;
            if (newThread) setThreadId(newThread.id);
          }
        }
      } catch (err) {
        console.error("Error loading threads:", err);
        toast.error("Erro ao carregar conversas");
      } finally {
        setLoadingThreads(false);
      }
    };

    loadData();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
        if (error) throw error;

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
        console.error("Error loading messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    const ch = supabase.channel(`thread-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const row = payload.new as Msg;
          const { data } = await supabase.from("profiles").select("name,avatar_url").eq("user_id", row.sender_id).maybeSingle();
          setMessages(prev => [...prev, { ...row, author_name: data?.name ?? null, author_avatar: data?.avatar_url ?? null }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!threadId || !user || !text.trim()) return;
    const content = text.trim().slice(0, 2000);
    const currentText = text;
    setText("");
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, content });
      if (error) throw error;
      await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
    } catch (err) {
      console.error("Error sending:", err);
      setText(currentText);
    } finally {
      setSending(false);
    }
  };

  const createThread = async () => {
    if (!tenant || !user || creatingThread) return;
    setCreatingThread(true);
    try {
      const { data: existingThread } = await supabase.from("message_threads").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
      if (existingThread) {
        setThreadId(existingThread.id);
        return;
      }
      const { data: newThread, error } = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
      if (error) throw error;
      if (newThread) setThreadId(newThread.id);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro");
    } finally {
      setCreatingThread(false);
    }
  };

  const getChatName = () => {
    const t = threads.find(x => x.id === threadId);
    return isOwner ? (t?.author_name || "Usuário") : (tenant?.name || "Marca");
  };

  const getChatAvatar = () => {
    const t = threads.find(x => x.id === threadId);
    return isOwner ? t?.author_avatar : tenant?.logo_url;
  };

  if (loadingThreads) {
    return (
      <div className="h-[100dvh] flex flex-col bg-white">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      <TopBar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {threadId ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
              <button onClick={() => setThreadId(null)} className="p-1">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-10 w-10 rounded-full bg-green-100 overflow-hidden">
                {getChatAvatar() ? (
                  <img src={getChatAvatar()!} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-600 font-medium">
                    {getChatName()[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-medium text-gray-900">{getChatName()}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={scrollRef}>
              {messages.map((m) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine ? "bg-green-500 text-white" : "bg-gray-200 text-gray-900"}`}>
                      <p className="text-sm break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-green-100" : "text-gray-500"}`}>{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-white border-t shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Mensagem"
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${text.trim() ? "bg-green-500" : "bg-gray-300"}`}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className={`h-4 w-4 ${text.trim() ? "text-white" : "text-gray-500"}`} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : isOwner ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
            </div>
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <MessageCircle className="h-12 w-12 mb-3" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              <div>
                {threads.map((t) => (
                  <button key={t.id} onClick={() => setThreadId(t.id)} className="w-full p-4 flex items-center gap-3 border-b hover:bg-gray-50">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                      {t.author_avatar ? (
                        <img src={t.author_avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-green-600 font-medium">{t.author_name?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{t.author_name || "Usuário"}</p>
                      <p className="text-sm text-gray-500">{t.last_message_at ? formatTime(t.last_message_at) : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{tenant?.name}</h2>
              <p className="text-gray-500 mt-1">Envie uma mensagem para a marca</p>
            </div>
            <button
              onClick={createThread}
              disabled={creatingThread}
              className="bg-green-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 disabled:opacity-50"
            >
              {creatingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
              {creatingThread ? "Criando..." : "Iniciar conversa"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}