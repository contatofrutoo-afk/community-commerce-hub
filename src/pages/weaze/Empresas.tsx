import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  blocked: "destructive",
  cancelled: "outline",
};

const statusLabel: Record<string, string> = {
  active: "Ativo",
  trial: "Em Teste",
  blocked: "Bloqueado",
  cancelled: "Cancelado",
};

export default function WeazeEmpresas() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data: companies } = await supabase.from("companies").select("id, name, slug, created_at, mrr, city");
      const { data: adminRows } = await supabase.from("company_admin").select("*");

      const adminMap = new Map((adminRows ?? []).map((r: any) => [r.company_id, r]));

      const merged = (companies ?? []).map((t: any) => {
        const a = adminMap.get(t.id);
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          responsible: t.created_by,
          plan: a?.plan_type ?? "Mensal",
          status: a?.status ?? "active",
          nextDue: a?.next_due_date ?? "-",
          lastPayment: a?.last_payment_date ?? "-",
          monthlyFee: a?.monthly_fee ?? 237,
          city: t.city,
          createdAt: t.created_at,
          mrr: t.mrr,
        };
      });

      setRows(merged);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Empresas</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie os estabelecimentos cadastrados.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => nav(`/weaze/empresas/${r.id}`)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted transition-colors"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand font-bold text-sm">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.city ?? "—"}</div>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground text-right">
                  <div>{r.plan}</div>
                  <div className="font-mono">R$ {Number(r.monthlyFee).toLocaleString("pt-BR")}</div>
                </div>
                <Badge variant={statusColor[r.status] ?? "outline"} className="shrink-0">
                  {statusLabel[r.status] ?? r.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && !loading && (
              <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma empresa encontrada.</p>
            )}
            {loading && (
              <p className="p-6 text-sm text-muted-foreground text-center">Carregando...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
