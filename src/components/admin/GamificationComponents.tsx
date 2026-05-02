import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingEntry {
  rank_pos: number;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  city: string | null;
  state: string | null;
  points: number;
}

export function RankingSection({ type }: { type: "monthly" | "yearly" }) {
  const { tenant } = useTenant();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    
    const fetchRanking = async () => {
      setLoading(true);
      const rpc = type === "monthly" ? "get_monthly_ranking" : "get_yearly_ranking";
      const { data, error } = await supabase.rpc(rpc, {
        p_tenant_id: tenant.id,
        p_limit: 10,
      });
      
      setLoading(false);
      if (!error && data) {
        setRanking(data);
      }
    };
    
    fetchRanking();
  }, [tenant?.id, type]);

  const getRankIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm font-mono text-muted-foreground">{pos}</span>;
    }
  };

  const getRankStyle = (pos: number) => {
    switch (pos) {
      case 1:
        return "bg-yellow-50 border-yellow-200";
      case 2:
        return "bg-gray-50 border-gray-200";
      case 3:
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-background";
    }
  };

  const title = type === "monthly" ? "Ranking do Mês" : "Ranking do Ano";

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Nenhum participante ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranking.map((entry) => (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              getRankStyle(entry.rank_pos)
            )}
          >
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank_pos)}
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={entry.user_avatar || undefined} />
              <AvatarFallback>
                {entry.user_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{entry.user_name || "Usuário"}</p>
              {(entry.city || entry.state) && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.city}{entry.city && entry.state && " - "}{entry.state}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-bold">{entry.points}</p>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EngagementInsights() {
  const { tenant } = useTenant();
  const [insights, setInsights] = useState<{ metric_name: string; metric_value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    
    const fetchInsights = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_engagement_insights", {
        p_tenant_id: tenant.id,
      });
      
      setLoading(false);
      if (!error && data) {
        setInsights(data);
      }
    };
    
    fetchInsights();
  }, [tenant?.id]);

  const getInsightLabel = (name: string) => {
    const labels: Record<string, string> = {
      total_actions_30d: "Total de ações (30d)",
      feed_engagement_pct: "Engajamento no Feed",
      conversations_engagement_pct: "Engajamento nas Conversas",
      total_members: "Total de membros",
      active_users_30d: "Usuários ativos (30d)",
      cta_clicks_30d: "Cliques em CTA (30d)",
      engagement_rate_pct: "Taxa de engajamento",
    };
    return labels[name] || name;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Insights de Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Insights de Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <span className="text-brand">💡</span> Insights de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.metric_name} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <span className="text-sm font-medium">{getInsightLabel(insight.metric_name)}</span>
            <span className="text-sm font-bold text-brand">{insight.metric_value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RewardSection() {
  const { tenant } = useTenant();
  const [reward, setReward] = useState<{ title: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    
    const fetchReward = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_rewards")
        .select("title, description")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      
      setLoading(false);
      if (!error && data) {
        setReward(data);
      }
    };
    
    fetchReward();
  }, [tenant?.id]);

  if (loading) {
    return null;
  }

  if (!reward) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Premiação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-lg">{reward.title}</p>
        {reward.description && (
          <p className="text-sm opacity-90 mt-1">{reward.description}</p>
        )}
      </CardContent>
    </Card>
  );
}