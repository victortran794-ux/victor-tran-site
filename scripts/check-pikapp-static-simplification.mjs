#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const text = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const count = (value, needle) => value.split(needle).length - 1;

const html = text('pikappapp.html');
const css = text('css/pikappapp.css');
const js = text('js/pikappapp.js');
const packageJson = JSON.parse(text('package.json'));
const packageLock = JSON.parse(text('package-lock.json'));
const siteIndex = JSON.parse(text('content/site-index.json'));
const workflow = text('.github/workflows/health-check.yml');
const preflight = text('scripts/preflight.sh');
const localHealthCheck = text('scripts/health-check.sh');
const lighthouseContract = text('scripts/check-lighthouse-coverage.mjs');
const containmentContract = text('scripts/check-production-artifact-containment.mjs');
const globalThemeContract = text('scripts/check-global-theme-control.mjs');
const vercelIgnore = text('.vercelignore');
const vercel = JSON.parse(text('vercel.json'));

const staticStates = [
  ['v2-today-light-clean.png', '01 Orientation', 'What needs attention'],
  ['v2-responsibility-detail-dark-clean.png', '02 Responsibility detail', 'What to do next'],
  ['v2-all-caught-up-light-clean.png', '03 Completion', 'Nothing needs your attention right now'],
];

expect(html.includes('<span>04</span>V1 + static V2'), 'Chapter index must label V2 as static rather than runnable.');
expect(html.includes('Earlier static V2 states'), 'Chapter 04 must identify the V2 evidence as static historical states.');
expect(count(html, '<p class="v2-history__boundary">Illustrative concept screens.</p>') === 1, 'V2 history must carry one concise viewer-facing boundary.');
expect(count(html, '<p class="coda__boundary">Illustrative concept screens.</p>') === 1, 'Final remaster must carry one concise viewer-facing boundary.');
expect(!html.includes('concept-history'), 'Redundant supporting-chronology callout must remain removed.');
expect(!html.includes('coda__meta'), 'Redundant final-remaster metadata kicker must remain removed.');
expect(html.includes('The later V2 explored how attention, responsibility detail, and completion could work before the final remaster.'), 'Chapter 04 must keep the concise V2 transition.');
expect(html.includes('Three states preserve the earlier direction: orientation, responsibility detail, and a clear ending state.'), 'V2 history must keep its concise evidence summary.');
expect(!html.includes('V1 established the member flow.'), 'Chapter 04 must not repeat the V1-established claim from its heading.');
expect(!html.toLowerCase().includes('supporting chronology'), 'Viewer-facing copy must not restore internal chronology language.');
expect(count(html, 'class="v2-history__screen"') === 3, 'Chapter 04 must contain exactly three static V2 history screens.');
expect(html.includes('aria-label="Earlier V2 orientation, responsibility-detail, and completion states" tabindex="0"'), 'Static V2 history must expose a keyboard-scrollable labeled sequence.');
for (const [filename, step, visibleText] of staticStates) {
  expect(html.includes(`images/pikapp-case-study/${filename}`), `Chapter 04 must render ${filename}.`);
  expect(html.includes(`class="v2-history__step">${step}</strong>`), `Chapter 04 must label ${step}.`);
  expect(html.includes(visibleText), `Chapter 04 must describe the visible ${step} state.`);
}
for (const forbidden of [
  'pikappapp/demo',
  'pikappapp/system',
  'prototype-embed',
  'prototype-dialog',
  'data-prototype-open',
  'runnable V2',
  'Open V2 prototype',
]) expect(!html.includes(forbidden), `Public Pi Kapp page must remove runtime marker: ${forbidden}`);

for (const required of [
  '.pikapp-page .v2-history',
  '.pikapp-page .v2-history__grid',
  '.pikapp-page .v2-history__screen',
  '.pikapp-page .v2-history__frame',
  'grid-template-columns:repeat(3,minmax(0,1fr))',
  'grid-auto-columns:min(78vw,310px)',
  'scroll-snap-type:inline mandatory',
  'html[data-theme="dark"] .pikapp-page .v2-history__step{color:#adc5fa}',
  'html[data-theme="dark"] .pikapp-page .v2-history__grid:focus-visible{outline-color:#adc5fa}',
  '@media (max-width: 700px)',
]) expect(css.includes(required), `Pi Kapp CSS must include static-history contract: ${required}`);
for (const forbidden of ['.prototype-embed', '.prototype-dialog']) {
  expect(!css.includes(forbidden), `Pi Kapp CSS must remove runtime selector: ${forbidden}`);
  expect(!js.includes(forbidden), `Pi Kapp JavaScript must remove runtime selector: ${forbidden}`);
}
expect(!js.includes('data-prototype'), 'Pi Kapp JavaScript must remove prototype-dialog behavior.');

