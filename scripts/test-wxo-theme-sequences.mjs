#!/usr/bin/env node
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
const assets = [
  'protected/wxo/assets/theme-sequences/current-workflow-light.png',
  'protected/wxo/assets/theme-sequences/current-workflow-dark.png',
  'protected/wxo/assets/theme-sequences/v2-workflow-light.png',
  'protected/wxo/assets/theme-sequences/v2-workflow-dark.png',
  'protected/wxo/assets/theme-sequences/v2-agent-flow-light.png',
  'protected/wxo/assets/theme-sequences/v2-agent-flow-dark.png',
  'protected/wxo/assets/theme-sequences/form-workflow-light.png',
  'protected/wxo/assets/theme-sequences/form-workflow-dark.png',
  'protected/wxo/assets/theme-sequences/form-configuration-light.png',
  'protected/wxo/assets/theme-sequences/form-configuration-dark.png',
  'protected/wxo/assets/theme-sequences/form-summary-light.png',
  'protected/wxo/assets/theme-sequences/form-summary-dark.png',
];

for (const path of [htmlPath, cssPath, jsPath, provenancePath, ...assets]) {
  if (!fs.existsSync(path)) fail(`Missing required WXO theme-sequence file: ${path}`);
}
if (process.exitCode) process.exit(1);

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
let provenance;
try {
  provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
} catch (error) {
  fail(`WXO theme-sequence provenance must be valid JSON: ${error.message}`);
  provenance = {};
}
const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';

const expectedPairs = [
  ['home-thumbnail', 'protected/wxo/images/current/01-skill-studio-main.png', 'images/wxo-canvas/wxo-home-thumbnail-dark.png'],
  ['illustration-vignettes', 'protected/wxo/assets/public-candidate/06-illustration-vignettes.png', 'protected/wxo/assets/public-candidate/20-illustration-vignettes-dark.png'],
  ['form-workflow', 'protected/wxo/assets/theme-sequences/form-workflow-light.png', 'protected/wxo/assets/theme-sequences/form-workflow-dark.png'],
  ['form-configuration', 'protected/wxo/assets/theme-sequences/form-configuration-light.png', 'protected/wxo/assets/theme-sequences/form-configuration-dark.png'],
  ['form-summary', 'protected/wxo/assets/theme-sequences/form-summary-light.png', 'protected/wxo/assets/theme-sequences/form-summary-dark.png'],
  ['current-workflow', 'protected/wxo/assets/theme-sequences/current-workflow-light.png', 'protected/wxo/assets/theme-sequences/current-workflow-dark.png'],
  ['v2-workflow', 'protected/wxo/assets/theme-sequences/v2-workflow-light.png', 'protected/wxo/assets/theme-sequences/v2-workflow-dark.png'],
  ['v2-agent-flow', 'protected/wxo/assets/theme-sequences/v2-agent-flow-light.png', 'protected/wxo/assets/theme-sequences/v2-agent-flow-dark.png'],
];

