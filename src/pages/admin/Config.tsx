import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, ArrowLeft, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function BusinessConfig() {
  const { tenant, isOwner, canManage, refresh } = useTenant();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name ?? "");
    setCity(tenant.city ?? "");
    setPhone(tenant.phone ?? "");
    setBio(tenant.bio ?? "");
    setLogo(tenant.logo_url ?? null);
  }, [tenant?.id]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo deve ser imagem"); return; }
    setLogoFile(f);
    setLogo(URL.createObjectURL(f));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !tenant) return null;
    try {
      const ext = logoFile.name.split(".").pop();
      const path = `${tenant.id}/logo.${ext}`;
      const { error } = await supabase.storage.from("public").upload(path, logoFile, { upsert: true });
      if (error) { toast.error(`Erro ao fazer upload: ${error.message}`); return null; }
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (e: unknown) { toast.error(String(e)); return null; }
  };

  const save = async () => {
    if (!tenant) return;
    if (!isOwner && !canManage) { toast.error("Sem permissão"); return; }
    setLoading(true);

    if (logoFile) {
      const logoUrl = await uploadLogo();
      if (logoUrl) {
        await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id);
      }
      setLogoFile(null);
    }

    const { error } = await supabase.from("tenants").update({
      name: name.trim(),
      city: city.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    }).eq("id", tenant.id);
    if (error) { setLoading(false); toast.error(error.message); return; }

    await refresh();
    setLoading(false);
    toast.success("Configurações salvas");
  };

  if (!tenant) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Building2 className="h-12 w-12 mb-4" />
      <p>Nenhuma marca selecionada.</p>
      <Link to="/feed" className="mt-4 text-sm text-brand hover:underline">Voltar ao início</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/metrics" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl">Configurações do negócio</h1>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-soft">
        <div className="space-y-1.5">
          <Label>Logotipo</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary transition-colors overflow-hidden"
            >
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Upload</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <div className="text-sm text-muted-foreground">
              <p>PNG, JPG ou GIF</p>
              {logo && <p className="text-xs mt-1">Clique para alterar</p>}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-name">Nome do negócio</Label>
          <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-phone">Telefone</Label>
          <Input id="b-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-city">Cidade</Label>
          <Input id="b-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-bio">Biografia</Label>
          <Textarea id="b-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} />
        </div>

        <Button
          onClick={save}
          disabled={loading || (!isOwner && !canManage)}
          className="w-full bg-brand text-primary-foreground hover:opacity-90"
        >
          {loading ? "Salvando…" : "Salvar alterações"}
        </Button>
      </section>
    </div>
  );
}
