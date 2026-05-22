# Portfolio Design System — Phase C Color Punctuation Spec

Date: 2026-05-21
Status: Draft + tiny IBM Cloud pilot
Scope: planning plus a small public-page implementation slice

---

## 1. Goal

Bring more of the homepage's colored-box energy into deeper portfolio pages without turning the site into a loud or generic SaaS/product portfolio.

The intended effect is not "make everything colorful." It is:

- color as wayfinding;
- color as project identity;
- color as editorial rhythm;
- color as a small reward after long neutral reading sections.

The base site should remain flat, editorial, and mostly neutral. Color should appear as punctuation.

---

## 2. Current audit

### Homepage

The homepage already has the strongest color vocabulary:

- selected featured-project boxes use orange and purple surfaces;
- white text sits on the colored surfaces;
- paired accent marks use blue/pink as graphic punctuation;
- the effect makes the work feel sequenced and memorable.

This is the pattern to borrow from, not copy everywhere.

### IBM Cloud Observability

Current feel: credible, mature, and systems-heavy, but long neutral stretches can flatten the emotional pacing.

Good candidates:

- use IBM blue as a frame/accent around product UI screenshots;
- convert one existing system-insight paragraph into a colored editorial note;
- keep the rest of the page neutral so the enterprise work still feels serious.

Phase C pilot started here because IBM Cloud is public and has several UI/product screenshots.

### Pi Kapp App

Current feel: already benefits from screen frames and playful energy.

Good candidates:

- keep purple screen-frame accents;
- later, consider one gold/deep-blue brand note if the page needs more rhythm;
- avoid adding color to wireframes and process artifacts that are intentionally quieter.

### Star & Lamp

Current feel: already image-rich and colorful through magazine spreads.

Good candidates:

- colored issue/year chips;
- one archival note or awards block with a muted orange/purple surface;
- avoid over-framing spreads, because the magazine imagery is already the color.

Phase C follow-up implemented one orange archive note beneath the issue cover wall, keeping the magazine spreads themselves unframed so the existing publication imagery remains the main color source.

### Ability Experience

Current feel: public and safe, but simpler/shorter than other case studies.

Good candidates:

- a color-backed anniversary note;
- subtle project-accent chips around iconography/cycling kit sections;
- potentially use color to separate print/iconography/cycling kit artifacts.

Phase C follow-up implemented one purple anniversary note on this public case study to test whether the color-punctuation pattern helps shorter pages without adding visual noise.

### About and galleries

Current feel: should remain personal and browseable.

Good candidates:

- small chips/category labels;
- not full colored panels unless a section needs a strong editorial beat.

---

## 3. Reusable color patterns

### Pattern A — Color punctuation card

A single colored editorial block used for an existing insight, key tension, or system note.

Recommended class:

```html
<aside class="color-punct-card color-punct-card--orange reveal">
  <span class="section-label">System note</span>
  <p>Existing insight paragraph goes here.</p>
</aside>
```

Rules:

- One per long case-study section cluster, not every section.
- Use existing copy where possible; do not invent claims just to fill a card.
- Use orange or purple surfaces first because the homepage already validates those as colored-box surfaces.
- Keep body copy short.
- Do not place long paragraphs, lists, or dense legal/client details inside colored cards.

### Pattern B — Screen frame accent

Use `.screen-frame` around polished product/UI screenshots. Accent color should reinforce the project or system identity.

Rules:

- UI/product screens can be framed.
- Process artifacts, wireframes, print spreads, and artwork usually should not be framed.
- IBM Cloud can use `var(--blue)` as frame accent.
- Pi Kapp can keep `var(--purple)`.
- Protected pages need separate approval before rollout.

### Pattern C — Metadata/chapter chips

A later pattern for project categories, track labels, or chapter markers.

Rules:

- Use chips sparingly.
- Do not make every metadata item colorful.
- Consider this when the homepage tracklist / now-playing chip work starts.

---

## 4. Contrast and lens behavior

- Orange and purple surfaces use white readable text, matching the homepage colored boxes.
- Blue and pink are safer as accents/borders/glyphs unless contrast is explicitly checked.
- Colored blocks should look intentional in both Light and Dark lenses.
- The color cards should not depend on JavaScript.
- Persistent DNA/Wildcolor modes remain separate future work.

---

## 5. Tiny Phase C pilots implemented

Public page: `ibmcloud.html`

Implemented:

1. Added `.color-punct-card` CSS with orange/purple variants.
2. Converted the existing IBM Cloud sentence "Design systems work happens in the details..." into one orange color-punctuation card.
3. Wrapped two IBM Cloud UI screenshot pairs in `.screen-frame screen-frame--pair` with `--frame-accent: var(--blue)`.
4. Added short screen-frame captions to make the new framing intentional.

This gives the page:

- one homepage-like colored editorial beat;
- clearer UI screenshot presentation;
- an IBM-blue accent without painting large sections blue;
- a visible test of the system on a public, non-protected case study.

Public page: `abilityexperience.html`

Implemented:

1. Converted the existing 40th-anniversary tribute sentence into one purple `color-punct-card` labeled “Anniversary note.”
2. Kept the existing factual claims and supporting paragraph intact outside the card.
3. Avoided additional chips or broad accent treatments so this remains a one-card public-page rollout.

This gives the page:

- one stronger editorial beat near the central anniversary artwork;
- a test of the color-punctuation pattern on a shorter public case study;
- no protected-page or confidential-work changes.

Public page: `salmagazine.html`

Implemented:

1. Converted the existing archive/links note beneath the issue covers into one orange `color-punct-card` labeled “Archive note.”
2. Kept the external Issuu and pikapp.org links intact.
3. Avoided screen frames or broad spread treatments because the magazine imagery already carries the page color.

This gives the page:

- one editorial beat between the issue cover wall and featured spreads;
- a public-page test of color punctuation on image-rich publication work;
- no protected-page or confidential-work changes.

---

## 6. What remains deferred

- Protected-page use on IBM Patterns, PCI, or Document Processing.
- Persistent DNA mode.
- Wildcolor.
- Scroll motion / parallax.
- A2UI showcase.
- Homepage tracklist / now-playing chip.

---

## 7. Review checklist

Manual review:

- IBM Cloud in Light mode.
- IBM Cloud in Dark mode.
- IBM Cloud mobile width.
- Homepage, to confirm existing colored boxes were not affected.
- Pi Kapp App, to confirm previous screen-frame pilot still looks right.

Commands:

```bash
git diff --check
./scripts/preflight.sh
```

If the IBM Cloud pilot feels right, the next safe rollout target is either:

1. Ability Experience — one anniversary color card; or
2. SAL Magazine — awards/archive note color treatment.
