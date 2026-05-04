import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link2, Copy, ExternalLink, Share2, Plus, Users, MousePointerClick, UserPlus, LogIn, Loader2 } from "lucide-react";

type EventStats = {
  visits: number;
  signups: number;
  logins: number;
  total: number;
};

type CampaignStats = {
  campaign: string;
  visits: number;
  signups: number;
}[];

export default function InviteLinks() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<EventStats>({ visits: 0, signups: 0, logins: 0, total: 0 });
  const [campaignStats, setCampaignStats] = useState<CampaignStats>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [ref, setRef] = useState("");
  const [campaign, setCampaign] = useState("");
  const [generating, setGenerating] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.weaze.app";
  const brandSlug = tenant?.slug || "sua-marca";
  const inviteUrl = `${baseUrl}/m/${brandSlug}${ref || campaign ? "?" : ""}${ref ? `ref=${encodeURIComponent(ref)}` : ""}${ref && campaign ? "&" : ""}${campaign ? `campaign=${encodeURIComponent(campaign)}` : ""}`;

  useEffect(() => {
    if (!tenant) return;
    loadStats();
  }, [tenant?.id]);

  const loadStats = async () => {
    if (!tenant) return;
    setLoading(true);

    const [eventsData, campaignData] = await Promise.all([
      supabase
        .from("invite_link_events")
        .select("event_type")
        .eq("tenant_id", tenant.id),

      supabase
        .from("invite_link_events")
        .select("event_type, campaign")
        .eq("tenant_id", tenant.id)
        .not("campaign", "is", null),
    ]);

    const events = eventsData.data || [];
    const campaigns = campaignData.data || [];

    const visits = events.filter(e => e.event_type === "visit").length;
    const signups = events.filter(e => e.event_type === "signup").length;
    const logins = events.filter(e => e.event_type === "login").length;

    setStats({ visits, signups, logins, total: events.length });

    // Aggregate by campaign
    const campaignMap: Record<string, { visits: number; signups: number }> = {};
    campaigns.forEach(e => {
      if (!e.campaign) return;
      if (!campaignMap[e.campaign]) {
        campaignMap[e.campaign] = { visits: 0, signups: 0 };
      }
      if (e.event_type === "visit") campaignMap[e.campaign].visits++;
      if (e.event_type === "signup") campaignMap[e.campaign].signups++;
    });

    setCampaignStats(
      Object.entries(campaignMap)
        .map(([campaign, data]) => ({ campaign, ...data }))
        .sort((a, b) => b.visits - a.visits)
    );

    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Entre na comunidade de ${tenant?.name}`,
        text: `Participe da comunidade de ${tenant?.name}`,
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleOpenLink = () => {
    window.open(inviteUrl, "_blank");
  };

  const handleGenerate = async () => {
    if (!ref && !campaign) {
      toast.error("Preencha ref ou campanha");
      return;
    }
    setGenerating(true);
    toast.success("Link personalizado criado!");
    setGenerating(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">Convide sua comunidade</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compartilhe o link da sua marca e acompanhe os resultados.
        </p>
      </div>

      {/* Main Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteUrl}
              className="font-mono text-sm"
            />
            <Button onClick={handleCopy} variant="outline" size="icon">
              {copied ? <Users className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={handleOpenLink} variant="outline" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button onClick={handleShare} variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenLink} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir link
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Gerar link personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem (ref)</Label>
              <Input
                placeholder="ex: instagram, email, whatsapp"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Input
                placeholder="ex: lancamento, black-friday"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
              />
            </div>
          </div>

          {ref || campaign ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link gerado:</p>
              <code className="text-xs break-all">{inviteUrl}</code>
            </div>
          ) : null}

          <Button onClick={handleGenerate} disabled={!ref && !campaign}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Gerar link personalizado
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">Visitas</span>
            </div>
            <p className="text-2xl font-display">{stats.visits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserPlus className="h-4 w-4" />
              <span className="text-xs">Cadastros</span>
            </div>
            <p className="text-2xl font-display">{stats.signups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <LogIn className="h-4 w-4" />
              <span className="text-xs">Logins</span>
            </div>
            <p className="text-2xl font-display">{stats.logins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-display">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Stats */}
      {campaignStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaignStats.map((c) => (
                <div key={c.campaign} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{c.campaign}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.visits} visitas · {c.signups} cadastros
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display">
                      {c.signups > 0 ? Math.round((c.signups / c.visits) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">conversão</p>
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