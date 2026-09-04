#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));
const fail = (message) => failures.push(message);
const count = (text, needle) => text.split(needle).length - 1;
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');

const manifest = readJson('data/projects.json');
const homeGenerator = read('scripts/generate-project-sections.mjs');
const home = read('index.html');
const sharedJs = read('js/main.js');
const sharedCss = read('css/style.css');
const wxo = read('wxo-canvas.html');
const wxoCss = read('css/wxo-public-candidate.css');
const wxoJs = read('js/wxo-public-candidate.js');
const wxoLedger = readJson('data/wxo-canvas-public-provenance.json');
const doc = read('document-processing.html');
const docLedger = readJson('data/document-processing-current-provenance.json');
const policy = readJson('data/content-export-policy.json');

const wxoProject = manifest.projects.find((project) => project.slug === 'wxo-canvas');
if (!wxoProject) fail('projects manifest lost wxO');
if (wxoProject?.homepageRelated?.label !== 'Document Processing') {
  fail('Home secondary link must use the quieter Document Processing label');
}
if (wxoProject?.images?.[0]?.themeDarkSrc !== 'images/wxo-canvas/wxo-home-thumbnail-dark.png') {
  fail('wxO Home thumbnail needs the approved Dark-theme source in the manifest');
}
for (const marker of ['featured-card-actions', 'featured-item-main-link', 'featured-item-related']) {
  if (!homeGenerator.includes(marker)) fail(`Home generator missing accessible in-card action marker: ${marker}`);
  if (!home.includes(marker)) fail(`generated Home missing in-card action marker: ${marker}`);
}
const homePrimaryBody = home.match(/<a\b[^>]*class="[^"]*featured-item-main-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || '';
if (/<a\b/i.test(homePrimaryBody)) {
  fail('Home wxO actions must not nest the secondary anchor inside the primary anchor');
}
if (!sharedJs.includes('[data-home-theme-image]') || !sharedJs.includes('themeDarkSrc') || !sharedJs.includes('themeLightSrc')) {
  fail('shared runtime must synchronize the wxO Home thumbnail with the selected theme');
}
if (!sharedCss.includes('.featured-card-actions') || !sharedCss.includes('.featured-item-related')) {
  fail('Home actions need a shared visual hierarchy contract');
}

for (const marker of ['pilot-canvas-media-stack', 'pilot-history-canvas', 'pilot-section-heading--stacked', 'pilot-exploration-grid']) {
  if (!wxo.includes(marker)) fail(`wxO composition missing ${marker}`);
}
for (const source of [
  'protected/wxo/assets/theme-sequences/current-workflow-light.png',
  'protected/wxo/assets/theme-sequences/current-workflow-dark.png',
]) {
  if (!wxo.includes(source)) fail(`Historical Canvas missing theme source ${source}`);
}
if (wxo.includes('protected/wxo/assets/public-candidate/02-component-showcase.png')) {
  fail('retired enterprise component showcase must not remain in active wxO markup');
}

const explorationPairs = [
  ['15-node-key-states-light.png', '15-node-key-states-dark.png'],
  ['16-node-size-variants-light.png', '16-node-size-variants-dark.png'],
  ['17-flow-control-elements-light.png', '17-flow-control-elements-dark.png'],
  ['18-flow-control-containers-light.png', '18-flow-control-containers-dark.png'],
  ['19-application-example-light.png', '19-application-example-dark.png'],
  ['21-workflow-anchors-light.png', '21-workflow-anchors-dark.png'],
];
if (count(wxo, 'data-wxo-exploration-panel') !== explorationPairs.length) {
  fail(`wxO must render ${explorationPairs.length} newer exploration panels`);
}
for (const [light, dark] of explorationPairs) {
  const lightPath = `protected/wxo/assets/public-candidate/${light}`;
  const darkPath = `protected/wxo/assets/public-candidate/${dark}`;
  if (!fs.existsSync(path.join(root, lightPath))) fail(`missing controlled Light exploration export ${lightPath}`);
  if (!fs.existsSync(path.join(root, darkPath))) fail(`missing controlled Dark exploration export ${darkPath}`);
  if (!wxo.includes(lightPath) || !wxo.includes(darkPath)) fail(`wxO missing Light/Dark pair ${light} / ${dark}`);
}
for (const cssMarker of [
  '.pilot-canvas-media-stack',
  '.pilot-section-heading--stacked',
  '.pilot-exploration-grid',
  'padding-inline: clamp(',
]) {
  if (!wxoCss.includes(cssMarker)) fail(`wxO CSS missing layout marker ${cssMarker}`);
}
if (!wxoJs.includes('[data-wxo-theme-image]')) fail('wxO theme-image runtime was removed');

