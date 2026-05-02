import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface PointNotification {
  id: string;
  points: number;
}

interface PointsFeedbackContextType {
  showPoints: (points: number) => void;
}

const PointsFeedbackContext = createContext<PointsFeedbackContextType | null>(null);

export function usePointsFeedback() {
  const context = useContext(PointsFeedbackContext);
  if (!context) {
    return { showPoints: () => {} };
  }
  return context;
}

export function PointsFeedbackProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PointNotification[]>([]);

  const showPoints = (points: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, points }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <PointsFeedbackContext.Provider value={{ showPoints }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {notifications.map((notif) => (
          <PointsToast 
            key={notif.id} 
            points={notif.points} 
            onComplete={() => removeNotification(notif.id)} 
          />
        ))}
      </div>
    </PointsFeedbackContext.Provider>
  );
}

function PointsToast({ points, onComplete }: { points: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 mb-2 animate-bounce-in"
    >
      <span className="text-lg">+</span>
      <span className="text-xl font-bold">{points}</span>
      <span className="text-xs opacity-90">pts</span>
    </div>
  );
}