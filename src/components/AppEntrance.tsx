import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isPWA, hasVisitedBefore, markAsVisited } from "@/utils/isPWA";

interface AppEntranceProps {
  children: React.ReactNode;
}

export default function AppEntrance({ children }: AppEntranceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, combinedLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (combinedLoading) return;
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
    }
  }, [combinedLoading, user, location.pathname]);

  return <>{children}</>;
}