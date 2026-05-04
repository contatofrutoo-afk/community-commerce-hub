import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import PWAInstallButton from "@/components/PWAInstallButton";
import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  ProductSection,
  CTASection,
} from "@/components/landing";

export default function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={120} />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <ProductSection />
      <CTASection />

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} weaze</span>
          <span>Construído como infraestrutura.</span>
        </div>
      </footer>
    </main>
  );
}