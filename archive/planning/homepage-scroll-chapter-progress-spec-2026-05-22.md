# Homepage Scroll Chapter Progress Spec

Date: 2026-05-22
Status: planning spec
Scope: homepage-only behavior design for the existing tracklist intro and now-playing chip

## Goal

Decide how far the homepage should go from a static “curated sequence” cue toward a scroll-aware chapter-progress interaction.

The intent is not to make the homepage feel like an app dashboard. The interaction should feel like a quiet stagehand: helpful, subtle, and easy to ignore.

## Current foundation

Public page: `index.html`

Already implemented:

1. A `featured-intro` block above the work grid.
2. A static `now-playing-chip` that reads `Now viewing · Systems at scale · 01/03`.
3. A three-row `featured-tracklist`:
   - `01` Systems at scale
   - `02` Brand and publication worlds
   - `03` Illustration and visual experiments
4. Existing homepage motion already includes:
   - reveal-on-scroll via `.reveal` and `IntersectionObserver`;
   - nav compacting on scroll using a requestAnimationFrame-throttled listener;
   - magnetic featured cards disabled for reduced-motion users.

## Recommended direction

Use a static-first, progressive-enhancement model:

1. Keep the existing static chip as the no-JavaScript and reduced-motion baseline.
2. Add semantic chapter metadata to project cards in HTML.
3. Use a small `IntersectionObserver` only on the homepage to update the chip and active tracklist row as project cards enter the viewport.
4. Avoid sticky positioning for the first behavior pilot.

This gives a sense of progression without adding a persistent floating component.

## Chapter mapping

Recommended initial mapping:

### 01 — Systems at scale

Cards:

- IBM Cloud Observability
- IBM Patterns: Contact Us

Rationale: product systems, enterprise UX, design education, and process-heavy work.

### 02 — Brand and publication worlds

Cards:

- Performance Contracting Group
- The Ability Experience
- Star & Lamp
- Pi Kapp App

Rationale: brand systems, print/publication, identity, and product concept work with organizational context.

### 03 — Illustration and visual experiments

Cards:

- Art & Illustration
- Graphic Gallery

Rationale: expressive visual work and gallery-style browsing.

## Proposed HTML changes

Add data attributes to the featured cards only:

```html
<a href="ibmcloud.html" class="featured-item featured-item--wide reveal" data-chapter="01" data-chapter-title="Systems at scale">
```

Repeat for each featured card with the mapping above.

Update tracklist rows so the active row can be styled/accessed:

```html
<ol class="featured-tracklist" aria-label="Portfolio sequence">
  <li data-chapter="01" aria-current="true"><span>01</span> Systems at scale</li>
  <li data-chapter="02"><span>02</span> Brand and publication worlds</li>
  <li data-chapter="03"><span>03</span> Illustration and visual experiments</li>
</ol>
```

Update the chip to use addressable spans:

```html
<p class="now-playing-chip" aria-live="polite">
  <span>Now viewing</span>
  <b data-now-playing-title>Systems at scale</b>
  <strong data-now-playing-count>01/03</strong>
</p>
```

## Proposed CSS changes

Add one active-row style only; do not redesign the whole tracklist.

```css
.featured-tracklist li.is-active {
  color: var(--text);
}

.featured-tracklist li.is-active span {
  color: var(--pink);
}

.now-playing-chip b {
  color: var(--text);
  font-weight: 500;
}
```

Optional later, if the active state is too subtle:

```css
.featured-tracklist li.is-active {
  border-top-color: color-mix(in srgb, var(--pink) 45%, var(--border));
}
```

## Proposed JavaScript behavior

Add a small homepage-only module near the existing interaction code in `js/main.js`.

Behavior:

1. Find `.featured`.
2. Find cards with `[data-chapter]`.
3. Find chip title/count nodes.
4. Observe cards with an `IntersectionObserver`.
5. When a card crosses the activation threshold, update:
   - chip title;
   - chip count;
   - tracklist active row;
   - `aria-current` on active tracklist row.
6. Do not run if required nodes are missing.
7. Do not animate anything for this first pass.

Suggested implementation shape:

