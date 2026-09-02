#!/usr/bin/env node
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const failures = [];
const read = path => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
const need = (condition, message) => { if (!condition) failures.push(message); };
const needText = (text, token, message) => need(text.includes(token), message);
const forbid = (text, pattern, message) => need(!pattern.test(text), message);
const count = (text, pattern) => (text.match(pattern) ?? []).length;

const html = read('uigallery.html');
const css = read('css/ui-gallery.css');
const index = read('index.html');
const manifest = JSON.parse(read('data/projects.json') || '{"projects":[]}');
const shell = JSON.parse(read('data/site-shell.json') || '{"pages":[]}');
const sitemap = read('sitemap.xml');
const exporter = read('scripts/html-to-md.mjs');
const packageJson = JSON.parse(read('package.json') || '{"scripts":{}}');
const browserContract = read('scripts/check-visual-archives-browser.mjs');
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');
const sharedShellContract = read('scripts/check-shared-shell.mjs');
const a11yContract = read('scripts/check-accessibility-quick-wins.mjs');
const assetBuilder = read('scripts/build-ui-gallery-assets.py');
const assetRequirements = read('scripts/requirements-ui-gallery-assets.txt');
const publicExport = read('content/uigallery.md');
const siteIndex = read('content/site-index.json');

need(Boolean(html), 'uigallery.html must exist.');
need(Boolean(css), 'css/ui-gallery.css must exist.');

for (const token of [
  '<title>Interface Studies · Victor Tran Design</title>',
  '<link rel="canonical" href="https://www.victortrandesign.com/uigallery">',
  '<link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png">',
  '<link rel="icon" type="image/png" sizes="192x192" href="images/favicon-192.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png">',
  '<body class="visual-archive-page ui-gallery-page">',
  '<main class="page-content" id="main-content" tabindex="-1" data-archive="ui-gallery">',
  '<meta property="og:title" content="Interface Studies · Victor Tran Design">',
  '<meta name="twitter:title" content="Interface Studies · Victor Tran Design">',
  '<p class="ui-gallery-kicker">Interface Studies</p>',
  '<h1>Interfaces, in view.</h1>',
  'A few interface studies and small experiments I liked enough to keep around.',
  '<section class="ui-study ui-study--ekos archive-primary" aria-labelledby="ekos-study-title">',
  '<h2 id="ekos-study-title">Ekos Con</h2>',
  "A high-fidelity refinement of an original client landing-page concept from 2018.",
  'The concept was not shipped; registration and booking are illustrative.',
  'data-ui-study-view="ekos-desktop"',
  'data-ui-study-view="ekos-mobile"',
  'data-ui-scroll-screen="desktop"',
  'data-ui-scroll-screen="mobile"',
  'tabindex="0"',
  '<section class="ui-study ui-study--magi" aria-labelledby="magi-study-title">',
  '<h2 id="magi-study-title">Magi interface studies</h2>',
  'A dark interface system explored through dashboards, components, and interaction patterns.',
  'Interface details use fictional sample data and are shown as design examples rather than production data.',
  'data-ui-study-view="magi-overview"',
  '<strong>Dashboard overview</strong>',
  'A work-continuity dashboard organized around status, attention, and history.',

  'data-ui-study-view="magi-overlays"',
  '<strong>Overlay patterns</strong>',
  'Command-palette and confirmation-dialog studies for consequential controls.',

  'data-ui-study-view="magi-components"',
  '<strong>Component studies</strong>',
  'Buttons, fields, status badges, task states, and activity treatments.',
  'data-ui-study-view="magi-node-states"',
  '<strong>Node states</strong>',
  'Default, selected, focus, and muted treatments across the architecture.',
  '<div class="cursor-dot" aria-hidden="true"></div>',
  '<div class="cursor-ring" aria-hidden="true"></div>',
  '<script src="js/main.js"></script>',
]) needText(html, token, `UI Gallery is missing: ${token}`);

