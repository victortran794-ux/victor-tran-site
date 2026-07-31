# Portfolio Dashboard

Last updated: 2026-07-31

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

Use the reconciled slice structure below to keep practical polish gated and future concepts opt-in. Objective technical closeout and the later maintenance backlog are complete. The Ability Experience VicO2 translation and homepage system alignment are live and production-verified. The nine-package private Hi-Fi docket is also complete and is now paused for Victor's later Keep / Adjust / Reject edits: Pi Kapp App, wxO Canvas, IBM Cloud, IBM Patterns, PCI, Art & Illustration, Graphic Design, Document Processing, and Star & Lamp. IBM Patterns is the explicit exception within that shorthand: Victor pinned its verified July 31 private revision and placed it on intentional hold rather than leaving another review action open. After a package is edited and approved, its canonical private Hi-Fi package becomes the bounded source for replacing—or, where no counterpart exists, establishing—its production page. Together, the approved page migrations, homepage/navigation redesign, shared shell, case-study chrome, and final integration pass constitute a controlled broad redesign. Production migration remains serial, reviewable, and protection-aware rather than an uncontrolled rollout. A2UI remains parked.

### Current next actions

1. Treat the Ability Experience and homepage VicO2 translations as complete, live production checkpoints; observe them and reopen only with new evidence.
2. Treat the nine canonical private Hi-Fi packages as complete construction checkpoints and pause additional Hi-Fi production. Resume only for Victor's package-specific Keep / Adjust / Reject edits.
3. Run substantial private page revisions in bounded two-page sprints using the private sprint brief and `PORTFOLIO_DESIGN_CRITIQUE_RUBRIC.md`: strategy/evidence assessment, three low-cost structural propositions, Victor direction gate, bounded implementation, independent rendered critique, objective QA, documentation, then a hard stop. Do not select the next pages in the same session.
4. Preserve each canonical package, its manifest, and its claims/privacy contract as the migration source. Do not hand-integrate private raw material or bypass the verified derivatives.
5. After the Hi-Fi edits are approved, complete one Launch Integration Contract covering final project order, public/protected visibility, indexing/robots/sitemap behavior, homepage/Work placement, previous/next behavior, shared case-study chrome, recruiter actions, accessibility, evidence/credit rules, launch metadata, and preview/deployment strategy.
6. Finalize one bounded shared header/footer shell and case-study chrome bundle from the approved contract. Apply it once across the integration surface so every migrated page inherits the same navigation, theme, contact, accessibility, responsive, and protected-state behavior.
7. Migrate approved Hi-Fi packages serially into a coordinated launch/integration branch rather than directly onto live `main`. Archive each existing production page, preserve or establish its approved route/visibility contract, and run package-specific QA before continuing.
8. Keep Art & Illustration and Graphic Design as distinct supporting visual archives even when their Hi-Fi packages replace the current production galleries.
9. Review the complete integrated portfolio through a Vercel preview, resolve the whole-site visual/tone/responsive/accessibility/metadata punch list, then obtain explicit approval before merging to `main` and launching.
10. Keep Lens/Design-DNA, A2UI, portfolio framework/build-system migration, generative/chat UI promotion, and uncontrolled rollout parked. Broad redesign plus controlled homepage/navigation work are active only through the approved Launch Integration Contract and integration-preview workflow.

### Supporting historical context

