import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.dev");

// Register service worker with proper error handling
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (isInIframe || isPreviewHost) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
}

// Handle beforeinstallprompt to show install button
let deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Clear old caches on update
if ('caches' in window) {
  caches.keys().then((cacheNames) => {
    const oldCaches = cacheNames.filter(name => !name.startsWith('weaze-v'));
    Promise.all(oldCaches.map(name => caches.delete(name)));
  });
}

registerServiceWorker();

// Notify app when SW updates are ready
let swRegistration: ServiceWorkerRegistration | null = null;
function triggerUpdate(registration: ServiceWorkerRegistration) {
  swRegistration = registration;
  window.dispatchEvent(new CustomEvent('sw-update-ready'));
}

if ('serviceWorker' in navigator && !isInIframe && !isPreviewHost) {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              triggerUpdate(registration);
            }
          });
        }
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
