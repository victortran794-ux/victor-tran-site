# Magi Access Policy

Last updated: 2026-05-17

This file defines how Magi/Codex-style agents should interact with Victor's local PC, iCloud Drive, and portfolio files.

## Core Rule

Use the local Git clone for website work. Use iCloud Drive as a design/source/archive library.

Active Git working copy:

```text
C:\Users\Victor\Documents\Codex\2026-05-17\files-mentioned-by-the-user-victor\victor-tran-site
```

Reference/archive iCloud copy:

```text
C:\Users\Victor\iCloudDrive\Documents\victor-tran-site
```

Do not use the iCloud copy as the active Git repo. Its `.git` folder may be an iCloud placeholder and may not behave like a normal local repository on Windows.

## Default Read-Only Access

Agents may inspect these folders by default when a design/site task reasonably needs source assets or references:

```text
C:\Users\Victor\iCloudDrive\Documents\Design Work\Website
C:\Users\Victor\iCloudDrive\Documents\Design Work\2_Assets
C:\Users\Victor\iCloudDrive\Documents\Design Work\5_Logos
C:\Users\Victor\iCloudDrive\Documents\Design Work\6_Illustrations
C:\Users\Victor\iCloudDrive\Documents\Design Work\7_Powerpoints
C:\Users\Victor\iCloudDrive\Documents\Photography\1_Me
C:\Users\Victor\iCloudDrive\Documents\Photography\2_Art
```

Default access means read-only inventory, preview, or asset review. Do not edit, move, rename, delete, or bulk-download from iCloud folders unless Victor explicitly asks.

## Ask First

Ask Victor before inspecting or using:

```text
C:\Users\Victor\iCloudDrive\Documents\Design Work\IBM
C:\Users\Victor\iCloudDrive\Documents\Design Work\PCI
C:\Users\Victor\iCloudDrive\Documents\Important Documents
C:\Users\Victor\iCloudDrive\Documents\.claude
C:\Users\Victor\AppData\Roaming\discord
```

Also ask first for:

- client folders
- unreleased work
- HR/legal/compliance content
- internal platform screenshots
- password-gated portfolio material
- source files that may contain confidential or licensed assets
- any folder likely to contain personal records or credentials

## Never Publish Secrets

Never paste, commit, or publish:

- `.env` or `.env.local` contents
- API keys or access tokens
- Discord bot tokens or webhook URLs
- Figma personal access tokens
- private Claude/Codex settings
- raw server exports or private logs

Legacy Claude settings may contain old Figma token strings. Treat them as exposed/stale and rotate or revoke them before future Figma API work.

## Website Asset Flow

When using iCloud assets for the public site:

1. Find source/reference material in iCloud.
2. Confirm publication safety if the work is client, internal, unreleased, or protected.
3. Export or create a web-ready asset.
4. Optimize the asset.
5. Copy only the curated web-ready file into the local repo.
6. Commit through Git on a branch.
7. Use a PR before merging to `main`.

## Discord

Discord may still contain old Magi setup context, but it should be audited separately. Do not inspect Discord app data, bot settings, webhooks, or exported logs without explicit approval for that task.

