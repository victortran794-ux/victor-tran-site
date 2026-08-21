# Portfolio Dashboard

Last updated: 2026-08-21

This is the quick cockpit for portfolio work: what exists, what state it is in, and what to do next.

## Authority note

This file is authoritative for current portfolio status, the active plan, project tracker state, and next actions. It is not authoritative for the master repo operating manual, agent handoff rules, creative direction, or design token values.

Consult next:

- `PORTFOLIO_SYSTEM.md` for repo structure, publishing, health checks, and maintenance rules.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for agent roles, permissions, guardrails, handoffs, and closeout.
- `PORTFOLIO_DIRECTION_BRIEF.md` for creative/product direction and enhancement intent.
- `content/design-system.md` and `content/design-system.json` for design system principles and tokens.
- `archive/planning/README.md` for historical planning context only.

## Current portfolio state

### Current baseline

Victor's August 7 desk review remains the content authority for the completed enhancement cycle. The bounded page, shell, gallery, accessibility, recruiter-facing alignment, and three-route Theme Continuity lanes are production-verified through PR #152; the Vercel application was subsequently submitted and closed. The Mendenhall delivery optimization is production-verified through PR #153 at `00364c03e3a522274027bf538be8c0d420d26a2e`. The clearer Light/Dark treatment is production-verified across every live shared-shell route through PR #154 at `8644d9f65f62e2ef9540b94d883d3208f038d802`, while route-specific Theme Continuity content remains scoped to Home, IBM Cloud, and About. The optional PCI orientation proof was evaluated and discarded. Recruiter-scan, IBM Cloud evidence, Pi Kapp authorship, and consolidated public-route authorship work are production-verified through PR #160 at `8cb9ed18a2dfb18e95721c90e614c852876bded4`. PR #160 refined IBM Patterns copy and the UI Gallery homepage framing after source-first audits found no defensible change for Star & Lamp, The Ability Experience, PCI, Art & Illustration, Graphic Design, or the UI Gallery route. wxO remains password-gated, `noindex`, and omitted from the sitemap. Document Processing remains a protected chapter inside wxO rather than a separate public route. Getting In is retired from the public portfolio. Pi Kapp and Heart of the Frozen Void are public and closed.

The **authorship and website-evidence readiness** lane is complete. A separate relevance review on 2026-08-21 identified new authored wxO V1/V2 evidence and opened one bounded protected-story lane. The later approved sequence is Homepage hero plus Design DNA entry, then UI Gallery naming and approved-artifact review. Presentation preparation remains interview-triggered rather than part of the website queue.

Master review and alignment records:

- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\PORTFOLIO_DESK_REVIEW_MASTER_NOTES.md`
- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_AUTHORITY_RECONCILIATION.md`
- `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_COVERAGE.json`
- Detailed execution plan: `.hermes/plans/2026-08-07_142458-portfolio-vico2-living-archive-master-plan.md`

### Current next actions

1. Audit the updated authored wxO V1/V2 Figma source, separate V1 foundation, V2 evolution, and prototype/exploration claims, and build a protected story proposal from complete sanitized frames.
2. Keep Document Processing inside wxO as a smaller protected secondary chapter. Compare its current side-tab treatment with a more subdued secondary-tab treatment; do not create a separate public route.
3. Preserve the 30-to-60-second recruiter opening and add deeper chapters only when source evidence supports a real story. Use report-style anatomy as an editorial checklist, not a universal visible template.
4. After wxO, open a bounded Homepage hero plus Design DNA entry lane, then a UI Gallery naming and approved-artifact audit. Treat motion as a supporting behavior audit across those approved lanes and the galleries, not as a site-wide effect system.
5. Keep generic gallery overlays and A2UI parked. Retire `UI Fragments` as a separate concept and the unlinked Pi Kapp system page as an active lane. Use targeted source intake only; do not repeat a broad asset inventory.
6. Keep historical worktrees frozen and preserve the `portfolio-dashboard checkpoint before PR 95 main sync` stash as recovery material only; never apply it as current status.

### Supporting historical context