for (const token of [
  'body.ui-gallery-page .cursor-dot{background:var(--ui-accent);box-shadow:0 0 0 1px #101820}',
  'body.ui-gallery-page .cursor-ring{border-color:var(--ui-accent);box-shadow:0 0 0 1px rgba(16,24,32,.9);opacity:.8}',
  'body.ui-gallery-page .cursor-ring--hover{border-color:var(--ui-accent);opacity:.5}',
  'background: #07100f;',
  '.ui-study-grid--magi .ui-study-view--overlays {',
  '.ui-study-grid--magi .ui-study-view--components {',
  'grid-column: span 6;',
  'grid-column: 1 / -1;',
]) needText(css, token, `UI Gallery dark-polish CSS is missing: ${token}`);

forbid(css, /(?<!data-theme="dark"\][^{]*)\.ui-study-grid--magi \.ui-study-view > img\{[^}]*box-shadow:0 0 0 1px rgba\(242,242,233,\.24\)/,
  'Magi screen edge must remain dark-theme-only.');

need(count(html, /data-ui-study-view=/g) === 6, 'UI Gallery must contain two complete Ekos frames and four retained Magi study views.');
need(count(html, /<img\b[^>]*data-ui-study-image/g) === 6, 'Each retained UI Gallery view must use an authored static image.');
need(count(html, /<figcaption class="ui-study-caption">/g) === 4,
  'All four retained Magi studies must have concise visible captions.');
const magiOrder = [
  'magi-overview',
  'magi-overlays',
  'magi-components',
  'magi-node-states',
];
needText(html,
  "A high-fidelity refinement of an original client landing-page concept from 2018. The concept was not shipped; registration and booking are illustrative.",
  'Ekos summary must preserve the historical concept, later study, and non-shipment boundary.');
for (let index = 1; index < magiOrder.length; index += 1) {
  need(html.indexOf(`data-ui-study-view="${magiOrder[index - 1]}"`) < html.indexOf(`data-ui-study-view="${magiOrder[index]}"`),
    `Magi brief order must keep ${magiOrder[index - 1]} before ${magiOrder[index]}.`);
}
need(count(html, /loading="lazy"/g) >= 6, 'All retained UI Gallery study images must use deferred loading.');
for (const [asset, width, height] of [
  ['magi-overview.webp', 1440, 1024],
  ['magi-overlays.webp', 900, 640],
  ['magi-components.webp', 1200, 900],
  ['magi-node-states.webp', 1400, 200],
  ['ekos-desktop.webp', 1440, 3069],
  ['ekos-mobile.webp', 780, 7022],
]) need(new RegExp(`src="images/ui-gallery/${asset}"\\s+width="${width}"\\s+height="${height}"`).test(html),
  `UI Gallery must declare truthful intrinsic dimensions for ${asset}.`);
for (const asset of [
  'images/ui-gallery/magi-overview.webp',
  'images/ui-gallery/magi-architecture.webp',
  'images/ui-gallery/magi-overlays.webp',
  'images/ui-gallery/magi-color-type.webp',
  'images/ui-gallery/magi-components.webp',
  'images/ui-gallery/magi-node-states.webp',
  'images/ui-gallery/ekos-desktop.webp',
  'images/ui-gallery/ekos-mobile.webp',
  'images/ui-gallery/ekos-cover.webp',
]) need(fs.existsSync(asset), `Missing UI Gallery asset: ${asset}`);
forbid(html, /ekos-components|Components and provenance|original proof|source comparison/i,
  'UI Gallery must not retain the obsolete Ekos component board or an original-proof comparison.');
for (const removed of [/magi-architecture|System architecture|magi-architecture\.webp/i, /magi-color-type|Color and type|magi-color-type\.webp/i]) {
  forbid(html, removed, 'UI Gallery must omit the two owner-rejected cropped Magi figures and captions.');
  forbid(publicExport, removed, 'Public UI Gallery text export must omit the two removed Magi figures.');
  forbid(siteIndex, removed, 'Public site index must omit the two removed Magi figures.');
}
forbid(css, /ui-study-view--(?:architecture|color-type)/,
  'UI Gallery CSS must not retain layout roles for the two removed Magi figures.');
