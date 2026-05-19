# Portfolio Branch Review — 2026-05-18

Scope: read-only review of `codex/lychee-health-check` plus the uncommitted Document Processing docs updates.

## Current branch state

- Branch: `codex/lychee-health-check`
- Codex health-check changes are committed on the branch.
- Document Processing docs changes remain uncommitted.

## What looks good

- GitHub workflow now documents the protected-page context near Lychee args.
- `.tools/` is ignored, which is appropriate for repo-local downloaded tools.
- `scripts/install-lychee.ps1` installs repo-local Windows Lychee under `.tools/lychee/`.
- Repo-local Lychee is present and reports `lychee 0.24.2`.
- `git diff --check` passes.
- Documentation changes correctly capture the broad decision that Document Processing may remain live and password-gated/noindex.

## Review findings to resolve before treating this branch as ready

### 1. WSL + Windows Lychee path issue

From Hermes/WSL, `bash scripts/health-check.sh` invokes `.tools/lychee/lychee.exe` with WSL-style `/mnt/c/...` paths. The Windows exe does not understand those paths, so Lychee reports:

```text
Input '/mnt/c/Users/Victor/Documents/Websites/victor-tran-site/404.html' not found as file and not a valid URL.
```

The script then prints `(link issues found)` and exits 0, so the local health check can look complete even though link checking did not actually run successfully.

Recommended fix options:

1. Prefer a native Linux Lychee binary when running under WSL.
2. Or detect WSL + `.exe` and convert `ROOT` / input paths with `wslpath -w` before invoking Windows Lychee.
3. Or document that the repo-local Windows Lychee path is for PowerShell/Git Bash only, not WSL.

Also consider whether Lychee failures should return nonzero for a preflight/health script instead of being swallowed by `|| echo "(link issues found)"`.

### 2. “Direct-link only” wording conflicts with current HTML nav

The docs currently say Document Processing is direct-link only / absent from homepage-nav-sitemap discovery. Current repo HTML links `document-processing.html` from the Work dropdown in 12 root HTML files:

- `404.html`
- `abilityexperience.html`
- `about.html`
- `artillustration.html`
- `document-processing.html`
- `graphicgallery.html`
- `ibm-patterns.html`
- `ibmcloud.html`
- `index.html`
- `pci.html`
- `pikappapp.html`
- `salmagazine.html`

Decision needed:

- If Document Processing should be discoverable from the Work dropdown, update the docs/workflow comment to say: live, password-gated, noindex, omitted from sitemap, and nav-linked/protected.
- If it should truly be direct-link only, remove those nav links in a separate explicit public-site edit.

Given Victor said the page can stay live with a password, the least invasive next step is to adjust docs/comments to avoid saying “direct-link only” unless he explicitly wants nav links removed.

## Suggested next action

Ask Codex for a tiny follow-up:

1. Fix or document the WSL/Windows Lychee path behavior.
2. Decide whether Lychee failures should be nonzero in `scripts/health-check.sh`.
3. Reconcile the protected-page wording with reality: the page is currently nav-linked, noindex, password-gated, and omitted from sitemap.
4. Re-run:
   - `git diff --check`
   - `bash scripts/health-check.sh` from the intended shell environment

## Suggested PR framing after follow-up

Title:

```text
chore: improve portfolio health checks and protected-page docs
```

Summary:

```text
- Add repo-local Windows Lychee installer and health-check fallback
- Keep GitHub and local Lychee excludes aligned
- Document that Document Processing is intentionally live, password-gated, and noindex
- Update portfolio ops docs so the protected page is no longer treated as an unresolved publication blocker
```

Verification:

```text
- git diff --check
- bash scripts/health-check.sh
- lychee 0.24.2 available via repo-local .tools/lychee/lychee.exe
```

Caveat to resolve before final review:

```text
- Confirm health-check shell environment: WSL currently needs path handling for Windows lychee.exe, or the script should be run from Windows PowerShell/Git Bash.
```
