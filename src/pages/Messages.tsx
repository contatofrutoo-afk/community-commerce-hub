import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type?: "b2b" | "b2c";
  content: string;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

export default function Messages() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const profileCache = useRef<Map<string, { name: string; avatar: string }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchProfile = async (userId: string): Promise<{ name: string; avatar: string } | null> => {
    if (profileCache.current.has(userId)) return profileCache.current.get(userId)!;
    const { data } = await supabase.from("profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle();
    const profile = { name: data?.name ?? null, avatar: data?.avatar_url ?? null };
    if (profile.name) profileCache.current.set(userId, profile);
    return profile;
  };

  useEffect(() => {
    if (!tenant || !user) return;

    const loadData = async () => {
      if (isOwner) {
        const { data } = await supabase.from("message_threads")
          .select("*, profiles:user_id(name,avatar_url)")
          .eq("tenant_id", tenant.id)
          .order("last_message_at", { ascending: false });
        
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
        let { data: t } = await supabase.from("message_threads").select("id")
          .eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
        if (!t) {
          const ins = await supabase.from("message_threads").insert({ tenant_id: tenant.id, user_id: user.id }).select("id").single();
          t = ins.data;
        }
        setThreadId(t?.id ?? null);
      }
    };

    loadData();
  }, [tenant?.id, user?.id, isOwner]);

  useEffect(() => {
    if (!threadId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
      
      if (error) {
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
    setText("");
    await supabase.from("messages").insert({ thread_id: threadId, sender_id: user.id, content });
    await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full pb-24 space-y-3">
        <h1 className="font-display text-3xl mb-4">Mensagens</h1>
        {isOwner && !threadId && (
          <div className="space-y-2">
            {threads.length === 0 && <p className="text-muted-foreground text-sm">Sem conversas ainda.</p>}
            {threads.map((t: any) => (
              <button key={t.id} onClick={() => setThreadId(t.id)} className="w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-xl shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                    {t.author_avatar ? (
                      <img src={t.author_avatar} alt={t.author_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary grid place-items-center text-xs font-medium">
                        {t.author_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t.author_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{t.last_message_at ? new Date(t.last_message_at).toLocaleString("pt-BR") : ""}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {threadId && (
          <div className="space-y-3">
            {isOwner && <Button variant="ghost" size="sm" onClick={() => setThreadId(null)}>← Conversas</Button>}
            {messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              const isFromBrand = isOwner && m.sender_id === user?.id;
              const avatar = isFromBrand ? tenant?.logo_url : m.author_avatar;
              const name = isFromBrand ? tenant?.name : m.author_name;
              const authorInitial = name?.[0]?.toUpperCase() || "?";
              return (
                <div key={m.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary grid place-items-center text-xs font-medium">
                        {authorInitial}
                      </div>
                    )}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? "bg-gray-200 text-gray-900" : "bg-gray-100"}`}>
                    <p className="text-xs opacity-70 mb-0.5">{name || "Anônimo"}</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {threadId && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-xl mx-auto flex gap-2">
            <Input placeholder="Escreva uma mensagem…" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }} maxLength={2000} />
            <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
