import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const Offline = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <WifiOff className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-2 text-2xl font-bold">Você está offline</h1>
      <p className="mb-6 text-center text-muted-foreground">
        Verifique sua conexão de internet e tente novamente.
      </p>
      <Button onClick={() => window.location.reload()}>
        Tentar novamente
      </Button>
    </div>
  );
};

export default Offline;