#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => {
  const target = path.join(root, relative);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
};
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const html = read('index.html');
const main = read('js/main.js');
const source = read('js/ambient-field-config.js');

expect(Boolean(source), 'submitted ambient configuration must exist as js/ambient-field-config.js');
expect(html.indexOf('js/ambient-field-config.js') >= 0
  && html.indexOf('js/ambient-field-config.js') < html.indexOf('js/main.js'),
  'submitted configuration must load before the ambient runtime');
expect(main.includes('window.__ambientFieldBaseline')
  && main.indexOf('applyConfig(window.__ambientFieldBaseline)') < main.indexOf("hero.addEventListener('pointermove'"),
  'runtime must apply the submitted selection before enabling ambient pointer motion');
expect(!/__ambientFieldTunerApi|ambient-field-tuner-ready|resetConfig|updateSelectedAnchor/.test(main),
  'production runtime must not expose or retain private tuner controls');
expect(/generatedId\s*=\s*Math\.max/.test(main),
  'runtime must advance generated IDs beyond imported ring-new and small-new suffixes');

let config;
if (source) {
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(source, sandbox, { filename: 'ambient-field-config.js' });
    config = JSON.parse(JSON.stringify(sandbox.window.__ambientFieldBaseline));
  } catch (error) {
    failures.push(`submitted configuration must evaluate as data: ${error.message}`);
  }
}

if (config) {
  const normalized = JSON.stringify(config, Object.keys(config).sort());
  const stable = value => {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  };
  const digest = crypto.createHash('sha256').update(stable(config)).digest('hex');
  const rings = config.circles.filter(circle => circle.kind === 'ring');
  const small = config.circles.filter(circle => circle.kind === 'small');
  const blobs = config.blobs || [];
  expect(digest === '9ea5b2fc0a9ffbb9c8424ce339fea6b975565d9222544f926cfd7dc38b1afcc9',
    `submitted configuration differs from Victor's exact JSON (${digest})`);
  expect(config.version === 1 && config.globals.motionScale === 0.35
    && config.globals.cursorScale === 0.9 && config.globals.paused === false,
    'submitted global motion values must remain exact');
  expect(rings.length === 9 && small.length === 2 && rings.filter(circle => circle.node).length === 3,
    'submitted selection must contain nine rings, two small circles, and three dotted rings');
  expect(config.circles.map(circle => circle.id).join(',') === 'ring-a,ring-b,ring-c,ring-e,ring-f,ring-new-2,ring-new-3,ring-new-4,ring-new-5,small-a,small-c',
    'submitted circle identity and order must remain exact');
  expect(blobs.length === 2 && blobs.map(blob => blob.id).join(',') === 'blob-a,blob-b',
    'submitted selection must contain both gradient blobs in exact order');
  expect(blobs[0]?.size === 81 && blobs[0]?.gradient === 'warm' && blobs[0]?.pointerPull === 42
    && blobs[1]?.size === 50 && blobs[1]?.gradient === 'cool' && blobs[1]?.pointerPull === -6,
    'submitted blob scale, palette, and pointer values must remain exact');
  expect(rings.find(circle => circle.id === 'ring-b')?.opacity === 0.35,
    'submitted ring-b opacity must remain 0.35');
  const ringC = rings.find(circle => circle.id === 'ring-c');
  expect(ringC?.size === 154 && ringC?.anchorX === 88.45360824742268
    && ringC?.anchorY === 8.461538461538462,
    'latest submitted ring-c size and anchor must remain exact');
  const smallC = small.find(circle => circle.id === 'small-c');
  expect(smallC?.linkedRingId === 'ring-c'
    && smallC?.offsetX === -49.39639880068722 && smallC?.offsetY === 70.79281960447742
    && smallC?.anchorX === -49.39639880068722 && smallC?.anchorY === 70.79281960447742,
    'ring-c companion relationship and submitted offset must remain exact');
}

if (failures.length) {
  console.error('AMBIENT FIELD SELECTION: FAIL');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AMBIENT FIELD SELECTION: PASS');
console.log('- Victor submitted baseline hash, blob/circle order, counts, and global motion values match');
