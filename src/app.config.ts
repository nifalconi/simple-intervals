// Fork-point #1: rebrand the app by editing this file.
// Everything downstream (manifest, <title>, theme color) reads from here.

export interface AppConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  accentColor: string;
  purpose: string;
  audience: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  orientation: "any" | "portrait" | "landscape";
  lang: string;
}

export const appConfig: AppConfig = {
  name: "simple intervals",
  shortName: "intervals",
  description: "Minimal interval timer — routines, runner, history. Local-first PWA.",
  themeColor: "#F6F1E8",
  backgroundColor: "#F6F1E8",
  accentColor: "#B8C4A9",

  purpose: "Run timed interval routines without friction.",
  audience: "Anyone who wants a calm, offline timer for workouts, meditation, focus blocks.",

  display: "standalone",
  orientation: "any",
  lang: "en",
};
