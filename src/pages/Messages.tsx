import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft } from "lucide-react";

type Msg = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenant || !user) return;

    async function load() {
      try {
        if (isOwner) {
          const { data } = await supabase.from("message_threads")
            .select("id, user_id, last_message_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });
          
          const rows = data || [];
          const userIds = [...new Set(rows.map((t: any) => t.user_id))];
          let profiles: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
            (profs || []).forEach((p: any) => profiles[p.user_id] = p.name);
          }
          
          const threadsData = rows.map((t: any) => ({
            ...t,
            author_name: profiles[t.user_id] || "Usuário"
          }));
          setThreads(threadsData);
        } else {
          const { data: t } = await supabase.from("message_threads").select("id")
            .eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
          
          if (t) {
            setThreadId(t.id);
          } else {
            const { data: newT } = await supabase.from("message_threads")
              .insert({ tenant_id: tenant.id, user_id: user.id })
              .select("id").single();
            if (newT) setThreadId(newT.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;

    async function loadMsgs() {
      const { data } = await supabase.from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    }

    loadMsgs();

    const channel = supabase.channel("msg-" + threadId)
      .on("postgres_changes", { event: "INSERT", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Msg]);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!threadId || !text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      await supabase.from("messages").insert({ thread_id: threadId, sender_id: user!.id, content });
    } catch (err) {
      console.error(err);
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function createThread() {
    if (!tenant || !user || creating) return;
    setCreating(true);
    try {
      const { data: t } = await supabase.from("message_threads").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
      if (t) setThreadId(t.id);
      else {
        const { data: nt } = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
        if (nt) setThreadId(nt.id);
      }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function getName() {
    if (!threadId) return "";
    const t = threads.find(x => x.id === threadId);
    return isOwner ? (t?.author_name || "Usuário") : (tenant?.name || "Marca");
  }

  function getAvatar() {
    if (!threadId) return null;
    const t = threads.find(x => x.id === threadId);
    return isOwner ? t?.author_avatar : tenant?.logo_url;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      <TopBar />
      
      {threadId ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 p-3 border-b bg-white">
            <button onClick={() => setThreadId(null)}>
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {getAvatar() ? (
                <img src={getAvatar()!} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-gray-600 font-medium">{getName()[0]}</span>
              )}
            </div>
            <span className="font-medium">{getName()}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-100" ref={scrollRef}>
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${mine ? "bg-green-500 text-white" : "bg-white text-gray-900"}`}>
                    <p className="text-sm">{m.content}</p>
                    <p className={`text-xs mt-1 ${mine ? "text-green-100" : "text-gray-400"}`}>{formatDate(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Digite sua mensagem..."
                className="flex-1 border rounded-full px-4 py-2 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      ) : isOwner ? (
        <div className="flex-1 overflow-y-auto">
          <h2 className="p-4 text-xl font-bold">Mensagens</h2>
          {threads.length === 0 ? (
            <p className="p-4 text-gray-500">Nenhuma conversa</p>
          ) : (
            threads.map((t) => (
              <button key={t.id} onClick={() => setThreadId(t.id)} className="w-full p-4 flex items-center gap-3 border-b">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {t.author_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="text-left">
                  <p className="font-medium">{t.author_name}</p>
                  <p className="text-sm text-gray-500">{t.last_message_at ? formatDate(t.last_message_at) : ""}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-lg font-medium mb-4">{tenant?.name}</p>
          <button onClick={createThread} disabled={creating} className="bg-green-500 text-white px-6 py-3 rounded-full">
            {creating ? "Criando..." : "Iniciar conversa"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}