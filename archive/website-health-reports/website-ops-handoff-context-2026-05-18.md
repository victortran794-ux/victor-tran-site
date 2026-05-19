# Website Ops Handoff Context — 2026-05-18

## Repo / site

- Repo: `C:\Users\Victor\Documents\Websites\victor-tran-site`
- WSL path: `/mnt/c/Users/Victor/Documents/Websites/victor-tran-site`
- Live domains: `victortrandesign.com` and `victortrandesigns.com`
- Site type: static HTML/CSS/JS, deployed through GitHub + Vercel.
- Working canonical URL in current ops scripts: `https://victortrandesign.com`.

## Completed and merged

PR #33 / branch `codex/lychee-health-check` was merged into `main`.

Merged changes included:
- Repo-local Windows Lychee installer: `scripts/install-lychee.ps1`
- `.tools/` ignored in `.gitignore`
- Local health script improvements in `scripts/health-check.sh`
- WSL-to-Windows `lychee.exe` path conversion via `wslpath -w`
- Link-check failures now fail local health preflight instead of being swallowed
- Portfolio docs reconciled around Document Processing state

Local repo was then updated back to `main`, local old branch deleted, and remote old branch deleted.

## Current branch awaiting Victor approval

A small follow-up branch has been pushed:

- Branch: `chore/health-workflow-trigger-paths`
- Commit: `e850e15 ci: run health check on ops tooling changes`
- PR creation URL: `https://github.com/victortran794-ux/victor-tran-site/pull/new/chore/health-workflow-trigger-paths`

Purpose:
- Update `.github/workflows/health-check.yml` push path filters so the Site health check runs when health-check tooling/config changes, not only when public HTML/CSS/JS/sitemap/robots files change.

Changed path filters added:
- `.github/workflows/health-check.yml`
- `.github/lighthouse-budget.json`
- `scripts/health-check.sh`
- `scripts/install-lychee.ps1`

Verification before push:
- `git diff --check` passed
- `bash -n scripts/health-check.sh` passed
- `bash scripts/health-check.sh` passed
  - 466 total links
  - 206 unique
  - 428 OK
  - 0 errors
  - 38 excluded
  - 11 redirects
  - all images under 1MB

## Document Processing operating decision

Do not re-open the old “live page is a problem” warning. Current accepted state:

- `document-processing.html` is intentionally live
- password-gated
- `noindex,nofollow`
- currently linked from the Work dropdown
- omitted from sitemap

Do not add/remove homepage/nav/sitemap visibility, screenshots, metrics, launch claims, or major copy changes unless Victor explicitly asks.

## Post-merge checks already run

After PR #33 merge:
- Local `main` was clean and synced with `origin/main`
- `https://victortrandesign.com/` returned 200 and redirected to `https://www.victortrandesign.com/`
- `/document-processing` returned 200 and contained `<meta name="robots" content="noindex,nofollow">`
- `/sitemap.xml` returned 200 and did not contain `document-processing`
- `https://victortrandesigns.com/` returned 200
- Local `bash scripts/health-check.sh` passed

## Weekly Hermes digest

Existing cron job updated:

- Name: `Victor portfolio weekly health digest`
- Job ID: `e283fff840e3`
- Schedule: Mondays 9:00 AM
- Delivery: origin Signal chat
- Workdir: `/mnt/c/Users/Victor/Documents/Websites/victor-tran-site`
- Skills: `personal-website-operations`
- Allowed: read-only repo/live checks and Markdown report writing to `C:\Users\Victor\Documents\Website Health Reports`
- Forbidden: repo edits, commits, pushes, deploys, branch deletion, settings changes, installs, or recursive cron creation

The updated cron prompt knows Document Processing is live/protected/noindex/currently Work-dropdown linked/omitted from sitemap.

## Useful commands for next session

```bash
cd /mnt/c/Users/Victor/Documents/Websites/victor-tran-site

git status --short --branch
git fetch origin --prune
git checkout main
git pull --ff-only origin main
bash scripts/health-check.sh
```

If Victor says he merged the follow-up branch:

```bash
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git branch -d chore/health-workflow-trigger-paths || true
# If remote branch still exists and Victor approves deletion:
'/mnt/c/Program Files/Git/cmd/git.exe' push origin --delete chore/health-workflow-trigger-paths
```

Use Windows Git for authenticated pushes/deletes from WSL when WSL Git cannot read GitHub HTTPS credentials:

```bash
'/mnt/c/Program Files/Git/cmd/git.exe' push ...
```
