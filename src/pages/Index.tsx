import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading, appRole } = useAuth();
  if (loading || (user && !appRole)) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/" replace />;
  // B2B sempre vai para /feed; B2C também (feed mostra comunidade ativa ou redireciona p/ communities se não tiver)
  return <Navigate to="/feed" replace />;
}
