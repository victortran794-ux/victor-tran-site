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
if (!wxoProject || wxoProject.protected || wxoProject.noindex || wxoProject.sitemap !== true || wxoProject.url !== 'wxo-canvas.html') {
  fail('wxO manifest must describe the approved public route.');
}
if (wxoProject?.homepageRelated) fail('Home wxO card must not expose a separate Document Processing link');
if (wxoProject?.homepageBonus !== 'There’s a bonus one here') fail('Home wxO card must carry the approved non-link bonus note');
for (const marker of ['featured-card-actions', 'featured-practice', 'featured-item-bonus']) {
  if (!homeGenerator.includes(marker) || !home.includes(marker)) fail(`Home missing approved wxO action marker: ${marker}`);
}
if (home.includes('home-practice-proof') || home.includes('featured-item-related') || homeGenerator.includes('shape-cue')) {
  fail('Home must retain the approved single public wxO action treatment.');
}
if (!/href="wxo-canvas\.html"/.test(home) || /wxo-canvas\.html\?lock=1/.test(home)) fail('Home must link directly to public wxO without a lock query.');
if (!sharedJs.includes('[data-home-theme-image]') || !sharedCss.includes('.featured-item-bonus')) fail('Home wxO theme and bonus treatment must remain wired.');

for (const marker of ['pilot-canvas-media-stack', 'pilot-history-canvas', 'pilot-section-heading--stacked', 'pilot-exploration-grid--clean', 'pilot-close-media']) {
  if (!wxo.includes(marker)) fail(`wxO composition missing ${marker}`);
}
if (wxo.includes('pilot-main-illustration') || wxo.includes('pilot-vignettes') || wxoCss.includes('.pilot-flow-evidence li:nth-child(even)')) {
  fail('wxO must retain the cleaned public composition.');
}
if (!wxo.includes('data-wxo-theme-image="close-workflow"') || !wxoJs.includes('[data-wxo-theme-image]')) fail('wxO must retain its theme-aware public evidence behavior.');
if (/protected\/wxo\//.test(wxo)) fail('Public wxO must not embed protected images or guarded route resources.');
if (!wxo.includes('href="document-processing.html?lock=1"') || /pilot-bridge-thumbnail|document-processing\/current/.test(wxo)) {
  fail('Public wxO must use a textual locked Document Processing handoff only.');
}

const publicAssets = (wxoLedger.assets || []).filter((item) => item.route === 'wxo-canvas.html');
if (publicAssets.length !== 24) fail(`wxO provenance must contain 24 public-route exports, found ${publicAssets.length}`);
for (const item of publicAssets) {
  const assetPath = `images/wxo-canvas/public/${item.file}`;
  if (!fs.existsSync(path.join(root, assetPath)) || item.sha256 !== sha256(assetPath) || !wxo.includes(assetPath)) {
    fail(`Public wxO asset/provenance mismatch for ${item.file}`);
  }
}
if ((wxoLedger.assets || []).filter((item) => item.route === 'source-only').length !== 18) fail('wxO must retain eighteen source-only historical derivatives.');
if ((policy.protectedPages || []).some((entry) => entry.source === 'wxo-canvas.html')) fail('Public wxO must be removed from the protected export policy.');
if (!(policy.protectedPages || []).some((entry) => entry.source === 'document-processing.html')) fail('Document Processing must remain in the protected export policy.');

const currentDocImages = [...new Set([...doc.matchAll(/<img\b[^>]*src="(protected\/wxo\/assets\/document-processing\/current\/[^"]+)"/g)].map((match) => match[1]))];
const expectedDocImages = (docLedger.assets || []).map((item) => item.file).sort();
if (currentDocImages.length !== 8 || JSON.stringify(currentDocImages.slice().sort()) !== JSON.stringify(expectedDocImages)) {
  fail(`Document Processing must render exactly the eight declared owner-export screens, found ${currentDocImages.length}`);
}
for (const item of docLedger.assets || []) {
  if (item.route !== 'document-processing.html' || item.sourceSha256 !== item.outputSha256 ||
      !item.operations?.includes('None; repository asset is byte-identical to the owner export') ||
      !fs.existsSync(path.join(root, item.file)) || item.outputSha256 !== sha256(item.file)) {
    fail(`Document Processing provenance must bind a byte-identical protected owner export: ${item.file}`);
  }
}
const classify = (docLedger.assets || []).find((item) => item.file.endsWith('/classify-setup.png'));
if (classify?.additionalRoutes) fail('Classify provenance must not allow the obsolete public wxO image bridge.');

if (failures.length) {
  console.error('MANUAL REVIEW FOLLOW-UPS: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`MANUAL REVIEW FOLLOW-UPS: PASS publicAssets=${publicAssets.length} docScreens=${currentDocImages.length} protectedRoutes=1`);
