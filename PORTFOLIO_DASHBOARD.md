# Portfolio Dashboard

Last updated: 2026-08-09

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

Victor's August 7 desk review remains the master content authority for the current enhancement cycle. The detailed August 7 plan remains the execution plan; this dashboard records its current checkpoint. Home's Design DNA lens portal, About, wxO and Document Processing narrative, IBM Cloud, IBM Patterns, PCI, Star & Lamp, Ability Experience, Pi Kapp, Art & Illustration, Graphic Design, Home/global, and Design DNA/component reconciliation have completed bounded production lanes. Art & Illustration production-verified in PR #125, Graphic Design production-verified in PR #126, Home/global production-verified in PR #127, and Design DNA/component reconciliation production-verified in PR #128. Final whole-site reconciliation is active. Asset-dependent items and separate route-opening gates remain open. The desired final visibility is still that only wxO remains password-locked, but every currently protected page keeps its existing gate, indexing, sitemap, and export behavior until its own privacy, claims, route, preview, and release gates pass. A2UI remains parked.

Master review and alignment records:

- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\PORTFOLIO_DESK_REVIEW_MASTER_NOTES.md`
- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_AUTHORITY_RECONCILIATION.md`
- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_COVERAGE.json`
- Detailed execution plan: `.hermes/plans/2026-08-07_142458-portfolio-vico2-living-archive-master-plan.md`

### Current next actions

1. Run and close the active final whole-site reconciliation: desktop/mobile, Light/Dark, keyboard, privacy, claims, generated-output, route, CI, and production-health evidence.
2. Keep asset-dependent requests explicit rather than pretending they are complete: wxO replacement canvas arrangements, Document Processing approved final screens/component studies, IBM Cloud supporting images, Pi Kapp additional pages, and Heart of the Frozen Void source assets. The IBM Patterns Final Playback cover is merged, deployed, and production-verified through PR #133.
3. Preserve all current protection during visual/content work. Passwords, indexing, robots, sitemap, generated exports, routes, and navigation change only through separate page-specific clearance and release gates.
4. Keep the July 31 Art/Graphic worktree historical and frozen. Do not resume or merge it as the current session.
5. Treat the July 24 `portfolio-dashboard checkpoint before PR 95 main sync` stash as historical recovery material only. Preserve it, but never apply it as current status or an active plan.
6. Keep A2UI, framework migration, generative chat UI, broad new features, and uncontrolled rollout outside this enhancement cycle.

### Supporting historical context

- Current reconciliation record: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_AUTHORITY_RECONCILIATION.md`.
- Earlier reconciled checkpoint: `archive/planning/portfolio-enhancement-state-2026-07-12.md`; use it only for historical context.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly carries a safeguard or source forward.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: bounded August 7 lanes are production-verified through Art PR #125, Graphic PR #126, Home/global PR #127, and Design DNA/component reconciliation PR #128. Final whole-site reconciliation is active. Current protected generated exports remain source-independent public stubs omitted from the public index. Asset-dependent items and separate route-opening gates remain open.

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

Current operational rules:

