import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { getAllRequestsByBrandIds, updateRequestStatus, setAccessStatus, GlobalAccessRequest } from "@/lib/communityAccess";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, User, Mail, Building2, ArrowRight, Clock } from "lucide-react";

export default function Requests() {
  const { user, isB2B } = useAuth();
  const { tenants } = useTenant();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState<GlobalAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user || !isB2B) {
        navigate("/");
        return;
      }

      console.log("=== REQUESTS DEBUG ===");
      console.log("User:", user.id);
      console.log("Tenants:", tenants);

      let brandIds: string[] = [];
      
      if (tenants && tenants.length > 0) {
        brandIds = tenants.map((t: any) => t.id);
      } else {
        const { data: mems } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .in("role", ["owner", "admin"]);
        
        if (mems) {
          brandIds = mems.map(m => m.tenant_id);
        }
      }

      console.log("Brand IDs:", brandIds);

      const allRequests = getAllRequestsByBrandIds(brandIds);
      
      console.log("Todas as solicitações:", allRequests);
      
      // Filtrar apenas pendentes
      const pendingRequests = allRequests.filter(r => r.status === "pending");
      
      setRequests(pendingRequests);
      setLoading(false);
    };

    loadRequests();
  }, [user, isB2B, tenants, navigate]);

  const handleApprove = (request: GlobalAccessRequest) => {
    updateRequestStatus(request.id, "approved");
    setAccessStatus(request.slug, request.userId, "approved");
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleReject = (request: GlobalAccessRequest) => {
    updateRequestStatus(request.id, "rejected");
    setAccessStatus(request.slug, request.userId, "rejected");
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-semibold">Solicitações de Acesso</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold">{request.userName || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {request.userEmail}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Comunidade: {request.slug}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(request)}
                  >
                    <Check className="h-4 w-4 mr-2" /> Aprovar
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleReject(request)}
                  >
                    <X className="h-4 w-4 mr-2" /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}