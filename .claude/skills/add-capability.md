# Skill: Add a capability

Use this recipe when a fork needs a new web platform capability — geolocation, share sheet, wake lock, clipboard, etc. Capabilities are **dormant by default** — they ship a typed helper in `src/lib/` plus a Dev panel test row.

## Steps

1. **Create `src/lib/<name>.ts`.** Follow the pattern of [src/lib/audio.ts](../../src/lib/audio.ts) or [src/lib/haptics.ts](../../src/lib/haptics.ts):
   - Export a `Supported()` function that returns a boolean (feature detection)
   - Export one or more action functions (e.g. `copy(text)`, `acquireWakeLock()`)
   - Export any types (`Preset`, `Options`, `State`)
   - Handle platform quirks inline (iOS Safari unlocks, permission flows, etc.)
   - No React, no JSX — pure TypeScript module

2. **Add a test row to [src/DevPanel.tsx](../../src/DevPanel.tsx).**
   - Import the capability at the top
   - Add a `<Row label="Capability name">...</Row>` inside the `CapabilitiesSection` or as its own section if it's substantial
   - Use `ActionBtn` for test action
   - Show `Unsupported` disabled state when feature-detect returns false

3. **Update [README.md](../../README.md) Features table.**
   - Add a row: feature name, description, availability, iOS Safari support, Android Chrome support
   - Honest support matrix — check MDN / caniuse before claiming support

4. **Build + typecheck.**
   ```bash
   npm run build
   ```
   Must pass with no TS errors, no unused locals.

5. **Do NOT import into `src/App.tsx` / `src/Home.tsx`** unless the capability is part of the app's core flow. Dormant means dormant.

## Example: adding clipboard

```ts
// src/lib/clipboard.ts
export function clipboardSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.clipboard;
}

export async function copy(text: string): Promise<boolean> {
  if (!clipboardSupported()) return false;
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

export async function paste(): Promise<string | null> {
  if (!clipboardSupported()) return null;
  try { return await navigator.clipboard.readText(); }
  catch { return null; }
}
```

```tsx
// DevPanel.tsx CapabilitiesSection
<Row label="Clipboard" theme={theme}>
  <ActionBtn
    onClick={async () => {
      const ok = await copy("Hello from Dev panel");
      console.log(ok ? "copied" : "failed");
    }}
    disabled={!clipboardSupported()}
    theme={theme}
  >
    {clipboardSupported() ? "Copy test" : "Unsupported"}
  </ActionBtn>
</Row>
```

## Don't

- Don't add state to `DEFAULTS` or `Prefs` unless the fork genuinely persists user choices for the capability
- Don't wire into business logic from the library file — libs should be pure
- Don't suppress errors silently in prod code; test-buttons can swallow, core flow must propagate