- Use this dashboard as the current status cockpit and the August 7 master notes as the content authority.
- Use the VicO2 checkpoint at `C:\Users\Victor\Documents\Website Items\Design Kits\2026-07-23-carbon-victor-system\README.md` for system scope and guardrails.
- Treat `C:\Users\Victor\Documents\Website Items\Portfolio Sprints\2026-07-31-portfolio-integration-readiness\` as a dated provenance and verification checkpoint, not the active sequence or production implementation source.
- Treat current `main` as the source for every shipped page and shell behavior.
- Do not resume the historical July 31 Art/Graphic worktree or any prior enhancement worktree. Create each remaining lane from newly synchronized `main`.
- Historical candidate worktrees are Git-locked with explicit reason strings so they remain recoverable without looking active. The unique IBM Cloud `fdac040` worktree is locked as a read-only provenance reference.
- Preserve tested public stubs for every currently gated route. Real preview URLs must be checked before any deployment approval.
- Treat wxO as the protected umbrella and Document Processing as its focused thread. Keep Document Processing protected until its separate opening clearance passes.
- Design DNA/component reconciliation is complete in PR #128; final whole-site reconciliation is the active verification lane.
- PR #127 approved icon-only theme control with accessible names and state; the former visible `Light` / `Dark` words are not pending work.
- The footer's visible `Email` action uses a direct `mailto:` link, keeps the resilient contact paths, and About retains the full email sentence.
- IBM Cloud, IBM Patterns, and the sanitized PCI story are approved as public archive projects; their password gates, protected metadata, robots exclusions, and sitemap omissions are removed.
- PCI's public route preserves the sanitized artifact set, rejected-source exclusions, authorship boundaries, and conservative outcome claims.
- Use isolated branches/worktrees, run complete local QA, and require explicit approval for PR/preview, merge, protection changes, route changes, and launch.

## Retained enhancement guardrails and gap-fillers

**Queue rule:** The August 7 master review and the current next-actions list above set the active order. The earlier slices below remain supporting checks, accessibility rules, privacy contracts, and source context. They do not create a competing implementation queue.

### A. Current-site review and punch list

Purpose: review what is already live and decide what actually needs attention before creating another branch.

Includes:

- Homepage Work/Galleries framing and whether `Visual archive` feels like supporting material.
- Ability Experience card copy.
- About wording and image behavior.
- Art & Illustration slideshow Pause/Play control.
- Desktop/mobile and Light/Dark checks.
- Theme control: verify the PR #127-approved icon-only control preserves its accessible names and state.
- Contact area: verify the PR #127-approved visible `Email` direct-`mailto:` action, retained resilient contact paths, and About's full email sentence.
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

- **Contact resilience and presentation resolved:** PR #127 replaced the former Copy email treatment with a visible `Email` direct-`mailto:` action while retaining resilient footer contact paths and the full email sentence on About.
- **Pi Kapp demo cold start resolved:** `pikappapp/demo.html` includes a branded static pre-render loading state that React replaces after initialization.
- **Release wording resolved:** Victor confirmed that Accuracy Evaluation released in July 2026. Current protected production source preserves that release state, gate, `noindex`, sitemap omission, sanitized media, and claims boundaries.
- **Name consistency resolved:** public labels align to the official Performance Contracting, Inc. name.

Mobile findings from the 2026-06-09 review are void because mobile was not actually tested. Any mobile work begins with a fresh verification pass.

### C3. Launch Integration Contract

Purpose: preserve the route, visibility, accessibility, evidence, metadata, generated-export, and release safeguards established before the August 1 production integration.

Status: dated August 1 checkpoint. The shared shell and Art/Graphic batch later shipped and are now part of current `main`; later Home, wxO, Document Processing, IBM Patterns, PCI, Pi Kapp, About, and gate changes also shipped. Use this contract for safety rules and provenance, not as the active August 7 sequence or current-state ledger.

Frozen planning coverage:

- Final project sequence across homepage, Work menu, and previous/next navigation after wxO Canvas joins the existing portfolio.
- Controlled broad-redesign scope: homepage composition, navigation model, global shell, project transitions, About/liner-notes relationship, visual rhythm, color punctuation, project-native canvases, and selective motion. Pull the existing concept-album, studio-system, report-chapter, and project-native-canvas notes from `PORTFOLIO_DIRECTION_BRIEF.md` into this decision rather than treating them as a separate future lane.
- Per-project visibility matrix: public/protected, `index`/`noindex`, robots inclusion, sitemap inclusion, homepage visibility, Work-menu visibility, direct-link behavior, and whether a lock/protected indicator appears before entry.
- wxO Canvas production treatment: protected route, homepage/Work visibility, sequence position, and relationship to the focused Document Processing page.
- Reconciliation of `data/projects.json`, page-level gate/index metadata, `robots.txt`, and `sitemap.xml`. IBM Cloud, IBM Patterns, and PCI now align as public and indexable across manifest, HTML, robots, sitemap, generated exports, and CI coverage.
- Shared case-study chrome beyond header/footer: project metadata, optional chapter navigation, captions/credits, protected-state cues, previous/next behavior, return path, media fallbacks, and reduced-motion behavior.
- Recruiter journey: primary contact action, résumé/CV decision, LinkedIn role, availability/location framing if desired, and protected-access guidance.
- Accessibility contract: skip-to-content, `aria-current`, keyboard navigation, focus behavior, 200% zoom/reflow, exact-mobile touch targets, reduced motion, gate focus management, and image alternatives/captions.
- Evidence and attribution contract: shipped/exploratory state, Victor's role, collaborators, dates, approved metrics, source ownership, client attribution, and sanitized/reconstructed/withheld media labels.
- Launch metadata: final titles/descriptions, project-specific social cards, structured-data decision, canonical routes, redirects, and protected-page share/index behavior.
- Integration strategy: page branches may feed one coordinated launch/integration branch only after the implementation gate is approved. A private or protected remote preview requires separate approval; merge to live `main` requires explicit approval after complete-site QA.

Frozen local outcomes:

- One frozen route and visibility planning matrix, with no route changes authorized.
- One recommended project sequence for modeling only.
- One bounded shared-shell and case-study-chrome specification now implemented in current `main`.
- Current recruiter and contact behavior preserved.
- One accessibility and evidence-attribution checklist for future implementation.
- Separate preview, merge, and launch gates preserved.

### C4. Shared header/footer and case-study chrome production baseline

Purpose: preserve the shared shell that shipped through PR #101 and revise it only through bounded August 7 Home/global changes.

Preserved scope:

- Header/navigation consistency across public and protected pages.
- Mobile menu and current-page behavior.
- PR #127-approved icon-only theme control, with accessible names and state preserved.
- PR #127-approved footer hierarchy: visible `Email` action with direct `mailto:`, LinkedIn, resilient contact paths, and the full email sentence retained on About.
- Shared keyboard, focus, contrast, reduced-motion, responsive, protected-state, project-navigation, caption/credit, and fallback behavior.

Excludes:

- Case-study narrative, project media, project-native composition, claims, visibility, gates, indexing, sitemap, or homepage promotion.
- Floating chat, A2UI, framework/build-system migration, or visual changes outside the approved controlled redesign.

Sequence: use the generator, source fences, and current contracts already in `main`. Make approved control/footer changes once through shared sources, verify every generated page, stop for review, and require explicit PR/preview and production approval.

### D. Document Processing protected project-page state

Purpose: treat Document Processing like the rest of the portfolio while preserving its protected-page guardrails.

Current state:

- Live, password-gated, `noindex`, omitted from the current Work dropdown and homepage cards, omitted from sitemap, and linked as a focused thread from the protected wxO umbrella.
- `data/projects.json` records `manifest nav=false/homepage=false`. `/document-processing` intentionally permanently redirects to `/wxo-canvas#document-processing`; raw `.html` remains an implementation artifact.
- The static client-side password gate is visitor deterrence and discovery reduction, not server-side access control. Served HTML can contain the page source. No material requiring true confidentiality may be added until a separately approved server-side protection or private-hosting architecture exists.
- Sanitized evaluation media and story material are present in current production source. Victor's August 7 review explicitly reopens the page for a bounded media/content pass.
- The `case-studies/` note remains an internal project-package workflow artifact for consistent facts/media/claims gathering across all future portfolio pages, not a visitor-facing category or priority label.
- The canonical private Hi-Fi package is the current review and future migration source: `C:\Users\Victor\Documents\Website Items\Portfolio Packages\Document Processing\`. It uses sanitized source-faithful derivatives, preserves the theatrical hero, tells a cross-checked platform story across classification, extraction, table data, human review, and evaluation, and records the July 2026 Accuracy Evaluation release. The raw bundle remains private and is not referenced by the package.

Current `main` is the implementation baseline. The earlier certified candidate and package remain provenance sources. The August 7 revision must preserve source-independent public exports and public-index omission. The desired future opening remains separate from the content/media pass and requires its own privacy, route, access, indexing, preview, and production approval.

Excludes sitemap changes, `noindex` changes, password-gate changes, raw screenshot dumps, metrics, launch claims, and broad project-page rewrites unless Victor explicitly chooses them.

### E. Future-concept alignment with VicO2

Purpose: move concepts into VicO2 only when they strengthen real case-study storytelling without turning them into automatic site-wide features.

Promoted into VicO2:

- Report-style project chapters as an optional long-form editorial structure.
- Artifact/process storytelling as a core case-study pattern.
- Technical diagrams as a reusable, accessible component family.
- Selective motion as a bounded behavior layer with truthful controls and reduced-motion support.

Conditional after candidate completion:

- Existing home-page Design DNA overlay: preserve its current implementation while the Home lane compares two bounded portrait-lens connections; reconcile and refresh its full content only after the accepted VicO2 system is stable.
- Broader Lens or Design DNA inspection mode: parked until a clear reader benefit is proven.
- Larger prototypes or project-progress behaviors.
- Asset/photography inventory as page preparation rather than a visible feature.

Parked outside the controlled redesign:

- A2UI and generative/chat UI promotion.
- Framework migration or new build-system architecture absent a verified blocker.
- Uncontrolled site-wide rollout or changes outside the August 7 aligned plan and approved preview.

Status: the existing home-page Design DNA overlay is live. A bounded lens-to-DNA comparison is active in the Home lane, while broader Lens expansion remains parked. A2UI remains a contained experiment under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`; the parked standalone `a2ui.html` branch must not be merged or promoted as-is. VicO2 may eventually style a real implementation, but visual compatibility does not make the technology or claims ready.

