# archive/

This folder holds dormant experiments, old handoffs, and retired source files that may be useful later but are not part of the active site workflow.

## What belongs here

- Dormant experiments, such as `a2ui/`
- Old playground files, such as `playground.html` and `playground.css`
- Superseded case-study handoffs or drafts kept for history
- Frozen page snapshots under `pages/` when retiring, redesigning, or pausing live HTML pages

## What does not belong here

- Active case-study planning/source notes — use `case-studies/*.md`
- Generated site exports — use `content/`
- Live site pages/assets — keep those in the normal site root, `css/`, `js/`, and `images/`

## Page archives

Use `archive/pages/` for page capsules that preserve a retired page's HTML, readable content, and referenced local assets.

From the repo root:

```bash
node scripts/archive-page.mjs ibmcloud.html "Archived before redesign"
```

See `archive/pages/README.md` for the full convention.

## Current notes

- `a2ui/` is archived/dormant. Restore or rewire it before re-enabling Ask Vic / generative UI behavior.
- `doc-pro-case-study-handoff.md` is historical. The project is now referred to as Document Processing.
- The active Document Processing planning file is `case-studies/document-processing.md`.
