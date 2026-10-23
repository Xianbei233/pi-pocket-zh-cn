# Changelog

## 0.8.0 — 2026-10-22（本地候选，未发布；需 Pocket 0.20）

- Base on 0.7.0 (1424/282) and add 49 keys for Pocket 0.20.0: 37 strings and 12 templates, to 1461/294. No entry is removed.
- Cover the 0.20 font tools (text size in pixels, font family, ligatures, preview, duplicate), artifact sharing (publish, lifetime, version pin, revoke, public-page notice), the session filter, message time, extension shortcuts and earlier-message loading.
- The sixteen raw items from the 0.20 comparison become full `t()` keys where the source has one call site: the font preview sentence and code sample stay English as the specimen; the session-tags browser module has no `t()` and stays a framework gap.
- Merge PR64 to v0.20.0 as `68ae4b1` (parents `5a576cc` and `687a81d`), resolving 12 conflicts without dropping locale call sites or upstream features.
- Verify with 28 dictionary tests, 538 framework tests, check/lint/format, the real loader, and phone/desktop Chromium screenshots.

## 0.7.0 — 2026-10-22（本地候选，未发布）

- Base the candidate on the deployed 0.6.0 pack (SHA-256 bbd6da93…b5087, 1407/282), keeping every entry.
- Add 17 dynamic `t()` keys that the literal audit could not see: 0.19 slot labels, provider groups, built-in extension metadata, and the `unread` kind (1424/282).
- Fix 12 values: `Installed`/`Installed at`, conversation vs session terminology, model-provider terminology, the `{{count}} coming` schedule count, and the extensions/memory copy.
- Audit 1731 literal and conditional `t()` calls plus the 17 dynamic keys: none missing. Production still shows 20 UI strings through call sites with no `t()` (listed in the evidence report).
- Verify with the real loader and Chromium at 390×844 and 1280×800, screenshots included; 27/27 dictionary tests and 404/404 framework tests pass.

## 0.6.0 — 2026-10-21

- Adapt the complete pack to Pi Pocket 0.19.0: **1407 fixed strings and 282 templates**, up from 1371/274 in 0.5.0.
- Keep every earlier entry; add 36 strings and 8 templates for 0.19's slot-based top bar, places, composer and status line, the redesigned extensions and gallery sheets, and the subagents board.
- Split the overloaded `Installed`: the state and tab use `Installed` (已安装), while the install time uses `Installed at` (安装时间).
- Audit the 0.19 UI source: 1731 direct or conditional `t()` keys checked, none missing. This remains a call-site audit, not a claim that the whole interface is translated.
- Verify with the real extension loader (1407/282, default off, enable, disable back to English) and with Chromium at 390×844 and 1280×800.

## 0.5.0 — 2026-10-21

- Adapt the complete data-only Chinese UI pack to Pi Pocket 0.18.0: **1371 fixed strings and 274 templates**, up from 1042/203 in 0.4.0.
- Keep every one of the 1042/203 published entries and every one of the 1356/273 entries in the complete 0.15 dictionary unchanged; 15 strings and 1 template added for the 0.18 extension hub.
- Audit the 0.18 UI source: 1736 direct or conditional `t()` keys checked against the pack, none missing. This remains a call-site audit, not a claim that the whole interface is translated.
- Verify with the real extension loader (1371/274 loaded, default off, enabled, disabled back to English) and with Chromium at 390×844 and 1280×800 (live enable/disable without reload, dynamic content intact, no overflow or console errors).
- The framework PR [pi-pocket#64](https://github.com/TannerMidd/pi-pocket/pull/64) now carries only the generic `uiLocales` mechanism, explicit `t()` call sites, docs and a compact example pack; the complete dictionary stays in this repository.


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
