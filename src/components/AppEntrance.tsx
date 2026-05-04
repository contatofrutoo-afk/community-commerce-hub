import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isPWA, hasVisitedBefore, markAsVisited } from "@/utils/isPWA";

interface AppEntranceProps {
  children: React.ReactNode;
}

export default function AppEntrance({ children }: AppEntranceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (loading) return;

    const visited = hasVisitedBefore();
    const isStandalone = isPWA();

    const isAuthPage = location.pathname === "/auth";
    const isLanding = location.pathname === "/";

    if (!visited && isStandalone && !isAuthPage) {
      markAsVisited();
      
      if (user) {
        navigate("/feed", { replace: true });
      } else if (isLanding) {
        navigate("/auth", { replace: true });
      }
    } else if (!visited) {
      markAsVisited();
    }
    
    setProcessed(true);
  }, [loading, user, location.pathname]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}