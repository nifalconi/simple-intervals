// Audio helper. Dormant in the template — enable from Settings → Dev only.
// Uses Web Audio API oscillators — no files, no deps, no bundle cost.
//
// iOS Safari note: AudioContext starts suspended. The first call from a
// user-gesture handler (click/tap) resumes it; subsequent calls work silently.
//
// Usage in a fork:
//   import { beep, chime, alarm, stop } from "./lib/audio";
//   beep();                        // single 880Hz blip
//   beep(440, 0.3);                // custom freq + duration (s)
//   chime();                       // 3-tone ascending
//   alarm(6);                      // 6-cycle repeating alert
//
// For scheduled alarms: pair with setTimeout and (optionally) the Notification
// API so the user sees + hears it when the tab is backgrounded.
//   setTimeout(() => { alarm(); notify("Timer done"); }, 60_000);

let ctx: AudioContext | null = null;
let activeNodes: Array<OscillatorNode | GainNode> = [];

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function audioSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
}

interface BeepOptions {
  freq?: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
  at?: number;
}

function scheduleTone({ freq = 880, duration = 0.15, volume = 0.2, type = "sine", at }: BeepOptions = {}): void {
  const c = getCtx();
  if (!c) return;
  const start = at ?? c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  activeNodes.push(osc, gain);
  osc.onended = () => {
    activeNodes = activeNodes.filter(n => n !== osc && n !== gain);
  };
}

export function beep(freq = 880, duration = 0.15): void {
  scheduleTone({ freq, duration });
}

export function chime(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  scheduleTone({ freq: 660, duration: 0.18, at: t });
  scheduleTone({ freq: 880, duration: 0.18, at: t + 0.12 });
  scheduleTone({ freq: 1320, duration: 0.28, at: t + 0.24 });
}

export function alarm(cycles = 6): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < cycles; i++) {
    const off = i * 0.4;
    scheduleTone({ freq: 880, duration: 0.15, volume: 0.25, type: "square", at: t + off });
    scheduleTone({ freq: 1320, duration: 0.15, volume: 0.25, type: "square", at: t + off + 0.2 });
  }
}

export function stop(): void {
  for (const n of activeNodes) {
    try { (n as OscillatorNode).stop?.(); } catch { /* already stopped */ }
    try { n.disconnect(); } catch { /* already disconnected */ }
  }
  activeNodes = [];
}