- Current reconciliation record: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Portfolio\2026-08-07-enhancement-alignment\ENHANCEMENT_AUTHORITY_RECONCILIATION.md`.
- Earlier reconciled checkpoint: `archive/planning/portfolio-enhancement-state-2026-07-12.md`; use it only for historical context.
- Historical planning files under `archive/planning/` are context only unless this dashboard or `PORTFOLIO_DIRECTION_BRIEF.md` explicitly carries a safeguard or source forward.
- Legacy status snapshot: `archive/planning/portfolio-status-legacy-2026-05-18.md`; do not use it as the current status tracker.

## Current enhancement phase

Status: the public portfolio is production-verified through PR #160 at `8cb9ed18a2dfb18e95721c90e614c852876bded4`. The authorship and website-evidence audit is closed with every reviewed public route either source-backed and shipped or explicitly kept unchanged. New authored V1/V2 Canvas evidence now supports one active protected wxO story lane. Document Processing remains its smaller protected chapter, and protected exports remain source-independent public stubs omitted from the public index. Homepage hero plus Design DNA entry and UI Gallery naming plus approved-artifact review are sequenced behind wxO. Every visual, narrative, route, protection, or publication change still requires a bounded proposal, preview, verification, and explicit release approval.

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
- Pi Kapp's source-first case study, cleaned identity-pattern presentation, reproducible remaster, and contained runnable V2 are production-verified through PR #159. Its unlinked `noindex` system page remains intentionally deferred; no further Pi Kapp work or route is queued.
- Getting In is retired from public navigation and preserved only as private authored source material.
- The IBM Cloud eleven-artifact Figma expansion production-verified in PR #135 remains the approved supporting-image baseline. PR #158 made Event Notifications the primary UX evidence chain, retained the publication-safe IBM Cloud Logs token study, and removed the rejected operational chart rather than fabricating replacement evidence. The lane is production-verified and closed.
- PR #160 refined IBM Patterns copy and the UI Gallery homepage description, preserved six audited public routes unchanged, passed independent exact-diff review and default-branch CI, and was production-verified at `8cb9ed18a2dfb18e95721c90e614c852876bded4`.
- Homepage thumbnail replaced with the approved Final Playback cover and production-verified in PR #133; IBM Patterns remains closed with the approved concept-boundary copy.
- UI Gallery is public with one complete scrollable Ekos artifact, sanitized static Magi studies, and verified lightbox accessibility across Art, Graphic Design, and UI Gallery.
- PR #150 fixed the closed gallery dialog lifecycle and was production-verified for keyboard activation, focus transfer, Escape close, and exact trigger restoration.
- PR #152 released the bounded Theme Continuity treatment on Home, IBM Cloud, and About without applying route-specific content furniture to every page.
- The Mendenhall maintenance release replaces the 2,620,396-byte deployable PNG with a visually verified 418,604-byte WebP at the same `2500 × 1087` dimensions; the private source master remains outside the repository.
- PR #154 released the clearer shared Light/Dark control treatment across every live shared-shell route without normalizing project-native surfaces. The separate PCI orientation proof was rejected and discarded after matched desktop/mobile Light/Dark comparison.

Current operational rules:

- Use this dashboard as the current status cockpit and the August 7 master notes as the content authority.
- Use the VicO2 checkpoint at `C:\Users\Victor\Documents\Website Items\Design Kits\2026-07-23-carbon-victor-system\README.md` for system scope and guardrails.
- Treat `C:\Users\Victor\Documents\Website Items\Portfolio Sprints\2026-07-31-portfolio-integration-readiness\` as a dated provenance and verification checkpoint, not the active sequence or production implementation source.
- Treat current `main` as the source for every shipped page and shell behavior. The PR #152 Theme Continuity release baseline was `6d868b884dd9f6d7c46fc558c5dfcdeee2ade623`. The submitted Vercel package is immutable application evidence, not an active website branch.
- Do not resume the historical July 31 Art/Graphic worktree or any prior enhancement worktree. Create each remaining lane from newly synchronized `main`.
- Historical candidate worktrees are Git-locked with explicit reason strings so they remain recoverable without looking active. The unique IBM Cloud `fdac040` worktree is locked as a read-only provenance reference.
- Preserve tested public stubs for every currently gated route. Real preview URLs must be checked before any deployment approval.
- Treat wxO as the protected umbrella and Document Processing as its focused thread. Keep Document Processing protected until its separate opening clearance passes.
- Design DNA/component reconciliation is complete in PR #128, final whole-site reconciliation is closed, the Vercel alignment released in PR #151, and the bounded Theme Continuity treatment released in PR #152.
- PR #127 established the accessible icon-only theme control; PR #152 proved a clearer glyph and selected-state treatment; PR #154 released that shared refinement across live shared-shell routes without normalizing project-native surfaces or route-specific content furniture.
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

- Existing home-page Design DNA overlay: preserve its current implementation until the sequenced Homepage hero plus Design DNA entry lane audits the original overlay concepts and defines a clearer launch payload.
- Broader Lens or project-wide Design DNA inspection remains parked until a clear reader benefit is proven.
- Larger prototypes or project-progress behaviors.
- Asset/photography inventory as page preparation rather than a visible feature.

Parked outside the controlled redesign:

- A2UI and generative/chat UI promotion.
- Framework migration or new build-system architecture absent a verified blocker.
- Uncontrolled site-wide rollout or changes outside the August 7 aligned plan and approved preview.

Status: the existing home-page Design DNA overlay is live and stable. No Home implementation is active ahead of wxO. The later approved Home lane will focus on a more visually compelling hero, a deliberate Design DNA launch point, and a useful post-entry payload rather than broad Lens expansion. A2UI remains a contained parked experiment under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`; the standalone `a2ui.html` branch must not be merged or promoted as-is.

