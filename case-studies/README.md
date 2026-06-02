# case-studies/

This folder holds durable planning/source notes for portfolio case studies.

These files may be written by Vic, Magi, Claude Code, or another assistant, but they should be treated as intentional project context rather than generated site exports.

## Current pattern

Use one Markdown file per case study/project package by default:

```txt
case-studies/<project-slug>.md
```

Only split into multiple files if a project genuinely becomes too large to manage in one file. The package manifest should be stable enough that a future redesign can understand the project without hunting through chat logs, iCloud transfers, or archived drafts.

## Package manifest shape

Use this shape when creating or normalizing a project package file:

- Project identity: title, slug, current URL/page, project type/category, and visibility.
- Current implementation: source HTML file, generated content export, known assets, and any special CSS/JS patterns.
- Narrative: thesis, strongest hiring signal, audience takeaway, and what not to overclaim.
- Media: approved visuals, possible visuals, source locations, and avoid/redact/blur guidance.
- Claims/facts: confirmed facts, open questions, allowed metrics, and unverified claims.
- Redesign notes: what must survive, what can be rethought, component needs, and future layout ideas.
- Agent boundaries: what agents may do and what requires Victor approval.

## What belongs here

- Case-study status and next steps
- Confirmed facts and open questions
- Draft narrative direction
- Media/screenshot guidance
- Visibility, claim, and redesign guardrails
- Implementation handoff notes that should not live in the final HTML

## What does not belong here

- Generated Markdown exports from HTML — those live in `content/`
- Dormant or superseded drafts — those can move to `archive/`
- Live page implementation — those are the root `*.html` files

## Active files

- `document-processing.md` — live protected project package manifest for the Document Processing case study
