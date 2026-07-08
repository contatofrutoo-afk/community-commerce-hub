import { useEffect, useState } from "react";
import { XCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

const BlockedPage = () => {
  const { tenant } = useTenant();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [isCompanyBlock, setIsCompanyBlock] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: admin } = await supabase
        .from("company_admin")
        .select("status")
        .eq("company_id", tenant.id)
        .single();

      if (admin?.status === "blocked") {
        setIsCompanyBlock(true);
        const { data: settings } = await supabase
          .from("admin_settings")
          .select("blocked_message, admin_contact")
          .single();
        setMessage(settings?.blocked_message ?? "");
        setContact(settings?.admin_contact ?? "");
      }
    })();
  }, [tenant?.id]);

  if (isCompanyBlock) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
        <Lock className="mb-4 h-16 w-16 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold text-center">Seu acesso está temporariamente bloqueado</h1>
        <p className="mb-6 text-center text-muted-foreground max-w-md">
          {message || "Seu acesso à plataforma encontra-se temporariamente bloqueado. Para mais informações entre em contato com o administrador da WEAZE."}
        </p>
        {contact && (
          <Button onClick={() => window.location.href = `mailto:${contact}`}>
            Entrar em contato
          </Button>
        )}
        {!contact && (
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Voltar para o início
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <XCircle className="mb-4 h-16 w-16 text-orange-500" />
      <h1 className="mb-2 text-2xl font-bold">Acesso Bloqueado</h1>
      <p className="mb-6 text-center text-muted-foreground max-w-md">
        Você não tem acesso a essa comunidade. Para mais informações, entre em contato com o administrador da comunidade.
      </p>
      <Button onClick={() => window.location.href = "/"}>
        Ir para página inicial
      </Button>
    </div>
  );
};

export default BlockedPage;
