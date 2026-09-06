#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const preflight = read('scripts/preflight.sh');
const ci = read('.github/workflows/health-check.yml');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
for (const [name, command] of Object.entries({
  'test:home-maintenance-wiring': 'node scripts/test-home-maintenance-wiring.mjs',
  'check:home-mobile-maintenance': 'node scripts/check-home-mobile-maintenance.mjs',
  'check:home-mobile-maintenance-browser': 'node scripts/check-home-mobile-maintenance-browser.mjs',
})) {
  check(pkg.scripts[name] === command, `package entry missing: ${name}`);
  check(preflight.includes(`npm run ${name}`), `preflight entry missing: ${name}`);
  check(ci.includes(`npm run ${name}`), `CI entry missing: ${name}`);
}
const regeneration = ci.slice(ci.indexOf('- name: Regenerate responsive images reproducibly'), ci.indexOf('- name: Responsive image regression check'));
check(regeneration.includes('python scripts/generate-home-portrait-derivatives.py'), 'CI must regenerate Home portrait derivatives with its pinned Pillow environment');
check(regeneration.includes('images/hero/responsive'), 'CI must reject Home portrait derivative drift');
assert.equal(failures.length, 0, failures.join('\n'));
console.log('HOME MAINTENANCE WIRING: PASS');
