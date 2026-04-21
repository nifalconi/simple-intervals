// Thin localStorage wrapper. Safe on SSR/private mode (falls back to in-memory).

const mem = new Map<string, string>();
const hasLS = (() => {
  try {
    const k = "__t";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = hasLS ? localStorage.getItem(key) : mem.get(key) ?? null;
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  if (hasLS) localStorage.setItem(key, raw);
  else mem.set(key, raw);
}

export function remove(key: string): void {
  if (hasLS) localStorage.removeItem(key);
  else mem.delete(key);
}
