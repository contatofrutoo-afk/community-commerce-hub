import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceType } from "@/hooks/use-device-type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Building2, Users, DollarSign, Target, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function KPI({ label, value, hint, delta, icon: Icon }: { label: string; value: string; hint?: string; delta?: number; icon?: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          <p className="font-display text-3xl">{value}</p>
        </div>
        {(hint || delta !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {delta !== undefined && (
              <span className={cn("inline-flex items-center text-xs font-medium",
                delta >= 0 ? "text-success" : "text-destructive")}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TenantMetric = {
  id: string;
  name: string;
  mrr: number;
  posts: number;
  users: number;
};

export default function AdminGlobal() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const device = useDeviceType();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    tenants: 0,
    tenantGrowth: 0,
    activeTenants: 0,
    totalUsers: 0,
    userGrowth: 0,
    activeUsers: 0,
    mrr: 0,
    arr: 0,
    mrrGrowth: 0,
    totalPosts: 0,
    totalInteractions: 0,
    ctaPerformance: { buy: 0, schedule: 0, quote: 0, register: 0 },
    conversionRate: 0,
    churn: 0,
    tenantMetrics: [] as TenantMetric[],
    growth30: [] as { date: string; count: number }[],
    alerts: [] as string[],
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/feed");
      return;
    }
    (async () => {
      setLoading(true);
      const now = new Date();
      const dCurrent = new Date(now.getTime() - (period === "7d" ? 7 : period === "30d" ? 30 : 90) * 86400_000).toISOString();
      const dPrev = new Date(now.getTime() - (period === "7d" ? 14 : period === "30d" ? 60 : 180) * 86400_000).toISOString();
      const d1 = new Date(now.getTime() - 86400_000).toISOString();

      const [{ data: allTenants }, { data: tenantStats }, { data: allUsers }, { data: interactions }] = await Promise.all([
        supabase.from("tenants").select("id, name, mrr, created_at, active"),
        supabase.from("tenant_stats").select("*").gte("created_at", dCurrent).order("created_at", { ascending: false }),
        supabase.from("users").select("id, created_at"),
        supabase.from("interactions").select("*").gte("created_at", dCurrent),
      ]);

      const totalTenants = allTenants?.length ?? 0;
      const activeTenants = allTenants?.filter(t => t.active).length ?? 0;
      const totalUsers = allUsers?.length ?? 0;

      const currentMrr = allTenants?.reduce((a, t) => a + (t.mrr ?? 0), 0) ?? 0;
      const arr = currentMrr * 12;

      const uniques = (rows: any[], since: string) => new Set(rows.filter(r => r.created_at >= since).map(r => r.id)).size;
      const dau = uniques(allUsers ?? [], d1);
      const wau = uniques(allUsers ?? [], new Date(now.getTime() - 7 * 86400_000).toISOString());
      const mau = uniques(allUsers ?? [], dCurrent);

      const tenantMetrics: TenantMetric[] = (allTenants ?? []).map(t => ({
        id: t.id,
        name: t.name,
        mrr: t.mrr ?? 0,
        posts: 0,
        users: 0,
      }));

      const totalPosts = (tenantStats ?? []).length;
      const totalInteractions = (interactions ?? []).length;

      const newTenants = allTenants?.filter(t => t.created_at >= dCurrent).length ?? 0;
      const tenantGrowth = totalTenants > 0 ? (newTenants / totalTenants) * 100 : 0;

      const newUsers = allUsers?.filter(u => u.created_at >= dCurrent).length ?? 0;
      const userGrowth = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

      const ctaPerformance = {
        buy: (interactions ?? []).filter(i => i.action_type === "click_cta" && i.cta_type === "BUY").length,
        schedule: (interactions ?? []).filter(i => i.action_type === "click_cta" && i.cta_type === "SCHEDULE").length,
        quote: (interactions ?? []).filter(i => i.action_type === "click_cta" && i.cta_type === "QUOTE").length,
        register: (interactions ?? []).filter(i => i.action_type === "click_cta" && i.cta_type === "REGISTER").length,
      };

      const conversionRate = totalInteractions > 0 
        ? (Object.values(ctaPerformance).reduce((a, b) => a + b, 0) / totalInteractions) * 100 
        : 0;

      const buckets: Record<string, number> = {};
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      for (let i = 0; i < periodDays; i++) {
        const k = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
        buckets[k] = 0;
      }
      (allTenants ?? []).forEach((t) => {
        const k = t.created_at?.slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      const growth30 = Object.entries(buckets).reverse().map(([date, count]) => ({
        date: date.slice(5),
        count,
      }));

      const alerts: string[] = [];
      if (tenantGrowth < 0) alerts.push(`Churn detectado: ${Math.abs(tenantGrowth).toFixed(1)}%`);
      if (activeTenants === 0) alerts.push("Nenhuma marca ativa");

      setData({
        tenants: totalTenants,
        tenantGrowth,
        activeTenants,
        totalUsers,
        userGrowth,
        activeUsers: mau,
        mrr: currentMrr,
        arr,
        mrrGrowth: 0,
        totalPosts,
        totalInteractions,
        ctaPerformance,
        conversionRate,
        churn: 0,
        tenantMetrics,
        growth30,
        alerts,
      });
      setLoading(false);
    })();
    }, [isAdmin, period]);

  if (!isAdmin) return null;

  return (
    <div className={cn(
      device === "mobile" ? "max-w-md mx-auto space-y-4 px-2 py-4" : 
      device === "tablet" ? "max-w-3xl mx-auto space-y-6 px-4 py-6" : 
      "max-w-6xl space-y-6",
      loading && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={device === "mobile" ? "font-display text-2xl" : "font-display text-4xl"}>Painel Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas globais da plataforma.</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-background shadow" : "text-muted-foreground")}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {data.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 space-y-2">
            {data.alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" /> {a}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="MRR" value={`R$ ${data.mrr.toLocaleString("pt-BR")}`} hint="mensal" icon={DollarSign} />
        <KPI label="ARR" value={`R$ ${data.arr.toLocaleString("pt-BR")}`} hint="anual" icon={DollarSign} />
        <KPI label="Marcas" value={data.tenants.toString()} hint={`${data.activeTenants} ativas`} icon={Building2} />
        <KPI label="Usuários" value={data.totalUsers.toString()} delta={data.userGrowth} icon={Users} />
        <KPI label="Posts" value={data.totalPosts.toString()} icon={FileText} />
        <KPI label="Interações" value={data.totalInteractions.toString()} icon={Activity} />
        <KPI label="DAU" value={data.userGrowth.toString()} hint="24h" />
        <KPI label="MAU" value={data.activeUsers.toString()} hint={period} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Performance de CTAs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.ctaPerformance).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium">{type}</span>
                <span className="text-sm text-muted-foreground">{count} cliques</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Taxa de conversão</span>
                <span className="text-sm">{data.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Crescimento de Marcas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.growth30}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {data.tenantMetrics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Receita por Marca</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.tenantMetrics.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-sm">{t.name}</span>
                <span className="text-sm font-mono">R$ {t.mrr.toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}