### F. Authorship and website-evidence readiness

Purpose: ensure each page carries Victor's intentional, project-specific decisions and presents credible evidence without generic portfolio or framework-default treatment.

Status: completed through PR #160. The page-by-page audit and bounded corrections are production-verified; no follow-on visual implementation is queued. Presentation preparation remains deferred until a concrete interview.

Immediate outputs:

- A page-by-page authorship audit separating clearly project-specific choices from generic portfolio, AI-generated-design, and framework-default conventions.
- A direct recommendation for each flagged pattern: keep and explain, restyle with project evidence, replace, simplify, or remove.
- A webpage narrative check grounded in verified role, artifacts, chronology, collaboration, and outcome boundaries.

Long-form enhancement:

- Keep the opening movement optimized for a 30-to-60-second recruiter scan.
- Add optional deeper chapters only when they help Victor explain the project: context, role, constraints, design decisions, iterations, evidence, outcome or non-outcome, and reflection.
- Let images, complete authored frames, and specific artifacts carry the story. Do not add generic design-process diagrams or prose merely to make a page feel substantial.
- Treat each project as its own editorial composition. Shared shell and accessibility behavior stay consistent, while color, typography, pacing, image treatment, diagrams, and section transitions must come from the project's actual identity and evidence.

Deferred review-only item:

- `pikappapp/system.html` remains an unlinked `noindex` page and is intentionally deferred. Its Tailwind usage does not create an active rewrite or publication lane.

Boundaries:

- No fabricated process, outcomes, metrics, user quotes, dashboards, interactions, or design rationale.
- No blanket ban on cards, grids, gradients, pills, rounded corners, or Tailwind. Keep them when they are the right project-specific choice and Victor can explain why.
- No site-wide visual homogenization. Findings become small page or project-family proposals.
- Preserve public/protected boundaries and do not expose protected content during audit or implementation.
- Do not create decks, rehearsal notes, presentation run-of-show material, or peer-Q&A packages until an interview creates a concrete need.
- Victor approves the direction before implementation and separately approves preview, merge, and release.

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

### Closed cross-site enhancement lane

- Authorship and website-evidence readiness is complete through PR #160. No active page-change queue remains; presentation work stays interview-triggered.

### Explicitly asset-dependent or separately release-gated

- None remain from the completed cycle. wxO evidence, IBM Cloud supporting imagery, Pi Kapp media/page curation, Mendenhall, and Heart of the Frozen Void are complete. Future supplied assets are fresh editorial decisions rather than carried backlog.
- Document Processing remains protected as part of wxO. IBM Cloud, IBM Patterns, PCI, and Pi Kapp are approved public projects with their conservative claims and attribution boundaries preserved.
- wxO remains the only intended locked story.

## Project tracker

