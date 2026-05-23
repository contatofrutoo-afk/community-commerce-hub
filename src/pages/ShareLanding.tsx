import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Loader2, Video } from "lucide-react";
import { toast } from "sonner";

type SharedPost = {
  id: string;
  type: "video" | "image" | "text";
  media_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  profiles?: { name: string; avatar_url: string | null } | null;
};

type ShareTenant = {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
};

export default function ShareLanding() {
  const { tenantId, postId } = useParams<{ tenantId: string; postId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refresh, selectTenant } = useTenant();

  const [post, setPost] = useState<SharedPost | null>(null);
  const [tenant, setTenant] = useState<ShareTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!tenantId || !postId) return;
    setLoading(true);

    (async () => {
      const [postRes, tenantRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, type, media_url, thumbnail_url, description, profiles(name, avatar_url)")
          .eq("id", postId)
          .eq("tenant_id", tenantId)
          .single(),
        supabase
          .from("tenants")
          .select("id, name, logo_url, slug")
          .eq("id", tenantId)
          .single(),
      ]);

      if (postRes.error || !postRes.data) {
        setError("Post não encontrado");
        setLoading(false);
        return;
      }
      if (tenantRes.error || !tenantRes.data) {
        setError("Comunidade não encontrada");
        setLoading(false);
        return;
      }

      setPost(postRes.data as SharedPost);
      setTenant(tenantRes.data as ShareTenant);

      if (!user) {
        localStorage.setItem("weaze:pending_share", JSON.stringify({ tenantId, postId }));
      }

      setLoading(false);
    })();
  }, [tenantId, postId, user]);

  useEffect(() => {
    if (!user || !tenant || !post || authLoading || processing) return;

    let cancelled = false;

    (async () => {
      try {
        const { data: existing } = await supabase
          .from("memberships")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          setProcessing(true);
          const { error: mErr } = await supabase.from("memberships").insert({
            tenant_id: tenant.id,
            user_id: user.id,
            role: "member",
          });
          if (cancelled) return;
          if (mErr) {
            console.error("[ShareLanding] Membership error:", mErr);
            toast.error("Erro ao entrar na comunidade");
            setProcessing(false);
            return;
          }
        }

        localStorage.setItem("weaze:active_tenant", tenant.id);
        localStorage.setItem("weaze:last_active_tenant", tenant.id);
        localStorage.removeItem("weaze:pending_share");

        await refresh();
        if (cancelled) return;
        selectTenant(tenant.id, true);

        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (localStorage.getItem("weaze:active_tenant") === tenant.id) {
              clearInterval(check);
              resolve();
            }
          }, 50);
          setTimeout(() => { clearInterval(check); resolve(); }, 3000);
        });

        if (!cancelled) {
          if (!existing) toast.success(`Bem-vindo à ${tenant.name}!`);
          navigate(`/feed?post=${postId}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ShareLanding] Error:", err);
          toast.error("Erro ao processar");
          setProcessing(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user, tenant, post, authLoading, processing, refresh, selectTenant, navigate, postId]);

  const handleAuth = (isSignUp: boolean) => {
    localStorage.setItem("weaze:pending_share", JSON.stringify({ tenantId, postId }));
    navigate(`/auth${isSignUp ? "?mode=signup" : ""}`);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !post || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">Conteúdo não encontrado</h1>
          <p className="text-muted-foreground mb-6">{error || "Este post pode ter sido removido."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-brand text-primary-foreground hover:opacity-90 px-6 py-3 rounded-full font-medium transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">{processing ? "Entrando na comunidade..." : "Redirecionando..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-center gap-3 pt-8 pb-4">
        {tenant.logo_url ? (
          <img src={tenant.logo_url} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-primary-foreground font-bold text-lg">
            {tenant.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Compartilhado por</p>
          <p className="font-semibold">{tenant.name}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-muted shadow-lg">
          {post.type === "video" && post.media_url ? (
            <img
              src={post.thumbnail_url || post.media_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : post.type === "image" && post.media_url ? (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand flex items-center justify-center p-6">
              <p className="text-primary-foreground text-center text-lg">{post.description}</p>
            </div>
          )}
        </div>
      </div>

      {post.description && (
        <p className="text-center text-sm text-muted-foreground px-6 pb-4 line-clamp-2">
          {post.description}
        </p>
      )}

      <div className="px-6 pb-10 space-y-3 max-w-sm mx-auto w-full">
        <button
          onClick={() => handleAuth(true)}
          className="w-full bg-brand text-primary-foreground hover:opacity-90 px-8 py-4 rounded-full font-semibold text-lg transition-all"
        >
          Criar conta para ver
        </button>
        <button
          onClick={() => handleAuth(false)}
          className="w-full border-2 border-border bg-card hover:bg-secondary/50 px-8 py-4 rounded-full font-semibold text-lg transition-all"
        >
          Já tenho conta - Entrar
        </button>
      </div>
    </div>
  );
}
