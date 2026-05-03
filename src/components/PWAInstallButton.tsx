import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PWAInstallButton() {
  const { install, canInstall } = usePWAInstall();

  return (
    <>
      {canInstall && (
        <Button
          variant="ghost"
          size="sm"
          onClick={install}
          className="text-muted-foreground"
        >
          <Download className="w-4 h-4 mr-2" />
          Instalar app
        </Button>
      )}
      {!canInstall && (
        <span className="text-xs text-muted-foreground px-2">
          PWA não disponível
        </span>
      )}
    </>
  );
}