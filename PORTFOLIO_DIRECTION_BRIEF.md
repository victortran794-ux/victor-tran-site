# Portfolio Direction Brief — Concept Album + Studio System

Created: 2026-05-19
Last updated: 2026-06-01
Status: Active direction brief; current phase is review pause after shipped public-site polish, performance hardening, and wording cleanup
Location: Website repo root (`PORTFOLIO_DIRECTION_BRIEF.md`)

This brief is the single active direction reference for Victor's portfolio. It consolidates the scattered portfolio enhancement notes into one working direction. It does not change the live website, repo files, images, navigation, or deployment by itself.

Use this file for direction-setting. Use dated files under `archive/planning/` for historical checkpoints, implementation notes, and source context.

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

The enhancement work has shipped enough to pause and review as a system. A small public-site polish mini-sprint, public image-dimension pass, and dash-heavy wording cleanup have landed, so the next move should be review, checkpointing, or one branch-sized refinement rather than broad expansion.

Current working posture:

1. Review the live site holistically across desktop/mobile and Light/Dark.
2. Clarify whether the shipped patterns feel useful, tasteful, and grounded.
3. Collect Victor's review notes, especially anything that feels cheesy, over-written, too theatrical, or visually muddled.
4. Choose one focused next branch from those notes.
5. Keep A2UI paused until Victor explicitly resumes it as the next track.

### Top active decisions

1. Keep, soften, or rename the “concept album + quiet stagehand” framing.
2. Decide whether the homepage should feel like a literal tracklist or only borrow sequencing behavior.
3. Decide whether the next branch is a small homepage/nav refinement, deeper tone/wording pass, Document Processing media-audit plan, or A2UI spec/prototype.

---

## 2. Current shipped state

Updated: 2026-06-01

The following patterns are live or explicitly decided and should be reviewed together before more expansion.

### Shipped / reviewed patterns

1. **Color punctuation pilots**
   - IBM Cloud: orange system note and IBM-blue screen-frame treatments.
   - Ability Experience: purple anniversary note.
   - SAL Magazine: orange archive note.
   - Current decision: pause broad rollout until Victor reviews whether the pattern feels purposeful.

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
   - Identified as a future track, then paused.
   - Current decision: do not create or promote an A2UI page until after Victor's deeper review.

6. **Public-site accessibility and performance polish mini-sprint**
   - Homepage Work-section copy was tightened so galleries read as supporting visual archive material rather than competing case studies.
   - About photo accessibility was improved without redesigning the About page.
   - Public-page accessibility/performance hygiene was improved across safe public pages.
   - Art & Illustration now has an explicit accessible Pause/Play control for the auto-advancing slideshow.
   - Current decision: review the polish in mobile, Light, and Dark before opening a broader media/performance pass.

7. **Public image dimensions and wording cleanup**
   - Public image dimensions landed as a mechanical performance-hardening pass.
   - A small dash-heavy wording cleanup removed decorative em-dash rhythm from selected public copy, captions, alt text, and the 404 page while preserving real date-range dashes.
   - Current decision: review the public copy changes in context before opening a deeper tone pass.

### Current checkpoint

- Enhancement work is paused for Victor's deep review.
- The latest dated checkpoint is `archive/planning/portfolio-enhancement-state-2026-06-01.md`.
- Future work should clarify, document, or refine shipped patterns rather than add more patterns by default.

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

### Review now

1. **Holistic live-site review**
   - Review desktop/mobile and Light/Dark.
   - Look specifically at homepage rhythm, Work/Galleries grouping, color-punctuation cards, now-playing/chapter cue behavior, homepage Work copy, About image behavior, public media loading, Art & Illustration slideshow controls, and overall tone.

2. **Tone / wording pass**
   - Identify pull quotes, section headers, labels, and supporting copy that feel too cheesy, over-written, or theatrical.
   - Goal: sharper and more grounded, not generic corporate UX copy.

3. **Color punctuation evaluation**
   - Decide whether IBM Cloud, Ability Experience, and SAL feel like a coherent reusable pattern.
   - Do not broaden the pattern until the first three examples are reviewed.

### Candidate next

1. **Image-dimension / performance hardening**
   - Add explicit image dimensions or similarly narrow media-loading improvements where the current public pages still need stability/performance hardening.
   - Keep this as a mechanical/public-page pass unless Victor explicitly selects broader visual changes.

