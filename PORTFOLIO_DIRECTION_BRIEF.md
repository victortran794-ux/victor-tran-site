# Portfolio Direction Brief — Concept Album + Studio System

Created: 2026-05-19
Last updated: 2026-05-23
Status: Active direction brief; current phase is review pause after shipped enhancement and navigation polish
Location: Website repo root (`PORTFOLIO_DIRECTION_BRIEF.md`)

This brief consolidates the scattered portfolio enhancement notes into one working direction. It does not change the live website, repo files, images, navigation, or deployment.

## Source notes consolidated

This draft supersedes these planning sources for direction-setting purposes:

1. Website repo implementation plan
   - `archive/planning/design-system-enhancement-plan.md`
   - Main value: practical phases, reusable component vocabulary, low-risk implementation order.

2. iCloud creative concept plan
   - `archive/planning/portfolio-concept-album-plan.md`
   - Main value: concept album metaphor, quiet stagehand navigation, tracklist homepage, now-playing chip, Playbill About.

3. Website repo cockpit/status docs
   - `PORTFOLIO_DASHBOARD.md`
   - `PORTFOLIO_STATUS.md`
   - Main value: current portfolio state, active repo path, access policy, protected-page guardrails.

The original direction notes have been archived under `archive/planning/`. Treat this brief as the unified active direction reference unless Victor revises it.

---

## North star

Build a portfolio that feels like a designer’s concept album: structured enough to navigate, theatrical enough to remember, and personal enough that it could only belong to Victor.

The website should keep its current editorial/static-site foundation, but evolve into a more expressive system where projects feel sequenced, artifacts feel curated, and the interface quietly guides visitors from one piece to the next.

Short version:

- The portfolio is the album.
- The homepage is the cover and tracklist.
- Case studies are tracks.
- Project transitions are crossfades.
- Navigation is the quiet stagehand.
- The About page is the Playbill / liner notes.
- The design system is the production rig that keeps the show coherent.

---

## What should stay

The current site already has a strong foundation. Do not throw it away.

Preserve:

- Static HTML/CSS/JS, no framework or build step.
- Editorial, polished, selective tone.
- Flat visual language: hairlines, surface shifts, no drop shadows.
- Personal, slightly irreverent voice.
- Existing footer, theme, cursor, reveal, and case-study patterns unless a specific change is approved.
- Current simplified navigation model: Work contains both primary case studies and the lighter Art & Illustration / Graphics galleries; About remains top-level; Contact can stay de-emphasized on mobile.
- Password gates and confidentiality protections.
- Document Processing in its current live, password-gated, noindex state unless Victor explicitly approves promotion or major copy/media changes.
- About page `Training for: (WIP)` as an intentional current-state note.

Avoid:

- Generic SaaS/product portfolio polish.
- Full redesign for its own sake.
- Hot Topic black-and-red nostalgia as the main visual language.
- Microsoft-neutral corporate design language.
- Mandatory audio.
- AI-generated art.
- Publishing confidential screenshots, internal platform details, or risky metrics.

---

## Current shipped enhancement state

Updated: 2026-05-23

The first enhancement pass has moved from planning into a review checkpoint. The following patterns are now live and should be reviewed as a system before additional expansion:

1. **Color punctuation pilots**
   - IBM Cloud: orange system note and IBM-blue screen-frame treatments.
   - Ability Experience: purple anniversary note.
   - SAL Magazine: orange archive note.
   - Current decision: pause further rollout until Victor reviews whether the pattern feels purposeful.

2. **Homepage sequence system**
   - Tracklist-style featured-work intro.
   - Static now-playing chip.
   - Non-sticky chapter-progress behavior tied to the homepage work grid.
   - Wide-desktop marquee loop fix so the strip stays seamless when the viewport is larger than the original item set.
   - Current decision: keep behavior homepage-only and review before adding sticky, parallax, or case-study-wide progress.

3. **Navigation / galleries regrouping**
   - Removed the separate top-level Galleries nav menu.
   - Added `Art & Illustration` and `Graphics` to the Work dropdown.
   - Moved gallery cards into a dedicated Galleries subsection inside the homepage Work area, preserving the main project sequence.
   - Finalized the two Gallery cards as single-image cards with orange/purple text surfaces and tighter `Visual archive` wording.
   - Current decision: keep the simpler nav, then review mobile clarity, homepage rhythm, Gallery card treatment, and archive wording before adding any new navigation affordance.

4. **About page**
   - Reviewed and left as-is.
   - A local “Program note” treatment was reverted because the `Act I / Act II / Encore` labels did not fit.
   - Current decision: no immediate About redesign.

