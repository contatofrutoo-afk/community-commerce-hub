import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SessionTimeoutGuard() {
  const { user, sessionExpiresAt, sessionWarning, signOut } = useAuth();
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!sessionExpiresAt || !user) {
      setExpired(false);
      setCountdown("");
      return;
    }

    const tick = () => {
      const remaining = sessionExpiresAt - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        setCountdown("00:00");
        signOut().then(() => navigate("/auth", { replace: true }));
        return;
      }
      setCountdown(formatTimeRemaining(remaining));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt, user, signOut, navigate]);

  if (!user || !sessionExpiresAt) return null;

  return (
    <>
      <AlertDialog open={sessionWarning && !expired}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Sessao expira em breve
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Sua sessao sera encerrada automaticamente em:
              </p>
              <div className="text-4xl font-mono font-bold text-orange-500 tracking-wider">
                {countdown}
              </div>
              <p className="text-xs text-muted-foreground">
                Salve seu trabalho. Apos o encerramento, sera necessario acessar novamente via QR code ou link.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut();
                navigate("/auth", { replace: true });
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair agora
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={expired}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="w-5 h-5" />
              Sessao encerrada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <p className="text-sm text-muted-foreground">
                Sua sessao expirou apos 7 horas de uso.
                Acesse novamente escaneando o QR code ou usando o link.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              className="w-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Ir para o login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