- Latest reconciled checkpoint: `archive/planning/portfolio-enhancement-state-2026-07-12.md`.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly references them as active work.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: production remains unchanged after the Ability Experience and homepage VicO2 translations. The approved July 2026 Document Processing release-wording correction is complete and verified in the local working tree but is not committed or deployed. Nine canonical private Hi-Fi packages are complete and paused for later editing/review. After those edits are approved, the next phase is a Launch Integration Contract, followed by one shared shell/case-study-chrome bundle and serial migration into a coordinated Vercel preview. Final whole-site review and explicit approval happen before merge to live `main`. Larger future concepts remain parked.

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
- Hold the completed canonical Hi-Fi packages for Victor's later Keep / Adjust / Reject editing pass. Do not start another Hi-Fi construction batch.
- Do not replace a production page until its Hi-Fi package is edited and explicitly approved for migration.
- Keep residual objective maintenance separate when it is not a design-system question.
- Treat Pi Kapp App, wxO Canvas, IBM Cloud, IBM Patterns, PCI, Art & Illustration, Graphic Design, Document Processing, and Star & Lamp as the completed private page-package docket. Canonical packages live under `C:\Users\Victor\Documents\Website Items\Portfolio Packages\`.
- Treat wxO Canvas as the protected 2024–present umbrella story; Document Processing is a feature thread within it and may retain its focused standalone page. Preserve both packages' distinct reader roles and claims boundaries during production planning.
- Complete the Launch Integration Contract before implementing the shared shell. Do not improvise project order, visibility, indexing, protected-route treatment, recruiter actions, or cross-page behavior during migration.
- Prepare the shared header/footer and case-study chrome bundle as one global-shell change, not as repeated per-page edits. Finalize its exact design from the approved contract before implementation.
- Integrate shell and page migrations on a coordinated preview branch. Run one whole-site review for tone, responsive behavior, accessibility, media loading, metadata, and visual balance before approving merge to `main`.
- Treat the controlled broad redesign and homepage/navigation redesign as active workflow scope. Keep A2UI, framework/build-system migration, and uncontrolled expansion parked unless Victor explicitly resumes them or the current static stack becomes a verified blocker.

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
- Theme control: remove the visible `Light` / `Dark` words while preserving clear, accessible control labels and state.
- Contact area: remove the visible `Copy email` action and replace that space with a more useful treatment; choose the replacement before implementation.
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
- **Release wording correction prepared locally 2026-07-29:** Victor confirmed that Accuracy Evaluation released in July 2026. The protected page source now uses the confirmed release state and is verified locally; it remains uncommitted and undeployed. Its gate, `noindex`, sitemap omission, navigation visibility, media, and other claims are unchanged.
- **Name consistency resolved:** public labels align to the official Performance Contracting, Inc. name.

Mobile findings from the 2026-06-09 review are void because mobile was not actually tested. Any mobile work begins with a fresh verification pass.

### C3. Launch Integration Contract

Purpose: resolve the cross-page launch decisions that individual Hi-Fi packages cannot settle before shared-shell implementation or production-counterpart migration begins.

Required decisions:

- Final project sequence across homepage, Work menu, and previous/next navigation after wxO Canvas joins the existing portfolio.
- Controlled broad-redesign scope: homepage composition, navigation model, global shell, project transitions, About/liner-notes relationship, visual rhythm, color punctuation, project-native canvases, and selective motion. Pull the existing concept-album, studio-system, report-chapter, and project-native-canvas notes from `PORTFOLIO_DIRECTION_BRIEF.md` into this decision rather than treating them as a separate future lane.
- Per-project visibility matrix: public/protected, `index`/`noindex`, robots inclusion, sitemap inclusion, homepage visibility, Work-menu visibility, direct-link behavior, and whether a lock/protected indicator appears before entry.
- wxO Canvas production treatment: protected route, homepage/Work visibility, sequence position, and relationship to the focused Document Processing page.
- Reconciliation of `data/projects.json`, page-level gate/index metadata, `robots.txt`, and `sitemap.xml`. Current known mismatch: the manifest marks IBM Patterns and PCI as public/indexable/sitemap-eligible while their HTML is gated/`noindex` and robots excludes them. Do not resolve this silently; Victor must approve the intended contract.
- Shared case-study chrome beyond header/footer: project metadata, optional chapter navigation, captions/credits, protected-state cues, previous/next behavior, return path, media fallbacks, and reduced-motion behavior.
- Recruiter journey: primary contact action, résumé/CV decision, LinkedIn role, availability/location framing if desired, and protected-access guidance.
- Accessibility contract: skip-to-content, `aria-current`, keyboard navigation, focus behavior, 200% zoom/reflow, exact-mobile touch targets, reduced motion, gate focus management, and image alternatives/captions.
- Evidence and attribution contract: shipped/exploratory state, Victor's role, collaborators, dates, approved metrics, source ownership, client attribution, and sanitized/reconstructed/withheld media labels.
- Launch metadata: final titles/descriptions, project-specific social cards, structured-data decision, canonical routes, redirects, and protected-page share/index behavior.
- Integration strategy: page branches may feed one coordinated launch/integration branch; Vercel preview is the final review surface; merge to live `main` requires explicit approval after complete-site QA.

Exit criteria:

- One approved route/visibility matrix.
- One approved final project sequence.
- One approved shared-shell/case-study-chrome specification.
- One approved recruiter/contact decision.
- One approved accessibility and evidence/attribution checklist.
- One approved preview-to-production launch plan.

### C4. Shared header/footer and case-study chrome production bundle

Purpose: implement the approved Launch Integration Contract as one deliberate global-shell and case-study-chrome change before serial Hi-Fi migrations so the static pages do not receive repeated, drifting edits.

Proposed scope:

- Header/navigation consistency across public and protected pages.
- Mobile menu and current-page behavior.
- Light/Dark control treatment, including whether visible mode words remain while preserving accessible names and state.
- Footer contact hierarchy: visible email, Copy Email decision, LinkedIn, retained email link, and any approved replacement utility.
- Shared keyboard, focus, contrast, reduced-motion, responsive, protected-state, project-navigation, caption/credit, and fallback behavior.

Excludes:

- Case-study narrative, project media, project-native composition, claims, visibility, gates, indexing, sitemap, or homepage promotion.
- Floating chat, A2UI, framework/build-system migration, or visual changes outside the approved controlled redesign.

Sequence: complete and approve the Launch Integration Contract after Hi-Fi edits; implement the bundle once on the launch/integration branch; require all migrated pages to inherit the verified shell and chrome; review the combined result through Vercel preview; merge to `main` only after explicit launch approval.

### D. Document Processing protected project-page state

Purpose: treat Document Processing like the rest of the portfolio while preserving its protected-page guardrails.

Current state:

- Live, password-gated, noindex, currently linked from the Work dropdown, approved for a homepage Selected Work card on 2026-06-10, and omitted from sitemap.
- Temporary placeholder media has shipped and is acceptable as-is until Victor explicitly asks for a new refinement pass.
- The `case-studies/` note remains an internal project-package workflow artifact for consistent facts/media/claims gathering across all future portfolio pages, not a visitor-facing category or priority label.
- The canonical private Hi-Fi package is the current review and future migration source: `C:\Users\Victor\Documents\Website Items\Portfolio Packages\Document Processing\`. It uses sanitized source-faithful derivatives, preserves the theatrical hero, tells a cross-checked platform story across classification, extraction, table data, human review, and evaluation, and records the July 2026 Accuracy Evaluation release. The raw bundle remains private and is not referenced by the package.

Current approved action is complete at the canonical private Hi-Fi gate. Hi-Fi construction is paused. The next gate is Victor's Keep / Adjust / Reject editing pass; later approval would authorize a separate protected production-migration branch using only the manifested derivative set and approved copy. It would not authorize gate, indexing, sitemap, navigation, homepage, or additional claims changes.

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

Parked outside the controlled redesign:

- A2UI and generative/chat UI promotion.
- Framework migration or new build-system architecture absent a verified blocker.
- Uncontrolled site-wide rollout or changes outside the Launch Integration Contract and approved preview.

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

| Project | Status | Visibility | Canonical package | Next action | Blockers / cautions |
|---|---|---|---|---|---|
| Document Processing | live; private Hi-Fi complete/paused | password-protected, `noindex`, linked from Work and homepage Selected Work, omitted from sitemap | `Website Items\Portfolio Packages\Document Processing\` | Keep / Adjust / Reject edits, then approved protected production migration | Preserve gate, `noindex`, sitemap omission, current visibility, manifested media, July 2026 release state, and claims boundaries |
| wxO Canvas | private Hi-Fi complete/paused; no production page yet | future production counterpart must be protected | `Website Items\Portfolio Packages\wxO Canvas\` | Keep / Adjust / Reject edits, then establish a protected production page if approved | 2024–present umbrella; Document Processing is a feature thread; Canvas 1 shipment unclaimed; Canvas Future exploratory; no public migration without approval |
| IBM Cloud | live; private Hi-Fi complete/paused | public production page; private Hi-Fi package | `Website Items\Portfolio Packages\IBM Cloud\` | Keep / Adjust / Reject edits, then approved production replacement | External publication remains bounded by IBM permission, naming, attribution, provenance, and fresh privacy clearance |
| IBM Patterns | live; pinned after private revision on 2026-07-31 | protected | `Website Items\Portfolio Packages\IBM Patterns\` plus pinned derivative recorded in its package index | Intentional hold; reopen only when Victor explicitly selects it | Preserve password gate, source/ownership framing, and non-shipped six-week concept status |
| PCI | live; private Hi-Fi complete/paused | protected/confidential | `Website Items\Portfolio Packages\PCI\` | Keep / Adjust / Reject edits, then approved protected production replacement | Preserve gate, `noindex`, confidential framing, and only Victor-cleared sanitized artifacts; do not restore sensitive legacy copy |
| Pi Kapp App | live; private Hi-Fi complete/paused | public | `Website Items\Portfolio Packages\Pi Kapp\` | Keep / Adjust / Reject edits, then approved production replacement | Concept, not shipped; do not imply launch, integration, testing, adoption, engagement, completion, or outcomes |
| Star & Lamp / SAL Magazine | live; private Hi-Fi complete/paused | public | `Website Items\Portfolio Packages\Star & Lamp\` | Keep / Adjust / Reject edits, then approved production replacement | Preserve verified chronology, role/date/award language, and selected source-backed spreads |
| Art & Illustration | live; private Hi-Fi complete/paused | public supporting visual archive | `Website Items\Portfolio Packages\Art & Illustration\` | Keep / Adjust / Reject edits, then approved gallery replacement | Keep as a visual archive rather than a case study; preserve rights/authorship boundaries and monitor large-image performance |
| Graphic Design | live; private Hi-Fi complete/paused | public supporting visual archive | `Website Items\Portfolio Packages\Graphic Design\` | Keep / Adjust / Reject edits, then approved gallery replacement | Keep distinct from Art & Illustration and from product-case-study composition; preserve rights and client boundaries |
| Ability Experience | live production checkpoint | public | Existing production HTML | No active action | Reopen only with new evidence |

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
