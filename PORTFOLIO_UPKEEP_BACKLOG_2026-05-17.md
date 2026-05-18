# Portfolio Upkeep Backlog - 2026-05-17

This backlog comes from the first PC-based local portfolio audit after migrating Magi/Codex workflow docs into the repo.

## Audit Snapshot

- Local repo is on `main`, synced from GitHub after PR #28.
- Site remains plain HTML/CSS/JS with no build step.
- `git diff --check` passed.
- `node scripts/html-to-md.mjs` ran successfully.
- `scripts/health-check.sh` ran through Git Bash with local tooling caveats.
- Local Lychee is not installed, so local broken-link checks are skipped.
- Local Lighthouse is intentionally skipped; GitHub Actions remains the stronger health signal.
- Current image scan found no images over 1 MB. The largest files are close to the limit, especially `images/cards/diamond-10.png`, `images/cards/diamond-4.png`, and `images/illus-img4496.jpg`.

## Immediate Maintenance

### 1. Sync Generated About Content

Status: ready.

`about.html` already contains the newer Spotify wording from recent PRs, but generated exports were stale. Running `scripts/html-to-md.mjs` updated:

- `content/about.md`
- `content/site-index.json`

This should be committed as a small generated-content sync.

### 2. Update Portfolio Status Docs

Status: recommended next.

`PORTFOLIO_DASHBOARD.md` and `PORTFOLIO_STATUS.md` still say "Last updated: 2026-05-13" and do not mention:

- PC migration complete
- PR #28 merged
- Git for Windows installed
- iCloud Drive path confirmed
- Magi access policy added
- local repo cloned and synced

Update these docs after this audit branch lands or as a separate docs pass.

### 3. Document Processing Live Protected State

Status: situated / accepted for now.

`document-processing.html` exists and may remain live in its current password-gated state. Victor is fine keeping the page live as protected portfolio material even while the narrative/media continues to evolve.

Current operating rules:

- preserve the password gate
- preserve `noindex,nofollow`
- preserve its current navigation visibility unless Victor asks to change it
- do not add it to homepage, sitemap, screenshots, metrics, or other promotion without approval
- do not add new screenshots, diagrams, metrics, launch claims, or major copy changes without approval
- if health tooling flags the page, treat the protected live route as expected rather than as a publication blocker

### 4. About Page "Training For" WIP

Status: intentionally left as-is.

`about.html` currently contains:

```text
Training for: (WIP)
```

Victor confirmed this should stay because he may get back to it.

### 5. Local Health Tooling

Status: optional.

Local `scripts/health-check.sh` expects Unix-style tools and Lychee. On Windows, GitHub Actions is currently the better health signal.

Options:

- keep local health checks lightweight and rely on GitHub Actions
- install `gh` for easier workflow checks and PR creation
- install Lychee later if local link checks become useful
- add a PowerShell-native health script if Windows local checks become routine

### 6. Image Weight Watchlist

Status: not urgent.

No scanned images are currently over 1 MB, but several are close. If performance work becomes a priority, start with:

- `images/cards/diamond-10.png`
- `images/cards/diamond-4.png`
- `images/illus-img4496.jpg`
- `images/cards/diamond-6.png`
- `images/illus-img4537.jpg`
- `images/illus-img4531.jpg`

Consider WebP/AVIF variants or smaller display-specific exports only after checking how these assets are used.

## Later / Separate Passes

### Discord / Magi Audit

Keep separate from website work. Audit servers, bot/webhook connections, stale integrations, and old Magi command patterns only when Victor explicitly starts that task.

### Figma Token Rotation

Skip Figma for now. Later, revoke or rotate old Figma tokens found in legacy Claude settings before setting up any fresh Figma API workflow.

### Folder Organization

Keep active Git work outside iCloud. Use:

```text
C:\Users\Victor\Documents\Websites\victor-tran-site
```

Use iCloud Drive as design/source/archive:

```text
C:\Users\Victor\iCloudDrive\Documents\Design Work
```

