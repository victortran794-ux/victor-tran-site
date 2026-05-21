# Portfolio Design System — Phase A Implementation Spec

Date: 2026-05-21
Author: Claude Code (planning pass only, no code changed)
Status: Awaiting Victor approval before any Phase B implementation
Planning location: `archive/planning/` per `PORTFOLIO_SYSTEM.md` (dormant/historical planning lives here)

---

## 1. Summary

**Smallest safe first implementation slice:**
Fix the undefined `--radius-lg` token (it is referenced in two places in `css/style.css` but never defined — see §3), add `--radius-xl` for screen frames, and introduce the `.screen-frame` component class with its core variants. Pair this with matching documentation updates to `content/design-system.json` and `content/design-system.md`. Nothing else changes in Phase B/first slice.

**What is explicitly deferred and why:**

| Concept | Deferred because |
|---|---|
| Lens switcher (DNA, Wildcolor) | Requires `data-lens` attribute strategy, JS refactor of existing theme toggle, DNA overlay planning, and a clear "what DNA reveals" answer. Higher JS risk. |
| Lens switcher (Light/Dark only prototype) | Current `data-theme` pattern already covers this. Worth prototyping, but not needed before screen frames. |
| Scroll motion / parallax | Needs its own dedicated spec and pilot page. Risk of scroll hijack or reduced-motion failures if rushed. |
| A2UI showcase | Separate track entirely. No implementation until base system is stable. Spec separately. |
| Homepage tracklist redesign | Separate spec — Phase 1 per `PORTFOLIO_DIRECTION_BRIEF.md`. |
| Now-playing chip | Separate component spec — Phase 2 per brief. |
| Artifact card, decision card, process strip | Already proposed. Phase B candidate after screen frames prove out. |

---

## 2. Lens Switcher

### Recommended initial mode set

**Light/Dark/DNA** — prototype all three states; ship Wildcolor only after the core three feel controlled.

Justification: Light and Dark already exist via `data-theme`. DNA is the most distinctive new idea and has a clear design rationale (the homepage already has a DNA panel as proof of concept). Including DNA in the first prototype makes the lens switcher feel meaningfully different from a standard dark-mode toggle. Adding all three as CSS-only state hooks is low risk; the complexity is in designing DNA mode content.

### Wildcolor

Defer. Wildcolor requires deciding which accent values to amplify, how it interacts with protected case-study pages, and whether it breaks legibility on any existing surface. It is opt-in and expressive — better to add it when the core modes are stable.

### Token strategy

```css
/* data-lens on <html>, separate from data-theme */
[data-lens="dna"]       { ... }   /* DNA inspection styles */
[data-lens="wildcolor"] { ... }   /* Deferred */
```

Light and Dark modes map to the existing `data-theme="light"` / `data-theme="dark"` pattern. The lens switcher and theme toggle should ultimately share state — implement `data-lens` as the unified attribute and deprecate the raw `data-theme` toggle, or have the lens switcher set both.

Preferred approach: keep `data-theme` for backwards-compat and set `data-lens` alongside it. The lens switcher sets `data-lens` on `<html>`; a small JS shim keeps `data-theme` in sync for existing CSS rules.

### No-JS fallback

Default to Light mode. All content is fully readable. The lens switcher control is hidden if JavaScript is unavailable (use `<script>`-injected class or `<noscript>` CSS rule). No content is hidden behind lens states.

```css
/* No-JS: always show readable default */
@media (scripting: none) {
  .lens-switcher { display: none; }
}
```

### localStorage persistence

**Yes, persist.** Use key `lens` (separate from the existing `theme` key, to avoid breaking existing users mid-migration). Persist `light`, `dark`, or `dna`. Do not persist `wildcolor` until that mode ships.

On first visit: respect `prefers-color-scheme`; do not auto-open DNA or Wildcolor.

### DNA mode behavior sketch

DNA mode exposes the design system in-situ. Proposed reveal layers:

- Token annotations: CSS custom property names float near their visible effects (radius tokens near rounded corners, type tokens near headings).
- Component labels: `.dna-label` overlays appear on `.stat-card`, `.callout-card`, `.screen-frame` etc., showing class name and token usage.
- Color system: surfaces briefly show their token name (`--bg-2`, `--orange`, etc.).
- Process metadata: case-study sections can show `.dna-annotation` elements (hidden in other modes) with notes like "why this decision was made" or "component: callout-card".
- The existing Design DNA panel on `index.html` becomes a micro-version of this idea, already present as proof of concept.

Implementation note: DNA overlays are zero-content fallback — all annotations are `aria-hidden="true"` and are purely decorative/informational. They do not affect document structure.

---

## 3. UI Screen Frame Pattern