forbid(html, /<section[^>]*pikapp|data-ui-study-view="pikapp|images\/ui-gallery\/(?:pikapp|ekos-details)|Project glimpse|class="ui-study-number"|ui-study-notes|ui-study-boundary/i,
  'UI Gallery must remain a focused static gallery without Pi Kapp, duplicate detail variants, or editorial metadata blocks.');
forbid(html, /A place for screen studies|historical landing-page concept|returns to that visual character|read-only operations dashboard|work continuity and architecture|generalizing protected infrastructure/i,
  'UI Gallery copy must stay plainspoken and must not regress to generated case-study language.');
forbid(html, /revisited|returns to/i,
  'UI Gallery copy must not use generic revision narration beyond the exact Ekos provenance sentence.');
forbid(html, /<iframe|<form|<input|<video|data-dashboard|sessionStorage|password-gate/i,
  'UI Gallery must remain a public static-study route without embedded applications, forms, media players, or private-route logic.');
// Direct re-review confirmed the current six-board Magi edit remains sufficient;
// Inspector & Metrics repeats overview evidence and retains a large empty canvas.
forbid(html, /Inspector and metrics|sample dates|last checkpoint/i,
  'UI Gallery must omit the visually redundant Inspector board and stale internal review language.');
forbid(html, /static and sanitized|sanitized dark|sanitized read-only|private dashboard experiment/i,
  'Viewer-facing copy must not misclassify fictional sample content as private or sanitized.');
forbid(html, /Windows \+ WSL|Hermes Gateway|Sol \/ Orchestrator|Gemini fallback|Life OS|GreekLifeEDU|Good afternoon, Brad|>BT<|>AM<|>JR<|>TK</i,
  'UI Gallery contains a private topology or illustrative personal marker.');
forbid(html, /\b(?:was|were|is) (?:shipped|launched|implemented|published)|conversion|outcome|responsive deliverable/i,
  'UI Gallery copy contains an unsupported delivery or outcome claim.');
forbid(html, /—/, 'UI Gallery copy must not use em dashes.');

for (const token of [
  '.ui-gallery-page',
  '.ui-gallery-hero h1 {',
  'font-weight: 600;',
  'font-size: clamp(3.7rem, 17vw, 5.9rem);',
  '.ui-study-grid',
  '.ui-study--magi',
  '.ui-study-grid--magi',
  '.ui-study-view--ekos-desktop',
  '.ui-study-view--ekos-mobile',
  '.ui-scroll-screen',
  'overflow-y: auto;',
  'aspect-ratio: 16 / 10;',
  'height: auto;',
  '.ui-study-caption {',
  'border: 0;',
  'html[data-theme="dark"] .ui-gallery-page',
  '@media (max-width: 760px)',
  'grid-template-columns: 1fr;',
  'prefers-reduced-motion: reduce',
]) needText(css, token, `UI Gallery CSS is missing: ${token}`);
forbid(css, /html\[data-lens="dark"\]/, 'UI Gallery must use the shared data-theme attribute rather than a stale data-lens selector.');
forbid(css, /ui-study--teaser|ui-study-grid--teaser|ui-study-teaser-copy|ui-study-link|ui-study-notes|ui-study-boundary|ui-study-view--mobile|ui-study-view--details/,
  'UI Gallery CSS must not retain obsolete teaser, metadata, or duplicate Ekos-view styling.');

