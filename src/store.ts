// State + storage for simple-intervals: routines, history, helpers.

import { useEffect, useState } from "react";
import { load, save } from "./storage.ts";

const LS_KEY = "simple_intervals_v1";

export type SoundKitId = "beep" | "chime" | "blip" | "bell";

export interface Task {
  id: string;
  name: string;
  duration: number; // seconds
}

export interface RoutineSettings {
  restEnabled: boolean;
  restDuration: number;
  soundKit: SoundKitId;
  startCue: boolean;
  halfwayCue: boolean;
  endCue: boolean;
  countdown321: boolean;
  notifyOnTaskStart: boolean;
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  tasks: Task[];
  settings: RoutineSettings;
}

export interface HistoryEntryInput {
  routineId: string;
  routineName: string;
  duration: number;
  tasks: number;
}

export interface HistoryEntry extends HistoryEntryInput {
  id: string;
  at: number;
}

export interface AppState {
  routines: Routine[];
  history: HistoryEntry[];
}

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const SEED = (): AppState => ({
  routines: [
    {
      id: uid(),
      name: "HIIT Blast",
      emoji: "🔥",
      tasks: [
        { id: uid(), name: "Jumping jacks", duration: 40 },
        { id: uid(), name: "Push-ups", duration: 30 },
        { id: uid(), name: "Mountain climbers", duration: 40 },
        { id: uid(), name: "Squats", duration: 30 },
        { id: uid(), name: "Plank", duration: 45 },
        { id: uid(), name: "Burpees", duration: 30 },
      ],
      settings: {
        restEnabled: true,
        restDuration: 15,
        soundKit: "blip",
        startCue: true,
        halfwayCue: true,
        endCue: true,
        countdown321: true,
        notifyOnTaskStart: false,
      },
    },
    {
      id: uid(),
      name: "Pomodoro focus",
      emoji: "🍅",
      tasks: [
        { id: uid(), name: "Deep work", duration: 1500 },
        { id: uid(), name: "Short break", duration: 300 },
        { id: uid(), name: "Deep work", duration: 1500 },
        { id: uid(), name: "Short break", duration: 300 },
        { id: uid(), name: "Deep work", duration: 1500 },
        { id: uid(), name: "Long break", duration: 900 },
      ],
      settings: {
        restEnabled: false,
        restDuration: 0,
        soundKit: "chime",
        startCue: true,
        halfwayCue: false,
        endCue: true,
        countdown321: false,
        notifyOnTaskStart: false,
      },
    },
    {
      id: uid(),
      name: "Meditation",
      emoji: "🧘",
      tasks: [
        { id: uid(), name: "Settle in", duration: 60 },
        { id: uid(), name: "Body scan", duration: 180 },
        { id: uid(), name: "Breath focus", duration: 300 },
        { id: uid(), name: "Open awareness", duration: 180 },
        { id: uid(), name: "Return", duration: 60 },
      ],
      settings: {
        restEnabled: false,
        restDuration: 0,
        soundKit: "chime",
        startCue: true,
        halfwayCue: false,
        endCue: true,
        countdown321: false,
        notifyOnTaskStart: false,
      },
    },
    {
      id: uid(),
      name: "Morning stretch",
      emoji: "🌅",
      tasks: [
        { id: uid(), name: "Neck rolls", duration: 30 },
        { id: uid(), name: "Shoulder circles", duration: 30 },
        { id: uid(), name: "Cat-cow", duration: 45 },
        { id: uid(), name: "Forward fold", duration: 45 },
        { id: uid(), name: "Downward dog", duration: 45 },
        { id: uid(), name: "Child's pose", duration: 60 },
      ],
      settings: {
        restEnabled: true,
        restDuration: 10,
        soundKit: "bell",
        startCue: true,
        halfwayCue: false,
        endCue: true,
        countdown321: true,
        notifyOnTaskStart: false,
      },
    },
  ],
  history: [],
});

function loadState(): AppState {
  const raw = load<AppState | null>(LS_KEY, null);
  if (!raw || !Array.isArray(raw.routines)) return SEED();
  return raw;
}

function saveState(s: AppState): void {
  save(LS_KEY, s);
}

export function addRoutine(state: AppState): { state: AppState; id: string } {
  const id = uid();
  const r: Routine = {
    id,
    name: "New routine",
    emoji: "⚡",
    tasks: [{ id: uid(), name: "Task 1", duration: 30 }],
    settings: {
      restEnabled: true,
      restDuration: 10,
      soundKit: "beep",
      startCue: true,
      halfwayCue: true,
      endCue: true,
      countdown321: true,
      notifyOnTaskStart: false,
    },
  };
  return { state: { ...state, routines: [...state.routines, r] }, id };
}

export function updateRoutine(state: AppState, id: string, patch: Partial<Routine>): AppState {
  return {
    ...state,
    routines: state.routines.map(r => (r.id === id ? { ...r, ...patch } : r)),
  };
}

export function deleteRoutine(state: AppState, id: string): AppState {
  return { ...state, routines: state.routines.filter(r => r.id !== id) };
}

export function logRun(state: AppState, entry: HistoryEntryInput): AppState {
  const e: HistoryEntry = { ...entry, id: uid(), at: Date.now() };
  return { ...state, history: [e, ...state.history].slice(0, 50) };
}

export function clearHistory(state: AppState): AppState {
  return { ...state, history: [] };
}

export function fmtTime(sec: number): string {
  const s0 = Math.max(0, Math.round(sec));
  const m = Math.floor(s0 / 60);
  const s = s0 % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function totalDuration(routine: Routine): number {
  const tasks = routine.tasks.reduce((a, t) => a + t.duration, 0);
  const rest = routine.settings.restEnabled
    ? routine.settings.restDuration * Math.max(0, routine.tasks.length - 1)
    : 0;
  return tasks + rest;
}

export interface UseStoreApi {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addRoutine: () => string;
  updateRoutine: (id: string, patch: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  logRun: (entry: HistoryEntryInput) => void;
  clearHistory: () => void;
}

export function useStore(): UseStoreApi {
  const [state, setState] = useState<AppState>(loadState);
  useEffect(() => { saveState(state); }, [state]);

  return {
    state,
    setState,
    addRoutine: () => {
      let newId = "";
      setState(s => {
        const { state: next, id } = addRoutine(s);
        newId = id;
        return next;
      });
      return newId;
    },
    updateRoutine: (id, patch) => setState(s => updateRoutine(s, id, patch)),
    deleteRoutine: (id) => setState(s => deleteRoutine(s, id)),
    logRun: (entry) => setState(s => logRun(s, entry)),
    clearHistory: () => setState(s => clearHistory(s)),
  };
}
