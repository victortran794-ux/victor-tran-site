# Design system

Detailed companion to the root [`DESIGN.md`](../DESIGN.md), which is the normative design intent and formal agent contract. `css/style.css` remains executable runtime, [design-system.json](design-system.json) is the contract-checked structured mirror, and governance docs own active gates and state. This detailed companion is not a second broad authority; it preserves Phase 1 compatibility prose while consumers are audited.

## Compatibility note

This hand-edited detailed companion retains rationale, voice, imagery direction, and implementation context temporarily. Where it differs from root `DESIGN.md`, the root contract governs shared semantics and safety boundaries.

---

## Principles

1. **Order in disorder, and always a little disorder in the madness.** The system has structure; the work it carries doesn't pretend to be sterile. Imperfection on purpose.
2. **Every part of the journey is a source.** Music, conversation, magazines, fraternity work, illustration practice — they all feed the design. The site shouldn't read like a UX person's portfolio. It should read like a designer who's lived a lot of lives.
3. **Tools yes, AI art no.** Use AI to speed work, unblock thinking, automate the boring. Don't use it to fake the act of making.
4. **Design on the everyperson's side.** The folk-hero version. The work should make ordinary tools more interesting and less hostile to the person using them — not more profitable for the people deploying them.
5. **No dark patterns. Ever.** If a UI tricks someone into a click they didn't want, it doesn't belong here.

## Anti-principles

What this site refuses to be:

- **No AI-generated artwork.** Tools assist; they don't author.
- **No dark patterns.** No timer panic, no opt-out gotchas, no fake urgency, no manufactured friction.
- **No "boring because it's email or PowerPoint."** Even the mundane formats deserve craft. Boo to the general-ole email.
- **No insider jargon for its own sake.** Write for the general-ole person — the smart non-specialist.
- **No utility-template sameness.** Repeated equal cards, default pill clusters, uniform dashboard grids, gratuitous rounded panels, and framework-demo spacing should not become the portfolio's visual voice. Utility tooling may support an isolated prototype, but the authored result must remain editorial, asymmetric, project-aware, and recognizably Victor's.

---

## Voice & tone

First-person. Conversational. A dose of humor where it lands.

- **Positioning:** *"I've designed a bunch of things — today it's UIs and delightful experiences."* The past stays visible (illustration, magazine, brand, fraternity work all live on the same page); the present has a focus.
- **Headline register:** short, plain, sometimes wry. (*"I design cool things with sincerity."* / *"Do more good things."*)
- **Body register:** full sentences, low jargon, can stretch when the story needs it. The IBM and Star & Lamp paragraphs read as someone telling you about their work over coffee — not a press release.
- **Name convention:** use **Victor Tran** whenever the full name appears. Use **Vic** when a first name appears alone. Never use **Vic Tran**.
- **Humor:** yes, where it doesn't undercut the work. The italic-on-hover serif, the "Tap to cycle" portrait toggle, the easter-egg DNA tab — that's the right wavelength.

---

## Color

Tokens live in [design-system.json → colors](design-system.json). The palette has four live accents (`blue`, `pink`, `purple`, and `orange`) plus semantic surface aliases and a five-step neutral ramp.

### Paired-token rule

The four accents form **two pairs** that work together as surface + glyph:

| Surface | Glyph | Text on surface | Applied to                              |
|---------|-------|-----------------|-----------------------------------------|
| Orange  | Blue  | White           | Star & Lamp featured card               |
| Purple  | Pink  | White           | Pi Kapp App featured card               |

The glyph color is reserved for **graphic punctuation only** — the section-label dot, the view-link arrow. It is never used for readable body text on its paired surface (contrast fails). Body and titles on colored surfaces are always white.

**The hero color wash** uses `--blue` and `--pink` as the radial gradient hues. If the palette ever grows, decide whether the wash should expand too.

### Dark-mode behavior

| Token              | Rebinds in dark? | Why                                                           |
|--------------------|------------------|---------------------------------------------------------------|
| `bg`, `bg-2`       | Yes              | Page surface inverts                                          |
| `text`, `text-2`   | Yes              | Foreground inverts                                            |
| `border`           | Yes              | Hairlines stay visible against new surface                    |
| `blue`, `pink`     | Yes              | Lifted slightly for visibility on dark page                   |
| `orange`, `purple` | **No — by design** | Surface accents are **theme-stable brand colors**. They sit between the light and dark page bg luminances and read cleanly in both. White text + paired glyph stays the same regardless of theme. |

---

## Typography

Three families, each with one job. See [design-system.json → typography](design-system.json).

| Family             | Job                              | Personality cue              |
|--------------------|----------------------------------|------------------------------|
| DM Serif Display   | Hero, big display moments        | Italic on hover = the wink   |
| Barlow             | Body, UI, navigation             | Workhorse, neutral           |
| Source Code Pro    | Section labels, kickers, meta    | Signals "this is a label"    |

