# Code style

## TypeScript

- **Strict mode is on.** `noUnusedLocals`, `noUnusedParameters`, `strict` all true. Honor them.
- Never `any`. Use `unknown` if a type is genuinely unknown at a boundary, then narrow.
- No `@ts-ignore` or `@ts-expect-error` without a one-line comment explaining why.
- Prefer `interface` for object shapes the app owns; `type` for unions, intersections, mapped types.
- Use `import type` for type-only imports.
- Extensions in imports: this project uses `.ts`/`.tsx` explicitly (Bundler resolution + `allowImportingTsExtensions`). Write `import X from "./foo.tsx"`, not `"./foo"`.

## React

- Functional components only. Hooks for state + effects.
- Props are typed with an interface named `<Component>Props`.
- Extract repeated UI primitives (Row, Card, Pill) into the component file that uses them; don't build a global UI library unless three components share code.
- No `useMemo` / `useCallback` unless there's a measured perf problem. The bundle is small.
- Inline styles are fine — matches the template's design-handoff-friendly approach. CSS is for globals + keyframes only (see [src/style.css](../../src/style.css)).

## Files

- One screen per file. Screens live in `src/`, capabilities in `src/lib/`.
- Entry contract: `src/main.tsx` calls `init(root, appConfig)`. Don't add side effects to other files.
- Constants + shared types: [src/constants.ts](../../src/constants.ts). Brand config: [src/app.config.ts](../../src/app.config.ts).

## Imports

- External → internal → types (in that order), blank line between groups
- Absolute paths not configured — use relative (`./Home.tsx`, `./lib/audio.ts`)

## Comments

- Default: write no comment. Code should read itself.
- Write a comment when: (1) the *why* is non-obvious, (2) there's a subtle invariant, or (3) a workaround for a specific platform bug (iOS Safari quirks count).
- Never: summarize what the next 5 lines do.

## Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`
- Subject ≤50 chars. Body explains *why* when it's not obvious.
- Small commits over giant ones. Each commit should leave the repo in a buildable state.