## Status legend

- `idea` — rough concept only
- `intake` — raw notes/assets being collected
- `drafting` — narrative/copy in progress
- `implementation-ready` — enough detail for Claude Code/site work
- `implemented-local` — page exists locally, not approved live
- `live` — published on site
- `paused` — intentionally not moving

## August 7 review coverage audit

Every item in `PORTFOLIO_DESK_REVIEW_MASTER_NOTES.md` is classified below. Nothing is being silently treated as complete.

### Production-verified bounded work

- Home portrait-lens connection to Design DNA.
- About current-role emphasis, first-generation/BFA body copy, restrained role/tag hierarchy, direct Tetris wording, and music wording.
- wxO Visual Designer framing, weighted two-chapter narrative, and User activities focus.
- Document Processing connection, team framing, trust-loop narrative, motion/reduced-motion treatment, and removal of redundant storyboard presentation.
- IBM Cloud opener, employer framing, spacing/copy reduction, and honest reserved evidence slots.
- IBM Patterns hierarchy/copy reduction, collaboration boundaries, removal of low-value/redundant treatments, and playback simplification.
- PCI sanitized evidence composition and claims-safe protected story.
- Star & Lamp opener, spacing, archive link, and homepage voice.
- Ability Experience mark/iconography/illustration/application sequence.
- Pi Kapp archive behavior, user icons, restrained evidence caption, corrected future-screen treatment, and Art next link.

