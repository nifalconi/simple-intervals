// Web Audio cues for the interval runner. No files, no deps.
// Separate from lib/audio.ts (template's generic helper) to keep the kit-based
// cue library self-contained.

import type { SoundKitId } from "../store.ts";

export type CueName = "start" | "halfway" | "end" | "restStart" | "countdown";

interface Cue {
  type: OscillatorType;
  notes: Array<[number, number]>; // [freq, duration]
}

export type SoundKit = {
  name: string;
} & Record<CueName, Cue>;

export const SOUND_KITS: Record<SoundKitId, SoundKit> = {
  beep: {
    name: "Classic beep",
    start: { type: "sine", notes: [[880, 0.12]] },
    halfway: { type: "sine", notes: [[660, 0.08]] },
    end: { type: "sine", notes: [[880, 0.1], [1320, 0.18]] },
    restStart: { type: "sine", notes: [[440, 0.14]] },
    countdown: { type: "square", notes: [[880, 0.06]] },
  },
  chime: {
    name: "Gentle chime",
    start: { type: "triangle", notes: [[523, 0.22], [659, 0.22]] },
    halfway: { type: "triangle", notes: [[440, 0.15]] },
    end: { type: "triangle", notes: [[523, 0.2], [659, 0.2], [784, 0.3]] },
    restStart: { type: "triangle", notes: [[392, 0.2]] },
    countdown: { type: "triangle", notes: [[784, 0.08]] },
  },
  blip: {
    name: "Arcade blip",
    start: { type: "square", notes: [[440, 0.05], [660, 0.05], [880, 0.12]] },
    halfway: { type: "square", notes: [[880, 0.05], [660, 0.08]] },
    end: { type: "square", notes: [[660, 0.06], [880, 0.06], [1100, 0.06], [1320, 0.18]] },
    restStart: { type: "square", notes: [[330, 0.06], [440, 0.1]] },
    countdown: { type: "square", notes: [[1040, 0.05]] },
  },
  bell: {
    name: "Boxing bell",
    start: { type: "sawtooth", notes: [[392, 0.2], [587, 0.3]] },
    halfway: { type: "sawtooth", notes: [[330, 0.15]] },
    end: { type: "sawtooth", notes: [[587, 0.4]] },
    restStart: { type: "sawtooth", notes: [[262, 0.22]] },
    countdown: { type: "sine", notes: [[659, 0.06]] },
  },
};

let _ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) {
    try { _ctx = new AC(); } catch { return null; }
  }
  if (_ctx.state === "suspended") void _ctx.resume();
  return _ctx;
}

export function playCue(kitId: SoundKitId, cueName: CueName, volume = 0.5): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const kit = SOUND_KITS[kitId] ?? SOUND_KITS.beep;
  const cue = kit[cueName];
  if (!cue) return;
  let t = ctx.currentTime;
  for (const [freq, dur] of cue.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cue.type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.9;
  }
}
