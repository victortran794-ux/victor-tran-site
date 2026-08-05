#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    return Buffer.alloc(0);
  }
  return fs.readFileSync(absolutePath);
};
const text = (relativePath) => read(relativePath).toString('utf8');
const sha256 = (relativePath) => crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const count = (value, needle) => value.split(needle).length - 1;

const frozenFiles = {
  'ibmcloud.html': '80a71a6fd316d903f13ba7e2e197ce9cc5a035122e7c78cc9dbf53ae9bede38f',
  'pci.html': '1f557398924041598abfbd22fd5e4374ee9402c691ef1f28770c519ca022e74d',
  'pikappapp.html': '33dfa2bb4b272f1ed578e9796cefd8978580f562e120d48892ae7d2b53fc18d8',
  'css/password-gate.css': '824beb80b8a4c11d30d675a99b72bc97880c94f10722319578bb2e1fd2f8788e',
  'js/password-gate.js': '5ecd4ebcc66f6673aafc4cc940c142d5eca9dbd872ea93a9529582d0412e8a77',
  'js/main.js': '3c1f3e755a200c1d56b51b137127b431d188a8c4b42707d086b4ab77091336cc',
};
for (const [relativePath, expected] of Object.entries(frozenFiles)) {
  if (sha256(relativePath) !== expected) fail(`${relativePath} changed outside the approved IBM Patterns scope`);
}

const assetHashes = {
  'images/ibm-patterns-case-study/hero-opening-support.webp': '1c0e25d904a30a10ba76801e5243ebad774c5bea864cd4f0537006be43d7faa4',
  'images/ibm-patterns-case-study/ibm-contact-before-form.webp': 'd14e3a1f0335327c08304f991bb1a64b8ca5165862a529d5b4ef336c1a13a380',
  'images/ibm-patterns-case-study/midfi-route-directory.png': '35c51fe1377c046b6a45e48683d4e4822dffd3a6622abcb5ef03341cd78dfda5',
  'images/ibm-patterns-case-study/midfi-topic-cards-form.png': 'e841c2f20d1bae33728395f4e3a89c705e443d984f6e0d1fd21880c08ed66f96',
  'images/ibm-patterns-case-study/midfi-routing-grid.png': 'dcb37779f44ca04e31d147e162ac0042c8bba74298b8a01f1e6f2745e073ffb0',
  'images/ibm-patterns-case-study/midfi-human-fallback.png': 'f291656b729ea86cb43164981372df987a8de2aa2b85fe18fb3fe1016b8e5927',
  'images/ibm-patterns-case-study/hero-study-collaboration.webp': 'ce2bb73702b9d758caf86d1fb3a00f01dd7d0987520f2618e395c06e437ebca6',
  'images/ibm-patterns-case-study/hero-study-welcome.webp': 'af96e3127c5b3eba449d39be97512c730b8b77d3058340108fa776575061931d',
  'images/ibm-patterns-case-study/sales-routes.webp': '3f71b06906bfbddf3499853e62de75f420998bb784e31abcde9b940920ff80f9',
  'images/ibm-patterns-case-study/route-breadth.webp': 'c7ce98a7285fa91b516e6f799d2860e2efd1b44782ca0d382c8fffd3da71b2eb',
  'images/ibm-patterns-case-study/human-fallback.webp': 'be4f44f44dd400618b9d997f5c7603bd555aa8c90fa3a5ea2bc5bbd76f5b5313',
  'images/ibm-patterns-case-study/final-playback-slide-36.jpg': '155ab4fb2ce49818e55a336bdf197497b961dc7f50db14cfdb990b99037b4dfe',
};
for (const [relativePath, expected] of Object.entries(assetHashes)) {
  if (sha256(relativePath) !== expected) fail(`${relativePath} does not match the approved evidence checksum`);
}

const html = text('ibm-patterns.html');
const css = text('css/ibm-patterns.css');
const js = text('js/ibm-patterns.js');
if (/^\ufeff?\d+\|/m.test(html)) fail('ibm-patterns.html contains line-number metadata from a file-reading tool');
const packageJson = JSON.parse(text('package.json'));
if (packageJson.scripts?.['check:ibm-patterns'] !== 'node scripts/check-ibm-patterns-integration.mjs') fail('package.json missing IBM Patterns integration command');
if (packageJson.scripts?.['check:ibm-patterns-browser'] !== 'node scripts/check-ibm-patterns-browser.mjs') fail('package.json missing IBM Patterns browser command');
if (!text('scripts/preflight.sh').includes('npm run check:ibm-patterns')) fail('preflight must run the IBM Patterns integration contract');
for (const required of [
  '<link rel="canonical" href="https://www.victortrandesign.com/ibm-patterns">',
  '<meta name="robots" content="noindex,nofollow">',
  "if(sessionStorage.getItem('vtd-unlock')!=='ok')",
  '<link rel="stylesheet" href="css/password-gate.css">',
  '<script src="js/password-gate.js" defer></script>',
  '<link rel="stylesheet" href="css/ibm-patterns.css">',
  '<main class="page-content patterns-page" id="main-content" tabindex="-1">',
  '<!-- generated:site-shell-header:start -->',
  '<!-- generated:site-shell-header:end -->',
  '<!-- generated:project-nav:start -->',
  '<!-- generated:project-nav:end -->',
  '<!-- generated:site-shell-footer:start -->',
  '<!-- generated:site-shell-footer:end -->',
  '<p class="section-label sr-only">Product Design</p>',
  'A route to someone real.',
  'Six weeks to imagine a better front door.',
  'Useful if you already knew IBM.',
  'Make the next destination visible.',
  'How the routing model took shape.',
  'Making the front door feel more human.',
  'The playback was part of the design.',
  'What carried forward.',
  'If I revisited it now.',
  'This is not a designed, tested, or implemented AI system.',
  '<script src="js/ibm-patterns.js"></script>',
]) {
  if (!html.includes(required)) fail(`ibm-patterns.html missing required integration marker: ${required}`);
}
if (count(html, '<main') !== 1) fail('ibm-patterns.html must contain exactly one main');
if (count(html, '<h1') !== 1) fail('ibm-patterns.html must contain exactly one h1');
if (count(html, 'class="patterns-process-item') !== 4) fail('IBM Patterns must retain exactly four mid-fi process artifacts');
if (count(html, 'class="patterns-hero-study') !== 2) fail('IBM Patterns must retain exactly two humanization hero studies');
if (count(html, 'class="patterns-atlas-item') !== 3) fail('IBM Patterns must retain exactly three final interface atlas views');
if (count(html, 'images/ibm-patterns-case-study/') !== 12) fail('IBM Patterns must reference exactly twelve approved evidence images');
if (!html.includes('loading="lazy" decoding="async"')) fail('IBM Patterns evidence media must use lazy asynchronous decoding');

