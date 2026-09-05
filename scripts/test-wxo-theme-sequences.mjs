#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const requireText = (text, value, message) => {
  if (!text.includes(value)) fail(message);
};
const count = (text, pattern) => [...text.matchAll(pattern)].length;

const htmlPath = 'wxo-canvas.html';
const cssPath = 'css/wxo-public-candidate.css';
const jsPath = 'js/wxo-public-candidate.js';
const provenancePath = 'data/wxo-canvas-public-provenance.json';
const publicDirectory = 'images/wxo-canvas/public';
const publicAssets = [
  'current-workflow-light.png', 'current-workflow-dark.png',
  'v2-workflow-light.png', 'v2-workflow-dark.png',
  'v2-agent-flow-light.png', 'v2-agent-flow-dark.png',
  'form-workflow-light.png', 'form-workflow-dark.png',
  'form-configuration-light.png', 'form-configuration-dark.png',
  'form-summary-light.png', 'form-summary-dark.png',
  '15-node-key-states-light.png', '15-node-key-states-dark.png',
  '16-node-size-variants-light.png', '16-node-size-variants-dark.png',
  '17-flow-control-elements-light.png', '17-flow-control-elements-dark.png',
  '18-flow-control-containers-light.png', '18-flow-control-containers-dark.png',
  '19-application-example-light.png', '19-application-example-dark.png',
  '21-workflow-anchors-light.png', '21-workflow-anchors-dark.png',
].sort();
const publicAsset = file => `${publicDirectory}/${file}`;

for (const file of [htmlPath, cssPath, jsPath, provenancePath, ...publicAssets.map(publicAsset)]) {
  if (!fs.existsSync(file)) fail(`Missing required public wxO theme-sequence file: ${file}`);
}
const actualAssets = fs.existsSync(publicDirectory) ? fs.readdirSync(publicDirectory).sort() : [];
if (JSON.stringify(actualAssets) !== JSON.stringify(publicAssets)) {
  fail(`Public wxO export set drifted: expected ${publicAssets.join(', ')}, found ${actualAssets.join(', ')}`);
}
if (process.exitCode) process.exit(1);

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
let provenance;
try {
  provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
} catch (error) {
  fail(`WXO public provenance must be valid JSON: ${error.message}`);
  provenance = {};
}
const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';

const publicEntries = (provenance.assets || []).filter(entry => entry.namespace === 'public-route');
if (publicEntries.length !== publicAssets.length) fail(`WXO provenance must define exactly ${publicAssets.length} public-route exports.`);
if (JSON.stringify(publicEntries.map(entry => entry.file).sort()) !== JSON.stringify(publicAssets)) {
  fail('WXO provenance public-route membership must exactly match images/wxo-canvas/public/.');
}
for (const entry of publicEntries) {
  const file = publicAsset(entry.file);
  if (!entry.source?.startsWith('owner-handoff/')) fail(`WXO provenance must retain an owner-handoff source for ${entry.file}.`);
  if (!entry.sourceFilename) fail(`WXO provenance must retain a source filename for ${entry.file}.`);
  if (!/^[a-f0-9]{64}$/i.test(entry.sha256 || '') || !/^[a-f0-9]{64}$/i.test(entry.sourceSha256 || '')) {
    fail(`WXO provenance must retain SHA-256 provenance for ${entry.file}.`);
  }
  if (fs.existsSync(file)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (actual !== entry.sha256) fail(`WXO public export bytes drifted from provenance: ${entry.file}`);
  }
}

