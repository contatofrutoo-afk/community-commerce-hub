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
    console.log("=== TENANTCONTEXT LOAD START ===");
    console.log("User:", user?.id);
    setLoading(true);
    
    if (!user) {
      console.log("SEM USER - limpando tudo");
      setTenants([]);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
      setLoading(false);
      return;
    }
    
    console.log("Buscando memberships para user:", user.id);
    const { data: mems, error: memsError } = await supabase
      .from("memberships")
      .select("tenant_id, role, tenants(*)")
      .eq("user_id", user.id);
    
    console.log("MEMBERSHIPS RAW:", mems);
    console.log("MEMBERSHIPS ERROR:", memsError);
    console.log("MEMBERSHIPS COUNT:", mems?.length);
    
    if (memsError) {
      console.log("ERRO NAS MEMBERSHIPS:", memsError.message);
      setLoading(false);
      return;
    }
    
    // Fallback: se join não retornou tenants, buscar diretamente
    let list = (mems ?? []).map((m: unknown) => (m as { tenants: Tenant })?.tenants).filter(Boolean) as Tenant[];
    
    // Se list vazia mas tem memberships, buscar tenant separadamente
    if (list.length === 0 && mems && mems.length > 0) {
      console.log("FALLBACK: buscando tenants separadamente");
      const tenantIds = mems.map((m: any) => m.tenant_id);
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, city, phone, bio")
        .in("id", tenantIds);
      
      if (tenantData) {
        list = tenantData as Tenant[];
        console.log("FALLBACK OK:", list.length, "tenants");
      }
    }
    console.log("TENANTS LIST:", list);
    
    const roles: TenantRoles = {} as TenantRoles;
    (mems ?? []).forEach((m: unknown) => {
      const membership = m as { tenant_id: string; role: "owner" | "admin" | "member" };
      roles[membership.tenant_id] = membership.role;
    });
    console.log("ROLES:", roles);
    
    setMemRoles(roles);
    setTenants(list);
    
    // Determine target tenant quickly
    const justJoinedId = sessionStorage.getItem("just_joined_community");
    const savedId = localStorage.getItem("weaze:active_tenant");
    console.log("justJoinedId:", justJoinedId);
    console.log("savedId (localStorage):", savedId);
    
    let targetId: string | null = justJoinedId || savedId || (list[0]?.id ?? null);
    console.log("targetId inicial:", targetId);
    
    // Validate targetId exists in list
    if (!list.find(t => t.id === targetId)) {
      console.log("targetId não encontrado na lista, usando primeiro tenant");
      targetId = list[0]?.id ?? null;
    }
    console.log("targetId final:", targetId);
    
    if (targetId && roles[targetId]) {
      const targetRole = roles[targetId];
      console.log("✓ SETANDO TENANT:", targetId, "role:", targetRole);
      const tenantObj = list.find(t => t.id === targetId);
      console.log("Tenant object:", tenantObj);
      setTenant(tenantObj!);
      setIsOwner(targetRole === "owner");
      setCanManage(targetRole === "owner" || targetRole === "admin");
      if (justJoinedId) {
        sessionStorage.removeItem("just_joined_community");
        localStorage.setItem("weaze:active_tenant", targetId);
      }
    } else {
      console.log("✗ SEM TENANT - setTenant(null)");
      console.log("targetId:", targetId);
      console.log("roles[targetId]:", targetId ? roles[targetId] : "N/A");
      console.log("list.length:", list.length);
      setTenant(null);
      setIsOwner(false);
      setCanManage(false);
    }
    
    setLoading(false);
    console.log("=== TENANTCONTEXT LOAD END ===");
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selectTenant = (id: string) => {
    const t = tenants.find((x) => x.id === id);
    if (!t) return;
    const role = memRoles[id];
    setTenant(t);
    setIsOwner(role === "owner");
    setCanManage(role === "owner" || role === "admin");
    localStorage.setItem("weaze:active_tenant", id);
  };

  return (
    <Ctx.Provider value={{ tenant, tenants, isOwner, canManage, loading, selectTenant, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);