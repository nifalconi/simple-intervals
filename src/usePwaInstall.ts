// PWA install prompt hook.
// Captures beforeinstallprompt so the in-app Install button can fire it.
// Works on Chrome/Edge; provides an iOS Safari fallback hint instead.

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __pwa: {
      deferredPrompt: BeforeInstallPromptEvent | null;
      installed: boolean;
    };
    addEventListener(
      type: "beforeinstallprompt",
      listener: (e: BeforeInstallPromptEvent) => void
    ): void;
    addEventListener(
      type: "pwa-availability-change",
      listener: (e: Event) => void
    ): void;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface UsePwaInstallResult {
  available: boolean;
  installed: boolean;
  install: () => Promise<InstallOutcome>;
}

const isInstalled = (): boolean =>
  (window.__pwa?.installed ?? false) ||
  !!window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall(): UsePwaInstallResult {
  const [available, setAvailable] = useState<boolean>(
    () => !!window.__pwa?.deferredPrompt
  );
  const [installed, setInstalled] = useState<boolean>(() => isInstalled());

  useEffect(() => {
    const sync = (): void => {
      setAvailable(!!window.__pwa?.deferredPrompt);
      setInstalled(isInstalled());
    };
    window.addEventListener("pwa-availability-change", sync);
    return () => window.removeEventListener("pwa-availability-change", sync);
  }, []);

  const install = async (): Promise<InstallOutcome> => {
    const p = window.__pwa?.deferredPrompt;
    if (!p) return "unavailable";
    await p.prompt();
    const { outcome } = await p.userChoice;
    window.__pwa.deferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa-availability-change"));
    return outcome;
  };

  return { available, installed, install };
}
