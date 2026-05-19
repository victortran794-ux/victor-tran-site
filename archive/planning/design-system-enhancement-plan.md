# Archived Source Note — Design System Enhancement Plan

Status: Archived / superseded.

This file is a historical implementation/source note. The active direction is now `../../PORTFOLIO_DIRECTION_BRIEF.md`. Pull implementation details from here only when they still support that active brief.

---

# Design System Enhancement Plan

Working plan for making `victor-tran-site` feel more robust, more designed, and more specifically Vic.

Created: 2026-05-13

## Current read

The system already has a real foundation:

- Static HTML/CSS/JS, no framework or build step.
- Core tokens in `css/style.css` and mirrored in `content/design-system.json`.
- Prose/design intent in `content/design-system.md`.
- Strong existing point of view: editorial, print-adjacent, flat with hairlines, no shadows, personal work only, conversational voice.
- Home page has the most expressive system artifact: the Design DNA overlay.

The opportunity is not “redesign everything.” The opportunity is to turn the existing taste into a more complete visual language and reuse it across case studies, galleries, and about.

## North star

**A portfolio system that feels like a designer’s studio wall: structured enough to navigate, weird enough to remember.**

Keywords:

- editorial
- sincere
- slightly irreverent
- systems-minded
- print-aware
- artifact-heavy
- colorful but disciplined
- not SaaS-clean
- not generic UX portfolio

## Design principles to sharpen

1. **The work is the hero, but the framing has a voice.**
   Case studies should feel intentionally art-directed, not just text/image stacks.

2. **Use color as indexing, not decoration.**
   Accent colors should help distinguish work modes: product/system, brand/print, illustration/art, personal/play.

3. **Make process visible as artifacts.**
   Timelines, decision cards, stat blocks, sketches, callouts, and “what changed” panels should become reusable case-study primitives.

4. **Stay flat, but add materiality.**
   No shadows. Use hairlines, surface shifts, overprints, stamps, torn-edge-ish framing, crop marks, mono labels, and paper/editorial references.

5. **One wink per section.**
   The site can be charming, but not every component needs to tap dance.

## Main gaps found

### Token gaps

- Radii are documented but not CSS variables.
- Motion values are magic numbers across CSS and JS.
- Line-height has no token layer.
- Component tokens/patterns are implied, not formalized.
- Imagery ratios/treatments are partially documented but not encoded.

### Component gaps

Reusable primitives to add:

- `case-study-callout` — for thesis / design tension / “why this mattered.”
- `artifact-card` — image/text card for process artifacts, sketches, diagrams, prototypes.
- `stat-grid` / `stat-card` — currently custom in IBM Patterns only.
- `decision-grid` / `decision-card` — currently custom in Document Processing only.
- `quote-block` / `hmw-block` — currently custom-ish in IBM Patterns.
- `process-strip` — compact sequence like classify → extract → review → evaluate → improve.
- `project-index-chip` — reusable label/category pills.
- `section-note` — small mono editorial note for caveats/confidentiality/process context.

### Page/section opportunities

#### Home

- Already strongest.
- Make featured cards use a richer project taxonomy: Product Systems / Brand Worlds / Illustration / Play.
- Add optional small “studio notes” metadata to featured cards: role, year, medium.
- Consider adding a compact “Methods / Modes” section between hero and work, using colorful editorial labels instead of generic service cards.

#### Case studies

- Biggest opportunity.
- Current pages share header/meta/lede/article structure, but project-specific components are scattered.
- Add reusable blocks so each case study can become more designed without inventing one-off CSS every time.
- Use accent themes per project/category to create more visual rhythm while keeping the base system consistent.

#### Galleries

- Masonry is clean but a little passive.
- Add optional gallery section captions/intros and “contact sheet” controls/treatments.
- Replace inline section-label spacing with a reusable class.
- Consider one featured/art-directed opener per gallery before the masonry field.

#### About

- Has personality, but could be more “Vic.”
- Convert “Right now I am...” into a more designed living dashboard/card grid.
- Add a “working style” or “design beliefs” section using the system’s manifesto voice.
- Tags can become real tokenized chip components.

#### Design DNA overlay

- Strong idea, currently home-only and partly hardcoded.
- Make it more accurate/live:
  - radii from CSS vars
  - motion card
  - component samples from reusable classes
  - project/category accent examples
- Later: render from `content/design-system.json` once token shape stabilizes.

## Recommended aesthetic direction

**Editorial studio system with playful process artifacts.**

Not brutalist, not luxury, not generic product portfolio. More like:

- magazine masthead energy from Star & Lamp
- IBM system discipline
- illustration/play from the art gallery
- weird little DNA/easter-egg moments from the homepage

Visual moves to explore:

- oversized serif section titles with tiny mono annotations
- hairline bento grids
- crop-mark corners / registration marks as decorative structure
- colored overprint panels using current orange/purple/blue/pink
- “field note” callouts with mono labels
- process strips that read like diagrams
- cards that feel like pinned artifacts, but without shadows
- deliberate asymmetry in case-study sections

