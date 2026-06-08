# Portfolio Agent Workflows

Created: 2026-06-02
Status: Active workflow reference for Hermes, Claude Code, Codex, and future Figma MCP work

This file is the repo-local source of truth for how agent-assisted portfolio work should run. It is intentionally stored in the active website repo so the workflow survives changes in chat context, iCloud sync state, and Claude Code subscription status.

## Authority note

This file is authoritative for agent roles, permissions, guardrails, prompts, handoffs, and closeout process. It is not authoritative for current portfolio status, master repo health/publishing rules, creative direction, or design tokens.

Consult next:

- `PORTFOLIO_SYSTEM.md` for repo structure, publishing, health checks, and maintenance rules.
- `PORTFOLIO_DASHBOARD.md` for current status, active plan, and next actions.
- `PORTFOLIO_DIRECTION_BRIEF.md` for creative/product direction and enhancement intent.
- `content/design-system.md` and `content/design-system.json` for design system rules.

## Source-of-truth file model

- Active website source of truth: `C:\Users\Victor\Documents\Websites\victor-tran-site`
- Temporary transfer/drop folder only: `C:\Users\Victor\iCloudDrive\Downloads`
- PC-side private reference area for portfolio handoffs: `C:\Users\Victor\Documents\Website Items`
- iCloud-side archive/reference/recovery area: `C:\Users\Victor\iCloudDrive\Documents\Website Items`

Important portfolio prompts, workflow rules, case-study planning, and reusable implementation notes belong in this repo or the PC-side private reference area. iCloud Downloads can be used to pass files between devices or tools, but it should not become the durable home for current portfolio direction. Treat iCloud Drive as useful for reference and cross-device transfer, not as a guaranteed up-to-date PC source of truth.

## Agent roles

### Hermes

Hermes is the coordinator, reviewer, verifier, and guardrail keeper.

Hermes should:

- inspect repo state before handing off work;
- write constrained prompts for Claude Code or Codex;
- keep Document Processing, password gates, noindex, nav, sitemap, and confidentiality rules explicit;
- review diffs before commits or pushes;
- run local verification;
- update durable repo docs when a workflow or checkpoint changes.

### Claude Code through 2026-06-15

Claude Code is the preferred first-pass implementer while Victor's subscription is active.

Best use before the subscription ends:

- read-only audits that produce ranked, branch-sized options;
- narrow implementation slices on public, low-risk pages;
- component or design-system cleanup using existing site patterns;
- accessibility/performance hygiene;
- case-study media planning when Figma/source material is explicitly approved.

Claude Code should not be asked to do broad redesigns, speculative A2UI implementation, protected-page promotion, or uncontrolled screenshot/media dumps.

### Codex after 2026-06-15

After the Claude Code subscription ends, Codex becomes the primary code executor through Hermes.

The same workflow applies:

1. Hermes writes a bounded prompt.
2. Codex implements or audits one narrow slice.
3. Hermes reviews the diff, verifies guardrails, and runs checks.
4. Victor reviews mobile, Light, and Dark for visual changes before merge.

Claude Code prompts in this file should be reusable as Codex prompts with only the executor name changed.

### Figma MCP

Figma MCP setup is deferred until a specific screen or Figma file is selected.

Use it only when:

- the target Figma file/screen is known;
- Victor provides the required Figma access path, token, link, exported frame, or desktop/plugin readiness;
- the task is framed as extraction, audit, or selective media planning, not an open-ended design rewrite.

## Project package model

Treat each portfolio project as a contained package, even when the implementation still uses flat static-site files. The package is the conceptual unit that should survive a future redesign.

Default package pieces:

- Live/source page: root `*.html` file, such as `document-processing.html`.
- Generated/search export: `content/<slug>.md` and `content/site-index.json`, regenerated from HTML when page copy changes.
- Durable package manifest: `case-studies/<slug>.md`, used for status, visibility, claims, media guidance, redesign notes, and agent guardrails.
- Assets: current site assets in `images/` or another approved repo asset path. If a project gets many project-specific assets later, prefer a clear slugged asset grouping.
- Archives: superseded drafts, retired handoffs, and frozen snapshots under `archive/`.

