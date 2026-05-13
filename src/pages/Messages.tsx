import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (!tenant || !user) return;

    async function load() {
      setLoading(true);
      try {
        if (isOwner) {
          const { data } = await supabase
            .from("message_threads")
            .select("id, user_id, last_message_at")
            .eq("tenant_id", tenant.id)
            .order("last_message_at", { ascending: false });

          const rows = data || [];
          const userIds = [...new Set(rows.map((t) => t.user_id))];
          const profiles: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("user_id, name")
              .in("user_id", userIds);
            (profs || []).forEach((p) => { profiles[p.user_id] = p.name; });
          }
          setThreads(rows.map((t) => ({
            ...t,
            author_name: profiles[t.user_id] || "Usuário"
          })));
        } else {
          const { data: t } = await supabase
            .from("message_threads")
            .select("id")
            .eq("tenant_id", tenant.id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (t) {
            setThreadId(t.id);
          } else {
            const { data: newT } = await supabase
              .from("message_threads")
              .insert({ tenant_id: tenant.id, user_id: user.id })
              .select("id")
              .single();
            if (newT) setThreadId(newT.id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    }
    load();

    const ch = supabase.channel("msg-" + threadId)
      .on("postgres_changes", { 
        event: "INSERT", 
        table: "messages", 
        filter: `thread_id=eq.${threadId}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!threadId || !text.trim() || sending) return;
    const content = text.trim();
    const currentText = text;
    setText("");
    setSending(true);
    try {
      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user!.id,
        content
      });
    } catch (err) {
      console.error(err);
      setText(currentText);
    } finally {
      setSending(false);
    }
  }

  function createThread() {
    if (!tenant || !user || creating) return;
    setCreating(true);
    supabase.from("message_threads")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setThreadId(data.id);
        else {
          supabase.from("message_threads")
            .insert({ tenant_id: tenant.id, user_id: user.id })
            .select("id")
            .single()
            .then(({ data }) => { if (data) setThreadId(data.id); });
        }
      })
      .finally(() => setCreating(false));
  }

  function getName() {
    if (!threadId) return "";
    const t = threads.find((x) => x.id === threadId);
    return isOwner ? (t?.author_name || "Usuário") : (tenant?.name || "Marca");
  }

  function getAvatar() {
    if (!threadId) return null;
    const t = threads.find((x) => x.id === threadId);
    return isOwner ? t?.author_avatar : tenant?.logo_url;
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 overflow-hidden">
        {threadId ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid #e5e5e5", background: "white" }}>
              <button onClick={() => setThreadId(null)}>
                <ArrowLeft size={20} color="#666" />
              </button>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {getAvatar() ? (
                  <img src={getAvatar()!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#666", fontWeight: 500 }}>{getName()[0]}</span>
                )}
              </div>
              <span style={{ fontWeight: 500 }}>{getName()}</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f5f5f5" }}>
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: "8px" }}>
                    <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: "16px", background: mine ? "#25D366" : "white", color: mine ? "white" : "black" }}>
                      <p style={{ fontSize: "14px", wordBreak: "break-word" }}>{m.content}</p>
                      <p style={{ fontSize: "10px", marginTop: "4px", color: mine ? "rgba(255,255,255,0.7)" : "#999" }}>{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px", background: "white", borderTop: "1px solid #e5e5e5" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Mensagem..."
                  style={{ flex: 1, padding: "10px 16px", borderRadius: "24px", border: "1px solid #ddd", fontSize: "14px", outline: "none" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  style={{ padding: "10px 20px", borderRadius: "24px", background: text.trim() ? "#25D366" : "#ccc", color: "white", border: "none", cursor: text.trim() ? "pointer" : "default", fontWeight: 500 }}
                >
                  {sending ? "..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        ) : isOwner ? (
          <div style={{ overflowY: "auto", height: "100%" }}>
            <h2 style={{ padding: "16px", fontSize: "20px", fontWeight: "bold" }}>Mensagens</h2>
            {threads.length === 0 ? (
              <p style={{ padding: "16px", color: "#666" }}>Nenhuma conversa</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThreadId(t.id)}
                  style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {t.author_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontWeight: 500 }}>{t.author_name}</p>
                    <p style={{ fontSize: "12px", color: "#666" }}>{t.last_message_at ? formatTime(t.last_message_at) : ""}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>{tenant?.name}</p>
            <p style={{ color: "#666", marginBottom: "20px" }}>Inicie uma conversa</p>
            <button
              onClick={createThread}
              disabled={creating}
              style={{ padding: "12px 24px", borderRadius: "24px", background: "#25D366", color: "white", border: "none", fontWeight: 500, cursor: "pointer" }}
            >
              {creating ? "Criando..." : "Iniciar conversa"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}