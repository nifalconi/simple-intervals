// Daily reminder scheduler. Fires while the app is open (or in a backgrounded
// tab). Cannot fire when the tab is closed — web PWAs don't get background
// wake-ups without a push server. Keep this in mind when building reminder-
// heavy apps; for those, a real push service is needed (out of scope here).

import { useEffect } from "react";
import type { Reminder } from "../constants.ts";
import { chime } from "./audio.ts";
import { notify, notificationsSupported } from "./notifications.ts";

export function nextFireTime(r: Reminder, from: Date = new Date()): Date | null {
  if (!r.enabled || r.days.length === 0) return null;
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(from);
    d.setDate(d.getDate() + offset);
    d.setHours(r.hour, 0, 0, 0);
    if (d.getTime() > from.getTime() && r.days.includes(d.getDay())) return d;
  }
  return null;
}

export function formatNextFire(d: Date | null): string {
  if (!d) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `today at ${hh}:${mm}`;
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `tomorrow at ${hh}:${mm}`;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} at ${hh}:${mm}`;
}

export function useReminder(reminder: Reminder, appName: string): void {
  useEffect(() => {
    if (!reminder.enabled || reminder.days.length === 0) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleNext = (): void => {
      if (cancelled) return;
      const next = nextFireTime(reminder);
      if (!next) return;
      const ms = next.getTime() - Date.now();
      if (ms <= 0) return;
      timerId = setTimeout(() => {
        chime();
        if (notificationsSupported() && Notification.permission === "granted") {
          notify(appName, { body: "Daily reminder" });
        }
        scheduleNext();
      }, ms);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [reminder.enabled, reminder.days.join(","), reminder.hour, appName]);
}
