# Portfolio System

This file is the operating layer for Vic's portfolio work: where context lives, how to avoid huge chat-context dumps, and how site health is monitored.

## Authority note

This file is authoritative for repo structure, source-of-truth hierarchy, health checks, publishing/preflight, and maintenance rules. It is not the active current-status tracker, creative direction brief, or detailed agent handoff playbook.

Consult next:

- `PORTFOLIO_DASHBOARD.md` for current status, active plan, and next actions.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for agent roles, permissions, guardrails, handoffs, and closeout.
- `PORTFOLIO_DIRECTION_BRIEF.md` for creative/product direction and enhancement intent.
- `DESIGN.md` for normative design intent and formal tokens; `css/style.css` for executable runtime values; `content/design-system.json` for the contract-checked structured mirror; and `content/design-system.md` for the subordinate compatibility companion.
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
- Design contract and implementation: root `DESIGN.md` is normative, `css/style.css` is runtime, `content/design-system.json` is the checked mirror, and `content/design-system.md` is the companion.
- Hand-maintained profile/context exception: `content/profile.md`
- Project-package manifests and case-study planning/source docs: `case-studies/*.md` — see `case-studies/README.md`
- Historical planning reference only: `archive/planning/` — see `archive/planning/README.md`
- Historical website health/audit reference only: `archive/website-health-reports/`
- Dormant/superseded files: `archive/` — see `archive/README.md`
- Retired page snapshots: `archive/pages/` — see `archive/pages/README.md`

Important archive rule: truly archived files should move to the designated archive area instead of remaining mixed into active docs. Use `archive/planning/` for historical planning notes, `archive/website-health-reports/` for historical health/audit reports, `archive/pages/` for retired page snapshots, and PC-side `C:\Users\Victor\Documents\Website Items` for private handoffs/backups/recovery material that should not live in the public repo. Check with Victor before moving ambiguous archive candidates.

Important rule: once a page is implemented and approved, the matching `.html` file becomes the source of truth. Planning docs become historical context unless explicitly refreshed. Before deleting or significantly replacing a page, archive it with `node scripts/archive-page.mjs <page.html> "reason"` so its HTML, readable content, and referenced local assets stay recoverable.

## Design contract maintenance

- `DESIGN.md` is the normative design intent and formal token contract.
- `css/style.css` is the executable runtime implementation of shared tokens.
- `content/design-system.json` is the contract-checked structured mirror.
- `content/design-system.md` is the subordinate compatibility companion.
- The repository validator must fail when token values, component status, ownership, or required safety rules drift.
- Any token or component change updates the contract, implementation, structured mirror, tests, and modified date in the same reviewed change.

### Media production and delivery

- Match responsive source selection to the component's real rendered geometry.
- Keep the primary page image discoverable and right-sized; defer inactive slideshow media.
- Retain a deliberate high-resolution inspection source when the work requires it.
- Preserve dimensions, alt text, crop, keyboard behavior, focus restoration, and reduced-motion behavior through optimization.
- Every generated derivative records its generator, pinned encoder settings, source hash, output dimensions, byte size, and output hash.
- Visually review detailed artwork and image-embedded typography after compression.

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

GitHub Actions runs one `Site health check` workflow from `.github/workflows/health-check.yml`. Five logical statuses now run inside that workflow:

1. **Select validation scope:** compares immutable pull-request base/head SHAs and classifies changed PR paths with the tested repository-owned `scripts/classify-health-check-scope.mjs` dispatcher. Missing or zero PR bases fail safely to full coverage; every `main`, scheduled, and manual event forces full coverage.
2. **Portfolio checks:** always runs the fast policy, manifest, reconciliation, and classifier baseline. It adds only the changed route's build, integration, browser, media, and link groups unless shared shell/tooling paths require the full portfolio suite.
3. **Lighthouse audit · desktop:** audits twelve public production routes after every push to `main`, on the weekly schedule, or by manual dispatch.
4. **Lighthouse audit · mobile:** audits eight representative public production routes on the same non-PR events.
5. **Oversized image scan:** runs for image or full-suite changes and reports deployable images over 1MB as warnings; it does not currently fail the job when oversized images exist.

The workflow runs on:

- manual dispatch, with an optional validated base origin and forced full coverage;
- weekly schedule: Mondays at 12:00 UTC, with forced full coverage;
- every push to `main`;
- every pull request, including documentation-only and previously unlisted paths.

