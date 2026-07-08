import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WeazeLicencas() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data: licenseData } = await supabase
        .from("company_licenses")
        .select("*, companies!inner(name)")
        .order("created_at", { ascending: false });

      const { data: adminData } = await supabase
        .from("company_admin")
        .select("company_id, plan_type, monthly_fee, status, next_due_date, companies!inner(name)");

      const currentLicenses = (adminData ?? []).map((a: any) => ({
        id: a.company_id,
        companyName: a.companies?.name ?? "?",
        planType: a.plan_type,
        monthlyFee: a.monthly_fee,
        status: a.status === "active" ? "active" : a.status === "trial" ? "active" : a.status,
        endDate: a.next_due_date,
        source: "current",
      }));

      const historicLicenses = (licenseData ?? []).map((l: any) => ({
        id: l.id,
        companyName: l.companies?.name ?? "?",
        planType: l.plan_type,
        monthlyFee: l.monthly_fee,
        status: l.status,
        startDate: l.start_date,
        endDate: l.end_date,
        source: "historic",
      }));

      setLicenses([...currentLicenses, ...historicLicenses].slice(0, 100));
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className={cn("space-y-6", loading && "opacity-50 pointer-events-none")}>
      <div>
        <h1 className="font-display text-3xl">Licenças</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de planos e licenças dos estabelecimentos.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Licenças Ativas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y text-sm">
            {licenses.filter((l) => l.status === "active" || l.source === "current").map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="font-medium">{l.companyName}</span>
                  <span className="text-muted-foreground ml-2">{l.planType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">R$ {Number(l.monthlyFee).toLocaleString("pt-BR")}</span>
                  {l.endDate && <span className="text-xs text-muted-foreground">até {new Date(l.endDate).toLocaleDateString("pt-BR")}</span>}
                  <Badge>{l.status === "active" ? "Ativa" : l.status}</Badge>
                </div>
              </div>
            ))}
            {licenses.filter((l) => l.status === "active" || l.source === "current").length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma licença ativa.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {licenses.filter((l) => l.status !== "active" && l.source !== "current").length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-sm">
              {licenses.filter((l) => l.status !== "active" && l.source !== "current").map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="font-medium">{l.companyName}</span>
                    <span className="text-muted-foreground ml-2">{l.planType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">R$ {Number(l.monthlyFee).toLocaleString("pt-BR")}</span>
                    {l.startDate && <span className="text-xs text-muted-foreground">{new Date(l.startDate).toLocaleDateString("pt-BR")}</span>}
                    <Badge variant="outline">{l.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
