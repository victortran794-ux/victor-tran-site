# Portfolio Direction Brief — Concept Album + Studio System

Created: 2026-05-19
Last updated: 2026-07-12
Status: Active direction brief; current implementation is reconciled and a fresh cross-viewport visual review is the next gate
Location: Website repo root (`PORTFOLIO_DIRECTION_BRIEF.md`)

This brief is the single active direction reference for Victor's portfolio. It consolidates the scattered portfolio enhancement notes into one working direction. It does not change the live website, repo files, images, navigation, or deployment by itself.

## Authority note

This file is authoritative for creative/product direction, enhancement intent, design-system direction, and future-track framing. It is not authoritative for current next actions, repo operating rules, agent permissions, or structured token values.

Consult next:

- `PORTFOLIO_DASHBOARD.md` for current active plan, current status, and next actions.
- `PORTFOLIO_SYSTEM.md` for repo structure, publishing, health checks, and maintenance rules.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for agent roles, guardrails, and handoffs.
- `content/design-system.md` for design system principles, voice, imagery, and usage.
- `content/design-system.json` for structured token values.
- `archive/planning/README.md` for historical checkpoints and source notes.

Use this file for direction-setting. Use dated files under `archive/planning/` for historical checkpoints, implementation notes, and source context. Archived plans are historical unless this brief or `PORTFOLIO_DASHBOARD.md` explicitly references them as active work.

---

## 1. One-page summary

### North star

Build a portfolio that feels like a designer's concept album: structured enough to navigate, theatrical enough to remember, and personal enough that it could only belong to Victor.

Short version:

- The portfolio is the album.
- The homepage is the cover and tracklist.
- Case studies are tracks.
- Project transitions are crossfades.
- Navigation is the quiet stagehand.
- The About page is the Playbill / liner notes.
- The design system is the production rig that keeps the show coherent.

### Current posture

The enhancement work has shipped enough to keep broad expansion gated. In addition to the June closeout, IBM Cloud's empty placeholders were removed, the Document Processing homepage card shipped, and project-manifest generation/validation now keeps the homepage, Work menu, and project navigation aligned. A fresh desktop/mobile and Light/Dark review is the next gate. The later site-review backlog is resolved: contact resilience, Pi Kapp demo cold-start presentation, Performance Contracting naming, and the second-half-of-2026 release wording have shipped or been aligned. The manual mobile/Light/Dark review is deferred; subjective visual changes remain gated until that review. A2UI remains parked.

Current working posture:

