import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading, isB2B } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  // B2B vai para feed; B2C também vai para feed (comunidade por invite)
  return <Navigate to={user ? "/feed" : "/"} replace />;
}
