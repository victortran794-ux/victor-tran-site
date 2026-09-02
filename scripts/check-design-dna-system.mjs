#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const index = read('index.html');
const css = read('css/style.css');
const dnaCssStart = css.indexOf('ENGRAVED DESIGN DNA HERO');
const dnaCss = css.slice(dnaCssStart);
const js = read('js/main.js');
const designSystemMd = read('content/design-system.md');
const designSystemJson = JSON.parse(read('content/design-system.json'));
const pageSystemPath = path.join(root, 'content/vico2-page-system.md');
const pageSystem = fs.existsSync(pageSystemPath) ? fs.readFileSync(pageSystemPath, 'utf8') : '';
const workflow = read('.github/workflows/health-check.yml');
const preflight = read('scripts/preflight.sh');
const packageJson = JSON.parse(read('package.json'));

expect(pageSystem.length > 0, 'Create content/vico2-page-system.md as the reusable page-system contract.');
for (const phrase of [
  'Shared shell',
  'Editorial opener',
  'Project metadata',
  'Project transition',
  'Archive-field family',
  'Workflow-story family',
  'Project-native variants',
]) {
  expect(pageSystem.includes(phrase), `VicO2 page-system contract must document: ${phrase}.`);
}

expect(designSystemJson.components?.implementationStatus === 'reconciled-live-inventory',
  'design-system.json must distinguish the reconciled live component inventory.');
const live = designSystemJson.components?.existing ?? [];
for (const component of ['shared-shell', 'section-label', 'page-header', 'case-study-meta', 'project-nav']) {
  expect(live.includes(component), `Live component inventory must include ${component}.`);
}
for (const dormant of ['stat-grid', 'stat-card', 'callout-card', 'screen-frame', 'color-punct-card', 'gallery-section-label']) {
  expect(!live.includes(dormant), `Dormant candidate ${dormant} must not be described as a live shared component.`);
  expect((designSystemJson.components?.dormantCandidates ?? []).includes(dormant),
    `Dormant candidate inventory must explicitly classify ${dormant}.`);
}
expect(designSystemMd.includes('Dormant or deferred candidates'),
  'design-system.md must clearly separate dormant candidates from live shared anatomy.');
expect(!designSystemMd.includes('Current shared primitives now include:'),
  'Retire the inaccurate “Current shared primitives now include” wording.');

expect(index.includes('class="hero-dna-panel"') && index.includes('id="heroDnaPanel"'),
  'Design DNA must use the accepted inline hero disclosure.');
expect((index.match(/class="hero-dna-group\s+/g) ?? []).length === 4,
  'Inline Design DNA must expose exactly Palette, Typography, Spacing, and Shape groups.');
expect(index.includes('Active theme values') && index.includes('class="hero-dna-swatch-value"'),
  'Palette copy and values must describe the computed active theme.');
expect(index.includes('class="hero-dna-space-token"') && index.includes('class="hero-dna-radius-token"'),
  'Spacing and Shape must expose their token names and values.');
expect(index.includes('contenteditable="true"') && index.includes('DM Serif Display')
  && index.includes('Barlow') && index.includes('Source Code Pro'),
  'Typography must retain the editable specimen and the three live typeface names.');
expect(!index.includes('id="dnaOverlay"') && !index.includes('Shared structure'),
  'Retired modal and Shared structure samples must remain absent.');

expect(dnaCssStart >= 0 && dnaCss.includes('.hero-dna-panel'),
  'CSS must style the canonical Engraved Design DNA disclosure.');
expect(!dnaCss.includes('var(--dur-fast)') && !dnaCss.includes('var(--dur-med)'),
  'Engraved Design DNA CSS must use canonical --duration-* motion tokens.');
const largeRadiusUse = designSystemJson.radii?.tokens?.lg?.use ?? '';
expect(!largeRadiusUse.includes('.screen-frame') || /dormant|reserved/i.test(largeRadiusUse),
  'The radius inventory must not describe dormant .screen-frame as a current production use.');
expect(js.includes('function setDnaExpanded('),
  'Design DNA must use one semantic inline disclosure state setter.');
expect(js.includes('syncDnaTokens') && js.includes('getComputedStyle(document.documentElement)'),
  'Design DNA must refresh live palette values from computed theme tokens.');
expect(!js.includes('initDesignDNA') && !css.includes('Design DNA overlay (home page)'),
  'Retired modal Design DNA runtime and styling must not remain as dead canonical code.');

expect(packageJson.scripts?.['check:design-dna-system'] === 'node scripts/check-design-dna-system.mjs',
  'package.json must expose check:design-dna-system.');
expect(preflight.includes('npm run check:design-dna-system'),
  'Preflight must run the Design DNA system contract.');
expect(workflow.includes("needs.changes.outputs.home == 'true'"),
  'Health check must scope Design DNA through Homepage classifier ownership.');
expect(workflow.includes("needs.changes.outputs.shared == 'true'"),
  'Health check must include shared-system changes in Design DNA validation.');
expect(workflow.includes('npm run check:design-dna-system'),
  'Health check must execute the Design DNA system contract.');

if (errors.length) {
  console.error('DESIGN DNA SYSTEM CONTRACT: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('DESIGN DNA SYSTEM CONTRACT: PASS');
console.log(`- live components: ${live.join(', ')}`);
console.log(`- dormant candidates: ${(designSystemJson.components?.dormantCandidates ?? []).join(', ')}`);
