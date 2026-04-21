// Shared data: color palette and app defaults.
// Fork-point: add PATTERNS or other app-specific constants here.

export type AccentKey = "green" | "orange" | "pink" | "blue" | "purple";
export type ThemeMode = "light" | "dark" | "auto";
export type Theme = "light" | "dark";
export type FontKey = "grotesk" | "fraunces" | "mono";

export interface Accent {
  label: string;
  hex: string;
  h: number; // oklch hue used by routine/runner CSS
}

// hex values approximate oklch(0.68 0.11 <h>) for each hue
export const ACCENTS: Record<AccentKey, Accent> = {
  green:  { label: "Green",  hex: "#8FB89B", h: 145 },
  orange: { label: "Sun",    hex: "#C9B079", h: 55  },
  pink:   { label: "Coral",  hex: "#D49D9B", h: 10  },
  blue:   { label: "Sky",    hex: "#93AED1", h: 240 },
  purple: { label: "Violet", hex: "#B89FC5", h: 300 },
};

export interface Reminder {
  enabled: boolean;
  days: number[]; // 0 = Sunday ... 6 = Saturday
  hour: number;   // 0-23
}

export type DisplayStyle = "consume" | "drain";
export type RunViewMode = "focus" | "list";

export interface Prefs {
  accent: AccentKey;
  themeMode: ThemeMode;
  reminder: Reminder;
  soundOn: boolean;
  displayStyle: DisplayStyle;
  viewMode: RunViewMode;
  font: FontKey;
}

export const DEFAULTS: Prefs = {
  accent: "green",
  themeMode: "auto",
  font: "grotesk",
  reminder: {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    hour: 9,
  },
  soundOn: true,
  displayStyle: "consume",
  viewMode: "focus",
};

export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_LABELS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
