import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Post = {
  id: string;
  description: string | null;
  author_id: string | null;
};

type Props = {
  post: Post;
  canDelete: boolean;
  canEdit: boolean;
  onDelete: () => void;
};

export default function PostActionsMenu({ post, canDelete, canEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.description || "");
  const [saving, setSaving] = useState(false);

  if (!canDelete && !canEdit) return null;

  const handleDelete = async () => {
    setSaving(true);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Postagem removida");
    setShowDeleteDialog(false);
    onDelete();
  };

  const handleEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      toast.error("Digite um conteúdo");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("posts").update({ description: trimmed }).eq("id", post.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Postagem atualizada");
    setShowEditDialog(false);
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          aria-label="Opções"
        >
          <MoreVertical className="h-5 w-5 text-white" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30">
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowEditDialog(true); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar postagem
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowDeleteDialog(true); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir postagem
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir publicação?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não poderá ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar postagem</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Digite o conteúdo da postagem..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{editContent.length}/500</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving || !editContent.trim()}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}