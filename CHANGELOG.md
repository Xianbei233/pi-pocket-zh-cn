# Changelog

## Unreleased

- Expand the paired UI coverage beyond the previous 65-key contract: 1029 fixed strings and 202 templates (+283/+110 from 88f2105), with existing translations preserved.
- Add exact source evidence, a read-only call-site auditor, comprehensive placeholder/fallback regression, real-loader coverage and isolated mobile/desktop panel checks. See `EXPANDED_AUDIT.md` for exercised panels and known residuals; this is not a claim of complete localization.

- Extend the reviewed 0.13 coverage with 64 exact fixed labels for PiP, Memory, webhooks/watches, dictation, PiP compaction, shortcuts, and project trust; add one named-parameter PR watch notice.
- Record exact English keys, translations, and source evidence in `locale-coverage.json`; independently verify all 64 fixed-key and one template call sites against final framework commit `77b1d928935b423524e2f53d077b850979da34ad`.
- Add contract-wide enable/disable, English fallback, verbatim-parameter regression, final-host loader checks, and mobile/desktop Chromium language-switch smoke tests.
- Add three source-confirmed composer labels: listening, idle prompt, and queued-message prompt.
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
