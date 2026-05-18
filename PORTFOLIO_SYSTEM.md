# Portfolio System

This file is the operating layer for Vic's portfolio work: where context lives, how to avoid huge chat-context dumps, and how site health is monitored.

## Source-of-truth map

- Public site implementation: `*.html`, `css/`, `js/`, `images/`
- Site conventions and gotchas: `victor-tran-site.md`
- Claude Code entrypoint: `CLAUDE.md`
- Generated/exported site content: `content/*.md` and `content/site-index.json` — see `content/README.md`
- Hand-maintained profile/context exception: `content/profile.md`
- Case-study planning/source docs: `case-studies/*.md` — see `case-studies/README.md`
- Dormant/superseded files: `archive/` — see `archive/README.md`
- Retired page snapshots: `archive/pages/` — see `archive/pages/README.md`

Important rule: once a page is implemented and approved, the matching `.html` file becomes the source of truth. Planning docs become historical context unless explicitly refreshed. Before deleting or significantly replacing a page, archive it with `node scripts/archive-page.mjs <page.html> "reason"` so its HTML, readable content, and referenced local assets stay recoverable.

## Case study workflow

Use small durable files instead of stuffing an entire case study into one chat.

Recommended lightweight project file:

```txt
case-studies/<project-slug>.md
```

Keep status, raw notes, confirmed facts, constraints, draft direction, media needs, and implementation notes in that one file. Split into more files only when a project truly becomes too large or sensitive. Default to fewer files.

Do **not** put durable planning/source notes in `content/`; most of `content/` is generated from HTML and should stay machine-readable/export-focused. `content/` can support future search/generative UI experiments, but it is not the notes folder.

## Current case-study state

- `document-processing.html` is intentionally live as a password-gated/noindex page that is currently linked from the Work dropdown and omitted from the sitemap.
- `case-studies/document-processing.md` is the current planning/source doc for future Document Processing refinements.
- `archive/doc-pro-case-study-handoff.md` is a historical Doc Pro handoff; the active Document Processing planning file is `case-studies/document-processing.md`.
- `content/document-processing.md` exists as generated/exported content, but check the live/current HTML before treating it as source of truth.
- Preserve the password gate/noindex and current navigation visibility; do not add homepage/sitemap promotion, screenshots, metrics, launch claims, or major copy changes without Vic approval.

## Health automation currently present

GitHub Actions already runs `Site health check` from `.github/workflows/health-check.yml`.

It runs on:

- manual dispatch from GitHub Actions
- weekly schedule: Mondays at 12:00 UTC
- pushes to `main` that touch HTML/CSS/JS/sitemap/robots files

Checks included:

- Lychee broken-link check across root HTML files
- Lighthouse audit for selected public URLs
- oversized image scan for images over 1MB

Local helper:

```bash
./scripts/health-check.sh
./scripts/health-check.sh http://localhost:8000
```

Current local caveat: `lychee` is not installed locally, so local link checks are skipped unless installed with `brew install lychee`. GitHub Actions still runs Lychee remotely.

## Last known health notes

Checked 2026-05-13:

- GitHub workflow `Site health check` is active.
- Recent successful runs exist for PR #22 and PR #23.
- PR #21 failed because `document-processing.html` linked canonically to `https://victortrandesign.com/document-processing` before that route existed live, causing Lychee to report a 404.
- Local oversized image scan currently flags several `images/cards/diamond-*` PNGs plus `images/illus-img4496.jpg`.

## Preflight checks

Run this manually before committing or pushing meaningful site changes:

```bash
./scripts/preflight.sh
```

What it does:

- prints the current branch and changed files
- runs `git diff --check`
- regenerates Markdown exports with `node scripts/html-to-md.mjs`
- scans for images over 1MB as warnings
- runs `scripts/health-check.sh` when available
- prints changed files again in case generated content changed

How it is triggered:

- **Manual by default:** run `./scripts/preflight.sh` when you want a local sanity check.
- **Not automatic:** it is not currently a Git hook, so it will not block commits or pushes.
- **Optional future hook:** if desired, a pre-push Git hook can call this script later.
- **GitHub is separate:** `.github/workflows/health-check.yml` still runs remotely on configured pushes/schedules/manual dispatch.

## Useful health commands

```bash
# List workflow status
gh workflow list --repo victortran794-ux/victor-tran-site

# Recent health runs
gh run list --repo victortran794-ux/victor-tran-site --workflow health-check.yml --limit 5

# View failed run logs
gh run view <run-id> --repo victortran794-ux/victor-tran-site --log-failed

# Trigger manual health check against production
gh workflow run "Site health check" --repo victortran794-ux/victor-tran-site

# Trigger manual health check against another base URL
gh workflow run "Site health check" --repo victortran794-ux/victor-tran-site -f url=https://victortrandesign.com
```

## Good automations to add next

### 1. Portfolio heartbeat summary

A periodic OpenClaw heartbeat can check GitHub health status, recent PRs, and local portfolio notes, then only speak up when something is broken or stale.

Suggested cadence: weekly or after portfolio work sessions, not constant.

### 2. Health check digest

A scheduled task can run:

```bash
gh run list --repo victortran794-ux/victor-tran-site --workflow health-check.yml --limit 3
```

and summarize failures with links/log snippets.

### 3. Case-study intake command

When Vic sends a case-study brain dump, immediately save it into `case-studies/<slug>.md`, then extract:

- confirmed facts
- risky claims
- open questions
- story thesis
- media needs
- Claude Code implementation checklist

### 4. Pre-push checklist

Before pushing portfolio changes:

- run `./scripts/preflight.sh`
- inspect changed files with `git diff --stat`
- ask Vic before push if work is confidential, external-facing, or significant

## Vercel connection

Known from repo docs: Vercel auto-deploys on push to `main`.

Potential next step: identify whether Vic has Vercel CLI authenticated locally or whether deployment status should be checked via GitHub commit/status checks instead. GitHub Actions is currently the safer integration point because it is already configured and accessible through `gh`.