1. Treat current-site review, public tone, and public visual/interaction polish as separate gated slices.
2. If Victor finds a concrete issue, choose one narrow practical slice and fix that before broadening.
3. Keep A2UI parked under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/` until Victor explicitly resumes it.
4. Keep the parked standalone A2UI branch unmerged: `feat/a2ui-showcase-static-prototype` at `87ddb60`.
5. Keep report-style chapters, lens/DNA mode, and broader motion/prototype ideas as future concepts until Victor explicitly selects the first one.
6. Do not turn future concepts into live pages, homepage/nav promotion, sitemap changes, floating chat widgets, or broad redesign work without a separate approval.

### Top active decisions

1. Victor reviews the live site manually across desktop/mobile and Light/Dark; any notes become a prioritized punch list rather than an automatic implementation batch.
2. Pick the next docket item, if any: current-site review, public copy/tone, public visual/interaction polish, or another future concept.
3. Keep A2UI parked until the technology/infrastructure catches up or Victor explicitly resumes it.
4. Do not merge or promote the parked standalone A2UI branch as-is.
5. Do not start protected-page promotion, sitemap changes, major copy rewrites, or broad redesign work without explicit approval.

---

## 2. Current shipped state

Updated: 2026-06-07

The following patterns are live or explicitly decided. Mechanical review checks passed on 2026-06-06 and final objective closeout checks passed on 2026-06-07; human visual/tone review can still flag narrow fixes, but these tracks are no longer blocking movement into future-concepts planning.

### Shipped / reviewed patterns

1. **Color punctuation pilots**
   - IBM Cloud: orange system note and IBM-blue screen-frame treatments.
   - Ability Experience: purple anniversary note.
   - SAL Magazine: orange archive note.
   - Current decision: keep as shipped; only broaden if Victor selects a future visual-system direction.

2. **Homepage sequence system**
   - Tracklist-style featured-work intro.
   - Static now-playing chip.
   - Non-sticky chapter-progress behavior tied to the homepage work grid.
   - Wide-desktop marquee loop fix so the strip stays seamless when the viewport is larger than the original item set.
   - Current decision: keep behavior homepage-only; treat sticky, parallax, or case-study-wide progress as future-concept work.

3. **Navigation / galleries regrouping**
   - Removed the separate top-level Galleries nav menu.
   - Added `Art & Illustration` and `Graphics` to the Work dropdown.
   - Moved gallery cards into a dedicated Galleries subsection inside the homepage Work area, preserving the main project sequence.
   - Finalized the two Gallery cards as single-image cards with orange/purple text surfaces and tighter `Visual archive` wording.
   - Current decision: keep the simpler nav; only revisit if human review flags a concrete issue.

4. **About page**
   - Reviewed and left as-is.
   - A local “Program note” treatment was reverted because the `Act I / Act II / Encore` labels did not fit.
   - Current decision: no immediate About redesign.

5. **A2UI**
   - Identified as a future track, then paused.
   - Current decision: A2UI is part of the future-concepts area, but no page or promotion should be created without explicit selection.

6. **Public-site accessibility and performance polish mini-sprint**
   - Homepage Work-section copy was tightened so galleries read as supporting visual archive material rather than competing case studies.
   - About photo accessibility was improved without redesigning the About page.
   - Public-page accessibility/performance hygiene was improved across safe public pages.
   - Art & Illustration now has an explicit accessible Pause/Play control for the auto-advancing slideshow.
   - Current decision: keep as shipped; handle any human review issues as one narrow practical slice.

7. **Public image dimensions and wording cleanup**
   - Public image dimensions landed as a mechanical performance-hardening pass.
   - A small dash-heavy wording cleanup removed decorative em-dash rhythm from selected public copy, captions, alt text, and the 404 page while preserving real date-range dashes.
   - Current decision: keep as shipped; open a deeper tone pass only if Victor selects it after review.

### Current checkpoint

- Practical enhancement slices are gated after PR #66 clarified the adjusted slice structure.
- The latest dated checkpoint is `archive/planning/portfolio-enhancement-state-2026-07-12.md`.
- Future work may move into future-concepts planning, but implementation remains opt-in and branch-sized.
- If human review surfaces a concrete current-site issue, handle it as one narrow practical slice before returning to future concepts.

---

## 3. Stable principles

### What should stay

The current site already has a strong foundation. Do not throw it away.

Preserve:

- Static HTML/CSS/JS, no framework or build step.
- Editorial, polished, selective tone.
- Flat visual language: hairlines, surface shifts, no drop shadows.
- Personal, slightly irreverent voice.
- Existing footer, theme, cursor, reveal, and case-study patterns unless a specific change is approved.
- Current simplified navigation model: Work contains both primary case studies and the lighter Art & Illustration / Graphics galleries; About remains top-level; Contact can stay de-emphasized on mobile.
- Password gates and confidentiality protections.
- Document Processing in its current live, password-gated, noindex state unless Victor explicitly approves promotion or major copy/media changes. In planning and handoffs, treat it with the same weight as any other portfolio project page; the `case-studies/` notes workflow exists to standardize information gathering across projects.
- About page `Training for: (WIP)` as an intentional current-state note.

Avoid:

- Generic SaaS/product portfolio polish.
- Full redesign for its own sake.
- Hot Topic black-and-red nostalgia as the main visual language.
- Microsoft-neutral corporate design language.
- Mandatory audio.
- AI-generated art.
- Publishing confidential screenshots, internal platform details, or risky metrics.

### Guardrails

- No edits to public website files without Victor's explicit task approval.
- No commit, push, deploy, delete, or archive actions without confirming exact files/actions.
- Preserve password gates and noindex protections.
- Do not promote Document Processing to homepage/sitemap or add screenshots/metrics without approval.
- Use iCloud as reference/source archive, not the active Git repo.
- Active website repo remains `C:\Users\Victor\Documents\Websites\victor-tran-site`.
- Prefer branches and PRs for review.

---

## 4. Creative system

### Concept album

The site should feel sequenced instead of merely listed. Visitors can browse casually, but the experience should imply a curated order: an opening track, a flow between projects, interludes, and a closing note.

Potential expressions:

- Homepage project list as a tracklist.
- Project numbering that feels like album sequencing, not a database table.
- Case-study endings that hand off to the next project.
- Optional interludes: doodles, process fragments, short reflections, or behind-the-scenes artifacts.
- One project eventually presented as a “remaster” or “Victor's Version.”

### Quiet stagehand navigation

Navigation should be helpful but not loud. It should keep orientation, progress, and next steps visible without taking over the work.

Potential expressions:

- Persistent or contextual “now playing” chip.
- Scroll progress tied to the current project.
- Subtle next-project cue at the bottom of case studies.
- Ambient status language: `03 / 09 — IBM Patterns` rather than heavy UI labels.

### Studio wall / production rig

The design system should make process artifacts visible: sketches, decisions, stats, callouts, timelines, chips, process strips, and field notes.

Potential expressions:

- Artifact cards.
- Decision grids.
- Stat cards.
- Process strips.
- Section notes.
- Quote / design-tension callouts.
- Project-category accents.

### Lens switcher / viewing modes

The glasses motif can become a useful interaction pattern if it stays lightweight: a “lens switcher” that changes the site's viewing state instead of becoming a gimmick. Treat it as a way to shift mood, contrast, and system emphasis while preserving the same content and layout.

Candidate lens themes:

1. **Light** — default editorial reading mode; best for recruiters, accessibility, and straightforward browsing.
2. **Dark** — higher-contrast studio / night-session mode; should preserve legibility and image fidelity.
3. **DNA** — system-inspection mode exposing tokens, annotations, design-system details, project metadata, or “why this is built this way” notes.
4. **Wildcolor** — controlled expressive mode using stronger accent palette; opt-in and disciplined.

Implementation guardrails:

- The switcher should be progressive enhancement. Content must remain usable without it.
- Prefer CSS variables / `data-lens` attributes over duplicated page markup.
- Save preference only if it feels useful; avoid surprising first-time visitors with an extreme mode.
- Respect `prefers-color-scheme` and `prefers-reduced-motion`.
- Start with Light/Dark or Light/Dark/DNA before adding Wildcolor if implementation risk grows.

### UI screen display pattern

The site needs a reusable, safe way to display UI/product screens across case studies. The first version can be simple: a colored frame pulled from the design system.

Potential pattern:

- `.screen-frame` wrapper with project/system accent color.
- Rounded corners using the expanded radius tokens.
- Optional top bar or caption strip only when it adds context.
- Inner image keeps its natural UI fidelity; the frame supplies the portfolio system voice.
- Variants for single screen, before/after pair, stacked flow, and annotated detail.
- Confidential/protected screens can use the same frame with blur, crop, redaction, or placeholder states.

### Portfolio color punctuation

The portfolio can use intentional splashes of color so the energy of the homepage colored project boxes carries into deeper pages. The goal is not to make every page loud; it is to use the existing accent palette as wayfinding, rhythm, and project identity.

Good candidates:

- Section openers or chapter labels that borrow a project accent.
- Selected artifact/stat/process cards with colored surfaces.
- Screen-frame accents and captions that reinforce each project's color identity.
- Small color-backed “track” moments between major sections.
- Pull quotes, decision cards, or key outcomes that deserve a stronger editorial beat.
- A restrained color strip/dot/chip system for metadata and project categories.

Guardrails:

- Preserve the flat editorial base: color is punctuation, not wallpaper.
- Keep body copy on high-contrast neutral surfaces unless a colored card has proven contrast.
- Reuse existing palette/token relationships before inventing new colors.
- Use color to create hierarchy and movement through the page, not random decoration.
- Document where colored surfaces are allowed so the system does not drift into generic SaaS blocks.
- Test both Light and Dark lenses.

### Softer radius system

Add more rounded corners where they support the glasses/lens/UI-screen metaphor and make artifacts feel more touchable. Keep the base visual language flat and editorial: rounded does not mean bubbly, SaaS-generic, or shadow-heavy.

Good candidates:

- UI screen frames.
- Lens switcher controls.
- Chips / tags.
- Artifact cards.
- Stat and decision cards.
- Image masks where the content benefits from a softer container.

Avoid rounding everything equally. Use radius as hierarchy: small for editorial cards, medium for UI frames, pill for controls/chips.

---

## 5. External inspiration

### State of AI Design

Added: 2026-05-21
Reference: `https://stateofaidesign.com/`

