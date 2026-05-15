# Portfolio Dashboard

Last updated: 2026-05-13

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
| Document Processing | drafting | password-gated / not public yet | `case-studies/document-processing.md` | Confirm safety/claims, then decide whether to implement page | Screenshot/confidentiality safety, final public wording |
| IBM Cloud Observability | live | public/password status follows existing site | existing HTML/content | No active action | Treat existing page as source of truth |
| IBM Patterns | live | protected | existing HTML/content | No active action | Preserve password gate |
| PCI | live | protected/confidential | existing HTML/content | No active action | Do not unblur confidential body copy |
| Pi Kapp App | live | public | existing HTML/content | No active action | None noted |
| Ability Experience | live | public | existing HTML/content | No active action | None noted |
| SAL Magazine | live | public | existing HTML/content | No active action | None noted |
| Graphic / Illustration galleries | live | public | existing HTML/content | No active action | Large image performance worth watching |

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

Current state from last inspection:

- GitHub health workflow is active.
- Recent PR #22 and #23 health runs passed.
- PR #21 failed because `/document-processing` canonical/live link 404ed before the page existed live.
- Local health script exists at `scripts/health-check.sh`.
- Local `lychee` is not installed, so local broken-link checks currently skip.
- Oversized image warnings exist for several `images/cards/diamond-*` PNGs and `images/illus-img4496.jpg`.

## Preferred workflow

1. Put durable case-study source/planning context in a single notes file under `case-studies/<slug>.md`.
2. Keep facts, draft copy, media needs, and implementation tasks in that one file unless the project truly gets huge.
3. Before touching HTML, confirm visibility/confidentiality status.
4. After meaningful site changes, run the local sanity check:
   - `./scripts/preflight.sh`
5. Before push/PR, inspect changed files with `git diff --stat` and ask Vic before external-facing/significant changes.
6. Use the GitHub health workflow for full remote Lighthouse/link checks.

## Next system improvements

- Add a weekly OpenClaw/GitHub health digest only if failures occur.
- Decide whether to install local Lychee with `brew install lychee`.
- Optional later: add a Git pre-push hook that runs `./scripts/preflight.sh`, but keep it manual for now.
