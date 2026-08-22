import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateDesignContract } from './check-design-md-contract.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const LEGACY_FIXTURE_PREFIX = 'design-md-contract-fixture-';
const FIXTURE_PREFIX = `${LEGACY_FIXTURE_PREFIX}${process.pid}-`;
const FIXTURE_NAME = new RegExp(`^${FIXTURE_PREFIX}[A-Za-z0-9]{6}$`);

function fixtureNames() {
  return fs.readdirSync(os.tmpdir()).filter((name) => FIXTURE_NAME.test(name));
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), FIXTURE_PREFIX));
  for (const relative of ['DESIGN.md', 'css/style.css', 'content/design-system.json', 'content/design-system.md']) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), target);
  }
  return root;
}

function mutate(relative, transform) {
  const root = fixture();
  const file = path.join(root, relative);
  fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')));
  return root;
}

function mutateFiles(transforms) {
  const root = fixture();
  for (const [relative, transform] of Object.entries(transforms)) {
    const file = path.join(root, relative);
    fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')));
  }
  return root;
}

function rejects(label, relative, transform, expected) {
  test(label, () => {
    const root = mutate(relative, transform);
    try {
      const errors = validateDesignContract(root).errors;
      assert.ok(errors.some((message) => message.includes(expected)), errors.join('\n'));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

function rejectsFiles(label, transforms, expected) {
  test(label, () => {
    const root = mutateFiles(transforms);
    try {
      const errors = validateDesignContract(root).errors;
      assert.ok(errors.some((message) => message.includes(expected)), errors.join('\n'));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test('validates the checked-in design contract', () => {
  assert.deepEqual(validateDesignContract(ROOT, { formalLint: true }).errors, []);
});

test('does not claim old-style foreign fixtures', () => {
  const foreign = fs.mkdtempSync(path.join(os.tmpdir(), LEGACY_FIXTURE_PREFIX));
  try {
    assert.ok(!fixtureNames().includes(path.basename(foreign)), `must not claim foreign fixture ${foreign}`);
  } finally {
    fs.rmSync(foreign, { recursive: true, force: true });
  }
});

rejects('rejects a malformed DESIGN.md updated date', 'DESIGN.md', (source) => source.replace('updated: "2026-08-22"', 'updated: not-a-date'), 'DESIGN.md updated must be ISO YYYY-MM-DD');
rejects('rejects DESIGN.md updated date drift from JSON', 'DESIGN.md', (source) => source.replace('updated: "2026-08-22"', 'updated: "2000-01-01"'), 'DESIGN.md updated must match design-system.json updated');
rejects('rejects JSON updated date drift from DESIGN.md', 'content/design-system.json', (source) => source.replace('"updated": "2026-08-22"', '"updated": "2000-01-01"'), 'DESIGN.md updated must match design-system.json updated');
rejectsFiles('rejects a coordinated impossible updated calendar date', {
  'DESIGN.md': (source) => source.replace('updated: "2026-08-22"', 'updated: "2026-02-30"'),
  'content/design-system.json': (source) => source.replace('"updated": "2026-08-22"', '"updated": "2026-02-30"'),
}, 'DESIGN.md updated must be a real calendar date');

rejects('rejects DESIGN.md mapped color drift', 'DESIGN.md', (source) => source.replace('primary: "#55A2F7"', 'primary: "#000000"'), 'CSS mapping drift: colors.primary');
rejects('rejects JSON mapped token drift', 'content/design-system.json', (source) => source.replace('"blue-text": { "value": "#2468a9"', '"blue-text": { "value": "#000000"'), 'JSON mirror drift: blue-text');
rejects('rejects JSON accent drift', 'content/design-system.json', (source) => source.replace('"value": "#55a2f7"', '"value": "#000000"'), 'JSON accent drift: blue');
rejects('rejects JSON neutral drift', 'content/design-system.json', (source) => source.replace('"value": "#ffffff",\n        "inDarkMode": "#0e0e0e"', '"value": "#000000",\n        "inDarkMode": "#0e0e0e"'), 'JSON neutral drift: bg');
rejects('rejects homepage Ability orange overlay drift', 'content/design-system.json', (source) => source.replace('"homepage-ability-orange": { "value": "#efaa18"', '"homepage-ability-orange": { "value": "#000000"'), 'JSON overlay drift: homepage-ability-orange');
rejects('rejects homepage Ability blue overlay drift', 'content/design-system.json', (source) => source.replace('"homepage-ability-blue": { "value": "#03436e"', '"homepage-ability-blue": { "value": "#000000"'), 'JSON overlay drift: homepage-ability-blue');
rejects('rejects a removed DESIGN.md spacing token', 'DESIGN.md', (source) => source.replace('  space-20: 80px\n', ''), 'spacing inventory drift');
rejects('rejects a removed DESIGN.md radius token', 'DESIGN.md', (source) => source.replace('  xl: 32px\n', ''), 'radius inventory drift');
rejects('rejects a removed privacy boundary', 'DESIGN.md', (source) => source.replace('No public file may reveal credentials, protected implementation details, private customer information, or confidential workflows.', 'Public files may reveal details.'), 'privacy/protected-content boundary');
rejects('rejects a dormant component marked live', 'content/design-system.json', (source) => source.replace('"existing": [', '"existing": [\n      "screen-frame",'), 'dormant component marked live: screen-frame');
rejects('rejects a duplicate canonical heading', 'DESIGN.md', (source) => source.replace('## Colors', '## Colors\n\nDuplicate heading test.\n\n## Colors'), 'duplicate heading: Colors');
rejects('rejects a broken token reference', 'DESIGN.md', (source) => source.replace('{colors.light-text}', '{colors.missing}'), 'broken token reference: {colors.missing}');
rejects('rejects candidate or not-yet-authority wording', 'DESIGN.md', (source) => `${source}\nThis candidate is a planning artifact, not yet the repository authority.\n`, 'adopted authority contradiction');
rejects('rejects a missing adopted authority model', 'DESIGN.md', (source) => source.replace('Root `DESIGN.md` is the normative design intent and formal agent context for shared semantics, live components, project overlays, and use rules.', 'Root `DESIGN.md` contains design notes.'), 'missing adopted authority model');
rejects('rejects an em dash', 'DESIGN.md', (source) => `${source}\nEm dash test — rejected.\n`, 'must not contain em dashes');

for (const name of ['blue', 'pink', 'purple', 'orange']) {
  rejects(`rejects a removed JSON accent inventory member: ${name}`, 'content/design-system.json', (source) => {
    const json = JSON.parse(source); delete json.colors.accents[name]; return JSON.stringify(json, null, 2);
  }, 'accent inventory drift');
}
for (const name of ['bg', 'bg-2', 'text', 'text-2', 'border']) {
  rejects(`rejects a removed JSON neutral inventory member: ${name}`, 'content/design-system.json', (source) => {
    const json = JSON.parse(source); delete json.colors.neutrals[name]; return JSON.stringify(json, null, 2);
  }, 'neutral inventory drift');
}
for (const name of ['blue-text', 'surface-canvas', 'surface-section', 'surface-media', 'surface-floating']) {
  rejects(`rejects a removed JSON shared alias inventory member: ${name}`, 'content/design-system.json', (source) => {
    const json = JSON.parse(source); delete json.colors.sharedAliases[name]; return JSON.stringify(json, null, 2);
  }, 'shared alias inventory drift');
}
for (const name of ['homepage-ability-orange', 'homepage-ability-blue']) {
  rejects(`rejects a removed JSON Ability alias inventory member: ${name}`, 'content/design-system.json', (source) => {
    const json = JSON.parse(source); delete json.colors.projectScopedOverlays['homepage-ability'].aliases[name]; return JSON.stringify(json, null, 2);
  }, 'Ability alias inventory drift');
}
rejectsFiles('rejects coordinated removal of JSON and DESIGN.md space-20', {
  'content/design-system.json': (source) => { const json = JSON.parse(source); delete json.spacing.scale['20']; return JSON.stringify(json, null, 2); },
  'DESIGN.md': (source) => source.replace('  space-20: 80px\n', ''),
}, 'spacing inventory drift');
rejectsFiles('rejects coordinated removal of JSON and DESIGN.md xl radius', {
  'content/design-system.json': (source) => { const json = JSON.parse(source); delete json.radii.tokens.xl; return JSON.stringify(json, null, 2); },
  'DESIGN.md': (source) => source.replace('  xl: 32px\n', ''),
}, 'radius inventory drift');
for (const [name, value] of [
  ['title', 'clamp(1.5rem, 2.5vw, 2.25rem)'],
  ['display', 'clamp(2.75rem, 7vw, 5.5rem)'],
  ['hero', 'clamp(7rem, 24vw, 26rem)'],
]) {
  rejects(`rejects altered exact fluid prose value for ${name}`, 'DESIGN.md', (source) => source.replace(`\`${value}\``, '`clamp(0rem, 0vw, 0rem)`'), `fluid type drift: --text-${name}`);
  rejects(`rejects removed JSON fluid token: ${name}`, 'content/design-system.json', (source) => {
    const json = JSON.parse(source); delete json.typography.scale.tokens[name]; return JSON.stringify(json, null, 2);
  }, 'fluid type inventory drift');
}
rejects('rejects a dark pink prose rebind that differs from CSS and JSON', 'DESIGN.md', (source) => source.replace('Dark pink rebind: `#F06AB5`', 'Dark pink rebind: `#000000`'), 'dark pink prose drift');

test('leaves no design contract fixtures in the temp directory', () => {
  assert.deepEqual(fixtureNames(), []);
});
