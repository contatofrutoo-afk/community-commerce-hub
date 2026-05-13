import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { toggleMemberActive, getTenantMembers } from "@/lib/communityAccess";

type Member = {
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profiles: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

export default function Members() {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isB2B || !tenant) {
      navigate("/");
      return;
    }
    loadMembers();
  }, [user, isB2B, tenant]);

  const loadMembers = async () => {
    if (!user || !tenant) return;
    setLoading(true);
    const { data, error } = await getTenantMembers(tenant.id, user.id);
    if (error) {
      toast.error("Erro ao carregar membros");
      setMembers([]);
    } else {
      setMembers(data);
    }
    setLoading(false);
  };

  const handleToggleActive = async (member: Member) => {
    if (!user || !tenant) return;
    setToggling(member.user_id);
    const newStatus = !member.is_active;
    const result = await toggleMemberActive(member.user_id, tenant.id, user.id, newStatus);
    setToggling(null);
    if (result.success) {
      toast.success(newStatus ? "Membro ativado" : "Membro desativado");
      setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, is_active: newStatus } : m));
    } else {
      toast.error(result.error || "Erro ao atualizar");
    }
  };

  const handleSendMessage = async (member: Member) => {
    if (!user || !tenant) return;
    
    const { data: existingThread } = await supabase
      .from("message_threads")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("user_id", member.user_id)
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread } = await supabase
        .from("message_threads")
        .insert({ tenant_id: tenant.id, user_id: member.user_id })
        .select("id")
        .single();
      threadId = newThread?.id;
    }

    if (threadId) {
      navigate(`/messages?thread=${threadId}`);
    }
  };

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
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Membros</h1>
        
        {members.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum membro encontrado</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {members.map((member) => {
              const profile = member.profiles;
              const initial = profile?.name?.[0]?.toUpperCase() || "?";
              
              return (
                <div 
                  key={member.user_id} 
                  className={`bg-white rounded-xl p-4 border ${member.is_active ? "border-gray-200" : "border-red-200 bg-red-50"}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mb-3">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    <p className="font-medium text-gray-900 text-center truncate w-full">
                      {profile?.name || "Usuário"}
                    </p>
                    
                    {(profile?.city || profile?.state) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {profile.city}{profile.state ? `, ${profile.state}` : ""}
                      </p>
                    )}
                    
                    <div className="mt-3 w-full">
                      <button
                        onClick={() => handleToggleActive(member)}
                        disabled={toggling === member.user_id}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          member.is_active 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        } ${toggling === member.user_id ? "opacity-50" : ""}`}
                      >
                        {toggling === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : member.is_active ? (
                          "✓ Ativo"
                        ) : (
                          "✕ Inativo"
                        )}
                      </button>
                    </div>
                    
                    <Button
                      onClick={() => handleSendMessage(member)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-[#630091] text-[#630091] hover:bg-[#630091] hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Mensagem
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}