const ownerHandoffFilenames = new Map([
  ['current-workflow-light.png', 'v1 agentic workflow@2x.png'],
  ['current-workflow-dark.png', 'v1 agentic workflowDark@2x.png'],
  ['v2-workflow-light.png', 'v2 agentic workflow@2x.png'],
  ['v2-workflow-dark.png', 'v2 agentic workflowDark@2x.png'],
  ['v2-agent-flow-light.png', 'v2 agent flow@2x.png'],
  ['v2-agent-flow-dark.png', 'v2 agent flowDark@2x.png'],
  ['form-workflow-light.png', '1 — Workflow Canvas@2x-1.png'],
  ['form-workflow-dark.png', '1 — Workflow Canvas@2x.png'],
  ['form-configuration-light.png', '2 — Form Configuration@2x-1.png'],
  ['form-configuration-dark.png', '2 — Form Configuration@2x.png'],
  ['form-summary-light.png', '3 — Form Summary@2x-1.png'],
  ['form-summary-dark.png', '3 — Form Summary@2x.png'],
]);
const themeSequenceEntries = (provenance.assets || []).filter((entry) => entry.namespace === 'theme-sequences');
if (themeSequenceEntries.length !== ownerHandoffFilenames.size) {
  fail(`WXO provenance must define exactly ${ownerHandoffFilenames.size} theme-sequence owner exports.`);
}
for (const [file, sourceFilename] of ownerHandoffFilenames) {
  const entry = themeSequenceEntries.find((candidate) => candidate.file === file);
  if (!entry) {
    fail(`WXO provenance is missing theme-sequence entry: ${file}`);
    continue;
  }
  const derivativePath = `protected/wxo/assets/theme-sequences/${file}`;
  if (entry.source === derivativePath || entry.source?.includes('protected/wxo/assets/theme-sequences/')) {
    fail(`WXO provenance source must not self-reference its checked-in derivative: ${file}`);
  }
  if (entry.sourceFilename !== sourceFilename) {
    fail(`WXO provenance must retain the owner handoff filename for ${file}.`);
  }
  if (entry.source !== `owner-handoff/wxo-theme-sequences/${sourceFilename}`) {
    fail(`WXO provenance must use the portable owner-handoff identifier for ${file}.`);
  }
  if (!/^[a-f0-9]{64}$/i.test(entry.sourceSha256 || '')) {
    fail(`WXO provenance must retain a SHA-256 source hash for ${file}.`);
  }
}

for (const [name, light, dark] of expectedPairs) {
  const pattern = new RegExp(`<img\\b[^>]*data-wxo-theme-image=["']${name}["'][^>]*>`, 'i');
  const tag = main.match(pattern)?.[0] ?? '';
  requireText(tag, `data-theme-light-src="${light}"`, `${name} must declare its light source.`);
  requireText(tag, `data-theme-dark-src="${dark}"`, `${name} must declare its dark source.`);
  requireText(tag, `src="${light}"`, `${name} must start from its light source.`);
}

if (count(main, /data-wxo-theme-image=/g) !== 8) fail('The opening illustration, vignettes, Form sequence, and preserved Canvas evolution must expose eight theme-aware images.');
requireText(main, 'id="canvas-evolution"', 'Canvas evolution must be an addressable semantic section.');
requireText(main, 'Canvas evolution', 'Canvas evolution must retain its approved narrative marker.');
requireText(main, 'A visual system that kept expanding.', 'Canvas evolution must retain its approved narrative heading.');
requireText(main, 'pilot-flow-evidence', 'Canvas evolution must use the reviewed flow-control narrative group.');
for (const token of ['pilot-theme-sequence', 'Current builder', 'V2 workflow evolution', 'V2 agent hierarchy']) requireText(main, token, `Canvas evolution must preserve the approved ordered state: ${token}`);
requireText(main, 'Form sequence', 'The existing Form flow must have a semantic sequence heading.');
requireText(main, '<ol class="pilot-flow-sequence pilot-flow-sequence--three pilot-form-sequence">', 'Form screens must retain a three-step ordered sequence.');

requireText(js, "document.documentElement.getAttribute('data-theme') === 'dark'", 'Theme source selection must read the site data-theme state.');
requireText(js, "new MutationObserver(syncThemeImages).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })", 'Theme image sources must resync after the site theme changes.');
requireText(js, "image.src = nextSource", 'Theme image sources must update the rendered image deterministically.');
requireText(js, "image.dataset.wxoThemeSource = nextSource", 'Theme image source state must avoid stale filename claims.');

for (const selector of [
  '.pilot-theme-sequence',
  '.pilot-theme-screen',
  '.pilot-form-sequence',
  '[data-theme=\'dark\'] .wxo-public-pilot .pilot-theme-screen',
  '@media (max-width: 720px)',
]) requireText(css, selector, `Missing scoped, responsive theme-sequence style: ${selector}`);

if (process.exitCode) process.exit(process.exitCode);
console.log('PASS: WXO theme-aware narrative and Form sequence source contract');
