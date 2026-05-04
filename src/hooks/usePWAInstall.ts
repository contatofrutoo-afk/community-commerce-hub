import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Cache the event globally so it survives across mounts/route changes
let cachedPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event('pwa-installable'));
  });
  window.addEventListener('appinstalled', () => {
    cachedPrompt = null;
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [installed, setInstalled] = useState<boolean>(isStandalone());

  useEffect(() => {
    const onAvail = () => setDeferredPrompt(cachedPrompt);
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    window.addEventListener('pwa-installable', onAvail);
    window.addEventListener('pwa-installed', onInstalled);
    // Pick up cached prompt if it fired before mount
    if (cachedPrompt && !deferredPrompt) setDeferredPrompt(cachedPrompt);

    console.log('[PWA] canInstall:', !!cachedPrompt, '| iOS:', isIOS(), '| standalone:', isStandalone());

    return () => {
      window.removeEventListener('pwa-installable', onAvail);
      window.removeEventListener('pwa-installed', onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('[PWA] outcome:', choice.outcome);
      cachedPrompt = null;
      setDeferredPrompt(null);
      return;
    }
    if (isIOS()) {
      alert('Para instalar: toque em Compartilhar e em "Adicionar à Tela de Início".');
    }
  };

  // Show button if native prompt available, OR iOS Safari (no native prompt support) — but never if already installed
  const canInstall = !installed && (!!deferredPrompt || isIOS());

  return { canInstall, install };
}
