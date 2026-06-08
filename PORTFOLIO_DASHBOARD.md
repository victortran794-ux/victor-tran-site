# Portfolio Dashboard

Last updated: 2026-06-08

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

Use the adjusted slice structure below to keep practical polish gated and keep future concepts opt-in. Mechanical current-site checks passed on 2026-06-06 and a final objective closeout passed on 2026-06-07 after the voiceover wording cleanup. On 2026-06-08, the project-package notes workflow was clarified: `case-studies/` files are internal gathering docs for consistent facts, media, claims, and guardrails across portfolio pages, not a visitor-facing label. The standing Document Processing-specific media/story item is now closed; keep the page stable unless Victor explicitly selects a new refinement. If Victor flags a concrete issue during manual review, choose one narrow practical slice. A2UI has been contained as a parked experiment for future pickup, so the active slate returns to the docket/menu below.

### Current next actions

1. Treat the objective closeout as complete: live homepage/About/Art & Illustration/Document Processing/sitemap checks passed, local preflight passed, the About voiceover copy is simplified, generated exports are current, Document Processing guardrails still hold, and no open PRs remain.
2. Victor's next step is manual site review across desktop/mobile and Light/Dark. If he notices a concrete issue, choose one narrow practical slice: public copy/tone or public visual/interaction polish.
3. Treat A2UI as parked. The inline prototype is preserved under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/` for future pickup when the technology/infrastructure catches up.
4. Choose the next task from the docket/menu: current-site review, public copy/tone, public visual/interaction polish, or another future concept.
5. Keep broader visual expansion, new portfolio concept systems, report-style chapters, lens/DNA mode, and bigger motion/prototype ideas opt-in until Victor selects one.
6. Do not start protected-page promotion, sitemap changes, major copy rewrites, homepage/nav/sitemap promotion, floating chat widgets, or broad redesign work without explicit approval.

### Supporting historical context

- Latest reset checkpoint: `archive/planning/portfolio-enhancement-state-2026-06-06.md`.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly references them as active work.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: clean reset after public-site polish, Document Processing placeholder media, homepage/About wording polish, adjusted slice docs, mechanical review-gate checks, and the final objective closeout before Victor's manual review; practical slices are gated and future concepts are the next planning area if Victor selects them. Project-package notes are an internal system for keeping future portfolio pages consistent.

Recent shipped work:

- Phase C color punctuation examples are live on IBM Cloud, Ability Experience, and SAL Magazine.
- Homepage sequence system is live: tracklist intro, now-playing chip, non-sticky chapter-progress behavior, and the wide-desktop marquee gap fix.
- Navigation has been simplified: the separate top-level Galleries menu is gone, and `Art & Illustration` plus `Graphics` now live under Work.
- The homepage Work area now separates primary project cards from a dedicated Galleries subsection; the Gallery cards use one image each, orange/purple text surfaces, and the tighter `Visual archive` framing.
- Recent public-site polish also shipped: homepage Work-section copy refinement, About photo accessibility, public-page accessibility/performance hygiene, and a real Pause/Play control for the Art & Illustration slideshow.
- Follow-up cleanup shipped: public image dimensions were added, decorative em-dash rhythm was removed from selected public copy/captions, and generated content exports were regenerated.
- Document Processing placeholder media shipped in PR #63: four curated temporary visuals were added to the protected/noindex project page while preserving password gate, sitemap omission, and current navigation visibility.
- Homepage/About wording polish shipped in PR #64: the selected-work intro, Ability Experience homepage card, and one IBM bio sentence were tightened without visual, navigation, sitemap, protected-page, or asset changes.
- About voiceover cleanup shipped in PRs #71 and #72: the game-show wording was replaced with `open to voice over work`, the generated About export and profile Markdown were aligned, and the repo returned to clean synced `main`.
- About page remains otherwise unchanged after the reverted program-note experiment.
- A2UI experiments are parked: the standalone `a2ui.html` branch remains unmerged, and the inline About-page prototype is contained under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`.

Current next action:

