#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (condition, message) => { if (!condition) failures.push(message); };
const rule = (css, selector) => css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'))?.[1] ?? '';

const art = read('artillustration.html');
const artGenerator = read('scripts/build-visual-archives-integration.py');
const patterns = read('ibm-patterns.html');
const sharedCss = read('css/style.css');
const patternsCss = read('css/ibm-patterns.css');
const packageJson = JSON.parse(read('package.json'));
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');
const pageSystem = read('content/vico2-page-system.md');

expect(pageSystem.includes('## Media motion controls') &&
    pageSystem.includes('`.media-motion-toggle`') &&
    pageSystem.includes('Art & Illustration') &&
    pageSystem.includes('IBM Patterns'),
  'content/vico2-page-system.md: document the proven shared media-motion control and its two live adopters.');

for (const [surface, source] of [
  ['generated Art page', art],
  ['Art generator', artGenerator],
  ['IBM Patterns page', patterns],
]) {
  expect(source.includes('media-motion-toggle'), `${surface}: motion control must adopt the shared media-motion-toggle primitive.`);
}

const sharedRule = rule(sharedCss, '.media-motion-toggle');
for (const declaration of [
  'position: absolute',
  'inset-inline-end: var(--media-motion-inset, 12px)',
  'inset-block-end: var(--media-motion-inset, 12px)',
  'min-width: 72px',
  'min-height: 44px',
  'display: inline-flex',
  'align-items: center',
  'justify-content: center',
]) {
  expect(sharedRule.includes(declaration), `css/style.css: shared media-motion-toggle is missing aligned geometry: ${declaration}.`);
}

for (const [selector, css] of [
  ['.slideshow-pause-btn', sharedCss],
  ['.patterns-motion-toggle', patternsCss],
]) {
  const pageRule = rule(css, selector);
  for (const duplicate of ['position:', 'right:', 'bottom:', 'inset-inline-end:', 'inset-block-end:', 'min-width:', 'min-height:']) {
    expect(!pageRule.includes(duplicate), `${selector}: page-specific rule must not override shared control geometry (${duplicate}).`);
  }
}

expect(packageJson.scripts?.['check:gallery-motion-system'] === 'node scripts/check-gallery-motion-system.mjs',
  'package.json: register the gallery motion system contract.');
expect(preflight.includes('npm run check:gallery-motion-system'),
  'scripts/preflight.sh: run the gallery motion system contract.');
expect((workflow.match(/scripts\/check-gallery-motion-system\.mjs/g) ?? []).length === 2,
  'health workflow: watch the gallery motion system contract for push and pull requests.');
expect(workflow.includes('run: npm run check:gallery-motion-system'),
  'health workflow: execute the gallery motion system contract.');

if (failures.length) {
  console.error(`GALLERY MOTION SYSTEM CONTRACT: FAIL (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('GALLERY MOTION SYSTEM CONTRACT: PASS controls=2 geometry=shared cadence=per-instance');
