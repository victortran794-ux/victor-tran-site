# Magi PC Migration Plan

Last updated: 2026-05-17

This note translates the old Mac/OpenClaw Magi setup into a practical PC-based workflow for Victor's portfolio upkeep and design work.

## Read This First

The old Mac does not need to host the agent. Treat this PC as the active work machine, GitHub as the source of truth for versioned site code, and iCloud as the place where design/source assets can continue to live.

The transferred site is a static portfolio. It can be previewed directly from `index.html` or through a local server. There is no framework install, build step, database, backend, or API key required for the current public site.

## Current State

- Transfer package is unpacked and usable as a static snapshot.
- Git metadata was intentionally excluded from the zip.
- Live repo listed in project docs: `victortran794-ux/victor-tran-site`.
- Hosting listed in project docs: Vercel, auto-deploying from `main`.
- Site health workflow already exists at `.github/workflows/health-check.yml`.
- Git is not currently available on this PC's PATH, so normal local clone/commit/push workflow still needs Git installed or added to PATH.
- `winget` is also not currently available on PATH, so installing Git may require the Git for Windows installer or another package manager.
- The live GitHub repo is newer than this transfer snapshot. The repo includes the About page Tetris/Spotify work from PR #26/#27, including `js/tetris.js`; this transfer snapshot does not.
- Local portfolio workflow docs already exist:
  - `CLAUDE.md`
  - `victor-tran-site.md`
  - `PORTFOLIO_SYSTEM.md`
  - `PORTFOLIO_DASHBOARD.md`
  - `PORTFOLIO_STATUS.md`

## Recommended Architecture

```text
PC / Codex workspace
  -> edits, previews, local checks

GitHub repo
  -> source of truth, history, pull requests, health checks

Vercel
  -> production deployment from main

iCloud Drive
  -> design archives, source files, exported assets, reference material

Magi / Codex / Hermes-style agent
  -> operates through repo docs, GitHub context, local previews, and explicit asset handoffs
```

## Migration Steps

### 1. Establish The Real Repo

Clone the GitHub repository on this PC instead of treating the transfer zip as the long-term working copy.

```powershell
git clone https://github.com/victortran794-ux/victor-tran-site.git
```

Then compare the cloned repo against this transfer snapshot. If this snapshot contains newer files, merge them into the repo carefully rather than replacing the repo wholesale.

Current blocker: Git is not installed or not on PATH. Install Git for Windows first, then restart the terminal/Codex session if needed so `git --version` works.

### 2. Keep The Transfer Snapshot As Recovery Context

This unpacked folder is valuable as a time-stamped backup and migration reference. Once the real repo is cloned and compared, avoid using this snapshot as the main editing location.

### 3. Convert Magi From A Machine Into A Workflow

Magi should no longer be defined by a specific old computer. Define Magi through durable repo instructions:

- Use `CLAUDE.md` as the entrypoint.
- Keep site conventions in `victor-tran-site.md`.
- Keep operational workflow in `PORTFOLIO_SYSTEM.md`.
- Keep status and next actions in `PORTFOLIO_DASHBOARD.md` and `PORTFOLIO_STATUS.md`.
- Put active case-study planning in `case-studies/<slug>.md`.
- Treat root HTML pages as the source of truth for published content.

### 4. Add PC-Specific Notes To The Real Repo

After Git is reconnected, add this file or a cleaned-up version of it to the repo. A good long-term name would be either:

- `MAGI_PC_MIGRATION_PLAN.md`
- `AGENTS.md`

`AGENTS.md` is useful if multiple assistants will work on the site, because many coding agents automatically look for it.

### 5. Connect iCloud Asset Sources

Keep design source files in iCloud, but publish only curated/exported assets into the repo.

Recommended rule:

- iCloud contains source material: Figma exports, Photoshop/Illustrator files, PDFs, screenshots, working folders.
- The repo contains web-ready assets only: optimized JPG/PNG/WebP/SVG files used by the site.

Before Magi uses source assets, ask Victor to confirm what is safe to publish, especially for confidential work like Document Processing, IBM, PCI, or any unreleased project.

### 6. Make Upkeep Repeatable

Before meaningful pushes:

```bash
./scripts/preflight.sh
```

Expected checks:

- changed files summary
- whitespace/conflict-marker scan
- Markdown export regeneration
- oversized image warnings
- local health check when dependencies are available

