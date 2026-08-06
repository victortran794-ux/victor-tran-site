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
    return '';
  }
  return fs.readFileSync(absolutePath);
};
const text = (relativePath) => read(relativePath).toString('utf8');
const sha256 = (relativePath) => crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const count = (value, needle) => value.split(needle).length - 1;
const size = (relativePath) => read(relativePath).length;

const frozenFiles = {
  'ibmcloud.html': '80a71a6fd316d903f13ba7e2e197ce9cc5a035122e7c78cc9dbf53ae9bede38f',
  'pci.html': '538337937e3d414313bc0dab4904edcc4002807a2f9ba080aaf4eaf913ab8895',
  'pikappapp/demo.html': 'daf32161b516f022bc909e0b7a4ab48b227ec3b25e74f52a842a706538d41c18',
  'pikappapp/demo.bundle.css': '76eefcf312f2a097070f29ed9e3fbeaa5a3125ba2365178a09cc0e81c26a7ff5',
  'pikappapp/demo.bundle.js': '50b8336875a9181ccad7d6db2ce52f48cb7e0ee602aa0c75d2a53040fe62d22c',
};
for (const [relativePath, expected] of Object.entries(frozenFiles)) {
  const actual = sha256(relativePath);
  if (actual !== expected) fail(`${relativePath} changed outside the approved Pi Kapp page scope`);
}

const assetHashes = {
  'images/pikapp-case-study/belltower-expansion.jpg': 'b977af8df532d2562ceeb0d9db85e7e985ceaa9e583b4940f37b71dac4f5c77f',
  'images/pikapp-case-study/expansion-cover.png': 'e8cd56519fecd871074b4b2f7b8ff91a3572bf17981e744efa2027a93ae388c4',
  'images/pikapp-case-study/wireframes.png': 'bb4375af22d4bace1a26023b9b03b220ee2b3843a18f663357c62f5fec360f60',
  'images/pikapp-case-study/sitemap.png': 'd2661fc1909dbcab8d08d7e3868006fa67777e705b0d95ed4c93ea93e43ee90e',
  'images/pikapp-case-study/app-icon.png': 'b10917b50cb2e01cc5f981d9376d31ad242f403a381b1ab555861fc52e3ca22c',
  'images/pikapp-case-study/login-screen.png': '685e3d451f70bf0c19902bb5a112998b77e82228584ed346064cfc5b528cab62',
  'images/pikapp-case-study/member.png': 'd48a66dabd278383eec5d12ec667027292c3ce0b9f5ed38a6be9052ab9b3402d',
  'images/pikapp-case-study/task-expand.png': '502d9f981ae9c1dc97b114a9ea8273e0d4d59796b7db604d231a77b9ce693ec7',
  'images/pikapp-case-study/v2-today-light.png': '209e14acf78cd9e6007f9814a4f432872d60e1f830646f3f9411e33aba482e29',
  'images/pikapp-case-study/v2-responsibility-detail-dark.png': 'a9b8821fc372c7f4185a97e2cddd9cc7b41de429f6e7361fca94c8cf0a78db14',
  'images/pikapp-case-study/v2-chapter-light.png': '96140e5afee9030d2fb09e6aacca5ac82bf7d59debbf1b686a296366c5551b65',
  'images/pikapp-case-study/pattern-dark-blue.svg': 'c351c176e21cba2ec26506c444018502b9214ddd49036b1f2d07f6a5c7bb5436',
};
for (const [relativePath, expected] of Object.entries(assetHashes)) {
  const actual = sha256(relativePath);
  if (actual !== expected) fail(`${relativePath} does not match the approved evidence checksum`);
}

const html = text('pikappapp.html');
const css = text('css/pikappapp.css');
const js = text('js/pikappapp.js');
const workflow = text('.github/workflows/health-check.yml');

for (const required of [
  '<link rel="canonical" href="https://www.victortrandesign.com/pikappapp">',
  '<link rel="stylesheet" href="css/pikappapp.css">',
  '<main class="page-content pikapp-page" id="main-content" tabindex="-1">',
  '<!-- generated:site-shell-header:start -->',
  '<!-- generated:site-shell-header:end -->',
  '<!-- generated:project-nav:start -->',
  '<!-- generated:project-nav:end -->',
  '<!-- generated:site-shell-footer:start -->',
  '<!-- generated:site-shell-footer:end -->',
  '<p class="section-label sr-only">Design</p>',
  'Concept · not shipped',
  'From expansion work to one member view.',
  'Every year looked a little different. The same stuff still had to get done.',
  'There was already a system. It was just spread everywhere.',
  'It still needed to look like Pi Kappa Phi.',
  'The earlier concepts showed how the member view was taking shape.',
  'A formative start, not a finished product.',
  'What I might do with the app today.',
  'Three things I would carry forward',
  'Reduce friction',
  'Share context, not scores',
  'Test the model before polishing it',
  'Illustrative and unvalidated.',
  'A small direction study, not a complete app, current product proposal, or live service.',
  '<script src="js/pikappapp.js"></script>',
]) {
  if (!html.includes(required)) fail(`pikappapp.html missing required integration marker: ${required}`);
}

