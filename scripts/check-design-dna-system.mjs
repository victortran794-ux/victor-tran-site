#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const index = read('index.html');
const css = read('css/style.css');
const dnaCssStart = css.indexOf('Design DNA overlay (home page)');
const dnaCssEnd = css.indexOf('/* ABILITY EXPERIENCE: START */');
const dnaCss = css.slice(dnaCssStart, dnaCssEnd);
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

expect(index.includes('class="dna-sheet"'), 'Replace the rounded bento with the editorial dna-sheet composition.');
expect(index.includes('class="dna-section'), 'Design DNA must use editorial sections.');
expect(!index.includes('dna-bento'), 'Remove the generic Design DNA bento composition.');
expect(!index.includes('dna-sample-btn'), 'Remove fake DNA-only button specimens.');
expect(!index.includes('◐ Pill') && !index.includes('Ghost →'), 'Remove fictional Pill and Ghost component examples.');
expect(index.includes('id="dnaRadii"'), 'Radii must render from live CSS tokens.');
expect(index.includes('id="dnaSemanticSpacing"'), 'Spacing must expose live semantic aliases.');
expect(index.includes('class="section-label label-default"'), 'Component evidence must reuse the real section-label component.');
expect(index.includes('class="case-study-meta dna-component-meta"'), 'Component evidence must reuse the real case-study-meta anatomy.');
expect(index.includes('Active theme values'), 'Palette copy must accurately describe computed active-theme values.');

expect(css.includes('.dna-sheet'), 'CSS must style the editorial DNA sheet.');
expect(css.includes('.dna-section'), 'CSS must style editorial DNA sections.');
expect(!css.includes('.dna-bento'), 'Retire dna-bento CSS.');
expect(!css.includes('.dna-sample-btn'), 'Retire DNA-only fake component CSS.');
expect(!dnaCss.includes('var(--dur-fast)'), 'Design DNA CSS must use the canonical --duration-fast token.');
expect(!dnaCss.includes('var(--dur-med)'), 'Design DNA CSS must use canonical --duration-* motion tokens.');
const largeRadiusUse = designSystemJson.radii?.tokens?.lg?.use ?? '';
expect(!largeRadiusUse.includes('.screen-frame') || /dormant|reserved/i.test(largeRadiusUse),
  'The radius inventory must not describe dormant .screen-frame as a current production use.');
expect(js.includes("const radiusKeys = ['0', 'sm', 'md', 'lg', 'xl', 'pill']"),
  'Design DNA must read the complete live radius token set.');
expect(js.includes("`--space-${n}`"), 'Spacing labels must use real --space-* token names.');
expect(js.includes("['--page-x', '--section-y', '--gallery-x']"),
  'Design DNA must expose the semantic spacing aliases.');

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