for (const forbidden of [
  '135,000', '135k', '13,000', '13k',
  'Every path had a destination', 'no dead ends', 'The structure held', 'A page that finally did its job',
  'User testing confirmed', 'production integrations', 'shipped', 'adopted',
  'Private humanized story', 'local review', 'not approved for production',
  'patterns-rogue', 'patterns-team', '<style>',
  'assets/',
]) {
  if (html.toLowerCase().includes(forbidden.toLowerCase())) fail(`ibm-patterns.html retained forbidden claim/review text: ${forbidden}`);
}

for (const required of [
  '.patterns-page',
  'html[data-theme="dark"] .patterns-page',
  '@media (prefers-reduced-motion: reduce)',
  '@media (max-width: 900px)',
  '@media (max-width: 760px)',
  'min-height: 44px',
  'scroll-margin-top:',
]) {
  if (!css.includes(required)) fail(`css/ibm-patterns.css missing required contract: ${required}`);
}
for (const forbidden of ['.private-bar', '.local-warning', 'data:image/']) {
  if (css.includes(forbidden)) fail(`css/ibm-patterns.css retained private-review implementation: ${forbidden}`);
}
for (const required of [
  "document.getElementById('patterns-motion-toggle')",
  "matchMedia('(prefers-reduced-motion: reduce)')",
  "document.addEventListener('visibilitychange'",
]) {
  if (!js.includes(required)) fail(`js/ibm-patterns.js missing required motion behavior: ${required}`);
}
if (js.includes('innerHTML') || js.includes('eval(') || js.includes('fetch(')) fail('IBM Patterns script must not inject HTML or call external services');

const manifest = JSON.parse(text('data/projects.json'));
const project = manifest.projects.find((entry) => entry.slug === 'ibm-patterns');
const safeDescription = "A six-week IBM Patterns incubator project exploring how IBM.com could guide people toward a useful route before a general contact form.";
const expectedProject = { title: 'IBM Patterns: Contact Us', url: 'ibm-patterns.html', description: safeDescription, type: 'primary', nav: true, homepage: true, protected: true, noindex: true, sitemap: false };
for (const [key, value] of Object.entries(expectedProject)) {
  if (project?.[key] !== value) fail(`data/projects.json IBM Patterns ${key} drifted`);
}
for (const relativePath of ['data/projects.json', 'index.html', 'content/index.md', 'scripts/check-homepage-system-alignment.py', 'archive/a2ui/examples/recruiter.json']) {
  const surface = text(relativePath);
  for (const forbidden of ['135,000', '135k', '13,000', '13k']) {
    if (surface.toLowerCase().includes(forbidden.toLowerCase())) fail(`${relativePath} retained unsupported IBM Patterns metric: ${forbidden}`);
  }
}
for (const relativePath of ['data/projects.json', 'index.html', 'content/index.md', 'scripts/check-homepage-system-alignment.py', 'archive/a2ui/examples/recruiter.json']) {
  if (!text(relativePath).includes(safeDescription)) fail(`${relativePath} missing the bounded IBM Patterns listing description`);
}
const exportPolicy = JSON.parse(text('data/content-export-policy.json'));
if (!exportPolicy.protectedPages.some((entry) => entry.source === 'ibm-patterns.html' && entry.slug === 'ibm-patterns')) fail('IBM Patterns protected export policy drifted');
if (!text('robots.txt').includes('Disallow: /ibm-patterns')) fail('robots.txt must continue disallowing IBM Patterns');
if (text('sitemap.xml').includes('ibm-patterns')) fail('sitemap must continue omitting IBM Patterns');

if (failures.length) {
  console.error('IBM PATTERNS INTEGRATION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`IBM PATTERNS INTEGRATION CONTRACT: PASS assets=${Object.keys(assetHashes).length} process=4 heroes=2 atlas=3`);