const expectedPairs = [
  ['historical-canvas', 'current-workflow-light.png', 'current-workflow-dark.png'],
  ['node-key-states', '15-node-key-states-light.png', '15-node-key-states-dark.png'],
  ['node-size-variants', '16-node-size-variants-light.png', '16-node-size-variants-dark.png'],
  ['form-workflow', 'form-workflow-light.png', 'form-workflow-dark.png'],
  ['form-configuration', 'form-configuration-light.png', 'form-configuration-dark.png'],
  ['form-summary', 'form-summary-light.png', 'form-summary-dark.png'],
  ['current-workflow', 'current-workflow-light.png', 'current-workflow-dark.png'],
  ['v2-workflow', 'v2-workflow-light.png', 'v2-workflow-dark.png'],
  ['v2-agent-flow', 'v2-agent-flow-light.png', 'v2-agent-flow-dark.png'],
  ['flow-control-elements', '17-flow-control-elements-light.png', '17-flow-control-elements-dark.png'],
  ['flow-control-containers', '18-flow-control-containers-light.png', '18-flow-control-containers-dark.png'],
  ['application-example', '19-application-example-light.png', '19-application-example-dark.png'],
  ['workflow-anchors', '21-workflow-anchors-light.png', '21-workflow-anchors-dark.png'],
  ['close-workflow', 'current-workflow-light.png', 'current-workflow-dark.png'],
];
for (const [name, lightFile, darkFile] of expectedPairs) {
  const tag = main.match(new RegExp(`<img\\b[^>]*data-wxo-theme-image=["']${name}["'][^>]*>`, 'i'))?.[0] ?? '';
  requireText(tag, `data-theme-light-src="${publicAsset(lightFile)}"`, `${name} must declare its public light source.`);
  requireText(tag, `data-theme-dark-src="${publicAsset(darkFile)}"`, `${name} must declare its public dark source.`);
  requireText(tag, `src="${publicAsset(lightFile)}"`, `${name} must start from its public light source.`);
}
if (count(main, /data-wxo-theme-image=/g) !== expectedPairs.length) fail(`wxO must expose exactly ${expectedPairs.length} theme-aware public images.`);
if (/protected\/wxo|illustration-vignettes|wxo-home-thumbnail/i.test(main)) fail('Public wxO must not embed protected media, retired vignettes, or the Home thumbnail.');
requireText(main, 'href="document-processing.html"', 'Public wxO must retain the text-only locked Document Processing link.');
if (/<(?:img|picture)\b[^>]*document-processing/i.test(main)) fail('Public wxO must not embed a protected Document Processing thumbnail.');
requireText(main, 'id="canvas-evolution"', 'Canvas evolution must be an addressable semantic section.');
requireText(main, 'Canvas evolution', 'Canvas evolution must retain its approved narrative marker.');
requireText(main, 'A visual system that kept expanding.', 'Canvas evolution must retain its approved narrative heading.');
requireText(main, 'pilot-flow-evidence', 'Canvas evolution must use the reviewed flow-control narrative group.');
for (const token of ['pilot-theme-sequence', 'Current builder', 'V2 workflow evolution', 'V2 agent hierarchy']) requireText(main, token, `Canvas evolution must preserve the approved ordered state: ${token}`);
requireText(main, 'Form sequence', 'The existing Form flow must have a semantic sequence heading.');
requireText(main, '<ol class="pilot-flow-sequence pilot-flow-sequence--three pilot-form-sequence">', 'Form screens must retain a three-step ordered sequence.');

requireText(js, "document.documentElement.getAttribute('data-theme') === 'dark'", 'Theme source selection must read the site data-theme state.');
requireText(js, "new MutationObserver(syncThemeImages).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })", 'Theme image sources must resync after the site theme changes.');
requireText(js, 'image.src = nextSource', 'Theme image sources must update the rendered image deterministically.');
requireText(js, 'image.dataset.wxoThemeSource = nextSource', 'Theme image source state must avoid stale filename claims.');
for (const selector of ['.pilot-theme-sequence', '.pilot-theme-screen', '.pilot-form-sequence', "[data-theme='dark'] .wxo-public-pilot .pilot-theme-screen", '@media (max-width: 720px)']) {
  requireText(css, selector, `Missing scoped, responsive theme-sequence style: ${selector}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`PASS: public wxO theme sequence exports=${publicAssets.length} images=${expectedPairs.length}`);