for (const token of [
  'ekos-con-landing-page.png',
  'ekos-con-mobile.png',
  'Magi — Dashboard Overview.png',
  'Magi — Architecture Canvas.png',
  'Magi — Overlay Patterns.png',
  'Magi — Color & Type System.png',
  'Magi — Component Studies.png',
  'Magi — Node State Specimens.png',
  '"ekos-mobile.webp"',
  '"magi-overview.webp"',
  '"magi-architecture.webp"',
  '"magi-overlays.webp"',
  '"magi-color-type.webp"',
  '"magi-components.webp"',
  '"magi-node-states.webp"',
]) needText(assetBuilder, token, `UI Gallery asset builder is missing approved source/output: ${token}`);
forbid(assetBuilder, /Ekos V2|ekos-hifi-|ekos-components/, 'UI Gallery asset builder must not retain V2 or component-board sources.');
forbid(assetBuilder, /ekos-cleanup-details|ekos-details\.webp|Magi — Inspector & Metrics\.png|magi-inspector-metrics\.webp/,
  'UI Gallery asset builder must omit obsolete Ekos details and the redundant Magi Inspector board.');
for (const omittedAsset of [
  'images/ui-gallery/magi-inspector-metrics.webp',
]) need(!fs.existsSync(omittedAsset), `Omitted UI Gallery asset must not exist: ${omittedAsset}`);

// These hashes lock the exact approved fictional design-study derivatives.
const reviewedPublicAssetHashes = {
  'images/ui-gallery/ekos-desktop.webp': '7672651d1db04d5a21e111df36b92585a1305452021de13aa09c97d736316c80',
  'images/ui-gallery/ekos-mobile.webp': '21a3df3f9e08c509accaa390d847904044f15aa9f125cccbf458fc1baa574c0d',
  'images/ui-gallery/ekos-cover.webp': 'ca3025330424f1e21d35f7d5538673a2b86cb6ee60193d0535ee64ce8daff816',
  'images/ui-gallery/magi-overview.webp': '9c7bcc9de0a443fc144f1e8e37940a40abf9727009f9ebaabf549702133e0007',
  'images/ui-gallery/magi-architecture.webp': 'c56bff57c5a39b77082f260b22fd2c9c82a42dd9a34de54de1bfac031008fc3d',
  'images/ui-gallery/magi-overlays.webp': 'ebadaaf0561c8b5158dbe870876157eb916123b907da529a2d0a0463d30c5bd9',
  'images/ui-gallery/magi-color-type.webp': '7f23603b9e5627ca2d318fc313707481d361103e2387656b36f7c20f2a315cec',
  'images/ui-gallery/magi-components.webp': '5d5137c55a18cd9338f04d5852dab7dc6d6356de534fa137532c2c2feb5a3b0f',
  'images/ui-gallery/magi-node-states.webp': '492f6b0482904520eeaa20fa0c7f37d04607e6720b56fd00794310036ce59cf4',
};
for (const [asset, expectedHash] of Object.entries(reviewedPublicAssetHashes)) {
  if (!fs.existsSync(asset)) {
    failures.push(`Missing independently reviewed public asset: ${asset}`);
    continue;
  }
  const actualHash = createHash('sha256').update(fs.readFileSync(asset)).digest('hex');
  need(actualHash === expectedHash, `${asset} does not match its independently reviewed public-safety hash.`);
}

const uiProject = manifest.projects.find(project => project.slug === 'uigallery');
need(Boolean(uiProject), 'data/projects.json must include uigallery.');
if (uiProject) {
  for (const [key, value] of Object.entries({
    title: 'Interface Studies',
    url: 'uigallery.html',
    type: 'gallery',
    nav: true,
    homepage: true,
    protected: false,
    noindex: false,
    sitemap: true,
    chapter: '03',
    chapterTitle: 'And some galleries.',
    description: 'Static screen studies focused on interface craft and visual refinement.',
  })) need(uiProject[key] === value, `uigallery manifest ${key} must equal ${String(value)}.`);
  need(uiProject.images?.[0]?.src === 'images/ui-gallery/ekos-cover.webp', 'UI Gallery homepage card must use the Ekos cover asset.');
  need(uiProject.images?.[0]?.width === 1366 && uiProject.images?.[0]?.height === 939,
    'UI Gallery manifest must declare the cover asset at its truthful 1366x939 dimensions.');
}
for (const slug of ['artillustration', 'graphicgallery']) {
  const project = manifest.projects.find(item => item.slug === slug);
  need(project?.chapterTitle === 'And some galleries.', `${slug} must share the renamed gallery chapter.`);
}
need(shell.pages.includes('uigallery.html'), 'Shared shell must register uigallery.html.');
needText(index, '<h3 class="featured-galleries-title">And some galleries.</h3>', 'Homepage must show the renamed gallery chapter.');
needText(index, 'aria-label="Art, graphic design, and interface studies"', 'Homepage gallery group needs a clear accessible label.');
need(count(index, /featured-item--gallery/g) === 3, 'Homepage must contain exactly three gallery cards.');
needText(index, 'href="uigallery.html"', 'Homepage and generated navigation must link to UI Gallery.');
needText(index, '<h2 class="featured-item-title">Interface Studies</h2>', 'Homepage must use the approved Interface Studies public title.');
needText(index, 'src="images/ui-gallery/ekos-cover.webp" width="1366" height="939"',
  'Generated homepage must declare the truthful 1366x939 Ekos cover dimensions.');
