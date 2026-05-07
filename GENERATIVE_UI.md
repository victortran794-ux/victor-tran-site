# Generative UI System

This document describes the chatbot and generative UI layer for Victor Tran's portfolio site. Treat this as an add-on system around the existing static HTML/CSS/JS site, not a reason to rewrite the portfolio.

Current mode: curated/static portfolio guide. It does not call AI APIs, does not use API keys, and does not require a backend. Future mode may add an optional server-side AI endpoint.

## Source Of Truth

- The `.html` pages are the editable source of truth for public portfolio content.
- It is okay to edit `.html` pages when updating the portfolio.
- Most files in `content/*.md` are generated Markdown files for chatbot context. Do not hand-edit generated files unless explicitly asked.
- `content/profile.md` is hand-maintained professional background context and may be edited directly.
- If chatbot content is stale, update the relevant `.html` page and regenerate Markdown with:

```bash
node scripts/html-to-md.mjs
```

If the generated Markdown needs to be better, update `scripts/html-to-md.mjs` instead of manually patching the generated output.

## Planned File Ownership

- `scripts/html-to-md.mjs`: extracts clean Markdown and metadata from portfolio HTML pages.
- `content/`: Markdown knowledge files. Most are generated from HTML; `content/profile.md` is hand-maintained.
- `content/site-index.json`: generated structured index of portfolio pages.
- `a2ui/`: component catalog, system prompt, and curated example outputs.
- `api/`: future server-side model calls. API keys belong here only if AI mode is added later.
- `js/ask-vic.js`: lower-right curated guide launcher, panel, and prompt routing.
- `js/generative-renderers.js`: browser renderer for approved generated UI components.
- `css/ask-vic.css`: launcher and chat panel styling.
- `css/generative-ui.css`: generated response component styling.

## Boundaries

- Do not migrate the site to React, Next.js, or another framework just for this feature unless explicitly asked.
- Do not replace the existing navigation, footer, cursor, dark mode, or gallery behavior for this feature.
- Do not manually edit generated files in `content/` unless explicitly asked. `content/profile.md` is the exception.
- Do not call AI providers directly from browser JavaScript.
- Do not commit API keys or provider secrets.
- Do not render raw HTML returned by a model.
- Do not allow generated UI to execute scripts, inline event handlers, or arbitrary markup.

## Intended Architecture

```txt
Editable HTML pages
  -> scripts/html-to-md.mjs
  -> generated Markdown + site index
  -> server-side generation endpoint
  -> approved structured UI JSON
  -> browser renderer using known components
```

Markdown is the chatbot knowledge layer. A2UI or A2UI-inspired JSON is the rendering layer.

## Activation

Ask Vic activates on any page that includes these scripts after `js/main.js`:

```html
<script src="js/generative-renderers.js"></script>
<script src="js/ask-vic.js"></script>
```

`js/ask-vic.js` automatically loads `css/generative-ui.css` and `css/ask-vic.css`.

The guide currently uses local curated JSON files from `a2ui/examples/`. It must be viewed through a local server or deployed site because the browser fetches local JSON files.

## Design Direction

Generated UI should feel native to the portfolio and reuse the existing visual language:

- Barlow for body and UI text.
- DM Serif Display for expressive headings.
- Source Code Pro for labels and metadata.
- Existing CSS tokens such as `--bg`, `--bg-2`, `--text`, `--text-2`, `--border`, `--blue`, `--pink`, and `--purple`.
- Existing interaction tone: direct, polished, visual, and portfolio-specific.

Future generated UI should be constrained to approved components such as project grids, timelines, comparisons, galleries, recommended paths, and contact CTAs.
