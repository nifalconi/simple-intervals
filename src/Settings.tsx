// Settings screen — Appearance / Timer display / Running view / Sound + Install + hidden Dev panel.

import { useRef, useState } from "react";
import { usePwaInstall } from "./usePwaInstall.ts";
import type {
  AccentKey,
  Accent,
  FontKey,
  Prefs,
  Theme,
  ThemeMode,
} from "./constants.ts";
import DevPanel from "./DevPanel.tsx";

interface SettingsScreenProps {
  state: Prefs;
  update: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  accents: Record<AccentKey, Accent>;
  theme: Theme;
  onClose: () => void;
}

export default function SettingsScreen({ state, update, accents, theme, onClose }: SettingsScreenProps) {
  const { available: pwaAvailable, installed: pwaInstalled, install: pwaInstall } = usePwaInstall();
  const [pwaHint, setPwaHint] = useState<string | null>(null);

  const [devVisible, setDevVisible] = useState<boolean>(false);
  const tapCount = useRef<number>(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDevTap = (): void => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setDevVisible(v => !v);
    }
  };

  const onInstallClick = async (): Promise<void> => {
    if (pwaInstalled) return;
    if (!pwaAvailable) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setPwaHint(ios
        ? "In Safari: tap Share → Add to Home Screen."
        : "Open in Chrome or Edge, or use the browser menu → Install.");
      setTimeout(() => setPwaHint(null), 4000);
      return;
    }
    const outcome = await pwaInstall();
    if (outcome === "dismissed") {
      setPwaHint("Install dismissed.");
      setTimeout(() => setPwaHint(null), 2500);
    }
  };

  const isDark = theme === "dark";
  const fg = isDark ? "#E9E4D7" : "#3A3A36";
  const muted = isDark ? "rgba(233,228,215,0.5)" : "#3A3A3680";

  const themeOptions: Array<[ThemeMode, string]> = [
    ["light", "Light"], ["dark", "Dark"], ["auto", "Auto"],
  ];
  const fontOptions: Array<[FontKey, string]> = [
    ["grotesk", "Grot"], ["fraunces", "Serif"], ["mono", "Mono"],
  ];

  const accentEntries = Object.entries(accents) as Array<[AccentKey, Accent]>;

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      padding: "0 20px", overflowY: "auto",
      color: fg,
    }}>
      <div style={{
        paddingTop: 62, paddingBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, letterSpacing: -0.6 }}>Settings</div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(58,58,54,0.06)",
            border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2l8 8M10 2l-8 8" stroke={fg} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Appearance */}
      <div className="settings-title" style={{ marginTop: 0 }}>Appearance</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="label">
            <span className="name">Accent color</span>
            <span className="hint">Main color for buttons & timer</span>
          </div>
          <div className="swatch-row">
            {accentEntries.map(([k, a]) => (
              <button
                key={k}
                type="button"
                className={"swatch-big " + (state.accent === k ? "sel" : "")}
                onClick={() => update("accent", k)}
              >
                <div className="dot" style={{ background: `oklch(0.68 0.11 ${a.h})` }} />
                <span className="nm">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div className="label">
            <span className="name">Theme</span>
            <span className="hint">Light or dark background</span>
          </div>
          <div className="seg">
            {themeOptions.map(([k, label]) => (
              <button
                key={k}
                className={state.themeMode === k ? "sel" : ""}
                onClick={() => update("themeMode", k)}
              >{label}</button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div className="label">
            <span className="name">Font</span>
            <span className="hint">Typography style</span>
          </div>
          <div className="seg">
            {fontOptions.map(([k, label]) => (
              <button
                key={k}
                className={state.font === k ? "sel" : ""}
                onClick={() => update("font", k)}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Timer display */}
      <div className="settings-title">Timer display</div>
      <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "0 4px 10px", lineHeight: 1.5 }}>
        How the current task visually shows progress.
      </div>
      <div className="style-choice">
        <button
          type="button"
          className={"style-card consume " + (state.displayStyle === "consume" ? "sel" : "")}
          onClick={() => update("displayStyle", "consume")}
        >
          <div className="prev">
            <div className="bar" />
            <span className="label">Plank</span>
            <span className="timer">00:18</span>
          </div>
          <div className="nm">Consume</div>
          <div className="desc">Color fills from the left as time passes — the task is "eaten up"</div>
        </button>
        <button
          type="button"
          className={"style-card drain " + (state.displayStyle === "drain" ? "sel" : "")}
          onClick={() => update("displayStyle", "drain")}
        >
          <div className="prev">
            <div className="bar" />
            <span className="label">Plank</span>
            <span className="timer">00:18</span>
          </div>
          <div className="nm">Drain</div>
          <div className="desc">Color recedes from the right, showing time remaining</div>
        </button>
      </div>

      {/* Running view */}
      <div className="settings-title">Running view</div>
      <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "0 4px 10px", lineHeight: 1.5 }}>
        How tasks are laid out while a routine is running.
      </div>
      <div className="style-choice">
        <button
          type="button"
          className={"style-card " + (state.viewMode === "focus" ? "sel" : "")}
          onClick={() => update("viewMode", "focus")}
        >
          <div className="prev" style={{ background: "transparent", border: "none", height: 60, display: "flex", flexDirection: "column", gap: 4, padding: "4px 2px" }}>
            <div style={{ height: 34, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", color: "white", fontSize: 10, fontFamily: "var(--font-mono)" }}>
              <span>Plank</span><span>00:18</span>
            </div>
            <div style={{ height: 10, borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border)" }} />
          </div>
          <div className="nm">Focus</div>
          <div className="desc">One big card for the current task, next peek below</div>
        </button>
        <button
          type="button"
          className={"style-card " + (state.viewMode === "list" ? "sel" : "")}
          onClick={() => update("viewMode", "list")}
        >
          <div className="prev" style={{ background: "transparent", border: "none", height: 60, display: "flex", flexDirection: "column", gap: 3, padding: "4px 2px" }}>
            <div style={{ height: 18, borderRadius: 4, background: "var(--accent)", padding: "0 6px", color: "white", fontSize: 9, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Plank</span><span>00:18</span>
            </div>
            <div style={{ height: 14, borderRadius: 4, border: "1px solid var(--border)", padding: "0 6px", fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Push-ups</span><span>00:30</span>
            </div>
            <div style={{ height: 14, borderRadius: 4, border: "1px solid var(--border)", padding: "0 6px", fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Squats</span><span>00:45</span>
            </div>
          </div>
          <div className="nm">List</div>
          <div className="desc">All tasks stacked — each consumes & disappears, revealing the next</div>
        </button>
      </div>

      {/* Sound */}
      <div className="settings-title">Sound</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="label">
            <span className="name">Sound on</span>
            <span className="hint">Master switch — overrides per-routine cues</span>
          </div>
          <button
            type="button"
            className={"toggle " + (state.soundOn ? "on" : "")}
            onClick={() => update("soundOn", !state.soundOn)}
            aria-label="Sound on"
          />
        </div>
      </div>

      {/* Install */}
      <div className="settings-title">Install</div>
      <div className="settings-group" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {pwaInstalled ? "Installed" : "Add to home screen"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>
              {pwaInstalled
                ? "Running as an installed app."
                : "Run offline in its own window."}
            </div>
          </div>
          <button
            onClick={onInstallClick}
            disabled={pwaInstalled}
            style={{
              flexShrink: 0,
              padding: "10px 16px", borderRadius: 999, border: "none",
              background: pwaInstalled
                ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(58,58,54,0.06)")
                : "var(--accent)",
              color: pwaInstalled ? muted : "white",
              fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              letterSpacing: 0.3,
              cursor: pwaInstalled ? "default" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            {!pwaInstalled && (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 1.5v6M3.5 5.5L6 8l2.5-2.5M2 10h8"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
            {pwaInstalled ? "Installed" : "Install"}
          </button>
        </div>
        {pwaHint && (
          <div style={{
            marginTop: 12, fontSize: 12, lineHeight: 1.5, color: muted,
            padding: "8px 12px", borderRadius: 10,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(58,58,54,0.04)",
          }}>
            {pwaHint}
          </div>
        )}
      </div>

      <DevPanel
        visible={devVisible}
        theme={theme}
        onClose={() => setDevVisible(false)}
        reminder={state.reminder}
        updateReminder={(r) => update("reminder", r)}
      />

      <button
        onClick={onDevTap}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "center", fontSize: 11, color: muted,
          letterSpacing: 1, marginTop: "auto", paddingBottom: 40, paddingTop: 8,
          fontFamily: "inherit",
          userSelect: "none", WebkitUserSelect: "none",
        }}
        title="Tap three times to toggle dev panel"
      >
        v1.0{devVisible ? " · dev" : ""}
      </button>
    </div>
  );
}