## Execution phases

### Phase 1 — System hardening, low visual risk

Goal: make the design system more robust without changing the site’s look dramatically.

Tasks:

1. Add missing CSS tokens:
   - `--radius-0`, `--radius-sm`, `--radius-md`, `--radius-pill`
   - `--duration-fast`, `--duration-base`, `--duration-slow`, `--duration-reveal`
   - `--ease-out`, `--ease-snap`, `--ease-soft`
   - `--leading-tight`, `--leading-title`, `--leading-body`, `--leading-loose`
2. Mirror those additions in `content/design-system.json`.
3. Update `content/design-system.md` to close the TBDs for radii, motion, and line-height.
4. Replace obvious hardcoded CSS values where safe.
5. Add a reusable gallery label class to remove inline styles in `artillustration.html`.

Validation:

- Run `./scripts/preflight.sh`.
- Inspect homepage, about, one case study, and both gallery pages.

### Phase 2 — Component vocabulary

Goal: create reusable design primitives for stronger sections.

Add CSS components:

- `.callout-card`
- `.artifact-grid` / `.artifact-card`
- `.stat-grid` / `.stat-card`
- `.decision-grid` / `.decision-card`
- `.process-strip`
- `.note-label` / `.section-note`
- `.chip-list` / `.chip`

Then migrate existing one-offs:

- Document Processing decision cards → `.decision-grid`.
- IBM Patterns stats → `.stat-grid`.
- IBM Patterns HMW quote → `.callout-card` or `.quote-block`.
- About tags → `.chip` or alias current `.tag` to shared chip styles.

Validation:

- Keep current pages visually close at first.
- No large copy changes yet.
- Run preflight.

### Phase 3 — Art-direct the case-study system

Goal: make case studies feel like designed stories, not uniform essays.

Enhancements:

1. Add per-project theme hooks:
   - `data-project-theme="product"`
   - `data-project-theme="brand"`
   - `data-project-theme="art"`
   - `data-project-theme="play"`
2. Use `--project-accent`, `--project-surface`, `--project-glyph` locally.
3. Add section rhythm variants:
   - normal text section
   - artifact section
   - decision section
   - outcome section
4. Add reusable confidential/safety note pattern for gated/protected projects.
5. Improve Document Processing once screenshot safety is confirmed:
   - replace placeholders with real hero/diagram/annotated UI
   - use process strip and decision cards

Validation:

- Start with one public/non-sensitive page as a pilot.
- I’d recommend IBM Patterns or Pi Kapp App before Document Processing, because Document Processing has confidentiality/publication caution.

### Phase 4 — Home/about/galleries polish

Goal: extend the system personality beyond case studies.

Home:

- Add richer metadata to featured project cards.
- Consider “Modes of work” section.
- Expand Design DNA with motion/component cards.

About:

- Rework “Right now I am...” as a sharper dashboard.
- Add “working beliefs” or “how I design” section.
- Make tags/chips feel intentional instead of default pills.

Galleries:

- Add reusable section intro/caption pattern.
- Add one art-directed opener per gallery.
- Tune lightbox labels/counts if needed.

### Phase 5 — Optional automation

Only after the system shape feels stable:

1. Add `scripts/build-tokens.mjs` to generate the CSS token block from `content/design-system.json`.
2. Rewire Design DNA overlay to read from JSON instead of hardcoded HTML.
3. Add a tiny local visual review checklist or screenshots if the site starts changing often.

## Suggested first sprint

Best next chunk:

1. Implement Phase 1 tokens.
2. Add the shared component classes from Phase 2 without migrating everything.
3. Pilot migration on IBM Patterns:
   - stats → shared stat cards
   - HMW → shared callout/quote
   - closing Team Rogue mark → remove inline styling
4. Run preflight.
5. Review locally before deciding wider rollout.

Why this first:

- Low confidentiality risk.
- Gives the design system real muscle quickly.
- Makes the existing DNA/design-system docs more truthful.
- Creates reusable parts before touching bigger storytelling/copy decisions.

## Decisions needed from Vic

1. Should the system stay with the current palette, or expand with one more “paper/yellow/green” supporting color?
   - Recommendation: keep current palette for now; add tints/surfaces before adding new hues.

2. Which project should be the pilot for more art-directed case-study treatment?
   - Recommendation: IBM Patterns for a product case-study pilot, Pi Kapp App for a playful prototype pilot.

3. How bold should About get?
   - Safe: polish existing sections.
   - Spicy: make it feel like a mini personal dashboard / studio wall.

## Guardrails

- Do not push without Vic approval.
- Do not expose confidential material.
- Preserve password gates.
- No AI-generated art.
- No drop shadows unless Vic explicitly overturns the flat-with-hairlines rule.
- Keep accessibility/contrast honest, especially colored surfaces.
