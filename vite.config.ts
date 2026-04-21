import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig } from "./src/app.config.ts";

// Base path: "/" in dev, "/<repo>/" on GitHub Pages (Action injects VITE_BASE).
const base = process.env.VITE_BASE ?? "/";

// Build metadata surfaced in the Dev panel. GITHUB_SHA is set by the Action.
const commit = (process.env.GITHUB_SHA ?? "dev").slice(0, 7);
const builtAt = new Date().toISOString();

export default defineConfig({
  base,
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILT_AT__: JSON.stringify(builtAt),
  },
  preview: {
    // Allow ngrok (and Cloudflare quick-tunnels) without host-header blocks.
    allowedHosts: [".ngrok-free.app", ".ngrok.io", ".trycloudflare.com"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icon.svg"],
      manifest: {
        name: appConfig.name,
        short_name: appConfig.shortName,
        description: appConfig.description,
        theme_color: appConfig.themeColor,
        background_color: appConfig.backgroundColor,
        display: appConfig.display,
        orientation: appConfig.orientation,
        lang: appConfig.lang,
        start_url: base,
        scope: base,
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