5. **A2UI**
   - Paused as a future track.
   - Current decision: do not create or promote an A2UI page until after Victor’s deeper review.

Review checkpoint:

- Victor will review the current live site holistically and bring back enhancement/content notes.
- New work should focus on clarifying, documenting, or refining the shipped patterns rather than adding more new patterns by default.
- See `archive/planning/portfolio-enhancement-state-2026-05-23.md` for the current review checkpoint.

---

## Creative direction

### Concept album

The site should feel sequenced instead of merely listed. Visitors can browse casually, but the experience should imply a curated order: an opening track, a flow between projects, interludes, and a closing note.

Potential expressions:

- Homepage project list as a tracklist.
- Project numbering that feels like album sequencing, not a database table.
- Case-study endings that hand off to the next project.
- Optional interludes: doodles, process fragments, short reflections, or behind-the-scenes artifacts.
- One project eventually presented as a “remaster” or “Victor’s Version.”

### Quiet stagehand navigation

Navigation should be helpful but not loud. It should keep orientation, progress, and next steps visible without taking over the work.

Potential expressions:

- Persistent “now playing” chip.
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

The glasses motif can become a useful interaction pattern if it stays lightweight: a “lens switcher” that changes the site’s viewing state instead of becoming a gimmick. Treat it as a way to shift mood, contrast, and system emphasis while preserving the same content and layout.

Candidate lens themes:

1. **Light**
   - Default editorial reading mode.
   - Best for recruiters, accessibility, and straightforward browsing.

2. **Dark**
   - Higher-contrast studio / night-session mode.
   - Should preserve legibility and image fidelity, not become pure novelty.

3. **DNA**
   - System-inspection mode that exposes tokens, annotations, design-system details, project metadata, or “why this is built this way” notes.
   - Best tied to the existing Design DNA idea.

4. **Wildcolor**
   - A controlled expressive mode using the site’s stronger accent palette.
   - Should be opt-in and disciplined: color as indexing and mood, not random rainbow treatment.

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

This should make screens feel intentionally presented without inventing custom art direction for every project.

### A2UI / Agent-to-User Interface showcase

Added: 2026-05-21
Updated: 2026-05-22 — paused as a future track
Reference: `https://github.com/google/A2UI`

Google's A2UI project is useful because it names a future-facing portfolio opportunity: agents should not only answer in chat or generate arbitrary front-end code; they should be able to express UI intent through a safe, declarative format that the client renders with trusted components. The useful framing is “safe like data, expressive like code.”

This remains a future showcase track, not the active implementation phase. Treat it as a later case-study/prototype about designing the interface layer between humans and agents.

Current decision:

- Pause A2UI implementation while Victor does a deeper review of the current site enhancements.
- Do not create `a2ui.html` yet.
- Do not add homepage/nav promotion yet.
- Revisit as the next part only after the current system is clarified and Victor’s review notes are incorporated.

Potential portfolio framing:

- **Problem:** chat is too thin for complex agent workflows; users need visibility, approvals, sources, reversibility, and recovery states.
- **System idea:** markdown/product brief → agent-generated A2UI-style JSON → trusted component catalog → rendered UI.
- **Design contribution:** define the human-control layer: status, progress, approval, warning, source/evidence, edit, undo, and completion states.
- **Showcase format:** a static or lightly interactive prototype that lets visitors switch between Brief, JSON, Rendered UI, and DNA views.
- **Design-system tie-in:** reuse the lens switcher, screen-frame, radius, artifact-card, and process-strip patterns rather than inventing a separate visual language.

Guardrails:

- Do not imply production experience with Google A2UI unless a real implementation is built.
- Do not adopt the full A2UI stack on the live site until the simpler design-system primitives are stable.
- Prefer a simplified A2UI-inspired schema for the first portfolio prototype if that communicates the concept clearly.
- Keep the public claim honest: this is an exploration of agent-to-user interface design, not a claim that Victor authored the protocol.
- If implemented later, use static HTML/CSS/JS or a small isolated prototype; avoid adding a build system to the portfolio just for this.

### Portfolio color punctuation

The rest of the portfolio may need more intentional splashes of color so the energy of the homepage colored project boxes carries into deeper pages. The goal is not to make every page loud; it is to use the existing accent palette as wayfinding, rhythm, and project identity.

Good candidates:

- Section openers or chapter labels that borrow a project accent.
- Selected artifact/stat/process cards with colored surfaces, similar in spirit to the homepage feature boxes.
- Screen-frame accents and captions that reinforce each project’s color identity.
- Small color-backed “track” moments between major sections.
- Pull quotes, decision cards, or key outcomes that deserve a stronger editorial beat.
- A restrained color strip/dot/chip system for metadata and project categories.