- Use `archive/planning/portfolio-enhancement-state-2026-06-07.md` as the current manual-review-ready checkpoint.
- Use the adjusted enhancement slices below so review, copy, visual/UI polish, protected-page work, and future concepts do not get mixed together.
- Mechanical current-site review checks passed on 2026-06-06 and final objective closeout checks passed on 2026-06-07; human review can still create a narrow practical follow-up, but practical polish is not blocking future-concepts planning.
- Keep the tone/wording review active for future passes: flag pull quotes, section headers, labels, captions, metadata, and supporting copy that feel too cheesy, over-written, theatrical, or agent-written.
- Treat Document Processing as a normal live protected project page with temporary placeholder media now merged and no standing project-specific action. Its `case-studies/` notes file is part of the shared project-package workflow for gathering consistent information across portfolio pages. If Victor explicitly reselects the page later, use the private media-audit handoff as source material before changing visuals or claims: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`.
- Keep broad visual expansion paused. Keep A2UI parked in `archive/experiments/a2ui-inline-about-methodology-2026-06-06/` until Victor explicitly resumes it; do not merge or promote the parked standalone page as-is.

## Adjusted enhancement slices

### A. Current-site review and punch list

Purpose: review what is already live and decide what actually needs attention before creating another branch.

Includes:

- Homepage Work/Galleries framing and whether `Visual archive` feels like supporting material.
- Ability Experience card copy.
- About wording and image behavior.
- Art & Illustration slideshow Pause/Play control.
- Desktop/mobile and Light/Dark checks.
- Tone issues that feel too polished, cheesy, theatrical, or agent-written.

Output: a short prioritized punch list. No implementation unless Victor approves a specific item.

### B. Public copy/tone slice

Purpose: make the public site sound more like Victor and less agent-polished.

Includes:

- Homepage card copy.
- Gallery labels and captions.
- About copy.
- Pull quotes and section headers.
- Dash-heavy or overly clever sentence rhythm.

Excludes layout redesign, new visuals, and protected pages unless Victor explicitly selects them.

### C. Public visual/interaction polish slice

Purpose: make small public-page UI improvements without starting a new design-system rollout.

Includes:

- Art & Illustration Pause/Play button treatment.
- Homepage Work/Galleries visual balance.
- Media loading and image behavior.
- Small responsive tweaks.

Excludes new design-system rollout, new homepage structure, and Document Processing.

### D. Document Processing closed protected-page state

Purpose: keep the protected Document Processing portfolio page stable without carrying a standing page-specific task.

Current state:

- Live, password-gated, noindex, currently linked from the Work dropdown, and omitted from sitemap.
- Temporary placeholder media has shipped and is acceptable as-is until Victor explicitly asks for a new refinement pass.
- The `case-studies/` note remains an internal project-package workflow artifact for consistent facts/media/claims gathering across all future portfolio pages.

No active next action. If Victor explicitly reselects this page later, scope the work as a new approval-gated slice and use the private media-audit handoff before changing visuals or claims.

Excludes homepage promotion, sitemap changes, `noindex` changes, password-gate changes, raw screenshot dumps, metrics, launch claims, and broad case-study rewrites unless Victor explicitly chooses them.

### E. Future concepts parked

Purpose: keep bigger ideas captured without letting them accidentally become the next implementation task.

Includes:

- A2UI.
- Broader visual expansion.
- New portfolio concept systems.
- Report-style chapter treatments.
- Bigger motion/prototype ideas.

Status: A2UI is parked as a contained experiment under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`; resume only when Victor explicitly selects it and the technology/infrastructure is ready. The rest remain parked and opt-in. The parked standalone `a2ui.html` branch should not be merged or promoted as-is.

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
| Document Processing | live | live, password-protected for visitors, noindex, currently linked from the Work dropdown, omitted from sitemap | `document-processing.html`; project-package notes in `case-studies/document-processing.md`; placeholder media merged in PR #63; private audit handoff at `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` | No standing Document Processing-specific action; keep live in its current protected state unless Victor explicitly reselects the page | Preserve password gate/noindex and current navigation visibility; do not add homepage/sitemap links, raw screenshot dumps, metrics, launch claims, major copy/media changes, or generic document-processing workflow tasks without approval |
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
