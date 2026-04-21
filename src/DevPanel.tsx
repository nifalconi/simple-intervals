// Hidden Dev panel. Triple-tap the v1.0 footer in Settings to reveal.
// Diagnostics you'd otherwise reach for via browser devtools — surfaced
// in-app so you can debug on a phone or an installed PWA.

import { useEffect, useState, type ReactNode } from "react";
import type { Theme, Reminder } from "./constants.ts";
import { DAY_LABELS } from "./constants.ts";
import { hapticsSupported, pulse } from "./lib/haptics.ts";
import { audioSupported, chime, alarm } from "./lib/audio.ts";
import {
  notificationsSupported,
  permissionState,
  requestPermission,
  notify,
  type PermissionState,
} from "./lib/notifications.ts";
import { nextFireTime, formatNextFire } from "./lib/reminder.ts";

// ─────────────────────────────────────────────────────────────
// Shared UI primitives — used only inside this file
// ─────────────────────────────────────────────────────────────

function colors(theme: Theme) {
  const isDark = theme === "dark";
  return {
    isDark,
    fg: isDark ? "#E9E4D7" : "#3A3A36",
    muted: isDark ? "rgba(233,228,215,0.55)" : "rgba(58,58,54,0.55)",
    subtle: isDark ? "rgba(233,228,215,0.35)" : "rgba(58,58,54,0.35)",
    cardBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
    border: isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(58,58,54,0.08)",
    rowBorder: isDark ? "0.5px solid rgba(255,255,255,0.06)" : "0.5px solid rgba(58,58,54,0.06)",
    soft: isDark ? "rgba(255,255,255,0.08)" : "rgba(58,58,54,0.06)",
  };
}

interface RowProps {
  label: string;
  children: ReactNode;
  last?: boolean;
  theme: Theme;
  stack?: boolean;
}

function Row({ label, children, last, theme, stack }: RowProps) {
  const c = colors(theme);
  return (
    <div style={{
      display: "flex", flexDirection: stack ? "column" : "row",
      alignItems: stack ? "stretch" : "center",
      justifyContent: "space-between",
      padding: "13px 18px", gap: stack ? 6 : 14,
      borderBottom: last ? "none" : c.rowBorder,
      fontSize: 14, color: c.fg,
    }}>
      <span style={{ flexShrink: 0, fontSize: 14 }}>{label}</span>
      <div style={{
        minWidth: 0, textAlign: stack ? "left" : "right",
        fontSize: 13, color: c.muted,
        wordBreak: "break-word", lineHeight: 1.4,
      }}>{children}</div>
    </div>
  );
}

interface ActionBtnProps {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  theme: Theme;
  children: ReactNode;
}

function ActionBtn({ onClick, disabled, danger, theme, children }: ActionBtnProps) {
  const c = colors(theme);
  const bg = disabled ? c.soft
    : danger ? (c.isDark ? "#C9A9A9" : "#8A3A3A")
    : (c.isDark ? "#E9E4D7" : "#3A3A36");
  const fg = disabled ? c.muted : (c.isDark ? "#1F1E1A" : "#F6F1E8");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 14px", borderRadius: 999, border: "none",
        background: bg, color: fg,
        fontFamily: "inherit", fontSize: 12, fontWeight: 500,
        letterSpacing: 0.2,
        cursor: disabled ? "default" : "pointer",
      }}
    >{children}</button>
  );
}

function Mono({ children, theme }: { children: ReactNode; theme: Theme }) {
  const c = colors(theme);
  return (
    <span style={{
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12, color: c.muted,
    }}>{children}</span>
  );
}

