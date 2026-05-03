import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Play, Plus, MessageCircle, BarChart3, X, ChevronRight, ChevronLeft, Check, Sparkles, Target, TrendingUp } from "lucide-react";

const STEPS_B2B = [
  { 
    icon: Play, 
    title: "Publique seu primeiro vídeo", 
    desc: "Crie conteúdo imersivo que engaja sua audiência. Vídeos curtos funcionam melhor!",
    action: "create",
    path: "/create"
  },
  { 
    icon: Target, 
    title: "Adicione um CTA", 
    desc: "Coloque chiamadas para ação claras: comprar, agendar, solicitar orçamento.",
    action: "cta",
    path: "/create"
  },
  { 
    icon: MessageCircle, 
    title: "Inicie conversas", 
    desc: "Crie tópicos para engajar sua comunidade em discussões.",
    action: "conversas",
    path: "/conversas"
  },
  { 
    icon: TrendingUp, 
    title: "Acompanhe resultados", 
    desc: "Monitor suas métricas e veja o crescimento da sua comunidade.",
    action: "metrics",
    path: "/metrics"
  },
];

const STEPS_B2C = [
  { icon: Play, title: "Assista vídeos", desc: "Navegue pelo feed swipando. Vídeos tocam automaticamente." },
  { icon: MessageCircle, title: "Interaja", desc: "Curta, comente e compartilhe com a comunidade." },
  { icon: Sparkles, title: "Conexão", desc: "Entre em comunidades e siga marcas do seu interesse." },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const { tenant, isOwner } = useTenant();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenant) return;
    
    (async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant.id)
        .maybeSingle();
      
      if (!data || !data.completed) {
        if (isOwner) {
          setOpen(true);
        } else {
          const seen = localStorage.getItem("wenity:onboarding_seen");
          if (!seen) {
            setOpen(true);
            localStorage.setItem("wenity:onboarding_seen", "true");
          }
        }
      }
      setLoading(false);
    })();
  }, [user, tenant, isOwner]);

  useEffect(() => {
    if (!open || !user || !tenant) return;
    
    if (step === STEPS_B2B.length) {
      completeOnboarding();
      setOpen(false);
    }
  }, [step]);

  const completeOnboarding = async () => {
    if (!user || !tenant) return;
    
    await supabase.from("onboarding_progress").upsert({
      user_id: user.id,
      tenant_id: tenant.id,
      step_completed: "all",
      completed: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,tenant_id" });
  };

  const markStepComplete = async (stepAction: string) => {
    if (!user || !tenant) return;
    
    await supabase.from("onboarding_progress").upsert({
      user_id: user.id,
      tenant_id: tenant.id,
      step_completed: stepAction,
      completed: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,tenant_id" });
    
    setOpen(false);
    navigate(step);
  };

  const handleNext = () => {
    if (step < STEPS_B2B.length) {
      markStepComplete(STEPS_B2B[step].action);
    }
  };

  if (loading || !open) return null;

  const steps = isOwner ? STEPS_B2B : STEPS_B2C;
  const currentStep = steps[step];
  const Icon = currentStep?.icon || Play;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-background rounded-2xl p-6 border border-border shadow-elevated">
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="grid place-items-center h-20 w-20 rounded-full bg-brand-soft mb-4">
          <Icon className="h-10 w-10 text-primary" />
        </div>

        <h2 className="font-display text-2xl text-center mb-2">
          {isOwner ? "Configure sua marca" : currentStep?.title || "Bem-vindo!"}
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {currentStep?.desc || "Vamos começar!"}
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-brand" : i < step ? "w-1.5 bg-success" : "w-1.5 bg-border"
              }`} 
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="flex-1 py-2.5 px-4 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4 inline mr-1" /> Voltar
            </button>
          )}
          <button 
            onClick={handleNext}
            className="flex-1 py-2.5 px-4 rounded-md bg-brand text-primary-foreground text-sm font-medium"
          >
            {step < steps.length - 1 ? "Próximo" : "Concluir"} <ChevronRight className="h-4 w-4 inline ml-1" />
          </button>
        </div>
        
        {isOwner && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Passo {step + 1} de {steps.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}