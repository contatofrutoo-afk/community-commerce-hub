import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTenant } from "./TenantContext";
import { getMemberStatus, MemberStatus } from "@/lib/communityMembers";

type AccessCtx = {
  memberStatus: MemberStatus;
  canAccess: boolean;
  loading: boolean;
  checkAccess: () => Promise<void>;
};

const Ctx = createContext<AccessCtx>({
  memberStatus: "none",
  canAccess: false,
  loading: true,
  checkAccess: async () => {},
});

export const AccessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("none");
  const [loading, setLoading] = useState(true);

  const canAccess = memberStatus === "approved";

  const checkAccess = async () => {
    if (!user || !tenant) {
      setMemberStatus("none");
      setLoading(false);
      return;
    }

    setLoading(true);
    const status = await getMemberStatus(tenant.id);
    setMemberStatus(status);
    setLoading(false);

    if (status !== "approved") {
      navigate("/c", { 
        replace: true,
        state: { message: status === "pending" ? "Aguardando aprovação" : "Acesso recusado" }
      });
    }
  };

  useEffect(() => {
    if (user && tenant) {
      checkAccess();
    } else {
      setMemberStatus("none");
      setLoading(false);
    }
  }, [user, tenant]);

  return (
    <Ctx.Provider value={{ memberStatus, canAccess, loading, checkAccess }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAccess = () => useContext(Ctx);