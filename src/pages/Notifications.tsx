import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Users, Clock } from "lucide-react";
import { toast } from "sonner";

type PendingRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  profile_name?: string | null;
  profile_email?: string;
  tenant_name?: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  priority: string;
  data: any;
  created_at: string;
  actor_id: string | null;
};

export default function Notifications() {
  const { user } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "all">("requests");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      
      const { data: mems } = await supabase
        .from("memberships")
        .select("tenant_id, role")
        .eq("user_id", user.id);
      
      const ownerMems = (mems || []).filter(m => m.role === "owner" || m.role === "admin");
      const hasOwnership = ownerMems.length > 0;
      setIsOwner(hasOwnership);
      
      if (!hasOwnership) {
        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        setNotifications(notifs || []);
        setLoading(false);
        return;
      }
      
      const tenantIds = ownerMems.map(m => m.tenant_id);
      
      const { data: reqs, error: reqError } = await supabase
        .from("community_requests")
        .select("id, user_id, tenant_id, status, created_at")
        .in("tenant_id", tenantIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (reqError) {
        setRequests([]);
      } else if (reqs && reqs.length > 0) {
        const reqUserIds = reqs.map(r => r.user_id);
        const reqTenantIds = reqs.map(r => r.tenant_id);
        
        const [{ data: profiles }, { data: tenants }] = await Promise.all([
          supabase.from("profiles").select("user_id, name, email").in("user_id", reqUserIds),
          supabase.from("tenants").select("id, name").in("id", reqTenantIds),
        ]);
        
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
        const tenantMap: Record<string, any> = {};
        (tenants || []).forEach((t: any) => { tenantMap[t.id] = t; });
        
        const enriched = reqs.map(r => ({
          ...r,
          profile_name: profileMap[r.user_id]?.name || null,
          profile_email: profileMap[r.user_id]?.email || "",
          tenant_name: tenantMap[r.tenant_id]?.name || "",
        }));
        setRequests(enriched);
      } else {
        setRequests([]);
      }
      
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      
      setNotifications(notifs || []);
      setLoading(false);
    })();
  }, [user, tenants]);

  const handleApprove = async (request: PendingRequest) => {
    const { error } = await supabase.from("community_requests").update({ status: "approved" }).eq("id", request.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    
    await supabase.from("memberships").insert({ tenant_id: request.tenant_id, user_id: request.user_id, role: "member" });
    toast.success("Membro aprovado!");
    
    sessionStorage.setItem("just_joined_community", request.tenant_id);
    
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("community_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) { toast.error("Erro ao recusar"); return; }
    toast.success("Solicitação recusada");
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Notificações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
        {isOwner && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 text-sm font-medium ${activeTab === "requests" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
            >
              Solicitações
              {requests.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-sm font-medium ${activeTab === "all" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`}
            >
              Todas
            </button>
          </div>
        )}
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {activeTab === "requests" && isOwner ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : requests.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold">{r.profile_name || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {r.profile_email || "-"}</p>
                  </div>
                </div>
                {r.tenant_name && <p className="text-sm text-purple-600 font-medium">Comunidade: {r.tenant_name}</p>}
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(r.created_at)}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 gap-2" onClick={() => handleApprove(r)}><Check className="h-4 w-4" />Aprovar</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleReject(r.id)}><X className="h-4 w-4" />Recusar</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`bg-card border rounded-2xl p-4 ${n.type === "join_request" ? "border-purple-200" : "border-border"}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${n.type === "join_request" ? "bg-purple-100" : "bg-brand/10"}`}>
                    {n.type === "join_request" ? (
                      <Users className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Bell className="h-4 w-4 text-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.data?.user_name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">{n.data.user_name}</span> ({n.data.user_email})
                      </p>
                    )}
                    {n.data?.tenant_name && (
                      <p className="text-xs text-purple-600 mt-0.5">{n.data.tenant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}