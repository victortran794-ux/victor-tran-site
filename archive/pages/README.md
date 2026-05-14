# archive/pages/

This folder holds frozen snapshots of retired or pre-redesign site pages.

The goal is simple: when a page is removed, redesigned, or paused, keep enough of the old page to recover its content and media later without digging through Git history.

## Page archive capsule

Each archived page should live in its own dated folder:

```txt
archive/pages/<page-slug>-YYYY-MM-DD/
  <page>.html      # HTML snapshot from the site root
  content.md       # readable text extraction from the page
  manifest.md      # what was archived, why, and which assets were copied
  assets/          # copied local assets referenced by the page
```

Example:

```txt
archive/pages/ibmcloud-2026-05-13/
  ibmcloud.html
  content.md
  manifest.md
  assets/images/...
```

## How to archive a page

From the repo root:

```bash
node scripts/archive-page.mjs ibmcloud.html "Archived before redesign"
```

The script will:

1. create a dated archive folder under `archive/pages/`
2. copy the HTML file
3. extract readable text into `content.md`
4. copy local image/video/PDF references into `assets/`
5. write a `manifest.md`

## Source-of-truth rule

- Active pages: root `*.html` files are the source of truth.
- Active planning: `case-studies/*.md` files are the source of truth before implementation.
- Archived capsules: historical snapshots only. Use them as recovery/reference material, not live content.

## Before deleting or replacing a page

Archive it first unless the page is truly disposable.

Good candidates:

- old case-study versions
- protected/confidential pages before rewrites
- experimental pages that may contain reusable copy or imagery
- pages removed from navigation but worth preserving
