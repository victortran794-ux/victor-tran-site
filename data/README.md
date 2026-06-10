# Portfolio project manifest

`projects.json` is the shared source for portfolio project order and homepage/nav metadata.

`scripts/generate-project-sections.mjs` uses this manifest to generate the Work dropdown and homepage project cards in `index.html`. `scripts/validate-project-manifest.mjs` then checks that the generated HTML, generated content index, protected-page guardrails, and sitemap expectations stay aligned with the manifest.

When changing project order, visibility, labels, thumbnails, or homepage card copy:

1. Update `data/projects.json` first.
2. Run `node scripts/generate-project-sections.mjs` to update the generated regions in `index.html`.
3. Regenerate content exports with `node scripts/html-to-md.mjs`.
4. Run `node scripts/validate-project-manifest.mjs` or `./scripts/preflight.sh`.

The preflight script now runs the generator before regenerating content exports, so a manifest change should be reflected in the static homepage before validation runs.

Keep protected-page flags explicit. For example, Document Processing may appear in the Work dropdown/homepage while staying password-gated, `noindex`, and omitted from `sitemap.xml`.
