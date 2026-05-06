import { useEffect, useRef, useState, useCallback } from "react";
import { awardPoints, POINTS_CONFIG } from "@/lib/gamification";
import { toast } from "sonner";

type PendingPoint = {
  id: number;
  points: number;
  x: number;
  y: number;
  opacity: number;
};

export function usePointsFeedback(userId: string | undefined, tenantId: string | undefined) {
  const [popups, setPopups] = useState<PendingPoint[]>([]);
  const idRef = useRef(0);

  const showPoints = useCallback(
    (points: number, position?: { x: number; y: number }) => {
      if (!points || points <= 0) return;
      const id = ++idRef.current;
      const popup: PendingPoint = {
        id,
        points,
        x: position?.x ?? Math.random() * 60 + 20,
        y: position?.y ?? Math.random() * 40 + 30,
        opacity: 1,
      };
      setPopups((prev) => [...prev, popup]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 2000);
    },
    []
  );

  useEffect(() => {
    if (popups.length === 0) return;
  }, [popups]);

  return { popups, showPoints };
}

export function useGamifiedAction(
  actionType: Parameters<typeof awardPoints>[2],
  options?: { referenceId?: string; extraPoints?: number }
) {
  const { user, id: userId } = useAuth?.() ?? { user: null, id: undefined };
  const { tenant, id: tenantId } = useTenant?.() ?? { tenant: null, id: undefined };
  const [lastPoints, setLastPoints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const execute = useCallback(async () => {
    if (!userId || !tenantId) return 0;
    const points = await awardPoints(
      userId,
      tenantId,
      actionType,
      options?.referenceId,
      options?.extraPoints
    );
    if (points > 0) {
      setLastPoints(points);
      setShowFeedback(true);
      toast.message(
        <span className="flex items-center gap-2">
          <span className="text-lg">+{points}</span>
          <span className="text-sm opacity-80">pontos</span>
        </span>,
        { duration: 2000 }
      );
      setTimeout(() => setShowFeedback(false), 2000);
    }
    return points;
  }, [userId, tenantId, actionType, options]);

  return { lastPoints, showFeedback, execute };
}

export function PointsToast({ points }: { points: number }) {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none">
      <div
        className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,200,0,0.8)] animate-[float-up_2s_ease-out_forwards]"
        style={{
          animation: "float-up 2s ease-out forwards",
          textShadow: "0 0 30px rgba(255,200,0,0.9)",
        }}
      >
        +{points}
      </div>
    </div>
  );
}