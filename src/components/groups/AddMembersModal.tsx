import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, User, X, Check } from "lucide-react";
import { MemberSearchResult } from "@/services/groupsService";

type AddMembersModalProps = {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  groupId: string;
  onAddMember: (userId: string) => Promise<void>;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  searchResults: MemberSearchResult[];
  searching: boolean;
  membersCount: number;
};

export function AddMembersModal({
  open,
  onClose,
  tenantId,
  groupId,
  onAddMember,
  onSearch,
  onClearSearch,
  searchResults,
  searching,
  membersCount,
}: AddMembersModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberSearchResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (value.length < 3) {
        onClearSearch();
        return;
      }

      const timer = setTimeout(() => {
        onSearch(value);
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer, onSearch, onClearSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleClose = () => {
    setQuery("");
    setSelected(null);
    onClearSearch();
    onClose();
  };

  const handleSelect = (member: MemberSearchResult) => {
    setSelected(member);
  };

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    await onAddMember(selected.user_id);
    setAdding(false);
    setSelected(null);
    setQuery("");
    onClearSearch();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro</DialogTitle>
          <DialogDescription>
            Busque e adicione membros ao grupo ({membersCount} membro{membersCount !== 1 ? "s" : ""})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Digite 3+ caracteres para buscar..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {query.length >= 3 && searchResults.length > 0 && !searching && (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {searchResults.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => handleSelect(member)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors ${
                    selected?.user_id === member.user_id ? "bg-brand-soft" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-500">
                        {member.name[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">{member.name}</span>
                  {selected?.user_id === member.user_id && (
                    <Check className="h-4 w-4 text-brand" />
                  )}
                </button>
              ))}
            </div>
          )}

          {query.length >= 3 && !searching && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Nenhum membro encontrado
            </p>
          )}

          {query.length < 3 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Digite pelo menos 3 caracteres para buscar
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selected || adding}
              className="flex-1 bg-brand text-primary-foreground hover:opacity-90"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}