import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Star, TrendingUp, Users, Zap } from "lucide-react";

export type RankingEntry = {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  points: number;
};

type RankingCardProps = {
  entries: RankingEntry[];
  period: "monthly" | "yearly";
  loading?: boolean;
};

function Top3Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-xs font-mono text-muted-foreground w-6 text-center">#{rank}</span>;
}

function RankingRow({ entry, highlight }: { entry: RankingEntry; highlight?: boolean }) {
  const initials = entry.name?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl transition-all",
        highlight && "bg-amber-50 border border-amber-200",
        entry.rank <= 3 && "bg-gradient-to-r from-amber-50/50 to-transparent"
      )}
    >
      <Top3Medal rank={entry.rank} />
      <Avatar className={cn("h-10 w-10", entry.rank === 1 && "h-12 w-12 ring-2 ring-amber-400")}>
        <AvatarImage src={entry.avatar_url || ""} />
        <AvatarFallback className={cn("text-sm", entry.rank === 1 && "bg-amber-100 text-amber-800 text-base")}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold truncate", entry.rank === 1 && "text-base")}>
          {entry.rank === 1 && <span className="mr-1">👑</span>}
          {entry.name}
        </p>
        {(entry.city || entry.state) && (
          <p className="text-xs text-muted-foreground truncate">
            {entry.city}
            {entry.state ? ` - ${entry.state}` : ""}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn("text-base font-bold", entry.rank <= 3 ? "text-amber-600" : "text-foreground")}>
          {entry.points.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[1, 2, 3, 4, 5].map((i) => (
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
  const [monthly, setMonthly] = useState<RankingEntry[]>([]);
  const [yearly, setYearly] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    (async () => {
      try {
        const [{ data: m }, { data: y }] = await Promise.all([
          supabase.rpc("get_monthly_ranking", { p_tenant_id: tenant.id, p_limit: 10 }),
          supabase.rpc("get_yearly_ranking", { p_tenant_id: tenant.id, p_limit: 10 }),
        ]);
        setMonthly(
          (m as any[] || []).map((r) => ({
            rank: r.rank ?? 0,
            user_id: r.user_id ?? "",
            name: r.name ?? "Usuário",
            avatar_url: r.avatar_url ?? null,
            city: r.city ?? null,
            state: r.state ?? null,
            points: r.monthly_points ?? 0,
          }))
        );
        setYearly(
          (y as any[] || []).map((r) => ({
            rank: r.rank ?? 0,
            user_id: r.user_id ?? "",
            name: r.name ?? "Usuário",
            avatar_url: r.avatar_url ?? null,
            city: r.city ?? null,
            state: r.state ?? null,
            points: r.yearly_points ?? 0,
          }))
        );
      } catch (e) {
        console.error("RankingSection error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant?.id]);

  const entries = period === "monthly" ? monthly : yearly;
  const label = period === "monthly" ? "do Mês" : "do Ano";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-lg">Ranking {label}</h3>
      </div>

      {loading ? (
        <RankingSkeleton />
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ninguém no ranking ainda</p>
          <p className="text-xs">Interaja para ganhar pontos!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <RankingRow
              key={entry.user_id}
              entry={entry}
              highlight={entry.rank === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { RankingSection };