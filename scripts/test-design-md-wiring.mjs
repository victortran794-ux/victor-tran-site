#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readProjectFile = path => readFile(new URL(path, root), 'utf8');

const packageJson = JSON.parse(await readProjectFile('package.json'));
assert.equal(packageJson.scripts['test:design-md'], 'node scripts/test-design-md-contract.mjs');
assert.equal(packageJson.scripts['check:design-md'], 'node scripts/check-design-md-contract.mjs');
assert.equal(packageJson.scripts['test:design-md-wiring'], 'node scripts/test-design-md-wiring.mjs');

const preflight = await readProjectFile('scripts/preflight.sh');
const designWiringCall = 'run_required "Design.md wiring contract" npm run test:design-md-wiring';
const designTestCall = 'run_required "Design.md contract fixture" npm run test:design-md';
const designCheckCall = 'run_required "Design.md contract" npm run check:design-md';
assert.ok(preflight.includes(designWiringCall), 'preflight must run the Design.md wiring self-test');
assert.ok(preflight.includes(designTestCall), 'preflight must run the Design.md fixture');
assert.ok(preflight.includes(designCheckCall), 'preflight must run the Design.md contract');
assert.ok(preflight.indexOf(designWiringCall) < preflight.indexOf(designTestCall), 'preflight must run the Design.md wiring self-test before its fixture');
assert.ok(preflight.indexOf(designTestCall) < preflight.indexOf(designCheckCall), 'preflight must run the Design.md fixture before its contract');
assert.ok(preflight.indexOf(designCheckCall) < preflight.indexOf('run_required "Accessibility quick-win regression check"'), 'Design.md checks must precede broader content and final-site checks');

const workflow = await readProjectFile('.github/workflows/health-check.yml');
assert.match(workflow, /^      design: \$\{\{ steps\.scope\.outputs\.design \}\}$/m, 'scope job must expose design output');

const designCondition = "needs.changes.outputs.all == 'true' || needs.changes.outputs.design == 'true'";
assert.match(
  workflow,
  new RegExp(`- name: Install Design\\.md dependencies\\n        if: ${designCondition.replace(/[|]/g, '\\|')}\\n        run: npm ci --ignore-scripts`),
  'Design.md dependencies must install only for all/design scope'
);
assert.match(
  workflow,
  new RegExp(`- name: Design\\.md contract\\n        if: ${designCondition.replace(/[|]/g, '\\|')}\\n        run: \\|\\n          npm run test:design-md-wiring\\n          npm run test:design-md\\n          npm run check:design-md`),
  'Design.md wiring self-test, fixture, and check must run under the matching scope condition in order'
);

console.log('Design.md wiring contract tests passed.');
