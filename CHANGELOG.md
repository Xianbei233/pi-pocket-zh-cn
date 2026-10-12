# Changelog

## 0.4.0 — 2026-10-12

- Publish the complete data-only Chinese UI pack: **1042 fixed strings and 203 templates**, up from 679/91 in 0.3.0.
- Preserve the complete local-runtime dictionary rather than narrowing it to the still-open upstream replacement PR #64's smaller 930/190 example pack. The 112 additional fixed strings and 13 additional templates are valid `uiLocales` entries and preserve translations for features present in the local runtime.
- Confirm compatibility with the data-only `uiLocales` extension runtime proposed in [pi-pocket#64](https://github.com/TannerMidd/pi-pocket/pull/64); this language pack alone does not add that host runtime. Original PR #41 is closed in favor of #64; neither PR is merged into an upstream release.
- Refresh source audit evidence and run dictionary regressions, real loader checks, and isolated phone/desktop Chromium live enable/disable tests with a scripted model. No model requests are made.
- Known English-only surfaces and untested real services remain documented in `README.md` and `EXPANDED_AUDIT.md`; this release does not claim complete localization.

## 0.3.0 — 2026-10-10

- Publish the independent `uiLocales` package and optional assistant-side extension.
- Extend reviewed 0.13 coverage for app notices, model/plan/theme actions, archive and notification settings, PiP, Memory, webhooks/watches, dictation, compaction, shortcuts and project trust; add a named-parameter PR watch notice.
- Add source evidence, enable/disable and English-fallback regressions, verbatim-parameter checks, actual-pack loader tests, and mobile/desktop Chromium language-switch smoke tests.
- Reject hosts without the UI locale runtime before importing their app in the loader smoke test.
- Record at the time that upstream 0.13.0 lacked the runtime and that the original framework PR #41 had conflicts; see historical `UPSTREAM-AUDIT.md` for the dated context.

## 0.2.0 — 2026-10-09

- Move the UI language pack to Pi Pocket's data-only `uiLocales` extension API.
- Keep the previous source-patching installer as legacy, with migration guards against patching the new runtime.

## 0.1.0 — 2026-10-09

- Historical source-patch prototype, retained only for migration history; it is not the installation method for current Pi Pocket versions.
