# Changelog

All notable changes to Simple Intervals are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-20

First cut of Simple Intervals — a calm interval timer PWA, forked from
[simple-app-template](https://github.com/nifalconi/simple-app-template).

### Added

- **Library** screen listing saved routines with task count, total time, and rest duration at a glance.
- **Editor** screen: rename routine, add / delete / drag-reorder tasks, set minutes and seconds per task, autosave.
- **Runner** screen with two view modes:
  - **Focus** — big card for the current task, "up next" peek below.
  - **List** — all tasks stacked, each disappearing as it finishes.
- Two timer animations: **Consume** (fills in) and **Drain** (recedes).
- Runner controls: previous, restart task, pause / resume, skip, restart routine.
- Tap-to-pause on the current task card.
- Per-routine sound cues: start, halfway ping, end, 3-2-1 countdown.
- Four Web-Audio sound packs — Classic beep, Gentle chime, Arcade blip, Boxing bell — with tap-to-preview in the editor.
- **Task notifications** toggle per routine: OS notification fires at the start of every task (skips rest). Permission is requested on enable; inline hint appears if denied or unsupported.
- **History** screen: last 50 completed runs, total time, tasks done, session count, clear button.
- Four seed routines: HIIT Blast, Pomodoro focus, Meditation, Morning stretch.
- **Settings** screen with:
  - Light / Dark / Auto theme.
  - Five accent colors (Green, Sun, Coral, Sky, Violet) rendered as swatch cards.
  - Three typography options: Grot (Space Grotesk), Serif (Fraunces), Mono (DM Mono).
  - Timer display chooser (Consume / Drain) with animated preview cards.
  - Running view chooser (Focus / List) with inline preview cards.
  - Global sound master switch.
  - PWA install prompt.
  - Hidden Dev panel (triple-tap the `v1.0` footer).
- Splash screen with wordmark animation on first paint.
- All state persisted to `localStorage` under `simple_intervals_v1`; last view remembered between reloads.
- Vitest test suite covering the pure store layer (22 tests).

### Changed

- Rebranded from the underlying template to Simple Intervals: `package.json` name, `index.html` title, `src/app.config.ts`.
- Accent palette swapped from the template's four pastels to the five design hues (hue-driven via `--accent-h`).

[Unreleased]: https://github.com/OWNER/REPO/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OWNER/REPO/releases/tag/v0.1.0