if (count(html, '<main') !== 1) fail('pikappapp.html must contain exactly one root main');
if (count(html, '<h1') !== 1) fail('pikappapp.html must contain exactly one h1');
if (count(html, 'class="future-principle"') !== 3) fail('Pi Kapp coda must contain exactly three future principles');
if ([...html.matchAll(/class="[^"]*\bcoda__screen(?:\s|\")/g)].length !== 3) fail('Pi Kapp coda must contain exactly three V2 screens');
if (count(html, 'class="phone-slide') !== 3) fail('Earlier-concept viewer must contain exactly three historical screens');
if (!html.includes('loading="lazy" decoding="async"')) fail('Pi Kapp evidence media must use lazy asynchronous decoding');
if (/<meta\s+name="robots"\s+content="noindex/i.test(html)) fail('public Pi Kapp route must remain indexable');
if (!text('sitemap.xml').includes('/pikappapp')) fail('public Pi Kapp route must remain in sitemap.xml');
if (/Disallow:\s*\/pikappapp/i.test(text('robots.txt'))) fail('robots.txt must not disallow the public Pi Kapp route');

for (const required of [
  'expansion-archive-trigger',
  'aria-haspopup="dialog"',
  'aria-controls="expansion-archive-dialog"',
  'aria-label="Open archive: Expansion Portfolio"',
  '<dialog class="archive-dialog" id="expansion-archive-dialog"',
  'aria-labelledby="expansion-archive-title"',
  'data-archive-master="cover"',
  'data-archive-master="context"',
  'data-archive-view="cover"',
  'data-archive-view="context"',
  'aria-live="polite"',
  'images/pikapp-case-study/expansion-cover-preview.jpg',
  'data-src="images/pikapp-case-study/expansion-cover-detail.jpg"',
]) {
  if (!html.includes(required)) fail(`Pi Kapp archival view missing: ${required}`);
}
if (html.includes('<strong>Expansion context</strong>')) fail('expansion photo repeats the section label');
if (html.includes('<strong>Expansion packet cover</strong>')) fail('expansion artifact repeats its caption hierarchy');
if (/src="images\/pikapp-case-study\/expansion-cover\.png"/.test(html)) fail('3.3 MB source cover must not load in the initial page');
if (/<button[^>]+data-archive-view[^>]*>[\s\S]*?<img[^>]+\ssrc=/i.test(html)) fail('archive view thumbnails must defer their image sources until the dialog opens');
if (size('images/pikapp-case-study/expansion-cover-preview.jpg') > 350_000) fail('expansion cover preview exceeds 350 KB');
if (size('images/pikapp-case-study/expansion-cover-detail.jpg') > 900_000) fail('expansion cover detail exceeds 900 KB');

for (const forbidden of [
  'Private page review',
  'Private integrated review',
  'Private comparison',
  'KEEP / ADJUST / REJECT',
  'Requested decision',
  'data-view-button',
  'data-theme-button',
  'motion-button',
  'Try the prototype',
  'same flow, ranked',
  'ranked percent',
  'current rank against',
  'browser-side Babel',
]) {
  if (html.toLowerCase().includes(forbidden.toLowerCase())) fail(`pikappapp.html retained forbidden review/legacy copy: ${forbidden}`);
}
if (/\bAI\b/i.test(html)) fail('Pi Kapp page must not add overt AI framing');
if (/src="assets\//.test(html) || /url\(["']?assets\//.test(css)) fail('Pi Kapp integration must use repository-owned public asset paths');

for (const required of [
  '.pikapp-page',
  'html[data-theme="dark"] .pikapp-page',
  '@media (prefers-reduced-motion: reduce)',
  '@media (max-width: 800px)',
  '@media (max-width: 430px)',
  'min-height: 44px',
  'images/pikapp-case-study/pattern-dark-blue.svg',
  'scroll-margin-top:',
  '.archive-dialog',
  '.archive-trigger',
  '.archive-master',
  'object-fit:contain',
  '.pikapp-page .expansion-artifact__sheet{transition:none}',
]) {
  if (!css.includes(required)) fail(`css/pikappapp.css missing required contract: ${required}`);
}
for (const forbidden of ['.reviewbar', '.boundary__inner', '.decision']) {
  if (css.includes(forbidden)) fail(`css/pikappapp.css retained private-review selector: ${forbidden}`);
}

for (const required of [
  "document.querySelector('[data-phone-story]')",
  "document.getElementById('phone-prev')",
  "document.getElementById('phone-next')",
  "matchMedia('(prefers-reduced-motion: reduce)')",
  "document.addEventListener('visibilitychange'",
  "document.querySelector('[data-archive-dialog]')",
  'showModal()',
  'returnFocus.focus()',
  "document.body.classList.add('archive-open')",
  "document.body.classList.remove('archive-open')",
]) {
  if (!js.includes(required)) fail(`js/pikappapp.js missing required viewer behavior: ${required}`);
}
if (js.includes('innerHTML') || js.includes('eval(') || js.includes('fetch(')) fail('Pi Kapp viewer script must not inject HTML or call external services');
if (!workflow.includes('npm run check:pikapp-page')) fail('health-check workflow must run the Pi Kapp page contract');
if (!workflow.includes('npm run check:pikapp-page-browser')) fail('health-check workflow must run the Pi Kapp browser contract');
for (const contractPath of ['scripts/check-pikapp-page-integration.mjs', 'scripts/check-pikapp-page-browser.mjs']) {
  if (count(workflow, `- "${contractPath}"`) !== 2) fail(`health-check push and pull_request paths must include ${contractPath}`);
}

const manifest = JSON.parse(text('data/projects.json'));
const project = manifest.projects.find((entry) => entry.slug === 'pikappapp');
const expectedProject = {
  title: 'Pi Kapp App',
  url: 'pikappapp.html',
  type: 'primary',
  nav: true,
  homepage: true,
  protected: false,
  noindex: false,
  sitemap: true,
};
for (const [key, value] of Object.entries(expectedProject)) {
  if (project?.[key] !== value) fail(`data/projects.json Pi Kapp ${key} drifted`);
}

if (failures.length) {
  console.error('PI KAPP PAGE INTEGRATION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`PI KAPP PAGE INTEGRATION CONTRACT: PASS assets=${Object.keys(assetHashes).length} principles=3 screens=3`);
