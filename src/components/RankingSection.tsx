import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy, Star, Gift } from "lucide-react";
import type { RankingEntry, TenantReward } from "@/lib/gamification";

function Medals({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-xs font-mono text-muted-foreground w-6 text-center">#{rank}</span>;
}

function RankRow({ e, highlight }: { e: RankingEntry; highlight?: boolean }) {
  const initials = e.name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-2xl transition-all", highlight && "bg-amber-50 border border-amber-200", e.rank <= 3 && "bg-gradient-to-r from-amber-50/50 to-transparent")}>
      <Medals rank={e.rank} />
      <Avatar className={cn("h-10 w-10", e.rank === 1 && "h-12 w-12 ring-2 ring-amber-400")}>
        <AvatarImage src={e.avatar_url || ""} />
        <AvatarFallback className={cn("text-sm", e.rank === 1 && "bg-amber-100 text-amber-800 text-base")}>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold truncate", e.rank === 1 && "text-base")}>{e.rank === 1 && "👑 "}{e.name}</p>
        {(e.city || e.state) && <p className="text-xs text-muted-foreground">{e.city}{e.state ? ` - ${e.state}` : ""}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("text-base font-bold", e.rank <= 3 ? "text-amber-600" : "text-foreground")}>{e.points.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 p-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-12 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function RankingSection({ period = "monthly" }: { period?: "monthly" | "yearly" }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [monthly, setMonthly] = useState<RankingEntry[]>([]);
  const [yearly, setYearly] = useState<RankingEntry[]>([]);
  const [rewards, setRewards] = useState<TenantReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) {
      setMonthly([]);
      setYearly([]);
      setRewards([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        const excludeId = user?.id ?? null;
        const [{ data: m, error: mErr }, { data: y, error: yErr }, { data: rw, error: rwErr }] = await Promise.all([
          supabase.rpc("get_monthly_ranking", { p_tenant_id: tenant.id, p_limit: 10, p_exclude_user_id: excludeId }),
          supabase.rpc("get_yearly_ranking", { p_tenant_id: tenant.id, p_limit: 10, p_exclude_user_id: excludeId }),
          supabase.from("tenant_rewards").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("min_position"),
        ]);
        
        if (mErr || yErr) {
          console.error("RankingSection RPC error:", mErr || yErr);
          setError("Erro ao carregar ranking");
          return;
        }
        
        setMonthly((m as any[] || []).map((r: any) => ({ rank: r.rank ?? 0, user_id: r.user_id ?? "", name: r.name ?? "Usuário", avatar_url: r.avatar_url ?? null, city: r.city ?? null, state: r.state ?? null, points: r.monthly_points ?? 0 })));
        setYearly((y as any[] || []).map((r: any) => ({ rank: r.rank ?? 0, user_id: r.user_id ?? "", name: r.name ?? "Usuário", avatar_url: r.avatar_url ?? null, city: r.city ?? null, state: r.state ?? null, points: r.yearly_points ?? 0 })));
        setRewards((rw as any[]) || []);
      } catch (e) { 
        console.error("RankingSection:", e);
        setError("Erro ao carregar ranking");
      } finally { 
        setLoading(false); 
      }
    })();
  }, [tenant?.id, user?.id]);

  const entries = period === "monthly" ? monthly : yearly;
  const label = period === "monthly" ? "do Mês" : "do Ano";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-lg">Ranking {label}</h3>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div className="text-center py-8 text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ninguém no ranking ainda</p>
          <p className="text-xs">Incentive membros a participarem!</p>
        </div>
      ) : (
        <div className="space-y-1">{entries.map(e => <RankRow key={e.user_id} e={e} highlight={e.rank === 1} />)}</div>
      )}

      {rewards.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-brand" />
            <h4 className="font-display text-base">Premiação</h4>
          </div>
          <div className="space-y-2">
            {rewards.map(r => (
              <div key={r.id} className="flex items-start gap-2 p-3 bg-brand/5 rounded-xl border border-brand/10">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  {r.min_position && <p className="text-xs text-brand mt-1">Top {r.min_position} pontuam</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}