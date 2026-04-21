# CLAUDE.md — agent briefing

You are working on a fork of `simple-app-template`: a serverless, client-side PWA template that auto-deploys to GitHub Pages. The philosophy is **small, single-purpose, calm** — apps do one thing, in 2–3 screens, without a backend.

## Before you touch anything

1. Read [CLOUD_RULES.md](CLOUD_RULES.md) — the 10 hard invariants. Never violate them.
2. Read [.claude/rules/invariants.md](.claude/rules/invariants.md), [code-style.md](.claude/rules/code-style.md), [design-language.md](.claude/rules/design-language.md).
3. For repeat tasks, follow the recipes in [.claude/skills/](.claude/skills/).

## Fast facts

- **Stack:** Vite + React 18 + TypeScript (strict) + `vite-plugin-pwa`
- **Entry:** [src/main.tsx](src/main.tsx) exports `init(root, appConfig)`
- **Brand:** everything visible flows from [src/app.config.ts](src/app.config.ts)
- **Capabilities:** `src/lib/*.ts` — dormant tools (haptics, audio, notifications, reminder). Forks wire in on demand.
- **Dev panel:** triple-tap `v1.0` in Settings. Don't put regular features here.
- **Deploy:** push to `main` → GitHub Action → `https://<user>.github.io/<repo>/`
- **Node:** version pinned in `.nvmrc`. `engine-strict=true` in `.npmrc`.

## Common gotchas

- `VITE_BASE` is injected by the Action at build — don't hardcode paths
- Only `VITE_*` env vars reach the client bundle; never commit secrets
- Service workers cache aggressively — when testing, always hard-reload or unregister SW
- iOS Safari suspends backgrounded tabs; don't promise always-on reminders
- PWA Install prompt is Chrome/Edge only; iOS users use Share → Add to Home Screen

## When in doubt

Ask the user. Small apps are cheap to clarify; wrong apps are expensive to undo.
