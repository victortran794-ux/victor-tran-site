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

need(Boolean(html), 'uigallery.html must exist.');
need(Boolean(css), 'css/ui-gallery.css must exist.');

for (const token of [
  '<title>Interface Studies | Victor Tran</title>',
  '<link rel="canonical" href="https://www.victortrandesign.com/uigallery">',
  '<link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png">',
  '<link rel="icon" type="image/png" sizes="192x192" href="images/favicon-192.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png">',
  '<body class="visual-archive-page ui-gallery-page">',
  '<main class="page-content" id="main-content" tabindex="-1" data-archive="ui-gallery">',
  '<meta property="og:title" content="Interface Studies | Victor Tran">',
  '<meta name="twitter:title" content="Interface Studies | Victor Tran">',
  '<p class="ui-gallery-kicker">Interface Studies</p>',
  '<h1>Interfaces, in view.</h1>',
  'A few interface studies and small experiments I liked enough to keep around.',
  '<section class="ui-study ui-study--ekos archive-primary" aria-labelledby="ekos-study-title">',
  '<h2 id="ekos-study-title">Ekos Con 2018</h2>',
  'An event-site concept with a cleaner interface treatment.',
  'Scroll through the screen to see the full page.',
  'Registration is illustrative.',
  'data-ui-study-view="ekos-desktop"',
  'data-ui-scroll-screen',
  'tabindex="0"',
  '<section class="ui-study ui-study--magi" aria-labelledby="magi-study-title">',
  '<h2 id="magi-study-title">Magi interface studies</h2>',
  'A private dashboard experiment built from a small set of reusable UI pieces.',
  'This public version is static and sanitized.',
  'data-ui-study-view="magi-overview"',
  '<strong>Dashboard overview</strong>',
  'Illustrative work states. No live operational connection.',
  'data-ui-study-view="magi-architecture"',
  '<strong>System architecture</strong>',
  "Sanitized read-only map of the system's parts and relationships.",
  '<div class="cursor-dot" aria-hidden="true"></div>',
  '<div class="cursor-ring" aria-hidden="true"></div>',
  '<script src="js/main.js"></script>',
]) needText(html, token, `UI Gallery is missing: ${token}`);

for (const token of [
  'body.ui-gallery-page .cursor-dot{background:var(--ui-accent);box-shadow:0 0 0 1px #101820}',
  'body.ui-gallery-page .cursor-ring{border-color:var(--ui-accent);box-shadow:0 0 0 1px rgba(16,24,32,.9);opacity:.8}',
  'body.ui-gallery-page .cursor-ring--hover{border-color:var(--ui-accent);opacity:.5}',
  'html[data-theme="dark"] .ui-study-grid--magi .ui-study-view > img{box-shadow:0 0 0 1px rgba(242,242,233,.24)}',
]) needText(css, token, `UI Gallery dark-polish CSS is missing: ${token}`);

forbid(css, /(?<!data-theme="dark"\][^{]*)\.ui-study-grid--magi \.ui-study-view > img\{[^}]*box-shadow:0 0 0 1px rgba\(242,242,233,\.24\)/,
  'Magi screen edge must remain dark-theme-only.');

need(count(html, /data-ui-study-view=/g) === 3, 'UI Gallery must contain exactly three static study views.');
need(count(html, /<img\b[^>]*data-ui-study-image/g) === 3, 'Each UI Gallery view must be a static image.');
need(count(html, /<figcaption class="ui-study-caption">/g) === 2,
  'The two Magi studies must have concise visible captions.');
need(html.indexOf('data-ui-study-view="magi-overview"') < html.indexOf('data-ui-study-view="magi-architecture"'),
  'The dashboard overview must lead the Magi study before the supporting architecture view.');
need(count(html, /loading="lazy"/g) >= 3, 'All UI Gallery study images must use deferred loading.');
for (const [asset, width, height] of [
  ['magi-overview.webp', 1440, 1000],
  ['magi-architecture.webp', 1440, 1000],
  ['ekos-desktop.webp', 1320, 2715],

]) need(new RegExp(`src="images/ui-gallery/${asset}"\\s+width="${width}"\\s+height="${height}"`).test(html),
  `UI Gallery must declare truthful intrinsic dimensions for ${asset}.`);
