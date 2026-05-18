# Portfolio Status

Last updated: 2026-05-18

## Current system

- Main ops doc: `PORTFOLIO_SYSTEM.md`
- Site conventions: `victor-tran-site.md`
- Claude entrypoint: `CLAUDE.md`
- Agent entrypoint: `AGENTS.md`
- Local access policy: `MAGI_ACCESS_POLICY.md`
- PC migration notes: `MAGI_PC_MIGRATION_PLAN.md`
- Current upkeep backlog: `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md`
- GitHub health workflow: `.github/workflows/health-check.yml`
- Local preflight script: `scripts/preflight.sh`
- Local health script: `scripts/health-check.sh`
- Active local clone on this PC: `C:\Users\Victor\Documents\Websites\victor-tran-site`
- iCloud design/source archive: `C:\Users\Victor\iCloudDrive\Documents\Design Work`

## Recent setup work

### PC / Magi migration

PR #28 merged on 2026-05-17 and added the repo operating docs for Magi/Codex work from this PC:

- `AGENTS.md`
- `MAGI_ACCESS_POLICY.md`
- `MAGI_PC_MIGRATION_PLAN.md`
- `MIGRATION_FINDINGS_2026-05-17.md`

Key decision: use the local Git clone outside iCloud for website work. Treat the iCloud `victor-tran-site` copy as reference/archive because its `.git` folder behaves like an iCloud placeholder on Windows.

### Portfolio upkeep audit

PR #29 merged on 2026-05-17 and added:

- `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md`
- generated About content sync in `content/about.md`
- generated heading sync in `content/site-index.json`

## Active/nearby work

### Document Processing case study

Current planning doc: `case-studies/document-processing.md`

Current decision: Document Processing is allowed to remain live in its current password-gated/noindex state. Treat the live page as acceptable protected portfolio material that is currently linked from the Work dropdown and omitted from the sitemap; preserve the password gate and do not add homepage/sitemap promotion, new screenshots, or major claim/copy changes unless Vic explicitly asks.

### About page current-state item

`about.html` currently has `Training for: (WIP)`. Victor confirmed this is intentional and should stay because he may get back to it.

## Health automation snapshot

GitHub workflow: active

Recent historical notes:

- PR #23: success
- PR #22: success
- PR #21: failed because `document-processing.html` linked to a live `/document-processing` URL before it existed, causing a Lychee 404; `/document-processing` now resolves successfully and is intentionally password-gated/noindex

Local check notes from 2026-05-17:

- `lychee` is not installed locally, so local link check skipped
- local Lighthouse remains a GitHub Actions task
- current local image scan found no images over 1MB, though several are close and listed in `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md`

## Next useful actions

- Use `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md` as the current action list, with the updated Document Processing decision below.
- Continue using the single lightweight `case-studies/document-processing.md` planning file.
- Keep the About page `Training for: (WIP)` item as-is.
- Run `node scripts/html-to-md.mjs` after page copy changes.
- Run `./scripts/preflight.sh` before meaningful commits/pushes when local tooling supports it.
- Consider installing GitHub CLI later if terminal PR creation and workflow checks become useful.
- Consider Lychee or a Windows-native local link-check script only if local link checks become routine.
