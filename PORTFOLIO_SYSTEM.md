# Portfolio System

This file is the operating layer for Vic's portfolio work: where context lives, how to avoid huge chat-context dumps, and how site health is monitored.

## Authority note

This file is authoritative for repo structure, source-of-truth hierarchy, health checks, publishing/preflight, and maintenance rules. It is not the active current-status tracker, creative direction brief, or detailed agent handoff playbook.

Consult next:

- `PORTFOLIO_DASHBOARD.md` for current status, active plan, and next actions.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for agent roles, permissions, guardrails, handoffs, and closeout.
- `PORTFOLIO_DIRECTION_BRIEF.md` for creative/product direction and enhancement intent.
- `content/design-system.md` and `content/design-system.json` for design system authority.
- `archive/planning/README.md` and `archive/website-health-reports/` for historical reference only.

## Source-of-truth map

- Master operating manual: `PORTFOLIO_SYSTEM.md`
- Current status and active next actions: `PORTFOLIO_DASHBOARD.md`
- Creative/product direction and enhancement intent: `PORTFOLIO_DIRECTION_BRIEF.md`
- Agent workflow, permissions, guardrails, handoffs, and closeout: `PORTFOLIO_AGENT_WORKFLOWS.md`
- Independent portfolio direction and rendered-design review: `PORTFOLIO_DESIGN_CRITIQUE_RUBRIC.md`
- Public site implementation: `*.html`, `css/`, `js/`, `images/`
- Site conventions and gotchas: `victor-tran-site.md`
- Claude Code entrypoint: `CLAUDE.md`
- Generated/exported site content: `content/*.md` and `content/site-index.json` — see `content/README.md`
- Design system prose and structured tokens: `content/design-system.md` and `content/design-system.json`
- Hand-maintained profile/context exception: `content/profile.md`
- Project-package manifests and case-study planning/source docs: `case-studies/*.md` — see `case-studies/README.md`
- Historical planning reference only: `archive/planning/` — see `archive/planning/README.md`
- Historical website health/audit reference only: `archive/website-health-reports/`
- Dormant/superseded files: `archive/` — see `archive/README.md`
- Retired page snapshots: `archive/pages/` — see `archive/pages/README.md`

Important archive rule: truly archived files should move to the designated archive area instead of remaining mixed into active docs. Use `archive/planning/` for historical planning notes, `archive/website-health-reports/` for historical health/audit reports, `archive/pages/` for retired page snapshots, and PC-side `C:\Users\Victor\Documents\Website Items` for private handoffs/backups/recovery material that should not live in the public repo. Check with Victor before moving ambiguous archive candidates.

Important rule: once a page is implemented and approved, the matching `.html` file becomes the source of truth. Planning docs become historical context unless explicitly refreshed. Before deleting or significantly replacing a page, archive it with `node scripts/archive-page.mjs <page.html> "reason"` so its HTML, readable content, and referenced local assets stay recoverable.

## Project package / case study workflow

Use small durable files instead of stuffing an entire case study into one chat.

Recommended lightweight project-package manifest:

```txt
case-studies/<project-slug>.md
```

Treat each project as a contained package even while the static site keeps flat root HTML files. A package usually has a source HTML page, generated content export, package manifest, assets, and archived source notes. Keep status, visibility, confirmed facts, constraints, narrative direction, media guidance, redesign notes, and implementation boundaries in the package manifest. Split into more files only when a project truly becomes too large or sensitive. Default to fewer files.

When two packages enter a redesign sprint, keep the sprint contract and private annotated references outside the public repo under `C:\Users\Victor\Documents\Website Items\Portfolio Sprints\`. Promote only durable, reusable decisions back into this repo's existing authority files. Do not create duplicate strategy, visual-direction, component, or content-hierarchy authorities when the information already belongs in the direction brief, design system, agent workflow, critique rubric, or package manifests.

Do **not** put durable planning/source notes in `content/`; most of `content/` is generated from HTML and should stay machine-readable/export-focused. `content/` can support future search/generative UI experiments, but it is not the notes folder.

## Current case-study state

- `document-processing.html` is intentionally live as a password-protected/noindex page that is currently linked from the Work dropdown and omitted from the sitemap. The password gate is the visitor-privacy layer, not an unresolved launch blocker.
- `case-studies/document-processing.md` is the current package manifest for future Document Processing refinements.
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
- PR #21 failed because `document-processing.html` linked canonically to `https://www.victortrandesign.com/document-processing` before that route existed live, causing Lychee to report a 404.
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
gh workflow run "Site health check" --repo victortran794-ux/victor-tran-site -f url=https://www.victortrandesign.com
```

## Historical automation ideas, not active next actions

These ideas are parking-lot material only. Use `PORTFOLIO_DASHBOARD.md` for current next actions.

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