Guardrails:

- Preserve the flat editorial base: color is punctuation, not wallpaper.
- Keep body copy on high-contrast neutral surfaces unless a colored card has proven contrast.
- Reuse existing palette/token relationships before inventing new colors.
- Use color to create hierarchy and movement through the page, not random decoration.
- Document where colored surfaces are allowed so the system does not drift into generic SaaS blocks.
- Test both Light and Dark lenses; colored surfaces should feel intentional in both.

This should become its own small audit/spec before broad rollout: identify where deeper pages feel too monochrome, then choose one or two reusable color patterns to pilot.

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

## External inspiration: State of AI Design

Added: 2026-05-21
Reference: `https://stateofaidesign.com/`

The State of AI Design site is useful inspiration because it behaves less like a generic landing page and more like a designed report: a thesis, numbered chapters, evidence, case-study cards, methodology, and strong editorial pacing. Do not copy its Framer implementation or surface style wholesale. Translate the useful patterns into Victor's static HTML/CSS/JS system.

### What to borrow

- Report-style storytelling: thesis first, then numbered chapters, evidence, process, and credits.
- Chapter navigation: a compact menu that makes long scrolling content feel organized rather than endless.
- Large editorial stats and quote blocks as credibility moments.
- Numbered project cards with discipline tags, short thesis copy, outcome/proof, and a clear CTA.
- Methodology / production-notes sections at the end of case studies.
- Full-viewport or near-full-viewport editorial beats used sparingly for rhythm.
- Masked image reveals, sticky labels, and subtle parallax as punctuation.

### Scroll and parallax principles

Parallax should support the concept-album / studio-system direction, not become a theme-park effect.

Preferred motion vocabulary:

- Fade-up reveal for text and cards.
- Subtle vertical parallax on hero art or one featured artifact per section.
- Sticky chapter labels or project numbers in long case studies.
- Masked image reveals using overflow-hidden wrappers.
- Scroll progress indicator for case studies or the future now-playing chip.

Implementation guardrails:

- Use CSS transforms and opacity only; do not animate layout properties.
- Use `requestAnimationFrame`-throttled scroll handlers or IntersectionObserver.
- Disable or greatly simplify parallax under `prefers-reduced-motion: reduce` and on small/mobile screens.
- Keep all content readable with JavaScript disabled.
- Avoid scroll hijacking, custom smooth-scroll libraries, heavy Framer-like generated code, image sequences, or constant motion.
- Limit active scroll effects to one or two per viewport.

### How it maps to the existing direction

- Concept album becomes more structured as a publication sequence: cover, tracklist, chapters, liner notes, credits.
- Quiet stagehand navigation can become a chapter/track indicator with scroll progress.
- Studio wall / production rig can borrow report patterns: methodology cards, evidence blocks, stats, process notes, and artifact cards.
- Case-study endings can behave like report chapter outros: what changed, what was learned, next track.

---

## Practical direction

This should be implemented in small, reviewable layers. Do not start by hunting for every possible photo. Start by tightening the system, defining the scroll/motion rules, and choosing one pilot.

### Phase 0 — Confirm this brief

Goal: agree on direction before editing public files.

Tasks:

1. Victor reviews this brief.
2. Decide whether the “concept album + quiet stagehand” metaphor feels right.
3. Review this repo-root brief and revise anything that does not fit.
4. Keep superseded scattered plans archived for history under `archive/planning/`.

Output:

- A single approved direction source.

### Phase 1 — Define the homepage tracklist without coding

Goal: describe the homepage concept clearly enough to design or implement later.

Questions to answer:

1. What is the album title?
   - Current site title/name may be enough.
   - Could be more subtle than a literal album name.

2. What is the tracklist order?
   - Current featured work order may stay.
   - Or sequence by story: systems → brand/play → art → personal.

3. What metadata appears per track?
   - Number
   - Project title
   - Year
   - Role
   - Medium/category
   - Visibility marker if protected
   - Optional “explicit”/spicy badge only if tasteful

4. What happens on hover/tap?
   - Key image preview?
   - Short lede?
   - Accent color shift?
   - Small artifact reveal?

5. What should not happen?
   - No distracting music-player gimmickry.
   - No clutter that makes hiring/recruiting navigation harder.

Output:

- A one-page homepage tracklist spec.

### Phase 2 — Define the now-playing chip

Goal: make the quiet-stagehand idea specific.

Candidate behavior:

