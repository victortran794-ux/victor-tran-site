# Agent Guide

This site is Victor Tran's static portfolio. It is plain HTML, CSS, and JavaScript with no build step.

## Start Here

Before making meaningful changes, read:

- `victor-tran-site.md` for site structure, conventions, gotchas, and asset notes.
- `PORTFOLIO_SYSTEM.md` for source-of-truth rules and health automation.
- `PORTFOLIO_DASHBOARD.md` for current project status and next actions.
- `PORTFOLIO_AGENT_WORKFLOWS.md` for Claude Code, Codex, Figma MCP, and Hermes handoff rules.
- `PORTFOLIO_DESIGN_CRITIQUE_RUBRIC.md` for independent direction and rendered-design review.
- `MAGI_PC_MIGRATION_PLAN.md` for the PC-based Magi workflow.
- `archive/planning/portfolio-status-legacy-2026-05-18.md` only when historical status context is needed.
- `MAGI_ACCESS_POLICY.md` before inspecting iCloud, Discord, private config, or local machine folders.

## Source Of Truth

- Published site implementation: root `*.html`, `css/`, `js/`, `images/`.
- Generated/search exports: `content/*.md` and `content/site-index.json`.
- Hand-maintained profile context: `content/profile.md`.
- Active case-study planning: `case-studies/*.md`.
- Dormant or retired experiments: `archive/`.

Root HTML files are the source of truth for public portfolio content. Do not hand-edit generated Markdown exports unless the generation system itself is being changed.

## Workflow

1. Confirm confidentiality and visibility before touching client or unreleased work.
2. Edit the relevant HTML/CSS/JS/assets directly.
3. Run `node scripts/html-to-md.mjs` after changing page copy.
4. Run `./scripts/preflight.sh` before meaningful commits or pushes when local tooling supports it.
5. Use GitHub Actions health checks as the stronger deployment-health signal.

## Design Rules

- Preserve Victor's existing visual voice: editorial, polished, selective, and personal.
- Reuse existing navigation, footer, cursor, reveal, theme, and case-study patterns.
- Keep protected pages protected and confidential copy/images intentionally obscured.
- Preserve the current live PCI body-copy blur until a separately approved migration. Victor guarantees that future PCI Codex-package artifacts will contain no sensitive information, so an approved VicO2 migration may use those sanitized assets/copy without reproducing the legacy blur.
- Optimize images before adding them to the site.

## Case Study Intake

For new or revised case studies, keep durable planning in `case-studies/<slug>.md`. Track confirmed facts, risky claims, open questions, media needs, narrative direction, visibility, and implementation tasks there before editing the public page.

For a redesign batch, use exactly two selected pages and copy the private sprint template at `C:\Users\Victor\Documents\Website Items\Portfolio Sprints\TEMPLATE\SPRINT_BRIEF.md`. Close the direction gate before Hi-Fi implementation, keep unrelated findings deferred, and stop after the two pages are corrected, verified, documented, and closed.
