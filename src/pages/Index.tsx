import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading, isB2B } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-muted-foreground">Carregando…</div>;
  // B2B vai para feed; B2C vai para comunidades
  return <Navigate to={user ? (isB2B ? "/feed" : "/communities") : "/"} replace />;
}