The State of AI Design site is useful inspiration because it behaves less like a generic landing page and more like a designed report: a thesis, numbered chapters, evidence, case-study cards, methodology, and strong editorial pacing. Do not copy its Framer implementation or surface style wholesale. Translate the useful patterns into Victor's static HTML/CSS/JS system.

What to borrow:

- Report-style storytelling: thesis first, then numbered chapters, evidence, process, and credits.
- Chapter navigation: a compact menu that makes long scrolling content feel organized rather than endless.
- Large editorial stats and quote blocks as credibility moments.
- Numbered project cards with discipline tags, short thesis copy, outcome/proof, and a clear CTA.
- Methodology / production-notes sections at the end of case studies.
- Full-viewport or near-full-viewport editorial beats used sparingly for rhythm.
- Masked image reveals, sticky labels, and subtle parallax as punctuation.

Scroll and parallax principles:

- Use motion to support the concept-album / studio-system direction, not as a theme-park effect.
- Favor fade-up reveals, subtle vertical parallax on one key artifact, sticky chapter labels, masked image reveals, and scroll progress.
- Use CSS transforms and opacity only; do not animate layout properties.
- Use `requestAnimationFrame`-throttled scroll handlers or IntersectionObserver.
- Disable or greatly simplify parallax under `prefers-reduced-motion: reduce` and on small/mobile screens.
- Keep all content readable with JavaScript disabled.
- Avoid scroll hijacking, custom smooth-scroll libraries, heavy Framer-like generated code, image sequences, or constant motion.
- Limit active scroll effects to one or two per viewport.

