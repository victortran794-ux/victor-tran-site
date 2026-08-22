#!/usr/bin/env node
import assert from 'node:assert/strict';
import { classifyPaths, forceAllScopes, formatScopeOutputs } from './classify-health-check-scope.mjs';

const docsOnly = classifyPaths([
  'PORTFOLIO_SYSTEM.md',
  'PORTFOLIO_DASHBOARD.md',
]);

assert.deepEqual(docsOnly, {
  all: false,
  shared: false,
  home: false,
  ibm: false,
  pikapp: false,
  gallery: false,
  about: false,
  pci: false,
  sal: false,
  ability: false,
  wxo: false,
  images: false,
  links: false,
  deployable: false,
  docs: true,
});

const galleryVisual = classifyPaths([
  'css/ui-gallery.css',
  'images/ui-gallery/ekos-cover.webp',
]);

assert.deepEqual(galleryVisual, {
  all: false,
  shared: false,
  home: false,
  ibm: false,
  pikapp: false,
  gallery: true,
  about: false,
  pci: false,
  sal: false,
  ability: false,
  wxo: false,
  images: true,
  links: true,
  deployable: true,
  docs: false,
});

const sharedSystem = classifyPaths([
  'css/style.css',
  'js/main.js',
  'data/site-shell.json',
]);

assert.deepEqual(sharedSystem, {
  all: false,
  shared: true,
  home: false,
  ibm: false,
  pikapp: false,
  gallery: false,
  about: false,
  pci: false,
  sal: false,
  ability: false,
  wxo: false,
  images: false,
  links: true,
  deployable: true,
  docs: false,
});

const workflowTooling = classifyPaths([
  '.github/workflows/health-check.yml',
  'scripts/classify-health-check-scope.mjs',
  'package-lock.json',
]);

assert.equal(workflowTooling.all, true);
assert.equal(workflowTooling.links, true);
assert.equal(workflowTooling.deployable, true);

const routeCases = [
  ['home', 'index.html'],
  ['ibm', 'ibmcloud.html'],
  ['pikapp', 'images/pikapp-case-study/v2-today-light-clean.png'],
  ['gallery', 'graphicgallery.html'],
  ['about', 'about.html'],
  ['pci', 'pci.html'],
  ['sal', 'salmagazine.html'],
  ['ability', 'abilityexperience.html'],
  ['wxo', 'wxo-canvas.html'],
];

for (const [route, changedPath] of routeCases) {
  const scope = classifyPaths([changedPath]);
  assert.equal(scope[route], true, `${changedPath} must select ${route}`);
  assert.equal(scope.deployable, true, `${changedPath} must select deployable checks`);
  assert.equal(scope.links, true, `${changedPath} must select link checks`);
  assert.equal(scope.all, false, `${changedPath} must not force the full suite`);
}

for (const changedPath of [
  'wxo-access.html',
  'middleware.ts',
  'api/wxo-access.mjs',
  'lib/protected-access.mjs',
  'lib/protected-middleware.mjs',
  'lib/password-verifier.mjs',
  'js/wxo-access.js',
  'protected/wxo/images/current/01-skill-studio-main.png',
]) {
  const scope = classifyPaths([changedPath]);
  assert.equal(scope.wxo, true, `${changedPath} must select wxo`);
  assert.equal(scope.deployable, true, `${changedPath} must select deployable checks`);
  assert.equal(scope.links, true, `${changedPath} must select link checks`);
  assert.equal(scope.all, false, `${changedPath} must not force the full suite`);
}

const unknownPage = classifyPaths(['new-case-study.html']);
assert.equal(unknownPage.shared, true, 'unknown public HTML must fail safely to shared coverage');
assert.equal(unknownPage.deployable, true);

for (const changedPath of [
  'scripts/check-protected-content-exports.mjs',
  'scripts/check-accessibility-quick-wins.mjs',
  'scripts/archive-page.mjs',
  'scripts/requirements-ui-gallery-assets.txt',
  '.github/workflows/deploy.yml',
  'eslint.config.mjs',
]) {
  assert.equal(classifyPaths([changedPath]).all, true, `${changedPath} must fail safely to full coverage`);
}

const rootDocumentation = classifyPaths(['README.md']);
assert.equal(rootDocumentation.docs, true, 'root Markdown documentation must select the fast documentation baseline');
assert.equal(rootDocumentation.all, false, 'root Markdown documentation must not force full coverage');

const forced = forceAllScopes();
assert.ok(Object.values(forced).every(Boolean), 'manual and scheduled runs must force every scope');
assert.match(formatScopeOutputs(docsOnly), /^all=false\nshared=false\n/m);
assert.match(formatScopeOutputs(docsOnly), /docs=true\n$/);

const triggerCoverageCases = [
  ['.github/lighthouse-budget.json', 'all'],
  ['.github/lighthouse-mobile.json', 'all'],
  ['.vercelignore', 'shared'],
  ['archive/pages/artillustration-2026-07-31/artillustration.html', 'gallery'],
  ['archive/pages/graphicgallery-2026-07-31/graphicgallery.html', 'gallery'],
  ['archive/playground.html', 'all'],
  ['content/design-system.json', 'home'],
  ['content/site-index.json', 'shared'],
  ['scripts/about-browser-process.mjs', 'about'],
  ['scripts/check-final-site-reconciliation.mjs', 'all'],
  ['scripts/check-lighthouse-coverage.mjs', 'all'],
  ['scripts/check-production-artifact-containment.mjs', 'all'],
  ['scripts/check-production-host.mjs', 'all'],
  ['scripts/check-public-archive-routes.mjs', 'gallery'],
  ['scripts/check-responsive-images.mjs', 'shared'],
  ['scripts/health-check.sh', 'all'],
  ['scripts/install-lychee.ps1', 'all'],
  ['scripts/test-html-to-md.mjs', 'all'],
  ['scripts/validate-project-manifest.mjs', 'all'],
];

for (const [changedPath, expectedScope] of triggerCoverageCases) {
  assert.equal(classifyPaths([changedPath])[expectedScope], true, `${changedPath} must select ${expectedScope}`);
}

console.log('Health-check scope classifier tests passed.');
