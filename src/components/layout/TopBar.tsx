import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import PWAInstallButton from "@/components/PWAInstallButton";

export default function TopBar() {
  const { tenant } = useTenant();
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
      <div className="mx-auto max-w-xl flex items-center justify-between px-3 h-14">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {tenant?.logo_url ? (
            <>
              <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-7 rounded-lg object-cover" />
              <span className="font-display text-lg leading-none">{tenant.name}</span>
            </>
          ) : (
            <Logo size={82} />
          )}
        </div>
        <PWAInstallButton />
      </div>
    </header>
  );
}
