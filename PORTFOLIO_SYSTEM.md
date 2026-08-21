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

- `document-processing.html` is a raw `.html` implementation artifact for a protected Document Processing page. `data/projects.json` sets `manifest nav=false/homepage=false`; it is omitted from Work and homepage, while the protected wxO umbrella reaches its chapter. `/document-processing` intentionally permanently redirects to `/wxo-canvas#document-processing`.
- `case-studies/document-processing.md` is the current package manifest for future Document Processing refinements.
- `archive/doc-pro-case-study-handoff.md` is a historical Doc Pro handoff; the active Document Processing planning file is `case-studies/document-processing.md`.
- `content/document-processing.md` exists as generated/exported content, but check the live/current HTML before treating it as source of truth.
- Preserve the password gate/noindex and current navigation visibility; do not add homepage/sitemap promotion, screenshots, metrics, launch claims, or major copy changes without Vic approval.
- The static client-side password gate is visitor deterrence and discovery reduction, not server-side access control. Served HTML can contain the page source. No material requiring true confidentiality may be added until a separately approved server-side protection or private-hosting architecture exists.

## Health automation currently present

GitHub Actions runs one `Site health check` workflow from `.github/workflows/health-check.yml`. Four jobs currently run inside one `Site health check` workflow:

1. **Broken link check:** the primary blocking job. Its name is historical: it also runs source, manifest, privacy, generated-export, responsive-image, route-specific integration, browser, accessibility, media, and Lychee link contracts. The latest post-merge run contained 34 named validation steps and completed in about six minutes.
2. **Lighthouse audit · desktop:** audits twelve public production routes after eligible pushes to `main`, on the weekly schedule, or by manual dispatch.
3. **Lighthouse audit · mobile:** audits eight representative public production routes on the same non-PR events.
4. **Oversized image scan:** reports deployable images over 1MB as warnings; it does not currently fail the job when oversized images exist.

The workflow runs on:

- manual dispatch, with an optional validated base origin;
- weekly schedule: Mondays at 12:00 UTC;
- eligible pushes to `main` selected by a large path allowlist;
- eligible pull requests selected by the same path allowlist.

Pull requests intentionally skip both production-domain Lighthouse jobs because those jobs audit the current production hostname rather than the candidate preview. On PRs, the primary contract/browser/link job and oversized-image scan run, while Vercel separately reports the preview deployment and preview-comment checks. After merge, use the workflow run whose `headSha` equals the merge commit for default-branch evidence, then verify the exact Vercel production deployment and live custom domain.

### Current assessment

- **Coverage:** strong and intentionally layered for this portfolio. Source contracts, generated outputs, browser behavior, deployment containment, links, responsive media, and production Lighthouse protect different failure modes; their overlap is not automatically duplication.
- **Organization:** too monolithic. The primary job serializes most route-specific browser suites, so a narrow documentation or naming change still waits for the complete portfolio contract chain.
- **Enforcement:** too weak. No classic branch protection or repository ruleset currently requires these checks before merge. The existing manual green-light and exact-SHA release procedure is effective but remains procedural rather than GitHub-enforced.
- **Portability:** mixed. Keep the portfolio-specific contracts in this repository, but extract a smaller reusable web-project baseline instead of copying every Victor-specific route assertion into unrelated projects.

### Privacy and provenance classification

- Privacy checks must classify evidence from source and provenance, not from realistic-looking interface strings alone. Names, dates, statuses, metrics, process labels, and topology can be fictional design data and are not proof of live or private records.
- When provenance is unknown or contradictory, fail closed and pause publication until the source is established. Do not represent uncertainty as confirmed exposure, and do not represent a realistic screen as safe merely because no obvious secret is visible.
- A fictional-sample-data disclosure is useful framing, not a waiver. It cannot override evidence that real client, employee, customer, medical, financial, credential, or operational data is present.
- Automated string scans may flag candidates for review, but they must not make the final privacy classification without provenance evidence and rendered-source inspection.

### Recommended control model, not yet implemented

1. **Required PR baseline:** syntax/build, tests, changed-route integration, accessibility smoke, internal links, generated-artifact parity, and Vercel preview status.
2. **Portfolio contract suite:** retain privacy, provenance classification, claims, manifest, shell, route-specific browser, media, and archive contracts here. Split them into named jobs or path-aware groups only when the split preserves coverage and makes failures easier to locate.
3. **Post-merge production gate:** keep desktop/mobile Lighthouse, production-host checks, exact merge-SHA deployment binding, and live custom-domain verification after deployment.
4. **Scheduled maintenance:** keep weekly external-link and production Lighthouse coverage; add dependency/action-runtime review only when it produces an actionable finding.
5. **GitHub enforcement:** propose a branch ruleset requiring the PR baseline and Vercel preview before merge, blocking direct pushes to `main`, and preserving an explicit recovery path. Do not enable it until Victor reviews repository-owner access and emergency rollback behavior.

Local helpers:

```bash
./scripts/preflight.sh
./scripts/health-check.sh
./scripts/health-check.sh http://localhost:8000
```

`./scripts/preflight.sh` is broader than the older summary below: it runs source/privacy/route contracts, reproducible generators, browser suites, responsive/media checks, and final generated-content verification. It is manual by default and is not a Git hook.

## Last known health notes

Checked 2026-08-21:

- GitHub workflow `Site health check` is active and the post-merge run for PR #165 succeeded at merge SHA `a13d369780f599efd4b148582bec7a452fe0908c`.
- The PR #165 run passed the primary contract/browser/link job and oversized-image scan; both production Lighthouse jobs were intentionally skipped on the PR event.
- The post-merge run passed the primary job, desktop Lighthouse, mobile Lighthouse, and oversized-image scan.
- Vercel preview and production status checks are separate from GitHub Actions. They must be tied to the reviewed head SHA and post-merge SHA respectively.
- Pi Kapp's standalone demo is currently included in reproducible build verification, the Pi Kapp integration/browser contracts, Lychee exclusions, and both production Lighthouse inventories. A static-screen simplification must reconcile each dependency rather than only deleting `pikappapp/demo.html`.

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
