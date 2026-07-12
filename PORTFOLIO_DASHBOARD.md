# Portfolio Dashboard

Last updated: 2026-07-12

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

Use the reconciled slice structure below to keep practical polish gated and future concepts opt-in. Objective closeout passed on 2026-06-07. A later private site review approved two tasks that have since landed: IBM Cloud's empty placeholder slots were removed and the Document Processing homepage card shipped in PR #76. Follow-up manifest work in PRs #78–#80 now generates and validates the Work dropdown/homepage project sections and aligns project-page previous/next navigation. Three unapproved review candidates remain: contact resilience, Pi Kapp demo cold-start presentation, and time-sensitive Document Processing release wording. Performance Contracting naming was resolved on 2026-07-12: the official site identifies the company as Performance Contracting, Inc.; a future narrow copy-alignment slice may update project-facing `Performance Contracting Group` labels. A2UI remains parked.

### Current next actions

1. Treat the objective closeout and later manifest/order work as complete; do not revive superseded implementation plans.
2. Run a fresh manual/visual review across desktop/mobile and Light/Dark. The 2026-06-09 external review did not test mobile, so mobile conclusions from that review are void.
3. Turn review observations into a short prioritized punch list before implementation.
4. Verify the current Accuracy Evaluation release status before editing that time-sensitive sentence. Performance Contracting naming is resolved in favor of the official `Performance Contracting, Inc.` form.
5. Keep the contact fallback/copy-email treatment and Pi Kapp demo pre-render loading state as unapproved candidate slices until Victor selects one.
6. Treat A2UI as parked. Keep broader visual expansion, report-style chapters, lens/DNA mode, and bigger motion/prototype ideas opt-in.
7. Do not start protected-page promotion, sitemap changes, major copy rewrites, floating chat widgets, or broad redesign work without explicit approval.

### Supporting historical context

- Latest reconciled checkpoint: `archive/planning/portfolio-enhancement-state-2026-07-12.md`.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly references them as active work.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: clean synced implementation baseline after public-site polish, homepage/protected-card work, project-manifest generation/validation, and project-navigation order alignment. A fresh human visual review is in progress; four later review candidates remain unapproved and future concepts remain opt-in.

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

- Use `archive/planning/portfolio-enhancement-state-2026-07-12.md` as the current reconciled checkpoint.
- Use the adjusted enhancement slices below so review, copy, visual/UI polish, protected-page work, and future concepts do not get mixed together.
- Mechanical current-site review checks passed on 2026-06-06 and final objective closeout checks passed on 2026-06-07; human review can still create a narrow practical follow-up, but practical polish is not blocking future-concepts planning.
- Keep the tone/wording review active for future passes: flag pull quotes, section headers, labels, captions, metadata, and supporting copy that feel too cheesy, over-written, theatrical, or agent-written.
- Treat Document Processing as a normal live protected project page with temporary placeholder media now merged. Victor reselected it on 2026-06-10 and approved adding it to the homepage Selected Work area while preserving the password gate, `noindex`, and sitemap omission. Its `case-studies/` notes file is part of the shared project-package workflow for gathering consistent information across portfolio pages, not a special visitor-facing label or priority. Use the private media-audit handoff as source material before changing visuals or claims: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`.
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

### C2. Reconciled candidate slices from the 2026-06-09 review

These are verified as still present but are not approved implementation work by default:

- **Contact resilience:** direct `mailto:` links can fail silently without a configured mail client. Candidate treatment: visible email, copy-email action, LinkedIn, and retained email link.
- **Pi Kapp demo cold start:** `pikappapp/demo.html` depends on remote Tailwind, React, Framer Motion, Babel, and fonts before React can render its designed splash. Candidate first slice: static pre-render loading markup that React replaces after initialization.
- **Time-sensitive release wording:** verify the current Accuracy Evaluation status before changing `planned to release this summer` in source, generated content, and project-package notes.
- **Name consistency resolved:** `performancecontracting.com` identifies the company as Performance Contracting, Inc. Keep this as a separate narrow copy-alignment task rather than mixing it into contact or demo work.

Mobile findings from the 2026-06-09 review are void because mobile was not actually tested. Any mobile work begins with a fresh verification pass.

### D. Document Processing protected project-page state

Purpose: treat Document Processing like the rest of the portfolio while preserving its protected-page guardrails.

Current state:

- Live, password-gated, noindex, currently linked from the Work dropdown, approved for a homepage Selected Work card on 2026-06-10, and omitted from sitemap.
- Temporary placeholder media has shipped and is acceptable as-is until Victor explicitly asks for a new refinement pass.
- The `case-studies/` note remains an internal project-package workflow artifact for consistent facts/media/claims gathering across all future portfolio pages, not a visitor-facing category or priority label.

Current approved action is complete: the homepage card shipped in PR #76. If Victor explicitly reselects this page later, scope any further work as a new approval-gated slice and use the private media-audit handoff before changing visuals or claims.

Excludes sitemap changes, `noindex` changes, password-gate changes, raw screenshot dumps, metrics, launch claims, and broad project-page rewrites unless Victor explicitly chooses them.

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
| Document Processing | live | live, password-protected for visitors, noindex, linked from Work and homepage Selected Work, omitted from sitemap | `document-processing.html`; project-package notes in `case-studies/document-processing.md`; placeholder media merged in PR #63; homepage card shipped in PR #76; private audit handoff at `C:\\Users\\Victor\\Documents\\Website Items\\Portfolio Handoffs\\Document Processing\\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` | Verify the time-sensitive release sentence before any factual copy edit; no standing visual/media action | Preserve password gate/noindex and current visibility; do not add sitemap links, raw screenshot dumps, metrics, launch claims, or major copy/media changes without approval |
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
