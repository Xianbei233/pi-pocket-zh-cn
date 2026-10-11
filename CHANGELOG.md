# Changelog

## Unreleased

- Add only three source-confirmed composer labels: listening, idle prompt, and queued-message prompt.
- Add fallback/disable regressions and an actual-pack browser smoke test using isolated Pocket data and Chromium profiles.
- Reject hosts without the UI locale runtime before importing their app in the loader smoke test.
- Record upstream 0.13.0 compatibility limits and PR #41 framework conflicts; no framework code or published version change.

## 0.3.0 — 2026-10-10

- Extend Simplified Chinese coverage for app notices, model/plan/theme actions, archiving, and notification settings.
- Keep dynamic session titles, user text, paths, commands, provider IDs, and raw errors unchanged.
- Make locale regression tests self-contained; include an attributed test fixture of Pi Pocket's UI locale runtime.
- Prepare the standalone drop-in project for public GitHub distribution.

## 0.2.0 — 2026-10-09

- Move the UI language pack to Pi Pocket's data-only `uiLocales` extension API.
- Keep the previous source-patching installer as legacy, with migration guards against patching the new runtime.

## 0.1.0 — 2026-10-09

- Historical source-patch prototype. It is retained only for migration history and is not the installation method for current Pi Pocket versions.
