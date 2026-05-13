# Portfolio Status

Last updated: 2026-05-13

## Current system

- Main ops doc: `PORTFOLIO_SYSTEM.md`
- Site conventions: `victor-tran-site.md`
- Claude entrypoint: `CLAUDE.md`
- GitHub health workflow: `.github/workflows/health-check.yml`
- Local health script: `scripts/health-check.sh`

## Active/nearby work

### Homepage mobile hero

Recent PRs #22 and #23 passed the site health workflow and were merged/pushed to `main`.

### Document Processing case study

Current planning doc: `document-processing-case-study-current-notes.md`

Known caution: do not publish or push more Document Processing work until Vic confirms confidentiality/screenshot safety and whether it should be linked publicly, password-gated, or held locally.

## Health automation snapshot

GitHub workflow: active

Recent health runs checked 2026-05-13:

- PR #23: success
- PR #22: success
- PR #21: failed because `document-processing.html` linked to a live `/document-processing` URL before it existed, causing a Lychee 404

Local `./scripts/health-check.sh` notes:

- `lychee` is not installed locally, so local link check skipped
- oversized image warnings exist for several `images/cards/diamond-*` files and `images/illus-img4496.jpg`

## Next useful actions

- Continue using the lightweight `case-studies/document-processing/` packet: `status.md`, `notes.md`, and `draft.md`.
- Consider installing Lychee locally if pre-push link checks become useful: `brew install lychee`.
- Consider adding a weekly OpenClaw reminder/heartbeat to summarize GitHub health failures only when there is something actionable.
- If Vercel-specific deployment status is needed, identify whether Vercel CLI is authenticated locally; otherwise use GitHub commit/status checks as the main deployment proxy.