const ledgerAssets = wxoLedger.assets || [];
for (const [light, dark] of explorationPairs) {
  for (const file of [light, dark]) {
    const record = ledgerAssets.find((item) => item.file === file && (item.namespace || 'public-candidate') === 'public-candidate');
    if (!record) {
      fail(`wxO provenance missing ${file}`);
      continue;
    }
    const assetPath = `protected/wxo/assets/public-candidate/${file}`;
    if (fs.existsSync(path.join(root, assetPath)) && record.sha256 !== sha256(assetPath)) {
      fail(`wxO provenance hash mismatch for ${file}`);
    }
    if (record.route !== 'wxo-canvas.html') fail(`active exploration record ${file} needs wxo-canvas.html route`);
  }
}
for (const file of ['current-workflow-light.png', 'current-workflow-dark.png']) {
  const record = ledgerAssets.find((item) => item.file === file && item.namespace === 'theme-sequences');
  if (!record || record.route !== 'wxo-canvas.html') fail(`Historical Canvas theme record ${file} must be active on wxo-canvas.html`);
}
const retiredHistory = ledgerAssets.find((item) => item.file === '01-released-canvas.png');
if (!retiredHistory || retiredHistory.route !== 'source-only') fail('retired one-theme Historical Canvas derivative must be source-only');

const activeProtected = new Set((policy.protectedPages || []).filter((entry) => !entry.provisional).map((entry) => entry.source));
for (const page of ['wxo-canvas.html', 'document-processing.html']) {
  if (!activeProtected.has(page)) fail(`${page} must remain in the active protected-route policy`);
}
const currentDocImages = [...doc.matchAll(/<img\b[^>]*src="(protected\/wxo\/assets\/document-processing\/current\/[^"]+)"/g)].map((match) => match[1]);
if (currentDocImages.length !== 8) fail(`Document Processing must render eight unaltered owner-export evidence screens, found ${currentDocImages.length}`);
if (currentDocImages.some((source) => source.includes('-sanitized'))) {
  fail('Document Processing current screens still reference identity-neutralized derivatives');
}
if (!/^None on the active eight-image set\./.test(docLedger.sanitation || '')) {
  fail('Document Processing provenance must state that active evidence has no identity hiding');
}
for (const item of docLedger.assets || []) {
  if ((item.operations || []).some((operation) => /neutraliz|obscur|blur|redact|saniti/i.test(operation))) {
    fail(`Document Processing provenance still records identity hiding for ${item.file}`);
  }
  if (item.route !== 'document-processing.html' || item.sourceSha256 !== item.outputSha256 || item.outputSha256 !== sha256(item.file)) {
    fail(`Document Processing active provenance must bind a byte-identical owner export to the protected route: ${item.file}`);
  }
}
if (/doc-motion-section|doc-pro-(?:poster|evaluation-loop)-sanitized/.test(doc)) {
  fail('Document Processing must not render the retired identity-neutralized motion derivative');
}

if (failures.length) {
  console.error('MANUAL REVIEW FOLLOW-UPS: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`MANUAL REVIEW FOLLOW-UPS: PASS explorationPairs=${explorationPairs.length} docScreens=${currentDocImages.length} protectedRoutes=2`);