### `.screen-frame` base

```css
.screen-frame {
  --frame-accent: var(--border);   /* override per-project */
  --frame-radius: var(--radius-lg); /* from new token */
  border: 2px solid var(--frame-accent);
  border-radius: var(--frame-radius);
  overflow: hidden;
  background: var(--bg-2);
  position: relative;
}
```

The `--frame-accent` variable is overridden at the page or case-study level using a project accent variable (e.g. `--project-accent: var(--blue)` on `.case-study[data-project-theme="ibm"]`). This means screen frames automatically inherit project color without hardcoded per-page rules.

### Proposed variants

| Variant | Class modifier | Use |
|---|---|---|
| Single screen | `.screen-frame` (base) | One UI screenshot, full-width or constrained |
| Side-by-side pair | `.screen-frame--pair` | Before/after, two states, desktop+mobile |
| Flow stack | `.screen-frame--flow` | 3–4 sequential screens in a vertical or slight-offset stack |
| Annotated | `.screen-frame--annotated` | Has a `.screen-frame-caption` below or a `.screen-frame-topbar` above |
| Placeholder | `.screen-frame--placeholder` | Empty frame for protected/unreleased work |

### Accent-color behavior

Project-level accent is set via a CSS variable on the case-study root element:

```css
/* Set once per page near the top of the <style> or body attribute */
.case-study[data-project="ibm"]        { --project-accent: var(--blue); }
.case-study[data-project="pikappapp"]  { --project-accent: var(--purple); }
.case-study[data-project="salmagazine"]{ --project-accent: var(--orange); }
```

`.screen-frame` reads `var(--project-accent, var(--border))` for its border. No per-frame color hardcoding.

### Caption / top-bar rules

- **Show a caption** when the screen needs a label that is not obvious from the surrounding copy (e.g. "Evaluation run — field-level results").
- **Show a top-bar** only for mobile UI screens where the device chrome adds realism and the extra height is worth it. Skip for web product screens.
- **Omit both** by default. Extra framing should earn its place.

`.screen-frame-caption` lives outside the frame, below it, as a `<figcaption>` equivalent. It uses `.section-label` / `--text-caption` styling.

### Protected/confidential variants

All use the same `.screen-frame` wrapper. The distinction is in the inner content treatment:

| State | Class | CSS behavior |
|---|---|---|
| Blurred | `.screen-frame--blur` | `filter: blur(8px)` on inner `<img>` |
| Cropped | `.screen-frame--crop` | `overflow: hidden` + `object-position` to show safe portion |
| Redacted | `.screen-frame--redacted` | Inner text/field replaced with `.redaction` spans (solid `--bg-2` bars) |
| Placeholder | `.screen-frame--placeholder` | Frame with aspect-ratio set, dashed `--border`, no image, optional label |

Blurred and placeholder variants are the safest — they imply work without risking data exposure. Cropped/redacted require more care to ensure no sensitive content remains visible.

---

## 4. Radius System

### Current state

Four tokens exist in `:root` and are documented in `design-system.json`:

| Token | Value |
|---|---|
| `--radius-0` | `0` |
| `--radius-sm` | `4px` |
| `--radius-md` | `12px` |
| `--radius-pill` | `999px` |

**Bug found:** `--radius-lg` is used in `css/style.css` at two locations (`.tetris-embed` ~line 1759, `.spotify-frame` ~line 1997) but is **not defined** in `:root`. Both elements currently render with no border-radius (the undefined variable resolves to `initial` / `0`). This is a silent visual regression.

### Proposed tokens to add

| Token | Value | Use |
|---|---|---|
| `--radius-lg` | `20px` | UI screen frames, larger image masks, the Tetris/Spotify frames already using it |
| `--radius-xl` | `32px` | Reserved — future extra-large frame moments (optional, low priority) |

**What should NOT get rounded:**
- Page sections and full-bleed containers
- Nav and footer bars
- `.case-study-full-img` full-bleed images
- Table/grid layouts
- `.section-label` text labels
- Quote/callout borders (those use a left-border, not a box)

Rounding should remain a finishing move, not a baseline. The flat editorial voice stays flat.

### Mapping to existing selectors

Once `--radius-lg` is defined, the two existing CSS references (Tetris embed, Spotify frame) get their intended radius immediately with zero additional markup changes. Beyond that, Phase B mapping:

| Component | Token |
|---|---|
| `.stat-card` | `--radius-sm` (images already use this; cards could adopt it) |
| `.callout-card` | `--radius-0` (keep flat — left-border callout look) |
| `.screen-frame` | `--radius-lg` |
| Chips / tags / `.chip` | `--radius-pill` |
| `.lens-switcher` controls | `--radius-pill` |
| `.artifact-card` (future) | `--radius-md` |

