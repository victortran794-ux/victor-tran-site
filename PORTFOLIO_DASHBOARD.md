# Portfolio Dashboard

Last updated: 2026-06-06

This is the quick cockpit for portfolio work: what exists, what state it is in, and what to do next.

## Authority note

This file is authoritative for current portfolio status, the active plan, project tracker state, and next actions. It is not authoritative for the master repo operating manual, agent handoff rules, creative direction, or design token values.

Consult next:

- `PORTFOLIO_SYSTEM.md` for repo structure, publishing, health checks, and maintenance rules.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for agent roles, permissions, guardrails, handoffs, and closeout.
- `PORTFOLIO_DIRECTION_BRIEF.md` for creative/product direction and enhancement intent.
- `content/design-system.md` and `content/design-system.json` for design system principles and tokens.
- `archive/planning/README.md` for historical planning context only.

## Active plan

### Current active plan

Review the newly merged Document Processing placeholder media and homepage/About wording polish as a system, keep broad visual expansion paused, and use one focused follow-up branch only after Victor chooses the next slice.

### Current next actions

1. Review the live site across desktop/mobile and Light/Dark.
2. Confirm the homepage Work wording, Ability Experience card copy, and About-page bio sentence feel grounded in Victor's voice.
3. Review the protected Document Processing page later for placeholder-media fit, caption tone, and any safer diagram/composite needs; preserve the current password-gated/noindex state.
4. Capture any notes about About image behavior, public-page media loading, Art & Illustration slideshow pause control, and remaining tone issues.
5. Do not start broad visual expansion, A2UI implementation, or protected-page promotion without explicit approval.

### Supporting historical context

- Latest reset checkpoint: `archive/planning/portfolio-enhancement-state-2026-06-06.md`.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly references them as active work.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: clean reset after public-site polish, Document Processing placeholder media, homepage/About wording polish, and Git branch cleanup; broad expansion remains paused pending review.

Recent shipped work:

- Phase C color punctuation examples are live on IBM Cloud, Ability Experience, and SAL Magazine.
- Homepage sequence system is live: tracklist intro, now-playing chip, non-sticky chapter-progress behavior, and the wide-desktop marquee gap fix.
- Navigation has been simplified: the separate top-level Galleries menu is gone, and `Art & Illustration` plus `Graphics` now live under Work.
- The homepage Work area now separates primary project cards from a dedicated Galleries subsection; the Gallery cards use one image each, orange/purple text surfaces, and the tighter `Visual archive` framing.
- Recent public-site polish also shipped: homepage Work-section copy refinement, About photo accessibility, public-page accessibility/performance hygiene, and a real Pause/Play control for the Art & Illustration slideshow.
- Follow-up cleanup shipped: public image dimensions were added, decorative em-dash rhythm was removed from selected public copy/captions, and generated content exports were regenerated.
- Document Processing placeholder media shipped in PR #63: four curated temporary visuals were added to the protected/noindex case study while preserving password gate, sitemap omission, and current navigation visibility.
- Homepage/About wording polish shipped in PR #64: the selected-work intro, Ability Experience homepage card, and one IBM bio sentence were tightened without visual, navigation, sitemap, protected-page, or asset changes.
- About page remains otherwise unchanged after the reverted program-note experiment.
- A2UI is paused as a future track; no `a2ui.html` page or public promotion yet.

Current next action:

- Use `archive/planning/portfolio-enhancement-state-2026-06-06.md` as the current reset checkpoint.
- Victor should review the recent public polish across desktop/mobile and Light/Dark, especially the homepage Work wording, Ability Experience card copy, About bio sentence, About image behavior, public-page media loading, Art & Illustration slideshow pause control, and the public dash-cleanup copy changes.
- Keep the tone/wording review active for future passes: flag pull quotes, section headers, labels, and supporting copy that feel too cheesy, over-written, or theatrical.
- Treat Document Processing as a live protected project package with temporary placeholder media now merged. If selected later, review placeholder fit and use the private media-audit handoff as source material before changing visuals or claims: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`.
- Do not start more broad visual expansion until those review notes are reviewed.

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
| Document Processing | live | live, password-protected for visitors, noindex, currently linked from the Work dropdown, omitted from sitemap | `document-processing.html`; package manifest in `case-studies/document-processing.md`; placeholder media merged in PR #63; private audit handoff at `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` | Keep live in its current protected state; review placeholder-media fit later if Victor selects the package | Preserve password gate/noindex and current navigation visibility; do not add homepage/sitemap links, raw screenshot dumps, metrics, launch claims, or major copy/media changes without approval |
| IBM Cloud Observability | live | public/password status follows existing site | existing HTML/content | No active action | Treat existing page as source of truth |
| IBM Patterns | live | protected | existing HTML/content | No active action | Preserve password gate |
| PCI | live | protected/confidential | existing HTML/content | No active action | Do not unblur confidential body copy |
| Pi Kapp App | live | public | existing HTML/content | No active action | None noted |
| Ability Experience | live | public | existing HTML/content | No active action | None noted |
| SAL Magazine | live | public | existing HTML/content | No active action | None noted |
| Art & Illustration / Graphics galleries | live | public, discoverable under Work and in the homepage Galleries subsection | `artillustration.html`; `graphicgallery.html`; homepage Work section | Review placement after nav simplification | Large image performance worth watching |

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
- `archive/planning/portfolio-upkeep-backlog-2026-05-17.md` - historical upkeep backlog; current actions live in this dashboard

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
- Local preflight currently runs the link check successfully from this PC/WSL setup.
- Local Lighthouse remains remote/GitHub-only.
- Current local image scan found no images over 1MB, though several were close in the historical `archive/planning/portfolio-upkeep-backlog-2026-05-17.md` snapshot.
- Historical note: PR #21 failed because `/document-processing` canonical/live link 404ed before the page existed live. Current state is intentional: `/document-processing` is live on Vercel, password-gated, noindex, and omitted from the sitemap.

## Preferred workflow

1. Treat each project as a package: source HTML, generated content export, package manifest, assets, and archived source notes.
2. Put durable project-package context in a single manifest under `case-studies/<slug>.md`.
3. Keep visibility, facts, narrative direction, media guidance, redesign notes, and agent boundaries in that one file unless the project truly gets huge.
4. Before touching HTML, confirm visibility/confidentiality status.
5. After meaningful site changes, run the local sanity check:
   - `./scripts/preflight.sh`
6. Before push/PR, inspect changed files with `git diff --stat` and ask Vic before external-facing/significant changes.
7. Use the GitHub health workflow for full remote Lighthouse/link checks.

## Next system improvements

- Keep the About page `Training for: (WIP)` line as an intentional joke.
- Treat Document Processing as live. Its password gate is the visitor-privacy layer, and that state is acceptable. If Vic selects that package later, use the consolidated Claude Code + Figma media audit handoff in `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` as source material before changing visuals or claims.
- Windows Git and Windows GitHub CLI are available as WSL credential bridges for push/PR/merge work when plain WSL Git/GH auth is unavailable.
- Consider local Lychee or a Windows-native health script only if local link checks become routine outside preflight.
- Optional later: add a weekly GitHub health digest only if failures occur.