- Fixed bottom corner on desktop.
- Non-intrusive placement on mobile, or hidden until useful.
- Shows current page/project and position: `03 / 09 — IBM Patterns`.
- Thin progress bar tied to scroll depth on case studies.
- Click/tap opens a compact project list or jumps to next project.
- No audio by default.

Questions:

1. Should it appear on every page or only case studies?
2. Should it show scroll progress, next project, or both?
3. Should it be purely visual at first, with no interactive menu?
4. What is the mobile fallback?

Output:

- A simple component spec that can be implemented later.

### Phase 3 — Design-system and motion hardening

Goal: make the current system easier to extend before adding theatrical features or broader parallax.

Low-risk implementation candidates from the repo plan:

- Add missing CSS variables for radii, motion, easing, and line-height.
- Expand radius tokens intentionally, for example `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, and `--radius-pill`, then map them to cards, frames, chips, and controls.
- Add lens/theme tokens for Light, Dark, DNA, and eventual Wildcolor modes using CSS variables / `data-lens` rather than duplicate markup.
- Add color-punctuation rules that extend the homepage’s colored-box energy into deeper pages through reusable accent surfaces, chapter labels, metadata chips, and selected artifact/stat/decision cards.
- Add motion tokens for scroll effects, for example `--parallax-distance-sm`, `--parallax-distance-md`, `--reveal-distance`, and shared easing/duration values.
- Mirror tokens in `content/design-system.json` if that remains part of the system.
- Add reusable classes for:
  - callout cards
  - artifact cards
  - stat cards
  - decision cards
  - process strips
  - section notes
  - chips
  - chapter / track labels
  - masked image reveal wrappers
  - optional parallax layers
  - screen frames for UI/product screenshots
  - lens switcher controls / theme-state affordances
- Keep visual output close to current pages at first.

Recommended validation:

- Check homepage, About, one case study, and both gallery pages.
- Test with `prefers-reduced-motion` enabled.
- Check mobile behavior; parallax should simplify or turn off.
- Run `./scripts/preflight.sh` before any PR.
- Use a review branch, not direct edits to `main`.

Output:

- A safer component and motion vocabulary that supports the concept-album direction without over-animating the site.

### Phase 4 — Pick one pilot project

Goal: prove the direction on one project before touching the whole site.

Best pilot options:

1. IBM Patterns
   - Pros: strong systems/process fit; good candidate for stat cards, callouts, and field notes.
   - Cons: protected; preserve password gate and confidentiality.

2. Pi Kapp App
   - Pros: playful prototype energy; likely safer for visible personality.
   - Cons: may need stronger narrative framing.

3. Ability Experience or SAL Magazine
   - Pros: public-facing and probably safer for visual experiments.
   - Cons: may not test the full product/system component vocabulary.

Avoid starting with:

- Document Processing, unless the task is narrowly scoped. It is live and protected, but screenshots, claims, metrics, homepage promotion, and major copy changes need explicit approval.

Recommended first pilot:

- IBM Patterns if the goal is design-system maturity.
- Pi Kapp App if the goal is personality/play.

Output:

- One pilot page selected.
- A list of allowed assets and confidentiality boundaries.
- A small branch plan.

### Phase 5 — A2UI showcase spec

Goal: separate the future-facing Agent-to-User Interface idea from the core site-polish work, then decide whether it becomes a public case study, a prototype, or both.

Recommended scope:

- Write a short case-study/prototype spec titled around “Agent-to-User Interface” or “From Markdown Brief to Agentic UI.”
- Define one sample workflow that is safe to show publicly, preferably not based on protected IBM/PCI/client material.
- Define a small trusted component catalog: status card, source/evidence card, approval panel, warning/risk state, editable recommendation, progress timeline, and completion summary.
- Show the transformation across four views: Brief, A2UI-style JSON, Rendered UI, and DNA notes.
- Use the existing lens-switcher idea as the viewing mechanism if it helps: Light for the polished case study, DNA for the underlying schema/states.
- Keep it A2UI-inspired unless/until a real implementation is built with the Google A2UI stack.

Output:

- A separate A2UI showcase spec that can be implemented after the foundational design-system sprint.

### Phase 6 — Asset and photo inventory

Goal: find supporting examples and photos after the direction is clear.

Safe default source areas from the access policy:

- `C:\Users\Victor\iCloudDrive\Documents\Design Work\Website`
- `C:\Users\Victor\iCloudDrive\Documents\Design Work\2_Assets`
- `C:\Users\Victor\iCloudDrive\Documents\Design Work\5_Logos`
- `C:\Users\Victor\iCloudDrive\Documents\Design Work\6_Illustrations`
- `C:\Users\Victor\iCloudDrive\Documents\Design Work\7_Powerpoints`
- `C:\Users\Victor\iCloudDrive\Documents\Photography\1_Me`
- `C:\Users\Victor\iCloudDrive\Documents\Photography\2_Art`

Ask first before inspecting or using:

- IBM folders
- PCI folders
- Important Documents
- internal platform screenshots
- password-gated material
- client/unreleased work
- anything likely to contain credentials, legal, HR, compliance, or private personal records

Asset workflow:

1. Inventory candidate assets read-only.
2. Confirm publication safety.
3. Export/copy only curated web-ready assets.
4. Optimize images.
5. Add to repo on a branch.
6. Review before merge/deploy.

Output:

- Curated list of candidate images/examples for the selected pilot.

---

## Review pause and next phase

The first concrete enhancement sprint is complete enough for holistic review. Do not start another broad implementation track until Victor finishes a deep review of the current site.

Shipped in this sprint:

1. Phase C color punctuation pilots on IBM Cloud, Ability Experience, and SAL Magazine.
2. Homepage tracklist / report-chapter intro.
3. Homepage now-playing chip.
4. Homepage non-sticky chapter-progress behavior.
5. About page review, with no shipped change.
6. A2UI identified as a future track, then paused.

Next phase goal:

Clarify the system after the shipped work, collect Victor’s review notes, then choose the next focused branch.

Tasks:

1. Keep this direction brief and `PORTFOLIO_DASHBOARD.md` updated with the shipped state.
2. Use `archive/planning/portfolio-enhancement-state-2026-05-22.md` as the current checkpoint.
3. Let Victor review the live site in desktop/mobile and Light/Dark.
4. Collect review notes before adding more patterns.
5. Include a tone/wording track for pull quotes, section headers, labels, and supporting copy that feel too cheesy, over-written, or theatrical.
6. After review, choose one focused next track:
   - refine homepage behavior;
   - constrain or extend color punctuation;
   - run the tone/wording pass;
   - update content/copy;
   - deepen one case study;
   - resume A2UI as a separate spec/prototype.

---

## Decisions needed from Victor

1. Does “concept album + quiet stagehand” still feel right, or should it be softened into “curated sequence + subtle navigation”?

2. Should the homepage actually look like a tracklist, or only borrow tracklist behaviors?

3. What should be the first pilot project?
   - IBM Patterns: system/process pilot.
   - Pi Kapp App: playful/personality pilot.
   - Ability Experience or SAL Magazine: public/safe visual pilot.

4. Should the lens switcher start with just Light/Dark, or should DNA be part of the first prototype?
   - Recommendation: prototype Light/Dark/DNA as states, but ship Wildcolor only after the core modes feel controlled.

5. Where should UI screen frames appear first?
   - Recommendation: pilot on one public/non-sensitive project before using on protected case studies.

6. How rounded should the system get?
   - Recommendation: add radius tokens and use them selectively for frames/cards/chips rather than rounding the entire site.

7. Should the About page become more Playbill/liner-notes inspired?
   - Safe: polish current About.
   - Spicy: personal dashboard / Playbill / liner notes.

8. Should A2UI become a separate future-facing showcase after the core system pass?
   - Recommendation: yes, but spec it as an A2UI-inspired Agent-to-User Interface case study/prototype first; do not let it expand the first implementation sprint.

9. Should the deeper portfolio pages use more color punctuation?
   - Recommendation: yes; audit the pages first, then add a small set of reusable accent-surface rules inspired by the homepage colored boxes. Avoid random per-page decoration.

10. Are the archived source notes useful to keep, or should they eventually be pruned after this direction is approved?

---

## Guardrails

- No edits to public website files without Victor’s explicit task approval.
- No commit, push, deploy, delete, or archive actions without confirming exact files/actions.
- Preserve password gates and noindex protections.
- Do not promote Document Processing to homepage/sitemap or add screenshots/metrics without approval.
- Use iCloud as reference/source archive, not the active Git repo.
- Active website repo remains:
  - `C:\Users\Victor\Documents\Websites\victor-tran-site`
- Prefer branches and PRs for review.

---

## Immediate next step

Current state:

- Enhancement work is paused for Victor’s deep review.
- A2UI is paused as a future track.
- The current checkpoint is `archive/planning/portfolio-enhancement-state-2026-05-22.md`.

Recommended next action:

1. Victor reviews the current live site across desktop/mobile and Light/Dark.
2. Victor brings back enhancement/content notes, including wording that feels too cheesy, over-written, or theatrical.
3. The next branch is selected from those notes rather than continuing the roadmap automatically.
4. Resume A2UI only when Victor wants to make it the next explicit track.
