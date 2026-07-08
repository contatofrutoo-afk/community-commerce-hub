import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BarChart3, Building2, DollarSign, FileText, Settings, TrendingUp, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/weaze", icon: BarChart3, label: "Dashboard", end: true },
  { to: "/weaze/empresas", icon: Building2, label: "Empresas" },
  { to: "/weaze/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/weaze/licencas", icon: FileText, label: "Licenças" },
  { to: "/weaze/metricas", icon: TrendingUp, label: "Métricas" },
  { to: "/weaze/configuracoes", icon: Settings, label: "Configurações" },
];

export default function WeazeLayout() {
  const { isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  if (!isAdmin) {
    nav("/feed");
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden md:flex w-60 bg-background border-r border-border flex-col p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-brand grid place-items-center text-primary-foreground font-bold">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-display text-xl">WEAZE Admin</span>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={!!end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="justify-start">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b border-border bg-background px-4 h-14 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {items.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={!!end}
              className={({ isActive }) => cn("shrink-0 text-xs px-3 py-1.5 rounded-full",
                isActive ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>
              {label}
            </NavLink>
          ))}
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
