import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isPWA, hasVisitedBefore, markAsVisited } from "@/utils/isPWA";

interface AppEntranceProps {
  children: React.ReactNode;
}

export default function AppEntrance({ children }: AppEntranceProps) {
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
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
  }, [location.pathname]);

  return <>{children}</>;
}