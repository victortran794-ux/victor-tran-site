# Design system

Hand-edited prose layer that sits next to [design-system.json](design-system.json). The JSON holds tokens; this file holds the *why* — principles, voice, imagery direction, and anything that doesn't fit neatly in a token.

> Status: scaffold. Sections marked **TBD** are gaps surfaced from auditing the current site. Fill them in as you have a point of view.

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

---

## Voice & tone

First-person. Conversational. A dose of humor where it lands.

- **Positioning:** *"I've designed a bunch of things — today it's UIs and delightful experiences."* The past stays visible (illustration, magazine, brand, fraternity work all live on the same page); the present has a focus.
- **Headline register:** short, plain, sometimes wry. (*"I design cool things with sincerity."* / *"Do more good things."*)
- **Body register:** full sentences, low jargon, can stretch when the story needs it. The IBM and Star & Lamp paragraphs read as someone telling you about their work over coffee — not a press release.
- **Humor:** yes, where it doesn't undercut the work. The italic-on-hover serif, the "Tap to cycle" portrait toggle, the easter-egg DNA tab — that's the right wavelength.

---

## Color

Tokens live in [design-system.json → colors](design-system.json). The palette is intentionally small: two accents (`blue`, `pink`) plus a five-step neutral ramp.

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

**Line-height pairings** — currently 1.6 on body globally; display headlines use ad-hoc tighter values. **TBD** if line-height needs its own tokens (`--leading-tight / --leading-base / --leading-loose`) or if the current ad-hoc approach is fine.

---

## Spacing & layout

4px base scale, `--space-1` through `--space-20`. Page padding rebinds at breakpoints via `--page-x` so consumers don't write media queries. See [design-system.json → spacing](design-system.json).

**The system is good here** — this is the most mature part.

---

## Radii

Used: `0`, `4px`, `12px`, `999px (pill)`.

**Open question:** these are shown in the DNA panel but aren't actually CSS variables. Promote them to `--radius-sm`, `--radius-md`, `--radius-pill` so the DNA tab reads live values like it does for color and spacing.

---

## Motion

> **TBD.** Durations and easings live as magic numbers in CSS and `js/main.js` (cursor lag, reveal timing, theme fade, marquee speed). Pull them out into tokens — even three (`fast / base / slow` + a default easing) would be enough to start.

---

## Elevation

**Flat with hairlines. No shadows, ever.**

The system uses `--border` and small surface-color shifts (`--bg` → `--bg-2`) to imply hierarchy, never drop shadows. This is a stated principle, not a default. The site reads as editorial / print-adjacent — drop shadows would dilute that.

If a future component needs lift (dropdown, tooltip, popover), reach for: a thicker hairline, a `--bg-2` surface, or a contrasting outline. Not a shadow.

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

## Components (primitives)

The DNA panel hints at four primitives. They live as one-off styles in `css/style.css` rather than documented patterns:

- **Pill button** — `.dna-sample-btn--pill`
- **Ghost button** — `.dna-sample-btn--ghost`
- **Section label** — `.section-label.label-default` / `.label-design`
- **Tag / kicker** — small mono caps
- **Dot indicator** — `.hero-cycle-dot`

> **TBD** — if any of these get used across more than two pages, promote to documented patterns with token references.

---

## How this doc connects to the site

Today: hand-maintained, read by humans.

**Migration path** (proposed, not yet built):

1. **Phase 1** — add `scripts/build-tokens.mjs`. Reads `design-system.json`, writes the `:root` block in `css/style.css` between marker comments. Run on demand. *Optional, since CSS already mirrors the JSON.*
2. **Phase 2** — rewire the DNA panel in [index.html](../index.html) to fetch `design-system.json` and render cards from data, instead of hardcoding font lists, radii samples, and component swatches in HTML. This is where the "edit one file, everything updates" promise pays off.
3. **Phase 3** — fill in the **TBD** sections above as design intent solidifies. Each one becomes a token group in the JSON and a paragraph here.

The order matters: don't rewire JS until the JSON shape is stable, and don't lock the JSON shape until you've answered the TBD questions for at least color, type scale, and motion. Otherwise you'll be migrating twice.
