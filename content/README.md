# content/

This folder contains generated/exported site content used for indexing, search, and possible future generative UI experiments.

Most files here are created from the static HTML pages by:

```bash
node scripts/html-to-md.mjs
```

## What belongs here

- Markdown exports generated from live/static site pages, such as `index.md`, `about.md`, and project pages.
- `site-index.json`, generated from the same source pages.
- `profile.md`, the one hand-maintained exception for professional/background context.

## What does not belong here

Do not use this folder for durable planning notes, case-study drafts, or implementation handoffs.

Use these instead:

- `case-studies/*.md` — planning/source notes for case studies
- `PORTFOLIO_DASHBOARD.md` — overall portfolio status
- `PORTFOLIO_SYSTEM.md` — workflow and automation notes
- `archive/` — dormant experiments or retired systems

## Editing rule

The HTML files are the source of truth for public portfolio content. If generated Markdown looks wrong, update the HTML or `scripts/html-to-md.mjs`, then regenerate.

Do not hand-edit generated Markdown files unless you are intentionally changing the generation system.
