import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, User, LayoutGrid, BarChart3, MessageSquareText, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isB2B } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    ...(isB2B ? [{ to: "/content", icon: LayoutGrid, label: "Criar" }] : []),
    { to: "/community", icon: MessageSquare, label: "Conversas" },
    { to: "/topics", icon: MessageSquareText, label: "Tópicos" },
    { to: "/notifications", icon: Bell, label: "Notificações" },
    { to: "/messages", icon: MessageCircle, label: "Msgs" },
    ...(isB2B ? [{ to: "/metrics", icon: BarChart3, label: "Métricas" }] : []),
    { to: "/profile", icon: User, label: "Perfil" },
  ];

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const containerWidth = container.offsetWidth;
      const activeLeft = active.offsetLeft;
      const activeWidth = active.offsetWidth;

      if (activeLeft < container.scrollLeft || activeLeft + activeWidth > container.scrollLeft + containerWidth) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
      <div
        className={cn(
          "relative mx-auto max-w-xl",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-6 before:bg-gradient-to-r before:from-background before:to-transparent before:z-10 before:pointer-events-none",
          "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-background after:to-transparent after:z-10 after:pointer-events-none",
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "flex items-center gap-1 px-2 py-2 overflow-x-auto",
            "scroll-smooth snap-x snap-mandatory",
            "[-webkit-overflow-scrolling:touch] [scrollbar-width:none]",
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map(({ to, icon: Icon, label }) => {
            const active =
              pathname === to ||
              (to !== "/feed" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                ref={active ? activeRef : null}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-shrink-0",
                  "min-w-[64px] max-w-[80px] px-2 py-1.5 rounded-lg",
                  "text-[10px] transition-all snap-center",
                  active
                    ? "text-primary-custom bg-primary-custom/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 flex-shrink-0", active && "text-primary-custom")}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="font-medium truncate w-full text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`
        .BottomNav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}