# Hard invariants

These rules must never be broken. They define what makes this family of apps coherent.

## Architecture

1. **No backend. Ever.** No Node/Python/Go runtime in production. No serverless functions. No hosted database. Output is a static `dist/` directory.
2. **No secrets in the repo.** No API keys, tokens, or credentials in source, config, or workflow env. If a third-party integration needs auth, this template is the wrong starting point.
3. **Offline-first.** The app must load and work after the service worker caches the first visit. Network calls are enhancement only — never required for core flow.
4. **Serverless persistence only.** Data lives in `localStorage` or `IndexedDB`. Access goes through `src/storage.ts`. Never call `localStorage.*` directly in feature code.

## Structure

5. **Single rebrand point.** All human-visible strings and brand colors flow from [src/app.config.ts](../../src/app.config.ts). Add new brand fields there, not scattered across components.
6. **Single logic entry.** [src/main.tsx](../../src/main.tsx) exports `init(root, appConfig)` and calls `createRoot(root).render(<App appConfig={config}/>)`. Keep this contract intact.
7. **Capabilities live in `src/lib/`.** Haptics, audio, notifications, reminder scheduler — each its own typed file. Dormant by default. No imports of `src/lib/*` from `src/App.tsx` unless the feature is part of the app's core flow.
8. **Dev panel is hidden and dev-only.** Diagnostics, test buttons, capability demos go in [src/DevPanel.tsx](../../src/DevPanel.tsx). Regular users don't see it unless they triple-tap the `v1.0` footer.

## Design

9. **No logos.** Template is agnostic. Icons are flat color tiles (`public/icon.svg`, `public/favicon.svg`). If a fork wants a logo, they add one — but not in the base template.
10. **Calm defaults.** No alert boxes mid-flow, no sudden modals, no motion that hijacks attention. Transitions in ~200–600ms, ease curves, no bouncing.

## Tooling

11. **Node version in `.nvmrc`.** CI and local dev read from the same file. Bump in one place.
12. **Only `VITE_*` env vars in `src/`.** Everything else is build-time only. `vite.config.ts` can read `process.env`; feature code cannot.
13. **TypeScript strict mode stays on.** Don't add `any`. Don't add `@ts-ignore` without a comment explaining why.