Pull requests intentionally skip both production-domain Lighthouse jobs because those jobs audit the current production hostname rather than the candidate preview. On every PR, the scope selector and stable `Portfolio checks` status run; route, image, browser, and Lychee steps run inside that status only when their classified dependencies changed. Vercel separately reports the preview deployment and preview-comment checks. After merge, every `main` push performs the full maintenance suite, including production Lighthouse; documentation-only PRs still avoid pre-merge live-site forensic verification.

### Current assessment

- **Coverage:** strong and intentionally layered for this portfolio. Source contracts, generated outputs, browser behavior, deployment containment, links, responsive media, and production Lighthouse protect different failure modes; their overlap is not automatically duplication.
- **Organization:** proportionate and path-aware. Documentation-only changes stop after the fast baseline, route changes run their own contracts, shared/tooling changes fail safely to the full suite, and weekly/manual runs preserve full regression coverage.
- **Enforcement:** unchanged. No classic branch protection or repository ruleset currently requires these checks before merge. The existing manual green-light remains the control until a separately reviewed ruleset is approved.
- **Portability:** the reusable baseline is classifier integrity, policy/manifest/reconciliation, generated-artifact parity, and changed-route validation. Victor-specific claims, privacy/provenance, archive, shell, and browser contracts remain portfolio-only.

### Privacy and provenance classification

- Privacy checks must classify evidence from source and provenance, not from realistic-looking interface strings alone. Names, dates, statuses, metrics, process labels, and topology can be fictional design data and are not proof of live or private records.
- When provenance is unknown or contradictory, fail closed and pause publication until the source is established. Do not represent uncertainty as confirmed exposure, and do not represent a realistic screen as safe merely because no obvious secret is visible.
- A fictional-sample-data disclosure is useful framing, not a waiver. It cannot override evidence that real client, employee, customer, medical, financial, credential, or operational data is present.
- Automated string scans may flag candidates for review, but they must not make the final privacy classification without provenance evidence and rendered-source inspection.

### Implemented control model and pending enforcement

1. **PR baseline:** classifier integrity, content-export policy, manifest validation, final reconciliation, and relevant generated-artifact checks run on every eligible PR.
2. **Changed-route portfolio contracts:** privacy, provenance, claims, shell, route-specific browser, media, archive, image, and link contracts run only when their route or shared dependencies change. Shared and workflow/tooling changes fail safely to full coverage.
3. **Post-merge production checks:** every `main` push forces the full suite, including desktop/mobile Lighthouse. Exact deployment binding and live custom-domain verification remain appropriate for meaningful deployable releases, not routine administrative changes.
4. **Scheduled maintenance:** the Monday schedule and manual dispatch force the full portfolio suite, including external links and production Lighthouse.
5. **GitHub enforcement:** no branch-protection or ruleset change is included. Any future proposal must preserve repository-owner access and an explicit emergency recovery path before Victor approves enforcement.

Local helpers:

```bash
./scripts/preflight.sh
./scripts/health-check.sh
./scripts/health-check.sh http://localhost:8000
```

`./scripts/preflight.sh` is broader than the older summary below: it runs source/privacy/route contracts, reproducible generators, browser suites, responsive/media checks, and final generated-content verification. It is manual by default and is not a Git hook.

## Last known health notes

Checked 2026-08-21:

- GitHub workflow `Site health check` is active. The post-merge run for Site checks PR #167 succeeded at merge SHA `974ae9d6c2b05710052750a6d6d7bb280d8ef282`, releasing the tested path-aware model above.
- The post-merge run for Pi Kapp PR #168 succeeded at merge SHA `a922a27fd4c7dcd4bc4cf73ba411dcc4faf882cd`, including Portfolio checks, oversized-image scan, and desktop/mobile Lighthouse jobs.
- Vercel preview and production status checks remain separate from GitHub Actions. Exact deployment and live custom-domain verification are required for meaningful deployable releases, not documentation-only or workflow-only changes.
- Branch protection and repository rules remain unchanged.
- Pi Kapp preserves its original V1 sequence, three selected static V2 states, authored expansion archive, identity evidence, and final remaster without a standalone runtime. The retired demo and system URLs redirect to the relevant case-study chapters; integration/browser contracts, Lychee, Lighthouse, preflight, and deployment containment are reconciled around the stable `/pikappapp` route.

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
