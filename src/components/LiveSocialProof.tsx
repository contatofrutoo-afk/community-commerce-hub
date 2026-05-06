import { useState, useEffect } from "react";

const fakeUsers = [
  "ana", "carlos", "marina", "joao",
  "fernanda", "lucas", "beatriz", "rafael",
  "juliana", "pedro", "camila", "bruno"
];

export default function LiveSocialProof() {
  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let showTimeout: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;
    let nextTimeout: NodeJS.Timeout;

    const showNotification = () => {
      const randomName = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      setName(randomName);
      setIsVisible(true);

      showTimeout = setTimeout(() => {
        setIsVisible(false);
        
        nextTimeout = setTimeout(() => {
          setName("");
          showNotification();
        }, 6000 + Math.random() * 4000);
      }, 4000);
    };

    const initialDelay = 3000 + Math.random() * 2000;
    const initialTimeout = setTimeout(showNotification, initialDelay);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: 40,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 500ms ease-out, transform 500ms ease-out",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        minWidth: "220px",
        maxWidth: "280px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
        }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(to bottom right, #630091, #d81e62)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                {name ? name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              border: "2px solid white",
            }}></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Novo membro</p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {name ? <><span style={{ color: "#630091" }}>@</span>{name} entrou na comunidade</> : "..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}