import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

export default function PWAInstallButton() {
  const { install, canInstall } = usePWAInstall();

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isHTTPS = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
          <Smartphone className="w-3 h-3" />
          <span>Install: {isMobile ? 'Mobile' : 'Desktop'} | {isHTTPS ? 'HTTPS' : 'HTTP'} | {isLocalhost ? 'localhost' : 'prod'}</span>
        </div>
      )}
    </>
  );
}