for (const asset of [
  'images/ui-gallery/magi-overview.webp',
  'images/ui-gallery/magi-architecture.webp',
  'images/ui-gallery/ekos-desktop.webp',
  'images/ui-gallery/ekos-cover.webp',
]) need(fs.existsSync(asset), `Missing UI Gallery asset: ${asset}`);
forbid(html, /ekos-components|data-ui-study-view="components"|Components and provenance|component views?|original proof|source comparison/i,
  'UI Gallery must not retain the obsolete component board or an original-proof comparison.');
forbid(html, /<section[^>]*pikapp|data-ui-study-view="pikapp|images\/ui-gallery\/(?:pikapp|ekos-mobile|ekos-details)|Project glimpse|class="ui-study-number"|ui-study-notes|ui-study-boundary/i,
  'UI Gallery must remain a minimal three-screen gallery without Pi Kapp, duplicate Ekos variants, or editorial metadata blocks.');
forbid(html, /A place for screen studies|historical landing-page concept|returns to that visual character|read-only operations dashboard|work continuity and architecture|generalizing protected infrastructure/i,
  'UI Gallery copy must stay plainspoken and must not regress to generated case-study language.');
forbid(html, /revisited|refinement|returns to/i,
  'UI Gallery copy must not narrate revision history when the screens can carry it.');
forbid(html, /<iframe|<form|<input|<video|data-dashboard|sessionStorage|password-gate/i,
  'UI Gallery must remain a public static-study route without embedded applications, forms, media players, or private-route logic.');
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
  '.ui-study-view--desktop',
  '.ui-scroll-screen',
  'overflow-y: auto;',
  'aspect-ratio: 16 / 10;',
  'grid-column: span 8;',
  'grid-column: span 4;',
  '.ui-study-caption {',
  'border: 0;',
  'html[data-theme="dark"] .ui-gallery-page',
  '@media (max-width: 760px)',
  'grid-template-columns: 1fr;',
  'prefers-reduced-motion: reduce',
]) needText(css, token, `UI Gallery CSS is missing: ${token}`);
forbid(css, /html\[data-lens="dark"\]/, 'UI Gallery must use the shared data-theme attribute rather than a stale data-lens selector.');
forbid(css, /ui-study-view--components/, 'UI Gallery CSS must not retain the obsolete component-view role.');
forbid(css, /ui-study--teaser|ui-study-grid--teaser|ui-study-teaser-copy|ui-study-link|ui-study-notes|ui-study-boundary|ui-study-view--mobile|ui-study-view--details/,
  'UI Gallery CSS must not retain obsolete teaser, metadata, or duplicate Ekos-view styling.');

for (const token of [
  'ekos-polished-desktop-v3-3.png',

  '01-magi-dashboard-overview-public.png',
  '02-magi-architecture-public.png',
  '"magi-overview.webp"',
]) needText(assetBuilder, token, `UI Gallery asset builder is missing approved source/output: ${token}`);
forbid(assetBuilder, /Ekos V2|ekos-hifi-|ekos-components/, 'UI Gallery asset builder must not retain V2 or component-board sources.');
forbid(assetBuilder, /ekos-polished-mobile|ekos-cleanup-details|ekos-mobile\.webp|ekos-details\.webp/,
  'UI Gallery asset builder must not retain duplicate Ekos mobile/detail outputs.');

// These hashes lock the exact independently pixel-reviewed public derivatives.
// Update only after rerunning the derivative safety scan and visual privacy review.
const reviewedPublicAssetHashes = {
  'images/ui-gallery/magi-overview.webp': 'b044e656461e24ff9cc821774ecf3e63b182cb09e6ee600292be64a4ef6c775e',
  'images/ui-gallery/magi-architecture.webp': '4aa214da61b5901d1a35f9761f7658c628affd62bd54a62dd0ea86731f78e2c7',
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
console.log('- one complete scrollable Ekos page, overview-led 65/35 sanitized Magi pair, concise captions, privacy boundaries, and CI wiring pass');
