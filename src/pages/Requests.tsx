import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, X, User, Mail, Clock, Calendar, MoreVertical } from "lucide-react";
import { toast } from "sonner";

type AccessRequest = {
  id: string;
  user_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  profile_name?: string | null;
  profile_email?: string;
  tenant_name?: string;
};

type AppointmentRequest = {
  id: string;
  appointment_id: string;
  post_id: string;
  tenant_id: string;
  user_id: string;
  selected_time: string;
  message: string | null;
  status: string;
  created_at: string;
  profile_name?: string | null;
  profile_email?: string;
  service_name?: string;
  service_date?: string;
  tenant_name?: string;
};

export default function Requests() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user || !isB2B) { navigate("/"); return; }

    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);

    if (!mems || mems.length === 0) { setRequests([]); setLoading(false); return; }

    const tenantIds = mems.map(m => m.tenant_id);

    const { data: reqs, error } = await supabase
      .from("community_requests")
      .select("id, user_id, tenant_id, status, created_at")
      .in("tenant_id", tenantIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) { setRequests([]); setLoading(false); return; }
    
    if (!reqs || reqs.length === 0) { setRequests([]); setLoading(false); return; }
    
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
    setLoading(false);
  };

  const loadAppointments = async () => {
    if (!user || !isB2B) return;

    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);

    if (!mems || mems.length === 0) { setAppointments([]); return; }

    const tenantIds = mems.map(m => m.tenant_id);

    const { data: appts } = await supabase
      .from("appointment_requests")
      .select("*")
      .in("tenant_id", tenantIds)
      .order("created_at", { ascending: false });

    if (!appts || appts.length === 0) { setAppointments([]); return; }

    const userIds = appts.map(a => a.user_id);
    const appointmentIds = appts.map(a => a.appointment_id);

    const [{ data: profiles }, { data: appointmentCtas }] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email").in("user_id", userIds),
      supabase.from("appointment_cta").select("id, service_name, service_date").in("id", appointmentIds),
    ]);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

    const ctaMap: Record<string, any> = {};
    (appointmentCtas || []).forEach((c: any) => { ctaMap[c.id] = c; });

    const enriched = appts.map(a => ({
      ...a,
      profile_name: profileMap[a.user_id]?.name || null,
      profile_email: profileMap[a.user_id]?.email || "",
      service_name: ctaMap[a.appointment_id]?.service_name || "Serviço",
      service_date: ctaMap[a.appointment_id]?.service_date || "",
    }));

    setAppointments(enriched);
  };

  useEffect(() => { loadRequests(); }, [user, isB2B, tenants, navigate]);
  useEffect(() => { if (user && isB2B) loadAppointments(); }, [user, isB2B]);

  const handleApprove = async (request: AccessRequest) => {
    const { error } = await supabase.from("community_requests").update({ status: "approved" }).eq("id", request.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    await supabase.from("memberships").insert({ tenant_id: request.tenant_id, user_id: request.user_id, role: "member" });
    toast.success("Membro aprovado!");
    loadRequests();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase.from("community_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) { toast.error("Erro ao recusar"); return; }
    toast.success("Solicitação recusada");
    loadRequests();
  };

  const handleApproveAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "approved" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao aprovar"); return; }
    toast.success("Agendamento aprovado!");
    loadAppointments();
  };

  const handleCompleteAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "completed" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao concluir"); return; }
    toast.success("Agendamento concluído!");
    loadAppointments();
  };

  const handleCancelAppointment = async (appt: AppointmentRequest) => {
    const { error } = await supabase.from("appointment_requests").update({ status: "cancelled" }).eq("id", appt.id);
    if (error) { toast.error("Erro ao cancelar"); return; }
    toast.success("Agendamento cancelado!");
    loadAppointments();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Solicitações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="access">Acesso</TabsTrigger>
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-6">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação de acesso</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(r => (
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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatDate(r.created_at)}</div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 gap-2" onClick={() => handleApprove(r)}><Check className="h-4 w-4" />Aprovar</Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleReject(r.id)}><X className="h-4 w-4" />Recusar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(a => (
                  <div key={a.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{a.service_name || "Serviço"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {a.selected_time} • {a.service_date ? new Date(a.service_date).toLocaleDateString("pt-BR") : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        a.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        a.status === "approved" ? "bg-green-100 text-green-700" :
                        a.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {a.status === "pending" ? "Pendente" :
                         a.status === "approved" ? "Aprovado" :
                         a.status === "completed" ? "Concluído" :
                         "Cancelado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-3 w-3" /> {a.profile_name || "Cliente"}</div>
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {a.profile_email || "-"}</div>
                    </div>
                    {a.message && (
                      <div className="bg-secondary/50 rounded-lg p-2 text-sm">
                        <p className="text-muted-foreground">{a.message}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" />{formatDate(a.created_at)}
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => handleApproveAppointment(a)}>
                          <Check className="h-4 w-4" />Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => handleCancelAppointment(a)}>
                          <X className="h-4 w-4" />Cancelar
                        </Button>
                      </div>
                    )}
                    {a.status === "approved" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="w-full gap-2" onClick={() => handleCompleteAppointment(a)}>
                          <Check className="h-4 w-4" />Concluir Agendamento
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}