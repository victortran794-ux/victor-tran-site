# Portfolio Status

Last updated: 2026-05-18

## Legacy snapshot notice

This file is a historical status snapshot from 2026-05-18. It is not the active status tracker or next-actions board. Current portfolio status, active plan, and next actions live in `../../PORTFOLIO_DASHBOARD.md`.

Use this file only for historical context about the PC/Magi migration, early upkeep audit, and older health automation notes. If any current-looking detail here conflicts with `../../PORTFOLIO_DASHBOARD.md`, `../../PORTFOLIO_SYSTEM.md`, or `../../PORTFOLIO_AGENT_WORKFLOWS.md`, treat those active files as authoritative.

## Current system

- Main ops doc: `PORTFOLIO_SYSTEM.md`
- Site conventions: `victor-tran-site.md`
- Claude entrypoint: `CLAUDE.md`
- Agent entrypoint: `AGENTS.md`
- Local access policy: `MAGI_ACCESS_POLICY.md`
- PC migration notes: `MAGI_PC_MIGRATION_PLAN.md`
- Historical upkeep backlog: `portfolio-upkeep-backlog-2026-05-17.md`
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

- `portfolio-upkeep-backlog-2026-05-17.md`
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
- current local image scan found no images over 1MB, though several are close and listed in `portfolio-upkeep-backlog-2026-05-17.md`

## Next useful actions

- Historical instruction said to use `portfolio-upkeep-backlog-2026-05-17.md` as the action list; that backlog is now archived, and current actions live in `../../PORTFOLIO_DASHBOARD.md`.
- Continue using the single lightweight `case-studies/document-processing.md` planning file.
- Keep the About page `Training for: (WIP)` item as-is.
- Run `node scripts/html-to-md.mjs` after page copy changes.
- Run `./scripts/preflight.sh` before meaningful commits/pushes when local tooling supports it.
- Consider installing GitHub CLI later if terminal PR creation and workflow checks become useful.
- Consider Lychee or a Windows-native local link-check script only if local link checks become routine.
