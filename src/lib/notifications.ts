// Notifications helper. Dormant in the template — enable from Settings → Dev only.
// Requires HTTPS (or localhost). On iOS requires the app to be installed first.
//
// Usage in a fork:
//   import { requestPermission, notify, permissionState } from "./lib/notifications";
//   const ok = await requestPermission();
//   if (ok) notify("Hello", { body: "It works." });

export type PermissionState = NotificationPermission | "unsupported";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): PermissionState {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notify(title: string, options: NotificationOptions = {}): Notification | null {
  if (!notificationsSupported()) return null;
  if (Notification.permission !== "granted") return null;
  try {
    return new Notification(title, options);
  } catch {
    return null;
  }
}