```js
// ── Homepage chapter progress ─────────────────────
(function () {
  const featured = document.querySelector('.featured');
  if (!featured) return;

  const cards = Array.from(featured.querySelectorAll('.featured-item[data-chapter]'));
  const titleNode = featured.querySelector('[data-now-playing-title]');
  const countNode = featured.querySelector('[data-now-playing-count]');
  const trackRows = Array.from(featured.querySelectorAll('.featured-tracklist [data-chapter]'));
  if (!cards.length || !titleNode || !countNode || !trackRows.length) return;

  const chapters = new Map(trackRows.map(row => [row.dataset.chapter, row]));

  function setActiveChapter(chapter, title) {
    titleNode.textContent = title;
    countNode.textContent = `${chapter}/03`;

    trackRows.forEach(row => {
      const active = row.dataset.chapter === chapter;
      row.classList.toggle('is-active', active);
      if (active) {
        row.setAttribute('aria-current', 'true');
      } else {
        row.removeAttribute('aria-current');
      }
    });
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const card = visible.target;
    setActiveChapter(card.dataset.chapter, card.dataset.chapterTitle);
  }, {
    threshold: [0.35, 0.55],
    rootMargin: '-20% 0px -35% 0px'
  });

  cards.forEach(card => observer.observe(card));
})();
```

Note: The `chapters` map is optional unless we later need direct lookup beyond row iteration.

## Accessibility and reduced-motion guardrails

- The static chip must remain meaningful if JavaScript fails.
- `aria-live="polite"` is acceptable because the chip updates text, but this should be tested manually. If it feels noisy with screen readers, remove live updates and keep `aria-current` only.
- Do not use smooth scroll, parallax, sticky pinning, or transform-heavy behavior in the first implementation.
- Existing `prefersReducedMotion` should continue to disable motion-heavy effects. This proposed behavior updates text/state only, so it can still run under reduced motion unless user testing suggests otherwise.

## Implementation tasks

### Task 1: Add semantic chapter metadata

Files:

- Modify: `index.html`

Steps:

1. Add `data-chapter` and `data-chapter-title` to each featured card.
2. Add `data-chapter` to each tracklist row.
3. Add `aria-current="true"` to the first tracklist row.
4. Add `aria-live="polite"`, `data-now-playing-title`, and `data-now-playing-count` to the chip.
5. Run `node scripts/html-to-md.mjs`.

Verification:

- Homepage still loads locally.
- Generated `content/index.md` still reads naturally enough for search/indexing.

### Task 2: Add minimal active-state styles

Files:

- Modify: `css/style.css`

Steps:

1. Add `.featured-tracklist li.is-active` style.
2. Add `.now-playing-chip b` style.
3. Do not add animation or sticky positioning.

Verification:

- Active row is visible in Light and Dark without becoming louder than the project cards.
- Mobile tracklist remains readable.

### Task 3: Add homepage-only observer behavior

Files:

- Modify: `js/main.js`

Steps:

1. Add a self-contained `Homepage chapter progress` IIFE after the marquee or reveal logic.
2. Guard for missing `.featured`, data attributes, chip nodes, and tracklist rows.
3. Use `IntersectionObserver`, not scroll polling.
4. Update only text, count, `.is-active`, and `aria-current`.

Verification:

- Scrolling through the homepage updates from `01/03` to `02/03` to `03/03`.
- No console errors on non-homepage pages.
- If JavaScript is disabled, the static chip still shows `Systems at scale · 01/03`.

### Task 4: Run checks and review

Commands:

```bash
git diff --check
./scripts/preflight.sh
```

Manual review:

- Homepage Light mode.
- Homepage Dark mode.
- Mobile width.
- Scroll slowly through the work grid and confirm updates feel subtle.
- Visit at least one non-homepage case study and confirm no console/runtime breakage.

## Defer

- Sticky/fixed now-playing chip.
- Animated progress bar.
- Per-card mini chapter labels.
- URL hash changes.
- Deep linking to chapters.
- A2UI showcase/state components.

## Recommendation

Proceed with the implementation only if the team wants the chip to be functional rather than purely editorial. The safest next implementation is non-sticky, IntersectionObserver-based chapter updates on the homepage only.