How it maps to the existing direction:

- Concept album becomes more structured as a publication sequence: cover, tracklist, chapters, liner notes, credits.
- Quiet stagehand navigation can become a chapter/track indicator with scroll progress.
- Studio wall / production rig can borrow report patterns: methodology cards, evidence blocks, stats, process notes, and artifact cards.
- Case-study endings can behave like report chapter outros: what changed, what was learned, next track.

---

## 6. Future work queue

This section replaces the older long phase roadmap. It separates what needs review now from what may come later.

### Practical slices gated

The current-site review gate found no mechanical blocker on 2026-06-06: homepage, About, Art & Illustration, Document Processing, and sitemap returned expected live states; preflight passed; selected public/protected pages had no missing local image references and no em-dash hits in the checked HTML files. Final objective closeout checks on 2026-06-07 confirmed the simplified About voiceover wording, current generated exports, preserved Document Processing guardrails, preserved sitemap omissions, and passing preflight. Human visual/tone review can still produce a narrow practical follow-up, but the practical tracks are not blocking future-concepts planning.

If Victor flags a concrete issue, choose one of these narrow slices:

1. **Current-site review and punch list**
   - Desktop/mobile and Light/Dark notes only; output is a prioritized punch list, not an implementation batch.

2. **Public copy/tone slice**
   - Homepage cards, gallery labels/captions, About copy, pull quotes, section headers, and dash-heavy or overly clever sentence rhythm.