for (const relativePath of [
  'pikappapp/demo.html',
  'pikappapp/demo.bundle.css',
  'pikappapp/demo.bundle.js',
  'pikappapp/demo-source.css',
  'pikappapp/demo-source.jsx',
  'pikappapp/tailwind.config.cjs',
  'pikappapp/system.html',
  'scripts/check-pikapp-demo-build.mjs',
]) expect(!exists(relativePath), `${relativePath} must be removed from the deployable repository.`);

for (const scriptName of ['build:pikapp-demo', 'check:pikapp-demo', 'verify:pikapp-demo']) {
  expect(!packageJson.scripts?.[scriptName], `package.json must remove ${scriptName}.`);
}
for (const dependency of ['esbuild', 'framer-motion', 'react', 'react-dom', 'tailwindcss']) {
  expect(!packageJson.devDependencies?.[dependency], `package.json must remove V2-only dependency ${dependency}.`);
}
expect(!packageLock.packages?.['']?.devDependencies, 'package-lock root must not retain V2-only devDependencies.');
expect(Object.keys(packageLock.packages || {}).length === 1, 'package-lock must contain only the dependency-free root package.');

for (const forbidden of ['npm ci --ignore-scripts', 'verify:pikapp-demo', 'Install pinned website build tools']) {
  expect(!preflight.includes(forbidden), `Preflight must remove V2-only step: ${forbidden}`);
  expect(!workflow.includes(forbidden), `Workflow must remove V2-only step: ${forbidden}`);
}
expect(!workflow.includes('--exclude "pikappapp/demo"'), 'Lychee must not retain the removed demo exclusion.');
expect(!localHealthCheck.includes('--exclude "pikappapp/demo"'), 'Local Lychee helper must not retain the removed demo exclusion.');
expect(!workflow.includes("${{ steps.url.outputs.base }}/pikappapp/demo"), 'Lighthouse must not retain the removed demo route.');
expect(!lighthouseContract.includes("'/pikappapp/demo'"), 'Lighthouse coverage contract must remove the demo route.');
for (const sourcePath of ['pikappapp/demo-source.css', 'pikappapp/demo-source.jsx', 'pikappapp/tailwind.config.cjs']) {
  expect(!vercelIgnore.includes(sourcePath), `.vercelignore must remove obsolete source entry ${sourcePath}.`);
  expect(!containmentContract.includes(sourcePath), `Artifact containment must remove obsolete source entry ${sourcePath}.`);
}
expect(!globalThemeContract.includes('pikappapp/demo.html'), 'Global theme contract must remove the demo standalone exemption.');
expect(!globalThemeContract.includes('pikappapp/system.html'), 'Global theme contract must remove the system standalone exemption.');

const redirectMap = new Map((vercel.redirects || []).map((entry) => [entry.source, entry]));
for (const [source, destination] of [
  ['/pikappapp/demo', '/pikappapp#chapter-4'],
  ['/pikappapp/system', '/pikappapp#chapter-3'],
]) {
  const redirect = redirectMap.get(source);
  expect(redirect?.destination === destination && redirect?.permanent === true,
    `${source} must permanently redirect to ${destination}.`);
}

for (const preserved of [
  'images/pikapp-case-study/login-screen.png',
  'images/pikapp-case-study/member.png',
  'images/pikapp-case-study/task-expand.png',
  'images/pikapp-case-study/remaster-login.png',
  'images/pikapp-case-study/remaster-dashboard.png',
  'images/pikapp-case-study/remaster-milestones.png',
  'data-archive-master="cover"',
  'data-archive-master="context"',
]) expect(html.includes(preserved), `Stable Pi Kapp evidence must remain: ${preserved}`);

const piKappIndex = siteIndex.find((entry) => entry.source === 'pikappapp.html');
const indexedImages = new Set((piKappIndex?.images || []).map((image) => image.src));
for (const preserved of [
  ...staticStates.map(([filename]) => `images/pikapp-case-study/${filename}`),
  'images/pikapp-case-study/remaster-login.png',
  'images/pikapp-case-study/remaster-dashboard.png',
  'images/pikapp-case-study/remaster-milestones.png',
  'images/pikapp-case-study/expansion-cover-detail.jpg',
]) expect(indexedImages.has(preserved), `Pi Kapp site-index metadata must preserve evidence: ${preserved}`);

if (failures.length) {
  console.error(`PI KAPP STATIC SIMPLIFICATION: FAIL (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('PI KAPP STATIC SIMPLIFICATION: PASS states=3 runtime=removed redirects=2 stable-evidence=preserved');