function Pill({ children, theme }: { children: ReactNode; theme: Theme }) {
  const c = colors(theme);
  return (
    <span style={{
      fontSize: 12, color: c.fg,
      background: c.soft,
      padding: "3px 10px", borderRadius: 999,
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Capabilities
// ─────────────────────────────────────────────────────────────

function CapabilitiesSection({ theme }: { theme: Theme }) {
  const [notifPerm, setNotifPerm] = useState<PermissionState>(permissionState());

  const onNotifClick = async (): Promise<void> => {
    if (!notificationsSupported()) return;
    if (Notification.permission === "default") {
      const granted = await requestPermission();
      setNotifPerm(granted ? "granted" : "denied");
      if (granted) notify("Notifications enabled", { body: "You'll see messages like this." });
    } else if (Notification.permission === "granted") {
      notify("Test notification", { body: "Fired from the Dev panel." });
    }
  };

  const notifLabel = !notificationsSupported()
    ? "Unsupported"
    : notifPerm === "granted" ? "Send"
    : notifPerm === "denied" ? "Blocked"
    : "Enable";

  return (
    <>
      <Row label="Haptic" theme={theme}>
        <ActionBtn onClick={() => pulse("medium")} disabled={!hapticsSupported()} theme={theme}>
          {hapticsSupported() ? "Pulse" : "Unsupported"}
        </ActionBtn>
      </Row>
      <Row label="Chime" theme={theme}>
        <ActionBtn onClick={() => chime()} disabled={!audioSupported()} theme={theme}>
          {audioSupported() ? "Play" : "Unsupported"}
        </ActionBtn>
      </Row>
      <Row label="Alarm" theme={theme}>
        <ActionBtn onClick={() => alarm(4)} disabled={!audioSupported()} theme={theme}>
          {audioSupported() ? "Play" : "Unsupported"}
        </ActionBtn>
      </Row>
      <Row label="Notifications" last theme={theme}>
        <ActionBtn
          onClick={() => { void onNotifClick(); }}
          disabled={!notificationsSupported() || notifPerm === "denied"}
          theme={theme}
        >{notifLabel}</ActionBtn>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Reminders
// ─────────────────────────────────────────────────────────────

interface RemindersSectionProps {
  theme: Theme;
  reminder: Reminder;
  update: (r: Reminder) => void;
}

function RemindersSection({ theme, reminder, update }: RemindersSectionProps) {
  const c = colors(theme);

  const toggleDay = (d: number): void => {
    const days = reminder.days.includes(d)
      ? reminder.days.filter(x => x !== d)
      : [...reminder.days, d].sort((a, b) => a - b);
    update({ ...reminder, days });
  };

  const toggleEnabled = async (): Promise<void> => {
    const next = !reminder.enabled;
    if (next && notificationsSupported() && Notification.permission === "default") {
      await requestPermission();
    }
    update({ ...reminder, enabled: next });
  };

  const fireNow = async (): Promise<void> => {
    chime();
    if (!notificationsSupported()) return;
    if (Notification.permission === "default") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    if (Notification.permission === "granted") {
      notify("Reminder test", {
        body: "Fired from the Dev panel. Real reminders look like this.",
        tag: "reminder-test",
      });
    }
  };

  const next = nextFireTime(reminder);

  return (
    <>
      <Row label="Enabled" theme={theme}>
        <button
          onClick={() => { void toggleEnabled(); }}
          style={{
            width: 44, height: 26, borderRadius: 999, border: "none",
            background: reminder.enabled
              ? (c.isDark ? "#B8C4A9" : "#3A3A36")
              : (c.isDark ? "rgba(255,255,255,0.14)" : "rgba(58,58,54,0.14)"),
            position: "relative", cursor: "pointer", padding: 0,
            transition: "background 200ms ease",
          }}
          aria-pressed={reminder.enabled}
        >
          <span style={{
            position: "absolute", top: 3, left: reminder.enabled ? 21 : 3,
            width: 20, height: 20, borderRadius: "50%",
            background: c.isDark ? "#F6F1E8" : "#fff",
            transition: "left 200ms cubic-bezier(0.3, 0, 0.3, 1)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }} />
        </button>
      </Row>
      <Row label="Days" theme={theme} stack>
        <div style={{
          display: "flex", gap: 6, flexWrap: "wrap",
          justifyContent: "space-between",
          marginTop: 4,
        }}>
          {DAY_LABELS.map((lbl, i) => {
            const active = reminder.days.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                aria-label={`Toggle day ${i}`}
                style={{
                  flex: "1 1 32px",
                  minWidth: 32, height: 32, borderRadius: "50%", border: "none",
                  background: active
                    ? (c.isDark ? "#E9E4D7" : "#3A3A36")
                    : c.soft,
                  color: active
                    ? (c.isDark ? "#1F1E1A" : "#F6F1E8")
                    : c.fg,
                  fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                  cursor: "pointer", padding: 0,
                }}
              >{lbl}</button>
            );
          })}
        </div>
      </Row>
      <Row label="Time" theme={theme} stack>
        <select
          value={reminder.hour}
          onChange={e => update({ ...reminder, hour: Number(e.target.value) })}
          style={{
            marginTop: 4, width: "100%",
            padding: "10px 14px", borderRadius: 10,
            border: c.border,
            background: c.soft,
            color: c.fg, fontFamily: "inherit", fontSize: 14,
            cursor: "pointer",
            WebkitAppearance: "none", appearance: "none",
          }}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
          ))}
        </select>
      </Row>
      <Row label="Next fire" theme={theme}>
        {formatNextFire(next)}
      </Row>
      <Row label="Fire now" last theme={theme}>
        <ActionBtn onClick={() => { void fireNow(); }} theme={theme}>Test</ActionBtn>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Storage
// ─────────────────────────────────────────────────────────────

function StorageSection({ theme }: { theme: Theme }) {
  const [bump, setBump] = useState(0);
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
  } catch { /* private mode */ }

  const onClear = (): void => {
    if (!confirm("Clear all localStorage keys? This cannot be undone.")) return;
    try { localStorage.clear(); } catch { /* ignored */ }
    setBump(b => b + 1);
  };

  return (
    <>
      <Row label="Keys" theme={theme}>
        <Pill theme={theme}>{keys.length}</Pill>
      </Row>
      {keys.map(k => {
        const v = (() => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } })();
        const preview = v.length > 60 ? v.slice(0, 60) + "…" : v;
        return (
          <Row key={`${k}-${bump}`} label={k} theme={theme} stack>
            <Mono theme={theme}>{preview}</Mono>
          </Row>
        );
      })}
      <Row label="Clear storage" last theme={theme}>
        <ActionBtn onClick={onClear} disabled={keys.length === 0} danger theme={theme}>Clear</ActionBtn>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Service Worker
// ─────────────────────────────────────────────────────────────

interface SwInfo {
  supported: boolean;
  registered: boolean;
  state: string;
  scope: string;
}

function useSwInfo(): [SwInfo, () => Promise<void>] {
  const [info, setInfo] = useState<SwInfo>({ supported: "serviceWorker" in navigator, registered: false, state: "unknown", scope: "" });

  const refresh = async (): Promise<void> => {
    if (!("serviceWorker" in navigator)) {
      setInfo({ supported: false, registered: false, state: "unsupported", scope: "" });
      return;
    }
    const regs = await navigator.serviceWorker.getRegistrations();
    const reg = regs[0];
    if (!reg) {
      setInfo({ supported: true, registered: false, state: "none", scope: "" });
      return;
    }
    const state = reg.active?.state ?? (reg.installing ? "installing" : reg.waiting ? "waiting" : "unknown");
    setInfo({ supported: true, registered: true, state, scope: reg.scope });
  };

  useEffect(() => { void refresh(); }, []);
  return [info, refresh];
}

function ServiceWorkerSection({ theme }: { theme: Theme }) {
  const [info, refresh] = useSwInfo();

  const onUnregister = async (): Promise<void> => {
    if (!confirm("Unregister the service worker? Offline support will stop until next reload.")) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    await refresh();
  };

  return (
    <>
      <Row label="State" theme={theme}>
        <Pill theme={theme}>{info.supported ? info.state : "unsupported"}</Pill>
      </Row>
      {info.registered && (
        <Row label="Scope" theme={theme} stack>
          <Mono theme={theme}>{info.scope}</Mono>
        </Row>
      )}
      <Row label="Unregister" last theme={theme}>
        <ActionBtn onClick={() => { void onUnregister(); }} disabled={!info.registered} danger theme={theme}>Unregister</ActionBtn>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: PWA state
// ─────────────────────────────────────────────────────────────

function PwaStateSection({ theme }: { theme: Theme }) {
  const [state, setState] = useState(() => snapshot());

  useEffect(() => {
    const sync = (): void => setState(snapshot());
    window.addEventListener("pwa-availability-change", sync);
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", sync);
    return () => {
      window.removeEventListener("pwa-availability-change", sync);
      mq?.removeEventListener?.("change", sync);
    };
  }, []);

  function snapshot() {
    return {
      installed: window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true,
      promptAvailable: !!window.__pwa?.deferredPrompt,
      displayMode:
        window.matchMedia?.("(display-mode: standalone)").matches ? "standalone"
          : window.matchMedia?.("(display-mode: minimal-ui)").matches ? "minimal-ui"
          : window.matchMedia?.("(display-mode: fullscreen)").matches ? "fullscreen"
          : "browser",
    };
  }

  return (
    <>
      <Row label="Display mode" theme={theme}>
        <Pill theme={theme}>{state.displayMode}</Pill>
      </Row>
      <Row label="Installed" theme={theme}>
        {state.installed ? "Yes" : "No"}
      </Row>
      <Row label="Install prompt" last theme={theme}>
        {state.promptAvailable ? "Available" : "Not available"}
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Viewport
// ─────────────────────────────────────────────────────────────

interface ViewportInfo {
  w: number;
  h: number;
  dpr: number;
  orientation: string;
}

function useViewport(): ViewportInfo {
  const read = (): ViewportInfo => ({
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: window.devicePixelRatio,
    orientation: window.screen?.orientation?.type ?? (window.innerWidth > window.innerHeight ? "landscape" : "portrait"),
  });
  const [vp, setVp] = useState<ViewportInfo>(read);
  useEffect(() => {
    const sync = (): void => setVp(read());
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);
  return vp;
}

function ViewportSection({ theme }: { theme: Theme }) {
  const vp = useViewport();
  return (
    <>
      <Row label="Window" theme={theme}>
        {vp.w} × {vp.h} px
      </Row>
      <Row label="Pixel ratio" theme={theme}>
        {vp.dpr.toFixed(2)}
      </Row>
      <Row label="Orientation" last theme={theme}>
        <Pill theme={theme}>{vp.orientation}</Pill>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Build info
// ─────────────────────────────────────────────────────────────

function BuildInfoSection({ theme }: { theme: Theme }) {
  const built = new Date(__APP_BUILT_AT__);
  const builtStr = Number.isNaN(built.getTime())
    ? __APP_BUILT_AT__
    : built.toISOString().replace("T", " ").slice(0, 16) + "Z";
  return (
    <>
      <Row label="Commit" theme={theme}>
        <Mono theme={theme}>{__APP_COMMIT__}</Mono>
      </Row>
      <Row label="Built at" theme={theme}>
        <Mono theme={theme}>{builtStr}</Mono>
      </Row>
      <Row label="User agent" last theme={theme} stack>
        <Mono theme={theme}>{navigator.userAgent}</Mono>
      </Row>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Reset
// ─────────────────────────────────────────────────────────────

function ResetSection({ theme }: { theme: Theme }) {
  const onReset = async (): Promise<void> => {
    if (!confirm("Reset everything? Clears storage, unregisters the service worker, and reloads. Cannot be undone.")) return;
    try { localStorage.clear(); } catch { /* ignored */ }
    try { sessionStorage.clear(); } catch { /* ignored */ }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    location.reload();
  };

  return (
    <Row label="Reset all data" last theme={theme}>
      <ActionBtn onClick={() => { void onReset(); }} danger theme={theme}>Reset</ActionBtn>
    </Row>
  );
}

// ─────────────────────────────────────────────────────────────
// DevPanel — full-screen overlay composing the sections
// ─────────────────────────────────────────────────────────────

interface DevPanelProps {
  visible: boolean;
  theme: Theme;
  onClose: () => void;
  reminder: Reminder;
  updateReminder: (r: Reminder) => void;
}

export default function DevPanel({ visible, theme, onClose, reminder, updateReminder }: DevPanelProps) {
  if (!visible) return null;

  const c = colors(theme);
  const appBg = c.isDark ? "#1F1E1A" : "#F6F1E8";

  const Card = ({ title, children }: { title: string; children: ReactNode }) => (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{
        margin: "0 4px 10px",
        fontSize: 11, fontWeight: 500,
        letterSpacing: 2, textTransform: "uppercase",
        color: c.subtle,
      }}>{title}</h2>
      <div style={{
        background: c.cardBg, border: c.border,
        borderRadius: 16, overflow: "hidden",
      }}>
        {children}
      </div>
    </section>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      background: appBg,
      fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
      color: c.fg,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      {/* sticky header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: appBg,
        borderBottom: c.rowBorder,
        padding: "52px 20px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, letterSpacing: -0.6 }}>Dev</h1>
          <span style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11, letterSpacing: 0.5, color: c.subtle,
          }}>{__APP_COMMIT__}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: c.soft, border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Close dev panel"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2l8 8M10 2l-8 8" stroke={c.fg} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      <div style={{ padding: "24px 20px 40px" }}>
        <Card title="Capabilities"><CapabilitiesSection theme={theme} /></Card>
        <Card title="Reminders"><RemindersSection theme={theme} reminder={reminder} update={updateReminder} /></Card>
        <Card title="Storage"><StorageSection theme={theme} /></Card>
        <Card title="Service Worker"><ServiceWorkerSection theme={theme} /></Card>
        <Card title="PWA"><PwaStateSection theme={theme} /></Card>
        <Card title="Viewport"><ViewportSection theme={theme} /></Card>
        <Card title="Build"><BuildInfoSection theme={theme} /></Card>
        <Card title="Danger zone"><ResetSection theme={theme} /></Card>

        <p style={{
          fontSize: 11, color: c.subtle,
          padding: "0 4px", lineHeight: 1.5, margin: 0,
        }}>
          Capabilities dormant by default. Import from <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>src/lib/*</code> to wire them into your fork.
        </p>
      </div>
    </div>
  );
}
