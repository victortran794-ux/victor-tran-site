# artillustration page archive

Archived: 2026-07-31
Original path: artillustration.html
Reason: Pre-redesign snapshot for bounded Art and Graphic visual-archives sprint

## Restore notes

- Treat this folder as a frozen snapshot, not the active source of truth.
- If restoring, compare against the current live HTML and current assets first.
- The compact repository capsule retains HTML, readable content, and a SHA-256 asset ledger without duplicating active repository binaries.
- A full self-contained recovery capsule, including all 48 referenced binary assets, is retained in the sprint's private recovery records.
- At closeout, every asset listed in `asset-hashes.sha256` was byte-identical to an active file under the repository's `images/` tree.

## Files

- `artillustration.html` — archived HTML snapshot
- `content.md` — readable text extraction
- `asset-hashes.sha256` — immutable path and checksum ledger for 48 referenced assets

## Binary disposition

The archive generator initially copied all local assets, as required by the default page-archive convention. Final independent review found that committing those byte-identical copies would add approximately 23 MiB of avoidable repository weight. The full generated capsule was therefore verified and retained in private sprint recovery records before its duplicate binaries were removed from this compact repository capsule.
