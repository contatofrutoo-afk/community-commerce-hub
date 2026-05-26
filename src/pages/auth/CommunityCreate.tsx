import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import Logo from "@/components/Logo";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

const signupSchema = z.object({
  communityName: z.string().trim().min(2, "Nome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "comunidade";
}

export default function CommunityCreate() {
  const nav = useNavigate();
  const { refreshAppRole } = useAuth();
  const { refresh } = useTenant();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ communityName: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);

    try {
      const slug = slugify(parsed.data.communityName);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/feed/community`,
          data: {
            name: parsed.data.communityName,
            account_type: "b2b",
          },
        },
      });

      if (signUpError) { setLoading(false); toast.error(signUpError.message); return; }
      if (!authData.user) { setLoading(false); toast.error("Erro ao criar usuário"); return; }

      const { error: tenantError } = await supabase.from("tenants").insert({
        name: parsed.data.communityName,
        slug,
        created_by: authData.user.id,
      });
      if (tenantError) { setLoading(false); toast.error(tenantError.message); return; }

      await Promise.all([refresh(), refreshAppRole()]);
      toast.success("Comunidade criada com sucesso!");
      nav("/feed/community", { replace: true });
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Erro inesperado");
    }
  };

  return (
    <main className="min-h-screen bg-background grid place-items-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <Link to="/" className="flex items-center justify-center mb-10">
          <Logo size={160} />
        </Link>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold text-sm">Criar comunidade</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cc-name">Nome da comunidade</Label>
              <Input
                id="cc-name"
                maxLength={80}
                value={form.communityName}
                placeholder="Minha comunidade"
                onChange={(e) => setForm({ ...form, communityName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cc-email">Email</Label>
              <Input
                id="cc-email"
                type="email"
                autoComplete="email"
                value={form.email}
                placeholder="seu@email.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cc-pw">Senha</Label>
              <Input
                id="cc-pw"
                type="password"
                autoComplete="new-password"
                value={form.password}
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-primary-foreground hover:opacity-90"
            >
              {loading ? "Criando…" : "Criar comunidade"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Já possui conta?{" "}
          <Link to="/auth" className="underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
