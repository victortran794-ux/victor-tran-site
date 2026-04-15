# victor-tran-site

Victor Tran's portfolio site. Plain HTML / CSS / JS — no framework, no build step. Edit files directly and reload the browser.

## Hosting & deployment

- **GitHub:** [victortran794-ux/victor-tran-site](https://github.com/victortran794-ux/victor-tran-site) (public)
- **Hosting:** Vercel — auto-deploys on push to `main`
- **Live URL:** `victor-tran-site-2vxf.vercel.app`
- **Config:** `vercel.json` (static site, clean URLs)
- **Stack:** HTML5, CSS3, JavaScript — no framework, no build step

## Layout

```
victor-tran-site/
├── index.html           Home (hero + marquee + featured projects)
├── about.html           About page
├── pikappapp.html       Case study — Pi Kapp App (mobile app design)
├── ibmcloud.html        Case study — IBM Cloud Observability
├── pci.html             Case study — Performance Contracting Group
├── abilityexperience.html  Case study — The Ability Experience
├── salmagazine.html     Case study — Star & Lamp magazine
├── graphicgallery.html  Gallery — branding, illustration, slides
├── artillustration.html Gallery — illustrations
├── css/style.css        All styles (large file — grep for selectors, don't read whole)
├── js/main.js           Cursor, scroll reveal, dark mode, hero color wash, marquee
└── images/              All assets, named by page prefix (gg-*, ibm-*, pci-*, etc.)
```

## Conventions

- Every page reuses the same `<nav>`, `.cursor-dot`/`.cursor-ring`, and `<footer>` blocks. Copy from any existing page when scaffolding a new one.
- Case studies use `<header class="page-header">` + `<article class="case-study">` with section headings inside.
- Image components: `.case-study-full-img` (single full-bleed) and `.case-study-images.wide` (2-up grid).
- Galleries use `.gallery-section` + `.gallery-section-title` + `.gallery-grid`.
- Section labels above titles use `<p class="section-label label-default">` (or `label-design`).
- Featured items on the home page use `<a class="featured-item reveal">` with `.featured-item-img` + `.featured-item-content`.

## Hero (home page only)

The home page hero is a full-viewport image with a cursor-reactive color wash on top:

- `.hero-bg` — background `<img>` with `object-fit: cover`
- `.hero-wash` — radial gradient overlay using CSS vars `--mx`, `--my`, `--hue`
- The handler in `js/main.js` updates those vars on `mousemove` (rAF-throttled). Touch devices fall back to scroll position.
- Dark mode swaps the wash blend mode from `multiply` to `screen`.

## Theming

- Dark mode toggled via `data-theme="dark"` on `<html>`, persisted in `localStorage` under `theme`.
- The toggle button is `.theme-toggle` in the nav. All theming uses CSS custom properties — search `style.css` for `--bg`, `--text`, `--border`, etc.

## Spacing tokens

CSS custom properties in `:root` manage spacing globally:

- **Primitives:** `--space-1` (4px) through `--space-20` (80px), 4px base scale.
- **Semantic aliases:** `--page-x` (horizontal page padding) and `--section-y` (vertical section padding).
- `--page-x` rebinds at breakpoints: 48px (desktop) → 24px (≤900px) → 20px (≤600px). No need to override horizontal padding per-selector in media queries.
- `--section-y` stays at 80px across all breakpoints.

## Fonts

All pages load Google Fonts via `<link>` tags with preconnect (not `@import`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&family=Barlow:wght@400;600;700&family=Source+Code+Pro:wght@400;500&display=swap">
```

## Accessibility

- `:focus-visible` outlines (pink) for keyboard navigation. The site uses `cursor: none` so mouse focus rings are suppressed.

## Interactions (js/main.js)

- Custom cursor (dot + lagged ring) — expands on hover of `a, button, .project-card, .featured-item, .explore-btn`
- `IntersectionObserver` scroll reveal on `.reveal` elements (adds `.revealed` class)
- Nav compacts on scroll (`.nav--scrolled` toggle past 60px)
- Magnetic 3D tilt on `.project-card` and `.featured-item`
- Marquee track auto-doubles its content for seamless loop
- Hero title is split into `.char` spans and animated in on load

## Asset sources

- **Hero photo:** `~/Documents/Design Work/Website/Profile/Profile_Duo_v2.png` → converted to `images/hero-vic.jpg` (JPG 85%)
- **Thumbnails:** `~/Documents/Design Work/Website/2025/Thumbnails/` → converted to `images/thumb-*.jpg` (JPG 85%, except SGLA which stays PNG)

## PCI case study — confidential content

The handbook in `pci.html` shows real client work (PCG Principles of Business Conduct). Body copy in the spreads is **intentionally blurred** to protect HR/legal content. Headlines, photography, signatures, and design system stay crisp. Don't "fix" the blur — it's deliberate. Source PDFs live at `~/Documents/Design Work/PCI/`. The render+blur scripts are gone but easy to recreate with `pymupdf` + `PIL.ImageFilter.GaussianBlur`.

## Figma API gotcha

When pulling assets from Figma:
- `/v1/images/:file_id?ids=...` is **rate-limited** (429s within minutes)
- `/v1/files/:file_id/images` returns **pre-signed S3 URLs for every imageRef in the file** with no rate limit — much better
- Pattern: walk the file tree (`/v1/files/:id?depth=N`) → collect `imageRef` from `RECTANGLE`/`FRAME` fills → look up S3 URL → download

## Optional next steps

- **Custom domain** — add via Vercel dashboard → DNS records in Squarespace
- **Analytics** — enable Vercel Analytics for visitor tracking
- **SEO** — add meta tags and structured data to each page
- **Performance** — monitor with Vercel Speed Insights

## Image review safety (Claude Code)

When reviewing source images in Claude Code conversations:

- **Never read more than 3 images into a single conversation.** The API has a 2000px dimension limit per image when many images are in context, and once an oversized image enters the history, the conversation is permanently frozen.
- **Resize before reading.** If a source PNG/JPG might exceed 2000px, create a preview first:
  ```bash
  sips -Z 1800 "path/to/large.png" --out "/tmp/preview.png"
  ```
  Then read the resized copy.
- **Prefer listing files by name/size** (`ls -lhS`) and letting Victor pick, rather than opening images speculatively.
- **If the conversation freezes** with the "dimension limit" error, it cannot recover — export context and start a new session.

## Token-saving tips for future sessions

- `css/style.css` is huge. Use `Grep` for the selector you need instead of `Read`-ing the whole file.
- Prefer `Edit` over `Write` for existing files — Write resends the full file.
- Open one task per session if possible. Smaller scope = smaller context = cheaper.
- The case study HTML files are mostly static — Claude rarely needs to read more than one at a time.
