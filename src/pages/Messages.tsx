import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Loader2, ArrowLeft } from "lucide-react";

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar threads
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
          const userIds = rows.map(t => t.user_id);
          const profiles: Record<string, string> = {};
          
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("user_id, name")
              .in("user_id", userIds);
            (profs || []).forEach(p => { profiles[p.user_id] = p.name; });
          }
          
          setThreads(rows.map(t => ({
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
          
          if (t) setThreadId(t.id);
          else {
            const { data: nt } = await supabase
              .from("message_threads")
              .insert({ tenant_id: tenant.id, user_id: user.id })
              .select("id")
              .single();
            if (nt) setThreadId(nt.id);
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

  // Carregar mensagens quando threadId mudar
  useEffect(() => {
    if (!threadId) return;

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    }
    loadMessages();

    // Realtime
    const channel = supabase.channel("chat-" + threadId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // Scroll para final quando mensagens mudarem
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, threadId]);

  // Enviar mensagem
  async function handleSend() {
    if (!threadId || !inputText.trim() || sending) return;
    
    const content = inputText.trim();
    setInputText("");
    setSending(true);
    
    try {
      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user!.id,
        content
      });
    } catch (err) {
      console.error(err);
      setInputText(content); // restaurar texto se falhar
    } finally {
      setSending(false);
    }
  }

  // Iniciar conversa (B2C)
  async function startConversation() {
    if (!tenant || !user) return;
    
    const { data } = await supabase
      .from("message_threads")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) setThreadId(data.id);
    else {
      const { data: nt } = await supabase
        .from("message_threads")
        .insert({ tenant_id: tenant.id, user_id: user.id })
        .select("id")
        .single();
      if (nt) setThreadId(nt.id);
    }
  }

  // Formatar hora
  function formatTime(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  // Nome do chat
  const chatName = threadId 
    ? (isOwner 
        ? threads.find(t => t.id === threadId)?.author_name || "Usuário" 
        : tenant?.name || "Marca")
    : "";

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

  // Se nenhuma conversa aberta
  if (!threadId) {
    if (isOwner) {
      // Lista de conversas (B2B)
      return (
        <div className="h-screen flex flex-col">
          <TopBar />
          <div className="flex-1 overflow-y-auto">
            <h2 style={{ padding: "16px", fontSize: "20px", fontWeight: "bold" }}>Mensagens</h2>
            {threads.length === 0 ? (
              <p style={{ padding: "16px", color: "#666" }}>Nenhuma conversa</p>
            ) : (
              threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThreadId(t.id)}
                  style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
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
          <BottomNav />
        </div>
      );
    } else {
      // Tela inicial (B2C)
      return (
        <div className="h-screen flex flex-col">
          <TopBar />
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>{tenant?.name}</p>
            <p style={{ color: "#666", marginBottom: "20px" }}>Nenhuma conversa ainda</p>
            <button
              onClick={startConversation}
              style={{ padding: "12px 24px", borderRadius: "24px", background: "#25D366", color: "white", border: "none", fontWeight: 500 }}
            >
              Iniciar conversa
            </button>
          </div>
          <BottomNav />
        </div>
      );
    }
  }

  // Chat aberto
  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid #e5e5e5", background: "white", flexShrink: 0 }}>
          <button onClick={() => setThreadId(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} color="#666" />
          </button>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
            {chatName[0]?.toUpperCase() || "?"}
          </div>
          <span style={{ fontWeight: 500 }}>{chatName}</span>
        </div>

        {/* Mensagens */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f5f5f5" }}>
          {messages.map(m => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: "8px" }}>
                <div style={{ 
                  maxWidth: "70%", 
                  padding: "10px 14px", 
                  borderRadius: "16px", 
                  background: isMine ? "#25D366" : "white", 
                  color: isMine ? "white" : "black" 
                }}>
                  <p style={{ fontSize: "14px", wordBreak: "break-word" }}>{m.content}</p>
                  <p style={{ fontSize: "10px", marginTop: "4px", color: isMine ? "rgba(255,255,255,0.7)" : "#999" }}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{ padding: "12px", background: "white", borderTop: "1px solid #e5e5e5", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Digite uma mensagem..."
              disabled={sending}
              style={{ 
                flex: 1, 
                padding: "10px 16px", 
                borderRadius: "24px", 
                border: "1px solid #ddd", 
                fontSize: "14px", 
                outline: "none" 
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              style={{ 
                padding: "10px 20px", 
                borderRadius: "24px", 
                background: inputText.trim() && !sending ? "#25D366" : "#ccc", 
                color: "white", 
                border: "none", 
                fontWeight: 500,
                cursor: inputText.trim() && !sending ? "pointer" : "default"
              }}
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}