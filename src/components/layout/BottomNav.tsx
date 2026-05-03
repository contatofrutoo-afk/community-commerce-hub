import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, MessageCircle, User, LayoutGrid, BarChart3, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isB2B } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const items = [
    { to: "/feed", icon: Home, label: "Feed" },
    ...(isB2B ? [{ to: "/content", icon: Plus, label: "Criar", special: true }] : []),
    { to: "/conversas", icon: MessageSquare, label: "Conversas" },
    { to: "/notifications", icon: Bell, label: "Notificações" },
    { to: "/messages", icon: MessageCircle, label: "Msgs" },
    ...(isB2B ? [{ to: "/metrics", icon: BarChart3, label: "Métricas" }] : []),
    { to: "/profile", icon: User, label: "Perfil" },
  ];

  useEffect(() => {
    if (activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      const container = scrollRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setIndicatorStyle({
          left: rect.left - containerRect.left + container.scrollLeft + 4,
          width: rect.width - 8,
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const active = activeRef.current;
      const container = scrollRef.current;
      const containerWidth = container.offsetWidth;
      const activeLeft = active.offsetLeft;
      const activeWidth = active.offsetWidth;

      if (activeLeft < container.scrollLeft || activeLeft + activeWidth > container.scrollLeft + containerWidth) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [pathname]);

  const isActive = (to: string) => 
    pathname === to || (to !== "/feed" && pathname.startsWith(to));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
      <div
        className={cn(
          "relative mx-auto max-w-xl",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-5 before:bg-gradient-to-r before:from-background before:to-transparent before:z-10 before:pointer-events-none",
          "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-5 after:bg-gradient-to-l after:from-background after:to-transparent after:z-10 after:pointer-events-none",
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "flex items-center gap-0.5 px-1 py-2 overflow-x-auto",
            "scroll-smooth snap-x snap-mandatory",
            "[-webkit-overflow-scrolling:touch]",
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map(({ to, icon: Icon, label, special }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                ref={active ? activeRef : null}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-shrink-0",
                  special ? "px-3" : "min-w-[56px] max-w-[72px] px-1.5",
                  "py-1.5 rounded-lg transition-all snap-center",
                  active
                    ? "text-primary-custom"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <div 
                    className="absolute inset-0 bg-primary-custom/10 rounded-lg -z-10" 
                    style={{
                      position: 'absolute',
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    special && "h-6 w-6",
                    active && "text-primary-custom"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className={cn(
                  "font-medium truncate w-full text-center text-[10px]",
                  special && "text-xs"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}