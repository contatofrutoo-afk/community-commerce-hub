import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Sparkles } from "lucide-react";

export default function CommunityFeedEmpty() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-brand" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Sua comunidade está pronta!
            </h2>
            <p className="text-sm text-muted-foreground">
              Faça sua primeira postagem para começar a engajar seus membros.
            </p>
          </div>

          <Button asChild className="bg-brand text-primary-foreground hover:opacity-90 px-8">
            <Link to="/create">Criar primeira postagem</Link>
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
