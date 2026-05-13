import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { isPWA, hasVisitedBefore, markAsVisited } from "@/utils/isPWA";

interface AppEntranceProps {
  children: React.ReactNode;
}

export default function AppEntrance({ children }: AppEntranceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (authLoading || tenantLoading) return;
    if (hasRedirected.current) return;
    
    const isAuthPage = location.pathname === "/auth";
    const isLanding = location.pathname === "/";
    const isWaiting = location.pathname === "/waiting";
    const isPublicPage = isAuthPage || isLanding || isWaiting || location.pathname.startsWith("/m") || location.pathname.startsWith("/c") || location.pathname.startsWith("/community");
    
    if (isPublicPage) return;
    
    const visited = hasVisitedBefore();
    const isStandalone = isPWA();

    if (!visited && isStandalone) {
      markAsVisited();
      
      if (user && tenant) {
        hasRedirected.current = true;
        navigate("/feed", { replace: true });
      } else if (user && !tenant && isLanding) {
        hasRedirected.current = true;
        navigate("/auth", { replace: true });
      }
    } else if (!visited) {
      markAsVisited();
    }
  }, [authLoading, tenantLoading, user, tenant, location.pathname]);

  return <>{children}</>;
}