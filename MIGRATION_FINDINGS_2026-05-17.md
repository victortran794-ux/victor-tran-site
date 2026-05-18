# Migration Findings - 2026-05-17

## Summary

The transfer package is useful as a static backup, but it should not become the main working copy. The live GitHub repo is newer.

## Confirmed

- Transfer snapshot unpacked successfully.
- `index.html` and site assets are present.
- The project is a static HTML/CSS/JS site with no build step.
- GitHub repo is reachable: `victortran794-ux/victor-tran-site`.
- Connected GitHub account has admin, push, and pull permissions on the repo.
- The live repo default branch is `main`.
- Vercel deployment is documented as auto-deploying from `main`.

## Local PC Tooling

- Git for Windows was installed during migration: `git version 2.54.0.windows.1`.
- Codex may need to call Git directly at `C:\Program Files\Git\cmd\git.exe` until its shell PATH refreshes.
- `gh` is not currently available on PATH.
- `winget` is not currently available on PATH.
- GitHub CLI is not installed at the checked common path.
- The bundled Codex Python runtime can run a foreground static server.

Preview command from this folder:

```powershell
& 'C:\Users\Victor\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Repo vs Transfer Snapshot

The live repo is newer than the transfer snapshot.

Evidence:

- Recent GitHub PRs #26 and #27 updated `about.html` with a Play & Listen section, embedded Tetris, and Spotify wording.
- Live `main` contains `js/tetris.js`.
- The transfer snapshot does not contain `js/tetris.js`.
- Searching the transfer snapshot did not find the expected Tetris/Spotify strings from the live About page.

Implication:

- Do not overwrite the live repo from this transfer folder.
- The live repo has been cloned locally outside iCloud.
- Compare carefully before moving anything else from transfer or iCloud copies into the repo.

## Transfer-Only Docs Created During Migration

- `MAGI_PC_MIGRATION_PLAN.md`
- `AGENTS.md`
- `MIGRATION_FINDINGS_2026-05-17.md`

These are candidates to add to the real repo after cloning.

An attempt to create a GitHub branch through the connector failed with `Resource not accessible by integration`, even though repo read/admin metadata is visible. Treat local Git installation as the primary unblocker for publishing these docs.

## Recommended Next Step

Use the stable local clone for active Git work:

```text
C:\Users\Victor\Documents\Websites\victor-tran-site
```

Keep the iCloud copy at `C:\Users\Victor\iCloudDrive\Documents\victor-tran-site` as reference/archive, not the active Git working copy.
