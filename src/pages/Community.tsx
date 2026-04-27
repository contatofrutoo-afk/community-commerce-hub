import { useEffect, useState } from "react";
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
  profiles?: { name: string } | null
};

export default function Community() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!tenant) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("community_messages")
        .select("*, profiles:user_id(name)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });
      
      if (error) {
        toast.error("Erro ao carregar mensagens");
        return;
      }
      
      setMessages(data || []);
    };

    loadMessages();

    const channel = supabase.channel(`community-${tenant.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `tenant_id=eq.${tenant.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Msg]);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  const send = async () => {
    if (!tenant || !user || !text.trim()) return;

    const { error } = await supabase.from("community_messages").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      content: text.trim()
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setText("");
  };

  const isPostComment = (content: string) => content?.startsWith("[Post]");
  const extractImage = (content: string) => {
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.startsWith("http") && (line.includes(".jpg") || line.includes(".png") || line.includes(".jpeg") || line.includes(".gif") || line.includes(".mp4") || line.includes(".webp"))) {
        return line.trim();
      }
    }
    return null;
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full pb-24 space-y-3">
        <h1 className="font-display text-3xl mb-4">Comunidade</h1>
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm">Seja o primeiro a escrever.</p>
        )}
        {messages.map((m) => {
          const isPost = isPostComment(m.content);
          const imageUrl = extractImage(m.content);
          return (
            <div key={m.id} className={`flex gap-2 ${m.user_id === user?.id ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-xs font-medium shrink-0">
                {m.profiles?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.user_id === user?.id ? "bg-foreground text-background" : "bg-secondary"}`}>
                <p className="text-xs opacity-70 mb-0.5">{m.profiles?.name || "Anônimo"}</p>
                {isPost && imageUrl && (
                  <img src={imageUrl} alt="Post" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <p className="text-sm whitespace-pre-wrap">
                  {isPost ? m.content.replace(/\[Post\]\s*/, "").split("\n").slice(2).join("\n") : m.content}
                </p>
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