The package manifest should make redesign handoff easy. At minimum it should track:

- project identity: title, slug, current URL/page, category, and visibility;
- current implementation: HTML file, generated export, known assets, special CSS/JS patterns;
- narrative: thesis, strongest hiring signal, audience takeaway, and what not to overclaim;
- media: approved visuals, possible visuals, source locations, and avoid/redact/blur guidance;
- claims/facts: confirmed facts, open questions, allowed metrics, and unverified claims;
- redesign notes: what must survive, what can be rethought, component needs, and future layout ideas;
- agent boundaries: what agents may do and what requires Victor approval.

Document Processing is a normal live project package with private visitor access. It is listed in guardrails only because protected media, claims, and visibility are easy for agents to accidentally change. A2UI is different: it is currently a dormant/future-track package, not an active case study or implementation priority.

## Default portfolio workflow

1. Start from clean repo context.
   - Check branch, git status, and current checkpoint docs.
   - Do not assume iCloud copies are current.

2. Read current repo guidance.
   - `AGENTS.md`
   - `CLAUDE.md`
   - `PORTFOLIO_DASHBOARD.md`
   - `PORTFOLIO_DIRECTION_BRIEF.md`
   - relevant `case-studies/*.md`
   - latest relevant `archive/planning/portfolio-enhancement-state-YYYY-MM-DD.md`

3. Pick one narrow task.
   - Audit-only first if the next slice is unclear.
   - Implementation only after the scope is selected.

4. Keep implementation branch-sized.
   - Prefer public pages first.
   - Use existing tokens, components, images, and page patterns.
   - Regenerate `content/*.md` and `content/site-index.json` only when HTML copy changed.

5. Verify before presenting as ready.
   - `git diff --check`
   - `./scripts/preflight.sh`
   - `node --check js/main.js` when JS changed
   - targeted scans for protected-page/noindex/nav/sitemap guardrails when relevant

6. Stop for review when subjective or visual.
   - Victor reviews mobile, Light, and Dark before merge.
   - Hermes can commit/push/open PR only after approval.

## Guardrails that must appear in handoffs

- Preserve password gates and noindex decisions.
- Respect each project package's status, visibility, media rights, claims, and redesign notes from its package manifest.
- Document Processing is live and intentionally password-protected/noindex. Treat the password gate as the visitor-privacy layer, not as an unresolved launch blocker. Do not change its current navigation/sitemap/homepage visibility, screenshots, metrics, launch claims, or major copy/media without approval.
- A2UI is a dormant future-track package. Do not resume, promote, or implement it unless Victor explicitly selects it.
- Avoid broad redesigns and vague “make it cooler” work.
- Be strict with decorative em dash/en dash usage in public copy. Prefer periods, commas, colons, parentheses, or rewrites unless a dash is genuinely necessary.
- Leave changes uncommitted unless Victor has explicitly approved commit/push/PR for that slice.

## Reusable Claude Code/Codex audit prompt

Use this when the next task is unclear or when Victor wants options first.

```text
You are working in Victor's active portfolio repo.

Windows path:
C:\Users\Victor\Documents\Websites\victor-tran-site

WSL path:
/mnt/c/Users/Victor/Documents/Websites/victor-tran-site

Task: read-only portfolio enhancement audit. Do not edit files, commit, push, install packages, export assets, or change generated content.

Start by reading:
- AGENTS.md
- CLAUDE.md
- PORTFOLIO_DASHBOARD.md
- PORTFOLIO_DIRECTION_BRIEF.md
- PORTFOLIO_AGENT_WORKFLOWS.md
- the latest relevant archive/planning/portfolio-enhancement-state-YYYY-MM-DD.md

Goal:
Return 5-8 ranked, branch-sized enhancements that require no new designs and use the existing visual system.

Prioritize:
1. public wording/tone cleanup
2. homepage/nav refinement
3. public accessibility or performance hygiene
4. project-page consistency cleanup
5. reusable workflow/checkpoint documentation

Guardrails:
- Do not propose broad redesigns.
- Do not add new public pages.
- Do not resume A2UI unless explicitly selected by Victor.
- Preserve password gates, noindex, sitemap decisions, and confidentiality protections.
- Treat each portfolio project as a package whose status, visibility, media rights, claims, and redesign notes live in `case-studies/<slug>.md` when available.
- Document Processing is live, intentionally password-protected for visitors, noindex, currently linked from the Work dropdown, and omitted from sitemap. Do not propose homepage/sitemap promotion, raw screenshots, metrics, launch claims, or major copy/media changes without explicit approval.
- Avoid protected/confidential pages for the first implementation slice.
- Be strict with decorative em dash/en dash usage. Flag copy that reads agent-written because of dash rhythm.

Deliverable:
For each option include:
- what would change
- why it helps
- likely files involved
- risk level
- whether Victor must review mobile/Light/Dark
- recommended first implementation slice

Return a concise ranked list only. Do not make edits.
```

