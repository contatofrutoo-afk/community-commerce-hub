import { useState, useEffect } from "react";

const fakeUsers = [
  "ana", "carlos", "marina", "joao",
  "fernanda", "lucas", "beatriz", "rafael",
  "juliana", "pedro", "camila", "bruno"
];

interface SocialNotification {
  name: string;
  visible: boolean;
}

export default function LiveSocialProof() {
  const [notification, setNotification] = useState<SocialNotification | null>(null);
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const initialDelay = 3000 + Math.random() * 2000;
    
    const scheduleNext = () => {
      const interval = 6000 + Math.random() * 4000;
      return setTimeout(() => {
        showNotification();
      }, interval);
    };

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const showNotification = () => {
      let randomName: string;
      do {
        randomName = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      } while (randomName === lastName && fakeUsers.length > 1);
      
      setLastName(randomName);
      setNotification({ name: randomName, visible: true });

      setTimeout(() => {
        setNotification(prev => prev ? { ...prev, visible: false } : null);
      }, 4000);

      setTimeout(() => {
        setNotification(null);
      }, 4500);
    };

    timeoutId = setTimeout(() => {
      showNotification();
      intervalId = scheduleNext();
    }, initialDelay);

    const intervalLoop = setInterval(() => {
      clearTimeout(intervalId);
      intervalId = scheduleNext();
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(intervalId);
      clearInterval(intervalLoop);
    };
  }, [lastName]);

  if (!notification) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ${
        notification.visible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[220px] max-w-[280px]">
        <div className="flex items-center gap-3 p-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {notification.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Novo membro</p>
            <p className="text-sm font-medium text-foreground truncate">
              <span className="text-[#630091]">@</span>{notification.name} entrou na comunidade
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}