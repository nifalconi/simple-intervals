// Haptics helper. Dormant in the template — enable from Settings → Dev only.
// Uses the Vibration API. iOS Safari ignores it; Android Chrome honors it.
//
// Usage in a fork:
//   import { pulse } from "./lib/haptics";
//   pulse("tap");              // preset
//   pulse([10, 50, 10]);       // custom pattern (ms)

export type HapticPreset = "tap" | "light" | "medium" | "success" | "error";
export type HapticPattern = number | number[];

const PRESETS: Record<HapticPreset, HapticPattern> = {
  tap:     8,
  light:   12,
  medium:  [15, 30, 15],
  success: [10, 40, 20, 40, 10],
  error:   [30, 60, 30],
};

export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function pulse(patternOrName: HapticPreset | HapticPattern): boolean {
  if (!hapticsSupported()) return false;
  const p = typeof patternOrName === "string" ? PRESETS[patternOrName] : patternOrName;
  if (p == null) return false;
  try { return navigator.vibrate(p); } catch { return false; }
}

export function stop(): void {
  if (hapticsSupported()) navigator.vibrate(0);
}
