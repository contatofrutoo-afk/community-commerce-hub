import { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageCircle, Pin, Clock, TrendingUp, Plus, ArrowLeft, Heart, Reply, Trash2, Send, Users, ExternalLink, Image } from "lucide-react";

type Topic = {
  id: string;
  tenant_id: string;
  related_post_id: string | null;
  title: string;
  created_by: string | null;
  replies_count: number;
  last_activity_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null } | null;
  posts?: { media_url: string | null } | null;
  first_message?: { content: string } | null;
};

type TopicMessage = {
  id: string;
  topic_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null } | null;
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Topics() {
  const { tenant, canManage } = useTenant();
  const { user, isB2B } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const postId = searchParams.get("post");
  const topicIdFromParams = params.topicId;
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "pinned">("trending");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTopics = async () => {
    if (!tenant) return;
    setLoading(true);
    
    let query = supabase
      .from("topics")
      .select("*, profiles:profiles!topics_created_by_fkey(name, avatar_url), posts:posts!topics_related_post_id_fkey(media_url), first_message:topic_messages(content)")
      .eq("tenant_id", tenant.id);
    
    if (postId) {
      query = query.eq("related_post_id", postId);
    }
    
    if (activeTab === "pinned") {
      query = query.eq("is_pinned", true).order("created_at", { ascending: false });
    } else if (activeTab === "trending") {
      query = query.order("replies_count", { ascending: false });
    } else {
      query = query.order("last_activity_at", { ascending: false });
    }
    
    const { data: topicsData, error: topicsError } = await query.limit(30);
    
    if (topicsError) { console.error("Load topics error:", topicsError); setLoading(false); return; }
    
    const topicsWithMessages = await Promise.all((topicsData || []).map(async (topic) => {
      const { data: firstMsg } = await supabase
        .from("topic_messages")
        .select("content")
        .eq("topic_id", topic.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      return { ...topic, first_message: firstMsg };
    }));
    
    setTopics(topicsWithMessages);
    setLoading(false);
  };

  useEffect(() => {
    if (tenant) loadTopics();
  }, [tenant, activeTab, postId]);

  // Load topic from URL params
  useEffect(() => {
    if (topicIdFromParams && topics.length > 0) {
      const topic = topics.find(t => t.id === topicIdFromParams);
      if (topic) loadTopicMessages(topic);
    }
  }, [topicIdFromParams, topics]);

  // Redirect from old paths to /conversas
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/topics" || path === "/community") {
      navigate("/conversas", { replace: true });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const createTopic = async () => {
    if (!tenant || !user || !newTitle.trim()) return;
    setCreating(true);
    
    const content = newTitle.trim();
    
    const { data: topicData, error: topicError } = await supabase.from("topics").insert({
      tenant_id: tenant.id,
      related_post_id: postId,
      title: content.substring(0, 100),
      created_by: user.id,
    }).select().single();
    
    if (topicError) {
      setCreating(false);
      toast.error(topicError.message);
      return;
    }
    
    const { error: msgError } = await supabase.from("topic_messages").insert({
      topic_id: topicData.id,
      user_id: user.id,
      content: content,
    });
    
    setCreating(false);
    if (msgError) { 
      console.error("Error creating message:", msgError);
      toast.error("Erro ao criar mensagem");
      return; 
    }
    
    toast.success("Conversa criada!");
    setShowCreate(false);
    setNewTitle("");
    loadTopics();
  };

  const loadTopicMessages = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingMessages(true);
    setNewReply("");
    
    const { data, error } = await supabase
      .from("topic_messages")
      .select("*, profiles:profiles!topic_messages_user_id_fkey(name, avatar_url)")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });
    
    setLoadingMessages(false);
    if (error) { console.error("Load messages error:", error); return; }
    setMessages(data || []);
  };

  const sendReply = async () => {
    if (!selectedTopic || !user || !newReply.trim()) return;
    setSendingReply(true);
    
    const { error } = await supabase.from("topic_messages").insert({
      topic_id: selectedTopic.id,
      user_id: user.id,
      content: newReply.trim(),
    });
    
    setSendingReply(false);
    if (error) { toast.error(error.message); return; }
    
    setNewReply("");
    await loadTopicMessages(selectedTopic);
    loadTopics();
  };

  const likeMessage = async (msgId: string) => {
    if (likedMessages.has(msgId)) return;
    
    setLikedMessages(prev => new Set(prev).add(msgId));
    
    await supabase.rpc("increment_likes", { message_id: msgId });
  };

  const deleteTopic = async (topicId: string) => {
    if (!confirm("Excluir tópico?")) return;
    
    const { error } = await supabase.from("topics").delete().eq("id", topicId);
    if (error) { toast.error(error.message); return; }
    
    toast.success("Tópico excluído");
    loadTopics();
  };

  if (!tenant) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <TopBar />
        <main className="flex-1 grid place-items-center px-6">
          <p className="text-muted-foreground">Selecione uma comunidade</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-display text-2xl mb-1">Conversas</h1>
        <p className="text-sm text-muted-foreground">Participe das discussões da comunidade</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-2">
        <button
          onClick={() => setActiveTab("trending")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "trending" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <TrendingUp className="h-4 w-4 inline mr-1" />
          Em alta
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "recent" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Clock className="h-4 w-4 inline mr-1" />
          Recentes
        </button>
        <button
          onClick={() => setActiveTab("pinned")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "pinned" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
        >
          <Pin className="h-4 w-4 inline mr-1" />
          Fixados
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            {isB2B ? (
              <>
                <h3 className="font-display text-xl mb-2">Inicie uma conversa com sua comunidade</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Crie discussões, faça perguntas e engaje seus membros
                </p>
                <Button onClick={() => setShowCreate(true)} className="bg-brand h-12 px-6">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar conversa
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg mb-2">Seja o primeiro a participar</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Comente em um post para começar uma discussão
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => loadTopicMessages(topic)}
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {topic.is_pinned && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                        <Pin className="h-3 w-3" />
                        <span className="font-medium">Fixado</span>
                      </div>
                    )}
                    
                    <h3 className="font-medium text-base mb-1 truncate">{topic.title}</h3>
                    {(topic.first_message?.content) && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                        {topic.first_message.content}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {topic.replies_count} respostas
                      </span>
                      <span>•</span>
                      <span>{formatTime(topic.last_activity_at)}</span>
                    </div>
                  </div>
                  
                  {topic.profiles && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={topic.profiles.avatar_url ?? ""} />
                      <AvatarFallback className="text-xs">
                        {topic.profiles.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Button - only for B2B */}
      {isB2B && (
        <div className="fixed bottom-20 left-4 right-4 md:hidden">
          <Button 
            onClick={() => setShowCreate(true)} 
            className="w-full bg-brand h-12 text-base shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova conversa
          </Button>
        </div>
      )}

      {/* Create Topic Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Sobre o que você quer conversar?"
              rows={4}
              className="resize-none"
            />
            <Button 
              onClick={createTopic} 
              disabled={creating || !newTitle.trim()} 
              className="w-full bg-brand"
            >
              {creating ? "Criando..." : "Iniciar conversa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Messages View */}
      <Dialog open={!!selectedTopic} onOpenChange={(open) => { if (!open) setSelectedTopic(null); }}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <button 
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <DialogTitle className="text-left pr-8">{selectedTopic?.title}</DialogTitle>
            {selectedTopic?.related_post_id && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Discussão baseada em um post</span>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 px-1">
            {loadingMessages ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground">Seja o primeiro a responder!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "bg-gray-100 rounded-lg p-4",
                    msg.parent_id && "ml-8 border-l-2 border-gray-300"
                  )}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={msg.profiles?.avatar_url ?? ""} />
                      <AvatarFallback className="bg-gray-300 text-gray-600">
                        {msg.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-800">{msg.profiles?.name || "Usuário"}</span>
                        <span className="text-xs text-gray-400">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); likeMessage(msg.id); }}
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            likedMessages.has(msg.id) ? "text-red-500" : "text-gray-400"
                          )}
                        >
                          <Heart className={cn("h-3.5 w-3.5", likedMessages.has(msg.id) && "fill-current")} />
                          {msg.likes_count}
                        </button>
                        {selectedTopic && !selectedTopic.is_locked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNewReply(`@${msg.profiles?.name} `); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            Responder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedTopic && !selectedTopic.is_locked && (
            <div className="flex-shrink-0 pt-4 mt-2 border-t">
              <div className="flex gap-2">
                <Input
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                />
                <Button 
                  onClick={sendReply} 
                  disabled={sendingReply || !newReply.trim()}
                  size="icon"
                  className="bg-brand"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}