import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Bell, BellOff, MessageSquare, AtSign, Radio, FileText, Check, CheckCheck, UserPlus, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { getPendingMembers, approveMember, rejectMember, PendingMember } from "@/lib/communityMembers";

type Notification = {
  id: string;
  tenant_id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  priority: "high" | "medium" | "low";
  read_at: string | null;
  data: Record<string, unknown>;
  reference_id: string | null;
  created_at: string;
  actor_profiles?: { name: string; avatar_url: string | null } | null;
};

type NotificationSummary = {
  replies: number;
  mentions: number;
  liveStarted: number;
  newPosts: number;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bgColor: string; priority: number }> = {
  reply_message: { icon: MessageSquare, bgColor: "bg-blue-100", priority: 3 },
  mention: { icon: AtSign, bgColor: "bg-purple-100", priority: 4 },
  live_started: { icon: Radio, bgColor: "bg-red-100", priority: 2 },
  new_post: { icon: FileText, bgColor: "bg-green-100", priority: 1 },
};

export default function Notifications() {
  const { tenant, isOwner } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<NotificationSummary>({ replies: 0, mentions: 0, liveStarted: 0, newPosts: 0 });
  const [pendingRequests, setPendingRequests] = useState<PendingMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const loadNotifications = async () => {
    if (!tenant || !user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor_profiles:actor_id(name, avatar_url)")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .order("priority DESC", { foreignTable: "notifications", ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Load notifications error:", error);
      setLoading(false);
      return;
    }

    const notificationsData = (data || []) as unknown as Notification[];
    setNotifications(notificationsData);

    const unread = notificationsData.filter(n => !n.read_at);
    setSummary({
      replies: unread.filter(n => n.type === "reply_message").length,
      mentions: unread.filter(n => n.type === "mention").length,
      liveStarted: unread.filter(n => n.type === "live_started").length,
      newPosts: unread.filter(n => n.type === "new_post").length,
    });

    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!tenant || !isOwner) return;
    setPendingLoading(true);
    
    const members = await getPendingMembers(tenant.id);
    setPendingRequests(members);
    setPendingLoading(false);
  };

  useEffect(() => {
    if (tenant && user) loadNotifications();
  }, [tenant, user]);

  useEffect(() => {
    if (tenant && isOwner) loadPendingRequests();
  }, [tenant, isOwner]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.id);
    }

    const refId = notification.reference_id;
    if (!refId) return;

    switch (notification.type) {
      case "reply_message":
      case "mention":
        navigate(`/conversas/${refId}`);
        break;
      case "live_started":
        navigate(`/content/lives`);
        break;
      case "new_post":
        navigate(`/feed?post=${refId}`);
        break;
      default:
        navigate("/feed");
    }
  };

  const handleApprove = async (memberId: string) => {
    const success = await approveMember(memberId);
    if (success) {
      toast.success("Membro aprovado!");
      loadPendingRequests();
    } else {
      toast.error("Erro ao aprovar membro");
    }
  };

  const handleReject = async (memberId: string) => {
    const success = await rejectMember(memberId);
    if (success) {
      toast.success("Membro recusado");
      loadPendingRequests();
    } else {
      toast.error("Erro ao recusar membro");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 space-y-4">
        <h1 className="text-2xl font-display font-bold">Notificações</h1>

        {isOwner && pendingRequests.length > 0 && (
          <section className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-amber-800">Solicitações de Acesso</h2>
              <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {req.user_name ? (
                      <AvatarImage src={req.user_name} />
                    ) : (
                      <AvatarFallback>{(req.user_email || "?").substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{req.user_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{req.user_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                      onClick={() => handleApprove(req.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(req.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {notifications.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const config = TYPE_CONFIG[notification.type] || { icon: Bell, bgColor: "bg-gray-100", priority: 0 };
              const Icon = config.icon;
              
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-3 rounded-xl border ${
                    notification.read_at 
                      ? "bg-card border-border" 
                      : "bg-blue-50/50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {notification.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}