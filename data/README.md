# Portfolio project manifest

`projects.json` is the shared source for portfolio project order and homepage/nav metadata.

The public site is still authored as static HTML. This manifest does not generate the homepage or Work dropdown yet. Instead, `scripts/validate-project-manifest.mjs` checks that the static HTML, generated content index, protected-page guardrails, and sitemap expectations stay aligned with this source list.

When changing project order or visibility:

1. Update `data/projects.json` first.
2. Make the matching static HTML change in `index.html`.
3. Regenerate content exports with `node scripts/html-to-md.mjs`.
4. Run `node scripts/validate-project-manifest.mjs` or `./scripts/preflight.sh`.

Keep protected-page flags explicit. For example, Document Processing may appear in the Work dropdown/homepage while staying password-gated, `noindex`, and omitted from `sitemap.xml`.
