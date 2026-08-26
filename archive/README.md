# archive/

This folder holds dormant experiments, old handoffs, and retired source files that may be useful later but are not part of the active site workflow.

## Archive routing rule

Move truly archived files to the designated archive area instead of leaving them mixed into active docs. Use `planning/` for historical planning notes, `website-health-reports/` for historical website health/audit reports, and `pages/` for retired page snapshots. Private handoffs, backups, and recovery material usually belong outside the public repo in PC-side `C:\Users\Victor\Documents\Portfolio` unless Victor approves adding them here. Check with Victor before moving ambiguous archive candidates.

## What belongs here

- Dormant experiments, such as `a2ui/`
- Old playground files, such as `playground.html` and `playground.css`
- Superseded case-study handoffs or drafts kept for history
- Superseded planning notes under `planning/`
- Historical website-ops reports under `website-health-reports/`
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

- `planning/` contains superseded portfolio direction, status, and backlog notes. Use `../PORTFOLIO_DASHBOARD.md` for current status/next actions and `../PORTFOLIO_DIRECTION_BRIEF.md` for active direction.
- `website-health-reports/` contains historical operations reports copied from iCloud for durability.
- `a2ui/` is archived/dormant. Restore or rewire it before re-enabling Ask Vic / generative UI behavior.
- `doc-pro-case-study-handoff.md` is historical. The project is now referred to as Document Processing.
- The active Document Processing planning file is `case-studies/document-processing.md`.