2. **Homepage refinement**
   - Refine tracklist labels, now-playing wording, or chapter-progress behavior if review shows the structure works but needs grounding.
   - Avoid sticky/fixed UI, parallax, or heavier behavior unless explicitly selected.

3. **One focused case-study/content pass**
   - Choose one public or approved protected case study.
   - Define allowed assets, confidentiality boundaries, and whether the goal is copy, visuals, evidence, or structure.

4. **Document Processing Claude Code + Figma media-audit plan**
   - Treat this as planning only until Victor explicitly approves implementation.
   - Current private handoff: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`.
   - Ask Claude Code to review the active Document Processing page/context plus Victor-provided Figma screens and recommend 3-5 visuals, the best hero/composition, one annotatable UI detail, any needed workflow diagram, screens to avoid, captions, and redaction/cropping/blur guidance.
   - Do not rewrite the page, add raw screenshots, change nav/homepage/sitemap visibility, or alter the password-gated/noindex state during the audit.

5. **Design-system hardening**
   - Add or clarify reusable tokens/classes only as needed: radius, motion, screen frames, artifact cards, stat cards, process strips, section notes, chips, chapter labels, masked image wrappers, and lens controls.
   - Keep visual output close to current pages at first.

### Later

1. **A2UI / Agent-to-User Interface showcase**
   - See Section 7.
   - Keep paused until Victor explicitly resumes it.

2. **Asset and photo inventory**
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

3. **Broader motion / parallax**
   - Only after the static structure and current homepage behavior feel grounded.
   - Keep it subtle, accessible, and progressive-enhancement first.

### Do not touch without explicit approval

- Document Processing promotion, raw screenshots, metrics, launch claims, or major copy/media changes. A media-audit plan is allowed only as a planning artifact when Victor asks.
- Password-gate/noindex behavior.
- Homepage/nav/sitemap promotion for paused or protected work.
- Full redesign, framework/build-step adoption, or site-wide visual-system rollout.
- A2UI page creation or homepage/nav promotion.

---

## 7. A2UI / Agent-to-User Interface future track

Added: 2026-05-21
Updated: 2026-05-30 — paused as a future track
Reference: `https://github.com/google/A2UI`

Google's A2UI project is useful because it names a future-facing portfolio opportunity: agents should not only answer in chat or generate arbitrary front-end code; they should be able to express UI intent through a safe, declarative format that the client renders with trusted components. The useful framing is “safe like data, expressive like code.”

This remains a future showcase track, not the active implementation phase. Treat it as a later case-study/prototype about designing the interface layer between humans and agents.

Current decision:

- Pause A2UI implementation while Victor does a deeper review of the current site enhancements.
- Do not create `a2ui.html` yet.
- Do not add homepage/nav promotion yet.
- Revisit only after the current system is clarified and Victor's review notes are incorporated.

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

---

## 8. Decision log / review questions

### Open review questions

1. Does “concept album + quiet stagehand” still feel right, or should it be softened into “curated sequence + subtle navigation”?
2. Should the homepage actually look like a tracklist, or only borrow tracklist behaviors?
3. Are the shipped homepage labels and supporting copy grounded enough, or too theatrical?
4. Do the Work/Galleries nav changes make the site clearer on mobile and desktop?
5. Do Gallery cards feel correctly secondary/supporting, or do they still compete with the main case studies?
6. Do the IBM Cloud, Ability Experience, and SAL color-punctuation examples feel purposeful enough to keep?
7. Should the next branch be polish/review, image-dimension/performance hardening, tone/wording, Document Processing media-audit planning, design-system hardening, or A2UI spec/prototype?
8. Are the archived source notes useful to keep, or should they eventually be pruned after this direction is approved?

### Recommended next action

1. Victor reviews the current live site across desktop/mobile and Light/Dark.
2. Victor brings back enhancement/content notes, including wording that feels too cheesy, over-written, or theatrical.
3. The next branch is selected from those notes rather than continuing the roadmap automatically.
4. Resume A2UI only when Victor wants to make it the next explicit track.

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
   - `PORTFOLIO_STATUS.md`
   - Main value: current portfolio state, active repo path, access policy, protected-page guardrails.

The original direction notes have been archived under `archive/planning/`. Treat this brief as the unified active direction reference unless Victor revises it.
