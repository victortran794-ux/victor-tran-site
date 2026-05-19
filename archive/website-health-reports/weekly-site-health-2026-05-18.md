# Weekly Site Health Report — 2026-05-18

## Summary

Overall status: **OK**.

Victor's static portfolio is healthy based on the read-only weekly checks:

- Local repo is on `main`, tracking `origin/main`, with a clean working tree.
- Local health script completed successfully: **466 total links**, **428 OK**, **0 errors**, **38 excluded**, **11 redirects**; all images are under 1MB.
- Primary live domain routes return `200` through Vercel and redirect to the `www.` host as expected.
- Document Processing remains in the approved protected state: live `200`, password-gated page present, `noindex,nofollow` meta tag present, and omitted from `sitemap.xml`.
- Latest accessible public GitHub Actions `Site health check` runs on `main` are successful.

## Alerts

No blocking alerts.

Notes only:

- The local link checker reports **11 redirects**. This is advisory, not a failure.
- The newest local `HEAD` commit is `34eecbe`, while the latest listed `Site health check` workflow run is for `19fed27`. This is not currently a problem: the workflow only runs on pushes touching HTML/CSS/JS/sitemap/robots, plus schedule/manual dispatch, and Vercel reports success for `34eecbe`.

## Repo State

Repository: `/mnt/c/Users/Victor/Documents/Websites/victor-tran-site`

Git status:

```text
## main...origin/main
```

Working tree: **clean**.

Latest 3 commits:

```text
34eecbe (HEAD -> main, origin/main, origin/HEAD) Merge pull request #33 from victortran794-ux/codex/lychee-health-check
0bea291 chore: fix portfolio health check follow-up
19fed27 Merge pull request #32 from victortran794-ux/codex/lychee-health-check
```

Commit/check signal for `34eecbe`:

```text
GitHub check-runs: 0
Commit status: success
Vercel: success
Vercel URL: https://vercel.com/victortran794-uxs-projects/victor-tran-site/9H5oBYjmYruh8Q5SoTMCq51GheaK
```

## Local Health Script

Command run:

```bash
bash scripts/health-check.sh
```

Result: **passed**.

Output summary:

```text
==> Checking links in *.html
🔍 466 Total (in 966ms) 🔗 206 Unique ✅ 428 OK 🚫 0 Errors 👻 38 Excluded 🔀 11 Redirects
Hint:
 Followed 11 redirects. You might want to consider replacing redirecting URLs with the resolved URLs. Use verbose mode (`-v`/`-vv`) to see redirection details.

==> Scanning for oversized images (>1MB)
  All images under 1MB.

==> Lighthouse audit on https://victortrandesign.com
  (skipping locally - run via GitHub Actions for full report)
  trigger manually: gh workflow run "Site health check"

==> Done.
```

Interpretation:

- Link check is functioning locally and processed the HTML files.
- No broken-link failures were reported.
- No images over the 1MB threshold were found.
- Lighthouse remains delegated to GitHub Actions, as documented.

## Live Domain Checks

Read-only HTTP checks were run with redirects followed.

| URL | Status | Final URL | Content-Type | Server/cache notes |
|---|---:|---|---|---|
| `https://victortrandesign.com/` | 200 | `https://www.victortrandesign.com/` | `text/html; charset=utf-8` | Vercel, cache HIT |
| `https://victortrandesign.com/document-processing` | 200 | `https://www.victortrandesign.com/document-processing` | `text/html; charset=utf-8` | Vercel, cache HIT |
| `https://victortrandesign.com/sitemap.xml` | 200 | `https://www.victortrandesign.com/sitemap.xml` | `application/xml` | Vercel, cache HIT |
| `https://victortrandesigns.com/` | 200 | `https://www.victortrandesigns.com/` | `text/html; charset=utf-8` | Vercel, cache HIT |

No live-domain failures observed.

## Protected Page Check

Document Processing expected state from current ops docs and user instruction:

- Intentionally live.
- Password-gated.
- `noindex,nofollow`.
- Currently linked from the Work dropdown.
- Omitted from sitemap.
- Do not treat its live `200` route or current nav visibility as a problem.

Verification:

```text
/document-processing status: 200
final URL: https://www.victortrandesign.com/document-processing
robots meta found: <meta name="robots" content="noindex,nofollow">
has_noindex: True
has_nofollow: True
sitemap contains document-processing: False
```

Result: **matches expected protected-page state**.

## GitHub Health Workflow

Workflow file checked: `.github/workflows/health-check.yml`

Configured triggers:

- `workflow_dispatch`
- Weekly schedule: Mondays at 12:00 UTC
- Pushes to `main` touching:
  - `*.html`
  - `css/**`
  - `js/**`
  - `sitemap.xml`
  - `robots.txt`

Latest public API results for main-branch `Site health check` runs:

```text
id=26042983222 name=Site health check status=completed conclusion=success sha=19fed27 created=2026-05-18T15:24:03Z updated=2026-05-18T15:25:45Z url=https://github.com/victortran794-ux/victor-tran-site/actions/runs/26042983222
id=25999572700 name=Site health check status=completed conclusion=success sha=b4ebd28 created=2026-05-17T18:48:17Z updated=2026-05-17T18:50:00Z url=https://github.com/victortran794-ux/victor-tran-site/actions/runs/25999572700
id=25944607915 name=Site health check status=completed conclusion=success sha=b59f6c5 created=2026-05-15T22:33:56Z updated=2026-05-15T22:35:39Z url=https://github.com/victortran794-ux/victor-tran-site/actions/runs/25944607915
id=25942871990 name=Site health check status=completed conclusion=success sha=fc725cf created=2026-05-15T21:43:38Z updated=2026-05-15T21:45:19Z url=https://github.com/victortran794-ux/victor-tran-site/actions/runs/25942871990
id=25806628104 name=Site health check status=completed conclusion=success sha=0fbbc06 created=2026-05-13T14:46:46Z updated=2026-05-13T14:48:26Z url=https://github.com/victortran794-ux/victor-tran-site/actions/runs/25806628104
total_count=24
```

Result: **latest listed health workflow runs are successful**.

## Recommended Next Steps

No urgent action needed.

Suggested low-priority follow-ups:

1. Keep monitoring the 11 link redirects, but do not treat them as failures unless they become noisy or unstable.
2. Continue relying on GitHub Actions for Lighthouse and full production health checks.
3. Preserve Document Processing exactly as-is unless Victor explicitly requests a content, navigation, or sitemap change.
