import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export default function InviteLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { selectTenant, tenant: currentTenant } = useTenant();
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const ref = searchParams.get("ref");
  const campaign = searchParams.get("campaign");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: e } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .single();
      
      if (e || !data) {
        setError("Marca não encontrada");
        setLoading(false);
        return;
      }
      
      setBrand(data);
      
      // Track visit
      await supabase.from("invite_link_events").insert({
        tenant_id: data.id,
        event_type: "visit",
        ref: ref || null,
        campaign: campaign || null,
      });
      
      setLoading(false);
    })();
  }, [slug, ref, campaign]);

  // If user authenticated, redirect to feed of brand
  useEffect(() => {
    if (user && brand && !authLoading && !processing) {
      handleEnter();
    }
  }, [user, brand, authLoading, processing]);

  const handleEnter = async () => {
    if (!brand || !user) return;
    setProcessing(true);
    
    try {
      // Check if user is member of this brand
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("tenant_id", brand.id)
        .eq("user_id", user.id)
        .single();
      
      // If not member, create membership
      if (!membership) {
        await supabase.from("memberships").insert({
          tenant_id: brand.id,
          user_id: user.id,
          role: "member",
        });
        
        // Track signup event
        await supabase.from("invite_link_events").insert({
          tenant_id: brand.id,
          event_type: "signup",
          ref: ref || null,
          campaign: campaign || null,
        });
      } else {
        // Track login event
        await supabase.from("invite_link_events").insert({
          tenant_id: brand.id,
          event_type: "login",
          ref: ref || null,
          campaign: campaign || null,
        });
      }
      
      // Select tenant and redirect
      await selectTenant(brand.id);
      navigate("/feed");
    } catch (err) {
      console.error("Error entering brand:", err);
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-display text-[#1a1a1a] mb-2">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {brand?.logo_url && (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-lg"
          />
        )}
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="font-display text-3xl text-[#1a1a1a] mb-2">
          Você está entrando na comunidade de
        </h1>
        <p className="text-2xl font-display bg-gradient-to-r from-[#630091] via-[#8b2091] to-[#d81e62] bg-clip-text text-transparent mb-8">
          {brand?.name}
        </p>
        
        <p className="text-muted-foreground mb-8">
          Entre ou crie sua conta para acessar a comunidade.
        </p>
        
        <div className="space-y-3">
          {user ? (
            <button
              onClick={handleEnter}
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#630091] via-[#8b2091] to-[#d81e62] text-white hover:opacity-90 shadow-lg px-7 py-4 rounded-full font-medium transition-all disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Entrar na comunidade
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/auth?redirect=/m/${slug}&ref=${ref || ""}&campaign=${campaign || ""}`)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#630091] via-[#8b2091] to-[#d81e62] text-white hover:opacity-90 shadow-lg px-7 py-4 rounded-full font-medium transition-all"
              >
                Criar conta
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate(`/auth?redirect=/m/${slug}&ref=${ref || ""}&campaign=${campaign || ""}`)}
                className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#630091]/20 bg-white hover:bg-[#630091]/5 text-[#630091] hover:border-[#630091]/40 px-7 py-4 rounded-full font-medium transition-all"
              >
                Entrar
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}