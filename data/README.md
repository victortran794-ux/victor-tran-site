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

## Shared shell sources

`site-shell.json` owns fixed shared-shell labels, contact details, and the exact root HTML page set. `scripts/generate-site-shell.mjs` combines it with existing navigation membership from `projects.json` and active protected-route state from `content-export-policy.json`.

Run:

1. `npm run test:site-shell` for the disposable public/protected fixture.
2. `npm run generate:site-shell` to regenerate marked root-page header and footer regions.
3. `npm run check:site-shell` for the fail-closed real-tree contract.

The shell generator owns only its marked header/footer regions, applicable marked primary case-study previous/next regions, route-local active semantics, and the fixed protected status cue. It validates the existing `main#main-content[tabindex="-1"]` target but does not mutate it. It does not own project bodies, route membership, manifest protection corrections, sitemap, robots, canonical metadata, or the home-page Design DNA overlay.

## Visual archive sources

`scripts/build-visual-archives-integration.py` owns the bounded body composition, scoped head styles, and candidate-specific metadata for `artillustration.html` and `graphicgallery.html`. It deliberately preserves the generator-owned shell fences and validates the existing focus target. Approved archive media lives in `images/art-archive-v2/` and `images/graphic-archive-v2/`; frozen pre-migration counterparts live under `archive/pages/`.

Run:

1. `npm run build:visual-archives` to reproduce both integrated archive bodies.
2. `npm run generate:site-shell` to refresh only shell-owned regions.
3. `npm run check:visual-archives` for identity, media, accessibility, no-caption, no-hidden-archive, and shell-boundary contracts.
4. With a local server on port `8896`, run `npm run check:visual-archives-browser` for Light/Dark, exact-390px, desktop, decoding, target-size, and overflow checks.

Art and Graphic remain separate project-native compositions. Neither gallery receives primary case-study previous/next navigation, and neither may receive the homepage-only Design DNA interaction.