| Project | Current checkpoint | Visibility | Canonical package | Remaining action | Blockers / cautions |
|---|---|---|---|---|---|
| Home + global shell | production-verified through PR #157; three-route Theme Continuity remains scoped to Home, IBM Cloud, and About | public | Current `main` plus August 7 master notes | None | No redesign, route change, or protection change without a new bounded lane |
| About | production-verified through PR #154 with bounded jump navigation and shared control refinement | public | Current `main`, `content/about.md`, and `content/profile.md` | None | Preserve casual Victor voice, first-generation/BFA context, restrained role hierarchy, and direct contact language |
| wxO Canvas | production-verified protected story with official lowercase `watsonx` naming; updated authored V1/V2 source approved for audit | protected, `noindex`, homepage/Work visible with lock, omitted from sitemap | Current `main`, `Website Items\Portfolio Packages\wxO Canvas\`, and the approved `wxo-flows-v1---v2` Figma file | Active protected V1/V2 story audit and redesign proposal | Only intended locked story; never store the password; separate V1, V2, prototype, and shipped-status claims; use sanitized complete frames |
| Document Processing | production-verified chapter inside wxO | protected, `noindex`, hidden from public index, omitted from sitemap; `/document-processing` redirects to the wxO chapter | Current `main` plus `Website Items\Portfolio Packages\Document Processing\` | No current action | Preserve July 2026 release state, collaboration boundaries, sanitized media, and source-independent public stub |
| IBM Cloud | production-verified through PR #158; chronology confirmed as 2021–2023 | public, indexable, included in sitemap | Current `main`, supplied Figma Updates file, plus `Website Items\Portfolio Packages\IBM Cloud\` | No page action | Preserve employer/customer distinction, provenance, experiment framing, research privacy, and proposed/not-shipped boundaries |
| IBM Patterns | production-verified through PR #160 with approved copy polish and concept boundaries | public, indexable, included in sitemap | Current `main` plus `Website Items\Portfolio Packages\IBM Patterns\` | No current action | Preserve six-week, five-person, non-shipped, influence, authorship, and collaboration boundaries |
| PCI | production-verified sanitized public story | public, indexable, included in sitemap | Current `main` plus `Website Items\Portfolio Packages\PCI\` | No content expansion without another source review | Never unblur source files or imply logo authorship; preserve concept/composite boundaries and conservative claims |
| Star & Lamp / SAL Magazine | production-verified public story | public | Current `main` plus `Website Items\Portfolio Packages\Star & Lamp\` | No page action | Preserve verified chronology, role, award language, issue links, and source-backed spreads |
| Ability Experience | production-verified public story | public | Current `main` | No page action | Preserve current sequence and claims as a live VicO2 reference |
| Pi Kapp App | production-verified through PR #159; source-first authorship refinement closed | public | Current `main` plus `Website Items\Portfolio Packages\Pi Kapp\` | No current action; keep the unlinked `noindex` system page deferred | Preserve historical source versus remaster distinction, prototype-data labels, non-shipped framing, and AI provenance boundaries |
| Art & Illustration | production-verified public archive | public | Current `main` plus `Website Items\Portfolio Packages\Art & Illustration\` | No page action | Preserve production image set, rights, authorship boundaries, viewer behavior, and artwork-first identity |
| Graphic Design | production-verified public archive; Mendenhall delivery optimization released; Heart of the Frozen Void live and complete | public | Current `main`, `Website Items\Portfolio Packages\Graphic Design\`, and the private Mendenhall source master | No current delivery action | Preserve production source set, rights/client boundaries, editorial identity, complete authored frames, and distinct Mendenhall / Heart of the Frozen Void provenance |
| UI Gallery | production-verified public archive with PR #150 lightbox accessibility fix | public | Current `main` and sanitized gallery sources | Sequenced naming and approved-artifact audit after Home | `UI Fragments` was the working name, not a second route; preserve complete Ekos, static sanitized Magi studies, privacy boundaries, and accessible lightbox lifecycle |
| Getting In | retired from public portfolio | private source material only; absent from public navigation and index | Private authored kits and archived source files | No action; do not reopen without explicit direction | Never describe as a public case study or current portfolio project |

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

- Full local preflight passed for the released Vercel alignment; the submitted candidate package remains immutable evidence.
- About browser verification passed 4 desktop/mobile and Light/Dark states.
- Visual-archive browser verification passed 24 states; wxO/Document Processing passed 28 states across 4 protected gates.
- Protected export policy passed for both active protected routes.
- Local link health reported 600 OK, 0 errors, 60 intentionally excluded, and 1 redirect.
- GitHub health workflow is active; local Lighthouse remains remote/GitHub-only.
- The released maintenance patch replaces the 2,620,396-byte Mendenhall PNG with a visually verified 418,604-byte quality-90 WebP at the same `2500 × 1087` dimensions. The byte-identical PNG source master is preserved outside the deployable repository with its verified SHA-256.
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
