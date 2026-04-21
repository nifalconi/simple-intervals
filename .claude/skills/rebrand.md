# Skill: Rebrand a fork

Change the app's identity — name, colors, description — without touching feature code.

## Steps

1. **Edit [src/app.config.ts](../../src/app.config.ts).**
   Set each field:
   - `name` / `shortName` — app display name (lowercase is fine — the design uses lowercase)
   - `description` — one-sentence pitch for the PWA manifest
   - `themeColor` / `backgroundColor` — usually the same hex, matches the app's bg
   - `accentColor` — the dominant accent (pick from sage/blue/lavender/beige or add your own to `ACCENTS` in `constants.ts`)
   - `purpose` / `audience` — one-sentence each, surfaced in README
   - `display` / `orientation` / `lang` — PWA manifest fields

2. **Optional: edit [src/constants.ts](../../src/constants.ts).**
   - `ACCENTS` map: add new swatches or remove unused ones
   - `DEFAULTS`: change defaults for accent / themeMode / reminder

3. **Icons: edit [public/icon.svg](../../public/icon.svg) and [public/favicon.svg](../../public/favicon.svg).**
   - Flat color tiles only (invariant #9 — no logos)
   - Match `themeColor` or a neutral tone
   - Keep them `viewBox="0 0 512 512"` (icon) and `64 64` (favicon)

4. **Update `<title>` in [index.html](../../index.html)** to match the new name.

5. **Update [README.md](../../README.md)** title + one-liner + "What this app does / Who it's for" sections.

6. **Build + verify manifest.**
   ```bash
   npm run build
   cat dist/manifest.webmanifest
   ```
   Name, colors, description should match `app.config.ts`.

7. **Commit:** `chore: rebrand to <name>`.

## Don't

- Don't rename source files (`App.tsx`, `main.tsx`, etc.). They're the template's contract.
- Don't change [CLOUD_RULES.md](../../CLOUD_RULES.md) unless you're genuinely changing the template philosophy.
- Don't add a logo to the icon. See invariant #9.
