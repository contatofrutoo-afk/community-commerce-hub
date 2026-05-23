import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import PWAInstallButton from "@/components/PWAInstallButton";

export default function TopBar() {
  const { tenant } = useTenant();
  const { isB2C } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/feed");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-xl flex items-center gap-1 px-3 h-14">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Logo size={82} />
        {tenant && (
          <>
            <div className="h-7 w-7 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">{tenant.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="font-display text-lg leading-none truncate">{tenant.name}</span>
          </>
        )}
        {isB2C && <PWAInstallButton />}
      </div>
    </header>
  );
}
