# Portfolio Dashboard

Last updated: 2026-05-17

This is the quick cockpit for portfolio work: what exists, what state it is in, and what to do next.

## Status legend

- `idea` — rough concept only
- `intake` — raw notes/assets being collected
- `drafting` — narrative/copy in progress
- `implementation-ready` — enough detail for Claude Code/site work
- `implemented-local` — page exists locally, not approved live
- `live` — published on site
- `paused` — intentionally not moving

## Project tracker

| Project | Status | Visibility | Source docs | Next action | Blockers / cautions |
|---|---|---|---|---|---|
| Document Processing | drafting | password-gated | `case-studies/document-processing.md` | Confirm screenshot safety, claims, and final wording before publishing | Screenshot/confidentiality safety, final public wording |
| IBM Cloud Observability | live | public/password status follows existing site | existing HTML/content | No active action | Treat existing page as source of truth |
| IBM Patterns | live | protected | existing HTML/content | No active action | Preserve password gate |
| PCI | live | protected/confidential | existing HTML/content | No active action | Do not unblur confidential body copy |
| Pi Kapp App | live | public | existing HTML/content | No active action | None noted |
| Ability Experience | live | public | existing HTML/content | No active action | None noted |
| SAL Magazine | live | public | existing HTML/content | No active action | None noted |
| Graphic / Illustration galleries | live | public | existing HTML/content | No active action | Large image performance worth watching |

## Current PC / Agent Setup

Active local repo:

```text
C:\Users\Victor\Documents\Websites\victor-tran-site
```

iCloud design/source archive:

```text
C:\Users\Victor\iCloudDrive\Documents\Design Work
```

Important operating docs:

- `AGENTS.md` - start here for future agents
- `MAGI_ACCESS_POLICY.md` - local/iCloud/Discord access rules
- `MAGI_PC_MIGRATION_PLAN.md` - PC migration architecture and follow-ups
- `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md` - current upkeep backlog

Recent merged setup PRs:

- PR #28 - Magi PC migration docs and access policy
- PR #29 - portfolio upkeep backlog and generated About content sync

## Folder model

- `content/` — generated/exported site content for indexing/search/future generative UI; see `content/README.md`
- `case-studies/` — durable planning/source notes for active case studies; see `case-studies/README.md`
- `archive/` — dormant experiments, retired systems, and superseded handoffs; see `archive/README.md`

Current archive examples:

- `archive/a2ui/` — dormant Ask Vic / generative UI data
- `archive/playground.html` and `archive/playground.css` — old playground files
- `archive/doc-pro-case-study-handoff.md` — historical Doc Pro handoff; project is now Document Processing
- active Document Processing planning file is `case-studies/document-processing.md`

## Site health

Primary automation: `.github/workflows/health-check.yml`

Current state from latest local audit:

- GitHub health workflow is active.
- Local health script exists at `scripts/health-check.sh`.
- Local `lychee` is not installed, so local broken-link checks currently skip; rely on GitHub Actions for full link checks.
- Local Lighthouse remains remote/GitHub-only.
- Current local image scan found no images over 1MB, though several are close and listed in `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md`.
- Historical note: PR #21 failed because `/document-processing` canonical/live link 404ed before the page existed live.

## Preferred workflow

1. Put durable case-study source/planning context in a single notes file under `case-studies/<slug>.md`.
2. Keep facts, draft copy, media needs, and implementation tasks in that one file unless the project truly gets huge.
3. Before touching HTML, confirm visibility/confidentiality status.
4. After meaningful site changes, run the local sanity check:
   - `./scripts/preflight.sh`
5. Before push/PR, inspect changed files with `git diff --stat` and ask Vic before external-facing/significant changes.
6. Use the GitHub health workflow for full remote Lighthouse/link checks.

## Next system improvements

- Keep the About page `Training for: (WIP)` line as an intentional joke.
- Confirm Document Processing screenshot safety, claims, and final media direction before further public changes.
- Consider installing GitHub CLI for smoother PR/workflow checks from this PC.
- Consider local Lychee or a Windows-native health script only if local link checks become routine.
- Optional later: add a weekly GitHub health digest only if failures occur.
