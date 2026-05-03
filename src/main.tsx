import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('✅ Evento PWA disparado! Install disponível.');
  console.log('Plataforma:', navigator.platform);
  console.log('User Agent:', navigator.userAgent);
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalado com sucesso!');
});

createRoot(document.getElementById("root")!).render(<App />);