## Reusable implementation prompt

Use this only after Victor/Hermes selects one slice.

```text
Implement only this selected slice:
[PASTE SELECTED SLICE]

Repo:
/mnt/c/Users/Victor/Documents/Websites/victor-tran-site

Rules:
- Create a fresh branch from current main.
- Keep changes narrow and reversible.
- Use existing components, tokens, assets, and page patterns.
- Do not touch protected/confidential visibility.
- Respect each selected project's package manifest in `case-studies/<slug>.md` when one exists.
- Do not add Document Processing homepage/sitemap promotion, raw screenshots, metrics, launch claims, or major copy/media changes.
- Do not resume A2UI implementation.
- Be strict with decorative em dash/en dash usage in public copy.
- Regenerate content exports only if HTML copy changed.
- Run `git diff --check` and `./scripts/preflight.sh`.
- Leave changes uncommitted unless explicitly told to commit.

At the end, summarize:
- branch name
- files changed
- exact user-visible changes
- verification results
- what Victor should review on mobile, Light, and Dark
```

## Document Processing project-page media-audit workflow

Use this when Victor selects Document Processing media planning or later enables Figma MCP for specific screens. The name refers to Victor's protected IBM portfolio project page, not a generic document-processing automation workflow or Life OS document-management task. The `case-studies/` notes file is part of the shared project-package workflow for all future portfolio pages.

Current planning status:

- Document Processing remains live as a protected portfolio project page, password-gated, noindex, currently linked from the Work dropdown, and omitted from sitemap.
- The current private Figma/media handoff is:
  `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`
- That handoff may be used as source material, but important outcomes should be consolidated back into the repo.

Audit-only prompt shape:

```text
Task: Document Processing project-page Figma/media audit only. Do not edit repo files, export a screenshot dump, rewrite the page, commit, push, or change password-gate/noindex/homepage/nav/sitemap visibility. Do not treat "Document Processing" as a generic automation or document-management workflow; apply the same scoping rules used for other portfolio project pages.

Read:
- PORTFOLIO_DASHBOARD.md
- PORTFOLIO_DIRECTION_BRIEF.md
- PORTFOLIO_AGENT_WORKFLOWS.md
- case-studies/document-processing.md
- the consolidated private handoff at C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md, if available

Use only Victor-approved Figma screens, exported frames, links, or MCP-accessible files.

Goal:
Recommend a selective 3-5 visual set for the protected Document Processing portfolio page.

Include:
- best hero/composition candidate
- one annotatable UI detail
- one evaluation/results-oriented visual if source material supports it
- any needed workflow or architecture diagram
- screens to avoid or redact
- captions
- cropping, blur, redaction, and confidentiality guidance

Focus the story on the evaluation/trust loop: test set, ground truth, evaluation, metrics, schema improvement, rerun.

Return a markdown media plan only.
```

## Closeout checklist

Before ending a work session:

- state current branch;
- state whether working tree is clean or list modified files;
- state whether changes are committed, pushed, PR'd, merged, or still local;
- report verification results;
- stop or report any local preview/background servers;
- identify the next narrow slice instead of reopening the whole roadmap.