### Type scale

Eight tokens, named by **purpose**, defined in `:root`:

| Token                 | Size                              | px (range) | Use                                                  |
|-----------------------|-----------------------------------|------------|------------------------------------------------------|
| `--text-caption`      | `0.6875rem`                       | 11         | Kickers, `.section-label`, mono caps                 |
| `--text-label`        | `0.8125rem`                       | 13         | UI — view-link, hero-cta, nav, footer, button labels |
| `--text-body`         | `0.9375rem`                       | 15         | Default body, card desc, paragraphs                  |
| `--text-lead`         | `1.0625rem`                       | 17         | Case-study lead paragraphs                           |
| `--text-subheading`   | `1.5rem`                          | 24         | H3-equivalent                                        |
| `--text-title`        | `clamp(1.5rem, 2.5vw, 2.25rem)`   | 24-36      | H2 / featured card titles — fluid                    |
| `--text-display`      | `clamp(2.75rem, 7vw, 5.5rem)`     | 44-88      | Hero H1, big section heads — fluid                   |
| `--text-hero`         | `clamp(7rem, 24vw, 26rem)`        | 112-416    | One-off: the "Visual / Designer" giant letters       |

The migration replaced 42 inline font-size values (most within 1-2px of each other, the smell of a system grown by nudging) with these 8 tokens. **Differences ≤2px disappeared by design** — they weren't perceptible anyway.

**Three literal `font-size` values stay outside the scale on purpose:**

- `html { font-size: 16px }` — sets the rem base; must be a literal length.
- `.marquee-item::after { font-size: 1.3em }` — em-relative for a pseudo-element dot, intentionally proportional to its container.
- `.hero-bigtype` mobile overrides — bespoke responsive `clamp()` bounds for the giant hero letters, different breakpoints need different `vw` scaling.

### Line-height

Line-height now has a small purpose-named scale:

| Token | Value | Use |
|-------|-------|-----|
| `--leading-tight` | `1` | Big display/header lockups |
| `--leading-title` | `1.1` | Section titles and case-study H2s |
| `--leading-body` | `1.6` | Default body rhythm |
| `--leading-loose` | `1.9` | Long-form portfolio/case-study prose |

The intent: titles stay crisp and editorial; prose gets enough air to feel readable without becoming a Medium essay.

---

## Spacing & layout

4px base scale, `--space-1` through `--space-20`. Page padding rebinds at breakpoints via `--page-x` so consumers don't write media queries. See [design-system.json → spacing](design-system.json).

**The system is good here** — this is the most mature part.

---

## Radii

The radius scale is intentionally restrained:

| Token | Value | Use |
|-------|-------|-----|
| `--radius-0` | `0` | Hard editorial edges |
| `--radius-sm` | `4px` | Images and small media cards |
| `--radius-md` | `12px` | Artifact cards, panels when softness is useful |
| `--radius-lg` | `20px` | UI screen frames (`.screen-frame`), larger image masks |
| `--radius-xl` | `32px` | Reserved — extra-large frame moments |
| `--radius-pill` | `999px` | Tags, chips, lens switcher controls |

The site should not become rounded SaaS soup. Most layout stays sharp; radius is a small finishing move, not the personality.

---

## Motion

Motion has a compact token set:

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | `0.2s` | Color and small state changes |
| `--duration-base` | `0.3s` | Gallery/image micro-interactions |
| `--duration-slow` | `0.45s` | Card transforms and larger state changes |
| `--duration-reveal` | `0.6s` | Scroll reveal / entrance opacity |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary expressive ease-out |
| `--ease-snap` | `cubic-bezier(0.2, 0, 0, 1)` | Crisp state changes that should feel immediate |
| `--ease-soft` | `cubic-bezier(0.23, 1, 0.32, 1)` | Softer gallery/image motion |

Principle: crisp, editorial motion. Save springy/bouncy behavior for project-specific prototypes like Pi Kapp App, where motion is part of the artifact.

---

## Elevation

**Flat and hairline-first. No generic SaaS elevation.**

The shared system uses `--border` and small surface-color shifts (`--bg` to `--bg-2`) to imply hierarchy. It does not define a global shadow scale. The site reads as editorial and print-adjacent, so generic soft elevation would dilute that.

If a future shared component needs lift, start with a thicker hairline, a `--bg-2` surface, or a contrasting outline. Rare print offsets or media-frame depth may remain as scoped project-native variants. They do not become global elevation tokens.

---

## Imagery direction

**Content rule:** every image on the site is Victor's personal work — art, UI, brand, illustration, print, photography of him. No stock, no client photos he didn't make, no AI-generated artwork (see anti-principles).

