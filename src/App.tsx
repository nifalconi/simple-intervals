// App root — splash, theme, accent, screen navigation, storage glue.

import { useEffect, useState } from "react";
import Library from "./Library.tsx";
import Editor from "./Editor.tsx";
import Runner from "./Runner.tsx";
import History from "./History.tsx";
import SettingsScreen from "./Settings.tsx";
import { ACCENTS, DEFAULTS, type Prefs, type Theme, type ThemeMode } from "./constants.ts";
import { load, save } from "./storage.ts";
import { useReminder } from "./lib/reminder.ts";
import { useStore } from "./store.ts";
import { getAudioCtx } from "./lib/intervals-audio.ts";
import type { AppConfig } from "./app.config.ts";

const PREFS_KEY = "prefs";

function useResolvedTheme(mode: ThemeMode): Theme {
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  if (mode === "auto") return systemDark ? "dark" : "light";
  return mode;
}

interface SplashProps {
  wordmark: string;
  visible: boolean;
  theme: Theme;
}

function Splash({ wordmark, visible, theme }: SplashProps) {
  const bg = theme === "dark" ? "#1F1E1A" : "#F6F1E8";
  const fg = theme === "dark" ? "#E9E4D7" : "#3A3A36";
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity 700ms ease",
    }}>
      <div style={{
        fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
        fontSize: 28, fontWeight: 400,
        letterSpacing: 6, textTransform: "lowercase",
        color: fg,
        animation: visible ? "splashIn 900ms cubic-bezier(0.2, 0.6, 0.2, 1)" : "none",
      }}>
        {wordmark}
      </div>
    </div>
  );
}

type View =
  | { name: "library" }
  | { name: "editor"; id: string }
  | { name: "runner"; id: string }
  | { name: "history" }
  | { name: "settings" };

interface AppProps {
  appConfig: AppConfig;
}

const VIEW_KEY = "simple_intervals_view";

export default function App({ appConfig }: AppProps) {
  const [state, setState] = useState<Prefs>(() => ({
    ...DEFAULTS,
    ...load<Partial<Prefs>>(PREFS_KEY, {}),
  }));
  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [view, setView] = useState<View>(() => load<View>(VIEW_KEY, { name: "library" }));

  const theme = useResolvedTheme(state.themeMode);
  const store = useStore();

  useReminder(state.reminder, appConfig.name);

  useEffect(() => { save(PREFS_KEY, state); }, [state]);
  useEffect(() => { save(VIEW_KEY, view); }, [view]);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.style.background = theme === "dark" ? "#1F1E1A" : "#F6F1E8";
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#1F1E1A" : "#F6F1E8");
  }, [theme]);

  const accent = ACCENTS[state.accent] ?? ACCENTS.green;
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-h", String(accent.h));
  }, [accent.h]);

  useEffect(() => {
    document.documentElement.dataset.font = state.font;
  }, [state.font]);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]): void =>
    setState(s => ({ ...s, [key]: value }));

  const isDark = theme === "dark";
  const appBg = isDark ? "#1F1E1A" : "#F6F1E8";
  const wordmark = appConfig.name;

  const openLibrary = () => setView({ name: "library" });
  const openEditor = (id: string) => setView({ name: "editor", id });
  const openHistory = () => setView({ name: "history" });
  const openSettings = () => setView({ name: "settings" });
  const openRunner = (id: string) => {
    if (state.soundOn) getAudioCtx();
    setView({ name: "runner", id });
  };

  const newRoutine = () => {
    const id = store.addRoutine();
    openEditor(id);
  };

  const currentRoutine = (view.name === "editor" || view.name === "runner")
    ? store.state.routines.find(r => r.id === view.id) ?? null
    : null;

  useEffect(() => {
    if ((view.name === "editor" || view.name === "runner") && !currentRoutine) {
      openLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoutine, view.name]);

  return (
    <div
      data-screen-label={wordmark}
      style={{
        position: "fixed", inset: 0,
        background: appBg,
        fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
        transition: "background 400ms ease",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${accent.hex}${isDark ? "22" : "14"} 0%, transparent 70%)`,
        transition: "background 600ms ease",
      }} />

      <div style={{ position: "relative", height: "100%" }}>
        {view.name === "library" && (
          <Library
            state={store.state}
            onOpen={openEditor}
            onNew={newRoutine}
            onRun={openRunner}
            onHistory={openHistory}
            onSettings={openSettings}
          />
        )}
        {view.name === "editor" && currentRoutine && (
          <Editor
            routine={currentRoutine}
            onBack={openLibrary}
            onSave={(r) => store.updateRoutine(r.id, r)}
            onDelete={() => { store.deleteRoutine(currentRoutine.id); openLibrary(); }}
            onRun={openRunner}
          />
        )}
        {view.name === "runner" && currentRoutine && (
          <Runner
            routine={currentRoutine}
            onExit={openLibrary}
            soundOn={state.soundOn}
            displayStyle={state.displayStyle}
            viewMode={state.viewMode}
            onComplete={(entry) => store.logRun(entry)}
          />
        )}
        {view.name === "history" && (
          <History
            state={store.state}
            onBack={openLibrary}
            onClear={store.clearHistory}
          />
        )}
        {view.name === "settings" && (
          <SettingsScreen
            state={state}
            update={update}
            accents={ACCENTS}
            theme={theme}
            onClose={openLibrary}
          />
        )}
      </div>

      <Splash wordmark={wordmark} visible={splashVisible} theme={theme} />
    </div>
  );
}
