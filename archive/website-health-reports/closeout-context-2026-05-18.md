# Website Ops Closeout Context — 2026-05-18

## Current repo state

- Repo: `C:\Users\Victor\Documents\Websites\victor-tran-site`
- WSL path: `/mnt/c/Users/Victor/Documents/Websites/victor-tran-site`
- Current branch: `main`
- Local `main` is clean and synced with `origin/main`.
- Latest main commit: `d54a62e Merge pull request #34 from victortran794-ux/chore/health-workflow-trigger-paths`

## PRs merged and cleaned up

### PR #33

Merged branch: `codex/lychee-health-check`

Main changes:
- Added repo-local Lychee installer: `scripts/install-lychee.ps1`
- Added `.tools/` to `.gitignore`
- Improved `scripts/health-check.sh`
- Fixed WSL invoking Windows `lychee.exe` by converting paths with `wslpath -w`
- Made local Lychee failures fail hard instead of being swallowed
- Reconciled Document Processing docs/comments around accepted protected state

Cleanup completed:
- Local branch deleted
- Remote branch deleted

### PR #34

Merged branch: `chore/health-workflow-trigger-paths`

Main change:
- Updated `.github/workflows/health-check.yml` push path filters so the Site health check runs when health ops tooling/config changes:
  - `.github/workflows/health-check.yml`
  - `.github/lighthouse-budget.json`
  - `scripts/health-check.sh`
  - `scripts/install-lychee.ps1`

Cleanup completed:
- Local branch deleted
- Remote branch deleted

## Verification after PR #34 merge

Local health check passed:

```text
466 Total
206 Unique
428 OK
0 Errors
38 Excluded
11 Redirects
All images under 1MB
```

GitHub Actions:
- The Site health check did trigger on merge commit `d54a62e`, confirming the new path filter works.
- At closeout, the run was `in_progress`:
  - `https://github.com/victortran794-ux/victor-tran-site/actions/runs/26052589556`

## Document Processing operating decision

Do not treat the live protected route as a problem.

Accepted state:
- `document-processing.html` is intentionally live
- password-gated
- `noindex,nofollow`
- currently linked from the Work dropdown
- omitted from sitemap

Do not add/remove homepage/nav/sitemap visibility, screenshots, metrics, launch claims, or major copy changes unless Victor explicitly asks.

## Report save location

Victor wants website-ops reports and handoffs saved in iCloud Drive Downloads.

Windows path:

```text
C:\Users\Victor\iCloudDrive\Downloads\Website Health Reports
```

WSL path:

```text
/mnt/c/Users/Victor/iCloudDrive/Downloads/Website Health Reports
```

Existing reports were copied there. Reports are convenience files only and Victor can delete them after reading.

## Weekly Hermes digest

Existing cron job:
- Job ID: `e283fff840e3`
- Name: `Victor portfolio weekly health digest`
- Schedule: Mondays 9:00 AM
- Delivery: origin Signal chat
- Workdir: `/mnt/c/Users/Victor/Documents/Websites/victor-tran-site`
- Skill: `personal-website-operations`
- Future report path template:

```text
/mnt/c/Users/Victor/iCloudDrive/Downloads/Website Health Reports/weekly-site-health-YYYY-MM-DD.md
```

The digest is read-only and forbidden from repo edits, commits, pushes, deploys, branch deletion, settings changes, installs, or recursive cron creation.

## Useful next-session commands

```bash
cd /mnt/c/Users/Victor/Documents/Websites/victor-tran-site

git status --short --branch
git fetch origin --prune
git pull --ff-only origin main
bash scripts/health-check.sh
```

To check the PR #34 health workflow result later:

```bash
python3 - <<'PY'
import json, urllib.request
url='https://api.github.com/repos/victortran794-ux/victor-tran-site/actions/runs?branch=main&per_page=5'
with urllib.request.urlopen(url, timeout=20) as r:
    data=json.load(r)
for run in data.get('workflow_runs', [])[:5]:
    print(f"{run['name']} | {run['status']} | {run.get('conclusion')} | {run['head_sha'][:7]} | {run['html_url']}")
PY
```
