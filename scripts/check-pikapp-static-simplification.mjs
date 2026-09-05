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

const retiredStaticStates = [
  'v2-today-light-clean.png',
  'v2-responsibility-detail-dark-clean.png',
  'v2-all-caught-up-light-clean.png',
];
const v1States = [
  'v1-original-loading.png',
  'v1-original-welcome.png',
  'v1-original-member.png',
  'v1-original-task-expand.png',
  'v1-original-milestones.png',
  'v1-original-chapter.png',
];
const finalStates = [
  'v2-final-loading.png',
  'v2-final-login.png',
  'v2-final-member-dashboard.png',
  'v2-final-responsibility-detail-dark.png',
  'v2-final-task-expand.png',
  'v2-final-milestones-detail.png',
];

expect(html.includes('<span>03</span>Original V1'), 'Chapter index must identify Chapter 03 as the original V1.');
expect(html.includes('<span class="chapter-kicker">Original V1</span>'), 'Chapter 03 must identify its authentic original export sequence.');
expect(count(html, '<p class="coda__boundary">Illustrative concept screens. Names, dates, rankings, and activity are fictional.</p>') === 1,
  'Final remaster must carry one concise viewer-facing fictional-data boundary.');
expect(!html.includes('concept-history'), 'Redundant supporting-chronology callout must remain removed.');
expect(!html.includes('coda__meta'), 'Redundant final-remaster metadata kicker must remain removed.');
expect(html.includes('These original V1 exports preserve the first member flow as it was presented in 2020.'), 'Chapter 03 must state the original V1 evidence boundary.');
expect(!html.includes('V1 established the member flow.'), 'Chapter 04 must not repeat the V1-established claim from its heading.');
expect(!html.toLowerCase().includes('supporting chronology'), 'Viewer-facing copy must not restore internal chronology language.');
expect(!html.includes('class="v2-history'), 'Earlier static V2 states must be removed from Chapter 03.');
expect(count(html, 'class="coda__screen"') === 6, 'Final remaster must contain exactly six dark/cyan screens.');
expect(count(html, 'class="coda__step"') === 6, 'Final remaster must expose a six-step sequence.');
expect(!html.includes('v2-final-chapter.png'), 'Retired final Chapter screen must not return to the active remaster.');
expect(html.includes('aria-label="Six-screen source-faithful final Pi Kapp App concept sequence"'), 'Final remaster must identify its six-screen set.');
for (const filename of retiredStaticStates) expect(!html.includes(`images/pikapp-case-study/${filename}`), `Chapter 03 must retire earlier static V2 state ${filename}.`);
for (const filename of ['v2-final-today-light.png', 'v2-final-all-caught-up-light.png']) {
  expect(!html.includes(`images/pikapp-case-study/${filename}`), `Final remaster must remove light outlier ${filename}.`);
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

expect(!css.includes('.pikapp-page .v2-history'), 'Pi Kapp CSS must retire static-history styling.');
expect(!html.includes('class="identity-board'), 'The oversized source board must be removed from the final-remaster story.');
expect(count(html, 'class="v2-change-ledger__item"') === 4, 'V2 alterations must be consolidated into four concise notes beside the final screens.');
expect(css.includes('.pikapp-page .v2-change-ledger{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'), 'V2 change notes must use a compact four-column desktop composition.');
expect(css.includes('.pikapp-page .coda__triptych{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'), 'Pi Kapp final remaster must use three desktop columns for two balanced rows.');
expect(html.includes('<section class="gallery-handoff" aria-labelledby="gallery-handoff-title">'), 'Pi Kapp must hand off into the three-gallery group before project navigation.');
expect(html.includes('<nav class="gallery-handoff__grid" aria-label="Gallery navigation">'), 'Gallery handoff must expose a named navigation landmark.');
for (const [href, label] of [
  ['artillustration.html', 'Art &amp; Illustration'],
  ['graphicgallery.html', 'Graphic Design'],
  ['uigallery.html', 'Interface Studies'],
]) {
  expect(html.includes(`<a href="${href}" class="gallery-handoff__item">`) && html.includes(`<strong>${label}</strong>`),
    `Gallery handoff must include ${label}.`);
}
expect(count(html, 'class="gallery-handoff__item"') === 3, 'Gallery handoff must treat the three galleries as one complete group.');
expect(html.indexOf('class="gallery-handoff"') < html.indexOf('<!-- generated:project-nav:start -->'), 'Gallery group must lead into, not replace, the main project navigation.');
expect(css.includes('.pikapp-page .gallery-handoff__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'), 'Gallery handoff must use one balanced three-column desktop group.');
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
  expect(!packageJson.dependencies?.[dependency], `package.json must not restore V2-only dependency ${dependency}.`);
  expect(!packageJson.devDependencies?.[dependency], `package.json must remove V2-only dependency ${dependency}.`);
  expect(!packageLock.packages?.[`node_modules/${dependency}`], `package-lock must not restore V2-only dependency ${dependency}.`);
}
expect(
  JSON.stringify(Object.keys(packageLock.packages?.['']?.dependencies || {}).sort()) === JSON.stringify(['@vercel/functions']),
  'package-lock root dependencies must remain limited to the server-side Vercel boundary.',
);

for (const forbidden of ['verify:pikapp-demo', 'Install pinned website build tools']) {
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
  ...v1States.map((filename) => `images/pikapp-case-study/${filename}`),
  ...finalStates.map((filename) => `images/pikapp-case-study/${filename}`),
  'data-archive-master="cover"',
  'data-archive-master="context"',
]) expect(html.includes(preserved), `Stable Pi Kapp evidence must remain: ${preserved}`);
for (const retired of [...retiredStaticStates, 'v2-final-today-light.png', 'v2-final-all-caught-up-light.png']) {
  expect(!html.includes(`images/pikapp-case-study/${retired}`), `Retired Pi Kapp evidence must stay inactive: ${retired}`);
}

const piKappIndex = siteIndex.find((entry) => entry.source === 'pikappapp.html');
const indexedImages = new Set((piKappIndex?.images || []).map((image) => image.src));
const expectedIndexedImages = [
  'images/pikapp-case-study/belltower-expansion.jpg',
  'images/pikapp-case-study/expansion-cover-preview.jpg',
  'images/pikapp-case-study/wireframes.png',
  'images/pikapp-case-study/sitemap.png',
  ...v1States.map((filename) => `images/pikapp-case-study/${filename}`),
  ...finalStates.slice(0, 5).map((filename) => `images/pikapp-case-study/${filename}`),
];
expect(indexedImages.size === 15, 'Pi Kapp site-index summary must retain its intentional 15-image cap.');
for (const expected of expectedIndexedImages) {
  expect(indexedImages.has(expected), `Pi Kapp site-index summary must preserve representative evidence: ${expected}`);
}
for (const deferred of [...finalStates.slice(5), 'app-star-shield.svg', 'expansion-cover-detail.jpg']) {
  expect(!indexedImages.has(`images/pikapp-case-study/${deferred}`),
    `Pi Kapp site-index summary must not pull deferred/detail evidence past its cap: ${deferred}`);
}

if (failures.length) {
  console.error(`PI KAPP STATIC SIMPLIFICATION: FAIL (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('PI KAPP STATIC SIMPLIFICATION: PASS history=removed v1=6 final=6 runtime=removed redirects=2 stable-evidence=preserved');