---

## 5. Motion / Parallax

### Allowed effects (approved for Phase B)

| Effect | How |
|---|---|
| Fade-up reveal | Existing `.reveal` / `.revealed` pattern — keep as-is, extend with variants |
| Masked image reveal | `overflow: hidden` wrapper + `clip-path` or `transform` on inner element triggered by IntersectionObserver |
| Subtle vertical parallax | rAF-throttled `scrollY` → `translateY` on one hero-tier element per section |
| Sticky chapter label | `position: sticky` on section labels in long case studies |
| Scroll progress indicator | `scaleX` progress bar tied to `scrollY` / `document.body.scrollHeight` |

### Implementation primitives

- `IntersectionObserver` for reveals (already in place — extend, don't replace)
- `requestAnimationFrame`-throttled scroll listener for parallax (already used for nav — reuse pattern)
- `transform` and `opacity` only — never animate `height`, `margin`, `top`, `width`

### New motion tokens to add (with `--radius-lg` in Phase B)

```css
--parallax-distance-sm: 20px;  /* subtle hero art shift */
--parallax-distance-md: 40px;  /* slightly more expressive */
--reveal-distance: 20px;       /* existing .reveal translateY — extract to token */
```

### Reduced-motion behavior (per effect)

| Effect | `prefers-reduced-motion: reduce` |
|---|---|
| Fade-up reveal | Opacity still transitions, but `transform: none` (no vertical movement) |
| Masked reveal | Show full image immediately, no clip animation |
| Parallax | Disable entirely — element stays static |
| Sticky label | Keep (it's layout, not animation) |
| Scroll progress | Keep (no motion, just width update) |

The existing CSS already handles `.reveal` under `prefers-reduced-motion` at the bottom of `style.css` — extend that block rather than adding a new one.

### Mobile behavior (per effect)

| Effect | Mobile (≤600px) |
|---|---|
| Parallax | Disable entirely — mobile scroll performance is fragile and parallax adds no value on small viewports |
| Masked reveal | Simplify to fade-in only |
| Fade-up | Halve the translate distance |
| Sticky label | Keep, but test that it doesn't interfere with nav height |

### Hard limits

- Maximum 1–2 active parallax layers per viewport at any time.
- No parallax on text-heavy sections; only on hero art or one featured visual element per case-study section.
- No smooth-scroll library. Native `scroll-behavior: smooth` is acceptable on anchor navigation only.

---

## 6. A2UI Showcase Track

### Recommended deliverable for first pass

**Case-study spec** (written document), not a static prototype yet.

Write a short planning doc in `case-studies/a2ui-showcase.md` that defines the concept, pipeline, and component inventory. Build a static prototype only after the base design system (screen frames, radius tokens, lens switcher) is stable and Victor has approved the spec direction.

### Pipeline definition

```
markdown/product brief
  → agent generates A2UI-style JSON (declarative UI intent)
    → trusted component catalog (reuses portfolio system: screen-frame, stat-card, callout-card, chip, etc.)
      → rendered UI (static HTML/CSS prototype)
        → DNA view (lens switcher in DNA mode exposes schema, states, source, warnings)
```

### Human-control states to design

- **Approval** — "Ready to ship" confirmation with explicit action
- **Edit** — inline correction of agent-proposed content
- **Warning/risk** — flagged agent assumption or low-confidence extraction
- **Source/evidence** — shows the grounding data behind an agent recommendation
- **Undo/recovery** — reversible action state with clear rollback affordance
- **Completion** — success state with summary and next step

### Explicit honesty framing

This is a **portfolio exploration of agent-to-user interface design principles**, not a production Google A2UI implementation. The showcase will clearly label itself as A2UI-inspired rather than A2UI-compliant. If an actual Google A2UI integration is built later, update the framing then.

### Phase B relationship

**Confirmed deferred.** A2UI is not part of the first implementation slice. It becomes a case study spec (`case-studies/a2ui-showcase.md`) written separately, after screen frames and radius tokens are stable. The lens switcher's DNA mode would serve as the natural viewing mechanism for the A2UI showcase's "under the hood" view when both exist.

---

## 7. Pilot Recommendation

**Recommended pilot: Pi Kapp App** (`pikappapp.html`)

Reasons:
1. **Public, no password gate** — safest possible page for visual experiments. No confidentiality risk.
2. **Mobile app UI** — screen frames are specifically designed for product UI screenshots; this page has the right content to validate them.
3. **Playful energy** — the personality match means a slightly more expressive radius or accent-color frame doesn't feel out of place.
4. **Not currently a high-maintenance page** — no active planned changes that would conflict with a design-system pilot.

Candidates weighed:

| Page | Pros | Cons |
|---|---|---|
| Pi Kapp App | Public, mobile UI content, playful | Narrative framing could be stronger |
| IBM Patterns | System maturity, good stat/callout content | Password-gated — riskier to change protected page |
| Ability Experience | Public, safe for visual experiments | Less product-UI content to frame |
| SAL Magazine | Public, editorial energy matches | Already has strong visual identity — frames may conflict |

If the goal shifts to validating stat-cards/callout-cards over screen-frames, IBM Patterns is the better choice — but only on a review branch with the password gate preserved.

---

## 8. Files That Would Change in Phase B (if approved)

| File | Change | Public-facing? |
|---|---|---|
| `css/style.css` | Add `--radius-lg: 20px` and `--radius-xl: 32px` to `:root`; add `.screen-frame` and variant classes; add parallax/motion tokens as CSS vars | Yes — but CSS-only additions, not visual regressions |
| `content/design-system.json` | Add `radius-lg` and `radius-xl` to the `radii.tokens` block | Docs only |
| `content/design-system.md` | Update §Radii to add new tokens and note the `--radius-lg` bug fix | Docs only |
| `pikappapp.html` | Pilot: wrap selected UI screenshots in `.screen-frame` | Yes — public page |

**Not changing in Phase B:**
- `index.html`, `ibmcloud.html`, `ibm-patterns.html`, `pci.html`, `about.html`, `document-processing.html`
- `js/main.js` (no JS changes in smallest slice — lens switcher is deferred)
- Any navigation, footer, or shared layout elements

---

## 9. Validation Plan

### Manual review pages (after Phase B)

- [ ] `index.html` — confirm no visual regression from CSS additions
- [ ] `about.html` — confirm no regression
- [ ] `pikappapp.html` — primary pilot; inspect screen frames in Light and Dark modes
- [ ] `artillustration.html` and `graphicgallery.html` — confirm no regression from any shared CSS changes
- [ ] Mobile viewport (≤600px) on pilot page
- [ ] `prefers-reduced-motion` — enable in OS/browser, reload, confirm no unexpected transforms
- [ ] No-JS — disable JavaScript, reload; confirm all content is visible and no layout breaks

### Commands

```bash
git diff --check
./scripts/preflight.sh
```

If `./scripts/preflight.sh` fails due to local tooling (e.g. missing `lychee`), report the exact failure output rather than claiming full verification. GitHub Actions health check is the authoritative link/Lighthouse check.

---

## 10. Risk / Rollback

| Concept | Risk | Rollback |
|---|---|---|
| `--radius-lg` token addition | **Low** — pure CSS variable addition, fixes existing bug | Revert the `:root` block change in `style.css` |
| `.screen-frame` classes | **Low** — additive CSS; no existing markup uses these classes | Remove the class block from `style.css` |
| `design-system.json` token additions | **Low** — docs only | Revert JSON changes |
| `pikappapp.html` pilot | **Low-medium** — public page but no confidential risk | Revert markup changes to `pikappapp.html` |
| Lens switcher (deferred) | **Medium** — JS + CSS + theme state; risk of flicker, localStorage conflicts, or dark-mode regression | Deferred for this reason |
| Parallax (deferred) | **Medium** — scroll performance, reduced-motion, mobile | Deferred for this reason |
| A2UI showcase (deferred) | **Low when deferred** — it's a new page/case-study, no live page risk | N/A |

All rollbacks on this static site are simple file reverts. There is no build step, compiled output, or dependency graph to unwind.

---

## 11. Open Questions for Victor

1. **`--radius-lg` value** — 20px is the recommendation for screen frames. Does this feel right, or should it be larger (24–28px) to match the "touchable, lens-like" aesthetic? (The Tetris and Spotify frames that already use it would change too.)

2. **Lens switcher scope** — Should the lens switcher *replace* the current Light/Dark toggle button, or sit alongside it? Replacing it is cleaner but requires removing the existing `.theme-toggle`. Alongside is safer but adds UI clutter.

3. **Pilot page** — Pi Kapp App is the recommendation. IBM Patterns is the alternative if design-system maturity (stat-cards, callouts) is more important to validate than screen frames. Which matters more right now?

4. **Screen frame accent color source** — Should each page declare `--project-accent` manually (one CSS variable per case study), or should the frame default to `--blue` / `--border` and only get a custom color when explicitly set? The manual approach is more expressive; the default fallback is safer.

5. **DNA mode depth** — Is DNA mode primarily a "reveal design tokens in-situ" experience, or a "reveal why design decisions were made" experience? These require different content investments: tokens are mostly automatic; design rationale requires hand-written `.dna-annotation` copy per section.
