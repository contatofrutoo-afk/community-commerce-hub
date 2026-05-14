import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, Trash2, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Group = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export default function Groups() {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"private" | "internal">("private");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !isB2B || !tenant) {
      navigate("/");
      return;
    }
    loadGroups();
  }, [user, isB2B, tenant]);

  const loadGroups = async () => {
    if (!user || !tenant) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    
    setLoading(false);
    
    if (error) {
      toast.error("Erro ao carregar grupos");
      setGroups([]);
    } else {
      setGroups(data || []);
    }
  };

  const createGroup = async () => {
    if (!user || !tenant || !newGroupName.trim()) return;
    
    setSaving(true);
    
    const { data, error } = await supabase
      .from("groups")
      .insert({
        tenant_id: tenant.id,
        name: newGroupName.trim(),
        type: newGroupType,
        created_by: user.id,
      })
      .select()
      .single();
    
    setSaving(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    if (data) {
      setGroups([data, ...groups]);
      setShowModal(false);
      setNewGroupName("");
      setNewGroupType("private");
      toast.success("Grupo criado!");
    }
  };

  const deleteGroup = async (groupId: string) => {
    setDeleting(groupId);
    
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);
    
    setDeleting(null);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    setGroups(groups.filter(g => g.id !== groupId));
    toast.success("Grupo excluído");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#630091]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#630091] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Grupos</h1>
              <p className="text-xs text-gray-500">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#630091] text-white hover:bg-[#52007a] rounded-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar grupo
          </Button>
        </div>
        
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum grupo criado</p>
            <p className="text-gray-400 text-sm mt-1">Crie grupos para organizar sua comunidade</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="bg-white rounded-2xl p-4 border shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      group.type === 'private' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {group.type === 'private' ? (
                        <Lock className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.type === 'private' ? 'Privado' : 'Interno'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGroup(group.id)}
                    disabled={deleting === group.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === group.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo grupo</DialogTitle>
            <DialogDescription>
              Crie um grupo para organizar membros da sua comunidade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Equipe Premium"
                maxLength={80}
              />
            </div>
            
            <div>
              <Label>Tipo do grupo</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="group-type"
                    value="private"
                    checked={newGroupType === "private"}
                    onChange={() => setNewGroupType("private")}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm">Privado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="group-type"
                    value="internal"
                    checked={newGroupType === "internal"}
                    onChange={() => setNewGroupType("internal")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Interno</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={createGroup}
                disabled={saving || !newGroupName.trim()}
                className="flex-1 bg-[#630091] text-white hover:bg-[#52007a]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}