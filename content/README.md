# content/

This folder contains generated/exported site content used for indexing, search, and possible future generative UI experiments.

## Authority note

`content/*.md` and `content/site-index.json` are authoritative as the generated portfolio content export layer for indexing/search/future generative UI. They are not active planning docs, case-study handoffs, or current-status trackers. Most files here should be regenerated from HTML rather than hand-edited.

Design-system files live beside the generated content but have a separate role. Root `DESIGN.md` is the normative design intent and formal token contract; `css/style.css` is the executable runtime; `content/design-system.json` is the contract-checked structured mirror; and `content/design-system.md` is the subordinate compatibility companion.

Most files here are created from the static HTML pages by:

```bash
node scripts/html-to-md.mjs
```

## Protected-content export contract

`data/content-export-policy.json` is the authority for generated-content privacy. In normal public mode:

- Existing policy-protected sources generate fixed, source-independent stubs in `content/`.
- Protected route records are omitted from `content/site-index.json`.
- Missing provisional sources, including the reserved wxO Canvas entry, generate nothing.

For explicit local verification only, the generator can preserve complete extracted output in an ignored private mirror:

```bash
npm run generate:private-content
node scripts/check-protected-content-exports.mjs --private
```

`.private-content/` is excluded by both `.gitignore` and `.vercelignore`. Normal preflight never generates private exports. The private mirror is not an access-control system and must not be committed or deployed.

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