3. **Public visual/interaction polish slice**
   - Art & Illustration Pause/Play button treatment, homepage Work/Galleries visual balance, media loading/image behavior, and small responsive tweaks.

4. **Document Processing closed protected-page state**
   - No standing Document Processing-specific action remains.
   - Keep the protected IBM portfolio page live in its current password-gated/noindex state with current Work-dropdown visibility and sitemap omission.
   - Temporary placeholder media is acceptable as-is until Victor explicitly selects a new refinement pass.
   - If Victor reselects the page later, start a new approval-gated slice and use the private handoff before changing visuals or claims: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`.

### Future concepts area

These are exploration candidates, not an automatic build queue. A2UI is parked as a contained experiment until the technology/infrastructure is ready or Victor explicitly resumes it.

1. **A2UI / Agent-to-User Interface methodology**
   - Parked contained experiment: `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`.
   - Parked standalone branch: `feat/a2ui-showcase-static-prototype` at `87ddb60`.
   - Resume only if Victor explicitly selects A2UI again and the portfolio has infrastructure for a truthful static study, content-aware browser, or real agent/runtime integration.

2. **Report-style chapter system**
   - Explore whether case studies should borrow stronger report patterns: thesis, numbered chapters, evidence blocks, methodology notes, and chapter outros.
   - Keep this as a structure/spec exercise before changing live pages.

3. **Lens / DNA inspection mode**
   - Explore a restrained lens mode that exposes tokens, annotations, design-system details, project metadata, or “why this is built this way” notes.
   - Start as a prototype/spec; do not surprise normal visitors with an extreme default mode.

4. **Broader motion / prototype behavior**
   - Consider masked reveals, subtle parallax, and chapter progress only after the concept is specified and reduced-motion/mobile behavior is clear.

5. **Asset and photo inventory**
   - Inventory candidate assets only after the next direction is clear.
   - Safe default reference areas from the access policy include:
     - `C:\Users\Victor\iCloudDrive\Documents\Design Work\Website`
     - `C:\Users\Victor\iCloudDrive\Documents\Design Work\2_Assets`
     - `C:\Users\Victor\iCloudDrive\Documents\Design Work\5_Logos`
     - `C:\Users\Victor\iCloudDrive\Documents\Design Work\6_Illustrations`
     - `C:\Users\Victor\iCloudDrive\Documents\Design Work\7_Powerpoints`
     - `C:\Users\Victor\iCloudDrive\Documents\Photography\1_Me`
     - `C:\Users\Victor\iCloudDrive\Documents\Photography\2_Art`
   - Ask first before inspecting or using IBM folders, PCI folders, Important Documents, internal screenshots, password-gated material, client/unreleased work, or anything likely to contain credentials, legal, HR, compliance, or private personal records.

### Do not touch without explicit approval

- Document Processing promotion, raw screenshots, metrics, launch claims, or major copy/media changes. A media-audit plan is allowed only as a new planning artifact if Victor explicitly reselects the page.
- Password-gate/noindex behavior.
- Homepage/nav/sitemap promotion for paused or protected work.
- Full redesign, framework/build-step adoption, or site-wide visual-system rollout.
- A2UI standalone page creation, floating chat widgets, or homepage/nav/sitemap promotion.

---

## 7. A2UI / Agent-to-User Interface future track

Added: 2026-05-21
Updated: 2026-06-06 — parked contained experiment
Reference: `https://github.com/a2ui-project/a2ui`

Google's A2UI project is useful because it names a future-facing portfolio opportunity: agents should not only answer in chat or generate arbitrary front-end code; they should be able to express UI intent through a safe, declarative format that the client renders with trusted components. The useful framing is “safe like data, expressive like code.”