### Open and assigned to a remaining lane

- Final whole-site verification closure: active reconciliation lane.

### Explicitly asset-dependent or separately release-gated

- Victor-supplied wxO canvas arrangements, Document Processing final screens/component studies, IBM Cloud supporting images, Pi Kapp additional pages, and Heart of the Frozen Void assets.
- Document Processing remains protected as part of the current wxO story. IBM Cloud, IBM Patterns, and PCI are approved public archive projects with their conservative claims and attribution boundaries preserved.
- wxO remains the only intended final locked story.

## Project tracker

| Project | Current checkpoint | Visibility | Canonical package | Remaining action | Blockers / cautions |
|---|---|---|---|---|---|
| Home + global shell | Home/global production-verified in PR #127 | public | Current `main` plus August 7 master notes | Include in the active final whole-site reconciliation; supplied assets remain separately tracked | Asset-dependent replacements and route-opening changes remain separately gated |
| About | bounded August 7 lane production-verified in PR #117 | public | Current `main` plus About package | No current content action; include in final whole-site QA | Preserve casual Victor voice, restrained role list, exact section-label pattern, Tetris, and Spotify framing |
| wxO Canvas | bounded narrative/hierarchy lane production-verified in PR #118 | protected, `noindex`, homepage/Work visible with lock, omitted from sitemap | Current `main` plus `Website Items\Portfolio Packages\wxO Canvas\` | Add Victor-selected replacement canvas arrangements if supplied; reconsider repeated visible protection/source-boundary copy in final pass | Only intended final locked story; Canvas Future remains exploratory and must not become the primary prototype |
| Document Processing | bounded narrative lane production-verified in PR #118 | protected, `noindex`, hidden from generated public index, omitted from sitemap | Current `main` plus `Website Items\Portfolio Packages\Document Processing\` | Add Victor-approved final Accuracy Evaluation screen and component studies if supplied; reconsider repeated visible protection/source-boundary copy; separate opening clearance | Preserve July 2026 release state, collaboration/claims boundaries, sanitized media, and source-independent public stub |
| IBM Cloud | bounded hiring narrative production-verified in PR #119; eleven reviewed Figma artifacts are staged on `feat/ibm-cloud-cleared-supporting-images-2026-08-10` and pending Victor approval, merge, and production verification | public, indexable, included in sitemap | Current `main`, supplied Figma Updates file, plus `Website Items\Portfolio Packages\IBM Cloud\` | Review the revised technical environment, Event Notifications flow/research, Team Action, and Visual Systems sequence on desktop/mobile in Light/Dark before publication | Preserve employer/customer distinction, attribution, provenance, conservative experimental framing, and claims boundaries |
| IBM Patterns | bounded copy/hierarchy lane production-verified in PR #119; homepage thumbnail production-verified in PR #133 | public, indexable, included in sitemap | Current `main` plus `Website Items\Portfolio Packages\IBM Patterns\` | Homepage thumbnail replaced with the approved Final Playback cover and production-verified in PR #133; no additional page action | Preserve six-week, five-person, non-shipped, influence, experimental, and collaboration boundaries |
| PCI | sanitized bounded story production-verified in PR #120 | public, indexable, included in sitemap | Current route-opening branch plus `Website Items\Portfolio Packages\PCI\` | No content expansion without another source review | Never unblur source files or imply logo authorship; preserve concept/composite boundaries and conservative outcome claims |
| Star & Lamp / SAL Magazine | bounded August 7 lane production-verified in PR #121 | public | Current `main` plus `Website Items\Portfolio Packages\Star & Lamp\` | No page action; include in final whole-site QA | Preserve verified chronology, role, date, award language, issue links, and source-backed spreads |
| Ability Experience | bounded sequence edit production-verified in PR #122 | public | Current `main` | No page action; include in final whole-site QA | Preserve the rest as the strongest live VicO2 reference |
| Pi Kapp App | bounded archive/future-screen lane production-verified in PR #123 | public | Current `main` plus `Website Items\Portfolio Packages\Pi Kapp\` | Additional app pages only if Victor supplies them; include in final whole-site QA | Preserve historical webpage versus speculative V2 distinction, prototype-data labels, non-shipped framing, and corrected square display derivatives |
| Art & Illustration | Art & Illustration production-verified in PR #125 | public | Current `main` plus `Website Items\Portfolio Packages\Art & Illustration\` | Include in the active final whole-site reconciliation | Do not resume the July 31 frozen worktree; preserve production image set, rights, authorship boundaries, viewer behavior, and artwork-first identity |
| Graphic Design | Graphic Design production-verified in PR #126 | public | Current `main` plus `Website Items\Portfolio Packages\Graphic Design\` | Include in the active final whole-site reconciliation | Preserve production source set, rights/client boundaries, editorial identity, and pairing with Art; Heart of the Frozen Void remains asset-gated |

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
- The 3.3 MB `images/pikapp-case-study/expansion-cover.png` source master was removed from the deployable repository after checksum-preserved archival under `Website Items\Portfolio Packages\Pi Kapp\Source Masters\`. The live archive continues to use the verified 500 KB same-dimension detail derivative and 163 KB preview derivative.
- Historical Pi Kapp post-merge Site Health passed in run `31291108193`; it is provenance, not the current production checkpoint.
- Historical note: PR #21 failed because `/document-processing` canonical/live link 404ed before the page existed live. Current state is intentional: `/document-processing` permanently redirects to the protected wxO Document Processing chapter and remains omitted from the sitemap.

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
- Treat Document Processing as live within the protected wxO chapter. Its static client-side gate is visitor deterrence and discovery reduction, not confidentiality. If Vic selects that package later, use the consolidated Claude Code + Figma media audit handoff in `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md` as source material before changing visuals or claims.
- Windows Git and Windows GitHub CLI are available as WSL credential bridges for push/PR/merge work when plain WSL Git/GH auth is unavailable.
- Consider local Lychee or a Windows-native health script only if local link checks become routine outside preflight.
- Optional later: add a weekly GitHub health digest only if failures occur.
