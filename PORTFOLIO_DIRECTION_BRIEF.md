# Portfolio Direction Brief — Concept Album + Studio System

Created: 2026-05-19
Status: Draft for Victor review
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
- Existing navigation, footer, theme, cursor, reveal, and case-study patterns unless a specific change is approved.
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

---

## Practical direction

This should be implemented in small, reviewable layers. Do not start by hunting for every possible photo. Start by tightening the system and choosing one pilot.

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

### Phase 3 — Design-system hardening

Goal: make the current system easier to extend before adding theatrical features.

Low-risk implementation candidates from the repo plan:

- Add missing CSS variables for radii, motion, easing, and line-height.
- Mirror tokens in `content/design-system.json` if that remains part of the system.
- Add reusable classes for:
  - callout cards
  - artifact cards
  - stat cards
  - decision cards
  - process strips
  - section notes
  - chips
- Keep visual output close to current pages at first.

Recommended validation:

- Check homepage, About, one case study, and both gallery pages.
- Run `./scripts/preflight.sh` before any PR.
- Use a review branch, not direct edits to `main`.

Output:

- A safer component vocabulary that supports the concept-album direction.

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

### Phase 5 — Asset and photo inventory

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

## Suggested first concrete sprint

Do not start with broad implementation. Start with a planning + tiny prototype sprint.

Sprint goal:

Turn the concept into one safe, reviewable website direction without disrupting the live site.

Tasks:

1. Approve or revise this brief.
2. Treat this repo-root file as the active source of truth unless Victor decides otherwise.
3. Keep the old scattered plans in `archive/planning/` as superseded source notes.
4. Write a homepage tracklist spec.
5. Write a now-playing chip spec.
6. Choose one pilot project.
7. Inventory only the assets needed for that pilot.
8. Then create an implementation branch if Victor approves.

---

## Decisions needed from Victor

1. Does “concept album + quiet stagehand” still feel right, or should it be softened into “curated sequence + subtle navigation”?

2. Should the homepage actually look like a tracklist, or only borrow tracklist behaviors?

3. What should be the first pilot project?
   - IBM Patterns: system/process pilot.
   - Pi Kapp App: playful/personality pilot.
   - Ability Experience or SAL Magazine: public/safe visual pilot.

4. Should the About page become more Playbill/liner-notes inspired?
   - Safe: polish current About.
   - Spicy: personal dashboard / Playbill / liner notes.

5. Are the archived source notes useful to keep, or should they eventually be pruned after this direction is approved?

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

Recommended next action:

Review this brief, then choose one:

1. “Direction approved — write the homepage tracklist spec.”
2. “Direction approved — write the now-playing chip spec.”
3. “Revise the brief before deeper planning.”
4. “Pause portfolio concept work for now.”