This remains useful as future-concepts context, but it is no longer active site work. The inline About-page prototype looked promising visually, but it was only a static A2UI-inspired study: it did not read the generated Markdown pages, query `content/site-index.json`, run a live agent, or use a verified A2UI runtime/package. To keep the slate clear, the work is preserved as a contained experiment under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/` for future pickup.

Current decision:

- Do not merge or promote the parked standalone branch `feat/a2ui-showcase-static-prototype` at `87ddb60` as-is.
- Keep the inline About-page experiment contained under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/`.
- Resume A2UI only when Victor explicitly selects it and the implementation can be clearly labeled as either a static interface study, a content-aware browser using generated site content, or a real agent/A2UI runtime integration.
- Do not add homepage/nav/sitemap promotion, floating chat widgets, live agent infrastructure, or public claims that imply a real A2UI implementation until that is true.

Potential portfolio framing:

- **Problem:** chat is too thin for complex agent workflows; users need visibility, approvals, sources, reversibility, and recovery states.
- **System idea:** markdown/product brief → agent-generated A2UI-style JSON → trusted component catalog → rendered UI.
- **Design contribution:** define the human-control layer: status, progress, approval, warning, source/evidence, edit, undo, and completion states.
- **Showcase format:** an inline About-page "Studio Assistant" or "Liner Notes Assistant" where visitor prompt chips render portfolio-native cards, with an optional DNA/inspect view for the A2UI-style payload.
- **Design-system tie-in:** reuse the lens switcher, screen-frame, radius, artifact-card, and process-strip patterns rather than inventing a separate visual language.

Guardrails:

- Do not imply production experience with A2UI unless a real implementation is built.
- Do not adopt the full A2UI stack on the live site until the simpler design-system primitives are stable.
- Prefer a simplified A2UI-inspired schema for the first portfolio prototype if that communicates the concept clearly.
- Keep the public claim honest: this is an exploration of agent-to-user interface design, not a claim that Victor authored the protocol.
- Avoid a floating chat icon. The trigger should be inline and contextual.
- If implemented later, use static HTML/CSS/JS or a small isolated prototype; avoid adding a build system to the portfolio just for this.

---

## 8. Decision log / review questions

### Open review questions

1. Does “concept album + quiet stagehand” still feel right, or should it be softened into “curated sequence + subtle navigation”?
2. Should the homepage actually look like a tracklist, or only borrow tracklist behaviors?
3. Are the shipped homepage labels and supporting copy grounded enough, or too theatrical?
4. Do the Work/Galleries nav changes make the site clearer on mobile and desktop?
5. Do Gallery cards feel correctly secondary/supporting, or do they still compete with the main case studies?
6. Do the IBM Cloud, Ability Experience, and SAL color-punctuation examples feel purposeful enough to keep?
7. Is there any current-site issue worth fixing now, or should the next move be a narrow review/audit rather than another implementation branch?
8. Are the archived source notes useful to keep, or should they eventually be pruned after this direction is approved?

### Recommended next action

1. Treat the practical slices as gated unless Victor flags a concrete current-site issue.
2. Keep A2UI parked under `archive/experiments/a2ui-inline-about-methodology-2026-06-06/` until explicitly resumed.
3. Choose the next branch-sized task from the docket/menu: current-site review, public copy/tone, public visual/interaction polish, or another future concept.
4. Keep homepage/nav promotion, sitemap changes, floating chat widgets, or protected-page changes behind a separate approval.

---

## 9. Source notes consolidated

This brief supersedes these planning sources for direction-setting purposes:

1. Website repo implementation plan
   - `archive/planning/design-system-enhancement-plan.md`
   - Main value: practical phases, reusable component vocabulary, low-risk implementation order.

2. iCloud creative concept plan
   - `archive/planning/portfolio-concept-album-plan.md`
   - Main value: concept album metaphor, quiet stagehand navigation, tracklist homepage, now-playing chip, Playbill About.

3. Website repo cockpit/status docs
   - `PORTFOLIO_DASHBOARD.md`
   - `archive/planning/portfolio-status-legacy-2026-05-18.md`
   - Main value: current portfolio state in the dashboard, plus historical context from the archived status snapshot, active repo path, access policy, and protected-page guardrails.

The original direction notes have been archived under `archive/planning/`. Treat this brief as the unified active direction reference unless Victor revises it.
