import { useEffect, useRef, useState } from "react";
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
  tenant_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

export default function Community() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
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
    if (!tenant) return;
    let cancelled = false;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("community_messages")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar mensagens");
        return;
      }

      const rows = (data ?? []) as Msg[];
      const uniqueUserIds = Array.from(new Set(rows.map(m => m.user_id)));
      if (uniqueUserIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", uniqueUserIds);
        (profs ?? []).forEach(p => profileCache.current.set(p.user_id, { name: p.name, avatar: p.avatar_url }));
      }

      if (cancelled) return;
      setMessages(rows.map(m => {
        const p = profileCache.current.get(m.user_id);
        return { ...m, author_name: p?.name ?? null, author_avatar: p?.avatar ?? null };
      }));
    };

    loadMessages();

    const channel = supabase
      .channel(`community-${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `tenant_id=eq.${tenant.id}` },
        async (payload) => {
          const row = payload.new as Msg;
          const profile = await fetchProfile(row.user_id);
          setMessages(prev => {
            if (prev.some(m => m.id === row.id)) return prev;
            return [...prev, { ...row, author_name: profile?.name ?? null, author_avatar: profile?.avatar ?? null }];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!tenant || !user || !text.trim()) return;

    const { error } = await supabase.from("community_messages").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      content: text.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setText("");
  };

  const isPostComment = (content: string) => content?.startsWith("[Post]");

  const parsePostMessage = (content: string) => {
    const lines = content.split("\n");
    let mediaUrl: string | null = null;
    const textLines: string[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line === "[Post]") continue;
      if (line.startsWith("[media]")) {
        mediaUrl = line.slice(7).trim();
        continue;
      }
      // Legado: linha com URL bruta — tratar como mídia, nunca exibir como texto
      if (/^https?:\/\/\S+$/i.test(line) && /\.(jpg|jpeg|png|gif|webp|mp4)(\?|$)/i.test(line)) {
        if (!mediaUrl) mediaUrl = line;
        continue;
      }
      textLines.push(raw);
    }
    return { mediaUrl, text: textLines.join("\n").trim() };
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full pb-24 space-y-3">
        <h1 className="font-display text-3xl mb-4">Comunidade</h1>
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm">Seja o primeiro a escrever.</p>
        )}
        {messages.map((m) => {
          const isPost = isPostComment(m.content);
          const isMine = m.user_id === user?.id;
          const authorInitial = m.author_name?.[0]?.toUpperCase() || "?";

          if (isPost) {
            const { mediaUrl, text: postText } = parsePostMessage(m.content);
            const isVideo = mediaUrl ? /\.mp4(\?|$)/i.test(mediaUrl) : false;
            return (
              <div key={m.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  {m.author_avatar ? (
                    <img src={m.author_avatar} alt={m.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary grid place-items-center text-xs font-medium">
                      {authorInitial}
                    </div>
                  )}
                </div>
                <div className="max-w-[85%] rounded-2xl p-3 bg-muted text-foreground">
                  <p className="text-xs opacity-70 mb-1.5">{m.author_name || "Anônimo"}</p>
                  {mediaUrl && (
                    isVideo ? (
                      <video src={mediaUrl} className="w-full max-h-56 rounded-lg mb-2 object-cover" muted loop playsInline />
                    ) : (
                      <img src={mediaUrl} alt="Post" className="w-full max-h-56 object-cover rounded-lg mb-2" />
                    )
                  )}
                  {postText && <p className="text-sm whitespace-pre-wrap break-words">{postText}</p>}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                {m.author_avatar ? (
                  <img src={m.author_avatar} alt={m.author_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary grid place-items-center text-xs font-medium">
                    {authorInitial}
                  </div>
                )}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? "bg-gray-200 text-gray-900" : "bg-gray-100"}`}>
                <p className="text-xs opacity-70 mb-0.5">{m.author_name || "Anônimo"}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-xl mx-auto flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem..."
            onKeyDown={(e) => e.key === "Enter" && send()}
            maxLength={1000}
          />
          <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