needText(sitemap, '<loc>https://www.victortrandesign.com/uigallery</loc>', 'Sitemap must include /uigallery.');
needText(exporter, "'uigallery.html'", 'Public Markdown exporter must include uigallery.html.');
needText(read('content/uigallery.md'), 'source: "uigallery.html"', 'Generated public Markdown must include the UI Gallery source.');
needText(read('content/uigallery.md'), 'Interface Studies', 'Generated public Markdown must use the Interface Studies public name.');
needText(read('content/site-index.json'), '"source": "uigallery.html"', 'Generated site index must include UI Gallery.');
needText(read('content/site-index.json'), '"title": "Interface Studies"', 'Generated site index must use the Interface Studies public name.');
need(packageJson.scripts?.['check:ui-gallery'] === 'node scripts/check-ui-gallery-integration.mjs', 'package.json must register check:ui-gallery.');
need(Boolean(browserContract), 'The enforced visual-archive browser harness must exist.');
needText(browserContract, "ui: {", 'The enforced visual-archive browser harness must define the UI Gallery route.');
needText(browserContract, "file: 'uigallery.html'", 'The browser harness must target uigallery.html.');
need(packageJson.scripts?.['check:ui-gallery-browser'] === 'node scripts/check-visual-archives-browser.mjs ui', 'package.json must register a focused UI Gallery browser command.');
needText(preflight, 'check:visual-archives-lightbox-browser', 'Preflight must run the all-gallery browser harness that includes UI Gallery.');
needText(workflow, 'check:visual-archives-lightbox-browser', 'Health workflow must run the all-gallery browser harness that includes UI Gallery.');
needText(workflow, '--exclude "${{ github.event_name == \'pull_request\' && \'www.victortrandesign.com/uigallery\' || \'a^\' }}"',
  'Health workflow must defer the not-yet-live UI Gallery canonical URL only on pull requests.');
needText(sharedShellContract, "'uigallery.html'", 'Shared shell contract must include UI Gallery in the route set.');
needText(a11yContract, "'uigallery.html'", 'Accessibility quick-wins contract must include UI Gallery.');
needText(assetRequirements, 'Pillow==12.3.0', 'UI Gallery asset requirements must pin the verified Pillow version.');
needText(assetRequirements, '--ekos-source <approved-ekos-preview-directory>', 'UI Gallery asset reproduction command must name the approved Ekos source argument.');
needText(assetRequirements, '--expanded-source <audited-expanded-study-kit>', 'UI Gallery asset reproduction command must name the audited expanded-study source argument.');
need(assetBuilder.indexOf('args = parse_args()') < assetBuilder.indexOf('from PIL import Image'),
  'UI Gallery asset builder must defer Pillow import until after argument parsing so --help works without installed dependencies.');

if (failures.length) {
  console.error(`UI GALLERY CONTRACT FAILED (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('UI GALLERY CONTRACT PASSED');
console.log('- complete desktop/mobile Ekos frames, four retained Magi studies, rejected crops removed, and CI wiring pass');
