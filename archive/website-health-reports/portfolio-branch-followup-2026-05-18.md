# Portfolio Branch Follow-up — 2026-05-18

Scope: implemented the approved follow-up on `codex/lychee-health-check`.

## Changes made

- Updated `scripts/health-check.sh` so WSL can invoke the repo-local Windows Lychee binary correctly:
  - Keeps native `lychee` as the first preference when available.
  - If falling back to `.tools/lychee/lychee.exe`, converts the root directory and HTML file inputs with `wslpath -w`.
  - Removed the soft `|| echo "(link issues found)"` behavior so Lychee link failures now fail the local health check instead of looking like a successful run.
- Updated `.github/workflows/health-check.yml` comments so Document Processing is no longer described as direct-link only.
- Reconciled portfolio docs to describe the actual current state:
  - Document Processing is live, password-gated, noindex, currently linked from the Work dropdown, and omitted from the sitemap.
  - Preserve password gate/noindex and current navigation visibility unless Victor asks to change it.
  - Do not add homepage/sitemap promotion, screenshots, metrics, launch claims, or major copy changes without approval.

## Files changed

- `.github/workflows/health-check.yml`
- `scripts/health-check.sh`
- `MAGI_PC_MIGRATION_PLAN.md`
- `PORTFOLIO_DASHBOARD.md`
- `PORTFOLIO_STATUS.md`
- `PORTFOLIO_SYSTEM.md`
- `PORTFOLIO_UPKEEP_BACKLOG_2026-05-17.md`
- `case-studies/document-processing.md`

## Verification

Passed:

```text
git diff --check
bash -n scripts/health-check.sh
bash scripts/health-check.sh
```

Health-check output summary:

```text
466 Total
206 Unique
428 OK
0 Errors
38 Excluded
11 Redirects
All images under 1MB
```

A follow-up search found no remaining `direct-link only`, `direct link only`, or `absent from homepage/nav/sitemap` wording in Markdown files.

## Git state

Branch: `codex/lychee-health-check`

Working tree still has uncommitted changes. No commit, push, PR, deployment, or public-site navigation/content change was performed.
