import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
};

type TenantRoles = Record<string, "owner" | "admin" | "member">;

type TenantCtx = {
  tenant: Tenant | null;
  tenants: Tenant[];
  isOwner: boolean;
  canManage: boolean;
  loading: boolean;
  selectTenant: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<TenantCtx>({
  tenant: null, tenants: [], isOwner: false, canManage: false, loading: true,
  selectTenant: () => {}, refresh: async () => {},
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memRoles, setMemRoles] = useState<TenantRoles>({} as TenantRoles);

  const load = useCallback(async () => {
    setLoading(true);
    if (!user) {
      console.log("[TENANT] No user, clearing state");
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
      setLoading(false);
      return;
    }
    console.log("[TENANT] Loading tenants for user:", user.id);
    const { data: mems } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants(*)")
      .eq("user_id", user.id);
    console.log("[TENANT] Memberships raw:", mems);
    const list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
    console.log("[TENANT] Tenants list:", list);
    const roles: TenantRoles = {} as TenantRoles;
    (mems ?? []).forEach((m: unknown) => {
      const membership = m as { tenant_id: string; role: "owner" | "admin" | "member" };
      roles[membership.tenant_id] = membership.role;
    });
    console.log("[TENANT] Roles map:", roles);
    setMemRoles(roles);
    setTenants(list);
    
    // Auto-selecionar tenant - qualquer membro pode gerenciar
    const savedId = localStorage.getItem("wenity:active_tenant");
    console.log("[TENANT] Saved tenant ID:", savedId);
    const targetId = savedId && list.find(t => t.id === savedId) ? savedId : list[0]?.id;
    console.log("[TENANT] Target tenant ID:", targetId);
    const targetRole = targetId ? roles[targetId] : null;
    console.log("[TENANT] Target role:", targetRole);
    if (targetId && targetRole) {
      console.log("[TENANT] Setting tenant:", list.find(t => t.id === targetId));
      setTenant(list.find(t => t.id === targetId)!);
      setIsOwner(targetRole === "owner");
      // Qualquer membro (owner/admin/member) com vínculo pode gerenciar lives
      setCanManage(true);
      if (savedId) localStorage.setItem("wenity:active_tenant", targetId);
    } else {
      console.log("[TENANT] No valid tenant/role, clearing");
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selectTenant = (id: string) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    const role = memRoles[id];
    setTenant(t);
    setIsOwner(role === "owner");
    setCanManage(true); // Qualquer membro pode gerenciar lives
    localStorage.setItem("wenity:active_tenant", id);
  };

  return (
    <Ctx.Provider value={{ tenant, tenants, isOwner, canManage, loading, selectTenant, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);