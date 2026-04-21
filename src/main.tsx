// Entry point. Contract: init(rootElement, appConfig) mounts the React app.
// Keeps the CLOUD_RULES single-entry invariant; forks can rewrite this file
// to swap frameworks without touching vite.config.ts or the PWA plumbing.

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { appConfig, type AppConfig } from "./app.config.ts";
import "./style.css";

// PWA install plumbing — must run before React renders so the hook finds the
// deferred prompt on first render. vite-plugin-pwa handles SW registration.
window.__pwa = { deferredPrompt: null, installed: false };
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwa.deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-availability-change"));
});
window.addEventListener("appinstalled", () => {
  window.__pwa.deferredPrompt = null;
  window.__pwa.installed = true;
  window.dispatchEvent(new CustomEvent("pwa-availability-change"));
});

export function init(root: HTMLElement, config: AppConfig): void {
  createRoot(root).render(<App appConfig={config} />);
}

document.title = appConfig.name;
document.documentElement.lang = appConfig.lang;
const rootEl = document.getElementById("app");
if (rootEl) init(rootEl, appConfig);
