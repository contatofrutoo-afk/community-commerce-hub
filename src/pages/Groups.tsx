import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, Trash2, Lock, Building2, UserPlus, X } from "lucide-react";
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
  members_count?: number;
};

type MemberSearch = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
};

export default function Groups() {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"private" | "internal">("private");
  const [saving, setSaving] = useState(false);

  // Add members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearch[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);

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
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    setGroups(groups.filter(g => g.id !== groupId));
    toast.success("Grupo excluído");
  };

  // Search members with debounce
  const searchMembers = useCallback(async (query: string) => {
    if (!tenant || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    
    const { data, error } = await supabase
      .from("memberships")
      .select("user_id, role, profiles(name, avatar_url, city)")
      .eq("tenant_id", tenant.id)
      .neq("role", "owner")
      .eq("is_active", true);
    
    setSearching(false);
    
    if (error) {
      setSearchResults([]);
      return;
    }
    
    const filtered = (data || [])
      .filter((m: any) => {
        const name = m.profiles?.name?.toLowerCase() || "";
        return name.includes(query.toLowerCase());
      })
      .map((m: any) => ({
        user_id: m.user_id,
        name: m.profiles?.name || "Usuário",
        avatar_url: m.profiles?.avatar_url || null,
        city: m.profiles?.city || null,
      }));
    
    setSearchResults(filtered);
  }, [tenant]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(searchTerm);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [searchTerm, searchMembers]);

  const toggleMember = (member: MemberSearch) => {
    const exists = selectedMembers.find(m => m.user_id === member.user_id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter(m => m.user_id !== member.user_id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const addMembersToGroup = async () => {
    if (!selectedGroup || selectedMembers.length === 0) return;
    
    setSavingMembers(true);
    
    const membersToInsert = selectedMembers.map(member => ({
      group_id: selectedGroup.id,
      user_id: member.user_id,
      added_by: user!.id,
    }));
    
    // Insert one by one to avoid bulk insert issues
    for (const member of membersToInsert) {
      const { error } = await supabase
        .from("group_members")
        .insert(member);
      
      if (error && error.code !== "23505") {
        toast.error(`Erro ao adicionar ${member.user_id}: ${error.message}`);
      }
    }
    
    setSavingMembers(false);
    setShowMembersModal(false);
    setSelectedGroup(null);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedMembers([]);
    
    toast.success(`${membersToInsert.length} membro(s) adicionado(s)!`);
  };

  const openAddMembers = (group: Group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedMembers([]);
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddMembers(group)}
                      className="text-[#630091] hover:text-[#52007a] hover:bg-purple-50"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGroup(group.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
      
      {/* Create Group Modal */}
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

      {/* Add Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar membros</DialogTitle>
            <DialogDescription>
              Procure e adicione membros ao grupo "{selectedGroup?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔎 Procurar membro..."
                className="pr-10"
              />
              {searching && (
                <Loader2 className="h-4 w-4 absolute right-3 top-3 animate-spin text-gray-400" />
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {searchResults.map((member) => {
                  const isSelected = selectedMembers.some(m => m.user_id === member.user_id);
                  return (
                    <div
                      key={member.user_id}
                      onClick={() => toggleMember(member)}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? "border-[#630091] bg-[#630091]" : "border-gray-300"
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{member.name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        {member.city && <p className="text-xs text-gray-500">{member.city}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
              <p className="text-center text-gray-500 text-sm">Nenhum membro encontrado</p>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowMembersModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={addMembersToGroup}
                disabled={savingMembers || selectedMembers.length === 0}
                className="flex-1 bg-[#630091] text-white hover:bg-[#52007a]"
              >
                {savingMembers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Adicionar ${selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}