Remote health is already handled by GitHub Actions. Use that as the stronger signal when local Windows tooling is missing.

## Magi Operating Rules

### Voice And Judgment

Magi should act like a design-aware site steward, not just a code editor. Preserve Victor's visual voice: editorial, personal, clear, polished, and selective. Avoid generic portfolio-template language.

### Source Of Truth

- Public page content: root `*.html`.
- Generated/search content: `content/*.md` and `content/site-index.json`.
- Durable planning: `case-studies/*.md`.
- Dormant experiments and retired work: `archive/`.
- Workflow/status: `PORTFOLIO_*.md`.

### Confidentiality

Ask before publishing or pushing work that involves:

- client screenshots
- internal platform UI
- HR/legal/compliance content
- unreleased case studies
- password-gated/protected work
- source files from iCloud

Do not remove intentional blurs from PCI or other protected examples.

### Design Upkeep

When editing the site:

- preserve existing nav/footer/cursor/theme patterns
- use existing CSS conventions before adding new systems
- optimize images before adding them to `images/`
- verify mobile and desktop layouts
- regenerate content exports after changing page copy
- run preflight before commits or pushes

### Case Study Intake

When Victor provides raw notes for a project:

1. Save the working context in `case-studies/<slug>.md`.
2. Extract confirmed facts.
3. Mark risky claims.
4. List open questions.
5. Identify media/screenshot needs.
6. Draft a story thesis.
7. Create an implementation checklist only after visibility and confidentiality are clear.

## Immediate Next Actions

1. Install Git for Windows or add an existing Git install to PATH.
2. Clone `victortran794-ux/victor-tran-site` onto this PC.
3. Treat the cloned repo as newer than this transfer snapshot unless a file-by-file comparison proves otherwise.
4. Move only transfer-only migration docs, such as this plan and `AGENTS.md`, into the repo.
5. Confirm where iCloud design folders live on this PC.
6. Run a local preview from the cloned repo.
7. Run `scripts/preflight.sh` where supported.
8. Use GitHub Actions as the final site health signal.

## Follow-Up: PC Housekeeping

This PC has mostly been used for World of Warcraft, so do a separate machine-structure review after the portfolio repo is safely reconnected. Keep this as a housekeeping pass, not part of the first website migration.

Recommended scope:

1. Map the major user folders: Desktop, Downloads, Documents, Pictures, iCloud Drive, game folders, and any old agent/workspace folders.
2. Identify large or duplicate files, especially installers, exports, screenshots, recordings, archives, and temporary transfer packages.
3. Separate personal/design/work folders from game-related folders.
4. Create a clean working structure for agent-assisted design/site work.
5. Decide which folders Magi/Codex can inspect by default and which should require explicit permission.
6. Confirm backup/sync behavior for iCloud and any important local-only folders.

Suggested working folder model:

```text
Documents/
  Design Work/
  Websites/
  Agents/
  Archives/

iCloud Drive/
  Design Sources/
  Portfolio Assets/
  References/

Downloads/
  Inbox - review and clear periodically
```

## Follow-Up: Discord And Magi Connections

Victor still has Magi set up in Discord, but the server and integrations may be messy. Audit this after the core PC/repo migration is stable.

Recommended scope:

1. Inventory Discord servers, channels, bot accounts, webhooks, and integrations related to Magi.
2. Identify which connections are still active, stale, duplicated, or unsafe.
3. Preserve any useful prompts, logs, command patterns, or memory/context from the old Magi setup.
4. Decide whether Discord should remain a command surface for Magi or become archival/reference only.
5. Remove or disable stale webhooks/tokens after confirming they are not needed.
6. Document the final Discord role in `AGENTS.md` or a separate operations note.

Important safety rule: do not paste Discord bot tokens, webhook URLs, API keys, or private server exports into public repo files.

## Open Questions For Victor

- Where is iCloud Drive mounted on this Windows machine?
- Should Magi be allowed to inspect iCloud design folders by default, or only when a task names a folder?
- Should portfolio updates happen directly on `main`, or through branches and draft pull requests?
- Should Document Processing remain password-gated, hidden, or become public later?
- Do you want a weekly portfolio health digest only when something fails?
- Should Discord remain an active Magi interface, or should it become an archive of the old setup?
- Are there parts of this PC, such as game folders, personal folders, or Discord exports, that Magi should never inspect without explicit permission?
