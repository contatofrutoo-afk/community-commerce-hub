import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import PWAInstallButton from "@/components/PWAInstallButton";
import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  WhoSection,
  ProductSection,
  ComparisonSection,
  PricingSection,
  CTASection,
} from "@/components/landing";

export default function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={100} />
          </Link>
          <div className="flex items-center gap-2">
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
      <WhoSection />
      <ProductSection />
      <ComparisonSection />
      <PricingSection />
      <CTASection />

      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-5xl px-6 flex justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} weaze</span>
          <span>Infraestrutura para comunidades.</span>
        </div>
      </footer>
    </main>
  );
}