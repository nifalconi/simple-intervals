# Cloud Rules

Invariants every app generated from this template must honor. Agents and automation workflows must enforce these before committing or deploying.

## Hard invariants (never break)

1. **No server.** No Node/Python/Go runtime in production. No serverless functions. No hosted database.
2. **No secrets in the repo.** No API keys, tokens, or credentials in source, config, or workflow env. If a third-party call needs auth, the app is out of scope for this template.
3. **Offline-first.** The app must load and function after the service worker caches the first visit. Network calls are enhancement only.
4. **Static output.** `npm run build` produces a `dist/` directory that can be served by any static host. Nothing else.
5. **Single rebrand point.** All human-visible strings and brand colors flow from [src/app.config.ts](src/app.config.ts) and shared constants in [src/constants.ts](src/constants.ts).
6. **Single logic entry.** Apps expose exactly one contract: `init(root, appConfig)` exported from [src/main.tsx](src/main.tsx). For React apps this function calls `createRoot(root).render(<App appConfig={config}/>)`; for vanilla apps it manipulates the DOM directly.
7. **Persistence boundary.** Storage goes through [src/storage.js](src/storage.js) (`load` / `save` / `remove`). No direct `localStorage.*` calls in core logic.
8. **Version parity.** Node version lives in `.nvmrc` (mirrored in `.node-version`). CI and local dev must read from that file — never hardcode versions in workflows or scripts.
9. **Env boundary.** Only `VITE_*` env vars may be referenced in `src/`. `.env*` files (except `.env.example`) are gitignored. No secrets in any committed env file.
10. **Never use a logo**: The apps are meant to be agnostic, no logo's allowed.

## Soft rules (prefer, don't require)

- React + TypeScript is the default stack (design handoffs from Claude Design ship JSX; types document fork contracts). Swap framework if the app does not need reactivity.
- Keep `devDependencies` under 10 packages.
- Keep the production bundle under 150 KB gzipped (React baseline ~45 KB).
- Use SVG for icons. Flat color tiles only — invariant #10 forbids logos.

## Agent checklist (run before opening a PR)

- [ ] `npm run build` succeeds with no warnings (runs `tsc --noEmit` first — no TS errors).
- [ ] `npm run typecheck` passes (strict mode; no `any` added to shared types).
- [ ] `dist/` contains `manifest.webmanifest` and a service worker file.
- [ ] `src/app.config.js` values appear correctly in `dist/manifest.webmanifest`.
- [ ] No occurrences of `fetch(` without an explicit offline fallback path.
- [ ] No occurrences of `process.env.*` in `src/` (client code uses `import.meta.env.VITE_*` only).
- [ ] `.nvmrc` and `.node-version` agree; `deploy.yml` uses `node-version-file`.
- [ ] README's "What this app does" and "Who it's for" sections are filled in (no placeholder text).
- [ ] `.github/workflows/deploy.yml` is unchanged or diff is explained in the PR body.

## Generation recipe (for code-driven workflows)

Given an app spec `{ name, shortName, description, purpose, audience, themeColor, accentColor, coreLogic }`:

1. Clone `simple-app-template`.
2. Rewrite `src/app.config.js` with spec values.
3. Replace `src/App.tsx` (and related screen files) with the spec's logic. `src/main.tsx` keeps the `init(root, appConfig)` entry.
4. Regenerate `public/icon.svg` + `public/favicon.svg` as flat-color tiles using the spec's `themeColor` (no marks, per invariant #10).
5. Rewrite the "What this app does" / "Who it's for" sections of `README.md`.
6. Run the agent checklist above.
7. Push to a new repo. The deploy workflow is self-configuring (`VITE_BASE` derives from the repo name).