The treatments are intentionally varied because the *work* is varied. There's no single "look" the photos chase — a magazine spread, a UI screenshot, an oil-paint illustration, and a studio portrait don't share lighting or framing rules and shouldn't pretend to.

Where treatments *do* repeat across the site:

- **Hero portraits** — cutout figures with a lens overlay, rotated through four poses on click.
- **Featured thumbnails** — light/dark theme-paired pairs (`*-light.png` / `*-dark.png`) for IBM work where the screenshot has its own theme.
- **DNA preview** — wide 16:9 portrait that gets tinted by hovered swatches.

Those are the consistent moves. Everything else is in service of the work being shown.

---

## Iconography

> **TBD.** No real icon system yet. Inline glyphs (`◐`, `→`, `×`, `✦`) are doing the work. If the site grows beyond a portfolio, this becomes a real gap.

---

## Components and page anatomy

The live component system is deliberately small. A shared component must be proven across at least two real pages, or have a confirmed second-page need. One-off CSS and dormant selectors do not become system components merely because they have generic names.

### Live shared anatomy

- **Shared shell** — generated navigation, Work disclosure, Light/Dark controls, skip behavior, and footer contact hierarchy across the site.
- **Section label / mono kicker** — `.section-label` and project-native label variants used across nine production pages.
- **Editorial opener** — `.page-header`, `.page-header-title`, and `.page-header-desc`, used by the direct case-study family.
- **Project facts** — `.case-study-meta` / `.case-study-meta-item`, used by six project pages.
- **Project transition** — `.project-nav` / `.project-nav-item`, used across the primary case-study sequence.
- **Archive-field family** — the paired Art & Illustration / Graphic Design chapter and archive anatomy.
- **Workflow-story family** — the bounded wxO / Document Processing chapter and workflow anatomy.

The complete composition and adoption rules live in [`vico2-page-system.md`](vico2-page-system.md).

### Dormant or deferred candidates

The following names exist in CSS or prior candidate documentation but are not used by current production root pages:

- `gallery-section-label`;
- `stat-grid` / `stat-card`;
- `callout-card`;
- `screen-frame`;
- `color-punct-card`.

They are not current shared primitives. Keep them classified as dormant candidates until approved content demonstrates a real second use, or remove them during a future CSS hygiene pass. Do not invent page content merely to justify adoption.

Shared anatomy contracts still pending a real implementation need:

- artifact / process evidence;
- media figure with provenance and evidence state;
- accessible technical relationship diagram;
- protected-page gate anatomy beyond the existing route-specific implementation.

Shared evidence anatomy may eventually include media, a factual caption, provenance, evidence status, and a source boundary. When relevant, evidence status must distinguish original, sanitized, reconstructed, exploratory, and withheld material. Protected or unavailable evidence uses direct text and never relies on blur alone.

Project-native variants remain first-class system decisions rather than exceptions to erase:

- Art and Illustration keeps its artwork-first field, warm serif hierarchy, and caption-free artwork groupings.
- Graphic Design keeps its violet, pink, acid-yellow, and cream contact-sheet identity.
- Pi Kapp App keeps its deep blue, gold star, and white shield language.
- Star & Lamp and Ability Experience keep their editorial and identity-system story structures.
- IBM and other protected product stories keep project-specific structural language plus explicit provenance and privacy states.
- Home keeps its asymmetric archive cards and portrait-lens portal.

Every accepted anatomy contract must specify Light/Dark behavior, exact-mobile collapse, keyboard and focus behavior where interactive, reduced motion where animated, decoded-media expectations, and zero root horizontal overflow.

Known implementation gaps:

- Provenance, withheld, protected, and unavailable states do not yet have completed shared CSS or markup anatomy.
- The August 11 shared-token hygiene pass replaced the unresolved `--space-7`, `--tracking-label`, `--dur-med`, and `--text-small` references with the existing spacing, label, and motion scale. JSON still requires a separate completeness review before it can be described as a full mirror of live CSS.
- Iconography and expanded imagery treatments remain TBD.

---

## How this doc connects to the site

Today: hand-maintained, read by humans.

**Migration path** (reconciled, not yet authorized):

1. **Phase 1**: keep the existing home-page Design DNA overlay stable while the approved candidate set defines the system.
2. **Phase 2**: reconcile prose, token roles, shared anatomy, behavior contracts, and project-native variants without changing live CSS values.
3. **Phase 3**: approve the Launch Integration Contract and implement shared shell and case-study chrome once in a coordinated local worktree.
4. **Phase 4**: refresh the existing Design DNA overlay from the reconciled system after complete-site preview review.
5. **Optional later phase**: add `scripts/build-tokens.mjs` or data-driven overlay rendering only when the JSON schema and reader value are stable.

The order matters. Do not rewire the overlay, introduce broad Lens behavior, or generate CSS from JSON before the coordinated integration preview proves that the schema and shared-shell decisions are stable.
