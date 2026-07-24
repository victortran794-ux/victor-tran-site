# Portfolio Dashboard

Last updated: 2026-07-24

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

Use the reconciled slice structure below to keep practical polish gated and future concepts opt-in. Objective technical closeout and the later maintenance backlog are complete. The Ability Experience VicO2 translation and the homepage system alignment are now live and production-verified. **VicO2 system continuation is the primary portfolio-enhancement lane**, organized as bounded page-by-page translations rather than a broad redesign. Public visual review, selected-page copy/tone work, responsive/media/interaction polish, system documentation, and proven-component Figma reconstruction now support that lane instead of competing with it as disconnected broad passes. Document Processing and wxO Canvas remain separate protected-project lanes. A2UI remains parked.

### Current next actions

1. Treat the Ability Experience and homepage VicO2 translations as complete, live production checkpoints; observe them and reopen only with new evidence.
2. Advance **VicO2 system continuation** as the primary enhancement lane: select one safe public page, build a bounded current-versus-proposed comparison, and obtain Victor's Keep / Adjust / Reject judgment before implementation.
3. Fold the selected page's desktop/mobile, Light/Dark, copy/tone, image/media, responsive, and interaction review into that translation instead of running disconnected broad redesign passes.
4. Reconcile only reusable decisions from successful production work back into the mini specification and component language; reconstruct proven foundations/components in Figma when useful, not as a blocker.
5. Keep objective technical defects that are not design-system questions—such as isolated performance regressions or third-party embed loading—separate and evidence-driven.
6. Keep Document Processing paused behind its existing protected refinement gates. Keep wxO Canvas separate as a protected case-study candidate with shipped-versus-exploratory and sanitization decisions required before design work.
7. Promote optional chapters, artifact/process storytelling, technical diagrams, and selective motion into VicO2. Keep Lens/Design-DNA and larger prototype behaviors conditional; keep A2UI, framework migration, broad redesign, generative/chat UI promotion, and uncontrolled site-wide rollout parked.

### Supporting historical context

- Latest reconciled checkpoint: `archive/planning/portfolio-enhancement-state-2026-07-12.md`.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly references them as active work.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: clean synced production baseline after the Ability Experience and homepage VicO2 translations. System continuation is the primary open enhancement lane. The next action is selection and private comparison of one safe public page, with page-specific visual, copy, responsive, media, and interaction review folded into that work. Document Processing and wxO Canvas remain separate protected lanes; future concepts remain opt-in.

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

- Use this dashboard as the current status cockpit. Use `archive/planning/portfolio-enhancement-state-2026-07-12.md` only for historical technical-closeout context.
- Use the VicO2 checkpoint at `C:\Users\Victor\Documents\Website Items\Design Kits\2026-07-23-carbon-victor-system\README.md` as the priority-lane scope and guardrail reference.
- Select one safe public page before creating another implementation branch. Its visual, mobile, Light/Dark, copy/tone, media, and interaction review should happen inside that bounded page translation.
- Keep residual objective maintenance separate when it is not a design-system question.
- Treat Document Processing as a live protected page with a separately paused private refinement. Use the 2026-07-23 Figma source audit and private comparison as its current refinement checkpoint; preserve the password gate, `noindex`, sitemap omission, media boundaries, and claims boundaries.
- Treat wxO Canvas as a separate protected case-study candidate, never as a Document Processing chapter. Resume only from its dedicated handoff.
- Keep broad visual expansion and A2UI parked unless Victor explicitly resumes them.

## Adjusted enhancement slices

**Queue rule:** VicO2 system continuation is the primary lane. Slices A–C are supporting checks to run within a selected page translation whenever relevant; they are not prerequisites for a separate site-wide review or rewrite.

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

### C2. Resolved later review backlog

These items were verified and closed through narrow, reviewed changes:

- **Contact resilience resolved:** active footers expose a visible email address, Copy email action, LinkedIn, and retained email link.
- **Pi Kapp demo cold start resolved:** `pikappapp/demo.html` includes a branded static pre-render loading state that React replaces after initialization.
- **Release wording resolved:** Accuracy Evaluation is described as planned for the second half of 2026 across the public case study and project-package notes.
- **Name consistency resolved:** public labels align to the official Performance Contracting, Inc. name.

Mobile findings from the 2026-06-09 review are void because mobile was not actually tested. Any mobile work begins with a fresh verification pass.

### D. Document Processing protected project-page state

Purpose: treat Document Processing like the rest of the portfolio while preserving its protected-page guardrails.

Current state:

- Live, password-gated, noindex, currently linked from the Work dropdown, approved for a homepage Selected Work card on 2026-06-10, and omitted from sitemap.
- Temporary placeholder media has shipped and is acceptable as-is until Victor explicitly asks for a new refinement pass.
- The `case-studies/` note remains an internal project-package workflow artifact for consistent facts/media/claims gathering across all future portfolio pages, not a visitor-facing category or priority label.

Current approved action is complete: the homepage card shipped in PR #76. If Victor explicitly reselects this page later, scope any further work as a new approval-gated slice and use the private media-audit handoff before changing visuals or claims.

Excludes sitemap changes, `noindex` changes, password-gate changes, raw screenshot dumps, metrics, launch claims, and broad project-page rewrites unless Victor explicitly chooses them.

### E. Future-concept alignment with VicO2

Purpose: move concepts into VicO2 only when they strengthen real case-study storytelling without turning them into automatic site-wide features.

Promoted into VicO2:

- Report-style project chapters as an optional long-form editorial structure.
- Artifact/process storytelling as a core case-study pattern.
- Technical diagrams as a reusable, accessible component family.
- Selective motion as a bounded behavior layer with truthful controls and reduced-motion support.

Conditional and still parked until a real page proves the need:

- Lens / Design-DNA inspection mode.
- Larger prototypes or project-progress behaviors.
- Asset/photography inventory as page preparation rather than a visible feature.

Parked outside VicO2:

- A2UI and generative/chat UI promotion.
- Framework migration or new build-system architecture absent a verified blocker.
- Broad redesign and uncontrolled site-wide rollout.

Status: A2UI remains a contained experiment under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`; the parked standalone `a2ui.html` branch must not be merged or promoted as-is. VicO2 may eventually style a real implementation, but visual compatibility does not make the technology or claims ready.

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
| Document Processing | live | live, password-protected for visitors, noindex, linked from Work and homepage Selected Work, omitted from sitemap | `document-processing.html`; project-package notes in `case-studies/document-processing.md`; placeholder media merged in PR #63; homepage card shipped in PR #76; private audit handoff at `C:\\Users\\Victor\\Documents\\Website Items\\Portfolio Handoffs\\Document Processing\\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` | No active action; second-half-of-2026 release wording aligned in PR #85 | Preserve password gate/noindex and current visibility; do not add sitemap links, raw screenshot dumps, metrics, launch claims, or major copy/media changes without approval |
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
